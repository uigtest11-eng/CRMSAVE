// Enhanced Lead Profile Display for Commercial Auto Leads
// Shows detailed vehicle, driver, and transcript information

function showLeadProfile(leadId) {
    // Try both storage keys since data might be in either
    let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    let lead = leads.find(l => String(l.id) === String(leadId));

    // If not found in insurance_leads, try the regular leads key
    if (!lead) {
        leads = JSON.parse(localStorage.getItem('leads') || '[]');
        lead = leads.find(l => String(l.id) === String(leadId));
    }

    if (!lead) {
        console.error('Lead not found in either storage key:', leadId);
        alert('Lead not found');
        return;
    }
    
    // Initialize lead data structure if not present
    if (!lead.vehicles) lead.vehicles = [];
    if (!lead.trailers) lead.trailers = [];
    if (!lead.drivers) lead.drivers = [];
    if (!lead.transcriptText) lead.transcriptText = '';
    
    // Check if this is a commercial auto lead
    const isCommercialAuto = lead.product && (
        lead.product.toLowerCase().includes('commercial') || 
        lead.product.toLowerCase().includes('fleet') ||
        lead.product.toLowerCase().includes('trucking')
    );
    
    let profileHTML = '';
    
    if (isCommercialAuto) {
        // Commercial Auto Lead Profile
        profileHTML = `
            <div class="modal-overlay" onclick="if(event.target === this) closeLeadProfile()">
                <div class="modal-content lead-profile-modal" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2><i class="fas fa-truck"></i> Commercial Auto Lead Profile</h2>
                        <button class="close-btn" onclick="closeLeadProfile()">&times;</button>
                    </div>
                    
                    <div class="lead-profile-content">
                        <!-- Company Information -->
                        <div class="profile-section">
                            <h3>Company Information</h3>
                            <div class="info-grid">
                                <div class="info-item">
                                    <label>Company Name:</label>
                                    <input type="text" id="lead-company" value="${lead.name || ''}" onchange="updateLeadField(${leadId}, 'name', this.value)">
                                </div>
                                <div class="info-item">
                                    <label>Contact:</label>
                                    <input type="text" id="lead-contact" value="${lead.contact || ''}" onchange="updateLeadField(${leadId}, 'contact', this.value)">
                                </div>
                                <div class="info-item">
                                    <label>Phone:</label>
                                    <input type="text" id="lead-phone" value="${lead.phone || ''}" onchange="updateLeadField(${leadId}, 'phone', this.value)">
                                </div>
                                <div class="info-item">
                                    <label>Email:</label>
                                    <input type="text" id="lead-email" value="${lead.email || ''}" onchange="updateLeadField(${leadId}, 'email', this.value)">
                                </div>
                                <div class="info-item">
                                    <label>DOT Number:</label>
                                    <input type="text" id="lead-dot" value="${lead.dotNumber || ''}" onchange="updateLeadField(${leadId}, 'dotNumber', this.value)">
                                </div>
                                <div class="info-item">
                                    <label>MC Number:</label>
                                    <input type="text" id="lead-mc" value="${lead.mcNumber || ''}" onchange="updateLeadField(${leadId}, 'mcNumber', this.value)">
                                </div>
                                <div class="info-item">
                                    <label>Stage:</label>
                                    <select id="lead-stage" onchange="updateLeadField(${leadId}, 'stage', this.value)">
                                        <option value="new" ${lead.stage === 'new' ? 'selected' : ''}>New</option>
                                        <option value="contact_attempted" ${lead.stage === 'contact_attempted' ? 'selected' : ''}>Contact Attempted</option>
                                        <option value="info_requested" ${lead.stage === 'info_requested' ? 'selected' : ''}>Info Requested</option>
                                        <option value="info_received" ${lead.stage === 'info_received' ? 'selected' : ''}>Info Received</option>
                                        <option value="loss_runs_requested" ${lead.stage === 'loss_runs_requested' ? 'selected' : ''}>Loss Runs Requested</option>
                                        <option value="loss_runs_received" ${lead.stage === 'loss_runs_received' ? 'selected' : ''}>Loss Runs Received</option>
                                        <option value="app_prepared" ${lead.stage === 'app_prepared' ? 'selected' : ''}>App Prepared</option>
                                        <option value="app_sent" ${lead.stage === 'app_sent' ? 'selected' : ''}>App Sent</option>
                                        <option value="app_quote_received" ${lead.stage === 'app_quote_received' ? 'selected' : ''}>App Quote Received</option>
                                        <option value="app_quote_sent" ${lead.stage === 'app_quote_sent' ? 'selected' : ''}>App Quote Sent</option>
                                        <option value="quoted" ${lead.stage === 'quoted' ? 'selected' : ''}>Quoted</option>
                                        <option value="quote_sent" ${lead.stage === 'quote_sent' ? 'selected' : ''}>Quote Sent</option>
                                        <option value="interested" ${lead.stage === 'interested' ? 'selected' : ''}>Interested</option>
                                        <option value="not-interested" ${lead.stage === 'not-interested' ? 'selected' : ''}>Not Interested</option>
                                        <option value="closed" ${lead.stage === 'closed' ? 'selected' : ''}>Closed</option>
                                    </select>
                                </div>
                                <div class="info-item">
                                    <label>Premium Estimate:</label>
                                    <input type="text" id="lead-premium" value="${lead.premium ? '$' + lead.premium.toLocaleString() : ''}" onchange="updateLeadPremium(${leadId}, this.value)">
                                </div>
                                <div class="info-item">
                                    <label>Years in Business:</label>
                                    <input type="text" id="lead-years" value="${lead.yearsInBusiness || ''}" onchange="updateLeadField(${leadId}, 'yearsInBusiness', this.value)">
                                </div>
                                <div class="info-item">
                                    <label>Renewal Date:</label>
                                    <input type="text" id="lead-renewal" value="${lead.renewalDate || lead.expirationDate || ''}" placeholder="MM/DD/YYYY" onchange="updateLeadField(${leadId}, 'renewalDate', this.value)">
                                </div>
                            </div>
                        </div>
                        
                        <!-- Operation Details -->
                        <div class="profile-section">
                            <h3>Operation Details</h3>
                            <div class="info-grid">
                                <div class="info-item">
                                    <label>Radius of Operation:</label>
                                    <input type="text" id="lead-radius" value="${lead.radiusOfOperation || ''}" onchange="updateLeadField(${leadId}, 'radiusOfOperation', this.value)" placeholder="e.g., 500 miles">
                                </div>
                                <div class="info-item">
                                    <label>Commodity Hauled:</label>
                                    <input type="text" id="lead-commodity" value="${lead.commodityHauled || ''}" onchange="updateLeadField(${leadId}, 'commodityHauled', this.value)" placeholder="e.g., General Freight, Steel">
                                </div>
                                <div class="info-item">
                                    <label>Operating States:</label>
                                    <input type="text" id="lead-states" value="${lead.operatingStates || ''}" onchange="updateLeadField(${leadId}, 'operatingStates', this.value)" placeholder="e.g., TX, LA, OK">
                                </div>
                            </div>
                        </div>
                        
                        <!-- Vehicles Section -->
                        <div class="profile-section">
                            <div class="section-header">
                                <h3><i class="fas fa-truck"></i> Vehicles (${lead.vehicles.length})</h3>
                                <button class="btn-add" onclick="addVehicle(${leadId})">
                                    <i class="fas fa-plus"></i> Add Vehicle
                                </button>
                            </div>
                            <div class="vehicles-grid">
                                ${lead.vehicles.length > 0 ? lead.vehicles.map((vehicle, idx) => `
                                    <div class="vehicle-card">
                                        <div class="vehicle-header">
                                            <span>Vehicle #${idx + 1}</span>
                                            <button class="btn-remove" onclick="removeVehicle(${leadId}, ${idx})">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                        <div class="vehicle-details">
                                            <input type="text" placeholder="Year" value="${vehicle.year || ''}" onchange="updateVehicle(${leadId}, ${idx}, 'year', this.value)">
                                            <input type="text" placeholder="Make" value="${vehicle.make || ''}" onchange="updateVehicle(${leadId}, ${idx}, 'make', this.value)">
                                            <input type="text" placeholder="Model" value="${vehicle.model || ''}" onchange="updateVehicle(${leadId}, ${idx}, 'model', this.value)">
                                            <input type="text" placeholder="VIN" value="${vehicle.vin || ''}" onchange="updateVehicle(${leadId}, ${idx}, 'vin', this.value)">
                                            <input type="text" placeholder="Value ($)" value="${vehicle.value || ''}" onchange="updateVehicle(${leadId}, ${idx}, 'value', this.value)">
                                            <input type="text" placeholder="Deductible ($)" value="${vehicle.deductible || ''}" onchange="updateVehicle(${leadId}, ${idx}, 'deductible', this.value)">
                                            <select onchange="updateVehicle(${leadId}, ${idx}, 'type', this.value)">
                                                <option value="">Select Type</option>
                                                <option value="Box Truck" ${vehicle.type === 'Box Truck' ? 'selected' : ''}>Box Truck</option>
                                                <option value="Truck Tractor" ${vehicle.type === 'Truck Tractor' || vehicle.type === 'Semi Truck' ? 'selected' : ''}>Truck Tractor</option>
                                                <option value="Flatbed" ${vehicle.type === 'Flatbed' ? 'selected' : ''}>Flatbed</option>
                                                <option value="Pickup" ${vehicle.type === 'Pickup' ? 'selected' : ''}>Pickup</option>
                                                <option value="Van" ${vehicle.type === 'Van' ? 'selected' : ''}>Van</option>
                                            </select>
                                            <input type="text" placeholder="GVWR" value="${vehicle.gvwr || ''}" onchange="updateVehicle(${leadId}, ${idx}, 'gvwr', this.value)">
                                        </div>
                                    </div>
                                `).join('') : '<p class="no-data">No vehicles added yet</p>'}
                            </div>
                        </div>
                        
                        <!-- Trailers Section -->
                        <div class="profile-section">
                            <div class="section-header">
                                <h3><i class="fas fa-trailer"></i> Trailers (${lead.trailers.length})</h3>
                                <button class="btn-add" onclick="addTrailer(${leadId})">
                                    <i class="fas fa-plus"></i> Add Trailer
                                </button>
                            </div>
                            <div class="trailers-grid">
                                ${lead.trailers.length > 0 ? lead.trailers.map((trailer, idx) => `
                                    <div class="trailer-card">
                                        <div class="trailer-header">
                                            <span>Trailer #${idx + 1}</span>
                                            <button class="btn-remove" onclick="removeTrailer(${leadId}, ${idx})">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                        <div class="trailer-details">
                                            <input type="text" placeholder="Year" value="${trailer.year || ''}" onchange="updateTrailer(${leadId}, ${idx}, 'year', this.value)">
                                            <input type="text" placeholder="Make" value="${trailer.make || ''}" onchange="updateTrailer(${leadId}, ${idx}, 'make', this.value)">
                                            <input type="text" placeholder="Type" value="${trailer.type || ''}" onchange="updateTrailer(${leadId}, ${idx}, 'type', this.value)">
                                            <input type="text" placeholder="VIN" value="${trailer.vin || ''}" onchange="updateTrailer(${leadId}, ${idx}, 'vin', this.value)">
                                            <input type="text" placeholder="Length" value="${trailer.length || ''}" onchange="updateTrailer(${leadId}, ${idx}, 'length', this.value)">
                                            <input type="text" placeholder="Value ($)" value="${trailer.value || ''}" onchange="updateTrailer(${leadId}, ${idx}, 'value', this.value)">
                                            <input type="text" placeholder="Deductible ($)" value="${trailer.deductible || ''}" onchange="updateTrailer(${leadId}, ${idx}, 'deductible', this.value)">
                                        </div>
                                    </div>
                                `).join('') : '<p class="no-data">No trailers added yet</p>'}
                            </div>
                        </div>
                        
                        <!-- Drivers Section -->
                        <div class="profile-section">
                            <div class="section-header">
                                <h3><i class="fas fa-id-card"></i> Drivers (${lead.drivers.length})</h3>
                                <button class="btn-add" onclick="addDriver(${leadId})">
                                    <i class="fas fa-plus"></i> Add Driver
                                </button>
                            </div>
                            <div class="drivers-grid">
                                ${lead.drivers.length > 0 ? lead.drivers.map((driver, idx) => `
                                    <div class="driver-card">
                                        <div class="driver-header">
                                            <span>Driver #${idx + 1}</span>
                                            <button class="btn-remove" onclick="removeDriver(${leadId}, ${idx})">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                        <div class="driver-details">
                                            <input type="text" placeholder="Name" value="${driver.name || ''}" onchange="updateDriver(${leadId}, ${idx}, 'name', this.value)">
                                            <input type="text" placeholder="License #" value="${driver.license || ''}" onchange="updateDriver(${leadId}, ${idx}, 'license', this.value)">
                                            <input type="text" placeholder="CDL Type" value="${driver.cdlType || ''}" onchange="updateDriver(${leadId}, ${idx}, 'cdlType', this.value)">
                                            <input type="date" placeholder="DOB" value="${driver.dob || ''}" onchange="updateDriver(${leadId}, ${idx}, 'dob', this.value)">
                                            <input type="text" placeholder="Years Experience" value="${driver.experience || ''}" onchange="updateDriver(${leadId}, ${idx}, 'experience', this.value)">
                                            <input type="text" placeholder="Endorsements" value="${driver.endorsements || ''}" onchange="updateDriver(${leadId}, ${idx}, 'endorsements', this.value)">
                                            <select onchange="updateDriver(${leadId}, ${idx}, 'mvr', this.value)">
                                                <option value="">MVR Status</option>
                                                <option value="Clean" ${driver.mvr === 'Clean' ? 'selected' : ''}>Clean</option>
                                                <option value="Minor Violations" ${driver.mvr === 'Minor Violations' ? 'selected' : ''}>Minor Violations</option>
                                                <option value="Major Violations" ${driver.mvr === 'Major Violations' ? 'selected' : ''}>Major Violations</option>
                                            </select>
                                            <input type="text" placeholder="Violations/Notes" value="${driver.violations || ''}" onchange="updateDriver(${leadId}, ${idx}, 'violations', this.value)">
                                        </div>
                                    </div>
                                `).join('') : '<p class="no-data">No drivers added yet</p>'}
                            </div>
                        </div>
                        
                        <!-- Call Transcript Section -->
                        <div class="profile-section">
                            <div class="section-header">
                                <h3><i class="fas fa-microphone"></i> Call Transcript</h3>
                                <button class="btn-save" onclick="saveTranscript(${leadId})">
                                    <i class="fas fa-save"></i> Save Transcript
                                </button>
                            </div>
                            <textarea id="lead-transcript" class="transcript-area" placeholder="Paste or type call transcript here..." onchange="updateLeadField(${leadId}, 'transcriptText', this.value)">${lead.transcriptText || ''}</textarea>
                        </div>
                        
                        <!-- Notes Section -->
                        <!-- Quote Submissions Section -->
                        <div class="profile-section">
                            <div class="section-header">
                                <h3><i class="fas fa-file-invoice-dollar"></i> Quote Submissions</h3>
                                <button class="btn-primary btn-sm" onclick="showAddQuoteForm(${leadId})">
                                    <i class="fas fa-plus"></i> Add Quote
                                </button>
                            </div>
                            <div id="quote-submissions-container">
                                ${renderQuoteSubmissions(lead)}
                            </div>
                        </div>

                        <div class="profile-section">
                            <div class="section-header">
                                <h3><i class="fas fa-sticky-note"></i> Notes</h3>
                            </div>
                            <textarea class="notes-area" placeholder="Additional notes..." onchange="updateLeadField(${leadId}, 'notes', this.value)">${lead.notes || ''}</textarea>
                        </div>
                        
                        <!-- Action Buttons -->
                        <div class="profile-actions">
                            <button class="btn-primary" onclick="generateQuote(${leadId})">
                                <i class="fas fa-file-invoice-dollar"></i> Generate Quote
                            </button>
                            <button class="btn-secondary" onclick="exportLeadData(${leadId})">
                                <i class="fas fa-download"></i> Export Data
                            </button>
                            <button class="btn-secondary" onclick="closeLeadProfile()">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Standard Lead Profile (non-commercial)
        profileHTML = `
            <div class="modal-overlay" onclick="if(event.target === this) closeLeadProfile()">
                <div class="modal-content lead-profile-modal" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2><i class="fas fa-user"></i> Lead Profile</h2>
                        <button class="close-btn" onclick="closeLeadProfile()">&times;</button>
                    </div>
                    
                    <div class="lead-profile-content">
                        <div class="profile-section">
                            <h3>Contact Information</h3>
                            <div class="info-grid">
                                <div class="info-item">
                                    <label>Name:</label>
                                    <input type="text" value="${lead.name || ''}" onchange="updateLeadField(${leadId}, 'name', this.value)">
                                </div>
                                <div class="info-item">
                                    <label>Phone:</label>
                                    <input type="text" value="${lead.phone || ''}" onchange="updateLeadField(${leadId}, 'phone', this.value)">
                                </div>
                                <div class="info-item">
                                    <label>Email:</label>
                                    <input type="text" value="${lead.email || ''}" onchange="updateLeadField(${leadId}, 'email', this.value)">
                                </div>
                                <div class="info-item">
                                    <label>Product:</label>
                                    <input type="text" value="${lead.product || ''}" onchange="updateLeadField(${leadId}, 'product', this.value)">
                                </div>
                                <div class="info-item">
                                    <label>Stage:</label>
                                    <select onchange="updateLeadField(${leadId}, 'stage', this.value)">
                                        <option value="new" ${lead.stage === 'new' ? 'selected' : ''}>New</option>
                                        <option value="contact_attempted" ${lead.stage === 'contact_attempted' ? 'selected' : ''}>Contact Attempted</option>
                                        <option value="info_requested" ${lead.stage === 'info_requested' ? 'selected' : ''}>Info Requested</option>
                                        <option value="info_received" ${lead.stage === 'info_received' ? 'selected' : ''}>Info Received</option>
                                        <option value="loss_runs_requested" ${lead.stage === 'loss_runs_requested' ? 'selected' : ''}>Loss Runs Requested</option>
                                        <option value="loss_runs_received" ${lead.stage === 'loss_runs_received' ? 'selected' : ''}>Loss Runs Received</option>
                                        <option value="app_prepared" ${lead.stage === 'app_prepared' ? 'selected' : ''}>App Prepared</option>
                                        <option value="app_sent" ${lead.stage === 'app_sent' ? 'selected' : ''}>App Sent</option>
                                        <option value="app_quote_received" ${lead.stage === 'app_quote_received' ? 'selected' : ''}>App Quote Received</option>
                                        <option value="app_quote_sent" ${lead.stage === 'app_quote_sent' ? 'selected' : ''}>App Quote Sent</option>
                                        <option value="quoted" ${lead.stage === 'quoted' ? 'selected' : ''}>Quoted</option>
                                        <option value="quote_sent" ${lead.stage === 'quote_sent' ? 'selected' : ''}>Quote Sent</option>
                                        <option value="interested" ${lead.stage === 'interested' ? 'selected' : ''}>Interested</option>
                                        <option value="not-interested" ${lead.stage === 'not-interested' ? 'selected' : ''}>Not Interested</option>
                                        <option value="closed" ${lead.stage === 'closed' ? 'selected' : ''}>Closed</option>
                                    </select>
                                </div>
                                <div class="info-item">
                                    <label>Assigned To:</label>
                                    <input type="text" value="${lead.assignedTo || ''}" onchange="updateLeadField(${leadId}, 'assignedTo', this.value)">
                                </div>
                            </div>
                        </div>

                        <!-- Quote Submissions Section -->
                        <div class="profile-section">
                            <div class="section-header">
                                <h3><i class="fas fa-file-invoice-dollar"></i> Quote Submissions</h3>
                                <button class="btn-primary btn-sm" onclick="showAddQuoteForm(${leadId})">
                                    <i class="fas fa-plus"></i> Add Quote
                                </button>
                            </div>
                            <div id="quote-submissions-container">
                                ${renderQuoteSubmissions(lead)}
                            </div>
                        </div>

                        <div class="profile-section">
                            <h3>Notes</h3>
                            <textarea class="notes-area" onchange="updateLeadField(${leadId}, 'notes', this.value)">${lead.notes || ''}</textarea>
                        </div>
                        
                        <div class="profile-actions">
                            <button class="btn-primary" onclick="generateQuote(${leadId})">Generate Quote</button>
                            <button class="btn-secondary" onclick="closeLeadProfile()">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Add the modal to the page
    const modalContainer = document.createElement('div');
    modalContainer.id = 'lead-profile-container';
    modalContainer.innerHTML = profileHTML;
    document.body.appendChild(modalContainer);
    
    // Add styles if not already present
    if (!document.getElementById('lead-profile-styles')) {
        const styles = document.createElement('style');
        styles.id = 'lead-profile-styles';
        styles.innerHTML = `
            #lead-profile-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 99999 !important;
            }
            
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 99999 !important;
            }
            
            .lead-profile-modal {
                max-width: 1200px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                position: relative;
                z-index: 100000 !important;
            }
            
            .profile-section {
                background: #f9fafb;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
            }
            
            .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }
            
            .info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 15px;
            }
            
            .info-item {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            
            .info-item label {
                font-weight: 600;
                color: #374151;
                font-size: 12px;
                text-transform: uppercase;
            }
            
            .info-item input, .info-item select {
                padding: 8px 12px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 14px;
            }
            
            .vehicles-grid, .trailers-grid, .drivers-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 15px;
                margin-top: 15px;
            }
            
            .vehicle-card, .trailer-card, .driver-card {
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 15px;
            }
            
            .vehicle-header, .trailer-header, .driver-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
                font-weight: 600;
            }
            
            .vehicle-details, .trailer-details, .driver-details {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .vehicle-details input, .trailer-details input, .driver-details input,
            .vehicle-details select, .trailer-details select, .driver-details select {
                padding: 6px 10px;
                border: 1px solid #d1d5db;
                border-radius: 4px;
                font-size: 13px;
            }
            
            .btn-add {
                background: #10b981;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
            }
            
            .btn-remove {
                background: #ef4444;
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            }
            
            .btn-save {
                background: #3b82f6;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
            }
            
            .transcript-area, .notes-area {
                width: 100%;
                min-height: 150px;
                padding: 12px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-family: monospace;
                font-size: 13px;
                resize: vertical;
            }
            
            .no-data {
                color: #9ca3af;
                font-style: italic;
                text-align: center;
                padding: 20px;
            }
            
            .profile-actions {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
            }
        `;
        document.head.appendChild(styles);
    }
}

// Helper functions
async function updateLeadField(leadId, field, value) {
    // Try both storage keys and update both
    let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    let lead = leads.find(l => String(l.id) === String(leadId));
    let foundIn = 'insurance_leads';

    if (!lead) {
        leads = JSON.parse(localStorage.getItem('leads') || '[]');
        lead = leads.find(l => String(l.id) === String(leadId));
        foundIn = 'leads';
    }

    if (lead) {
        lead[field] = value;
        lead.lastModified = new Date().toISOString();

        // Save to both keys to keep them in sync
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        localStorage.setItem('leads', JSON.stringify(leads));

        // Update the in-memory leads list and refresh the table row so the overview reflects the change immediately
        if (window.currentActiveLeads) {
            const memLead = window.currentActiveLeads.find(l => String(l.id) === String(leadId));
            if (memLead) memLead[field] = value;
        }
        if (typeof updateLeadRowInTable === 'function') {
            updateLeadRowInTable(leadId, lead);
        }

        // Persist ALL fields to database, not just stage
        try {
            // Try the new API first - use current domain
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:8897'
                : `http://${window.location.hostname}:8897`;

            const response = await fetch(`${apiUrl}/api/leads/${leadId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ [field]: value })
            });

            if (response.ok) {
                console.log(`Lead ${field} updated on server`);
                if (window.showNotification) {
                    showNotification(`Lead ${field} saved`, 'success');
                }
            } else {
                console.error('Failed to update on new API, trying old API...');
                // Fallback to old API
                // Fallback to old API - use current domain
                const oldApiUrl = window.location.hostname === 'localhost'
                    ? 'http://localhost:5001'
                    : `http://${window.location.hostname}:5001`;

                const oldResponse = await fetch(`${oldApiUrl}/api/update_lead`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        lead_id: leadId,
                        updates: { [field]: value }
                    })
                });

                if (oldResponse.ok) {
                    const data = await oldResponse.json();
                    if (data.success) {
                        console.log('Lead field updated via old API');
                    }
                }
            }
        } catch (error) {
            console.error('Error updating lead field:', error);
            // Continue even if server update fails - localStorage is already updated
        }
    }
}

