'use strict';
// ═══════════════════════════════════════════════════════════════════════════
// FMCSA Insurance Data Sync Service
// Source: data.transportation.gov  Dataset: ypjt-5ydn  (Insur All With History)
//
// Strategy: FMCSA bulk-replaces the entire dataset on each publish (all rows
// share the same :updated_at), so incremental sync via :updated_at is useless.
// Instead we:
//   1. Compare the Socrata total count vs our local count.
//   2. If counts differ, pull records for months where our local count is lower
//      than Socrata's — starting from the month AFTER our local max effective_date.
//   3. Insert any missing records.
// This is cheap (~1-2k records per sync once caught up) and accurate.
// ═══════════════════════════════════════════════════════════════════════════

const https   = require('https');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH     = '/var/www/vanguard/DB-V3.db';
const SOCRATA_URL = 'https://data.transportation.gov/resource/c5y8-a4uz.json';
const PAGE_SIZE   = 50000;
const SQL_CHUNK   = 499; // SQLite max 999 vars; keep well under

// Form code → human-readable coverage type (matches existing DB values)
// Motus dataset (c5y8-a4uz) prefixes codes with "BMC-"; both forms are mapped here
const FORM_TO_COVERAGE = {
    '91X'    : 'BIPD/Primary',
    '91'     : 'BIPD',
    '82'     : 'BIPD',
    '35'     : 'BIPD/Primary',
    '34'     : 'CARGO',
    '83'     : 'CARGO',
    '84'     : 'SURETY',
    '85'     : 'TRUST FUND',
    'BMC-91X': 'BIPD/Primary',
    'BMC-91' : 'BIPD',
    'BMC-82' : 'BIPD',
    'BMC-35' : 'BIPD/Primary',
    'BMC-34' : 'CARGO',
    'BMC-83' : 'CARGO',
    'BMC-84' : 'SURETY',
    'BMC-85' : 'TRUST FUND',
};

// ── HTTP helper ───────────────────────────────────────────────────────────────
function httpGet(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
            let raw = '';
            res.on('data', c => raw += c);
            res.on('end', () => {
                try { resolve(JSON.parse(raw)); }
                catch (e) { reject(new Error(`JSON parse error: ${e.message} — body: ${raw.slice(0, 200)}`)); }
            });
        });
        req.on('error', reject);
        req.setTimeout(90000, () => { req.destroy(); reject(new Error('HTTPS request timeout')); });
    });
}

// ── SQLite helpers ────────────────────────────────────────────────────────────
function openDb() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE, err =>
            err ? reject(err) : resolve(db)
        );
    });
}
const dbRun = (db, sql, p = []) => new Promise((res, rej) =>
    db.run(sql, p, function(e) { e ? rej(e) : res(this); })
);
const dbGet = (db, sql, p = []) => new Promise((res, rej) =>
    db.get(sql, p, (e, r) => e ? rej(e) : res(r))
);
const dbAll = (db, sql, p = []) => new Promise((res, rej) =>
    db.all(sql, p, (e, r) => e ? rej(e) : res(r))
);

// ── Sync log table ────────────────────────────────────────────────────────────
async function ensureSyncTable(db) {
    await dbRun(db, `
        CREATE TABLE IF NOT EXISTS fmcsa_sync_log (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            sync_started_at   TEXT NOT NULL,
            sync_completed_at TEXT,
            records_fetched   INTEGER DEFAULT 0,
            records_inserted  INTEGER DEFAULT 0,
            records_skipped   INTEGER DEFAULT 0,
            months_synced     TEXT,
            status            TEXT DEFAULT 'running',
            error             TEXT
        )
    `);
}

// ── Socrata helpers ───────────────────────────────────────────────────────────
async function getSocrataCount() {
    const data = await httpGet(`${SOCRATA_URL}?$select=count(*)`);
    return parseInt(data[0]?.count || '0', 10);
}

// Count Socrata records for a given MM/YYYY (e.g. '06', '2026')
// New dataset (c5y8-a4uz) uses YYYYMMDD date format — filter is LIKE '${yyyy}${mm}__'
async function getSocrataMonthCount(mm, yyyy, appToken) {
    const tokenParam = appToken ? `&$$app_token=${encodeURIComponent(appToken)}` : '';
    const url = `${SOCRATA_URL}?$select=count(*)&$where=${encodeURIComponent(`effective_date LIKE '${yyyy}${mm}__'`)}${tokenParam}`;
    const data = await httpGet(url);
    return parseInt(data[0]?.count || '0', 10);
}

