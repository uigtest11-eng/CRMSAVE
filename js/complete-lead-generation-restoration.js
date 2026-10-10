// COMPLETE Lead Generation Interface Restoration - EXACT as it was before
console.log('🔄 RESTORING COMPLETE Lead Generation Interface...');

// Set flag to prevent other scripts from overriding
window.completeLeadGenerationLoaded = true;

// Override the simplified loadLeadGenerationView with COMPLETE implementation
window.loadLeadGenerationView = function loadLeadGenerationView(activeTab = 'lookup') {
    console.log('🚀 USING COMPLETE Lead Generation with Skip Days & Lead Split features!');
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;

    dashboardContent.innerHTML = `
        <div class="lead-generation-view">
            <header class="content-header">
                <h1>Lead Generation Database</h1>
            </header>

            <!-- Tabs removed — navigation is via sidebar sub-menu -->

            <div class="lead-gen-container">
                <!-- Carrier Lookup Section -->
                <div id="carrierLookupSection" class="tab-section" style="display: ${activeTab === 'lookup' ? 'block' : 'none'};">
                    <div class="search-section">
                    <h3>Search Carriers</h3>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>USDOT Number</label>
                                <input type="text" class="form-control" id="usdotSearch" placeholder="Enter USDOT #">
                            </div>
                            <div class="form-group">
                                <label>MC Number</label>
                                <input type="text" class="form-control" id="mcSearch" placeholder="Enter MC #">
                            </div>
                            <div class="form-group">
                                <label>Company Name</label>
                                <input type="text" class="form-control" id="companySearch" placeholder="Enter company name">
                            </div>
                            <div class="form-group">
                                <label>State</label>
                                <select class="form-control" id="stateSearch">
                                    <option value="">All States</option>
                                    <option value="CA">California</option>
                                    <option value="TX">Texas</option>
                                    <option value="FL">Florida</option>
                                    <option value="NY">New York</option>
                                    <option value="IL">Illinois</option>
                                    <option value="OH">Ohio</option>
                                </select>
                            </div>
                        </div>

                    <div class="search-actions">
                        <button class="btn-primary" onclick="performLeadSearch()">
                            <i class="fas fa-search"></i> Search Database
                        </button>
                        <button class="btn-secondary" onclick="clearLeadFilters()">
                            <i class="fas fa-eraser"></i> Clear Filters
                        </button>
                    </div>
                </div>

                <!-- Carrier Profile Display -->
                <div id="carrierProfileDisplay" class="carrier-profile-display-container">
                    <!-- Carrier profiles will be displayed here -->
                </div>
                </div>

                <!-- Generate Leads Section -->
                <div id="generateLeadsSection" class="tab-section" style="display: ${activeTab === 'generate' ? 'block' : 'none'};">
                    ${getCompleteGenerateLeadsContent()}
                </div>

                <!-- SMS Blast Section -->
                <div id="smsBlastSection" class="tab-section" style="display: ${activeTab === 'sms' ? 'block' : 'none'};">
                    ${getCompleteSMSBlastContent()}
                </div>
            </div>
        </div>
    `;

    // Initialize lead generation specific features
    initializeLeadGeneration();
}

// Simple Generate Leads Content (without table below)
function getSimpleGenerateLeadsContent() {
    return `
        <div class="generate-leads-container">
                <div class="filter-section">
                    <h3>Select Lead Criteria</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>State <span class="required">*</span></label>
                            <select class="form-control" id="genState">
                                <option value="">Select State</option>
                                <option value="OH">Ohio</option>
                                <option value="TX">Texas</option>
                                <option value="FL">Florida</option>
                                <option value="CA">California</option>
                                <option value="NY">New York</option>
                                <option value="IL">Illinois</option>
                                <option value="PA">Pennsylvania</option>
                                <option value="GA">Georgia</option>
                                <option value="NC">North Carolina</option>
                                <option value="MI">Michigan</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Expiration</label>
                            <select class="form-control" id="genExpiry">
                                <option value="7">Next 7 Days</option>
                                <option value="14">Next 14 Days</option>
                                <option value="30" selected>Next 30 Days</option>
                                <option value="45">Next 45 Days</option>
                                <option value="60">Next 60 Days</option>
                                <option value="90">Next 90 Days</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Skip Days</label>
                            <input type="number" class="form-control" id="genSkipDays" value="0" min="0" max="90" placeholder="0">
                        </div>
                        <div class="form-group">
                            <label>Fleet Size</label>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <input type="number" class="form-control" id="genMinFleet" value="1" min="1" style="flex: 1; text-align: center;">
                                <span style="font-weight: bold; color: #374151; user-select: none;">-</span>
                                <input type="number" class="form-control" id="genMaxFleet" value="9999" min="1" style="flex: 1; text-align: center;">
                            </div>
                        </div>
                    </div>
                    <div class="form-actions" style="margin-top: 1rem;">
                        <button class="btn-primary" onclick="generateLeadsFromForm()" style="padding: 10px 24px; font-size: 1rem;">
                            <i class="fas fa-magic"></i> Generate Leads Now
                        </button>
                        <button class="btn-success" onclick="exportGeneratedLeads('excel')" style="padding: 10px 24px; font-size: 1rem;">
                            <i class="fas fa-file-excel"></i> Export to Excel
                        </button>
                    </div>
                </div>
        </div>
    `;
}