function updateLeadPremium(leadId, value) {
    const numValue = parseInt(value.replace(/[^0-9]/g, ''));
    updateLeadField(leadId, 'premium', numValue || 0);
}

function addVehicle(leadId) {
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
            type: ''
        });
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        showLeadProfile(leadId); // Refresh the modal
    }
}

function updateVehicle(leadId, vehicleIdx, field, value) {
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));
    if (lead && lead.vehicles && lead.vehicles[vehicleIdx]) {
        lead.vehicles[vehicleIdx][field] = value;
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
    }
}

function removeVehicle(leadId, vehicleIdx) {
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));
    if (lead && lead.vehicles) {
        lead.vehicles.splice(vehicleIdx, 1);
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        showLeadProfile(leadId); // Refresh the modal
    }
}

function addTrailer(leadId) {
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));
    if (lead) {
        if (!lead.trailers) lead.trailers = [];
        lead.trailers.push({
            year: '',
            make: '',
            type: '',
            vin: '',
            value: '',
            deductible: ''
        });
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        showLeadProfile(leadId); // Refresh the modal
    }
}

function updateTrailer(leadId, trailerIdx, field, value) {
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));
    if (lead && lead.trailers && lead.trailers[trailerIdx]) {
        lead.trailers[trailerIdx][field] = value;
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
    }
}

