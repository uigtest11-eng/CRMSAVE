'use strict';
// One-off backfill: pull Jun–Sep 2026 from Motus dataset (c5y8-a4uz)
// These months were skipped by the main sync because localMax was already Oct 2026

const https   = require('https');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH     = '/var/www/vanguard/DB-V3.db';
const SOCRATA_URL = 'https://data.transportation.gov/resource/c5y8-a4uz.json';
const PAGE_SIZE   = 50000;

const FORM_TO_COVERAGE = {
    '91X': 'BIPD/Primary', '91': 'BIPD', '82': 'BIPD', '35': 'BIPD/Primary',
    '34':  'CARGO',        '83': 'CARGO','84': 'SURETY','85': 'TRUST FUND',
};

function httpGet(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { headers: { Accept: 'application/json' } }, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
        });
        req.on('error', reject);
        req.setTimeout(90000, () => { req.destroy(); reject(new Error('timeout')); });
    });
}

async function fetchMonth(mm, yyyy) {
    const records = [];
    let offset = 0;
    while (true) {
        const url = `${SOCRATA_URL}?$where=effective_date+LIKE+'${yyyy}${mm}__'&$limit=${PAGE_SIZE}&$offset=${offset}`;
        const batch = await httpGet(url);
        if (!Array.isArray(batch) || !batch.length) break;
        records.push(...batch);
        if (batch.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
    }
    return records;
}

async function run() {
    const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE);
    const dbRun = (sql, p = []) => new Promise((res, rej) =>
        db.run(sql, p, function(e) { e ? rej(e) : res(this); })
    );

    await dbRun('PRAGMA journal_mode=WAL');
    await dbRun('PRAGMA busy_timeout=30000');

    const months = [['06','2026'],['07','2026'],['08','2026'],['09','2026']];
    let totalInserted = 0;

    for (const [mm, yyyy] of months) {
        console.log(`\nFetching ${yyyy}-${mm}...`);
        const records = await fetchMonth(mm, yyyy);
        console.log(`  Fetched ${records.length} records from Motus`);

        const stmt = db.prepare(`
            INSERT INTO insurance_policies
                (DOT_NUMBER, MC_NUMBER, FORM_CODE, COVERAGE_TYPE, INSURANCE_COMPANY,
                 POLICY_NUMBER, POLICY_EFFECTIVE_DATE, COVERAGE_AMOUNT)
            SELECT ?,?,?,?,?,?,?,?
            WHERE NOT EXISTS (
                SELECT 1 FROM insurance_policies
                WHERE MC_NUMBER=? AND FORM_CODE=? AND POLICY_EFFECTIVE_DATE=? AND POLICY_NUMBER=?
            )
        `);

        await dbRun('BEGIN');
        let inserted = 0, skipped = 0;

        for (const r of records) {
            const dot = r.usdot_number;
            if (!dot) { skipped++; continue; }

            // Normalize YYYYMMDD → MM/DD/YYYY
            const raw  = r.effective_date || '';
            const date = /^\d{8}$/.test(raw)
                ? `${raw.slice(4,6)}/${raw.slice(6,8)}/${raw.slice(0,4)}`
                : raw;

            const mc  = r.docket_number          || '';
            const form = r.ins_form_code          || '';
            const cov  = FORM_TO_COVERAGE[r.ins_form_code] || r.ins_form_code || 'BIPD/Primary';
            const co   = (r.insurance_company_name || '').trim();
            const pol  = r.policy_no              || '';
            const amt  = r.max_cov_amount         || '';

            await new Promise(resolve => {
                stmt.run([dot, mc, form, cov, co, pol, date, amt, mc, form, date, pol],
                    function(err) { if (!err && this.changes > 0) inserted++; resolve(); }
                );
            });
        }

        await new Promise((res, rej) => stmt.finalize(e => e ? rej(e) : res()));
        await dbRun('COMMIT');
        totalInserted += inserted;
        console.log(`  Inserted ${inserted} new | skipped ${skipped} (no DOT)`);
    }

    console.log(`\nDONE — total inserted: ${totalInserted}`);
    db.close();
}

run().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