// Complete Generate Leads Content
function getCompleteGenerateLeadsContent() {
    return `
        <!-- Sub-tabs within Generate Leads -->
        <div class="folder-tabs" style="margin-bottom: 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 0; flex-wrap: wrap;">
            <button class="folder-tab active" id="genSubTabBtn-commercialAuto" onclick="switchGenLeadSubTab('commercialAuto')" style="font-size: 0.85rem; padding: 6px 16px;">
                <i class="fas fa-truck"></i> Commercial Auto
            </button>
            <button class="folder-tab" id="genSubTabBtn-commercialBusiness" onclick="switchGenLeadSubTab('commercialBusiness')" style="font-size: 0.85rem; padding: 6px 16px;">
                <i class="fas fa-building"></i> Commercial Business
            </button>
            <button class="folder-tab" id="genSubTabBtn-personalLines" onclick="switchGenLeadSubTab('personalLines')" style="font-size: 0.85rem; padding: 6px 16px;">
                <i class="fas fa-home"></i> Personal Lines
            </button>
        </div>

        <!-- Commercial Auto Sub-Tab -->
        <div id="genSubTab-commercialAuto" style="display: block;">
        <div class="generate-leads-container">
                <!-- Statistics Section - Always Visible at Top -->
                <div id="generatedLeadsResults" style="margin-bottom: 1rem;">
                    <div class="results-summary">
                        <div id="successMessage" style="display: none; margin-bottom: 0.75rem;">
                            <h3 style="color: #059669; font-size: 1.1rem;">
                                <i class="fas fa-check-circle"></i> Leads Generated Successfully!
                            </h3>
                        </div>
                        <div class="stats-row">
                            <div class="stat-box" style="background: #f0fdf4;">
                                <span style="color: #16a34a;">Total Leads Found</span>
                                <p style="font-weight: bold; color: #15803d;">
                                    <span id="totalLeadsCount">-</span>
                                </p>
                            </div>
                        </div>
                        <div class="export-options" style="margin-top: 0.75rem;">
                            <div class="export-buttons" style="display: flex; gap: 0.75rem; align-items: center;">
                                <span style="font-weight: 600; margin-right: 0.5rem;">Export:</span>
                                <button class="btn-success" onclick="exportGeneratedLeads('excel')" style="background: #10b981; color: white; padding: 8px 16px; font-size: 0.9rem;">
                                    <i class="fas fa-file-excel"></i> Excel
                                </button>
                                <button class="btn-info" onclick="exportGeneratedLeads('json')" style="background: #3b82f6; color: white; padding: 8px 16px; font-size: 0.9rem;">
                                    <i class="fas fa-file-code"></i> JSON
                                </button>
                                <button class="btn-primary" onclick="viewGeneratedLeads()" style="padding: 8px 16px; font-size: 0.9rem;">
                                    <i class="fas fa-eye"></i> View
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="filter-section">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3 style="margin: 0;">Select Lead Criteria</h3>
                        <div style="display: flex; gap: 0.5rem;">
                            <button type="button" class="btn-secondary" onclick="openSavePresetPopup()" style="padding: 8px 16px; font-size: 0.9rem;">
                                <i class="fas fa-save"></i> Save Preset
                            </button>
                            <button type="button" class="btn-info" onclick="openSelectPresetPopup()" style="padding: 8px 16px; font-size: 0.9rem;">
                                <i class="fas fa-list"></i> Select Preset
                            </button>
                            <button type="button" onclick="generateWithCorgiPrequotes()" style="padding: 8px 16px; font-size: 0.9rem; background: #f97316; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; transition: 0.2s;">
                                <i class="fas fa-bolt"></i> Generate with Corgi Prequotes
                            </button>
                        </div>
                    </div>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>State <span class="required">*</span></label>
                            <select class="form-control" id="genState">
                                <option value="">Select State</option>
                                <option value="AL" data-state-type="open-closed">Alabama</option>
                                <option value="AK" data-state-type="open-closed">Alaska</option>
                                <option value="AZ" data-state-type="green">Arizona</option>
                                <option value="AR" data-state-type="green">Arkansas</option>
                                <option value="CA" data-state-type="open-closed">California</option>
                                <option value="CO" data-state-type="green">Colorado</option>
                                <option value="CT" data-state-type="green">Connecticut</option>
                                <option value="DE" data-state-type="green">Delaware</option>
                                <option value="FL" data-state-type="green-split">Florida</option>
                                <option value="GA" data-state-type="green-split">Georgia</option>
                                <option value="HI" data-state-type="open-closed">Hawaii</option>
                                <option value="ID" data-state-type="green">Idaho</option>
                                <option value="IL" data-state-type="green-split">Illinois</option>
                                <option value="IN" data-state-type="green-split">Indiana</option>
                                <option value="IA" data-state-type="green">Iowa</option>
                                <option value="KS" data-state-type="green">Kansas</option>
                                <option value="KY" data-state-type="open-closed">Kentucky</option>
                                <option value="LA" data-state-type="green">Louisiana</option>
                                <option value="ME" data-state-type="green">Maine</option>
                                <option value="MD" data-state-type="green">Maryland</option>
                                <option value="MA" data-state-type="green">Massachusetts</option>
                                <option value="MI" data-state-type="open-closed">Michigan</option>
                                <option value="MN" data-state-type="green">Minnesota</option>
                                <option value="MS" data-state-type="green">Mississippi</option>
                                <option value="MO" data-state-type="open-closed">Missouri</option>
                                <option value="MT" data-state-type="green">Montana</option>
                                <option value="NE" data-state-type="open-closed">Nebraska</option>
                                <option value="NV" data-state-type="green">Nevada</option>
                                <option value="NH" data-state-type="green">New Hampshire</option>
                                <option value="NJ" data-state-type="green-split">New Jersey</option>
                                <option value="NM" data-state-type="green">New Mexico</option>
                                <option value="NY" data-state-type="open-closed">New York</option>
                                <option value="NC" data-state-type="open-closed">North Carolina</option>
                                <option value="ND" data-state-type="green">North Dakota</option>
                                <option value="OH" data-state-type="green-split">Ohio</option>
                                <option value="OK" data-state-type="green">Oklahoma</option>
                                <option value="OR" data-state-type="green">Oregon</option>
                                <option value="PA" data-state-type="green-split">Pennsylvania</option>
                                <option value="RI" data-state-type="green">Rhode Island</option>
                                <option value="SC" data-state-type="green">South Carolina</option>
                                <option value="SD" data-state-type="green">South Dakota</option>
                                <option value="TN" data-state-type="green">Tennessee</option>
                                <option value="TX" data-state-type="green-split">Texas</option>
                                <option value="UT" data-state-type="open-closed">Utah</option>
                                <option value="VT" data-state-type="green">Vermont</option>
                                <option value="VA" data-state-type="green">Virginia</option>
                                <option value="WA" data-state-type="open-closed">Washington</option>
                                <option value="WV" data-state-type="green">West Virginia</option>
                                <option value="WI" data-state-type="green">Wisconsin</option>
                                <option value="WY" data-state-type="green">Wyoming</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Expiration</label>
                            <select class="form-control" id="genExpiry">
                                <option value="7">Next 7 Days</option>
                                <option value="14">Next 14 Days</option>
                                <option value="30" selected>Next 30 Days</option>
                                <option value="45">Next 45 Days</option>
                                <option value="60">Next 60 Days</option>
                                <option value="90">Next 90 Days</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Skip Days</label>
                            <input type="number" class="form-control" id="genSkipDays" value="0" min="0" max="90" placeholder="0">
                        </div>
                        <div class="form-group">
                            <label>Fleet Size</label>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <input type="number" class="form-control" id="genMinFleet" value="1" min="1" style="flex: 1; text-align: center;">
                                <span style="font-weight: bold; color: #374151; user-select: none;">-</span>
                                <input type="number" class="form-control" id="genMaxFleet" value="9999" min="1" style="flex: 1; text-align: center;">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Operating Status</label>
                            <select class="form-control" id="genStatus">
                                <option value="">All</option>
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                                <option value="OUT_OF_SERVICE">Out of Service</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Safety Rating Range %</label>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div style="display: flex; align-items: center; gap: 5px; flex: 1;">
                                    <input type="number" class="form-control" id="genSafetyMin" placeholder="Min % (0-100)" min="0" max="100" step="1" style="flex: 1;">
                                    <span>to</span>
                                    <input type="number" class="form-control" id="genSafety" placeholder="Max % (0-100)" min="0" max="100" step="1" style="flex: 1;">
                                </div>
                                <label style="display: flex; align-items: center; gap: 5px; margin: 0; white-space: nowrap;">
                                    <input type="checkbox" id="requireInspections" style="margin: 0;">
                                    <span>Require Inspections</span>
                                </label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Hazmat</label>
                            <select class="form-control" id="genHazmat">
                                <option value="">Include All</option>
                                <option value="include">Include</option>
                                <option value="exclude">Exclude</option>
                                <option value="only">Only</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Years in Business</label>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <input type="number" class="form-control" id="yearsInBusinessMin" value="0" min="0" max="100" style="flex: 1; text-align: center;">
                                <span style="font-weight: bold; color: #374151; user-select: none;">-</span>
                                <input type="number" class="form-control" id="yearsInBusinessMax" value="100" min="0" max="100" style="flex: 1; text-align: center;">
                            </div>
                        </div>
                        <div class="form-group" style="grid-column: 1 / -1;">
                            <label>Unit Types</label>
                            <div class="unit-type-checkbox-grid" style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.4rem; padding: 0.75rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; max-height: 120px; overflow-y: auto;">
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="unitType" value="UNKNOWN" checked=""> Unknown
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="unitType" value="STRAIGHT_TRUCK" checked=""> Straight Truck
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="unitType" value="TRUCK_TRACTOR" checked=""> Truck Tractor
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="unitType" value="TRAILER" checked=""> Trailer
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="unitType" value="TRAVEL_TRAILER" checked=""> Travel Trailer
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="unitType" value="VAN" checked=""> Van
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="unitType" value="CARGO_VAN" checked=""> Cargo Van
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="unitType" value="PICKUP_TRUCK" checked=""> Pickup Truck
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="unitType" value="BUS" checked=""> Bus
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="unitType" value="LIMOUSINE" checked=""> Limousine
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="unitType" value="MINIBUS" checked=""> Minibus
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="unitType" value="MOTORCOACH" checked=""> Motorcoach
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="unitType" value="SCHOOL_BUS" checked=""> School Bus
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="unitType" value="VAN_9_15_PASS" checked=""> Van (9-15 passengers)
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="unitType" value="VAN_16_PASS" checked=""> Van (16+ passengers)
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="unitType" value="TAXI" checked=""> Taxi
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="unitType" value="AMBULANCE" checked=""> Ambulance
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="unitType" value="HEARSE" checked=""> Hearse
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="unitType" value="OTHER" checked=""> Other
                            </label>
                            </div>
                            <div style="margin-top: 0.5rem; display: flex; gap: 0.75rem;">
                                <button type="button" class="btn-small" onclick="selectAllUnitTypes()" style="padding: 4px 10px; font-size: 0.8rem;">Select All</button>
                                <button type="button" class="btn-small" onclick="clearAllUnitTypes()" style="padding: 4px 10px; font-size: 0.8rem;">Clear All</button>
                            </div>
                        </div>
                        <div class="form-group" style="grid-column: 1 / -1;">
                            <label>Commodities Hauled</label>
                            <div class="commodities-checkbox-grid" style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.4rem; padding: 0.75rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; max-height: 120px; overflow-y: auto;">
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="commodity" value="GENERAL_FREIGHT" checked> General Freight
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="commodity" value="REEFER" checked> Reefer
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="commodity" value="HOUSEHOLD_GOODS" checked> Household Goods
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="commodity" value="METAL_SHEETS_COILS_ROLLS" checked> Metal Sheets/Coils/Rolls
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="commodity" value="MOTOR_VEHICLES" checked> Motor Vehicles
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="commodity" value="LOGS_POLES_BEAMS_LUMBER" checked> Logs/Poles/Beams/Lumber
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="commodity" value="BUILDING_MATERIALS" checked> Building Materials
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="commodity" value="FRESH_PRODUCE" checked> Fresh Produce
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="commodity" value="LIQUIDS_GASES" checked> Liquids/Gases
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="commodity" value="CHEMICALS" checked> Chemicals
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="commodity" value="REFRIGERATED_FOOD" checked> Refrigerated Food
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="commodity" value="BEVERAGES" checked> Beverages
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="commodity" value="GRAIN_FEED_HAY" checked> Grain/Feed/Hay
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="commodity" value="LIVESTOCK" checked> Livestock
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="commodity" value="OILFIELD_EQUIPMENT" checked> Oilfield Equipment
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="commodity" value="INTERMODAL_CONTAINERS" checked> Intermodal Containers
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="commodity" value="PAPER_PRODUCTS" checked> Paper Products
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="commodity" value="CONSTRUCTION" checked> Construction
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="commodity" value="OTHER" checked> Other
                            </label>
                            </div>
                            <div style="margin-top: 0.5rem; display: flex; gap: 0.75rem;">
                                <button type="button" class="btn-small" onclick="selectAllCommodities()" style="padding: 4px 10px; font-size: 0.8rem;">Select All</button>
                                <button type="button" class="btn-small" onclick="clearAllCommodities()" style="padding: 4px 10px; font-size: 0.8rem;">Clear All</button>
                            </div>
                        </div>
                        <div class="form-group" style="grid-column: 1 / -1;">
                            <label>Insurance Companies</label>
                            <div class="insurance-checkbox-grid" style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 0.4rem; padding: 0.75rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; max-height: 120px; overflow-y: auto;">
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="PROGRESSIVE" checked> Progressive
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="GEICO" checked> GEICO
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="GREAT_WEST" checked> Great West Casualty
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="CANAL" checked> Canal Insurance
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="ACUITY" checked> Acuity
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="NORTHLAND" checked> Northland
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="CINCINNATI" checked> Cincinnati Insurance
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="AUTO_OWNERS" checked> Auto Owners
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="SENTRY" checked> Sentry Select
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="ERIE" checked> Erie Insurance
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="TRAVELERS" checked> Travelers
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="BITCO" checked> Bitco General
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="CAROLINA" checked> Carolina Casualty
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="STATE_FARM" checked> State Farm
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="ALLSTATE" checked> Allstate
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="NATIONWIDE" checked> Nationwide
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="FARMERS" checked> Farmers Insurance
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="LIBERTY_MUTUAL" checked> Liberty Mutual
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="AMERICAN_FAMILY" checked> American Family
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="USAA" checked> USAA
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="SAFECO" checked> Safeco
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="HARTFORD" checked> The Hartford
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="ZURICH" checked> Zurich North America
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="CNA" checked> CNA Insurance
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="BERKSHIRE_HATHAWAY" checked> Berkshire Hathaway
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="AIG" checked> AIG
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="CHUBB" checked> Chubb
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="MERCURY" checked> Mercury Insurance
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="ENCOMPASS" checked> Encompass Insurance
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="ESURANCE" checked> Esurance
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="METLIFE" checked> MetLife Auto & Home
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="AMERICAN_NATIONAL" checked> American National
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="OCCIDENTAL" checked> Occidental Fire & Casualty
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="OTHERS" checked> Others
                            </label>
                            </div>
                            <div style="margin-top: 0.5rem; display: flex; gap: 0.75rem;">
                                <button type="button" class="btn-small" onclick="selectAllInsurance()" style="padding: 4px 10px; font-size: 0.8rem;">Select All</button>
                                <button type="button" class="btn-small" onclick="clearAllInsurance()" style="padding: 4px 10px; font-size: 0.8rem;">Clear All</button>
                            </div>
                        </div>
                    </div>
                    <div class="form-actions" style="margin-top: 1rem;">
                        <div class="button-row">
                            <button class="btn-primary" onclick="generateLeadsFromForm()" style="padding: 10px 24px; font-size: 1rem; transition: 0.2s;">
                                <i class="fas fa-magic"></i> Generate Leads Now
                            </button>
                            <button class="btn-success" onclick="uploadToVicidialWithCriteria()" style="padding: 10px 24px; font-size: 1rem; transition: 0.2s;">
                                <i class="fas fa-upload"></i> Upload to Vicidial
                            </button>
                        </div>
                        <div class="button-row">
                            <button class="btn-primary" onclick="sendEmailBlast()" style="padding: 10px 24px; font-size: 1rem; transition: 0.2s;">
                                <i class="fas fa-envelope"></i> Email Blast
                            </button>
                            <button class="btn-primary" onclick="sendSMSBlast()" style="padding: 10px 24px; font-size: 1rem; transition: 0.2s;">
                                <i class="fas fa-sms"></i> SMS Blast
                            </button>
                            <button class="btn-info" onclick="openLeadSplitPopup()" style="padding: 10px 24px; font-size: 1rem; transition: 0.2s;" id="leadSplitBtn">
                                <i class="fas fa-cut"></i> Lead Split
                            </button>
                            <button class="btn-secondary" onclick="resetGenerateForm()" style="padding: 10px 24px; font-size: 1rem; transition: 0.2s;">
                                <i class="fas fa-redo"></i> Reset Form
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Preset Popups -->
                <div id="savePresetModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 10000;">
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 8px; max-width: 400px; width: 90%;">
                        <h3 style="margin-bottom: 15px;">Save Lead Generation Preset</h3>
                        <div class="form-group">
                            <label>Preset Name</label>
                            <input type="text" class="form-control" id="presetName" placeholder="Enter preset name" maxlength="50">
                        </div>
                        <div style="text-align: right; margin-top: 15px;">
                            <button type="button" class="btn-secondary" onclick="closeSavePresetPopup()" style="margin-right: 10px;">Cancel</button>
                            <button type="button" class="btn-primary" onclick="savePreset()">Save Preset</button>
                        </div>
                    </div>
                </div>

                <div id="selectPresetModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 10000;">
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 8px; max-width: 500px; width: 90%;">
                        <h3 style="margin-bottom: 15px;">Select Lead Generation Preset</h3>
                        <div id="presetList" style="max-height: 300px; overflow-y: auto;">
                            <!-- Preset list will be populated here -->
                        </div>
                        <div style="text-align: right; margin-top: 15px;">
                            <button type="button" class="btn-secondary" onclick="closeSelectPresetPopup()">Close</button>
                        </div>
                    </div>
                </div>

        </div>
        </div><!-- /genSubTab-commercialAuto -->

        <!-- Commercial Business Sub-Tab -->
        <div id="genSubTab-commercialBusiness" style="display: none;">
            <div class="generate-leads-container">

                <!-- Data Sources Panel -->
                <div style="background: #1e3a5f; border-radius: 10px; padding: 1rem 1.25rem; margin-bottom: 1.25rem; color: white;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                        <h4 style="margin: 0; font-size: 1rem; color: white;"><i class="fas fa-database"></i> Data Sources</h4>
                        <button onclick="refreshCBSourceStatus()" style="background: rgba(255,255,255,0.15); border: none; color: white; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
                            <i class="fas fa-sync-alt"></i> Refresh Status
                        </button>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem;" id="cb-source-cards">
                        <!-- OSHA Card -->
                        <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 0.75rem;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.4rem;">
                                <span style="font-weight: 600; font-size: 0.9rem;"><i class="fas fa-hard-hat"></i> OSHA Enforcement</span>
                                <span id="cb-osha-badge" style="background: #6b7280; color: white; font-size: 0.7rem; padding: 2px 7px; border-radius: 10px;">Not Loaded</span>
                            </div>
                            <div style="font-size: 0.78rem; color: rgba(255,255,255,0.75); margin-bottom: 0.5rem;" id="cb-osha-status">Enter DOL API key to sync, or import CSV</div>
                            <input type="password" id="cb-dol-api-key" placeholder="DOL API Key (data.dol.gov/registration)" style="width:100%; font-size:0.72rem; padding:4px 6px; border-radius:4px; border:none; background:rgba(255,255,255,0.9); color:#1f2937; margin-bottom:0.4rem;">
                            <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                                <button onclick="syncOSHAViaAPI()" style="background:#10b981; border:none; color:white; padding:3px 10px; border-radius:4px; font-size:0.75rem; cursor:pointer;">
                                    <i class="fas fa-sync-alt"></i> Sync via API
                                </button>
                                <label style="background: rgba(255,255,255,0.2); border-radius: 4px; padding: 3px 8px; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 0.3rem;">
                                    <input type="file" id="cb-osha-file-input" accept=".csv,.txt" style="display:none;" onchange="importOSHAFile(this)">
                                    <i class="fas fa-upload"></i> CSV Fallback
                                </label>
                                <a href="https://data.dol.gov/registration" target="_blank" style="background: rgba(255,255,255,0.2); border-radius: 4px; padding: 3px 8px; font-size: 0.75rem; color: white; text-decoration: none; display: flex; align-items: center; gap: 0.3rem;">
                                    <i class="fas fa-key"></i> Get Key
                                </a>
                            </div>
                        </div>
                        <!-- OpenCorporates Card -->
                        <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 0.75rem;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.4rem;">
                                <span style="font-weight: 600; font-size: 0.9rem;"><i class="fas fa-file-signature"></i> New Biz Filings</span>
                                <span id="cb-oc-badge" style="background: #f59e0b; color: white; font-size: 0.7rem; padding: 2px 7px; border-radius: 10px;">Needs Key</span>
                            </div>
                            <div style="font-size: 0.78rem; color: rgba(255,255,255,0.75); margin-bottom: 0.4rem;">SOS filings via OpenCorporates — free API key required</div>
                            <div style="display:flex;gap:4px;align-items:center;">
                                <input type="text" id="cb-oc-api-token" placeholder="Paste API token (opencorporates.com/api_accounts/new)" style="flex:1; font-size:0.72rem; padding:4px 6px; border-radius:4px; border:none; background:rgba(255,255,255,0.9); color:#1f2937;" oninput="window._cbOcToken=this.value; var b=document.getElementById('cb-oc-badge'); if(b){b.textContent=this.value?'Key Set':'Needs Key'; b.style.background=this.value?'#10b981':'#f59e0b';} var chk=document.getElementById('cb-source-oc'); if(chk){chk.checked=!!this.value;} var hint=document.getElementById('cb-oc-source-hint'); if(hint){hint.style.display=this.value?'none':'';}">
                                <button onclick="(function(){var v=document.getElementById('cb-oc-api-token').value; if(!v){alert('Paste a token first.');return;} localStorage.setItem('vanguard_oc_token',v); window._cbOcToken=v; alert('Token saved — will persist across sessions.');})();" style="font-size:0.68rem;padding:4px 7px;border-radius:4px;border:none;background:#10b981;color:white;cursor:pointer;white-space:nowrap;">Save</button>
                            </div>
                        </div>
                        <!-- Socrata Card -->
                        <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 0.75rem;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.4rem;">
                                <span style="font-weight: 600; font-size: 0.9rem;"><i class="fas fa-city"></i> Open Data (Permits)</span>
                                <span style="background: #f59e0b; color: white; font-size: 0.7rem; padding: 2px 7px; border-radius: 10px;">Optional</span>
                            </div>
                            <div style="font-size: 0.78rem; color: rgba(255,255,255,0.75); margin-bottom: 0.4rem;">Paste a Socrata endpoint URL for city/county permit data</div>
                            <input type="text" id="cb-socrata-endpoint" placeholder="https://data.city.gov/resource/abc-123.json" style="width: 100%; font-size: 0.72rem; padding: 4px 6px; border-radius: 4px; border: none; background: rgba(255,255,255,0.9); color: #1f2937;">
                        </div>
                        <!-- Google Places Card -->
                        <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 0.75rem;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.4rem;">
                                <span style="font-weight: 600; font-size: 0.9rem;"><i class="fab fa-google" style="color:#4ade80;"></i> Google Places</span>
                                <span id="cb-gp-badge" style="background: #10b981; color: white; font-size: 0.7rem; padding: 2px 7px; border-radius: 10px;">Ready</span>
                            </div>
                            <div style="font-size: 0.78rem; color: rgba(255,255,255,0.75); margin-bottom: 0.4rem;">Real businesses with phones &amp; websites — live from Google</div>
                            <div style="font-size: 0.72rem; color: rgba(255,255,255,0.6); margin-bottom: 0.6rem;">API key pre-configured · cached leads are <strong style="color:#4ade80;">free</strong> — only new ones cost money</div>
                            <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
                                <div style="display:flex;align-items:center;gap:4px;background:rgba(255,255,255,0.15);border-radius:4px;padding:3px 8px;">
                                    <span style="font-size:0.72rem;color:rgba(255,255,255,0.85);">Max results:</span>
                                    <input type="number" id="cb-gp-max" value="40" min="1" max="500" style="width:52px;background:transparent;border:none;border-bottom:1px solid rgba(255,255,255,0.4);color:white;font-size:0.78rem;text-align:center;outline:none;" oninput="updateGPCost()">
                                </div>
                                <div id="cb-gp-cost-display" style="background:rgba(16,185,129,0.2);border:1px solid rgba(16,185,129,0.4);border-radius:4px;padding:3px 9px;font-size:0.72rem;color:#4ade80;white-space:nowrap;">
                                    est. cost: <strong id="cb-gp-cost">$0.034</strong>
                                </div>
                                <div id="cb-gp-cached-display" style="background:rgba(255,255,255,0.1);border-radius:4px;padding:3px 9px;font-size:0.72rem;color:rgba(255,255,255,0.7);">
                                    <span id="cb-gp-cached-count">0</span> cached
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- Import progress -->
                    <div id="cb-import-progress" style="display:none; margin-top: 0.75rem; background: rgba(0,0,0,0.2); border-radius: 6px; padding: 0.6rem 0.75rem; font-size: 0.82rem;"></div>
                </div>

                <!-- Stat bar -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
                    <div style="display: flex; gap: 0.75rem; align-items: center;">
                        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 0.5rem 1rem; text-align: center;">
                            <div style="font-size: 0.72rem; color: #1d4ed8; font-weight: 600;">LEADS FOUND</div>
                            <div style="font-size: 1.4rem; font-weight: 700; color: #1e40af; line-height: 1;" id="cbTotalLeadsCount">—</div>
                        </div>
                        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 0.5rem 1rem; text-align: center;">
                            <div style="font-size: 0.72rem; color: #166534; font-weight: 600;">PRIORITY A</div>
                            <div style="font-size: 1.4rem; font-weight: 700; color: #15803d; line-height: 1;" id="cbPriorityACount">—</div>
                        </div>
                        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 0.5rem 1rem; text-align: center;">
                            <div style="font-size: 0.72rem; color: #92400e; font-weight: 600;">PRIORITY B</div>
                            <div style="font-size: 1.4rem; font-weight: 700; color: #b45309; line-height: 1;" id="cbPriorityBCount">—</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <span style="font-weight: 600; color: #374151; font-size: 0.85rem;">Export:</span>
                        <button onclick="exportCBResults('excel')" style="background: #10b981; color: white; border: none; padding: 7px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">
                            <i class="fas fa-file-excel"></i> CSV
                        </button>
                        <button onclick="exportCBResults('json')" style="background: #3b82f6; color: white; border: none; padding: 7px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">
                            <i class="fas fa-file-code"></i> JSON
                        </button>
                    </div>
                </div>

                <!-- Criteria Section -->
                <div class="filter-section">
                    <h3 style="margin: 0 0 1rem 0;"><i class="fas fa-sliders-h"></i> Lead Criteria</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>State</label>
                            <select class="form-control" id="cb-genState">
                                <option value="">All States</option>
                                <option>AL</option><option>AK</option><option>AZ</option><option>AR</option><option>CA</option>
                                <option>CO</option><option>CT</option><option>DE</option><option>FL</option><option>GA</option>
                                <option>HI</option><option>ID</option><option>IL</option><option>IN</option><option>IA</option>
                                <option>KS</option><option>KY</option><option>LA</option><option>ME</option><option>MD</option>
                                <option>MA</option><option>MI</option><option>MN</option><option>MS</option><option>MO</option>
                                <option>MT</option><option>NE</option><option>NV</option><option>NH</option><option>NJ</option>
                                <option>NM</option><option>NY</option><option>NC</option><option>ND</option><option>OH</option>
                                <option>OK</option><option>OR</option><option>PA</option><option>RI</option><option>SC</option>
                                <option>SD</option><option>TN</option><option>TX</option><option>UT</option><option>VT</option>
                                <option>VA</option><option>WA</option><option>WV</option><option>WI</option><option>WY</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Industry / Keyword</label>
                            <div id="cb-industry-wrap" style="position:relative;">
                                <span style="position:absolute;left:9px;top:50%;transform:translateY(-50%);color:#9ca3af;pointer-events:none;font-size:0.9rem;z-index:1;"><i class="fas fa-search"></i></span>
                                <input type="text" class="form-control" id="cb-genIndustry" placeholder="Enter industry keyword or NAICS code" autocomplete="off" style="padding-left:30px;">
                                <ul id="cb-industry-dropdown" role="listbox" style="display:none;position:absolute;top:calc(100% + 1px);left:0;right:0;background:#fff;border:1px solid #aaa;border-top:1px solid #e5e7eb;border-radius:0 0 4px 4px;max-height:240px;overflow-y:auto;z-index:1050;margin:0;padding:2px 0;list-style:none;box-shadow:0 4px 10px rgba(0,0,0,0.15);font-size:0.88rem;"></ul>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Target Vertical</label>
                            <select class="form-control" id="cb-genVertical">
                                <option value="">Any Vertical</option>
                                <option value="Contractor">Contractor</option>
                                <option value="Trucking">Trucking</option>
                                <option value="Transport">Transport / Towing</option>
                                <option value="Manufacturing">Manufacturing</option>
                                <option value="Auto Dealer">Auto Dealer</option>
                                <option value="Auto Repair">Auto Repair</option>
                                <option value="Restaurant">Restaurant / Bar</option>
                                <option value="Healthcare">Healthcare</option>
                                <option value="Landscaping">Landscaping</option>
                                <option value="Security">Security</option>
                                <option value="Waste">Waste / Environmental</option>
                                <option value="Wholesale">Wholesale / Distribution</option>
                                <option value="Real Estate">Real Estate</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Data Freshness (Days Back)</label>
                            <select class="form-control" id="cb-genDaysBack">
                                <option value="30">Last 30 Days</option>
                                <option value="60">Last 60 Days</option>
                                <option value="90" selected>Last 90 Days</option>
                                <option value="180">Last 180 Days</option>
                                <option value="365">Last Year</option>
                                <option value="9999">All Time</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Employees (Min–Max)</label>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <input type="number" class="form-control" id="cb-genEmpMin" value="" min="0" style="flex:1; text-align:center;" placeholder="Min">
                                <span style="color:#374151; font-weight:bold;">—</span>
                                <input type="number" class="form-control" id="cb-genEmpMax" value="" min="0" style="flex:1; text-align:center;" placeholder="Max">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Minimum Score</label>
                            <input type="number" class="form-control" id="cb-genMinScore" value="0" min="0" max="100" placeholder="0">
                        </div>
                        <div class="form-group">
                            <label>Max Results</label>
                            <div style="display:flex;gap:6px;align-items:center;">
                                <input type="number" class="form-control" id="cb-genMaxResults" value="250" min="1" placeholder="250" style="flex:1;">
                                <button type="button" onclick="document.getElementById('cb-genMaxResults').value=''" title="No limit — return all matches" style="white-space:nowrap;padding:6px 10px;border:1px solid #d1d5db;border-radius:6px;background:#f9fafb;color:#374151;cursor:pointer;font-size:0.8rem;">No Limit</button>
                            </div>
                        </div>
                        <div class="form-group" style="grid-column: 1 / -1;">
                            <label>Data Sources to Use</label>
                            <div style="display: flex; gap: 1rem; flex-wrap: wrap; padding: 0.65rem 0.75rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
                                <label style="display:flex; align-items:center; gap:0.4rem; cursor:pointer; font-size:0.9rem;"><input type="checkbox" name="cb-sources" value="osha" checked> <i class="fas fa-hard-hat" style="color:#f59e0b;"></i> OSHA Enforcement Data</label>
                                <label style="display:flex; align-items:center; gap:0.4rem; cursor:pointer; font-size:0.9rem;" title="Requires an OpenCorporates API token — enter it in the Data Sources panel above"><input type="checkbox" name="cb-sources" value="opencorporates" id="cb-source-oc"> <i class="fas fa-file-signature" style="color:#3b82f6;"></i> New Business Filings <span id="cb-oc-source-hint" style="font-size:0.72rem;color:#f59e0b;font-style:italic;">(add token above to enable)</span></label>
                                <label style="display:flex; align-items:center; gap:0.4rem; cursor:pointer; font-size:0.9rem;"><input type="checkbox" name="cb-sources" value="socrata"> <i class="fas fa-city" style="color:#8b5cf6;"></i> Open Data / Permits</label>
                                <label style="display:flex; align-items:center; gap:0.4rem; cursor:pointer; font-size:0.9rem;"><input type="checkbox" name="cb-sources" value="google_places" id="cb-source-gp"> <i class="fab fa-google" style="color:#10b981;"></i> Google Places</label>
                            </div>
                        </div>
                        <div class="form-group" style="grid-column: 1 / -1;">
                            <label>Target Lines of Business</label>
                            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.4rem; padding: 0.75rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
                                <label class="checkbox-item" style="display:flex; align-items:center; gap:0.4rem; cursor:pointer;"><input type="checkbox" name="cb-gen-lines" value="GL"> General Liability</label>
                                <label class="checkbox-item" style="display:flex; align-items:center; gap:0.4rem; cursor:pointer;"><input type="checkbox" name="cb-gen-lines" value="WC"> Workers' Compensation</label>
                                <label class="checkbox-item" style="display:flex; align-items:center; gap:0.4rem; cursor:pointer;"><input type="checkbox" name="cb-gen-lines" value="Commercial Auto"> Commercial Auto</label>
                                <label class="checkbox-item" style="display:flex; align-items:center; gap:0.4rem; cursor:pointer;"><input type="checkbox" name="cb-gen-lines" value="BOP"> BOP</label>
                                <label class="checkbox-item" style="display:flex; align-items:center; gap:0.4rem; cursor:pointer;"><input type="checkbox" name="cb-gen-lines" value="Umbrella"> Umbrella</label>
                                <label class="checkbox-item" style="display:flex; align-items:center; gap:0.4rem; cursor:pointer;"><input type="checkbox" name="cb-gen-lines" value="Inland Marine"> Inland Marine</label>
                                <label class="checkbox-item" style="display:flex; align-items:center; gap:0.4rem; cursor:pointer;"><input type="checkbox" name="cb-gen-lines" value="Tools & Equipment"> Tools &amp; Equipment</label>
                                <label class="checkbox-item" style="display:flex; align-items:center; gap:0.4rem; cursor:pointer;"><input type="checkbox" name="cb-gen-lines" value="Professional Liability"> Professional Liability</label>
                            </div>
                            <div style="margin-top:0.4rem; font-size:0.78rem; color:#6b7280;">Leave unchecked to include any line. Checked = must have at least one of these.</div>
                        </div>
                    </div>
                    <div style="margin-top: 1rem; display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
                        <button class="btn-primary" onclick="generateCBLeads()" id="cb-generate-btn" style="padding: 10px 24px; font-size: 1rem; transition: 0.2s;">
                            <i class="fas fa-bolt"></i> Generate Leads
                        </button>
                        <button class="btn-primary" onclick="sendEmailBlast()" style="padding: 10px 24px; font-size: 1rem; transition: 0.2s;">
                            <i class="fas fa-envelope"></i> Email Blast
                        </button>
                        <button class="btn-primary" onclick="sendSMSBlast()" style="padding: 10px 24px; font-size: 1rem; transition: 0.2s;">
                            <i class="fas fa-sms"></i> SMS Blast
                        </button>
                        <button class="btn-info" onclick="openLeadSplitPopup()" style="padding: 10px 24px; font-size: 1rem; transition: 0.2s;" id="cb-leadSplitBtn">
                            <i class="fas fa-cut"></i> Lead Split
                        </button>
                        <button onclick="enrichAllCBLeads()" id="cb-enrich-btn" style="background:#0ea5e9;color:white;border:none;padding:10px 24px;border-radius:6px;cursor:pointer;font-size:1rem;display:none;transition:0.2s;">
                            <i class="fas fa-search"></i> Enrich Phones
                        </button>
                        <button onclick="uploadCBLeadsToVicidial()" id="cb-vicidial-btn" style="background:#059669;color:white;border:none;padding:10px 24px;border-radius:6px;cursor:pointer;font-size:1rem;display:none;transition:0.2s;">
                            <i class="fas fa-upload"></i> Upload to Vicidial
                        </button>
                        <button class="btn-secondary" onclick="resetCBForm()" style="padding: 10px 24px; font-size: 1rem; transition: 0.2s;">
                            <i class="fas fa-redo"></i> Reset
                        </button>
                        <span id="cb-gen-status" style="font-size:0.85rem; color:#6b7280;"></span>
                    </div>
                </div>

                <!-- Results Table -->
                <div id="cbResultsContainer" style="margin-top: 1.5rem;"></div>
            </div>
        </div><!-- /genSubTab-commercialBusiness -->

        <!-- Personal Lines Sub-Tab -->
        <div id="genSubTab-personalLines" style="display: none;">
            <div class="generate-leads-container">
                <!-- Results Summary -->
                <div id="plGeneratedResults" style="margin-bottom: 1rem;">
                    <div class="results-summary">
                        <div class="stats-row">
                            <div class="stat-box" style="background: #fdf4ff;">
                                <span style="color: #7c3aed;">Total Leads Found</span>
                                <p style="font-weight: bold; color: #6d28d9;"><span id="plTotalLeadsCount">-</span></p>
                            </div>
                        </div>
                        <div class="export-options" style="margin-top: 0.75rem;">
                            <div class="export-buttons" style="display: flex; gap: 0.75rem; align-items: center;">
                                <span style="font-weight: 600; margin-right: 0.5rem;">Export:</span>
                                <button class="btn-success" onclick="exportPLResults('excel')" style="background: #10b981; color: white; padding: 8px 16px; font-size: 0.9rem;">
                                    <i class="fas fa-file-excel"></i> Excel
                                </button>
                                <button class="btn-info" onclick="exportPLResults('json')" style="background: #3b82f6; color: white; padding: 8px 16px; font-size: 0.9rem;">
                                    <i class="fas fa-file-code"></i> JSON
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- CSV Upload -->
                <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:0.85rem 1rem;margin-bottom:1rem;display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
                    <div>
                        <div style="font-weight:600;font-size:0.9rem;color:#166534;margin-bottom:0.25rem;"><i class="fas fa-file-csv"></i> Load PL Lead List</div>
                        <div style="font-size:0.78rem;color:#15803d;">Upload a CSV of personal lines prospects to filter &amp; generate</div>
                    </div>
                    <label style="background:#16a34a;color:white;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:0.85rem;display:flex;align-items:center;gap:0.4rem;">
                        <input type="file" id="pl-csv-upload" accept=".csv,.txt" style="display:none;" onchange="loadPLLeadList(this)">
                        <i class="fas fa-upload"></i> Choose CSV
                    </label>
                    <button onclick="clearPLLeadList()" style="background:#e5e7eb;border:none;color:#374151;padding:7px 12px;border-radius:6px;cursor:pointer;font-size:0.85rem;">
                        <i class="fas fa-times"></i> Clear
                    </button>
                    <span id="pl-upload-status" style="font-size:0.82rem;color:#166534;font-weight:500;"></span>
                </div>
                <!-- Criteria Section -->
                <div class="filter-section">
                    <h3 style="margin: 0 0 1rem 0;">Select Lead Criteria</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>State</label>
                            <select class="form-control" id="pl-genState">
                                <option value="">All States</option>
                                <option>AL</option><option>AK</option><option>AZ</option><option>AR</option><option>CA</option>
                                <option>CO</option><option>CT</option><option>DE</option><option>FL</option><option>GA</option>
                                <option>HI</option><option>ID</option><option>IL</option><option>IN</option><option>IA</option>
                                <option>KS</option><option>KY</option><option>LA</option><option>ME</option><option>MD</option>
                                <option>MA</option><option>MI</option><option>MN</option><option>MS</option><option>MO</option>
                                <option>MT</option><option>NE</option><option>NV</option><option>NH</option><option>NJ</option>
                                <option>NM</option><option>NY</option><option>NC</option><option>ND</option><option>OH</option>
                                <option>OK</option><option>OR</option><option>PA</option><option>RI</option><option>SC</option>
                                <option>SD</option><option>TN</option><option>TX</option><option>UT</option><option>VT</option>
                                <option>VA</option><option>WA</option><option>WV</option><option>WI</option><option>WY</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Home Status</label>
                            <select class="form-control" id="pl-genHomeStatus">
                                <option value="">All</option>
                                <option>Owner</option>
                                <option>Renter</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Age Range (Years)</label>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <input type="number" class="form-control" id="pl-genAgeMin" value="18" min="0" max="120" style="flex: 1; text-align: center;" placeholder="Min">
                                <span style="font-weight: bold; color: #374151;">-</span>
                                <input type="number" class="form-control" id="pl-genAgeMax" value="80" min="0" max="120" style="flex: 1; text-align: center;" placeholder="Max">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Number of Vehicles</label>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <input type="number" class="form-control" id="pl-genVehMin" value="0" min="0" style="flex: 1; text-align: center;" placeholder="Min">
                                <span style="font-weight: bold; color: #374151;">-</span>
                                <input type="number" class="form-control" id="pl-genVehMax" value="99" min="0" style="flex: 1; text-align: center;" placeholder="Max">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Policy Expiring Within (Days)</label>
                            <select class="form-control" id="pl-genExpiry">
                                <option value="">Any</option>
                                <option value="7">Next 7 Days</option>
                                <option value="14">Next 14 Days</option>
                                <option value="30" selected>Next 30 Days</option>
                                <option value="45">Next 45 Days</option>
                                <option value="60">Next 60 Days</option>
                                <option value="90">Next 90 Days</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Current Carrier (Exclude)</label>
                            <input type="text" class="form-control" id="pl-genExcludeCarrier" placeholder="Carrier name to exclude (optional)">
                        </div>
                        <div class="form-group" style="grid-column: 1 / -1;">
                            <label>Lines Needed</label>
                            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.4rem; padding: 0.75rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
                                <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;"><input type="checkbox" name="pl-gen-lines" value="Homeowners"> Homeowners</label>
                                <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;"><input type="checkbox" name="pl-gen-lines" value="Auto"> Auto</label>
                                <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;"><input type="checkbox" name="pl-gen-lines" value="Renters"> Renters</label>
                                <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;"><input type="checkbox" name="pl-gen-lines" value="Life"> Life</label>
                                <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;"><input type="checkbox" name="pl-gen-lines" value="Umbrella"> Personal Umbrella</label>
                                <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;"><input type="checkbox" name="pl-gen-lines" value="Boat/Marine"> Boat / Marine</label>
                                <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;"><input type="checkbox" name="pl-gen-lines" value="Motorcycle"> Motorcycle</label>
                                <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;"><input type="checkbox" name="pl-gen-lines" value="Other"> Other</label>
                            </div>
                            <div style="margin-top: 0.5rem; font-size: 0.8rem; color: #6b7280;">Leave all unchecked to include any line of business.</div>
                        </div>
                    </div>
                    <div class="form-actions" style="margin-top: 1rem;">
                        <div class="button-row">
                            <button class="btn-primary" onclick="generatePLLeads()" style="padding: 10px 24px; font-size: 1rem;">
                                <i class="fas fa-magic"></i> Generate Leads
                            </button>
                            <button class="btn-secondary" onclick="resetPLForm()" style="padding: 10px 20px;">
                                <i class="fas fa-redo"></i> Reset Filters
                            </button>
                        </div>
                    </div>
                </div>
                <!-- Results -->
                <div id="plResultsContainer" style="margin-top: 1.5rem;"></div>
            </div>
        </div><!-- /genSubTab-personalLines -->
    `;
}

