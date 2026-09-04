// EMERGENCY CALLBACK FIX - Immediate solution for overdue callback display
console.log('🚨 EMERGENCY CALLBACK FIX: Loading SUPER AGGRESSIVE callback table update...');

(function() {
    'use strict';

    // Store reference to original refreshLeadsTable function to hook into it
    let originalRefreshLeadsTable = null;

    // Immediate fix function for overdue callbacks
    function emergencyCallbackFix() {
        // CSR users: skip callback DOM overrides (they use csrTodo)
        try {
            const _ecf = JSON.parse(sessionStorage.getItem('vanguard_user') || '{}');
            if ((_ecf.role || '') === 'csr') return 0;
        } catch(e) {}

        console.log('🚨 EMERGENCY FIX: Checking for overdue callbacks...');

        const callbacksKey = 'scheduled_callbacks';
        const callbacks = JSON.parse(localStorage.getItem(callbacksKey) || '{}');
        const now = new Date();
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

        console.log('📋 Found', Object.keys(callbacks).length, 'leads with callbacks');

        let fixedCount = 0;

        Object.keys(callbacks).forEach(leadId => {
            const leadCallbacks = callbacks[leadId] || [];
            const lead = leads.find(l => String(l.id) === String(leadId));

            if (!lead) {
                console.log('❌ Lead not found for ID:', leadId);
                return;
            }

            // Check if any callback is overdue AND not completed
            const overdueCallbacks = leadCallbacks.filter(callback => {
                const callbackTime = new Date(callback.dateTime);
                return callbackTime <= now && !callback.completed;
            });

            if (overdueCallbacks.length > 0) {
                console.log('🔴 OVERDUE CALLBACK: Lead', lead.name, 'has', overdueCallbacks.length, 'overdue callbacks');

                // Find and update the table cell
                const tableBody = document.getElementById('leadsTableBody');
                if (!tableBody) {
                    console.log('❌ Table body not found');
                    return;
                }

                const rows = tableBody.querySelectorAll('tr');
                rows.forEach(row => {
                    const checkbox = row.querySelector('.lead-checkbox');
                    if (!checkbox || String(checkbox.value) !== String(leadId)) return;

                    const cells = row.querySelectorAll('td');
                    const todoCell = cells[6]; // TODO column

                    if (!todoCell) {
                        console.log('❌ TODO cell not found for lead', leadId);
                        return;
                    }

                    const currentContent = todoCell.innerHTML.trim();
                    console.log('📄 Current cell content:', currentContent);

                    if (!currentContent.includes('Reach out: CALL') && !currentContent.includes('data-callback-protected')) {
                        const phone = lead.phone || '(614) 208-8222';
                        const newContent = `
                            <div data-callback-protected="true" style="font-weight: bold; color: #dc2626;">
                                <a href="tel:${phone}"
                                   onclick="handleReachOutCall('${leadId}', '${phone}')"
                                   style="color: #dc2626; font-weight: bold; text-decoration: none; cursor: pointer;">
                                    Reach out: CALL
                                </a>
                            </div>
                        `;

                        todoCell.innerHTML = newContent;
                        fixedCount++;
                        console.log('✅ EMERGENCY FIX: Updated cell for lead', lead.name, 'to show "Reach out: CALL"');
                    } else {
                        console.log('✅ Cell already shows callback message for lead', lead.name);
                    }
                });
            } else {
                console.log('⏳ No overdue callbacks for lead', lead.name);
            }
        });

        console.log('🎯 EMERGENCY FIX COMPLETE: Updated', fixedCount, 'table cells');
        return fixedCount;
    }

    // Hook into app.js refreshLeadsTable function to immediately restore callbacks after table refresh
    function interceptTableRefresh() {
        if (typeof window.refreshLeadsTable === 'function' && !originalRefreshLeadsTable) {
            console.log('🔧 HOOKING INTO refreshLeadsTable to restore callbacks immediately after refresh');
            originalRefreshLeadsTable = window.refreshLeadsTable;

            window.refreshLeadsTable = function() {
                console.log('🚨 TABLE REFRESH DETECTED: Running original refresh then IMMEDIATELY restoring callbacks');

                // Run original function
                const result = originalRefreshLeadsTable.apply(this, arguments);

                // ULTRA PERSISTENT restoration - multiple attempts at different timings
                setTimeout(() => {
                    console.log('🚨 POST-REFRESH CALLBACK RESTORATION #1');
                    emergencyCallbackFix();
                }, 10);

                setTimeout(() => {
                    console.log('🚨 POST-REFRESH CALLBACK RESTORATION #2');
                    emergencyCallbackFix();
                }, 50);

                setTimeout(() => {
                    console.log('🚨 POST-REFRESH CALLBACK RESTORATION #3');
                    emergencyCallbackFix();
                }, 100);

                setTimeout(() => {
                    console.log('🚨 POST-REFRESH CALLBACK RESTORATION #4');
                    emergencyCallbackFix();
                }, 200);

                setTimeout(() => {
                    console.log('🚨 POST-REFRESH CALLBACK RESTORATION #5');
                    emergencyCallbackFix();
                }, 500);

                setTimeout(() => {
                    console.log('🚨 POST-REFRESH CALLBACK RESTORATION #6 (FINAL)');
                    emergencyCallbackFix();
                }, 1000);

                return result;
            };

            console.log('✅ Successfully hooked into refreshLeadsTable function');
        }
    }

    // Set up MutationObserver to detect when table gets completely replaced
    function setupTableObserver() {
        const targetNode = document.body;
        const config = { childList: true, subtree: true };

        const observer = new MutationObserver(function(mutationsList) {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    // Check if leadsTableBody was modified
                    for (let node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.id === 'leadsTableBody' || node.querySelector('#leadsTableBody')) {
                                console.log('🚨 TABLE BODY DETECTED: New table added, ULTRA PERSISTENT restoration starting');

                                // Immediate restoration attempts
                                setTimeout(emergencyCallbackFix, 5);
                                setTimeout(emergencyCallbackFix, 20);
                                setTimeout(emergencyCallbackFix, 50);
                                setTimeout(emergencyCallbackFix, 100);
                                setTimeout(emergencyCallbackFix, 200);
                                setTimeout(emergencyCallbackFix, 400);
                                setTimeout(emergencyCallbackFix, 800);
                                setTimeout(emergencyCallbackFix, 1500);

                                break;
                            }
                        }
                    }
                }
            }
        });

        observer.observe(targetNode, config);
        console.log('✅ Table MutationObserver set up');
    }

    // Run immediate fix
    emergencyCallbackFix();

    // Set up table refresh interception
    setTimeout(() => {
        interceptTableRefresh();
        // Keep trying to hook in case the function loads later
        const hookingInterval = setInterval(() => {
            if (typeof window.refreshLeadsTable === 'function' && !originalRefreshLeadsTable) {
                interceptTableRefresh();
                if (originalRefreshLeadsTable) {
                    clearInterval(hookingInterval);
                }
            }
        }, 1000);

        // Stop trying after 30 seconds
        setTimeout(() => clearInterval(hookingInterval), 30000);
    }, 1000);

    // Set up table observer
    setTimeout(setupTableObserver, 500);

    // ULTRA AGGRESSIVE continuous monitoring - every 1 second
    setInterval(emergencyCallbackFix, 1000);

    // HYPER AGGRESSIVE monitoring - every 250ms for 60 seconds after page load
    let hyperAggressiveCount = 0;
    const hyperAggressiveInterval = setInterval(() => {
        emergencyCallbackFix();
        hyperAggressiveCount++;
        if (hyperAggressiveCount >= 240) { // Stop after 60 seconds (240 * 250ms = 60s)
            clearInterval(hyperAggressiveInterval);
            console.log('🚨 Hyper aggressive monitoring complete, falling back to 1-second intervals');
        }
    }, 250);

    // Function to handle reach out call - ORIGINAL BEHAVIOR RESTORED + AUTO-CHECK FOR CALLBACKS
    function handleReachOutCall(leadId, phone) {
        console.log('📞 REACH OUT: Opening profile for lead', leadId, 'phone:', phone);

        // First, make the phone call
        window.open(`tel:${phone}`, '_self');

        // Then open the lead profile where the pickup confirmation will happen
        if (typeof window.viewLead === 'function') {
            window.viewLead(leadId);
        } else if (typeof window.openLeadProfile === 'function') {
            window.openLeadProfile(leadId);
        } else {
            console.log('📋 Profile function not found, using fallback');
            // Fallback - try to trigger profile open
            setTimeout(() => {
                const event = new CustomEvent('openLeadProfile', { detail: { leadId: leadId } });
                document.dispatchEvent(event);
            }, 100);
        }

        // AUTO-CHECK CALL CHECKBOX FOR OVERDUE CALLBACKS (only when clicking "Reach out: CALL")
        setTimeout(() => {
            console.log('📞 REACH OUT AUTO-CHECK: Checking for overdue callbacks for lead', leadId);

            const callbacksKey = 'scheduled_callbacks';
            const callbacks = JSON.parse(localStorage.getItem(callbacksKey) || '{}');
            const now = new Date();

            if (callbacks[leadId]) {
                const overdueCallbacks = callbacks[leadId].filter(callback => {
                    const callbackTime = new Date(callback.dateTime);
                    return callbackTime <= now && !callback.completed;
                });

                if (overdueCallbacks.length > 0) {
                    console.log('📞 REACH OUT AUTO-CHECK: Found', overdueCallbacks.length, 'overdue callbacks, auto-checking call-made checkbox');

                    const callCheckbox = document.getElementById(`call-made-${leadId}`);
                    if (callCheckbox && !callCheckbox.checked) {
                        callCheckbox.checked = true;
                        console.log('✅ REACH OUT AUTO-CHECK: Auto-checked call-made checkbox for lead', leadId);

                        // Trigger the change event to update the reach out data
                        const changeEvent = new Event('change', { bubbles: true });
                        callCheckbox.dispatchEvent(changeEvent);
                        console.log('🔍 REACH OUT AUTO-CHECK: Triggered change event');
                    }
                } else {
                    console.log('⏳ REACH OUT AUTO-CHECK: No overdue callbacks for lead', leadId);
                }
            } else {
                console.log('📋 REACH OUT AUTO-CHECK: No callbacks found for lead', leadId);
            }
        }, 500); // Delay to ensure profile is fully loaded
    }

    // Function to update callback status on server
    async function updateCallbackOnServer(leadId, completed) {
        const urls = [
            'http://162-220-14-239.nip.io:3001/api/complete-callback',
            'http://localhost:3001/api/complete-callback'
        ];

        for (const url of urls) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        leadId: leadId,
                        completed: completed,
                        completedAt: new Date().toISOString()
                    })
                });

                if (response.ok) {
                    console.log('✅ SERVER CALLBACK UPDATE: Successfully updated server for lead', leadId);
                    return;
                }
            } catch (error) {
                console.log('❌ SERVER CALLBACK UPDATE: Failed to update server:', error.message);
            }
        }
    }

    // Function to update table cell after callback completion
    function updateTableCellAfterCompletion(leadId) {
        console.log('🔄 TABLE UPDATE: Updating cell for completed callback, lead', leadId);

        setTimeout(() => {
            const tableBody = document.getElementById('leadsTableBody');
            if (!tableBody) return;

            const rows = tableBody.querySelectorAll('tr');
            rows.forEach(row => {
                const checkbox = row.querySelector('.lead-checkbox');
                if (checkbox && String(checkbox.value) === String(leadId)) {
                    const cells = row.querySelectorAll('td');
                    const todoCell = cells[6]; // TODO column

                    if (todoCell) {
                        // CSR users: show csrTodo instead of stage-based text
                        try {
                            const _csrComp = JSON.parse(sessionStorage.getItem('vanguard_user') || '{}');
                            if ((_csrComp.role || '') === 'csr') {
                                const cLead = JSON.parse(localStorage.getItem('insurance_leads') || '[]').find(l => String(l.id) === String(leadId));
                                const ct = (cLead && cLead.csrTodo) ? cLead.csrTodo : '';
                                todoCell.innerHTML = ct ? `<div style="font-weight: bold; color: #0284c7;">${ct}</div>` : '';
                                return;
                            }
                        } catch(e) {}

                        // Remove the callback message and revert to normal TODO based on lead stage
                        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                        const lead = leads.find(l => String(l.id) === String(leadId));

                        if (lead) {
                            // Map stage to normal TODO message
                            const actionMap = {
                                'new': 'Assign Stage',
                                'contact_attempted': 'Reach out',
                                'info_requested': 'Reach out to lead',
                                'info_received': 'Prepare Quote',
                                'quote_prepared': 'Send Quote',
                                'quote_sent': 'Follow up on quote',
                                'follow_up': 'Continue follow up',
                                'follow_up_2': 'Continue follow up',
                                'follow_up_3': 'Final follow up',
                                'negotiation': 'Negotiate terms',
                                'closing': 'Close deal',
                                'closed': 'Process complete'
                            };

                            const normalTodo = actionMap[lead.stage] || 'Follow up';

                            todoCell.innerHTML = `<div style="font-weight: bold; color: black;">${normalTodo}</div>`;
                            console.log('✅ TABLE UPDATE: Reverted cell to normal TODO:', normalTodo, 'for lead', leadId);
                        }
                    }
                }
            });
        }, 100);
    }

    // Function to complete callback when user confirms pickup in profile
    function completeCallback(leadId, confirmed = true) {
        console.log('✅ CALLBACK COMPLETION: Completing callback for lead', leadId, 'confirmed:', confirmed);

        if (confirmed) {
            // Mark callback as completed
            const callbacksKey = 'scheduled_callbacks';
            const callbacks = JSON.parse(localStorage.getItem(callbacksKey) || '{}');

            if (callbacks[leadId]) {
                // Mark all callbacks for this lead as completed
                callbacks[leadId].forEach(callback => {
                    callback.completed = true;
                    callback.completedAt = new Date().toISOString();
                });

                localStorage.setItem(callbacksKey, JSON.stringify(callbacks));
                console.log('✅ CALLBACK COMPLETION: Marked callbacks as completed for lead', leadId);

                // Also update server
                updateCallbackOnServer(leadId, true);

                // Immediately update the table cell to remove the callback message
                updateTableCellAfterCompletion(leadId);
            }
        }
    }

    // Make functions globally available
    window.emergencyCallbackFix = emergencyCallbackFix;
    window.handleReachOutCall = handleReachOutCall;
    window.completeCallback = completeCallback;

    console.log('✅ SUPER AGGRESSIVE EMERGENCY CALLBACK FIX: Loaded with table refresh hooks, mutation observers, and callback completion');
    console.log('🛠️  Run emergencyCallbackFix() manually anytime to force update');

})();