// Enhanced Quote Application Modal with Dynamic Sections
console.log('📝 Enhanced Quote Application Modal Loading...');

// Loading Overlay System for Application Operations
function showLoadingOverlay(message = 'Processing...', subMessage = 'Please wait while we complete your request') {
    // Remove any existing overlay
    hideLoadingOverlay();

    const overlay = document.createElement('div');
    overlay.id = 'operation-loading-overlay';
    overlay.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.8) !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        z-index: 999999 !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    `;

    overlay.innerHTML = `
        <div style="
            background: white;
            padding: 40px;
            border-radius: 12px;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            animation: pulse 2s infinite;
        ">
            <div style="color: #3b82f6; font-size: 48px; margin-bottom: 20px;">
                <div class="loading-spinner" style="
                    width: 40px;
                    height: 40px;
                    border: 4px solid #e5e7eb;
                    border-top: 4px solid #3b82f6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto;
                "></div>
            </div>
            <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 20px;">${message}</h3>
            <p style="color: #6b7280; margin-bottom: 20px; line-height: 1.5;">${subMessage}</p>
            <div style="color: #9ca3af; font-size: 12px;">
                <strong>Important:</strong> Please don't close this window.
            </div>
        </div>
    `;

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
    `;
    overlay.appendChild(style);

    document.body.appendChild(overlay);
    console.log('🔄 Loading overlay shown:', message);
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('operation-loading-overlay');
    if (overlay) {
        overlay.remove();
        console.log('✅ Loading overlay hidden');
    }
}

// Define add row functions for the quote application modal
window.addDriverRow = function() {
    console.log('🚛 addDriverRow called from enhanced modal');
    const container = document.getElementById('drivers-container');
    if (!container) {
        console.log('❌ drivers-container not found');
        return;
    }
    console.log('✅ Found drivers-container, adding row...');

    const newRow = document.createElement('div');
    newRow.className = 'driver-row';
    newRow.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 2fr auto; gap: 8px; align-items: end; margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;';

    newRow.innerHTML = `
        <div>
            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Name:</label>
            <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Date of Birth:</label>
            <input type="date" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">License Number:</label>
            <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">State:</label>
            <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Years Experience:</label>
            <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Date of Hire:</label>
            <input type="date" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;"># Accidents/Violations:</label>
            <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
        </div>
        <div>
            <button type="button" onclick="removeDriverRow(this)" style="background: #dc2626; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">Delete</button>
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
    console.log('🚚 addTruckRow called');
    const container = document.getElementById('trucks-container');
    if (!container) {
        console.log('❌ trucks-container not found');
        return;
    }
    console.log('✅ Found trucks-container, adding row...');

    const newRow = document.createElement('div');
    newRow.className = 'truck-row';
    newRow.style.cssText = 'display: grid; grid-template-columns: 1fr 2fr 1fr 2fr 1fr 1fr auto; gap: 8px; align-items: end; margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;';

    newRow.innerHTML = `
        <div>
            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Year:</label>
            <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Make/Model:</label>
            <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Type:</label>
            <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">VIN:</label>
            <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Value:</label>
            <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Radius:</label>
            <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
        </div>
        <div>
            <button type="button" onclick="removeTruckRow(this)" style="background: #dc2626; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">Delete</button>
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

        // Clear any existing data for the removed truck to ensure it doesn't persist
        const modal = document.getElementById('quote-application-modal');
        if (modal && window.editingApplicationData && window.editingApplicationData.formData) {
            // Force a data refresh by collecting current truck data immediately
            const currentTrucks = [];
            modal.querySelectorAll('#trucks-container .truck-row').forEach((truckRow, index) => {
                const inputs = truckRow.querySelectorAll('input');
                const year = inputs[0]?.value?.trim() || '';
                const make = inputs[1]?.value?.trim() || '';
                const type = inputs[2]?.value?.trim() || '';
                const vin = inputs[3]?.value?.trim() || '';
                if (year || make || type || vin) {
                    currentTrucks.push({ year, make, type, vin });
                }
            });

            // Update the current editing data to reflect the deletion
            window.editingApplicationData.formData.trucks = currentTrucks;
            console.log('🔄 Updated editing data - trucks remaining:', currentTrucks.length);
        }
    }
};

