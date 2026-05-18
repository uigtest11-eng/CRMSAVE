// Fix Expired Highlight Table Display - Show proper "Reach out: CALL" links for expired highlights
console.log('🔧 EXPIRED HIGHLIGHT TABLE FIX: Loading fix for expired highlight leads...');

// Function to create proper reach out call link
function createReachOutCallLink(lead) {
    if (!lead || !lead.phone) {
        console.warn('⚠️ REACH OUT LINK: No phone number available for lead', lead?.id);
        return '<div style="font-weight: bold; color: #dc2626;">Reach Out</div>';
    }

    const phoneNumber = lead.phone || '';
    const leadId = lead.id || '';
    const clickHandler = `handleReachOutCall('${leadId}', '${phoneNumber}')`;

    return `<div style="font-weight: bold; color: #dc2626;"><a href="tel:${phoneNumber}" onclick="${clickHandler}" style="color: #dc2626; font-weight: bold; text-decoration: none; cursor: pointer;">Reach out: CALL</a></div>`;
}

// Function to check if lead should show reach out call link (expired highlights)
function shouldShowReachOutCallLink(lead) {
    // CSR users never get stage-based reach out links — they use csrTodo only
    try {
        const _csrChk = JSON.parse(sessionStorage.getItem('vanguard_user') || '{}');
        if ((_csrChk.role || '') === 'csr') return false;
    } catch(e) {}
    if (!lead || !lead.reachOut) return false;

    // Check if lead had completion but highlight expired
    const hasCompletion = lead.reachOut.completedAt || lead.reachOut.reachOutCompletedAt;
    const hasHighlightDuration = lead.reachOut.greenHighlightUntil;

    if (hasCompletion && hasHighlightDuration) {
        try {
            const now = new Date();
            const expiry = new Date(lead.reachOut.greenHighlightUntil);
            const isExpired = now > expiry;

            console.log(`🔍 EXPIRE CHECK: Lead ${lead.id} - hasCompletion=${hasCompletion}, isExpired=${isExpired}, expiry=${expiry.toLocaleString()}`);
            return isExpired; // Show call link if highlight expired
        } catch (e) {
            console.warn('Error checking highlight expiry:', e);
            return false;
        }
    }

    // Also check stages that should show reach out but don't have active highlights
    const stagesRequiringReachOut = ['quoted', 'info_requested', 'quote_sent', 'quote-sent-unaware', 'quote-sent-aware', 'interested', 'contact_attempted', 'loss_runs_requested'];

    if (stagesRequiringReachOut.includes(lead.stage)) {
        // Check if has active highlight
        if (hasHighlightDuration) {
            try {
                const now = new Date();
                const expiry = new Date(lead.reachOut.greenHighlightUntil);
                const hasActiveHighlight = now < expiry;

                // If no active highlight and no recent completion, show call link
                if (!hasActiveHighlight && !hasCompletion) {
                    console.log(`🔍 STAGE REACH OUT: Lead ${lead.id} stage ${lead.stage} needs reach out - no active highlight/completion`);
                    return true;
                }
            } catch (e) {
                return true; // Default to showing reach out if can't parse date
            }
        } else {
            // No highlight duration at all, show reach out for these stages
            console.log(`🔍 STAGE REACH OUT: Lead ${lead.id} stage ${lead.stage} needs reach out - no highlight duration`);
            return true;
        }
    }

    return false;
}

// Enhanced getNextAction function that properly handles expired highlights
function getNextActionExpiredFix(stage, lead) {
    console.log(`🔧 EXPIRED FIX: Checking lead ${lead?.id} stage ${stage}`);

    // Special case for app sent stage
    if (stage === 'app sent') {
        return '';
    }

    // Check if should show reach out call link
    if (shouldShowReachOutCallLink(lead)) {
        const callLink = createReachOutCallLink(lead);
        console.log(`✅ EXPIRED FIX: Lead ${lead?.id} gets reach out call link`);
        return callLink;
    }

    // For leads with active highlights, show empty (will be green highlighted)
    if (lead && lead.reachOut && lead.reachOut.greenHighlightUntil) {
        try {
            const now = new Date();
            const expiry = new Date(lead.reachOut.greenHighlightUntil);
            const hasActiveHighlight = now < expiry;

            if (hasActiveHighlight) {
                console.log(`✅ EXPIRED FIX: Lead ${lead.id} has active highlight - showing empty TODO`);
                return '';
            }
        } catch (e) {
            // If can't parse date, continue to default logic
        }
    }

    // Default stage-based actions
    const actionMap = {
        'new': 'Assign Stage',
        'info_received': 'Prepare Quote',
        'quoted': 'Reach out',
        'info_requested': 'Reach out',
        'quote_sent': 'Reach out',
        'quote-sent-unaware': 'Reach out',
        'quote-sent-aware': 'Reach out',
        'interested': 'Reach out',
        'contact_attempted': 'Reach out',
        'loss_runs_requested': 'Reach out',
        'not-interested': 'Archive lead',
        'closed': 'Process complete'
    };

    const action = actionMap[stage] || 'Review lead';
    console.log(`🔧 EXPIRED FIX: Lead ${lead?.id} stage ${stage} - default action: ${action}`);
    return action;
}