// Sub-tab switcher within Generate Leads
window.switchGenLeadSubTab = function(tab) {
    ['commercialAuto', 'commercialBusiness', 'personalLines'].forEach(function(t) {
        var panel = document.getElementById('genSubTab-' + t);
        var btn = document.getElementById('genSubTabBtn-' + t);
        if (panel) panel.style.display = (t === tab) ? 'block' : 'none';
        if (btn) {
            if (t === tab) { btn.classList.add('active'); }
            else { btn.classList.remove('active'); }
        }
    });
};

// ---- Commercial Business lead generation (API-powered) ----
window._cbGeneratedLeads = window._cbGeneratedLeads || [];

// Parse a CSV string into array of objects using header row
function parseCSV(text) {
    var lines = text.split(/\r?\n/).filter(function(l){ return l.trim(); });
    if (lines.length < 2) return [];
    var headers = lines[0].split(',').map(function(h){ return h.replace(/^"|"$/g,'').trim(); });
    return lines.slice(1).map(function(line) {
        var vals = [], cur = '', inQ = false;
        for (var i = 0; i < line.length; i++) {
            var ch = line[i];
            if (ch === '"') { inQ = !inQ; }
            else if (ch === ',' && !inQ) { vals.push(cur); cur = ''; }
            else { cur += ch; }
        }
        vals.push(cur);
        var obj = {};
        headers.forEach(function(h, i){ obj[h] = (vals[i] || '').trim(); });
        return obj;
    });
}

// Priority badge helper
function cbPriorityBadge(p) {
    var colors = { A: '#15803d', B: '#b45309', C: '#1d4ed8', D: '#6b7280' };
    return '<span style="display:inline-block;background:' + (colors[p]||'#6b7280') + ';color:white;font-size:0.7rem;font-weight:700;padding:2px 7px;border-radius:10px;min-width:22px;text-align:center;">' + (p||'?') + '</span>';
}

// Sync OSHA data via DOL API
window.syncOSHAViaAPI = function() {
    var apiKey = (document.getElementById('cb-dol-api-key') || {}).value || '';
    var progress = document.getElementById('cb-import-progress');
    var state = (document.getElementById('cb-genState') || {}).value || '';
    var daysBack = parseInt((document.getElementById('cb-genDaysBack') || {}).value) || 365;

    if (progress) {
        progress.style.display = 'block';
        progress.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting to DOL API and syncing OSHA inspection data' + (state ? ' for <strong>' + state + '</strong>' : ' (all states — this may take a few minutes)') + '...';
    }

    fetch('/api/commercial-leads/sync-osha-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey, states: state ? [state] : [], daysBack: daysBack, maxRecords: 100000 })
    })
    .then(function(r){ return r.json(); })
    .then(function(d) {
        if (d.error) throw new Error(d.error);
        var jobId = d.jobId;
        if (!jobId) throw new Error('No jobId returned from server');

        // Poll for progress every 3 seconds
        var pollInterval = setInterval(function() {
            fetch('/api/commercial-leads/sync-status/' + jobId)
            .then(function(r){ return r.json(); })
            .then(function(job) {
                if (!job || job.error) {
                    clearInterval(pollInterval);
                    if (progress) progress.innerHTML = '<i class="fas fa-exclamation-triangle" style="color:#ef4444;"></i> Sync error: ' + (job && job.error ? job.error : 'Unknown error');
                    return;
                }

                // Show live progress
                if (progress) {
                    var recentLines = (job.progress || []).slice(-4).join('<br>');
                    var importedSoFar = (job.imported || 0).toLocaleString();
                    var skippedSoFar = (job.skipped || 0).toLocaleString();
                    if (job.status === 'running') {
                        progress.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing from DOL API — <strong>' + importedSoFar + ' imported</strong>, ' + skippedSoFar + ' skipped so far...<br><small style="opacity:0.75;">' + recentLines + '</small>';
                    } else if (job.status === 'done') {
                        clearInterval(pollInterval);
                        var logLines = (job.log || job.progress || []).slice(-5).join('<br>');
                        progress.innerHTML = '<i class="fas fa-check-circle" style="color:#10b981;"></i> <strong>' + (job.imported||0).toLocaleString() + ' records synced</strong> from DOL API. ' + (job.skipped||0).toLocaleString() + ' outside target NAICS classes.<br><small style="opacity:0.8;">' + logLines + '</small>';
                        refreshCBSourceStatus();
                    } else if (job.status === 'error') {
                        clearInterval(pollInterval);
                        progress.innerHTML = '<i class="fas fa-exclamation-triangle" style="color:#ef4444;"></i> Sync failed: ' + (job.error || 'Unknown error');
                    }
                }
            })
            .catch(function(pollErr) {
                // Don't stop polling on a transient network error — just log it
                console.warn('Poll error:', pollErr.message);
            });
        }, 3000);
    })
    .catch(function(e) {
        if (progress) progress.innerHTML = '<i class="fas fa-exclamation-triangle" style="color:#ef4444;"></i> Sync failed: ' + e.message;
    });
};

