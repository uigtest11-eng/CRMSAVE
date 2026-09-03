// COMPREHENSIVE FINAL FIX - Everything in one place

(function() {
    // CSR users: skip entirely — CSRs use csrTodo, not callback-based reach outs
    try {
        var _cffSess = JSON.parse(sessionStorage.getItem('vanguard_user') || '{}');
        if ((_cffSess.role || '') === 'csr') return;
    } catch(e) {}

    // CRITICAL: Override all existing functions to ensure our fixes take priority

    // 1. HIGHLIGHT STATUS CHECKER (completely independent)
    function isHighlightActiveForLead(lead) {
        // SPECIAL CASE: App sent stage always has active highlighting (indefinite)
        if (lead && lead.stage === 'app sent') {
            return true;
        }

        if (!lead || !lead.reachOut) {
            return false;
        }

        if (!lead.reachOut.completedAt && !lead.reachOut.reachOutCompletedAt) {
            return false;
        }

        // Check for active highlight duration
        let highlightExpiry = null;

        if (lead.reachOut.greenHighlightUntil) {
            highlightExpiry = new Date(lead.reachOut.greenHighlightUntil);
        } else if (lead.greenHighlight?.expiresAt) {
            highlightExpiry = new Date(lead.greenHighlight.expiresAt);
        } else if (lead.greenUntil) {
            highlightExpiry = new Date(lead.greenUntil);
        } else {
            return false;
        }

        const now = new Date();
        return now < highlightExpiry;
    }

    // 2. TODO TEXT GENERATOR (clean logic)
    function getNextActionFixed(stage, lead) {
        // SPECIAL CASE: App sent stage never shows TODO text (always green highlighted)
        if (stage === 'app sent') {
            return '';
        }

        const stagesRequiringReachOut = ['quoted', 'info_requested', 'full_info_requested', 'quote_sent', 'quote-sent-unaware', 'quote-sent-aware', 'interested'];

        if (stagesRequiringReachOut.includes(stage)) {
            const hasActiveHighlight = isHighlightActiveForLead(lead);

            if (hasActiveHighlight) {
                return '';
            } else {
                // Create clickable reach out call link
                const phoneNumber = lead?.phone || '';
                const leadId = lead?.id || '';
                const clickHandler = `handleReachOutCall('${leadId}', '${phoneNumber}')`;

                return `<a href="tel:${phoneNumber}" onclick="${clickHandler}" style="color: #dc2626; font-weight: bold; text-decoration: none; cursor: pointer;">Reach out: CALL</a>`;
            }
        }

        // Default actions for other stages - CHECK FOR COMPLETION FIRST
        if (stage === 'contact_attempted' || stage === 'loss_runs_requested') {
            // Check if reach out is complete before showing TODO
            if (lead && lead.reachOut) {
                const reachOut = { ...lead.reachOut };

                // Check completion conditions (same as main getNextAction function)
                const hasTimestamp = reachOut.completedAt || reachOut.reachOutCompletedAt;
                const hasActualCompletion = reachOut.callsConnected > 0 ||
                                          reachOut.textCount > 0 ||
                                          reachOut.emailConfirmed === true;
                const isActuallyCompleted = hasTimestamp && hasActualCompletion;

                console.log(`🔍 COMPLETION CHECK (${stage}): Lead ${lead.id} - hasTimestamp=${hasTimestamp}, hasActualCompletion=${hasActualCompletion}, isActuallyCompleted=${isActuallyCompleted}`);

                if (isActuallyCompleted) {
                    console.log(`✅ REACH-OUT COMPLETE: Lead ${lead.id} - returning empty TODO`);
                    return ''; // No TODO when reach out is complete
                }
            }

            const phoneNumber = lead?.phone || '';
            const leadId = lead?.id || '';
            const clickHandler = `handleReachOutCall('${leadId}', '${phoneNumber}')`;
            return `<a href="tel:${phoneNumber}" onclick="${clickHandler}" style="color: #dc2626; font-weight: bold; text-decoration: none; cursor: pointer;">Reach out: CALL</a>`;
        }

        const actionMap = {
            'new': 'Assign Stage',
            'info_received': 'Prepare Basic Quote',
            'full_info_received': 'Prepare App & Quotes',
            'loss_runs_received': 'Send out loss runs',
            'sale': 'Update Client',
            'app_sent': '',  // App sent stage should have NO TODO text
            'app sent': '', // Handle both variations
            'not-interested': 'Archive lead',
            'closed': 'Process complete'
        };
        return actionMap[stage] || 'Review lead';
    }

    // 3. CORRECTED HIGHLIGHTING FUNCTION
    function applyReachOutCompleteHighlightingFixed() {

        const tableBody = document.getElementById('leadsTableBody') || document.querySelector('tbody');
        if (!tableBody) return;

        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const rows = tableBody.querySelectorAll('tr');

        rows.forEach(row => {
            const checkbox = row.querySelector('.lead-checkbox');
            if (!checkbox) return;

            const leadId = checkbox.value;
            const lead = leads.find(l => String(l.id) === String(leadId));
            if (!lead) return;

            // Skip CSR-pending blue rows — blue takes priority over all other highlights
            if (row.classList.contains('csr-done-pending') || row.getAttribute('data-highlight') === 'blue') return;

            const todoCell = row.querySelectorAll('td')[6];
            if (!todoCell) return;

            const todoText = todoCell.textContent.trim();
            const hasActiveHighlight = isHighlightActiveForLead(lead);
            const hasEmptyTodo = todoText === '' || todoText.length === 0;

            // SPECIAL CASE: App sent stage always gets green highlighting regardless of TODO status
            if (lead.stage === 'app sent') {
                row.style.setProperty('background-color', 'rgba(16, 185, 129, 0.2)', 'important');
                row.style.setProperty('background', 'rgba(16, 185, 129, 0.2)', 'important');
                row.style.setProperty('border-left', '4px solid #10b981', 'important');
                row.style.setProperty('border-right', '2px solid #10b981', 'important');
                row.classList.add('reach-out-complete');
                return; // Skip further processing for app sent leads
            }


            // Check if reach-out is actually completed (should have empty TODO)
            const lead = leads.find(l => l.id == leadId);
            const hasActuallyCompleted = lead && lead.reachOut && (
                (lead.reachOut.callAttempts > 0) ||
                (lead.reachOut.emailConfirmed === true) ||
                (lead.reachOut.textCount > 0) ||
                (lead.reachOut.callsConnected > 0)
            );

            // Debug ALASKA TERMINALS - only log critical info
            if (leadId === '138570' && hasActuallyCompleted && !hasEmptyTodo) {
                console.log(`🔧 ALASKA (${leadId}): Completed but TODO not empty - clearing`);
            }

            // Apply green highlighting if TODO is empty OR if reach-out is completed
            if (hasEmptyTodo || hasActuallyCompleted) {
                // CRITICAL: Clear the TODO cell content if reach-out is completed
                if (hasActuallyCompleted) {
                    // Method 1: Find TODO cell by searching for "Reach out" text
                    const allCells = row.querySelectorAll('td');
                    let todoCleared = false;

                    for (let i = 0; i < allCells.length; i++) {
                        if (allCells[i].textContent.includes('Reach out') || allCells[i].innerHTML.includes('Reach out')) {
                            allCells[i].innerHTML = '';
                            todoCleared = true;
                            if (leadId === '138570') {
                                console.log(`🔧 CLEARED ALASKA TODO CELL in column ${i}`);
                            }
                            break;
                        }
                    }

                    // Method 2: If not found by text search, use the standard TODO column (index 6)
                    if (!todoCleared && todoCell) {
                        todoCell.innerHTML = '';
                        if (leadId === '138570') {
                            console.log(`🔧 CLEARED ALASKA TODO CELL using standard column`);
                        }
                    }
                }

                row.style.setProperty('background-color', 'rgba(16, 185, 129, 0.2)', 'important');
                row.style.setProperty('background', 'rgba(16, 185, 129, 0.2)', 'important');
                row.style.setProperty('border-left', '4px solid #10b981', 'important');
                row.style.setProperty('border-right', '2px solid #10b981', 'important');
                row.classList.add('reach-out-complete');
            } else {
                // Remove green highlighting for all other cases
                row.style.removeProperty('background-color');
                row.style.removeProperty('background');
                row.style.removeProperty('border-left');
                row.style.removeProperty('border-right');
                row.classList.remove('reach-out-complete');
            }
        });
    }

    // 4. MAKE ALL FUNCTIONS GLOBALLY AVAILABLE AND OVERRIDE EXISTING
    window.isHighlightActiveForLead = isHighlightActiveForLead;
    window.getNextAction = getNextActionFixed;
    window.applyReachOutCompleteHighlighting = applyReachOutCompleteHighlightingFixed;

    // 5. IMMEDIATE FIX APPLICATION
    setTimeout(() => {
        // Force table regeneration if possible
        if (window.displayLeads) {
            window.displayLeads();
        } else if (window.loadLeadsView) {
            window.loadLeadsView();
        }

        // Apply highlighting after table loads
        setTimeout(() => {
            applyReachOutCompleteHighlightingFixed();
        }, 500);
    }, 100);

})();