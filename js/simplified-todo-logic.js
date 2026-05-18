// Simplified TO DO Logic - Callback-Only System
// This overrides the complex highlight duration tracking system
// RULE: Red "Reach out: CALL" ONLY shows when there's an OVERDUE scheduled callback

// CSR users: skip entirely — CSRs use csrTodo, not callback-based reach outs
var _stlIsCsr = false;
try { _stlIsCsr = (JSON.parse(sessionStorage.getItem('vanguard_user') || '{}').role || '') === 'csr'; } catch(e) {}
if (_stlIsCsr) { console.log('Simplified TODO Logic: skipped for CSR'); } else {

console.log('🎯 LOADED: Simplified TO DO Logic - Callback-Only System');

// STARTUP SYNC: Load backend callbacks into localStorage so overdue checks work
// even if localStorage was cleared or the user is in a new browser session
async function syncCallbacksFromBackend() {
    try {
        const urls = [
            'http://162-220-14-239.nip.io:3001/api/callbacks',
            'http://localhost:3001/api/callbacks'
        ];
        let data = null;
        for (const url of urls) {
            try {
                const resp = await fetch(url);
                if (resp.ok) { data = await resp.json(); break; }
            } catch (e) { /* try next */ }
        }
        if (!Array.isArray(data)) return;

        const callbacks = JSON.parse(localStorage.getItem('scheduled_callbacks') || '{}');
        let added = 0;
        data.forEach(cb => {
            const leadId = String(cb.lead_id || cb.leadId || '');
            if (!leadId) return;
            const dateTime = cb.date_time || cb.dateTime || '';
            const cbId = String(cb.callback_id || cb.id || '');
            if (!callbacks[leadId]) callbacks[leadId] = [];
            // Only add if not already present (match by id or dateTime)
            const exists = callbacks[leadId].some(existing =>
                String(existing.id) === cbId ||
                String(existing.callback_id) === cbId ||
                existing.dateTime === dateTime
            );
            if (!exists) {
                callbacks[leadId].push({
                    id: cbId,
                    callback_id: cbId,
                    leadId: leadId,
                    dateTime: dateTime,
                    notes: cb.notes || '',
                    completed: cb.completed === 1 || cb.completed === true,
                    createdAt: cb.created_at || new Date().toISOString()
                });
                added++;
            }
        });
        if (added > 0) {
            localStorage.setItem('scheduled_callbacks', JSON.stringify(callbacks));
            console.log(`✅ CALLBACK SYNC: Added ${added} backend callbacks to localStorage`);
            // Refresh table so To Do cells reflect synced callbacks
            if (typeof refreshLeadsTable === 'function') {
                setTimeout(refreshLeadsTable, 100);
            } else if (typeof loadLeadsView === 'function') {
                setTimeout(loadLeadsView, 100);
            }
        } else {
            console.log('✅ CALLBACK SYNC: localStorage already up to date');
        }
    } catch (e) {
        console.error('❌ CALLBACK SYNC: Error syncing from backend:', e);
    }
}

// Run sync immediately on load
syncCallbacksFromBackend();

// AGGRESSIVE OVERRIDE: Run after all other scripts have loaded
setTimeout(() => {
    console.log('🚀 AGGRESSIVE OVERRIDE: Installing simplified TO DO logic...');
    installSimplifiedTodoLogic();
}, 2000);

// Install on page load as well
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        console.log('🚀 DOM LOADED: Installing simplified TO DO logic...');
        installSimplifiedTodoLogic();
    }, 1000);
});