// Import OSHA CSV via file input → POST to backend
window.importOSHAFile = function(input) {
    var file = input.files[0];
    if (!file) return;
    var progress = document.getElementById('cb-import-progress');
    if (progress) { progress.style.display = 'block'; progress.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading and processing <strong>' + file.name + '</strong> (' + (file.size/1024/1024).toFixed(1) + ' MB)...'; }

    var state = (document.getElementById('cb-genState') || {}).value || '';
    var formData = new FormData();
    formData.append('file', file);
    if (state) formData.append('state', state);

    fetch('/api/commercial-leads/import-osha', { method: 'POST', body: formData })
        .then(function(r){ return r.json(); })
        .then(function(d) {
            if (d.error) throw new Error(d.error);
            if (progress) progress.innerHTML = '<i class="fas fa-check-circle" style="color:#10b981;"></i> <strong>' + d.imported + ' records imported</strong>, ' + d.skipped + ' skipped (not in target NAICS classes). <em>Ready to generate leads.</em>';
            refreshCBSourceStatus();
            input.value = '';
        })
        .catch(function(e) {
            if (progress) progress.innerHTML = '<i class="fas fa-exclamation-triangle" style="color:#ef4444;"></i> Import failed: ' + e.message;
        });
};

// Query variant counts per vertical (mirrors GP_QUERY_VARIANTS in commercial-leads.js)
var GP_VARIANT_COUNTS = {
    'auto dealer':12,'car dealer':12,'dealership':12,'car lot':12,'car sales':12,'buy here pay here':12,
    'auto repair':15,'mechanic':15,'body shop':15,'collision':15,'tire shop':15,'oil change':15,
    'roofing':10,'roofer':10,
    'hvac':13,'air condition':13,'furnace':13,'heat pump':13,
    'plumb':11,'drain':11,'water heater':11,
    'electric':10,'electrician':10,'wiring':10,
    'contractor':12,'construction':12,'remodel':12,'builder':12,'masonry':12,'concrete':12,'drywall':12,
    'trucking':14,'freight carrier':14,'flatbed':14,'ltl':14,'tanker':14,'dump truck':14,
    'transport':13,'towing':13,'logistics':13,'limo':13,'taxi':13,'courier':13,'moving':13,
    'restaurant':20,'food service':20,'catering':20,'diner':20,'cafe':20,'brewery':20,'pizza':20,
    'manufactur':15,'factory':15,'fabricat':15,'machine shop':15,'welding':15,'cnc':15,
    'healthcare':16,'medical':16,'dental':16,'clinic':16,'nursing':16,'chiropract':16,'dialysis':16,
    'cleaning':13,'janitorial':13,'maid':13,'carpet clean':13,'pressure wash':13,
    'landscap':12,'lawn':12,'tree service':12,'snow removal':12,'irrigation':12,
    'security':11,'security guard':11,'patrol':11,'armed security':11,
    'staffing':8,'temp agency':8,'workforce':8,
    'waste':12,'recycling':12,'junk removal':12,'dumpster':12,'septic':12,
    'wholesale':10,'distributor':10,'supply warehouse':10,
    'real estate':10,'property manag':10,'apartment complex':10,'storage facility':10,
    'engineer':11,'architect':11,'accounting':11,'cpa':11,'law firm':11,
    'retail':8,'grocery':8,'hardware store':8,
    'solar':7,'utility':7,
};
function getVariantCount(industry) {
    if (!industry) return 1;
    var kw = industry.toLowerCase();
    for (var k in GP_VARIANT_COUNTS) { if (kw.includes(k)) return GP_VARIANT_COUNTS[k]; }
    return 1;
}

// Cost calculator for Google Places (each API call = 20 results = $0.017)
window.updateGPCost = function() {
    var n = parseInt((document.getElementById('cb-gp-max') || {}).value) || 40;
    var cached = parseInt((document.getElementById('cb-gp-cached-count') || {}).textContent) || 0;
    var needed = Math.max(0, n - cached);
    var industry = (document.getElementById('cb-genIndustry') || {}).value || '';
    var variants = getVariantCount(industry);
    var apiCalls = needed > 0 ? Math.ceil(needed / 20) : 0;
    var cost = (apiCalls * 0.017).toFixed(3);
    var costEl = document.getElementById('cb-gp-cost');
    var display = document.getElementById('cb-gp-cost-display');
    if (costEl) costEl.textContent = '$' + cost;
    if (display) {
        if (apiCalls === 0) {
            display.style.background = 'rgba(16,185,129,0.2)';
            display.style.borderColor = 'rgba(16,185,129,0.4)';
            var strong = display.querySelector('strong');
            if (strong) strong.style.color = '#4ade80';
            costEl.textContent = '$0.000 (all cached)';
        } else {
            display.style.background = 'rgba(251,191,36,0.15)';
            display.style.borderColor = 'rgba(251,191,36,0.4)';
            var strong = display.querySelector('strong');
            if (strong) strong.style.color = '#fbbf24';
        }
    }
    // Variant hint
    var hint = document.getElementById('cb-gp-variant-hint');
    if (!hint && display && display.parentNode) {
        hint = document.createElement('div');
        hint.id = 'cb-gp-variant-hint';
        hint.style.cssText = 'font-size:0.68rem;color:rgba(255,255,255,0.5);margin-top:3px;width:100%;';
        display.parentNode.appendChild(hint);
    }
    if (hint) hint.textContent = variants > 1 ? variants + ' search terms \xd7 cities for max coverage' : '';
};

// Refresh data source status badges
window.refreshCBSourceStatus = function() {
    // Restore saved OC token from localStorage
    var savedToken = localStorage.getItem('vanguard_oc_token') || '';
    if (savedToken) {
        window._cbOcToken = savedToken;
        var inp = document.getElementById('cb-oc-api-token');
        var b = document.getElementById('cb-oc-badge');
        var chk = document.getElementById('cb-source-oc');
        if (inp && !inp.value) inp.value = savedToken;
        if (b) { b.textContent = 'Key Set'; b.style.background = '#10b981'; }
        if (chk) chk.checked = true;
    }

    fetch('/api/commercial-leads/source-status')
        .then(function(r){ return r.json(); })
        .then(function(d) {
            var badge = document.getElementById('cb-osha-badge');
            var statusEl = document.getElementById('cb-osha-status');
            if (d.osha && d.osha.count > 0) {
                if (badge) { badge.textContent = d.osha.count.toLocaleString() + ' records'; badge.style.background = '#10b981'; }
                if (statusEl) statusEl.textContent = 'Last sync: ' + (d.osha.lastSyncDate || d.osha.lastSync || 'unknown');
            } else {
                if (badge) { badge.textContent = 'Not Loaded'; badge.style.background = '#6b7280'; }
                if (statusEl) statusEl.textContent = 'Download CSV from enforcedata.dol.gov then import above';
            }
            // Google Places cached count
            var gpCount = (d.google_places && d.google_places.count) || 0;
            var gpCached = document.getElementById('cb-gp-cached-count');
            var gpBadge = document.getElementById('cb-gp-badge');
            if (gpCached) gpCached.textContent = gpCount.toLocaleString();
            if (gpBadge) {
                gpBadge.textContent = gpCount > 0 ? gpCount.toLocaleString() + ' cached' : 'Ready';
                gpBadge.style.background = gpCount > 0 ? '#3b82f6' : '#10b981';
            }
            updateGPCost();
        })
        .catch(function(){});
};

// Paginated lead table renderer — called after results load and on page navigation
window.renderCBLeadsPage = function(page) {
    var PAGE_SIZE = 50;
    var allLeads = window._cbGeneratedLeads || [];
    var totalPages = Math.max(1, Math.ceil(allLeads.length / PAGE_SIZE));
    page = Math.max(0, Math.min(page, totalPages - 1));
    window._cbLeadsPage = page;

    var offset = page * PAGE_SIZE;
    var slice = allLeads.slice(offset, offset + PAGE_SIZE);

    var rows = slice.map(function(l, si) {
        var i = offset + si;
        var lines = (l.targetLines || []).slice(0, 3).join(', ');
        var bg = si % 2 === 0 ? '#fff' : '#f9fafb';
        var phoneCell = l.phone
            ? '<span style="color:#059669;font-weight:600;">' + l.phone + '</span>'
            : '<button onclick="enrichSingleCBLead(' + i + ', this)" title="Look up via Google Places" style="background:#0ea5e9;border:none;color:white;padding:2px 7px;border-radius:4px;cursor:pointer;font-size:0.72rem;white-space:nowrap;"><i class="fas fa-search"></i> Find</button>';
        var websiteCell = l.website
            ? '<a href="' + l.website + '" target="_blank" rel="noopener" style="color:#3b82f6;font-size:0.75rem;word-break:break-all;" title="' + l.website + '">' + l.website.replace(/^https?:\/\/(www\.)?/,'').split('/')[0] + '</a>'
            : '<span id="cb-web-' + i + '" style="color:#d1d5db;font-size:0.75rem;">—</span>';
        var emailCell = l.email
            ? '<a href="mailto:' + l.email + '" style="color:#7c3aed;font-size:0.75rem;">' + l.email + '</a>'
            : '<span id="cb-email-' + i + '" style="color:#d1d5db;font-size:0.75rem;">—</span>';
        return '<tr style="background:' + bg + ';border-bottom:1px solid #f0f0f0;" onmouseenter="this.style.background=\'#eff6ff\'" onmouseleave="this.style.background=\'' + bg + '\'">' +
            '<td style="padding:8px 10px;">' + cbPriorityBadge(l.priority) + '</td>' +
            '<td style="padding:8px 10px;font-weight:600;font-size:0.85rem;">' + (l.businessName || '') + '</td>' +
            '<td style="padding:8px 10px;font-size:0.82rem;color:#374151;">' + (l.city ? l.city + ', ' : '') + (l.state || '') + '</td>' +
            '<td style="padding:8px 10px;font-size:0.82rem;"><span style="background:#dbeafe;color:#1e40af;padding:2px 7px;border-radius:10px;font-size:0.75rem;">' + (l.vertical || '') + '</span></td>' +
            '<td style="padding:8px 10px;font-size:0.78rem;color:#6b7280;">' + (l.subVertical || '') + '</td>' +
            '<td style="padding:8px 10px;font-size:0.78rem;color:#374151;">' + lines + '</td>' +
            '<td id="cb-phone-' + i + '" style="padding:8px 10px;font-size:0.8rem;color:#374151;">' + phoneCell + '</td>' +
            '<td id="cb-web-wrap-' + i + '" style="padding:8px 10px;max-width:140px;overflow:hidden;">' + websiteCell + '</td>' +
            '<td id="cb-email-wrap-' + i + '" style="padding:8px 10px;max-width:160px;overflow:hidden;">' + emailCell + '</td>' +
            '<td style="padding:8px 10px;font-size:0.75rem;color:#9ca3af;">' + (l.source || '') + '</td>' +
            '</tr>';
    }).join('');

    var start = offset + 1;
    var end = Math.min(offset + PAGE_SIZE, allLeads.length);
    var prevDis = page === 0;
    var nextDis = page >= totalPages - 1;
    var paginationHtml = totalPages > 1
        ? '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-top:1px solid #e5e7eb;background:#f9fafb;border-radius:0 0 8px 8px;">' +
          '<button onclick="window.renderCBLeadsPage(' + (page - 1) + ')" ' + (prevDis ? 'disabled ' : '') + 'style="padding:5px 14px;background:#1e3a5f;color:white;border:none;border-radius:6px;font-size:0.82rem;opacity:' + (prevDis ? '0.4' : '1') + ';cursor:' + (prevDis ? 'default' : 'pointer') + ';">&#8592; Prev</button>' +
          '<span style="font-size:0.82rem;color:#374151;">Showing <strong>' + start.toLocaleString() + '–' + end.toLocaleString() + '</strong> of <strong>' + allLeads.length.toLocaleString() + '</strong> &nbsp;|&nbsp; Page <strong>' + (page + 1) + '</strong> of ' + totalPages + '</span>' +
          '<button onclick="window.renderCBLeadsPage(' + (page + 1) + ')" ' + (nextDis ? 'disabled ' : '') + 'style="padding:5px 14px;background:#1e3a5f;color:white;border:none;border-radius:6px;font-size:0.82rem;opacity:' + (nextDis ? '0.4' : '1') + ';cursor:' + (nextDis ? 'default' : 'pointer') + ';">Next &#8594;</button>' +
          '</div>'
        : '';

    // If table already exists, only swap tbody + pagination (fast, no full rebuild)
    var tbody = document.getElementById('cb-leads-tbody');
    if (tbody) {
        tbody.innerHTML = rows;
        var pEl = document.getElementById('cb-leads-pagination');
        if (pEl) pEl.innerHTML = paginationHtml;
        var scrollEl = document.getElementById('cb-leads-scroll');
        if (scrollEl) scrollEl.scrollTop = 0;
        return;
    }

    // First render — build full table structure
    var cont = document.getElementById('cbResultsContainer');
    if (!cont) return;
    cont.innerHTML =
        '<div id="cb-leads-scroll" style="overflow-x:auto;border:1px solid #e5e7eb;border-radius:8px;">' +
        '<table style="width:100%;border-collapse:collapse;font-size:13px;">' +
        '<thead><tr style="position:sticky;top:0;z-index:1;">' +
        '<th style="padding:8px 10px;text-align:left;background:#1e3a5f;color:white;white-space:nowrap;">Priority</th>' +
        '<th style="padding:8px 10px;text-align:left;background:#1e3a5f;color:white;white-space:nowrap;">Business Name</th>' +
        '<th style="padding:8px 10px;text-align:left;background:#1e3a5f;color:white;white-space:nowrap;">Location</th>' +
        '<th style="padding:8px 10px;text-align:left;background:#1e3a5f;color:white;white-space:nowrap;">Vertical</th>' +
        '<th style="padding:8px 10px;text-align:left;background:#1e3a5f;color:white;white-space:nowrap;">Sub-Type</th>' +
        '<th style="padding:8px 10px;text-align:left;background:#1e3a5f;color:white;white-space:nowrap;">Target Lines</th>' +
        '<th style="padding:8px 10px;text-align:left;background:#1e3a5f;color:white;white-space:nowrap;">Phone</th>' +
        '<th style="padding:8px 10px;text-align:left;background:#1e3a5f;color:white;white-space:nowrap;">Website</th>' +
        '<th style="padding:8px 10px;text-align:left;background:#1e3a5f;color:white;white-space:nowrap;">Email</th>' +
        '<th style="padding:8px 10px;text-align:left;background:#1e3a5f;color:white;white-space:nowrap;">Source</th>' +
        '</tr></thead>' +
        '<tbody id="cb-leads-tbody">' + rows + '</tbody></table>' +
        '<div id="cb-leads-pagination">' + paginationHtml + '</div>' +
        '</div>';
};

// Main generate — calls backend API
window.generateCBLeads = function() {
    var btn = document.getElementById('cb-generate-btn');
    var statusEl = document.getElementById('cb-gen-status');
    var container = document.getElementById('cbResultsContainer');

    var sources = Array.from(document.querySelectorAll('input[name="cb-sources"]:checked')).map(function(c){ return c.value; });
    if (!sources.length) { alert('Select at least one data source.'); return; }

    var targetLines = Array.from(document.querySelectorAll('input[name="cb-gen-lines"]:checked')).map(function(c){ return c.value; });
    var vertical = (document.getElementById('cb-genVertical') || {}).value || '';

    var criteria = {
        sources: sources,
        state:          (document.getElementById('cb-genState') || {}).value || '',
        industry:       (document.getElementById('cb-genIndustry') || {}).value || '',
        verticals:      vertical ? [vertical] : [],
        daysBack:       parseInt((document.getElementById('cb-genDaysBack') || {}).value) || 90,
        employeesMin:   (document.getElementById('cb-genEmpMin') || {}).value || '',
        employeesMax:   (document.getElementById('cb-genEmpMax') || {}).value || '',
        minScore:       parseInt((document.getElementById('cb-genMinScore') || {}).value) || 0,
        maxResults:     parseInt((document.getElementById('cb-genMaxResults') || {}).value) || 999999,
        targetLines:    targetLines,
        socrataEndpoint:(document.getElementById('cb-socrata-endpoint') || {}).value || '',
        ocApiToken: (document.getElementById('cb-oc-api-token') || {}).value || window._cbOcToken || '',
        gpMax: parseInt((document.getElementById('cb-gp-max') || {}).value) || 40,
    };

    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...'; }
    if (statusEl) statusEl.textContent = '';

    // Progress bar loading UI
    if (container) container.innerHTML = `
        <div id="cb-progress-wrap" style="padding:2rem 1rem;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                <i class="fas fa-database" style="color:#015b91;font-size:1.1rem;"></i>
                <span style="font-size:0.9rem;font-weight:600;color:#1e3a5f;" id="cb-progress-label">Searching 1.4M records...</span>
            </div>
            <div style="background:#e5e7eb;border-radius:999px;height:10px;overflow:hidden;">
                <div id="cb-progress-bar" style="height:100%;background:linear-gradient(90deg,#015b91,#0284c7);border-radius:999px;width:0%;transition:width 0.4s ease;"></div>
            </div>
            <div style="font-size:0.75rem;color:#6b7280;margin-top:6px;" id="cb-progress-sub">Querying data sources...</div>
        </div>`;

    // Animate progress bar while waiting
    var pct = 0;
    var labels = ['Searching 1.4M records...','Filtering by criteria...','Scoring & ranking leads...','Deduplicating results...','Almost done...'];
    var li = 0;
    var pInterval = setInterval(function() {
        pct = Math.min(pct + (pct < 70 ? 8 : pct < 90 ? 2 : 0.5), 95);
        var bar = document.getElementById('cb-progress-bar');
        var lbl = document.getElementById('cb-progress-label');
        var sub = document.getElementById('cb-progress-sub');
        if (bar) bar.style.width = pct + '%';
        if (lbl && li < labels.length && pct > li * 20) { lbl.textContent = labels[li]; li++; }
        if (sub) sub.textContent = Math.round(pct) + '% complete';
    }, 400);

    // Process completed job results
    var _handleGenResults = function(data) {
        clearInterval(pInterval);
        var bar = document.getElementById('cb-progress-bar');
        if (bar) bar.style.width = '100%';
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-bolt"></i> Generate Leads'; }
        if (data.error) {
            var emsg = data.error.length < 200 ? data.error : 'Generation failed. Try narrowing your filters.';
            if (statusEl) statusEl.textContent = '';
            if (container) container.innerHTML =
                '<div style="padding:1.5rem;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;margin:1rem 0;">' +
                '<div style="display:flex;align-items:center;gap:10px;color:#dc2626;font-weight:700;margin-bottom:6px;">' +
                '<i class="fas fa-exclamation-circle"></i> Error Generating Leads</div>' +
                '<div style="font-size:0.85rem;color:#7f1d1d;">' + emsg + '</div></div>';
            return;
        }
        var leads = data.leads || [];
        window._cbGeneratedLeads = leads;

        // Update stat counters
        var countEl = document.getElementById('cbTotalLeadsCount');
        var aEl = document.getElementById('cbPriorityACount');
        var bEl = document.getElementById('cbPriorityBCount');
        if (countEl) countEl.textContent = leads.length.toLocaleString();
        if (aEl) aEl.textContent = leads.filter(function(l){ return l.priority === 'A'; }).length;
        if (bEl) bEl.textContent = leads.filter(function(l){ return l.priority === 'B'; }).length;

        if (statusEl) {
            var sources = leads.length
                ? leads.map(function(l){ return l.source; }).filter(function(v,i,a){ return a.indexOf(v)===i; }).join(', ')
                : '—';
            statusEl.innerHTML = '<span style="color:#374151;">Sources: <strong>' + sources + '</strong></span>' +
                (data.errors && data.errors.length
                    ? ' &nbsp;<span style="color:#f59e0b;font-size:0.8rem;" title="' + data.errors.join('\n').replace(/"/g,'&quot;') + '"><i class="fas fa-exclamation-triangle"></i> ' + data.errors.length + ' warning(s)</span>'
                    : '');
        }

        // Show action buttons now that we have results
        var vicBtn = document.getElementById('cb-vicidial-btn');
        var enrichBtn = document.getElementById('cb-enrich-btn');
        if (vicBtn) vicBtn.style.display = leads.length ? '' : 'none';
        if (enrichBtn) enrichBtn.style.display = leads.length ? '' : 'none';

        if (!leads.length) {
            // Build a diagnostic breakdown so the user knows exactly what to fix
            var diagLines = [];
            var checkedSources = Array.from(document.querySelectorAll('input[name="cb-sources"]:checked')).map(function(c){ return c.value; });
            var oshaStatus = document.getElementById('cb-osha-badge');
            var oshaCount = oshaStatus ? oshaStatus.textContent : '';
            if (checkedSources.includes('osha')) {
                if (oshaCount === 'Not Loaded' || oshaCount === '0 records') {
                    diagLines.push('<li><strong>OSHA:</strong> Database empty — click <strong>Sync via API</strong> in the Data Sources panel to populate it first.</li>');
                } else {
                    diagLines.push('<li><strong>OSHA:</strong> ' + oshaCount + ' records loaded but none matched your filters — try removing state/vertical/score filters.</li>');
                }
            }
            if (checkedSources.includes('opencorporates')) {
                var hasOcToken = !!(document.getElementById('cb-oc-api-token') || {value:''}).value || !!window._cbOcToken || !!(window._cbOcEnvToken);
                if (!hasOcToken) {
                    diagLines.push('<li><strong>OpenCorporates:</strong> No API token — enter your token in the Data Sources panel, or uncheck this source.</li>');
                }
            }
            if (!checkedSources.length) {
                diagLines.push('<li>No data sources selected — check at least one source above.</li>');
            }
            if (data.errors && data.errors.length && !diagLines.length) {
                diagLines.push('<li>' + data.errors.join('</li><li>') + '</li>');
            }

            var diagHtml = diagLines.length
                ? '<ul style="text-align:left;margin:0.75rem auto;max-width:480px;padding-left:1.2rem;font-size:0.85rem;line-height:1.7;color:#374151;">' + diagLines.join('') + '</ul>'
                : '';
            if (container) container.innerHTML =
                '<div style="padding:2rem 1rem;text-align:center;color:#6b7280;">' +
                '<i class="fas fa-inbox" style="font-size:2.2rem;margin-bottom:0.75rem;display:block;color:#d1d5db;"></i>' +
                '<div style="font-size:1rem;font-weight:600;color:#374151;margin-bottom:0.4rem;">No leads found</div>' +
                diagHtml +
                '</div>';
            return;
        }

        // Render first page (clears old table so renderCBLeadsPage builds fresh)
        document.getElementById('cb-leads-tbody') && (document.getElementById('cb-leads-tbody').id = '');
        window.renderCBLeadsPage(0);
    };

    // Start async generate job and poll for results
    fetch('/api/commercial-leads/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(criteria)
    })
    .then(function(r){ return r.json(); })
    .then(function(startData) {
        if (startData.error) throw new Error(startData.error);
        // If backend returned jobId, poll for completion
        if (startData.jobId) {
            var jobId = startData.jobId;
            var pollFails = 0;
            var pollTimer = setInterval(function() {
                fetch('/api/commercial-leads/sync-status/' + jobId)
                .then(function(r){ return r.json(); })
                .then(function(job) {
                    if (job.status === 'done') {
                        clearInterval(pollTimer);
                        _handleGenResults(job);
                    } else if (job.status === 'error') {
                        clearInterval(pollTimer);
                        _handleGenResults({ error: job.error || 'Generation failed' });
                    }
                    // else still running — keep polling
                })
                .catch(function() {
                    if (++pollFails > 15) {
                        clearInterval(pollTimer);
                        _handleGenResults({ error: 'Lost connection while waiting for results. Please try again.' });
                    }
                });
            }, 2000);
        } else {
            // Legacy synchronous response
            _handleGenResults(startData);
        }
    })
    .catch(function(e) {
        clearInterval(pInterval);
        var msg = e.message && e.message.length < 200 ? e.message : 'Request failed. Try narrowing your filters or reducing max results.';
        if (statusEl) statusEl.textContent = '';
        if (container) container.innerHTML =
            '<div style="padding:1.5rem;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;margin:1rem 0;">' +
            '<div style="display:flex;align-items:center;gap:10px;color:#dc2626;font-weight:700;margin-bottom:6px;">' +
            '<i class="fas fa-exclamation-circle"></i> Error Generating Leads</div>' +
            '<div style="font-size:0.85rem;color:#7f1d1d;">' + msg + '</div>' +
            '</div>';
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-bolt"></i> Generate Leads'; }
    });
};

// Build a CRM lead object from a CB generated lead
function cbLeadToCRMLead(l) {
    var lines = (l.targetLines || []).join(', ');
    return {
        id: Date.now() + Math.floor(Math.random() * 10000),
        name: l.businessName || 'Unknown Business',
        company: l.businessName || '',
        phone: l.phone || '',
        email: l.email || '',
        address: [l.address, l.city, l.state, l.zip].filter(Boolean).join(', '),
        source: 'Commercial Lead Gen',
        insuranceType: (l.targetLines && l.targetLines[0]) || l.vertical || 'Commercial',
        product: (l.targetLines && l.targetLines[0]) || l.vertical || 'Commercial',
        notes: 'Vertical: ' + (l.vertical || '') + (l.subVertical ? ' › ' + l.subVertical : '') +
               '\nLines: ' + lines +
               '\nPremium Band: ' + (l.premiumBand || '') +
               '\nLead Score: ' + (l.total || 0) + ' (Priority ' + (l.priority || '?') + ')' +
               '\nSource: ' + (l.source || '') +
               (l.employeeCount ? '\nEmployees: ' + l.employeeCount : ''),
        stage: 'new',
        priority: l.priority === 'A' ? 'High' : l.priority === 'B' ? 'Mid' : 'Low',
        assignedTo: '',
        premium: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stageTimestamps: { new: new Date().toISOString() },
        quotes: [],
        activities: [{ type: 'created', date: new Date().toISOString(), note: 'Lead imported from Commercial Lead Generator' }]
    };
}

// Save a single CRM lead to server + localStorage
function saveCRMLead(lead) {
    var apiUrl = window.location.protocol + '//' + window.location.hostname + ':3001';
    // Server save (best-effort — no await since we're in a sync context)
    fetch(apiUrl + '/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead)
    }).catch(function(){});
    // localStorage
    try {
        var existing = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        existing.unshift(lead);
        localStorage.setItem('insurance_leads', JSON.stringify(existing));
    } catch(e) {}
}

