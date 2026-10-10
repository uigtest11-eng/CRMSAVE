(function() {
    console.log('🚫 SYNCHRONIZED TIMESTAMP COLORS DISABLED - was causing continuous flashing');
    return;

    // EXACT SAME LOGIC AS PROFILE for calculating days
    function calculateDaysOld(timestamp) {
        if (!timestamp) return null;

        const now = new Date();
        let stageDate = new Date(timestamp);

        // Check if date is valid
        if (isNaN(stageDate.getTime())) {
            return null;
        }

        // Fix future dates (same as profile)
        const currentYear = new Date().getFullYear();
        if (stageDate.getFullYear() > currentYear) {
            stageDate.setFullYear(currentYear);
        }

        // Calculate difference in days EXACTLY like profile (ignoring time)
        const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const compareDate = new Date(stageDate.getFullYear(), stageDate.getMonth(), stageDate.getDate());
        const diffTime = nowDate - compareDate;
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); // Using Math.round like profile!

        return diffDays;
    }

    // Get the SAME color as profile based on days
    function getColorForDays(diffDays) {
        if (diffDays === 0) {
            return null; // Today - no highlight (green in profile)
        } else if (diffDays === 1) {
            return 'yellow'; // Yesterday
        } else if (diffDays > 1 && diffDays < 7) {
            return 'orange'; // 2-6 days
        } else if (diffDays >= 7) {
            return 'red'; // 7+ days
        }
        return null;
    }

    // Get the EXACT SAME timestamp that the profile uses
    function getTimestampForLead(lead) {
        const stage = lead.stage || 'new';

        // FIRST check stageTimestamps for current stage (same as profile)
        if (lead.stageTimestamps && lead.stageTimestamps[stage]) {
            console.log(`Using stage timestamp for ${lead.name}: ${lead.stageTimestamps[stage]}`);
            return lead.stageTimestamps[stage];
        }

        // THEN check other fields as fallback
        if (lead.updatedAt) {
            console.log(`Using updatedAt for ${lead.name}: ${lead.updatedAt}`);
            return lead.updatedAt;
        }

        if (lead.createdAt || lead.created) {
            const ts = lead.createdAt || lead.created;
            console.log(`Using created date for ${lead.name}: ${ts}`);
            return ts;
        }

        return null;
    }

    // Main highlighting function with EXACT profile logic
    window.synchronizedHighlighting = function() {
        console.log('🔄 SYNCHRONIZED HIGHLIGHTING RUNNING');

        const table = document.getElementById('leadsTableBody');
        if (!table) return;

        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const rows = table.querySelectorAll('tr');

        let stats = { yellow: 0, orange: 0, red: 0, green: 0, noMatch: 0, noTimestamp: 0 };

        rows.forEach((row, idx) => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 7) return;

            // Skip CSR-pending blue rows — blue takes priority over all other highlights
            if (row.classList.contains('csr-done-pending') || row.getAttribute('data-highlight') === 'blue') return;

            // Get TO DO text
            const todoCell = cells[7];
            const todoText = (todoCell.textContent || '').trim();

            // Clear existing highlights first
            row.classList.remove('timestamp-yellow', 'timestamp-orange', 'timestamp-red', 'reach-out-complete');

            if (!todoText || todoText === '') {
                // GREEN for empty TODO
                row.style.setProperty('background-color', 'rgba(16, 185, 129, 0.2)', 'important');
                row.style.setProperty('border-left', '4px solid #10b981', 'important');
                row.style.setProperty('border-right', '2px solid #10b981', 'important');
                cells.forEach(cell => cell.style.backgroundColor = 'transparent');
                stats.green++;
                return;
            }

            // Get name from row
            const nameCell = cells[1];
            const nameText = (nameCell.textContent || '').trim();

            // Find matching lead with flexible matching
            const matchedLead = leads.find(l => {
                if (!l.name) return false;

                // Clean names for comparison
                const cleanRowName = nameText.replace('...', '').trim();
                const shortLeadName = l.name.substring(0, 15);

                // Try multiple match strategies
                return l.name === nameText ||                          // Exact match
                       l.name === cleanRowName ||                      // Match without ...
                       shortLeadName === cleanRowName ||               // Truncated match
                       cleanRowName === l.name.substring(0, cleanRowName.length); // Partial match
            });

            if (!matchedLead) {
                console.log(`❌ No match for row ${idx}: "${nameText}"`);
                stats.noMatch++;
                return;
            }

            // Get timestamp using SAME logic as profile
            const timestamp = getTimestampForLead(matchedLead);

            if (!timestamp) {
                console.log(`No timestamp for ${matchedLead.name}`);
                stats.noTimestamp++;
                return;
            }

            // Calculate days using SAME logic as profile
            const diffDays = calculateDaysOld(timestamp);

            if (diffDays === null) {
                console.log(`Invalid timestamp for ${matchedLead.name}`);
                return;
            }

            console.log(`${matchedLead.name}: ${diffDays} days old (stage: ${matchedLead.stage})`);

            // Get color using SAME logic as profile
            const color = getColorForDays(diffDays);

            if (color === 'yellow') {
                // YELLOW - 1 day old
                row.style.setProperty('background-color', '#fef3c7', 'important');
                row.style.setProperty('border-left', '4px solid #f59e0b', 'important');
                row.style.setProperty('border-right', '2px solid #f59e0b', 'important');
                cells.forEach(cell => cell.style.backgroundColor = 'transparent');
                stats.yellow++;
                console.log(`🟡 Applied YELLOW to ${matchedLead.name}`);

            } else if (color === 'orange') {
                // ORANGE - 2-6 days old
                row.style.setProperty('background-color', '#fed7aa', 'important');
                row.style.setProperty('border-left', '4px solid #fb923c', 'important');
                row.style.setProperty('border-right', '2px solid #fb923c', 'important');
                cells.forEach(cell => cell.style.backgroundColor = 'transparent');
                stats.orange++;
                console.log(`🟠 Applied ORANGE to ${matchedLead.name}`);

            } else if (color === 'red') {
                // RED - 7+ days old
                row.style.setProperty('background-color', '#fecaca', 'important');
                row.style.setProperty('border-left', '4px solid #ef4444', 'important');
                row.style.setProperty('border-right', '2px solid #ef4444', 'important');
                cells.forEach(cell => cell.style.backgroundColor = 'transparent');
                stats.red++;
                console.log(`🔴 Applied RED to ${matchedLead.name}`);

            } else {
                // Today or no color needed
                console.log(`No highlight for ${matchedLead.name} (${diffDays} days)`);
            }
        });

        console.log('✅ Synchronized highlighting stats:', stats);
    };

    // Debug function to check mismatches
    window.checkColorMismatch = function() {
        console.log('🔍 CHECKING FOR COLOR MISMATCHES...');

        const table = document.getElementById('leadsTableBody');
        if (!table) return;

        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const rows = table.querySelectorAll('tr');

        rows.forEach((row, idx) => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 7) return;

            const todoCell = cells[7];
            const todoText = (todoCell.textContent || '').trim();

            if (!todoText) return; // Skip empty TODOs

            const nameCell = cells[1];
            const nameText = (nameCell.textContent || '').trim();

            // Find lead
            const lead = leads.find(l => {
                if (!l.name) return false;
                const cleanName = nameText.replace('...', '').trim();
                return l.name.substring(0, 15) === cleanName || l.name === nameText;
            });

            if (lead) {
                // Get timestamp and calculate days
                const timestamp = getTimestampForLead(lead);
                if (timestamp) {
                    const days = calculateDaysOld(timestamp);
                    const expectedColor = getColorForDays(days);

                    // Check actual row color
                    const bgColor = row.style.backgroundColor;
                    let actualColor = null;

                    if (bgColor.includes('254, 243, 199')) actualColor = 'yellow';
                    else if (bgColor.includes('254, 215, 170')) actualColor = 'orange';
                    else if (bgColor.includes('254, 202, 202')) actualColor = 'red';
                    else if (bgColor.includes('16, 185, 129')) actualColor = 'green';

                    if (expectedColor !== actualColor && expectedColor !== null) {
                        console.log(`❌ MISMATCH: ${lead.name}`);
                        console.log(`   Stage: ${lead.stage}`);
                        console.log(`   Timestamp: ${timestamp}`);
                        console.log(`   Days old: ${days}`);
                        console.log(`   Expected: ${expectedColor || 'none'}`);
                        console.log(`   Actual: ${actualColor || 'none'}`);
                    }
                }
            }
        });
    };

    // Override all other highlighting functions
    window.forceAllHighlighting = synchronizedHighlighting;
    window.automaticTimestampColors = synchronizedHighlighting;
    window.enhancedAutomaticHighlights = synchronizedHighlighting;
    window.forceColors = synchronizedHighlighting;

    // Run immediately
    setTimeout(synchronizedHighlighting, 100);

    // Run regularly - DISABLED to prevent blinking
    // setInterval(synchronizedHighlighting, 1500);

    console.log('✅ Synchronized timestamp colors loaded!');
    console.log('Use window.checkColorMismatch() to debug mismatches');
})();