// Function to fix table display for expired highlight leads
function fixExpiredHighlightTableDisplay() {
    // CSR users: skip all expired-highlight DOM overrides (they use csrTodo)
    try {
        const _csrFixChk = JSON.parse(sessionStorage.getItem('vanguard_user') || '{}');
        if ((_csrFixChk.role || '') === 'csr') return;
    } catch(e) {}

    console.log('🔧 EXPIRED FIX: Fixing table display for expired highlight leads...');

    try {
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const tableBody = document.querySelector('#leadsTableBody, #leadsTable tbody');

        if (!tableBody) {
            console.warn('⚠️ EXPIRED FIX: Table body not found');
            return;
        }

        let fixedCount = 0;

        // Find all table rows
        const rows = tableBody.querySelectorAll('tr');

        rows.forEach((row, index) => {
            const checkbox = row.querySelector('.lead-checkbox');
            if (!checkbox) return;

            const leadId = checkbox.value;
            const lead = leads.find(l => String(l.id) === String(leadId));

            if (!lead) return;

            // Check if this lead should show reach out call link
            if (shouldShowReachOutCallLink(lead)) {
                // Find the TODO cell (usually 7th td, but let's be flexible)
                const cells = row.querySelectorAll('td');
                let todoCell = null;

                // Try to find the cell with reach out content
                cells.forEach(cell => {
                    const content = cell.innerHTML.toLowerCase();
                    if (content.includes('reach out') || content.includes('reach') ||
                        content.includes('todo') || content.includes('div style')) {
                        todoCell = cell;
                    }
                });

                // If not found, assume it's the 7th cell (0-indexed = 6)
                if (!todoCell && cells.length > 6) {
                    todoCell = cells[6];
                }

                if (todoCell) {
                    const currentContent = todoCell.innerHTML.trim();
                    const hasProperCallLink = currentContent.includes('tel:') && currentContent.includes('Reach out: CALL');

                    if (!hasProperCallLink) {
                        console.log(`🔧 EXPIRED FIX: Updating lead ${leadId} (${lead.name}) table cell`);

                        // Replace with proper call link
                        todoCell.innerHTML = createReachOutCallLink(lead);
                        fixedCount++;
                    }
                }
            }
        });

        if (fixedCount > 0) {
            console.log(`✅ EXPIRED FIX: Fixed ${fixedCount} expired highlight table displays`);
        } else {
            console.log('✅ EXPIRED FIX: No expired highlight displays needed fixing');
        }

    } catch (error) {
        console.error('❌ EXPIRED FIX: Error fixing table display:', error);
    }
}

// Override getNextAction to include expired highlight fix
if (window.getNextAction) {
    const originalGetNextAction = window.getNextAction;

    window.getNextAction = function(stage, lead) {
        // First try expired highlight fix
        const expiredFixResult = getNextActionExpiredFix(stage, lead);

        // If expired fix has a specific result for this lead, use it
        if (lead && shouldShowReachOutCallLink(lead) && expiredFixResult.includes('tel:')) {
            console.log(`🔧 EXPIRED OVERRIDE: Using expired fix result for lead ${lead.id}`);
            return expiredFixResult;
        }

        // Otherwise use original function
        return originalGetNextAction.apply(this, arguments);
    };

    console.log('✅ EXPIRED FIX: Overrode getNextAction function');
} else {
    window.getNextAction = getNextActionExpiredFix;
    console.log('✅ EXPIRED FIX: Created new getNextAction function');
}

// Make helper functions globally available
window.shouldShowReachOutCallLink = shouldShowReachOutCallLink;
window.createReachOutCallLink = createReachOutCallLink;
window.fixExpiredHighlightTableDisplay = fixExpiredHighlightTableDisplay;

// Auto-fix on page load
setTimeout(() => {
    fixExpiredHighlightTableDisplay();
}, 2000);

// AGGRESSIVE HOOKING - Hook into ALL possible table refresh functions
const functionsToHook = ['displayLeads', 'loadLeadsView', 'refreshLeads', 'renderLeads'];

functionsToHook.forEach(funcName => {
    if (window[funcName]) {
        const originalFunc = window[funcName];

        window[funcName] = function() {
            console.log(`🔧 EXPIRED FIX: ${funcName} called - will fix table after`);
            const result = originalFunc.apply(this, arguments);

            // Fix expired highlights after each function call
            setTimeout(() => {
                fixExpiredHighlightTableDisplay();
            }, 100);

            // Also fix after a longer delay in case there are cascading calls
            setTimeout(() => {
                fixExpiredHighlightTableDisplay();
            }, 1000);

            return result;
        };

        console.log(`✅ EXPIRED FIX: Hooked into ${funcName} function`);
    }
});

// Also hook into localStorage changes that might trigger table updates
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
    const result = originalSetItem.apply(this, arguments);

    if (key === 'insurance_leads') {
        console.log('🔧 EXPIRED FIX: localStorage updated - will fix table');
        setTimeout(() => {
            fixExpiredHighlightTableDisplay();
        }, 200);
        setTimeout(() => {
            fixExpiredHighlightTableDisplay();
        }, 1500);
    }

    return result;
};

// Periodic aggressive checking every 5 seconds
setInterval(() => {
    const tableBody = document.querySelector('#leadsTableBody, #leadsTable tbody');
    if (tableBody) {
        fixExpiredHighlightTableDisplay();
    }
}, 5000);

console.log('✅ EXPIRED FIX: Aggressive hooking and periodic checking enabled');

console.log('✅ EXPIRED HIGHLIGHT TABLE FIX: Comprehensive fix loaded successfully!');