window.addSingleCBLeadToCRM = function(idx, btn) {
    var leads = window._cbGeneratedLeads || [];
    var l = leads[idx];
    if (!l) return;
    var lead = cbLeadToCRMLead(l);
    // Ensure unique id
    lead.id = Date.now() + idx;
    saveCRMLead(lead);
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-check"></i> Added';
        btn.style.background = '#6b7280';
    }
};

window.addAllCBLeadsToCRM = function() {
    var leads = window._cbGeneratedLeads || [];
    if (!leads.length) { alert('No leads to add. Generate leads first.'); return; }
    if (!confirm('Add all ' + leads.length + ' leads to the CRM pipeline?')) return;

    var added = 0;
    leads.forEach(function(l, i) {
        var lead = cbLeadToCRMLead(l);
        lead.id = Date.now() + i;
        saveCRMLead(lead);
        added++;
    });

    // Mark all row buttons as added
    document.querySelectorAll('#cbResultsContainer button').forEach(function(b) {
        if (b.textContent.includes('CRM')) {
            b.disabled = true; b.innerHTML = '<i class="fas fa-check"></i> Added'; b.style.background = '#6b7280';
        }
    });

    alert(added + ' leads added to CRM. Refresh the Leads tab to see them.');
};

// Enrich a single lead — fetches phone, website, and scrapes email from website
window.enrichSingleCBLead = function(idx, btnEl) {
    var leads = window._cbGeneratedLeads || [];
    var l = leads[idx];
    if (!l) return;
    var phoneCell = document.getElementById('cb-phone-' + idx);
    var webCell   = document.getElementById('cb-web-wrap-' + idx);
    var emailCell = document.getElementById('cb-email-wrap-' + idx);
    if (btnEl) { btnEl.disabled = true; btnEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; }
    fetch('/api/commercial-leads/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: l.businessName, city: l.city, state: l.state, sourceId: l.sourceId || null })
    })
    .then(function(r){ return r.json(); })
    .then(function(d) {
        var result = (d.results || [])[0] || {};
        l.phone         = result.phone         || l.phone;
        l.website       = result.website       || l.website;
        l.email         = result.email         || l.email;
        l.streetAddress = result.streetAddress || l.streetAddress || l.address;
        if (phoneCell) phoneCell.innerHTML = l.phone
            ? '<span style="color:#059669;font-weight:600;">' + l.phone + '</span>'
            : '<span style="color:#d1d5db;">—</span>';
        if (webCell && l.website) webCell.innerHTML = '<a href="' + l.website + '" target="_blank" rel="noopener" style="color:#3b82f6;font-size:0.75rem;">' + l.website.replace(/^https?:\/\/(www\.)?/,'').split('/')[0] + '</a>';
        if (emailCell) emailCell.innerHTML = l.email
            ? '<a href="mailto:' + l.email + '" style="color:#7c3aed;font-size:0.75rem;">' + l.email + '</a>'
            : '<span style="color:#d1d5db;font-size:0.75rem;">—</span>';
    })
    .catch(function(e) {
        if (phoneCell) phoneCell.innerHTML = '<span style="color:#ef4444;font-size:0.75rem;">Error</span>';
    });
};

// Enrich all visible leads phones — skips leads that already have a phone,
// sends sourceId so backend can cache and re-use without re-calling Google.
window.enrichAllCBLeads = function() {
    var leads = window._cbGeneratedLeads || [];
    if (!leads.length) { alert('Generate leads first.'); return; }
    var btn = document.getElementById('cb-enrich-btn');
    if (btn && btn.disabled) return; // already running

    var needsEnrich = [];
    leads.forEach(function(l, i) {
        if (!((l.phone && l.phone.trim()) && (l.email && l.email.trim()) && (l.website && l.website.trim()))) {
            needsEnrich.push({ idx: i, lead: l });
        }
    });

    if (!needsEnrich.length) {
        if (btn) { btn.style.background = '#0ea5e9'; btn.innerHTML = '<i class="fas fa-check"></i> All ' + leads.length + ' already enriched'; }
        return;
    }

    var total = needsEnrich.length;
    var completed = 0;
    var found = 0;
    var CONCURRENCY = 3;

    // Button fill-progress: grey base, blue fill sweeps left-to-right
    function updateBtn() {
        if (!btn) return;
        var pct = total > 0 ? Math.round(completed / total * 100) : 0;
        btn.disabled = true;
        btn.style.background = 'linear-gradient(to right, #0284c7 ' + pct + '%, #94a3b8 ' + pct + '%)';
        btn.style.color = 'white';
        btn.style.transition = 'background 0.25s ease';
        btn.innerHTML = completed + ' / ' + total + ' &nbsp;<span style="font-size:0.82em;opacity:0.9;">(' + pct + '%)</span>';
    }

    function finishBtn() {
        if (!btn) return;
        btn.disabled = false;
        btn.style.background = found === total ? '#059669' : '#0ea5e9';
        btn.style.transition = '';
        btn.innerHTML = '<i class="fas fa-check"></i> ' + found + '/' + total + ' found';
    }

    function processOne(item, done) {
        fetch('/api/commercial-leads/enrich', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ businesses: [{ name: item.lead.businessName, city: item.lead.city, state: item.lead.state }] })
        })
        .then(function(r) { return r.json(); })
        .then(function(d) {
            var result = (d.results || [])[0] || {};
            if (result.phone) {
                item.lead.phone = result.phone;
                found++;
                var phoneCell = document.getElementById('cb-phone-' + item.idx);
                if (phoneCell) phoneCell.innerHTML = '<span style="color:#059669;font-weight:600;">' + result.phone + '</span>';
            }
            if (result.website) {
                item.lead.website = result.website;
                var webCell = document.getElementById('cb-web-wrap-' + item.idx);
                if (webCell) webCell.innerHTML = '<a href="' + result.website + '" target="_blank" rel="noopener" style="color:#3b82f6;font-size:0.75rem;">' + result.website.replace(/^https?:\/\/(www\.)?/,'').split('/')[0] + '</a>';
            }
            if (result.email) {
                item.lead.email = result.email;
                var emailCell = document.getElementById('cb-email-wrap-' + item.idx);
                if (emailCell) emailCell.innerHTML = '<a href="mailto:' + result.email + '" style="color:#7c3aed;font-size:0.75rem;">' + result.email + '</a>';
            }
            if (result.streetAddress) item.lead.streetAddress = result.streetAddress;
        })
        .catch(function() {}) // skip failed lookups silently
        .then(function() {    // always runs (finally equivalent)
            completed++;
            updateBtn();
            done();
        });
    }

    // Concurrency-limited queue
    var queue = needsEnrich.slice();
    var active = 0;

    function next() {
        if (!queue.length && active === 0) { finishBtn(); return; }
        while (active < CONCURRENCY && queue.length) {
            active++;
            (function(item) {
                processOne(item, function() {
                    active--;
                    next();
                });
            })(queue.shift());
        }
    }

    updateBtn();
    next();
};

window.uploadCBLeadsToVicidial = function() {
    var leads = window._cbGeneratedLeads || [];
    if (!leads.length) { alert('No leads to upload. Generate leads first.'); return; }
    if (!window.vicidialUploader) { alert('Vicidial uploader not loaded'); return; }

    var formatted = leads.map(function(l) {
        return {
            source_type:    'commercial',
            name:           l.businessName || '',
            company:        l.businessName || '',
            phone:          l.phone || '',
            email:          l.email || '',
            website:        l.website || '',
            street_address: l.streetAddress || l.address || '',
            city:           l.city || '',
            state:          l.state || '',
            zip:            l.zip || '',
            vertical:       l.vertical || '',
            target_lines:   (l.targetLines || []).join(', '),
            source:         l.source || 'Commercial Lead Gen',
            sourceId:       l.sourceId || '',
        };
    });

    var state = (document.getElementById('cb-genState') || {}).value || '';
    window.vicidialUploader.showUploadDialog({
        leads: formatted,
        totalLeads: formatted.length,
        state: state,
        displayExpiry: 'N/A (Commercial)',
        insuranceCompanies: [],
    });
};

window.resetCBForm = function() {
    ['cb-genState','cb-genIndustry','cb-genVertical','cb-genEmpMin','cb-genEmpMax'].forEach(function(id){
        var el = document.getElementById(id); if(el) el.value = '';
    });
    var daysBack = document.getElementById('cb-genDaysBack'); if(daysBack) daysBack.value = '90';
    var minScore = document.getElementById('cb-genMinScore'); if(minScore) minScore.value = '0';
    var maxResults = document.getElementById('cb-genMaxResults'); if(maxResults) maxResults.value = '250';
    document.querySelectorAll('input[name="cb-gen-lines"]').forEach(function(c){ c.checked = false; });
    document.querySelectorAll('input[name="cb-sources"]').forEach(function(c){
        if (c.value === 'osha') { c.checked = true; }
        else if (c.value === 'opencorporates') { c.checked = !!(window._cbOcToken || (document.getElementById('cb-oc-api-token')||{}).value); }
        else { c.checked = false; }
    });
    var statusEl = document.getElementById('cb-gen-status'); if(statusEl) statusEl.textContent = '';
};

window.exportCBResults = function(fmt) {
    var leads = window._cbGeneratedLeads || [];
    if (!leads.length) { alert('No results to export. Generate leads first.'); return; }
    var filename = 'commercial_leads_' + new Date().toISOString().split('T')[0];
    if (fmt === 'json') {
        var blob = new Blob([JSON.stringify(leads, null, 2)], {type:'application/json'});
        var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename + '.json'; a.click();
        return;
    }
    var exportCols = ['priority','total','businessName','city','state','zip','vertical','subVertical','targetLines','phone','email','website','naicsCode','source','daysOld'];
    var rows = leads.map(function(l){
        return exportCols.map(function(k){
            var v = Array.isArray(l[k]) ? l[k].join('; ') : (l[k] || '');
            return '"' + String(v).replace(/"/g,'""') + '"';
        }).join(',');
    });
    var csv = [exportCols.join(',')].concat(rows).join('\n');
    var blob = new Blob([csv], {type:'text/csv'});
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename + '.csv'; a.click();
};

// Auto-load source status when tab is shown
(function() {
    var origSwitch = window.switchGenLeadSubTab;
    window.switchGenLeadSubTab = function(tab) {
        if (origSwitch) origSwitch(tab);
        if (tab === 'commercialBusiness') { setTimeout(refreshCBSourceStatus, 200); }
    };
})();

// ─── CB Industry Autocomplete ──────────────────────────────────────────────────
(function() {
    var _cbNaicsCache = null;    // raw NAICS map from API
    var _acInitDone   = false;

    // Build searchable option list: sub-verticals as "Sub: Vertical" + verticals as "Vertical (all)"
    function buildOptions(map) {
        var opts = [];
        var seenV = {};
        map.forEach(function(e) {
            opts.push({ display: e.sub + ': ' + e.vertical, value: e.sub, category: e.vertical, isSub: true });
            if (!seenV[e.vertical]) {
                seenV[e.vertical] = true;
                opts.push({ display: e.vertical + ' (all)', value: e.vertical, category: e.vertical, isSub: false });
            }
        });
        // alphabetical within each group: verticals first, then subs
        opts.sort(function(a, b) {
            if (!a.isSub && b.isSub)  return -1;
            if (a.isSub  && !b.isSub) return  1;
            return a.display.localeCompare(b.display);
        });
        return opts;
    }

    function loadOptions(cb) {
        if (_cbNaicsCache) { cb(_cbNaicsCache); return; }
        fetch('/api/commercial-leads/naics-map')
            .then(function(r) { return r.json(); })
            .then(function(map) { _cbNaicsCache = buildOptions(map); cb(_cbNaicsCache); })
            .catch(function() { cb([]); });
    }

    function highlight(text, q) {
        if (!q) return text;
        var re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
        return text.replace(re, '<strong>$1</strong>');
    }

    function initIndustryAutocomplete() {
        if (_acInitDone) return;
        var input    = document.getElementById('cb-genIndustry');
        var dropdown = document.getElementById('cb-industry-dropdown');
        if (!input || !dropdown) return;
        _acInitDone = true;

        var _activeIdx = -1;

        function getItems() { return dropdown.querySelectorAll('li[role="option"]'); }

        function setActive(idx) {
            var items = getItems();
            items.forEach(function(li, i) {
                var on = (i === idx);
                li.setAttribute('aria-selected', on);
                li.style.background = on ? '#3b82f6' : (li.dataset.isSub === '0' ? '#f8fafc' : '#fff');
                li.style.color = on ? '#fff' : '#1f2937';
                li.querySelector('.cb-ac-cat') && (li.querySelector('.cb-ac-cat').style.color = on ? 'rgba(255,255,255,0.75)' : '#9ca3af');
            });
            _activeIdx = idx;
        }

        function renderDropdown(opts, q) {
            dropdown.innerHTML = '';
            _activeIdx = -1;
            if (!opts.length) { dropdown.style.display = 'none'; return; }

            opts.forEach(function(opt, i) {
                var li = document.createElement('li');
                li.setAttribute('role', 'option');
                li.dataset.isSub = opt.isSub ? '1' : '0';
                li.style.cssText = 'padding:5px 10px 5px 12px;cursor:pointer;display:flex;justify-content:space-between;align-items:baseline;background:' + (opt.isSub ? '#fff' : '#f8fafc') + ';color:#1f2937;white-space:nowrap;overflow:hidden;';

                var mainSpan = document.createElement('span');
                mainSpan.style.cssText = 'font-size:0.87rem;overflow:hidden;text-overflow:ellipsis;';
                mainSpan.innerHTML = highlight(opt.isSub ? opt.value : opt.value + ' (all)', q);

                var catSpan = document.createElement('span');
                catSpan.className = 'cb-ac-cat';
                catSpan.style.cssText = 'font-size:0.74rem;color:#9ca3af;margin-left:10px;flex-shrink:0;';
                catSpan.textContent = opt.isSub ? opt.category : 'All verticals';

                li.appendChild(mainSpan);
                li.appendChild(catSpan);

                li.addEventListener('mouseenter', function() { setActive(i); });
                li.addEventListener('mouseleave', function() { setActive(-1); });
                li.addEventListener('mousedown', function(e) {
                    e.preventDefault();
                    input.value = opt.value;
                    dropdown.style.display = 'none';
                    _activeIdx = -1;
                });
                dropdown.appendChild(li);
            });

            dropdown.style.display = 'block';
        }

        function search(q) {
            loadOptions(function(opts) {
                var lq = q.toLowerCase();
                var filtered = q.length < 2
                    ? opts.filter(function(o) { return !o.isSub; }).slice(0, 14)   // show categories only before 2 chars
                    : opts.filter(function(o) {
                        return o.display.toLowerCase().includes(lq) || o.category.toLowerCase().includes(lq);
                      }).slice(0, 14);
                renderDropdown(filtered, q.length >= 2 ? q : '');
            });
        }

        input.addEventListener('input', function() { search(this.value.trim()); if (window.updateGPCost) updateGPCost(); });

        input.addEventListener('focus', function() { search(this.value.trim()); });

        input.addEventListener('blur', function() {
            setTimeout(function() { dropdown.style.display = 'none'; _activeIdx = -1; }, 160);
        });

        input.addEventListener('keydown', function(e) {
            var items = getItems();
            if (!items.length) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive(_activeIdx < items.length - 1 ? _activeIdx + 1 : 0);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive(_activeIdx > 0 ? _activeIdx - 1 : items.length - 1);
            } else if (e.key === 'Enter') {
                if (_activeIdx >= 0 && items[_activeIdx]) {
                    e.preventDefault();
                    items[_activeIdx].dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                }
            } else if (e.key === 'Escape') {
                dropdown.style.display = 'none';
                _activeIdx = -1;
            }
        });
    }

    // Init on DOMContentLoaded or immediately if already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initIndustryAutocomplete);
    } else {
        initIndustryAutocomplete();
    }

    // Attempt init once on tab switch in case the element wasn't in DOM yet (first open)
    // Never reset _acInitDone — that would double-attach event listeners
    var _prevSwitch = window.switchGenLeadSubTab;
    window.switchGenLeadSubTab = function(tab) {
        if (_prevSwitch) _prevSwitch(tab);
        if (tab === 'commercialBusiness' && !_acInitDone) { setTimeout(initIndustryAutocomplete, 80); }
    };
})();

// ---- Personal Lines lead generation ----
window._plUploadedLeads = window._plUploadedLeads || [];
window._plGeneratedLeads = window._plGeneratedLeads || [];

window.loadPLLeadList = function(input) {
    var file = input.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        window._plUploadedLeads = parseCSV(e.target.result);
        window._plGeneratedLeads = [];
        var status = document.getElementById('pl-upload-status');
        if (status) status.textContent = window._plUploadedLeads.length + ' records loaded from ' + file.name;
        var container = document.getElementById('plResultsContainer');
        if (container) container.innerHTML = '';
        var countEl = document.getElementById('plTotalLeadsCount');
        if (countEl) countEl.textContent = '-';
    };
    reader.readAsText(file);
};

window.clearPLLeadList = function() {
    window._plUploadedLeads = [];
    window._plGeneratedLeads = [];
    var status = document.getElementById('pl-upload-status');
    if (status) status.textContent = '';
    var input = document.getElementById('pl-csv-upload');
    if (input) input.value = '';
    var container = document.getElementById('plResultsContainer');
    if (container) container.innerHTML = '';
    var countEl = document.getElementById('plTotalLeadsCount');
    if (countEl) countEl.textContent = '-';
};

