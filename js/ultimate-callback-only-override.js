// ULTIMATE CALLBACK-ONLY OVERRIDE
// This completely disables ALL other TO DO systems and enforces ONLY callback-based logic
// RULE: Red "Reach out: CALL" ONLY shows when there's an OVERDUE scheduled callback

// CSR users: skip entirely — CSRs use csrTodo, not callback-based reach outs
var _ucoIsCsr = false;
try { _ucoIsCsr = (JSON.parse(sessionStorage.getItem('vanguard_user') || '{}').role || '') === 'csr'; } catch(e) {}
if (_ucoIsCsr) { console.log('Ultimate Callback Override: skipped for CSR'); } else {

console.log('🛡️ LOADED: Ultimate Callback-Only Override - Disabling ALL competing systems');

// NUCLEAR OPTION: Disable all competing systems immediately and repeatedly
function nukeAllCompetingSystems() {
    console.log('💣 NUCLEAR OVERRIDE: Disabling all competing TO DO systems...');

    // Disable the expired highlight system by overriding its key functions
    window.checkExpiredHighlight = function() { return false; };
    window.applyExpiredHighlightFix = function() { return; };
    window.updateExpiredHighlightInTable = function() { return; };
    window.forceUpdateExpiredTableCells = function() { return; };

    // Disable emergency callback fix system
    window.emergencyCallbackCheck = function() { return; };
    window.applyEmergencyCallbackFix = function() { return; };

    // Disable any other reach-out systems
    window.checkReachOutRequirement = function() { return false; };
    window.applyReachOutStyling = function() { return; };
    window.updateReachOutStatus = function() { return; };

    // Clear any running intervals that might be updating the table
    if (window.expiredHighlightInterval) {
        clearInterval(window.expiredHighlightInterval);
        window.expiredHighlightInterval = null;
        console.log('🛑 Cleared expired highlight interval');
    }

    if (window.emergencyCallbackInterval) {
        clearInterval(window.emergencyCallbackInterval);
        window.emergencyCallbackInterval = null;
        console.log('🛑 Cleared emergency callback interval');
    }

    console.log('💥 NUCLEAR OVERRIDE COMPLETE: All competing systems disabled');
}

// ULTIMATE CALLBACK-ONLY getNextAction function
function ultimateCallbackOnlyGetNextAction(stage, lead) {
    console.log(`🎯 ULTIMATE CALLBACK-ONLY: Lead ${lead?.id} - Stage: ${stage}`);

    // ONLY check for overdue scheduled callbacks - nothing else matters
    if (lead && lead.id) {
        const isCallbackOverdue = checkUltimateOverdueCallback(lead.id);
        console.log(`📞 ULTIMATE CALLBACK CHECK: Lead ${lead.id} - isOverdue: ${isCallbackOverdue}`);

        if (isCallbackOverdue) {
            const phoneNumber = lead?.phone || '';
            const leadId = lead?.id || '';
            const clickHandler = `handleReachOutCall('${leadId}', '${phoneNumber}')`;
            console.log(`🔴 ULTIMATE OVERDUE CALLBACK: Showing "Reach out: CALL" for lead ${leadId}`);
            return `<a href="tel:${phoneNumber}" onclick="${clickHandler}" style="color: #dc2626; font-weight: bold; text-decoration: none; cursor: pointer;">Reach out: CALL</a>`;
        }
    }

    // Standard stage-based actions (no reach-out complexity)
    const actionMap = {
        'new': 'Assign Stage',
        'info_received': 'Prepare Quote',
        'loss_runs_received': 'Prepare app.',
        'app_prepared': 'Email brokers',
        'app_sent': '', // App sent leads should show nothing
        'not-interested': 'Archive lead',
        'closed': 'Process complete'
    };

    const result = actionMap[stage] || '';
    console.log(`📋 ULTIMATE STANDARD TODO: Lead ${lead?.id} - Stage: ${stage} → "${result}"`);
    return result;
}

// Ultimate overdue callback checker
function checkUltimateOverdueCallback(leadId) {
    try {
        const callbacks = JSON.parse(localStorage.getItem('scheduled_callbacks') || '{}');
        const leadCallbacks = callbacks[leadId] || [];
        const now = new Date();

        const overdueCallback = leadCallbacks.find(callback => {
            if (callback.completed) return false;
            const callbackDateTime = new Date(callback.dateTime);
            return callbackDateTime < now;
        });

        return !!overdueCallback;
    } catch (error) {
        console.error('❌ Error in ultimate overdue callback check:', error);
        return false;
    }
}

// AGGRESSIVE INSTALLATION FUNCTION
function installUltimateOverride() {
    console.log('🛡️ INSTALLING ULTIMATE CALLBACK-ONLY OVERRIDE...');

    // First, nuke all competing systems
    nukeAllCompetingSystems();

    // Override ALL possible getNextAction functions
    window.getNextAction = ultimateCallbackOnlyGetNextAction;
    window.ultimateGetNextAction = ultimateCallbackOnlyGetNextAction;
    window.getNextActionFixed = ultimateCallbackOnlyGetNextAction;
    window.getNextActionEnhanced = ultimateCallbackOnlyGetNextAction;
    window.getNextActionExpiredFix = ultimateCallbackOnlyGetNextAction;
    window.getNextActionAppSentOverride = ultimateCallbackOnlyGetNextAction;
    window.getNextActionEmergencyFix = ultimateCallbackOnlyGetNextAction;

    // Override protected functions if they exist
    if (window.protectedFunctions) {
        window.protectedFunctions.getNextAction = ultimateCallbackOnlyGetNextAction;
    }

    // Override any table generation functions to use our logic
    if (window.generateSimpleLeadRows) {
        const originalGenerate = window.generateSimpleLeadRows;
        window.generateSimpleLeadRows = function(leads) {
            const result = originalGenerate(leads);
            setTimeout(() => {
                forceCleanAllTableCells();
            }, 100);
            return result;
        };
    }

    if (window.displayLeads) {
        const originalDisplay = window.displayLeads;
        window.displayLeads = function() {
            const result = originalDisplay();
            setTimeout(() => {
                forceCleanAllTableCells();
            }, 100);
            return result;
        };
    }

    console.log('✅ ULTIMATE OVERRIDE INSTALLED: Only overdue callbacks will trigger red TO DO');
}

// Function to force clean all table cells and remove incorrect "Reach out: CALL" text
function forceCleanAllTableCells() {
    console.log('🧹 FORCE CLEANING: Removing incorrect "Reach out: CALL" from table cells...');

    try {
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const tableBody = document.querySelector('#leadsTableBody') || document.querySelector('tbody');

        if (!tableBody) return;

        const rows = tableBody.querySelectorAll('tr');
        let cleanedCount = 0;

        rows.forEach(row => {
            const checkbox = row.querySelector('.lead-checkbox');
            if (!checkbox) return;

            const leadId = checkbox.value;
            const lead = leads.find(l => String(l.id) === String(leadId));
            if (!lead) return;

            const todoCell = row.querySelectorAll('td')[7]; // TODO column
            if (!todoCell) return;

            // Check if this lead actually has overdue callbacks
            const hasOverdueCallback = checkUltimateOverdueCallback(leadId);

            if (!hasOverdueCallback) {
                // If no overdue callback, remove any "Reach out: CALL" text
                const currentText = todoCell.textContent || '';
                if (currentText.includes('Reach out: CALL') || currentText.includes('reach out') || currentText.includes('call')) {
                    // Replace with proper stage-based action
                    const correctAction = ultimateCallbackOnlyGetNextAction(lead.stage, lead);
                    todoCell.innerHTML = correctAction || '';
                    cleanedCount++;
                    console.log(`🧽 CLEANED: Lead ${leadId} - removed incorrect reach out text, replaced with: "${correctAction}"`);
                }
            }
        });

        console.log(`✅ FORCE CLEAN COMPLETE: Cleaned ${cleanedCount} table cells`);
    } catch (error) {
        console.error('❌ Error in force clean:', error);
    }
}

// IMMEDIATE INSTALLATION
setTimeout(() => {
    console.log('🚀 IMMEDIATE INSTALL: Ultimate callback-only override');
    installUltimateOverride();
    setTimeout(forceCleanAllTableCells, 500);
}, 100);

// AGGRESSIVE REPEATED INSTALLATION to ensure it overrides everything
setTimeout(installUltimateOverride, 1000);
setTimeout(installUltimateOverride, 3000);
setTimeout(installUltimateOverride, 5000);

// DOM LOADED INSTALLATION
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        console.log('🚀 DOM LOADED: Installing ultimate callback-only override');
        installUltimateOverride();
        setTimeout(forceCleanAllTableCells, 1000);
    }, 500);
});

// CONTINUOUS MONITORING - Clean table every 30 seconds to prevent other systems from interfering
setInterval(() => {
    nukeAllCompetingSystems();
    forceCleanAllTableCells();
}, 30000);

// Make functions globally available for manual testing
window.installUltimateOverride = installUltimateOverride;
window.forceCleanAllTableCells = forceCleanAllTableCells;
window.nukeAllCompetingSystems = nukeAllCompetingSystems;
window.checkUltimateOverdueCallback = checkUltimateOverdueCallback;

console.log('🛡️ ULTIMATE CALLBACK-ONLY SYSTEM LOADED');
console.log('💡 Manual commands: installUltimateOverride(), forceCleanAllTableCells(), nukeAllCompetingSystems()');

} // end CSR skip block