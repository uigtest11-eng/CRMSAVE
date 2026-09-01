(function() {
    console.log('🔥🔥🔥 ULTIMATE TIMESTAMP FIX LOADING 🔥🔥🔥');

    // Run this SUPER aggressively
    function ultimateHighlight() {
        console.log('💥 ULTIMATE HIGHLIGHT RUNNING');

        const table = document.getElementById('leadsTableBody');
        if (!table) return;

        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const rows = table.querySelectorAll('tr');

        let yellowCount = 0;
        let orangeCount = 0;
        let redCount = 0;
        let greenCount = 0;

        rows.forEach((row, idx) => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 7) return;

            // Skip CSR-pending blue rows — blue takes priority over all other highlights
            if (row.classList.contains('csr-done-pending') || row.getAttribute('data-highlight') === 'blue') return;

            // Get TO DO text
            const todoCell = cells[7];
            const todoText = (todoCell.textContent || '').trim();

            // Get name
            const nameCell = cells[1];
            const nameText = (nameCell.textContent || '').trim();

            console.log(`Row ${idx}: Name="${nameText}", TODO="${todoText}"`);

            // If TODO is NOT empty, check timestamp
            if (todoText && todoText.length > 0) {
                // Try to find matching lead by partial name match
                const lead = leads.find(l => {
                    if (!l.name) return false;
                    // Try multiple matching strategies
                    return nameText.includes(l.name) ||
                           l.name.includes(nameText) ||
                           nameText.includes(l.name.substring(0, 15)) ||
                           l.name.substring(0, 15) === nameText.substring(0, 15);
                });

                if (lead) {
                    console.log(`Found lead: ${lead.name}, Stage: ${lead.stage}`);

                    // Check timestamp
                    if (lead.stageTimestamps && lead.stageTimestamps[lead.stage]) {
                        const timestamp = lead.stageTimestamps[lead.stage];
                        const now = new Date();
                        const stageDate = new Date(timestamp);

                        // Calculate days
                        const msPerDay = 24 * 60 * 60 * 1000;
                        const diffDays = Math.floor((now - stageDate) / msPerDay);

                        console.log(`Timestamp: ${timestamp}, Days old: ${diffDays}`);

                        if (diffDays === 1) {
                            // YELLOW
                            console.log('🟡 APPLYING YELLOW');
                            row.style.cssText = 'background-color: #fef3c7 !important; border-left: 4px solid #f59e0b !important;';
                            yellowCount++;
                        } else if (diffDays === 2) {
                            // ORANGE
                            console.log('🟠 APPLYING ORANGE');
                            row.style.cssText = 'background-color: #fed7aa !important; border-left: 4px solid #fb923c !important;';
                            orangeCount++;
                        } else if (diffDays >= 3) {
                            // RED
                            console.log('🔴 APPLYING RED');
                            row.style.cssText = 'background-color: #fecaca !important; border-left: 4px solid #ef4444 !important;';
                            redCount++;
                        }
                    }
                }
            } else {
                // Empty TODO = GREEN
                console.log('🟢 APPLYING GREEN (empty TODO)');
                row.style.cssText = 'background-color: rgba(16, 185, 129, 0.2) !important; border-left: 4px solid #10b981 !important;';
                greenCount++;
            }
        });

        console.log(`✅ RESULTS: Yellow=${yellowCount}, Orange=${orangeCount}, Red=${redCount}, Green=${greenCount}`);
    }

    // Run immediately
    ultimateHighlight();

    // Run again after delays
    setTimeout(ultimateHighlight, 500);
    setTimeout(ultimateHighlight, 1000);
    setTimeout(ultimateHighlight, 2000);

    // Keep running forever - RE-ENABLED to restore original functionality
    setInterval(ultimateHighlight, 3000);

    // Expose globally
    window.ultimateHighlight = ultimateHighlight;
})();