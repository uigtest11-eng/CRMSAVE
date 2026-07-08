/**
 * Vanguard Email → SMS + Slack Notification Service
 * Monitors contact@vigagency.com for new emails.
 * Sends SMS to +13302417570 via ClickSend for every new message.
 * COI emails: also posts rich notification + attachments to Slack #coi-requests.
 * Smart COI detection: identifies agent + policy/lead by sender email or body keywords.
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const axios = require('axios');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// ── Config ────────────────────────────────────────────────────────────────────
const CONFIG = {
    imap: {
        host: 'imap.secureserver.net',
        port: 993,
        secure: true,
        auth: { user: 'contact@vigagency.com', pass: process.env.GODADDY_VIG_PASSWORD || '' },
        logger: false,
        tls: { rejectUnauthorized: false }
    },
    clicksend: {
        username: 'grant.corp2006@gmail.com',
        apiKey:   process.env.CLICKSEND_API_KEY || '',
        toPhone:  '+13302417570'
    },
    db: path.join(__dirname, '../vanguard.db')
};

// COI keywords (matched against subject + body, case-insensitive)
const COI_KEYWORDS = [
    'certificate of insurance',
    'cert of insurance',
    'cert of ins',
    ' coi ',
    'coi:',
    'coi request',
    'insurance certificate',
    'acord 25',
    'acord25'
];

// ── Database helpers ──────────────────────────────────────────────────────────

/** Extract all email addresses mentioned anywhere in a block of text. */
function extractEmailsFromText(text) {
    const matches = (text || '').match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || [];
    return [...new Set(matches.map(e => e.toLowerCase().trim()))];
}

/**
 * Look up a policy/lead by:
 *  1. Sender email exact match against leads
 *  2. Any email address found inside the body matched against leads
 *  3. Body text search for DOT#, policy#, business name in policies
 * Returns { agent, policyNumber, businessName, dotNumber } or null.
 */
