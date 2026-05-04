/**
 * portal-api.js — iOS Client Portal API
 * Mount at /api/portal in server.js
 *
 * Auth: JWT Bearer token (30-day expiry, mobile-friendly)
 * All client-facing routes require requirePortalAuth middleware.
 * Admin routes (create/list portal users) are internal-only.
 */

'use strict';

const express   = require('express');
const router    = express.Router();
const sqlite3   = require('sqlite3').verbose();
const jwt       = require('jsonwebtoken');
const bcrypt    = require('bcryptjs');
const fs        = require('fs');
const multer    = require('multer');

// In-memory multer for COI file uploads (no disk writes needed)
const uploadCOI = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const DB_PATH   = '/var/www/vanguard/vanguard.db';
const JWT_SECRET = process.env.PORTAL_JWT_SECRET || 'change-me-in-env';
const JWT_EXPIRES = '30d';

// ─── DB helper ──────────────────────────────────────────────────────────────
function getDb() {
    const db = new sqlite3.Database(DB_PATH);
    db.run('PRAGMA journal_mode=WAL');
    db.run('PRAGMA busy_timeout=15000');
    return db;
}

// ─── Bootstrap portal tables ─────────────────────────────────────────────────
(function initPortalTables() {
    const db = getDb();
    db.serialize(() => {
        // password_hash is nullable — NULL = account exists, password not set yet
        db.run(`CREATE TABLE IF NOT EXISTS portal_users (
            id            TEXT PRIMARY KEY,
            client_id     TEXT NOT NULL,
            email         TEXT NOT NULL,
            password_hash TEXT,
            created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login    DATETIME
        )`);
        db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_portal_users_email
                ON portal_users (LOWER(email))`);

        // Short-lived tokens for password reset (and first-time setup if agent wants token flow)
        db.run(`CREATE TABLE IF NOT EXISTS portal_tokens (
            token      TEXT PRIMARY KEY,
            user_id    TEXT NOT NULL,
            type       TEXT NOT NULL,
            expires_at DATETIME NOT NULL,
            used       INTEGER DEFAULT 0
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS portal_certificate_holders (
            id         TEXT PRIMARY KEY,
            client_id  TEXT,
            name       TEXT NOT NULL,
            company    TEXT DEFAULT '',
            address    TEXT DEFAULT '',
            city       TEXT DEFAULT '',
            state      TEXT DEFAULT '',
            zip        TEXT DEFAULT '',
            is_global  INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS portal_coi_requests (
            id                    TEXT PRIMARY KEY,
            client_id             TEXT NOT NULL,
            policy_id             TEXT NOT NULL,
            policy_number         TEXT DEFAULT '',
            request_type          TEXT DEFAULT 'standard',
            recipient_emails      TEXT DEFAULT '[]',
            certificate_holder    TEXT DEFAULT '',
            additional_notes      TEXT DEFAULT '',
            status                TEXT DEFAULT 'pending',
            submitted_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at          DATETIME,
            agent_notes           TEXT DEFAULT ''
        )`);
    });
    db.close();
})();

// ─── Auth middleware ──────────────────────────────────────────────────────────
function requirePortalAuth(req, res, next) {
    const auth  = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : null;
    if (!token) return res.status(401).json({ error: 'Missing Authorization header' });
    try {
        req.portalUser = jwt.verify(token, JWT_SECRET);
        next();
    } catch (e) {
        const expired = e.name === 'TokenExpiredError';
        res.status(401).json({ error: expired ? 'Token expired' : 'Invalid token' });
    }
}

// ─── Sync portal password status back to CRM clients table ───────────────────
// The CRM profile card reads client.data.portalPassword to decide whether to
// show "NOT CREATED" or "●●●●●●●●" and to pass to togglePasswordVisibility.
// Pass plainText when the admin sets the password (so agents can view it).
// Pass null when the client sets their own (no plain text available → shows ●●●●●●●●).
function syncPortalPasswordToCRM(db, clientId, plainText) {
    if (!clientId) return;
    const rawId = String(clientId).replace(/\.0$/, '');
    const value = plainText || '●●●●●●●●';
    db.get(
        'SELECT id, data FROM clients WHERE id=? OR id=?',
        [clientId, rawId],
        (err, row) => {
            if (err || !row) return;
            try {
                const data = JSON.parse(row.data || '{}');
                // Always overwrite so the latest value is reflected
                data.portalPassword = value;
                db.run('UPDATE clients SET data=? WHERE id=?',
                    [JSON.stringify(data), row.id]);
            } catch { /* ignore parse errors */ }
        }
    );
}

// ─── Auto-provision: look up portal_users; if missing, check CRM clients ─────
// If the email exists in the clients table but has no portal_users row yet,
// automatically create one (password_hash = NULL → triggers PASSWORD_NOT_SET).
// Returns the portal_users row via callback(err, row).
function getOrCreatePortalUser(db, email, callback) {
    const normalised = email.trim().toLowerCase();
    db.get('SELECT * FROM portal_users WHERE LOWER(email)=?', [normalised], (err, user) => {
        if (err) return callback(err);
        if (user) return callback(null, user);   // already registered

        // Not in portal_users — check if the email belongs to a CRM client
        db.get(
            `SELECT id FROM clients WHERE LOWER(json_extract(data,'$.email'))=?`,
            [normalised],
            (cErr, client) => {
                if (cErr) return callback(cErr);
                if (!client) return callback(null, null);   // genuinely unknown

                // Auto-create a portal account for this CRM client
                const newId = 'PU-' + Date.now();
                db.run(
                    `INSERT OR IGNORE INTO portal_users (id, client_id, email, password_hash)
                     VALUES (?, ?, ?, NULL)`,
                    [newId, client.id, normalised],
                    (iErr) => {
                        if (iErr) return callback(iErr);
                        // Re-fetch the row (handles race where another insert beat us)
                        db.get('SELECT * FROM portal_users WHERE LOWER(email)=?', [normalised], callback);
                    }
                );
            }
        );
    });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const POLICY_TYPE_LABELS = {
    'commercial-auto'   : 'Commercial Auto',
    'general-liability' : 'General Liability',
    'workers-comp'      : "Workers' Compensation",
    'property'          : 'Commercial Property',
    'umbrella'          : 'Umbrella / Excess',
    'cargo'             : 'Motor Truck Cargo',
    'physical-damage'   : 'Physical Damage',
    'bop'               : 'Business Owners Policy',
    'cyber'             : 'Cyber Liability',
};

function policyLabel(type) {
    return POLICY_TYPE_LABELS[(type || '').toLowerCase()] || type || 'Policy';
}

function docTypeFromName(filename) {
    const n = (filename || '').toLowerCase();
    if (n.includes('id-card') || n.includes('id_card') || n.includes('idcard')) return 'id_card';
    if (n.includes('dec ') || n.includes('declaration') || n.includes('_dec_') || n.includes('-dec-')) return 'declaration';
    if (n.includes('billing') || n.includes('invoice') || n.includes('statement')) return 'billing';
    if (n.includes('coi') || n.includes('certificate')) return 'coi';
    if (n.includes('loss-run') || n.includes('loss_run') || n.includes('lossrun')) return 'loss_run';
    if (n.includes('quote')) return 'quote';
    return 'document';
}

// ─── Shared: issue a JWT for a verified portal_user row ──────────────────────
function issueToken(db, user, res) {
    db.get('SELECT data FROM clients WHERE id=?', [user.client_id], (err, clientRow) => {
        db.run('UPDATE portal_users SET last_login=CURRENT_TIMESTAMP WHERE id=?', [user.id]);
        db.close();
        let name = '';
        try { name = JSON.parse(clientRow.data).name || ''; } catch {}
        const token = jwt.sign(
            { sub: user.client_id, userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );
        res.json({ token, expiresIn: JWT_EXPIRES, clientId: user.client_id, name });
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: POST /api/portal/login
//
// Distinct failure codes so the iOS app can branch UI:
//   404 EMAIL_NOT_FOUND   — no portal account for this email
//   403 PASSWORD_NOT_SET  — account exists but password never set (show Setup screen)
//   401 WRONG_PASSWORD    — account + password set, but password is incorrect
//   200                   — success → { token, expiresIn, clientId, name }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password)
        return res.status(400).json({ code: 'MISSING_FIELDS', error: 'email and password are required' });

    const db = getDb();
    getOrCreatePortalUser(db, email, (err, user) => {
        if (err) { db.close(); return res.status(500).json({ error: 'Database error' }); }

        // ── 404: email not in portal_users AND not in CRM clients ─────────
        if (!user) {
            db.close();
            return res.status(404).json({
                code  : 'EMAIL_NOT_FOUND',
                error : 'No account found for this email address',
            });
        }

        // ── 403: account exists but password not set yet ──────────────────
        if (!user.password_hash) {
            db.close();
            return res.status(403).json({
                code  : 'PASSWORD_NOT_SET',
                error : 'Your account exists but a password has not been set up yet',
            });
        }

        // ── 401: password set but wrong ────────────────────────────────────
        bcrypt.compare(password, user.password_hash, (bcErr, match) => {
            if (!match) {
                db.close();
                return res.status(401).json({
                    code  : 'WRONG_PASSWORD',
                    error : 'Incorrect password',
                });
            }
            // ── 200: success ───────────────────────────────────────────────
            issueToken(db, user, res);
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: POST /api/portal/setup-password
// First-time password creation. Only works when password_hash IS NULL.
// Use /request-password-reset instead for forgotten passwords.
//
// Body:   { email, newPassword }
// 404    EMAIL_NOT_FOUND  — not a registered portal user
// 409    PASSWORD_ALREADY_SET — use reset flow instead
// 400    WEAK_PASSWORD — fewer than 8 characters
// 200    { token, ... } — password saved + logged in
// ─────────────────────────────────────────────────────────────────────────────
router.post('/setup-password', (req, res) => {
    const { email, newPassword } = req.body || {};
    if (!email || !newPassword)
        return res.status(400).json({ code: 'MISSING_FIELDS', error: 'email and newPassword are required' });
    if (newPassword.length < 8)
        return res.status(400).json({ code: 'WEAK_PASSWORD', error: 'Password must be at least 8 characters' });

    const db = getDb();
    getOrCreatePortalUser(db, email, (err, user) => {
        if (err)  { db.close(); return res.status(500).json({ error: 'Database error' }); }
        if (!user){ db.close(); return res.status(404).json({ code: 'EMAIL_NOT_FOUND', error: 'No account found for this email address' }); }
        if (user.password_hash) {
            db.close();
            return res.status(409).json({ code: 'PASSWORD_ALREADY_SET', error: 'A password is already set. Use the forgot password flow to reset it.' });
        }

        bcrypt.hash(newPassword, 10, (hashErr, hash) => {
            if (hashErr) { db.close(); return res.status(500).json({ error: 'Server error' }); }
            db.run('UPDATE portal_users SET password_hash=? WHERE id=?', [hash, user.id], (e) => {
                if (e) { db.close(); return res.status(500).json({ error: 'Failed to save password' }); }
                syncPortalPasswordToCRM(db, user.client_id, newPassword);
                issueToken(db, { ...user, password_hash: hash }, res);
            });
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: POST /api/portal/request-password-reset
// Generates a 15-minute reset token. In production this would be emailed;
// for now the token is returned in the response so you can test immediately.
//
// Body:  { email }
// Always 200 — never reveals whether the email exists (security best practice)
// Response: { message, resetToken (dev only), expiresIn }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/request-password-reset', (req, res) => {
    const { email } = req.body || {};
    if (!email)
        return res.status(400).json({ code: 'MISSING_FIELDS', error: 'email is required' });

    const db = getDb();
    db.get('SELECT * FROM portal_users WHERE LOWER(email)=LOWER(?)', [email.trim()], (err, user) => {
        if (err || !user) {
            db.close();
            // Don't leak whether email exists — always return the same message
            return res.json({ message: 'If that email is registered, a reset token has been generated.' });
        }

        const resetToken  = require('crypto').randomBytes(32).toString('hex');
        const expiresAt   = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min
        const tokenId     = 'RT-' + Date.now();

        db.run(
            `INSERT INTO portal_tokens (token, user_id, type, expires_at) VALUES (?,?,?,?)`,
            [resetToken, user.id, 'reset', expiresAt],
            (insertErr) => {
                db.close();
                if (insertErr) return res.status(500).json({ error: 'Failed to generate token' });
                res.json({
                    message   : 'Reset token generated. Share this with the user to complete the reset.',
                    resetToken,          // remove/email this in production
                    expiresIn : '15 minutes',
                });
            }
        );
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: POST /api/portal/complete-password-reset
// Validates reset token, sets new password, returns JWT.
//
// Body: { resetToken, newPassword }
// 400   INVALID_TOKEN — token not found, expired, or already used
// 400   WEAK_PASSWORD
// 200   { token, ... } — password updated + logged in
// ─────────────────────────────────────────────────────────────────────────────
router.post('/complete-password-reset', (req, res) => {
    const { resetToken, newPassword } = req.body || {};
    if (!resetToken || !newPassword)
        return res.status(400).json({ code: 'MISSING_FIELDS', error: 'resetToken and newPassword are required' });
    if (newPassword.length < 8)
        return res.status(400).json({ code: 'WEAK_PASSWORD', error: 'Password must be at least 8 characters' });

    const db = getDb();
    db.get(
        `SELECT * FROM portal_tokens WHERE token=? AND type='reset' AND used=0 AND expires_at > CURRENT_TIMESTAMP`,
        [resetToken],
        (err, tokenRow) => {
            if (err || !tokenRow) {
                db.close();
                return res.status(400).json({ code: 'INVALID_TOKEN', error: 'Reset token is invalid, expired, or already used' });
            }

            db.get('SELECT * FROM portal_users WHERE id=?', [tokenRow.user_id], (uErr, user) => {
                if (uErr || !user) { db.close(); return res.status(404).json({ error: 'Account not found' }); }

                bcrypt.hash(newPassword, 10, (hashErr, hash) => {
                    if (hashErr) { db.close(); return res.status(500).json({ error: 'Server error' }); }
                    db.serialize(() => {
                        db.run('UPDATE portal_users SET password_hash=? WHERE id=?', [hash, user.id]);
                        db.run('UPDATE portal_tokens SET used=1 WHERE token=?', [resetToken]);
                    });
                    syncPortalPasswordToCRM(db, user.client_id, newPassword);
                    issueToken(db, { ...user, password_hash: hash }, res);
                });
            });
        }
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED: GET /api/portal/me
// Returns the logged-in client's profile
// ─────────────────────────────────────────────────────────────────────────────
router.get('/me', requirePortalAuth, (req, res) => {
    const db = getDb();
    db.get('SELECT id, data FROM clients WHERE id=?', [req.portalUser.sub], (err, row) => {
        db.close();
        if (err || !row) return res.status(404).json({ error: 'Client not found' });
        try {
            const d = JSON.parse(row.data);
            res.json({
                accountId    : String(row.id),
                name         : d.name         || d.fullName    || '',
                fullName     : d.fullName      || d.name        || '',
                businessName : d.businessName  || '',
                email        : d.email         || '',
                phone        : d.phone         || '',
                address      : d.address       || '',
                city         : d.city          || '',
                state        : d.state         || '',
                zip          : d.zip           || '',
                type         : d.type          || 'Commercial',
                status       : d.status        || 'Active',
                assignedAgent: d.assignedTo    || '',
            });
        } catch {
            res.status(500).json({ error: 'Failed to parse client data' });
        }
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED: GET /api/portal/policies
// Returns all active policies for the logged-in client
// ─────────────────────────────────────────────────────────────────────────────
router.get('/policies', requirePortalAuth, (req, res) => {
    const db = getDb();
    // Policies are stored with client_id lacking the ".0" suffix that JWTs carry
    const rawClientId = String(req.portalUser.sub).replace(/\.0$/, '');
    // Also match policies where the inner JSON clientId is correct but the column was
    // incorrectly set to the policy number (server.js fallback bug — 129 affected rows).
    db.all(
        `SELECT id, data FROM policies
         WHERE client_id=? OR client_id=?
            OR data LIKE '%"clientId":"' || ? || '"%'`,
        [req.portalUser.sub, rawClientId, rawClientId],
        (err, rows) => {
        db.close();
        if (err) return res.status(500).json({ error: 'Database error' });

        const unitedOnly = req.query.brand === 'united';
        const policies = [];
        for (const row of (rows || [])) {
            try {
                const outer = JSON.parse(row.data);
                for (const p of (outer.policies || [])) {
                    // Brand filter: if brand=united only include United-flagged or Maureen-agent policies
                    if (unitedOnly) {
                        const isUnited = p.united === true || p.united === 'true' ||
                                         (p.agent || '').toLowerCase().includes('maureen');
                        if (!isUnited) continue;
                    }
                    policies.push({
                        policyId        : String(row.id),
                        policyNumber    : p.policyNumber    || '',
                        policyType      : p.policyType      || '',
                        policyName      : policyLabel(p.policyType),
                        carrier         : p.carrier         || '',
                        status          : p.policyStatus    || 'Active',
                        effectiveDate   : p.effectiveDate   || '',
                        expirationDate  : p.expirationDate  || '',
                        premium         : String(p.premium  || '0').replace(/[^0-9.]/g, ''),
                        insuredName     : (p.insured || {})['Name/Business Name'] || (p.insured || {})['Primary Named Insured'] || '',
                        dotNumber       : p.dotNumber       || '',
                        mcNumber        : p.mcNumber        || '',
                        agent           : p.agent           || '',
                        united          : p.united === true || p.united === 'true',
                    });
                }
            } catch { /* skip unparseable rows */ }
        }

        // Sort active first, then by expiration date desc
        policies.sort((a, b) => {
            if (a.status === 'Active' && b.status !== 'Active') return -1;
            if (a.status !== 'Active' && b.status === 'Active') return  1;
            return (b.expirationDate || '').localeCompare(a.expirationDate || '');
        });

        res.json({ policies, count: policies.length });
    });   // end db.all callback
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED: GET /api/portal/policies/:policyId/documents
// Returns all documents for a policy: COIs + ID cards embedded in policy data
// ─────────────────────────────────────────────────────────────────────────────
router.get('/policies/:policyId/documents', requirePortalAuth, (req, res) => {
    const { policyId } = req.params;
    const db = getDb();
    const rawClientId = String(req.portalUser.sub).replace(/\.0$/, '');

    // Verify ownership — column match OR JSON clientId fallback (client_id column can be stale)
    db.get(
        `SELECT id, data FROM policies WHERE id=? AND (client_id=? OR client_id=? OR data LIKE '%"clientId":"' || ? || '"%')`,
        [policyId, req.portalUser.sub, rawClientId, rawClientId],
        (err, pol) => {
            if (err || !pol) {
                db.close();
                return res.status(403).json({ error: 'Policy not found or access denied' });
            }

            // Fetch ID cards, coi_documents table, and uploaded documents in parallel
            db.all('SELECT id, policy_id, name, type, upload_date, size FROM id_cards WHERE policy_id=?',
                [policyId],
                (e2, idCardRows) => {
                db.all('SELECT id, policy_id, name, type, upload_date FROM coi_documents WHERE policy_id=?',
                    [policyId],
                    (e3, coiDocRows) => {
                db.all('SELECT id, filename, original_name, file_path, file_size, file_type, upload_date, doc_type FROM documents WHERE policy_id=?',
                    [policyId],
                    (e4, docRows) => {
                    db.close();
                    const result = [];
                    const seenIds = new Set();

                    try {
                        const pdata = JSON.parse(pol.data || '{}');

                        // ── COIs stored as coiDocuments[] inside the policy JSON ──
                        for (const c of (pdata.coiDocuments || [])) {
                            if (!c.id) continue;
                            seenIds.add(c.id);
                            result.push({
                                id          : c.id,
                                docType     : 'coi',
                                name        : c.name || 'Certificate of Insurance',
                                mimeType    : c.type || 'image/png',
                                uploadDate  : c.uploadDate || '',
                                downloadUrl : `/api/portal/policies/${policyId}/coi/${c.id}/download`,
                                source      : 'policy_embedded',
                            });
                        }
                    } catch { /* unparseable policy data */ }

                    // ── COIs from coi_documents table (if not already included) ──
                    for (const cd of (coiDocRows || [])) {
                        if (seenIds.has(cd.id)) continue;
                        seenIds.add(cd.id);
                        result.push({
                            id          : cd.id,
                            docType     : 'coi',
                            name        : cd.name || 'Certificate of Insurance',
                            mimeType    : cd.type || 'image/png',
                            uploadDate  : cd.upload_date || '',
                            downloadUrl : `/api/portal/coi-documents/${cd.id}/download`,
                            source      : 'coi_documents_table',
                        });
                    }

                    // ── ID cards from id_cards table ──
                    for (const card of (idCardRows || [])) {
                        result.push({
                            id          : card.id,
                            docType     : 'id_card',
                            name        : card.name || 'Insurance ID Card',
                            mimeType    : card.type || 'application/pdf',
                            fileSize    : card.size,
                            uploadDate  : card.upload_date || '',
                            downloadUrl : `/api/portal/policies/${policyId}/id-card/${card.id}/download`,
                            source      : 'id_cards_table',
                        });
                    }

                    // ── Uploaded documents from documents table ──
                    for (const doc of (docRows || [])) {
                        result.push({
                            id          : doc.id,
                            docType     : (doc.doc_type && doc.doc_type !== 'general') ? doc.doc_type : normalizeDocType(doc.original_name || doc.filename || ''),
                            name        : doc.original_name || doc.filename,
                            mimeType    : doc.file_type || 'application/octet-stream',
                            fileSize    : doc.file_size,
                            uploadDate  : doc.upload_date || '',
                            downloadUrl : `/api/portal/documents/${doc.id}/download`,
                            source      : 'documents_table',
                        });
                    }

                    result.sort((a, b) =>
                        (b.uploadDate || '').localeCompare(a.uploadDate || ''));

                    res.json({ documents: result, count: result.length });
                });
                });
                }
            );
        }
    );
});

// Helper: normalize document type from filename
function normalizeDocType(name) {
    const n = (name || '').toLowerCase();
    if (n.includes('id-card') || n.includes('id_card') || n.includes('idcard')) return 'id_card';
    if (n.includes('coi') || n.includes('certificate') || n.includes('acord')) return 'coi';
    if (n.includes('declaration') || n.includes('dec_') || n.includes('dec ')) return 'declaration';
    if (n.includes('billing') || n.includes('invoice')) return 'billing';
    return 'document';
}

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED: GET /api/portal/policies/:policyId/coi/:coiId/download
// Serves a COI image/PDF stored inside policies.data.coiDocuments[]
// ─────────────────────────────────────────────────────────────────────────────
router.get('/policies/:policyId/coi/:coiId/download', requirePortalAuth, (req, res) => {
    const { policyId, coiId } = req.params;
    const db = getDb();
    const rawClientId = String(req.portalUser.sub).replace(/\.0$/, '');

    db.get(
        `SELECT data FROM policies WHERE id=? AND (client_id=? OR client_id=? OR data LIKE '%"clientId":"' || ? || '"%')`,
        [policyId, req.portalUser.sub, rawClientId, rawClientId],
        (err, pol) => {
            db.close();
            if (err || !pol) return res.status(403).json({ error: 'Not found' });
            try {
                const pdata = JSON.parse(pol.data || '{}');
                const coi = (pdata.coiDocuments || []).find(c => c.id === coiId);
                if (!coi || !coi.dataUrl) return res.status(404).json({ error: 'COI not found' });
                const mimeType = coi.type || 'image/png';
                const [, b64] = coi.dataUrl.split(',');
                const buf = Buffer.from(b64 || coi.dataUrl, 'base64');
                res.setHeader('Content-Type', mimeType);
                res.setHeader('Content-Disposition', `inline; filename="${coi.name || 'coi.png'}"`);
                return res.send(buf);
            } catch { return res.status(500).json({ error: 'Failed to decode COI' }); }
        }
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED: GET /api/portal/policies/:policyId/id-card/:cardId/download
// Serves an ID card from the id_cards table (ownership verified via policy)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/policies/:policyId/id-card/:cardId/download', requirePortalAuth, (req, res) => {
    const { policyId, cardId } = req.params;
    const db = getDb();
    const rawClientId = String(req.portalUser.sub).replace(/\.0$/, '');

    // Verify the policy belongs to this user, then fetch the ID card
    db.get(
        `SELECT id FROM policies WHERE id=? AND (client_id=? OR client_id=? OR data LIKE '%"clientId":"' || ? || '"%')`,
        [policyId, req.portalUser.sub, rawClientId, rawClientId],
        (err, pol) => {
            if (err || !pol) { db.close(); return res.status(403).json({ error: 'Not found' }); }

            db.get('SELECT * FROM id_cards WHERE id=? AND policy_id=?', [cardId, policyId], (e2, card) => {
                db.close();
                if (e2 || !card) return res.status(404).json({ error: 'ID card not found' });
                try {
                    const mimeType = card.type || 'application/pdf';
                    const dataUrl  = card.data_url || '';
                    const [, b64]  = dataUrl.includes(',') ? dataUrl.split(',') : ['', dataUrl];
                    const buf      = Buffer.from(b64, 'base64');
                    res.setHeader('Content-Type', mimeType);
                    res.setHeader('Content-Disposition', `inline; filename="${card.name || 'id-card.pdf'}"`);
                    return res.send(buf);
                } catch { return res.status(500).json({ error: 'Failed to decode ID card' }); }
            });
        }
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED: GET /api/portal/documents/:docId/download
// Streams an uploaded document (PDF, image, etc.)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/documents/:docId/download', requirePortalAuth, (req, res) => {
    const db = getDb();
    const rawClientId = String(req.portalUser.sub).replace(/\.0$/, '');
    db.get(
        `SELECT * FROM documents WHERE id=? AND (client_id=? OR client_id=? OR policy_id IN (SELECT id FROM policies WHERE client_id=? OR client_id=? OR data LIKE '%"clientId":"' || ? || '"%'))`,
        [req.params.docId, req.portalUser.sub, rawClientId, req.portalUser.sub, rawClientId, rawClientId],
        (err, doc) => {
            db.close();
            if (err || !doc) return res.status(404).json({ error: 'Document not found' });
            if (!doc.file_path || !fs.existsSync(doc.file_path))
                return res.status(404).json({ error: 'File not on disk' });

            const name = doc.original_name || doc.filename || 'document';
            res.setHeader('Content-Type', doc.file_type || 'application/octet-stream');
            res.setHeader('Content-Disposition', `inline; filename="${name}"`);
            fs.createReadStream(doc.file_path).pipe(res);
        }
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED: GET /api/portal/coi-documents/:id/download
// Returns the binary PDF for a COI stored as base64 dataUrl
// ─────────────────────────────────────────────────────────────────────────────
router.get('/coi-documents/:id/download', requirePortalAuth, (req, res) => {
    const db = getDb();
    db.get(
        `SELECT c.* FROM coi_documents c
         JOIN policies p ON p.id = c.policy_id
         WHERE c.id=? AND (p.client_id=? OR p.client_id=? OR p.data LIKE '%"clientId":"' || ? || '"%')`,
        [req.params.id, req.portalUser.sub, String(req.portalUser.sub).replace(/\.0$/, ''), String(req.portalUser.sub).replace(/\.0$/, '')],
        (err, doc) => {
            db.close();
            if (err || !doc) return res.status(404).json({ error: 'COI not found' });

            if (doc.data_url && doc.data_url.startsWith('data:')) {
                const [, b64] = doc.data_url.split(',');
                const buf = Buffer.from(b64 || doc.data_url, 'base64');
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `inline; filename="${doc.name || 'coi.pdf'}"`);
                return res.send(buf);
            }
            if (doc.data_url) return res.redirect(doc.data_url);
            res.status(404).json({ error: 'No file data available' });
        }
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED: GET /api/portal/certificate-holders
// Returns global cert holders + ones this client has saved
// ─────────────────────────────────────────────────────────────────────────────
router.get('/certificate-holders', requirePortalAuth, (req, res) => {
    const db = getDb();
    db.all(
        `SELECT * FROM portal_certificate_holders
         WHERE is_global=1 OR client_id=?
         ORDER BY name COLLATE NOCASE`,
        [req.portalUser.sub],
        (err, rows) => {
            db.close();
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({
                certificateHolders: (rows || []).map(r => ({
                    id       : r.id,
                    name     : r.name,
                    company  : r.company  || '',
                    address  : r.address  || '',
                    city     : r.city     || '',
                    state    : r.state    || '',
                    zip      : r.zip      || '',
                    isGlobal : !!r.is_global,
                })),
            });
        }
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED: POST /api/portal/certificate-holders
// Save a new cert holder for this client
// ─────────────────────────────────────────────────────────────────────────────
router.post('/certificate-holders', requirePortalAuth, (req, res) => {
    const { name, company, address, city, state, zip } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name is required' });

    const id = 'CH-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    const db = getDb();
    db.run(
        `INSERT INTO portal_certificate_holders
         (id, client_id, name, company, address, city, state, zip, is_global)
         VALUES (?,?,?,?,?,?,?,?,0)`,
        [id, req.portalUser.sub, name, company||'', address||'', city||'', state||'', zip||''],
        (err) => {
            db.close();
            if (err) return res.status(500).json({ error: 'Failed to save certificate holder' });
            res.status(201).json({ id, name, company, address, city, state, zip, isGlobal: false });
        }
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED: POST /api/portal/coi/request
// Immediately emails the COI to the requested recipients, then logs the request.
//
// Body:
// {
//   policyId: string,           required
//   requestType: "myself"|"third_party",
//   recipientEmails: string[],  for third_party; myself uses the portal user's email
//   certificateHolder: {        for third_party overlay info (included in email body)
//     name, company, address, city, state, zip
//   },
//   additionalNotes: string
// }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/coi/request', requirePortalAuth, (req, res, next) => {
    // Accept optional multipart/form-data (overlaid PDF from iOS) or plain JSON
    uploadCOI.single('attachment')(req, res, (err) => {
        if (err) return res.status(400).json({ error: 'File upload error: ' + err.message });
        next();
    });
}, async (req, res) => {
    const {
        policyId,
        requestType        = 'myself',
        recipientEmails    = [],
        certificateHolder  = null,
        additionalNotes    = '',
    } = req.body || {};

    if (!policyId)
        return res.status(400).json({ error: 'policyId is required' });

    const db = getDb();
    const rawClientId = String(req.portalUser.sub).replace(/\.0$/, '');

    try {
        // ── 1. Verify ownership & get policy data ───────────────────────
        const pol = await new Promise((resolve, reject) => {
            db.get(
                `SELECT id, data FROM policies WHERE id=? AND (client_id=? OR client_id=? OR data LIKE '%"clientId":"' || ? || '"%')`,
                [policyId, req.portalUser.sub, rawClientId, rawClientId],
                (err, row) => err ? reject(err) : resolve(row)
            );
        });

        if (!pol) {
            db.close();
            return res.status(403).json({ error: 'Policy not found or access denied' });
        }

        const pdata       = JSON.parse(pol.data || '{}');
        const policyInfo  = (pdata.policies || [])[0] || {};
        const policyNumber = policyInfo.policyNumber || '';
        const insuredName  = (policyInfo.insured || {})['Name/Business Name']
                          || (policyInfo.insured || {})['Primary Named Insured']
                          || req.portalUser.email;

        // Determine if this is a United policy
        const isUIG = policyInfo.united === true || policyInfo.united === 'true'
                   || (policyInfo.agent || '').toLowerCase().includes('maureen');
        const agencyName  = isUIG ? 'United Insurance Group LLC'  : 'Vanguard Insurance Group LLC';
        const agencyShort = isUIG ? 'UIG Agency'                  : 'VIG Agency';
        const agencyEmail = isUIG ? 'contact@uigagency.com'       : 'contact@vigagency.com';
        const agencyPass  = isUIG ? 'Jacob2007'                   : (process.env.GODADDY_PASSWORD || '25nickc124!');
        const agencyPhone = isUIG ? '(866) 628-9441'              : '(866) 628-9441';

        // ── 2. Always build overlaid PDF from the DB COI + cert holder + date ──
        // (server-side overlay matches exactly what the CRM browser does)
        const coiDocs   = pdata.coiDocuments || [];
        const latestCOI = coiDocs.length ? coiDocs[coiDocs.length - 1] : null;
        if (!latestCOI || !latestCOI.dataUrl) {
            db.close();
            return res.status(404).json({
                error: 'No COI available for this policy. Please contact your agent to generate one first.'
            });
        }
        const [, b64raw] = latestCOI.dataUrl.includes(',')
            ? latestCOI.dataUrl.split(',') : ['', latestCOI.dataUrl];
        const coiImgBuffer = Buffer.from(b64raw, 'base64');

        // Build cert holder text lines (same as CRM overlay)
        let holderLines = [];
        if (certificateHolder) {
            const h = typeof certificateHolder === 'string'
                ? { name: certificateHolder } : certificateHolder;
            if (h.name)    holderLines.push(h.name);
            if (h.company) holderLines.push(h.company);
            if (h.address) holderLines.push(h.address);
            const csz = [h.city, h.state, h.zip].filter(Boolean).join(', ');
            if (csz) holderLines.push(csz);
        }
        // For "myself" use insured name
        if (holderLines.length === 0 && requestType === 'myself') {
            holderLines = [insuredName];
        }

        // COI image canvas size (standard ACORD 795×1029)
        const IMG_W = 795, IMG_H = 1029;

        // Build PDF with pdfkit — page matches image pixel dimensions (points ≈ pixels here)
        const attachBuffer = await new Promise((resolve, reject) => {
            const PDFDocument = require('pdfkit');
            const chunks = [];
            const doc = new PDFDocument({ size: [IMG_W, IMG_H], margin: 0, autoFirstPage: true });
            doc.on('data', c => chunks.push(c));
            doc.on('end',  () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Background: the COI image fills the page
            doc.image(coiImgBuffer, 0, 0, { width: IMG_W, height: IMG_H });

            // Date overlay — top right (x=695, y=57.5 on 795×1029 canvas, same as CRM)
            const today = new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York' });
            doc.font('Helvetica').fontSize(9).fillColor('#000000');
            doc.text(today, 695, 50, { lineBreak: false });

            // Cert holder overlay — bottom left (x=50, y=900, 14px, 20px line spacing)
            doc.font('Helvetica').fontSize(10.5).fillColor('#000000');
            holderLines.forEach((line, i) => {
                doc.text(line.trim(), 50, 900 + i * 15, { lineBreak: false });
            });

            doc.end();
        });

        const attachMime = 'application/pdf';
        const attachName = `COI_${policyNumber}_${Date.now()}.pdf`;

        // ── 3. Build recipient list ─────────────────────────────────────
        // Support both JSON body and form-data `to` field
        let toAddresses = [];
        const toField = req.body.to || '';
        if (requestType === 'myself') {
            toAddresses = [req.portalUser.email];
        } else if (toField) {
            toAddresses = toField.split(',').map(e => e.trim()).filter(Boolean);
        } else {
            toAddresses = (Array.isArray(recipientEmails) ? recipientEmails : [])
                .map(e => e.trim()).filter(Boolean);
        }
        if (requestType !== 'myself' && toAddresses.length === 0) {
            db.close();
            return res.status(400).json({ error: 'recipientEmails is required for third_party requests' });
        }

        // ── 4. Build email subject + body ───────────────────────────────
        const emailSubject = req.body.subject
            || `Certificate of Insurance – ${insuredName} – Policy ${policyNumber}`;

        let holderBlock = '';
        if (certificateHolder && certificateHolder.name) {
            const h = certificateHolder;
            holderBlock = `
<tr><td colspan="2" style="padding-top:16px;font-weight:bold;color:#1a365d;">Certificate Holder</td></tr>
<tr><td>Name</td><td>${h.name || ''}</td></tr>
${h.company  ? `<tr><td>Company</td><td>${h.company}</td></tr>` : ''}
${h.address  ? `<tr><td>Address</td><td>${h.address}</td></tr>` : ''}
${h.city||h.state||h.zip ? `<tr><td>City/State/Zip</td><td>${[h.city,h.state,h.zip].filter(Boolean).join(', ')}</td></tr>` : ''}`;
        }

        const plainText = (req.body.message || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
            || `Dear Certificate Holder,\n\nPlease find your Certificate of Insurance attached.\n\nInsured: ${insuredName}\nPolicy: ${policyNumber}\nCarrier: ${policyInfo.carrier || ''}\n\n${agencyName}`;

        const htmlBody = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:#1a365d;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0;">
    <h2 style="margin:0;">Certificate of Insurance</h2>
    <p style="margin:4px 0 0;opacity:.85;">${agencyName}</p>
  </div>
  <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 8px 8px;">
    <p>Please find your Certificate of Insurance attached.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="width:140px;color:#666;padding:4px 0;">Insured</td><td><strong>${insuredName}</strong></td></tr>
      <tr><td style="color:#666;padding:4px 0;">Policy Number</td><td>${policyNumber}</td></tr>
      <tr><td style="color:#666;padding:4px 0;">Carrier</td><td>${policyInfo.carrier || ''}</td></tr>
      <tr><td style="color:#666;padding:4px 0;">Effective</td><td>${policyInfo.effectiveDate || ''}</td></tr>
      <tr><td style="color:#666;padding:4px 0;">Expiration</td><td>${policyInfo.expirationDate || ''}</td></tr>
      ${holderBlock}
    </table>
    ${additionalNotes ? `<p style="margin-top:16px;"><strong>Notes:</strong> ${additionalNotes}</p>` : ''}
    <hr style="margin:20px 0;border:none;border-top:1px solid #e2e8f0;">
    <p style="font-size:12px;color:#666;">${agencyName} · ${agencyPhone} · ${agencyEmail}</p>
  </div>
</div>`;

        // ── 5. Send email via GoDaddy SMTP ──────────────────────────────
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            host   : 'smtpout.secureserver.net',
            port   : 465,
            secure : true,
            auth   : {
                user : agencyEmail,
                pass : agencyPass
            }
        });

        await transporter.sendMail({
            from        : `"${agencyShort}" <${agencyEmail}>`,
            to          : toAddresses.join(', '),
            subject     : emailSubject,
            text        : plainText,
            html        : htmlBody,
            attachments : [{
                filename    : attachName,
                content     : attachBuffer,
                contentType : attachMime,
            }],
        });

        // ── 6. Log the completed request ────────────────────────────────
        const reqId = 'COIREQ-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
        await new Promise((resolve) => {
            db.run(
                `INSERT INTO portal_coi_requests
                 (id, client_id, policy_id, policy_number, request_type,
                  recipient_emails, certificate_holder, additional_notes, status)
                 VALUES (?,?,?,?,?,?,?,?,'completed')`,
                [
                    reqId,
                    req.portalUser.sub,
                    policyId,
                    policyNumber,
                    requestType,
                    JSON.stringify(toAddresses),
                    certificateHolder ? JSON.stringify(certificateHolder) : '',
                    additionalNotes,
                ],
                resolve
            );
        });

        db.close();
        res.status(200).json({
            requestId  : reqId,
            status     : 'sent',
            sentTo     : toAddresses,
            message    : `Certificate of Insurance sent successfully to ${toAddresses.join(', ')}`,
        });

    } catch (err) {
        db.close();
        console.error('COI request error:', err);
        res.status(500).json({ error: 'Failed to send COI. Please try again or contact your agent.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED: GET /api/portal/coi/requests
// List this client's COI requests with status
// ─────────────────────────────────────────────────────────────────────────────
router.get('/coi/requests', requirePortalAuth, (req, res) => {
    const db = getDb();
    db.all(
        `SELECT * FROM portal_coi_requests WHERE client_id=? ORDER BY submitted_at DESC`,
        [req.portalUser.sub],
        (err, rows) => {
            db.close();
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({
                requests: (rows || []).map(r => ({
                    requestId          : r.id,
                    policyId           : r.policy_id,
                    policyNumber       : r.policy_number,
                    requestType        : r.request_type,
                    recipientEmails    : JSON.parse(r.recipient_emails || '[]'),
                    certificateHolder  : r.certificate_holder ? JSON.parse(r.certificate_holder) : null,
                    additionalNotes    : r.additional_notes,
                    status             : r.status,
                    submittedAt        : r.submitted_at,
                    completedAt        : r.completed_at || null,
                    agentNotes         : r.agent_notes  || '',
                })),
            });
        }
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: POST /api/portal/admin/set-client-password
// Set or change a portal password from the CRM agent UI.
// Updates both portal_users (bcrypt hash) and clients.data.portalPassword (plain text).
// Body: { clientId, email, password }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/crm/set-password', (req, res) => {
    const { clientId, email, password } = req.body || {};
    if (!clientId || !email || !password)
        return res.status(400).json({ error: 'clientId, email, and password are required' });
    if (password.length < 8)
        return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const db = getDb();
    const rawId = String(clientId).replace(/\.0$/, '');
    const dotId = rawId + '.0';

    // Verify client exists (try both id forms)
    db.get('SELECT id FROM clients WHERE id=? OR id=?', [rawId, dotId], (cErr, client) => {
        if (cErr) { db.close(); return res.status(500).json({ error: 'Database error' }); }
        if (!client) { db.close(); return res.status(404).json({ error: 'Client not found in CRM' }); }

        bcrypt.hash(password, 10, (hashErr, hash) => {
            if (hashErr) { db.close(); return res.status(500).json({ error: 'Server error' }); }

            const puId = 'PU-' + Date.now();
            db.run(
                `INSERT INTO portal_users (id, client_id, email, password_hash)
                 VALUES (?, ?, LOWER(?), ?)
                 ON CONFLICT(LOWER(email)) DO UPDATE SET
                     password_hash = excluded.password_hash,
                     client_id     = excluded.client_id`,
                [puId, client.id, email, hash],
                (iErr) => {
                    if (iErr) { db.close(); return res.status(500).json({ error: iErr.message }); }
                    syncPortalPasswordToCRM(db, client.id, password);
                    db.close();
                    res.json({ success: true, message: 'Password updated' });
                }
            );
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: POST /api/portal/admin/users
// Create a portal account for a CRM client.
// password is optional — omit it to create an unactivated account that
// triggers PASSWORD_NOT_SET on login, prompting the client to set up their
// own password via POST /setup-password.
//
// Body: { clientId, email, password? }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/admin/users', (req, res) => {
    const { clientId, email, password } = req.body || {};
    if (!clientId || !email)
        return res.status(400).json({ error: 'clientId and email are required' });
    if (password && password.length < 8)
        return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const id = 'PU-' + Date.now();

    function saveUser(hash) {
        const db = getDb();
        db.get('SELECT id FROM clients WHERE id=?', [clientId], (cErr, client) => {
            if (!client) { db.close(); return res.status(404).json({ error: 'Client not found in CRM' }); }
            db.run(
                `INSERT INTO portal_users (id, client_id, email, password_hash)
                 VALUES (?, ?, LOWER(?), ?)
                 ON CONFLICT(LOWER(email)) DO UPDATE SET
                     password_hash = COALESCE(excluded.password_hash, password_hash),
                     client_id     = excluded.client_id`,
                [id, clientId, email, hash || null],
                (e) => {
                    if (e) { db.close(); return res.status(500).json({ error: e.message }); }
                    if (hash) syncPortalPasswordToCRM(db, clientId, password); // store plain text so agents can view it
                    db.close();
                    res.status(201).json({
                        id, clientId,
                        email        : email.toLowerCase(),
                        passwordSet  : !!hash,
                        message      : hash
                            ? 'Portal user created with password. Client can log in immediately.'
                            : 'Portal account created without password. Client will be prompted to set one on first login.',
                    });
                }
            );
        });
    }

    if (password) {
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) return res.status(500).json({ error: 'Server error' });
            saveUser(hash);
        });
    } else {
        saveUser(null);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: GET /api/portal/admin/users — list all portal users
// ─────────────────────────────────────────────────────────────────────────────
router.get('/admin/users', (req, res) => {
    const db = getDb();
    db.all(
        `SELECT pu.id, pu.client_id, pu.email, pu.created_at, pu.last_login,
                json_extract(c.data, '$.name') AS client_name
         FROM portal_users pu
         LEFT JOIN clients c ON c.id = pu.client_id
         ORDER BY pu.created_at DESC`,
        (err, rows) => {
            db.close();
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ users: rows || [] });
        }
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: DELETE /api/portal/admin/users/:id — revoke portal access
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/admin/users/:id', (req, res) => {
    const db = getDb();
    db.run('DELETE FROM portal_users WHERE id=?', [req.params.id], function(err) {
        db.close();
        if (err) return res.status(500).json({ error: 'Database error' });
        if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'Portal access revoked' });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: POST /api/portal/admin/certificate-holders
// Seed a global certificate holder available to all clients
// ─────────────────────────────────────────────────────────────────────────────
router.post('/admin/certificate-holders', (req, res) => {
    const { name, company, address, city, state, zip } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name is required' });

    const id = 'GCH-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    const db = getDb();
    db.run(
        `INSERT INTO portal_certificate_holders
         (id, client_id, name, company, address, city, state, zip, is_global)
         VALUES (?,NULL,?,?,?,?,?,?,1)`,
        [id, name, company||'', address||'', city||'', state||'', zip||''],
        (err) => {
            db.close();
            if (err) return res.status(500).json({ error: 'Failed to save' });
            res.status(201).json({ id, name, company, address, city, state, zip, isGlobal: true });
        }
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: GET /api/portal/admin/coi-requests — view pending requests from app
// ─────────────────────────────────────────────────────────────────────────────
router.get('/admin/coi-requests', (req, res) => {
    const db = getDb();
    db.all(
        `SELECT r.*,
                json_extract(c.data, '$.name') AS client_name,
                json_extract(c.data, '$.email') AS client_email,
                json_extract(c.data, '$.phone') AS client_phone
         FROM portal_coi_requests r
         LEFT JOIN clients c ON c.id = r.client_id
         ORDER BY r.submitted_at DESC`,
        (err, rows) => {
            db.close();
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({
                requests: (rows || []).map(r => ({
                    ...r,
                    recipientEmails   : JSON.parse(r.recipient_emails   || '[]'),
                    certificateHolder : r.certificate_holder ? JSON.parse(r.certificate_holder) : null,
                })),
            });
        }
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: PUT /api/portal/admin/coi-requests/:id — update status / add notes
// Body: { status: 'completed'|'in_progress'|'cancelled', agentNotes: '' }
// ─────────────────────────────────────────────────────────────────────────────
router.put('/admin/coi-requests/:id', (req, res) => {
    const { status, agentNotes } = req.body || {};
    const db = getDb();
    const completedAt = (status === 'completed') ? new Date().toISOString() : null;
    db.run(
        `UPDATE portal_coi_requests
         SET status=COALESCE(?,status), agent_notes=COALESCE(?,agent_notes),
             completed_at=COALESCE(?,completed_at)
         WHERE id=?`,
        [status||null, agentNotes||null, completedAt, req.params.id],
        function(err) {
            db.close();
            if (err) return res.status(500).json({ error: 'Database error' });
            if (this.changes === 0) return res.status(404).json({ error: 'Request not found' });
            res.json({ message: 'Updated', id: req.params.id, status });
        }
    );
});

module.exports = router;