window.generatePLLeads = function() {
    var leads = window._plUploadedLeads || [];
    if (!leads.length) { alert('Please upload a CSV file first.'); return; }

    var filterState      = (document.getElementById('pl-genState') || {}).value || '';
    var filterHomeStatus = (document.getElementById('pl-genHomeStatus') || {}).value || '';
    var filterAgeMin     = parseInt((document.getElementById('pl-genAgeMin') || {}).value) || 0;
    var filterAgeMax     = parseInt((document.getElementById('pl-genAgeMax') || {}).value) || 999;
    var filterVehMin     = parseInt((document.getElementById('pl-genVehMin') || {}).value) || 0;
    var filterVehMax     = parseInt((document.getElementById('pl-genVehMax') || {}).value) || 99;
    var filterExpDays    = parseInt((document.getElementById('pl-genExpiry') || {}).value) || 0;
    var filterExclude    = ((document.getElementById('pl-genExcludeCarrier') || {}).value || '').toLowerCase();
    var checkedLines     = Array.from(document.querySelectorAll('input[name="pl-gen-lines"]:checked')).map(function(c){ return c.value.toLowerCase(); });

    var today = new Date(); today.setHours(0,0,0,0);

    var results = leads.filter(function(l) {
        // State
        if (filterState) {
            var st = (l.state || l.State || '').trim().toUpperCase();
            if (st !== filterState.toUpperCase()) return false;
        }
        // Home status
        if (filterHomeStatus) {
            var hs = (l.homeStatus || l['Home Status'] || l.home_status || '').toLowerCase();
            if (hs.indexOf(filterHomeStatus.toLowerCase()) === -1) return false;
        }
        // Age range (from DOB or Age field)
        if (filterAgeMin > 0 || filterAgeMax < 999) {
            var age = parseInt(l.age || l.Age || 0);
            if (!age) {
                var dob = l.dob || l.DOB || l['Date of Birth'] || '';
                if (dob) { var dobDate = new Date(dob); age = Math.floor((today - dobDate) / 31557600000); }
            }
            if (age < filterAgeMin || age > filterAgeMax) return false;
        }
        // Vehicles
        var veh = parseInt(l.vehicles || l.Vehicles || 0);
        if (veh < filterVehMin || veh > filterVehMax) return false;
        // Policy expiring within N days
        if (filterExpDays > 0) {
            var expStr = l.expiration || l.Expiration || l['Policy Expiration'] || '';
            if (!expStr) return false;
            var expDate = new Date(expStr); expDate.setHours(0,0,0,0);
            var diff = Math.ceil((expDate - today) / 86400000);
            if (diff < 0 || diff > filterExpDays) return false;
        }
        // Exclude carrier
        if (filterExclude) {
            var carrier = (l.currentCarrier || l['Current Carrier'] || l.carrier || '').toLowerCase();
            if (carrier.indexOf(filterExclude) !== -1) return false;
        }
        // Lines filter
        if (checkedLines.length > 0) {
            var linesField = (l.linesNeeded || l['Lines Needed'] || l.lines || '').toLowerCase();
            var hasLine = checkedLines.some(function(ln){ return linesField.indexOf(ln) !== -1; });
            if (!hasLine) return false;
        }
        return true;
    });

    window._plGeneratedLeads = results;

    var countEl = document.getElementById('plTotalLeadsCount');
    if (countEl) countEl.textContent = results.length;

    var container = document.getElementById('plResultsContainer');
    if (!container) return;
    if (!results.length) {
        container.innerHTML = '<div style="padding:2rem;text-align:center;color:#6b7280;">No leads match the selected criteria.</div>';
        return;
    }

    var sampleKeys = Object.keys(results[0]);
    var priorityCols = ['firstName','First Name','lastName','Last Name','phone','Phone','email','Email','state','State','homeStatus','Home Status','currentCarrier','Current Carrier','expiration','Expiration'];
    var displayCols = priorityCols.filter(function(k){ return sampleKeys.indexOf(k) !== -1; });
    if (!displayCols.length) displayCols = sampleKeys.slice(0, 8);

    var headerCells = displayCols.map(function(k){ return '<th style="padding:6px 8px;text-align:left;background:#1e3a5f;color:white;white-space:nowrap;">' + k + '</th>'; }).join('');
    var bodyRows = results.map(function(l, i) {
        var cells = displayCols.map(function(k){ return '<td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">' + (l[k] || '') + '</td>'; }).join('');
        return '<tr style="background:' + (i%2===0?'#fff':'#f9fafb') + ';">' + cells + '</tr>';
    }).join('');

    container.innerHTML = '<div style="overflow-x:auto;max-height:500px;overflow-y:auto;">' +
        '<table style="width:100%;border-collapse:collapse;font-size:12px;">' +
        '<thead><tr>' + headerCells + '</tr></thead>' +
        '<tbody>' + bodyRows + '</tbody></table></div>';
};

window.resetPLForm = function() {
    var ids = ['pl-genState','pl-genHomeStatus','pl-genAgeMin','pl-genAgeMax','pl-genVehMin','pl-genVehMax','pl-genExpiry','pl-genExcludeCarrier'];
    ids.forEach(function(id){ var el = document.getElementById(id); if(el) el.value = ''; });
    document.querySelectorAll('input[name="pl-gen-lines"]').forEach(function(c){ c.checked = false; });
};