function lookupPolicy(senderEmail, bodyText) {
    return new Promise(resolve => {
        const db = new sqlite3.Database(CONFIG.db, sqlite3.OPEN_READONLY);
        const lower       = bodyText.toLowerCase();
        const senderLower = (senderEmail || '').toLowerCase().trim();

        // All emails to try: sender + any email found in the body
        const bodyEmails  = extractEmailsFromText(bodyText);
        const allEmails   = [...new Set([senderLower, ...bodyEmails].filter(Boolean))];

        let leads = [], policies = [];
        let done  = 0;

        const finish = () => {
            if (++done < 2) return;
            db.close();

            // 1. Try every email candidate against leads
            for (const email of allEmails) {
                for (const lead of leads) {
                    // Check all common email field names
                    const leadEmail = (
                        lead.email || lead.emailAddress || lead.Email ||
                        lead['email address'] || lead['Email Address'] || ''
                    ).toLowerCase().trim();
                    if (leadEmail && leadEmail === email) {
                        // Found lead — augment with policy number + clientId from policies table
                        const leadDot  = (lead.dotNumber || lead.dot || '').toString().trim().toLowerCase();
                        let policyNumber = lead.policyNumber || lead.insurancePolicy || lead.policy || null;
                        let clientId     = null;

                        for (const p of policies) {
                            const pEmail = (p.contact?.Email || p.contact?.['Email Address'] || p.contact?.email || '').toLowerCase().trim();
                            const pDot   = (p.dotNumber || '').toString().trim().toLowerCase();
                            if ((email && pEmail && pEmail === email) ||
                                (leadDot && pDot && pDot === leadDot)) {
                                policyNumber = p.policyNumber || policyNumber;
                                clientId     = p.clientId     || null;
                                break;
                            }
                        }

                        return resolve({
                            agent:        capitalise(lead.assignedTo),
                            policyNumber: policyNumber,
                            businessName: lead.businessName || lead['Business Name'] || lead.company || lead.name || null,
                            dotNumber:    lead.dotNumber || lead.dot || null,
                            clientId:     clientId
                        });
                    }
                }
            }

            // 2. Search policies by body text (DOT#, policy#, business name)
            let best = null;
            for (const p of policies) {
                const bizName   = (p.insured?.['Name/Business Name'] || p.insured?.['Business Name'] || p.businessName || '').toLowerCase().trim();
                const dotNum    = (p.dotNumber || '').toString().trim();
                const policyNum = (p.policyNumber || '').toString().trim();
                const agent     = (p.agent || '').toLowerCase();

                if (!bizName && !dotNum && !policyNum) continue;

                let score = 0;
                if (dotNum    && dotNum.length > 3    && lower.includes(dotNum))    score += 10;
                if (policyNum && policyNum.length > 4 && lower.includes(policyNum)) score += 8;
                if (bizName   && bizName.length > 3   && lower.includes(bizName))   score += 6;

                // partial business name word match
                if (score === 0 && bizName) {
                    const words = bizName.split(/\s+/).filter(w => w.length > 4);
                    const hits  = words.filter(w => lower.includes(w));
                    if (hits.length >= 2)                              score += 3;
                    else if (hits.length === 1 && words.length === 1)  score += 2;
                }

                if (score > 0 && (!best || score > best.score)) {
                    best = {
                        score,
                        agent:        capitalise(agent),
                        policyNumber: p.policyNumber || null,
                        businessName: p.insured?.['Name/Business Name'] || p.insured?.['Business Name'] || p.businessName || null,
                        dotNumber:    p.dotNumber || null,
                        clientId:     p.clientId  || null
                    };
                }
            }
            resolve(best);
        };

        // Load leads
        db.all('SELECT data FROM leads', [], (err, rows) => {
            if (!err && rows) {
                rows.forEach(r => {
                    try { leads.push(JSON.parse(r.data || '{}')); } catch {}
                });
            }
            finish();
        });

        // Load policies (flatten nested policies[] arrays)
        db.all('SELECT data FROM policies', [], (err, rows) => {
            if (!err && rows) {
                rows.forEach(r => {
                    try {
                        const d = JSON.parse(r.data || '{}');
                        if (Array.isArray(d.policies)) {
                            d.policies.forEach(p => policies.push(p));
                        } else if (d.policyNumber || d.agent) {
                            policies.push(d);
                        }
                    } catch {}
                });
            }
            finish();
        });
    });
}

function capitalise(str) {
    if (!str) return null;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ── Slack COI poster ──────────────────────────────────────────────────────────

/**
 * Upload a file to Slack using multipart/form-data (no form-data package needed).
 * Posts as a reply in the given thread if threadTs is provided.
 * Returns true on success.
 */
async function uploadFileToSlack(token, channel, filename, content, contentType, threadTs) {
    const MAX_BYTES = 5 * 1024 * 1024; // 5 MB cap
    if (!content || content.length > MAX_BYTES) return false;

    const boundary = 'VanguardCOI' + Date.now();
    const CRLF = '\r\n';

    const parts = [
        Buffer.from(`--${boundary}${CRLF}Content-Disposition: form-data; name="channels"${CRLF}${CRLF}${channel}${CRLF}`),
        Buffer.from(`--${boundary}${CRLF}Content-Disposition: form-data; name="filename"${CRLF}${CRLF}${filename}${CRLF}`),
    ];
    if (threadTs) {
        parts.push(Buffer.from(`--${boundary}${CRLF}Content-Disposition: form-data; name="thread_ts"${CRLF}${CRLF}${threadTs}${CRLF}`));
    }
    parts.push(
        Buffer.from(`--${boundary}${CRLF}Content-Disposition: form-data; name="file"; filename="${filename}"${CRLF}Content-Type: ${contentType || 'application/octet-stream'}${CRLF}${CRLF}`),
        content,
        Buffer.from(`${CRLF}--${boundary}--${CRLF}`)
    );
    const body = Buffer.concat(parts);

    try {
        const resp = await axios.post('https://slack.com/api/files.upload', body, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': body.length
            },
            maxBodyLength: Infinity
        });
        if (resp.data.ok) {
            console.log(`[COI Slack] ✅ Uploaded ${filename}`);
            return true;
        } else {
            console.error(`[COI Slack] Upload error for ${filename}:`, resp.data.error);
            return false;
        }
    } catch (e) {
        console.error(`[COI Slack] Upload exception for ${filename}:`, e.message);
        return false;
    }
}

