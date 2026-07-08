#!/usr/bin/env node
// One-time security migration: creates users table, audit_log, encrypts Plaid tokens
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const { encryptField } = require('./crypto-utils');

const DB_PATH = path.resolve(__dirname, '../vanguard.db');
const db = new sqlite3.Database(DB_PATH);

async function migrate() {
    console.log('🔒 Starting security migration...\n');

    // ── Step 1: Create users table ──────────────────────────────────────────
    console.log('📋 Step 1: Creating users table...');
    await run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'agent',
        portal TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        active INTEGER DEFAULT 1
    )`);

    // Seed users with bcrypt-hashed passwords
    // Default passwords are hashed by bcrypt below — change these after first login!
    // IMPORTANT: Change all default passwords via the CRM settings after deployment.
    const users = [
        { username: 'grant',   password: process.env.ADMIN_INIT_PASSWORD || 'CHANGE_ME_IMMEDIATELY', role: 'admin', portal: null },
        { username: 'maureen', password: process.env.ADMIN_INIT_PASSWORD || 'CHANGE_ME_IMMEDIATELY', role: 'admin', portal: 'united' },
        { username: 'carson',  password: process.env.AGENT_INIT_PASSWORD || 'CHANGE_ME_IMMEDIATELY', role: 'agent', portal: 'vanguard' },
        { username: 'hunter',  password: process.env.AGENT_INIT_PASSWORD || 'CHANGE_ME_IMMEDIATELY', role: 'agent', portal: 'vanguard' }
    ];

    for (const u of users) {
        const existing = await get('SELECT id FROM users WHERE LOWER(username) = LOWER(?)', [u.username]);
        if (existing) {
            console.log(`   ✓ User "${u.username}" already exists, skipping`);
            continue;
        }
        const hash = await bcrypt.hash(u.password, 12);
        await run(
            'INSERT INTO users (username, password_hash, role, portal) VALUES (?, ?, ?, ?)',
            [u.username, hash, u.role, u.portal]
        );
        console.log(`   ✅ Created user "${u.username}" (${u.role})`);
    }

    // ── Step 2: Create audit_log table ──────────────────────────────────────
    console.log('\n📋 Step 2: Creating audit_log table...');
    await run(`CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER,
        username TEXT,
        action TEXT NOT NULL,
        resource TEXT,
        resource_id TEXT,
        ip_address TEXT,
        user_agent TEXT,
        details TEXT
    )`);
    await run('CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(username)');
    await run('CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp)');
    await run('CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action)');
    console.log('   ✅ audit_log table ready');

    // ── Step 3: Encrypt Plaid tokens ────────────────────────────────────────
    console.log('\n📋 Step 3: Encrypting Plaid access tokens...');
    if (!process.env.PLAID_ENCRYPTION_KEY) {
        console.log('   ⚠️  PLAID_ENCRYPTION_KEY not set — skipping encryption');
    } else {
        const rows = await all('SELECT id, access_token FROM plaid_connections');
        let encrypted = 0;
        for (const row of rows) {
            if (!row.access_token || row.access_token.startsWith('enc:')) {
                console.log(`   ✓ Row ${row.id} already encrypted or empty, skipping`);
                continue;
            }
            const enc = encryptField(row.access_token);
            await run('UPDATE plaid_connections SET access_token = ? WHERE id = ?', [enc, row.id]);
            encrypted++;
            console.log(`   ✅ Encrypted Plaid token for row ${row.id}`);
        }
        console.log(`   Encrypted ${encrypted} token(s)`);
    }

    // ── Done ────────────────────────────────────────────────────────────────
    console.log('\n🔒 Security migration complete!');
    console.log('\n⚡ Next steps:');
    console.log('   1. Add JWT_SECRET and PLAID_ENCRYPTION_KEY to .env');
    console.log('   2. Add GODADDY_VIG_PASSWORD and GODADDY_UIG_PASSWORD to .env');
    console.log('   3. Restart the backend: pm2 restart vanguard-backend');
    console.log('   4. Change default passwords for carson, hunter, maureen ASAP\n');

    db.close();
}

// Promisified helpers
function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err);
    db.close();
    process.exit(1);
});