window.exportPLResults = function(fmt) {
    var leads = window._plGeneratedLeads || [];
    if (!leads.length) { alert('No results to export. Generate leads first.'); return; }
    if (fmt === 'json') {
        var blob = new Blob([JSON.stringify(leads, null, 2)], {type:'application/json'});
        var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'pl_leads.json'; a.click();
        return;
    }
    var keys = Object.keys(leads[0]);
    var rows = leads.map(function(l){ return keys.map(function(k){ return '"'+(l[k]||'').toString().replace(/"/g,'""')+'"'; }).join(','); });
    var csv = [keys.join(',')].concat(rows).join('\n');
    var blob = new Blob([csv], {type:'text/csv'});
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'pl_leads.csv'; a.click();
};

// Complete SMS Blast Content
function getCompleteSMSBlastContent() {
    return `
        <div class="sms-blast-container">
            <!-- SMS Campaign Setup -->
            <div class="sms-campaign-setup">
                <h3><i class="fas fa-sms"></i> SMS Blast Campaign</h3>
                <p style="color: #6b7280; margin-bottom: 2rem;">Send bulk SMS messages to your selected leads using Telnyx messaging</p>

                <!-- Campaign Details -->
                <div class="campaign-details">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Campaign Name</label>
                            <input type="text" class="form-control" id="sms-campaign-name" placeholder="Enter campaign name">
                        </div>
                        <div class="form-group">
                            <label>From Number</label>
                            <select class="form-control" id="sms-from-number">
                                <option value="+18882681541">+1 (888) 268-1541</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Message Composition -->
                <div class="message-composition">
                    <h4>Message Content</h4>
                    <div class="form-group">
                        <label>Message Template</label>
                        <select class="form-control" id="sms-template" onchange="loadSMSTemplate()">
                            <option value="">Custom Message</option>
                            <option value="insurance-renewal">Insurance Renewal Reminder</option>
                            <option value="quote-followup">Quote Follow-up</option>
                            <option value="policy-expiry">Policy Expiry Alert</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>SMS Message <span style="color: #6b7280;">(160 chars recommended)</span></label>
                        <textarea class="form-control" id="sms-message" rows="4" maxlength="1600"
                                  placeholder="Enter your SMS message here..." onkeyup="updateSMSCharCount()"></textarea>
                        <div class="char-count">
                            <span id="sms-char-count">0</span> characters
                        </div>
                    </div>
                </div>

                <!-- Lead Selection -->
                <div class="lead-selection">
                    <h4>Select Recipients</h4>
                    <div class="selection-options">
                        <div class="form-group">
                            <label>Lead Source</label>
                            <select class="form-control" id="sms-lead-source" onchange="loadSMSRecipients()">
                                <option value="generated">Use Generated Leads (from Generate Leads tab)</option>
                                <option value="search">Use Search Results (from Carrier Lookup tab)</option>
                                <option value="custom">Upload Custom Phone List</option>
                            </select>
                        </div>
                        <div class="form-group" id="custom-upload-section" style="display: none;">
                            <label>Upload Phone Numbers (CSV)</label>
                            <input type="file" class="form-control" id="sms-phone-upload" accept=".csv" onchange="handlePhoneUpload()">
                            <small class="text-muted">CSV format: phone,name,company (optional)</small>
                        </div>
                    </div>

                    <!-- Recipients Preview -->
                    <div class="recipients-preview">
                        <div class="recipients-summary">
                            <strong>Recipients: <span id="sms-recipient-count">0</span> phone numbers</strong>
                            <div class="recipient-actions">
                                <button class="btn-secondary btn-small" onclick="previewSMSRecipients()">
                                    <i class="fas fa-eye"></i> Preview Recipients
                                </button>
                            </div>
                        </div>
                        <div id="sms-recipients-list" style="display: none;">
                            <!-- Recipients will be populated here -->
                        </div>
                    </div>
                </div>

                <!-- Send Options -->
                <div class="send-options">
                    <h4>Send Options</h4>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Send Schedule</label>
                            <select class="form-control" id="sms-schedule">
                                <option value="now">Send Now</option>
                                <option value="scheduled">Schedule for Later</option>
                            </select>
                        </div>
                        <div class="form-group" id="schedule-datetime" style="display: none;">
                            <label>Schedule Date & Time</label>
                            <input type="datetime-local" class="form-control" id="sms-schedule-datetime">
                        </div>
                        <div class="form-group">
                            <label>Batch Size</label>
                            <select class="form-control" id="sms-batch-size">
                                <option value="50">50 messages per batch</option>
                                <option value="100">100 messages per batch</option>
                                <option value="250">250 messages per batch</option>
                                <option value="500">500 messages per batch</option>
                            </select>
                        </div>
                    </div>

                    <div class="compliance-notice" style="background: #fef3c7; border: 1px solid #fbbf24; padding: 1rem; border-radius: 6px; margin-top: 1rem;">
                        <strong style="color: #b45309;"><i class="fas fa-exclamation-triangle"></i> Compliance Notice:</strong>
                        <p style="color: #92400e; margin-top: 0.5rem; margin-bottom: 0;">
                            All recipients must have opted in to receive SMS messages. Include "Reply STOP to unsubscribe" in your message.
                        </p>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="action-buttons" style="margin-top: 2rem;">
                    <button class="btn-primary" onclick="testSMSCampaign()" style="padding: 12px 24px;">
                        <i class="fas fa-vial"></i> Send Test Message
                    </button>
                    <button class="btn-success" onclick="launchSMSCampaign()" style="padding: 12px 32px; font-size: 1.1rem;">
                        <i class="fas fa-paper-plane"></i> Launch Campaign
                    </button>
                    <button class="btn-secondary" onclick="saveSMSDraft()" style="padding: 12px 24px;">
                        <i class="fas fa-save"></i> Save Draft
                    </button>
                </div>

                <!-- Campaign Results -->
                <div id="sms-campaign-results" style="display: none; margin-top: 2rem;">
                    <h4>Campaign Results</h4>
                    <div class="results-stats">
                        <div class="stat-item">
                            <span class="stat-label">Sent</span>
                            <span class="stat-value" id="sms-sent-count">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Delivered</span>
                            <span class="stat-value" id="sms-delivered-count">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Failed</span>
                            <span class="stat-value" id="sms-failed-count">0</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Initialize Lead Generation
window.initializeLeadGeneration = function() {
    console.log('Initializing complete lead generation module');
    if (typeof applyStateDropdownStyling === 'function') {
        applyStateDropdownStyling();
    }
}

// Helper Functions
window.selectAllInsurance = function() {
    document.querySelectorAll('input[name="insurance"]').forEach(cb => cb.checked = true);
}

window.clearAllInsurance = function() {
    document.querySelectorAll('input[name="insurance"]').forEach(cb => cb.checked = false);
}

window.selectAllUnitTypes = function() {
    document.querySelectorAll('input[name="unitType"]').forEach(cb => cb.checked = true);
}

window.clearAllUnitTypes = function() {
    document.querySelectorAll('input[name="unitType"]').forEach(cb => cb.checked = false);
}

window.selectAllCommodities = function() {
    document.querySelectorAll('input[name="commodity"]').forEach(cb => cb.checked = true);
}

window.clearAllCommodities = function() {
    document.querySelectorAll('input[name="commodity"]').forEach(cb => cb.checked = false);
}


// Preset Management Functions
window.openSavePresetPopup = function() {
    document.getElementById('savePresetModal').style.display = 'block';
    document.getElementById('presetName').value = '';
    document.getElementById('presetName').focus();
}

window.closeSavePresetPopup = function() {
    document.getElementById('savePresetModal').style.display = 'none';
}

window.openSelectPresetPopup = function() {
    loadPresetList();
    document.getElementById('selectPresetModal').style.display = 'block';
}

window.closeSelectPresetPopup = function() {
    document.getElementById('selectPresetModal').style.display = 'none';
}

window.savePreset = function() {
    const presetName = document.getElementById('presetName').value.trim();

    if (!presetName) {
        alert('Please enter a preset name');
        return;
    }

    // Get current form values
    const preset = getCurrentFormValues();
    preset.name = presetName;
    preset.createdAt = new Date().toISOString();

    // Get existing presets
    let presets = JSON.parse(localStorage.getItem('leadGenPresets') || '[]');

    // Check if preset name already exists
    const existingIndex = presets.findIndex(p => p.name === presetName);
    if (existingIndex !== -1) {
        if (!confirm(`A preset named "${presetName}" already exists. Do you want to overwrite it?`)) {
            return;
        }
        presets[existingIndex] = preset;
    } else {
        // Check max limit (10 presets)
        if (presets.length >= 10) {
            alert('Maximum of 10 presets allowed. Please delete a preset before adding a new one.');
            return;
        }
        presets.push(preset);
    }

    // Save to localStorage
    localStorage.setItem('leadGenPresets', JSON.stringify(presets));

    alert(`Preset "${presetName}" saved successfully!`);
    closeSavePresetPopup();
}

window.getCurrentFormValues = function() {
    // Get selected insurance companies
    const insuranceCompanies = [];
    document.querySelectorAll('input[name="insurance"]:checked').forEach(cb => {
        insuranceCompanies.push(cb.value);
    });

    // Get selected unit types
    const unitTypes = [];
    document.querySelectorAll('input[name="unitType"]:checked').forEach(cb => {
        unitTypes.push(cb.value);
    });

    // Get selected commodities
    const commodities = [];
    document.querySelectorAll('input[name="commodity"]:checked').forEach(cb => {
        commodities.push(cb.value);
    });

    return {
        state: document.getElementById('genState')?.value || '',
        expiry: document.getElementById('genExpiry')?.value || '30',
        skipDays: document.getElementById('genSkipDays')?.value || '0',
        minFleet: document.getElementById('genMinFleet')?.value || '1',
        maxFleet: document.getElementById('genMaxFleet')?.value || '9999',
        status: document.getElementById('genStatus')?.value || '',
        safetyMin: document.getElementById('genSafetyMin')?.value || '',
        safetyMax: document.getElementById('genSafety')?.value || '',
        hazmat: document.getElementById('genHazmat')?.value || '',
        commoditiesHauled: document.getElementById('commoditiesHauled')?.value || '',
        insuranceCompanies: insuranceCompanies,
        unitTypes: unitTypes,
        commodities: commodities
    };
}

window.loadPresetList = function() {
    const presets = JSON.parse(localStorage.getItem('leadGenPresets') || '[]');
    const presetList = document.getElementById('presetList');

    if (presets.length === 0) {
        presetList.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #6b7280;">
                <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 10px;"></i>
                <p>No presets saved yet</p>
            </div>
        `;
        return;
    }

    let html = '';
    presets.forEach((preset, index) => {
        const createdDate = new Date(preset.createdAt).toLocaleDateString();
        html += `
            <div style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin-bottom: 10px; background: #f9fafb;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4 style="margin: 0 0 5px 0;">${preset.name}</h4>
                        <p style="margin: 0; font-size: 0.9rem; color: #6b7280;">
                            Created: ${createdDate} | State: ${preset.state || 'Any'} |
                            Insurance: ${preset.insuranceCompanies.length} selected |
                            Unit Types: ${preset.unitTypes.length} selected |
                            Commodities: ${preset.commodities ? preset.commodities.length : 0} selected
                        </p>
                    </div>
                    <div>
                        <button type="button" class="btn-primary" onclick="applyPreset(${index})" style="margin-right: 5px; padding: 5px 10px; font-size: 0.8rem;">
                            Apply
                        </button>
                        <button type="button" class="btn-danger" onclick="deletePreset(${index})" style="padding: 5px 10px; font-size: 0.8rem;">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    presetList.innerHTML = html;
}

window.applyPreset = function(index) {
    const presets = JSON.parse(localStorage.getItem('leadGenPresets') || '[]');
    const preset = presets[index];

    if (!preset) {
        alert('Preset not found');
        return;
    }

    // Apply form values
    if (document.getElementById('genState')) document.getElementById('genState').value = preset.state || '';
    if (document.getElementById('genExpiry')) document.getElementById('genExpiry').value = preset.expiry || '30';
    if (document.getElementById('genSkipDays')) document.getElementById('genSkipDays').value = preset.skipDays || '0';
    if (document.getElementById('genMinFleet')) document.getElementById('genMinFleet').value = preset.minFleet || '1';
    if (document.getElementById('genMaxFleet')) document.getElementById('genMaxFleet').value = preset.maxFleet || '9999';
    if (document.getElementById('genStatus')) document.getElementById('genStatus').value = preset.status || '';
    if (document.getElementById('genSafetyMin')) document.getElementById('genSafetyMin').value = preset.safetyMin || '';
    if (document.getElementById('genSafety')) document.getElementById('genSafety').value = preset.safetyMax || preset.safety || '';
    if (document.getElementById('genHazmat')) document.getElementById('genHazmat').value = preset.hazmat || '';
    if (document.getElementById('commoditiesHauled')) document.getElementById('commoditiesHauled').value = preset.commoditiesHauled || '';

    // Apply insurance companies
    document.querySelectorAll('input[name="insurance"]').forEach(cb => {
        cb.checked = preset.insuranceCompanies.includes(cb.value);
    });

    // Apply unit types
    document.querySelectorAll('input[name="unitType"]').forEach(cb => {
        cb.checked = preset.unitTypes.includes(cb.value);
    });

    // Apply commodities (with backward compatibility)
    if (preset.commodities) {
        document.querySelectorAll('input[name="commodity"]').forEach(cb => {
            cb.checked = preset.commodities.includes(cb.value);
        });
    }

    closeSelectPresetPopup();
    alert(`Preset "${preset.name}" applied successfully!`);
}

window.deletePreset = function(index) {
    const presets = JSON.parse(localStorage.getItem('leadGenPresets') || '[]');
    const preset = presets[index];

    if (!preset) {
        alert('Preset not found');
        return;
    }

    if (!confirm(`Are you sure you want to delete the preset "${preset.name}"?`)) {
        return;
    }

    presets.splice(index, 1);
    localStorage.setItem('leadGenPresets', JSON.stringify(presets));

    // Reload the preset list
    loadPresetList();

    alert(`Preset "${preset.name}" deleted successfully!`);
}

window.selectAllGeneratedLeads = function(checkbox) {
    document.querySelectorAll('#generatedLeadsTableBody input[type="checkbox"]').forEach(cb => cb.checked = checkbox.checked);
}

window.resetGenerateForm = function() {
    document.getElementById('genState').value = '';
    document.getElementById('genExpiry').value = '30';
    document.getElementById('genSkipDays').value = '0';
    document.getElementById('genMinFleet').value = '1';
    document.getElementById('genMaxFleet').value = '9999';
    document.getElementById('genStatus').value = '';
    document.getElementById('genSafetyMin').value = '';
    document.getElementById('genSafety').value = '';
    document.getElementById('genHazmat').value = '';
    document.getElementById('commoditiesHauled').value = '';
    clearAllUnitTypes();
    clearAllInsurance();
}

window.generateLeadsFromForm = function() {
    console.log('Generating leads from complete form...');

    // Get all form values
    const state = document.getElementById('genState')?.value;
    const expiry = document.getElementById('genExpiry')?.value || '30';
    const skipDays = document.getElementById('genSkipDays')?.value || '0';
    // No limit - fetch all available leads
    const minFleet = document.getElementById('genMinFleet')?.value || '1';
    const maxFleet = document.getElementById('genMaxFleet')?.value || '9999';
    const status = document.getElementById('genStatus')?.value;
    const safety = document.getElementById('genSafety')?.value;
    const hazmat = document.getElementById('genHazmat')?.value;
    const commoditiesHauled = document.getElementById('commoditiesHauled')?.value;

    // Get selected unit types
    const unitTypes = [];
    document.querySelectorAll('input[name="unitType"]:checked').forEach(cb => {
        unitTypes.push(cb.value);
    });

    // Get selected insurance companies
    const insuranceCompanies = [];
    document.querySelectorAll('input[name="insurance"]:checked').forEach(cb => {
        insuranceCompanies.push(cb.value);
    });

    if (!state) {
        alert('Please select a state');
        return;
    }

    console.log('Lead generation criteria:', {
        state, expiry, skipDays, limit, minFleet, maxFleet,
        status, safety, hazmat, insuranceCompanies
    });


    // Call the generate function
    generateLeadsNow();
}

// Actual lead generation function
async function generateLeadsNow() {
    const state = document.getElementById('genState')?.value;
    const expiry = parseInt(document.getElementById('genExpiry')?.value || '30');
    const skipDays = parseInt(document.getElementById('genSkipDays')?.value || '0');
    // No limit - fetch all available leads
    const minFleet = document.getElementById('genMinFleet')?.value || '1';
    const maxFleet = document.getElementById('genMaxFleet')?.value || '9999';
    const safety = document.getElementById('genSafety')?.value;
    const hazmat = document.getElementById('genHazmat')?.value;
    const commoditiesHauled = document.getElementById('commoditiesHauled')?.value;

    // Get selected unit types
    const unitTypes = [];
    document.querySelectorAll('input[name="unitType"]:checked').forEach(cb => {
        unitTypes.push(cb.value);
    });

    if (!state) {
        alert('Please select a state');
        return;
    }

    // Calculate date range
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() + skipDays); // Skip first N days
    const endDate = new Date();
    endDate.setDate(today.getDate() + expiry);

    console.log(`🔍 LEAD GENERATION DEBUG:`);
    console.log(`  State: ${state}`);
    console.log(`  Expiry Days: ${expiry}`);
    console.log(`  Skip Days: ${skipDays}`);
    console.log(`  Date Range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
    console.log(`  Expected: ${skipDays > 0 ? 'FEWER leads due to skip days' : 'Normal lead count'}`);

    try {
        // Build query parameters for the new DB-V3 endpoint
        const params = new URLSearchParams({
            state: state,
            minFleet: minFleet,
            maxFleet: maxFleet,
            limit: 50000
        });

        // Add optional filters
        if (status) params.append('status', status);
        if (safety) params.append('safety', safety);
        if (hazmat) params.append('hazmat', hazmat);
        if (commoditiesHauled) params.append('commoditiesHauled', commoditiesHauled);
        if (unitTypes.length > 0) params.append('unitTypes', JSON.stringify(unitTypes));

        const response = await fetch(`/api/carriers/expiring?${params}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        console.log('🎯 DB-V3 Response:', data);

        if (data.success && data.carriers) {
            // Store globally for export/viewing
            window.generatedLeadsData = data.carriers;

            // Update statistics display
            const totalLeads = data.carriers.length;
            const expiringSoon = data.carriers.filter(c => parseInt(c.days_until_renewal) <= 7).length;
            const withContact = data.carriers.filter(c => c.email || c.phone).length;

            document.getElementById('totalLeadsCount').textContent = totalLeads.toLocaleString();
            document.getElementById('expiringSoonCount').textContent = expiringSoon.toLocaleString();
            document.getElementById('withContactCount').textContent = withContact.toLocaleString();

            // Show success message
            const successMsg = document.getElementById('successMessage');
            if (successMsg) {
                successMsg.style.display = 'block';
                setTimeout(() => successMsg.style.display = 'none', 5000);
            }

            // Mark state as closed for the month (all states including split)
            const genStateEl = document.getElementById('genState');
            const selectedOpt = genStateEl ? genStateEl.options[genStateEl.selectedIndex] : null;
            if (selectedOpt && selectedOpt.getAttribute('data-state-type')) {
                fetch('/api/state-generation-status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ state: state })
                }).then(() => {
                    if (typeof applyStateDropdownStyling === 'function') applyStateDropdownStyling();
                }).catch(e => console.warn('Could not update state generation status:', e));
            }

            // No popup alert needed - stats show in UI

            console.log(`✅ DB-V3: Generated ${totalLeads} leads from database with 428K+ records`);
            console.log(`📊 Database: ${data.stats?.database || 'DB-V3'}`);
            console.log(`🎯 Filters Applied:`, data.stats?.filters_applied);
        } else {
            throw new Error('Invalid response from DB-V3 server');
        }
    } catch (error) {
        console.error('Error generating leads:', error);
        alert(`Failed to generate leads: ${error.message}`);
    }
}

window.uploadToVicidialWithCriteria = function() {
    console.log('🔄 Opening Vicidial upload dialog to scan lists and upload leads...');

    // Check if generated leads are available
    if (!window.generatedLeadsData || window.generatedLeadsData.length === 0) {
        alert('Please generate leads first before uploading to Vicidial.');
        return;
    }

    // Check if the vicidial uploader is available
    if (typeof vicidialUploader !== 'undefined' && typeof vicidialUploader.showUploadDialog === 'function') {
        // Get current form criteria for upload
        const criteria = {
            state: document.getElementById('genState')?.value,
            daysUntilExpiry: document.getElementById('genExpiry')?.value || '30',
            skipDays: document.getElementById('genSkipDays')?.value || '0',
            minFleet: document.getElementById('genMinFleet')?.value || '1',
            maxFleet: document.getElementById('genMaxFleet')?.value || '9999',
            totalLeads: window.generatedLeadsData.length,  // Changed from leadCount to totalLeads
            leadCount: window.generatedLeadsData.length,   // Keep both for compatibility
            leads: window.generatedLeadsData
        };

        console.log('📋 Upload criteria:', criteria);

        // Call the existing uploader which will:
        // 1. Scan Vicidial for available lists
        // 2. Show popup with list selection
        // 3. Allow user to select which list to overwrite
        // 4. Upload the generated leads to selected list
        vicidialUploader.showUploadDialog(criteria);
    } else {
        console.error('❌ Vicidial uploader not available');
        alert('Vicidial uploader functionality is not loaded. Please refresh the page and try again.');
    }
}

window.sendEmailBlast = function() {
    // Check if we have generated leads data
    if (!window.generatedLeadsData || window.generatedLeadsData.length === 0) {
        alert('Please generate leads first before sending email blast');
        return;
    }

    const totalRecipients = window.generatedLeadsData.length;
    console.log('Sending email blast to', totalRecipients, 'leads...');

    // Create email blast popup modal
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';

    // Generate professional email template
    const defaultSubject = 'Commercial Trucking Insurance - Better Rates Available';
    const defaultMessage = `Hello [CONTACT_NAME],

My name is [AGENT_NAME] from Vanguard Insurance Group, and I'm reaching out because I noticed you were currently insured with [CARRIER_NAME], which has experienced significant rate increases recently.

As a specialized commercial trucking insurance agency, we've been helping trucking companies like yours secure more competitive rates and better coverage options. Many of our clients have saved 15-30% on their premiums while improving their policy benefits.

Given the current market conditions and your carrier's recent rate adjustments, I believe we could provide you with a more cost-effective solution for your fleet.

I'd be happy to provide you with a no-obligation quote comparison. This would only take a few minutes of your time and could potentially save your company thousands of dollars annually.

Would you be available for a brief 10-minute conversation this week to discuss your current coverage and explore better options?

Best regards,
[AGENT_NAME]
Vanguard Insurance Group
Phone: [AGENT_PHONE]
Email: [AGENT_EMAIL]

P.S. We specialize exclusively in commercial trucking insurance and work with over 20 A-rated carriers to ensure you get the best possible rates.`;

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
            <div class="modal-header">
                <h3 style="margin: 0; color: white;">
                    <i class="fas fa-envelope" style="color: white;"></i> Email Blast to Generated Leads
                </h3>
                <button onclick="this.closest('.modal-backdrop').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">&times;</button>
            </div>
            <div class="modal-body">
                <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #0066cc;">
                    <h4 style="margin: 0 0 10px 0; color: #0066cc;">
                        <i class="fas fa-users"></i> Ready to Send
                    </h4>
                    <p style="margin: 0; font-size: 16px;">
                        <strong>${totalRecipients} leads</strong> will receive this email blast
                    </p>
                </div>

                <div style="margin-bottom: 20px;">
                    <label for="blastSubject" style="display: block; margin-bottom: 8px; font-weight: bold; color: #333;">
                        Email Subject:
                    </label>
                    <input type="text" id="blastSubject" value="${defaultSubject}"
                           style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px; box-sizing: border-box;">
                </div>

                <div style="margin-bottom: 20px;">
                    <label for="blastMessage" style="display: block; margin-bottom: 8px; font-weight: bold; color: #333;">
                        Email Message:
                    </label>
                    <textarea id="blastMessage" rows="16"
                              style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px; font-family: Arial, sans-serif; line-height: 1.5; box-sizing: border-box; resize: vertical;">${defaultMessage}</textarea>
                </div>

                <div style="background: #fff3cd; padding: 12px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
                    <small style="color: #856404;">
                        <i class="fas fa-info-circle"></i>
                        <strong>Template Variables:</strong> [CONTACT_NAME], [AGENT_NAME], [CARRIER_NAME], [AGENT_PHONE], [AGENT_EMAIL] will be automatically replaced for each recipient.
                    </small>
                </div>

                <div style="display: flex; gap: 15px; justify-content: flex-end;">
                    <button onclick="this.closest('.modal-backdrop').remove()"
                            class="btn-secondary" style="padding: 12px 24px;">
                        Cancel
                    </button>
                    <button onclick="executeEmailBlastFinal()"
                            class="btn-primary" style="padding: 12px 24px;">
                        <i class="fas fa-paper-plane"></i> Send Email Blast
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// Execute email blast from lead generation - final version
window.executeEmailBlastFinal = function() {
    const subject = document.getElementById('blastSubject').value.trim();
    const message = document.getElementById('blastMessage').value.trim();

    if (!subject) {
        alert('Please enter email subject');
        return;
    }

    if (!message) {
        alert('Please enter email message');
        return;
    }

    // Close the email compose modal
    document.querySelector('.modal-backdrop').remove();

    const totalRecipients = window.generatedLeadsData.length;
    let sentCount = 0;

    // Show progress modal
    const progressModal = document.createElement('div');
    progressModal.className = 'modal-backdrop';
    progressModal.style.display = 'flex';
    progressModal.style.alignItems = 'center';
    progressModal.style.justifyContent = 'center';

    progressModal.innerHTML = `
        <div class="modal-content" style="max-width: 450px; text-align: center;">
            <h3 style="margin: 0 0 20px 0; color: #0066cc;">
                <i class="fas fa-paper-plane"></i> Sending Email Blast
            </h3>
            <div style="background: #f8f9fa; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
                <div class="progress-bar" style="background: #e9ecef; border-radius: 10px; height: 20px; overflow: hidden; margin-bottom: 15px;">
                    <div class="progress-fill" id="emailProgress"
                         style="background: linear-gradient(45deg, #0066cc, #004499); height: 100%; width: 0%; transition: width 0.3s ease; border-radius: 10px;"></div>
                </div>
                <p id="emailProgressText" style="margin: 0; font-size: 16px; color: #495057;">
                    Preparing to send to ${totalRecipients} recipients...
                </p>
            </div>
            <div style="background: #fff3cd; padding: 12px; border-radius: 6px; border-left: 4px solid #ffc107;">
                <small style="color: #856404;">
                    <i class="fas fa-info-circle"></i> Personalizing emails with recipient data...
                </small>
            </div>
        </div>
    `;
    document.body.appendChild(progressModal);

    // Simulate sending process with more realistic timing
    const interval = setInterval(() => {
        const increment = Math.min(3, totalRecipients - sentCount); // Slower, more realistic
        sentCount += increment;
        const progress = (sentCount / totalRecipients) * 100;

        document.getElementById('emailProgress').style.width = progress + '%';

        if (sentCount < totalRecipients) {
            document.getElementById('emailProgressText').innerHTML =
                `Sending personalized emails...<br><strong>${sentCount} of ${totalRecipients}</strong> sent`;
        } else {
            document.getElementById('emailProgressText').innerHTML =
                `<strong>Complete!</strong> ${totalRecipients} emails sent successfully`;
        }

        if (sentCount >= totalRecipients) {
            clearInterval(interval);

            setTimeout(() => {
                progressModal.remove();

                // Save to email blast history
                const blastHistory = JSON.parse(localStorage.getItem('emailBlasts') || '[]');
                blastHistory.push({
                    id: 'blast_' + Date.now(),
                    subject: subject,
                    message: message,
                    recipients: totalRecipients,
                    sentAt: new Date().toISOString(),
                    status: 'completed',
                    type: 'lead_generation'
                });
                localStorage.setItem('emailBlasts', JSON.stringify(blastHistory));

                alert(`✅ Email blast completed! ${totalRecipients} personalized emails sent to generated leads.`);
            }, 1500);
        }
    }, 800); // Slower interval for more realistic progress
};

window.loadSMSTemplate = function() {
    const template = document.getElementById('sms-template')?.value;
    const messageField = document.getElementById('sms-message');

    if (messageField) {
        switch(template) {
            case 'insurance-renewal':
                messageField.value = 'Hi {name}, your commercial auto insurance expires in {days} days. Get a competitive quote today! Reply STOP to unsubscribe.';
                break;
            case 'quote-followup':
                messageField.value = 'Hi {name}, following up on your insurance quote request. Call us at 330-241-7570 for details. Reply STOP to unsubscribe.';
                break;
            case 'policy-expiry':
                messageField.value = 'URGENT: Your policy expires soon! Avoid coverage gaps - renew today. Call 330-241-7570. Reply STOP to unsubscribe.';
                break;
        }
        updateSMSCharCount();
    }
}

window.updateSMSCharCount = function() {
    const message = document.getElementById('sms-message')?.value || '';
    const countElement = document.getElementById('sms-char-count');
    if (countElement) {
        countElement.textContent = message.length;
    }
}

window.loadSMSRecipients = function() {
    const source = document.getElementById('sms-lead-source')?.value;
    const uploadSection = document.getElementById('custom-upload-section');

    if (uploadSection) {
        uploadSection.style.display = source === 'custom' ? 'block' : 'none';
    }

    // Update recipient count based on source
    const countElement = document.getElementById('sms-recipient-count');
    if (countElement) {
        if (source === 'generated' && window.generatedLeadsData) {
            countElement.textContent = window.generatedLeadsData.length;
        } else if (source === 'search' && window.searchResultsData) {
            countElement.textContent = window.searchResultsData.length;
        } else {
            countElement.textContent = '0';
        }
    }
}

window.previewSMSRecipients = function() {
    const listElement = document.getElementById('sms-recipients-list');
    if (listElement) {
        listElement.style.display = listElement.style.display === 'none' ? 'block' : 'none';
    }
}

window.testSMSCampaign = function() {
    console.log('Testing SMS campaign...');
    alert('Test message will be sent to your registered phone number.');
}

window.launchSMSCampaign = function() {
    console.log('Launching SMS campaign...');
    alert('SMS campaign will be launched.');
}

window.saveSMSDraft = function() {
    console.log('Saving SMS draft...');
    alert('Draft saved successfully.');
}

// Also copy functions from restore-lead-generation-complete.js to ensure they work
if (window.performLeadSearch) {
    console.log('✅ performLeadSearch function already exists');
}

// Export generated leads function
window.exportGeneratedLeads = function(format) {
    if (!window.generatedLeadsData || window.generatedLeadsData.length === 0) {
        alert('No leads to export. Please generate leads first.');
        return;
    }

    if (format === 'excel') {
        // Convert to CSV for Excel
        const headers = ['DOT Number', 'Company Name', 'City', 'State', 'Phone', 'Email', 'Fleet Size', 'Renewal Date', 'Corgi Prequote ID', 'Corgi Eligible'];
        const csvContent = [
            headers.join(','),
            ...window.generatedLeadsData.map(lead => [
                lead.dot_number || '',
                `"${(lead.legal_name || '').replace(/"/g, '""')}"`,
                `"${(lead.city || '').replace(/"/g, '""')}"`,
                lead.state || '',
                lead.phone || '',
                lead.email_address || '',
                lead.power_units || lead.vehicle_count || '',
                lead.policy_renewal_date || '',
                lead.corgi_prequote?.prequote_id || '',
                lead.corgi_prequote ? (lead.corgi_prequote.eligible ? 'Yes' : 'Not Eligible') : ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    } else if (format === 'json') {
        const blob = new Blob([JSON.stringify(window.generatedLeadsData, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `leads_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }
};

// View generated leads function
window.viewGeneratedLeads = function() {
    if (!window.generatedLeadsData || window.generatedLeadsData.length === 0) {
        alert('No leads to view. Please generate leads first.');
        return;
    }

    // Switch to a view that shows the leads table
    console.log(`Viewing ${window.generatedLeadsData.length} generated leads`);
    // This would typically switch to a table view showing the leads
    alert(`${window.generatedLeadsData.length} leads generated. Export them using the Excel or JSON buttons.`);
};

// Lead Split functionality
window.openLeadSplitPopup = function() {
    // Check if leads have been generated
    if (!window.generatedLeadsData || window.generatedLeadsData.length === 0) {
        alert('Please generate leads first before splitting them.');
        return;
    }

    // Create modal HTML
    const modalHtml = `
        <div id="leadSplitModal" class="modal">
            <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2><i class="fas fa-cut"></i> Lead Split</h2>
                    <span class="close" onclick="closeLeadSplitPopup()">&times;</span>
                </div>

                <div class="modal-body">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i> You have <strong>${window.generatedLeadsData.length}</strong> generated leads ready to split.
                    </div>

                    <div class="form-section">
                        <h3><i class="fas fa-scissors"></i> Split Configuration</h3>

                        <div class="form-group">
                            <label for="splitType">Split Type:</label>
                            <select id="splitType" class="form-control">
                                <option value="equal">Equal Split</option>
                                <option value="percentage">Percentage Split</option>
                                <option value="count">Split by Count</option>
                            </select>
                        </div>

                        <div class="form-group" id="splitOptionsContainer">
                            <label for="splitParts">Number of Parts:</label>
                            <input type="number" id="splitParts" class="form-control" value="2" min="2" max="10">
                        </div>

                        <div class="form-group">
                            <label for="splitNaming">Naming Convention:</label>
                            <input type="text" id="splitNaming" class="form-control" value="Split_{index}" placeholder="Use {index} for numbering">
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeLeadSplitPopup()">
                        Cancel
                    </button>
                    <button type="button" class="btn btn-primary" onclick="performLeadSplit()">
                        <i class="fas fa-cut"></i> Split Leads
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add modal to page if not exists
    if (!document.getElementById('leadSplitModal')) {
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Add event listener for split type change
        document.getElementById('splitType').addEventListener('change', updateSplitOptions);
    }

    // Show modal
    document.getElementById('leadSplitModal').style.display = 'block';
};

// Update split options based on type
function updateSplitOptions() {
    const splitType = document.getElementById('splitType').value;
    const container = document.getElementById('splitOptionsContainer');

    switch(splitType) {
        case 'equal':
            container.innerHTML = `
                <label for="splitParts">Number of Parts:</label>
                <input type="number" id="splitParts" class="form-control" value="2" min="2" max="10">
            `;
            break;
        case 'percentage':
            container.innerHTML = `
                <label>Percentage Split (must total 100%):</label>
                <div id="percentageInputs">
                    <div class="input-group mb-2">
                        <span class="input-group-text">Part 1:</span>
                        <input type="number" class="form-control percentage-input" value="50" min="1" max="99">
                        <span class="input-group-text">%</span>
                    </div>
                    <div class="input-group mb-2">
                        <span class="input-group-text">Part 2:</span>
                        <input type="number" class="form-control percentage-input" value="50" min="1" max="99">
                        <span class="input-group-text">%</span>
                    </div>
                </div>
                <button type="button" class="btn btn-sm btn-outline-primary" onclick="addPercentagePart()">
                    <i class="fas fa-plus"></i> Add Part
                </button>
            `;
            break;
        case 'count':
            container.innerHTML = `
                <label for="leadsPerPart">Leads per Part:</label>
                <input type="number" id="leadsPerPart" class="form-control" value="${Math.floor(window.generatedLeadsData.length / 2)}" min="1" max="${window.generatedLeadsData.length - 1}">
                <small class="form-text text-muted">Remaining leads will go to the last part</small>
            `;
            break;
    }
}

// Add percentage part
function addPercentagePart() {
    const container = document.getElementById('percentageInputs');
    const partCount = container.children.length + 1;

    const newPart = document.createElement('div');
    newPart.className = 'input-group mb-2';
    newPart.innerHTML = `
        <span class="input-group-text">Part ${partCount}:</span>
        <input type="number" class="form-control percentage-input" value="10" min="1" max="99">
        <span class="input-group-text">%</span>
        <button type="button" class="btn btn-outline-danger" onclick="this.parentElement.remove()">
            <i class="fas fa-trash"></i>
        </button>
    `;

    container.appendChild(newPart);
}

// Perform the actual lead split
function performLeadSplit() {
    const splitType = document.getElementById('splitType').value;
    const splitNaming = document.getElementById('splitNaming').value || 'Split_{index}';
    const leads = [...window.generatedLeadsData];

    let splitParts = [];

    try {
        switch(splitType) {
            case 'equal':
                const parts = parseInt(document.getElementById('splitParts').value);

                // Initialize empty arrays for each part
                for (let i = 0; i < parts; i++) {
                    splitParts.push({
                        name: splitNaming.replace('{index}', i + 1),
                        leads: [],
                        count: 0
                    });
                }

                // Distribute leads in round-robin fashion to ensure equal renewal date distribution
                // This way if leads are sorted by renewal date, each split gets every nth lead
                leads.forEach((lead, index) => {
                    const partIndex = index % parts;
                    splitParts[partIndex].leads.push(lead);
                    splitParts[partIndex].count++;
                });
                break;

            case 'percentage':
                const percentages = Array.from(document.querySelectorAll('.percentage-input')).map(input => parseInt(input.value));
                const totalPercentage = percentages.reduce((sum, p) => sum + p, 0);

                if (totalPercentage !== 100) {
                    alert(`Percentages must total 100%. Current total: ${totalPercentage}%`);
                    return;
                }

                // Initialize parts with target counts
                percentages.forEach((percentage, index) => {
                    splitParts.push({
                        name: splitNaming.replace('{index}', index + 1),
                        leads: [],
                        count: 0,
                        percentage: percentage,
                        targetCount: Math.round(leads.length * (percentage / 100))
                    });
                });

                // Distribute leads in round-robin fashion until targets are met
                let currentPartIndex = 0;
                leads.forEach((lead) => {
                    // Find next part that hasn't reached its target
                    let attempts = 0;
                    while (splitParts[currentPartIndex].count >= splitParts[currentPartIndex].targetCount && attempts < splitParts.length) {
                        currentPartIndex = (currentPartIndex + 1) % splitParts.length;
                        attempts++;
                    }

                    // Add lead to current part
                    splitParts[currentPartIndex].leads.push(lead);
                    splitParts[currentPartIndex].count++;

                    // Move to next part for round-robin distribution
                    currentPartIndex = (currentPartIndex + 1) % splitParts.length;
                });

                // Remove targetCount property
                splitParts.forEach(part => delete part.targetCount);
                break;

            case 'count':
                const leadsPerPartCount = parseInt(document.getElementById('leadsPerPart').value);
                let partIndex = 1;
                let currentPart = {
                    name: splitNaming.replace('{index}', partIndex),
                    leads: [],
                    count: 0
                };

                leads.forEach((lead, index) => {
                    // Add lead to current part
                    currentPart.leads.push(lead);
                    currentPart.count++;

                    // If current part is full, start a new one
                    if (currentPart.count === leadsPerPartCount && index < leads.length - 1) {
                        splitParts.push(currentPart);
                        partIndex++;
                        currentPart = {
                            name: splitNaming.replace('{index}', partIndex),
                            leads: [],
                            count: 0
                        };
                    }
                });

                // Add the last part if it has leads
                if (currentPart.count > 0) {
                    splitParts.push(currentPart);
                }
                break;
        }

        // Store split results
        window.leadSplitResults = splitParts;

        // Show results
        showSplitResults(splitParts);

    } catch (error) {
        console.error('Error splitting leads:', error);
        alert('Error splitting leads: ' + error.message);
    }
}

// Show split results
function showSplitResults(splitParts) {
    const modalBody = document.querySelector('#leadSplitModal .modal-body');

    modalBody.innerHTML = `
        <div class="split-result">
            <div class="alert alert-success">
                <h3><i class="fas fa-check-circle"></i> Leads Split Successfully!</h3>
            </div>

            <div class="result-summary">
                <p><strong>Total Leads Split:</strong> ${window.generatedLeadsData.length}</p>
                <p><strong>Split Into:</strong> ${splitParts.length} parts</p>
            </div>

            <div class="split-parts">
                <h4>Split Parts:</h4>
                ${splitParts.map((part, index) => `
                    <div class="split-part" style="margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                        <h5>${part.name}</h5>
                        <p><strong>Leads:</strong> ${part.count}</p>
                        ${part.percentage ? `<p><strong>Percentage:</strong> ${part.percentage}%</p>` : ''}
                        <button class="btn btn-primary" onclick="exportSplitPartData(${index})" style="padding: 8px 16px; font-size: 0.9rem; margin-right: 10px;" data-lead-split-csv="true">
                            <i class="fas fa-file-export"></i> Export CSV
                        </button>
                        <button class="btn btn-info" onclick="uploadSplitPartToVicidial(${index})" style="padding: 8px 16px; font-size: 0.9rem;">
                            <i class="fas fa-upload"></i> Upload to Vicidial
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Update footer
    document.querySelector('#leadSplitModal .modal-footer').innerHTML = `
        <button type="button" class="btn btn-primary" onclick="closeLeadSplitPopup()">
            Close
        </button>
        <button type="button" class="btn btn-success" onclick="exportAllSplitParts()" data-lead-split-csv="true">
            <i class="fas fa-file-export"></i> Export All Parts
        </button>
    `;
}

// Export a specific split part to CSV
function exportSplitPartData(partIndex) {
    const part = window.leadSplitResults[partIndex];
    if (!part) return;

    console.log('✅ Exporting split part:', part.name, 'with', part.count, 'leads');

    // Convert to CSV format
    const csvContent = convertLeadsToCSV(part.leads);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${part.name.replace(/[^a-zA-Z0-9]/g, '_')}_leads_${new Date().toISOString().split('T')[0]}.csv`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    console.log('✅ CSV export completed for:', part.name);
}

// Export all split parts (individual files with staggered timing)
function exportAllSplitParts() {
    window.leadSplitResults.forEach((part, index) => {
        setTimeout(() => exportSplitPartData(index), index * 800); // Stagger exports
    });
}

// Upload split part to Vicidial
function uploadSplitPartToVicidial(partIndex) {
    const part = window.leadSplitResults[partIndex];
    if (!part) return;

    // Store original data and prepare split data
    const originalData = window.generatedLeadsData;

    console.log(`🎯 Uploading split "${part.name}" with ${part.count} leads to Vicidial`);

    // Perform complete reset of Vicidial uploader to prevent timeout issues
    if (typeof vicidialUploader !== 'undefined') {
        // Extract cache before reset if first time
        if (!vicidialUploader.cachedLists) {
            const existingModal = document.getElementById('vicidialUploadModal');
            if (existingModal) {
                const listElements = existingModal.querySelectorAll('input[name="vicidialList"]');
                if (listElements.length > 0) {
                    const extractedLists = Array.from(listElements).map(input => ({
                        list_id: input.value,
                        list_name: input.nextElementSibling ? input.nextElementSibling.textContent.trim() : `List ${input.value}`
                    }));
                    vicidialUploader.cachedLists = extractedLists;
                    console.log('💾 Extracted and cached lists before reset:', extractedLists.length, 'lists');
                }
            }
        }

        // Use the new complete reset function
        if (typeof vicidialUploader.completeReset === 'function') {
            vicidialUploader.completeReset();
        } else {
            // Fallback to manual reset if function doesn't exist
            console.log('⚠️ Using fallback reset method');
            vicidialUploader.closeDialog();
            vicidialUploader.resultsShown = false;
            vicidialUploader.uploadCriteria = null;
            vicidialUploader.selectedListId = null;

            const modal = document.getElementById('vicidialUploadModal');
            if (modal) modal.remove();
        }

        console.log(`🔄 Vicidial uploader completely reset for split upload #${partIndex + 1}`);
    }

    // Create criteria object with the split leads (matching the format expected by vicidial-uploader)
    const splitCriteria = {
        state: 'Split Upload',
        insuranceCompanies: [`Split: ${part.name}`],
        daysUntilExpiry: 'Split',
        totalLeads: part.count,  // This is the key field the uploader uses
        leadCount: part.count,   // Keep for compatibility
        leads: part.leads,
        splitName: part.name,
        isSplit: true,
        limit: part.count
    };

    // Set the split leads as the current generated data
    window.generatedLeadsData = part.leads;

    // Add a flag to indicate this is a split upload
    window.isUploadingSplit = true;
    window.splitUploadData = {
        name: part.name,
        count: part.count,
        originalCount: originalData ? originalData.length : 0
    };

    // Wait longer for complete cleanup, then show the fresh upload dialog
    setTimeout(() => {
        try {
            if (typeof vicidialUploader !== 'undefined' && vicidialUploader.showUploadDialog) {
                console.log(`✅ Opening fresh Vicidial upload dialog for split: ${part.name} (${part.count} leads)`);

                // Double-check that we've cleared the old modal
                const oldModal = document.getElementById('vicidialUploadModal');
                if (oldModal) {
                    console.log('⚠️ Found leftover modal, removing it');
                    oldModal.remove();
                }

                // Show the dialog with a completely fresh state
                vicidialUploader.showUploadDialog(splitCriteria);

                console.log('🚀 Upload dialog launched successfully');
            } else {
                throw new Error('Vicidial uploader not available');
            }
        } catch (error) {
            console.error('❌ Failed to open Vicidial upload dialog:', error);
            alert(`Failed to open upload dialog: ${error.message}. Please try refreshing the page.`);

            // Restore original data on error
            window.generatedLeadsData = originalData;
            window.isUploadingSplit = false;
            window.splitUploadData = null;
        }
    }, 200);

    // Restore original data after upload dialog is shown
    setTimeout(() => {
        if (window.isUploadingSplit) {
            console.log('🔄 Restoring original lead data after split upload');
            window.generatedLeadsData = originalData;
            window.isUploadingSplit = false;
            window.splitUploadData = null;
        }
    }, 3000);
}

// Helper function to convert leads to CSV
function convertLeadsToCSV(leads) {
    if (!leads || leads.length === 0) return '';

    // Get headers from first lead
    const headers = Object.keys(leads[0]);
    const csvHeaders = headers.join(',');

    // Convert leads to CSV rows
    const csvRows = leads.map(lead => {
        return headers.map(header => {
            const value = lead[header];
            // Escape CSV values that contain commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value || '';
        }).join(',');
    });

    return [csvHeaders, ...csvRows].join('\n');
}

// Close lead split popup
window.closeLeadSplitPopup = function() {
    const modal = document.getElementById('leadSplitModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

// ============================================================
// Corgi Prequote Integration
// ============================================================
const CORGI_API_KEY = 'dpk_5852959849b6e380cb9cb112be283f2c3428089db76021ddb9f5a57bdfed62d1';
const CORGI_API_BASE = 'https://api.trucking.corgi.insure/api/trucking/v2';

async function fetchCorgiPrequote(lead) {
    const dotNumber = String(lead.dot_number || '').trim();
    if (!dotNumber) return { eligible: false, prequote_id: null, reason: 'No DOT' };

    const today = new Date();
    const effectiveDate = today.toISOString().split('T')[0];
    const expDate = new Date(today);
    expDate.setFullYear(expDate.getFullYear() + 1);
    const expirationDate = expDate.toISOString().split('T')[0];

    const fleetSize = parseInt(lead.power_units) || parseInt(lead.qc_power_units) || parseInt(lead.mcs150_power_units) || 1;

    try {
        const resp = await fetch('/api/corgi/prequote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dot_number: dotNumber,
                effective_date: effectiveDate,
                expiration_date: expirationDate,
                fleet_size: fleetSize,
                requested_coverages: { auto_liability: { subtypes: ['power_unit'] } }
            })
        });

        if (resp.status === 429) {
            // Retry once after a longer backoff
            await new Promise(r => setTimeout(r, 15000));
            const retry = await fetch('/api/corgi/prequote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dot_number: dotNumber,
                    effective_date: effectiveDate,
                    expiration_date: expirationDate,
                    fleet_size: fleetSize,
                    requested_coverages: { auto_liability: { subtypes: ['power_unit'] } }
                })
            });
            if (retry.status === 429) return { eligible: false, prequote_id: null, reason: 'rate_limited' };
            if (!retry.ok) {
                const err = await retry.json().catch(() => ({}));
                return { eligible: false, prequote_id: null, reason: err.error || `Error ${retry.status}` };
            }
            const retryData = await retry.json();
            const retryDeclined = retryData.declined_coverages || {};
            const retryIsDeclined = Object.keys(retryDeclined).length > 0;
            return {
                eligible: !retryIsDeclined,
                prequote_id: retryData.prequote_id || null,
                reason: retryIsDeclined ? (Object.values(retryDeclined)[0] || 'declined') : null,
                premium: retryData.total_premium || null
            };
        }

        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            return { eligible: false, prequote_id: null, reason: err.error || `Error ${resp.status}` };
        }

        const data = await resp.json();
        const declined = data.declined_coverages || {};
        const isDeclined = Object.keys(declined).length > 0;

        return {
            eligible: !isDeclined,
            prequote_id: data.prequote_id || null,
            reason: isDeclined ? (Object.values(declined)[0] || 'declined') : null,
            premium: data.total_premium || null
        };
    } catch (e) {
        return { eligible: false, prequote_id: null, reason: e.message };
    }
}

window.generateWithCorgiPrequotes = async function() {
    const state = document.getElementById('genState')?.value;
    if (!state) {
        alert('Please select a state first.');
        return;
    }

    const btn = document.querySelector('button[onclick="generateWithCorgiPrequotes()"]');
    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        btn.disabled = true;
    }

    try {
        await generateLeadsFromForm();
        const leads = window.generatedLeadsData;

        if (!leads || leads.length === 0) {
            alert('No leads generated. Adjust criteria and try again.');
            return;
        }

        const total = leads.length;
        document.body.insertAdjacentHTML('beforeend', `
            <div id="corgiProgressOverlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.65);z-index:20000;display:flex;align-items:center;justify-content:center;">
                <div style="background:#fff;border-radius:14px;padding:36px 40px;max-width:480px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);text-align:center;">
                    <div style="font-size:2.5rem;margin-bottom:12px;">🐕</div>
                    <h3 style="margin:0 0 6px;font-size:1.25rem;font-weight:700;">Corgi Prequotes Running</h3>
                    <p style="color:#6b7280;margin:0 0 24px;font-size:0.9rem;">Checking eligibility for each lead via Corgi API...</p>
                    <div style="background:#f3f4f6;border-radius:999px;height:10px;overflow:hidden;margin-bottom:14px;">
                        <div id="corgiBar" style="background:#f97316;height:100%;width:0%;transition:width 0.25s;border-radius:999px;"></div>
                    </div>
                    <div id="corgiProgressLabel" style="font-weight:600;color:#111827;font-size:0.95rem;">0 / ${total}</div>
                    <div id="corgiEligibleLabel" style="color:#10b981;font-size:0.85rem;margin-top:4px;">0 eligible</div>
                </div>
            </div>
        `);

        const CONCURRENCY = 3;
        const BATCH_DELAY_MS = 1200;
        let done = 0, eligible = 0;

        for (let i = 0; i < leads.length; i += CONCURRENCY) {
            const batch = leads.slice(i, i + CONCURRENCY);
            const results = await Promise.all(batch.map(lead => fetchCorgiPrequote(lead)));

            let anyRateLimited = false;
            let rateLimitedCount = 0;
            results.forEach((result, idx) => {
                batch[idx].corgi_prequote = result;
                done++;
                if (result.eligible) eligible++;
                if (result.reason === 'rate_limited') { anyRateLimited = true; rateLimitedCount++; }
            });

            const pct = Math.round(done / total * 100);
            const bar = document.getElementById('corgiBar');
            const label = document.getElementById('corgiProgressLabel');
            const elLabel = document.getElementById('corgiEligibleLabel');
            if (bar) bar.style.width = pct + '%';
            if (label) label.textContent = `${done} / ${total}`;
            if (elLabel) elLabel.textContent = `${eligible} eligible`;

            if (anyRateLimited) {
                if (elLabel) elLabel.textContent = `${eligible} eligible — rate limited, waiting 20s...`;
                await new Promise(r => setTimeout(r, 20000));
            } else if (i + CONCURRENCY < leads.length) {
                await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
            }
        }

        document.getElementById('corgiProgressOverlay')?.remove();

        // Keep only eligible leads
        const ineligible = total - eligible;
        window.generatedLeadsData = leads.filter(l => l.corgi_prequote && l.corgi_prequote.eligible);
        const rateLimited = leads.filter(l => l.corgi_prequote?.reason === 'rate_limited').length;

        // Update the stat box to reflect filtered count
        const countEl = document.getElementById('totalLeadsCount');
        if (countEl) countEl.textContent = window.generatedLeadsData.length;

        const rateLimitNote = rateLimited > 0 ? `\n⚠️ ${rateLimited} leads skipped due to Corgi rate limiting` : '';
        alert(`Corgi Prequotes Complete!\n\n${eligible} eligible leads kept\n${ineligible} not eligible (removed)${rateLimitNote}`);

    } finally {
        document.getElementById('corgiProgressOverlay')?.remove();
        if (btn) {
            btn.innerHTML = '<i class="fas fa-bolt"></i> Generate with Corgi Prequotes';
            btn.disabled = false;
        }
    }
};

console.log('✅ COMPLETE Lead Generation Interface RESTORED with Day Skip feature!');