const CRM_BASE = 'https://162-220-14-239.nip.io';

// Resolve a CRM agent name → Slack @mention string (e.g. "<@U012AB3CD>")
function resolveSlackMention(agentName) {
    if (!agentName) return Promise.resolve(null);
    const lower = agentName.toLowerCase().trim();
    return new Promise((resolve) => {
        const db = new sqlite3.Database(CONFIG.db, sqlite3.OPEN_READONLY);
        db.get(
            'SELECT slack_user_id FROM slack_user_map WHERE crm_username = ?',
            [lower],
            (err, row) => {
                db.close();
                resolve((err || !row) ? null : `<@${row.slack_user_id}>`);
            }
        );
    });
}

// Generate a single-use magic link token stored in the DB (72hr expiry)
// Returns the full button URL or falls back to login.html redirect
function createMagicLink(redirectPath) {
    return new Promise((resolve) => {
        const token = crypto.randomBytes(32).toString('hex');
        const db = new sqlite3.Database(CONFIG.db);
        db.run(
            `CREATE TABLE IF NOT EXISTS magic_link_tokens (
                token TEXT PRIMARY KEY, redirect TEXT NOT NULL,
                expires_at DATETIME NOT NULL, used_at DATETIME
            )`,
            () => {
                db.run(
                    `INSERT INTO magic_link_tokens (token, redirect, expires_at)
                     VALUES (?, ?, datetime('now', '+72 hours'))`,
                    [token, redirectPath],
                    (err) => {
                        db.close();
                        if (err) {
                            resolve(`${CRM_BASE}/login.html?redirect=${encodeURIComponent(redirectPath)}`);
                        } else {
                            resolve(`${CRM_BASE}/api/auth/magic-link?t=${token}`);
                        }
                    }
                );
            }
        );
    });
}

/**
 * Post a COI request notification to Slack #coi-requests with Block Kit card,
 * then upload any image/PDF attachments into the thread.
 */
