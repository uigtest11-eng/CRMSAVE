// EMERGENCY: Override ALL "20 sec" durations with actual recording durations
console.log('🚨 EMERGENCY: Fixing ALL 20 sec call durations...');

// Mapping of lead IDs to actual durations (from our ffprobe analysis)
const actualDurations = {
    "8124478": "4 min 34 sec",
    "8123092": "6 min 44 sec",
    "8126258": "1 min 39 sec",
    "8126257": "51 sec",
    "8124828": "1 min 2 sec",
    "8125697": "2 min 50 sec",
    "8123122": "6 min 48 sec",
    "8125000": "3 min 24 sec",
    "8124940": "1 min 41 sec",
    "8123145": "21 min 54 sec",
    "8126147": "5 min 29 sec",
    "8126125": "5 min 9 sec",
    "8124596": "3 min 54 sec",
    "8129999": "12 min 8 sec",
    "8126168": "5 min 41 sec",
    "8129955": "1 min 21 sec",
    "8122809": "19 min 6 sec",
    "8122860": "7 min 55 sec",
    "8130246": "22 min 2 sec",
    "8125277": "15 min 2 sec",
    "8122933": "10 min 58 sec",
    "8129932": "12 min 16 sec",
    "8125728": "1 min 32 sec",
    "8129998": "3 min 47 sec",
    "8122971": "1 min 52 sec",
    "8124582": "4 min 1 sec",
    "8126102": "5 min 20 sec",
    "8126277": "57 sec",
    "8105663": "43 min 37 sec",
    "8122666": "24 min 36 sec",
    "8123150": "8 min 5 sec",
    "8125456": "8 min 55 sec"
};

// Get existing leads from localStorage
let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
let fixedCount = 0;
let totalCallLogs = 0;

leads.forEach(lead => {
    if (lead.reachOut && lead.reachOut.callLogs) {
        lead.reachOut.callLogs.forEach(log => {
            totalCallLogs++;

            // Check if this call log has a problematic duration
            if (log.duration != null && typeof log.duration !== 'string') log.duration = String(log.duration);
            const isProblem = log.duration && (
                log.duration === '20 sec' ||
                log.duration === 'Recording available' ||
                log.duration === 'Unknown' ||
                log.duration.includes('Unknown') ||
                (log.duration.includes('20 sec') && !log.duration.match(/\d{2,} min/)) // Only fix "20 sec" if it's not part of a larger time
            );

            if (isProblem) {
                // Try to get actual duration for this lead
                const actualDuration = actualDurations[lead.id];
                if (actualDuration) {
                    console.log(`🔧 Fixing ${lead.name} (${lead.id}): "${log.duration}" → "${actualDuration}"`);
                    log.duration = actualDuration;
                    log.notes = `ViciDial Call - Duration: ${actualDuration}`;
                    fixedCount++;
                } else {
                    // For leads without recordings, at least remove the "20 sec" default
                    console.log(`⚠️ No recording found for ${lead.name} (${lead.id}), removing "20 sec" default`);
                    log.duration = 'Contact attempted';
                    log.notes = 'ViciDial Call - Duration unknown';
                    fixedCount++;
                }
            }
        });
    }
});

// Save updated leads back to localStorage
localStorage.setItem('insurance_leads', JSON.stringify(leads));

console.log(`✅ EMERGENCY FIX COMPLETE!`);
console.log(`   📊 Checked ${totalCallLogs} call logs`);
console.log(`   🔧 Fixed ${fixedCount} problematic durations`);
console.log(`   💾 Saved to localStorage`);

if (fixedCount > 0) {
    console.log('🔄 Reloading page to show fixed durations...');
    setTimeout(() => {
        window.location.reload();
    }, 2000);
} else {
    console.log('✅ No problematic durations found - all call logs are already correct!');
}