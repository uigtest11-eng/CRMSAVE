const express = require('express');
const router = express.Router();
const OutlookService = require('./outlook-service');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const db = new sqlite3.Database('/var/www/vanguard/vanguard.db');

// Ensure coi_emails has dismissed and is_unread columns (safe to run each startup)
db.run(`ALTER TABLE coi_emails ADD COLUMN dismissed INTEGER DEFAULT 0`, () => {});
db.run(`ALTER TABLE coi_emails ADD COLUMN is_unread INTEGER DEFAULT 0`, () => {});

// Initialize Outlook Service
const outlookService = new OutlookService();

// Store credentials
let outlookCredentials = null;

// Load stored credentials on startup
async function loadStoredCredentials() {
    return new Promise((resolve) => {
        db.get('SELECT value FROM settings WHERE key = ?', ['outlook_tokens'], (err, row) => {
            if (!err && row) {
                try {
                    outlookCredentials = JSON.parse(row.value);
                    outlookService.initialize(outlookCredentials)
                        .then(() => {
                            console.log('Outlook service initialized with stored credentials');
                            resolve(true);
                        })
                        .catch(err => {
                            console.error('Failed to initialize Outlook:', err);
                            resolve(false);
                        });
                } catch (parseErr) {
                    console.error('Error parsing Outlook credentials:', parseErr);
                    resolve(false);
                }
            } else {
                console.log('No stored Outlook credentials found');
                resolve(false);
            }
        });
    });
}

// Initialize on startup
loadStoredCredentials();

/**
 * Get emails - Using Titan/Outlook configuration
 * GET /api/outlook/emails
 */