async function postCOIToSlack(fromEmail, subject, bodySnippet, policy, coiAttachments) {
    const token   = process.env.SLACK_BOT_TOKEN;
    const channel = process.env.SLACK_COI_CHANNEL || 'coi-requests';
    if (!token) return;

    const bizName   = policy?.businessName || '—';
    const agent     = policy?.agent        || '—';
    const polNum    = policy?.policyNumber || '—';
    const dotNum    = policy?.dotNumber    || '—';
    const clientId  = policy?.clientId     || null;
    const matched   = policy
        ? `✅ Matched — ${bizName}`
        : '⚠️ No policy match found';
    const attNote   = coiAttachments.length > 0
        ? `📎 ${coiAttachments.length} attachment(s): ${coiAttachments.map(a => a.filename || 'file').join(', ')}`
        : '📭 No attachments';

    // Resolve agent's Slack @mention
    const mention = await resolveSlackMention(agent);

    // Clean and trim body — show up to 800 chars
    const bodyClean = (bodySnippet || '')
        .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
        .substring(0, 800);
    const bodyDisplay = bodyClean
        ? bodyClean + (bodySnippet.trim().length > 800 ? '…' : '')
        : null;

    // Deep link to CRM policy profile via magic link (no login required)
    const clientUrl = polNum && polNum !== '—'
        ? await createMagicLink(`/#policy/${encodeURIComponent(polNum)}`)
        : null;
    // Note: auth-routes.js extracts polNum from #policy/X and stores in sessionStorage.
    // fix-policy-display-limit.js picks it up after policies load and opens the profile.

    const agentField = mention ? `${agent} ${mention}` : agent;

    const blocks = [
        {
            type: 'header',
            text: { type: 'plain_text', text: `📋 COI Request — ${bizName}`, emoji: true }
        },
        {
            type: 'section',
            fields: [
                { type: 'mrkdwn', text: `*From:*\n${fromEmail || '—'}` },
                { type: 'mrkdwn', text: `*Agent:*\n${agentField}` },
                { type: 'mrkdwn', text: `*Policy #:*\n${polNum}` },
                { type: 'mrkdwn', text: `*DOT #:*\n${dotNum}` }
            ]
        },
        {
            type: 'section',
            text: { type: 'mrkdwn', text: `*Subject:* ${subject}\n*Match:* ${matched}` }
        },
        ...(bodyDisplay ? [{
            type: 'section',
            text: { type: 'mrkdwn', text: `*Message:*\n\`\`\`${bodyDisplay}\`\`\`` }
        }] : []),
        { type: 'context', elements: [{ type: 'mrkdwn', text: attNote }] },
        ...(clientUrl ? [{
            type: 'actions',
            elements: [{
                type: 'button',
                text: { type: 'plain_text', text: '🔗 View Policy', emoji: true },
                url: clientUrl,
                style: 'primary'
            }]
        }] : []),
        { type: 'divider' }
    ];

    // Fallback plain text for notifications
    const text = `COI Request from ${fromEmail} — ${bizName} | Agent: ${agentField} | Policy: ${polNum}`;

    try {
        const resp = await axios.post('https://slack.com/api/chat.postMessage', {
            channel, text, blocks, unfurl_links: false
        }, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        });

        if (!resp.data.ok) {
            console.error('[COI Slack] Post error:', resp.data.error);
            return;
        }

        console.log(`[COI Slack] ✅ Posted to #${channel}`);
        const threadTs = resp.data.ts;

        // Upload attachments (images + PDFs) into the thread
        for (const att of coiAttachments) {
            if (!att.content || !Buffer.isBuffer(att.content)) continue;
            await uploadFileToSlack(
                token, channel,
                att.filename || 'attachment',
                att.content,
                att.contentType || 'application/octet-stream',
                threadTs
            );
        }
    } catch (e) {
        console.error('[COI Slack] Error:', e.message);
    }
}

// ── SMS sender ────────────────────────────────────────────────────────────────
async function sendSMS(message) {
    const body = message.length > 160 ? message.substring(0, 157) + '...' : message;
    console.log(`📱 SMS: ${body}`);
    try {
        const res = await axios.post(
            'https://rest.clicksend.com/v3/sms/send',
            { messages: [{ to: CONFIG.clicksend.toPhone, body, source: 'vanguard-crm' }] },
            { auth: { username: CONFIG.clicksend.username, password: CONFIG.clicksend.apiKey } }
        );
        console.log(`✅ Sent — status: ${res.data?.data?.messages?.[0]?.status}`);
    } catch (err) {
        console.error('❌ SMS error:', err.response?.data || err.message);
    }
}

/** Strip HTML tags and decode common entities to plain text. */
function htmlToText(html) {
    if (!html) return '';
    return html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\s{2,}/g, ' ')
        .trim();
}

