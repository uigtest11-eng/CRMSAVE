// Critical Performance Fix - Stop aggressive intervals
console.log('🚀 Applying critical performance fixes...');

(function() {
    // Track and clear all intervals
    const originalSetInterval = window.setInterval;
    const activeIntervals = new Set();

    // Override setInterval to track all intervals
    window.setInterval = function(callback, delay, ...args) {
        // Block aggressive intervals (anything under 1000ms)
        if (delay < 1000) {
            console.warn(`⚠️ Blocked aggressive interval with ${delay}ms delay`);
            // Increase to minimum 5 seconds for non-critical operations
            delay = 5000;
        }

        const intervalId = originalSetInterval.call(window, callback, delay, ...args);
        activeIntervals.add(intervalId);
        console.log(`Interval registered: ${intervalId} with ${delay}ms delay`);
        return intervalId;
    };

    // Clear existing aggressive intervals
    function clearAggressiveIntervals() {
        // Get all possible interval IDs (usually sequential)
        for (let i = 1; i < 1000; i++) {
            try {
                clearInterval(i);
            } catch(e) {}
        }
        console.log('✅ Cleared all existing intervals');
    }

    // Debounce DOM updates
    const domUpdateQueue = new Map();
    const processDOMUpdates = _.debounce(() => {
        domUpdateQueue.forEach((update, key) => {
            try {
                update();
            } catch(e) {
                console.error('DOM update error:', e);
            }
        });
        domUpdateQueue.clear();
    }, 100);

    window.queueDOMUpdate = function(key, updateFn) {
        domUpdateQueue.set(key, updateFn);
        processDOMUpdates();
    };

    // Optimize localStorage access
    const localStorageCache = new Map();
    let cacheTimer = null;

    const originalGetItem = localStorage.getItem;
    const originalSetItem = localStorage.setItem;
    const originalRemoveItem = localStorage.removeItem;

    localStorage.getItem = function(key) {
        if (localStorageCache.has(key)) {
            return localStorageCache.get(key);
        }
        const value = originalGetItem.call(localStorage, key);
        localStorageCache.set(key, value);

        // Clear cache after 2 seconds
        if (cacheTimer) clearTimeout(cacheTimer);
        cacheTimer = setTimeout(() => localStorageCache.clear(), 2000);

        return value;
    };

    // Helper: slim an array of leads by trimming callLogs and optionally large arrays
    function slimLeadsArray(leads, maxLogs) {
        return leads.map(lead => {
            const slim = { ...lead };
            if (slim.reachOut && slim.reachOut.callLogs) {
                slim.reachOut = { ...slim.reachOut, callLogs: slim.reachOut.callLogs.slice(-maxLogs) };
            }
            // Strip transcript text (can be very large)
            if (maxLogs <= 5) {
                delete slim.transcriptText;
                delete slim.transcriptWords;
                delete slim.structuredData;
            }
            // At maxLogs 0, also trim vehicle/trailer details to essentials
            if (maxLogs === 0) {
                if (Array.isArray(slim.vehicles) && slim.vehicles.length > 0) {
                    slim.vehicles = slim.vehicles.map(v => ({ id: v.id, year: v.year, make: v.make, vin: v.vin, type: v.type }));
                }
                if (Array.isArray(slim.trailers) && slim.trailers.length > 0) {
                    slim.trailers = slim.trailers.map(t => ({ id: t.id, year: t.year, make: t.make, vin: t.vin, type: t.type }));
                }
            }
            return slim;
        });
    }

    localStorage.setItem = function(key, value) {
        localStorageCache.set(key, value);
        try {
            return originalSetItem.call(localStorage, key, value);
        } catch (e) {
            if (e.name !== 'QuotaExceededError') throw e;

            console.warn(`⚠️ QUOTA: localStorage full writing "${key}" - attempting recovery...`);

            // Step 1: If this is a leads array, try trimming callLogs progressively
            try {
                const data = JSON.parse(value);
                if (Array.isArray(data) && data.length > 0 && (data[0].reachOut !== undefined || data[0].id !== undefined)) {
                    for (const maxLogs of [10, 5, 0]) {
                        try {
                            const slimmed = slimLeadsArray(data, maxLogs);
                            const slimJSON = JSON.stringify(slimmed);
                            localStorageCache.set(key, slimJSON);
                            originalSetItem.call(localStorage, key, slimJSON);
                            console.log(`✅ QUOTA: Saved "${key}" with callLogs trimmed to ${maxLogs}`);
                            return;
                        } catch (e2) { /* try next level */ }
                    }
                }
            } catch (parseErr) { /* not JSON or not a leads array */ }

            // Step 2: Free space by clearing non-critical keys, then retry original value
            const evictable = ['lossRunsData', 'dotLookupCache', 'leads', 'debug_log', 'tempData',
                'clients', 'insurance_clients', 'cached_leads', 'lead_generation_results',
                'vici_sync_status', 'callTranscripts', 'notification_history',
                'archivedLeads', 'archived_leads'];
            for (const evictKey of evictable) {
                if (evictKey !== key) {
                    try { originalRemoveItem.call(localStorage, evictKey); } catch (_) {}
                }
            }
            // Also evict any large keys (>100KB) that aren't the current key
            try {
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (k && k !== key && k !== 'insurance_leads' && k !== 'vanguard_jwt') {
                        try {
                            const v = originalGetItem.call(localStorage, k);
                            if (v && v.length > 100000) {
                                originalRemoveItem.call(localStorage, k);
                                console.log(`🗑️ QUOTA: Evicted large key "${k}" (${Math.round(v.length/1024)}KB)`);
                            }
                        } catch (_) {}
                    }
                }
            } catch (_) {}
            try {
                originalSetItem.call(localStorage, key, value);
                console.log(`✅ QUOTA: Saved "${key}" after freeing space`);
                return;
            } catch (e3) {
                console.error(`❌ QUOTA: Cannot save "${key}" even after recovery - skipping`);
                // Signal DOT lookups to stop to prevent cascade
                window._localStorageQuotaFull = true;
            }
        }
    };

    // Throttle expensive operations
    const throttledFunctions = new Map();
    window.throttleFunction = function(name, fn, delay = 1000) {
        if (!throttledFunctions.has(name)) {
            throttledFunctions.set(name, _.throttle(fn, delay, {
                leading: true,
                trailing: true
            }));
        }
        return throttledFunctions.get(name);
    };

    // Fix specific performance killers
    function fixPerformanceKillers() {
        // Disable continuous text replacement
        if (window.replaceTextNodes) {
            window.replaceTextNodes = function() {
                // Disabled - was running continuously
                return;
            };
        }

        // Fix 60-day view updates
        if (window.updateTo60DayView) {
            const original = window.updateTo60DayView;
            window.updateTo60DayView = _.throttle(original, 5000);
        }

        // Fix localStorage cleanup
        if (window.continuousCleanup) {
            window.continuousCleanup = _.throttle(window.continuousCleanup, 10000);
        }

        // Fix email function overrides
        if (window.overrideAllEmailFunctions) {
            const original = window.overrideAllEmailFunctions;
            window.overrideAllEmailFunctions = _.once(original);
        }
    }

    // Apply fixes after page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                clearAggressiveIntervals();
                fixPerformanceKillers();
            }, 1000);
        });
    } else {
        setTimeout(() => {
            clearAggressiveIntervals();
            fixPerformanceKillers();
        }, 100);
    }

    // Monitor performance
    let lastCheck = Date.now();
    setInterval(() => {
        const now = Date.now();
        const elapsed = now - lastCheck;
        if (elapsed > 1100) {
            console.warn(`⚠️ Main thread blocked for ${elapsed - 1000}ms`);
        }
        lastCheck = now;
    }, 1000);

    console.log('✅ Performance fixes applied');
})();