// Function to install all the overrides
function installSimplifiedTodoLogic() {

// OVERRIDE ALL getNextAction functions with callback-only logic
const simplifiedGetNextAction = function(stage, lead) {
    console.log(`🎯 SIMPLIFIED TODO CHECK: Lead ${lead?.id} - Stage: ${stage}`);

    // Check for overdue scheduled callbacks ONLY
    if (lead && lead.id) {
        const isCallbackOverdue = checkSimpleOverdueCallback(lead.id);
        console.log(`📞 CALLBACK CHECK: Lead ${lead.id} - isOverdue: ${isCallbackOverdue}`);

        if (isCallbackOverdue) {
            // Create clickable reach out call link for overdue callbacks
            const phoneNumber = lead?.phone || '';
            const leadId = lead?.id || '';
            const clickHandler = `handleReachOutCall('${leadId}', '${phoneNumber}')`;
            console.log(`🔴 OVERDUE CALLBACK: Showing "Reach out: CALL" for lead ${leadId}`);
            return `<a href="tel:${phoneNumber}" onclick="${clickHandler}" style="color: #dc2626; font-weight: bold; text-decoration: none; cursor: pointer;">Reach out: CALL</a>`;
        }
    }

    // Standard stage-based actions (no reach-out complexity)
    const actionMap = {
        'new': 'Assign Stage',
        'info_received': 'Prepare Quote',
        'loss_runs_received': 'Prepare app.',
        'app_prepared': 'Email brokers',
        'not-interested': 'Archive lead',
        'closed': 'Process complete'
    };

    const result = actionMap[stage] || '';
    console.log(`📋 STANDARD TODO: Lead ${lead?.id} - Stage: ${stage} → "${result}"`);
    return result;
};

// Override ALL possible getNextAction functions
window.getNextAction = simplifiedGetNextAction;
window.ultimateGetNextAction = simplifiedGetNextAction;
window.getNextActionFixed = simplifiedGetNextAction;
window.getNextActionEnhanced = simplifiedGetNextAction;
window.getNextActionExpiredFix = simplifiedGetNextAction;
window.getNextActionAppSentOverride = simplifiedGetNextAction;

console.log('✅ OVERRIDDEN ALL getNextAction functions with simplified callback-only logic');

// Override the complex applyReachOutStyling function with simplified version
window.applyReachOutStyling = function(leadId, hasReachOutTodo) {
    console.log(`🎨 SIMPLIFIED STYLING: Lead ${leadId} - hasReachOutTodo: ${hasReachOutTodo}`);

    // Update the TO DO message in the header
    const todoDiv = document.getElementById(`reach-out-todo-${leadId}`);
    const headerTitle = document.getElementById(`reach-out-header-title-${leadId}`);
    const separator = document.getElementById(`reach-out-separator-${leadId}`);
    const completionDiv = document.getElementById(`reach-out-completion-${leadId}`);

    if (todoDiv) {
        const lead = JSON.parse(localStorage.getItem('insurance_leads') || '[]').find(l => String(l.id) === String(leadId));
        if (lead) {
            // SIMPLIFIED: Only check for overdue callbacks to show red TO DO
            const isCallbackOverdue = checkSimpleOverdueCallback(leadId);
            console.log(`📞 SIMPLE CHECK: Lead ${leadId} - hasOverdueCallback: ${isCallbackOverdue}`);

            if (isCallbackOverdue) {
                // Show red TO DO for overdue callbacks only
                todoDiv.style.display = 'block';
                todoDiv.innerHTML = `<span style="color: #dc2626; font-weight: bold; font-size: 18px;">TO DO: OVERDUE CALLBACK</span>`;

                // Change header to red
                if (headerTitle) {
                    headerTitle.innerHTML = '<i class="fas fa-tasks"></i> <span style="color: #dc2626;">Reach Out</span>';
                }

                // Change separator line to red
                if (separator) {
                    separator.style.borderBottom = '2px solid #dc2626';
                }

                // Hide completion timestamp
                if (completionDiv) {
                    completionDiv.style.display = 'none';
                }

                console.log(`🔴 SIMPLE RED: Lead ${leadId} shows red due to overdue callback`);
            } else {
                // No overdue callbacks = GREEN/COMPLETE (or hidden)
                todoDiv.style.display = 'none'; // Hide TO DO section entirely

                // Show as completed/green (or just hide the section entirely)
                if (headerTitle) {
                    headerTitle.innerHTML = '<i class="fas fa-tasks"></i> <span style="color: #10b981;">Reach Out</span>';
                }

                if (separator) {
                    separator.style.borderBottom = '2px solid #10b981';
                }

                // Hide completion timestamp for now (simplified)
                if (completionDiv) {
                    completionDiv.style.display = 'none';
                }

                console.log(`🟢 SIMPLE GREEN: Lead ${leadId} is green (no overdue callbacks)`);
            }
        }
    }
};

// Simple helper function to check overdue callbacks
function checkSimpleOverdueCallback(leadId) {
    try {
        const callbacks = JSON.parse(localStorage.getItem('scheduled_callbacks') || '{}');
        const leadCallbacks = callbacks[leadId] || [];
        const now = new Date();

        // Check if any callback is overdue
        const overdueCallback = leadCallbacks.find(callback => {
            if (callback.completed) return false; // Skip completed callbacks

            const callbackDateTime = new Date(callback.dateTime);
            return callbackDateTime < now; // Overdue if callback time has passed
        });

        return !!overdueCallback;
    } catch (error) {
        console.error('❌ Error checking simple overdue callbacks:', error);
        return false;
    }
}

} // End installSimplifiedTodoLogic function

// Manual trigger for immediate testing
window.forceInstallSimplifiedLogic = function() {
    console.log('🔧 MANUAL TRIGGER: Installing simplified logic now...');
    installSimplifiedTodoLogic();

    // Also refresh the table to see immediate effects
    if (typeof refreshLeadsTable === 'function') {
        setTimeout(() => {
            console.log('🔄 Refreshing table to show new logic...');
            refreshLeadsTable();
        }, 500);
    }
};

console.log('✅ SIMPLIFIED TO DO SYSTEM LOADED: Only overdue callbacks trigger red "Reach out: CALL"');
console.log('💡 To test immediately, run: forceInstallSimplifiedLogic()');

} // end CSR skip block