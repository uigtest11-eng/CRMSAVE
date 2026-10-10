'use strict';
// ═══════════════════════════════════════════════════════════════════════════
// INSURANCE MARKET INTELLIGENCE  — stock-terminal dashboard
// Data: FMCSA DB-V3  |  Backend: /api/market/intelligence
// ═══════════════════════════════════════════════════════════════════════════

window.mktIntel = (function () {

    // ── Carrier color palette (20 distinct colors) ───────────────────────────
    const PALETTE = [
        '#3b82f6','#ef4444','#22c55e','#f59e0b','#8b5cf6',
        '#06b6d4','#f97316','#ec4899','#a3e635','#14b8a6',
        '#818cf8','#fb923c','#4ade80','#60a5fa','#f87171',
        '#c084fc','#34d399','#fb7185','#a78bfa','#67e8f9'
    ];

    // ── Internal state ────────────────────────────────────────────────────────
    let _data       = null;      // last API response
    let _chart      = null;      // Chart.js instance
    let _period     = 2;         // months displayed on chart
    let _hidden     = {};        // carriers hidden from chart
    let _colorMap   = {};        // carrier → color (stable per session)
    let _moverMode  = 'gainers'; // 'gainers' | 'losers'
    let _wlSort     = null;      // null=volume desc, 'desc'=YoY high→low, 'asc'=YoY low→high

    // ── Helpers ───────────────────────────────────────────────────────────────
    function color(name) {
        if (!_colorMap[name]) {
            const idx = Object.keys(_colorMap).length % PALETTE.length;
            _colorMap[name] = PALETTE[idx];
        }
        return _colorMap[name];
    }

    // Safe carrier name for use inside HTML attribute onclick values
    // JSON.stringify produces "name", replace " with &quot; so it survives HTML attr parsing
    function attr(name) {
        return JSON.stringify(name).replace(/"/g, '&quot;');
    }

    // Shorten carrier names for compact displays
    function short(name, maxLen) {
        if (!name) return '';
        maxLen = maxLen || 22;
        // Strip boilerplate suffixes
        let s = name
            .replace(/\s*(INSURANCE COMPANY|INSURANCE CO\.|INSURANCE CO|INSURANCE|COMPANY|CO\.,|CO\.|INC\.|INC|LLC|CORPORATION|CORP\.|CORP|RRG|RISK RETENTION GROUP|GROUP|HOLDINGS|CASUALTY COMPANY|CASUALTY CO\.|CASUALTY)\b.*/i, '')
            .trim();
        if (s.length === 0) s = name; // safety
        return s.length > maxLen ? s.slice(0, maxLen - 1) + '…' : s;
    }

    function fmtChange(change, isNew) {
        if (isNew) return { text: '✦ NEW', cls: 'new' };
        if (change === null || change === undefined) return { text: '—', cls: 'flat' };
        const sign = change >= 0 ? '+' : '';
        return { text: `${sign}${change.toFixed(1)}%`, cls: change > 0 ? 'up' : change < 0 ? 'down' : 'flat' };
    }

    function fmtWeek(weekKey) {
        // "2025-W40" → "Oct 4"
        const year = parseInt(weekKey.slice(0, 4));
        const week = parseInt(weekKey.slice(6));
        const d = new Date(year, 0, 1 + week * 7);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function fmtWeekYr(weekKey) {
        // "2026-W17" → "Apr 23 '26"
        const year = parseInt(weekKey.slice(0, 4));
        const week = parseInt(weekKey.slice(6));
        const d = new Date(year, 0, 1 + week * 7);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ` '${String(year).slice(2)}`;
    }

    // Shift an array of week keys back exactly 1 year (same week number, year - 1)
    function shiftWeeksYoY(weeks) {
        return weeks.map(w => `${parseInt(w.slice(0, 4)) - 1}${w.slice(4)}`);
    }

    function slicePeriod(allWeeks, weeklyData) {
        // 1M = current calendar month to date (MTD): month start → today
        if (_period === 1) {
            const now        = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return allWeeks.filter(w => {
                const yr  = parseInt(w.slice(0, 4));
                const wkn = parseInt(w.slice(6));
                const jan1Dow    = new Date(yr, 0, 1).getDay();
                const toFirstMon = jan1Dow === 1 ? 0 : jan1Dow === 0 ? 1 : 8 - jan1Dow;
                const monDoy     = wkn === 0 ? 0 : toFirstMon + (wkn - 1) * 7;
                const monday     = new Date(yr, 0, 1 + monDoy);
                const sunday     = new Date(monday.getTime() + 6 * 86400000);
                // Keep weeks that overlap the range [monthStart, today]
                return monday <= now && sunday >= monthStart;
            });
        }

        const weeksToShow = Math.round(_period * 4.33);

        // Trim sparse trailing weeks so short periods don't land in data-poor zones
        let effectiveWeeks = allWeeks;
        if (weeklyData && allWeeks.length > weeksToShow * 2) {
            const totals = allWeeks.map(w => {
                const wd = weeklyData[w];
                return wd ? Object.values(wd).reduce((s, v) => s + v, 0) : 0;
            });
            // Use median of the first 80% as a stable reference (ignores any sparse tail)
            const refTotals = totals.slice(0, Math.floor(totals.length * 0.8)).filter(v => v > 0);
            refTotals.sort((a, b) => a - b);
            const median = refTotals.length ? refTotals[Math.floor(refTotals.length / 2)] : 1;
            const threshold = Math.max(5, median * 0.02); // 2% of typical week

            // Trim from the tail while weeks fall below threshold
            let trimEnd = allWeeks.length;
            while (trimEnd > weeksToShow + 1 && totals[trimEnd - 1] < threshold) trimEnd--;
            effectiveWeeks = allWeeks.slice(0, trimEnd);
        }

        let sliced = effectiveWeeks.slice(-weeksToShow);
        // Drop trailing weeks not yet fully elapsed — insurance filings include future-effective
        // dates so there can be multiple such weeks after the sparse trimmer cutoff.
        while (sliced.length > 0) {
            const last = sliced[sliced.length - 1];
            const yr = parseInt(last.slice(0, 4));
            const wk = parseInt(last.slice(6));
            const weekStart = new Date(yr, 0, 1 + wk * 7);
            const weekEnd   = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
            if (new Date() < weekEnd) { sliced = sliced.slice(0, -1); continue; }
            break;
        }
        return sliced;
    }

    // SVG sparkline for watchlist — forcedColor must be provided (green or red)
    function spark(values, forcedColor) {
        if (!values || values.length < 2) return '';
        if (values.filter(v => v > 0).length < 2) return '';
        const w = 78, h = 26, pad = 2;
        const max = Math.max(...values, 1);
        const min = Math.min(...values);
        const rng = max - min || 1;
        const pts = values.map((v, i) => {
            const x = (i / (values.length - 1)) * (w - pad * 2) + pad;
            const y = h - pad - ((v - min) / rng) * (h - pad * 2);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' ');
        const col = forcedColor || '#22c55e';
        return `<svg class="wl-spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polyline points="${pts}" stroke="${col}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
            <circle cx="${parseFloat(pts.split(' ').pop().split(',')[0])}" cy="${parseFloat(pts.split(' ').pop().split(',')[1])}" r="2" fill="${col}"/>
        </svg>`;
    }

    // ── Ticker strip ──────────────────────────────────────────────────────────
    function buildTicker(data) {
        const inner = document.getElementById('mkt-ticker-inner');
        if (!inner) return;

        // Compute period-specific growth: current window vs same-length prior window
        const curWeeks  = slicePeriod(data.weeks, data.weeklyData);
        const prevWeeks = shiftWeeksYoY(curWeeks);

        const items = data.topCarriers.slice(0, 18).map(name => {
            const cur  = curWeeks.reduce((s, w)  => s + ((data.weeklyData[w]  && data.weeklyData[w][name])  || 0), 0);
            const prev = prevWeeks.reduce((s, w) => s + ((data.weeklyData[w]  && data.weeklyData[w][name])  || 0), 0);
            let text, cls;
            if (prev === 0 && cur > 0) { text = '✦ NEW'; cls = 'new'; }
            else if (prev === 0)        { text = '—';     cls = 'flat'; }
            else {
                const pct = (cur - prev) / prev * 100;
                const sign = pct >= 0 ? '+' : '';
                text = `${sign}${pct.toFixed(1)}%`;
                cls  = pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat';
            }
            return `<span class="mkt-ticker-item" onclick="mktIntel.focusCarrier(${attr(name)})">
                <span class="mkt-ticker-abbr">${short(name, 16)}</span>
                <span class="mkt-ticker-count">${cur.toLocaleString()}</span>
                <span class="mkt-ticker-${cls}">${text}</span>
            </span>`;
        }).join('');

        // Duplicate for seamless loop
        inner.innerHTML = items + items;
        // ~1s per item — fast stock ticker speed
        const dur = Math.max(12, data.topCarriers.length * 1);
        inner.style.animationDuration = `${dur}s`;
    }

    // ── Summary boxes ─────────────────────────────────────────────────────────
    function buildSummary(data) {
        const el = document.getElementById('mkt-summary-stats');
        if (!el) return;

        const curWeeks  = slicePeriod(data.weeks, data.weeklyData);
        const prevWeeks = shiftWeeksYoY(curWeeks);

        const stats = data.topCarriers.map(name => {
            const cur  = curWeeks.reduce( (s, w) => s + ((data.weeklyData[w] && data.weeklyData[w][name]) || 0), 0);
            const prev = prevWeeks.reduce((s, w) => s + ((data.weeklyData[w] && data.weeklyData[w][name]) || 0), 0);
            let change = null, isNew = false;
            if (prev === 0 && cur > 0) isNew = true;
            else if (prev > 0) change = Math.round((cur - prev) / prev * 1000) / 10;
            return { name, current: cur, prior: prev, change, isNew };
        });

        const totCur = stats.reduce((s, c) => s + c.current, 0);
        const totPri = stats.reduce((s, c) => s + c.prior, 0);
        const yoy = totPri > 0 ? Math.round((totCur - totPri) / totPri * 100) : 0;
        const newCount = stats.filter(c => c.isNew).length;
        const bigGainer = stats.filter(c => !c.isNew && c.change !== null && c.change > 0)
            .sort((a, b) => b.change - a.change)[0];
        const bigLoser = stats.filter(c => !c.isNew && c.change !== null && c.change < 0)
            .sort((a, b) => a.change - b.change)[0];

        el.innerHTML = `
            <div class="mkt-stat-box blue">
                <div class="mkt-stat-val">${totCur.toLocaleString()}</div>
                <div class="mkt-stat-lbl">Active Policies</div>
            </div>
            <div class="mkt-stat-box">
                <div class="mkt-stat-val">${data.topCarriers.length}</div>
                <div class="mkt-stat-lbl">Carriers</div>
            </div>
            <div class="mkt-stat-box ${yoy >= 0 ? 'green' : 'red'}">
                <div class="mkt-stat-val">${yoy >= 0 ? '+' : ''}${yoy}%</div>
                <div class="mkt-stat-lbl">YoY Market</div>
            </div>
            <div class="mkt-stat-box amber">
                <div class="mkt-stat-val">${newCount}</div>
                <div class="mkt-stat-lbl">New Entrants</div>
            </div>
            ${bigGainer ? `<div class="mkt-stat-box green" style="grid-column:1/-1;cursor:pointer" onclick="mktIntel.focusCarrier(${attr(bigGainer.name)})">
                <div class="mkt-stat-val" style="font-size:13px;letter-spacing:0">▲ ${short(bigGainer.name, 20)}</div>
                <div class="mkt-stat-lbl">Top Gainer +${bigGainer.change.toFixed(1)}%</div>
            </div>` : ''}
            ${bigLoser ? `<div class="mkt-stat-box red" style="grid-column:1/-1;cursor:pointer" onclick="mktIntel.focusCarrier(${attr(bigLoser.name)})">
                <div class="mkt-stat-val" style="font-size:13px;letter-spacing:0">▼ ${short(bigLoser.name, 20)}</div>
                <div class="mkt-stat-lbl">Top Loser ${bigLoser.change.toFixed(1)}%</div>
            </div>` : ''}
        `;
    }

    // ── Top Movers ────────────────────────────────────────────────────────────
    function buildMovers(data, mode) {
        if (mode) _moverMode = mode;
        const el = document.getElementById('mkt-movers-list');
        if (!el || !data) return;

        document.querySelectorAll('.mkt-mover-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === _moverMode);
            if (btn.dataset.mode === 'gainers') btn.classList.toggle('gainers', true);
            if (btn.dataset.mode === 'losers')  btn.classList.toggle('losers', true);
        });

        const curWeeks  = slicePeriod(data.weeks, data.weeklyData);
        const prevWeeks = shiftWeeksYoY(curWeeks);
        const pLabel = _period <= 1 ? '1M' : _period <= 2 ? '2M' : _period <= 3 ? '3M' :
                       _period <= 6 ? '6M' : _period <= 12 ? '1Y' : _period <= 24 ? '2Y' : '3Y';

        const computed = data.topCarriers.map(name => {
            const cur  = curWeeks.reduce( (s, w) => s + ((data.weeklyData[w] && data.weeklyData[w][name]) || 0), 0);
            const prev = prevWeeks.reduce((s, w) => s + ((data.weeklyData[w] && data.weeklyData[w][name]) || 0), 0);
            let change = null, isNew = false;
            if (prev === 0 && cur > 0) { isNew = true; }
            else if (prev > 0) { change = Math.round((cur - prev) / prev * 1000) / 10; }
            return { name, cur, change, isNew };
        });

        let list = computed.filter(c => !c.isNew && c.change !== null);
        if (_moverMode === 'gainers') {
            list = list.filter(c => c.change > 0).sort((a, b) => b.change - a.change).slice(0, 6);
        } else {
            list = list.filter(c => c.change < 0).sort((a, b) => a.change - b.change).slice(0, 6);
        }

        if (!list.length) {
            el.innerHTML = `<div class="mkt-loading-placeholder">No ${_moverMode} for this period</div>`;
            return;
        }

        el.innerHTML = list.map(c => {
            const { text, cls } = fmtChange(c.change, c.isNew);
            return `<div class="mkt-mover-item" onclick="mktIntel.focusCarrier(${attr(c.name)})">
                <div style="width:3px;height:30px;border-radius:2px;background:${color(c.name)};flex-shrink:0"></div>
                <div class="mkt-mover-left">
                    <div class="mkt-mover-name" title="${c.name}">${short(c.name, 20)}</div>
                    <div class="mkt-mover-sub">${c.cur.toLocaleString()} policies (${pLabel})</div>
                </div>
                <span class="mkt-badge ${cls}">${text}</span>
            </div>`;
        }).join('');
    }

    // ── New Entrants ──────────────────────────────────────────────────────────
    function buildNewEntrants(data) {
        const el = document.getElementById('mkt-new-entrants');
        if (!el || !data) return;

        const curWeeks  = slicePeriod(data.weeks, data.weeklyData);
        const prevWeeks = shiftWeeksYoY(curWeeks);

        const entrants = data.topCarriers
            .map(name => {
                const cur  = curWeeks.reduce( (s, w) => s + ((data.weeklyData[w] && data.weeklyData[w][name]) || 0), 0);
                const prev = prevWeeks.reduce((s, w) => s + ((data.weeklyData[w] && data.weeklyData[w][name]) || 0), 0);
                return { name, current: cur, isNew: prev === 0 && cur > 0 };
            })
            .filter(c => c.isNew)
            .sort((a, b) => b.current - a.current);

        if (!entrants.length) {
            el.innerHTML = `<div class="mkt-loading-placeholder">No new entrants detected</div>`;
            return;
        }

        el.innerHTML = entrants.map(c => {
            // Find first month with data for this carrier
            const firstWk = data.weeks.find(w => data.weeklyData[w] && data.weeklyData[w][c.name]);
            const firstSeen = firstWk ? fmtWeek(firstWk) : '?';
            return `<div class="mkt-entrant-item" onclick="mktIntel.focusCarrier(${attr(c.name)})">
                <div class="mkt-entrant-row">
                    <div style="display:flex;align-items:center;gap:6px;min-width:0">
                        <div style="width:3px;height:22px;border-radius:2px;background:${color(c.name)};flex-shrink:0"></div>
                        <span class="mkt-entrant-name" title="${c.name}">${short(c.name, 20)}</span>
                    </div>
                    <span class="mkt-entrant-star">✦ NEW</span>
                </div>
                <div class="mkt-entrant-meta">
                    <span><i class="fas fa-calendar-plus"></i>${firstSeen}</span>
                    <span><i class="fas fa-file-alt"></i>${c.current.toLocaleString()} policies</span>
                </div>
            </div>`;
        }).join('');
    }

    // ── Main Chart ────────────────────────────────────────────────────────────
    function buildChart(data) {
        const canvas = document.getElementById('mkt-main-chart');
        const overlay = document.getElementById('mkt-chart-overlay');
        if (!canvas || !data) return;

        const weeks = slicePeriod(data.weeks, data.weeklyData);
        const labels = weeks.map(fmtWeek);

        // Only show top 12, excluding hidden
        const visible = data.topCarriers
            .filter(n => !_hidden[n])
            .slice(0, 12);

        // Prior period: same number of weeks immediately before current period
        const prevWeeks = shiftWeeksYoY(weeks);

        const datasets = visible.map(name => {
            const col     = color(name);
            const raw     = weeks.map(w => (data.weeklyData[w] && data.weeklyData[w][name]) || 0);
            const prevRaw = prevWeeks.map(w => (data.weeklyData[w] && data.weeklyData[w][name]) || 0);

            // Cumulative % vs prior period running total
            // Final point = same number as watchlist badge, smooths weekly noise
            const cumCur  = [];
            const cumPrev = [];
            const pct = raw.map((v, i) => {
                const curSum  = raw.slice(0, i + 1).reduce((s, x) => s + x, 0);
                const prevSum = prevRaw.slice(0, i + 1).reduce((s, x) => s + x, 0);
                cumCur.push(curSum);
                cumPrev.push(prevSum);
                if (prevSum === 0) return 0;
                return Math.round(((curSum - prevSum) / prevSum) * 1000) / 10;
            });

            return {
                label: name,
                data: pct,
                rawCumCur:  cumCur,
                rawCumPrev: cumPrev,
                borderColor: col,
                backgroundColor: col + '18',
                tension: 0.38,
                pointRadius: weeks.length > 30 ? 0 : 2,
                pointHoverRadius: 7,
                pointHoverBackgroundColor: col,
                pointHoverBorderColor: '#070c17',
                pointHoverBorderWidth: 2,
                borderWidth: 2,
                fill: false,
                pointBackgroundColor: col,
                pointBorderColor: '#070c17',
                pointBorderWidth: 1.5,
            };
        });

        const config = {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 500, easing: 'easeInOutQuart' },
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: false },
                    annotation: undefined,
                    tooltip: {
                        backgroundColor: '#0d1524',
                        borderColor: '#1a2540',
                        borderWidth: 1,
                        titleColor: '#64748b',
                        bodyColor: '#e2e8f0',
                        padding: 12,
                        titleFont: { size: 11, family: 'Inter' },
                        bodyFont: { size: 11, family: 'Inter' },
                        itemSort: (a, b) => b.raw - a.raw,
                        callbacks: {
                            label: (ctx) => {
                                const n    = short(ctx.dataset.label, 24);
                                const v    = ctx.raw;
                                const sign = v >= 0 ? '+' : '';
                                const isSingle = ctx.chart.data.datasets.length === 1;
                                if (isSingle) {
                                    const cur  = ctx.dataset.rawCumCur  && ctx.dataset.rawCumCur[ctx.dataIndex];
                                    const prev = ctx.dataset.rawCumPrev && ctx.dataset.rawCumPrev[ctx.dataIndex];
                                    const countStr = cur != null
                                        ? `  (${cur.toLocaleString()} vs ${prev != null ? prev.toLocaleString() : '—'} prior yr)`
                                        : '';
                                    return `  ${n}: ${sign}${v.toFixed(1)}%${countStr}`;
                                }
                                return `  ${n}: ${sign}${v.toFixed(1)}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: '#0d1524', drawBorder: false },
                        ticks: {
                            color: '#334155',
                            font: { size: 9, family: "'JetBrains Mono','Courier New',monospace" },
                            maxRotation: 0,
                            maxTicksLimit: 16
                        }
                    },
                    y: {
                        grid: {
                            color: (ctx) => ctx.tick.value === 0 ? '#334155' : '#0d1524',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#334155',
                            font: { size: 9, family: "'JetBrains Mono','Courier New',monospace" },
                            callback: (v) => `${v > 0 ? '+' : ''}${v}%`
                        }
                    }
                }
            }
        };

        if (_chart) { _chart.destroy(); _chart = null; }
        const _existing = Chart.getChart(canvas);
        if (_existing) _existing.destroy();
        _chart = new Chart(canvas, config);

        if (overlay) overlay.classList.add('hidden');
    }

    // ── Legend chips ──────────────────────────────────────────────────────────
    function buildLegend(data) {
        const el = document.getElementById('mkt-legend');
        if (!el || !data) return;
        el.innerHTML = data.topCarriers.slice(0, 14).map(name => {
            const col = color(name);
            const s = data.carrierStats[name];
            const { text, cls } = fmtChange(s.change, s.isNew);
            return `<span class="mkt-legend-chip${_hidden[name] ? ' hidden' : ''}"
                onclick="mktIntel.toggleCarrier(${attr(name)})"
                title="${name}">
                <span class="mkt-legend-dot" style="background:${col}"></span>
                ${short(name, 18)}
                <span style="opacity:0.5;font-size:9px;margin-left:2px">${text}</span>
            </span>`;
        }).join('');
    }

    // ── Watchlist table ───────────────────────────────────────────────────────
    function buildWatchlist(data) {
        const el = document.getElementById('mkt-watchlist-body');
        if (!el || !data) return;

        const curWeeks  = slicePeriod(data.weeks, data.weeklyData);
        const prevWeeks = shiftWeeksYoY(curWeeks);

        // Update column headers to show actual date ranges with years (YoY comparison)
        const pLabel = _period <= 1 ? '1M' : _period <= 2 ? '2M' : _period <= 3 ? '3M' :
                       _period <= 6 ? '6M' : _period <= 12 ? '1Y' : _period <= 24 ? '2Y' : '3Y';
        const dateRange = (weeks) => {
            if (weeks.length === 0) return pLabel;
            if (_period === 1) {
                // MTD: show "Oct '25" / "Oct '26" using the year from the first week
                const yr = parseInt(weeks[0].slice(0, 4));
                const mon = new Date().toLocaleDateString('en-US', { month: 'short' });
                return `${mon} '${String(yr).slice(2)}`;
            }
            return `${fmtWeekYr(weeks[0])} – ${fmtWeekYr(weeks[weeks.length - 1])}`;
        };
        const ths = document.querySelectorAll('.mkt-watchlist-table thead th');
        if (ths[2]) ths[2].textContent = dateRange(prevWeeks);
        if (ths[3]) ths[3].textContent = dateRange(curWeeks);
        if (ths[4]) ths[4].textContent = `YoY Δ`;

        const computed = data.topCarriers.map(name => {
            const col  = color(name);
            const cur  = curWeeks.reduce( (s, w) => s + ((data.weeklyData[w] && data.weeklyData[w][name]) || 0), 0);
            const prev = prevWeeks.reduce((s, w) => s + ((data.weeklyData[w] && data.weeklyData[w][name]) || 0), 0);

            let change = null, isNew = false;
            if (prev === 0 && cur > 0) { isNew = true; }
            else if (prev > 0) { change = Math.round((cur - prev) / prev * 1000) / 10; }

            const { text, cls } = fmtChange(change, isNew);
            const sparkVals  = curWeeks.map(w => (data.weeklyData[w] && data.weeklyData[w][name]) || 0);
            const sparkColor = isNew ? col : (change !== null && change < 0 ? '#ef4444' : col);
            const sparkSvg   = spark(sparkVals, sparkColor);

            return { name, col, cur, prev, change, isNew, text, cls, sparkSvg };
        });

        // Sort: default by current volume; YoY sort if user clicked the header
        if (_wlSort === 'desc') {
            computed.sort((a, b) => {
                const av = a.isNew ? Infinity : (a.change ?? -Infinity);
                const bv = b.isNew ? Infinity : (b.change ?? -Infinity);
                return bv - av;
            });
        } else if (_wlSort === 'asc') {
            computed.sort((a, b) => {
                const av = a.isNew ? Infinity : (a.change ?? -Infinity);
                const bv = b.isNew ? Infinity : (b.change ?? -Infinity);
                return av - bv;
            });
        } else {
            computed.sort((a, b) => b.cur - a.cur);
        }

        // Update YoY Δ header with sort indicator and click handler
        if (ths[4]) {
            const arrow = _wlSort === 'desc' ? ' ▼' : _wlSort === 'asc' ? ' ▲' : ' ⇅';
            ths[4].innerHTML = `YoY Δ<span style="opacity:0.6;font-size:9px;margin-left:3px">${arrow}</span>`;
            ths[4].style.cursor = 'pointer';
            ths[4].onclick = () => {
                _wlSort = _wlSort === 'desc' ? 'asc' : 'desc';
                buildWatchlist(_data);
            };
        }

        el.innerHTML = computed.map((r, i) => `<tr onclick="mktIntel.focusCarrier(${attr(r.name)})">
                <td style="width:28px;text-align:center;color:#334155;font-size:10px;font-family:monospace">${i + 1}</td>
                <td>
                    <div class="wl-carrier-cell">
                        <div class="wl-color-bar" style="background:${r.col}"></div>
                        <span class="wl-name" title="${r.name}">${r.name}</span>
                    </div>
                </td>
                <td class="r"><span class="wl-num">${r.prev.toLocaleString()}</span></td>
                <td class="r"><span class="wl-num">${r.cur.toLocaleString()}</span></td>
                <td class="r"><span class="wl-change-badge ${r.cls}">${r.text}</span></td>
                <td class="r wl-spark">${r.sparkSvg}</td>
                <td class="r">
                    <button class="mkt-appt-btn" onclick="event.stopPropagation();mktIntel.showAppointInfo(${attr(r.name)})">
                        <i class="fas fa-handshake"></i> APPT
                    </button>
                </td>
            </tr>`).join('');
    }

    // ── Appointment info panel ────────────────────────────────────────────────
    function showAppointInfo(name) {
        // Look up carrier stats and show a quick informational tooltip/modal
        if (!_data) return;
        const s = _data.carrierStats[name];
        const { text, cls } = fmtChange(s.change, s.isNew);
        const msg = s.isNew
            ? `${name}\n\nNew market entrant — ${s.current} policies in the past year.\nConsider reaching out for appointment.`
            : `${name}\n\nCurrent year: ${s.current} policies\nPrior year: ${s.prior} policies\nYoY Change: ${text}\n\n${s.change < 0 ? 'Market declining — opportunity to capture fleeing clients.' : 'Market growing — competitive carrier in this space.'}`;
        alert(msg); // Simple for now — can be replaced with a modal
    }

    // ── Data as of indicator + period button annotations ─────────────────────
    function buildDataAsOf(data) {
        const el = document.getElementById('mkt-data-asof');
        if (!data || !data.weeks || data.weeks.length === 0) return;

        const lastWeek = data.weeks[data.weeks.length - 1];
        const yr = parseInt(lastWeek.slice(0, 4));
        const wk = parseInt(lastWeek.slice(6));
        const lastDate = new Date(yr, 0, 1 + wk * 7);
        const dateStr = lastDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        if (el) el.textContent = `FMCSA data through: ${dateStr}`;

        // Annotate each period button with the actual date range it covers
        document.querySelectorAll('.mkt-period-btn').forEach(btn => {
            const months = parseInt(btn.dataset.months);
            if (!months) return;
            // Store original label on first run
            if (!btn.dataset.baseLabel) btn.dataset.baseLabel = btn.textContent.trim();
            if (months === 1) {
                // 1M = current month to date — label is just the month name
                const now = new Date();
                const monthLabel = now.toLocaleDateString('en-US', { month: 'short' });
                btn.innerHTML = `1M<span class="mkt-period-dates">${monthLabel} MTD</span>`;
            } else {
                const savedPeriod = _period;
                _period = months;
                const curW = slicePeriod(data.weeks, data.weeklyData);
                _period = savedPeriod;
                if (curW.length === 0) return;
                const startDate = new Date(parseInt(curW[0].slice(0,4)), 0, 1 + parseInt(curW[0].slice(6)) * 7);
                const endDate   = new Date(parseInt(curW[curW.length-1].slice(0,4)), 0, 1 + parseInt(curW[curW.length-1].slice(6)) * 7);
                const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                btn.innerHTML = `${btn.dataset.baseLabel}<span class="mkt-period-dates">${fmt(startDate)}–${fmt(endDate)}</span>`;
            }
        });
    }

    // ── Carrier group merging ────────────────────────────────────────────────
    // Carriers sharing a brand prefix are merged into one display entry
    const CARRIER_GROUPS = {
        'GEICO':       /^GEICO\b/i,
        'PROGRESSIVE': /^PROGRESSIVE\b/i,
    };

    function mergeGroups(data) {
        const entries = Object.entries(CARRIER_GROUPS);

        // 1. weeklyData: sum group members into the group key, delete individuals
        for (const wk of Object.keys(data.weeklyData || {})) {
            const wd = data.weeklyData[wk];
            for (const [groupName, pat] of entries) {
                let total = 0, found = false;
                for (const name of Object.keys(wd)) {
                    if (name !== groupName && pat.test(name)) {
                        total += wd[name];
                        delete wd[name];
                        found = true;
                    }
                }
                if (found) wd[groupName] = (wd[groupName] || 0) + total;
            }
        }

        // 2. topCarriers: replace members with group name, deduplicate, preserve order
        const seen = new Set();
        data.topCarriers = (data.topCarriers || []).reduce((acc, name) => {
            let mapped = name;
            for (const [groupName, pat] of entries) {
                if (name !== groupName && pat.test(name)) { mapped = groupName; break; }
            }
            if (!seen.has(mapped)) { seen.add(mapped); acc.push(mapped); }
            return acc;
        }, []);

        // 3. carrierStats: merge member stats into the group stat object
        for (const [groupName, pat] of entries) {
            let gs = null;
            for (const name of Object.keys(data.carrierStats || {})) {
                if (name !== groupName && pat.test(name)) {
                    const s = data.carrierStats[name];
                    if (!gs) gs = { name: groupName, current: 0, prior: 0, change: null, isNew: false };
                    gs.current += (s.current || 0);
                    gs.prior   += (s.prior   || 0);
                    delete data.carrierStats[name];
                }
            }
            if (gs) {
                gs.change = gs.prior > 0
                    ? Math.round((gs.current - gs.prior) / gs.prior * 1000) / 10
                    : null;
                gs.isNew = gs.prior === 0 && gs.current > 0;
                data.carrierStats[groupName] = gs;
            }
        }

        return data;
    }

    // ── Full render ───────────────────────────────────────────────────────────
    function renderAll(data) {
        _data = data;
        buildDataAsOf(data);
        buildTicker(data);
        buildSummary(data);
        buildMovers(data);
        buildNewEntrants(data);
        buildChart(data);
        buildLegend(data);
        buildWatchlist(data);
    }

    // ── Data fetch ────────────────────────────────────────────────────────────
    async function fetchData() {
        const stateEl   = document.getElementById('mkt-state-filter');
        const covEl     = document.getElementById('mkt-coverage-filter');
        const state     = stateEl ? stateEl.value : 'ALL';
        const coverage  = covEl ? covEl.value : 'BIPD/Primary';
        const fetchMos  = Math.max(_period * 2, 24); // always get 2x for YoY comparison

        const overlay = document.getElementById('mkt-chart-overlay');
        if (overlay) overlay.classList.remove('hidden');

        const jwt = sessionStorage.getItem('vanguard_jwt') || '';

        try {
            const url = `/api/market/intelligence?state=${encodeURIComponent(state)}&months=${fetchMos}&coverage=${encodeURIComponent(coverage)}`;
            const resp = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${jwt}`,
                    'Bypass-Tunnel-Reminder': 'true'
                }
            });
            if (!resp.ok) throw new Error(`Server returned ${resp.status}`);
            const data = await resp.json();
            renderAll(mergeGroups(data));
        } catch (err) {
            console.error('Market Intelligence fetch error:', err);
            const ov = document.getElementById('mkt-chart-overlay');
            if (ov) {
                ov.classList.remove('hidden');
                ov.innerHTML = `<i class="fas fa-exclamation-triangle" style="color:#ef4444;font-size:20px"></i>
                    <div class="mkt-overlay-text" style="color:#ef4444">Failed to load market data</div>
                    <button onclick="mktIntel.refreshData()" style="background:#1d4ed8;border:none;color:#fff;padding:6px 14px;border-radius:5px;cursor:pointer;font-size:11px;margin-top:4px">
                        <i class="fas fa-redo"></i> Retry
                    </button>`;
            }
        }
    }

    // ── Public API ────────────────────────────────────────────────────────────
    return {
        init() {
            console.log('📈 Market Intelligence init');
            _chart = null; // reset chart instance (fresh canvas)
            fetchData();
        },

        applyFilters() {
            _colorMap  = {};
            _hidden    = {};
            _chart     = null;
            _wlSort    = null;
            fetchData();
        },

        setPeriod(months) {
            _wlSort = null;
            _period = months;
            document.querySelectorAll('.mkt-period-btn').forEach(b => {
                b.classList.toggle('active', parseInt(b.dataset.months) === months);
            });
            if (_data) {
                buildChart(_data);
                buildSummary(_data);
                buildWatchlist(_data);
                buildMovers(_data);
                buildNewEntrants(_data);
                buildLegend(_data);
                buildTicker(_data);
            } else {
                fetchData();
            }
        },

        showMovers(mode) {
            buildMovers(_data, mode);
        },

        toggleCarrier(name) {
            if (_hidden[name]) delete _hidden[name];
            else _hidden[name] = true;
            if (_data) { buildChart(_data); buildLegend(_data); }
        },

        toggleAllCarriers() {
            const anyHidden = Object.keys(_hidden).length > 0;
            _hidden = {};
            if (!anyHidden && _data) {
                // Show only top 4
                _data.topCarriers.slice(4).forEach(n => { _hidden[n] = true; });
            }
            if (_data) { buildChart(_data); buildLegend(_data); }
        },

        focusCarrier(name) {
            if (!_data) return;
            const visibleCount = _data.topCarriers.filter(n => !_hidden[n]).length;
            if (visibleCount === 1 && !_hidden[name]) {
                // Already isolated — reset to all
                _hidden = {};
            } else {
                _hidden = {};
                _data.topCarriers.forEach(n => { if (n !== name) _hidden[n] = true; });
            }
            buildChart(_data);
            buildLegend(_data);
        },

        refreshData() {
            _colorMap = {};
            _hidden   = {};
            _chart    = null;
            fetchData();
        },

        showAppointInfo(name) {
            showAppointInfo(name);
        }
    };
})();

// ── Hook into existing navigation ────────────────────────────────────────────
// Override rebuildMarketTable so the nav system triggers our new init
window.rebuildMarketTable = function () {
    if (window.mktIntel) {
        window.mktIntel.init();
    }
};

console.log('📈 Market Intelligence loaded');