// REACH OUT CALL HANDLER - Define globally for immediate availability
function handleReachOutCall(leadId, phoneNumber) {
    console.log(`📞 Reach out call clicked for lead ${leadId}, phone: ${phoneNumber}`);

    // FIXED: Instead of showing call popup, just open the lead profile directly
    // This is what the user expects when clicking on a lead
    if (typeof window.viewLead === 'function') {
        window.viewLead(leadId);
    } else if (typeof protectedFunctions?.viewLead === 'function') {
        protectedFunctions.viewLead(leadId);
    } else {
        console.error('❌ No viewLead function available');
        return false;
    }

    // Show call outcome popup after profile loads (same as manually checking Called)
    setTimeout(() => {
        console.log(`🔄 REACH OUT CALL: Showing call outcome popup for lead ${leadId}`);
        if (typeof showCallOutcomePopup === 'function') {
            showCallOutcomePopup(leadId);
        } else {
            console.warn(`⚠️ showCallOutcomePopup not available for lead ${leadId}`);
        }
    }, 1500); // Wait for profile to fully load

    // Prevent the tel: link from proceeding
    return false;
}

// New function to show call confirmation popup
function showCallConfirmationPopup(leadId, phoneNumber) {
    // Remove any existing confirmation popups
    const existingPopup = document.getElementById(`call-confirmation-${leadId}`);
    if (existingPopup) {
        existingPopup.remove();
    }

    // Create confirmation popup
    const popup = document.createElement('div');
    popup.id = `call-confirmation-${leadId}`;
    popup.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10001;
    `;

    popup.innerHTML = `
        <div style="
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: rgba(0, 0, 0, 0.3) 0px 20px 40px;
            text-align: center;
            max-width: 400px;
            margin: 0 20px;
        ">
            <div style="margin-bottom: 20px;">
                <div style="
                    width: 60px;
                    height: 60px;
                    background: #dbeafe;
                    border-radius: 50%;
                    margin: 0 auto 15px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    <i class="fas fa-phone" style="font-size: 24px; color: #3b82f6;"></i>
                </div>
                <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 20px; font-weight: 600;">Call Confirmation</h3>
                <p style="margin: 0; color: #6b7280; font-size: 16px; line-height: 1.5;">
                    Are you starting a call with <strong>${phoneNumber}</strong> right now?
                </p>
            </div>

            <div style="display: flex; gap: 12px; justify-content: center;">
                <button onclick="handleCallConfirmed('${leadId}', '${phoneNumber}', true)" style="
                    background: #10b981;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                    font-size: 14px;
                    min-width: 120px;
                    transition: all 0.2s;
                ">Yes, Calling Now</button>
                <button onclick="handleCallConfirmed('${leadId}', '${phoneNumber}', false)" style="
                    background: #f3f4f6;
                    color: #374151;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                    font-size: 14px;
                    min-width: 120px;
                    transition: all 0.2s;
                ">No, Log Previous Call</button>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    // Close popup when clicking outside
    popup.addEventListener('click', function(e) {
        if (e.target === popup) {
            popup.remove();
        }
    });
}

