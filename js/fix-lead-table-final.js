// FINAL FIX: PARTIAL RE-ENABLE - Only the table generation, not the continuous updates
console.log('🔧 FINAL LEAD TABLE FIX PARTIALLY RE-ENABLED - table generation only, no continuous updates');

// Helper function to format premium display (avoid double dollar signs)
function formatPremiumDisplay(premium) {
    if (!premium || premium === 0 || premium === '0') {
        return '$0';
    }

    // Convert to string and clean any existing dollar signs
    const cleanPremium = String(premium).replace(/[$,]/g, '');
    const numericPremium = parseFloat(cleanPremium) || 0;

    return `$${numericPremium.toLocaleString()}`;
}

(function() {
    // Helper function to check highlight status independently (no circular dependencies)
    function isHighlightActiveForLead(lead) {
        // SPECIAL CASE: App sent stage always has active highlighting (indefinite)
        if (lead && lead.stage === 'app sent') {
            console.log(`🔍 HIGHLIGHT STATUS: Lead ${lead.id} - app sent stage, indefinite highlight: true`);
            return true;
        }

        if (!lead || !lead.reachOut) {
            return false; // No reach-out data means no highlight
        }

        // Must have completion data for highlight to be possible
        if (!lead.reachOut.completedAt && !lead.reachOut.reachOutCompletedAt) {
            return false; // No completion means no highlight
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
            // Has completion but no highlight duration set = no highlight
            return false;
        }

        // Check if highlight is still active (not expired)
        const now = new Date();
        const isActive = now < highlightExpiry;

        console.log(`🔍 HIGHLIGHT STATUS: Lead ${lead.id} - expiry: ${highlightExpiry.toLocaleString()}, active: ${isActive}`);
        return isActive;
    }

    // Function to get next action based on stage and reach out status
    function getNextActionFixed(stage, lead) {
        // SPECIAL CASE: App sent stage never shows TODO text (always green highlighted)
        if (stage === 'app sent') {
            console.log(`✅ Lead ${lead?.id}: App sent stage - no TODO text (indefinite green)`);
            return '';
        }

        // Check if stage requires reach-out
        const stagesRequiringReachOut = ['quoted', 'info_requested', 'quote_sent', 'quote-sent-unaware', 'quote-sent-aware', 'interested', 'contact_attempted', 'loss_runs_requested'];

        if (stagesRequiringReachOut.includes(stage)) {
            console.log(`🔍 STAGE CHECK: Lead ${lead?.id} - stage "${stage}" requires reach-out`);

            // Check if highlight is currently active
            const hasActiveHighlight = isHighlightActiveForLead(lead);

            if (hasActiveHighlight) {
                // Lead has active green highlight - no TODO text needed
                console.log(`✅ ACTIVE HIGHLIGHT: Lead ${lead.id} - showing no TODO (green highlight active)`);
                return '';
            } else {
                // Lead needs reach-out action (no active highlight)
                console.log(`🔴 NO ACTIVE HIGHLIGHT: Lead ${lead.id} - showing red reach-out text`);
                return '<span style="color: #dc2626; font-weight: bold;">Reach out</span>';
            }
        }

        const actionMap = {
            'new': 'Assign Stage',
            'contact_attempted': '<span style="color: #dc2626; font-weight: bold;">Reach out</span>',
            'info_requested': '<span style="color: #dc2626; font-weight: bold;">Reach out</span>',
            'info_received': 'Prepare Quote',
            'loss_runs_requested': '<span style="color: #dc2626; font-weight: bold;">Reach out</span>',
            'loss_runs_received': 'Prepare app.',
            'app_prepared': 'Email brokers',
            'app_sent': '',  // App sent stage should have NO TODO text
            'app sent': '', // Handle both variations
            'quoted': '<span style="color: #dc2626; font-weight: bold;">Reach out</span>',
            'quote_sent': '<span style="color: #dc2626; font-weight: bold;">Reach out</span>',
            'quote-sent-unaware': '<span style="color: #dc2626; font-weight: bold;">Reach out</span>',
            'quote-sent-aware': '<span style="color: #dc2626; font-weight: bold;">Reach out</span>',
            'interested': '<span style="color: #dc2626; font-weight: bold;">Reach out</span>',
            'not-interested': 'Archive lead',
            'closed': 'Process complete'
        };
        return actionMap[stage] || 'Review lead';
    }

    // Make the getNextAction function globally available to fix TO DO text
    window.getNextAction = getNextActionFixed;

    // Function to clean up expired highlight durations across all leads
    function cleanupExpiredHighlights() {
        console.log('🧹 Cleaning up expired highlight durations...');

        try {
            const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            let updatedCount = 0;

            leads.forEach(lead => {
                if (lead.reachOut &&
                    (lead.reachOut.completedAt || lead.reachOut.reachOutCompletedAt) &&
                    lead.reachOut.greenHighlightUntil) {

                    const highlightExpiry = new Date(lead.reachOut.greenHighlightUntil);
                    const now = new Date();

                    if (now > highlightExpiry) {
                        console.log(`🔴 EXPIRED CLEANUP: Lead ${lead.id} (${lead.name}) - highlight expired at ${lead.reachOut.greenHighlightUntil}`);
                        console.log(`   Before reset: callsConnected=${lead.reachOut.callsConnected}, textCount=${lead.reachOut.textCount}`);

                        // Mark as expired but keep completion timestamps for proper TO DO logic
                        lead.reachOut.callsConnected = 0;
                        lead.reachOut.textCount = 0;
                        lead.reachOut.emailSent = false;
                        lead.reachOut.textSent = false;
                        lead.reachOut.callMade = false;

                        // CRITICAL: Keep completion timestamps but mark as expired
                        lead.reachOut.highlightExpired = true;
                        lead.reachOut.expiredAt = new Date().toISOString();

                        // ENHANCEMENT: Reset reach-out status to make it show "TO DO: Call" in profile
                        lead.reachOut.completed = false;
                        lead.reachOut.status = 'pending';

                        delete lead.reachOut.greenHighlightUntil;
                        delete lead.reachOut.greenHighlightDays;

                        console.log(`   After reset: callsConnected=${lead.reachOut.callsConnected}, textCount=${lead.reachOut.textCount}`);
                        updatedCount++;
                    } else {
                        // Debug: Log leads that aren't expired yet
                        if (lead.name && lead.name.includes('SKUR TRANSPORT')) {
                            console.log(`🟡 SKUR TRANSPORT not expired: expires ${highlightExpiry.toLocaleString()}, now is ${now.toLocaleString()}`);
                        }
                    }
                }
            });

            if (updatedCount > 0) {
                localStorage.setItem('insurance_leads', JSON.stringify(leads));
                console.log(`✅ Cleaned up ${updatedCount} expired highlight durations`);

                // Save expired leads to server
                leads.forEach(async lead => {
                    if (lead.reachOut && lead.reachOut.highlightExpired) {

                        try {
                            await fetch(`/api/leads/${lead.id}`, {
                                method: 'PUT',
                                headers: {'Content-Type': 'application/json'},
                                body: JSON.stringify({reachOut: lead.reachOut})
                            });
                            console.log(`✅ Saved expired lead ${lead.id} to server`);
                        } catch (error) {
                            console.error(`❌ Failed to save expired lead ${lead.id}:`, error);
                        }
                    }
                });

                // Force table refresh to show updated TO DO text
                if (window.displayLeads) {
                    window.displayLeads();
                } else if (window.loadLeadsView) {
                    window.loadLeadsView();
                }

                // Force refresh any open lead profiles to show updated reach-out status
                leads.forEach(lead => {
                    if (lead.reachOut && lead.reachOut.highlightExpired) {
                        const profileContainer = document.getElementById('lead-profile-container');
                        if (profileContainer && profileContainer.dataset.leadId === String(lead.id)) {
                            console.log(`🔄 Refreshing open profile for expired lead ${lead.id}`);
                            if (window.applyReachOutStyling) {
                                // Refresh the reach-out section for this lead's profile
                                const stage = lead.stage || 'new';
                                const hasReachOutTodo = ['quoted', 'info_requested', 'quote_sent', 'quote-sent-unaware',
                                                       'quote-sent-aware', 'interested'].includes(stage);
                                window.applyReachOutStyling(lead.id, hasReachOutTodo);
                            }
                        }
                    }
                });
            } else {
                console.log('✅ No expired highlights found to clean up');
            }
        } catch (error) {
            console.error('❌ Error cleaning up expired highlights:', error);
        }
    }

    // Run cleanup immediately on page load and every 5 minutes
    console.log('🚀 Running immediate highlight expiration cleanup...');
    cleanupExpiredHighlights();
    setInterval(cleanupExpiredHighlights, 5 * 60 * 1000); // Every 5 minutes

    // Also run cleanup whenever the table is refreshed
    const originalDisplayLeads = window.displayLeads;
    if (originalDisplayLeads) {
        window.displayLeads = function(...args) {
            cleanupExpiredHighlights();
            return originalDisplayLeads.apply(this, args);
        };
    }

    const originalLoadLeadsView = window.loadLeadsView;
    if (originalLoadLeadsView) {
        window.loadLeadsView = function(...args) {
            cleanupExpiredHighlights();
            return originalLoadLeadsView.apply(this, args);
        };
    }

    // Store original if it exists
    const originalGenerateSimpleLeadRows = window.generateSimpleLeadRows;

    // RE-ENABLED: This creates the second view with yellow/orange highlighting
    window.generateSimpleLeadRows = function(leads) {
        console.log('🔧 Using FIXED generateSimpleLeadRows function');

        if (!leads || leads.length === 0) {
            return '<tr><td colspan="11" style="text-align: center; padding: 2rem;">No leads found</td></tr>';
        }

        const html = leads.map(lead => {
            // Get current logged-in user
            const userData = sessionStorage.getItem('vanguard_user');
            let currentUser = '';
            if (userData) {
                const user = JSON.parse(userData);
                currentUser = user.username.charAt(0).toUpperCase() + user.username.slice(1).toLowerCase();
            }

            // Check if this lead belongs to another user (grey it out)
            const isOtherUsersLead = lead.assignedTo && lead.assignedTo !== currentUser && currentUser !== '';

            // Truncate name to 15 characters max
            const displayName = lead.name && lead.name.length > 15 ? lead.name.substring(0, 15) + '...' : lead.name || '';

            // Check if reach out is complete for green highlighting
            let isReachOutComplete = false;
            if (lead.reachOut) {
                const reachOut = lead.reachOut;
                const stage = lead.stage || 'new';

                // Check if stage requires reach out (NOT info_received - that needs quote preparation)
                if (stage === 'quoted' || stage === 'info_requested' ||
                    stage === 'quote_sent' || stage === 'quote-sent-unaware' || stage === 'quote-sent-aware' ||
                    stage === 'interested') {

                    // Convert values to numbers in case they're stored as strings
                    const callsConnected = Number(reachOut.callsConnected) || 0;
                    const callAttempts = Number(reachOut.callAttempts) || 0;
                    const emailCount = Number(reachOut.emailCount) || 0;
                    const textCount = Number(reachOut.textCount) || 0;

                    // If connected call was made or all methods attempted, reach out is complete
                    if (callsConnected > 0 ||
                        (callAttempts > 0 && emailCount > 0 && textCount > 0)) {
                        isReachOutComplete = true;
                    }
                }
            }

            // Check timestamp age and TO DO text for highlighting
            let timestampColor = null;
            let borderColor = null;
            let shouldHighlightForTimestamp = false;

            // Skip timestamp highlighting for closed leads - they should only be gray
            if (lead.stage !== 'closed') {
                // Check if lead has TO DO text
                const hasTodoText = lead.todo && lead.todo.trim() !== '';

                if (hasTodoText && lead.stageTimestamps && lead.stageTimestamps[lead.stage]) {
                    const timestamp = lead.stageTimestamps[lead.stage];
                    const stageDate = new Date(timestamp);
                    const now = new Date();

                    // Calculate difference in days
                    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const compareDate = new Date(stageDate.getFullYear(), stageDate.getMonth(), stageDate.getDate());
                    const diffTime = nowDate - compareDate;
                    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                    // Only highlight if timestamp is NOT green (not today)
                    if (diffDays === 1) {
                        // Yellow for yesterday
                        timestampColor = '#fef3c7'; // Light yellow background
                        borderColor = '#f59e0b'; // Yellow border
                        shouldHighlightForTimestamp = true;
                    } else if (diffDays > 1 && diffDays < 7) {
                        // Orange for 2-6 days
                        timestampColor = '#fed7aa'; // Light orange background
                        borderColor = '#fb923c'; // Orange border
                        shouldHighlightForTimestamp = true;
                    } else if (diffDays >= 7) {
                        // Red for 7+ days
                        timestampColor = '#fecaca'; // Light red background
                        borderColor = '#ef4444'; // Red border
                        shouldHighlightForTimestamp = true;
                    }
                }
            }

            // Determine row styling based on priority: closed leads > grey out > timestamp highlight > green highlight
            let rowStyle = '';
            let rowClass = '';

            if (lead.stage === 'closed') {
                // Gray highlight for closed leads - highest priority
                rowStyle = 'style="background-color: #f3f4f6 !important; border-left: 4px solid #9ca3af !important; border-right: 2px solid #9ca3af !important; opacity: 0.7;"';
                rowClass = 'lead-closed';
            } else if (isOtherUsersLead) {
                // Grey out leads assigned to other users
                rowStyle = 'style="opacity: 0.4; background-color: rgba(156, 163, 175, 0.1) !important; filter: grayscale(50%);"';
                rowClass = 'other-user-lead';
            } else if (shouldHighlightForTimestamp) {
                // Highlight based on timestamp age (only if has TO DO text)
                rowStyle = `style="background-color: ${timestampColor} !important; border-left: 4px solid ${borderColor} !important; border-right: 2px solid ${borderColor} !important;"`;
                rowClass = 'timestamp-highlight';
            } else if (isReachOutComplete) {
                // Green highlight for reach out complete (only for current user's leads)
                rowStyle = 'style="background-color: rgba(16, 185, 129, 0.2) !important; border-left: 4px solid #10b981 !important; border-right: 2px solid #10b981 !important;"';
                rowClass = 'reach-out-complete';
            }

            return `
                <tr ${rowStyle} ${rowClass ? `class="${rowClass}"` : ''}>
                    <td>
                        <input type="checkbox" class="lead-checkbox" value="${lead.id}" onchange="updateBulkDeleteButton()" data-lead='${JSON.stringify(lead).replace(/'/g, '&apos;')}'>
                    </td>
                    <td class="lead-name" style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        <strong style="cursor: pointer; color: #3b82f6; text-decoration: underline; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" onclick="viewLead('${lead.id}')" title="${lead.name}">${displayName}</strong>
                    </td>
                    <td>
                        <div class="contact-info" style="display: flex; gap: 10px; align-items: center;">
                            <a href="tel:${lead.phone}" title="${lead.phone}" style="color: #3b82f6; text-decoration: none; font-size: 16px;">
                                <i class="fas fa-phone"></i>
                            </a>
                            <a href="mailto:${lead.email}" title="${lead.email}" style="color: #3b82f6; text-decoration: none; font-size: 16px;">
                                <i class="fas fa-envelope"></i>
                            </a>
                        </div>
                    </td>
                    <td>${lead.product || 'Not specified'}</td>
                    <td>${formatPremiumDisplay(lead.premium)}</td>
                    <td>${window.getStageHtml ? window.getStageHtml(lead.stage, lead) : getStageHtmlFixed(lead.stage)}</td>
                    <td>
                        ${(() => {
                            // Use the global getNextAction function that gets overridden by other scripts
                            const todoText = window.getNextAction ? window.getNextAction(lead.stage || 'new', lead) : getNextActionFixed(lead.stage || 'new', lead);

                            // Enhanced debug logging for leads requiring reach-out
                            const requiresReachoutStages = ['quoted', 'info_requested', 'quote_sent', 'quote-sent-unaware', 'quote-sent-aware', 'interested', 'contact_attempted', 'loss_runs_requested'];
                            if (requiresReachoutStages.includes(lead.stage) || (lead.name && lead.name.includes('SKUR TRANSPORT'))) {
                                console.log(`🔍 LEAD DEBUG (${lead.name}):`, {
                                    id: lead.id,
                                    stage: lead.stage,
                                    todoText: todoText,
                                    completedAt: lead.reachOut?.completedAt,
                                    greenHighlightUntil: lead.reachOut?.greenHighlightUntil,
                                    callsConnected: lead.reachOut?.callsConnected,
                                    textCount: lead.reachOut?.textCount
                                });
                            }

                            // CRITICAL FIX: Don't wrap HTML in additional styling if it already contains color styling
                            if (todoText && todoText.includes('<span style=')) {
                                // Already has styling (red reach-out text), return as-is
                                return todoText;
                            } else {
                                // Plain text, apply default styling
                                const color = todoText && todoText.toLowerCase().includes('reach out') ? '#dc2626' : 'black';
                                return `<div style="font-weight: bold; color: ${color};">${todoText}</div>`;
                            }
                        })()}
                    </td>
                    <td>${lead.renewalDate || 'N/A'}</td>
                    <td>${lead.assignedTo || 'Unassigned'}</td>
                    <td>${lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : lead.created || 'N/A'}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon" onclick="viewLead('${lead.id}')" title="View Lead"><i class="fas fa-eye"></i></button>
                            <button class="btn-icon" onclick="archiveLead('${lead.id}')" title="Archive Lead" style="color: #f59e0b;"><i class="fas fa-archive"></i></button>
                            <button class="btn-icon" onclick="convertLead('${lead.id}')" title="Convert to Client"><i class="fas fa-user-check"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // DISABLED - Auto-highlighting that caused flashing
        // setTimeout(() => {
        //     console.log('💚 Auto-applying highlighting after table generation');
        //     forceAllHighlighting();
        // }, 10);

        return html;
    };

    // Backup function for stage HTML if not available
    function getStageHtmlFixed(stage) {
        const stageColors = {
            'new': 'stage-new',
            'contact_attempted': 'stage-contact-attempted',
            'info_requested': 'stage-info-requested',
            'info_received': 'stage-info-received',
            'loss_runs_requested': 'stage-loss-runs-requested',
            'loss_runs_received': 'stage-loss-runs-received',
            'quoted': 'stage-quoted',
            'quote-sent-unaware': 'stage-quote-sent-unaware',
            'quote-sent-aware': 'stage-quote-sent-aware',
            'interested': 'stage-interested',
            'not-interested': 'stage-not-interested',
            'closed': 'stage-closed',
            'contacted': 'stage-contacted',
            'reviewed': 'stage-reviewed',
            'converted': 'stage-converted'
        };

        const stageLabels = {
            'new': 'New',
            'contact_attempted': 'Contact Attempted',
            'info_requested': 'Info Requested',
            'info_received': 'Info Received',
            'loss_runs_requested': 'Loss Runs Requested',
            'loss_runs_received': 'Loss Runs Received',
            'quoted': 'Quoted',
            'quote_sent': 'Quote Sent',
            'quote-sent-unaware': 'Quote Sent (Unaware)',
            'quote-sent-aware': 'Quote Sent (Aware)',
            'interested': 'Interested',
            'not-interested': 'Not Interested',
            'closed': 'Closed',
            'contacted': 'Contacted',
            'reviewed': 'Reviewed',
            'converted': 'Converted'
        };

        return `<span class="stage-badge ${stageColors[stage] || 'stage-default'}">${stageLabels[stage] || stage}</span>`;
    }

    // Function to fix the table immediately
    function fixLeadTable() {
        console.log('🔨 Attempting to fix lead table...');

        const tableBody = document.getElementById('leadsTableBody');
        if (!tableBody) {
            console.log('⏳ Table body not found yet, waiting...');
            return false;
        }

        // Fix table width and column spacing
        const table = document.getElementById('leadsTable');
        if (table) {
            table.style.width = '100%';
            table.style.tableLayout = 'auto';

            // Add CSS to spread columns properly
            const style = document.getElementById('lead-table-fix-styles') || document.createElement('style');
            style.id = 'lead-table-fix-styles';
            style.innerHTML = `
                #leadsTable {
                    width: 100% !important;
                    table-layout: fixed !important;
                }

                #leadsTable th,
                #leadsTable td {
                    padding: 8px 10px !important;
                    white-space: nowrap !important;
                }

                /* Grey out leads assigned to other users */
                #leadsTable tr.other-user-lead {
                    opacity: 0.4 !important;
                    background-color: rgba(156, 163, 175, 0.1) !important;
                    filter: grayscale(50%) !important;
                    pointer-events: all;
                }

                #leadsTable tr.other-user-lead td {
                    color: #6b7280 !important;
                }

                /* Balanced column widths */
                #leadsTable th:nth-child(1),
                #leadsTable td:nth-child(1) { width: 40px !important; } /* Checkbox */

                #leadsTable th:nth-child(2),
                #leadsTable td:nth-child(2) { width: 12% !important; } /* Name */

                #leadsTable th:nth-child(3),
                #leadsTable td:nth-child(3) { width: 8% !important; } /* Contact */

                #leadsTable th:nth-child(4),
                #leadsTable td:nth-child(4) { width: 10% !important; } /* Product */

                #leadsTable th:nth-child(5),
                #leadsTable td:nth-child(5) { width: 8% !important; } /* Premium */

                #leadsTable th:nth-child(6),
                #leadsTable td:nth-child(6) { width: 8% !important; } /* Stage */

                #leadsTable th:nth-child(7),
                #leadsTable td:nth-child(7) { width: 12% !important; } /* To Do */

                #leadsTable th:nth-child(8),
                #leadsTable td:nth-child(8) { width: 9% !important; } /* Renewal Date */

                #leadsTable th:nth-child(9),
                #leadsTable td:nth-child(9) { width: 9% !important; } /* Assigned To */

                #leadsTable th:nth-child(10),
                #leadsTable td:nth-child(10) { width: 8% !important; } /* Created */

                #leadsTable th:nth-child(11),
                #leadsTable td:nth-child(11) { width: 10% !important; } /* Actions */

                /* Remove any max-width constraints */
                .table-container {
                    width: 100% !important;
                    max-width: none !important;
                    overflow-x: auto !important;
                }

                .leads-view {
                    width: 100% !important;
                    max-width: none !important;
                }

                /* Ensure the name column text is truncated properly */
                #leadsTable td:nth-child(2) .lead-name {
                    max-width: 150px !important;
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                    white-space: nowrap !important;
                }

                /* Ensure To Do text is bold and visible */
                #leadsTable td:nth-child(7) div {
                    font-weight: bold !important;
                    color: black !important;
                    white-space: nowrap !important;
                }

                /* Keep action buttons horizontal and compact */
                #leadsTable .action-buttons {
                    display: flex !important;
                    flex-direction: row !important;
                    gap: 3px !important;
                    justify-content: center !important;
                    align-items: center !important;
                    white-space: nowrap !important;
                }

                #leadsTable .btn-icon {
                    padding: 4px 6px !important;
                    font-size: 13px !important;
                    display: inline-block !important;
                }

                /* Green highlighting for reach out complete - HIGHEST PRIORITY */
                #leadsTable tr.reach-out-complete,
                #leadsTableBody tr.reach-out-complete,
                .reach-out-complete {
                    background-color: rgba(16, 185, 129, 0.2) !important;
                    background: rgba(16, 185, 129, 0.2) !important;
                    border-left: 4px solid #10b981 !important;
                    border-right: 2px solid #10b981 !important;
                }

                /* Ensure reach out complete overrides timestamp highlighting */
                #leadsTable tr.reach-out-complete.timestamp-highlighted,
                #leadsTableBody tr.reach-out-complete.timestamp-highlighted {
                    background-color: rgba(16, 185, 129, 0.2) !important;
                    background: rgba(16, 185, 129, 0.2) !important;
                    border-left: 4px solid #10b981 !important;
                    border-right: 2px solid #10b981 !important;
                }

                /* SUPER AGGRESSIVE GREEN HIGHLIGHTING - MAXIMUM PRIORITY */
                tr[style*="background-color: rgba(16, 185, 129"],
                tr.force-green-highlight,
                #leadsTable tbody tr.force-green-highlight,
                #leadsTableBody tr.force-green-highlight,
                table tr.force-green-highlight {
                    background-color: rgba(16, 185, 129, 0.2) !important;
                    background: rgba(16, 185, 129, 0.2) !important;
                    border-left: 4px solid #10b981 !important;
                    border-right: 2px solid #10b981 !important;
                }

                /* Override ANY other background on green highlighted rows */
                tr.force-green-highlight td,
                tr[style*="background-color: rgba(16, 185, 129"] td {
                    background: transparent !important;
                    background-color: transparent !important;
                }

                /* Nuclear option - inline style override */
                tr[style*="rgba(16, 185, 129"] {
                    background-color: rgba(16, 185, 129, 0.2) !important;
                    background: rgba(16, 185, 129, 0.2) !important;
                }
            `;
            if (!document.getElementById('lead-table-fix-styles')) {
                document.head.appendChild(style);
            }
        }

        // Get current leads
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        console.log(`📊 Found ${leads.length} leads to display`);

        // Check if table has wrong number of columns
        const firstRow = tableBody.querySelector('tr');
        if (firstRow) {
            const cellCount = firstRow.querySelectorAll('td').length;
            console.log(`📏 Current table has ${cellCount} columns`);

            if (cellCount !== 11) {
                console.log('❌ Wrong column count, fixing...');
                tableBody.innerHTML = window.generateSimpleLeadRows(leads);
                console.log('✅ Table fixed with correct columns');
                return true;
            }

            // Check if To Do column shows N/A
            const todoCell = firstRow.querySelectorAll('td')[6]; // 7th column (0-indexed)
            if (todoCell && (todoCell.textContent.includes('N/A') || todoCell.textContent.trim() === '')) {
                console.log('❌ To Do column shows N/A, fixing...');
                tableBody.innerHTML = window.generateSimpleLeadRows(leads);
                console.log('✅ Table fixed with proper To Do values');
                return true;
            }
        }

        return false;
    }

    // Make isHighlightActiveForLead globally available for highlighting function
    window.isHighlightActiveForLead = isHighlightActiveForLead;

    // Function to apply reach out complete highlighting
    function applyReachOutCompleteHighlighting() {
        console.log('🎨 Applying reach out complete highlighting...');

        const tableBody = document.getElementById('leadsTableBody');
        if (!tableBody) return;

        // Get leads data to check reach out status - check both storage locations
        let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        if (leads.length === 0) {
            leads = JSON.parse(localStorage.getItem('leads') || '[]');
            console.log(`🔍 Using 'leads' storage: ${leads.length} leads`);
        } else {
            console.log(`🔍 Using 'insurance_leads' storage: ${leads.length} leads`);
        }
        console.log(`🔍 Checking ${leads.length} leads for reach out complete status`);

        const rows = tableBody.querySelectorAll('tr');
        let highlightCount = 0;

        rows.forEach(row => {
            // Never override builtin highlights (yellow/orange/red timestamps, blue CSR-pending, etc.)
            if (row.dataset.highlightSource === 'builtin' || row.classList.contains('csr-done-pending')) return;

            // Find the lead ID from the checkbox first
            const checkbox = row.querySelector('.lead-checkbox');
            if (!checkbox) return;

            const leadId = checkbox.value;
            const lead = leads.find(l => String(l.id) === String(leadId));
            if (!lead) return;

            // Also skip if lead has a CSR task pending producer review
            const _sess = JSON.parse(sessionStorage.getItem('vanguard_user') || '{}');
            if ((_sess.role || '') !== 'csr' && lead.csrTodoDone && !lead.csrTodoAcknowledged) return;

            // Get TODO cell content
            const todoCell = row.querySelectorAll('td')[6];
            if (!todoCell) return;

            const todoText = todoCell.textContent.trim();

            // CRITICAL FIX: For ALL leads, check if they should have green highlighting
            // Only apply green highlighting if BOTH conditions are true:
            // 1. TODO is empty (reach-out complete)
            // 2. Highlight is actually ACTIVE (not expired/missing)

            const hasActiveHighlight = isHighlightActiveForLead(lead);
            const hasEmptyTodo = todoText === '' || todoText.length === 0;

            console.log(`🔍 Lead ${leadId} (${lead.name}): TODO="${todoText}", Active highlight=${hasActiveHighlight}`);

            // UPDATED LOGIC: Apply green highlighting if TODO is empty (universal rule)
            if (hasEmptyTodo) {
                // Empty TODO always gets green highlighting
                console.log(`✅ Lead ${leadId} - applying green highlight (empty TODO cell)`);
                row.style.setProperty('background-color', 'rgba(16, 185, 129, 0.2)', 'important');
                row.style.setProperty('background', 'rgba(16, 185, 129, 0.2)', 'important');
                row.style.setProperty('border-left', '4px solid #10b981', 'important');
                row.style.setProperty('border-right', '2px solid #10b981', 'important');
                row.classList.add('reach-out-complete');
                highlightCount++;
            } else {
                // Remove any existing green highlighting
                if (row.style.backgroundColor.includes('185, 129') || row.classList.contains('reach-out-complete')) {
                    console.log(`🔴 Lead ${leadId} - removing green highlight (TODO="${todoText}", Active=${hasActiveHighlight})`);
                }
                row.style.removeProperty('background-color');
                row.style.removeProperty('background');
                row.style.removeProperty('border-left');
                row.style.removeProperty('border-right');
                row.classList.remove('reach-out-complete');
            }
        });

        console.log(`🎨 Applied green highlighting to ${highlightCount} reach out complete leads`);
    }

    // DISABLED - Continuous updates that caused flashing
    // Run fix after a short delay to let everything load
    // setTimeout(() => {
    //     console.log('🚀 Running initial table fix...');
    //     fixLeadTable();
    //     setTimeout(applyReachOutCompleteHighlighting, 500);
    // }, 1000);

    // Also run fix after longer delay for async loads
    // setTimeout(() => {
    //     console.log('🚀 Running secondary table fix...');
    //     fixLeadTable();
    //     setTimeout(applyReachOutCompleteHighlighting, 500);
    // }, 3000);

    // DISABLED - Monitor for table changes that caused continuous updates and flashing
    // const observer = new MutationObserver((mutations) => {
    //     // Check if the table was modified
    //     let tableModified = false;
    //     mutations.forEach(mutation => {
    //         if (mutation.target.id === 'leadsTableBody' ||
    //             mutation.target.closest && mutation.target.closest('#leadsTableBody')) {
    //             tableModified = true;
    //         }
    //     });

    //     if (tableModified) {
    //         console.log('📋 Table was modified - reapplying highlights!');
    //         // Immediate application
    //         forceAllHighlighting();

    //         // Multiple delayed applications - DISABLED to prevent blinking
    //         // setTimeout(forceAllHighlighting, 1);
    //         // setTimeout(forceAllHighlighting, 10);
    //         // setTimeout(forceAllHighlighting, 25);
    //         // setTimeout(forceAllHighlighting, 50);
    //         // setTimeout(forceAllHighlighting, 100);
    //         // setTimeout(forceAllHighlighting, 200);
    //         // setTimeout(forceAllHighlighting, 300);
    //         setTimeout(forceAllHighlighting, 500);
    //     }
    // });

    // Start observing after initial delay - DISABLED to prevent blinking
    // setTimeout(() => {
    //     observer.observe(document.body, { childList: true, subtree: true });
    //     console.log('👀 Monitoring for table changes...');
    // }, 2000);

    // Make the function globally available for debugging
    window.applyReachOutCompleteHighlighting = applyReachOutCompleteHighlighting;

    // OVERRIDE sortLeads to preserve green highlighting
    if (window.sortLeads) {
        console.log('🎯 Overriding sortLeads function to preserve green highlighting');
        const originalSortLeads = window.sortLeads;

        window.sortLeads = function(field) {
            console.log(`📊 Sorting by ${field}...`);

            // Call the original sort function
            originalSortLeads(field);

            // RE-ENABLED: Apply yellow/orange highlighting after sort
            console.log('🎨 Reapplying highlighting after sort...');
            setTimeout(() => {
                forceAllHighlighting();
            }, 100);

            // DISABLED multiple calls that caused blinking:
            // setTimeout(() => { forceGreenHighlight(); }, 10);
            // setTimeout(() => { forceGreenHighlight(); }, 50);
            // setTimeout(() => { forceGreenHighlight(); }, 200);
            // setTimeout(() => { forceGreenHighlight(); }, 500);
        };
    }

    // Try to override sortLeads later if it doesn't exist yet
    setTimeout(() => {
        if (window.sortLeads && !window.sortLeads.toString().includes('forceGreenHighlight')) {
            console.log('🎯 Late override of sortLeads function');
            const originalSortLeads = window.sortLeads;

            window.sortLeads = function(field) {
                originalSortLeads(field);
                // DISABLED: Highlighting now built into table generation
                // setTimeout(forceAllHighlighting, 10);
                // setTimeout(forceAllHighlighting, 50);
                // setTimeout(forceAllHighlighting, 100);
                // setTimeout(forceAllHighlighting, 200);
                // setTimeout(forceAllHighlighting, 500);
            };
        }
    }, 3000);

    // DIAGNOSTIC function to see what's in the table
    window.diagnoseTable = function() {
        console.log('🔬 TABLE DIAGNOSIS');
        const tableBody = document.getElementById('leadsTableBody');

        if (!tableBody) {
            console.error('❌ NO TABLE BODY FOUND!');
            return;
        }

        const rows = tableBody.querySelectorAll('tr');
        console.log(`📊 Total rows: ${rows.length}`);

        rows.forEach((row, i) => {
            const cells = row.querySelectorAll('td');
            console.log(`\n=== ROW ${i} ===`);
            console.log(`Cells: ${cells.length}`);

            if (cells.length >= 7) {
                // Show what's in each important cell
                const nameCell = cells[1];
                const todoCell = cells[6];

                const name = nameCell ? (nameCell.textContent || '').trim() : 'NO NAME';
                const todoDiv = todoCell ? todoCell.querySelector('div') : null;
                const todoText = todoDiv ? todoDiv.textContent : (todoCell ? todoCell.textContent : 'NO TODO CELL');

                console.log(`Name: "${name}"`);
                console.log(`TO DO Cell HTML: ${todoCell ? todoCell.innerHTML : 'N/A'}`);
                console.log(`TO DO Text: "${todoText}"`);
                console.log(`TO DO Text (trimmed): "${todoText.trim()}"`);
                console.log(`TO DO Length: ${todoText.trim().length}`);
                console.log(`Is Empty? ${todoText.trim() === '' ? 'YES ✅' : 'NO ❌'}`);

                // Check current styles
                console.log(`Current row background: ${row.style.backgroundColor}`);
                console.log(`Has green class? ${row.classList.contains('reach-out-complete') || row.classList.contains('force-green-highlight')}`);
            }
        });
    };

    // RE-ENABLED: This provides the yellow/orange highlighting for the second view
    window.forceAllHighlighting = function() {
        console.log('🔥🔥🔥 FORCING ALL HIGHLIGHTS - DEBUGGING MODE 🔥🔥🔥');

        const tableBody = document.getElementById('leadsTableBody');
        if (!tableBody) {
            console.error('NO TABLE FOUND!');
            return;
        }

        // CHECK: If built-in highlighting is already working, don't interfere
        const builtinHighlightedRows = tableBody.querySelectorAll('tr[data-highlight-source="builtin"]');
        if (builtinHighlightedRows.length > 0) {
            console.log(`✅ Built-in highlighting active on ${builtinHighlightedRows.length} rows - using that instead`);
            return 'BUILTIN_ACTIVE';
        }

        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const rows = tableBody.querySelectorAll('tr');
        console.log(`Found ${rows.length} rows to check`);

        rows.forEach((row, rowIndex) => {
            // ANTI-BLINKING: Skip rows that already have stable highlighting
            if (row.classList.contains('reach-out-complete') ||
                row.classList.contains('force-green-highlight') ||
                row.style.backgroundColor && !row.dataset.needsUpdate) {
                console.log(`Row ${rowIndex}: Skipping - already properly highlighted`);
                return;
            }

            const cells = row.querySelectorAll('td');

            if (cells.length >= 7) {
                // Get the TO DO cell (7th column, index 6)
                const todoCell = cells[6];

                // Get all text from the cell
                let todoText = '';
                const todoDiv = todoCell.querySelector('div');
                if (todoDiv) {
                    todoText = todoDiv.innerText || todoDiv.textContent || '';
                } else {
                    todoText = todoCell.innerText || todoCell.textContent || '';
                }

                // Clean up the text
                todoText = todoText.trim().replace(/\s+/g, ' ');

                console.log(`Row ${rowIndex} TO DO: "${todoText}" (length: ${todoText.length})`);

                // FIRST CHECK: If TO DO has text, check for old timestamps
                if (todoText && todoText.length > 0 && !/^\s*$/.test(todoText)) {
                    console.log(`Row ${rowIndex} has TO DO text, checking timestamp...`);

                    // Get lead name to find matching lead data
                    const nameCell = cells[1];
                    const nameElement = nameCell.querySelector('strong');

                    if (nameElement) {
                        const displayName = nameElement.textContent.trim();

                        // IMPROVED: Use row index as primary matching method
                        let lead = null;

                        // Method 1: Direct index mapping (most reliable)
                        if (leads[rowIndex]) {
                            lead = leads[rowIndex];
                            console.log(`📍 Row ${rowIndex}: Using index mapping for ${lead.name}`);
                        }

                        // Method 2: Fallback to name matching if index fails
                        if (!lead) {
                            lead = leads.find(l => {
                                if (!l.name) return false;
                                const leadName = l.name.length > 15 ? l.name.substring(0, 15) + '...' : l.name;
                                return leadName === displayName || l.name === displayName ||
                                       l.name.includes(displayName.replace('...', '')) ||
                                       displayName.includes(l.name.substring(0, 10));
                            });
                            if (lead) {
                                console.log(`📍 Row ${rowIndex}: Using name matching for ${lead.name}`);
                            }
                        }

                        // Method 3: Super flexible matching
                        if (!lead && displayName.length > 3) {
                            lead = leads.find(l => {
                                if (!l.name) return false;
                                const cleanDisplay = displayName.replace('...', '').toLowerCase();
                                const cleanLead = l.name.toLowerCase();
                                return cleanDisplay.includes(cleanLead.substring(0, 8)) ||
                                       cleanLead.includes(cleanDisplay.substring(0, 8));
                            });
                            if (lead) {
                                console.log(`📍 Row ${rowIndex}: Using flexible matching for ${lead.name}`);
                            }
                        }

                        if (lead) {
                            // Get timestamp from available fields
                            let timestamp = null;
                            if (lead.stageTimestamps && lead.stageTimestamps[lead.stage]) {
                                timestamp = lead.stageTimestamps[lead.stage];
                            } else if (lead.stageUpdatedAt) {
                                timestamp = lead.stageUpdatedAt;
                            } else if (lead.updatedAt) {
                                timestamp = lead.updatedAt;
                            } else if (lead.createdAt) {
                                timestamp = lead.createdAt;
                            } else if (lead.created) {
                                // Convert from MM/DD/YYYY format
                                const parts = lead.created.split('/');
                                if (parts.length === 3) {
                                    timestamp = new Date(parts[2], parts[0] - 1, parts[1]).toISOString();
                                }
                            }

                            if (timestamp) {
                            const stageDate = new Date(timestamp);
                            const now = new Date();

                            // Calculate difference in days (ignore time)
                            const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                            const compareDate = new Date(stageDate.getFullYear(), stageDate.getMonth(), stageDate.getDate());
                            const diffTime = nowDate - compareDate;
                            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                            console.log(`Lead ${lead.name}: Days old = ${diffDays}`);

                            if (diffDays === 1) {
                                // YELLOW for 1 day old
                                console.log(`🟡 APPLYING YELLOW to row ${rowIndex}`);

                                // Force persistent yellow highlighting with multiple methods
                                row.setAttribute('style',
                                    'background-color: #fef3c7 !important;' +
                                    'background: #fef3c7 !important;' +
                                    'border-left: 4px solid #f59e0b !important;' +
                                    'border-right: 2px solid #f59e0b !important;'
                                );

                                row.style.setProperty('background-color', '#fef3c7', 'important');
                                row.style.setProperty('background', '#fef3c7', 'important');
                                row.style.setProperty('border-left', '4px solid #f59e0b', 'important');
                                row.style.setProperty('border-right', '2px solid #f59e0b', 'important');

                                row.classList.add('timestamp-yellow');
                                row.classList.add('force-persistent-highlight');

                                // Store the highlight in data attribute for persistence
                                row.setAttribute('data-highlight', 'yellow');
                                row.setAttribute('data-highlight-applied', 'true');

                                cells.forEach(cell => {
                                    cell.style.backgroundColor = 'transparent';
                                    cell.style.background = 'transparent';
                                });
                                return; // Skip to next row
                            } else if (diffDays === 2) {
                                // ORANGE for 2 days old
                                console.log(`🟠 APPLYING ORANGE to row ${rowIndex}`);

                                // Force persistent orange highlighting with multiple methods
                                row.setAttribute('style',
                                    'background-color: #fed7aa !important;' +
                                    'background: #fed7aa !important;' +
                                    'border-left: 4px solid #fb923c !important;' +
                                    'border-right: 2px solid #fb923c !important;'
                                );

                                row.style.setProperty('background-color', '#fed7aa', 'important');
                                row.style.setProperty('background', '#fed7aa', 'important');
                                row.style.setProperty('border-left', '4px solid #fb923c', 'important');
                                row.style.setProperty('border-right', '2px solid #fb923c', 'important');

                                row.classList.add('timestamp-orange');
                                row.classList.add('force-persistent-highlight');

                                // Store the highlight in data attribute for persistence
                                row.setAttribute('data-highlight', 'orange');
                                row.setAttribute('data-highlight-applied', 'true');

                                cells.forEach(cell => {
                                    cell.style.backgroundColor = 'transparent';
                                    cell.style.background = 'transparent';
                                });
                                return; // Skip to next row
                            } else if (diffDays >= 3) {
                                // RED for 3+ days old
                                console.log(`🔴 APPLYING RED to row ${rowIndex}`);

                                // Force persistent red highlighting with multiple methods
                                row.setAttribute('style',
                                    'background-color: #fecaca !important;' +
                                    'background: #fecaca !important;' +
                                    'border-left: 4px solid #ef4444 !important;' +
                                    'border-right: 2px solid #ef4444 !important;'
                                );

                                row.style.setProperty('background-color', '#fecaca', 'important');
                                row.style.setProperty('background', '#fecaca', 'important');
                                row.style.setProperty('border-left', '4px solid #ef4444', 'important');
                                row.style.setProperty('border-right', '2px solid #ef4444', 'important');

                                row.classList.add('timestamp-red');
                                row.classList.add('force-persistent-highlight');

                                // Store the highlight in data attribute for persistence
                                row.setAttribute('data-highlight', 'red');
                                row.setAttribute('data-highlight-applied', 'true');

                                cells.forEach(cell => {
                                    cell.style.backgroundColor = 'transparent';
                                    cell.style.background = 'transparent';
                                });
                                return; // Skip to next row
                            }
                            } // Close if (timestamp) block
                        }
                    }
                }

                // SECOND CHECK: If TO DO is empty, apply green
                if (!todoText || todoText === '' || todoText.length === 0 || /^\s*$/.test(todoText)) {
                    console.log(`🎯 ROW ${rowIndex} HAS EMPTY TO DO - APPLYING GREEN!`);

                    row.setAttribute('style',
                        'background-color: rgba(16, 185, 129, 0.2) !important;' +
                        'background: rgba(16, 185, 129, 0.2) !important;' +
                        'border-left: 4px solid #10b981 !important;' +
                        'border-right: 2px solid #10b981 !important;'
                    );

                    row.style.setProperty('background-color', 'rgba(16, 185, 129, 0.2)', 'important');
                    row.style.setProperty('background', 'rgba(16, 185, 129, 0.2)', 'important');
                    row.style.setProperty('border-left', '4px solid #10b981', 'important');
                    row.style.setProperty('border-right', '2px solid #10b981', 'important');

                    row.classList.add('reach-out-complete');
                    row.classList.add('force-green-highlight');

                    cells.forEach(cell => {
                        cell.style.backgroundColor = 'transparent';
                        cell.style.background = 'transparent';
                    });
                }
            }
        });

        // ADD PERSISTENCE MECHANISM - Watch for style changes and re-apply highlighting
        console.log('🔒 Setting up highlighting persistence mechanism...');

        // DISABLED PERSISTENCE MECHANISM - Let CSS handle it
        console.log('🔒 Highlighting applied - CSS will maintain persistence automatically');
    };

    // RE-ENABLED: These provide the yellow/orange highlighting system
    window.forceGreenHighlight = window.forceAllHighlighting;
    window.forceTimestampHighlight = window.forceAllHighlighting;
    window.highlightEmptyTodos = window.forceGreenHighlight;

    // Debug function to check reach out data
    window.debugReachOutStatus = function() {
        console.log('🔍 DEBUG: Checking all leads for reach out status...');
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

        leads.forEach(lead => {
            if (lead.reachOut) {
                console.log(`Lead: ${lead.name} (${lead.id})`);
                console.log(`  Stage: ${lead.stage}`);
                console.log(`  ReachOut:`, lead.reachOut);

                const reachOut = lead.reachOut;
                const stage = lead.stage || 'new';

                if (stage === 'quoted' || stage === 'info_requested' ||
                    stage === 'quote_sent' || stage === 'quote-sent-unaware' || stage === 'quote-sent-aware' ||
                    stage === 'interested') {

                    if (reachOut.callsConnected > 0) {
                        console.log(`  ✅ COMPLETE - Connected call made`);
                    } else if (reachOut.callAttempts > 0 && reachOut.emailCount > 0 && reachOut.textCount > 0) {
                        console.log(`  ✅ COMPLETE - All methods attempted`);
                    } else {
                        console.log(`  ❌ NOT COMPLETE - Missing: ${reachOut.callAttempts === 0 ? 'Call' : ''} ${reachOut.emailCount === 0 ? 'Email' : ''} ${reachOut.textCount === 0 ? 'Text' : ''}`);
                    }
                }
            }
        });
    };

    // OLD FUNCTION - DISABLED - NOW USING forceAllHighlighting
    window.forceTimestampHighlight_OLD_DISABLED = function() {
        console.log('⏰ FORCING TIMESTAMP-BASED HIGHLIGHT');

        const tableBody = document.getElementById('leadsTableBody');
        if (!tableBody) return;

        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const rows = tableBody.querySelectorAll('tr');
        let highlightCount = 0;

        rows.forEach((row, rowIndex) => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 7) return;

            // Get the TO DO cell text directly from DOM (7th column, index 6)
            const todoCell = cells[6];
            let todoText = '';
            const todoDiv = todoCell.querySelector('div');
            if (todoDiv) {
                todoText = todoDiv.innerText || todoDiv.textContent || '';
            } else {
                todoText = todoCell.innerText || todoCell.textContent || '';
            }

            // Clean up the text
            todoText = todoText.trim().replace(/\s+/g, ' ');

            // Skip if TO DO is empty (those get green highlight)
            if (!todoText || todoText === '' || todoText.length === 0 || /^\s*$/.test(todoText)) {
                return;
            }

            // Get lead name from the row to match with lead data
            const nameCell = cells[1];
            const nameElement = nameCell.querySelector('strong');
            if (!nameElement) return;

            const displayName = nameElement.textContent.trim();

            // Find matching lead
            const lead = leads.find(l => {
                const leadName = l.name && l.name.length > 15 ? l.name.substring(0, 15) + '...' : l.name || '';
                return leadName === displayName || l.name === displayName;
            });

            if (!lead) {
                console.log(`❌ Could not find lead for ${displayName}`);
                return;
            }

            // Skip if this is another user's lead (already greyed out)
            const userData = sessionStorage.getItem('vanguard_user');
            let currentUser = '';
            if (userData) {
                const user = JSON.parse(userData);
                currentUser = user.username.charAt(0).toUpperCase() + user.username.slice(1).toLowerCase();
            }

            const isOtherUsersLead = lead.assignedTo && lead.assignedTo !== currentUser && currentUser !== '';
            if (isOtherUsersLead) return;

            // Now check timestamp
            if (lead.stageTimestamps && lead.stageTimestamps[lead.stage]) {
                const timestamp = lead.stageTimestamps[lead.stage];
                const stageDate = new Date(timestamp);
                const now = new Date();

                // Calculate difference in days
                const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const compareDate = new Date(stageDate.getFullYear(), stageDate.getMonth(), stageDate.getDate());
                const diffTime = nowDate - compareDate;
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                console.log(`Lead ${lead.name}: TO DO="${todoText}", Days old=${diffDays}`);

                // Apply highlighting based on age using ALL methods like green highlighting
                if (diffDays === 1) {
                    // Yellow for yesterday
                    console.log(`🟡 Applying YELLOW highlight to ${lead.name} (1 day old with TO DO)`);

                    // Method 1: Direct style attribute
                    row.setAttribute('style',
                        'background-color: #fef3c7 !important;' +
                        'background: #fef3c7 !important;' +
                        'border-left: 4px solid #f59e0b !important;' +
                        'border-right: 2px solid #f59e0b !important;'
                    );

                    // Method 2: Individual style properties
                    row.style.backgroundColor = '#fef3c7';
                    row.style.background = '#fef3c7';
                    row.style.borderLeft = '4px solid #f59e0b';
                    row.style.borderRight = '2px solid #f59e0b';

                    // Method 3: Set important flag
                    row.style.setProperty('background-color', '#fef3c7', 'important');
                    row.style.setProperty('background', '#fef3c7', 'important');
                    row.style.setProperty('border-left', '4px solid #f59e0b', 'important');
                    row.style.setProperty('border-right', '2px solid #f59e0b', 'important');

                    // Method 4: Add class
                    row.classList.add('timestamp-yellow');
                    highlightCount++;

                } else if (diffDays > 1 && diffDays < 7) {
                    // Orange for 2-6 days
                    console.log(`🟠 Applying ORANGE highlight to ${lead.name} (${diffDays} days old with TO DO)`);

                    // Method 1: Direct style attribute
                    row.setAttribute('style',
                        'background-color: #fed7aa !important;' +
                        'background: #fed7aa !important;' +
                        'border-left: 4px solid #fb923c !important;' +
                        'border-right: 2px solid #fb923c !important;'
                    );

                    // Method 2: Individual style properties
                    row.style.backgroundColor = '#fed7aa';
                    row.style.background = '#fed7aa';
                    row.style.borderLeft = '4px solid #fb923c';
                    row.style.borderRight = '2px solid #fb923c';

                    // Method 3: Set important flag
                    row.style.setProperty('background-color', '#fed7aa', 'important');
                    row.style.setProperty('background', '#fed7aa', 'important');
                    row.style.setProperty('border-left', '4px solid #fb923c', 'important');
                    row.style.setProperty('border-right', '2px solid #fb923c', 'important');

                    // Method 4: Add class
                    row.classList.add('timestamp-orange');
                    highlightCount++;

                } else if (diffDays >= 7) {
                    // Red for 7+ days
                    console.log(`🔴 Applying RED highlight to ${lead.name} (${diffDays} days old with TO DO)`);

                    // Method 1: Direct style attribute
                    row.setAttribute('style',
                        'background-color: #fecaca !important;' +
                        'background: #fecaca !important;' +
                        'border-left: 4px solid #ef4444 !important;' +
                        'border-right: 2px solid #ef4444 !important;'
                    );

                    // Method 2: Individual style properties
                    row.style.backgroundColor = '#fecaca';
                    row.style.background = '#fecaca';
                    row.style.borderLeft = '4px solid #ef4444';
                    row.style.borderRight = '2px solid #ef4444';

                    // Method 3: Set important flag
                    row.style.setProperty('background-color', '#fecaca', 'important');
                    row.style.setProperty('background', '#fecaca', 'important');
                    row.style.setProperty('border-left', '4px solid #ef4444', 'important');
                    row.style.setProperty('border-right', '2px solid #ef4444', 'important');

                    // Method 4: Add class
                    row.classList.add('timestamp-red');
                    highlightCount++;
                }
            } else {
                console.log(`No timestamp found for ${lead.name} stage ${lead.stage}`);
            }
        });

        console.log(`⏰ Applied timestamp highlighting to ${highlightCount} leads`);
    };

    // ULTRA AGGRESSIVE HIGHLIGHTING - RUN MULTIPLE TIMES
    function runAggressiveHighlighting() {
        console.log('💪 AGGRESSIVE HIGHLIGHTING PASS');
        forceAllHighlighting(); // This does both timestamp and green

        // Also inject a style tag to make absolutely sure
        const styleId = 'force-green-style';
        let forceStyle = document.getElementById(styleId);
        if (!forceStyle) {
            forceStyle = document.createElement('style');
            forceStyle.id = styleId;
            document.head.appendChild(forceStyle);
        }

        forceStyle.innerHTML = `
            tr.force-green-highlight,
            tr[style*="rgba(16, 185, 129"] {
                background-color: rgba(16, 185, 129, 0.2) !important;
                background: rgba(16, 185, 129, 0.2) !important;
                border-left: 4px solid #10b981 !important;
                border-right: 2px solid #10b981 !important;
            }
            tr.force-green-highlight > td {
                background: transparent !important;
            }

            /* Timestamp-based highlighting */
            tr.timestamp-yellow,
            tr[style*="#fef3c7"] {
                background-color: #fef3c7 !important;
                background: #fef3c7 !important;
                border-left: 4px solid #f59e0b !important;
                border-right: 2px solid #f59e0b !important;
            }
            tr.timestamp-orange,
            tr[style*="#fed7aa"] {
                background-color: #fed7aa !important;
                background: #fed7aa !important;
                border-left: 4px solid #fb923c !important;
                border-right: 2px solid #fb923c !important;
            }
            tr.timestamp-red,
            tr[style*="#fecaca"] {
                background-color: #fecaca !important;
                background: #fecaca !important;
                border-left: 4px solid #ef4444 !important;
                border-right: 2px solid #ef4444 !important;
            }
            tr.timestamp-yellow > td,
            tr.timestamp-orange > td,
            tr.timestamp-red > td {
                background: transparent !important;
            }
        `;
    }

    // Debug function to check what's happening
    window.debugTimestampHighlight = function() {
        console.log('🔍 DEBUGGING TIMESTAMP HIGHLIGHT');
        const tableBody = document.getElementById('leadsTableBody');
        if (!tableBody) {
            console.error('No table body found!');
            return;
        }

        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const rows = tableBody.querySelectorAll('tr');

        console.log(`Found ${rows.length} rows and ${leads.length} leads`);

        rows.forEach((row, index) => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 7) {
                const nameCell = cells[1];
                const todoCell = cells[6];

                const name = nameCell.textContent.trim();
                const todo = todoCell.textContent.trim();

                // Find matching lead
                const lead = leads.find(l => l.name && (l.name.includes(name) || name.includes(l.name)));

                if (lead && lead.stageTimestamps && lead.stageTimestamps[lead.stage]) {
                    const timestamp = lead.stageTimestamps[lead.stage];
                    const stageDate = new Date(timestamp);
                    const now = new Date();
                    const diffDays = Math.round((now - stageDate) / (1000 * 60 * 60 * 24));

                    console.log(`Row ${index}: ${name}`);
                    console.log(`  TO DO: "${todo}" (length: ${todo.length})`);
                    console.log(`  Stage: ${lead.stage}`);
                    console.log(`  Timestamp: ${timestamp}`);
                    console.log(`  Days old: ${diffDays}`);
                    console.log(`  Should highlight: ${todo.length > 0 && diffDays > 0 ? 'YES' : 'NO'}`);
                }
            }
        });
    };

    // DISABLED: These were overriding correct initial highlighting
    // setTimeout(runAggressiveHighlighting, 500);
    // setTimeout(runAggressiveHighlighting, 1000);
    // DISABLED multiple aggressive timeouts to prevent blinking
    // setTimeout(runAggressiveHighlighting, 1500);
    // setTimeout(runAggressiveHighlighting, 2000);
    // setTimeout(runAggressiveHighlighting, 3000);
    // setTimeout(runAggressiveHighlighting, 4000);
    // setTimeout(runAggressiveHighlighting, 5000);

    // Make debug function available
    window.testTimestampHighlight = function() {
        window.debugTimestampHighlight();
        window.forceAllHighlighting();
    };

    // Also expose the combined function directly
    window.forceHighlights = window.forceAllHighlighting;

    // Then run every 2 seconds forever - DISABLED to prevent blinking
    // setInterval(runAggressiveHighlighting, 2000);

    console.log('✅ FINAL LEAD TABLE FIX READY');

    // DISABLED: This was interfering with correct initial highlighting
    // setTimeout(() => {
        console.log('🚨 AUTO-FIXING HARRY WELLING...');

        // Force table regeneration if needed
        if (window.generateSimpleLeadRows) {
            const tableBody = document.querySelector('#leadsTableBody') || document.querySelector('tbody');
            if (tableBody) {
                const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                tableBody.innerHTML = window.generateSimpleLeadRows(leads);
                console.log('✅ Table regenerated');
            }
        }

        // DISABLED: This was interfering with correct initial highlighting
        // setTimeout(applyReachOutCompleteHighlighting, 500);

        // Verify and manual fix if needed
        // setTimeout(() => {
            // const tableBody = document.querySelector('#leadsTableBody') || document.querySelector('tbody');
            // if (tableBody) {
                // const rows = tableBody.querySelectorAll('tr');
                // rows.forEach(row => {
                    // const nameCell = row.querySelector('td:first-child');
                    // if (nameCell && nameCell.textContent.includes('HARRY WELLING')) {
                        // const todoCell = row.querySelectorAll('td')[6];
                        // if (todoCell) {
                            // const currentText = todoCell.textContent.trim();
                            // const hasRedStyling = todoCell.innerHTML.includes('color: #dc2626');

                            // console.log(`🔍 Harry Welling TODO: "${currentText}", Red styling: ${hasRedStyling}`);

                            // if (!hasRedStyling || !currentText.toLowerCase().includes('reach')) {
                                // console.log('🔧 FORCE FIXING Harry Welling TODO cell...');
                                // todoCell.innerHTML = '<span style="color: #dc2626; font-weight: bold;">Reach out</span>';
                            // }
                        // }

                        // Remove any green highlighting
                        // row.style.removeProperty('background-color');
                        // row.style.removeProperty('background');
                        // row.style.removeProperty('border-left');
                        // row.style.removeProperty('border-right');
                        // row.classList.remove('reach-out-complete');

                        // console.log('✅ Harry Welling fixed: Red TODO text + No green highlight');
                    // }
                // });
            // }
        // }, 1500);
    // }, 3000);

    // RUN IMMEDIATELY ONE MORE TIME - DISABLED to prevent blinking
    // setTimeout(() => {
    //     console.log('🚀 IMMEDIATE FINAL HIGHLIGHT RUN');
    //     forceAllHighlighting();
    // }, 100);
})();