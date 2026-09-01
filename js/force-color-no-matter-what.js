(function() {
    console.log('💪💪💪 FORCE COLOR NO MATTER WHAT 💪💪💪');

    window.forceColorNoMatterWhat = function() {
        const table = document.getElementById('leadsTableBody');
        if (!table) {
            console.error('No table!');
            return;
        }

        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const rows = table.querySelectorAll('tr');

        console.log(`Forcing colors on ${rows.length} rows`);

        rows.forEach((row, idx) => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 7) return;

            // Skip CSR-pending blue rows — blue takes priority over all other highlights
            if (row.classList.contains('csr-done-pending') || row.getAttribute('data-highlight') === 'blue') return;

            // Get TO DO text
            const todoCell = cells[7];
            const todoText = (todoCell.textContent || '').trim();

            // Get name for matching
            const nameCell = cells[1];
            const nameText = (nameCell.textContent || '').trim();

            // If TODO is empty, make it GREEN
            if (!todoText || todoText === '') {
                // GREEN for empty TODO
                row.style.cssText = 'background-color: rgba(16, 185, 129, 0.2) !important; border-left: 4px solid #10b981 !important; border-right: 2px solid #10b981 !important;';

                // Also force it with setAttribute
                row.setAttribute('style', 'background-color: rgba(16, 185, 129, 0.2) !important; border-left: 4px solid #10b981 !important; border-right: 2px solid #10b981 !important;');

                console.log(`Row ${idx}: GREEN (empty TODO)`);
            } else {
                // TODO has text - check for timestamp

                // Find matching lead (very loose matching)
                const lead = leads.find(l => {
                    if (!l.name) return false;
                    const lowerName = l.name.toLowerCase();
                    const lowerRowName = nameText.toLowerCase();
                    return lowerRowName.includes(lowerName) ||
                           lowerName.includes(lowerRowName) ||
                           lowerRowName.substring(0, 10) === lowerName.substring(0, 10);
                });

                if (lead) {
                    // Try to get ANY date from the lead
                    let dateToUse = null;

                    // Priority 1: stageTimestamps for current stage
                    if (lead.stageTimestamps && lead.stageTimestamps[lead.stage]) {
                        dateToUse = lead.stageTimestamps[lead.stage];
                        console.log(`Using stageTimestamp for ${lead.name}: ${dateToUse}`);
                    }
                    // Priority 2: updatedAt
                    else if (lead.updatedAt) {
                        dateToUse = lead.updatedAt;
                        console.log(`Using updatedAt for ${lead.name}: ${dateToUse}`);
                    }
                    // Priority 3: stageUpdatedAt
                    else if (lead.stageUpdatedAt) {
                        dateToUse = lead.stageUpdatedAt;
                        console.log(`Using stageUpdatedAt for ${lead.name}: ${dateToUse}`);
                    }
                    // Priority 4: createdAt
                    else if (lead.createdAt) {
                        dateToUse = lead.createdAt;
                        console.log(`Using createdAt for ${lead.name}: ${dateToUse}`);
                    }
                    // Priority 5: created
                    else if (lead.created) {
                        dateToUse = lead.created;
                        console.log(`Using created for ${lead.name}: ${dateToUse}`);
                    }

                    if (dateToUse) {
                        const date = new Date(dateToUse);
                        const now = new Date();

                        // Simple day calculation
                        const msPerDay = 24 * 60 * 60 * 1000;
                        const daysDiff = Math.floor((now - date) / msPerDay);

                        console.log(`Lead ${lead.name}: ${daysDiff} days old`);

                        if (daysDiff === 1) {
                            // YELLOW - 1 day old
                            row.style.cssText = 'background-color: #fef3c7 !important; border-left: 4px solid #f59e0b !important; border-right: 2px solid #f59e0b !important;';
                            row.setAttribute('style', 'background-color: #fef3c7 !important; border-left: 4px solid #f59e0b !important; border-right: 2px solid #f59e0b !important;');
                            console.log(`Row ${idx}: YELLOW (1 day old)`);
                        } else if (daysDiff > 1 && daysDiff < 7) {
                            // ORANGE - 2-6 days old
                            row.style.cssText = 'background-color: #fed7aa !important; border-left: 4px solid #fb923c !important; border-right: 2px solid #fb923c !important;';
                            row.setAttribute('style', 'background-color: #fed7aa !important; border-left: 4px solid #fb923c !important; border-right: 2px solid #fb923c !important;');
                            console.log(`Row ${idx}: ORANGE (${daysDiff} days old)`);
                        } else if (daysDiff >= 7) {
                            // RED - 7+ days old
                            row.style.cssText = 'background-color: #fecaca !important; border-left: 4px solid #ef4444 !important; border-right: 2px solid #ef4444 !important;';
                            row.setAttribute('style', 'background-color: #fecaca !important; border-left: 4px solid #ef4444 !important; border-right: 2px solid #ef4444 !important;');
                            console.log(`Row ${idx}: RED (${daysDiff} days old)`);
                        }
                    } else {
                        console.log(`No date found for ${lead.name}`);
                    }
                } else {
                    console.log(`No matching lead for row ${idx}: ${nameText}`);
                }
            }
        });
    };

    // Run immediately
    forceColorNoMatterWhat();

    // Run multiple times - DISABLED to prevent blinking
    // setTimeout(forceColorNoMatterWhat, 100);
    // setTimeout(forceColorNoMatterWhat, 500);
    // setTimeout(forceColorNoMatterWhat, 1000);
    // setTimeout(forceColorNoMatterWhat, 2000);

    // Keep running - DISABLED to prevent blinking
    // setInterval(forceColorNoMatterWhat, 3000);

    // Expose globally
    window.forceColors = forceColorNoMatterWhat;

    console.log('✅ Force Color Script Ready - Run window.forceColors() to apply');
})();