// Handle the user's confirmation response
function handleCallConfirmed(leadId, phoneNumber, isLiveCall) {
    // Remove the confirmation popup
    const popup = document.getElementById(`call-confirmation-${leadId}`);
    if (popup) {
        popup.remove();
    }

    if (isLiveCall) {
        // YES path - User is making a live call
        console.log(`✅ User confirmed live call for lead ${leadId}`);
        proceedWithLiveCall(leadId, phoneNumber);
    } else {
        // NO path - User wants to log a previous call
        console.log(`📝 User wants to log previous call for lead ${leadId}`);
        showManualCallLoggingPopup(leadId);
    }
}

// Proceed with live call (original behavior)
function proceedWithLiveCall(leadId, phoneNumber) {
    // 1. Open the lead profile
    if (window.viewLead) {
        setTimeout(() => {
            console.log(`🔧 Opening profile for lead ${leadId}`);
            window.viewLead(leadId);
        }, 100);
    } else {
        console.log(`❌ viewLead function not available`);
    }

    // 2. Check the call checkbox after profile opens (multiple attempts with increasing delays)
    const attempts = [500, 1000, 1500, 2000];
    attempts.forEach(delay => {
        setTimeout(() => {
            console.log(`🔍 MULTIPLE-CHECK: Looking for checkbox call-made-${leadId} at ${delay}ms delay`);
            const callCheckbox = document.getElementById(`call-made-${leadId}`);
            if (callCheckbox) {
                console.log(`📋 MULTIPLE-CHECK: Found checkbox, current state: checked=${callCheckbox.checked}`);
                if (!callCheckbox.checked) {
                    callCheckbox.checked = true;
                    console.log(`🔧 MULTIPLE-CHECK: Setting checkbox to checked`);

                    // Trigger the onchange event to update reach out
                    if (window.updateReachOut) {
                        window.updateReachOut(leadId, 'call', true);
                        console.log(`✅ MULTIPLE-CHECK: Auto-checked call box for lead ${leadId} at ${delay}ms delay`);
                    } else {
                        console.log(`❌ MULTIPLE-CHECK: updateReachOut function not available`);
                    }
                } else {
                    console.log(`ℹ️ MULTIPLE-CHECK: Checkbox already checked, skipping`);
                }
            } else {
                console.warn(`⚠️ MULTIPLE-CHECK: Checkbox call-made-${leadId} not found at ${delay}ms delay`);
            }
        }, delay);
    });

    // 3. Open the phone dialer
    window.open(`tel:${phoneNumber}`, '_self');
}