function removeTrailer(leadId, trailerIdx) {
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));
    if (lead && lead.trailers) {
        lead.trailers.splice(trailerIdx, 1);
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        showLeadProfile(leadId); // Refresh the modal
    }
}

function addDriver(leadId) {
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));
    if (lead) {
        if (!lead.drivers) lead.drivers = [];
        lead.drivers.push({
            name: '',
            license: '',
            cdlType: '',
            dob: '',
            experience: '',
            mvr: ''
        });
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        showLeadProfile(leadId); // Refresh the modal
    }
}

function updateDriver(leadId, driverIdx, field, value) {
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));
    if (lead && lead.drivers && lead.drivers[driverIdx]) {
        lead.drivers[driverIdx][field] = value;
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
    }
}

function removeDriver(leadId, driverIdx) {
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));
    if (lead && lead.drivers) {
        lead.drivers.splice(driverIdx, 1);
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        showLeadProfile(leadId); // Refresh the modal
    }
}

function saveTranscript(leadId) {
    const transcriptValue = document.getElementById('lead-transcript').value;
    updateLeadField(leadId, 'transcriptText', transcriptValue);
    
    // Show success message
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Saved!';
    btn.style.background = '#10b981';
    
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '#3b82f6';
    }, 2000);
}

function closeLeadProfile() {
    const container = document.getElementById('lead-profile-container');
    if (container) {
        container.remove();
    }
}