// Fetch all records for a given MM/YYYY from Socrata (paginated)
async function fetchSocrataMonth(mm, yyyy, appToken) {
    const records = [];
    let offset = 0;
    while (true) {
        const tokenParam = appToken ? `&$$app_token=${encodeURIComponent(appToken)}` : '';
        const url = `${SOCRATA_URL}?$where=${encodeURIComponent(`effective_date LIKE '${yyyy}${mm}__'`)}&$limit=${PAGE_SIZE}&$offset=${offset}${tokenParam}`;
        const batch = await httpGet(url);
        if (!Array.isArray(batch) || !batch.length) break;
        records.push(...batch);
        if (batch.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
    }
    return records;
}

// ── Local DB helpers ──────────────────────────────────────────────────────────
async function getLocalCount(db) {
    const row = await dbGet(db, 'SELECT COUNT(*) AS cnt FROM insurance_policies');
    return row?.cnt || 0;
}

// Get local count for a MM/YYYY month
async function getLocalMonthCount(db, mm, yyyy) {
    const row = await dbGet(db,
        `SELECT COUNT(*) AS cnt FROM insurance_policies
         WHERE POLICY_EFFECTIVE_DATE LIKE ?`,
        [`${mm}/__/${yyyy}`]
    );
    return row?.cnt || 0;
}

// Get the max effective year-month present in local DB
async function getLocalMaxYearMonth(db) {
    // Returns { year: 2026, month: 5 } or null
    const row = await dbGet(db,
        `SELECT substr(POLICY_EFFECTIVE_DATE,7,4) AS yr,
                CAST(substr(POLICY_EFFECTIVE_DATE,1,2) AS INTEGER) AS mo
         FROM insurance_policies
         WHERE length(POLICY_EFFECTIVE_DATE) = 10
         ORDER BY yr DESC, mo DESC
         LIMIT 1`
    );
    if (!row) return null;
    return { year: parseInt(row.yr), month: parseInt(row.mo) };
}

// ── DOT number lookup (chunked to stay under SQLite 999-var limit) ────────────
async function buildDotLookup(db, mcNumbers) {
    if (!mcNumbers.length) return {};
    const map = {};
    for (let i = 0; i < mcNumbers.length; i += SQL_CHUNK) {
        const chunk = mcNumbers.slice(i, i + SQL_CHUNK);
        const ph = chunk.map(() => '?').join(',');
        const rows = await dbAll(db,
            `SELECT DOCKET1PREFIX || DOCKET1 AS mc_num, DOT_NUMBER
             FROM carriers WHERE DOCKET1PREFIX || DOCKET1 IN (${ph})`,
            chunk
        );
        rows.forEach(r => { if (r.DOT_NUMBER) map[r.mc_num] = r.DOT_NUMBER; });
    }
    return map;
}

// ── Insert new policies (skip if already present by MC+form+date+policy) ─────
async function insertPolicies(db, policies) {
    if (!policies.length) return 0;
    let inserted = 0;
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
    await dbRun(db, 'BEGIN');
    for (const p of policies) {
        await new Promise(resolve => {
            stmt.run(
                [p.dot, p.mc, p.form, p.cov, p.co, p.polNo, p.date, p.amt,
                 p.mc, p.form, p.date, p.polNo],
                function(err) { if (!err && this.changes > 0) inserted++; resolve(); }
            );
        });
    }
    await new Promise((res, rej) => stmt.finalize(e => e ? rej(e) : res()));
    await dbRun(db, 'COMMIT');
    return inserted;
}

// ── Cache invalidation signal ─────────────────────────────────────────────────
function invalidateMarketCache() {
    if (typeof global._mktIntelCacheInvalidate === 'function') {
        global._mktIntelCacheInvalidate();
    }
}

// ── Main sync ─────────────────────────────────────────────────────────────────
async function sync(options = {}) {
    const { onProgress, appToken, forceFullSync = false } = options;
    const db = await openDb();
    await dbRun(db, 'PRAGMA journal_mode=WAL');
    await dbRun(db, 'PRAGMA busy_timeout=30000');
    await ensureSyncTable(db);

    const logRow = await dbRun(db,
        `INSERT INTO fmcsa_sync_log (sync_started_at, status) VALUES (?,?)`,
        [new Date().toISOString(), 'running']
    );
    const logId = logRow.lastID;

    let totalFetched = 0, totalInserted = 0, totalSkipped = 0;
    const monthsSynced = [];

    try {
        // Step 1: compare counts
        const socrataTotal = await getSocrataCount();
        const localTotal   = await getLocalCount(db);
        console.log(`[FMCSA Sync] Socrata: ${socrataTotal.toLocaleString()}  Local: ${localTotal.toLocaleString()}  Delta: ${socrataTotal - localTotal}`);

        if (socrataTotal <= localTotal && !forceFullSync) {
            console.log('[FMCSA Sync] Local DB is up to date — nothing to do');
            await dbRun(db,
                `UPDATE fmcsa_sync_log SET sync_completed_at=?,records_fetched=0,records_inserted=0,months_synced='none',status='completed' WHERE id=?`,
                [new Date().toISOString(), logId]
            );
            db.close();
            return { success: true, totalFetched: 0, totalInserted: 0, message: 'Already up to date' };
        }

        // Step 2: determine months to check — from month after our local max up to current month
        const localMax = await getLocalMaxYearMonth(db);
        const now = new Date();
        // Start from the month after our local max (or 6 months ago if no max)
        const startYear  = localMax ? localMax.year  : now.getFullYear();
        const startMonth = localMax ? localMax.month : now.getMonth() - 5; // getMonth is 0-based

        const monthsToCheck = [];
        let y = startYear, m = startMonth;
        // Include current local max month (might be partial) + all months up to 2 years ahead
        // (new dataset has future-effective policies filed through 2027-2028)
        const endYear = now.getFullYear() + 2;
        while (y < endYear || (y === endYear && m <= 12)) {
            monthsToCheck.push({ y, m: m < 1 ? 1 : m });
            m++;
            if (m > 12) { m = 1; y++; }
            if (monthsToCheck.length > 36) break; // safety cap
        }

        console.log(`[FMCSA Sync] Checking ${monthsToCheck.length} months from ${startYear}-${String(startMonth).padStart(2,'0')}`);

        // Step 3: for each month, compare counts and pull if different
        for (const { y: yr, m: mo } of monthsToCheck) {
            const mm   = String(mo).padStart(2, '0');
            const yyyy = String(yr);

            const [socrataCount, localCount] = await Promise.all([
                getSocrataMonthCount(mm, yyyy, appToken),
                getLocalMonthCount(db, mm, yyyy)
            ]);

            if (socrataCount === 0) continue;
            if (socrataCount <= localCount && !forceFullSync) {
                console.log(`[FMCSA Sync] ${yyyy}-${mm}: ${localCount} local / ${socrataCount} socrata — skip`);
                continue;
            }

            console.log(`[FMCSA Sync] ${yyyy}-${mm}: ${localCount} local / ${socrataCount} socrata — syncing ${socrataCount - localCount} new`);

            const records = await fetchSocrataMonth(mm, yyyy, appToken);
            totalFetched += records.length;

            // New dataset (c5y8-a4uz) includes usdot_number directly — no DB join needed
            const policies = [];
            for (const r of records) {
                const dot = r.usdot_number;
                if (!dot) { totalSkipped++; continue; }
                // Normalize date: YYYYMMDD → MM/DD/YYYY to match existing DB format
                const rawDate = r.effective_date || '';
                const date = /^\d{8}$/.test(rawDate)
                    ? `${rawDate.slice(4,6)}/${rawDate.slice(6,8)}/${rawDate.slice(0,4)}`
                    : rawDate;
                policies.push({
                    dot,
                    mc    : r.docket_number          || '',
                    form  : r.ins_form_code           || '',
                    cov   : FORM_TO_COVERAGE[r.ins_form_code] || r.ins_form_code || 'BIPD/Primary',
                    co    : (r.insurance_company_name || '').trim(),
                    polNo : r.policy_no               || '',
                    date,
                    amt   : r.max_cov_amount          || '',
                });
            }

            const inserted = await insertPolicies(db, policies);
            totalInserted += inserted;
            monthsSynced.push(`${yyyy}-${mm}(+${inserted})`);

            if (onProgress) onProgress({ month: `${yyyy}-${mm}`, totalFetched, totalInserted, totalSkipped });
        }

        await dbRun(db,
            `UPDATE fmcsa_sync_log
             SET sync_completed_at=?,records_fetched=?,records_inserted=?,records_skipped=?,months_synced=?,status='completed'
             WHERE id=?`,
            [new Date().toISOString(), totalFetched, totalInserted, totalSkipped, monthsSynced.join(', ') || 'none', logId]
        );

        if (totalInserted > 0) invalidateMarketCache();

        console.log(`[FMCSA Sync] Done — fetched=${totalFetched} inserted=${totalInserted} skipped=${totalSkipped}`);
        return { success: true, totalFetched, totalInserted, totalSkipped, monthsSynced };

    } catch (err) {
        console.error('[FMCSA Sync] Error:', err.message);
        await dbRun(db, `UPDATE fmcsa_sync_log SET status='error',error=? WHERE id=?`, [err.message, logId]);
        throw err;
    } finally {
        db.close();
    }
}

// ── Status ────────────────────────────────────────────────────────────────────
async function getStatus() {
    const db = await openDb();
    try {
        await ensureSyncTable(db);
        return await dbAll(db, `SELECT * FROM fmcsa_sync_log ORDER BY id DESC LIMIT 10`);
    } finally {
        db.close();
    }
}

module.exports = { sync, getStatus };