// Show manual call time logging popup
function showManualCallLoggingPopup(leadId) {
    // Remove any existing manual logging popups
    const existingPopup = document.getElementById(`manual-call-log-${leadId}`);
    if (existingPopup) {
        existingPopup.remove();
    }

    // Create manual call logging popup
    const popup = document.createElement('div');
    popup.id = `manual-call-log-${leadId}`;
    popup.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10001;
    `;

    popup.innerHTML = `
        <div style="
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: rgba(0, 0, 0, 0.3) 0px 20px 40px;
            text-align: center;
            max-width: 450px;
            margin: 0 20px;
        ">
            <div style="margin-bottom: 25px;">
                <div style="
                    width: 60px;
                    height: 60px;
                    background: #fef3c7;
                    border-radius: 50%;
                    margin: 0 auto 15px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    <i class="fas fa-clock" style="font-size: 24px; color: #f59e0b;"></i>
                </div>
                <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 20px; font-weight: 600;">Log Previous Call</h3>
                <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                    Enter the duration of your previous call with this lead:
                </p>

                <div style="display: flex; gap: 10px; justify-content: center; align-items: center; margin-bottom: 15px;">
                    <input type="number" id="manual-minutes-${leadId}" placeholder="5" min="0" max="999" style="
                        width: 80px;
                        padding: 10px;
                        border: 2px solid #e5e7eb;
                        border-radius: 6px;
                        text-align: center;
                        font-size: 16px;
                    ">
                    <span style="color: #374151; font-weight: 500;">minutes</span>
                    <input type="number" id="manual-seconds-${leadId}" placeholder="30" min="0" max="59" style="
                        width: 80px;
                        padding: 10px;
                        border: 2px solid #e5e7eb;
                        border-radius: 6px;
                        text-align: center;
                        font-size: 16px;
                    ">
                    <span style="color: #374151; font-weight: 500;">seconds</span>
                </div>
            </div>

            <div style="display: flex; gap: 12px; justify-content: center;">
                <button onclick="saveManualCallTime('${leadId}')" style="
                    background: #10b981;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                    font-size: 14px;
                    min-width: 120px;
                    transition: all 0.2s;
                ">Save Call Time</button>
                <button onclick="document.getElementById('manual-call-log-${leadId}').remove()" style="
                    background: #f3f4f6;
                    color: #374151;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                    font-size: 14px;
                    min-width: 120px;
                    transition: all 0.2s;
                ">Cancel</button>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    // Focus on minutes input
    setTimeout(() => {
        const minutesInput = document.getElementById(`manual-minutes-${leadId}`);
        if (minutesInput) {
            minutesInput.focus();
        }
    }, 100);

    // Close popup when clicking outside
    popup.addEventListener('click', function(e) {
        if (e.target === popup) {
            popup.remove();
        }
    });
}