function generateQuote(leadId) {
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));
    if (lead) {
        alert(`Generating quote for ${lead.name}...`);
        // Here you would integrate with your quote generation system
    }
}

function exportLeadData(leadId) {
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));
    if (lead) {
        const dataStr = JSON.stringify(lead, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `lead_${lead.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
}

// Function to render quote submissions
function renderQuoteSubmissions(lead) {
    if (!lead.quotes || lead.quotes.length === 0) {
        return '<p style="color: #9ca3af; padding: 20px; text-align: center;">No quotes submitted yet</p>';
    }

    return lead.quotes.map(quote => `
        <div class="quote-card" style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; margin-bottom: 10px; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 10px 0; color: #1f2937;">${quote.carrier || 'Unknown Carrier'}</h4>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 10px;">
                        <div>
                            <label style="font-size: 12px; color: #6b7280;">Monthly Premium:</label>
                            <p style="margin: 0; font-weight: 600; color: #059669;">$${(quote.premium || 0).toLocaleString()}</p>
                        </div>
                        <div>
                            <label style="font-size: 12px; color: #6b7280;">Deductible:</label>
                            <p style="margin: 0;">$${(quote.deductible || 0).toLocaleString()}</p>
                        </div>
                        <div>
                            <label style="font-size: 12px; color: #6b7280;">Coverage:</label>
                            <p style="margin: 0;">$${(quote.coverage || 0).toLocaleString()}</p>
                        </div>
                        <div>
                            <label style="font-size: 12px; color: #6b7280;">Date:</label>
                            <p style="margin: 0;">${quote.date || new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                    ${quote.notes ? `<p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">${quote.notes}</p>` : ''}
                </div>
                <div style="display: flex; gap: 5px;">
                    ${quote.pdfPath ? `
                        <a href="${quote.pdfPath}" target="_blank" class="btn-icon" title="View PDF">
                            <i class="fas fa-file-pdf" style="color: #dc2626;"></i>
                        </a>
                    ` : ''}
                    <button class="btn-icon" onclick="deleteQuote('${lead.id}', '${quote.id}')" title="Delete Quote">
                        <i class="fas fa-trash" style="color: #ef4444;"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Function to show add quote form
function showAddQuoteForm(leadId) {
    const container = document.getElementById('quote-submissions-container');
    if (!container) return;

    // Check if form already exists
    if (document.getElementById('quote-entry-form')) {
        document.getElementById('quote-entry-form').remove();
    }

    const formHTML = `
        <div id="quote-entry-form" style="background: white; padding: 20px; margin: 20px 0; border: 2px solid #3b82f6; border-radius: 8px;">
            <h4 style="margin: 0 0 20px 0;">Enter New Quote</h4>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">Insurance Company *</label>
                    <input type="text" id="new-quote-carrier" placeholder="e.g. GEICO, Progressive" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">Monthly Premium *</label>
                    <input type="number" id="new-quote-premium" placeholder="e.g. 1500" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">Deductible</label>
                    <input type="number" id="new-quote-deductible" placeholder="e.g. 1000" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">Coverage Amount</label>
                    <input type="number" id="new-quote-coverage" placeholder="e.g. 1000000" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                </div>
                <div style="grid-column: span 2;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">Quote PDF Document</label>
                    <input type="file" id="new-quote-pdf" accept=".pdf" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                </div>
                <div style="grid-column: span 2;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">Notes</label>
                    <textarea id="new-quote-notes" rows="3" placeholder="Additional notes..." style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;"></textarea>
                </div>
            </div>
            <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                <button onclick="cancelQuoteEntry()" style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                    Cancel
                </button>
                <button onclick="saveQuoteSubmission(${leadId})" style="background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-save"></i> Save Quote
                </button>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('afterbegin', formHTML);
    document.getElementById('new-quote-carrier').focus();
}

// Function to cancel quote entry
function cancelQuoteEntry() {
    const form = document.getElementById('quote-entry-form');
    if (form) form.remove();
}

// Function to save quote submission
async function saveQuoteSubmission(leadId) {
    const carrier = document.getElementById('new-quote-carrier').value;
    const premium = document.getElementById('new-quote-premium').value;
    const deductible = document.getElementById('new-quote-deductible').value;
    const coverage = document.getElementById('new-quote-coverage').value;
    const notes = document.getElementById('new-quote-notes').value;
    const pdfFile = document.getElementById('new-quote-pdf').files[0];

    if (!carrier || !premium) {
        alert('Please fill in required fields (Company and Premium)');
        return;
    }

    // Get lead data - try both keys
    let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    let leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

    if (leadIndex === -1) {
        // Try the other key
        leads = JSON.parse(localStorage.getItem('leads') || '[]');
        leadIndex = leads.findIndex(l => String(l.id) === String(leadId));
    }

    if (leadIndex === -1) {
        alert('Lead not found');
        return;
    }

    // Initialize quotes array if not present
    if (!leads[leadIndex].quotes) {
        leads[leadIndex].quotes = [];
    }

    // Create quote object
    const quote = {
        id: Date.now().toString(),
        carrier: carrier,
        premium: parseFloat(premium),
        deductible: deductible ? parseFloat(deductible) : 0,
        coverage: coverage ? parseFloat(coverage) : 0,
        notes: notes,
        date: new Date().toISOString(),
        pdfPath: null
    };

    // Handle PDF upload if provided
    if (pdfFile) {
        try {
            const formData = new FormData();
            formData.append('pdf', pdfFile);
            formData.append('leadId', leadId);
            formData.append('quoteId', quote.id);

            const response = await fetch('/api/upload-quote-pdf', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                quote.pdfPath = result.path;
            }
        } catch (error) {
            console.error('Failed to upload PDF:', error);
            // Continue without PDF
        }
    }

    // Add quote to lead
    leads[leadIndex].quotes.push(quote);

    // Save to both localStorage keys to keep them in sync
    localStorage.setItem('insurance_leads', JSON.stringify(leads));
    localStorage.setItem('leads', JSON.stringify(leads));

    // Try to save to server
    try {
        await fetch('/api/save-quote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                leadId: leadId,
                quote: quote
            })
        });
    } catch (error) {
        console.error('Failed to save to server:', error);
        // Data is still saved locally
    }

    // Refresh the profile
    showLeadProfile(leadId);
    showNotification('Quote saved successfully!', 'success');
}

// Function to delete quote
function deleteQuote(leadId, quoteId) {
    if (!confirm('Are you sure you want to delete this quote?')) return;

    // Try both storage keys
    let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    let leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

    if (leadIndex === -1) {
        leads = JSON.parse(localStorage.getItem('leads') || '[]');
        leadIndex = leads.findIndex(l => String(l.id) === String(leadId));
    }

    if (leadIndex !== -1 && leads[leadIndex].quotes) {
        leads[leadIndex].quotes = leads[leadIndex].quotes.filter(q => q.id !== quoteId);
        // Save to both keys
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        localStorage.setItem('leads', JSON.stringify(leads));
        showLeadProfile(leadId);
        showNotification('Quote deleted', 'success');
    }
}

// Make functions globally available
window.showLeadProfile = showLeadProfile;
window.showAddQuoteForm = showAddQuoteForm;
window.cancelQuoteEntry = cancelQuoteEntry;
window.saveQuoteSubmission = saveQuoteSubmission;
window.deleteQuote = deleteQuote;
window.renderQuoteSubmissions = renderQuoteSubmissions;
window.updateLeadField = updateLeadField;
window.updateLeadPremium = updateLeadPremium;
window.addVehicle = addVehicle;
window.updateVehicle = updateVehicle;
window.removeVehicle = removeVehicle;
window.addTrailer = addTrailer;
window.updateTrailer = updateTrailer;
window.removeTrailer = removeTrailer;
window.addDriver = addDriver;
window.updateDriver = updateDriver;
window.removeDriver = removeDriver;
window.saveTranscript = saveTranscript;
window.closeLeadProfile = closeLeadProfile;
window.generateQuote = generateQuote;
window.exportLeadData = exportLeadData;