router.get('/emails', async (req, res) => {
    let responseSent = false;

    try {
        // Set a timeout for the entire operation
        const timeout = setTimeout(() => {
            if (!responseSent) {
                responseSent = true;
                console.log('Email fetch timed out, returning empty inbox');
                const acct = req.query.account === 'uig' ? 'contact@uigagency.com' : 'contact@vigagency.com';
                res.json({
                    success: true,
                    emails: [],
                    account: acct,
                    notice: 'Email server connection timed out. Using offline mode.'
                });
            }
        }, 10000); // 10 second timeout

        // For now, return Titan emails using IMAP
        const Imap = require('imap');
        const { simpleParser } = require('mailparser');

        // Support both VIG and UIG accounts
        const account = req.query.account || 'vig';
        const isUIG = account === 'uig';
        const imapUser = isUIG ? 'contact@uigagency.com' : (process.env.OUTLOOK_EMAIL || 'contact@vigagency.com');
        const imapPass = isUIG ? process.env.GODADDY_UIG_PASSWORD : (process.env.OUTLOOK_PASSWORD || process.env.GODADDY_VIG_PASSWORD);

        const imap = new Imap({
            user: imapUser,
            password: imapPass,
            host: process.env.OUTLOOK_IMAP_HOST || 'imap.secureserver.net',
            port: parseInt(process.env.OUTLOOK_IMAP_PORT) || 993,
            tls: true,
            tlsOptions: {
                rejectUnauthorized: false,
                servername: process.env.OUTLOOK_IMAP_HOST || 'imap.secureserver.net'
            },
            connTimeout: 10000, // 10 second connection timeout
            authTimeout: 10000  // 10 second auth timeout
        });

        const emails = [];

        imap.once('ready', () => {
            clearTimeout(timeout);
            imap.openBox('INBOX', false, (err, box) => {
                if (err) {
                    console.error('Error opening inbox:', err);
                    if (!responseSent) {
                        responseSent = true;
                        return res.status(500).json({ success: false, error: err.message });
                    }
                    return;
                }

                // Check if inbox has emails
                console.log(`Inbox opened: ${box.name}, Total messages: ${box.messages.total}`);

                if (!box.messages.total || box.messages.total === 0) {
                    imap.end();
                    if (!responseSent) {
                        responseSent = true;
                        return res.json({
                            success: true,
                            emails: [],
                            account: imapUser,
                            notice: 'Inbox is empty'
                        });
                    }
                    return;
                }

                // Fetch last 20 emails - use simple fetch
                const numToFetch = Math.min(20, box.messages.total);
                const startSeq = Math.max(1, box.messages.total - numToFetch + 1);
                const fetchRange = startSeq + ':*';
                console.log(`Fetching emails from range: ${fetchRange}`);

                const f = imap.seq.fetch(fetchRange, {
                    bodies: 'TEXT',
                    envelope: true,
                    struct: true
                });

                f.on('message', (msg, seqno) => {
                    let emailData = {
                        id: seqno.toString(),
                        from: '',
                        to: '',
                        subject: '',
                        date: new Date(),
                        snippet: '',
                        body: ''
                    };

                    msg.once('attributes', (attrs) => {
                        const envelope = attrs.envelope;
                        if (envelope) {
                            emailData.from = envelope.from ? envelope.from[0].mailbox + '@' + envelope.from[0].host : '';
                            emailData.to = envelope.to ? envelope.to[0].mailbox + '@' + envelope.to[0].host : '';
                            emailData.subject = envelope.subject || '(No Subject)';
                            emailData.date = envelope.date || new Date();
                        }
                    });

                    msg.on('body', (stream, info) => {
                        simpleParser(stream, (err, parsed) => {
                            if (!err && parsed) {
                                // Get text content (prefer html, fallback to text)
                                let bodyContent = parsed.html || parsed.text || '';

                                // Clean up content
                                emailData.body = bodyContent;
                                emailData.snippet = parsed.text ? parsed.text.substring(0, 150) + '...' : '';

                                // Add attachment info
                                emailData.hasAttachments = parsed.attachments && parsed.attachments.length > 0;
                            }
                        });
                    });

                    msg.once('end', () => {
                        emails.push(emailData);
                    });
                });

                f.once('error', (err) => {
                    console.error('Fetch error:', err);
                });

                f.once('end', () => {
                    imap.end();
                    if (!responseSent) {
                        responseSent = true;
                        res.json({
                            success: true,
                            emails: emails.reverse(), // Newest first
                            account: imapUser,
                            totalCount: emails.length
                        });
                    }
                });
            });
        });

        imap.once('error', (err) => {
            clearTimeout(timeout);
            console.error('IMAP connection error:', err);
            if (!responseSent) {
                responseSent = true;
                // Return more specific error messages based on error type
                let notice = 'Unable to connect to email server. Using offline mode.';
                let errorType = 'connection';

                if (err.message && (err.message.includes('Authentication') || err.message.includes('invalid jwt'))) {
                    notice = 'Email authentication failed. Please check email credentials or contact support.';
                    errorType = 'authentication';
                } else if (err.message && err.message.includes('Timed out')) {
                    notice = 'Email server connection timed out. Please try again later.';
                    errorType = 'timeout';
                }

                res.json({
                    success: false, // Mark as false when there's an actual error
                    emails: [],
                    account: imapUser,
                    notice: notice,
                    error: err.message,
                    errorType: errorType
                });
            }
        });

        imap.connect();

    } catch (error) {
        console.error('Error in /emails endpoint:', error);
        if (!responseSent) {
            responseSent = true;
            res.json({
                success: true,
                emails: [],
                account: 'contact@vigagency.com',
                notice: 'Email service temporarily unavailable. Using offline mode.'
            });
        }
    }
});

/**
 * Check Outlook authentication status
 * GET /api/outlook/status
 */
router.get('/status', (req, res) => {
    db.get('SELECT value FROM settings WHERE key = ?', ['outlook_tokens'], (err, row) => {
        if (err) {
            return res.status(500).json({
                authenticated: false,
                error: 'Database error',
                details: err.message
            });
        }

        if (!row) {
            return res.status(401).json({
                authenticated: false,
                error: 'Outlook not configured',
                details: 'No Outlook credentials found',
                solution: 'Set up Outlook authentication to connect your email'
            });
        }

        try {
            const credentials = JSON.parse(row.value);
            const hasRefreshToken = !!credentials.refresh_token;
            const isExpired = credentials.expiry_date && credentials.expiry_date < Date.now();

            res.json({
                authenticated: hasRefreshToken && !isExpired,
                email: credentials.email || 'Not set',
                expired: isExpired
            });
        } catch (parseErr) {
            res.status(500).json({
                authenticated: false,
                error: 'Invalid credential format',
                details: parseErr.message
            });
        }
    });
});

/**
 * Get OAuth URL for authorization
 * GET /api/outlook/auth-url
 */