// Save manual call time and proceed to completion workflow
function saveManualCallTime(leadId) {
    const minutesInput = document.getElementById(`manual-minutes-${leadId}`);
    const secondsInput = document.getElementById(`manual-seconds-${leadId}`);

    const minutes = parseInt(minutesInput?.value || '0');
    const seconds = parseInt(secondsInput?.value || '0');

    if (minutes === 0 && seconds === 0) {
        alert('Please enter a call duration.');
        return;
    }

    // Remove the manual logging popup
    const popup = document.getElementById(`manual-call-log-${leadId}`);
    if (popup) {
        popup.remove();
    }

    console.log(`📞 Manual call logged: ${minutes}m ${seconds}s for lead ${leadId}`);

    // Format duration string
    const durationStr = `${minutes} min ${seconds} sec`;

    // Update the lead's call data
    updateLeadCallData(leadId, durationStr);

    // Open lead profile
    if (window.viewLead) {
        setTimeout(() => {
            window.viewLead(leadId);
        }, 100);
    }

    // Auto-check the call checkbox
    setTimeout(() => {
        const callCheckbox = document.getElementById(`call-made-${leadId}`);
        if (callCheckbox && !callCheckbox.checked) {
            callCheckbox.checked = true;

            if (window.updateReachOut) {
                window.updateReachOut(leadId, 'call', true);
                console.log(`✅ Auto-checked call box for manually logged call`);
            }
        }
    }, 1000);

    // Show the standard call completion workflow after a delay
    setTimeout(() => {
        showCallCompletionWorkflow(leadId);
    }, 2000);
}

// Update lead's call data with manual duration
function updateLeadCallData(leadId, durationStr) {
    try {
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const leadIndex = leads.findIndex(lead => lead.id === leadId);

        if (leadIndex !== -1) {
            const lead = leads[leadIndex];

            // Initialize reachOut if not exists
            if (!lead.reachOut) {
                lead.reachOut = {
                    callAttempts: 0,
                    callsConnected: 0,
                    callLogs: []
                };
            }

            // Add the manual call to logs
            const callLog = {
                timestamp: new Date().toISOString(),
                duration: durationStr,
                outcome: 'Manual entry',
                notes: 'Manually logged call duration'
            };

            lead.reachOut.callLogs = lead.reachOut.callLogs || [];
            lead.reachOut.callLogs.push(callLog);
            lead.reachOut.callsConnected = (lead.reachOut.callsConnected || 0) + 1;
            lead.reachOut.callAttempts = (lead.reachOut.callAttempts || 0) + 1;

            // Save back to localStorage
            localStorage.setItem('insurance_leads', JSON.stringify(leads));
            console.log(`✅ Updated lead ${leadId} with manual call data: ${durationStr}`);
        }
    } catch (error) {
        console.error('Error updating lead call data:', error);
    }
}

// Show the standard call completion workflow
function showCallCompletionWorkflow(leadId) {
    // This will trigger the existing callback scheduling popup that was shown in the user's example
    // The existing system should automatically show this based on the call being marked as complete
    console.log(`🎯 Call completion workflow triggered for lead ${leadId}`);
}

// Make functions globally available immediately
window.handleReachOutCall = handleReachOutCall;
window.showCallConfirmationPopup = showCallConfirmationPopup;
window.handleCallConfirmed = handleCallConfirmed;
window.proceedWithLiveCall = proceedWithLiveCall;
window.showManualCallLoggingPopup = showManualCallLoggingPopup;
window.saveManualCallTime = saveManualCallTime;
window.updateLeadCallData = updateLeadCallData;
window.showCallCompletionWorkflow = showCallCompletionWorkflow;
console.log('✅ Enhanced handleReachOutCall functions defined globally');