window.addTrailerRow = function() {
    console.log('🚛 addTrailerRow called');
    const container = document.getElementById('trailers-container');
    if (!container) {
        console.log('❌ trailers-container not found');
        return;
    }
    console.log('✅ Found trailers-container, adding row...');

    const newRow = document.createElement('div');
    newRow.className = 'trailer-row';
    newRow.style.cssText = 'display: grid; grid-template-columns: 1fr 2fr 1fr 2fr 1fr 1fr auto; gap: 8px; align-items: end; margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;';

    newRow.innerHTML = `
        <div>
            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Year:</label>
            <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Make/Model:</label>
            <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Trailer Type:</label>
            <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">VIN:</label>
            <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Value:</label>
            <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Radius:</label>
            <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
        </div>
        <div>
            <button type="button" onclick="removeTrailerRow(this)" style="background: #dc2626; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">Delete</button>
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

        // Clear any existing data for the removed trailer to ensure it doesn't persist
        const modal = document.getElementById('quote-application-modal');
        if (modal && window.editingApplicationData && window.editingApplicationData.formData) {
            // Force a data refresh by collecting current trailer data immediately
            const currentTrailers = [];
            modal.querySelectorAll('#trailers-container .trailer-row').forEach((trailerRow, index) => {
                const inputs = trailerRow.querySelectorAll('input');
                const year = inputs[0]?.value?.trim() || '';
                const make = inputs[1]?.value?.trim() || '';
                const type = inputs[2]?.value?.trim() || '';
                const vin = inputs[3]?.value?.trim() || '';
                if (year || make || type || vin) {
                    currentTrailers.push({ year, make, type, vin });
                }
            });

            // Update the current editing data to reflect the deletion
            window.editingApplicationData.formData.trailers = currentTrailers;
            console.log('🔄 Updated editing data - trailers remaining:', currentTrailers.length);
        }
    }
};

window.addCommodityRow = function() {
    console.log('📦 addCommodityRow called');
    const container = document.getElementById('commodities-container');
    if (!container) {
        console.log('❌ commodities-container not found');
        return;
    }
    console.log('✅ Found commodities-container, adding row...');

    const newRow = document.createElement('div');
    newRow.className = 'commodity-row';
    newRow.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr auto; gap: 10px; align-items: end; margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;';

    newRow.innerHTML = `
        <div>
            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Commodity:</label>
            <input type="text" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">% of Loads:</label>
            <input type="text" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
        </div>
        <div>
            <button type="button" onclick="removeCommodityRow(this)" style="background: #dc2626; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">Delete</button>
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

// Function to close quote application modal and clean up editing state
window.closeQuoteApplicationModal = function() {
    const modal = document.getElementById('quote-application-modal');
    if (modal) {
        modal.remove();
    }

    // Clear editing state
    const currentLeadId = window.editingApplicationData?.leadId || window.currentLeadId;
    window.editingApplicationId = null;
    window.editingApplicationData = null;
    console.log('🧹 Closed modal and cleared editing state');

    // Restore lead profile modal
    const leadProfileModal = document.getElementById('lead-profile-modal');
    if (leadProfileModal) {
        leadProfileModal.style.display = 'block';
    }

    // Refresh Application Submissions to restore any hidden cards
    if (currentLeadId && window.showApplicationSubmissions) {
        console.log('🔄 Refreshing Application Submissions after modal close for lead:', currentLeadId);
        setTimeout(() => {
            window.showApplicationSubmissions(currentLeadId);
        }, 100);
    }
};

// Override createQuoteApplicationSimple with enhanced version
window.createQuoteApplicationSimple = function(leadId) {
    console.log('Enhanced quote application for lead:', leadId);

    // Get the lead data from both possible sources
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const insuranceLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const allLeads = [...leads, ...insuranceLeads];
    const lead = allLeads.find(l => l.id == leadId);

    if (!lead) {
        console.error('Lead not found with ID:', leadId);
        alert('Lead not found. Please refresh and try again.');
        return;
    }

    // IMPORTANT: Remove any existing quote modal first to prevent stacking
    const existingModal = document.getElementById('quote-application-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Hide lead profile modal while quote app is open
    const leadProfileModal = document.getElementById('lead-profile-modal');
    if (leadProfileModal) {
        leadProfileModal.style.display = 'none';
    }

    // Ensure currentLeadId is set for saving
    window.currentLeadId = leadId;

    // Only clear editing flag if we're not viewing an existing application
    if (!window.editingApplicationData) {
        window.editingApplicationId = null;
        console.log('🧹 Creating new application - cleared editing flag');
    } else {
        console.log('📝 Keeping existing application in edit mode - ID:', window.editingApplicationId);
    }

    // Create simple modal directly with very high z-index
    const modal = document.createElement('div');
    modal.id = 'quote-application-modal';
    modal.dataset.leadId = leadId; // Store lead ID in modal for backup
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10000000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        width: 80vw;
        height: 80vh;
        overflow-y: auto;
        position: relative;
    `;

    content.innerHTML = `
        <div style="position: relative;">
            <button onclick="closeQuoteApplicationModal();"
                    style="position: absolute; top: -10px; right: -10px; background: white; border: 2px solid #ccc; border-radius: 50%; width: 35px; height: 35px; font-size: 24px; cursor: pointer; color: #666; z-index: 10; display: flex; align-items: center; justify-content: center; line-height: 1;"
                    onmouseover="this.style.backgroundColor='#f0f0f0'; this.style.color='#000'"
                    onmouseout="this.style.backgroundColor='white'; this.style.color='#666'"
                    title="Close">
                <span style="margin-top: -2px;">&times;</span>
            </button>
            <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #0066cc; padding-bottom: 10px;">
                <h2 style="margin: 0; color: #0066cc;">Vanguard Insurance Group LLC</h2>
                <p style="margin: 5px 0;">Brunswick, OH 44256 • 330-460-0872</p>
                <h3 style="margin: 10px 0 0 0;">TRUCKING APPLICATION</h3>
            </div>
        </div>

        <form style="font-size: 14px;">
            <!-- GENERAL INFORMATION -->
            <div style="background: #f0f4f8; padding: 10px; margin-bottom: 15px; border-left: 4px solid #0066cc;">
                <h4 style="margin: 0 0 10px 0; color: #0066cc;">GENERAL INFORMATION</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Effective Date:</label>
                        <input type="date" value="${(() => { const rd = lead.renewalDate || ''; if (rd) { const p = rd.split('/'); if (p.length === 3) return '2026-' + p[0].padStart(2,'0') + '-' + p[1].padStart(2,'0'); } return new Date().toISOString().split('T')[0]; })()}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Insured's Name (including DBA):</label>
                        <input type="text" value="${lead.name || ''}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                    <div style="grid-column: 1 / -1;">
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Mailing Address:</label>
                        <input type="text" value="${lead.address || ''}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Business Phone:</label>
                        <input type="text" value="${lead.phone || ''}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Email:</label>
                        <input type="text" value="${lead.email || ''}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                    <div style="grid-column: 1 / -1;">
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Garaging Address (if different):</label>
                        <input type="text" value="" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">US DOT #:</label>
                        <input type="text" value="${lead.dotNumber || lead.dot || ''}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">MC #:</label>
                        <input type="text" value="${lead.mcNumber || lead.mc || ''}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Federal Tax ID:</label>
                        <input type="text" value="" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Years in Business:</label>
                        <input type="text" value="${lead.yearsInBusiness || ''}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                </div>
            </div>

            <!-- CLASS OF RISK -->
            <div style="background: #f0f4f8; padding: 10px; margin-bottom: 15px; border-left: 4px solid #0066cc;">
                <h4 style="margin: 0 0 10px 0; color: #0066cc;">CLASS OF RISK</h4>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-size: 12px;">Dry Van:</label>
                        <div style="display: flex; align-items: center;">
                            <input type="text" value="" style="width: 60px; padding: 3px; border: 1px solid #ccc; border-radius: 3px;">
                            <span style="margin-left: 3px;">%</span>
                        </div>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-size: 12px;">Flatbed:</label>
                        <div style="display: flex; align-items: center;">
                            <input type="text" value="" style="width: 60px; padding: 3px; border: 1px solid #ccc; border-radius: 3px;">
                            <span style="margin-left: 3px;">%</span>
                        </div>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-size: 12px;">Heavy Haul:</label>
                        <div style="display: flex; align-items: center;">
                            <input type="text" value="" style="width: 60px; padding: 3px; border: 1px solid #ccc; border-radius: 3px;">
                            <span style="margin-left: 3px;">%</span>
                        </div>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-size: 12px;">Auto Hauler:</label>
                        <div style="display: flex; align-items: center;">
                            <input type="text" value="" style="width: 60px; padding: 3px; border: 1px solid #ccc; border-radius: 3px;">
                            <span style="margin-left: 3px;">%</span>
                        </div>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-size: 12px;">Box Truck:</label>
                        <div style="display: flex; align-items: center;">
                            <input type="text" value="" style="width: 60px; padding: 3px; border: 1px solid #ccc; border-radius: 3px;">
                            <span style="margin-left: 3px;">%</span>
                        </div>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-size: 12px;">Reefer:</label>
                        <div style="display: flex; align-items: center;">
                            <input type="text" value="" style="width: 60px; padding: 3px; border: 1px solid #ccc; border-radius: 3px;">
                            <span style="margin-left: 3px;">%</span>
                        </div>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-size: 12px;">Dumptruck:</label>
                        <div style="display: flex; align-items: center;">
                            <input type="text" value="" style="width: 60px; padding: 3px; border: 1px solid #ccc; border-radius: 3px;">
                            <span style="margin-left: 3px;">%</span>
                        </div>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-size: 12px;">Dump Trailer:</label>
                        <div style="display: flex; align-items: center;">
                            <input type="text" value="" style="width: 60px; padding: 3px; border: 1px solid #ccc; border-radius: 3px;">
                            <span style="margin-left: 3px;">%</span>
                        </div>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-size: 12px;">Tanker:</label>
                        <div style="display: flex; align-items: center;">
                            <input type="text" value="" style="width: 60px; padding: 3px; border: 1px solid #ccc; border-radius: 3px;">
                            <span style="margin-left: 3px;">%</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- COMMODITIES -->
            <div style="background: #f0f4f8; padding: 10px; margin-bottom: 15px; border-left: 4px solid #0066cc;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 style="margin: 0; color: #0066cc;">COMMODITIES</h4>
                    <button type="button" onclick="addCommodityRow()" style="background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">Add Commodity</button>
                </div>
                <div id="commodities-container">
                    <div class="commodity-row" style="display: grid; grid-template-columns: 2fr 1fr auto; gap: 10px; align-items: end; margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;">
                        <div>
                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Commodity:</label>
                            <input type="text" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">% of Loads:</label>
                            <input type="text" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                        </div>
                        <div>
                            <button type="button" onclick="removeCommodityRow(this)" style="background: #dc2626; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">Delete</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- DRIVERS INFORMATION -->
            <div style="background: #f0f4f8; padding: 10px; margin-bottom: 15px; border-left: 4px solid #0066cc;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 style="margin: 0; color: #0066cc;">DRIVERS INFORMATION</h4>
                    <button type="button" onclick="addDriverRow()" style="background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">Add Driver</button>
                </div>
                <div id="drivers-container">
                    <div class="driver-row" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 2fr auto; gap: 8px; align-items: end; margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;">
                        <div>
                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Name:</label>
                            <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Date of Birth:</label>
                            <input type="date" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">License Number:</label>
                            <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">State:</label>
                            <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Years Experience:</label>
                            <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Date of Hire:</label>
                            <input type="date" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;"># Accidents/Violations:</label>
                            <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                        </div>
                        <div>
                            <button type="button" onclick="removeDriverRow(this)" style="background: #dc2626; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">Delete</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- SCHEDULE OF AUTOS -->
            <div style="background: #f0f4f8; padding: 10px; margin-bottom: 15px; border-left: 4px solid #0066cc;">
                <h4 style="margin: 0 0 15px 0; color: #0066cc;">SCHEDULE OF AUTOS</h4>

                <!-- TRUCKS SECTION -->
                <div style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; background: #e0f2fe; padding: 8px; border-radius: 4px;">
                        <h5 style="margin: 0; color: #0277bd;">TRUCKS</h5>
                        <button type="button" onclick="addTruckRow()" style="background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">Add Truck</button>
                    </div>
                    <div id="trucks-container">
                        <div class="truck-row" style="display: grid; grid-template-columns: 1fr 2fr 1fr 2fr 1fr 1fr auto; gap: 8px; align-items: end; margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;">
                            <div>
                                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Year:</label>
                                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Make/Model:</label>
                                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Type of Truck:</label>
                                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">VIN:</label>
                                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Value:</label>
                                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Radius:</label>
                                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                            </div>
                            <div>
                                <button type="button" onclick="removeTruckRow(this)" style="background: #dc2626; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">Delete</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- TRAILERS SECTION -->
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; background: #e8f5e8; padding: 8px; border-radius: 4px;">
                        <h5 style="margin: 0; color: #2e7d32;">TRAILERS</h5>
                        <button type="button" onclick="addTrailerRow()" style="background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">Add Trailer</button>
                    </div>
                    <div id="trailers-container">
                        <div class="trailer-row" style="display: grid; grid-template-columns: 1fr 2fr 1fr 2fr 1fr 1fr auto; gap: 8px; align-items: end; margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;">
                            <div>
                                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Year:</label>
                                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Make/Model:</label>
                                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Trailer Type:</label>
                                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">VIN:</label>
                                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Value:</label>
                                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Radius:</label>
                                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                            </div>
                            <div>
                                <button type="button" onclick="removeTrailerRow(this)" style="background: #dc2626; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- COVERAGES -->
            <div style="background: #f0f4f8; padding: 10px; margin-bottom: 15px; border-left: 4px solid #0066cc;">
                <h4 style="margin: 0 0 10px 0; color: #0066cc;">COVERAGES</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Auto Liability:</label>
                        <select style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                            <option value="$750,000">$750,000</option>
                            <option value="$1,000,000" selected>$1,000,000</option>
                            <option value="$1,500,000">$1,500,000</option>
                            <option value="$2,000,000">$2,000,000</option>
                            <option value="$5,000,000">$5,000,000</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Medical Payments:</label>
                        <select style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                            <option value="$2,000">$2,000</option>
                            <option value="$5,000" selected>$5,000</option>
                            <option value="$10,000">$10,000</option>
                            <option value="$15,000">$15,000</option>
                            <option value="$25,000">$25,000</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Uninsured/Underinsured Bodily Injury:</label>
                        <select style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                            <option value="$100,000">$100,000</option>
                            <option value="$500,000">$500,000</option>
                            <option value="$750,000">$750,000</option>
                            <option value="$1,000,000" selected>$1,000,000</option>
                            <option value="$1,500,000">$1,500,000</option>
                            <option value="$2,000,000">$2,000,000</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Uninsured Motorist Property Damage:</label>
                        <select style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                            <option value="Not Included">Not Included</option>
                            <option value="$50,000">$50,000</option>
                            <option value="$100,000" selected>$100,000</option>
                            <option value="$150,000">$150,000</option>
                            <option value="$200,000">$200,000</option>
                            <option value="$250,000">$250,000</option>
                            <option value="$500,000">$500,000</option>
                            <option value="$1,000,000">$1,000,000</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Comprehensive Deductible:</label>
                        <select style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                            <option value="$500">$500</option>
                            <option value="$1,000" selected>$1,000</option>
                            <option value="$1,500">$1,500</option>
                            <option value="$2,000">$2,000</option>
                            <option value="$2,500">$2,500</option>
                            <option value="$5,000">$5,000</option>
                            <option value="Not Included">Not Included</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Collision Deductible:</label>
                        <select style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                            <option value="$500">$500</option>
                            <option value="$1,000" selected>$1,000</option>
                            <option value="$1,500">$1,500</option>
                            <option value="$2,000">$2,000</option>
                            <option value="$2,500">$2,500</option>
                            <option value="$5,000">$5,000</option>
                            <option value="Not Included">Not Included</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Non-Owned Trailer Phys Dam:</label>
                        <select style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                            <option value="$20,000/$1,000 Ded.">$20,000/$1,000 Ded.</option>
                            <option value="$20,000/$2,000 Ded.">$20,000/$2,000 Ded.</option>
                            <option value="$25,000">$25,000</option>
                            <option value="$30,000/$1,000 Ded.">$30,000/$1,000 Ded.</option>
                            <option value="$40,000/$1,000 Ded.">$40,000/$1,000 Ded.</option>
                            <option value="$40,000/$2,000 Ded.">$40,000/$2,000 Ded.</option>
                            <option value="$50,000">$50,000</option>
                            <option value="$60,000/$2,000 Ded.">$60,000/$2,000 Ded.</option>
                            <option value="$75,000">$75,000</option>
                            <option value="$100,000">$100,000</option>
                            <option value="$145,000/$1,000 Ded.">$145,000/$1,000 Ded.</option>
                            <option value="$150,000">$150,000</option>
                            <option value="Not Included" selected>Not Included</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Trailer Interchange:</label>
                        <select style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                            <option value="$25,000">$25,000</option>
                            <option value="$30,000/$1,000 Ded.">$30,000/$1,000 Ded.</option>
                            <option value="$50,000">$50,000</option>
                            <option value="$75,000">$75,000</option>
                            <option value="$100,000">$100,000</option>
                            <option value="$150,000">$150,000</option>
                            <option value="Not Included" selected>Not Included</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Roadside Assistance:</label>
                        <select style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                            <option value="Included">Included</option>
                            <option value="$250 DED.">$250 DED.</option>
                            <option value="Not Included" selected>Not Included</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">General Liability:</label>
                        <select style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                            <option value="$500,000">$500,000</option>
                            <option value="$1,000,000" selected>$1,000,000</option>
                            <option value="$1,500,000">$1,500,000</option>
                            <option value="$2,000,000">$2,000,000</option>
                            <option value="$5,000,000">$5,000,000</option>
                            <option value="Not Included">Not Included</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Cargo Limit:</label>
                        <select style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                            <option value="$50,000">$50,000</option>
                            <option value="$100,000" selected>$100,000</option>
                            <option value="$150,000">$150,000</option>
                            <option value="$200,000">$200,000</option>
                            <option value="$250,000">$250,000</option>
                            <option value="$500,000">$500,000</option>
                            <option value="Not Included">Not Included</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Cargo Deductible:</label>
                        <select style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                            <option value="$500">$500</option>
                            <option value="$1,000" selected>$1,000</option>
                            <option value="$1,500">$1,500</option>
                            <option value="$2,000">$2,000</option>
                            <option value="$2,500">$2,500</option>
                            <option value="$5,000">$5,000</option>
                            <option value="Not Included">Not Included</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Reefer Breakdown:</label>
                        <select style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                            <option value="$5,000">$5,000</option>
                            <option value="$10,000">$10,000</option>
                            <option value="$15,000">$15,000</option>
                            <option value="$25,000">$25,000</option>
                            <option value="$50,000">$50,000</option>
                            <option value="Included DED. $2500">Included DED. $2500</option>
                            <option value="$150,000/$2,500 DED.">$150,000/$2,500 DED.</option>
                            <option value="Not Included" selected>Not Included</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Rental with Downtime:</label>
                        <select style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                            <option value="$400 per day, $12,000 Max">$400 per day, $12,000 Max</option>
                            <option value="Not Included" selected>Not Included</option>
                        </select>
                    </div>
                </div>
            </div>
        </form>


        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #ccc;">
            <button onclick="saveQuoteApplication()"
                    style="background: #0066cc; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-right: 10px;">
                <i class="fas fa-save"></i> Save Application
            </button>
            <button onclick="downloadQuoteApplicationPDF()" data-quote-app-pdf="true"
                    style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-right: 10px;">
                <i class="fas fa-download"></i> Download
            </button>
            <button onclick="closeQuoteApplicationModal();"
                    style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                Close
            </button>
        </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);
    console.log('Enhanced modal created and added to DOM');

    // AUTO-POPULATE from lead profile data with improved timing
    setTimeout(() => {
        // Skip auto-population if we're editing an existing application
        if (window.editingApplicationData) {
            console.log('⚠️ Skipping auto-population - editing existing application data');
            return;
        }

        console.log('🚛 AUTO-POPULATING vehicles, trailers, drivers, and Class of Risk from lead profile...');

        // Function to create rows first, then populate
        async function autoPopulateWithSequentialTiming() {
            // Collect all data first
            let vehiclesToPopulate = [];
            if (lead.isPolicyQuote && lead.policyVehicles && lead.policyVehicles.length > 0) {
                console.log(`🚛 Found ${lead.policyVehicles.length} policy vehicles to populate`);
                vehiclesToPopulate = lead.policyVehicles;
            } else if (lead.vehicles && lead.vehicles.length > 0) {
                console.log(`🚛 Found ${lead.vehicles.length} lead vehicles to populate`);
                vehiclesToPopulate = lead.vehicles;
            }

            let trailersToPopulate = [];
            if (lead.trailers && lead.trailers.length > 0) {
                console.log(`🚚 Found ${lead.trailers.length} trailers to populate`);
                trailersToPopulate = lead.trailers;
            }

            let driversToPopulate = [];
            if (lead.isPolicyQuote && lead.policyDrivers && lead.policyDrivers.length > 0) {
                console.log(`👥 Found ${lead.policyDrivers.length} policy drivers to populate`);
                driversToPopulate = lead.policyDrivers;
            } else if (lead.drivers && lead.drivers.length > 0) {
                console.log(`👥 Found ${lead.drivers.length} lead drivers to populate`);
                driversToPopulate = lead.drivers;
            }

            let commoditiesToPopulate = [];
            if (lead.commodityHauled && lead.commodityHauled.trim().length > 0) {
                console.log('📦 Found commodities to populate:', lead.commodityHauled);
                const commodityString = lead.commodityHauled;
                commoditiesToPopulate = commodityString.split(',').map(c => c.trim()).filter(c => c.length > 0);
            }

            // Step 1: Create all required additional rows first
            console.log('📋 Creating required rows...');

            // Create additional truck rows (skip first one as it exists)
            for (let i = 1; i < vehiclesToPopulate.length; i++) {
                const addButton = modal.querySelector('button[onclick*="addTruckRow"]');
                if (addButton) {
                    addButton.click();
                    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between additions
                }
            }

            // Create additional trailer rows
            for (let i = 1; i < trailersToPopulate.length; i++) {
                const addButton = modal.querySelector('button[onclick*="addTrailerRow"]');
                if (addButton) {
                    addButton.click();
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            // Create additional driver rows
            for (let i = 1; i < driversToPopulate.length; i++) {
                const addButton = modal.querySelector('button[onclick*="addDriverRow"]');
                if (addButton) {
                    addButton.click();
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            // Create additional commodity rows
            for (let i = 1; i < commoditiesToPopulate.length; i++) {
                const addButton = modal.querySelector('button[onclick*="addCommodityRow"]');
                if (addButton) {
                    addButton.click();
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            // Step 2: Wait for all rows to be created, then populate
            await new Promise(resolve => setTimeout(resolve, 300));
            console.log('📋 All rows created, now populating...');

            // Populate vehicles
            if (vehiclesToPopulate.length > 0) {
                const truckRows = modal.querySelectorAll('#trucks-container .truck-row');
                vehiclesToPopulate.forEach((vehicle, index) => {
                    if (truckRows[index]) {
                        const inputs = truckRows[index].querySelectorAll('input');
                        if (inputs[0]) inputs[0].value = vehicle.year || '';
                        if (inputs[1]) inputs[1].value = `${vehicle.make || ''} ${vehicle.model || ''}`.trim();
                        if (inputs[2]) inputs[2].value = vehicle.type || 'Semi Truck';
                        if (inputs[3]) inputs[3].value = vehicle.vin || '';
                        if (inputs[4]) inputs[4].value = vehicle.value || '';
                        if (inputs[5]) inputs[5].value = vehicle.radius || lead.radiusOfOperation || '';
                        console.log(`🚛 Populated truck row ${index + 1}: ${vehicle.make} ${vehicle.model}`);
                    } else {
                        console.error(`🚛 Truck row ${index + 1} not found in DOM`);
                    }
                });
            }

            // Populate trailers
            if (trailersToPopulate.length > 0) {
                const trailerRows = modal.querySelectorAll('#trailers-container .trailer-row');
                trailersToPopulate.forEach((trailer, index) => {
                    if (trailerRows[index]) {
                        const inputs = trailerRows[index].querySelectorAll('input');
                        if (inputs[0]) inputs[0].value = trailer.year || '';
                        if (inputs[1]) inputs[1].value = `${trailer.make || ''} ${trailer.model || ''}`.trim();
                        if (inputs[2]) inputs[2].value = trailer.type || '';
                        if (inputs[3]) inputs[3].value = trailer.vin || '';
                        if (inputs[4]) inputs[4].value = trailer.value || '';
                        if (inputs[5]) inputs[5].value = lead.radiusOfOperation || '';
                        console.log(`🚚 Populated trailer row ${index + 1}: ${trailer.make} ${trailer.model}`);
                    } else {
                        console.error(`🚚 Trailer row ${index + 1} not found in DOM`);
                    }
                });
            }

            // Populate drivers
            if (driversToPopulate.length > 0) {
                const driverRows = modal.querySelectorAll('#drivers-container .driver-row');
                driversToPopulate.forEach((driver, index) => {
                    if (driverRows[index]) {
                        const inputs = driverRows[index].querySelectorAll('input');
                        if (inputs[0]) inputs[0].value = driver.name || '';
                        if (inputs[1]) inputs[1].value = driver.dateOfBirth || '';
                        if (inputs[2]) inputs[2].value = driver.licenseNumber || driver.dlNumber || '';
                        if (inputs[3]) inputs[3].value = driver.state || driver.licenseState || '';
                        if (inputs[4]) inputs[4].value = driver.yearsExperience || driver.cdlExperience || '';
                        if (inputs[5]) inputs[5].value = driver.dateOfHire || '';
                        if (inputs[6]) inputs[6].value = driver.accidents || driver.violations || '';
                        console.log(`👥 Populated driver row ${index + 1}: ${driver.name}`);
                    } else {
                        console.error(`👥 Driver row ${index + 1} not found in DOM`);
                    }
                });
            }

            // Populate commodities
            if (commoditiesToPopulate.length > 0) {
                // Calculate percentage for each commodity (distribute evenly)
                const percentage = Math.floor(100 / commoditiesToPopulate.length);
                let remainingPercentage = 100 - (percentage * commoditiesToPopulate.length);

                const commodityRows = modal.querySelectorAll('#commodities-container .commodity-row');
                commoditiesToPopulate.forEach((commodity, index) => {
                    if (commodityRows[index]) {
                        const inputs = commodityRows[index].querySelectorAll('input');
                        if (inputs[0]) inputs[0].value = commodity;
                        // Add remaining percentage to first commodity to ensure 100% total
                        const thisPercentage = index === 0 ? percentage + remainingPercentage : percentage;
                        if (inputs[1]) inputs[1].value = thisPercentage + '%';
                        console.log(`📦 Populated commodity row ${index + 1}: ${commodity} (${thisPercentage}%)`);
                    }
                });

                // Auto-populate class of risk based on commodities
                setTimeout(() => {
                    populateClassOfRisk(modal, commoditiesToPopulate);
                }, 100);
            } else {
                console.log('📦 No commodities found in lead data');
            }

            console.log('✅ Auto-population completed');
        }

        // Start the sequential auto-population
        autoPopulateWithSequentialTiming().catch(error => {
            console.error('❌ Error during auto-population:', error);
        });

        // Inject "Custom..." option into all coverage dropdowns
        _injectCustomOptions(content);

    }, 300);

    // Check if we're viewing/editing an existing application
    if (window.editingApplicationData) {
        console.log('📝 Pre-filling form with existing application data:', window.editingApplicationData);
        setTimeout(() => {
            prefillApplicationForm(window.editingApplicationData);
        }, 100);
    }
};

// Function to pre-fill the application form with existing data
function prefillApplicationForm(applicationData) {
    console.log('🔄 Pre-filling form with application data:', applicationData);

    const modal = document.getElementById('quote-application-modal');
    if (!modal) {
        console.error('❌ Modal not found for pre-filling');
        return;
    }

    // The actual form data is stored in applicationData.formData
    const formData = applicationData.formData || {};
    console.log('🔄 Using formData for pre-filling:', formData);

    // Pre-fill basic fields by matching saved keys to form elements
    const inputs = modal.querySelectorAll('input, select, textarea');
    console.log('📝 Found', inputs.length, 'form inputs to potentially fill');

    inputs.forEach((input, index) => {
        // Skip containers that will be handled separately
        if (input.closest('#drivers-container') ||
            input.closest('#trucks-container') ||
            input.closest('#trailers-container') ||
            input.closest('#commodities-container')) {
            return;
        }

        // Get various ways to identify this field
        let label = input.previousElementSibling?.textContent?.trim().replace(':', '') ||
                   input.closest('div')?.querySelector('label')?.textContent?.trim().replace(':', '') ||
                   input.name || input.id || '';

        // Special handling for Class of Risk fields
        let isClassOfRiskField = false;
        let currentElement = input;
        for (let i = 0; i < 5; i++) {
            currentElement = currentElement.parentElement;
            if (!currentElement) break;
            if (currentElement.innerHTML && currentElement.innerHTML.includes('CLASS OF RISK')) {
                isClassOfRiskField = true;
                break;
            }
        }

        if (isClassOfRiskField) {
            const parentDiv = input.closest('div');
            const foundLabel = parentDiv?.querySelector('label')?.textContent?.trim().replace(':', '') ||
                             parentDiv?.previousElementSibling?.textContent?.trim().replace(':', '') ||
                             parentDiv?.textContent?.match(/(Dry Van|Flatbed|Heavy Haul|Auto Hauler|Box Truck|Reefer|Dumptruck|Dump Trailer|Tanker)/)?.[1];
            if (foundLabel) {
                label = foundLabel;
            }
        }

        // Try multiple approaches to find matching data
        let value = null;

        // Direct label match
        if (formData[label]) {
            value = formData[label];
        }

        // Try common field mappings for typical insurance forms
        const fieldMap = {
            // Common field variations
            'name': formData['name'] || formData['Insured\'s Name'] || formData['Business Name'],
            'Insured\'s Name': formData['name'] || formData['Insured\'s Name'] || formData['Business Name'],
            'Business Name': formData['name'] || formData['Insured\'s Name'] || formData['Business Name'],
            'USDOT Number': formData['USDOT Number'] || formData['usdot'],
            'MC Number': formData['MC Number'] || formData['mcNumber'] || formData['MC #'],
            'MC #': formData['MC Number'] || formData['mcNumber'] || formData['MC #'],
            'Federal Tax ID': formData['Federal Tax ID'] || formData['taxId'],
            'Years in Business': formData['Years in Business'] || formData['yearsInBusiness'],
            'Effective Date': formData['Effective Date'] || formData['effectiveDate'],

            // Class of Risk fields
            'Dry Van': formData['Dry Van'],
            'Flatbed': formData['Flatbed'],
            'Heavy Haul': formData['Heavy Haul'],
            'Auto Hauler': formData['Auto Hauler'],
            'Box Truck': formData['Box Truck'],
            'Reefer': formData['Reefer'],
            'Dumptruck': formData['Dumptruck'],
            'Dump Trailer': formData['Dump Trailer'],
            'Tanker': formData['Tanker'],

            // Coverage fields
            'Auto Liability': formData['Auto Liability'],
            'General Liability': formData['General Liability'],
            'Cargo Limit': formData['Cargo Limit'],
            'Deductible': formData['Deductible'] || formData['Cargo Deductible'],
            'Reefer Breakdown': formData['Reefer Breakdown']
        };

        // Try the field mapping
        if (!value && fieldMap[label]) {
            value = fieldMap[label];
        }

        // Try to match with any available keys that might be similar
        if (!value) {
            const lowercaseLabel = label.toLowerCase();
            const matchingKey = Object.keys(formData).find(key => {
                return key.toLowerCase() === lowercaseLabel ||
                       key.toLowerCase().includes(lowercaseLabel) ||
                       lowercaseLabel.includes(key.toLowerCase());
            });

            if (matchingKey) {
                value = formData[matchingKey];
                console.log(`🔍 Found match for "${label}" using fuzzy matching with key "${matchingKey}"`);
            }
        }

        if (value) {
            input.value = value;
            console.log(`✅ Pre-filled "${label}" with: "${value}"`);
        } else if (label) {
            console.log(`❌ No match found for field: "${label}"`);
        }
    });

    // Pre-fill dynamic sections using sequential timing approach
    async function prefillDynamicSections() {
        console.log('📋 Pre-filling dynamic sections with improved timing...');

        const drivers = formData.drivers || [];
        const trucks = formData.trucks || [];
        const trailers = formData.trailers || [];
        const commodities = formData.commodities || [];

        console.log('📊 Data to prefill:', { drivers: drivers.length, trucks: trucks.length, trailers: trailers.length, commodities: commodities.length });

        // Step 0: Clean up any existing blank rows first to prevent accumulation
        console.log('🧹 Cleaning up blank rows...');

        // Remove all but the first row from each container to start fresh
        const driverContainer = modal.querySelector('#drivers-container');
        const driverRows = driverContainer.querySelectorAll('.driver-row');
        for (let i = driverRows.length - 1; i > 0; i--) {
            driverRows[i].remove();
        }

        const truckContainer = modal.querySelector('#trucks-container');
        const truckRows = truckContainer.querySelectorAll('.truck-row');
        for (let i = truckRows.length - 1; i > 0; i--) {
            truckRows[i].remove();
        }

        const trailerContainer = modal.querySelector('#trailers-container');
        const trailerRows = trailerContainer.querySelectorAll('.trailer-row');
        for (let i = trailerRows.length - 1; i > 0; i--) {
            trailerRows[i].remove();
        }

        const commodityContainer = modal.querySelector('#commodities-container');
        const commodityRows = commodityContainer.querySelectorAll('.commodity-row');
        for (let i = commodityRows.length - 1; i > 0; i--) {
            commodityRows[i].remove();
        }

        // Step 1: Create all required rows first
        if (drivers.length > 1) {
            console.log(`🚗 Creating ${drivers.length - 1} additional driver rows`);
            for (let i = 1; i < drivers.length; i++) {
                const addButton = modal.querySelector('button[onclick*="addDriverRow"]');
                if (addButton) {
                    addButton.click();
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }
        }

        if (trucks.length > 1) {
            console.log(`🚛 Creating ${trucks.length - 1} additional truck rows`);
            for (let i = 1; i < trucks.length; i++) {
                const addButton = modal.querySelector('button[onclick*="addTruckRow"]');
                if (addButton) {
                    addButton.click();
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }
        }

        if (trailers.length > 1) {
            console.log(`🚚 Creating ${trailers.length - 1} additional trailer rows`);
            for (let i = 1; i < trailers.length; i++) {
                const addButton = modal.querySelector('button[onclick*="addTrailerRow"]');
                if (addButton) {
                    addButton.click();
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }
        }

        if (commodities.length > 1) {
            console.log(`📦 Creating ${commodities.length - 1} additional commodity rows`);
            for (let i = 1; i < commodities.length; i++) {
                const addButton = modal.querySelector('button[onclick*="addCommodityRow"]');
                if (addButton) {
                    addButton.click();
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }
        }

        // Step 2: Wait for DOM to update, then populate all rows
        await new Promise(resolve => setTimeout(resolve, 200));

        // Populate drivers
        if (drivers.length > 0) {
            console.log('🚗 Pre-filling drivers section');
            const driverRows = modal.querySelectorAll('#drivers-container .driver-row');
            drivers.forEach((driver, index) => {
                if (driverRows[index]) {
                    const inputs = driverRows[index].querySelectorAll('input');
                    if (inputs[0]) inputs[0].value = driver.name || '';
                    if (inputs[1]) inputs[1].value = driver.dob || driver.dateOfBirth || '';
                    if (inputs[2]) inputs[2].value = driver.license || driver.licenseNumber || '';
                    if (inputs[3]) inputs[3].value = driver.state || driver.licenseState || '';
                    if (inputs[4]) inputs[4].value = driver.experience || '';
                    if (inputs[5]) inputs[5].value = driver.hireDate || '';
                    if (inputs[6]) inputs[6].value = driver.accidents || driver.mvr || '';
                    console.log(`🚗 Pre-filled driver row ${index + 1}: ${driver.name}`);
                }
            });
        }

        // Populate trucks
        if (trucks.length > 0) {
            console.log('🚛 Pre-filling trucks section');
            const truckRows = modal.querySelectorAll('#trucks-container .truck-row');
            trucks.forEach((truck, index) => {
                if (truckRows[index]) {
                    const inputs = truckRows[index].querySelectorAll('input');
                    if (inputs[0]) inputs[0].value = truck.year || '';
                    if (inputs[1]) inputs[1].value = truck.make || '';
                    if (inputs[2]) inputs[2].value = truck.type || '';
                    if (inputs[3]) inputs[3].value = truck.vin || '';
                    if (inputs[4]) inputs[4].value = truck.value || '';
                    if (inputs[5]) inputs[5].value = truck.radius || '';
                    console.log(`🚛 Pre-filled truck row ${index + 1}: ${truck.year} ${truck.make}`);
                }
            });
        }

        // Populate trailers
        if (trailers.length > 0) {
            console.log('🚚 Pre-filling trailers section');
            const trailerRows = modal.querySelectorAll('#trailers-container .trailer-row');
            trailers.forEach((trailer, index) => {
                if (trailerRows[index]) {
                    const inputs = trailerRows[index].querySelectorAll('input');
                    if (inputs[0]) inputs[0].value = trailer.year || '';
                    if (inputs[1]) inputs[1].value = trailer.make || '';
                    if (inputs[2]) inputs[2].value = trailer.type || '';
                    if (inputs[3]) inputs[3].value = trailer.vin || '';
                    if (inputs[4]) inputs[4].value = trailer.value || '';
                    if (inputs[5]) inputs[5].value = trailer.radius || '';
                    console.log(`🚚 Pre-filled trailer row ${index + 1}: ${trailer.year} ${trailer.make}`);
                }
            });
        }

        // Populate commodities
        if (commodities.length > 0) {
            console.log('📦 Pre-filling commodities section');
            const commodityRows = modal.querySelectorAll('#commodities-container .commodity-row');
            commodities.forEach((commodity, index) => {
                if (commodityRows[index]) {
                    const inputs = commodityRows[index].querySelectorAll('input');
                    if (inputs[0]) inputs[0].value = commodity.commodity || '';
                    if (inputs[1]) inputs[1].value = commodity.percentage || '';
                    if (inputs[2]) inputs[2].value = commodity.maxValue || '';
                    console.log(`📦 Pre-filled commodity row ${index + 1}: ${commodity.commodity}`);
                }
            });
        }

        console.log('✅ Dynamic sections pre-filling complete');
    }

    // Start the sequential pre-filling
    prefillDynamicSections().catch(error => {
        console.error('❌ Error during pre-filling:', error);
    });

    console.log('✅ Form pre-filling complete');
}

// Function to save quote application
window.saveQuoteApplication = async function() {
    console.log('💾 Saving quote application...');

    // Show loading overlay
    showLoadingOverlay('Saving Application', 'Please wait while we save your application data...');

    try {
        // Get the current lead ID from the modal or global state
        const leadId = window.currentLeadId || document.querySelector('#quote-application-modal')?.dataset?.leadId;

        if (!leadId) {
            console.error('❌ No lead ID found for saving application');
            alert('Error: Unable to determine lead ID for saving application');
            return;
        }

        console.log('📊 Saving for lead ID:', leadId);

        // Collect all form data from the modal
        const modal = document.getElementById('quote-application-modal');
        if (!modal) {
            console.error('❌ Quote application modal not found');
            alert('Error: Application modal not found');
            return;
        }

        const formData = {};

        // Get all input fields with better label mapping
        const inputs = modal.querySelectorAll('input, textarea, select');
        console.log('📊 Found input fields:', inputs.length);

        // DEBUG: Log all inputs with their values
        console.log('🔍 DEBUGGING: All form inputs and their values:');
        inputs.forEach((input, index) => {
            if (input.value) {
                const label = input.previousElementSibling?.textContent?.trim() ||
                             input.closest('div')?.querySelector('label')?.textContent?.trim() ||
                             input.name || input.id || `input_${index}`;
                console.log(`📝 Input ${index}: "${label}" = "${input.value}"`);
            }
        });

        // Collect array data by container instead of individual field counters
        const commodities = [];
        const drivers = [];
        const trucks = [];
        const trailers = [];

        // First collect general form data (non-array fields)
        inputs.forEach((input, index) => {
            if (input.type !== 'button' && input.type !== 'submit') {
                const isInDriverContainer = input.closest('#drivers-container') !== null;
                const isInCommodityContainer = input.closest('#commodities-container') !== null;
                const isInTruckContainer = input.closest('#trucks-container') !== null;
                const isInTrailerContainer = input.closest('#trailers-container') !== null;

                // Skip array containers - we'll handle these separately
                if (isInDriverContainer || isInCommodityContainer || isInTruckContainer || isInTrailerContainer) {
                    return;
                }

                // Better label detection for Class of Risk fields and others
                let rawLabel = input.previousElementSibling?.textContent?.trim().replace(':', '') ||
                              input.closest('div')?.querySelector('label')?.textContent?.trim().replace(':', '') ||
                              input.name ||
                              input.id ||
                              `field_${index}`;

                // Special handling for Class of Risk fields which might have different label structures
                const parentDiv = input.closest('div');

                // Check if this input is in a Class of Risk section by walking up the DOM
                let isClassOfRiskField = false;
                let currentElement = input;
                for (let i = 0; i < 5; i++) {
                    currentElement = currentElement.parentElement;
                    if (!currentElement) break;
                    if (currentElement.innerHTML && currentElement.innerHTML.includes('CLASS OF RISK')) {
                        isClassOfRiskField = true;
                        break;
                    }
                }

                if (isClassOfRiskField) {
                    // Try to find the label within the same container
                    const label = parentDiv?.querySelector('label')?.textContent?.trim().replace(':', '') ||
                                 parentDiv?.previousElementSibling?.textContent?.trim().replace(':', '') ||
                                 parentDiv?.textContent?.match(/(Dry Van|Flatbed|Heavy Haul|Auto Hauler|Box Truck|Reefer|Dumptruck|Dump Trailer|Tanker)/)?.[1];

                    if (label) {
                        rawLabel = label;
                        console.log(`🎯 Found Class of Risk label: "${label}" for input with value: "${input.value}"`);
                    }
                }

                // Map common labels to expected keys for display
                let mappedKey = rawLabel;
                if (rawLabel.includes("Insured's Name") || rawLabel === "Insured's Name (including DBA)") {
                    mappedKey = 'name';
                } else if (rawLabel.includes("US DOT") || rawLabel === "US DOT #") {
                    mappedKey = 'dotNumber';
                } else if (rawLabel.includes("MC #")) {
                    mappedKey = 'mcNumber';
                } else if (rawLabel.includes("Business Phone")) {
                    mappedKey = 'phone';
                } else if (rawLabel.includes("Email")) {
                    mappedKey = 'email';
                } else if (rawLabel.includes("Mailing Address")) {
                    mappedKey = 'address';
                } else if (rawLabel.includes("Federal Tax ID")) {
                    mappedKey = 'taxId';
                }

                const value = input.value?.trim() || '';
                formData[mappedKey] = value;
                formData[rawLabel] = value; // Also keep original label

                // Log Class of Risk fields specifically for debugging
                if (rawLabel.includes('Dry Van') || rawLabel.includes('Flatbed') || rawLabel.includes('Heavy Haul') ||
                    rawLabel.includes('Auto Hauler') || rawLabel.includes('Box Truck') || rawLabel.includes('Reefer') || rawLabel.includes('Dumptruck') || rawLabel.includes('Dump Trailer') || rawLabel.includes('Tanker')) {
                    console.log(`🔍 Class of Risk field: "${rawLabel}" = "${value}"`);
                }
            }
        });

        // Collect array data by container rows - only save non-empty rows
        modal.querySelectorAll('#commodities-container .commodity-row').forEach((row, index) => {
            const inputs = row.querySelectorAll('input');
            const commodity = inputs[0]?.value?.trim() || '';
            const percentage = inputs[1]?.value?.trim() || '';

            // Only save rows that actually have meaningful data
            if (commodity && commodity.length > 0) {
                commodities.push({ commodity, percentage });
                // Also store in old format for compatibility
                formData[`Commodity_${index}`] = commodity;
                formData[`% of Loads_${index}`] = percentage;
                console.log(`💾 Saving commodity row ${index + 1}: ${commodity} (${percentage})`);
            }
        });

        modal.querySelectorAll('#drivers-container .driver-row').forEach((row, index) => {
            const inputs = row.querySelectorAll('input');
            const name = inputs[0]?.value?.trim() || '';
            const dob = inputs[1]?.value?.trim() || '';
            const license = inputs[2]?.value?.trim() || '';
            const state = inputs[3]?.value?.trim() || '';
            const experience = inputs[4]?.value?.trim() || '';
            const hireDate = inputs[5]?.value?.trim() || '';
            const accidents = inputs[6]?.value?.trim() || '';

            // Only save drivers that have at least a name
            if (name && name.length > 0) {
                drivers.push({ name, dob, license, state, experience, hireDate, accidents });
                // Also store in old format for compatibility
                formData[`Driver Name_${index}`] = name;
                formData[`Date of Birth_${index}`] = dob;
                formData[`License Number_${index}`] = license;
                formData[`State_${index}`] = state;
                formData[`Years Experience_${index}`] = experience;
                formData[`Date of Hire_${index}`] = hireDate;
                formData[`# Accidents/Violations_${index}`] = accidents;
                console.log(`💾 Saving driver row ${index + 1}: ${name}`);
            }
        });

        modal.querySelectorAll('#trucks-container .truck-row').forEach((row, index) => {
            const inputs = row.querySelectorAll('input');
            const year = inputs[0]?.value?.trim() || '';
            const make = inputs[1]?.value?.trim() || '';
            const type = inputs[2]?.value?.trim() || '';
            const vin = inputs[3]?.value?.trim() || '';
            const value = inputs[4]?.value?.trim() || '';
            const radius = inputs[5]?.value?.trim() || '';

            // Only save trucks that have at least a year or make/model
            if ((year && year.length > 0) || (make && make.length > 0)) {
                trucks.push({ year, make, type, vin, value, radius });
                // Also store in old format for compatibility
                formData[`Year_${index}`] = year;
                formData[`Make/Model_${index}`] = make;
                formData[`Type of Truck_${index}`] = type;
                formData[`VIN_${index}`] = vin;
                formData[`Value_${index}`] = value;
                formData[`Radius_${index}`] = radius;
                console.log(`💾 Saving truck row ${index + 1}: ${year} ${make}`);
            }
        });

        modal.querySelectorAll('#trailers-container .trailer-row').forEach((row, index) => {
            const inputs = row.querySelectorAll('input');
            const year = inputs[0]?.value?.trim() || '';
            const make = inputs[1]?.value?.trim() || '';
            const type = inputs[2]?.value?.trim() || '';
            const vin = inputs[3]?.value?.trim() || '';
            const value = inputs[4]?.value?.trim() || '';
            const radius = inputs[5]?.value?.trim() || '';

            // Only save trailers that have at least a year or make/model
            if ((year && year.length > 0) || (make && make.length > 0)) {
                trailers.push({ year, make, type, vin, value, radius });
                // Also store in old format for compatibility
                formData[`Trailer Year_${index}`] = year;
                formData[`Trailer Make/Model_${index}`] = make;
                formData[`Trailer Type_${index}`] = type;
                formData[`Trailer VIN_${index}`] = vin;
                formData[`Trailer Value_${index}`] = value;
                formData[`Trailer Radius_${index}`] = radius;
                console.log(`💾 Saving trailer row ${index + 1}: ${year} ${make}`);
            }
        });

        // Store structured arrays in formData
        formData.commodities = commodities;
        formData.drivers = drivers;
        formData.trucks = trucks;
        formData.trailers = trailers;

        // Debug: Let's examine ALL inputs to see what we're working with
        console.log('🔍 DEBUGGING: All inputs in the modal:');
        const allInputs = modal.querySelectorAll('input');
        allInputs.forEach((input, index) => {
            const parentText = input.parentElement?.textContent?.substring(0, 100) || '';
            const value = input.value || '';
            console.log(`Input ${index}: value="${value}", parent text="${parentText}"`);
        });

        // Specific Class of Risk field collection as fallback
        console.log('🎯 Collecting Class of Risk fields specifically...');
        const classOfRiskInputs = modal.querySelectorAll('input[type="text"]');
        classOfRiskInputs.forEach((input, index) => {
            const parentText = input.parentElement?.textContent || '';
            const grandparentText = input.parentElement?.parentElement?.textContent || '';
            const value = input.value?.trim() || '';

            console.log(`🔍 Input ${index}: value="${value}", parent="${parentText.substring(0, 50)}", grandparent="${grandparentText.substring(0, 50)}"`);

            if (parentText.includes('Dry Van') || grandparentText.includes('Dry Van')) {
                formData['Dry Van'] = value;
                console.log(`🎯 Explicitly captured Dry Van: "${value}"`);
            } else if (parentText.includes('Flatbed') || grandparentText.includes('Flatbed')) {
                formData['Flatbed'] = value;
                console.log(`🎯 Explicitly captured Flatbed: "${value}"`);
            } else if (parentText.includes('Heavy Haul') || grandparentText.includes('Heavy Haul')) {
                formData['Heavy Haul'] = value;
                console.log(`🎯 Explicitly captured Heavy Haul: "${value}"`);
            } else if (parentText.includes('Auto Hauler') || grandparentText.includes('Auto Hauler')) {
                formData['Auto Hauler'] = value;
                console.log(`🎯 Explicitly captured Auto Hauler: "${value}"`);
            } else if (parentText.includes('Box Truck') || grandparentText.includes('Box Truck')) {
                formData['Box Truck'] = value;
                console.log(`🎯 Explicitly captured Box Truck: "${value}"`);
            } else if (parentText.includes('Reefer') || grandparentText.includes('Reefer')) {
                formData['Reefer'] = value;
                console.log(`🎯 Explicitly captured Reefer: "${value}"`);
            } else if (parentText.includes('Dumptruck') || grandparentText.includes('Dumptruck')) {
                formData['Dumptruck'] = value;
                console.log(`🎯 Explicitly captured Dumptruck: "${value}"`);
            } else if (parentText.includes('Dump Trailer') || grandparentText.includes('Dump Trailer')) {
                formData['Dump Trailer'] = value;
                console.log(`🎯 Explicitly captured Dump Trailer: "${value}"`);
            } else if (parentText.includes('Tanker') || grandparentText.includes('Tanker')) {
                formData['Tanker'] = value;
                console.log(`🎯 Explicitly captured Tanker: "${value}"`);
            }
        });

        console.log('📋 Final form data object:', formData);

        // Count vehicles (trucks + trailers)
        const truckRows = modal.querySelectorAll('.truck-row');
        const trailerRows = modal.querySelectorAll('.trailer-row');
        const vehicleCount = truckRows.length + trailerRows.length;

        // Add vehicle count info to formData
        formData.vehicleCount = vehicleCount;
        formData.truckCount = truckRows.length;
        formData.trailerCount = trailerRows.length;

        console.log(`🚚 Vehicle counts: ${truckRows.length} trucks + ${trailerRows.length} trailers = ${vehicleCount} total`);

        // Check if we're editing an existing application
        const isEditing = window.editingApplicationId;
        console.log('🔍 Edit mode check:', { isEditing, editingId: window.editingApplicationId });

        let applicationSubmission;

        if (isEditing) {
            // Update existing application
            applicationSubmission = {
                id: window.editingApplicationId,
                leadId: leadId,
                created: new Date().toISOString(), // Keep original created date, but we'll fix this below
                status: 'Updated',
                formData: formData
            };
            console.log('🔄 Updating existing application:', window.editingApplicationId);
        } else {
            // Create new application
            applicationSubmission = {
                id: 'app_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                leadId: leadId,
                created: new Date().toISOString(),
                status: 'Saved',
                formData: formData
            };
            console.log('✨ Creating new application');
        }

        console.log('📋 Application data to save:', applicationSubmission);

        // Save to localStorage first for immediate display
        let allSubmissions = [];
        try {
            allSubmissions = JSON.parse(localStorage.getItem('quote_applications') || '[]');
        } catch (e) {
            console.warn('⚠️ Error parsing existing localStorage data:', e);
            allSubmissions = [];
        }

        if (isEditing) {
            // Find and update the existing application
            const existingIndex = allSubmissions.findIndex(app => app.id === window.editingApplicationId);
            if (existingIndex !== -1) {
                // Preserve original creation date
                applicationSubmission.created = allSubmissions[existingIndex].created;
                applicationSubmission.status = 'Updated';
                allSubmissions[existingIndex] = applicationSubmission;
                console.log('🔄 Updated existing application at index:', existingIndex);
            } else {
                console.warn('⚠️ Could not find existing application to update, adding as new');
                allSubmissions.push(applicationSubmission);
            }
        } else {
            // Add new application
            allSubmissions.push(applicationSubmission);
            console.log('➕ Added new application to localStorage');
        }

        console.log('💾 FINAL APPLICATION SUBMISSION OBJECT:', JSON.stringify(applicationSubmission, null, 2));

        // Save to server as primary method
        try {
            let response;
            if (isEditing) {
                // Update existing application using PUT
                console.log('🔄 Updating existing application with PUT:', window.editingApplicationId);
                response = await fetch(`/api/quote-applications/${window.editingApplicationId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        applicationData: applicationSubmission
                    })
                });
            } else {
                // Create new application using POST
                console.log('✨ Creating new application with POST');
                response = await fetch('/api/quote-applications', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        leadId: leadId,
                        applicationData: applicationSubmission
                    })
                });
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Server save failed');
            }

            if (isEditing) {
                console.log('✅ Quote application updated on server:', window.editingApplicationId);
            } else {
                console.log('✅ Quote application saved to server:', result.applicationId);
            }

            // Handle response based on operation type
            if (isEditing) {
                // For updates, keep the same ID and update localStorage
                const existingIndex = allSubmissions.findIndex(app => app.id === window.editingApplicationId);
                if (existingIndex !== -1) {
                    allSubmissions[existingIndex] = applicationSubmission;
                    console.log('✅ Updated application in localStorage at index:', existingIndex);
                } else {
                    console.warn('⚠️ Could not find existing application in localStorage, adding as new');
                    allSubmissions.push(applicationSubmission);
                }
            } else {
                // For new applications, use server-generated ID
                const originalId = applicationSubmission.id;
                applicationSubmission.id = result.applicationId;

                // Remove the local ID version and add server ID version
                allSubmissions = allSubmissions.filter(app => app.id !== originalId);
                allSubmissions.push(applicationSubmission);
                console.log('✅ Added new application to localStorage with server ID:', result.applicationId);
            }
            localStorage.setItem('quote_applications', JSON.stringify(allSubmissions));
        } catch (error) {
            console.error('❌ Server save failed:', error);
            // Fallback to localStorage for now
            localStorage.setItem('quote_applications', JSON.stringify(allSubmissions));
            console.log('💾 Saved to localStorage as fallback');
        }

        // Success message removed - no popup needed
        console.log('✅ Quote Application saved successfully');

        // Fire renewals post-save callback if set (updates the renewals panel container)
        if (typeof window._renewalPostSaveCallback === 'function') {
            window._renewalPostSaveCallback();
        }

        // Hide loading overlay
        hideLoadingOverlay();

        // Close the modal and show lead profile FIRST
        closeQuoteApplicationModal();

        // Refresh the display immediately - no complex timeout logic
        console.log('🔄 Refreshing applications display for leadId:', leadId, 'type:', typeof leadId);
        console.log('🔄 Application saved with leadId:', applicationSubmission.leadId, 'type:', typeof applicationSubmission.leadId);

        // Add small delay to ensure DOM is ready for refresh
        console.log('🔄 SAVE REFRESH - Starting refresh process for leadId:', leadId);
        console.log('🔄 SAVE REFRESH - showApplicationSubmissions available:', typeof window.showApplicationSubmissions);

        setTimeout(() => {
            // Use the server-based load function
            if (window.protectedFunctions && window.protectedFunctions.loadQuoteApplications) {
                try {
                    console.log('🔄 SAVE REFRESH - Calling server-based loadQuoteApplications with leadId:', leadId);
                    window.protectedFunctions.loadQuoteApplications(leadId);
                    console.log('✅ SAVE REFRESH - Successfully called loadQuoteApplications');
                } catch (error) {
                    console.error('❌ SAVE REFRESH - Error calling loadQuoteApplications:', error);
                }
            } else if (window.showApplicationSubmissions) {
                try {
                    console.log('🔄 SAVE REFRESH - Fallback to showApplicationSubmissions with leadId:', leadId);
                    window.showApplicationSubmissions(leadId);
                    console.log('✅ SAVE REFRESH - Successfully called showApplicationSubmissions');
                } catch (error) {
                    console.error('❌ SAVE REFRESH - Error calling showApplicationSubmissions:', error);
                }
            } else {
                console.error('❌ SAVE REFRESH - No application refresh functions available');
                console.log('🔍 SAVE REFRESH - Available window functions:', Object.keys(window).filter(k => k.includes('Application')));
            }
        }, 500);

        // Additional fallback: Log what's actually in localStorage to verify save worked
        try {
            const allSubmissions = JSON.parse(localStorage.getItem('quote_applications') || '[]');
            console.log('💾 Verification: Total apps in localStorage:', allSubmissions.length);
            console.log('💾 Verification: Apps for this lead:', allSubmissions.filter(app =>
                app.leadId === leadId || app.leadId == leadId || String(app.leadId) === String(leadId)
            ).length);
            console.log('💾 Verification: All leadIds in storage:', allSubmissions.map(app => ({
                leadId: app.leadId,
                id: app.id.substring(0, 20) + '...'
            })));
        } catch (e) {
            console.error('❌ Error checking localStorage:', e);
        }

        console.log('✅ Quote application saved and displayed successfully');

        // Automatically update lead stage to 'app_prepared' after successful application save
        try {
            await updateLeadStageToAppPrepared(leadId);
            console.log('✅ Lead stage updated to app_prepared automatically');
        } catch (stageError) {
            console.error('❌ Error updating lead stage:', stageError);
        }

    } catch (error) {
        console.error('❌ Error saving quote application:', error);

        // Hide loading overlay on error
        hideLoadingOverlay();

        alert('Error saving application. Please try again.');
    }
};

// Helper function to save to server
async function saveToServer(applicationData) {
    try {
        const API_URL = window.VANGUARD_API_URL || (window.location.hostname === 'localhost'
            ? 'http://localhost:3001'
            : `http://${window.location.hostname}:3001`);

        const serverUrl = API_URL.includes('/api')
            ? `${API_URL}/policies`
            : `${API_URL}/api/policies`;

        console.log('📡 Saving to server URL:', serverUrl);

        const response = await fetch(serverUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(applicationData)
        });

        if (response.ok) {
            console.log('✅ Successfully saved to server');
            return true; // Return success
        } else {
            console.warn('⚠️ Server save failed:', response.status, response.statusText);
            return false; // Return failure
        }
    } catch (error) {
        console.warn('⚠️ Server save error:', error);
        return false; // Return failure instead of throwing
    }
}

// Function to show enhanced quote modal with saved application data
window.showEnhancedQuoteApplicationWithData = function(leadId, application) {
    console.log('👁️ Showing enhanced quote modal with saved data for lead:', leadId, 'application:', application);

    try {

    // Get the lead data from both possible sources
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const insuranceLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const allLeads = [...leads, ...insuranceLeads];
    const lead = allLeads.find(l => l.id == leadId);

    if (!lead) {
        console.error('Lead not found with ID:', leadId);
        alert('Lead not found. Please refresh and try again.');
        return;
    }

    // Ensure currentLeadId is set for saving
    window.currentLeadId = leadId;

    // Set flag that we're editing an existing application
    window.editingApplicationId = application.id;
    console.log('🔄 Setting edit mode for application:', application.id);

    // IMPORTANT: Remove any existing modals first to prevent stacking
    const existingModal = document.getElementById('quote-application-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Hide lead profile modal while quote app is open
    const leadProfileModal = document.getElementById('lead-profile-modal');
    if (leadProfileModal) {
        leadProfileModal.style.display = 'none';
    }

    // Get saved form data
    const savedData = application.formData || {};
    console.log('📊 Saved form data:', savedData);

    // Create the same modal structure as createQuoteApplicationSimple but populate with saved data
    const modal = document.createElement('div');
    modal.id = 'quote-application-modal';
    modal.dataset.leadId = leadId;
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10000000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        border-radius: 12px;
        width: 80vw;
        height: 80vh;
        overflow-y: auto;
        position: relative;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        padding: 0;
    `;

    // Helper function to get saved value or default
    // Helper function to generate dropdown options with correct selection
    function generateDropdownOptions(options, selectedValue) {
        const isCustom = selectedValue && !options.includes(selectedValue);
        const opts = options.map(option =>
            `<option value="${option}" ${option === selectedValue ? 'selected' : ''}>${option}</option>`
        ).join('');
        const customOpt = `<option value="__custom__" ${isCustom ? 'selected' : ''}>Custom...</option>`;
        return opts + customOpt;
    }

    function getSavedValue(key, defaultValue = '') {
        return savedData[key] || savedData[key.replace(/\s/g, '')] || defaultValue;
    }


    content.innerHTML = `
        <div style="position: sticky; top: 0; background: white; z-index: 1000; border-bottom: 1px solid #ccc;">
            <button onclick="closeQuoteApplicationModal();"
                    style="position: absolute; top: 10px; right: 10px; background: white; border: 2px solid #ccc; border-radius: 50%; width: 40px; height: 40px; font-size: 24px; cursor: pointer; color: #666; z-index: 1001; display: flex; align-items: center; justify-content: center; line-height: 1;"
                    onmouseover="this.style.backgroundColor='#f0f0f0'; this.style.color='#000'"
                    onmouseout="this.style.backgroundColor='white'; this.style.color='#666'">
                <span style="margin-top: -2px;">&times;</span>
            </button>
            <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #0066cc; padding-bottom: 10px;">
                <h2 style="margin: 0; color: #0066cc;">Vanguard Insurance Group LLC</h2>
                <p style="margin: 5px 0;">Brunswick, OH 44256 • 330-460-0872</p>
                <h3 style="margin: 10px 0 0 0;">TRUCKING APPLICATION (VIEW/EDIT)</h3>
            </div>
        </div>

        <form style="font-size: 14px; padding: 20px;">
            <!-- GENERAL INFORMATION -->
            <div style="background: #f0f4f8; padding: 10px; margin-bottom: 15px; border-left: 4px solid #0066cc;">
                <h4 style="margin: 0 0 10px 0; color: #0066cc;">GENERAL INFORMATION</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Effective Date:</label>
                        <input type="date" value="${(() => { const saved = getSavedValue('Effective Date', ''); if (saved) return saved.replace(/^\d{4}/, '2026'); const rd = lead.renewalDate || ''; if (rd) { const p = rd.split('/'); if (p.length === 3) return '2026-' + p[0].padStart(2,'0') + '-' + p[1].padStart(2,'0'); } return new Date().toISOString().split('T')[0]; })()}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Insured's Name (including DBA):</label>
                        <input type="text" value="${getSavedValue('name', lead.name || '')}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                    <div style="grid-column: 1 / -1;">
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Mailing Address:</label>
                        <input type="text" value="${getSavedValue('address', lead.address || '')}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Business Phone:</label>
                        <input type="text" value="${getSavedValue('phone', lead.phone || '')}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Email:</label>
                        <input type="text" value="${getSavedValue('email', lead.email || '')}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                    <div style="grid-column: 1 / -1;">
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Garaging Address (if different):</label>
                        <input type="text" value="${getSavedValue('Garaging Address (if different)', '')}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">US DOT #:</label>
                        <input type="text" value="${getSavedValue('dotNumber', lead.dotNumber || lead.dot || '')}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">MC #:</label>
                        <input type="text" value="${getSavedValue('mcNumber', lead.mcNumber || lead.mc || '')}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Federal Tax ID:</label>
                        <input type="text" value="${getSavedValue('taxId', '')}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Years in Business:</label>
                        <input type="text" value="${getSavedValue('Years in Business', '')}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                </div>
            </div>

            <!-- CLASS OF RISK -->
            <div style="background: #f0f4f8; padding: 10px; margin-bottom: 15px; border-left: 4px solid #0066cc;">
                <h4 style="margin: 0 0 10px 0; color: #0066cc;">CLASS OF RISK</h4>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-size: 12px;">Dry Van:</label>
                        <div style="display: flex; align-items: center;">
                            <input type="text" value="${getSavedValue('Dry Van', '')}" style="width: 60px; padding: 3px; border: 1px solid #ccc; border-radius: 3px;">
                            <span style="margin-left: 3px;">%</span>
                        </div>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-size: 12px;">Flatbed:</label>
                        <div style="display: flex; align-items: center;">
                            <input type="text" value="${getSavedValue('Flatbed', '')}" style="width: 60px; padding: 3px; border: 1px solid #ccc; border-radius: 3px;">
                            <span style="margin-left: 3px;">%</span>
                        </div>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-size: 12px;">Heavy Haul:</label>
                        <div style="display: flex; align-items: center;">
                            <input type="text" value="${getSavedValue('Heavy Haul', '')}" style="width: 60px; padding: 3px; border: 1px solid #ccc; border-radius: 3px;">
                            <span style="margin-left: 3px;">%</span>
                        </div>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-size: 12px;">Auto Hauler:</label>
                        <div style="display: flex; align-items: center;">
                            <input type="text" value="${getSavedValue('Auto Hauler', '')}" style="width: 60px; padding: 3px; border: 1px solid #ccc; border-radius: 3px;">
                            <span style="margin-left: 3px;">%</span>
                        </div>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-size: 12px;">Box Truck:</label>
                        <div style="display: flex; align-items: center;">
                            <input type="text" value="${getSavedValue('Box Truck', '')}" style="width: 60px; padding: 3px; border: 1px solid #ccc; border-radius: 3px;">
                            <span style="margin-left: 3px;">%</span>
                        </div>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-size: 12px;">Reefer:</label>
                        <div style="display: flex; align-items: center;">
                            <input type="text" value="${getSavedValue('Reefer', '')}" style="width: 60px; padding: 3px; border: 1px solid #ccc; border-radius: 3px;">
                            <span style="margin-left: 3px;">%</span>
                        </div>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-size: 12px;">Dumptruck:</label>
                        <div style="display: flex; align-items: center;">
                            <input type="text" value="${getSavedValue('Dumptruck', '')}" style="width: 60px; padding: 3px; border: 1px solid #ccc; border-radius: 3px;">
                            <span style="margin-left: 3px;">%</span>
                        </div>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-size: 12px;">Dump Trailer:</label>
                        <div style="display: flex; align-items: center;">
                            <input type="text" value="${getSavedValue('Dump Trailer', '')}" style="width: 60px; padding: 3px; border: 1px solid #ccc; border-radius: 3px;">
                            <span style="margin-left: 3px;">%</span>
                        </div>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-size: 12px;">Tanker:</label>
                        <div style="display: flex; align-items: center;">
                            <input type="text" value="${getSavedValue('Tanker', '')}" style="width: 60px; padding: 3px; border: 1px solid #ccc; border-radius: 3px;">
                            <span style="margin-left: 3px;">%</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- COMMODITIES -->
            <div style="background: #f0f4f8; padding: 10px; margin-bottom: 15px; border-left: 4px solid #0066cc;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 style="margin: 0; color: #0066cc;">COMMODITIES</h4>
                    <button type="button" onclick="addCommodityRow()" style="background: #28a745; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">+ Add Commodity</button>
                </div>
                <div id="commodities-container">
                    <div class="commodity-row" style="display: grid; grid-template-columns: 2fr 1fr auto; gap: 10px; align-items: end; margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;">
                        <div>
                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Commodity:</label>
                            <input type="text" value="${getSavedValue('Commodity', '')}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">% of Loads:</label>
                            <input type="text" value="${getSavedValue('% of Loads', '')}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                        </div>
                        <div>
                            <button type="button" onclick="removeCommodityRow(this)" style="background: #dc2626; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">Delete</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- DRIVERS INFORMATION -->
            <div style="background: #f0f4f8; padding: 10px; margin-bottom: 15px; border-left: 4px solid #0066cc;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 style="margin: 0; color: #0066cc;">DRIVERS INFORMATION</h4>
                    <button type="button" onclick="addDriverRow()" style="background: #28a745; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">+ Add Driver</button>
                </div>
                <div id="drivers-container">
                    <div class="driver-row" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 2fr auto; gap: 8px; align-items: end; margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;">
                        <div>
                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Name:</label>
                            <input type="text" value="${getSavedValue('Name', '')}" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Date of Birth:</label>
                            <input type="date" value="${getSavedValue('Date of Birth', '')}" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">License Number:</label>
                            <input type="text" value="${getSavedValue('License Number', '')}" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">State:</label>
                            <input type="text" value="${getSavedValue('State', '')}" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Years Experience:</label>
                            <input type="text" value="${getSavedValue('Years Experience', '')}" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Date of Hire:</label>
                            <input type="date" value="${getSavedValue('Date of Hire', '')}" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;"># Accidents/Violations:</label>
                            <input type="text" value="${getSavedValue('# Accidents/Violations', '')}" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                        </div>
                        <div>
                            <button type="button" onclick="removeDriverRow(this)" style="background: #dc2626; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">Delete</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- SCHEDULE OF AUTOS - TRUCKS -->
            <div style="background: #f0f4f8; padding: 10px; margin-bottom: 15px; border-left: 4px solid #0066cc;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 style="margin: 0; color: #0066cc;">SCHEDULE OF AUTOS - TRUCKS</h4>
                    <button type="button" onclick="addTruckRow()" style="background: #28a745; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">+ Add Truck</button>
                </div>
                <div id="trucks-container">
                    <div class="truck-row" style="display: grid; grid-template-columns: 1fr 2fr 1fr 2fr 1fr 1fr auto; gap: 8px; align-items: end; margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;">
                        <div>
                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Year:</label>
                            <input type="text" value="${getSavedValue('Year', '')}" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Make/Model:</label>
                            <input type="text" value="${getSavedValue('Make/Model', '')}" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Type of Truck:</label>
                            <input type="text" value="${getSavedValue('Type of Truck', '')}" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">VIN:</label>
                            <input type="text" value="${getSavedValue('VIN', '')}" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Value:</label>
                            <input type="text" value="${getSavedValue('Value', '')}" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Radius:</label>
                            <input type="text" value="${getSavedValue('Radius', '')}" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                        </div>
                        <div>
                            <button type="button" onclick="removeTruckRow(this)" style="background: #dc2626; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">Delete</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- SCHEDULE OF AUTOS - TRAILERS -->
            <div style="background: #f0f4f8; padding: 10px; margin-bottom: 15px; border-left: 4px solid #0066cc;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 style="margin: 0; color: #0066cc;">SCHEDULE OF AUTOS - TRAILERS</h4>
                    <button type="button" onclick="addTrailerRow()" style="background: #28a745; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">+ Add Trailer</button>
                </div>
                <div id="trailers-container">
                    <div class="trailer-row" style="display: grid; grid-template-columns: 1fr 2fr 1fr 2fr 1fr 1fr auto; gap: 8px; align-items: end; margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;">
                        <div>
                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Year:</label>
                            <input type="text" value="${getSavedValue('Trailer Year', '')}" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Make/Model:</label>
                            <input type="text" value="${getSavedValue('Trailer Make/Model', '')}" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Trailer Type:</label>
                            <input type="text" value="${getSavedValue('Trailer Type', '')}" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">VIN:</label>
                            <input type="text" value="${getSavedValue('Trailer VIN', '')}" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Value:</label>
                            <input type="text" value="${getSavedValue('Trailer Value', '')}" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Radius:</label>
                            <input type="text" value="${getSavedValue('Trailer Radius', '')}" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                        </div>
                        <div>
                            <button type="button" onclick="removeTrailerRow(this)" style="background: #dc2626; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">Delete</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- COVERAGES -->
            <div style="background: #f0f4f8; padding: 10px; margin-bottom: 15px; border-left: 4px solid #0066cc;">
                <h4 style="margin: 0 0 10px 0; color: #0066cc;">COVERAGES</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Auto Liability:</label>
                        <select style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                            ${generateDropdownOptions(['$750,000', '$1,000,000', '$1,500,000', '$2,000,000', '$5,000,000'], getSavedValue('Auto Liability', '$1,000,000'))}
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Medical Payments:</label>
                        <select style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                            ${generateDropdownOptions(['$2,000', '$5,000', '$10,000', '$15,000', '$25,000'], getSavedValue('Medical Payments', '$5,000'))}
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Uninsured/Underinsured Bodily Injury:</label>
                        <select style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                            ${generateDropdownOptions(['$100,000', '$500,000', '$750,000', '$1,000,000', '$1,500,000', '$2,000,000'], getSavedValue('Uninsured/Underinsured Bodily Injury', '$1,000,000'))}
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Uninsured Motorist Property Damage:</label>
                        <select style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                            ${generateDropdownOptions(['Not Included', '$50,000', '$100,000', '$150,000', '$200,000', '$250,000', '$500,000', '$1,000,000'], getSavedValue('Uninsured Motorist Property Damage', '$100,000'))}
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Comprehensive Deductible:</label>
                        <select style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                            ${generateDropdownOptions(['$500', '$1,000', '$1,500', '$2,000', '$2,500', '$5,000', 'Not Included'], getSavedValue('Comprehensive Deductible', '$1,000'))}
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Collision Deductible:</label>
                        <select style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                            ${generateDropdownOptions(['$500', '$1,000', '$1,500', '$2,000', '$2,500', '$5,000', 'Not Included'], getSavedValue('Collision Deductible', '$1,000'))}
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Non-Owned Trailer Phys Dam:</label>
                        <select style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                            ${generateDropdownOptions(['$20,000/$1,000 Ded.', '$20,000/$2,000 Ded.', '$25,000', '$30,000/$1,000 Ded.', '$40,000/$1,000 Ded.', '$40,000/$2,000 Ded.', '$50,000', '$60,000/$2,000 Ded.', '$75,000', '$100,000', '$145,000/$1,000 Ded.', '$150,000', 'Not Included'], getSavedValue('Non-Owned Trailer Phys Dam', 'Not Included'))}
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Trailer Interchange:</label>
                        <select style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                            ${generateDropdownOptions(['$25,000', '$30,000/$1,000 Ded.', '$50,000', '$75,000', '$100,000', '$150,000', 'Not Included'], getSavedValue('Trailer Interchange', 'Not Included'))}
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Roadside Assistance:</label>
                        <select style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                            ${generateDropdownOptions(['Included', '$250 DED.', 'Not Included'], getSavedValue('Roadside Assistance', 'Not Included'))}
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">General Liability:</label>
                        <select style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                            ${generateDropdownOptions(['$500,000', '$1,000,000', '$1,500,000', '$2,000,000', '$5,000,000', 'Not Included'], getSavedValue('General Liability', '$1,000,000'))}
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Cargo Limit:</label>
                        <select style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                            ${generateDropdownOptions(['$50,000', '$100,000', '$150,000', '$200,000', '$250,000', '$500,000', 'Not Included'], getSavedValue('Cargo Limit', '$100,000'))}
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Cargo Deductible:</label>
                        <select style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                            ${generateDropdownOptions(['$500', '$1,000', '$1,500', '$2,000', '$2,500', '$5,000', 'Not Included'], getSavedValue('Deductible', '$1,000'))}
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Reefer Breakdown:</label>
                        <select style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                            ${generateDropdownOptions(['$5,000', '$10,000', '$15,000', '$25,000', '$50,000', 'Included DED. $2500', '$150,000/$2,500 DED.', 'Not Included'], getSavedValue('Reefer Breakdown', 'Not Included'))}
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Rental with Downtime:</label>
                        <select style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                            ${generateDropdownOptions(['$400 per day, $12,000 Max', 'Not Included'], getSavedValue('Rental with Downtime', 'Not Included'))}
                        </select>
                    </div>
                </div>
            </div>
        </form>

        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #ccc; padding-left: 20px; padding-right: 20px;">
            <button onclick="saveQuoteApplication()"
                    style="background: #0066cc; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-right: 10px;">
                <i class="fas fa-save"></i> Update Application
            </button>
            <button onclick="downloadQuoteApplicationPDF()" data-quote-app-pdf="true"
                    style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-right: 10px;">
                <i class="fas fa-download"></i> Download
            </button>
            <button onclick="closeQuoteApplicationModal();"
                    style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                Close
            </button>
        </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // After DOM is created, populate array data properly
    setTimeout(() => {
        console.log('🔄 Populating array data from saved application...');
        populateArrayDataFromSaved(savedData);
    }, 100);

    // Inject "Custom..." option into all coverage dropdowns
    _injectCustomOptions(content);

    console.log('Enhanced modal with saved data created and added to DOM');

    } catch (error) {
        console.error('❌ Error in showEnhancedQuoteApplicationWithData:', error);
        alert('Error loading application details: ' + error.message);
        // Show the lead profile modal if it was hidden
        const leadProfileModal = document.getElementById('lead-profile-modal');
        if (leadProfileModal) {
            leadProfileModal.style.display = 'block';
        }
    }
};

// Function to populate array data (commodities, drivers, trucks) from saved application
function populateArrayDataFromSaved(savedData) {
    console.log('📊 Analyzing saved data for arrays:', savedData);

    try {
        // Check if we have structured data (new format) or need to reconstruct from old format
        let commodityData = savedData.commodities || [];
        let driverData = savedData.drivers || [];
        let truckData = savedData.trucks || [];
        let trailerData = savedData.trailers || [];

        console.log('📋 Structured data found - Commodities:', commodityData.length, 'Drivers:', driverData.length, 'Trucks:', truckData.length);

        // If no structured data, try to reconstruct from old indexed format
        if (commodityData.length === 0 || driverData.length === 0 || truckData.length === 0) {
            console.log('📋 No structured data found, reconstructing from old format...');
            const keys = Object.keys(savedData);

            // Reconstruct commodity data if needed
            if (commodityData.length === 0) {
                const commodityKeys = keys.filter(k => k.startsWith('Commodity') && !k.includes('% of Loads')).sort();
                const percentageKeys = keys.filter(k => k.includes('% of Loads')).sort();

                const maxCommodityItems = Math.max(commodityKeys.length, percentageKeys.length);
                for (let i = 0; i < maxCommodityItems; i++) {
                    const commodity = savedData[commodityKeys[i]] || '';
                    const percentage = savedData[percentageKeys[i]] || '';

                    if (commodity || percentage) {
                        commodityData.push({ commodity, percentage });
                    }
                }
            }

            // Reconstruct driver data if needed
            if (driverData.length === 0) {
                const nameKeys = keys.filter(k => k.includes('Driver Name') || (k.includes('Name') && k.includes('_') && !k.includes('Insured'))).sort();
                const dobKeys = keys.filter(k => k.includes('Date of Birth')).sort();
                const licenseKeys = keys.filter(k => k.includes('License Number')).sort();
                const stateKeys = keys.filter(k => k.includes('State') && !k.includes('Operating')).sort();
                const expKeys = keys.filter(k => k.includes('Years Experience')).sort();
                const hireDateKeys = keys.filter(k => k.includes('Date of Hire')).sort();
                const accidentKeys = keys.filter(k => k.includes('Accidents') || k.includes('Violations')).sort();

                const maxDriverItems = Math.max(nameKeys.length, dobKeys.length, licenseKeys.length, stateKeys.length, expKeys.length, hireDateKeys.length, accidentKeys.length);
                for (let i = 0; i < maxDriverItems; i++) {
                    const name = savedData[nameKeys[i]] || '';
                    const dob = savedData[dobKeys[i]] || '';
                    const license = savedData[licenseKeys[i]] || '';
                    const state = savedData[stateKeys[i]] || '';
                    const experience = savedData[expKeys[i]] || '';
                    const hireDate = savedData[hireDateKeys[i]] || '';
                    const accidents = savedData[accidentKeys[i]] || '';

                    if (name || dob || license || state || experience || hireDate || accidents) {
                        driverData.push({ name, dob, license, state, experience, hireDate, accidents });
                    }
                }
            }

            // Reconstruct truck data if needed
            if (truckData.length === 0) {
                const yearKeys = keys.filter(k => k.includes('Year') && !k.includes('Trailer')).sort();
                const makeKeys = keys.filter(k => k.includes('Make') && !k.includes('Trailer')).sort();
                const typeKeys = keys.filter(k => k.includes('Type') && k.includes('Truck')).sort();
                const vinKeys = keys.filter(k => k.includes('VIN') && !k.includes('Trailer')).sort();
                const valueKeys = keys.filter(k => k.includes('Value') && !k.includes('Max') && !k.includes('Trailer')).sort();
                const radiusKeys = keys.filter(k => k.includes('Radius') && !k.includes('Trailer')).sort();

                const maxTruckItems = Math.max(yearKeys.length, makeKeys.length, typeKeys.length, vinKeys.length, valueKeys.length, radiusKeys.length);
                for (let i = 0; i < maxTruckItems; i++) {
                    const year = savedData[yearKeys[i]] || '';
                    const make = savedData[makeKeys[i]] || '';
                    const type = savedData[typeKeys[i]] || '';
                    const vin = savedData[vinKeys[i]] || '';
                    const value = savedData[valueKeys[i]] || '';
                    const radius = savedData[radiusKeys[i]] || '';

                    if (year || make || type || vin || value || radius) {
                        truckData.push({ year, make, type, vin, value, radius });
                    }
                }
            }
        }

        console.log('🔄 Final array data for population:', {
            commodities: commodityData.length,
            drivers: driverData.length,
            trucks: truckData.length,
            trailers: trailerData.length
        });

        // Now populate the DOM with this data
        populateCommodityRows(commodityData);
        populateDriverRows(driverData);
        populateTruckRows(truckData);
        if (trailerData.length > 0) {
            populateTrailerRows(trailerData);
        }

    } catch (error) {
        console.error('❌ Error in populateArrayDataFromSaved:', error);
        // Don't show alert here since it's called in setTimeout
        // Just log the error and continue
    }
}

// Helper functions to populate each array type
function populateCommodityRows(commodityData) {
    const container = document.getElementById('commodities-container');
    if (!container || commodityData.length <= 1) return;

    console.log('🔄 Populating', commodityData.length, 'commodity rows');

    // Clear container and rebuild with all data
    container.innerHTML = '';

    commodityData.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'commodity-row';
        row.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr auto; gap: 10px; align-items: end; margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;';
        row.innerHTML = `
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Commodity:</label>
                <input type="text" value="${item.commodity}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">% of Loads:</label>
                <input type="text" value="${item.percentage}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
            </div>
            <div>
                <button type="button" onclick="removeCommodityRow(this)" style="background: #dc2626; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">Delete</button>
            </div>
        `;
        container.appendChild(row);
    });
}

function populateDriverRows(driverData) {
    const container = document.getElementById('drivers-container');
    if (!container || driverData.length <= 1) return;

    console.log('🔄 Populating', driverData.length, 'driver rows');

    container.innerHTML = '';

    driverData.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'driver-row';
        row.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 2fr auto; gap: 8px; align-items: end; margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;';
        row.innerHTML = `
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Name:</label>
                <input type="text" value="${item.name}" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Date of Birth:</label>
                <input type="date" value="${item.dob}" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">License Number:</label>
                <input type="text" value="${item.license}" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">State:</label>
                <input type="text" value="${item.state}" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Years Experience:</label>
                <input type="text" value="${item.experience}" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Date of Hire:</label>
                <input type="date" value="${item.hireDate}" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;"># Accidents/Violations:</label>
                <input type="text" value="${item.accidents}" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <button type="button" onclick="removeDriverRow(this)" style="background: #dc2626; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">Delete</button>
            </div>
        `;
        container.appendChild(row);
    });
}

function populateTruckRows(truckData) {
    const container = document.getElementById('trucks-container');
    if (!container || truckData.length <= 1) return;

    console.log('🔄 Populating', truckData.length, 'truck rows');

    container.innerHTML = '';

    truckData.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'truck-row';
        row.style.cssText = 'display: grid; grid-template-columns: 1fr 2fr 1fr 2fr 1fr 1fr auto; gap: 8px; align-items: end; margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;';
        row.innerHTML = `
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Year:</label>
                <input type="text" value="${item.year}" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Make/Model:</label>
                <input type="text" value="${item.make}" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Type of Truck:</label>
                <input type="text" value="${item.type}" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">VIN:</label>
                <input type="text" value="${item.vin}" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Value:</label>
                <input type="text" value="${item.value}" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Radius:</label>
                <input type="text" value="${item.radius}" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <button type="button" onclick="removeTruckRow(this)" style="background: #dc2626; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">Delete</button>
            </div>
        `;
        container.appendChild(row);
    });
};

// Function to download application as image
window.downloadQuoteApplicationPDF = function() {
    console.log('📄 Generating application image for download...');

    try {
        // Get the modal content
        const modal = document.getElementById('quote-application-modal');
        if (!modal) {
            alert('Error: Application modal not found');
            return;
        }

        // Get form data for the PDF
        const inputs = modal.querySelectorAll('input, textarea, select');
        const formData = {};

        inputs.forEach((input, index) => {
            if (input.type !== 'button' && input.type !== 'submit') {
                const label = input.previousElementSibling?.textContent?.trim().replace(':', '') ||
                             input.closest('div')?.querySelector('label')?.textContent?.trim().replace(':', '') ||
                             input.name ||
                             input.id ||
                             `field_${index}`;
                formData[label] = input.value || '';
            }
        });

        // Explicitly capture Class of Risk data for download
        const classOfRiskInputs = modal.querySelectorAll('input[type="text"]');
        classOfRiskInputs.forEach((input, index) => {
            const parentText = input.parentElement?.textContent || '';
            const grandparentText = input.parentElement?.parentElement?.textContent || '';
            const value = input.value?.trim() || '';

            if (parentText.includes('Dry Van') || grandparentText.includes('Dry Van')) {
                formData['Dry Van'] = value;
                console.log(`🎯 Download: Captured Dry Van: "${value}"`);
            } else if (parentText.includes('Flatbed') || grandparentText.includes('Flatbed')) {
                formData['Flatbed'] = value;
                console.log(`🎯 Download: Captured Flatbed: "${value}"`);
            } else if (parentText.includes('Heavy Haul') || grandparentText.includes('Heavy Haul')) {
                formData['Heavy Haul'] = value;
                console.log(`🎯 Download: Captured Heavy Haul: "${value}"`);
            } else if (parentText.includes('Auto Hauler') || grandparentText.includes('Auto Hauler')) {
                formData['Auto Hauler'] = value;
                console.log(`🎯 Download: Captured Auto Hauler: "${value}"`);
            } else if (parentText.includes('Box Truck') || grandparentText.includes('Box Truck')) {
                formData['Box Truck'] = value;
                console.log(`🎯 Download: Captured Box Truck: "${value}"`);
            } else if (parentText.includes('Reefer') || grandparentText.includes('Reefer')) {
                formData['Reefer'] = value;
                console.log(`🎯 Download: Captured Reefer: "${value}"`);
            } else if (parentText.includes('Dumptruck') || grandparentText.includes('Dumptruck')) {
                formData['Dumptruck'] = value;
                console.log(`🎯 Download: Captured Dumptruck: "${value}"`);
            } else if (parentText.includes('Dump Trailer') || grandparentText.includes('Dump Trailer')) {
                formData['Dump Trailer'] = value;
                console.log(`🎯 Download: Captured Dump Trailer: "${value}"`);
            } else if (parentText.includes('Tanker') || grandparentText.includes('Tanker')) {
                formData['Tanker'] = value;
                console.log(`🎯 Download: Captured Tanker: "${value}"`);
            }
        });

        // Capture array data with indexed keys for download
        modal.querySelectorAll('#commodities-container .commodity-row').forEach((row, index) => {
            const commodity = row.querySelector('input')?.value?.trim() || '';
            const percentage = row.querySelectorAll('input')[1]?.value?.trim() || '';

            formData[`Commodity_${index}`] = commodity;
            formData[`% of Loads_${index}`] = percentage;
        });

        modal.querySelectorAll('#drivers-container .driver-row').forEach((row, index) => {
            const inputs = row.querySelectorAll('input');
            const name = inputs[0]?.value?.trim() || '';
            const dob = inputs[1]?.value?.trim() || '';
            const license = inputs[2]?.value?.trim() || '';
            const state = inputs[3]?.value?.trim() || '';
            const experience = inputs[4]?.value?.trim() || '';
            const hireDate = inputs[5]?.value?.trim() || '';
            const accidents = inputs[6]?.value?.trim() || '';

            formData[`Driver Name_${index}`] = name;
            formData[`Date of Birth_${index}`] = dob;
            formData[`License Number_${index}`] = license;
            formData[`State_${index}`] = state;
            formData[`Years Experience_${index}`] = experience;
            formData[`Date of Hire_${index}`] = hireDate;
            formData[`# Accidents/Violations_${index}`] = accidents;
        });

        modal.querySelectorAll('#trucks-container .truck-row').forEach((row, index) => {
            const inputs = row.querySelectorAll('input');
            const year = inputs[0]?.value?.trim() || '';
            const make = inputs[1]?.value?.trim() || '';
            const type = inputs[2]?.value?.trim() || '';
            const vin = inputs[3]?.value?.trim() || '';
            const value = inputs[4]?.value?.trim() || '';
            const radius = inputs[5]?.value?.trim() || '';

            formData[`Year_${index}`] = year;
            formData[`Make/Model_${index}`] = make;
            formData[`Type of Truck_${index}`] = type;
            formData[`VIN_${index}`] = vin;
            formData[`Value_${index}`] = value;
            formData[`Radius_${index}`] = radius;
        });

        modal.querySelectorAll('#trailers-container .trailer-row').forEach((row, index) => {
            const inputs = row.querySelectorAll('input');
            const year = inputs[0]?.value?.trim() || '';
            const make = inputs[1]?.value?.trim() || '';
            const type = inputs[2]?.value?.trim() || '';
            const vin = inputs[3]?.value?.trim() || '';
            const value = inputs[4]?.value?.trim() || '';
            const radius = inputs[5]?.value?.trim() || '';

            formData[`Trailer Year_${index}`] = year;
            formData[`Trailer Make/Model_${index}`] = make;
            formData[`Trailer Type_${index}`] = type;
            formData[`Trailer VIN_${index}`] = vin;
            formData[`Trailer Value_${index}`] = value;
            formData[`Trailer Radius_${index}`] = radius;
        });

        // Get lead information
        const leadId = window.currentLeadId;
        const leads = JSON.parse(localStorage.getItem('leads') || '[]');
        const insuranceLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const allLeads = [...leads, ...insuranceLeads];
        const lead = allLeads.find(l => l.id == leadId) || {};

        console.log('📊 PDF data collected:', { leadId, lead, formData });

        // Generate PDF content
        generateApplicationPDF(lead, formData);

    } catch (error) {
        console.error('❌ Error generating PDF:', error);
        alert('Error generating PDF. Please try again.');
    }
};

// Function to generate and download the application as an image by opening a new window
function generateApplicationPDF(lead, formData) {
    console.log('📄 Opening full application page for download...', { lead, formData });

    try {
        const currentDate = new Date().toLocaleDateString();
        const companyName = formData['name'] || formData["Insured's Name (including DBA)"] || lead.name || 'N/A';

        // Count vehicles
        const truckCount = formData.truckCount || 0;
        const trailerCount = formData.trailerCount || 0;
        const totalVehicles = truckCount + trailerCount;

        // Open in full page (same window)
        const downloadWindow = window.open('', '_blank');
        if (!downloadWindow) {
            alert('Please allow pop-ups to view the trucking application');
            return;
        }

        // Generate array sections HTML first
        let arraySectionsHTML = '';

        // Extract and generate commodities
        const commodityData = extractArrayFromFormData(formData, 'commodities');
        if (commodityData.length > 0) {
            arraySectionsHTML += '<div class="section"><div class="section-title">COMMODITIES</div>';
            commodityData.forEach(item => {
                arraySectionsHTML += `<div class="array-item"><div class="array-item-grid">
                    <div class="field"><div class="field-label">Commodity:</div><div class="field-value">${item.commodity || 'N/A'}</div></div>
                    <div class="field"><div class="field-label">% of Loads:</div><div class="field-value">${item.percentage || 'N/A'}</div></div>
                </div></div>`;
            });
            arraySectionsHTML += '</div>';
        }

        // Extract and generate drivers
        const driverData = extractArrayFromFormData(formData, 'drivers');
        if (driverData.length > 0) {
            arraySectionsHTML += '<div class="section"><div class="section-title">DRIVERS INFORMATION</div>';
            driverData.forEach(item => {
                arraySectionsHTML += `<div class="array-item"><div class="array-item-grid">
                    <div class="field"><div class="field-label">Name:</div><div class="field-value">${item.name || 'N/A'}</div></div>
                    <div class="field"><div class="field-label">Date of Birth:</div><div class="field-value">${item.dob || 'N/A'}</div></div>
                    <div class="field"><div class="field-label">License Number:</div><div class="field-value">${item.license || 'N/A'}</div></div>
                    <div class="field"><div class="field-label">State:</div><div class="field-value">${item.state || 'N/A'}</div></div>
                    <div class="field"><div class="field-label">Years Experience:</div><div class="field-value">${item.experience || 'N/A'}</div></div>
                    <div class="field"><div class="field-label">Date of Hire:</div><div class="field-value">${item.hireDate || 'N/A'}</div></div>
                    <div class="field"><div class="field-label"># Accidents/Violations:</div><div class="field-value">${item.accidents || 'N/A'}</div></div>
                </div></div>`;
            });
            arraySectionsHTML += '</div>';
        }

        // Extract and generate trucks
        const truckData = extractArrayFromFormData(formData, 'trucks');
        if (truckData.length > 0) {
            arraySectionsHTML += '<div class="section"><div class="section-title">SCHEDULE OF AUTOS - TRUCKS</div>';
            truckData.forEach(item => {
                arraySectionsHTML += `<div class="array-item"><div class="array-item-grid">
                    <div class="field"><div class="field-label">Year:</div><div class="field-value">${item.year || 'N/A'}</div></div>
                    <div class="field"><div class="field-label">Make/Model:</div><div class="field-value">${item.make || 'N/A'}</div></div>
                    <div class="field"><div class="field-label">Type of Truck:</div><div class="field-value">${item.type || 'N/A'}</div></div>
                    <div class="field"><div class="field-label">Value:</div><div class="field-value">${item.value || 'N/A'}</div></div>
                    <div class="field"><div class="field-label">Radius:</div><div class="field-value">${item.radius || 'N/A'}</div></div>
                    <div class="field"><div class="field-label">VIN:</div><div class="field-value">${item.vin || 'N/A'}</div></div>
                </div></div>`;
            });
            arraySectionsHTML += '</div>';
        }

        // Extract and generate trailers
        const trailerData = extractArrayFromFormData(formData, 'trailers');
        if (trailerData.length > 0) {
            arraySectionsHTML += '<div class="section"><div class="section-title">SCHEDULE OF AUTOS - TRAILERS</div>';
            trailerData.forEach(item => {
                arraySectionsHTML += `<div class="array-item"><div class="array-item-grid">
                    <div class="field"><div class="field-label">Year:</div><div class="field-value">${item.year || 'N/A'}</div></div>
                    <div class="field"><div class="field-label">Make/Model:</div><div class="field-value">${item.make || 'N/A'}</div></div>
                    <div class="field"><div class="field-label">Trailer Type:</div><div class="field-value">${item.type || 'N/A'}</div></div>
                    <div class="field"><div class="field-label">Value:</div><div class="field-value">${item.value || 'N/A'}</div></div>
                    <div class="field"><div class="field-label">Radius:</div><div class="field-value">${item.radius || 'N/A'}</div></div>
                    <div class="field"><div class="field-label">VIN:</div><div class="field-value">${item.vin || 'N/A'}</div></div>
                </div></div>`;
            });
            arraySectionsHTML += '</div>';
        }

        // Helper function to extract array data using proper indexed keys
        function extractArrayFromFormData(formData, arrayType) {
            const arrayItems = [];
            let index = 0;

            if (arrayType === 'commodities') {
                // Look for indexed commodity data
                while (formData[`Commodity_${index}`] !== undefined ||
                       formData[`% of Loads_${index}`] !== undefined) {

                    const commodity = formData[`Commodity_${index}`] || '';
                    const percentage = formData[`% of Loads_${index}`] || '';

                    arrayItems.push({
                        commodity: commodity,
                        percentage: percentage
                    });
                    index++;
                }
            } else if (arrayType === 'drivers') {
                // Look for indexed driver data
                while (formData[`Driver Name_${index}`] !== undefined ||
                       formData[`Date of Birth_${index}`] !== undefined ||
                       formData[`License Number_${index}`] !== undefined ||
                       formData[`State_${index}`] !== undefined ||
                       formData[`Years Experience_${index}`] !== undefined ||
                       formData[`Date of Hire_${index}`] !== undefined ||
                       formData[`# Accidents/Violations_${index}`] !== undefined) {

                    const name = formData[`Driver Name_${index}`] || '';
                    const dob = formData[`Date of Birth_${index}`] || '';
                    const license = formData[`License Number_${index}`] || '';
                    const state = formData[`State_${index}`] || '';
                    const experience = formData[`Years Experience_${index}`] || '';
                    const hireDate = formData[`Date of Hire_${index}`] || '';
                    const accidents = formData[`# Accidents/Violations_${index}`] || '';

                    arrayItems.push({
                        name: name,
                        dob: dob,
                        license: license,
                        state: state,
                        experience: experience,
                        hireDate: hireDate,
                        accidents: accidents
                    });
                    index++;
                }
            } else if (arrayType === 'trucks') {
                // Look for indexed truck data
                while (formData[`Year_${index}`] !== undefined ||
                       formData[`Make/Model_${index}`] !== undefined ||
                       formData[`Type of Truck_${index}`] !== undefined ||
                       formData[`VIN_${index}`] !== undefined ||
                       formData[`Value_${index}`] !== undefined ||
                       formData[`Radius_${index}`] !== undefined) {

                    const year = formData[`Year_${index}`] || '';
                    const make = formData[`Make/Model_${index}`] || '';
                    const type = formData[`Type of Truck_${index}`] || '';
                    const vin = formData[`VIN_${index}`] || '';
                    const value = formData[`Value_${index}`] || '';
                    const radius = formData[`Radius_${index}`] || '';

                    arrayItems.push({
                        year: year,
                        make: make,
                        type: type,
                        vin: vin,
                        value: value,
                        radius: radius
                    });
                    index++;
                }
            } else if (arrayType === 'trailers') {
                // Look for indexed trailer data
                while (formData[`Trailer Year_${index}`] !== undefined ||
                       formData[`Trailer Make/Model_${index}`] !== undefined ||
                       formData[`Trailer Type_${index}`] !== undefined ||
                       formData[`Trailer VIN_${index}`] !== undefined ||
                       formData[`Trailer Value_${index}`] !== undefined ||
                       formData[`Trailer Radius_${index}`] !== undefined) {

                    const year = formData[`Trailer Year_${index}`] || '';
                    const make = formData[`Trailer Make/Model_${index}`] || '';
                    const type = formData[`Trailer Type_${index}`] || '';
                    const vin = formData[`Trailer VIN_${index}`] || '';
                    const value = formData[`Trailer Value_${index}`] || '';
                    const radius = formData[`Trailer Radius_${index}`] || '';

                    arrayItems.push({
                        year: year,
                        make: make,
                        type: type,
                        vin: vin,
                        value: value,
                        radius: radius
                    });
                    index++;
                }
            }
            return arrayItems;
        }

        // Generate complete HTML content
        const applicationHTML = `<!DOCTYPE html>
<html>
<head>
    <title>Trucking Application - ${companyName}</title>
    <style>
        @page { size: letter; margin: 0.5in; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, sans-serif;
            background: white;
            color: #333;
            line-height: 1.4;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #0066cc;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #0066cc;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .header .contact {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
        }
        .header h2 {
            color: #0066cc;
            font-size: 18px;
            margin: 0;
        }
        .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
        }
        .section-title {
            background: #f0f4f8;
            color: #0066cc;
            font-weight: bold;
            font-size: 14px;
            padding: 10px;
            border-left: 4px solid #0066cc;
            margin-bottom: 15px;
        }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
        .field { margin-bottom: 10px; }
        .field-label {
            font-weight: bold;
            color: #555;
            font-size: 11px;
            margin-bottom: 3px;
        }
        .field-value {
            padding: 6px;
            border: 1px solid #ddd;
            border-radius: 3px;
            background: #f9f9f9;
            min-height: 16px;
            font-size: 12px;
        }
        .full-width { grid-column: 1 / -1; }
        .array-item {
            background: #f9f9f9;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 10px;
            margin-bottom: 10px;
        }
        .array-item-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 10px;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 15px;
        }
        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <h1>VANGUARD INSURANCE GROUP LLC</h1>
        <div class="contact">Brunswick, OH 44256 • 330-460-0872</div>
        <h2>COMMERCIAL TRUCKING APPLICATION</h2>
    </div>

    <!-- General Information -->
    <div class="section">
        <div class="section-title">GENERAL INFORMATION</div>
        <div class="grid-2">
            <div class="field">
                <div class="field-label">Effective Date:</div>
                <div class="field-value">${formData['Effective Date'] || currentDate}</div>
            </div>
            <div class="field">
                <div class="field-label">Insured's Name (including DBA):</div>
                <div class="field-value">${companyName}</div>
            </div>
            <div class="field full-width">
                <div class="field-label">Mailing Address:</div>
                <div class="field-value">${formData['address'] || formData['Mailing Address'] || lead.address || 'N/A'}</div>
            </div>
            <div class="field">
                <div class="field-label">Business Phone:</div>
                <div class="field-value">${formData['phone'] || formData['Business Phone'] || lead.phone || 'N/A'}</div>
            </div>
            <div class="field">
                <div class="field-label">Email:</div>
                <div class="field-value">${formData['email'] || formData['Email'] || lead.email || 'N/A'}</div>
            </div>
            <div class="field full-width">
                <div class="field-label">Garaging Address (if different):</div>
                <div class="field-value">${formData['Garaging Address (if different)'] || 'N/A'}</div>
            </div>
            <div class="field">
                <div class="field-label">US DOT #:</div>
                <div class="field-value">${formData['dotNumber'] || formData['US DOT #'] || lead.dotNumber || lead.dot || 'N/A'}</div>
            </div>
            <div class="field">
                <div class="field-label">MC #:</div>
                <div class="field-value">${formData['mcNumber'] || formData['MC #'] || lead.mcNumber || lead.mc || 'N/A'}</div>
            </div>
            <div class="field">
                <div class="field-label">Federal Tax ID:</div>
                <div class="field-value">${formData['taxId'] || formData['Federal Tax ID'] || 'N/A'}</div>
            </div>
            <div class="field">
                <div class="field-label">Years in Business:</div>
                <div class="field-value">${formData['Years in Business'] || 'N/A'}</div>
            </div>
        </div>
    </div>

    <!-- Class of Risk -->
    <div class="section">
        <div class="section-title">CLASS OF RISK</div>
        <div class="grid-3">
            <div class="field">
                <div class="field-label">Dry Van:</div>
                <div class="field-value">${formData['Dry Van'] || ''}${formData['Dry Van'] ? '%' : ''}</div>
            </div>
            <div class="field">
                <div class="field-label">Flatbed:</div>
                <div class="field-value">${formData['Flatbed'] || ''}${formData['Flatbed'] ? '%' : ''}</div>
            </div>
            <div class="field">
                <div class="field-label">Heavy Haul:</div>
                <div class="field-value">${formData['Heavy Haul'] || ''}${formData['Heavy Haul'] ? '%' : ''}</div>
            </div>
            <div class="field">
                <div class="field-label">Auto Hauler:</div>
                <div class="field-value">${formData['Auto Hauler'] || ''}${formData['Auto Hauler'] ? '%' : ''}</div>
            </div>
            <div class="field">
                <div class="field-label">Box Truck:</div>
                <div class="field-value">${formData['Box Truck'] || ''}${formData['Box Truck'] ? '%' : ''}</div>
            </div>
            <div class="field">
                <div class="field-label">Reefer:</div>
                <div class="field-value">${formData['Reefer'] || ''}${formData['Reefer'] ? '%' : ''}</div>
            </div>
            <div class="field">
                <div class="field-label">Dumptruck:</div>
                <div class="field-value">${formData['Dumptruck'] || ''}${formData['Dumptruck'] ? '%' : ''}</div>
            </div>
        </div>
    </div>

    <!-- Dynamic Array Sections -->
    ${arraySectionsHTML}

    <!-- Coverages -->
    <div class="section">
        <div class="section-title">COVERAGES</div>
        <div class="grid-3">
            <div class="field">
                <div class="field-label">Auto Liability:</div>
                <div class="field-value">${formData['Auto Liability'] || '$1,000,000'}</div>
            </div>
            <div class="field">
                <div class="field-label">Uninsured Motorist:</div>
                <div class="field-value">${formData['Uninsured Motorist'] || '$1,000,000'}</div>
            </div>
            <div class="field">
                <div class="field-label">Physical Damage:</div>
                <div class="field-value">${formData['Physical Damage'] || 'ACV'}</div>
            </div>
            <div class="field">
                <div class="field-label">Comprehensive Deductible:</div>
                <div class="field-value">${formData['Comprehensive Deductible'] || '$2,500'}</div>
            </div>
            <div class="field">
                <div class="field-label">Collision Deductible:</div>
                <div class="field-value">${formData['Collision Deductible'] || '$2,500'}</div>
            </div>
            <div class="field">
                <div class="field-label">Non-Owned Trailer Phys Dam:</div>
                <div class="field-value">${formData['Non-Owned Trailer Phys Dam'] || formData['Non-Owned Trailer Physical Damage'] || 'Not Included'}</div>
            </div>
            <div class="field">
                <div class="field-label">Trailer Interchange:</div>
                <div class="field-value">${formData['Trailer Interchange'] || 'Not Included'}</div>
            </div>
            <div class="field">
                <div class="field-label">Roadside Assistance:</div>
                <div class="field-value">${formData['Roadside Assistance'] || 'Not Included'}</div>
            </div>
            <div class="field">
                <div class="field-label">General Liability:</div>
                <div class="field-value">${formData['General Liability'] || '$1,000,000'}</div>
            </div>
            <div class="field">
                <div class="field-label">Cargo Limit:</div>
                <div class="field-value">${formData['Cargo Limit'] || '$100,000'}</div>
            </div>
            <div class="field">
                <div class="field-label">Cargo Deductible:</div>
                <div class="field-value">${formData['Deductible'] || formData['Cargo Deductible'] || '$2,500'}</div>
            </div>
            <div class="field">
                <div class="field-label">Reefer Breakdown:</div>
                <div class="field-value">${formData['Reefer Breakdown'] || 'Not Included'}</div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <p>This application was generated electronically by Vanguard Insurance Group LLC</p>
        <p>For questions or modifications, please contact us at 330-460-0872</p>
    </div>

    <script>
        // Automatically open print dialog when page loads and close window after
        window.onload = function() {
            setTimeout(function() {
                window.print();

                // Auto-close window after print dialog
                setTimeout(function() {
                    console.log('🚪 Auto-closing download window...');
                    window.close();
                }, 2000);
            }, 1000);
        };
    </script>
</body>
</html>`;

        // Write HTML to the new window
        downloadWindow.document.write(applicationHTML);
        downloadWindow.document.close();

        console.log('✅ Download window opened with full application');

        // Add auto-close functionality to the download window
        setTimeout(() => {
            if (downloadWindow && !downloadWindow.closed) {
                downloadWindow.close();
                console.log('✅ Download window closed after download');
            }
        }, 2000); // 2 second delay to let user see the content briefly

        // Close the application modal after download starts
        setTimeout(() => {
            const modal = document.getElementById('quote-application-modal');
            if (modal) {
                modal.remove();
                console.log('✅ Application modal closed after download');
            }
        }, 1500); // 1.5 second delay to let user see the download started

    } catch (error) {
        console.error('❌ Error generating application download:', error);
        alert('Error generating application download. Please try again.');
    }
}

// Loss Runs Upload Function
window.uploadLossRuns = function() {
    console.log('📄 Starting loss runs upload...');

    // Show loading overlay for upload
    showLoadingOverlay('Uploading Loss Runs', 'Please wait while we upload your PDF file...');

    const fileInput = document.getElementById('loss-runs-upload');
    const statusDiv = document.getElementById('loss-runs-status');
    const listDiv = document.getElementById('loss-runs-list');

    if (!fileInput.files.length) {
        hideLoadingOverlay(); // Hide loading if no file selected
        showLossRunsStatus('Please select a PDF file to upload.', 'error');
        return;
    }

    const file = fileInput.files[0];

    // Validate file type
    if (file.type !== 'application/pdf') {
        hideLoadingOverlay(); // Hide loading on validation error
        showLossRunsStatus('Please select a PDF file only.', 'error');
        return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        hideLoadingOverlay(); // Hide loading on validation error
        showLossRunsStatus('File size must be less than 10MB.', 'error');
        return;
    }

    // Show uploading status
    showLossRunsStatus('Uploading loss runs PDF...', 'info');

    // Get current lead ID
    const leadId = window.currentLeadId;
    if (!leadId) {
        hideLoadingOverlay(); // Hide loading on error
        showLossRunsStatus('Error: No lead ID found. Please save the application first.', 'error');
        return;
    }

    // Create FormData for upload
    const formData = new FormData();
    formData.append('lossRunsPdf', file);
    formData.append('leadId', leadId);
    formData.append('uploadType', 'loss_runs');

    // Upload to server
    fetch('/api/upload-loss-runs', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            hideLoadingOverlay(); // Hide loading on success
            showLossRunsStatus('Loss runs PDF uploaded successfully!', 'success');
            addLossRunsToList(data.filename, data.uploadDate);
            fileInput.value = ''; // Clear the input

            // Store in localStorage for persistence
            saveLossRunsToStorage(leadId, {
                filename: data.filename,
                originalName: file.name,
                uploadDate: data.uploadDate,
                size: file.size
            });
        } else {
            throw new Error(data.error || 'Upload failed');
        }
    })
    .catch(error => {
        console.error('❌ Loss runs upload error:', error);
        hideLoadingOverlay(); // Hide loading on error
        showLossRunsStatus('Upload failed: ' + error.message, 'error');

        // Fallback: Save file info to localStorage only
        const fileInfo = {
            filename: file.name,
            originalName: file.name,
            uploadDate: new Date().toISOString(),
            size: file.size,
            localOnly: true
        };
        saveLossRunsToStorage(leadId, fileInfo);
        addLossRunsToList(file.name, fileInfo.uploadDate, true);
        showLossRunsStatus('File saved locally (server upload failed)', 'warning');
        fileInput.value = '';
        // Note: hideLoadingOverlay() already called above in the catch block
    });
};

// Helper function to show status messages
function showLossRunsStatus(message, type) {
    const statusDiv = document.getElementById('loss-runs-status');
    if (!statusDiv) return;

    const colors = {
        success: '#d4edda',
        error: '#f8d7da',
        warning: '#fff3cd',
        info: '#d1ecf1'
    };

    const textColors = {
        success: '#155724',
        error: '#721c24',
        warning: '#856404',
        info: '#0c5460'
    };

    statusDiv.style.display = 'block';
    statusDiv.style.backgroundColor = colors[type] || colors.info;
    statusDiv.style.color = textColors[type] || textColors.info;
    statusDiv.style.border = `1px solid ${colors[type] || colors.info}`;
    statusDiv.textContent = message;

    // Auto-hide after 5 seconds for success/info messages
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
}

// Helper function to add file to the list
function addLossRunsToList(filename, uploadDate, localOnly = false) {
    const listDiv = document.getElementById('loss-runs-list');
    if (!listDiv) return;

    const date = new Date(uploadDate).toLocaleDateString();
    const localLabel = localOnly ? ' (Local)' : '';

    const fileItem = document.createElement('div');
    fileItem.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 8px; background: white; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 5px; font-size: 12px;';

    fileItem.innerHTML = `
        <div>
            <i class="fas fa-file-pdf" style="color: #dc3545; margin-right: 5px;"></i>
            <strong>${filename}${localLabel}</strong>
            <div style="color: #666; font-size: 11px;">Uploaded: ${date}</div>
        </div>
        <button onclick="removeLossRuns('${filename}')"
                style="background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 10px;">
            <i class="fas fa-trash"></i> Remove
        </button>
    `;

    listDiv.appendChild(fileItem);
}

// Helper function to save to localStorage
function saveLossRunsToStorage(leadId, fileInfo) {
    try {
        let lossRunsData = JSON.parse(localStorage.getItem('lossRunsData') || '{}');
        if (!lossRunsData[leadId]) {
            lossRunsData[leadId] = [];
        }
        lossRunsData[leadId].push(fileInfo);
        localStorage.setItem('lossRunsData', JSON.stringify(lossRunsData));
        console.log('✅ Saved loss runs data to localStorage');
    } catch (error) {
        console.error('❌ Error saving loss runs data:', error);
    }
}

// Function to remove loss runs
window.removeLossRuns = function(filename) {
    const leadId = window.currentLeadId;
    if (!leadId) return;

    if (confirm('Are you sure you want to remove this loss runs file?')) {
        // Show loading overlay for deletion
        showLoadingOverlay('Removing Loss Runs', 'Please wait while we delete the selected file...');

        // Remove from localStorage
        try {
            let lossRunsData = JSON.parse(localStorage.getItem('lossRunsData') || '{}');
            if (lossRunsData[leadId]) {
                lossRunsData[leadId] = lossRunsData[leadId].filter(file => file.filename !== filename);
                localStorage.setItem('lossRunsData', JSON.stringify(lossRunsData));
            }
        } catch (error) {
            console.error('❌ Error removing from localStorage:', error);
        }

        // Remove from display
        const listDiv = document.getElementById('loss-runs-list');
        if (listDiv) {
            loadLossRunsForLead(leadId);
        }

        // Try to remove from server
        fetch('/api/remove-loss-runs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leadId, filename })
        }).catch(error => {
            console.warn('⚠️ Server removal failed:', error);
        });

        hideLoadingOverlay(); // Hide loading after completion
        showLossRunsStatus('Loss runs file removed.', 'info');
    }
};

// Function to load existing loss runs when modal opens
function loadLossRunsForLead(leadId) {
    const listDiv = document.getElementById('loss-runs-list');
    if (!listDiv) return;

    listDiv.innerHTML = '';

    try {
        const lossRunsData = JSON.parse(localStorage.getItem('lossRunsData') || '{}');
        const leadFiles = lossRunsData[leadId] || [];

        leadFiles.forEach(file => {
            addLossRunsToList(file.filename, file.uploadDate, file.localOnly);
        });

        if (leadFiles.length > 0) {
            console.log(`✅ Loaded ${leadFiles.length} loss runs files for lead ${leadId}`);
        }
    } catch (error) {
        console.error('❌ Error loading loss runs data:', error);
    }
}

// Function to automatically update lead stage to 'app_prepared' after application save
async function updateLeadStageToAppPrepared(leadId) {
    console.log('🔄 Updating lead stage to app_prepared for lead:', leadId);

    try {
        // Get leads from both localStorage sources
        const insurance_leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const regular_leads = JSON.parse(localStorage.getItem('leads') || '[]');

        // Find the lead in both arrays
        let leadFound = false;

        // Update in insurance_leads
        const insuranceLeadIndex = insurance_leads.findIndex(l => l.id == leadId || String(l.id) === String(leadId));
        if (insuranceLeadIndex !== -1) {
            console.log('📋 Found lead in insurance_leads, current stage:', insurance_leads[insuranceLeadIndex].stage);
            insurance_leads[insuranceLeadIndex].stage = 'app_prepared';
            insurance_leads[insuranceLeadIndex].updatedAt = new Date().toISOString();

            // Update stage timestamps
            if (!insurance_leads[insuranceLeadIndex].stageTimestamps) {
                insurance_leads[insuranceLeadIndex].stageTimestamps = {};
            }
            insurance_leads[insuranceLeadIndex].stageTimestamps['app_prepared'] = new Date().toISOString();

            leadFound = true;
        }

        // Update in regular leads
        const regularLeadIndex = regular_leads.findIndex(l => l.id == leadId || String(l.id) === String(leadId));
        if (regularLeadIndex !== -1) {
            console.log('📋 Found lead in regular leads, current stage:', regular_leads[regularLeadIndex].stage);
            regular_leads[regularLeadIndex].stage = 'app_prepared';
            regular_leads[regularLeadIndex].updatedAt = new Date().toISOString();

            // Update stage timestamps
            if (!regular_leads[regularLeadIndex].stageTimestamps) {
                regular_leads[regularLeadIndex].stageTimestamps = {};
            }
            regular_leads[regularLeadIndex].stageTimestamps['app_prepared'] = new Date().toISOString();

            leadFound = true;
        }

        if (!leadFound) {
            throw new Error(`Lead with ID ${leadId} not found in localStorage`);
        }

        // Save updated leads back to localStorage
        localStorage.setItem('insurance_leads', JSON.stringify(insurance_leads));
        localStorage.setItem('leads', JSON.stringify(regular_leads));

        // Save to server using the existing saveLeadToServer function if available
        const updatedLead = insurance_leads[insuranceLeadIndex] || regular_leads[regularLeadIndex];
        if (window.saveLeadToServer && typeof window.saveLeadToServer === 'function') {
            try {
                await window.saveLeadToServer(updatedLead);
                console.log('✅ Lead stage saved to server successfully');
            } catch (serverError) {
                console.warn('⚠️ Failed to save lead stage to server:', serverError);
                // Don't throw error - localStorage update was successful
            }
        } else {
            console.log('ℹ️ saveLeadToServer function not available, stage updated in localStorage only');
        }

        console.log('✅ Lead stage updated to app_prepared successfully');

        // Refresh the current view if we're on the leads page
        if (window.location.hash === '#leads' && window.loadLeadsView) {
            setTimeout(() => {
                window.loadLeadsView();
                console.log('🔄 Refreshed leads view after stage update');

                // AGGRESSIVE REAL-TIME HIGHLIGHTING UPDATE after automatic stage update
                const forceHighlightingUpdate = () => {
                    console.log('🎨 AGGRESSIVE HIGHLIGHTING: Auto stage update to app_prepared, forcing highlighting');

                    // FIRST: Remove green highlighting from rows that now have TO DO text
                    const tableBody = document.getElementById('leadsTableBody');
                    if (tableBody) {
                        const rows = tableBody.querySelectorAll('tr');
                        rows.forEach(row => {
                            const todoCell = row.querySelector('td:nth-child(6)'); // TO DO column
                            if (todoCell) {
                                const todoText = todoCell.textContent.trim();
                                // If row has TO DO text but still has green highlighting, remove it immediately
                                if (todoText && todoText.length > 0) {
                                    if (row.classList.contains('reach-out-complete') ||
                                        row.style.backgroundColor.includes('16, 185, 129')) {
                                        console.log('🔴 AUTO-REMOVING green highlight - row now has TO DO text:', todoText);
                                        row.classList.remove('reach-out-complete');
                                        row.style.removeProperty('background-color');
                                        row.style.removeProperty('background');
                                        row.style.removeProperty('border-left');
                                        row.style.removeProperty('border-right');
                                    }
                                }
                            }
                        });
                    }

                    // THEN: Apply regular highlighting functions
                    if (window.forceAllHighlighting) {
                        window.forceAllHighlighting();
                    }
                    if (window.applyReachOutCompleteHighlighting) {
                        window.applyReachOutCompleteHighlighting();
                    }
                    if (window.synchronizedHighlighting) {
                        window.synchronizedHighlighting();
                    }
                    if (window.ultimateHighlight) {
                        window.ultimateHighlight();
                    }
                };

                // Apply multiple times with different timings to ensure immediate update
                forceHighlightingUpdate(); // Immediate
                setTimeout(forceHighlightingUpdate, 100);  // Quick follow-up
                setTimeout(forceHighlightingUpdate, 300);  // Delayed follow-up
                setTimeout(forceHighlightingUpdate, 600);  // Final follow-up
            }, 500);
        }

    } catch (error) {
        console.error('❌ Error updating lead stage:', error);
        throw error;
    }
}

// Auto-load loss runs when modal opens
document.addEventListener('DOMContentLoaded', function() {
    // Set up observer to load loss runs when modal opens
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                const modal = document.getElementById('quote-application-modal');
                if (modal && window.currentLeadId) {
                    setTimeout(() => loadLossRunsForLead(window.currentLeadId), 100);
                }
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
});

// Function to auto-populate Class of Risk based on commodity types
function populateClassOfRisk(modal, commodities) {
    console.log('🎯 Auto-populating Class of Risk based on commodities:', commodities);

    // Define mapping from commodities to class of risk categories
    const commodityToRiskMapping = {
        // Dry Van commodities
        'general freight': 'Dry Van',
        'consumer goods': 'Dry Van',
        'packaged goods': 'Dry Van',
        'retail goods': 'Dry Van',
        'clothing': 'Dry Van',
        'textiles': 'Dry Van',
        'paper products': 'Dry Van',
        'food products': 'Dry Van',
        'beverages': 'Dry Van',

        // Flatbed commodities (matching "Flat Bed" in the form)
        'construction materials': 'Flat Bed',
        'building materials': 'Flat Bed',
        'steel': 'Flat Bed',
        'lumber': 'Flat Bed',
        'pipes': 'Flat Bed',
        'machinery': 'Flat Bed',
        'equipment': 'Flat Bed',
        'metal products': 'Flat Bed',
        'coils': 'Flat Bed',
        'structural steel': 'Flat Bed',

        // Reefer commodities
        'refrigerated': 'Reefer',
        'frozen': 'Reefer',
        'perishable': 'Reefer',
        'dairy': 'Reefer',
        'meat': 'Reefer',
        'produce': 'Reefer',
        'pharmaceuticals': 'Reefer',
        'temperature controlled': 'Reefer',
        'fresh produce': 'Reefer',

        // Auto Hauler commodities
        'vehicles': 'Auto Hauler',
        'cars': 'Auto Hauler',
        'automobiles': 'Auto Hauler',
        'auto': 'Auto Hauler',

        // Box Truck commodities
        'local delivery': 'Box Truck',
        'packages': 'Box Truck',
        'small freight': 'Box Truck',

        // Dump Truck commodities
        'aggregate': 'Dump Truck',
        'sand': 'Dump Truck',
        'gravel': 'Dump Truck',
        'dirt': 'Dump Truck',
        'rock': 'Dump Truck',
        'demolition': 'Dump Truck'
    };

    // Count occurrences of each risk category
    const riskCategoryCounts = {};

    commodities.forEach(commodity => {
        const lowerCommodity = commodity.toLowerCase().trim();

        // Find matching risk category
        let matchedCategory = null;
        for (const [key, category] of Object.entries(commodityToRiskMapping)) {
            if (lowerCommodity.includes(key) || key.includes(lowerCommodity)) {
                matchedCategory = category;
                break;
            }
        }

        // Default to Dry Van if no specific match found
        if (!matchedCategory) {
            matchedCategory = 'Dry Van';
        }

        riskCategoryCounts[matchedCategory] = (riskCategoryCounts[matchedCategory] || 0) + 1;
        console.log(`📦 Commodity "${commodity}" → ${matchedCategory}`);
    });

    // Calculate percentages for each risk category
    const totalCommodities = commodities.length;
    const riskPercentages = {};

    Object.keys(riskCategoryCounts).forEach(category => {
        const count = riskCategoryCounts[category];
        const percentage = Math.floor((count / totalCommodities) * 100);
        riskPercentages[category] = percentage;
    });

    // Distribute any remaining percentage to the most common category
    const totalAssigned = Object.values(riskPercentages).reduce((sum, pct) => sum + pct, 0);
    const remaining = 100 - totalAssigned;

    if (remaining > 0) {
        // Find the category with the highest count
        const mostCommonCategory = Object.keys(riskCategoryCounts).reduce((a, b) =>
            riskCategoryCounts[a] > riskCategoryCounts[b] ? a : b
        );
        riskPercentages[mostCommonCategory] += remaining;
    }

    console.log('🎯 Calculated risk percentages:', riskPercentages);

    // Now populate the Class of Risk fields
    setTimeout(() => {
        Object.keys(riskPercentages).forEach(category => {
            const percentage = riskPercentages[category];

            // Find the input field for this risk category
            const inputs = modal.querySelectorAll('input[type="text"]');

            inputs.forEach(input => {
                const parentText = input.parentElement?.textContent || '';
                const grandparentText = input.parentElement?.parentElement?.textContent || '';

                // Check if this input corresponds to our risk category
                if (parentText.includes(category) || grandparentText.includes(category)) {
                    input.value = percentage + '%';
                    console.log(`🎯 Set ${category} to ${percentage}%`);

                    // Trigger any change events
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        });

        console.log('✅ Class of Risk auto-population completed');
    }, 100);
}

console.log('✅ Enhanced Quote Application Modal Loaded');

// ─── Coverage dropdown → custom text input swap ───────────────────────────────
function _injectCustomOptions(container) {
    (container || document).querySelectorAll('select').forEach(function(sel) {
        if (!Array.from(sel.options).find(function(o) { return o.value === '__custom__'; })) {
            var opt = document.createElement('option');
            opt.value = '__custom__';
            opt.text = 'Custom...';
            sel.appendChild(opt);
        }
    });
}

document.addEventListener('change', function(e) {
    var sel = e.target;
    if (sel.tagName !== 'SELECT' || sel.value !== '__custom__') return;
    // Only act on selects inside the quote modal
    if (!sel.closest('#quoteApplicationModal, #enhancedQuoteModal, [id*="quote"], [id*="Quote"]')) return;
    _coverageToCustomInput(sel);
});

function _coverageToCustomInput(sel) {
    // Serialize the select's current options so we can restore it
    var optionsHtml = Array.from(sel.options).map(function(o) {
        return '<option value="' + o.value + '">' + o.text + '</option>';
    }).join('');
    var selectHtml = sel.outerHTML.replace(' value="__custom__"', '');

    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:flex;gap:3px;align-items:stretch;';
    wrapper.setAttribute('data-coverage-custom', '1');

    var input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Enter custom value';
    input.style.cssText = sel.style.cssText + ';flex:1;padding:5px;border:1px solid #0066cc;border-radius:3px 0 0 3px;font-size:12px;';
    // Copy name/data attrs
    if (sel.name) input.name = sel.name;
    input.setAttribute('data-select-html', selectHtml);

    var restoreBtn = document.createElement('button');
    restoreBtn.type = 'button';
    restoreBtn.innerHTML = '&#9660;';
    restoreBtn.title = 'Show dropdown options';
    restoreBtn.style.cssText = 'padding:0 8px;border:1px solid #0066cc;border-left:none;border-radius:0 3px 3px 0;background:white;cursor:pointer;font-size:11px;color:#0066cc;';
    restoreBtn.onclick = function() { _coverageRestoreSelect(this); };

    wrapper.appendChild(input);
    wrapper.appendChild(restoreBtn);
    sel.parentNode.replaceChild(wrapper, sel);
    input.focus();
}

function _coverageRestoreSelect(btn) {
    var wrapper = btn.closest('[data-coverage-custom]');
    var input = wrapper.querySelector('input');
    var customValue = input.value.trim();
    var selectHtml = input.getAttribute('data-select-html');

    var tmp = document.createElement('div');
    tmp.innerHTML = selectHtml;
    var newSel = tmp.firstChild;

    // If user typed something, add it as a selected option
    if (customValue) {
        var existing = Array.from(newSel.options).find(function(o) { return o.value === customValue; });
        if (!existing) {
            var customOpt = document.createElement('option');
            customOpt.value = customValue;
            customOpt.text = customValue;
            // Insert before the "Custom..." option
            var customPlaceholder = Array.from(newSel.options).find(function(o) { return o.value === '__custom__'; });
            newSel.insertBefore(customOpt, customPlaceholder || null);
        }
        newSel.value = customValue;
    }

    wrapper.parentNode.replaceChild(newSel, wrapper);
}