router.get('/auth-url', (req, res) => {
    // You'll need to register an app in Azure AD to get these
    const credentials = {
        client_id: process.env.OUTLOOK_CLIENT_ID || req.query.client_id || 'YOUR_OUTLOOK_CLIENT_ID',
        client_secret: process.env.OUTLOOK_CLIENT_SECRET || req.query.client_secret || 'YOUR_OUTLOOK_SECRET',
        redirect_uri: process.env.OUTLOOK_REDIRECT_URI || `http://162-220-14-239.nip.io/api/outlook/callback`
    };

    const authUrl = outlookService.getAuthUrl(credentials);
    res.json({ authUrl });
});

/**
 * Exchange authorization code for tokens
 * POST /api/outlook/exchange-code
 */
router.post('/exchange-code', async (req, res) => {
    try {
        const { code, client_id, client_secret } = req.body;

        const credentials = {
            client_id: client_id || process.env.OUTLOOK_CLIENT_ID,
            client_secret: client_secret || process.env.OUTLOOK_CLIENT_SECRET,
            redirect_uri: process.env.OUTLOOK_REDIRECT_URI || `http://162-220-14-239.nip.io/api/outlook/callback`
        };

        const tokens = await outlookService.getTokensFromCode(code, credentials);

        // Store full credentials
        outlookCredentials = { ...credentials, ...tokens };

        // Save to database
        db.run(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
            ['outlook_tokens', JSON.stringify(outlookCredentials)], (err) => {
                if (err) {
                    console.error('Error storing Outlook credentials:', err);
                }
            });

        await outlookService.initialize(outlookCredentials);

        res.json({ success: true, tokens });
    } catch (error) {
        console.error('Error exchanging code:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * OAuth callback
 * GET /api/outlook/callback
 */
router.get('/callback', async (req, res) => {
    try {
        const { code } = req.query;

        const credentials = {
            client_id: process.env.OUTLOOK_CLIENT_ID,
            client_secret: process.env.OUTLOOK_CLIENT_SECRET,
            redirect_uri: process.env.OUTLOOK_REDIRECT_URI || `http://162-220-14-239.nip.io/api/outlook/callback`
        };

        const tokens = await outlookService.getTokensFromCode(code, credentials);

        // Store tokens
        outlookCredentials = { ...credentials, ...tokens };

        db.run(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
            ['outlook_tokens', JSON.stringify(outlookCredentials)]);

        await outlookService.initialize(outlookCredentials);

        // Redirect to COI management with success
        res.redirect('http://162-220-14-239.nip.io/#coi-management?outlook=connected');
    } catch (error) {
        console.error('Error in OAuth callback:', error);
        res.redirect('http://162-220-14-239.nip.io/#coi-management?outlook=error');
    }
});

/**
 * List emails from Outlook
 * GET /api/outlook/messages
 */
router.get('/messages', async (req, res) => {
    try {
        if (!outlookCredentials) {
            const initialized = await loadStoredCredentials();
            if (!initialized) {
                return res.status(401).json({
                    error: 'Outlook not authenticated',
                    details: 'Please set up Outlook authentication first',
                    solution: 'Connect your Outlook account to fetch emails'
                });
            }
        }

        const { query, maxResults = 20 } = req.query;
        const messages = await outlookService.listMessages(query, parseInt(maxResults));

        res.json(messages);
    } catch (error) {
        console.error('Error fetching Outlook messages:', error);

        if (error.response?.status === 401) {
            return res.status(401).json({
                error: 'Outlook authentication failed',
                details: 'Access token expired or invalid',
                solution: 'Re-authenticate your Outlook account'
            });
        }

        res.status(500).json({
            error: 'Failed to fetch Outlook messages',
            details: error.message
        });
    }
});

/**
 * Get a specific message
 * GET /api/outlook/messages/:id
 */
router.get('/messages/:id', async (req, res) => {
    try {
        const message = await outlookService.getMessage(req.params.id);
        res.json(message);
    } catch (error) {
        console.error('Error fetching message:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Send email
 * POST /api/outlook/send
 */
router.post('/send', async (req, res) => {
    try {
        const { to, subject, body, cc, bcc, attachments } = req.body;

        const result = await outlookService.sendEmail({
            to,
            subject,
            body,
            cc,
            bcc,
            attachments
        });

        res.json(result);
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Search COI emails
 * GET /api/outlook/search-coi
 */
router.get('/search-coi', async (req, res) => {
    try {
        const { searchTerm, days = 30 } = req.query;
        const messages = await outlookService.searchCOIEmails(searchTerm, parseInt(days));
        res.json(messages);
    } catch (error) {
        console.error('Error searching emails:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Mark message as read
 * POST /api/outlook/messages/:id/read
 */
router.post('/messages/:id/read', async (req, res) => {
    try {
        await outlookService.markAsRead(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking as read:', error);
        res.status(500).json({ error: error.message });
    }
});

const COI_KEYWORDS = ['coi', 'certificate of insurance', 'certificate', 'acord', 'additional insured', 'liability certificate', 'proof of insurance'];

/**
 * Scan IMAP for COI-related emails and save new ones to the database.
 * Emails already dismissed are never re-added. Deduped by Message-ID.
 */
function syncCOIEmailsFromIMAP() {
    return new Promise((resolve, reject) => {
        const Imap = require('imap');
        const { simpleParser } = require('mailparser');

        const imap = new Imap({
            user: process.env.OUTLOOK_EMAIL || 'contact@vigagency.com',
            password: process.env.OUTLOOK_PASSWORD || process.env.GODADDY_VIG_PASSWORD,
            host: process.env.OUTLOOK_IMAP_HOST || 'imap.secureserver.net',
            port: parseInt(process.env.OUTLOOK_IMAP_PORT) || 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false, servername: process.env.OUTLOOK_IMAP_HOST || 'imap.secureserver.net' },
            connTimeout: 12000,
            authTimeout: 10000
        });

        imap.once('ready', () => {
            imap.openBox('INBOX', true, (err, box) => {
                if (err) { imap.end(); return reject(err); }
                if (!box.messages.total) { imap.end(); return resolve(0); }

                const numToFetch = Math.min(100, box.messages.total);
                const startSeq = Math.max(1, box.messages.total - numToFetch + 1);
                const fetchRange = `${startSeq}:*`;

                // Phase 1: fetch headers only to find COI candidates by subject
                const headerFetch = imap.seq.fetch(fetchRange, {
                    bodies: 'HEADER.FIELDS (FROM SUBJECT DATE MESSAGE-ID)',
                    struct: false
                });

                const candidates = []; // { seqno, messageId, from, subject, date, isUnread }
                let headerDone = false;
                let pendingHeaders = 0;

                function proceedToPhase2() {
                    if (!headerDone || pendingHeaders > 0) return;

                    // Filter to COI candidates by subject only
                    const coiCandidates = candidates.filter(c =>
                        COI_KEYWORDS.some(kw => c.subject.toLowerCase().includes(kw))
                    );

                    if (coiCandidates.length === 0) { imap.end(); return resolve(0); }

                    // Phase 2: fetch text-only body for COI candidates (no attachments)
                    const seqnos = coiCandidates.map(c => c.seqno).join(',');
                    const bodyFetch = imap.seq.fetch(seqnos, { bodies: 'TEXT', struct: false });

                    const snippetMap = {};
                    let bodyDone = false;
                    let pendingBodies = 0;

                    function saveResults() {
                        if (!bodyDone || pendingBodies > 0) return;
                        imap.end();
                        let saved = 0;
                        let pending = coiCandidates.length;
                        coiCandidates.forEach(c => {
                            const snippet = snippetMap[c.seqno] || '';
                            db.get('SELECT id FROM coi_emails WHERE id = ?', [c.messageId], (err, row) => {
                                if (row) { if (--pending === 0) resolve(saved); return; }
                                db.run(
                                    `INSERT INTO coi_emails (id, from_email, subject, date, snippet, is_unread, dismissed) VALUES (?, ?, ?, ?, ?, ?, 0)`,
                                    [c.messageId, c.from, c.subject, c.date, snippet, c.isUnread],
                                    (err) => { if (!err) saved++; if (--pending === 0) resolve(saved); }
                                );
                            });
                        });
                    }

                    bodyFetch.on('message', (msg, seqno) => {
                        let buf = '';
                        msg.on('body', (stream) => { stream.on('data', (chunk) => { buf += chunk.toString('utf8'); }); });
                        msg.once('end', () => {
                            pendingBodies++;
                            const { simpleParser } = require('mailparser');
                            simpleParser(buf, (err, parsed) => {
                                pendingBodies--;
                                if (!err && parsed) {
                                    snippetMap[seqno] = (parsed.text || '').substring(0, 300).replace(/\s+/g, ' ').trim();
                                }
                                saveResults();
                            });
                        });
                    });

                    bodyFetch.once('error', (err) => console.error('COI body fetch error:', err));
                    bodyFetch.once('end', () => { bodyDone = true; saveResults(); });
                }

                headerFetch.on('message', (msg, seqno) => {
                    let headerBuf = '';
                    let msgAttrs = null;
                    msg.once('attributes', (a) => { msgAttrs = a; });
                    msg.on('body', (stream) => { stream.on('data', (chunk) => { headerBuf += chunk.toString('utf8'); }); });
                    msg.once('end', () => {
                        pendingHeaders++;
                        const { simpleParser } = require('mailparser');
                        simpleParser(headerBuf, (err, parsed) => {
                            pendingHeaders--;
                            if (!err && parsed) {
                                const subject = parsed.subject || '(No Subject)';
                                const messageId = parsed.messageId || `noid-${Date.now()}-${Math.random()}`;
                                const fromText = parsed.from ? parsed.from.text : '';
                                const date = parsed.date ? parsed.date.toISOString() : new Date().toISOString();
                                const isUnread = msgAttrs && msgAttrs.flags && !msgAttrs.flags.includes('\\Seen') ? 1 : 0;
                                candidates.push({ seqno, messageId, from: fromText, subject, date, isUnread });
                            }
                            proceedToPhase2();
                        });
                    });
                });

                headerFetch.once('error', (err) => console.error('COI header fetch error:', err));
                headerFetch.once('end', () => { headerDone = true; proceedToPhase2(); });
            });
        });

        imap.once('error', (err) => reject(err));
        imap.connect();
    });
}

/**
 * GET /api/outlook/coi-requests
 * Returns saved COI emails from DB instantly (no IMAP wait).
 */
router.get('/coi-requests', (req, res) => {
    db.all(
        `SELECT id, from_email AS "from", subject, date, snippet, is_unread AS isUnread
         FROM coi_emails WHERE dismissed = 0 ORDER BY date DESC`,
        [],
        (err, rows) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            res.json({ success: true, emails: rows || [], totalCount: (rows || []).length });
        }
    );
});

/**
 * POST /api/outlook/coi-requests/sync
 * Responds immediately, runs IMAP scan in background.
 */
router.post('/coi-requests/sync', (req, res) => {
    res.json({ success: true, queued: true });
    // Run IMAP scan after response is sent
    setImmediate(() => {
        syncCOIEmailsFromIMAP()
            .then(saved => { if (saved > 0) console.log(`COI on-demand sync: saved ${saved} new emails`); })
            .catch(err => console.error('COI on-demand sync error:', err.message));
    });
});

/**
 * DELETE /api/outlook/coi-requests/:id
 * Marks a COI email as dismissed — it will never be shown or re-added.
 */
router.delete('/coi-requests/:id', (req, res) => {
    db.run('UPDATE coi_emails SET dismissed = 1 WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true });
    });
});

// Returns true if current time is within business hours (8:30am–7:00pm America/New_York)
function isBusinessHours() {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
    }).formatToParts(now);
    const hour = parseInt(parts.find(p => p.type === 'hour').value);
    const minute = parseInt(parts.find(p => p.type === 'minute').value);
    const totalMinutes = hour * 60 + minute;
    return totalMinutes >= 8 * 60 + 30 && totalMinutes < 19 * 60; // 8:30–19:00
}

// Background IMAP sync every 3 minutes, business hours only (8:30am–7:00pm ET)
setInterval(() => {
    if (!isBusinessHours()) return;
    syncCOIEmailsFromIMAP()
        .then(saved => { if (saved > 0) console.log(`COI background sync: saved ${saved} new emails`); })
        .catch(err => console.error('COI background sync error:', err.message));
}, 3 * 60 * 1000);

// Initial sync 8 seconds after startup (only if within business hours)
setTimeout(() => {
    if (!isBusinessHours()) return;
    syncCOIEmailsFromIMAP().catch(err => console.error('COI initial sync error:', err.message));
}, 8000);

/**
 * Test IMAP connection
 * GET /api/outlook/test-connection
 */
router.get('/test-connection', async (req, res) => {
    const Imap = require('imap');

    const imap = new Imap({
        user: process.env.OUTLOOK_EMAIL || 'contact@vigagency.com',
        password: process.env.OUTLOOK_PASSWORD || process.env.GODADDY_VIG_PASSWORD,
        host: process.env.OUTLOOK_IMAP_HOST || 'imap.secureserver.net',
        port: 993,
        tls: true,
        tlsOptions: {
            rejectUnauthorized: false,
            servername: process.env.OUTLOOK_IMAP_HOST || 'imap.secureserver.net'
        },
        connTimeout: 10000,
        authTimeout: 10000
    });

    let connectionResult = {
        connected: false,
        error: null,
        inbox: null
    };

    imap.once('ready', () => {
        console.log('IMAP connection successful');
        imap.openBox('INBOX', false, (err, box) => {
            if (err) {
                connectionResult.error = err.message;
            } else {
                connectionResult.connected = true;
                connectionResult.inbox = {
                    total: box.messages.total,
                    new: box.messages.new,
                    name: box.name
                };
            }
            imap.end();
        });
    });

    imap.once('error', (err) => {
        console.error('IMAP test connection error:', err);
        connectionResult.error = err.message;
        res.json(connectionResult);
    });

    imap.once('end', () => {
        res.json(connectionResult);
    });

    imap.connect();
});

/**
 * Send email via SMTP (Titan/GoDaddy)
 * POST /api/outlook/send-smtp
 */
router.post('/send-smtp', async (req, res) => {
    try {
        const { to, cc, bcc, subject, body, attachments, account } = req.body;

        // Support UIG account when requested (e.g. Maureen's emails)
        const isUIG = account === 'uig';
        const smtpUser = isUIG ? 'contact@uigagency.com' : (process.env.OUTLOOK_EMAIL || 'contact@vigagency.com');
        const smtpPass = isUIG ? process.env.GODADDY_UIG_PASSWORD : (process.env.OUTLOOK_PASSWORD || process.env.GODADDY_VIG_PASSWORD);

        // Create SMTP transporter using Titan/GoDaddy credentials
        const transporter = nodemailer.createTransport({
            host: process.env.OUTLOOK_SMTP_HOST || 'smtpout.secureserver.net',
            port: parseInt(process.env.OUTLOOK_SMTP_PORT) || 465,
            secure: true, // Use SSL
            auth: {
                user: smtpUser,
                pass: smtpPass
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Prepare email options
        const mailOptions = {
            from: smtpUser,
            to: to,
            cc: cc || undefined,
            bcc: bcc || undefined,
            subject: subject,
            html: body,
            attachments: attachments ? attachments.map(att => ({
                filename: att.filename || att.name,
                content: att.content,
                encoding: att.encoding || 'base64',
                contentType: att.contentType || 'application/pdf'
            })) : undefined
        };

        console.log('Sending email via SMTP to:', to);
        console.log('Subject:', subject);
        console.log('Attachments:', attachments ? attachments.length : 0);

        const result = await transporter.sendMail(mailOptions);

        console.log('Email sent successfully:', result.messageId);

        res.json({
            success: true,
            messageId: result.messageId,
            message: 'Email sent successfully via SMTP'
        });

    } catch (error) {
        console.error('SMTP send error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: 'Failed to send email via SMTP'
        });
    }
});

/**
 * POST /api/outlook/send-coi
 * Send a COI email with optional PDF attachment (multipart/form-data)
 */
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.post('/send-coi', upload.single('attachment'), async (req, res) => {
    try {
        const { to, subject, body } = req.body;
        if (!to) return res.status(400).json({ success: false, error: 'Recipient required' });

        const transporter = nodemailer.createTransport({
            host: process.env.OUTLOOK_SMTP_HOST || 'smtpout.secureserver.net',
            port: parseInt(process.env.OUTLOOK_SMTP_PORT) || 465,
            secure: true,
            auth: {
                user: process.env.OUTLOOK_EMAIL || 'contact@vigagency.com',
                pass: process.env.OUTLOOK_PASSWORD || process.env.GODADDY_VIG_PASSWORD
            },
            tls: { rejectUnauthorized: false }
        });

        const mailOptions = {
            from: process.env.OUTLOOK_EMAIL || 'contact@vigagency.com',
            to,
            subject: subject || 'Certificate of Insurance',
            html: body || '',
            attachments: req.file ? [{
                filename: req.file.originalname,
                content: req.file.buffer,
                contentType: req.file.mimetype
            }] : []
        };

        const result = await transporter.sendMail(mailOptions);
        res.json({ success: true, messageId: result.messageId });
    } catch (err) {
        console.error('COI send error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;