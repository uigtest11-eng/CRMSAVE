// PROTECTED Final Profile Fix - Loads last and prevents overrides
console.log('🔥 PROTECTED-FINAL-PROFILE-FIX: Enhanced profile loading with protection...');

// Store references to prevent overriding
let protectedFunctions = {};

// Create the enhanced profile function with exact working UI
protectedFunctions.createEnhancedProfile = function(lead) {
    const _pfSess = JSON.parse(sessionStorage.getItem('vanguard_user') || '{}');
    const _isCsr = (_pfSess.role || '') === 'csr';
    console.log('🔥 PROTECTED Enhanced Profile: Creating profile for:', lead.name);
    console.log('🔍 PROTECTED Lead ID being used:', lead.id);
    console.log('🔍 PROTECTED Lead object:', lead);
    console.log('📍 PROTECTED: Stage dropdown will use snake_case format:', lead.stage);

    // Remove any existing modals
    const existing = document.getElementById('lead-profile-container');
    if (existing) {
        existing.remove();
    }

    // Initialize data if needed
    if (!lead.vehicles || !Array.isArray(lead.vehicles)) lead.vehicles = [];
    if (!lead.trailers || !Array.isArray(lead.trailers)) lead.trailers = [];
    if (!lead.drivers || !Array.isArray(lead.drivers)) lead.drivers = [];
    if (!lead.transcriptText) lead.transcriptText = '';
    // Ensure reachOut object exists and has all required properties
    if (!lead.reachOut) {
        lead.reachOut = {};
    }

    // Initialize all reachOut properties with defaults if they don't exist
    // CRITICAL: Use || 0 instead of ?? 0 to handle falsy values properly
    // but only if the property truly doesn't exist (not if it's 0)
    if (typeof lead.reachOut.callAttempts !== 'number') lead.reachOut.callAttempts = 0;
    if (typeof lead.reachOut.callsConnected !== 'number') lead.reachOut.callsConnected = 0;
    if (typeof lead.reachOut.emailCount !== 'number') lead.reachOut.emailCount = 0;
    if (typeof lead.reachOut.textCount !== 'number') lead.reachOut.textCount = 0;
    if (typeof lead.reachOut.voicemailCount !== 'number') lead.reachOut.voicemailCount = 0;

    // PRESERVE completion-related fields - DO NOT overwrite if they exist
    // emailConfirmed, completedAt, reachOutCompletedAt, greenHighlightUntil, etc.

    console.log(`🔍 LEAD ${lead.id} REACHOUT INITIALIZED:`, lead.reachOut);

    // Check if lead.id is the problematic hardcoded value
    if (String(lead.id) === '8126662') {
        console.error(`❌ PROBLEM FOUND: Lead ID is hardcoded test value 8126662!`);
        console.log('🔍 This explains why all IDs are showing 8126662 - the lead object itself has the wrong ID!');
    }

    // Save the corrected lead data back to localStorage to ensure proper initialization
    try {
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const leadIndex = leads.findIndex(l => String(l.id) === String(lead.id));
        if (leadIndex !== -1) {
            leads[leadIndex].reachOut = { ...lead.reachOut }; // Create a copy to prevent reference sharing
            localStorage.setItem('insurance_leads', JSON.stringify(leads));
            console.log(`✅ LEAD ${lead.id} REACHOUT SAVED TO LOCALSTORAGE`);
        }
    } catch (error) {
        console.error(`❌ Failed to save reachOut data for lead ${lead.id}:`, error);
    }

    // AGGRESSIVE FIX: Force unique reachOut object creation before any profile display
    console.log(`🔧 AGGRESSIVE FIX: Ensuring lead ${lead.id} has unique reachOut object...`);

    // Always create a completely new object, never reuse existing one
    const originalData = lead.reachOut ? { ...lead.reachOut } : {};
    lead.reachOut = {
        callAttempts: originalData.callAttempts || 0,
        callsConnected: originalData.callsConnected || 0,
        emailCount: originalData.emailCount || 0,
        textCount: originalData.textCount || 0,
        voicemailCount: originalData.voicemailCount || 0,
        // Preserve other properties with deep copies
        ...(originalData.callLogs && { callLogs: JSON.parse(JSON.stringify(originalData.callLogs)) }),
        ...(originalData.completedAt && { completedAt: originalData.completedAt }),
        ...(originalData.reachOutCompletedAt && { reachOutCompletedAt: originalData.reachOutCompletedAt }),
        ...(originalData.emailConfirmed !== undefined && { emailConfirmed: originalData.emailConfirmed }),
        ...(originalData.greenHighlightUntil && { greenHighlightUntil: originalData.greenHighlightUntil }),
        ...(originalData.greenHighlightDays !== undefined && { greenHighlightDays: originalData.greenHighlightDays }),
        ...(originalData.emailConfirmations && { emailConfirmations: JSON.parse(JSON.stringify(originalData.emailConfirmations)) }),
        ...(originalData.emailSent !== undefined && { emailSent: originalData.emailSent }),
        ...(originalData.textSent !== undefined && { textSent: originalData.textSent }),
        ...(originalData.contacted !== undefined && { contacted: originalData.contacted })
    };

    console.log(`✅ AGGRESSIVE FIX: Lead ${lead.id} now has unique reachOut object:`, lead.reachOut);

    // BULK FIX: Clean up all leads in localStorage to ensure unique reachOut objects
    protectedFunctions.fixAllLeadReachOutReferences();
    if (!lead.applications || !Array.isArray(lead.applications)) lead.applications = [];
    if (!lead.quotes || !Array.isArray(lead.quotes)) lead.quotes = [];

    // Create modal container with exact working styling
    const modalContainer = document.createElement('div');
    modalContainer.id = 'lead-profile-container';
    modalContainer.dataset.leadId = lead.id;
    modalContainer.style.cssText = `
        position: fixed !important;
        top: 0px !important;
        left: 0px !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.5) !important;
        display: flex;
        justify-content: center !important;
        align-items: center !important;
        z-index: 1000000;
        animation: 0.3s ease 0s 1 normal none running fadeIn !important;
        visibility: visible;
        opacity: 1;
    `;

    modalContainer.innerHTML = `
        <div class="modal-content" style="background: white; border-radius: 12px; max-width: 1200px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: rgba(0, 0, 0, 0.3) 0px 20px 60px; position: relative; transform: none; top: auto; left: auto;">
            <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
                <h2 style="margin: 0; font-size: 24px;"><i class="fas fa-truck"></i> Commercial Auto Lead Profile</h2>
                <button class="close-btn" id="profile-close-btn" onclick="(function(){const modal=document.getElementById('lead-profile-container');if(modal&&modal._idProtectionObserver){modal._idProtectionObserver.disconnect();}modal.remove();})();" style="position: absolute; top: 20px; right: 20px; font-size: 30px; background: none; border: none; cursor: pointer; color: white;">×</button>
            </div>

            <div style="padding: 20px;">
                <!-- Lead Stage (standalone at top) -->
                <div class="profile-section" style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3><i class="fas fa-chart-line"></i> Lead Stage</h3>
                    <div>
                        <label style="font-weight: 600; font-size: 12px;">Current Stage:</label>
                        <select id="lead-stage-${lead.id}" onchange="updateLeadStage('${lead.id}', this.value)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; background: white;">
                            <option value="new" ${lead.stage === 'new' ? 'selected' : ''}>New</option>
                            <option value="contact_attempted" ${lead.stage === 'contact_attempted' ? 'selected' : ''}>Contact Attempted</option>
                            <option value="info_requested" ${lead.stage === 'info_requested' ? 'selected' : ''}>Info Requested</option>
                            <option value="info_received" ${lead.stage === 'info_received' ? 'selected' : ''}>Info Received</option>
                            <option value="loss_runs_requested" ${lead.stage === 'loss_runs_requested' ? 'selected' : ''}>Loss Runs Requested</option>
                            <option value="loss_runs_received" ${lead.stage === 'loss_runs_received' ? 'selected' : ''}>Loss Runs Received</option>
                            <option value="app_prepared" ${lead.stage === 'app_prepared' ? 'selected' : ''}>App Prepared</option>
                            <option value="app_sent" ${lead.stage === 'app_sent' ? 'selected' : ''}>App Sent</option>
                            <option value="quote_sent" ${lead.stage === 'quote_sent' ? 'selected' : ''}>Quote Sent</option>
                            <option value="sale" ${lead.stage === 'sale' ? 'selected' : ''}>Sale</option>
                            <option value="not-interested" ${lead.stage === 'not-interested' ? 'selected' : ''}>Not Interested</option>
                            <option value="closed" ${lead.stage === 'closed' ? 'selected' : ''}>Closed</option>
                        </select>
                    </div>
                    <!-- Stage Timestamp with Color Coding -->
                    <div style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.7); border-radius: 6px; text-align: center;">
                        <div id="lead-age-${lead.id}" style="display: flex; justify-content: center;">
                            ${(function() {
                                // Use stage update timestamp if available, otherwise lead creation date
                                const stageDate = lead.stageUpdatedAt || lead.createdDate || lead.created_at || lead.created || lead.timestamp;

                                // If no valid timestamp exists, don't show a timestamp
                                if (!stageDate) {
                                    return '<span style="color: #6b7280; font-style: italic;">No timestamp available</span>';
                                }
                                const now = new Date();
                                const updated = new Date(stageDate);
                                const daysDiff = Math.floor((now - updated) / (1000 * 60 * 60 * 24));

                                // Calculate color based on stage age - URGENT TIMELINE
                                let ageColor;
                                if (daysDiff >= 3) ageColor = 'red';    // 3+ days = RED (urgent)
                                else if (daysDiff >= 2) ageColor = 'orange';  // 2 days = ORANGE
                                else if (daysDiff >= 1) ageColor = 'yellow';  // 1 day = YELLOW
                                else ageColor = 'green';  // Today = GREEN

                                // Map color names to background colors for pills
                                const colorMap = {
                                    'green': '#10b981',
                                    'yellow': '#eab308',
                                    'orange': '#f59e0b',
                                    'red': '#dc2626'
                                };

                                const backgroundColor = colorMap[ageColor] || '#10b981';

                                // Show actual date/time instead of relative time
                                const timeText = updated.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: updated.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                });

                                return `<span id="stage-timestamp-${lead.id}" style="
                                    background-color: ${backgroundColor};
                                    color: white;
                                    padding: 6px 12px;
                                    border-radius: 20px;
                                    font-size: 11px;
                                    font-weight: bold;
                                    display: inline-block;
                                    white-space: nowrap;
                                ">${timeText}</span>`;
                            })()}
                        </div>
                    </div>
                </div>

                <!-- Callback Scheduler (hidden for CSR) -->
                ${_isCsr ? '' : `<div class="profile-section" style="background: #e0f2fe; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 style="margin: 0; font-weight: bold;"><i class="fas fa-calendar-alt"></i> <span style="color: #0277bd;">Schedule Callback</span></h3>
                        <div id="callback-status-${lead.id}" style="font-weight: bold; font-size: 14px; color: #0277bd;">
                            <!-- Callback status will be updated here -->
                        </div>
                    </div>

                    <!-- Callback Date/Time Input -->
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        <div style="display: flex; gap: 15px; align-items: end;">
                            <div style="flex: 1;">
                                <label for="callback-date-${lead.id}" style="font-weight: 600; font-size: 12px; color: #374151;">Date:</label>
                                <input type="date"
                                       id="callback-date-${lead.id}"
                                       style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; background: white;"
                                       min="${new Date().toISOString().split('T')[0]}">
                            </div>
                            <div style="flex: 1;">
                                <label for="callback-time-${lead.id}" style="font-weight: 600; font-size: 12px; color: #374151;">Time:</label>
                                <input type="time"
                                       id="callback-time-${lead.id}"
                                       style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; background: white;">
                            </div>
                            <button onclick="scheduleCallback('${lead.id}')"
                                    style="background: #0277bd; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; white-space: nowrap;">
                                <i class="fas fa-plus"></i> Schedule
                            </button>
                        </div>

                        <!-- Notes for callback -->
                        <div>
                            <label for="callback-notes-${lead.id}" style="font-weight: 600; font-size: 12px; color: #374151;">Callback Notes:</label>
                            <textarea id="callback-notes-${lead.id}"
                                      placeholder="Optional notes for the callback..."
                                      style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; background: white; resize: vertical; min-height: 60px; font-family: inherit;"></textarea>
                        </div>

                        <!-- Scheduled Callbacks List -->
                        <div id="scheduled-callbacks-${lead.id}" style="margin-top: 10px;">
                            <!-- Scheduled callbacks will be displayed here -->
                        </div>
                    </div>
                </div>`}

                <!-- Reach Out Checklist (hidden for CSR) -->
                ${_isCsr ? '' : `
                <div class="profile-section" style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <!-- Header with TO DO message -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h3 style="margin: 0; font-weight: bold;" id="reach-out-header-title-${lead.id}"><i class="fas fa-tasks"></i> <span style="color: #dc2626;">Reach Out</span></h3>
                        <div id="reach-out-todo-${lead.id}" style="font-weight: bold; font-size: 18px; color: #dc2626;">
                            <!-- Dynamic content will be set by JavaScript -->
                        </div>
                    </div>

                    <!-- Completion Timestamp -->
                    <div id="reach-out-completion-${lead.id}" style="text-align: center; margin-bottom: 10px; display: none;">
                        <div style="background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; display: inline-block;">
                            Completed: <span id="completion-timestamp-${lead.id}"></span>
                        </div>
                    </div>

                    <!-- Separator Line -->
                    <div id="reach-out-separator-${lead.id}" style="border-bottom: 2px solid #f59e0b; margin-bottom: 15px; padding-bottom: 10px;"></div>
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        <!-- Called Section - Now at top -->
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <input type="checkbox" id="call-made-${lead.id}" onchange="console.log('🔍 CHECKBOX CLICKED: leadId=${lead.id}'); updateReachOut('${lead.id}', 'call', this.checked)" style="width: 20px; height: 20px; cursor: pointer;" data-debug-lead="${lead.id}">
                                <label for="call-made-${lead.id}" style="font-weight: 600; cursor: pointer;">Called</label>
                            </div>
                            <div style="display: flex; align-items: center; gap: 20px;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <span style="font-weight: 600;">Attempts:</span>
                                    <span id="call-count-${lead.id}" style="font-weight: bold; font-size: 18px; color: #0066cc; min-width: 30px; text-align: center;">${lead.reachOut.callAttempts || 0}</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <span style="font-weight: 600;">Connected:</span>
                                    <span id="call-connected-${lead.id}" style="font-weight: bold; font-size: 18px; color: #10b981; min-width: 30px; text-align: center;">${lead.reachOut.callsConnected || 0}</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <span style="font-weight: 600;">Voicemail Sent:</span>
                                    <span id="voicemail-count-${lead.id}" style="font-weight: bold; font-size: 18px; color: #f59e0b; min-width: 30px; text-align: center;">${lead.reachOut.voicemailCount || 0}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Call Logs Button -->
                        <div style="padding-left: 30px; display: flex; gap: 10px;">
                            <button onclick="showCallLogs('${lead.id}')" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px;">
                                <i class="fas fa-phone-alt"></i> Call Logs
                            </button>
                        </div>

                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <input type="checkbox" id="email-sent-${lead.id}" onchange="updateReachOut('${lead.id}', 'email', this.checked)" style="width: 20px; height: 20px; cursor: pointer;">
                                <label for="email-sent-${lead.id}" style="font-weight: 600; cursor: pointer;">Email Sent</label>
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-weight: 600;">Sent:</span>
                                <span id="email-count-${lead.id}" style="font-weight: bold; font-size: 18px; color: #0066cc; min-width: 30px; text-align: center;">${lead.reachOut.emailCount || 0}</span>
                            </div>
                        </div>

                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <input type="checkbox" id="text-sent-${lead.id}" onchange="updateReachOut('${lead.id}', 'text', this.checked)" style="width: 20px; height: 20px; cursor: pointer;">
                                <label for="text-sent-${lead.id}" style="font-weight: 600; cursor: pointer;">Text Sent</label>
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-weight: 600;">Sent:</span>
                                <span id="text-count-${lead.id}" style="font-weight: bold; font-size: 18px; color: #0066cc; min-width: 30px; text-align: center;">${lead.reachOut.textCount || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>`}

                <!-- Other Lead Details (hidden for CSR) -->
                ${_isCsr ? '' : `
                <div class="profile-section" style="background: #e0f2fe; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3><i class="fas fa-info-circle"></i> Lead Details</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Response Rate:</label>
                            <select onchange="updateLeadPriority('${lead.id}', this.value)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; background: white;">
                                <option value="High" ${lead.priority === 'High' ? 'selected' : ''}>High</option>
                                <option value="Mid" ${(lead.priority === 'Mid' || !lead.priority) ? 'selected' : ''}>Mid</option>
                                <option value="Lower" ${lead.priority === 'Lower' ? 'selected' : ''}>Lower</option>
                                <option value="Low" ${lead.priority === 'Low' ? 'selected' : ''}>Low</option>
                            </select>
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Premium:</label>
                            <input type="text" id="lead-premium-${lead.id}" value="${lead.premium || ''}" placeholder="Enter premium amount" onchange="updateLeadField('${lead.id}', 'premium', this.value)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; background: white;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Win/Loss:</label>
                            <select id="lead-winloss-${lead.id}" onchange="updateWinLossStatus('${lead.id}', this.value)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; background: white;">
                                <option value="neutral" ${(lead.winLoss === 'neutral' || !lead.winLoss) ? 'selected' : ''}>Neutral</option>
                                <option value="win" ${lead.winLoss === 'win' ? 'selected' : ''}>Win</option>
                                <option value="loss" ${lead.winLoss === 'loss' ? 'selected' : ''}>Loss</option>
                            </select>
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Assigned To:</label>
                            <select id="lead-assignedTo-${lead.id}" onchange="updateLeadAssignedTo('${lead.id}', this.value)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; background: white;">
                                <option value="" ${!lead.assignedTo ? 'selected' : ''}>Unassigned</option>
                                <option value="Hunter" ${lead.assignedTo === 'Hunter' ? 'selected' : ''}>Hunter</option>
                                <option value="Grant" ${lead.assignedTo === 'Grant' ? 'selected' : ''}>Grant</option>
                                <option value="Carson" ${lead.assignedTo === 'Carson' ? 'selected' : ''}>Carson</option>
                            </select>
                        </div>
                    </div>
                </div>`}

                <!-- Owner Details -->
                <div class="profile-section" style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3><i class="fas fa-user-circle"></i> Owner Details</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Name:</label>
                            <input type="text"
                                value="${lead.ownerName || ''}"
                                onchange="updateLeadField('${lead.id}', 'ownerName', this.value); updateNameFieldColor(this);"
                                oninput="updateNameFieldColor(this);"
                                placeholder="Enter owner name"
                                style="width: 100%; padding: 8px; border: 1px solid ${(lead.ownerName && lead.ownerName.trim()) ? '#d1d5db' : '#ef4444'}; border-radius: 6px; background-color: ${(lead.ownerName && lead.ownerName.trim()) ? 'white' : '#fef2f2'};">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Interest:</label>
                            <input type="text" value="${lead.ownerInterest || ''}" onchange="updateLeadField('${lead.id}', 'ownerInterest', this.value)" placeholder="Enter interests" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Dislikes:</label>
                            <input type="text" value="${lead.ownerDislikes || ''}" onchange="updateLeadField('${lead.id}', 'ownerDislikes', this.value)" placeholder="Enter dislikes" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Personality:</label>
                            <input type="text" value="${lead.ownerPersonality || ''}" onchange="updateLeadField('${lead.id}', 'ownerPersonality', this.value)" placeholder="Enter personality traits" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                    </div>
                </div>

                <!-- Notes -->
                <div class="profile-section" style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3><i class="fas fa-sticky-note"></i> Notes</h3>
                    <textarea onchange="updateLeadField('${lead.id}', 'notes', this.value)" style="width: 100%; min-height: 100px; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px;">${lead.notes || ''}</textarea>
                </div>

                <!-- Company Information -->
                <div class="profile-section" style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3>Company Information</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Company Name:</label>
                            <input type="text" value="${lead.name || ''}" onchange="updateLeadField('${lead.id}', 'name', this.value)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Contact:</label>
                            <input type="text" value="${lead.contact || ''}" onchange="updateLeadField('${lead.id}', 'contact', this.value)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Phone:</label>
                            <input type="text" value="${lead.phone || ''}" onchange="updateLeadField('${lead.id}', 'phone', this.value)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Email:</label>
                            <input type="text" value="${lead.email || ''}" onchange="updateLeadField('${lead.id}', 'email', this.value)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">DOT Number:</label>
                            <input type="text" value="${lead.dotNumber || ''}" onchange="updateLeadField('${lead.id}', 'dotNumber', this.value)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">MC Number:</label>
                            <input type="text" value="${lead.mcNumber || ''}" onchange="updateLeadField('${lead.id}', 'mcNumber', this.value)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Years in Business:</label>
                            <input type="text" value="${lead.yearsInBusiness || ''}" onchange="updateLeadField('${lead.id}', 'yearsInBusiness', this.value)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Renewal Date:</label>
                            <input type="text" value="${lead.renewalDate || ''}" placeholder="MM/DD/YYYY" onchange="updateLeadField('${lead.id}', 'renewalDate', this.value)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Insurance Company:</label>
                            <input type="text" value="${lead.insuranceCompany || ''}" placeholder="Current Insurance Company" onchange="updateLeadField('${lead.id}', 'insuranceCompany', this.value)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">State:</label>
                            <input type="text" value="${lead.state || ''}" placeholder="State" onchange="updateLeadField('${lead.id}', 'state', this.value)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                    </div>
                </div>

                <!-- Operation Details -->
                <div class="profile-section" style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3>Operation Details</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Radius of Operation:</label>
                            <input type="text" value="${lead.radiusOfOperation || ''}" placeholder="e.g., 500 miles" onchange="updateLeadField('${lead.id}', 'radiusOfOperation', this.value)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Commodity Hauled:</label>
                            <input type="text" value="${lead.commodityHauled || ''}" placeholder="e.g., General Freight" onchange="updateLeadField('${lead.id}', 'commodityHauled', this.value)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Operating States:</label>
                            <input type="text" value="${lead.operatingStates || ''}" placeholder="e.g., TX, LA, OK" onchange="updateLeadField('${lead.id}', 'operatingStates', this.value)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                    </div>
                </div>

                <!-- Vehicles -->
                <div class="profile-section" style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3><i class="fas fa-truck"></i> Vehicles (${lead.vehicles ? lead.vehicles.length : 0})</h3>
                        <button class="btn-small btn-primary" onclick="addVehicleToLead('${lead.id}')" style="padding: 8px 16px;">
                            <i class="fas fa-plus"></i> Add Vehicle
                        </button>
                    </div>
                    <div id="vehicles-container-${lead.id}">
                        ${lead.vehicles && lead.vehicles.length > 0 ?
                            lead.vehicles.map((vehicle, index) => `
                                <div style="border: 1px solid #d1d5db; border-radius: 8px; padding: 15px; margin-bottom: 15px; background: white;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                        <h4 style="margin: 0; color: #374151;">Vehicle ${index + 1}</h4>
                                        <button onclick="removeVehicle('${lead.id}', ${index})" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Year:</label>
                                            <input type="text" value="${vehicle.year || ''}" onchange="updateVehicle('${lead.id}', ${index}, 'year', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                        </div>
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Make:</label>
                                            <input type="text" value="${vehicle.make || ''}" onchange="updateVehicle('${lead.id}', ${index}, 'make', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                        </div>
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Model:</label>
                                            <input type="text" value="${vehicle.model || ''}" onchange="updateVehicle('${lead.id}', ${index}, 'model', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                        </div>
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">VIN:</label>
                                            <input type="text" value="${vehicle.vin || ''}" onchange="updateVehicle('${lead.id}', ${index}, 'vin', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                        </div>
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Value ($):</label>
                                            <input type="text" value="${vehicle.value || ''}" onchange="updateVehicle('${lead.id}', ${index}, 'value', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                        </div>
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Type:</label>
                                            <select onchange="updateVehicle('${lead.id}', ${index}, 'type', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                                <option value="">Select Type</option>
                                                <option value="Box Truck" ${vehicle.type === 'Box Truck' ? 'selected' : ''}>Box Truck</option>
                                                <option value="Truck Tractor" ${vehicle.type === 'Truck Tractor' || vehicle.type === 'Semi Truck' ? 'selected' : ''}>Truck Tractor</option>
                                                <option value="Flatbed" ${vehicle.type === 'Flatbed' ? 'selected' : ''}>Flatbed</option>
                                                <option value="Pickup" ${vehicle.type === 'Pickup' ? 'selected' : ''}>Pickup</option>
                                                <option value="Van" ${vehicle.type === 'Van' ? 'selected' : ''}>Van</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            `).join('') :
                            '<p style="color: #9ca3af; text-align: center; padding: 20px;">No vehicles added yet</p>'
                        }
                    </div>
                </div>

                <!-- Trailers -->
                <div class="profile-section" style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3><i class="fas fa-trailer"></i> Trailers (${lead.trailers ? lead.trailers.length : 0})</h3>
                        <button class="btn-small btn-primary" onclick="addTrailerToLead('${lead.id}')" style="padding: 8px 16px;">
                            <i class="fas fa-plus"></i> Add Trailer
                        </button>
                    </div>
                    <div id="trailers-container-${lead.id}">
                        ${lead.trailers && lead.trailers.length > 0 ?
                            lead.trailers.map((trailer, index) => `
                                <div style="border: 1px solid #d1d5db; border-radius: 8px; padding: 15px; margin-bottom: 15px; background: white;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                        <h4 style="margin: 0; color: #374151;">Trailer ${index + 1}</h4>
                                        <button onclick="removeTrailer('${lead.id}', ${index})" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Year:</label>
                                            <input type="text" value="${trailer.year || ''}" onchange="updateTrailer('${lead.id}', ${index}, 'year', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                        </div>
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Make:</label>
                                            <input type="text" value="${trailer.make || ''}" onchange="updateTrailer('${lead.id}', ${index}, 'make', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                        </div>
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Type:</label>
                                            <input type="text" value="${trailer.type || ''}" onchange="updateTrailer('${lead.id}', ${index}, 'type', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                        </div>
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">VIN:</label>
                                            <input type="text" value="${trailer.vin || ''}" onchange="updateTrailer('${lead.id}', ${index}, 'vin', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                        </div>
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Length:</label>
                                            <input type="text" value="${trailer.length || ''}" onchange="updateTrailer('${lead.id}', ${index}, 'length', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                        </div>
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Value ($):</label>
                                            <input type="text" value="${trailer.value || ''}" onchange="updateTrailer('${lead.id}', ${index}, 'value', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                        </div>
                                    </div>
                                </div>
                            `).join('') :
                            '<p style="color: #9ca3af; text-align: center; padding: 20px;">No trailers added yet</p>'
                        }
                    </div>
                </div>

                <!-- Drivers -->
                <div class="profile-section" style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3><i class="fas fa-id-card"></i> Drivers (${lead.drivers ? lead.drivers.length : 0})</h3>
                        <button class="btn-small btn-primary" onclick="addDriverToLead('${lead.id}')" style="padding: 8px 16px;">
                            <i class="fas fa-plus"></i> Add Driver
                        </button>
                    </div>
                    <div id="drivers-container-${lead.id}">
                        ${lead.drivers && lead.drivers.length > 0 ?
                            lead.drivers.map((driver, index) => `
                                <div style="border: 1px solid #d1d5db; border-radius: 8px; padding: 15px; margin-bottom: 15px; background: white;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                        <h4 style="margin: 0; color: #374151;">Driver ${index + 1}</h4>
                                        <button onclick="removeDriver('${lead.id}', ${index})" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Name:</label>
                                            <input type="text" value="${driver.name || ''}" onchange="updateDriver('${lead.id}', ${index}, 'name', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                        </div>
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">License #:</label>
                                            <input type="text" value="${driver.license || ''}" onchange="updateDriver('${lead.id}', ${index}, 'license', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                        </div>
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Date of Birth:</label>
                                            <input type="date" value="${driver.dob || ''}" onchange="updateDriver('${lead.id}', ${index}, 'dob', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                        </div>
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Hire Date:</label>
                                            <input type="date" value="${driver.hireDate || ''}" onchange="updateDriver('${lead.id}', ${index}, 'hireDate', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                        </div>
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Years Experience:</label>
                                            <input type="text" value="${driver.experience || ''}" onchange="updateDriver('${lead.id}', ${index}, 'experience', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                        </div>
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Violations/Accidents:</label>
                                            <input type="text" value="${driver.violations || ''}" onchange="updateDriver('${lead.id}', ${index}, 'violations', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                        </div>
                                    </div>
                                </div>
                            `).join('') :
                            '<p style="color: #9ca3af; text-align: center; padding: 20px;">No drivers added yet</p>'
                        }
                    </div>
                </div>

                <!-- Call Recording Section -->
                <div class="profile-section" style="background: #fff; border: 2px solid ${lead.recordingPath && lead.hasRecording ? '#10b981' : '#f3f4f6'}; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3><i class="fas fa-${lead.recordingPath && lead.hasRecording ? 'play-circle' : 'microphone-alt'}"></i> Call Recording</h3>
                        ${!(lead.recordingPath && lead.hasRecording) ? `
                            <button onclick="openCallRecordingUpload('${lead.id}')" style="background: #dc3545; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                <i class="fas fa-upload"></i> Upload Recording
                            </button>
                        ` : ''}
                    </div>
                    ${lead.recordingPath && lead.hasRecording ? `
                        <audio controls style="width: 100%; height: 40px;" preload="none">
                            <source src="${lead.recordingPath}" type="audio/mpeg">
                            <source src="${lead.recordingPath}" type="audio/wav">
                            Your browser does not support the audio element.
                        </audio>
                    ` : `
                        <p style="color: #9ca3af; text-align: center; padding: 20px;">No call recording available yet</p>
                    `}
                </div>

                <!-- Call Transcript -->
                <div class="profile-section" style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3><i class="fas fa-microphone"></i> Call Transcript</h3>
                    <textarea onchange="updateLeadField('${lead.id}', 'transcriptText', this.value)" style="width: 100%; min-height: 150px; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-family: monospace;">${lead.transcriptText || ''}</textarea>
                </div>

                <!-- Quote Submissions -->
                <div class="profile-section" style="background: #f0f8ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3><i class="fas fa-file-contract"></i> Quote Submissions</h3>
                        <div style="display: flex; gap: 10px;">
                            <button onclick="createQuoteApplication('${lead.id}')" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                                <i class="fas fa-file-alt"></i> Quote Application
                            </button>
                            <button onclick="addQuoteSubmission('${lead.id}')" style="background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                                <i class="fas fa-plus"></i> Add Quote
                            </button>
                        </div>
                    </div>
                    <div id="quote-submissions-container">
                        <div id="quotes-container-${lead.id}" style="padding: 20px; text-align: center;">
                            <p style="color: #9ca3af; text-align: center; padding: 20px;">No quotes submitted yet</p>
                        </div>
                    </div>
                </div>

                <!-- APP Stage -->
                <div class="profile-section" style="background: #fff8e1; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3><i class="fas fa-clipboard-check"></i> APP Stage</h3>
                        <button onclick="showMarketStats('${lead.id}')" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 6px;" onmouseover="this.style.background='#0056b3'" onmouseout="this.style.background='#007bff'">
                            <i class="fas fa-chart-line"></i>
                            Market Stats
                        </button>
                    </div>

                    <!-- Checkboxes Section -->
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; padding: 15px; background: white; border-radius: 6px; border: 1px solid #e0e0e0;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" ${lead.appStage?.app ? 'checked' : ''} onchange="updateAppStageField('${lead.id}', 'app', this.checked)" style="margin-right: 8px; transform: scale(1.2);">
                            <span style="font-weight: 500;">APP</span>
                        </label>
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" ${lead.appStage?.lossRuns ? 'checked' : ''} onchange="updateAppStageField('${lead.id}', 'lossRuns', this.checked)" style="margin-right: 8px; transform: scale(1.2);">
                            <span style="font-weight: 500;">LOSS RUNS</span>
                        </label>
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" ${lead.appStage?.iftas ? 'checked' : ''} onchange="updateAppStageField('${lead.id}', 'iftas', this.checked)" style="margin-right: 8px; transform: scale(1.2);">
                            <span style="font-weight: 500;">IFTAS</span>
                        </label>
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" ${lead.appStage?.saa ? 'checked' : ''} onchange="updateAppStageField('${lead.id}', 'saa', this.checked)" style="margin-right: 8px; transform: scale(1.2);">
                            <span style="font-weight: 500;">SAA</span>
                        </label>
                    </div>

                    <!-- Requirements Information -->
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 6px; font-size: 18px; line-height: 1.8;">
                        <div style="margin-bottom: 16px;">
                            <strong>0-2 <i class="fas fa-truck" style="color: #374151;"></i></strong>
                            <span id="northland-02-${lead.id}" style="background: ${lead.appStage?.app ? '#10b981' : '#9ca3af'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 16px; margin: 0 6px;">Northland</span>
                            <span id="canal-02-${lead.id}" style="background: ${lead.appStage?.app ? '#10b981' : '#9ca3af'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 16px; margin: 0 6px;">Canal</span>
                            <span id="req-app-${lead.id}" style="color: ${lead.appStage?.app ? '#10b981' : 'black'}; font-weight: bold; margin-left: 10px;">APP</span>
                        </div>

                        <div style="margin-bottom: 16px;">
                            <strong>3+ <i class="fas fa-truck" style="color: #374151;"></i></strong>
                            <span id="northland-3plus-${lead.id}" style="background: ${(lead.appStage?.app && lead.appStage?.lossRuns) ? '#10b981' : '#9ca3af'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 16px; margin: 0 6px;">Northland</span>
                            <span id="canal-3plus-${lead.id}" style="background: ${(lead.appStage?.app && lead.appStage?.lossRuns) ? '#10b981' : '#9ca3af'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 16px; margin: 0 6px;">Canal</span>
                            <span style="margin-left: 10px;">
                                <span id="req-app2-${lead.id}" style="color: ${lead.appStage?.app ? '#10b981' : 'black'}; font-weight: bold;">APP</span> -
                                <span id="req-lossruns-${lead.id}" style="color: ${lead.appStage?.lossRuns ? '#10b981' : 'black'}; font-weight: bold;">LOSS RUNS</span>
                            </span>
                        </div>

                        <!-- Divider -->
                        <div style="border-top: 2px solid #d1d5db; margin: 20px 0;">
                            <div style="text-align: center; font-weight: bold; font-size: 20px; color: #374151; padding: 12px 0; border-bottom: 2px solid #d1d5db; background: white; margin: 0;">3+ Years</div>
                        </div>

                        <div style="margin-bottom: 16px;">
                            <span id="berkley-3plus-${lead.id}" style="background: ${(lead.appStage?.app && lead.appStage?.lossRuns) ? '#10b981' : '#9ca3af'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 16px; margin: 0 6px;">Berkley</span>
                            <span id="occidental-3plus-${lead.id}" style="background: ${(lead.appStage?.app && lead.appStage?.lossRuns) ? '#10b981' : '#9ca3af'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 16px; margin: 0 6px;">Occidental</span>
                            <span style="margin-left: 10px;">
                                <span id="req-app3-${lead.id}" style="color: ${lead.appStage?.app ? '#10b981' : 'black'}; font-weight: bold;">APP</span> -
                                <span id="req-lossruns2-${lead.id}" style="color: ${lead.appStage?.lossRuns ? '#10b981' : 'black'}; font-weight: bold;">LOSS RUNS</span>
                            </span>
                        </div>
                        <div>
                            <span id="crum-3plus-${lead.id}" style="background: ${(lead.appStage?.app && lead.appStage?.lossRuns && lead.appStage?.iftas && lead.appStage?.saa) ? '#10b981' : '#9ca3af'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 16px; margin: 0 6px;">Crum</span>
                            <span style="margin-left: 10px;">
                                <span id="req-app4-${lead.id}" style="color: ${lead.appStage?.app ? '#10b981' : 'black'}; font-weight: bold;">APP</span> -
                                <span id="req-lossruns3-${lead.id}" style="color: ${lead.appStage?.lossRuns ? '#10b981' : 'black'}; font-weight: bold;">LOSS RUNS</span> -
                                <span id="req-iftas-${lead.id}" style="color: ${lead.appStage?.iftas ? '#10b981' : 'black'}; font-weight: bold;">IFTAS</span> -
                                <span id="req-saa-${lead.id}" style="color: ${lead.appStage?.saa ? '#10b981' : 'black'}; font-weight: bold;">SAA</span>
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Application Submissions -->
                <div class="profile-section" style="background: #f0f9f0; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3><i class="fas fa-file-signature"></i> Application Submissions</h3>
                    </div>
                    <div id="application-submissions-container-${lead.id}">
                        <p style="color: #9ca3af; text-align: center; padding: 20px;">No applications submitted yet</p>
                    </div>
                </div>

                <!-- Loss Runs -->
                <div class="profile-section" style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3><i class="fas fa-file-pdf"></i> Loss Runs and Other Documentation</h3>
                        <div style="display: flex; gap: 10px;">
                            <button id="email-doc-btn-${lead.id}" onclick="checkFilesAndOpenEmail('${lead.id}')" style="background: rgb(0, 102, 204); color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-size: 12px; opacity: 1;" title="Send email with attached documentation">
                                <i class="fas fa-envelope"></i> Email Documentation
                            </button>
                            <button onclick="openLossRunsUpload('${lead.id}')" style="background: #dc3545; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                <i class="fas fa-upload"></i> Upload Documentation
                            </button>
                        </div>
                    </div>
                    <div id="loss-runs-container-${lead.id}">
                        <p style="color: #9ca3af; text-align: center; padding: 20px;">Loading loss runs...</p>
                    </div>
                </div>

            </div>
        </div>
    `;

    document.body.appendChild(modalContainer);

    // Activate DOM protection to prevent hardcoded ID overwrites
    protectedFunctions.protectModalIDs(lead.id, modalContainer);

    // Initialize callback display for this lead
    setTimeout(() => {
        displayScheduledCallbacks(lead.id);
    }, 100);

    // Force immediate ID fix in case any hardcoded elements are already present
    setTimeout(() => {
        const badElements = modalContainer.querySelectorAll('[id*="8126662"]');
        if (badElements.length > 0) {
            console.warn(`🔧 IMMEDIATE FIX: Found ${badElements.length} hardcoded elements on modal open`);
            badElements.forEach(element => {
                const oldId = element.id;
                const newId = oldId.replace('8126662', lead.id);
                element.id = newId;
                console.log(`🔧 Immediate fix: ${oldId} → ${newId}`);
            });
        }
    }, 10);

    // Apply reach-out styling based on lead's to-do status
    setTimeout(() => {
        // Check if this stage requires reach-out based on stage name
        const stagesRequiringReachOut = [
            'Contact Attempted', 'contact_attempted',
            'Info Requested', 'info_requested',
            'Loss Runs Requested', 'loss_runs_requested',
            'Quote Sent', 'quote_sent', 'quote-sent-unaware', 'quote-sent-aware',
            'Interested', 'interested'
        ];

        const stageRequiresReachOut = stagesRequiringReachOut.includes(lead.stage);

        // Also check getActionText as backup
        let actionTextCheck = false;
        if (window.getActionText) {
            const actionText = window.getActionText(lead.stage, lead.reachOut);
            actionTextCheck = actionText === 'Reach out';
            console.log(`🔍 Profile load - Lead ${lead.id} stage: ${lead.stage}, actionText: "${actionText}", stageRequiresReachOut: ${stageRequiresReachOut}, actionTextCheck: ${actionTextCheck}`);
        }

        // Use stage-based check as primary method
        const hasReachOutTodo = stageRequiresReachOut || actionTextCheck;
        console.log(`🎯 Final hasReachOutTodo: ${hasReachOutTodo}`);

        applyReachOutStyling(lead.id, hasReachOutTodo);
    }, 100);

    // Add click-outside-to-close functionality
    modalContainer.addEventListener('click', function(e) {
        // Only close if clicking the background (not the modal content)
        if (e.target === modalContainer) {
            console.log('🖱️ Clicked outside modal, closing...');
            modalContainer.remove();

            // Refresh the leads table to show any changes made
            refreshLeadsTable();
        }
    });

    // Initialize dynamic elements after modal is created
    setTimeout(() => {
        // Load saved quote applications
        protectedFunctions.loadQuoteApplications(lead.id);

        // Load loss runs from server
        protectedFunctions.loadLossRuns(lead.id);

        // AUTO-CHECK CALL CHECKBOX FOR OVERDUE CALLBACKS
        setTimeout(() => {
            console.log('🔍 CALLBACK AUTO-CHECK: Checking for overdue callbacks for lead', lead.id);

            const callbacksKey = 'scheduled_callbacks';
            const callbacks = JSON.parse(localStorage.getItem(callbacksKey) || '{}');
            const now = new Date();

            console.log('🔍 CALLBACK AUTO-CHECK: Current callbacks data:', callbacks);
            console.log('🔍 CALLBACK AUTO-CHECK: Looking for leadId:', lead.id);

            if (callbacks[lead.id]) {
                console.log('📋 CALLBACK AUTO-CHECK: Found callbacks for lead:', callbacks[lead.id]);

                // Check if any callback is overdue AND not completed
                const overdueCallbacks = callbacks[lead.id].filter(callback => {
                    const callbackTime = new Date(callback.dateTime);
                    const isOverdue = callbackTime <= now;
                    const isCompleted = callback.completed;
                    console.log('🔍 CALLBACK AUTO-CHECK: Callback', callback.dateTime, 'isOverdue:', isOverdue, 'isCompleted:', isCompleted);
                    return isOverdue && !isCompleted;
                });

                console.log('🔍 CALLBACK AUTO-CHECK: Filtered overdue callbacks:', overdueCallbacks);

                if (overdueCallbacks.length > 0) {
                    console.log('📞 CALLBACK AUTO-CHECK: Found', overdueCallbacks.length, 'overdue callbacks, auto-checking call-made checkbox');

                    const callCheckbox = document.getElementById(`call-made-${lead.id}`);
                    console.log('🔍 CALLBACK AUTO-CHECK: Found checkbox:', callCheckbox, 'currently checked:', callCheckbox?.checked);

                    if (callCheckbox && !callCheckbox.checked) {
                        callCheckbox.checked = true;
                        console.log('✅ CALLBACK AUTO-CHECK: Auto-checked call-made checkbox for lead', lead.id);

                        // Trigger the change event to update the reach out data
                        const changeEvent = new Event('change', { bubbles: true });
                        callCheckbox.dispatchEvent(changeEvent);
                        console.log('🔍 CALLBACK AUTO-CHECK: Triggered change event');
                    } else if (callCheckbox?.checked) {
                        console.log('✅ CALLBACK AUTO-CHECK: Checkbox already checked for lead', lead.id);
                    }
                } else {
                    console.log('⏳ CALLBACK AUTO-CHECK: No overdue callbacks for lead', lead.id);
                }
            } else {
                console.log('📋 CALLBACK AUTO-CHECK: No callbacks found for lead', lead.id);
            }
        }, 200);

    }, 100);

    console.log('🔥 Enhanced Profile: Modal created successfully');
};

// Auto-save function for company information fields
protectedFunctions.updateLeadField = function(leadId, field, value) {
    console.log('Updating lead field:', leadId, field, value);

    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

    if (leadIndex !== -1) {
        leads[leadIndex][field] = value;
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        console.log('Field updated and saved to localStorage:', field, value);

        // Save to server database
        const updateData = {};
        updateData[field] = value;

        fetch(`/api/leads/${leadId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('✅ Field updated on server:', field, value);
            } else {
                console.error('❌ Server update failed:', data.error);
            }
        })
        .catch(error => {
            console.error('❌ Server update error:', error);
        });

        // Update the table display immediately
        refreshLeadsTable();
    }
};

// Function to handle APP Stage checkbox updates
protectedFunctions.updateAppStageField = function(leadId, field, value) {
    console.log('Updating APP Stage field:', leadId, field, value);

    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

    if (leadIndex !== -1) {
        // Initialize appStage object if it doesn't exist
        if (!leads[leadIndex].appStage) {
            leads[leadIndex].appStage = {
                app: false,
                lossRuns: false,
                iftas: false,
                saa: false
            };
        }

        // Update the specific field
        leads[leadIndex].appStage[field] = value;
        // Track when the app stage was last updated for goals tracking
        if (value) {
            const now = new Date().toISOString();
            leads[leadIndex].stageUpdatedAt = now;
            leads[leadIndex].lastModified = now;
        }
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        console.log('APP Stage field updated:', field, value);

        // Update visual highlighting in requirements section
        updateRequirementsHighlighting(leadId, field, value);

        // Save to server database
        const updateData = {
            appStage: leads[leadIndex].appStage,
            stageUpdatedAt: leads[leadIndex].stageUpdatedAt,
            lastModified: leads[leadIndex].lastModified
        };

        fetch(`/api/leads/${leadId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('✅ APP Stage updated on server:', field, value);
            } else {
                console.error('❌ APP Stage server update failed:', data.error);
            }
        })
        .catch(error => {
            console.error('❌ APP Stage server update error:', error);
        });
    }
};

// Helper function to update requirements section highlighting
function updateRequirementsHighlighting(leadId, field, value) {
    // Get current app stage from localStorage
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));
    const appStage = lead?.appStage || {};

    const color = value ? '#10b981' : 'black'; // Green if checked, black if unchecked

    if (field === 'app') {
        // Update all APP references
        const appElements = [
            document.getElementById(`req-app-${leadId}`),
            document.getElementById(`req-app2-${leadId}`),
            document.getElementById(`req-app3-${leadId}`),
            document.getElementById(`req-app4-${leadId}`)
        ];
        appElements.forEach(el => {
            if (el) el.style.color = color;
        });

        // Update 0-2 year company bubbles (only need APP)
        updateCompanyBubble(`northland-02-${leadId}`, appStage.app);
        updateCompanyBubble(`canal-02-${leadId}`, appStage.app);

    } else if (field === 'lossRuns') {
        // Update all LOSS RUNS references
        const lossRunsElements = [
            document.getElementById(`req-lossruns-${leadId}`),
            document.getElementById(`req-lossruns2-${leadId}`),
            document.getElementById(`req-lossruns3-${leadId}`)
        ];
        lossRunsElements.forEach(el => {
            if (el) el.style.color = color;
        });

    } else if (field === 'iftas') {
        // Update IFTAS reference
        const iftasElement = document.getElementById(`req-iftas-${leadId}`);
        if (iftasElement) iftasElement.style.color = color;

    } else if (field === 'saa') {
        // Update SAA reference
        const saaElement = document.getElementById(`req-saa-${leadId}`);
        if (saaElement) saaElement.style.color = color;
    }

    // Update 3+ year company bubbles based on their specific requirements
    updateCompanyBubble(`northland-3plus-${leadId}`, appStage.app && appStage.lossRuns);
    updateCompanyBubble(`canal-3plus-${leadId}`, appStage.app && appStage.lossRuns);
    updateCompanyBubble(`berkley-3plus-${leadId}`, appStage.app && appStage.lossRuns);
    updateCompanyBubble(`occidental-3plus-${leadId}`, appStage.app && appStage.lossRuns);
    updateCompanyBubble(`crum-3plus-${leadId}`, appStage.app && appStage.lossRuns && appStage.iftas && appStage.saa);
}

// Helper function to update company bubble color
function updateCompanyBubble(elementId, isComplete) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.background = isComplete ? '#10b981' : '#9ca3af';
    }
}

// NEW: Dedicated Email Composer for Lead Documentation
protectedFunctions.openEmailDocumentation = async function(leadId) {
    console.log('📧 Opening dedicated email composer for lead:', leadId);

    // Get lead data
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));

    if (!lead) {
        alert('Lead not found');
        return;
    }

    // Prepare subject with lead data (use NULL if not found)
    const companyName = lead.name || 'NULL';
    const rawRenewalDate = lead.renewalDate || 'NULL';
    const renewalDate = rawRenewalDate !== 'NULL'
        ? rawRenewalDate.replace(/\/\d{4}$/, '/2026').replace(/-\d{4}$/, '-2026')
        : 'NULL';
    const usdot = lead.dotNumber || 'NULL';
    const subject = `Renewal: ${renewalDate} - USDOT: ${usdot} - ${companyName}`;

    // Get files from both localStorage AND server
    let allFiles = [];

    // 1. Get files from localStorage first
    const lossRunsData = JSON.parse(localStorage.getItem('lossRunsData') || '{}');
    const localFiles = lossRunsData[leadId] || [];
    allFiles = [...localFiles];

    console.log('📁 Found', localFiles.length, 'local files for lead', leadId);

    // 2. Also try to get files from server
    try {
        console.log('🌐 Loading files from server for lead:', leadId);
        const response = await fetch(`/api/loss-runs-upload?leadId=${encodeURIComponent(leadId)}`);
        const serverData = await response.json();

        if (serverData.success && serverData.files.length > 0) {
            console.log('✅ Found', serverData.files.length, 'server files for lead', leadId);

            // Add server files to the list, avoiding duplicates
            serverData.files.forEach(serverFile => {
                // Check if file already exists in local files (by filename)
                const existsLocally = allFiles.some(localFile =>
                    localFile.filename === serverFile.file_name ||
                    localFile.originalname === serverFile.file_name ||
                    localFile.filename === serverFile.filename ||
                    localFile.originalname === serverFile.filename
                );

                if (!existsLocally) {
                    // Convert server file format to match expected format (server uses file_name, file_size, etc.)
                    const originalName = serverFile.file_name ? serverFile.file_name.replace(/^[a-f0-9]+_[0-9]+_/, '') : serverFile.filename;
                    const fileSize = serverFile.file_size ? Math.round(serverFile.file_size / 1024) + ' KB' : serverFile.size;

                    allFiles.push({
                        filename: serverFile.file_name || serverFile.filename,
                        originalname: originalName,
                        originalName: originalName, // Also add this for compatibility
                        size: fileSize,
                        type: serverFile.content_type || 'application/pdf',
                        data: serverFile.data || null, // Server might not include data
                        isServerFile: true,
                        fileId: serverFile.id
                    });
                }
            });
        } else {
            console.log('ℹ️ No server files found or server error for lead', leadId);
        }
    } catch (error) {
        console.warn('⚠️ Failed to load server files, using local files only:', error);
    }

    console.log('📎 Total attachments for email:', allFiles.length, 'files for lead', leadId);

    // Create the email composer modal
    protectedFunctions.createEmailComposer(lead, subject, allFiles);
};

// Agent email map
const AGENT_EMAILS = {
    'grant':   'Grant@vigagency.com',
    'carson':  'Carson@vigagency.com',
    'hunter':  'Hunter@vigagency.com',
    'maureen': 'Maureen.corp@Uigagency.com'
};
function getAgentEmail(assignedTo) {
    if (!assignedTo) return '';
    return AGENT_EMAILS[assignedTo.toLowerCase()] || '';
}

// NEW: Create dedicated email composer modal
protectedFunctions.createEmailComposer = function(lead, subject, attachments) {
    console.log('✉️ Creating email composer for:', lead.name);

    // Remove any existing email composer
    const existing = document.getElementById('email-composer-modal');
    if (existing) {
        existing.remove();
    }

    // Create email composer modal with high z-index (above lead profile)
    const emailModal = document.createElement('div');
    emailModal.id = 'email-composer-modal';
    emailModal.style.cssText = `
        position: fixed !important;
        top: 0px !important;
        left: 0px !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.7) !important;
        display: flex;
        justify-content: center !important;
        align-items: center !important;
        z-index: 2000000 !important;
        visibility: visible;
        opacity: 1;
    `;

    // Broker-focused email body template
    const emailBody = `Hello,

We are looking to get a quote for the following commercial auto account:

ACCOUNT DETAILS:
• Company: ${lead.name || 'NULL'}
• USDOT Number: ${lead.dotNumber || 'NULL'}
• Renewal Date: ${lead.renewalDate || 'NULL'}

${attachments.length > 0 ? `ATTACHED DOCUMENTATION:\n${attachments.map(file => `• ${file.originalName || file.filename}`).join('\n')}\n\n` : 'Please let us know what additional documentation you may need for quoting.\n\n'}Please provide your most competitive rates and let us know if you need any additional information.

Thank you,`;

    emailModal.innerHTML = `
        <div style="background: white; border-radius: 12px; width: 95%; max-width: 1200px; max-height: 95vh; overflow-y: auto; box-shadow: rgba(0, 0, 0, 0.3) 0px 20px 60px; position: relative;">
            <div style="padding: 20px; border-bottom: 1px solid #e5e7eb; background: #f8fafc; border-radius: 12px 12px 0 0;">
                <h2 style="margin: 0; font-size: 20px; color: #1f2937;">
                    <i class="fas fa-paper-plane" style="color: #2563eb; margin-right: 10px;"></i>
                    Compose Email - ${lead.name || 'NULL'}
                </h2>
                <button onclick="document.getElementById('email-composer-modal').remove()" style="position: absolute; top: 15px; right: 15px; font-size: 24px; background: none; border: none; cursor: pointer; color: #6b7280;">×</button>
            </div>

            <div style="padding: 20px;">
                <!-- To Field -->
                <div style="margin-bottom: 15px;">
                    <label style="display: block; font-weight: 600; font-size: 14px; margin-bottom: 5px; color: #374151;">To:</label>
                    <input type="email" id="email-to-field" value="Grant@vigagency.com" placeholder="recipient@example.com" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                </div>

                <!-- Agent CC Field -->
                <div style="margin-bottom: 15px;">
                    <label style="display: block; font-weight: 600; font-size: 14px; margin-bottom: 5px; color: #374151;">Agent (CC):</label>
                    <input type="email" id="email-agent-cc-field" value="${getAgentEmail(lead.assignedTo)}" placeholder="agent@vigagency.com" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                </div>

                <!-- Subject Field -->
                <div style="margin-bottom: 15px;">
                    <label style="display: block; font-weight: 600; font-size: 14px; margin-bottom: 5px; color: #374151;">Subject:</label>
                    <input type="text" id="email-subject-field" value="${subject}" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                </div>

                <!-- Attachments Section -->
                <div style="margin-bottom: 15px;">
                    <label style="display: block; font-weight: 600; font-size: 14px; margin-bottom: 5px; color: #374151;">
                        Attachments (${attachments.length} files):
                    </label>
                    <div id="attachments-list" style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; background: #f9fafb; max-height: 150px; overflow-y: auto;">
                        ${attachments.length > 0 ?
                            attachments.map(file => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px; margin-bottom: 5px; background: white; border-radius: 4px; border: 1px solid #e5e7eb;">
                                    <div style="display: flex; align-items: center;">
                                        <i class="fas fa-paperclip" style="color: #6b7280; margin-right: 8px;"></i>
                                        <span style="font-size: 13px; font-weight: 500;">${file.originalName || file.filename}</span>
                                        <span style="font-size: 11px; color: #6b7280; margin-left: 8px;">(${file.size || 'Unknown size'})</span>
                                    </div>
                                    <button onclick="removeAttachment('${file.filename}')" style="background: #ef4444; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-size: 11px;">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            `).join('') :
                            '<p style="color: #6b7280; text-align: center; margin: 0; font-size: 13px;">No files attached</p>'
                        }
                    </div>
                </div>

                <!-- Message Body -->
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-weight: 600; font-size: 14px; margin-bottom: 5px; color: #374151;">Message:</label>
                    <textarea id="email-body-field" style="width: 100%; min-height: 400px; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5; resize: vertical;">${emailBody}</textarea>
                </div>

                <!-- Action Buttons -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                    <div>
                        <button onclick="addMoreAttachments('${lead.id}')" style="background: #6b7280; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; margin-right: 10px;">
                            <i class="fas fa-plus"></i> Add Files
                        </button>
                        <span style="font-size: 12px; color: #6b7280;">Click to add more files from device</span>
                    </div>
                    <div>
                        <button onclick="document.getElementById('email-composer-modal').remove()" style="background: #6b7280; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; margin-right: 10px;">
                            Cancel
                        </button>
                        <button onclick="sendEmail('${lead.id}')" style="background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                            <i class="fas fa-paper-plane"></i> Send Email
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(emailModal);
    console.log('✅ Email composer created with', attachments.length, 'attachments');
};

// Add checkFilesAndOpenEmail function
protectedFunctions.checkFilesAndOpenEmail = function(leadId) {
    console.log('📧 Checking files and opening email for lead:', leadId);
    protectedFunctions.openEmailDocumentation(leadId);
};

// Upload loss runs function with full server integration
protectedFunctions.openLossRunsUpload = function(leadId) {
    console.log('📄 Opening loss runs upload for lead:', leadId);

    // Create file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
    fileInput.multiple = true;

    fileInput.onchange = function(event) {
        const files = event.target.files;
        if (files.length > 0) {
            protectedFunctions.uploadLossRunsFiles(leadId, files);
        }
    };

    // Trigger file selection
    fileInput.click();
};

// Upload files function with Base64 storage (same as working version)
protectedFunctions.uploadLossRunsFiles = function(leadId, files) {
    console.log('📤 Uploading loss runs files to server:', files.length, 'files for lead:', leadId);

    // Show uploading message
    const container = document.getElementById(`loss-runs-container-${leadId}`);
    if (container) {
        container.innerHTML = '<p style="color: #3b82f6; text-align: center; padding: 20px;">📤 Uploading files to server...</p>';
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('leadId', leadId);

    // Add all files to FormData
    Array.from(files).forEach((file, index) => {
        formData.append('files', file);
    });

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        controller.abort();
        console.error('❌ Upload timed out after 30 seconds');
    }, 30000); // 30 second timeout for file uploads

    // Upload to server
    fetch('/api/loss-runs-upload', {
        method: 'POST',
        body: formData,
        signal: controller.signal
    })
    .then(response => {
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    })
    .then(data => {
        if (data.success) {
            console.log('✅ Files uploaded successfully to server:', data.count, 'files');
            // Reload the loss runs display
            setTimeout(() => {
                protectedFunctions.loadLossRuns(leadId);
            }, 300);
        } else {
            console.error('❌ Upload failed:', data.error);
            alert('Upload failed: ' + data.error);
            protectedFunctions.loadLossRuns(leadId);
        }
    })
    .catch(error => {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.error('❌ File upload timed out');
            alert('File upload timed out. Please try again with smaller files or check your connection.');
            if (container) {
                container.innerHTML = '<p style="color: #dc3545; text-align: center; padding: 20px;">Upload timed out. <button onclick="protectedFunctions.uploadLossRuns(\'' + leadId + '\')" style="background: #3b82f6; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; margin-left: 8px;">Retry</button></p>';
            }
        } else {
            console.error('❌ Upload error:', error);
            alert('Upload error. Please try again.');
            protectedFunctions.loadLossRuns(leadId);
        }
    });
};

// Load loss runs from server
protectedFunctions.loadLossRuns = function(leadId) {
    console.log('🔄 Loading loss runs from server for lead:', leadId);

    const container = document.getElementById(`loss-runs-container-${leadId}`);
    if (!container) return;

    // Show loading message
    container.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 20px;">⏳ Loading documents...</p>';

    // Load from server
    fetch(`/api/loss-runs-upload?leadId=${encodeURIComponent(leadId)}`)
    .then(response => response.json())
    .then(data => {
        if (data.success && data.files.length > 0) {
            // Display existing loss runs from server
            container.innerHTML = data.files.map(lossRun => {
                const uploadDate = new Date(lossRun.uploaded_date).toLocaleDateString();
                const fileSize = Math.round(lossRun.file_size / 1024) + ' KB';
                const originalName = lossRun.file_name.replace(/^[a-f0-9]+_[0-9]+_/, ''); // Remove unique prefix

                return `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: white; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 8px;">
                        <div>
                            <div style="display: flex; align-items: center; margin-bottom: 4px;">
                                <i class="fas fa-file-pdf" style="color: #dc3545; margin-right: 8px;"></i>
                                <strong style="font-size: 14px;">${originalName}</strong>
                                <span style="background: #10b981; color: white; font-size: 10px; padding: 2px 6px; border-radius: 10px; margin-left: 8px;">SERVER</span>
                            </div>
                            <div style="font-size: 12px; color: #6b7280;">
                                Uploaded: ${uploadDate} • Size: ${fileSize}
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="view-loss-runs-btn"
                                    data-file-id="${lossRun.id}"
                                    onclick="viewLossRuns('${leadId}', '${lossRun.id}', '${originalName}')"
                                    style="background: #0066cc; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button class="remove-loss-runs-btn"
                                    data-file-id="${lossRun.id}"
                                    onclick="removeLossRuns('${leadId}', '${lossRun.id}')"
                                    style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                <i class="fas fa-trash"></i> Remove
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<p style="color: #9ca3af; text-align: center; padding: 20px;">No loss runs uploaded yet</p>';
        }
    })
    .catch(error => {
        console.error('❌ Error loading loss runs:', error);
        container.innerHTML = '<p style="color: #dc3545; text-align: center; padding: 20px;">Error loading documents</p>';
    });
};

// View loss runs function (server version)
protectedFunctions.viewLossRuns = async function(leadId, fileId, originalName) {
    console.log('👁️ Viewing loss runs from server:', leadId, fileId, originalName);

    const fileUrl = `/api/loss-runs-download?fileId=${encodeURIComponent(fileId)}`;
    const jwt = sessionStorage.getItem('vanguard_jwt') || '';

    try {
        const resp = await fetch(fileUrl, {
            headers: { 'Authorization': `Bearer ${jwt}` }
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        console.log('✅ File opened from server:', originalName);
    } catch (e) {
        console.error('Error viewing loss run:', e);
        alert('Error opening document. Please try again.');
    }
};

// Remove loss runs function (server version)
protectedFunctions.removeLossRuns = function(leadId, fileId) {
    if (!confirm('Are you sure you want to remove this loss run document from the server?')) {
        return;
    }

    console.log('🗑️ Removing loss runs from server:', leadId, fileId);

    // Remove from server
    fetch('/api/loss-runs-upload', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileId: fileId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('✅ Loss run removed successfully from server');
            // Reload the loss runs list
            protectedFunctions.loadLossRuns(leadId);
        } else {
            alert('Error removing file: ' + data.error);
        }
    })
    .catch(error => {
        console.error('❌ Error removing file:', error);
        alert('Error removing file. Please try again.');
    });
};

// Call recording upload function
protectedFunctions.openCallRecordingUpload = function(leadId) {
    console.log('🎵 Opening call recording upload for lead:', leadId);

    // Create file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.mp3,.wav,.m4a,.aac,.ogg';
    fileInput.multiple = false; // Single recording file

    fileInput.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            protectedFunctions.uploadCallRecording(leadId, file);
        }
    };

    // Trigger file selection
    fileInput.click();
};

// Upload call recording to server
protectedFunctions.uploadCallRecording = function(leadId, file) {
    console.log('🎵 Uploading call recording for lead:', leadId, 'File:', file.name);

    const formData = new FormData();
    formData.append('leadId', leadId);
    formData.append('recording', file);

    // Show upload progress
    const notification = document.createElement('div');
    notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #3b82f6; color: white; padding: 15px; border-radius: 8px; z-index: 10000; font-weight: bold;';
    notification.innerHTML = '🎵 Uploading call recording...';
    document.body.appendChild(notification);

    fetch('/api/call-recording-upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('✅ Call recording uploaded successfully');
            notification.innerHTML = '✅ Recording uploaded successfully!';
            notification.style.background = '#10b981';

            // Update lead data with recording info
            protectedFunctions.updateLeadRecording(leadId, data.recordingPath);

            // Remove notification after 3 seconds
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 3000);

            // Refresh the lead profile to show the recording
            setTimeout(() => {
                if (window.showLeadProfile) {
                    window.showLeadProfile(leadId);
                }
            }, 1000);
        } else {
            console.error('❌ Upload failed:', data.error);
            notification.innerHTML = '❌ Upload failed: ' + data.error;
            notification.style.background = '#dc3545';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 5000);
        }
    })
    .catch(error => {
        console.error('❌ Upload error:', error);
        notification.innerHTML = '❌ Upload error: ' + error.message;
        notification.style.background = '#dc3545';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 5000);
    });
};

// Update lead with recording information
protectedFunctions.updateLeadRecording = function(leadId, recordingPath) {
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const leadIndex = leads.findIndex(lead => lead.id === leadId);

    if (leadIndex !== -1) {
        leads[leadIndex].recordingPath = recordingPath;
        leads[leadIndex].hasRecording = true;
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        console.log('✅ Lead updated with recording path:', recordingPath);
    }
};

// Reach-out update function
protectedFunctions.updateReachOut = function(leadId, type, checked) {
    console.log(`🐛 DEBUG updateReachOut called: leadId=${leadId}, type=${type}, checked=${checked}`);

    // Get leads from ALL possible storage locations
    const insurance_leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const regular_leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const clients_data = JSON.parse(localStorage.getItem('clients') || '[]');
    const archived_leads = JSON.parse(localStorage.getItem('archived_leads') || '[]');

    // Ensure all data arrays are valid before spreading
    const safeInsuranceLeads = Array.isArray(insurance_leads) ? insurance_leads : [];
    const safeRegularLeads = Array.isArray(regular_leads) ? regular_leads : [];
    const safeClientsData = Array.isArray(clients_data) ? clients_data : [];
    const safeArchivedLeads = Array.isArray(archived_leads) ? archived_leads : [];

    const leads = [...safeInsuranceLeads, ...safeRegularLeads, ...safeClientsData, ...safeArchivedLeads];

    // Enhanced debugging for lead lookup
    console.log(`🔍 DEBUG: Looking for lead ID "${leadId}" (type: ${typeof leadId})`);
    console.log(`🔍 DEBUG: Total leads in storage: ${leads.length}`);
    console.log(`🔍 STORAGE BREAKDOWN: insurance: ${insurance_leads.length}, regular: ${regular_leads.length}, clients: ${clients_data.length}, archived: ${archived_leads.length}`);

    // Enhanced ID matching - remove ALL quotes and normalize
    const normalizeId = (id) => {
        let normalized = String(id);
        // Remove all types of quotes (single, double, escaped)
        normalized = normalized.replace(/['"\\]/g, '');
        // Remove extra whitespace
        normalized = normalized.trim();
        return normalized;
    };
    const targetId = normalizeId(leadId);

    console.log(`🔍 DEBUG: Normalized target ID: "${targetId}"`);
    console.log(`🔍 DEBUG: Sample stored IDs:`, leads.slice(0, 5).map(l => `"${normalizeId(l.id)}" (original: ${l.id})`));

    // Use normalized ID matching
    let leadIndex = leads.findIndex(l => normalizeId(l.id) === targetId);

    if (leadIndex === -1) {
        // Try looking up by number/integer as fallback
        leadIndex = leads.findIndex(l => l.id == leadId);
        console.log(`🔍 DEBUG: Loose comparison result: index=${leadIndex}`);
    }

    if (leadIndex === -1) {
        // Try parsing leadId as number as final fallback
        const numLeadId = parseInt(leadId);
        if (!isNaN(numLeadId)) {
            leadIndex = leads.findIndex(l => l.id === numLeadId);
            console.log(`🔍 DEBUG: Number lookup result: index=${leadIndex}`);
        }
    }

    if (leadIndex === -1) {
        console.log(`🐛 DEBUG updateReachOut - lead not found after all lookup methods`);
        console.log(`🔍 DEBUG: Available lead IDs:`, leads.slice(0, 5).map(l => `"${l.id}" (${typeof l.id})`));
        return;
    } else {
        console.log(`✅ DEBUG: Found lead at index ${leadIndex} with ID ${leads[leadIndex].id}`);
    }

    if (!leads[leadIndex].reachOut) {
        leads[leadIndex].reachOut = {
            emailCount: 0,
            textCount: 0,
            callAttempts: 0,
            callsConnected: 0,
            voicemailCount: 0
        };
    }

    if (type === 'email') {
        if (checked) {
            leads[leadIndex].reachOut.emailCount++;
        } else {
            leads[leadIndex].reachOut.emailCount = Math.max(0, leads[leadIndex].reachOut.emailCount - 1);
        }
        const emailCountDisplay = document.getElementById(`email-count-${leadId}`);
        if (emailCountDisplay) {
            emailCountDisplay.textContent = leads[leadIndex].reachOut.emailCount;
        }

        // Update TO DO display immediately after email checkbox change
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        applyReachOutStyling(leadId, true);
        console.log('🔄 Updated TO DO display after email checkbox change');
    } else if (type === 'text') {
        if (checked) {
            leads[leadIndex].reachOut.textCount++;

            // Mark reach-out as COMPLETE when text is sent (final step in sequence)
            if (leads[leadIndex].reachOut.textCount > 0) {
                const completionTime = new Date().toISOString();
                leads[leadIndex].reachOut.completedAt = completionTime;
                leads[leadIndex].reachOut.reachOutCompletedAt = completionTime;

                // CRITICAL FIX: Preserve green highlight duration when reach-out completes
                if (!leads[leadIndex].reachOut.greenHighlightUntil) {
                    // Check if there was a previously set duration to preserve
                    let durationHours = null;

                    // Try to find previously set duration
                    if (leads[leadIndex].reachOut.greenHighlightDays) {
                        durationHours = leads[leadIndex].reachOut.greenHighlightDays * 24;
                        console.log(`🔍 COMPLETION: Found greenHighlightDays = ${leads[leadIndex].reachOut.greenHighlightDays} days`);
                    } else if (leads[leadIndex].reachOut.highlightDuration) {
                        durationHours = leads[leadIndex].reachOut.highlightDuration;
                        console.log(`🔍 COMPLETION: Found highlightDuration = ${leads[leadIndex].reachOut.highlightDuration} hours`);
                    } else if (leads[leadIndex].reachOut.highlightDurationDays) {
                        durationHours = leads[leadIndex].reachOut.highlightDurationDays * 24;
                        console.log(`🔍 COMPLETION: Found highlightDurationDays = ${leads[leadIndex].reachOut.highlightDurationDays} days`);
                    } else if (leads[leadIndex].highlightDuration) {
                        durationHours = leads[leadIndex].highlightDuration;
                        console.log(`🔍 COMPLETION: Found lead-level highlightDuration = ${leads[leadIndex].highlightDuration} hours`);
                    } else {
                        // Default to 24 hours if no specific duration was set
                        durationHours = 24;
                        console.log(`🔍 COMPLETION: No duration found, defaulting to 24 hours`);
                    }

                    // Calculate greenHighlightUntil based on completion time + duration
                    const completionDate = new Date(completionTime);
                    const expirationDate = new Date(completionDate.getTime() + (durationHours * 60 * 60 * 1000));
                    leads[leadIndex].reachOut.greenHighlightUntil = expirationDate.toISOString();

                    console.log(`✅ COMPLETION: Set greenHighlightUntil = ${leads[leadIndex].reachOut.greenHighlightUntil} (${durationHours}h from completion)`);
                } else {
                    console.log(`✅ COMPLETION: Preserved existing greenHighlightUntil = ${leads[leadIndex].reachOut.greenHighlightUntil}`);
                }

                // CRITICAL FIX: Save to server immediately after setting greenHighlightUntil
                const updateData = {
                    reachOut: leads[leadIndex].reachOut
                };

                fetch(`/api/leads/${leadId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updateData)
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        console.log('✅ Text completion data with greenHighlightUntil saved to server');
                    } else {
                        console.error('❌ Server save failed for text completion:', data.error);
                    }
                })
                .catch(error => {
                    console.error('❌ Server save error for text completion:', error);
                });

                // Mark as complete with green styling
                markReachOutComplete(leadId, leads[leadIndex].reachOut.completedAt);

                showNotification('Text sent! Reach-out sequence completed.', 'success');

                // Refresh main table to remove red "Reach out" text - AGGRESSIVE APPROACH
                setTimeout(() => {
                    console.log('🔄 Text completion: Immediate localStorage update');
                    localStorage.setItem('insurance_leads', JSON.stringify(leads));

                    // Force multiple refresh methods
                    if (window.displayLeads) window.displayLeads();
                    if (window.loadLeadsView) window.loadLeadsView();
                    refreshLeadsTable();
                    console.log('✅ Text completion: Multiple table refresh methods called');
                }, 100);

                setTimeout(() => {
                    loadLeadsFromServerAndRefresh();
                    console.log('🔄 Text completion: Secondary server reload');
                }, 1500);
            }
        } else {
            leads[leadIndex].reachOut.textCount = Math.max(0, leads[leadIndex].reachOut.textCount - 1);
        }
        const textCountDisplay = document.getElementById(`text-count-${leadId}`);
        if (textCountDisplay) {
            textCountDisplay.textContent = leads[leadIndex].reachOut.textCount;
        }
    } else if (type === 'call') {
        if (checked) {
            // Show popup when call checkbox is checked
            showCallOutcomePopup(leadId);
            return; // Exit early - let popup handle everything
        } else {
            leads[leadIndex].reachOut.callAttempts = Math.max(0, leads[leadIndex].reachOut.callAttempts - 1);
        }
        const callCountDisplay = document.getElementById(`call-count-${leadId}`);
        if (callCountDisplay) {
            callCountDisplay.textContent = leads[leadIndex].reachOut.callAttempts;
        }
    }

    // Save back to the correct storage location
    const foundLead = leads[leadIndex];
    const foundInInsurance = insurance_leads.findIndex(l => String(l.id) === String(leadId));
    const foundInRegular = regular_leads.findIndex(l => String(l.id) === String(leadId));

    if (foundInInsurance !== -1) {
        // Update the insurance leads array and save
        insurance_leads[foundInInsurance] = foundLead;
        localStorage.setItem('insurance_leads', JSON.stringify(insurance_leads));
        console.log('💾 Saved lead data to insurance_leads storage');
    } else if (foundInRegular !== -1) {
        // Update the regular leads array and save
        regular_leads[foundInRegular] = foundLead;
        localStorage.setItem('leads', JSON.stringify(regular_leads));
        console.log('💾 Saved lead data to regular leads storage');
    } else {
        // Fallback - save to insurance leads
        localStorage.setItem('insurance_leads', JSON.stringify(insurance_leads.concat([foundLead])));
        console.log('💾 Fallback: Added lead to insurance_leads storage');
    }

    // Save reach-out data to server
    const updateData = {
        reachOut: leads[leadIndex].reachOut
    };

    fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('✅ Reach-out data updated on server');
        } else {
            console.error('❌ Server reach-out update failed:', data.error);
        }
    })
    .catch(error => {
        console.error('❌ Error updating reach-out data:', error);
    });

    // Update the sequential to-do display after every action
    // Check if the lead is completed first, otherwise update the sequential display
    if (!leads[leadIndex].reachOut.completedAt && !leads[leadIndex].reachOut.reachOutCompletedAt) {
        // Only update sequential display if not completed
        if (window.getActionText) {
            const actionText = window.getActionText(leads[leadIndex].stage, leads[leadIndex].reachOut);
            if (actionText === 'Reach out') {
                applyReachOutStyling(leadId, true);
            }
        }
    }
};

// Function to show call outcome popup
window.showCallOutcomePopup = function(leadId) {
    // Remove any existing popup
    const existingPopup = document.getElementById('call-outcome-popup');
    if (existingPopup) {
        existingPopup.remove();
    }
    const existingBackdrop = document.getElementById('popup-backdrop');
    if (existingBackdrop) {
        existingBackdrop.remove();
    }

    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'popup-backdrop';
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 1000001;
    `;
    document.body.appendChild(backdrop);

    // Create popup
    const popup = document.createElement('div');
    popup.id = 'call-outcome-popup';
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
        z-index: 1000002;
        min-width: 400px;
    `;

    popup.innerHTML = `
        <div style="text-align: center;">
            <h3 style="margin-top: 0;">Call Outcome</h3>
            <p style="font-size: 16px; margin: 20px 0;">Did they answer?</p>
            <div style="display: flex; gap: 10px; justify-content: center; margin-bottom: 20px;">
                <button onclick="handleCallOutcome('${leadId}', true)" style="
                    background: #10b981;
                    color: white;
                    border: none;
                    padding: 10px 30px;
                    border-radius: 5px;
                    font-size: 16px;
                    cursor: pointer;
                ">Yes</button>
                <button onclick="handleCallOutcome('${leadId}', false)" style="
                    background: #ef4444;
                    color: white;
                    border: none;
                    padding: 10px 30px;
                    border-radius: 5px;
                    font-size: 16px;
                    cursor: pointer;
                ">No</button>
            </div>
            <div id="voicemail-question" style="display: none;">
                <p style="font-size: 16px; margin: 20px 0;">Did you leave a voicemail?</p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="handleVoicemailOutcome('${leadId}', true)" style="
                        background: #f59e0b;
                        color: white;
                        border: none;
                        padding: 10px 30px;
                        border-radius: 5px;
                        font-size: 16px;
                        cursor: pointer;
                    ">Yes</button>
                    <button onclick="handleVoicemailOutcome('${leadId}', false)" style="
                        background: #6b7280;
                        color: white;
                        border: none;
                        padding: 10px 30px;
                        border-radius: 5px;
                        font-size: 16px;
                        cursor: pointer;
                    ">No</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(popup);
};

// Function to handle call outcome
window.handleCallOutcome = function(leadId, answered) {
    console.log(`🐛 DEBUG handleCallOutcome called: leadId=${leadId}, answered=${answered}`);

    let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

    if (leadIndex !== -1) {
        if (!leads[leadIndex].reachOut) {
            leads[leadIndex].reachOut = {
                emailCount: 0,
                textCount: 0,
                callAttempts: 0,
                callsConnected: 0,
                voicemailCount: 0
            };
        }

        // Always increment attempts counter
        leads[leadIndex].reachOut.callAttempts = (leads[leadIndex].reachOut.callAttempts || 0) + 1;

        // Update attempts display
        const attemptsDisplay = document.getElementById(`call-count-${leadId}`);
        if (attemptsDisplay) {
            attemptsDisplay.textContent = leads[leadIndex].reachOut.callAttempts;
        }

        if (answered) {
            // Lead answered - show call duration popup instead of completing immediately
            showCallDurationPopup(leadId);
            return; // Exit here - duration popup will handle completion
        } else {
            // Lead didn't pick up - save call attempt but DON'T mark as completed yet
            console.log(`📞 Call attempt recorded (no answer) - completion will happen only after call scheduling confirmation`);

            localStorage.setItem('insurance_leads', JSON.stringify(leads));
            saveReachOutToServer(leadId, leads[leadIndex].reachOut);

            // Calculate and update response rate based on new call data (unanswered call)
            console.log(`🎯 DEBUG handleCallOutcome - calculating response rate after unanswered call`);
            if (protectedFunctions.calculateAndUpdateResponseRate) {
                protectedFunctions.calculateAndUpdateResponseRate(leadId);
            }

            // Update checkbox to checked
            const checkbox = document.getElementById(`call-made-${leadId}`);
            if (checkbox) {
                checkbox.checked = true;
            }

            // Show voicemail question
            const voicemailQuestion = document.getElementById('voicemail-question');
            if (voicemailQuestion) {
                voicemailQuestion.style.display = 'block';
            }

            // Update the sequential to-do display - FORCE UPDATE since we know this is a reach-out stage
            applyReachOutStyling(leadId, true);
            console.log('🔄 Updated TO DO display after call attempt (no answer)');
        }
    }
};

// Function to handle voicemail outcome
window.handleVoicemailOutcome = function(leadId, leftVoicemail) {
    console.log('Voicemail outcome:', { leadId, leftVoicemail });

    let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

    if (leadIndex !== -1) {
        // Initialize callLogs array if it doesn't exist
        if (!leads[leadIndex].reachOut.callLogs) {
            leads[leadIndex].reachOut.callLogs = [];
        }

        if (leftVoicemail) {
            leads[leadIndex].reachOut.voicemailCount = (leads[leadIndex].reachOut.voicemailCount || 0) + 1;

            // Update voicemail display
            const voicemailDisplay = document.getElementById(`voicemail-count-${leadId}`);
            if (voicemailDisplay) {
                voicemailDisplay.textContent = leads[leadIndex].reachOut.voicemailCount;
            }
        }

        // Add call log entry for unanswered call
        const callLog = {
            timestamp: new Date().toISOString(),
            connected: false,
            duration: null,
            leftVoicemail: leftVoicemail,
            notes: leftVoicemail ? 'No answer - Left voicemail' : 'No answer - No voicemail left'
        };
        leads[leadIndex].reachOut.callLogs.push(callLog);

        // Save to localStorage and server
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        saveReachOutToServer(leadId, leads[leadIndex].reachOut);
    }

    // Close popup and backdrop
    const popup = document.getElementById('call-outcome-popup');
    if (popup) {
        popup.remove();
    }
    const backdrop = document.getElementById('popup-backdrop');
    if (backdrop) {
        backdrop.remove();
    }

    showNotification(leftVoicemail ? 'Voicemail recorded!' : 'Call attempt recorded!', 'success');

    // Update the sequential to-do display - FORCE UPDATE since we know this is a reach-out stage
    applyReachOutStyling(leadId, true);
    console.log('🔄 Updated TO DO display after voicemail outcome');
};

// Helper function to save reach-out data to server
function saveReachOutToServer(leadId, reachOutData) {
    const updateData = {
        reachOut: reachOutData
    };

    fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('✅ Reach-out data updated on server');
        } else {
            console.error('❌ Server reach-out update failed:', data.error);
        }
    })
    .catch(error => {
        console.error('❌ Error updating reach-out data:', error);
    });
}

// Function to show call duration popup
function showCallDurationPopup(leadId) {
    console.log(`📞 Showing call duration popup for lead: ${leadId}`);

    // Remove existing popups
    const existingPopup = document.getElementById('call-outcome-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

    // Create new popup for duration
    const popup = document.createElement('div');
    popup.id = 'call-duration-popup';
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
        z-index: 1000002;
        min-width: 400px;
    `;

    popup.innerHTML = `
        <div style="text-align: center;">
            <h3 style="margin-top: 0;">Call Duration</h3>
            <p style="font-size: 16px; margin: 20px 0;">How long was the call?</p>
            <div style="margin: 20px 0;">
                <input type="number" id="duration-minutes" placeholder="0" min="0" max="999"
                       style="width: 80px; padding: 10px; border: 2px solid #e5e7eb; border-radius: 5px; font-size: 16px; text-align: center;">
                <span style="font-size: 16px; margin-left: 10px;">minutes</span>
            </div>
            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
                <button onclick="handleCallDuration('${leadId}', document.getElementById('duration-minutes').value)" style="
                    background: #10b981;
                    color: white;
                    border: none;
                    padding: 10px 30px;
                    border-radius: 5px;
                    font-size: 16px;
                    cursor: pointer;
                ">Save</button>
                <button onclick="cancelCallDuration('${leadId}')" style="
                    background: #6b7280;
                    color: white;
                    border: none;
                    padding: 10px 30px;
                    border-radius: 5px;
                    font-size: 16px;
                    cursor: pointer;
                ">Cancel</button>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    // Focus on input field
    setTimeout(() => {
        const input = document.getElementById('duration-minutes');
        if (input) {
            input.focus();
        }
    }, 100);
}

// Function to handle call duration submission
window.handleCallDuration = function(leadId, duration) {
    console.log(`📞 Handling call duration for lead ${leadId}: ${duration} minutes`);

    const durationNum = parseInt(duration) || 0;

    let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

    if (leadIndex !== -1) {
        if (!leads[leadIndex].reachOut) {
            leads[leadIndex].reachOut = {
                emailCount: 0,
                textCount: 0,
                callAttempts: 0,
                callsConnected: 0,
                voicemailCount: 0,
                callLogs: []
            };
        }

        // Initialize callLogs array if it doesn't exist
        if (!leads[leadIndex].reachOut.callLogs) {
            leads[leadIndex].reachOut.callLogs = [];
        }

        // Increment connected counter
        leads[leadIndex].reachOut.callsConnected = (leads[leadIndex].reachOut.callsConnected || 0) + 1;
        leads[leadIndex].reachOut.callAttempts = (leads[leadIndex].reachOut.callAttempts || 0) + 1;

        // Calculate and update response rate based on new call data
        console.log(`🎯 DEBUG showCallDurationPopup - calculating response rate after connected call`);
        if (protectedFunctions.calculateAndUpdateResponseRate) {
            protectedFunctions.calculateAndUpdateResponseRate(leadId);
        }

        // CALCULATE TOTAL MINUTES BEFORE ADDING NEW CALL (for high value upgrade detection)
        let totalMinutesBefore = 0;
        if (leads[leadIndex].reachOut.callLogs && Array.isArray(leads[leadIndex].reachOut.callLogs)) {
            leads[leadIndex].reachOut.callLogs.forEach(log => {
                if (log.duration) {
                    if (log.duration === '< 1 min') {
                        totalMinutesBefore += 0.5;
                    } else if (log.duration.includes('min')) {
                        const match = log.duration.match(/(\d+(?:\.\d+)?)\s*min/);
                        if (match) {
                            totalMinutesBefore += parseFloat(match[1]);
                        }
                    }
                }
            });
        }

        // Add call log entry
        const callLog = {
            timestamp: new Date().toISOString(),
            connected: true,
            duration: durationNum > 0 ? `${durationNum} min` : '< 1 min',
            leftVoicemail: false,
            notes: `Call connected - Duration: ${durationNum > 0 ? durationNum + ' minutes' : 'less than 1 minute'}`
        };
        leads[leadIndex].reachOut.callLogs.push(callLog);

        // CALCULATE TOTAL MINUTES AFTER ADDING NEW CALL (for high value upgrade detection)
        const totalMinutesAfter = totalMinutesBefore + durationNum;

        // CHECK FOR HIGH VALUE LEAD UPGRADE (60+ minutes threshold)
        if (totalMinutesBefore < 60 && totalMinutesAfter >= 60) {
            console.log(`🏆 HIGH VALUE LEAD UPGRADE: ${leads[leadIndex].name} just became a high value lead!`);
            console.log(`📊 Total talk time: ${totalMinutesBefore.toFixed(1)} min → ${totalMinutesAfter.toFixed(1)} min (crossed 60+ threshold)`);

            // Show popup notification for the upgrade
            setTimeout(() => {
                alert(`🏆 HIGH VALUE LEAD UPGRADE!\n\n${leads[leadIndex].name} just became a high value lead with ${totalMinutesAfter.toFixed(1)} minutes of total talk time!`);
            }, 1000);

            // Add to counter system as high value lead
            if (window.incrementHighValueLeadCounter && leads[leadIndex].assignedTo) {
                window.incrementHighValueLeadCounter(leads[leadIndex].assignedTo);

                // Force immediate UI refresh for high value lead upgrade
                setTimeout(() => {
                    if (window.showSimpleCounter) {
                        const modal = document.querySelector('.simple-counter-modal');
                        if (modal && modal.style.display !== 'none') {
                            console.log('🔄 FORCE-REFRESH: Updating modal after high value lead upgrade');
                            window.showSimpleCounter(leads[leadIndex].assignedTo);
                        }
                    }
                }, 500);
            }
        }

        // Track connected call in live stats
        if (window.liveStatsTracker && leads[leadIndex].assignedTo) {
            const duration = parseFloat(durationNum || 0);
            window.liveStatsTracker.addConnectedCall(leads[leadIndex].assignedTo, duration);
        }

        // INTEGRATE WITH COUNTER SYSTEM - Add call count and duration to all containers
        if (leads[leadIndex].assignedTo && window.incrementCallCounter) {
            console.log(`🔢 VICIDIAL INTEGRATION: Adding call for ${leads[leadIndex].assignedTo} with ${durationNum} min duration`);

            // Increment call counter (this adds to all containers simultaneously)
            window.incrementCallCounter(leads[leadIndex].assignedTo);

            // Add duration to all separate containers
            if (window.addCallDurationToAllContainers) {
                window.addCallDurationToAllContainers(leads[leadIndex].assignedTo, durationNum);
            } else {
                console.log(`📞 Adding ${durationNum} min duration to counter system for ${leads[leadIndex].assignedTo}`);
                // Manually add duration if function doesn't exist yet
                const counterData = JSON.parse(localStorage.getItem('trueIncrementalCounters') || '{}');
                if (counterData.agents && counterData.agents[leads[leadIndex].assignedTo]) {
                    const agent = counterData.agents[leads[leadIndex].assignedTo];
                    // Add to all containers simultaneously
                    agent.totalCallDuration = (agent.totalCallDuration || 0) + durationNum;
                    if (agent.todayCounters) {
                        agent.todayCounters.totalCallDuration = (agent.todayCounters.totalCallDuration || 0) + durationNum;
                        agent.weekCounters.totalCallDuration = (agent.weekCounters.totalCallDuration || 0) + durationNum;
                        agent.monthCounters.totalCallDuration = (agent.monthCounters.totalCallDuration || 0) + durationNum;
                        agent.ytdCounters.totalCallDuration = (agent.ytdCounters.totalCallDuration || 0) + durationNum;
                        agent.customCounters.totalCallDuration = (agent.customCounters.totalCallDuration || 0) + durationNum;
                    }
                    localStorage.setItem('trueIncrementalCounters', JSON.stringify(counterData));
                    console.log(`✅ Added ${durationNum} min duration to all containers for ${leads[leadIndex].assignedTo}`);
                }
            }
        }

        // Mark reach-out as COMPLETE
        const completionTime = new Date().toISOString();
        leads[leadIndex].reachOut.completedAt = completionTime;
        leads[leadIndex].reachOut.reachOutCompletedAt = completionTime;

        // CRITICAL FIX: Preserve green highlight duration when connected call completes reach-out
        if (!leads[leadIndex].reachOut.greenHighlightUntil) {
            // Check if there was a previously set duration to preserve
            let durationHours = null;

            // Try to find previously set duration
            if (leads[leadIndex].reachOut.greenHighlightDays) {
                durationHours = leads[leadIndex].reachOut.greenHighlightDays * 24;
                console.log(`🔍 CALL COMPLETION: Found greenHighlightDays = ${leads[leadIndex].reachOut.greenHighlightDays} days`);
            } else if (leads[leadIndex].reachOut.highlightDuration) {
                durationHours = leads[leadIndex].reachOut.highlightDuration;
                console.log(`🔍 CALL COMPLETION: Found highlightDuration = ${leads[leadIndex].reachOut.highlightDuration} hours`);
            } else if (leads[leadIndex].reachOut.highlightDurationDays) {
                durationHours = leads[leadIndex].reachOut.highlightDurationDays * 24;
                console.log(`🔍 CALL COMPLETION: Found highlightDurationDays = ${leads[leadIndex].reachOut.highlightDurationDays} days`);
            } else if (leads[leadIndex].highlightDuration) {
                durationHours = leads[leadIndex].highlightDuration;
                console.log(`🔍 CALL COMPLETION: Found lead-level highlightDuration = ${leads[leadIndex].highlightDuration} hours`);
            } else {
                // Default to 24 hours if no specific duration was set
                durationHours = 24;
                console.log(`🔍 CALL COMPLETION: No duration found, defaulting to 24 hours`);
            }

            // Calculate greenHighlightUntil based on completion time + duration
            const completionDate = new Date(completionTime);
            const expirationDate = new Date(completionDate.getTime() + (durationHours * 60 * 60 * 1000));
            leads[leadIndex].reachOut.greenHighlightUntil = expirationDate.toISOString();

            console.log(`✅ CALL COMPLETION: Set greenHighlightUntil = ${leads[leadIndex].reachOut.greenHighlightUntil} (${durationHours}h from completion)`);
        } else {
            console.log(`✅ CALL COMPLETION: Preserved existing greenHighlightUntil = ${leads[leadIndex].reachOut.greenHighlightUntil}`);
        }

        // Update connected display
        const connectedDisplay = document.getElementById(`call-connected-${leadId}`);
        if (connectedDisplay) {
            connectedDisplay.textContent = leads[leadIndex].reachOut.callsConnected;
        }

        // Close popup and backdrop
        const popup = document.getElementById('call-duration-popup');
        if (popup) {
            popup.remove();
        }
        const backdrop = document.getElementById('popup-backdrop');
        if (backdrop) {
            backdrop.remove();
        }

        // Update checkbox to checked and set called property
        const checkbox = document.getElementById(`call-made-${leadId}`);
        if (checkbox) {
            checkbox.checked = true;
        }

        // Set called property for reachout logic
        leads[leadIndex].reachOut.called = true;

        // Save to localStorage
        localStorage.setItem('insurance_leads', JSON.stringify(leads));

        // Save to server
        const updateData = {
            reachOut: leads[leadIndex].reachOut
        };

        fetch(`/api/leads/${leadId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('✅ Call completion data saved to server');
                setTimeout(() => {
                    loadLeadsFromServerAndRefresh();
                    console.log('🔄 Table refreshed after call completion');
                }, 300);
            } else {
                console.error('❌ Server completion update failed:', data.error);
            }
        })
        .catch(error => {
            console.error('❌ Error saving completion data:', error);
        });

        // Mark reach-out as COMPLETE with green styling
        markReachOutComplete(leadId, leads[leadIndex].reachOut.completedAt);

        // Show green highlight duration popup
        showGreenHighlightDurationPopup(leadId);

        showNotification(`Call connected (${durationNum > 0 ? durationNum + ' min' : '< 1 min'})! Reach-out completed.`, 'success');

        // Refresh the leads table
        setTimeout(() => {
            console.log('🔄 Updating localStorage for immediate effect');
            localStorage.setItem('insurance_leads', JSON.stringify(leads));

            if (window.displayLeads) {
                window.displayLeads();
            }
            if (window.loadLeadsView) {
                window.loadLeadsView();
            }
            refreshLeadsTable();
            console.log('✅ Table refresh completed');
        }, 100);
    }
};

// Function to cancel call duration input
window.cancelCallDuration = function(leadId) {
    console.log('📞 Canceling call duration for lead:', leadId);

    // Close popup and backdrop
    const popup = document.getElementById('call-duration-popup');
    if (popup) {
        popup.remove();
    }
    const backdrop = document.getElementById('popup-backdrop');
    if (backdrop) {
        backdrop.remove();
    }

    // Uncheck the call checkbox since user canceled
    const checkbox = document.getElementById(`call-made-${leadId}`);
    if (checkbox) {
        checkbox.checked = false;
    }

    showNotification('Call duration canceled', 'info');
};

// Function to apply styling to reach-out section based on lead's to-do requirements
function applyReachOutStyling(leadId, hasReachOutTodo) {
    // Update the TO DO message in the header
    const todoDiv = document.getElementById(`reach-out-todo-${leadId}`);
    const headerTitle = document.getElementById(`reach-out-header-title-${leadId}`);
    const separator = document.getElementById(`reach-out-separator-${leadId}`);
    const completionDiv = document.getElementById(`reach-out-completion-${leadId}`);

    if (todoDiv) {
        const lead = JSON.parse(localStorage.getItem('insurance_leads') || '[]').find(l => String(l.id) === String(leadId));
        if (lead) {
            // Initialize reachOut if it doesn't exist
            if (!lead.reachOut) {
                lead.reachOut = {
                    emailCount: 0,
                    textCount: 0,
                    callAttempts: 0,
                    callsConnected: 0,
                    voicemailCount: 0
                };
            }

            // Check completion only if stage requires reach-out
            if (hasReachOutTodo) {
                // First check if reach-out is already completed - MUST verify actual completion actions
                let isCompleted = false;
                // NEW LOGIC: Consider call attempts OR email confirmation as completion
                const hasActuallyCompleted = (lead.reachOut.callAttempts > 0) ||
                                           (lead.reachOut.emailConfirmed === true) ||
                                           (lead.reachOut.textCount > 0) ||
                                           (lead.reachOut.callsConnected > 0);

                console.log(`🔍 DEBUG Lead ${lead.id}: callAttempts=${lead.reachOut.callAttempts}, emailConfirmed=${lead.reachOut.emailConfirmed}, textCount=${lead.reachOut.textCount}, callsConnected=${lead.reachOut.callsConnected}`);
                console.log(`🔍 DEBUG Lead ${lead.id}: hasActuallyCompleted=${hasActuallyCompleted}`);

                // Clean up orphaned completion timestamps (timestamps without actual completion)
                if ((lead.reachOut.completedAt || lead.reachOut.reachOutCompletedAt) && !hasActuallyCompleted) {
                    console.log(`🧹 CLEANING UP ORPHANED TIMESTAMPS: Lead ${leadId} has completion timestamp but no actual completion (connected: ${lead.reachOut.callsConnected}, texts: ${lead.reachOut.textCount})`);

                    // Remove orphaned timestamps
                    delete lead.reachOut.completedAt;
                    delete lead.reachOut.reachOutCompletedAt;

                    // Save the updated lead data
                    if (window.updateLeadInStorage) {
                        window.updateLeadInStorage(lead);
                    }

                    // Mark as not completed
                    isCompleted = false;
                }
                // ENHANCEMENT: Check if highlight has expired (from auto-expiration cleanup)
                else if (lead.reachOut.highlightExpired) {
                    console.log(`🔴 PROFILE DISPLAY - GREEN HIGHLIGHT EXPIRED: Lead ${leadId} - ${lead.name}, expired at ${lead.reachOut.expiredAt}`);
                    isCompleted = false;
                } else if ((lead.reachOut.completedAt || lead.reachOut.reachOutCompletedAt) && hasActuallyCompleted) {
                    const completedTime = lead.reachOut.completedAt || lead.reachOut.reachOutCompletedAt;

                    // NEW: Check if reach-out has expired (older than 2 days) - SAME LOGIC AS getNextAction
                    if (lead.reachOut.reachOutCompletedAt) {
                        const completedDateTime = new Date(lead.reachOut.reachOutCompletedAt);
                        const currentTime = new Date();
                        const timeDifferenceMs = currentTime.getTime() - completedDateTime.getTime();
                        const timeDifferenceDays = timeDifferenceMs / (1000 * 60 * 60 * 24);

                        // If more than 2 days have passed, reach out has EXPIRED - reset and show as incomplete
                        if (timeDifferenceDays > 2) {
                            console.log(`🔄 PROFILE DISPLAY - REACH OUT EXPIRED: Lead ${leadId} - ${lead.name}, completed ${timeDifferenceDays.toFixed(1)} days ago`);

                            // Reset reach out completion status to trigger new reach out (same as getNextAction)
                            lead.reachOut.callsConnected = 0;
                            lead.reachOut.textCount = 0;
                            lead.reachOut.emailSent = false;
                            lead.reachOut.textSent = false;
                            lead.reachOut.callMade = false;
                            delete lead.reachOut.reachOutCompletedAt;

                            // Save the updated lead data
                            if (window.updateLeadInStorage) {
                                window.updateLeadInStorage(lead);
                            }

                            // Mark as not completed - will show red TO DO styling
                            isCompleted = false;
                        } else {
                            // COMPLETED REACH-OUT and NOT EXPIRED - Show green completion status
                            markReachOutComplete(leadId, completedTime);
                            isCompleted = true;
                        }
                    } else {
                        // COMPLETED REACH-OUT but no expiry timestamp to check - Show green completion status
                        markReachOutComplete(leadId, completedTime);
                        isCompleted = true;
                    }
                }

                // If not completed (either never completed or expired), show red incomplete styling
                if (!isCompleted) {
                // STAGE REQUIRES REACH-OUT AND NOT COMPLETED - Show red styling
                todoDiv.style.display = 'block'; // Show TO DO text

                // Show TO DO or COMPLETE based on call attempts, email confirmation, texts, or connected calls
                let nextAction = '';
                const hasActuallyCompleted = (lead.reachOut.callAttempts > 0) ||
                                           (lead.reachOut.emailConfirmed === true) ||
                                           (lead.reachOut.textCount > 0) ||
                                           (lead.reachOut.callsConnected > 0);

                if (!hasActuallyCompleted) {
                    nextAction = 'TO DO: Call';
                } else {
                    nextAction = 'REACH OUT COMPLETE';
                }

                // Show red to-do message for active reach-out requirements
                todoDiv.innerHTML = `<span style="color: #dc2626; font-weight: bold; font-size: 18px;">${nextAction}</span>`;

                // Change header to red
                if (headerTitle) {
                    headerTitle.innerHTML = '<i class="fas fa-tasks"></i> <span style="color: #dc2626;">Reach Out</span>';
                }

                // Change separator line to orange
                if (separator) {
                    separator.style.borderBottom = '2px solid #f59e0b';
                }

                // Hide completion timestamp if not completed
                if (completionDiv) {
                    completionDiv.style.display = 'none';
                }

                // CRITICAL FIX: Remove green highlight from main table row when TO DO text is added
                console.log(`🔴 REMOVING GREEN HIGHLIGHT: Lead ${leadId} now has TO DO text - removing green highlight from table row`);
                removeGreenHighlightFromTableRow(leadId);
                }
            } else {
                // STAGE DOESN'T REQUIRE REACH-OUT AND NOT COMPLETED - Show neutral black styling
                todoDiv.style.display = 'none'; // Hide TO DO text completely

                // Change header to neutral black
                if (headerTitle) {
                    headerTitle.innerHTML = '<i class="fas fa-tasks"></i> <span style="color: #374151;">Reach Out</span>';
                }

                // Change separator line to neutral black
                if (separator) {
                    separator.style.borderBottom = '2px solid #374151';
                }

                // Hide completion timestamp
                if (completionDiv) {
                    completionDiv.style.display = 'none';
                }
            }
            console.log(`✅ Applied reach-out styling for lead ${leadId}, hasReachOutTodo: ${hasReachOutTodo}, completed: ${!!(lead.reachOut.completedAt || lead.reachOut.reachOutCompletedAt)}`);
        }
    }
}

// Function to remove green highlight from table row when TO DO text is added
function removeGreenHighlightFromTableRow(leadId) {
    console.log(`🔍 Searching for table row with lead ID: ${leadId}`);

    // Find the table row by data-lead-id attribute
    const tableRow = document.querySelector(`tr[data-lead-id="${leadId}"]`);

    if (!tableRow) {
        console.log(`❌ No table row found for lead ID: ${leadId}`);
        return;
    }

    console.log(`✅ Found table row for lead ${leadId}, removing green highlight...`);

    // Remove all green highlighting classes
    tableRow.classList.remove('reach-out-complete', 'force-green-highlight');

    // Remove inline green background styles
    if (tableRow.style.backgroundColor.includes('16, 185, 129') ||
        tableRow.style.backgroundColor.includes('rgb(16, 185, 129)') ||
        tableRow.style.backgroundColor.includes('rgba(16, 185, 129')) {

        tableRow.style.removeProperty('background-color');
        tableRow.style.removeProperty('background');
        tableRow.style.removeProperty('border-left');
        tableRow.style.removeProperty('border-right');

        // Also clear the entire style attribute if it only contained green highlighting
        const remainingStyle = tableRow.getAttribute('style');
        if (!remainingStyle || remainingStyle.trim() === '') {
            tableRow.removeAttribute('style');
        }

        console.log(`🔴 Removed green highlighting from lead ${leadId} table row`);
    } else {
        console.log(`ℹ️ Lead ${leadId} table row had no green highlighting to remove`);
    }
}

// Function to mark reach-out as complete
function markReachOutComplete(leadId, completedAt) {
    // Update the TO DO text to show COMPLETED
    const todoDiv = document.getElementById(`reach-out-todo-${leadId}`);
    if (todoDiv) {
        todoDiv.innerHTML = `<span style="color: #10b981; font-weight: bold; font-size: 18px;">COMPLETED</span>`;
    }

    // Change "Reach Out" title to green
    const headerTitle = document.getElementById(`reach-out-header-title-${leadId}`);
    if (headerTitle) {
        headerTitle.innerHTML = '<i class="fas fa-tasks"></i> <span style="color: #10b981;">Reach Out</span>';
    }

    // Change separator line to green
    const separator = document.getElementById(`reach-out-separator-${leadId}`);
    if (separator) {
        separator.style.borderBottom = '2px solid #10b981';
    }

    // Show completion timestamp
    const completionDiv = document.getElementById(`reach-out-completion-${leadId}`);
    const timestampSpan = document.getElementById(`completion-timestamp-${leadId}`);

    if (completionDiv && timestampSpan) {
        const completedDate = new Date(completedAt);
        timestampSpan.textContent = completedDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        completionDiv.style.display = 'block';
    }

    console.log(`✅ Marked reach-out as complete for lead ${leadId} at ${completedAt}`);

    // Complete any existing callbacks for this lead since the call was successful
    console.log('✅ CALLBACK COMPLETION: Completing callbacks after successful reach-out for lead', leadId);
    if (typeof window.completeCallback === 'function') {
        window.completeCallback(leadId, true);
    } else {
        console.log('⚠️  CALLBACK COMPLETION: completeCallback function not available');
    }

    // Show next callback scheduling popup
    console.log('📞 NEXT CALLBACK: About to show popup for completed call, leadId:', leadId);
    setTimeout(() => {
        console.log('📞 NEXT CALLBACK: Timeout triggered, calling showNextCallbackPopup');
        if (typeof showNextCallbackPopup === 'function') {
            showNextCallbackPopup(leadId);
        } else {
            console.error('❌ NEXT CALLBACK: showNextCallbackPopup function not found!');
        }
    }, 1000);
}

// Function to show call logs for a lead
protectedFunctions.showCallLogs = function(leadId) {
    console.log(`📞 Showing call logs for lead: ${leadId}`);

    // DEBUG: Check what's actually in localStorage
    console.log(`🔍 LOCALSTORAGE KEYS:`, Object.keys(localStorage).filter(k => k.toLowerCase().includes('lead')));
    console.log(`🔍 ALL LOCALSTORAGE KEYS:`, Object.keys(localStorage).slice(0, 10));

    // Get the lead data from ALL possible storage locations
    const insurance_leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const regular_leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const clients_data = JSON.parse(localStorage.getItem('clients') || '[]');
    const archived_leads = JSON.parse(localStorage.getItem('archived_leads') || '[]');

    // Ensure all data arrays are valid before accessing length or spreading
    const safeInsuranceLeads = Array.isArray(insurance_leads) ? insurance_leads : [];
    const safeRegularLeads = Array.isArray(regular_leads) ? regular_leads : [];
    const safeClientsData = Array.isArray(clients_data) ? clients_data : [];
    const safeArchivedLeads = Array.isArray(archived_leads) ? archived_leads : [];

    console.log(`🔍 STORAGE DEBUG: insurance_leads: ${safeInsuranceLeads.length}, regular_leads: ${safeRegularLeads.length}, clients: ${safeClientsData.length}, archived: ${safeArchivedLeads.length}`);

    const allLeads = [...safeInsuranceLeads, ...safeRegularLeads, ...safeClientsData, ...safeArchivedLeads];
    console.log(`🔍 COMBINED STORAGE: Total ${allLeads.length} leads`);
    console.log(`🔍 LEAD IDS in combined storage:`, allLeads.slice(0, 10).map(l => `"${l.id}"`));

    // Enhanced ID matching - remove ALL quotes and normalize
    const normalizeId = (id) => {
        let normalized = String(id);
        // Remove all types of quotes (single, double, escaped)
        normalized = normalized.replace(/['"\\]/g, '');
        // Remove extra whitespace
        normalized = normalized.trim();
        return normalized;
    };
    const targetId = normalizeId(leadId);

    console.log(`🔍 NORMALIZED TARGET ID: "${targetId}"`);
    console.log(`🔍 SAMPLE STORED IDS:`, allLeads.slice(0, 5).map(l => `"${normalizeId(l.id)}" (original: ${l.id})`));

    let lead = allLeads.find(l => normalizeId(l.id) === targetId);
    console.log(`🔍 LOOKUP RESULT: Looking for "${targetId}", found:`, lead ? `${lead.name} (${lead.id})` : 'NOT FOUND');

    // If not found in localStorage, try to fetch from server
    if (!lead) {
        console.log(`🌐 Lead not found in localStorage, attempting server fetch for ${leadId}...`);

        // Try to fetch from the API
        fetch(`/api/leads/${leadId}`)
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error(`HTTP ${response.status}`);
            })
            .then(data => {
                console.log(`✅ Server fetch successful for lead ${leadId}:`, data.name);
                // Recreate the modal with server data
                protectedFunctions.showCallLogsWithData(data);
            })
            .catch(error => {
                console.log(`❌ Server fetch failed for lead ${leadId}:`, error.message);
                alert(`Lead not found in local storage or server! ID: ${leadId}`);
            });
        return; // Exit early, server fetch will handle the modal
    }

    // Create modal for call logs
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000003;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 12px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    `;

    // Get call logs from reachOut data
    const callLogs = lead.reachOut?.callLogs || [];
    const callAttempts = lead.reachOut?.callAttempts || 0;
    const callsConnected = lead.reachOut?.callsConnected || 0;
    const voicemailCount = lead.reachOut?.voicemailCount || 0;

    modalContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px;">
            <h2 style="margin: 0; color: #1f2937;"><i class="fas fa-phone-alt"></i> Call Logs - ${lead.name || 'Unknown'}</h2>
            <button onclick="this.closest('.call-logs-modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">&times;</button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
            <div style="text-align: center; background: #f3f4f6; padding: 15px; border-radius: 8px;">
                <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${callAttempts}</div>
                <div style="font-size: 14px; color: #6b7280;">Total Attempts</div>
            </div>
            <div style="text-align: center; background: #f3f4f6; padding: 15px; border-radius: 8px;">
                <div style="font-size: 24px; font-weight: bold; color: #10b981;">${callsConnected}</div>
                <div style="font-size: 14px; color: #6b7280;">Connected</div>
            </div>
            <div style="text-align: center; background: #f3f4f6; padding: 15px; border-radius: 8px;">
                <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${voicemailCount}</div>
                <div style="font-size: 14px; color: #6b7280;">Voicemails</div>
            </div>
            <div style="text-align: center; background: #f3f4f6; padding: 15px; border-radius: 8px;">
                <div style="font-size: 24px; font-weight: bold; color: #8b5cf6;" id="avg-duration-display">0:00</div>
                <div style="font-size: 14px; color: #6b7280;">Avg Duration</div>
            </div>
        </div>

        <div style="margin-bottom: 20px;">
            <h3 style="color: #1f2937; margin-bottom: 10px;">Recent Call History</h3>
            <div style="max-height: 300px; overflow-y: auto;">
                ${callLogs.length > 0 ?
                    callLogs.slice().reverse().map(log => `
                        <div style="background: #f9fafb; padding: 12px; border-radius: 6px; margin-bottom: 8px; border-left: 4px solid ${log.connected ? '#10b981' : '#ef4444'};">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <strong style="color: ${log.connected ? '#10b981' : '#ef4444'};">
                                        ${log.connected ? '✓ Connected' : '✗ No Answer'}
                                    </strong>
                                    ${log.duration ? ` - ${log.duration}` : ''}
                                    ${log.leftVoicemail ? ' (Voicemail left)' : ''}
                                </div>
                                <div style="color: #6b7280; font-size: 12px;">
                                    ${new Date(log.timestamp || Date.now()).toLocaleDateString()}
                                    ${new Date(log.timestamp || Date.now()).toLocaleTimeString()}
                                </div>
                            </div>
                            ${log.notes ? `<div style="margin-top: 5px; color: #4b5563; font-size: 14px;">${log.notes}</div>` : ''}
                        </div>
                    `).join('')
                : '<div style="text-align: center; color: #6b7280; padding: 40px;">No call history available</div>'}
            </div>
        </div>

        <div style="text-align: right; border-top: 2px solid #e5e7eb; padding-top: 15px;">
            <button onclick="this.closest('.call-logs-modal').remove()" style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                Close
            </button>
        </div>
    `;

    modal.className = 'call-logs-modal';
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Calculate and set average duration
    let totalMinutes = 0;
    let connectedCalls = 0;
    callLogs.forEach(log => {
        if (log.connected && log.duration) {
            if (log.duration === '< 1 min') {
                totalMinutes += 0.5;
                connectedCalls++;
            } else {
                const match = log.duration.match(/(\d+)\s*min/);
                if (match) {
                    totalMinutes += parseInt(match[1]);
                    connectedCalls++;
                }
            }
        }
    });

    const avgDisplay = document.getElementById('avg-duration-display');
    if (avgDisplay) {
        if (connectedCalls === 0) {
            avgDisplay.textContent = '0:00';
        } else {
            const avgMinutes = totalMinutes / connectedCalls;
            const minutes = Math.floor(avgMinutes);
            const seconds = Math.round((avgMinutes - minutes) * 60);
            avgDisplay.textContent = minutes + ':' + seconds.toString().padStart(2, '0');
        }
    }

    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
};

// Helper function to show call logs with lead data (used by server fetch)
protectedFunctions.showCallLogsWithData = function(lead) {
    console.log(`📞 Showing call logs with server data for: ${lead.name || 'Unknown'}`);

    // Create modal for call logs (simplified version for server data)
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    `;

    const callLogs = lead.reachOut?.callLogs || [];

    modal.innerHTML = `
        <div style="background: white; border-radius: 8px; width: 90%; max-width: 600px; max-height: 80%; overflow-y: auto; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
            <div style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; color: #1f2937;"><i class="fas fa-phone-alt"></i> Call Logs - ${lead.name || 'Unknown'} (Server Data)</h2>
                    <button onclick="this.closest('.call-logs-modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">&times;</button>
                </div>
            </div>
            <div style="padding: 20px;">
                ${callLogs.length > 0 ? `
                    <div style="space-y: 12px;">
                        ${callLogs.map(log => `
                            <div style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; margin-bottom: 12px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                    <span style="font-weight: 600; color: ${log.connected ? '#10b981' : '#f59e0b'};">
                                        ${log.connected ? '✅ Connected' : '📞 Attempted'}
                                    </span>
                                    <span style="color: #6b7280; font-size: 14px;">
                                        ${log.timestamp ? new Date(log.timestamp).toLocaleString() : 'No timestamp'}
                                    </span>
                                </div>
                                <div style="color: #374151; margin-bottom: 4px;">
                                    <strong>Duration:</strong> ${log.duration || 'Not recorded'}
                                </div>
                                ${log.leftVoicemail ? '<div style="color: #f59e0b; font-size: 14px;">📧 Left Voicemail</div>' : ''}
                                ${log.notes ? `<div style="color: #6b7280; font-size: 14px; font-style: italic;">${log.notes}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div style="text-align: center; color: #6b7280; padding: 40px;">
                        <i class="fas fa-phone-alt" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                        <p style="margin: 0; font-size: 18px;">No call logs available for this lead</p>
                    </div>
                `}
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="this.closest('.call-logs-modal').remove()" style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;

    modal.className = 'call-logs-modal';
    document.body.appendChild(modal);
};

// Function to show call status modal
protectedFunctions.showCallStatus = function(leadId) {
    console.log(`🟢 Showing highlight duration for lead: ${leadId}`);

    // CRITICAL FIX: Always fetch fresh data from server first to ensure we have the latest greenHighlightUntil
    console.log(`🌐 Fetching fresh lead data from server for ${leadId}...`);

    fetch(`/api/leads/${leadId}`)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error(`HTTP ${response.status}`);
        })
        .then(serverLead => {
            console.log(`✅ Server fetch successful for lead ${leadId}:`, serverLead.name);
            console.log(`🔍 Server greenHighlightUntil:`, serverLead.reachOut?.greenHighlightUntil);
            console.log(`🔍 Server greenHighlightDays:`, serverLead.reachOut?.greenHighlightDays);

            // CRITICAL: Check current localStorage state first to see if lead still qualifies for green highlighting
            const currentLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            const currentLead = currentLeads.find(l => String(l.id) === String(leadId));

            if (currentLead) {
                console.log(`🔍 Checking current lead state for green highlight eligibility...`);

                // CRITICAL FIX: Check highlight status independently without using getNextAction (avoid circular dependency)
                let shouldShowGreenHighlight = false;

                // Check if lead has active green highlight based on actual highlight data
                if (currentLead.reachOut &&
                    (currentLead.reachOut.completedAt || currentLead.reachOut.reachOutCompletedAt)) {

                    // Check if highlight duration is still active
                    let highlightExpiry = null;

                    if (serverLead.reachOut?.greenHighlightUntil) {
                        highlightExpiry = new Date(serverLead.reachOut.greenHighlightUntil);
                    } else if (currentLead.reachOut.greenHighlightUntil) {
                        highlightExpiry = new Date(currentLead.reachOut.greenHighlightUntil);
                    }

                    if (highlightExpiry) {
                        const now = new Date();
                        shouldShowGreenHighlight = now < highlightExpiry;
                        console.log(`🔍 Highlight expiry: ${highlightExpiry}, Now: ${now}, Should show green: ${shouldShowGreenHighlight}`);
                    } else {
                        console.log(`🔍 No highlight expiry found - no green highlight`);
                        shouldShowGreenHighlight = false;
                    }
                } else {
                    console.log(`🔍 No reach-out completion found - no green highlight`);
                    shouldShowGreenHighlight = false;
                }

                console.log(`🔍 INDEPENDENT CHECK: Stage: ${currentLead.stage}, Should show green: ${shouldShowGreenHighlight}`);

                // If lead no longer qualifies for green highlighting, show "no highlight" message
                if (!shouldShowGreenHighlight) {
                    console.log(`❌ Lead ${leadId} no longer qualifies for green highlighting - showing no highlight status`);
                    protectedFunctions.showNoHighlightStatus(currentLead);
                    return;
                }
            }

            // Update localStorage with fresh server data
            const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));
            if (leadIndex !== -1) {
                leads[leadIndex] = serverLead;
                localStorage.setItem('insurance_leads', JSON.stringify(leads));
                console.log(`✅ Updated localStorage with fresh server data for lead ${leadId}`);
            }

            // Use the fresh server data and continue with the original logic
            protectedFunctions.showCallStatusWithFreshData(serverLead);
        })
        .catch(error => {
            console.log(`❌ Server fetch failed for lead ${leadId}:`, error.message);
            console.log(`🔄 Falling back to localStorage data...`);

            // Fallback to original localStorage logic
            protectedFunctions.showCallStatusOriginal(leadId);
        });
};

// Renamed original function for fallback
protectedFunctions.showCallStatusOriginal = function(leadId) {
    console.log(`📂 Using original localStorage logic for lead: ${leadId}`);

    // Force multiple localStorage reads to ensure we get the most recent data
    let insurance_leads, regular_leads;
    let retryCount = 0;
    do {
        insurance_leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        regular_leads = JSON.parse(localStorage.getItem('leads') || '[]');
        retryCount++;
    } while (retryCount < 3); // Try up to 3 times to ensure data consistency

    console.log(`🔄 FORCED REFRESH: Read localStorage ${retryCount} times to ensure consistency`);
    const clients_data = JSON.parse(localStorage.getItem('clients') || '[]');
    const archived_leads = JSON.parse(localStorage.getItem('archived_leads') || '[]');

    console.log(`🔍 STORAGE DEBUG: insurance_leads: ${insurance_leads.length}, regular_leads: ${regular_leads.length}, clients: ${clients_data.length}, archived: ${archived_leads.length}`);

    const allLeads = [...insurance_leads, ...regular_leads, ...clients_data, ...archived_leads];
    console.log(`🔍 COMBINED STORAGE: Total ${allLeads.length} leads`);
    console.log(`🔍 LEAD IDS in combined storage:`, allLeads.slice(0, 10).map(l => `"${l.id}"`));

    // Enhanced ID matching - remove ALL quotes and normalize
    const normalizeId = (id) => {
        let normalized = String(id);
        // Remove all types of quotes (single, double, escaped)
        normalized = normalized.replace(/['"\\]/g, '');
        // Remove extra whitespace
        normalized = normalized.trim();
        return normalized;
    };
    const targetId = normalizeId(leadId);

    console.log(`🔍 NORMALIZED TARGET ID: "${targetId}"`);
    console.log(`🔍 SAMPLE STORED IDS:`, allLeads.slice(0, 5).map(l => `"${normalizeId(l.id)}" (original: ${l.id})`));

    let lead = allLeads.find(l => normalizeId(l.id) === targetId);
    console.log(`🔍 LOOKUP RESULT: Looking for "${targetId}", found:`, lead ? `${lead.name} (${lead.id})` : 'NOT FOUND');

    console.log(`🔍 DEBUG: Found lead:`, lead?.name, 'greenUntil:', lead?.greenUntil);
    console.log(`🔍 DEBUG: greenHighlightUntil check:`, lead?.reachOut?.greenHighlightUntil);
    console.log(`🔍 DEBUG: Full reachOut data:`, lead?.reachOut);

    // If not found in localStorage, try to fetch from server
    if (!lead) {
        console.log(`🌐 Lead not found in localStorage, attempting server fetch for ${leadId}...`);

        // Try to fetch from the API
        fetch(`/api/leads/${leadId}`)
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error(`HTTP ${response.status}`);
            })
            .then(data => {
                console.log(`✅ Server fetch successful for lead ${leadId}:`, data.name);
                // Recreate the modal with server data
                protectedFunctions.showCallStatusWithData(data);
            })
            .catch(error => {
                console.log(`❌ Server fetch failed for lead ${leadId}:`, error.message);
                alert(`Lead not found in local storage or server! ID: ${leadId}`);
            });
        return; // Exit early, server fetch will handle the modal
    }

    // Check for GREEN highlight duration (from green highlight system)
    let greenHighlightDays = 'Not Set';
    let greenHighlightStatus = 'No Green Highlighting';
    let daysRemaining = 0;

    // Check all storage formats for green highlighting
    let highlightExpiry = null;
    console.log(`🔍 DEBUG: Checking highlight formats...`);
    console.log(`🔍 lead.greenHighlight:`, lead.greenHighlight);
    console.log(`🔍 lead.reachOut?.greenHighlightUntil:`, lead.reachOut?.greenHighlightUntil);
    console.log(`🔍 lead.greenUntil:`, lead.greenUntil);

    if (lead.greenHighlight && lead.greenHighlight.expiresAt) {
        highlightExpiry = new Date(lead.greenHighlight.expiresAt);
        console.log(`🔍 Using greenHighlight.expiresAt:`, lead.greenHighlight.expiresAt);
    } else if (lead.reachOut && lead.reachOut.greenHighlightUntil) {
        highlightExpiry = new Date(lead.reachOut.greenHighlightUntil);
        console.log(`🔍 Using reachOut.greenHighlightUntil:`, lead.reachOut.greenHighlightUntil);
    } else if (lead.greenUntil) {
        highlightExpiry = new Date(lead.greenUntil);
        console.log(`🔍 Using greenUntil:`, lead.greenUntil);
    }

    if (highlightExpiry) {
        const now = new Date();
        const diffMs = highlightExpiry - now;
        daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (daysRemaining > 0) {
            greenHighlightDays = `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining`;
            greenHighlightStatus = 'Active Green Highlighting';
        } else {
            greenHighlightDays = 'Expired';
            greenHighlightStatus = 'Green Highlighting Expired';
        }
    } else {
        // Check if this lead has reach-out completion with green highlight duration
        if (lead.reachOut && (lead.reachOut.completedAt || lead.reachOut.reachOutCompletedAt)) {
            console.log(`🔍 Found reach-out completion, checking for highlight duration...`);

            // If a specific highlight duration was set, check the remaining time
            if (lead.reachOut.greenHighlightUntil) {
                const highlightExpiry = new Date(lead.reachOut.greenHighlightUntil);
                const now = new Date();
                const diffMs = highlightExpiry - now;
                daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

                if (daysRemaining > 0) {
                    const hoursRemaining = Math.ceil(diffMs / (1000 * 60 * 60));
                    if (daysRemaining === 1 && hoursRemaining <= 24) {
                        greenHighlightDays = `${hoursRemaining} hours remaining`;
                    } else {
                        greenHighlightDays = `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining`;
                    }
                    greenHighlightStatus = 'Active Green Highlighting';
                } else {
                    greenHighlightDays = 'Expired';
                    greenHighlightStatus = 'Green Highlighting Expired';
                    daysRemaining = 0;
                }
                console.log(`🔍 Green highlight expires: ${lead.reachOut.greenHighlightUntil}, remaining: ${daysRemaining} days`);
            } else {
                // No specific expiration date found, but lead is highlighted - check if we can calculate duration
                const completedAt = lead.reachOut.completedAt || lead.reachOut.reachOutCompletedAt;
                const completedDate = new Date(completedAt);

                // Check if a highlight duration was specified (look for common duration fields)
                let highlightDurationHours = null;

                // Check various ways duration might be stored
                if (lead.reachOut.highlightDuration) {
                    highlightDurationHours = lead.reachOut.highlightDuration;
                } else if (lead.reachOut.highlightDurationDays) {
                    highlightDurationHours = lead.reachOut.highlightDurationDays * 24;
                } else if (lead.reachOut.greenHighlightDays) {
                    // CRITICAL FIX: Check for greenHighlightDays which stores the original duration
                    highlightDurationHours = lead.reachOut.greenHighlightDays * 24;
                    console.log(`🔍 PERSISTENCE FIX: Found greenHighlightDays = ${lead.reachOut.greenHighlightDays} days`);
                } else if (lead.highlightDuration) {
                    highlightDurationHours = lead.highlightDuration;
                } else if (lead.stage === 'contact_attempted') {
                    // Default to 24 hours for contact attempted
                    highlightDurationHours = 24;
                } else {
                    // Default highlight duration of 24 hours for reach-out complete
                    highlightDurationHours = 24;
                    console.log(`🔍 FALLBACK: No duration found, using default 24 hours`);
                }

                if (highlightDurationHours) {
                    // Calculate expiration based on completion time + duration
                    const highlightExpiry = new Date(completedDate.getTime() + (highlightDurationHours * 60 * 60 * 1000));
                    const now = new Date();
                    const diffMs = highlightExpiry - now;

                    if (diffMs > 0) {
                        // Still active - show remaining time
                        const hoursRemaining = Math.ceil(diffMs / (1000 * 60 * 60));
                        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

                        if (hoursRemaining <= 24) {
                            greenHighlightDays = `${hoursRemaining} hours remaining`;
                        } else {
                            greenHighlightDays = `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining`;
                        }
                        greenHighlightStatus = 'Active Green Highlighting';

                        // Store the calculated expiration for future reference
                        if (!lead.reachOut.greenHighlightUntil) {
                            lead.reachOut.greenHighlightUntil = highlightExpiry.toISOString();
                            // Update storage
                            const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                            const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));
                            if (leadIndex !== -1) {
                                leads[leadIndex] = lead;
                                localStorage.setItem('insurance_leads', JSON.stringify(leads));
                                console.log(`✅ Updated lead ${leadId} with calculated highlight expiration: ${highlightExpiry.toISOString()}`);
                            }
                        }

                        console.log(`🔍 Calculated highlight duration: ${highlightDurationHours}h, expires: ${highlightExpiry}, remaining: ${hoursRemaining}h`);
                    } else {
                        // Expired
                        greenHighlightDays = 'Expired';
                        greenHighlightStatus = 'Green Highlighting Expired';
                        daysRemaining = 0;
                        console.log(`🔍 Highlight expired: ${highlightExpiry}`);
                    }
                } else {
                    // Fallback to showing completion time
                    const now = new Date();
                    const diffMs = now - completedDate;
                    const hoursAgo = Math.floor(diffMs / (1000 * 60 * 60));
                    const daysAgo = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                    if (daysAgo === 0) {
                        greenHighlightDays = `Completed ${hoursAgo} hours ago`;
                        greenHighlightStatus = 'Reach-Out Complete (No Duration Set)';
                    } else {
                        greenHighlightDays = `Completed ${daysAgo} ${daysAgo === 1 ? 'day' : 'days'} ago`;
                        greenHighlightStatus = 'Reach-Out Complete (No Duration Set)';
                    }
                    daysRemaining = 1; // Show green styling
                    console.log(`🔍 No highlight duration found, completed: ${completedAt}`);
                }
            }
        }
    }

    // Create simple modal for GREEN highlight duration
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000003;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 12px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    `;

    modalContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px;">
            <h2 style="margin: 0; color: #1f2937;"><i class="fas fa-highlight" style="color: #10b981;"></i> Highlight Duration - ${lead.name || 'Unknown'}</h2>
            <button onclick="this.closest('.call-status-modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">&times;</button>
        </div>

        <!-- GREEN Highlight Duration -->
        <div style="text-align: center; padding: 20px; background: ${daysRemaining > 0 ? '#f0fdf4' : '#f9fafb'}; border-radius: 8px; margin-bottom: 20px; border: 2px solid ${daysRemaining > 0 ? '#10b981' : '#e5e7eb'};">
            <div style="font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 10px;">Green Highlight Status</div>
            <div id="countdown-timer" style="font-size: 32px; font-weight: bold; color: ${daysRemaining > 0 ? '#10b981' : '#6b7280'}; margin-bottom: 5px;">${greenHighlightDays}</div>
            <div style="display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; ${
                daysRemaining > 0 ? 'background: #dcfce7; color: #166534;' : 'background: #f3f4f6; color: #6b7280;'
            }">${greenHighlightStatus}</div>
        </div>

        <!-- Scheduled Call Information -->
        ${lead.reachOut && lead.reachOut.scheduledCallDate && lead.reachOut.scheduledCallTime ? `
        <div style="text-align: center; padding: 15px; background: #eff6ff; border-radius: 8px; margin-bottom: 20px; border: 1px solid #3b82f6;">
            <div style="font-size: 16px; font-weight: bold; color: #1e40af; margin-bottom: 5px;">
                <i class="fas fa-calendar-alt" style="color: #3b82f6;"></i> Scheduled Call
            </div>
            <div style="font-size: 14px; color: #1e40af;">
                ${lead.reachOut.scheduledCallDate} at ${lead.reachOut.scheduledCallTime} EST
            </div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">
                Highlight expires when call is due
            </div>
        </div>
        ` : ''}

        <!-- Close Button -->
        <div style="text-align: center;">
            <button onclick="this.closest('.call-status-modal').remove()" style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                Close
            </button>
        </div>
    `;

    modal.className = 'call-status-modal';
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Start real-time countdown timer for active highlights
    let countdownInterval = null;
    if (daysRemaining > 0) {
        // Calculate target expiration time
        let expirationTime = null;

        if (lead.reachOut && lead.reachOut.greenHighlightUntil) {
            expirationTime = new Date(lead.reachOut.greenHighlightUntil);
        } else if (lead.reachOut && (lead.reachOut.completedAt || lead.reachOut.reachOutCompletedAt)) {
            // Recalculate expiration time based on completion + duration
            const completedAt = lead.reachOut.completedAt || lead.reachOut.reachOutCompletedAt;
            const completedDate = new Date(completedAt);

            let highlightDurationHours = null;
            if (lead.reachOut.highlightDuration) {
                highlightDurationHours = lead.reachOut.highlightDuration;
            } else if (lead.reachOut.highlightDurationDays) {
                highlightDurationHours = lead.reachOut.highlightDurationDays * 24;
            } else if (lead.reachOut.greenHighlightDays) {
                // CRITICAL FIX: Check for greenHighlightDays which stores the original duration
                highlightDurationHours = lead.reachOut.greenHighlightDays * 24;
                console.log(`🔍 COUNTDOWN FIX: Found greenHighlightDays = ${lead.reachOut.greenHighlightDays} days`);
            } else if (lead.highlightDuration) {
                highlightDurationHours = lead.highlightDuration;
            } else {
                highlightDurationHours = 24; // Default
                console.log(`🔍 COUNTDOWN FALLBACK: No duration found, using default 24 hours`);
            }

            expirationTime = new Date(completedDate.getTime() + (highlightDurationHours * 60 * 60 * 1000));
        }

        if (expirationTime) {
            const countdownElement = document.getElementById('countdown-timer');

            function updateCountdown() {
                const now = new Date();
                const diffMs = expirationTime - now;

                if (diffMs <= 0) {
                    countdownElement.textContent = 'Expired';
                    countdownElement.style.color = '#6b7280';
                    clearInterval(countdownInterval);
                    return;
                }

                const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
                const totalMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                const totalSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);

                if (totalHours >= 24) {
                    const days = Math.floor(totalHours / 24);
                    const remainingHours = totalHours % 24;
                    countdownElement.textContent = `${days}d ${remainingHours}h remaining`;
                } else if (totalHours > 0) {
                    countdownElement.textContent = `${totalHours}h ${totalMinutes}m remaining`;
                } else if (totalMinutes > 0) {
                    countdownElement.textContent = `${totalMinutes}m ${totalSeconds}s remaining`;
                } else {
                    countdownElement.textContent = `${totalSeconds}s remaining`;
                }
            }

            // Update immediately and then every second
            updateCountdown();
            countdownInterval = setInterval(updateCountdown, 1000);
        }
    }

    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            if (countdownInterval) clearInterval(countdownInterval);
            modal.remove();
        }
    });

    // Clear interval when modal is closed via close button
    const closeButtons = modal.querySelectorAll('button');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (countdownInterval) clearInterval(countdownInterval);
        });
    });
};

// New function to show call status with fresh server data
protectedFunctions.showCallStatusWithFreshData = function(lead) {
    console.log(`✅ Showing highlight duration modal with fresh server data for: ${lead.name}`);

    // Check for GREEN highlight duration (from green highlight system)
    let greenHighlightDays = 'Not Set';
    let greenHighlightStatus = 'No Green Highlighting';
    let daysRemaining = 0;

    // Check all storage formats for green highlighting
    let highlightExpiry = null;
    console.log(`🔍 DEBUG: Checking highlight formats...`);
    console.log(`🔍 lead.greenHighlight:`, lead.greenHighlight);
    console.log(`🔍 lead.reachOut?.greenHighlightUntil:`, lead.reachOut?.greenHighlightUntil);
    console.log(`🔍 lead.greenUntil:`, lead.greenUntil);

    if (lead.greenHighlight && lead.greenHighlight.expiresAt) {
        highlightExpiry = new Date(lead.greenHighlight.expiresAt);
        console.log(`🔍 Using greenHighlight.expiresAt:`, lead.greenHighlight.expiresAt);
    } else if (lead.reachOut && lead.reachOut.greenHighlightUntil) {
        highlightExpiry = new Date(lead.reachOut.greenHighlightUntil);
        console.log(`🔍 Using reachOut.greenHighlightUntil:`, lead.reachOut.greenHighlightUntil);
    } else if (lead.greenUntil) {
        highlightExpiry = new Date(lead.greenUntil);
        console.log(`🔍 Using greenUntil:`, lead.greenUntil);
    }

    if (highlightExpiry) {
        const now = new Date();
        const diffMs = highlightExpiry - now;

        if (diffMs > 0) {
            // Calculate more precise display format
            const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
            const days = Math.floor(totalHours / 24);
            const hours = totalHours % 24;

            if (days > 0) {
                greenHighlightDays = `${days}d ${hours}h remaining`;
            } else if (totalHours > 0) {
                const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                greenHighlightDays = `${totalHours}h ${minutes}m remaining`;
            } else {
                const minutes = Math.floor(diffMs / (1000 * 60));
                greenHighlightDays = `${minutes}m remaining`;
            }

            greenHighlightStatus = 'Active Green Highlighting';
            daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

            console.log(`✅ FRESH DATA: Calculated "${greenHighlightDays}" from server timestamp`);
        } else {
            greenHighlightDays = 'Expired';
            greenHighlightStatus = 'Green Highlighting Expired';
            daysRemaining = 0;
        }
    } else {
        console.log('❌ No highlight expiry found in fresh server data - using fallback');
        greenHighlightDays = 'No Duration Set';
        greenHighlightStatus = 'No Green Highlighting';
    }

    // Create and show the modal with calculated values
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); display: flex; align-items: center;
        justify-content: center; z-index: 9999999;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white; border-radius: 12px; padding: 30px;
        max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    `;

    modalContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
            <h2 style="margin: 0; color: #1f2937;"><i class="fas fa-highlight" style="color: #10b981;"></i> Highlight Duration Status</h2>
            <button id="close-highlight-modal" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">&times;</button>
        </div>


        <!-- GREEN Highlight Duration -->
        <div style="text-align: center; padding: 20px; background: ${daysRemaining > 0 ? '#f0fdf4' : '#f9fafb'}; border-radius: 8px; margin-bottom: 20px; border: 2px solid ${daysRemaining > 0 ? '#10b981' : '#e5e7eb'};">
            <div style="font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 10px;">Green Highlight Status</div>
            <div id="countdown-timer" style="font-size: 32px; font-weight: bold; color: ${daysRemaining > 0 ? '#10b981' : '#6b7280'}; margin-bottom: 5px;">${greenHighlightDays}</div>
            <div style="display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; ${
                daysRemaining > 0 ? 'background: #dcfce7; color: #166534;' : 'background: #f3f4f6; color: #6b7280;'
            }">${greenHighlightStatus}</div>
        </div>

        <div style="text-align: center;">
            <button id="close-highlight-modal-btn" style="background: #6b7280; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                Close
            </button>
        </div>
    `;

    modal.className = 'call-status-modal';
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Add event listeners for close buttons
    const closeButton = modal.querySelector('#close-highlight-modal');
    const closeBtn = modal.querySelector('#close-highlight-modal-btn');
    if (closeButton) closeButton.addEventListener('click', () => modal.remove());
    if (closeBtn) closeBtn.addEventListener('click', () => modal.remove());

    // Setup real-time countdown if active
    if (highlightExpiry && daysRemaining > 0) {
        const countdownElement = document.getElementById('countdown-timer');
        const countdownInterval = setInterval(() => {
            const now = new Date();
            const diffMs = highlightExpiry - now;

            if (diffMs <= 0) {
                countdownElement.textContent = 'Expired';
                countdownElement.style.color = '#6b7280';
                clearInterval(countdownInterval);
                return;
            }

            const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
            const days = Math.floor(totalHours / 24);
            const hours = totalHours % 24;
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

            if (days > 0) {
                countdownElement.textContent = `${days}d ${hours}h remaining`;
            } else if (totalHours > 0) {
                countdownElement.textContent = `${totalHours}h ${minutes}m remaining`;
            } else {
                countdownElement.textContent = `${minutes}m remaining`;
            }
        }, 1000);

        // Clear interval when modal is closed
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                clearInterval(countdownInterval);
                modal.remove();
            }
        });
    }
};

// Function to show "no highlight" status when lead doesn't qualify for green highlighting
protectedFunctions.showNoHighlightStatus = function(lead) {
    console.log(`📋 Showing no highlight status for: ${lead.name}`);

    // Create modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); display: flex; align-items: center;
        justify-content: center; z-index: 9999999;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white; border-radius: 12px; padding: 30px;
        max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    `;

    modalContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
            <h2 style="margin: 0; color: #1f2937;"><i class="fas fa-highlight" style="color: #6b7280;"></i> Highlight Duration Status</h2>
            <button id="close-no-highlight-modal" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">&times;</button>
        </div>

        <!-- No Green Highlight Status -->
        <div style="text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px; margin-bottom: 20px; border: 2px solid #e5e7eb;">
            <div style="font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 10px;">Green Highlight Status</div>
            <div style="font-size: 32px; font-weight: bold; color: #6b7280; margin-bottom: 5px;">No Active Highlight</div>
            <div style="display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; background: #f3f4f6; color: #6b7280;">
                Lead has TO DO actions - Green highlight not applicable
            </div>
        </div>

        <div style="text-align: center; color: #6b7280; margin-bottom: 20px; font-size: 14px;">
            Green highlighting only applies to completed leads with no pending actions.
        </div>

        <div style="text-align: center;">
            <button id="close-no-highlight-btn" style="background: #6b7280; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                Close
            </button>
        </div>
    `;

    modal.className = 'call-status-modal';
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Add event listeners for close buttons
    const closeButton = modal.querySelector('#close-no-highlight-modal');
    const closeBtn = modal.querySelector('#close-no-highlight-btn');
    if (closeButton) closeButton.addEventListener('click', () => modal.remove());
    if (closeBtn) closeBtn.addEventListener('click', () => modal.remove());

    // Close on outside click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
};

// Add the function to protectedFunctions for global access
protectedFunctions.showCallStatusWithData = showCallStatusWithData;

// Helper function to show highlight duration modal with server-fetched lead data
function showCallStatusWithData(leadData) {
    console.log('📊 Creating highlight duration modal for server-fetched lead:', leadData);

    // Create modal HTML
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); display: flex; align-items: center;
        justify-content: center; z-index: 10000;
    `;

    // Calculate highlight duration from lead data
    let highlightMinutes = 0;
    if (leadData.callLogs && Array.isArray(leadData.callLogs)) {
        highlightMinutes = leadData.callLogs
            .filter(log => log.disposition === 'Interested' || log.disposition === 'Very Interested' || log.disposition === 'Hot Lead')
            .reduce((total, log) => total + (parseFloat(log.duration) || 0), 0);
    }

    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 12px; width: 90%; max-width: 500px; max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <h2 style="margin: 0; color: #333; font-size: 24px;">📊 Highlight Duration</h2>
                <button onclick="this.closest('.modal').remove()" style="background: #ef4444; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 16px;">✕</button>
            </div>

            <div style="margin-bottom: 20px;">
                <h3 style="color: #2563eb; margin: 0 0 10px 0;">Lead Information</h3>
                <p style="margin: 5px 0;"><strong>Name:</strong> ${leadData.name || 'Unknown'}</p>
                <p style="margin: 5px 0;"><strong>Phone:</strong> ${leadData.phone || 'N/A'}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${leadData.email || 'N/A'}</p>
            </div>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center;">
                <h3 style="color: #dc2626; margin: 0 0 10px 0; font-size: 20px;">🎯 Total Highlight Duration</h3>
                <p style="font-size: 32px; font-weight: bold; color: #dc2626; margin: 10px 0;">${highlightMinutes.toFixed(1)} minutes</p>
                <p style="color: #6b7280; margin: 10px 0; font-style: italic;">Based on calls marked as Interested, Very Interested, or Hot Lead</p>
            </div>

            ${leadData.callLogs && leadData.callLogs.length > 0 ? `
                <div style="margin-top: 20px;">
                    <h3 style="color: #2563eb; margin: 0 0 15px 0;">📞 Highlighted Calls</h3>
                    <div style="max-height: 200px; overflow-y: auto;">
                        ${leadData.callLogs
                            .filter(log => log.disposition === 'Interested' || log.disposition === 'Very Interested' || log.disposition === 'Hot Lead')
                            .map(log => `
                                <div style="border: 1px solid #e5e7eb; padding: 12px; margin-bottom: 8px; border-radius: 6px; background: #fef2f2;">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="font-weight: bold; color: #dc2626;">${log.disposition}</span>
                                        <span style="color: #6b7280;">${log.date || 'Unknown date'}</span>
                                    </div>
                                    <div style="margin-top: 5px;">
                                        <span style="background: #dc2626; color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px;">
                                            ${parseFloat(log.duration || 0).toFixed(1)} min
                                        </span>
                                    </div>
                                    ${log.notes ? `<p style="margin: 8px 0 0 0; color: #374151; font-size: 14px;">${log.notes}</p>` : ''}
                                </div>
                            `).join('')}
                    </div>
                </div>
            ` : '<p style="text-align: center; color: #6b7280; margin-top: 20px;">No highlighted calls found</p>'}
        </div>
    `;

    modal.classList.add('modal');
    document.body.appendChild(modal);

    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Function to show call scheduled popup (appears before email confirmation)
window.showCallScheduledPopup = function(leadId) {
    console.log(`📞 Showing call scheduled popup for lead: ${leadId}`);

    // Create modal backdrop
    const modal = document.createElement('div');
    modal.className = 'call-scheduled-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000003;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 12px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    `;

    modalContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px;">
            <h2 style="margin: 0; color: #1f2937;"><i class="fas fa-calendar-check" style="color: #3b82f6;"></i> Call Scheduled?</h2>
            <button onclick="this.closest('.call-scheduled-modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">×</button>
        </div>

        <div style="text-align: center; margin-bottom: 25px;">
            <div style="font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 15px;">Was a call scheduled with this lead?</div>
        </div>

        <!-- Initial Response Options -->
        <div id="initial-options" style="display: flex; gap: 15px; justify-content: center; margin-bottom: 20px;">
            <button onclick="handleCallScheduled('${leadId}', true)" style="
                background: #10b981;
                color: white;
                border: none;
                padding: 15px 25px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                font-size: 16px;
                min-width: 120px;
                transition: all 0.2s;
            " onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10b981'">
                <i class="fas fa-check"></i> Yes
            </button>
            <button onclick="handleCallScheduled('${leadId}', false)" style="
                background: #ef4444;
                color: white;
                border: none;
                padding: 15px 25px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                font-size: 16px;
                min-width: 120px;
                transition: all 0.2s;
            " onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">
                <i class="fas fa-times"></i> No
            </button>
        </div>

        <!-- Date Selector (Initially Hidden) -->
        <div id="date-selector" style="display: none; text-align: center; margin-top: 20px;">
            <div style="margin-bottom: 15px;">
                <label style="font-weight: 600; font-size: 16px; display: block; margin-bottom: 10px;">Select Call Date & Time:</label>
                <div style="display: flex; gap: 15px; justify-content: center; align-items: center;">
                    <div>
                        <label style="font-weight: 500; font-size: 14px; display: block; margin-bottom: 5px;">Date:</label>
                        <input type="date" id="call-date-${leadId}" min="${new Date().toISOString().split('T')[0]}" style="padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                    </div>
                    <div>
                        <label style="font-weight: 500; font-size: 14px; display: block; margin-bottom: 5px;">Time:</label>
                        <input type="time" id="call-time-${leadId}" value="10:00" style="padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                    </div>
                </div>
            </div>
            <button onclick="confirmCallScheduled('${leadId}')" style="
                background: #3b82f6;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                font-size: 14px;
            ">
                <i class="fas fa-calendar-check"></i> Confirm
            </button>
        </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Close on backdrop click
    modal.onclick = function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    };
};

// Handle call scheduled response
window.handleCallScheduled = function(leadId, isScheduled) {
    console.log(`📞 Call scheduled response: ${isScheduled} for lead ${leadId}`);

    if (isScheduled) {
        // Show date selector
        const initialOptions = document.getElementById('initial-options');
        const dateSelector = document.getElementById('date-selector');

        if (initialOptions && dateSelector) {
            initialOptions.style.display = 'none';
            dateSelector.style.display = 'block';

            // Set default date to tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateInput = document.getElementById(`call-date-${leadId}`);
            if (dateInput) {
                dateInput.value = tomorrow.toISOString().split('T')[0];
            }

            // Set default time to 10:00 AM
            const timeInput = document.getElementById(`call-time-${leadId}`);
            if (timeInput) {
                timeInput.value = '10:00';
            }
        }
    } else {
        // No call scheduled - reset reach-out to uncompleted state and uncheck the call checkbox
        console.log('❌ User said NO to call scheduling - resetting reach-out state...');

        // Reset reach-out completion
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

        if (leadIndex !== -1 && leads[leadIndex].reachOut) {
            // Reset completion timestamps
            delete leads[leadIndex].reachOut.completedAt;
            delete leads[leadIndex].reachOut.reachOutCompletedAt;

            // Reset call data
            leads[leadIndex].reachOut.callsConnected = Math.max(0, (leads[leadIndex].reachOut.callsConnected || 1) - 1);
            leads[leadIndex].reachOut.callAttempts = Math.max(0, (leads[leadIndex].reachOut.callAttempts || 1) - 1);

            // Remove the latest call log entry if it exists
            if (leads[leadIndex].reachOut.callLogs && leads[leadIndex].reachOut.callLogs.length > 0) {
                leads[leadIndex].reachOut.callLogs.pop();
            }

            localStorage.setItem('insurance_leads', JSON.stringify(leads));
            console.log('✅ Reach-out state reset to TO DO');
        }

        // Uncheck the call checkbox in the profile
        const callCheckbox = document.getElementById(`call-made-${leadId}`);
        if (callCheckbox) {
            callCheckbox.checked = false;
            console.log('✅ Call checkbox unchecked');
        }

        // Force refresh the profile to show updated reach-out state
        setTimeout(() => {
            const updatedLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            const updatedLead = updatedLeads.find(l => String(l.id) === String(leadId));
            if (updatedLead && window.createEnhancedProfile) {
                console.log('🔄 Force refreshing profile after reset...');
                window.createEnhancedProfile(updatedLead);
            }
        }, 100);

        // Close popup and show email confirmation
        document.querySelector('.call-scheduled-modal').remove();
        showEmailConfirmationPopup(leadId);
    }
};

// Confirm call scheduled with date and time
window.confirmCallScheduled = function(leadId) {
    const dateInput = document.getElementById(`call-date-${leadId}`);
    const timeInput = document.getElementById(`call-time-${leadId}`);
    const selectedDate = dateInput ? dateInput.value : null;
    const selectedTime = timeInput ? timeInput.value : null;

    if (!selectedDate) {
        alert('Please select a date for the scheduled call.');
        return;
    }

    if (!selectedTime) {
        alert('Please select a time for the scheduled call.');
        return;
    }

    console.log(`📅 Call scheduled for ${selectedDate} at ${selectedTime} for lead ${leadId}`);

    // Calculate days until the scheduled date for green highlighting
    const scheduledDate = new Date(selectedDate);
    const today = new Date();
    const daysDiff = Math.ceil((scheduledDate - today) / (1000 * 60 * 60 * 24));

    // Set green highlight until the scheduled date
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

    if (leadIndex !== -1) {
        if (!leads[leadIndex].reachOut) {
            leads[leadIndex].reachOut = {};
        }

        // Initialize reachOut with proper structure (matching email confirmation)
        if (!leads[leadIndex].reachOut.emailCount) leads[leadIndex].reachOut.emailCount = 0;
        if (!leads[leadIndex].reachOut.textCount) leads[leadIndex].reachOut.textCount = 0;
        if (!leads[leadIndex].reachOut.callAttempts) leads[leadIndex].reachOut.callAttempts = 0;
        if (!leads[leadIndex].reachOut.callsConnected) leads[leadIndex].reachOut.callsConnected = 0;
        if (!leads[leadIndex].reachOut.voicemailCount) leads[leadIndex].reachOut.voicemailCount = 0;
        if (!leads[leadIndex].reachOut.callLogs) leads[leadIndex].reachOut.callLogs = [];

        // Add 1 connected call (since call was scheduled)
        leads[leadIndex].reachOut.callsConnected = leads[leadIndex].reachOut.callsConnected + 1;
        leads[leadIndex].reachOut.callAttempts = leads[leadIndex].reachOut.callAttempts + 1;

        // Add call log entry with time
        const callLog = {
            timestamp: new Date().toISOString(),
            connected: true,
            duration: '5 min',
            leftVoicemail: false,
            notes: `Call scheduled for ${selectedDate} at ${selectedTime} - Lead agreed to scheduled call`
        };
        leads[leadIndex].reachOut.callLogs.push(callLog);

        // Mark reach-out as COMPLETE (matching email confirmation)
        leads[leadIndex].reachOut.completedAt = new Date().toISOString();
        leads[leadIndex].reachOut.called = true;

        // Set green highlight until scheduled call time (Eastern Time)
        // Simple approach: treat the input as if it's in the user's current timezone
        // Since you're in Eastern Time, this should work correctly
        const [hours, minutes] = selectedTime.split(':');
        const highlightUntil = new Date(selectedDate + 'T' + selectedTime + ':00');

        console.log(`🕐 TIMEZONE DEBUG: Selected time: ${selectedDate} ${selectedTime}`);
        console.log(`🕐 TIMEZONE DEBUG: Parsed highlightUntil: ${highlightUntil.toISOString()}`);
        console.log(`🕐 TIMEZONE DEBUG: Local time string: ${highlightUntil.toString()}`);

        leads[leadIndex].reachOut.greenHighlightUntil = highlightUntil.toISOString();
        leads[leadIndex].reachOut.greenHighlightDays = daysDiff;
        leads[leadIndex].reachOut.callScheduled = true;
        leads[leadIndex].reachOut.scheduledCallDate = selectedDate;
        leads[leadIndex].reachOut.scheduledCallTime = selectedTime;
        leads[leadIndex].reachOut.scheduledCallDateTime = `${selectedDate} ${selectedTime}`;
        leads[leadIndex].reachOut.reachOutCompletedAt = new Date().toISOString();

        localStorage.setItem('insurance_leads', JSON.stringify(leads));

        // CRITICAL: Save to server for persistence (matching email confirmation approach)
        const updateData = {
            reachOut: leads[leadIndex].reachOut
        };

        fetch(`/api/leads/${leadId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        }).then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('✅ Call scheduled reach-out data saved to server successfully');

                // Force immediate profile refresh after server save
                setTimeout(() => {
                    console.log('🔄 FORCE REFRESH after server save...');
                    const finalLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                    const finalLead = finalLeads.find(l => String(l.id) === String(leadId));
                    if (finalLead && window.createEnhancedProfile) {
                        console.log('📊 Final lead reach-out data:', finalLead.reachOut);
                        window.createEnhancedProfile(finalLead);
                    }
                }, 200);
            } else {
                console.error('❌ Server reach-out update failed:', data.error);
            }
        })
        .catch(error => {
            console.error('❌ Server reach-out update error:', error);
        });

        console.log(`✅ Call scheduled: connected=${leads[leadIndex].reachOut.callsConnected}`);
        console.log(`✅ Call scheduled for ${selectedDate} at ${selectedTime}`);
        console.log(`✅ Green highlight set until ${selectedDate} (${daysDiff} days) for scheduled call`);
        console.log(`✅ Reach-out marked as COMPLETE with timestamp: ${leads[leadIndex].reachOut.completedAt}`);
    }

    // Close popup (skip email confirmation since call is scheduled)
    document.querySelector('.call-scheduled-modal').remove();

    // Refresh the table to show green highlighting
    if (window.displayLeads) {
        setTimeout(() => window.displayLeads(), 100);
    }

    // Refresh the lead profile if it's open to update reach-out section
    console.log('🔄 Checking for open profile to refresh...');
    const currentProfile = document.querySelector('.lead-profile-modal');
    if (currentProfile && currentProfile.style.display !== 'none') {
        const profileLeadId = currentProfile.getAttribute('data-lead-id');
        console.log(`🔍 Found profile for lead ${profileLeadId}, target lead ${leadId}`);
        if (String(profileLeadId) === String(leadId)) {
            console.log('✅ Profile matches target lead, refreshing...');
            setTimeout(() => {
                if (window.showLeadProfile) {
                    console.log('🔄 Calling showLeadProfile to refresh...');
                    window.showLeadProfile(leadId);
                } else {
                    console.log('❌ showLeadProfile not available');
                }
            }, 300);
        }
    } else {
        console.log('❌ No profile modal found or not visible');
    }

    // ALSO try alternative refresh method
    setTimeout(() => {
        const updatedLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const updatedLead = updatedLeads.find(l => String(l.id) === String(leadId));
        if (updatedLead) {
            console.log('🔄 FORCE REFRESH: Creating new profile with updated data...');
            console.log(`📊 Updated lead reach-out data:`, updatedLead.reachOut);
            if (window.createEnhancedProfile) {
                window.createEnhancedProfile(updatedLead);
            }
        }
    }, 500);
};

// Function to show email confirmation popup
window.showEmailConfirmationPopup = function(leadId) {
    console.log(`📧 Showing email confirmation popup for lead: ${leadId}`);

    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));

    if (!lead) {
        console.log(`❌ Lead ${leadId} not found for email confirmation`);
        return;
    }

    // Create modal for email confirmation
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000005;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 12px;
        max-width: 450px;
        width: 90%;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    `;

    modalContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px;">
            <h2 style="margin: 0; color: #1f2937;"><i class="fas fa-envelope" style="color: #3b82f6;"></i> Email Confirmation</h2>
            <button onclick="this.closest('.email-confirmation-modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">×</button>
        </div>

        <div style="text-align: center; margin-bottom: 25px;">
            <div style="font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 15px;">Did the lead confirm they received your email?</div>
            <div style="font-size: 14px; color: #6b7280;">This affects how long the lead will be highlighted green</div>
        </div>

        <!-- Response Options -->
        <div style="display: flex; gap: 15px; justify-content: center; margin-bottom: 20px;">
            <button onclick="handleEmailConfirmation('${leadId}', true)" style="
                background: #10b981;
                color: white;
                border: none;
                padding: 15px 25px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                font-size: 16px;
                min-width: 120px;
                transition: all 0.2s;
            " onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10b981'">
                <i class="fas fa-check"></i> Yes
                <div style="font-size: 12px; margin-top: 4px;">7 days green</div>
            </button>
            <button onclick="handleEmailConfirmation('${leadId}', false)" style="
                background: #ef4444;
                color: white;
                border: none;
                padding: 15px 25px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                font-size: 16px;
                min-width: 120px;
                transition: all 0.2s;
            " onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">
                <i class="fas fa-times"></i> No
                <div style="font-size: 12px; margin-top: 4px;">2 days green</div>
            </button>
        </div>

        <!-- Skip Button -->
        <div style="text-align: center;">
            <button onclick="this.closest('.email-confirmation-modal').remove()" style="background: #6b7280; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;">
                Skip
            </button>
        </div>
    `;

    modal.className = 'email-confirmation-modal';
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
};

// Function to handle email confirmation response
window.handleEmailConfirmation = function(leadId, confirmed) {
    console.log(`📧 Email confirmation for lead ${leadId}: ${confirmed ? 'YES' : 'NO'}`);
    console.log(`📧 NOTE: Email confirmation will NOT create fake call logs - only tracks email response`);

    const days = confirmed ? 7 : 2;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    // Get leads and complete reach-out
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

    if (leadIndex !== -1) {
        // Initialize reachOut if needed
        if (!leads[leadIndex].reachOut) {
            leads[leadIndex].reachOut = {
                emailCount: 0,
                textCount: 0,
                callAttempts: 0,
                callsConnected: 0,
                voicemailCount: 0,
                callLogs: []
            };
        }

        // Initialize callLogs array if it doesn't exist
        if (!leads[leadIndex].reachOut.callLogs) {
            leads[leadIndex].reachOut.callLogs = [];
        }

        // Track email confirmation without creating fake call logs
        if (!leads[leadIndex].reachOut.emailConfirmations) {
            leads[leadIndex].reachOut.emailConfirmations = [];
        }

        // Add email confirmation entry (not a call log)
        const emailConfirmation = {
            timestamp: new Date().toISOString(),
            confirmed: confirmed,
            notes: `Email confirmation - ${confirmed ? 'Lead confirmed receiving email' : 'Lead did not confirm email'}`
        };
        leads[leadIndex].reachOut.emailConfirmations.push(emailConfirmation);

        // Update email count (actual emails sent)
        const currentEmailCount = leads[leadIndex].reachOut.emailCount || 0;
        leads[leadIndex].reachOut.emailCount = currentEmailCount + 1;

        // Mark reach-out as COMPLETE (due to email confirmation)
        leads[leadIndex].reachOut.completedAt = new Date().toISOString();
        leads[leadIndex].reachOut.reachOutCompletedAt = new Date().toISOString();
        leads[leadIndex].reachOut.emailConfirmed = true; // More accurate than 'called'

        // Set green highlight (using existing format)
        if (!leads[leadIndex].reachOut) {
            leads[leadIndex].reachOut = {};
        }
        leads[leadIndex].reachOut.greenHighlightUntil = expiryDate.toISOString();
        leads[leadIndex].reachOut.greenHighlightDays = days;

        localStorage.setItem('insurance_leads', JSON.stringify(leads));

        // Save to server
        const updateData = {
            reachOut: leads[leadIndex].reachOut
        };

        fetch(`/api/leads/${leadId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        }).then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('✅ Reach-out completion and green highlight saved to server');
            }
        }).catch(error => console.error('❌ Error saving completion data:', error));

        // Update the connected display immediately
        const connectedDisplay = document.getElementById(`call-connected-${leadId}`);
        if (connectedDisplay) {
            connectedDisplay.textContent = leads[leadIndex].reachOut.callsConnected;
        }

        // Update checkbox to checked
        const checkbox = document.getElementById(`call-made-${leadId}`);
        if (checkbox) {
            checkbox.checked = true;
        }

        // Mark reach-out as COMPLETE with green styling
        markReachOutComplete(leadId, leads[leadIndex].reachOut.completedAt);

        showNotification(`Email confirmed! Reach-out completed. Lead will stay green for ${days} days.`, 'success');
    }

    // Close modal
    document.querySelector('.email-confirmation-modal').remove();

    // INSTEAD OF refreshLeadsTable() which resets data, just update UI directly
    setTimeout(() => {
        localStorage.setItem('insurance_leads', JSON.stringify(leads));

        console.log('🔧 PRESERVING email confirmation - NOT calling refreshLeadsTable()');
        console.log('🔧 Email confirmation data should persist in profile');

        // Instead of full table refresh that resets data, just apply highlighting
        if (window.applyReachOutCompleteHighlighting) {
            window.applyReachOutCompleteHighlighting();
        }

        // Force apply green highlighting directly to this specific lead
        const tableBody = document.querySelector('#leadsTableBody') || document.querySelector('tbody');
        if (tableBody) {
            const rows = tableBody.querySelectorAll('tr');
            rows.forEach(row => {
                const checkbox = row.querySelector('.lead-checkbox');
                if (checkbox && String(checkbox.value) === String(leadId)) {
                    console.log(`🟢 Applying direct green highlight to lead ${leadId} row`);
                    row.style.setProperty('background-color', 'rgba(16, 185, 129, 0.2)', 'important');
                    row.style.setProperty('background', 'rgba(16, 185, 129, 0.2)', 'important');
                    row.style.setProperty('border-left', '4px solid #10b981', 'important');
                    row.style.setProperty('border-right', '2px solid #10b981', 'important');
                    row.classList.add('reach-out-complete');

                    // Clear TODO text since reach-out is complete
                    const todoCell = row.querySelectorAll('td')[6];
                    if (todoCell) {
                        todoCell.innerHTML = '';
                        console.log(`🔧 Cleared TODO text for email confirmed lead ${leadId}`);
                    }
                }
            });
        }

        console.log('✅ Email confirmation UI updates applied without data reset');
    }, 300);
};

// Function to show green highlight duration popup
window.showGreenHighlightDurationPopup = function(leadId) {
    console.log(`🟢 Showing green highlight duration popup for lead: ${leadId}`);

    // Check if this lead has "REACH OUT" todo
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));

    if (!lead) {
        console.log(`❌ Lead ${leadId} not found, skipping popup`);
        return;
    }

    // Check if lead is in a reachout scenario
    const todoText = (typeof getNextAction === 'function' ? getNextAction(lead.stage || 'new', lead) : '').toLowerCase();

    // Check for reachout scenarios:
    // 1. Todo text includes "reach out"
    // 2. Stages like "info requested", "loss runs requested", "quote sent" with called box checked
    const stage = (lead.stage || '').toLowerCase();
    const hasCalled = lead.reachOut && lead.reachOut.called;

    const isReachOutScenario = todoText.includes('reach out') ||
                              (stage.includes('info_requested') && hasCalled) ||
                              (stage.includes('loss_runs_requested') && hasCalled) ||
                              (stage.includes('quote_sent') && hasCalled) ||
                              (stage.includes('contact_attempted') && hasCalled);

    if (!isReachOutScenario) {
        console.log(`⏭️ Lead ${leadId} not in reachout scenario (stage: "${stage}", called: ${hasCalled}, todo: "${todoText}"), skipping popup`);
        return;
    }

    console.log(`✅ Lead ${leadId} is in reachout scenario (stage: "${stage}", called: ${hasCalled}, todo: "${todoText}"), showing popup`);

    // Create modal for green highlight duration selection
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000004;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 12px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    `;

    modalContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px;">
            <h2 style="margin: 0; color: #1f2937;"><i class="fas fa-highlight" style="color: #10b981;"></i> Set Green Highlight Duration</h2>
            <button onclick="this.closest('.green-highlight-modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">&times;</button>
        </div>

        <p style="color: #6b7280; margin-bottom: 20px; text-align: center;">How long should this lead stay highlighted in green?</p>

        <!-- Duration Options -->
        <div style="margin-bottom: 25px;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 15px;">
                <button onclick="setGreenHighlightDuration('${leadId}', 2)" style="padding: 12px; border: 2px solid #e5e7eb; background: white; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s;"
                        onmouseover="this.style.borderColor='#10b981'; this.style.background='#f0fdf4';"
                        onmouseout="this.style.borderColor='#e5e7eb'; this.style.background='white';">
                    2 Days<br><span style="font-size: 12px; color: #6b7280;">Standard</span>
                </button>
                <button onclick="setGreenHighlightDuration('${leadId}', 3)" style="padding: 12px; border: 2px solid #e5e7eb; background: white; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s;"
                        onmouseover="this.style.borderColor='#10b981'; this.style.background='#f0fdf4';"
                        onmouseout="this.style.borderColor='#e5e7eb'; this.style.background='white';">
                    3 Days
                </button>
                <button onclick="setGreenHighlightDuration('${leadId}', 5)" style="padding: 12px; border: 2px solid #e5e7eb; background: white; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s;"
                        onmouseover="this.style.borderColor='#10b981'; this.style.background='#f0fdf4';"
                        onmouseout="this.style.borderColor='#e5e7eb'; this.style.background='white';">
                    5 Days
                </button>
                <button onclick="setGreenHighlightDuration('${leadId}', 7)" style="padding: 12px; border: 2px solid #e5e7eb; background: white; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s;"
                        onmouseover="this.style.borderColor='#10b981'; this.style.background='#f0fdf4';"
                        onmouseout="this.style.borderColor='#e5e7eb'; this.style.background='white';">
                    7 Days
                </button>
                <button onclick="setGreenHighlightDuration('${leadId}', 14)" style="padding: 12px; border: 2px solid #e5e7eb; background: white; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s;"
                        onmouseover="this.style.borderColor='#10b981'; this.style.background='#f0fdf4';"
                        onmouseout="this.style.borderColor='#e5e7eb'; this.style.background='white';">
                    14 Days
                </button>
                <button onclick="showCustomDurationInput('${leadId}')" style="padding: 12px; border: 2px solid #e5e7eb; background: white; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s;"
                        onmouseover="this.style.borderColor='#10b981'; this.style.background='#f0fdf4';"
                        onmouseout="this.style.borderColor='#e5e7eb'; this.style.background='white';">
                    Custom
                </button>
            </div>
        </div>

        <!-- Custom Duration Input (initially hidden) -->
        <div id="customDurationDiv" style="display: none; margin-bottom: 20px; padding: 15px; background: #f9fafb; border-radius: 8px;">
            <label style="font-weight: 600; margin-bottom: 10px; display: block;">Custom Duration (days):</label>
            <input type="number" id="customDays" min="1" max="365" placeholder="Enter days" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 6px; margin-bottom: 10px;">
            <div style="display: flex; gap: 10px;">
                <button onclick="setGreenHighlightDuration('${leadId}', document.getElementById('customDays').value)" style="flex: 1; padding: 8px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Set Custom</button>
                <button onclick="document.getElementById('customDurationDiv').style.display='none'" style="flex: 1; padding: 8px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Cancel</button>
            </div>
        </div>

        <!-- Close Button -->
        <div style="text-align: center;">
            <button onclick="this.closest('.green-highlight-modal').remove()" style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                Skip
            </button>
        </div>
    `;

    modal.className = 'green-highlight-modal';
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
};

// Function to show custom duration input
window.showCustomDurationInput = function(leadId) {
    document.getElementById('customDurationDiv').style.display = 'block';
};

// Function to set green highlight duration
window.setGreenHighlightDuration = function(leadId, days) {
    const daysNum = parseInt(days) || 2;
    console.log(`🟢 Setting green highlight duration for lead ${leadId}: ${daysNum} days`);

    let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

    if (leadIndex !== -1) {
        // Set green highlight expiration
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + daysNum);

        if (!leads[leadIndex].reachOut) {
            leads[leadIndex].reachOut = {};
        }

        leads[leadIndex].reachOut.greenHighlightUntil = expirationDate.toISOString();
        leads[leadIndex].reachOut.greenHighlightDays = daysNum;

        // Save to localStorage
        localStorage.setItem('insurance_leads', JSON.stringify(leads));

        console.log(`✅ Green highlight set until: ${expirationDate.toLocaleDateString()}`);

        // CRITICAL FIX: Save green highlight duration to server
        const updateData = {
            reachOut: leads[leadIndex].reachOut
        };

        fetch(`/api/leads/${leadId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log(`✅ Green highlight duration saved to server: ${daysNum} days until ${expirationDate.toLocaleDateString()}`);
            } else {
                console.error('❌ Server save failed for green highlight duration:', data.error);
            }
        })
        .catch(error => {
            console.error('❌ Server save error for green highlight duration:', error);
        });
    }

    // Close the modal
    const modal = document.querySelector('.green-highlight-modal');
    if (modal) {
        modal.remove();
    }

    // Show notification
    showNotification(`Lead will stay green for ${daysNum} ${daysNum === 1 ? 'day' : 'days'}`, 'success');
};

// Custom modal for Next Callback scheduling
function showNextCallbackPopup(leadId) {
    console.log('📞 NEXT CALLBACK: Showing scheduling popup for lead', leadId);

    // Check if there are existing callbacks for this lead
    const callbacksKey = 'scheduled_callbacks';
    const callbacks = JSON.parse(localStorage.getItem(callbacksKey) || '{}');
    const leadCallbacks = callbacks[leadId] || [];

    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 3000000;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Arial, sans-serif;
    `;

    // Create modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 30px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        text-align: center;
        max-width: 400px;
        margin: 0 20px;
    `;

    modal.innerHTML = `
        <div style="margin-bottom: 20px;">
            <div style="width: 60px; height: 60px; background: #dcfce7; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-calendar-plus" style="font-size: 24px; color: #10b981;"></i>
            </div>
            <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 20px; font-weight: 600;">Call Completed!</h3>
            <p style="margin: 0; color: #6b7280; font-size: 16px; line-height: 1.5;">
                Would you like to schedule the next callback for this lead?
            </p>
        </div>

        <div style="display: flex; gap: 12px; justify-content: center;">
            <button id="schedule-next-callback" style="
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
            ">Schedule Next Call</button>
            <button id="no-callback-needed" style="
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
            ">Not Needed</button>
        </div>
    `;

    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);

    // Add hover effects
    const scheduleBtn = modal.querySelector('#schedule-next-callback');
    const noNeedBtn = modal.querySelector('#no-callback-needed');

    scheduleBtn.addEventListener('mouseenter', () => {
        scheduleBtn.style.background = '#059669';
    });
    scheduleBtn.addEventListener('mouseleave', () => {
        scheduleBtn.style.background = '#10b981';
    });

    noNeedBtn.addEventListener('mouseenter', () => {
        noNeedBtn.style.background = '#e5e7eb';
    });
    noNeedBtn.addEventListener('mouseleave', () => {
        noNeedBtn.style.background = '#f3f4f6';
    });

    // Handle button clicks
    scheduleBtn.addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
        console.log('📞 NEXT CALLBACK: User chose to schedule next callback');

        // Show the callback scheduler (reuse existing function if available)
        setTimeout(() => {
            showCallbackScheduler(leadId);
        }, 200);
    });

    noNeedBtn.addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
        console.log('📞 NEXT CALLBACK: User chose no callback needed');

        // Complete/remove any existing callbacks for this lead
        if (leadCallbacks.length > 0) {
            completeAllCallbacksForLead(leadId);
        }
    });

    // Handle escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(modalOverlay);
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);

    // Handle click outside modal
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            document.body.removeChild(modalOverlay);
        }
    });
}

// Function to complete all callbacks for a lead
function completeAllCallbacksForLead(leadId) {
    console.log('✅ COMPLETING ALL CALLBACKS for lead', leadId);

    // CRITICAL FIX: Complete callbacks silently without showing popup
    // Get all callbacks for this lead and complete them individually
    const callbacksKey = 'scheduled_callbacks';
    let callbacks = JSON.parse(localStorage.getItem(callbacksKey) || '{}');

    if (callbacks[leadId] && callbacks[leadId].length > 0) {
        console.log('✅ COMPLETING', callbacks[leadId].length, 'callbacks for lead', leadId);

        // Complete each callback individually (SILENT MODE - no popups)
        callbacks[leadId].forEach(callback => {
            console.log('✅ Completing callback', callback.id, 'for lead', leadId);

            // CRITICAL FIX: Complete callback silently without showing popup
            // Use completeCallbackAfterOutcome directly with 'answered' outcome
            if (typeof completeCallbackAfterOutcome === 'function') {
                completeCallbackAfterOutcome(leadId, callback.id, 'answered');
            } else {
                // Fallback: Direct localStorage cleanup (SILENT MODE)
                console.log('🔧 FALLBACK: Using direct callback removal for', callback.id);
                callbacks[leadId] = callbacks[leadId].filter(cb =>
                    String(cb.id) !== String(callback.id) &&
                    (!cb.callback_id || String(cb.callback_id) !== String(callback.id))
                );
                localStorage.setItem(callbacksKey, JSON.stringify(callbacks));
            }
        });
    } else {
        console.log('📋 No callbacks found for lead', leadId);
    }

    // Also update the table to remove callback messages
    setTimeout(() => {
        if (typeof window.emergencyCallbackFix === 'function') {
            window.emergencyCallbackFix();
        }
    }, 500);
}

// Function to show callback scheduler (reuse existing or create simple one)
function showCallbackScheduler(leadId) {
    console.log('📅 CALLBACK SCHEDULER: Opening scheduler for lead', leadId);

    // Get lead data
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));

    if (!lead) {
        console.error('Lead not found for callback scheduling:', leadId);
        return;
    }

    // Create simple scheduler modal
    const modalOverlay = document.createElement('div');
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 3000000;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Arial, sans-serif;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 30px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        max-width: 450px;
        margin: 0 20px;
    `;

    // Get current date/time for default
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0); // Default to 10 AM tomorrow

    const dateStr = tomorrow.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM format

    modal.innerHTML = `
        <div style="margin-bottom: 25px; text-align: center;">
            <div style="width: 60px; height: 60px; background: #dbeafe; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-calendar-alt" style="font-size: 24px; color: #3b82f6;"></i>
            </div>
            <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 20px; font-weight: 600;">Schedule Next Call</h3>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                Lead: <strong>${lead.name}</strong>
            </p>
        </div>

        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">
                Quick Schedule:
            </label>
            <div style="display: flex; gap: 8px;">
                <button type="button" onclick="(function(){var d=new Date();d.setDate(d.getDate()+1);d.setHours(10,0,0,0);document.getElementById('callback-datetime').value=d.toISOString().slice(0,16);this.parentElement.querySelectorAll('button').forEach(b=>b.style.background='#f3f4f6');this.style.background='#dbeafe';}).call(this)" style="flex:1;padding:8px;border:2px solid #e5e7eb;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px;background:#f3f4f6;color:#374151;">+1 Day</button>
                <button type="button" onclick="(function(){var d=new Date();d.setDate(d.getDate()+2);d.setHours(10,0,0,0);document.getElementById('callback-datetime').value=d.toISOString().slice(0,16);this.parentElement.querySelectorAll('button').forEach(b=>b.style.background='#f3f4f6');this.style.background='#dbeafe';}).call(this)" style="flex:1;padding:8px;border:2px solid #e5e7eb;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px;background:#f3f4f6;color:#374151;">+2 Days</button>
                <button type="button" onclick="(function(){var d=new Date();d.setDate(d.getDate()+3);d.setHours(10,0,0,0);document.getElementById('callback-datetime').value=d.toISOString().slice(0,16);this.parentElement.querySelectorAll('button').forEach(b=>b.style.background='#f3f4f6');this.style.background='#dbeafe';}).call(this)" style="flex:1;padding:8px;border:2px solid #e5e7eb;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px;background:#f3f4f6;color:#374151;">+3 Days</button>
            </div>
        </div>

        <div style="margin-bottom: 25px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">
                Callback Date & Time:
            </label>
            <input type="datetime-local" id="callback-datetime" value="${dateStr}"
                   style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;" />
        </div>

        <div style="margin-bottom: 25px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">
                Notes (optional):
            </label>
            <textarea id="callback-notes" placeholder="Add any notes for the callback..."
                      style="width: 100%; height: 60px; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; resize: vertical;"></textarea>
        </div>

        <div style="display: flex; gap: 12px; justify-content: center;">
            <button id="save-callback" style="
                background: #3b82f6;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                font-size: 14px;
                min-width: 100px;
            ">Schedule</button>
        </div>
    `;

    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);

    // Handle save callback
    modal.querySelector('#save-callback').addEventListener('click', () => {
        const dateTime = modal.querySelector('#callback-datetime').value;
        const notes = modal.querySelector('#callback-notes').value;

        if (!dateTime) {
            alert('Please select a date and time for the callback');
            return;
        }

        // Save the callback
        saveCallback(leadId, dateTime, notes);
        document.body.removeChild(modalOverlay);
    });

}

// Function to save callback
async function saveCallback(leadId, dateTime, notes) {
    console.log('💾 SAVING CALLBACK:', { leadId, dateTime, notes });

    // Save to localStorage
    const callbacksKey = 'scheduled_callbacks';
    const callbacks = JSON.parse(localStorage.getItem(callbacksKey) || '{}');

    if (!callbacks[leadId]) {
        callbacks[leadId] = [];
    }

    const callbackId = Date.now(); // Simple ID
    const newCallback = {
        id: callbackId,
        leadId: leadId,
        dateTime: dateTime,
        notes: notes || '',
        completed: false,
        createdAt: new Date().toISOString()
    };

    callbacks[leadId].push(newCallback);
    localStorage.setItem(callbacksKey, JSON.stringify(callbacks));

    // Schedule exact-timer alarm for the new callback immediately
    if (window.CallbackNotifications && window.CallbackNotifications.refresh) {
        window.CallbackNotifications.refresh();
    }

    // Save to server
    try {
        const urls = [
            'http://162-220-14-239.nip.io:3001/api/callbacks',
            'http://localhost:3001/api/callbacks'
        ];

        for (const url of urls) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(newCallback)
                });

                if (response.ok) {
                    console.log('✅ CALLBACK SAVED: Successfully saved to server');
                    break;
                }
            } catch (error) {
                console.log('❌ CALLBACK SAVE: Server error:', error.message);
            }
        }
    } catch (error) {
        console.error('Error saving callback to server:', error);
    }

    // Show notification
    const callbackDate = new Date(dateTime);
    const formattedDate = callbackDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    alert(`✅ Callback scheduled for ${formattedDate}`);

    console.log('📅 CALLBACK SCHEDULED: New callback set for', formattedDate);
}

// Custom modal for Contact Attempted confirmation
function showContactAttemptedModal(leadId, callback) {
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 3000000;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Arial, sans-serif;
    `;

    // Create modal content
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 30px;
        max-width: 450px;
        width: 90%;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        text-align: center;
        position: relative;
    `;

    modal.innerHTML = `
        <div style="margin-bottom: 20px;">
            <div style="width: 60px; height: 60px; background: #fef3c7; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-phone" style="font-size: 24px; color: #f59e0b;"></i>
            </div>
            <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 20px; font-weight: 600;">Contact Attempt</h3>
            <p style="margin: 0; color: #6b7280; font-size: 16px; line-height: 1.5;">
                Did you attempt to call this lead with no pickup?
            </p>
        </div>

        <div style="display: flex; gap: 12px; justify-content: center;">
            <button id="contact-attempted-yes" style="
                background: #dc2626;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                font-size: 14px;
                min-width: 80px;
                transition: all 0.2s;
            ">Yes</button>
            <button id="contact-attempted-no" style="
                background: #f3f4f6;
                color: #374151;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                font-size: 14px;
                min-width: 80px;
                transition: all 0.2s;
            ">No</button>
        </div>
    `;

    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);

    // Add hover effects
    const noBtn = modal.querySelector('#contact-attempted-no');
    const yesBtn = modal.querySelector('#contact-attempted-yes');

    noBtn.addEventListener('mouseenter', () => {
        noBtn.style.background = '#e5e7eb';
    });
    noBtn.addEventListener('mouseleave', () => {
        noBtn.style.background = '#f3f4f6';
    });

    yesBtn.addEventListener('mouseenter', () => {
        yesBtn.style.background = '#b91c1c';
    });
    yesBtn.addEventListener('mouseleave', () => {
        yesBtn.style.background = '#dc2626';
    });

    // Handle button clicks
    noBtn.addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
        callback(false);
    });

    yesBtn.addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
        callback(true);
    });

    // Handle escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(modalOverlay);
            callback(false);
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);

    // Handle click outside modal
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            document.body.removeChild(modalOverlay);
            callback(false);
        }
    });
}

// Market Stats function
protectedFunctions.showMarketStats = function(leadId) {
    console.log('📊 Showing Market Stats for lead:', leadId);

    // Get lead data
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));

    if (!lead) {
        alert('Lead not found');
        return;
    }

    // Create modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 800px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    `;

    modalContent.innerHTML = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px 12px 0 0;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h2 style="margin: 0; font-size: 24px; font-weight: bold;">
                    <i class="fas fa-chart-line" style="margin-right: 10px;"></i>
                    Market Stats - ${lead.name || 'Unknown'}
                </h2>
                <button onclick="this.closest('div').parentElement.parentElement.remove()"
                        style="background: rgba(255,255,255,0.2); color: white; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; font-size: 18px;">
                    ×
                </button>
            </div>
        </div>

        <div style="padding: 30px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;">
                <!-- Market Overview Cards -->
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff;">
                    <h4 style="margin: 0 0 10px 0; color: #007bff;"><i class="fas fa-chart-bar"></i> Market Capacity</h4>
                    <p style="margin: 0; font-size: 24px; font-weight: bold; color: #333;">High</p>
                    <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Multiple carriers available</p>
                </div>

                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745;">
                    <h4 style="margin: 0 0 10px 0; color: #28a745;"><i class="fas fa-dollar-sign"></i> Rate Trend</h4>
                    <p style="margin: 0; font-size: 24px; font-weight: bold; color: #333;">Stable</p>
                    <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">±5% from last year</p>
                </div>

                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107;">
                    <h4 style="margin: 0 0 10px 0; color: #ffc107;"><i class="fas fa-shield-alt"></i> Risk Profile</h4>
                    <p style="margin: 0; font-size: 24px; font-weight: bold; color: #333;">Moderate</p>
                    <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Based on industry/location</p>
                </div>
            </div>

            <!-- Detailed Analysis -->
            <div style="background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 15px 0; color: #333;"><i class="fas fa-analytics"></i> Market Analysis</h3>

                <div style="margin-bottom: 15px;">
                    <strong>Industry:</strong> ${lead.industry || 'Transportation'}
                    <br><strong>Location:</strong> ${lead.state || 'Unknown'} ${lead.city || ''}
                    <br><strong>Fleet Size:</strong> ${lead.units || 'Not specified'} units
                </div>

                <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 15px 0;">
                    <h4 style="margin: 0 0 10px 0; color: #1976d2;">Competitive Landscape</h4>
                    <ul style="margin: 0; padding-left: 20px;">
                        <li>Progressive Commercial: Competitive for smaller fleets</li>
                        <li>Northland/Canal: Strong appetite for 3+ year accounts</li>
                        <li>Berkley Prime: Specialized programs available</li>
                        <li>Crum & Forster: Comprehensive coverage options</li>
                    </ul>
                </div>

                <div style="background: #f3e5f5; padding: 15px; border-radius: 6px;">
                    <h4 style="margin: 0 0 10px 0; color: #7b1fa2;">Recommendations</h4>
                    <ul style="margin: 0; padding-left: 20px;">
                        <li>Target multiple carriers for best rates</li>
                        <li>Emphasize safety record and experience</li>
                        <li>Consider bundling opportunities</li>
                        <li>Review coverage limits and deductibles</li>
                    </ul>
                </div>
            </div>

            <div style="text-align: center; border-top: 2px solid #e9ecef; padding-top: 20px;">
                <button onclick="this.closest('div').parentElement.parentElement.parentElement.remove()"
                        style="background: #6c757d; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: 500;">
                    Close
                </button>
            </div>
        </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
};

// Update stage function
protectedFunctions.updateLeadStage = function(leadId, stage) {
    console.log('Updating lead stage:', leadId, stage);

    // Special handling for Contact Attempted stage
    let contactAttemptedCompleted = false;
    if (stage === 'contact_attempted') {
        showContactAttemptedModal(leadId, (confirmed) => {
            if (confirmed) {
                // Auto-complete the reach-out
                handleContactAttemptedCompletion(leadId);
                contactAttemptedCompleted = true;

                // Continue with stage update
                continueStageUpdate(leadId, stage, contactAttemptedCompleted);
            } else {
                // Continue with stage update but no auto-completion
                continueStageUpdate(leadId, stage, false);
            }
        });
        return; // Exit early, continuation handled by callback
    }

    // For non-contact-attempted stages, continue normally
    continueStageUpdate(leadId, stage, contactAttemptedCompleted);
};

// Extracted stage update continuation logic
function continueStageUpdate(leadId, stage, contactAttemptedCompleted) {
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

    if (leadIndex !== -1) {
        const now = new Date().toISOString();

        // Update stage and timestamp
        leads[leadIndex].stage = stage;
        leads[leadIndex].stageUpdatedAt = now;
        if (stage === 'app_sent') leads[leadIndex].appSentAt = now;
        // Add lastModified timestamp for smart merge protection
        leads[leadIndex].lastModified = now;

        // Reset reach-out data when stage changes
        // Check for email confirmations as valid completions
        const hasEmailConfirmation = leads[leadIndex].reachOut &&
            leads[leadIndex].reachOut.emailConfirmations &&
            leads[leadIndex].reachOut.emailConfirmations.length > 0 &&
            leads[leadIndex].reachOut.emailConfirmations.some(conf => conf.confirmed === true);

        const hasExistingCompletion = leads[leadIndex].reachOut &&
            (leads[leadIndex].reachOut.completedAt || leads[leadIndex].reachOut.reachOutCompletedAt) &&
            (leads[leadIndex].reachOut.callsConnected > 0 || leads[leadIndex].reachOut.callAttempts > 0 || hasEmailConfirmation);

        // ALWAYS reset reach-out for stages that require fresh reach-out attempts
        const stagesRequiringFreshReachOut = ['info_requested', 'loss_runs_requested', 'quoted'];
        const shouldForceReset = stagesRequiringFreshReachOut.includes(stage);

        // Don't force reset if there are confirmed email confirmations
        const shouldPreserveEmailConfirmations = hasEmailConfirmation;

        if (!contactAttemptedCompleted && (!hasExistingCompletion || (shouldForceReset && !shouldPreserveEmailConfirmations))) {
            if (shouldForceReset && shouldPreserveEmailConfirmations) {
                console.log(`🔄 Stage changed to ${stage} - PRESERVING reach-out data due to email confirmation for lead:`, leadId);
            } else if (shouldForceReset) {
                console.log(`🔄 Stage changed to ${stage} - FORCE resetting reach-out data for lead:`, leadId);
            } else {
                console.log('🔄 Stage changed - resetting reach-out data for lead:', leadId);
            }
            if (leads[leadIndex].reachOut) {
                // Reset all reach-out completion data
                leads[leadIndex].reachOut.completedAt = null;
                leads[leadIndex].reachOut.reachOutCompletedAt = null;
                leads[leadIndex].reachOut.callsConnected = 0;
                leads[leadIndex].reachOut.textCount = 0;
                leads[leadIndex].reachOut.emailSent = false;
                leads[leadIndex].reachOut.textSent = false;
                leads[leadIndex].reachOut.callMade = false;
                leads[leadIndex].reachOut.emailCount = 0;
                leads[leadIndex].reachOut.callAttempts = 0;
                leads[leadIndex].reachOut.voicemailCount = 0;
                console.log('✅ Reach-out data reset for lead:', leadId);
            }
        } else {
            if (contactAttemptedCompleted) {
                console.log('⏭️ Skipping reach-out reset - Contact Attempted was completed');
            } else if (shouldPreserveEmailConfirmations) {
                console.log('⏭️ Skipping reach-out reset - Email confirmation completion preserved');
            } else {
                console.log('⏭️ Skipping reach-out reset - Existing reach-out completion preserved');
            }
        }

        localStorage.setItem('insurance_leads', JSON.stringify(leads));

        // Check if call scheduled popup should be shown first
        if (stage === 'info_requested' || stage === 'loss_runs_requested') {
            showCallScheduledPopup(leadId);
        }

        // Save stage change to server (including reset reach-out data)
        const updateData = {
            stage: stage,
            stageUpdatedAt: now,
            reachOut: leads[leadIndex].reachOut // Include the reset reach-out data
        };

        fetch(`/api/leads/${leadId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('✅ Stage updated on server:', stage);
            } else {
                console.error('❌ Server stage update failed:', data.error);
            }
        })
        .catch(error => {
            console.error('❌ Server stage update error:', error);
        });

        // Update the stage dropdown immediately
        const stageDropdown = document.getElementById(`lead-stage-${leadId}`);
        if (stageDropdown) {
            stageDropdown.value = stage;
            console.log('✅ Stage dropdown updated immediately:', stage);
        }

        // Update the timestamp display in the current profile if open
        updateStageTimestampDisplay(leadId, now);

        // Update reach-out styling based on new stage requirements
        const stagesRequiringReachOut = [
            'Contact Attempted', 'contact_attempted',
            'Info Requested', 'info_requested',
            'Loss Runs Requested', 'loss_runs_requested',
            'Quote Sent', 'quote_sent', 'quote-sent-unaware', 'quote-sent-aware',
            'Interested', 'interested'
        ];

        const hasReachOutTodo = stagesRequiringReachOut.includes(stage);
        applyReachOutStyling(leadId, hasReachOutTodo);
        console.log(`🎨 Stage change: ${stage}, hasReachOut: ${hasReachOutTodo}`);

        // Immediately update the stage badge in the leads table
        updateStageBadgeInTable(leadId, stage);

        // Update the table display immediately with localStorage data
        refreshLeadsTable();
    }
}

// Override viewLead to use enhanced profile
protectedFunctions.viewLead = async function(leadId) {
    console.log('🔥 viewLead override called for:', leadId);

    let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    console.log(`🔍 SEARCHING: Looking for lead ID ${leadId} in ${leads.length} total leads`);

    let lead = leads.find(l => String(l.id) === String(leadId));

    if (!lead) {
        console.log('⚡ Lead not found in localStorage, refreshing from server...');

        try {
            // Refresh leads from server if lead not found locally
            await loadLeadsFromServerAndRefresh();

            // Try again after refresh
            leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            console.log(`🔍 RETRY SEARCH: Looking for lead ID ${leadId} in ${leads.length} total leads after server refresh`);
            lead = leads.find(l => String(l.id) === String(leadId));
        } catch (error) {
            console.error('❌ Error refreshing leads from server:', error);
        }
    }

    if (lead) {
        console.log(`✅ FOUND LEAD: ID=${lead.id}, Name=${lead.name}`);

        // 🔥 EMAIL COMPLETION FIX: Sync individual lead data from server before profile display
        try {
            console.log('🔥 FORCE_SYNC_FIX: SERVER SYNC STARTING FOR LEAD', leadId);
            const response = await fetch(`/api/leads/${leadId}`);
            if (response.ok) {
                const serverLead = await response.json();
                console.log('🔍 SERVER DATA emailConfirmed:', serverLead.reachOut?.emailConfirmed);
                console.log('🔍 LOCAL DATA emailConfirmed:', lead.reachOut?.emailConfirmed);

                // Update localStorage lead with server data
                const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));
                if (leadIndex !== -1) {
                    leads[leadIndex] = serverLead;
                    localStorage.setItem('insurance_leads', JSON.stringify(leads));
                    lead = serverLead; // Use fresh server data
                    console.log('✅ Lead synced with server data');
                }
            }
        } catch (error) {
            console.error('❌ Error syncing individual lead from server:', error);
        }

        protectedFunctions.createEnhancedProfile(lead);
    } else {
        console.error('❌ Lead not found:', leadId);
        console.error('❌ Available leads:', leads.map(l => `${l.id}: ${l.name}`));
    }
};

// Create showLeadProfile alias for compatibility
protectedFunctions.showLeadProfile = function(leadId) {
    console.log('🔥 showLeadProfile called, redirecting to enhanced profile for:', leadId);
    protectedFunctions.viewLead(leadId);
};

// Notification function
protectedFunctions.showNotification = function(message, type) {
    console.log(`[${type}] ${message}`);
};

// Additional lead update functions
protectedFunctions.updateLeadStatus = function(leadId, status) {
    protectedFunctions.updateLeadField(leadId, 'status', status);
};

protectedFunctions.updateWinLossStatus = function(leadId, winLoss) {
    protectedFunctions.updateLeadField(leadId, 'winLoss', winLoss);
};

protectedFunctions.updateLeadAssignedTo = function(leadId, assignedTo) {
    console.log('🎯 updateLeadAssignedTo called:', leadId, assignedTo);

    // Update both field formats for compatibility
    protectedFunctions.updateLeadField(leadId, 'assignedTo', assignedTo);
    protectedFunctions.updateLeadField(leadId, 'assigned_to', assignedTo);

    console.log('✅ Both assignedTo formats updated:', assignedTo);
};

protectedFunctions.updateLeadPriority = function(leadId, priority) {
    console.log('🎨 updateLeadPriority called:', leadId, priority);
    protectedFunctions.updateLeadField(leadId, 'priority', priority);

    // Update the lead name color in the table immediately
    if (window.displayLeads) {
        setTimeout(() => {
            window.displayLeads();
        }, 100);
    }
};

// Vehicle, Trailer, Driver management functions - Use existing card functions
protectedFunctions.addVehicleToLead = function(leadId) {
    console.log('Add vehicle for lead:', leadId);
    // Use the existing addVehicle function that creates cards
    if (window.addVehicle) {
        window.addVehicle(leadId);
    } else {
        // Fallback: create the vehicle manually
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const lead = leads.find(l => String(l.id) === String(leadId));
        if (lead) {
            if (!lead.vehicles) lead.vehicles = [];
            lead.vehicles.push({
                year: '',
                make: '',
                model: '',
                vin: '',
                value: '',
                deductible: '',
                type: '',
                gvwr: ''
            });
            localStorage.setItem('insurance_leads', JSON.stringify(leads));
            // Refresh lead profile
            if (window.showLeadProfile) {
                window.showLeadProfile(leadId);
            }
        }
    }
};

protectedFunctions.addTrailerToLead = function(leadId) {
    console.log('Add trailer for lead:', leadId);
    // Use the existing addTrailer function that creates cards
    if (window.addTrailer) {
        window.addTrailer(leadId);
    } else {
        // Fallback: create the trailer manually
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const lead = leads.find(l => String(l.id) === String(leadId));
        if (lead) {
            if (!lead.trailers) lead.trailers = [];
            lead.trailers.push({
                year: '',
                make: '',
                type: '',
                vin: '',
                length: '',
                value: '',
                deductible: ''
            });
            localStorage.setItem('insurance_leads', JSON.stringify(leads));
            // Refresh lead profile
            if (window.showLeadProfile) {
                window.showLeadProfile(leadId);
            }
        }
    }
};

protectedFunctions.addDriverToLead = function(leadId) {
    console.log('Add driver for lead:', leadId);
    // Use the existing addDriver function that creates cards
    if (window.addDriver) {
        window.addDriver(leadId);
    } else {
        // Fallback: create the driver manually
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const lead = leads.find(l => String(l.id) === String(leadId));
        if (lead) {
            if (!lead.drivers) lead.drivers = [];
            lead.drivers.push({
                name: '',
                license: '',
                dob: '',
                hireDate: '',
                experience: '',
                violations: ''
            });
            localStorage.setItem('insurance_leads', JSON.stringify(leads));
            // Refresh lead profile
            if (window.showLeadProfile) {
                window.showLeadProfile(leadId);
            }
        }
    }
};

// Quote and Application management functions
protectedFunctions.createQuoteApplication = function(leadId) {
    console.log('Create quote application for lead:', leadId);

    // Use the enhanced quote application modal
    if (typeof window.createQuoteApplicationSimple === 'function') {
        window.createQuoteApplicationSimple(leadId);
        return;
    }

    console.error('Enhanced quote application not available');
    alert('Quote application feature is loading. Please try again in a moment.');

    // End of function - enhanced modal will be used instead
};

// OLD_REMOVED: protectedFunctions.loadQuoteApplications = function(leadId) {
// OLD_REMOVED:     console.log('📋 Loading quote applications for lead:', leadId);
// OLD_REMOVED: 
// OLD_REMOVED:     const applicationsContainer = document.getElementById(`application-submissions-container-${leadId}`);
// OLD_REMOVED:     if (!applicationsContainer) {
// OLD_REMOVED:         console.log('❌ Applications container not found');
// OLD_REMOVED:         return;
// OLD_REMOVED:     }
// OLD_REMOVED: 
// OLD_REMOVED:     const content = document.createElement('div');
// OLD_REMOVED:     content.style.cssText = `
// OLD_REMOVED:         background: white;
// OLD_REMOVED:         padding: 20px;
// OLD_REMOVED:         border-radius: 12px;
// OLD_REMOVED:         width: 90vw;
// OLD_REMOVED:         height: 90vh;
// OLD_REMOVED:         overflow-y: auto;
// OLD_REMOVED:         position: relative;
// OLD_REMOVED:         box-shadow: rgba(0, 0, 0, 0.3) 0px 20px 60px;
// OLD_REMOVED:     `;
// OLD_REMOVED: 
// OLD_REMOVED:     content.innerHTML = `
// OLD_REMOVED:         <div style="position: relative;">
// OLD_REMOVED:             <button onclick="document.getElementById('quote-application-modal').remove();"
// OLD_REMOVED:                     style="position: absolute; top: -10px; right: -10px; background: white; border: 2px solid #ccc; border-radius: 50%; width: 35px; height: 35px; font-size: 24px; cursor: pointer; color: #666; z-index: 10; display: flex; align-items: center; justify-content: center; line-height: 1;"
// OLD_REMOVED:                     onmouseover="this.style.backgroundColor='#f0f0f0'; this.style.color='#000'"
// OLD_REMOVED:                     onmouseout="this.style.backgroundColor='white'; this.style.color='#666'"
// OLD_REMOVED:                     title="Close">
// OLD_REMOVED:                 <span style="margin-top: -2px;">&times;</span>
// OLD_REMOVED:             </button>
// OLD_REMOVED:             <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #0066cc; padding-bottom: 10px;">
// OLD_REMOVED:                 <h2 style="margin: 0; color: #0066cc;">Vanguard Insurance Group LLC</h2>
// OLD_REMOVED:                 <p style="margin: 5px 0;">Brunswick, OH 44256 • 330-460-0872</p>
// OLD_REMOVED:                 <h3 style="margin: 10px 0 0 0;">TRUCKING APPLICATION</h3>
// OLD_REMOVED:             </div>
// OLD_REMOVED:         </div>
// OLD_REMOVED: 
// OLD_REMOVED:         <form style="font-size: 14px;">
// OLD_REMOVED:             <!-- GENERAL INFORMATION -->
// OLD_REMOVED:             <div style="background: #f0f4f8; padding: 15px; margin-bottom: 15px; border-left: 4px solid #0066cc; border-radius: 6px;">
// OLD_REMOVED:                 <h4 style="margin: 0 0 15px 0; color: #0066cc;">GENERAL INFORMATION</h4>
// OLD_REMOVED:                 <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
// OLD_REMOVED:                     <div>
// OLD_REMOVED:                         <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Effective Date:</label>
// OLD_REMOVED:                         <input type="date" value="${new Date().toISOString().split('T')[0]}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
// OLD_REMOVED:                     </div>
// OLD_REMOVED:                     <div>
// OLD_REMOVED:                         <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Insured's Name:</label>
// OLD_REMOVED:                         <input type="text" value="${lead.name || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
// OLD_REMOVED:                     </div>
// OLD_REMOVED:                     <div>
// OLD_REMOVED:                         <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">USDOT Number:</label>
// OLD_REMOVED:                         <input type="text" value="${lead.dotNumber || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
// OLD_REMOVED:                     </div>
// OLD_REMOVED:                     <div>
// OLD_REMOVED:                         <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">MC Number:</label>
// OLD_REMOVED:                         <input type="text" value="${lead.mcNumber || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
// OLD_REMOVED:                     </div>
// OLD_REMOVED:                     <div>
// OLD_REMOVED:                         <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Contact Person:</label>
// OLD_REMOVED:                         <input type="text" value="${lead.contact || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
// OLD_REMOVED:                     </div>
// OLD_REMOVED:                     <div>
// OLD_REMOVED:                         <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Phone:</label>
// OLD_REMOVED:                         <input type="text" value="${lead.phone || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
// OLD_REMOVED:                     </div>
// OLD_REMOVED:                     <div style="grid-column: 1 / -1;">
// OLD_REMOVED:                         <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Email:</label>
// OLD_REMOVED:                         <input type="email" value="${lead.email || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
// OLD_REMOVED:                     </div>
// OLD_REMOVED:                 </div>
// OLD_REMOVED:             </div>
// OLD_REMOVED: 
// OLD_REMOVED:             <!-- DESCRIPTION OF OPERATION SECTION -->
// OLD_REMOVED:             <div style="background: #f0f4f8; padding: 15px; margin-bottom: 15px; border-left: 4px solid #0066cc; border-radius: 6px;">
// OLD_REMOVED:                 <h4 style="margin: 0 0 15px 0; color: #0066cc;">DESCRIPTION OF OPERATION</h4>
// OLD_REMOVED: 
// OLD_REMOVED:                 <!-- Haul for Hire Section -->
// OLD_REMOVED:                 <div style="margin-bottom: 20px;">
// OLD_REMOVED:                     <h5 style="margin: 0 0 10px 0; color: #374151; font-size: 14px; font-weight: bold;">Operation Type:</h5>
// OLD_REMOVED:                     <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Haul for Hire:</label>
// OLD_REMOVED:                             <input type="text" placeholder="%" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Non-Trucking:</label>
// OLD_REMOVED:                             <input type="text" placeholder="%" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Other:</label>
// OLD_REMOVED:                             <input type="text" placeholder="%" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                     </div>
// OLD_REMOVED:                 </div>
// OLD_REMOVED: 
// OLD_REMOVED:                 <!-- Percentage of Loads by Distance -->
// OLD_REMOVED:                 <div style="margin-bottom: 20px;">
// OLD_REMOVED:                     <h5 style="margin: 0 0 10px 0; color: #374151; font-size: 14px; font-weight: bold;">PERCENTAGE OF LOADS:</h5>
// OLD_REMOVED:                     <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px;">
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">0-100 miles:</label>
// OLD_REMOVED:                             <input type="text" placeholder="%" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">101-300 miles:</label>
// OLD_REMOVED:                             <input type="text" placeholder="%" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">301-500 miles:</label>
// OLD_REMOVED:                             <input type="text" placeholder="%" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">500+ miles:</label>
// OLD_REMOVED:                             <input type="text" placeholder="%" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                     </div>
// OLD_REMOVED:                 </div>
// OLD_REMOVED: 
// OLD_REMOVED:                 <!-- Class of Risk -->
// OLD_REMOVED:                 <div style="margin-bottom: 15px;">
// OLD_REMOVED:                     <h5 style="margin: 0 0 10px 0; color: #374151; font-size: 14px; font-weight: bold;">CLASS OF RISK:</h5>
// OLD_REMOVED:                     <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px;">
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Dry Van:</label>
// OLD_REMOVED:                             <input type="text" placeholder="%" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Dump Truck:</label>
// OLD_REMOVED:                             <input type="text" placeholder="%" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Flat Bed:</label>
// OLD_REMOVED:                             <input type="text" placeholder="%" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Van/Buses:</label>
// OLD_REMOVED:                             <input type="text" placeholder="%" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Auto Hauler:</label>
// OLD_REMOVED:                             <input type="text" placeholder="%" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Box Truck:</label>
// OLD_REMOVED:                             <input type="text" placeholder="%" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Reefer:</label>
// OLD_REMOVED:                             <input type="text" placeholder="%" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Other:</label>
// OLD_REMOVED:                             <input type="text" placeholder="%" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                     </div>
// OLD_REMOVED:                 </div>
// OLD_REMOVED:             </div>
// OLD_REMOVED: 
// OLD_REMOVED:             <!-- COMMODITIES SECTION -->
// OLD_REMOVED:             <div style="background: #f0f4f8; padding: 15px; margin-bottom: 15px; border-left: 4px solid #0066cc; border-radius: 6px;">
// OLD_REMOVED:                 <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
// OLD_REMOVED:                     <h4 style="margin: 0; color: #0066cc;">COMMODITIES</h4>
// OLD_REMOVED:                     <button type="button" onclick="addCommodityRow()" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500;">
// OLD_REMOVED:                         <i class="fas fa-plus"></i> Add Commodity
// OLD_REMOVED:                     </button>
// OLD_REMOVED:                 </div>
// OLD_REMOVED:                 <div id="commodities-container">
// OLD_REMOVED:                     <div class="commodity-row" style="display: grid; grid-template-columns: 2fr 1fr auto; gap: 10px; align-items: end; margin-bottom: 15px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px; background: #f9fafb;">
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Commodity:</label>
// OLD_REMOVED:                             <select style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
// OLD_REMOVED:                                 <option value="">Select Commodity</option>
// OLD_REMOVED:                                 <option value="General Freight">General Freight</option>
// OLD_REMOVED:                                 <option value="Machinery">Machinery</option>
// OLD_REMOVED:                                 <option value="Building Materials">Building Materials</option>
// OLD_REMOVED:                                 <option value="Food Products">Food Products</option>
// OLD_REMOVED:                                 <option value="Chemicals">Chemicals</option>
// OLD_REMOVED:                                 <option value="Automobiles">Automobiles</option>
// OLD_REMOVED:                                 <option value="Electronics">Electronics</option>
// OLD_REMOVED:                                 <option value="Textiles">Textiles</option>
// OLD_REMOVED:                                 <option value="Paper Products">Paper Products</option>
// OLD_REMOVED:                                 <option value="Metal Products">Metal Products</option>
// OLD_REMOVED:                                 <option value="Coal/Minerals">Coal/Minerals</option>
// OLD_REMOVED:                                 <option value="Petroleum Products">Petroleum Products</option>
// OLD_REMOVED:                                 <option value="Lumber">Lumber</option>
// OLD_REMOVED:                                 <option value="Grain/Agricultural">Grain/Agricultural</option>
// OLD_REMOVED:                                 <option value="Waste Materials">Waste Materials</option>
// OLD_REMOVED:                                 <option value="Other">Other</option>
// OLD_REMOVED:                             </select>
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">% of Loads:</label>
// OLD_REMOVED:                             <input type="text" placeholder="%" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                         <div style="display: flex; align-items: end;">
// OLD_REMOVED:                             <button type="button" onclick="removeCommodityRow(this)" style="background: #ef4444; color: white; border: none; padding: 6px; border-radius: 4px; cursor: pointer;">
// OLD_REMOVED:                                 <i class="fas fa-times"></i>
// OLD_REMOVED:                             </button>
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                     </div>
// OLD_REMOVED:                 </div>
// OLD_REMOVED:             </div>
// OLD_REMOVED: 
// OLD_REMOVED:             <!-- DRIVERS SECTION -->
// OLD_REMOVED:             <div style="background: #f0f4f8; padding: 15px; margin-bottom: 15px; border-left: 4px solid #0066cc; border-radius: 6px;">
// OLD_REMOVED:                 <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
// OLD_REMOVED:                     <h4 style="margin: 0; color: #0066cc;">DRIVERS INFORMATION</h4>
// OLD_REMOVED:                     <button type="button" onclick="addDriverRow()" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500;">
// OLD_REMOVED:                         <i class="fas fa-plus"></i> Add Driver
// OLD_REMOVED:                     </button>
// OLD_REMOVED:                 </div>
// OLD_REMOVED:                 <div id="drivers-container">
// OLD_REMOVED:                     <div class="driver-row" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 2fr auto; gap: 10px; align-items: end; margin-bottom: 15px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px; background: #f9fafb;">
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Name:</label>
// OLD_REMOVED:                             <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Date of Birth:</label>
// OLD_REMOVED:                             <input type="date" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">License #:</label>
// OLD_REMOVED:                             <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">State:</label>
// OLD_REMOVED:                             <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Years Exp:</label>
// OLD_REMOVED:                             <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Hire Date:</label>
// OLD_REMOVED:                             <input type="date" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Accidents/Violations:</label>
// OLD_REMOVED:                             <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                         <div style="display: flex; align-items: end;">
// OLD_REMOVED:                             <button type="button" onclick="removeDriverRow(this)" style="background: #ef4444; color: white; border: none; padding: 6px; border-radius: 4px; cursor: pointer;">
// OLD_REMOVED:                                 <i class="fas fa-times"></i>
// OLD_REMOVED:                             </button>
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                     </div>
// OLD_REMOVED:                 </div>
// OLD_REMOVED:             </div>
// OLD_REMOVED: 
// OLD_REMOVED:             <!-- TRUCKS SECTION -->
// OLD_REMOVED:             <div style="background: #f0f4f8; padding: 15px; margin-bottom: 15px; border-left: 4px solid #0066cc; border-radius: 6px;">
// OLD_REMOVED:                 <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
// OLD_REMOVED:                     <h4 style="margin: 0; color: #0066cc;">TRUCKS</h4>
// OLD_REMOVED:                     <button type="button" onclick="addTruckRow()" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500;">
// OLD_REMOVED:                         <i class="fas fa-plus"></i> Add Truck
// OLD_REMOVED:                     </button>
// OLD_REMOVED:                 </div>
// OLD_REMOVED:                 <div id="trucks-container">
// OLD_REMOVED:                     <div class="truck-row" style="display: grid; grid-template-columns: 1fr 2fr 1fr 2fr 1fr 1fr auto; gap: 10px; align-items: end; margin-bottom: 15px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px; background: #f9fafb;">
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Year:</label>
// OLD_REMOVED:                             <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Make/Model:</label>
// OLD_REMOVED:                             <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Type:</label>
// OLD_REMOVED:                             <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">VIN:</label>
// OLD_REMOVED:                             <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Value:</label>
// OLD_REMOVED:                             <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Radius:</label>
// OLD_REMOVED:                             <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                         <div style="display: flex; align-items: end;">
// OLD_REMOVED:                             <button type="button" onclick="removeTruckRow(this)" style="background: #ef4444; color: white; border: none; padding: 6px; border-radius: 4px; cursor: pointer;">
// OLD_REMOVED:                                 <i class="fas fa-times"></i>
// OLD_REMOVED:                             </button>
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                     </div>
// OLD_REMOVED:                 </div>
// OLD_REMOVED:             </div>
// OLD_REMOVED: 
// OLD_REMOVED:             <!-- TRAILERS SECTION -->
// OLD_REMOVED:             <div style="background: #f0f4f8; padding: 15px; margin-bottom: 15px; border-left: 4px solid #0066cc; border-radius: 6px;">
// OLD_REMOVED:                 <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
// OLD_REMOVED:                     <h4 style="margin: 0; color: #0066cc;">TRAILERS</h4>
// OLD_REMOVED:                     <button type="button" onclick="addTrailerRow()" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500;">
// OLD_REMOVED:                         <i class="fas fa-plus"></i> Add Trailer
// OLD_REMOVED:                     </button>
// OLD_REMOVED:                 </div>
// OLD_REMOVED:                 <div id="trailers-container">
// OLD_REMOVED:                     <div class="trailer-row" style="display: grid; grid-template-columns: 1fr 2fr 1fr 2fr 1fr 1fr auto; gap: 10px; align-items: end; margin-bottom: 15px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px; background: #f9fafb;">
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Year:</label>
// OLD_REMOVED:                             <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Make/Model:</label>
// OLD_REMOVED:                             <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Type:</label>
// OLD_REMOVED:                             <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">VIN:</label>
// OLD_REMOVED:                             <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Value:</label>
// OLD_REMOVED:                             <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                         <div>
// OLD_REMOVED:                             <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Radius:</label>
// OLD_REMOVED:                             <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                         <div style="display: flex; align-items: end;">
// OLD_REMOVED:                             <button type="button" onclick="removeTrailerRow(this)" style="background: #ef4444; color: white; border: none; padding: 6px; border-radius: 4px; cursor: pointer;">
// OLD_REMOVED:                                 <i class="fas fa-times"></i>
// OLD_REMOVED:                             </button>
// OLD_REMOVED:                         </div>
// OLD_REMOVED:                     </div>
// OLD_REMOVED:                 </div>
// OLD_REMOVED:             </div>
// OLD_REMOVED: 
// OLD_REMOVED:             <!-- COVERAGES SECTION -->
// OLD_REMOVED:             <div style="background: #f0f4f8; padding: 15px; margin-bottom: 15px; border-left: 4px solid #0066cc; border-radius: 6px;">
// OLD_REMOVED:                 <h4 style="margin: 0 0 15px 0; color: #0066cc;">COVERAGE INFORMATION</h4>
// OLD_REMOVED:                 <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
// OLD_REMOVED:                     <div>
// OLD_REMOVED:                         <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Auto Liability:</label>
// OLD_REMOVED:                         <select style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
// OLD_REMOVED:                             <option value="">Select Limit</option>
// OLD_REMOVED:                             <option value="$1,000,000">$1,000,000</option>
// OLD_REMOVED:                             <option value="$2,000,000">$2,000,000</option>
// OLD_REMOVED:                             <option value="$5,000,000">$5,000,000</option>
// OLD_REMOVED:                             <option value="$10,000,000">$10,000,000</option>
// OLD_REMOVED:                         </select>
// OLD_REMOVED:                     </div>
// OLD_REMOVED:                     <div>
// OLD_REMOVED:                         <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Medical Payments:</label>
// OLD_REMOVED:                         <select style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
// OLD_REMOVED:                             <option value="">Select Amount</option>
// OLD_REMOVED:                             <option value="$5,000">$5,000</option>
// OLD_REMOVED:                             <option value="$10,000">$10,000</option>
// OLD_REMOVED:                             <option value="$15,000">$15,000</option>
// OLD_REMOVED:                             <option value="$25,000">$25,000</option>
// OLD_REMOVED:                         </select>
// OLD_REMOVED:                     </div>
// OLD_REMOVED:                     <div>
// OLD_REMOVED:                         <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Uninsured/Underinsured Bodily Injury:</label>
// OLD_REMOVED:                         <select style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
// OLD_REMOVED:                             <option value="">Select Coverage</option>
// OLD_REMOVED:                             <option value="$1,000,000">$1,000,000</option>
// OLD_REMOVED:                             <option value="$2,000,000">$2,000,000</option>
// OLD_REMOVED:                             <option value="$5,000,000">$5,000,000</option>
// OLD_REMOVED:                             <option value="Match Liability">Match Auto Liability</option>
// OLD_REMOVED:                             <option value="Rejected">Rejected</option>
// OLD_REMOVED:                         </select>
// OLD_REMOVED:                     </div>
// OLD_REMOVED:                     <div>
// OLD_REMOVED:                         <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Uninsured Motorist Property Damage:</label>
// OLD_REMOVED:                         <select style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
// OLD_REMOVED:                             <option value="">Select Coverage</option>
// OLD_REMOVED:                             <option value="$100,000">$100,000</option>
// OLD_REMOVED:                             <option value="$250,000">$250,000</option>
// OLD_REMOVED:                             <option value="$500,000">$500,000</option>
// OLD_REMOVED:                             <option value="$1,000,000">$1,000,000</option>
// OLD_REMOVED:                             <option value="Rejected">Rejected</option>
// OLD_REMOVED:                         </select>
// OLD_REMOVED:                     </div>
// OLD_REMOVED:                     <div>
// OLD_REMOVED:                         <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Comprehensive Deductible:</label>
// OLD_REMOVED:                         <select style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
// OLD_REMOVED:                             <option value="">Select Deductible</option>
// OLD_REMOVED:                             <option value="$500">$500</option>
// OLD_REMOVED:                             <option value="$1,000">$1,000</option>
// OLD_REMOVED:                             <option value="$2,500">$2,500</option>
// OLD_REMOVED:                             <option value="$5,000">$5,000</option>
// OLD_REMOVED:                             <option value="$10,000">$10,000</option>
// OLD_REMOVED:                             <option value="Not Included">Not Included</option>
// OLD_REMOVED:                         </select>
// OLD_REMOVED:                     </div>
// OLD_REMOVED:                     <div>
// OLD_REMOVED:                         <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Collision Deductible:</label>
// OLD_REMOVED:                         <select style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
// OLD_REMOVED:                             <option value="">Select Deductible</option>
// OLD_REMOVED:                             <option value="$500">$500</option>
// OLD_REMOVED:                             <option value="$1,000">$1,000</option>
// OLD_REMOVED:                             <option value="$2,500">$2,500</option>
// OLD_REMOVED:                             <option value="$5,000">$5,000</option>
// OLD_REMOVED:                             <option value="$10,000">$10,000</option>
// OLD_REMOVED:                             <option value="Not Included">Not Included</option>
// OLD_REMOVED:                         </select>
// OLD_REMOVED:                     </div>
// OLD_REMOVED:                     <div>
// OLD_REMOVED:                         <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Non-Owned Trailer Phys Dam:</label>
// OLD_REMOVED:                         <select style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
// OLD_REMOVED:                             <option value="">Select Coverage</option>
// OLD_REMOVED:                             <option value="$50,000">$50,000</option>
// OLD_REMOVED:                             <option value="$100,000">$100,000</option>
// OLD_REMOVED:                             <option value="$250,000">$250,000</option>
// OLD_REMOVED:                             <option value="$500,000">$500,000</option>
// OLD_REMOVED:                             <option value="Not Included">Not Included</option>
// OLD_REMOVED:                         </select>
// OLD_REMOVED:                     </div>
// OLD_REMOVED:                     <div>
// OLD_REMOVED:                         <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Trailer Interchange:</label>
// OLD_REMOVED:                         <select style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
// OLD_REMOVED:                             <option value="">Select Coverage</option>
// OLD_REMOVED:                             <option value="$50,000">$50,000</option>
// OLD_REMOVED:                             <option value="$100,000">$100,000</option>
// OLD_REMOVED:                             <option value="$250,000">$250,000</option>
// OLD_REMOVED:                             <option value="$500,000">$500,000</option>
// OLD_REMOVED:                             <option value="Not Included">Not Included</option>
// OLD_REMOVED:                         </select>
// OLD_REMOVED:                     </div>
// OLD_REMOVED:                     <div>
// OLD_REMOVED:                         <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Roadside Assistance:</label>
// OLD_REMOVED:                         <select style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
// OLD_REMOVED:                             <option value="">Select Coverage</option>
// OLD_REMOVED:                             <option value="Included">Included</option>
// OLD_REMOVED:                             <option value="Not Included">Not Included</option>
// OLD_REMOVED:                         </select>
// OLD_REMOVED:                     </div>
// OLD_REMOVED:                     <div>
// OLD_REMOVED:                         <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">General Liability:</label>
// OLD_REMOVED:                         <select style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
// OLD_REMOVED:                             <option value="">Select Limit</option>
// OLD_REMOVED:                             <option value="$1,000,000">$1,000,000</option>
// OLD_REMOVED:                             <option value="$2,000,000">$2,000,000</option>
// OLD_REMOVED:                             <option value="$5,000,000">$5,000,000</option>
// OLD_REMOVED:                             <option value="$10,000,000">$10,000,000</option>
// OLD_REMOVED:                         </select>
// OLD_REMOVED:                     </div>
// OLD_REMOVED:                     <div>
// OLD_REMOVED:                         <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Cargo Limit:</label>
// OLD_REMOVED:                         <select style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
// OLD_REMOVED:                             <option value="">Select Limit</option>
// OLD_REMOVED:                             <option value="$50,000">$50,000</option>
// OLD_REMOVED:                             <option value="$100,000">$100,000</option>
// OLD_REMOVED:                             <option value="$250,000">$250,000</option>
// OLD_REMOVED:                             <option value="$500,000">$500,000</option>
// OLD_REMOVED:                             <option value="$1,000,000">$1,000,000</option>
// OLD_REMOVED:                             <option value="Not Included">Not Included</option>
// OLD_REMOVED:                         </select>
// OLD_REMOVED:                     </div>
// OLD_REMOVED:                     <div>
// OLD_REMOVED:                         <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Cargo Deductible:</label>
// OLD_REMOVED:                         <select style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
// OLD_REMOVED:                             <option value="">Select Deductible</option>
// OLD_REMOVED:                             <option value="$1,000">$1,000</option>
// OLD_REMOVED:                             <option value="$2,500">$2,500</option>
// OLD_REMOVED:                             <option value="$5,000">$5,000</option>
// OLD_REMOVED:                             <option value="$10,000">$10,000</option>
// OLD_REMOVED:                         </select>
// OLD_REMOVED:                     </div>
// OLD_REMOVED:                 </div>
// OLD_REMOVED:                 <div style="margin-top: 15px;">
// OLD_REMOVED:                     <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Additional Coverage Notes:</label>
// OLD_REMOVED:                     <textarea style="width: 100%; min-height: 80px; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; resize: vertical;" placeholder="Enter any special coverage requirements, exclusions, or additional notes..."></textarea>
// OLD_REMOVED:                 </div>
// OLD_REMOVED:             </div>
// OLD_REMOVED: 
// OLD_REMOVED:             <!-- SAVE BUTTON -->
// OLD_REMOVED:             <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
// OLD_REMOVED:                 <button type="button" onclick="saveQuoteApplication('${leadId}')" style="background: #0066cc; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 600;">
// OLD_REMOVED:                     <i class="fas fa-save"></i> Save Quote Application
// OLD_REMOVED:                 </button>
// OLD_REMOVED:                 <button type="button" onclick="document.getElementById('quote-application-modal').remove();" style="background: #6b7280; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 600; margin-left: 15px;">
// OLD_REMOVED:                     <i class="fas fa-times"></i> Cancel
// OLD_REMOVED:                 </button>
// OLD_REMOVED:             </div>
// OLD_REMOVED:         </form>
// OLD_REMOVED:     `;
// OLD_REMOVED: 
// OLD_REMOVED:     modal.appendChild(content);
// OLD_REMOVED:     document.body.appendChild(modal);
// OLD_REMOVED: 
// OLD_REMOVED:     console.log('✅ Quote application modal created for lead:', lead.name);
// OLD_REMOVED: };

protectedFunctions.loadQuoteApplications = function(leadId) {
    console.log('📋 Loading quote applications for lead:', leadId);
    console.log('🆕 PROFILE LOAD - UPDATED CARD FORMAT - NO EDIT BUTTON, NO DATES, NO STATUS');

    const applicationsContainer = document.getElementById(`application-submissions-container-${leadId}`);
    if (!applicationsContainer) {
        console.log('❌ Applications container not found');
        return;
    }

    // Cancel any existing request for this lead
    const existingController = window.quoteApplicationControllers?.[leadId];
    if (existingController) {
        console.log('🚫 Aborting existing request for lead:', leadId);
        existingController.abort();
        delete window.quoteApplicationControllers[leadId];
    }

    // Initialize request tracking
    if (!window.quoteApplicationControllers) {
        window.quoteApplicationControllers = {};
    }

    // Prevent duplicate requests if already loading
    if (applicationsContainer.dataset.loading === 'true') {
        console.log('⏳ Already loading applications, skipping duplicate request');
        return;
    }
    applicationsContainer.dataset.loading = 'true';

    // Show loading message
    applicationsContainer.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 20px;">⏳ Loading applications...</p>';

    // Create abort controller for timeout with shorter timeout initially
    const controller = new AbortController();
    window.quoteApplicationControllers[leadId] = controller;
    const timeoutId = setTimeout(() => {
        console.log('⏰ Request timed out after 5 seconds for lead:', leadId);
        controller.abort();
    }, 5000); // Reduced to 5 second timeout for faster feedback

    // Get saved applications for this lead from server
    fetch(`/api/quote-applications?leadId=${encodeURIComponent(leadId)}`, {
        signal: controller.signal
    })
    .then(response => {
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    })
    .then(data => {
        clearTimeout(timeoutId);
        applicationsContainer.dataset.loading = 'false';
        delete window.quoteApplicationControllers[leadId];

        if (data.success) {
            const leadApplications = data.applications;

            if (leadApplications.length === 0) {
                applicationsContainer.innerHTML = '<p style="color: #9ca3af; text-align: center; padding: 20px;">No applications submitted yet</p>';
                return;
            }

            displayApplications(leadApplications, applicationsContainer);
        } else {
            applicationsContainer.innerHTML = '<p style="color: #dc3545; text-align: center; padding: 20px;">Error loading applications</p>';
        }
    })
    .catch(error => {
        clearTimeout(timeoutId);
        applicationsContainer.dataset.loading = 'false';
        delete window.quoteApplicationControllers[leadId];

        if (error.name === 'AbortError') {
            console.error('❌ Quote applications request timed out for lead:', leadId);
            applicationsContainer.innerHTML = '<p style="color: #dc3545; text-align: center; padding: 20px;">Network seems slow. <button onclick="protectedFunctions.loadQuoteApplications(\'' + leadId + '\')" style="background: #3b82f6; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; margin-left: 8px;">Try Again</button></p>';
        } else {
            console.error('Error loading applications for lead:', leadId, error);
            applicationsContainer.innerHTML = '<p style="color: #dc3545; text-align: center; padding: 20px;">Connection error. <button onclick="protectedFunctions.loadQuoteApplications(\'' + leadId + '\')" style="background: #3b82f6; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; margin-left: 8px;">Try Again</button></p>';
        }
    });

    function displayApplications(leadApplications, container) {
        // Use DocumentFragment for better performance with large lists
        const fragment = document.createDocumentFragment();

        // Process applications in chunks to prevent UI blocking
        const processChunk = (startIndex) => {
            const chunkSize = 10; // Process 10 applications at a time
            const endIndex = Math.min(startIndex + chunkSize, leadApplications.length);

            for (let i = startIndex; i < endIndex; i++) {
                const app = leadApplications[i];
                const appElement = document.createElement('div');
                appElement.style.cssText = 'border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 12px; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);';

                appElement.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                        <div>
                            <h4 style="margin: 0 0 5px 0; color: #374151; font-size: 14px;">
                                <i class="fas fa-file-signature" style="color: #10b981; margin-right: 8px;"></i>
                                Quote Application #${app.id}
                            </h4>
                        </div>
                        <div style="display: flex; gap: 5px;">
                            <button onclick="viewQuoteApplication('${app.id}')" style="background: #3b82f6; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button onclick="downloadQuoteApplication('${app.id}')" data-quote-app-pdf="true" style="background: #10b981; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                                <i class="fas fa-download"></i> Download
                            </button>
                            <button onclick="deleteQuoteApplication('${app.id}')" style="background: #ef4444; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; font-size: 12px; color: #6b7280;">
                        <div>
                            <strong style="color: #374151;">Commodities:</strong> ${app.formData?.commodities?.length || app.commodities?.length || 0}
                        </div>
                        <div>
                            <strong style="color: #374151;">Drivers:</strong> ${app.formData?.drivers?.length || app.drivers?.length || 0}
                        </div>
                        <div>
                            <strong style="color: #374151;">Trucks:</strong> ${app.formData?.trucks?.length || app.trucks?.length || 0}
                        </div>
                        <div>
                            <strong style="color: #374151;">Trailers:</strong> ${app.formData?.trailers?.length || app.trailers?.length || 0}
                        </div>
                    </div>
                `;
                fragment.appendChild(appElement);
            }

            // If there are more applications to process, schedule next chunk
            if (endIndex < leadApplications.length) {
                setTimeout(() => processChunk(endIndex), 0);
            }
        };

        // Clear container and start processing
        container.innerHTML = '';
        processChunk(0);

        console.log(`✅ Loaded ${leadApplications.length} quote applications for lead ${leadId}`);
        container.appendChild(fragment);
    }
};

protectedFunctions.addQuoteSubmission = function(leadId) {
    console.log('Add quote submission for lead:', leadId);
    // Placeholder - can be expanded later
    alert('Quote submission functionality coming soon');
};

// PROTECTION: Assign functions to window and protect from overriding
Object.keys(protectedFunctions).forEach(funcName => {
    // Set initial value
    window[funcName] = protectedFunctions[funcName];

    // Protect from overriding using defineProperty
    try {
        Object.defineProperty(window, funcName, {
            value: protectedFunctions[funcName],
            writable: false,
            configurable: false
        });
        console.log(`✅ Protected: ${funcName}`);
    } catch (e) {
        // Fallback: use regular assignment and monitor
        window[funcName] = protectedFunctions[funcName];
        console.log(`⚠️ Fallback protection: ${funcName}`);
    }
});

// Monitor for override attempts
const monitorInterval = setInterval(() => {
    Object.keys(protectedFunctions).forEach(funcName => {
        if (window[funcName] !== protectedFunctions[funcName]) {
            console.log(`🚨 Override detected for ${funcName}, restoring...`);
            window[funcName] = protectedFunctions[funcName];
        }
    });
}, 1000);

// Stop monitoring after 30 seconds
setTimeout(() => {
    clearInterval(monitorInterval);
    console.log('🛡️ Protection monitoring complete');
}, 30000);

// Email Composer Supporting Functions
protectedFunctions.removeAttachment = function(filename) {
    console.log('🗑️ Removing attachment:', filename);
    const attachmentsList = document.getElementById('attachments-list');
    if (attachmentsList) {
        // Find and remove the attachment element
        const attachmentElements = attachmentsList.querySelectorAll('[onclick*="removeAttachment"]');
        attachmentElements.forEach(element => {
            if (element.getAttribute('onclick').includes(filename)) {
                element.parentElement.remove();
            }
        });

        // Update attachment count
        const remainingAttachments = attachmentsList.querySelectorAll('[onclick*="removeAttachment"]').length;
        const label = document.querySelector('label[for="attachments-list"]');
        if (label) {
            label.textContent = `Attachments (${remainingAttachments} files):`;
        }

        console.log('✅ Attachment removed from display');
    }
};

protectedFunctions.addMoreAttachments = function(leadId) {
    console.log('📎 Adding more attachments for lead:', leadId);

    // Create file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx,.txt';
    fileInput.multiple = true;

    fileInput.onchange = function(event) {
        const files = event.target.files;
        if (files.length > 0) {
            // Process and add files to the attachments list
            const attachmentsList = document.getElementById('attachments-list');
            if (attachmentsList) {
                Array.from(files).forEach(file => {
                    const fileDiv = document.createElement('div');
                    fileDiv.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 5px; margin-bottom: 5px; background: white; border-radius: 4px; border: 1px solid #e5e7eb;';

                    const fileName = `temp_${Date.now()}_${file.name}`;
                    fileDiv.innerHTML = `
                        <div style="display: flex; align-items: center;">
                            <i class="fas fa-paperclip" style="color: #6b7280; margin-right: 8px;"></i>
                            <span style="font-size: 13px; font-weight: 500;">${file.name}</span>
                            <span style="font-size: 11px; color: #6b7280; margin-left: 8px;">(${(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button onclick="removeAttachment('${fileName}')" style="background: #ef4444; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-size: 11px;">
                            <i class="fas fa-times"></i>
                        </button>
                    `;

                    // Remove "No files attached" message if it exists
                    const noFilesMsg = attachmentsList.querySelector('p');
                    if (noFilesMsg && noFilesMsg.textContent.includes('No files attached')) {
                        noFilesMsg.remove();
                    }

                    attachmentsList.appendChild(fileDiv);
                });

                console.log('✅ Added', files.length, 'new attachments');
            }
        }
    };

    // Trigger file selection
    fileInput.click();
};

protectedFunctions.sendEmail = async function(leadId) {
    console.log('📤 Sending email for lead:', leadId);

    // Get form values
    const toField = document.getElementById('email-to-field');
    const subjectField = document.getElementById('email-subject-field');
    const bodyField = document.getElementById('email-body-field');
    const agentCcField = document.getElementById('email-agent-cc-field');

    const to = toField ? toField.value.trim() : '';
    const subject = subjectField ? subjectField.value : '';
    const body = bodyField ? bodyField.value : '';

    // Build CC list: agent email (from visible field) + always Grant silently
    const ALWAYS_CC = 'Grant@vigagency.com';
    const agentCcRaw = agentCcField ? agentCcField.value.trim() : '';
    const ccAddresses = [];
    if (agentCcRaw && agentCcRaw.toLowerCase() !== ALWAYS_CC.toLowerCase()) {
        ccAddresses.push(agentCcRaw);
    }
    ccAddresses.push(ALWAYS_CC);
    const cc = ccAddresses.join(',');

    if (!to) {
        alert('Please enter a recipient email address');
        return;
    }

    if (!subject) {
        alert('Please enter a subject line');
        return;
    }

    // Get attachment information
    const attachmentsList = document.getElementById('attachments-list');
    const attachmentElements = attachmentsList ? attachmentsList.querySelectorAll('[onclick*="removeAttachment"]') : [];
    const attachmentCount = attachmentElements.length;

    // Show confirmation
    const confirmMsg = `Send email via Vanguard Insurance?\n\nTo: ${to}\nCC: ${cc}\nSubject: ${subject}\nAttachments: ${attachmentCount} files\n\nProceed?`;

    if (!confirm(confirmMsg)) {
        return;
    }

    // Get the send button and show loading state
    const sendBtn = document.querySelector('button[onclick*="sendEmail"]');
    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    }

    try {
        // Get files from both localStorage AND server (same as openEmailDocumentation)
        let allFiles = [];

        // 1. Get files from localStorage first
        const lossRunsData = JSON.parse(localStorage.getItem('lossRunsData') || '{}');
        const localFiles = lossRunsData[leadId] || [];
        allFiles = [...localFiles];

        console.log('📧 Email send - Found', localFiles.length, 'local files for lead', leadId);

        // 2. Also get files from server
        try {
            console.log('🌐 Email send - Loading files from server for lead:', leadId);
            const response = await fetch(`/api/loss-runs-upload?leadId=${encodeURIComponent(leadId)}`);
            const serverData = await response.json();

            if (serverData.success && serverData.files.length > 0) {
                console.log('✅ Email send - Found', serverData.files.length, 'server files for lead', leadId);

                // Add server files to the list, avoiding duplicates
                serverData.files.forEach(serverFile => {
                    const existsLocally = allFiles.some(localFile =>
                        localFile.filename === serverFile.file_name ||
                        localFile.originalname === serverFile.file_name ||
                        localFile.filename === serverFile.filename ||
                        localFile.originalname === serverFile.filename
                    );

                    if (!existsLocally) {
                        // Convert server file format to match expected format (server uses file_name, file_size, etc.)
                        const originalName = serverFile.file_name ? serverFile.file_name.replace(/^[a-f0-9]+_[0-9]+_/, '') : serverFile.filename;
                        const fileSize = serverFile.file_size ? Math.round(serverFile.file_size / 1024) + ' KB' : serverFile.size;

                        allFiles.push({
                            filename: serverFile.file_name || serverFile.filename,
                            originalname: originalName,
                            originalName: originalName, // Also add this for compatibility
                            size: fileSize,
                            type: serverFile.content_type || 'application/pdf',
                            data: serverFile.data || null,
                            isServerFile: true,
                            fileId: serverFile.id
                        });
                    }
                });
            }
        } catch (error) {
            console.warn('⚠️ Email send - Failed to load server files, using local files only:', error);
        }

        console.log('📧 Email send - Total files to attach:', allFiles.length, 'files for lead', leadId);

        // Prepare attachments from all files
        const attachments = [];

        console.log('📧 Processing attachments for sending:');
        console.log('📊 All files to process:', allFiles.map((f, i) => `${i + 1}. ${f.originalname || f.filename} (Server: ${f.isServerFile}, ID: ${f.fileId})`));

        let totalSize = 0;
        let successCount = 0;
        let failureReasons = [];

        for (let i = 0; i < allFiles.length; i++) {
            const file = allFiles[i];
            console.log(`\n🔄 Processing file ${i + 1}/${allFiles.length}:`, {
                filename: file.filename,
                originalname: file.originalname,
                isServerFile: file.isServerFile,
                hasData: !!file.data,
                fileId: file.fileId,
                size: file.size
            });

            let fileData = file.data;
            let arrayBuffer = null;

            // If it's a server file without data, fetch it
            if (file.isServerFile && !fileData && file.fileId) {
                try {
                    console.log(`🔽 Fetching server file data for: ${file.filename} (ID: ${file.fileId})`);
                    const fileResponse = await fetch(`/api/loss-runs-download?fileId=${encodeURIComponent(file.fileId)}`);

                    console.log(`Server response status for ${file.filename}:`, fileResponse.status, fileResponse.statusText);

                    if (fileResponse.ok) {
                        arrayBuffer = await fileResponse.arrayBuffer();

                        // Convert large files to base64 in chunks to avoid call stack overflow
                        const uint8Array = new Uint8Array(arrayBuffer);
                        let binaryString = '';
                        const chunkSize = 8192; // Process 8KB at a time

                        for (let i = 0; i < uint8Array.length; i += chunkSize) {
                            const chunk = uint8Array.slice(i, i + chunkSize);
                            binaryString += String.fromCharCode.apply(null, chunk);
                        }

                        fileData = btoa(binaryString);
                        console.log(`✅ Downloaded server file data for: ${file.filename} (${arrayBuffer.byteLength} bytes, converted to base64: ${fileData.length} chars)`);
                    } else {
                        const reason = `HTTP ${fileResponse.status}: ${fileResponse.statusText}`;
                        console.error(`❌ Failed to download server file: ${file.filename} - ${reason}`);
                        failureReasons.push(`${file.originalname || file.filename}: ${reason}`);
                        console.log('❌ SKIPPING FILE:', file.filename);
                        continue; // Skip this attachment
                    }
                } catch (error) {
                    const reason = `Network error: ${error.message}`;
                    console.error(`❌ Error downloading server file: ${file.filename}`, error);
                    failureReasons.push(`${file.originalname || file.filename}: ${reason}`);
                    console.log('❌ SKIPPING FILE:', file.filename);
                    continue; // Skip this attachment
                }
            }

            if (fileData) {
                // Convert Base64 data to proper format for API
                const base64Data = fileData.includes(',') ? fileData.split(',')[1] : fileData;

                const attachment = {
                    filename: file.originalname || file.filename,
                    name: file.originalname || file.filename,
                    content: base64Data,
                    contentType: file.type || 'application/pdf',
                    encoding: 'base64'
                };

                attachments.push(attachment);
                successCount++;
                totalSize += (arrayBuffer ? arrayBuffer.byteLength : 0);
                console.log(`📎 Successfully added attachment ${attachments.length}:`, attachment.filename);
            } else {
                const reason = 'No file data available';
                console.warn(`⚠️ No file data available for: ${file.filename} - SKIPPING`);
                failureReasons.push(`${file.originalname || file.filename}: ${reason}`);
            }
        }

        console.log(`📧 ATTACHMENT PROCESSING SUMMARY:`);
        console.log(`   ✅ Successfully processed: ${successCount}/${allFiles.length} files`);
        console.log(`   📎 Final attachment count: ${attachments.length}`);
        console.log(`   📊 Total size: ~${Math.round(totalSize / 1024)}KB`);
        if (failureReasons.length > 0) {
            console.log(`   ❌ Failed files:`, failureReasons);
        }

        // Convert body to HTML format with new professional signature
        const htmlBody = body.replace(/\n/g, '<br>') + `
            <br><br>
            <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; font-family: Arial, Helvetica, sans-serif; color:#0B1D3A; width:100%;">
                <tbody valign="middle">
                    <tr valign="inherit">
                        <td style="padding:12px 0 10px 0;" valign="inherit">

                            <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; width: 100%;">
                                <tbody valign="middle">
                                    <tr valign="inherit">
                                        <td style="vertical-align:top;" valign="top">
                                            <div style="font-size:18px;line-height:22px;font-weight:bold;color:#1F4F8D;">Vanguard Insurance Group LLC</div>
                                            <div style="font-size:12px;line-height:16px;color:#4B5563;padding-top:2px;">Commercial Insurance Services</div>
                                        </td>
                                    </tr>
                                    <tr valign="inherit">
                                        <td style="padding-top:10px;" valign="inherit"><span style="font-size:14px;line-height:20px;">&nbsp; <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwQjFEM0EiIHN0cm9rZS13aWR0aD0iMS44IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMiAxNi45MnYzYTIgMiAwIDAgMS0yLjE4IDJBMTkuODYgMTkuODYgMCAwIDEgMTEuMTkgMTguODVBMTkuNSAxOS41IDAgMCAxIDUuMTkgMTIuODkgMTkuODYgMTkuODYgMCAwIDEgMi4wOCA0LjE4QTIgMiAwIDAgMSA0LjA2IDJoM2EyIDIgMCAwIDEgMiAxLjcyYy4xMi45LjMxIDEuNzcuNTcgMi42MWEyIDIgMCAwIDEtLjQ1IDIuMTFMOCA5LjkxYTE2IDE2IDAgMCAwIDYgNmwxLjQ2LTEuMDlhMiAyIDAgMCAxIDIuMTEtLjQ1Yy44NC4yNiAxLjcxLjQ1IDIuNjEuNTdhMiAyIDAgMCAxIDEuODIgMS45MnoiLz48L3N2Zz4=" width="16" height="16" style="vertical-align: middle; margin-right: 6px;"> <a href="tel:+13304606887" style="color:#0B1D3A;text-decoration:none;">330-460-6887</a> &bull; <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwQjFEM0EiIHN0cm9rZS13aWR0aD0iMS44IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik00IDRoMTZhMiAyIDAgMCAxIDIgMnYxMmEyIDIgMCAwIDEtMiAySDRhMiAyIDAgMCAxLTItMlY2YTIgMiAwIDAgMSAyLTJ6Ii8+PHBvbHlsaW5lIHBvaW50cz0iMjIsNiAxMiwxMyAyLDYiLz48L3N2Zz4=" width="16" height="16" style="vertical-align: middle; margin-right: 6px;"> <a href="mailto:contact@vigagency.com" style="color:#0B1D3A;text-decoration:none;">contact@vigagency.com</a> &bull; <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwQjFEM0EiIHN0cm9rZS13aWR0aD0iMS44IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIi8+PGxpbmUgeDE9IjIiIHkxPSIxMiIgeDI9IjIyIiB5Mj0iMTIiLz48cGF0aCBkPSJNMTIgMmMzIDMuNSAzIDE0IDAgMjBNMTIgMmMtMyAzLjUtMyAxNCAwIDIwIi8+PC9zdmc+" width="16" height="16" style="vertical-align: middle; margin-right: 6px;"> <a href="https://vigagency.com" target="_blank" style="color:#0B1D3A;text-decoration:none;">vigagency.com</a>&nbsp;</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                    <tr valign="inherit">
                        <td style="height:2px;background:#1F4F8D;font-size:0;line-height:0;" height="2" valign="inherit">&nbsp;</td>
                    </tr>
                    <tr valign="inherit">
                        <td style="padding-top:4px;" valign="inherit">

                            <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; background: rgb(235, 235, 236); border-right: 1px solid rgb(235, 235, 236); border-bottom: 1px solid rgb(235, 235, 236); border-left: 1px solid rgb(235, 235, 236); width: 100%;">
                                <tbody valign="middle">
                                    <tr valign="inherit">
                                        <td style="padding:12px 12px;" valign="inherit">

                                            <table cellpadding="0" cellspacing="0" width="100%">
                                                <tbody valign="middle">
                                                    <tr valign="inherit">
                                                        <td style="padding:0; vertical-align:middle;" valign="middle"><img src="https://permanent-assets-download.flockmail.com/signature/8306917/2025-10-29_e41d4e2a4c914f21beca_55689" style="width: 249px; display: inline-block; vertical-align: bottom; margin-right: 5px; margin-left: 5px;"></td>
                                                        <td align="right" style="vertical-align:middle;" valign="middle"><a href="https://vigagency.com" target="_blank" style="background:#1F4F8D;color:#ffffff;text-decoration:none;font-size:13px;line-height:18px;border-radius:999px;padding:10px 16px;display:inline-block;">&nbsp;Visit vigagency.com&nbsp;</a></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                    <tr valign="inherit">
                        <td style="font-size:10px;line-height:14px;color:#6B7280;padding-top:8px;" valign="inherit">Coverage cannot be bound or altered via email unless confirmed in writing by an authorized representative. &copy; Vanguard Insurance Group LLC.${attachments.length > 0 ? ` | Attachments: ${attachments.length} file(s)` : ''}</td>
                    </tr>
                </tbody>
            </table>
        `;

        console.log('📧 Sending email via Titan API with', attachments.length, 'attachments');

        // Send email via Titan API (same as COI system)
        const response = await fetch('/api/outlook/send-smtp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: to,
                cc: cc,
                bcc: 'contact@vigagency.com', // Always BCC ourselves
                subject: subject,
                body: htmlBody,
                attachments: attachments
            })
        });

        if (!response.ok) {
            let errorMessage = 'Failed to send email';

            if (response.status === 413) {
                errorMessage = 'Email too large - attachments may exceed size limit (100MB max)';
            } else {
                try {
                    const error = await response.json();
                    errorMessage = error.error || errorMessage;
                } catch (jsonError) {
                    // Response is not JSON (likely HTML error page)
                    const errorText = await response.text();
                    if (errorText.includes('Request Entity Too Large')) {
                        errorMessage = 'Email too large - attachments may exceed size limit (100MB max)';
                    } else {
                        errorMessage = `Server error (${response.status}): ${response.statusText}`;
                    }
                }
            }

            throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log('✅ Email sent successfully:', result.messageId);

        // Update reach out count
        protectedFunctions.updateReachOut(leadId, 'email', true);

        // Update lead stage to "app sent" after successful email
        try {
            console.log('🎯 Auto-updating stage to "app sent" after successful email for lead:', leadId);
            protectedFunctions.updateLeadStage(leadId, 'app_sent');
            console.log('✅ Stage updated successfully to app_sent for lead:', leadId);
        } catch (stageError) {
            console.error('❌ Error updating stage to app_sent:', stageError);
        }

        // Show success message
        alert(`Email sent successfully!\n\nTo: ${to}\nSubject: ${subject}\nAttachments: ${attachments.length} files\nMessage ID: ${result.messageId}`);

        // Close composer
        document.getElementById('email-composer-modal').remove();

        console.log('✅ Email sent via Titan API with attachments');

    } catch (error) {
        console.error('❌ Error sending email:', error);
        alert(`Failed to send email: ${error.message}`);

        // Restore send button
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Email';
        }
    }
};

// Storage management function
protectedFunctions.clearLossRunsStorage = function() {
    if (confirm('Clear all locally stored loss runs metadata? This will free up storage space but remove file tracking.')) {
        localStorage.removeItem('loss_runs');
        console.log('✅ Loss runs storage cleared');
        alert('Storage cleared. Refresh any open profiles to see updated loss runs sections.');
    }
};

console.log('🔥 PROTECTED-FINAL-PROFILE-FIX: All functions protected and available');
console.log('🔥 Available functions:', {
    'createEnhancedProfile': typeof window.createEnhancedProfile,
    'viewLead': typeof window.viewLead,
    'showLeadProfile': typeof window.showLeadProfile,
    'updateLeadField': typeof window.updateLeadField,
    'openEmailDocumentation': typeof window.openEmailDocumentation,
    'checkFilesAndOpenEmail': typeof window.checkFilesAndOpenEmail,
    'openLossRunsUpload': typeof window.openLossRunsUpload,
    'updateReachOut': typeof window.updateReachOut,
    'updateLeadStage': typeof window.updateLeadStage,
    'showNotification': typeof window.showNotification,
    'clearLossRunsStorage': typeof window.clearLossRunsStorage,
    'createEmailComposer': typeof window.createEmailComposer,
    'removeAttachment': typeof window.removeAttachment,
    'addMoreAttachments': typeof window.addMoreAttachments,
    'sendEmail': typeof window.sendEmail
});

// Function to immediately update stage badge in the table
function updateStageBadgeInTable(leadId, newStage) {
    console.log(`🏷️ Updating stage badge for lead ${leadId} to: ${newStage}`);

    // Find the lead row in the table
    const leadRow = document.querySelector(`tr[data-lead-id="${leadId}"]`);
    if (leadRow) {
        // Find the stage cell (usually column 6, but let's be more specific)
        const stageBadge = leadRow.querySelector('.stage-badge');
        if (stageBadge) {
            // Update the stage class and text
            stageBadge.className = `stage-badge stage-${newStage.replace(/_/g, '-')}`;

            // Update the stage text using formatStageName if available
            if (typeof window.formatStageName === 'function') {
                stageBadge.textContent = window.formatStageName(newStage);
            } else {
                // Fallback: capitalize and replace underscores
                stageBadge.textContent = newStage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }

            console.log(`✅ Stage badge updated immediately for lead ${leadId}: ${newStage}`);
        } else {
            console.warn(`⚠️ Stage badge not found for lead ${leadId}`);
        }
    } else {
        console.warn(`⚠️ Lead row not found for lead ${leadId}`);
    }
}

// Function to refresh the leads table when modal closes
function refreshLeadsTable() {
    console.log('🔄 Refreshing leads table after profile changes...');

    // Force use localStorage data to avoid server delay
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    console.log('🔍 Using localStorage data for immediate refresh:', leads.length, 'leads');

    // Try multiple methods to refresh the leads display
    if (window.displayLeads && typeof window.displayLeads === 'function') {
        window.displayLeads();
        console.log('✅ Refreshed using displayLeads()');
    } else if (window.loadLeadsView && typeof window.loadLeadsView === 'function') {
        // Store current leads to ensure localStorage is up to date
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        window.loadLeadsView();
        console.log('✅ Refreshed using loadLeadsView()');
    } else if (document.querySelector('.data-table tbody')) {
        // Force reload leads from localStorage and server
        loadLeadsFromServerAndRefresh();
        console.log('✅ Forced reload from server');
    } else {
        console.log('❌ No refresh method available');
    }

    // CRITICAL: After table refresh, enforce green highlight removal rule
    // GREEN HIGHLIGHT ONLY APPLIES WHEN NO TO DO TEXT IS PRESENT
    setTimeout(() => {
        console.log('🧹 CLEANUP: Enforcing TO DO text vs green highlight rule...');
        enforceGreenHighlightRule();
    }, 500);
}

// Function to enforce the rule: GREEN HIGHLIGHT ONLY WHEN NO TO DO TEXT
function enforceGreenHighlightRule() {
    console.log('🔍 Starting comprehensive green highlight rule enforcement...');

    // Find all table rows with data-lead-id
    const tableRows = document.querySelectorAll('tr[data-lead-id]');
    let cleanupCount = 0;
    let totalChecked = 0;

    tableRows.forEach((row, index) => {
        const leadId = row.getAttribute('data-lead-id');
        totalChecked++;

        // Find the TO DO cell (usually column 6 or 7)
        const cells = row.querySelectorAll('td');
        let todoText = '';
        let todoCell = null;

        // Try to find TO DO cell by checking multiple columns
        for (let i = 5; i < cells.length; i++) {
            const cellText = (cells[i]?.textContent || '').trim().toLowerCase();
            if (cellText.includes('to do') || cellText.includes('todo') ||
                cellText.includes('call') || cellText.includes('email') || cellText.includes('text') ||
                cells[i]?.innerHTML?.includes('TO DO')) {
                todoCell = cells[i];
                todoText = (cells[i]?.textContent || '').trim();
                break;
            }
        }

        // If no specific TO DO cell found, check around column 6 (common TO DO column)
        if (!todoCell && cells[6]) {
            todoCell = cells[6];
            todoText = (cells[6]?.textContent || '').trim();
        }

        console.log(`Row ${index}: Lead ${leadId}, TO DO: "${todoText}" (length: ${todoText.length})`);

        // Check if row has green highlighting
        const hasGreenHighlight =
            row.classList.contains('reach-out-complete') ||
            row.classList.contains('force-green-highlight') ||
            (row.style.backgroundColor && (
                row.style.backgroundColor.includes('16, 185, 129') ||
                row.style.backgroundColor.includes('rgb(16, 185, 129)') ||
                row.style.backgroundColor.includes('rgba(16, 185, 129')
            )) ||
            (row.getAttribute('style') && row.getAttribute('style').includes('16, 185, 129'));

        // If row has TO DO text AND green highlighting, remove the green highlight
        if (todoText && todoText.length > 0 &&
            !todoText.toLowerCase().includes('completed') &&
            !todoText.toLowerCase().includes('process complete') &&
            hasGreenHighlight) {

            console.log(`🔴 RULE VIOLATION: Lead ${leadId} has TO DO text "${todoText}" but green highlight - REMOVING GREEN`);

            // Remove green highlighting
            row.classList.remove('reach-out-complete', 'force-green-highlight');

            if (row.style.backgroundColor.includes('16, 185, 129') ||
                row.style.backgroundColor.includes('rgb(16, 185, 129)') ||
                row.style.backgroundColor.includes('rgba(16, 185, 129')) {

                row.style.removeProperty('background-color');
                row.style.removeProperty('background');
                row.style.removeProperty('border-left');
                row.style.removeProperty('border-right');
            }

            // Check if style attribute is now empty
            const remainingStyle = row.getAttribute('style');
            if (!remainingStyle || remainingStyle.trim() === '') {
                row.removeAttribute('style');
            }

            cleanupCount++;
        } else if (hasGreenHighlight) {
            console.log(`✅ Lead ${leadId} has green highlight and ${todoText ? 'completion' : 'empty TO DO'} - OK`);
        } else if (todoText && todoText.length > 0) {
            console.log(`ℹ️ Lead ${leadId} has TO DO text "${todoText}" and no green highlight - OK`);
        }
    });

    console.log(`🧹 CLEANUP COMPLETE: Checked ${totalChecked} rows, fixed ${cleanupCount} green highlight violations`);
}

// Function to load leads from server and refresh display (SMART MERGE VERSION)
async function loadLeadsFromServerAndRefresh() {
    console.log('🔄 SMART loadLeadsFromServerAndRefresh called - using protective merge...');

    try {
        // Load fresh data from server
        const response = await fetch('/api/leads');
        if (response.ok) {
            const serverLeads = await response.json();
            console.log(`📥 Received ${serverLeads.length} leads from server`);

            // SMART MERGE: Preserve local changes while adding new leads
            const existingLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            const mergedLeads = [...existingLeads];
            const now = Date.now();

            console.log('🧠 SMART SERVER REFRESH: Starting protective merge process...');

            // Track what we're doing
            let addedCount = 0;
            let preservedCount = 0;
            let updatedCount = 0;

            serverLeads.forEach(serverLead => {
                const localLeadIndex = mergedLeads.findIndex(localLead =>
                    String(localLead.id) === String(serverLead.id)
                );

                if (localLeadIndex === -1) {
                    // New lead from server - add it
                    console.log('➕ Adding new lead from server:', serverLead.name);
                    mergedLeads.push(serverLead);
                    addedCount++;
                } else {
                    const localLead = mergedLeads[localLeadIndex];

                    // Check if local lead has recent changes (within last 10 minutes)
                    const hasRecentChanges = localLead.lastModified &&
                        (now - new Date(localLead.lastModified).getTime()) < (10 * 60 * 1000);

                    // Check if stage or other important fields were changed locally
                    const hasLocalStageChange = localLead.stage !== serverLead.stage;
                    const hasLocalNameChange = localLead.name !== serverLead.name;
                    const hasLocalPhoneChange = localLead.phone !== serverLead.phone;

                    if (hasRecentChanges || hasLocalStageChange || hasLocalNameChange || hasLocalPhoneChange) {
                        // PRESERVE local changes - don't overwrite
                        console.log(`🛡️ PROTECTING: Lead ${localLead.name} (stage: ${localLead.stage} vs server: ${serverLead.stage})`);

                        // Only update non-critical fields from server, keep important local changes
                        mergedLeads[localLeadIndex] = {
                            ...serverLead,  // Server data as base
                            ...localLead,  // Local changes override
                            // But allow some server updates if they don't conflict
                            updatedAt: serverLead.updatedAt || localLead.updatedAt,
                            // Keep local lastModified to track our changes
                            lastModified: localLead.lastModified || new Date().toISOString()
                        };
                        preservedCount++;
                    } else {
                        // No recent local changes - safe to update with server data
                        mergedLeads[localLeadIndex] = {
                            ...localLead,
                            ...serverLead,
                            lastModified: new Date().toISOString()
                        };
                        updatedCount++;
                    }
                }
            });

            console.log(`🧠 SMART SERVER REFRESH COMPLETE: Added ${addedCount}, Preserved ${preservedCount}, Updated ${updatedCount}`);
            console.log(`🛡️ PROTECTION ACTIVE: Local changes saved from server overwrite!`);

            // Save the smartly merged data
            localStorage.setItem('insurance_leads', JSON.stringify(mergedLeads));

            // Trigger display refresh
            if (window.displayLeads) {
                window.displayLeads();
            } else if (window.loadLeadsView) {
                window.loadLeadsView();
            }

            console.log('✅ Leads refreshed from server with smart merge protection');
        }
    } catch (error) {
        console.error('❌ Error refreshing leads from server:', error);
    }
}

// Function to update stage timestamp display in real-time
function updateStageTimestampDisplay(leadId, stageUpdatedAt) {
    const timestampElement = document.getElementById(`stage-timestamp-${leadId}`);
    if (timestampElement) {
        const now = new Date();
        const updated = new Date(stageUpdatedAt);
        const daysDiff = Math.floor((now - updated) / (1000 * 60 * 60 * 24));

        // Calculate color based on stage age - URGENT TIMELINE
        let ageColor;
        if (daysDiff >= 3) ageColor = 'red';    // 3+ days = RED (urgent)
        else if (daysDiff >= 2) ageColor = 'orange';  // 2 days = ORANGE
        else if (daysDiff >= 1) ageColor = 'yellow';  // 1 day = YELLOW
        else ageColor = 'green';  // Today = GREEN

        // Map color names to background colors for pills
        const colorMap = {
            'green': '#10b981',
            'yellow': '#eab308',
            'orange': '#f59e0b',
            'red': '#dc2626'
        };

        const backgroundColor = colorMap[ageColor] || '#10b981';

        // Show actual date/time instead of relative time
        const timeText = updated.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: updated.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        // Update the pill appearance
        timestampElement.style.backgroundColor = backgroundColor;
        timestampElement.textContent = timeText;

        console.log('✅ Stage timestamp display updated:', timeText);
    }
}

// Helper function to sync lead data to server
function syncLeadToServer(leadId, leadData) {
    fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(leadData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('✅ Lead data synced to server');
        } else {
            console.error('❌ Server sync failed:', data.error);
        }
    })
    .catch(error => {
        console.error('❌ Server sync error:', error);
    });
}

// Make functions globally available for onclick handlers
window.updateLeadField = protectedFunctions.updateLeadField;
window.updateLeadStage = protectedFunctions.updateLeadStage;
window.updateLeadAssignedTo = protectedFunctions.updateLeadAssignedTo;
window.updateLeadStatus = protectedFunctions.updateLeadStatus;
window.updateLeadPriority = protectedFunctions.updateLeadPriority;
window.updateWinLossStatus = protectedFunctions.updateWinLossStatus;
window.removeAttachment = protectedFunctions.removeAttachment;
window.addMoreAttachments = protectedFunctions.addMoreAttachments;
window.sendEmail = protectedFunctions.sendEmail;
window.openCallRecordingUpload = protectedFunctions.openCallRecordingUpload;

// Handle Contact Attempted completion
window.handleContactAttemptedCompletion = async function(leadId) {
    console.log('🎯 Auto-completing Contact Attempted reach-out for lead:', leadId);

    try {
        // Get leads from localStorage
        let insurance_leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        let regular_leads = JSON.parse(localStorage.getItem('leads') || '[]');

        // Find the lead
        let lead = insurance_leads.find(l => String(l.id) === String(leadId)) ||
                  regular_leads.find(l => String(l.id) === String(leadId));

        if (!lead) {
            console.log('⚡ Lead not found locally, refreshing from server...');
            try {
                // Refresh leads from server if lead not found locally
                if (typeof loadLeadsFromServerAndRefresh === 'function') {
                    await loadLeadsFromServerAndRefresh();
                }

                // Try again after refresh
                insurance_leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                regular_leads = JSON.parse(localStorage.getItem('leads') || '[]');
                lead = insurance_leads.find(l => String(l.id) === String(leadId)) ||
                      regular_leads.find(l => String(l.id) === String(leadId));
            } catch (error) {
                console.error('❌ Error refreshing leads from server:', error);
            }
        }

        if (!lead) {
            console.error('Lead not found for ID:', leadId);
            return;
        }

        // Initialize reach-out data if it doesn't exist
        if (!lead.reachOut) {
            lead.reachOut = {
                callAttempts: 0,
                callsConnected: 0,
                emailCount: 0,
                textCount: 0,
                voicemailCount: 0,
                callLogs: []
            };
        }

        // Increment call attempts by 1 (no pickup means connected stays at 0)
        lead.reachOut.callAttempts += 1;

        // Mark reach-out as FORCE COMPLETED with current timestamp
        const completedAt = new Date().toISOString();
        lead.reachOut.reachOutCompletedAt = completedAt;
        lead.reachOut.completedAt = completedAt;

        // Force complete all reach-out activities to bypass sequential todos
        lead.reachOut.emailCount = 1;  // Mark email as sent
        lead.reachOut.textCount = 1;   // Mark text as sent
        lead.reachOut.emailSent = true;
        lead.reachOut.textSent = true;
        lead.reachOut.callMade = true;

        // Ensure callLogs array exists before pushing
        if (!lead.reachOut.callLogs) {
            lead.reachOut.callLogs = [];
        }

        // Add a call log entry
        lead.reachOut.callLogs.push({
            timestamp: completedAt,
            connected: false, // No pickup, so not connected
            duration: null,
            leftVoicemail: false,
            notes: 'Contact attempted - No pickup (auto-generated)'
        });

        // Set 1-day green highlighting
        const oneDayFromNow = new Date();
        oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
        lead.greenUntil = oneDayFromNow.toISOString();

        // Also set in reachOut for consistency
        if (!lead.reachOut) lead.reachOut = {};
        lead.reachOut.greenHighlightUntil = oneDayFromNow.toISOString();

        // Update the lead in both storage locations
        const insuranceIndex = insurance_leads.findIndex(l => String(l.id) === String(leadId));
        if (insuranceIndex !== -1) {
            insurance_leads[insuranceIndex] = lead;
            localStorage.setItem('insurance_leads', JSON.stringify(insurance_leads));
        }

        const regularIndex = regular_leads.findIndex(l => String(l.id) === String(leadId));
        if (regularIndex !== -1) {
            regular_leads[regularIndex] = lead;
            localStorage.setItem('leads', JSON.stringify(regular_leads));
        }

        console.log('✅ Contact Attempted reach-out completed:', {
            leadId: leadId,
            attempts: lead.reachOut.callAttempts,
            completedAt: completedAt,
            greenUntil: lead.greenUntil
        });

        // Show notification
        if (window.showNotification) {
            showNotification('Contact attempt recorded! Lead highlighted green for 1 day.', 'success');
        }

        // Force refresh the lead profile to show updated data
        if (window.createEnhancedProfile) {
            setTimeout(() => {
                window.createEnhancedProfile(lead);
            }, 1000);
        }

        // CALLBACK COMPLETION: Complete any active callbacks for this lead
        if (typeof window.completeCallback === 'function') {
            console.log('✅ CALLBACK COMPLETION: Completing scheduled callbacks for lead', leadId);
            window.completeCallback(leadId, true);
        } else {
            console.log('⚠️  CALLBACK COMPLETION: completeCallback function not available');
        }

    } catch (error) {
        console.error('Error completing Contact Attempted reach-out:', error);
        if (window.showNotification) {
            showNotification('Error recording contact attempt', 'error');
        }
    }
};

// Vehicle, Trailer, Driver management functions
window.addVehicleToLead = protectedFunctions.addVehicleToLead;
window.addTrailerToLead = protectedFunctions.addTrailerToLead;
window.addDriverToLead = protectedFunctions.addDriverToLead;

// Define the individual card management functions directly
window.addVehicle = function(leadId) {
    console.log('addVehicle called for lead:', leadId);
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));
    if (lead) {
        if (!lead.vehicles) lead.vehicles = [];
        const newVehicle = {
            year: '',
            make: '',
            model: '',
            vin: '',
            value: '',
            deductible: '',
            type: '',
            gvwr: ''
        };
        lead.vehicles.push(newVehicle);
        localStorage.setItem('insurance_leads', JSON.stringify(leads));

        // Sync to server
        syncLeadToServer(leadId, { vehicles: lead.vehicles });

        // Refresh the lead profile to show new card
        if (window.showLeadProfile) {
            window.showLeadProfile(leadId);
        }
        console.log('✅ Vehicle added successfully');
    }
};

window.addTrailer = function(leadId) {
    console.log('addTrailer called for lead:', leadId);
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));
    if (lead) {
        if (!lead.trailers) lead.trailers = [];
        const newTrailer = {
            year: '',
            make: '',
            type: '',
            vin: '',
            length: '',
            value: '',
            deductible: ''
        };
        lead.trailers.push(newTrailer);
        localStorage.setItem('insurance_leads', JSON.stringify(leads));

        // Sync to server
        syncLeadToServer(leadId, { trailers: lead.trailers });

        // Refresh the lead profile to show new card
        if (window.showLeadProfile) {
            window.showLeadProfile(leadId);
        }
        console.log('✅ Trailer added successfully');
    }
};

window.addDriver = function(leadId) {
    console.log('addDriver called for lead:', leadId);
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));
    if (lead) {
        if (!lead.drivers) lead.drivers = [];
        lead.drivers.push({
            name: '',
            license: '',
            dob: '',
            hireDate: '',
            experience: '',
            violations: ''
        });
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        // Refresh the lead profile to show new card
        if (window.showLeadProfile) {
            window.showLeadProfile(leadId);
        }
        console.log('✅ Driver added successfully');
    }
};

// Update functions for the cards
window.updateVehicle = function(leadId, vehicleIndex, field, value) {
    console.log('updateVehicle:', leadId, vehicleIndex, field, value);
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));
    if (lead && lead.vehicles && lead.vehicles[vehicleIndex]) {
        lead.vehicles[vehicleIndex][field] = value;
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        console.log('✅ Vehicle updated');
    }
};

window.updateTrailer = function(leadId, trailerIndex, field, value) {
    console.log('updateTrailer:', leadId, trailerIndex, field, value);
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));
    if (lead && lead.trailers && lead.trailers[trailerIndex]) {
        lead.trailers[trailerIndex][field] = value;
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        console.log('✅ Trailer updated');
    }
};

window.updateDriver = function(leadId, driverIndex, field, value) {
    console.log('updateDriver:', leadId, driverIndex, field, value);
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));
    if (lead && lead.drivers && lead.drivers[driverIndex]) {
        lead.drivers[driverIndex][field] = value;
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        console.log('✅ Driver updated');
    }
};

// Remove functions for the cards
window.removeVehicle = function(leadId, vehicleIndex) {
    console.log('removeVehicle:', leadId, vehicleIndex);
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));
    if (lead && lead.vehicles && lead.vehicles[vehicleIndex] !== undefined) {
        lead.vehicles.splice(vehicleIndex, 1);
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        // Refresh the lead profile
        if (window.showLeadProfile) {
            window.showLeadProfile(leadId);
        }
        console.log('✅ Vehicle removed');
    }
};

window.removeTrailer = function(leadId, trailerIndex) {
    console.log('removeTrailer:', leadId, trailerIndex);
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));
    if (lead && lead.trailers && lead.trailers[trailerIndex] !== undefined) {
        lead.trailers.splice(trailerIndex, 1);
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        // Refresh the lead profile
        if (window.showLeadProfile) {
            window.showLeadProfile(leadId);
        }
        console.log('✅ Trailer removed');
    }
};

window.removeDriver = function(leadId, driverIndex) {
    console.log('removeDriver:', leadId, driverIndex);
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));
    if (lead && lead.drivers && lead.drivers[driverIndex] !== undefined) {
        lead.drivers.splice(driverIndex, 1);
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        // Refresh the lead profile
        if (window.showLeadProfile) {
            window.showLeadProfile(leadId);
        }
        console.log('✅ Driver removed');
    }
};

// Quote Application Display Function
window.showApplicationSubmissions = function(leadId) {
    console.log('📋 showApplicationSubmissions called for lead:', leadId);
    console.log('🆕 UPDATED CARD FORMAT - VERSION 1003 - NO EDIT BUTTON, NO DATES, NO STATUS');

    const containerId = `application-submissions-container-${leadId}`;
    const container = document.getElementById(containerId);

    if (!container) {
        console.error('❌ Application submissions container not found:', containerId);
        return;
    }

    // Get saved applications for this lead
    // Show loading message
    container.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 20px;">⏳ Loading applications...</p>';

    // Get saved applications for this lead from server
    fetch(`/api/quote-applications?leadId=${encodeURIComponent(leadId)}`)
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const leadApplications = data.applications;
            console.log('📋 Found', leadApplications.length, 'applications for lead', leadId);

            if (leadApplications.length === 0) {
                container.innerHTML = '<p style="color: #9ca3af; text-align: center; padding: 20px;">No applications submitted yet</p>';
                return;
            }

            displayDetailedApplications(leadApplications, container);
        } else {
            container.innerHTML = '<p style="color: #dc3545; text-align: center; padding: 20px;">Error loading applications</p>';
        }
    })
    .catch(error => {
        console.error('Error loading applications:', error);
        container.innerHTML = '<p style="color: #dc3545; text-align: center; padding: 20px;">Error loading applications</p>';
    });

    function displayDetailedApplications(leadApplications, container) {
        // Display applications using detailed format
    let applicationsHTML = '';
    leadApplications.forEach((app, index) => {
        applicationsHTML += `
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 12px; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                    <div>
                        <h4 style="margin: 0 0 5px 0; color: #374151; font-size: 14px;">
                            <i class="fas fa-file-signature" style="color: #10b981; margin-right: 8px;"></i>
                            Quote Application #${app.id}
                        </h4>
                    </div>
                    <div style="display: flex; gap: 5px;">
                        <button onclick="viewQuoteApplication('${app.id}')" style="background: #3b82f6; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button onclick="downloadQuoteApplication('${app.id}')" data-quote-app-pdf="true" style="background: #10b981; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                            <i class="fas fa-download"></i> Download
                        </button>
                        <button onclick="deleteQuoteApplication('${app.id}')" style="background: #ef4444; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; font-size: 12px; color: #6b7280;">
                    <div>
                        <strong style="color: #374151;">Commodities:</strong> ${app.formData?.commodities?.length || app.commodities?.length || 0}
                    </div>
                    <div>
                        <strong style="color: #374151;">Drivers:</strong> ${app.formData?.drivers?.length || app.drivers?.length || 0}
                    </div>
                    <div>
                        <strong style="color: #374151;">Trucks:</strong> ${app.formData?.trucks?.length || app.trucks?.length || 0}
                    </div>
                    <div>
                        <strong style="color: #374151;">Trailers:</strong> ${app.formData?.trailers?.length || app.trailers?.length || 0}
                    </div>
                </div>
            </div>
        `;
    });

        container.innerHTML = applicationsHTML;
        console.log('✅ Applications display updated successfully');
    }
};

// Quote Application Management Functions
window.viewQuoteApplication = function(appId) {
    console.log('📄 Viewing quote application:', appId);

    // Clean up any existing modals before creating new ones - but NOT application submissions containers
    const existingModals = document.querySelectorAll('#quote-application-modal, [id*="quote-modal"], [id*="application-modal"], .modal-overlay');
    existingModals.forEach(modal => {
        // Don't remove Application Submissions containers or cards
        if (!modal.id.includes('application-submissions-container') &&
            (modal.id !== 'quote-application-modal' || modal.style.display === 'none')) {
            modal.remove();
            console.log('🧹 Cleaned up existing modal:', modal.id || modal.className);
        }
    });

    // Get the application data from server
    fetch(`/api/quote-applications/${appId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const application = data.application;
                console.log('📄 Found application data:', application);

                // Set up editing mode and global data for the form to access
                window.editingApplicationId = appId;
                window.editingApplicationData = application;

                // Open the original quote application form
                console.log('📋 Attempting to open view for leadId:', application.leadId);
                if (typeof window.createQuoteApplicationSimple === 'function') {
                    console.log('✅ createQuoteApplicationSimple found, opening view...');
                    try {
                        window.createQuoteApplicationSimple(application.leadId);
                        console.log('✅ View opened successfully');
                    } catch (error) {
                        console.error('❌ Error opening view:', error);
                        alert('Error opening application view. Please try again.');
                    }
                } else {
                    console.error('❌ createQuoteApplicationSimple function not available');
                    console.log('Available window functions:', Object.keys(window).filter(key => key.includes('Quote')));
                    alert('Unable to open application form. Function not found.');
                }
            } else {
                alert('Application not found');
            }
        })
        .catch(error => {
            console.error('❌ View error:', error);
            alert('Error loading application. Please try again.');
        });
};

window.downloadQuoteApplication = function(appId) {
    console.log('📥 Downloading quote application:', appId);

    // Clean up any existing modals before creating new ones - but NOT application submissions containers
    const existingModals = document.querySelectorAll('#quote-application-modal, [id*="quote-modal"], [id*="application-modal"], .modal-overlay');
    existingModals.forEach(modal => {
        // Don't remove Application Submissions containers or cards
        if (!modal.id.includes('application-submissions-container') &&
            (modal.id !== 'quote-application-modal' || modal.style.display === 'none')) {
            modal.remove();
            console.log('🧹 Cleaned up existing modal:', modal.id || modal.className);
        }
    });

    // Get the application data from server
    fetch(`/api/quote-applications/${appId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const application = data.application;
                console.log('📥 Found application data for download:', application);

                // Set up editing mode and global data for the form to access
                window.editingApplicationId = appId;
                window.editingApplicationData = application;

                // Open the application first
                console.log('📋 Checking if createQuoteApplicationSimple function exists...');
                if (typeof window.createQuoteApplicationSimple === 'function') {
                    console.log('✅ createQuoteApplicationSimple found, opening modal...');
                    try {
                        window.createQuoteApplicationSimple(application.leadId);
                        console.log('✅ Modal creation called successfully');
                    } catch (error) {
                        console.error('❌ Error opening modal:', error);
                        alert('Error opening application modal. Please try again.');
                        return;
                    }

                    // Wait a moment for the modal to open, then trigger direct download with timeout
                    let downloadTimeout;
                    let downloadCompleted = false;

                    downloadTimeout = setTimeout(() => {
                        if (!downloadCompleted) {
                            console.error('⏰ Download process timed out after 10 seconds');
                            alert('Download is taking too long. Please try again or use the View button first.');
                        }
                    }, 10000);

                    setTimeout(() => {
                        console.log('📥 Triggering direct download after modal opened...');

                        // Call the application download directly, bypassing any ACORD conflicts
                        const modal = document.getElementById('quote-application-modal');
                        console.log('📋 Modal element found:', !!modal);
                        console.log('📋 downloadQuoteApplicationPDF function exists:', typeof window.downloadQuoteApplicationPDF);

                        if (modal && typeof window.downloadQuoteApplicationPDF === 'function') {
                            console.log('✅ Both modal and download function available, proceeding...');
                            try {
                                // Temporarily disable any ACORD functions that might interfere
                                const originalDownloadACORD = window.downloadACORD;
                                window.downloadACORD = function() {
                                    console.log('🚫 ACORD download blocked during application download');
                                    return false;
                                };

                                // Call the application download
                                window.downloadQuoteApplicationPDF();
                                console.log('✅ Download function called successfully');
                                downloadCompleted = true;
                                clearTimeout(downloadTimeout);

                                // Restore ACORD function after a delay
                                setTimeout(() => {
                                    window.downloadACORD = originalDownloadACORD;
                                    console.log('🔄 ACORD function restored');
                                }, 3000);
                            } catch (error) {
                                console.error('❌ Error during download process:', error);
                                downloadCompleted = true;
                                clearTimeout(downloadTimeout);
                                alert('Error during download. Please try again.');
                            }
                        } else {
                            console.error('❌ Quote application modal not found or download function not available');
                            console.log('Modal:', modal);
                            console.log('Download function type:', typeof window.downloadQuoteApplicationPDF);
                            downloadCompleted = true;
                            clearTimeout(downloadTimeout);
                            alert('Download function not available. Please try viewing the application first.');
                        }
                    }, 500);
                } else {
                    console.error('❌ createQuoteApplicationSimple function not available');
                    console.log('Available window functions:', Object.keys(window).filter(key => key.includes('Quote')));
                    alert('Unable to open application for download. Function not found.');
                }
            } else {
                alert('Application not found');
            }
        })
        .catch(error => {
            console.error('❌ Download error:', error);
            alert('Error loading application for download. Please try again.');
        });
};

window.editQuoteApplication = function(appId) {
    console.log('✏️ Editing quote application:', appId);
    alert('Edit application functionality coming soon');
};

window.deleteQuoteApplication = function(appId) {
    console.log('🗑️ DELETE FUNCTION CALLED:', appId);
    if (confirm('Are you sure you want to delete this quote application?')) {
        console.log('🗑️ User confirmed delete, proceeding...');

        // Delete from server
        fetch(`/api/quote-applications/${appId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('✅ Quote application deleted from server');
                // Refresh the applications display
                const leadProfileModal = document.getElementById('lead-profile-container');
                const currentLead = window.currentViewingLead || (leadProfileModal && leadProfileModal.dataset.leadId);
                console.log('🔄 Attempting to refresh applications for lead:', currentLead);

                if (currentLead) {
                    console.log('🔄 Calling protectedFunctions.loadQuoteApplications...');

                    // Add timeout for refresh operation to prevent hanging
                    let refreshCompleted = false;
                    const refreshTimeout = setTimeout(() => {
                        if (!refreshCompleted) {
                            console.error('⏰ Refresh operation timed out after 8 seconds');
                            alert('Application deleted but refresh took too long. Please close and reopen the profile to see changes.');
                        }
                    }, 8000);

                    try {
                        protectedFunctions.loadQuoteApplications(currentLead);
                        console.log('✅ Successfully called loadQuoteApplications');

                        // Mark as completed after a short delay
                        setTimeout(() => {
                            refreshCompleted = true;
                            clearTimeout(refreshTimeout);
                            console.log('✅ Refresh operation completed successfully');
                        }, 1000);

                    } catch (error) {
                        console.error('❌ Error in loadQuoteApplications:', error);
                        refreshCompleted = true;
                        clearTimeout(refreshTimeout);
                        alert('Application deleted but failed to refresh the list. Please close and reopen the profile.');
                    }
                } else {
                    console.warn('⚠️ No current lead found to refresh applications');
                    alert('Application deleted successfully. Please close and reopen the profile to see changes.');
                }
            } else {
                alert('Error deleting application: ' + data.error);
            }
        })
        .catch(error => {
            console.error('❌ Delete error:', error);
            alert('Error deleting application. Please try again.');
        });
    } else {
        console.log('🗑️ Delete cancelled by user');
    }
};

// Quote Application Supporting Functions
window.addDriverRow = function() {
    console.log('🚛 addDriverRow called');
    const container = document.getElementById('drivers-container');
    if (!container) {
        console.log('❌ drivers-container not found');
        return;
    }
    console.log('✅ Found drivers-container, adding row...');

    const newRow = document.createElement('div');
    newRow.className = 'driver-row';
    newRow.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 2fr auto; gap: 10px; align-items: end; margin-bottom: 15px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px; background: #f9fafb;';

    newRow.innerHTML = `
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Name:</label>
            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Date of Birth:</label>
            <input type="date" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">License #:</label>
            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">State:</label>
            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Years Exp:</label>
            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Hire Date:</label>
            <input type="date" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Accidents/Violations:</label>
            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div style="display: flex; align-items: end;">
            <button type="button" onclick="removeDriverRow(this)" style="background: #ef4444; color: white; border: none; padding: 6px; border-radius: 4px; cursor: pointer;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    container.appendChild(newRow);
    console.log('✅ Added new driver row');
};

window.removeDriverRow = function(button) {
    const row = button.closest('.driver-row');
    if (row) {
        row.remove();
        console.log('✅ Removed driver row');
    }
};

window.addTruckRow = function() {
    const container = document.getElementById('trucks-container');
    if (!container) return;

    const newRow = document.createElement('div');
    newRow.className = 'truck-row';
    newRow.style.cssText = 'display: grid; grid-template-columns: 1fr 2fr 1fr 2fr 1fr 1fr auto; gap: 10px; align-items: end; margin-bottom: 15px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px; background: #f9fafb;';

    newRow.innerHTML = `
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Year:</label>
            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Make/Model:</label>
            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Type:</label>
            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">VIN:</label>
            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Value:</label>
            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Radius:</label>
            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div style="display: flex; align-items: end;">
            <button type="button" onclick="removeTruckRow(this)" style="background: #ef4444; color: white; border: none; padding: 6px; border-radius: 4px; cursor: pointer;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    container.appendChild(newRow);
    console.log('✅ Added new truck row');
};

window.removeTruckRow = function(button) {
    const row = button.closest('.truck-row');
    if (row) {
        row.remove();
        console.log('✅ Removed truck row');
    }
};

window.addTrailerRow = function() {
    const container = document.getElementById('trailers-container');
    if (!container) return;

    const newRow = document.createElement('div');
    newRow.className = 'trailer-row';
    newRow.style.cssText = 'display: grid; grid-template-columns: 1fr 2fr 1fr 2fr 1fr 1fr auto; gap: 10px; align-items: end; margin-bottom: 15px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px; background: #f9fafb;';

    newRow.innerHTML = `
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Year:</label>
            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Make/Model:</label>
            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Type:</label>
            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">VIN:</label>
            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Value:</label>
            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Radius:</label>
            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div style="display: flex; align-items: end;">
            <button type="button" onclick="removeTrailerRow(this)" style="background: #ef4444; color: white; border: none; padding: 6px; border-radius: 4px; cursor: pointer;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    container.appendChild(newRow);
    console.log('✅ Added new trailer row');
};

window.removeTrailerRow = function(button) {
    const row = button.closest('.trailer-row');
    if (row) {
        row.remove();
        console.log('✅ Removed trailer row');
    }
};

// Commodity Management Functions
window.addCommodityRow = function() {
    const container = document.getElementById('commodities-container');
    if (!container) return;

    // Check if we already have 4 commodities
    const existingRows = container.querySelectorAll('.commodity-row');
    if (existingRows.length >= 4) {
        alert('Maximum of 4 commodities allowed');
        return;
    }

    const newRow = document.createElement('div');
    newRow.className = 'commodity-row';
    newRow.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr auto; gap: 10px; align-items: end; margin-bottom: 15px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px; background: #f9fafb;';

    newRow.innerHTML = `
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Commodity:</label>
            <select style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                <option value="">Select Commodity</option>
                <option value="General Freight">General Freight</option>
                <option value="Machinery">Machinery</option>
                <option value="Building Materials">Building Materials</option>
                <option value="Food Products">Food Products</option>
                <option value="Chemicals">Chemicals</option>
                <option value="Automobiles">Automobiles</option>
                <option value="Electronics">Electronics</option>
                <option value="Textiles">Textiles</option>
                <option value="Paper Products">Paper Products</option>
                <option value="Metal Products">Metal Products</option>
                <option value="Coal/Minerals">Coal/Minerals</option>
                <option value="Petroleum Products">Petroleum Products</option>
                <option value="Lumber">Lumber</option>
                <option value="Grain/Agricultural">Grain/Agricultural</option>
                <option value="Waste Materials">Waste Materials</option>
                <option value="Other">Other</option>
            </select>
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">% of Loads:</label>
            <input type="text" placeholder="%" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div style="display: flex; align-items: end;">
            <button type="button" onclick="removeCommodityRow(this)" style="background: #ef4444; color: white; border: none; padding: 6px; border-radius: 4px; cursor: pointer;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    container.appendChild(newRow);
    console.log('✅ Added new commodity row');
};

window.removeCommodityRow = function(button) {
    const row = button.closest('.commodity-row');
    if (row) {
        row.remove();
        console.log('✅ Removed commodity row');
    }
};

window.saveQuoteApplication = function(leadId) {
    console.log('🚀 SAVE FUNCTION CALLED - VERSION 24 - NO ALERT!', leadId);

    const modal = document.getElementById('quote-application-modal');
    if (!modal) {
        alert('Quote application modal not found');
        return;
    }

    // Collect form data
    const formData = {};

    // Get all input fields
    const inputs = modal.querySelectorAll('input, textarea, select');
    inputs.forEach((input, index) => {
        if (input.value) {
            const label = input.closest('div').querySelector('label');
            const fieldName = label ? label.textContent.replace(':', '') : `Field_${index}`;
            formData[fieldName] = input.value;
        }
    });

    // Collect commodities data
    const commodities = [];
    modal.querySelectorAll('#commodities-container .commodity-row').forEach((row, index) => {
        const select = row.querySelector('select');
        const input = row.querySelector('input');
        const commodity = {
            type: select?.value || '',
            percentage: input?.value || ''
        };
        if (commodity.type || commodity.percentage) {
            commodities.push(commodity);
        }
    });

    // Collect drivers data
    const drivers = [];
    modal.querySelectorAll('#drivers-container .driver-row').forEach((row, index) => {
        const inputs = row.querySelectorAll('input');
        const driver = {
            name: inputs[0]?.value || '',
            dob: inputs[1]?.value || '',
            license: inputs[2]?.value || '',
            state: inputs[3]?.value || '',
            experience: inputs[4]?.value || '',
            hireDate: inputs[5]?.value || '',
            accidents: inputs[6]?.value || ''
        };
        if (driver.name || driver.license) {
            drivers.push(driver);
        }
    });

    // Collect trucks data
    const trucks = [];
    modal.querySelectorAll('#trucks-container .truck-row').forEach((row, index) => {
        const inputs = row.querySelectorAll('input');
        const truck = {
            year: inputs[0]?.value || '',
            make: inputs[1]?.value || '',
            type: inputs[2]?.value || '',
            vin: inputs[3]?.value || '',
            value: inputs[4]?.value || '',
            radius: inputs[5]?.value || ''
        };
        if (truck.year || truck.make || truck.vin) {
            trucks.push(truck);
        }
    });

    // Collect trailers data
    const trailers = [];
    modal.querySelectorAll('#trailers-container .trailer-row').forEach((row, index) => {
        const inputs = row.querySelectorAll('input');
        const trailer = {
            year: inputs[0]?.value || '',
            make: inputs[1]?.value || '',
            type: inputs[2]?.value || '',
            vin: inputs[3]?.value || '',
            value: inputs[4]?.value || '',
            radius: inputs[5]?.value || ''
        };
        if (trailer.year || trailer.make || trailer.vin) {
            trailers.push(trailer);
        }
    });

    // Prepare application data
    const applicationData = {
        id: Date.now(),
        leadId: leadId,
        createdDate: new Date().toISOString(),
        formData: formData,
        commodities: commodities,
        drivers: drivers,
        trucks: trucks,
        trailers: trailers,
        status: 'draft'
    };

    // Save to server with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    fetch('/api/quote-applications', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            leadId: leadId,
            applicationData: applicationData
        }),
        signal: controller.signal
    })
    .then(response => {
        clearTimeout(timeoutId); // Clear timeout on successful response
        return response.json();
    })
    .then(data => {
        if (data.success) {
            console.log('✅ Quote application saved to server:', data.applicationId);
            // Close quote application modal
            modal.remove();
            // Refresh the applications display
            protectedFunctions.loadQuoteApplications(leadId);
        } else {
            console.error('❌ Save failed:', data.error);
            alert('Error saving quote application: ' + data.error);
        }
    })
    .catch(error => {
        clearTimeout(timeoutId); // Clear timeout on error
        console.error('❌ Save error:', error);

        // Handle timeout specifically
        if (error.name === 'AbortError') {
            console.error('❌ Request timed out after 15 seconds');
            alert('Save request timed out. Please check your connection and try again.');
        } else {
            alert('Error saving quote application. Please try again.');
        }
    });

    // Return early - async operation will handle modal closing
    return;

    // Close quote application modal
    modal.remove();

    // Refresh the lead profile to show the new application
    console.log('🔄 Refreshing lead profile to show saved application...');
    const leadProfileModal = document.getElementById('lead-profile-container');
    if (leadProfileModal) {
        console.log('✅ Found lead profile modal, refreshing...');
        // Close and reopen the lead profile to refresh the Application Submissions section
        const leadData = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const currentLead = leadData.find(l => String(l.id) === String(leadId));

        if (currentLead) {
            console.log('✅ Found current lead, closing and reopening profile...');
            // Close current profile modal
            leadProfileModal.remove();

            // Reopen with updated data
            setTimeout(() => {
                console.log('🔄 Reopening lead profile...');
                protectedFunctions.showLeadProfile(leadId);
            }, 100);
        } else {
            console.log('❌ Current lead not found');
        }
    } else {
        console.log('❌ Lead profile modal not found for refresh');
    }
};

// Check storage usage
try {
    const storageUsed = JSON.stringify(localStorage).length;
    const maxStorage = 10 * 1024 * 1024; // 10MB typical limit
    const percentUsed = Math.round((storageUsed / maxStorage) * 100);

    if (percentUsed > 80) {
        console.warn(`⚠️ Storage ${percentUsed}% full. Consider running window.clearLossRunsStorage() if experiencing issues.`);
    } else {
        console.log(`💾 Storage usage: ~${percentUsed}% (${(storageUsed/1024).toFixed(0)}KB)`);
    }
} catch (e) {
    console.log('💾 Storage usage check failed:', e.message);
}

// Fix all lead reachOut references to prevent data sharing between leads
protectedFunctions.fixAllLeadReachOutReferences = function() {
    console.log('🔧 Fixing all lead reachOut references to prevent data sharing...');

    try {
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        let fixedCount = 0;

        leads.forEach(lead => {
            // Ensure each lead has its own unique reachOut object
            if (!lead.reachOut || typeof lead.reachOut !== 'object') {
                lead.reachOut = {
                    callAttempts: 0,
                    callsConnected: 0,
                    emailCount: 0,
                    textCount: 0,
                    voicemailCount: 0
                };
                fixedCount++;
                console.log(`🔧 Created new reachOut for lead ${lead.id} - ${lead.name}`);
            } else {
                // Create a completely new object to break any references
                lead.reachOut = {
                    callAttempts: lead.reachOut.callAttempts || 0,
                    callsConnected: lead.reachOut.callsConnected || 0,
                    emailCount: lead.reachOut.emailCount || 0,
                    textCount: lead.reachOut.textCount || 0,
                    voicemailCount: lead.reachOut.voicemailCount || 0,
                    // Preserve other important properties
                    ...(lead.reachOut.callLogs && { callLogs: [...(lead.reachOut.callLogs || [])] }),
                    ...(lead.reachOut.completedAt && { completedAt: lead.reachOut.completedAt }),
                    ...(lead.reachOut.reachOutCompletedAt && { reachOutCompletedAt: lead.reachOut.reachOutCompletedAt })
                };
                fixedCount++;
            }
        });

        // Save the fixed data back to localStorage
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        console.log(`✅ Fixed reachOut references for ${fixedCount} leads`);

        return true;
    } catch (error) {
        console.error('❌ Error fixing lead reachOut references:', error);
        return false;
    }
};

// Clear any cached hardcoded test lead data
protectedFunctions.clearTestLeadData = function() {
    try {
        const testLeadId = '8126662';

        // Clear all localStorage keys containing the test lead ID
        const keysToRemove = [];
        Object.keys(localStorage).forEach(key => {
            if (key.includes(testLeadId)) {
                keysToRemove.push(key);
            }
        });

        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            console.log(`🧹 Cleared cached test data: ${key}`);
        });

        // Force clear any reach out modal elements that might be lingering
        const existingModalElements = document.querySelectorAll(`[id*="${testLeadId}"]`);
        existingModalElements.forEach(el => {
            console.log(`🧹 Removing lingering test element: ${el.id}`);
            el.remove();
        });

        console.log(`✅ Test data cleanup completed - cleared ${keysToRemove.length} localStorage keys and ${existingModalElements.length} DOM elements`);
        return true;
    } catch (error) {
        console.error('Error clearing test lead data:', error);
        return false;
    }
};

// Automatically clear test data on load
protectedFunctions.clearTestLeadData();

// DISABLED - DOM Protection System was causing infinite loops
protectedFunctions.protectModalIDs = function(leadId, modalContainer) {
    console.log(`🛡️ DOM protection disabled to prevent infinite loops for lead ${leadId}`);
    // This function is now a no-op to prevent the infinite loop issue
    return null;
};

// Manual test function to set different reach out stats for testing
window.setTestReachOutStats = function() {
    console.log('🧪 Setting test reach out stats for different leads...');

    // Get leads from localStorage
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

    // Find the three test leads mentioned by the user
    const testLeadNames = ['KLASSIC TRANSPORTING', 'CENTEX TRANSPORTATIO', 'DULLANI TRANSPORT'];

    let updatedCount = 0;
    leads.forEach((lead, index) => {
        if (testLeadNames.some(name => lead.name && lead.name.includes(name))) {
            // Initialize reachOut if it doesn't exist
            if (!lead.reachOut) {
                lead.reachOut = {
                    callAttempts: 0,
                    callsConnected: 0,
                    emailCount: 0,
                    textCount: 0,
                    voicemailCount: 0
                };
            }

            // Set different stats for each lead for testing
            if (lead.name.includes('KLASSIC')) {
                lead.reachOut.callAttempts = 3;
                lead.reachOut.callsConnected = 1;
                lead.reachOut.emailCount = 2;
                lead.reachOut.textCount = 1;
                console.log(`🔧 Set KLASSIC stats: calls=${lead.reachOut.callAttempts}, emails=${lead.reachOut.emailCount}`);
            } else if (lead.name.includes('CENTEX')) {
                lead.reachOut.callAttempts = 5;
                lead.reachOut.callsConnected = 2;
                lead.reachOut.emailCount = 1;
                lead.reachOut.textCount = 3;
                console.log(`🔧 Set CENTEX stats: calls=${lead.reachOut.callAttempts}, emails=${lead.reachOut.emailCount}`);
            } else if (lead.name.includes('DULLANI')) {
                lead.reachOut.callAttempts = 1;
                lead.reachOut.callsConnected = 0;
                lead.reachOut.emailCount = 3;
                lead.reachOut.textCount = 0;
                console.log(`🔧 Set DULLANI stats: calls=${lead.reachOut.callAttempts}, emails=${lead.reachOut.emailCount}`);
            }
            updatedCount++;
        }
    });

    // Save back to localStorage
    localStorage.setItem('insurance_leads', JSON.stringify(leads));
    console.log(`✅ Updated reach out stats for ${updatedCount} test leads`);
    console.log('💡 Now open different lead profiles to verify each has unique data!');

    return updatedCount;
};

console.log('🧪 Test function available: setTestReachOutStats() - run this to set different stats for test leads');

// Ensure our protected functions override any others - ULTRA AGGRESSIVE OVERRIDE
window.viewLead = protectedFunctions.viewLead;
window.createEnhancedProfile = protectedFunctions.createEnhancedProfile;
window.showLeadProfile = protectedFunctions.showLeadProfile;
window.updateReachOut = protectedFunctions.updateReachOut;
window.showCallLogs = protectedFunctions.showCallLogs;
window.showCallStatus = protectedFunctions.showCallStatus;

// Add getReachOutStatus function for compatibility with test files and external access
window.getReachOutStatus = function(lead) {
    console.log(`🔍 getReachOutStatus called for lead ${lead.id} - ${lead.name}`);

    if (!lead || !lead.reachOut) {
        return '<span style="color: #dc2626;">TO DO - Call Lead</span>';
    }

    const reachOut = lead.reachOut;

    // Check if stage requires reach out
    console.log(`🔍 REACH OUT CHECK: Lead ${lead.id} stage = "${lead.stage}"`);

    // Explicitly exclude App Sent stages (any case variation)
    const isAppSentStage = (
        lead.stage === 'app_sent' || lead.stage === 'App Sent' || lead.stage === 'APP_SENT' ||
        lead.stage === 'app sent' || lead.stage === 'App sent'
    );

    if (isAppSentStage) {
        console.log(`🔍 REACH OUT CHECK: ✅ App Sent stage detected - NO REACH OUT REQUIRED`);
        return ''; // App Sent stages don't need reach out
    }

    const stageRequiresReachOut = (
        lead.stage === 'quoted' || lead.stage === 'info_requested' || lead.stage === 'Info Requested' ||
        lead.stage === 'loss_runs_requested' || lead.stage === 'Loss Runs Requested' ||
        lead.stage === 'quote_sent' || lead.stage === 'quote-sent-unaware' || lead.stage === 'quote-sent-aware' ||
        lead.stage === 'sale' || lead.stage === 'Sale'
    );

    if (!stageRequiresReachOut) {
        console.log(`🔍 REACH OUT CHECK: ✅ Stage "${lead.stage}" doesn't require reach out`);
        return ''; // No reach out required for this stage
    }

    console.log(`🔍 REACH OUT CHECK: ❗ Stage "${lead.stage}" REQUIRES reach out`);

    // Check if reach out is completed - MUST verify actual completion actions
    // NEW LOGIC: Consider call attempts OR email confirmation as completion
    const hasActuallyCompleted = (reachOut.callAttempts > 0) ||
                                (reachOut.emailConfirmed === true) ||
                                (reachOut.textCount > 0) ||
                                (reachOut.callsConnected > 0);

    if ((reachOut.completedAt || reachOut.reachOutCompletedAt) && hasActuallyCompleted) {
        // Check if reach out has EXPIRED based on green highlight duration - UPDATED LOGIC
        if (reachOut.reachOutCompletedAt || reachOut.completedAt) {
            const completedTime = new Date(reachOut.reachOutCompletedAt || reachOut.completedAt);
            const currentTime = new Date();

            // Check for green highlight expiration based on duration (same as getNextAction)
            let isExpired = false;

            // Method 1: Check if greenHighlightUntil exists and has expired
            if (reachOut.greenHighlightUntil) {
                const highlightExpiry = new Date(reachOut.greenHighlightUntil);
                if (currentTime > highlightExpiry) {
                    isExpired = true;
                    console.log(`🔴 GREEN HIGHLIGHT EXPIRED: Lead ${lead.id} - highlight expired at ${reachOut.greenHighlightUntil}`);
                }
            }
            // Method 2: Calculate expiration based on duration
            else if (reachOut.highlightDuration) {
                const durationMs = reachOut.highlightDuration * 60 * 60 * 1000; // Convert hours to milliseconds
                const highlightExpiry = new Date(completedTime.getTime() + durationMs);
                if (currentTime > highlightExpiry) {
                    isExpired = true;
                    console.log(`🔴 GREEN HIGHLIGHT EXPIRED: Lead ${lead.id} - ${reachOut.highlightDuration}h duration expired`);
                }
            }
            // Method 3: Check if highlightDurationDays exists
            else if (reachOut.highlightDurationDays) {
                const durationMs = reachOut.highlightDurationDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds
                const highlightExpiry = new Date(completedTime.getTime() + durationMs);
                if (currentTime > highlightExpiry) {
                    isExpired = true;
                    console.log(`🔴 GREEN HIGHLIGHT EXPIRED: Lead ${lead.id} - ${reachOut.highlightDurationDays}d duration expired`);
                }
            }
            // Method 4: Check for lead-level duration
            else if (lead.highlightDuration) {
                const durationMs = lead.highlightDuration * 60 * 60 * 1000; // Convert hours to milliseconds
                const highlightExpiry = new Date(completedTime.getTime() + durationMs);
                if (currentTime > highlightExpiry) {
                    isExpired = true;
                    console.log(`🔴 GREEN HIGHLIGHT EXPIRED: Lead ${lead.id} - lead-level ${lead.highlightDuration}h duration expired`);
                }
            }
            // Method 5: Default 24-hour check if no specific duration is found
            else {
                const defaultDurationMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
                const highlightExpiry = new Date(completedTime.getTime() + defaultDurationMs);
                if (currentTime > highlightExpiry) {
                    isExpired = true;
                    console.log(`🔴 GREEN HIGHLIGHT EXPIRED: Lead ${lead.id} - default 24h duration expired`);
                }
            }

            if (isExpired) {
                console.log(`🔄 getReachOutStatus - GREEN HIGHLIGHT EXPIRED: Lead ${lead.id} - resetting completion status`);
                return '<span style="color: #dc2626;">EXPIRED - Reach Out Required</span>';
            }
        }

        // Not expired - show as complete
        const completedTimestamp = new Date(reachOut.reachOutCompletedAt || reachOut.completedAt).toLocaleString();
        return `<span style="color: #10b981;">REACH OUT COMPLETE - ${completedTimestamp}</span>`;
    }

    // Not completed (either no completion timestamp or no actual completion) - show what's needed
    // NEW LOGIC: Mark as complete if call attempt, email confirmation, text, or connected call was made
    if (reachOut.callAttempts > 0 || reachOut.emailConfirmed === true || reachOut.textCount > 0 || reachOut.callsConnected > 0) {
        return '<span style="color: #10b981;">REACH OUT COMPLETE</span>';
    } else {
        return '<span style="color: #dc2626;">TO DO - Call Lead</span>';
    }
};

console.log('🔥 PROTECTED FUNCTIONS NOW ACTIVE - Enhanced profile with Reach Out section should load');
console.log('🚨 FINAL-PROFILE-FIX-PROTECTED SCRIPT LOADED - VERSION 1000');
console.log('🔍 Current functions on window:', {
    viewLead: typeof window.viewLead,
    showLeadProfile: typeof window.showLeadProfile,
    createEnhancedProfile: typeof window.createEnhancedProfile,
    getReachOutStatus: typeof window.getReachOutStatus
});

// ULTIMATE PROTECTION: Use Object.defineProperty to make functions non-configurable and non-writable
function lockFunctions() {
    try {
        Object.defineProperty(window, 'viewLead', {
            value: protectedFunctions.viewLead,
            writable: false,
            configurable: false
        });
        Object.defineProperty(window, 'createEnhancedProfile', {
            value: protectedFunctions.createEnhancedProfile,
            writable: false,
            configurable: false
        });
        Object.defineProperty(window, 'showLeadProfile', {
            value: protectedFunctions.showLeadProfile,
            writable: false,
            configurable: false
        });
        Object.defineProperty(window, 'updateReachOut', {
            value: protectedFunctions.updateReachOut,
            writable: false,
            configurable: false
        });
        Object.defineProperty(window, 'showCallLogs', {
            value: protectedFunctions.showCallLogs,
            writable: false,
            configurable: false
        });
        Object.defineProperty(window, 'showCallStatus', {
            value: protectedFunctions.showCallStatus,
            writable: false,
            configurable: false
        });
        Object.defineProperty(window, 'updateAppStageField', {
            value: protectedFunctions.updateAppStageField,
            writable: false,
            configurable: false
        });
        console.log('🔒 FUNCTIONS LOCKED: Protected functions are now non-configurable and non-writable');
    } catch (error) {
        console.warn('⚠️ Could not lock functions, falling back to aggressive override:', error.message);
        // Fallback to aggressive override
        window.viewLead = protectedFunctions.viewLead;
        window.createEnhancedProfile = protectedFunctions.createEnhancedProfile;
        window.showLeadProfile = protectedFunctions.showLeadProfile;
        window.updateReachOut = protectedFunctions.updateReachOut;
        window.showCallLogs = protectedFunctions.showCallLogs;
        window.showCallStatus = protectedFunctions.showCallStatus;
        window.updateAppStageField = protectedFunctions.updateAppStageField;
        window.showMarketStats = protectedFunctions.showMarketStats;
window.updateReachOut = protectedFunctions.updateReachOut;
window.showCallLogs = protectedFunctions.showCallLogs;
window.showCallStatus = protectedFunctions.showCallStatus;
window.updateAppStageField = protectedFunctions.updateAppStageField;
window.showMarketStats = protectedFunctions.showMarketStats;
    }
}

// Lock functions immediately
lockFunctions();

// Set up aggressive protection against function override
setTimeout(() => {
    console.log('🛡️ AGGRESSIVE OVERRIDE: Ensuring protected functions stay active');
    lockFunctions();
}, 100);

// Also protect against any late-loading scripts
setTimeout(() => {
    console.log('🛡️ FINAL OVERRIDE: Last chance protection of functions');
    lockFunctions();
}, 1000);

// Add periodic DOM cleanup to prevent memory accumulation
function cleanupOrphanedElements() {
    // Remove hidden or orphaned modal elements
    const hiddenModals = document.querySelectorAll('.modal-overlay[style*="display: none"], .modal-overlay:not([style*="display"]):empty');
    hiddenModals.forEach(modal => {
        modal.remove();
        console.log('🧹 Removed orphaned modal element');
    });

    // Remove duplicate modal elements (keep only the visible one)
    const quoteModals = document.querySelectorAll('#quote-application-modal');
    if (quoteModals.length > 1) {
        for (let i = 1; i < quoteModals.length; i++) {
            quoteModals[i].remove();
            console.log('🧹 Removed duplicate quote modal');
        }
    }

    // Remove empty containers that might be leftover
    const emptyContainers = document.querySelectorAll('div:empty:not([id]):not([class]), span:empty:not([id]):not([class])');
    emptyContainers.forEach(container => {
        if (container.parentNode && !container.hasChildNodes()) {
            container.remove();
        }
    });
}

// Add network connection cleanup function
function clearPendingConnections() {
    // Cancel all pending quote application requests
    if (window.quoteApplicationControllers) {
        Object.keys(window.quoteApplicationControllers).forEach(leadId => {
            const controller = window.quoteApplicationControllers[leadId];
            if (controller) {
                console.log('🚫 Clearing pending request for lead:', leadId);
                controller.abort();
            }
        });
        window.quoteApplicationControllers = {};
    }

    // Reset loading states
    const loadingContainers = document.querySelectorAll('[data-loading="true"]');
    loadingContainers.forEach(container => {
        container.dataset.loading = 'false';
        console.log('🔄 Reset loading state for container');
    });
}

// Run DOM cleanup every 30 seconds
setInterval(cleanupOrphanedElements, 30000);

// Run network cleanup every 20 seconds to clear stuck connections
setInterval(clearPendingConnections, 20000);

// Add manual cleanup function for debugging
window.forceCleanup = function() {
    console.log('🧹 FORCE CLEANUP: Clearing all pending requests and DOM elements');

    // Clear all pending requests
    clearPendingConnections();

    // Clear all modals
    const allModals = document.querySelectorAll('.modal-overlay, [id*="modal"]');
    allModals.forEach(modal => modal.remove());

    // Clear DOM elements
    cleanupOrphanedElements();

    console.log('✅ Force cleanup completed');
    return 'Cleanup completed - try your action again';
};

console.log('✅ DOM and network cleanup systems initialized');
console.log('💡 Tip: If requests are stuck, type forceCleanup() in console');

// Automatic response rate calculation based on call attempts to connected ratio
protectedFunctions.calculateAndUpdateResponseRate = function(leadId) {
    console.log('🎯 calculateAndUpdateResponseRate called for leadId:', leadId);

    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

    if (leadIndex === -1) {
        console.log('❌ Lead not found for response rate calculation:', leadId);
        return;
    }

    const lead = leads[leadIndex];
    const reachOut = lead.reachOut || {};
    const attempts = parseInt(reachOut.callAttempts) || 0;
    const connected = parseInt(reachOut.callsConnected) || 0;

    console.log(`📊 Response rate calculation: ${attempts} attempts, ${connected} connected`);

    // Only calculate if there have been call attempts
    if (attempts === 0) {
        console.log('ℹ️ No call attempts yet, keeping current priority');
        return;
    }

    // Calculate ratio (attempts per connection)
    let ratio = connected > 0 ? attempts / connected : attempts;
    let newPriority = lead.priority || 'Mid'; // Keep existing if no change needed
    let shouldClose = false;

    console.log(`📈 Calculated ratio: ${ratio} (${attempts}:${connected})`);

    // Determine new response rate based on ratio
    if (connected > 0 && ratio <= 2) {
        // 2 or fewer attempts per connection = High response rate
        newPriority = 'High';
        console.log('✅ High response rate: ≤2 attempts per connection');
    } else if (connected > 0 && ratio <= 3) {
        // 3 attempts per connection = Mid response rate
        newPriority = 'Mid';
        console.log('⚡ Mid response rate: 3 attempts per connection');
    } else if (connected > 0 && ratio <= 4) {
        // 4 attempts per connection = Lower response rate
        newPriority = 'Lower';
        console.log('⚠️ Lower response rate: 4 attempts per connection');
    } else if (connected > 0 && ratio <= 5) {
        // 5 attempts per connection = Low response rate
        newPriority = 'Low';
        console.log('🔴 Low response rate: 5 attempts per connection');
    } else if (connected > 0 && ratio >= 6) {
        // 6+ attempts per connection = Very low response rate - should close
        newPriority = 'Low';
        shouldClose = true;
        console.log('🚨 VERY LOW response rate: ≥6:1 ratio - suggesting closure');
    } else if (attempts >= 6 && connected === 0) {
        // 6+ attempts with no connections = Very low pickup rate
        newPriority = 'Low';
        shouldClose = true;
        console.log('🚨 VERY LOW pickup rate: 6+ attempts with no connections');
    }

    // Update priority if it changed
    if (newPriority !== lead.priority) {
        console.log(`🔄 AUTO-CALCULATION: Updating priority from "${lead.priority}" to "${newPriority}"`);

        // Use the SAME pathway as manual selection by calling updateLeadPriority
        if (window.updateLeadPriority) {
            console.log(`🎯 AUTO-CALCULATION: Using updateLeadPriority function`);
            window.updateLeadPriority(leadId, newPriority);
        } else {
            console.log(`⚠️ AUTO-CALCULATION: updateLeadPriority not found, using fallback`);

            // Fallback to direct save if updateLeadPriority isn't available
            leads[leadIndex].priority = newPriority;
            localStorage.setItem('insurance_leads', JSON.stringify(leads));

            // Update the dropdown in the modal if it exists
            const prioritySelect = document.querySelector(`select[onchange*="updateLeadPriority('${leadId}"]`);
            if (prioritySelect) {
                prioritySelect.value = newPriority;
                console.log('✅ Updated priority dropdown in modal');
            }
        }
    }

    // Handle very low pickup rate case
    if (shouldClose) {
        console.log('🚨 Showing close lead popup due to very low pickup rate');
        protectedFunctions.showLowPickupRatePopup(leadId, attempts);
    }
};

// Popup for very low pickup rate (6+ attempts with no connections)
protectedFunctions.showLowPickupRatePopup = function(leadId, attempts) {
    console.log('🚨 SHOWING LOW RESPONSE RATE POPUP - z-index: 99999999');

    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'low-response-rate-popup-backdrop';
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 99999999;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease-out;
    `;

    // Add animation styles
    if (!document.getElementById('popup-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'popup-animation-styles';
        style.innerHTML = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes popIn {
                from { opacity: 0; transform: scale(0.8); }
                to { opacity: 1; transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    }

    // Create popup
    const popup = document.createElement('div');
    popup.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
        max-width: 450px;
        width: 90%;
        text-align: center;
        position: relative;
        z-index: 999999999;
        animation: popIn 0.4s ease-out;
        border: 2px solid #dc2626;
    `;

    popup.innerHTML = `
        <div style="margin-bottom: 20px;">
            <div style="color: #ef4444; font-size: 48px; margin-bottom: 15px;">⚠️</div>
            <h3 style="color: #dc2626; margin: 0 0 15px 0;">Low Response Rate</h3>
            <p style="color: #374151; margin: 0 0 20px 0; font-size: 16px; font-weight: 600;">
                Lead's response rate is very low. Move to closed?
            </p>
        </div>
        <div style="display: flex; gap: 10px; justify-content: center;">
            <button id="close-lead-yes" style="background: #dc2626; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 16px;">
                Yes
            </button>
            <button id="close-lead-no" style="background: #6b7280; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 16px;">
                No
            </button>
        </div>
    `;

    backdrop.appendChild(popup);
    document.body.appendChild(backdrop);

    console.log('✅ LOW RESPONSE RATE POPUP ADDED TO DOM');
    console.log('🔍 Popup element:', backdrop);
    console.log('🔍 Popup z-index:', backdrop.style.zIndex);

    // Handle button clicks
    document.getElementById('close-lead-yes').onclick = function() {
        console.log('🔒 User chose to close lead due to low response rate');

        // Use the same save pathway as manual stage updates
        if (window.updateLeadStage) {
            console.log('🎯 AUTO-CLOSE: Using updateLeadStage function');
            window.updateLeadStage(leadId, 'closed');
        } else {
            console.log('⚠️ AUTO-CLOSE: updateLeadStage not found, using fallback');

            // Fallback to direct save
            const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

            if (leadIndex !== -1) {
                leads[leadIndex].stage = 'closed';
                leads[leadIndex].closedReason = 'Very low response rate - automatic closure';
                localStorage.setItem('insurance_leads', JSON.stringify(leads));
                console.log('✅ Lead closed due to low response rate');

                // Update stage dropdown in modal if open
                const stageSelect = document.querySelector(`select[onchange*="updateLeadStage('${leadId}"]`);
                if (stageSelect) {
                    stageSelect.value = 'closed';
                }

                // Refresh table
                if (window.displayLeads) {
                    setTimeout(() => window.displayLeads(), 100);
                }
            }
        }

        // Close the lead profile modal if open
        const profileModal = document.querySelector('.lead-profile-modal');
        if (profileModal) {
            profileModal.remove();
        }

        backdrop.remove();
    };

    document.getElementById('close-lead-no').onclick = function() {
        console.log('ℹ️ User chose to keep lead open despite low pickup rate');
        backdrop.remove();
    };

    // Close on backdrop click
    backdrop.onclick = function(e) {
        if (e.target === backdrop) {
            backdrop.remove();
        }
    };
};

// Function to update name field color based on content
window.updateNameFieldColor = function(inputElement) {
    const value = inputElement.value.trim();

    if (value) {
        // Has content - normal styling
        inputElement.style.border = '1px solid #d1d5db';
        inputElement.style.backgroundColor = 'white';
    } else {
        // Empty - red tinting
        inputElement.style.border = '1px solid #ef4444';
        inputElement.style.backgroundColor = '#fef2f2';
    }
};

// Callback Scheduler Functions
window.scheduleCallback = function(leadId) {
    const dateInput = document.getElementById(`callback-date-${leadId}`);
    const timeInput = document.getElementById(`callback-time-${leadId}`);
    const notesInput = document.getElementById(`callback-notes-${leadId}`);

    const date = dateInput.value;
    const time = timeInput.value;
    const notes = notesInput.value.trim();

    if (!date || !time) {
        alert('Please select both date and time for the callback.');
        return;
    }

    // Combine date and time
    const callbackDateTime = new Date(`${date}T${time}`);
    const now = new Date();

    if (callbackDateTime <= now) {
        alert('Please select a future date and time for the callback.');
        return;
    }

    // Get existing callbacks from localStorage
    const callbacksKey = 'scheduled_callbacks';
    let callbacks = JSON.parse(localStorage.getItem(callbacksKey) || '{}');

    if (!callbacks[leadId]) {
        callbacks[leadId] = [];
    }

    // Create new callback object
    const newCallback = {
        id: Date.now(),
        leadId: leadId,
        date: date,
        time: time,
        dateTime: callbackDateTime.toISOString(),
        notes: notes,
        completed: false,
        created: new Date().toISOString()
    };

    // Add to callbacks
    callbacks[leadId].push(newCallback);
    callbacks[leadId].sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

    // Save to localStorage
    localStorage.setItem(callbacksKey, JSON.stringify(callbacks));

    // Schedule exact-timer alarm for the new callback immediately
    if (window.CallbackNotifications && window.CallbackNotifications.refresh) {
        window.CallbackNotifications.refresh();
    }

    // Clear inputs
    dateInput.value = '';
    timeInput.value = '';
    notesInput.value = '';

    // Refresh display
    displayScheduledCallbacks(leadId);

    console.log('✅ Callback scheduled for:', callbackDateTime);
};

window.displayScheduledCallbacks = function(leadId) {
    const container = document.getElementById(`scheduled-callbacks-${leadId}`);
    if (!container) return;

    const callbacksKey = 'scheduled_callbacks';
    const callbacks = JSON.parse(localStorage.getItem(callbacksKey) || '{}');
    const leadCallbacks = callbacks[leadId] || [];

    if (leadCallbacks.length === 0) {
        container.innerHTML = '';
        return;
    }

    const now = new Date();
    let html = '<div style="border-top: 1px solid #0277bd; padding-top: 15px;"><h4 style="margin: 0 0 10px 0; color: #0277bd; font-size: 14px;"><i class="fas fa-clock"></i> Scheduled Callbacks</h4>';

    leadCallbacks.forEach(callback => {
        const callbackTime = new Date(callback.dateTime);
        const isPast = callbackTime <= now;
        const isToday = callbackTime.toDateString() === now.toDateString();

        const timeStr = callbackTime.toLocaleDateString() + ' at ' + callbackTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        html += `
            <div style="background: ${isPast ? '#fee2e2' : isToday ? '#fef3c7' : '#f0f9ff'}; padding: 10px; border-radius: 6px; margin-bottom: 8px; border-left: 4px solid ${isPast ? '#dc2626' : isToday ? '#f59e0b' : '#0277bd'};">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: ${isPast ? '#dc2626' : isToday ? '#f59e0b' : '#0277bd'}; font-size: 13px;">
                            ${isPast ? '🔴 OVERDUE' : isToday ? '⚡ TODAY' : '📅'} ${timeStr}
                        </div>
                        ${callback.notes ? `<div style="font-size: 12px; color: #6b7280; margin-top: 5px;">${callback.notes}</div>` : ''}
                    </div>
                    <button onclick="showCallbackScheduler('${leadId}')"
                            style="background: #3b82f6; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        <i class="fas fa-calendar-alt"></i> Reschedule
                    </button>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
};

window.completeCallback = function(leadId, callbackId) {
    const callbacksKey = 'scheduled_callbacks';
    let callbacks = JSON.parse(localStorage.getItem(callbacksKey) || '{}');

    if (callbacks[leadId]) {
        callbacks[leadId] = callbacks[leadId].filter(cb => cb.id !== callbackId);
        localStorage.setItem(callbacksKey, JSON.stringify(callbacks));
        displayScheduledCallbacks(leadId);
        console.log('✅ Callback completed and removed');
    }
};

// Set up periodic monitoring to detect and prevent function override
setInterval(() => {
    // Check if functions are still ours
    if (window.showLeadProfile !== protectedFunctions.showLeadProfile ||
        window.viewLead !== protectedFunctions.viewLead ||
        window.createEnhancedProfile !== protectedFunctions.createEnhancedProfile ||
        window.updateReachOut !== protectedFunctions.updateReachOut ||
        window.showCallLogs !== protectedFunctions.showCallLogs ||
        window.showCallStatus !== protectedFunctions.showCallStatus ||
        window.showMarketStats !== protectedFunctions.showMarketStats) {

        console.warn('🚨 FUNCTION OVERRIDE DETECTED! Re-establishing protection...');
        lockFunctions();
    }
}, 2000);