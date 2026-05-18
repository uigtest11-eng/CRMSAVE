// Continuous Callback Monitor - Maintains "Reach out: CALL" buttons independently
(function() {
    'use strict';

    // CSR users: skip entirely — CSRs use csrTodo, not callback-based reach outs
    try {
        var _ccmSess = JSON.parse(sessionStorage.getItem('vanguard_user') || '{}');
        if ((_ccmSess.role || '') === 'csr') { console.log('Continuous Callback Monitor: skipped for CSR'); return; }
    } catch(e) {}

    console.log('📞 Loading Continuous Callback Monitor...');

    // Global state tracking
    let monitoringInterval = null;
    let isMonitoring = false;

    // Function to update table cell with callback due message
    function updateTableCellForCallback(leadId, leadName, phone) {
        try {
            console.log(`🔍 CONTINUOUS MONITOR: Updating table for lead ${leadId} (${leadName})`);

            const tableBody = document.querySelector('#leadsTable tbody') || document.querySelector('tbody');
            if (!tableBody) {
                console.log('❌ CONTINUOUS MONITOR: Table not found');
                return;
            }

            const rows = tableBody.querySelectorAll('tr');
            console.log(`🔍 CONTINUOUS MONITOR: Found ${rows.length} rows in table`);

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const checkbox = row.querySelector('input[type="checkbox"]');

                if (!checkbox) continue;

                const rowLeadId = checkbox.value;
                if (String(rowLeadId) === String(leadId)) {
                    console.log(`✅ CONTINUOUS MONITOR: Found matching row for lead ${leadId}`);

                    // Find the TODO cell - it's the 7th column (index 6)
                    const cells = row.querySelectorAll('td');
                    if (cells.length > 6) {
                        const todoCell = cells[7]; // TODO column is 7th column (0-indexed = 6)

                        // Check if already has callback message
                        if (todoCell.innerHTML.includes('Reach out: CALL')) {
                            console.log(`🔍 CONTINUOUS MONITOR: Cell already shows callback message for lead ${leadId}`);
                            console.log(`🔍 CONTINUOUS MONITOR: Current cell content: ${todoCell.innerHTML.trim()}`);
                            return;
                        }

                        console.log(`🔍 CONTINUOUS MONITOR: Current TODO cell content: ${todoCell.innerHTML.trim()}`);

                        // Update with callback due message
                        const callbackHtml = `
                            <div style="font-weight: bold; color: #dc2626;">
                                <a href="tel:${phone}" onclick="handleReachOutCall('${leadId}', '${phone}')" style="color: #dc2626; font-weight: bold; text-decoration: none; cursor: pointer;">
                                    Reach out: CALL
                                </a>
                            </div>
                        `;

                        todoCell.innerHTML = callbackHtml;
                        console.log(`✅ CONTINUOUS MONITOR: Updated table cell for lead ${leadName}`);
                        console.log(`🔍 CONTINUOUS MONITOR: New cell content: ${todoCell.innerHTML.trim()}`);
                    } else {
                        console.log(`❌ CONTINUOUS MONITOR: Not enough cells in row for lead ${leadId} (found ${cells.length})`);
                    }
                    break;
                }
            }
        } catch (error) {
            console.error('❌ CONTINUOUS MONITOR: Error updating table cell:', error);
        }
    }

    // Function to check all callbacks and update table
    function checkCallbacksAndUpdateTable() {
        try {
            const now = new Date();
            console.log('🔍 CONTINUOUS MONITOR: Checking callbacks at', now.toLocaleString());

            // Get callbacks from localStorage
            const callbacks = JSON.parse(localStorage.getItem('scheduled_callbacks') || '{}');
            const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

            if (Object.keys(callbacks).length === 0) {
                console.log('🔍 CONTINUOUS MONITOR: No callbacks found');
                return;
            }

            console.log(`🔍 CONTINUOUS MONITOR: Found ${Object.keys(callbacks).length} leads with callbacks`);

            // Check each lead's callbacks
            Object.keys(callbacks).forEach(leadId => {
                const leadCallbacks = callbacks[leadId] || [];
                const lead = leads.find(l => String(l.id) === String(leadId));

                if (!lead) {
                    console.log(`❌ CONTINUOUS MONITOR: Lead not found for ID ${leadId}`);
                    return;
                }

                // Check if any callback is due
                let hasOverdueCallback = false;
                leadCallbacks.forEach(callback => {
                    if (callback.completed) return; // Skip completed callbacks

                    const callbackTime = new Date(callback.dateTime);
                    const minutesUntilCallback = (callbackTime - now) / (1000 * 60);

                    if (minutesUntilCallback <= 0) {
                        hasOverdueCallback = true;
                        console.log(`⏰ CONTINUOUS MONITOR: Callback is DUE for lead ${lead.name} (${minutesUntilCallback.toFixed(0)} minutes ago)`);
                    }
                });

                // Update table if callback is due
                if (hasOverdueCallback) {
                    updateTableCellForCallback(leadId, lead.name, lead.phone || lead.contact_phone || '');
                }
            });

        } catch (error) {
            console.error('❌ CONTINUOUS MONITOR: Error in callback check:', error);
        }
    }

    // Function to start continuous monitoring
    function startContinuousMonitoring() {
        if (isMonitoring) {
            console.log('🔍 CONTINUOUS MONITOR: Already monitoring');
            return;
        }

        console.log('🚀 CONTINUOUS MONITOR: Starting continuous callback monitoring...');
        isMonitoring = true;

        // Initial check
        setTimeout(checkCallbacksAndUpdateTable, 2000);

        // Set up aggressive monitoring - every 15 seconds for better persistence
        monitoringInterval = setInterval(() => {
            checkCallbacksAndUpdateTable();
        }, 15000);

        console.log('✅ CONTINUOUS MONITOR: Monitoring started (checking every 15 seconds)');
    }

    // Function to stop monitoring
    function stopContinuousMonitoring() {
        if (monitoringInterval) {
            clearInterval(monitoringInterval);
            monitoringInterval = null;
        }
        isMonitoring = false;
        console.log('🛑 CONTINUOUS MONITOR: Monitoring stopped');
    }

    // Function to restart monitoring (useful after table refreshes)
    function restartMonitoring() {
        console.log('🔄 CONTINUOUS MONITOR: Restarting monitoring...');
        stopContinuousMonitoring();
        setTimeout(startContinuousMonitoring, 1000);
    }

    // Listen for table changes and maintain callback displays
    function observeTableChanges() {
        const targetNode = document.body;
        const config = { childList: true, subtree: true };

        const observer = new MutationObserver(function(mutationsList) {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    // Check if table was refreshed
                    if (mutation.addedNodes.length > 0) {
                        const hasTable = Array.from(mutation.addedNodes).some(node => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                return node.querySelector('table') || node.tagName === 'TABLE';
                            }
                            return false;
                        });

                        if (hasTable) {
                            console.log('🔄 CONTINUOUS MONITOR: Table refresh detected, reapplying callback displays...');
                            setTimeout(checkCallbacksAndUpdateTable, 1000);
                        }
                    }
                }
            }
        });

        observer.observe(targetNode, config);
        console.log('👁️ CONTINUOUS MONITOR: Table change observer active');
    }

    // Initialize on page load
    function initialize() {
        console.log('🔧 CONTINUOUS MONITOR: Initializing...');

        // Start monitoring
        startContinuousMonitoring();

        // Set up table change observation
        observeTableChanges();

        // Make functions globally available for debugging
        window.continuousCallbackMonitor = {
            start: startContinuousMonitoring,
            stop: stopContinuousMonitoring,
            restart: restartMonitoring,
            checkNow: checkCallbacksAndUpdateTable,
            forceUpdate: function() {
                console.log('🔧 CONTINUOUS MONITOR: Force updating all overdue callbacks...');
                checkCallbacksAndUpdateTable();
            }
        };

        console.log('✅ CONTINUOUS MONITOR: Initialization complete');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

    // Also initialize after a delay to ensure all other scripts are loaded
    setTimeout(initialize, 3000);

    console.log('📞 Continuous Callback Monitor Script Loaded');

})();