// ── Email processor ───────────────────────────────────────────────────────────
async function processEmail(parsed) {
    const subject    = parsed.subject || '(no subject)';
    const fromAddr   = parsed.from?.text || '';
    const fromEmail  = parsed.from?.value?.[0]?.address || '';
    // Use plain text if available, fall back to stripping HTML
    const plainText  = parsed.text || htmlToText(parsed.html || '');
    const bodyText   = plainText + ' ' + subject;
    const lower      = bodyText.toLowerCase();

    // Extract image and PDF attachments
    const coiAttachments = (parsed.attachments || []).filter(att => {
        const ct = (att.contentType || '').toLowerCase();
        const fn = (att.filename   || '').toLowerCase();
        return ct.startsWith('image/') || ct === 'application/pdf'
            || fn.endsWith('.jpg') || fn.endsWith('.jpeg')
            || fn.endsWith('.png') || fn.endsWith('.pdf')
            || fn.endsWith('.tiff')|| fn.endsWith('.tif');
    });

    // COI if keywords present in text, OR subject/filename contains standalone word "coi"
    const attNames = coiAttachments.map(a => (a.filename || '').toLowerCase()).join(' ');
    const COI_WORD = /\bcoi\b/i;
    const isCOI = COI_KEYWORDS.some(kw => lower.includes(kw))
               || COI_WORD.test(subject)
               || COI_KEYWORDS.some(kw => attNames.includes(kw.trim()))
               || COI_WORD.test(attNames);

    console.log(`\n📧 New email | COI:${isCOI} | Attachments:${coiAttachments.length} | From:${fromEmail} | Subject:${subject}`);

    if (isCOI) {
        const policy = await lookupPolicy(fromEmail, bodyText);

        // ── SMS (existing) ───────────────────────────────────────────────────
        if (policy) {
            const label = policy.agent ? `${policy.agent} COI` : 'COI';
            const biz   = policy.businessName ? ` - ${policy.businessName}` : '';
            const pol   = policy.policyNumber  ? ` | Pol#${policy.policyNumber}` : '';
            const dot   = policy.dotNumber     ? ` | DOT:${policy.dotNumber}`    : '';
            const from  = fromEmail            ? ` | ${fromEmail}`              : '';
            await sendSMS(`${label}:${biz}${pol}${dot}${from}`);
        } else {
            const short = subject.length > 70 ? subject.substring(0, 67) + '...' : subject;
            const from  = fromEmail ? ` | ${fromEmail}` : '';
            await sendSMS(`COI Request: ${short}${from}`);
        }

        // ── Slack #coi-requests (new) ────────────────────────────────────────
        await postCOIToSlack(fromEmail, subject, plainText, policy, coiAttachments);

    } else {
        const short = subject.length > 90 ? subject.substring(0, 87) + '...' : subject;
        const from  = fromEmail ? ` | ${fromEmail}` : (fromAddr ? ` | ${fromAddr}` : '');
        await sendSMS(`New email: ${short}${from}`);
    }
}

// ── IMAP watcher ─────────────────────────────────────────────────────────────
const processedUIDs = new Set();

async function fetchAndProcess(client, uid) {
    if (processedUIDs.has(uid)) return;
    processedUIDs.add(uid);
    try {
        const msg = await client.fetchOne(String(uid), { source: true }, { uid: true });
        if (!msg?.source) return;
        const parsed = await simpleParser(msg.source);
        await processEmail(parsed);
    } catch (e) {
        console.error(`Fetch/parse error for UID ${uid}:`, e.message);
    }
}

async function poll() {
    const client = new ImapFlow(CONFIG.imap);
    try {
        await client.connect();
        const lock = await client.getMailboxLock('INBOX');
        try {
            const unseenUids = await client.search({ seen: false }, { uid: true });

            // First run: skip all existing unread, only notify going forward
            if (processedUIDs.size === 0 && unseenUids.length > 0) {
                unseenUids.forEach(uid => processedUIDs.add(uid));
                console.log(`⏭️  First run — skipped ${unseenUids.length} existing unread. Now watching for new ones...`);
                return;
            }

            const newUids = unseenUids.filter(uid => !processedUIDs.has(uid));
            if (newUids.length > 0) {
                console.log(`🔔 ${newUids.length} new message(s) — UIDs: ${newUids.join(', ')}`);
                for (const uid of newUids) {
                    await fetchAndProcess(client, uid);
                }
            }
        } finally {
            lock.release();
        }
        await client.logout();
    } catch (err) {
        console.error('❌ Poll error:', err.message);
        try { await client.logout(); } catch {}
    }
}

async function watchInbox() {
    console.log('🔄 Polling every 20 seconds...');
    await poll(); // immediate first run to mark existing unread
    setInterval(poll, 20000);
}

// ── Start ─────────────────────────────────────────────────────────────────────
console.log('🚀 Vanguard Email→SMS Service starting...');
console.log(`   Monitoring: contact@vigagency.com`);
console.log(`   Notifying:  ${CONFIG.clicksend.toPhone}`);
watchInbox().catch(console.error);
