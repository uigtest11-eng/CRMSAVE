// Market Tab Functions - Details and Log Quote functionality
console.log('📊 Loading Market functions...');

// Carrier data for details popup
const carrierData = {
    'Progressive': {
        name: 'Progressive',
        avgRate: '$4,250',
        quoteVolume: '156 quotes',
        rank: 1,
        rating: 'A+ (Superior)',
        specialty: 'Commercial Auto, Fleet Insurance',
        coverage: ['Liability', 'Physical Damage', 'Cargo', 'Workers Comp'],
        contact: {
            phone: '1-800-776-4737',
            email: 'commercial@progressive.com',
            website: 'www.progressivecommercial.com'
        }
    },
    'Geico': {
        name: 'Geico',
        avgRate: '$4,890',
        quoteVolume: '142 quotes',
        rank: 2,
        rating: 'A++ (Superior)',
        specialty: 'Fleet Management, Commercial Auto',
        coverage: ['Liability', 'Collision', 'Comprehensive', 'Uninsured Motorist'],
        contact: {
            phone: '1-800-841-3000',
            email: 'commercial@geico.com',
            website: 'www.geico.com/business'
        }
    },
    'Northland': {
        name: 'Northland',
        avgRate: '$5,420',
        quoteVolume: '67 quotes',
        rank: 3,
        rating: 'A (Excellent)',
        specialty: 'Trucking, Transportation Insurance',
        coverage: ['Motor Truck Cargo', 'General Liability', 'Physical Damage', 'Non-Trucking Liability'],
        contact: {
            phone: '1-800-627-3060',
            email: 'underwriting@northlandins.com',
            website: 'www.northlandinsurance.com'
        }
    },
    'Canal': {
        name: 'Canal',
        avgRate: '$6,180',
        quoteVolume: '45 quotes',
        rank: 4,
        rating: 'A- (Excellent)',
        specialty: 'Transportation, Commercial Auto',
        coverage: ['Auto Liability', 'Physical Damage', 'Cargo', 'Trailer Interchange'],
        contact: {
            phone: '1-866-484-2018',
            email: 'info@canalinsurance.com',
            website: 'www.canalinsurance.com'
        }
    },
    'Occidental': {
        name: 'Occidental',
        avgRate: '$7,290',
        quoteVolume: '34 quotes',
        rank: 5,
        rating: 'A (Excellent)',
        specialty: 'Commercial Lines, Transportation',
        coverage: ['Auto Liability', 'General Liability', 'Property', 'Workers Compensation'],
        contact: {
            phone: '1-800-365-4555',
            email: 'commercial@occidental.com',
            website: 'www.occidentalfire.com'
        }
    },
    'Crum & Forster': {
        name: 'Crum & Forster',
        avgRate: '$8,950',
        quoteVolume: '38 quotes',
        rank: 6,
        rating: 'A (Excellent)',
        specialty: 'Specialty Lines, Transportation',
        coverage: ['Commercial Auto', 'Excess Liability', 'Property', 'Professional Liability'],
        contact: {
            phone: '1-973-490-6200',
            email: 'info@crumforster.com',
            website: 'www.crumforster.com'
        }
    },
    'Nico': {
        name: 'Nico',
        avgRate: '$9,875',
        quoteVolume: '29 quotes',
        rank: 7,
        rating: 'A- (Excellent)',
        specialty: 'Transportation, Trucking',
        coverage: ['Motor Truck Cargo', 'Auto Liability', 'Physical Damage', 'General Liability'],
        contact: {
            phone: '1-800-966-6426',
            email: 'underwriting@nicoins.com',
            website: 'www.nicoinsurance.com'
        }
    },
    'Berkley Prime': {
        name: 'Berkley Prime',
        avgRate: '$12,450',
        quoteVolume: '21 quotes',
        rank: 8,
        rating: 'A+ (Superior)',
        specialty: 'Commercial Transportation, Excess Lines',
        coverage: ['Commercial Auto', 'Excess Liability', 'Cargo', 'Environmental'],
        contact: {
            phone: '1-800-421-8109',
            email: 'commercial@berkleyprime.com',
            website: 'www.berkleyprime.com'
        }
    }
};

// Show carrier details modal
function showCarrierDetails(carrierName) {
    console.log(`📋 Showing details for: ${carrierName}`);

    const carrier = carrierData[carrierName];
    if (!carrier) {
        console.error(`❌ No data found for carrier: ${carrierName}`);
        return;
    }

    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'carrier-details-modal';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        backdrop-filter: blur(4px);
    `;

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 16px;
        width: 90%;
        max-width: 700px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: modalSlideIn 0.3s ease-out;
    `;

    modalContent.innerHTML = `
        <div style="padding: 24px 30px; background: linear-gradient(135deg, #1f2937, #374151); color: white; border-radius: 16px 16px 0 0;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h2 style="margin: 0; font-size: 24px; font-weight: 700;">
                    <i class="fas fa-building" style="margin-right: 12px; color: #60a5fa;"></i>
                    ${carrier.name} - Carrier Details
                </h2>
                <button onclick="closeCarrierDetailsModal()"
                        style="background: rgba(255,255,255,0.1); border: 2px solid rgba(255,255,255,0.3);
                               color: white; font-size: 20px; font-weight: bold; cursor: pointer;
                               padding: 8px 12px; border-radius: 8px; transition: all 0.2s ease;">
                    ✕
                </button>
            </div>
            <div style="display: flex; gap: 20px; margin-top: 16px; justify-content: center;">
                <div style="background: rgba(168, 85, 247, 0.2); padding: 12px 16px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 14px; opacity: 0.8; margin-bottom: 8px;">Clear All Data</div>
                    <button onclick="clearAllCarrierData('${carrier.name}')"
                            style="background: #dc2626; color: white; border: none; padding: 8px 16px;
                                   border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer;
                                   transition: all 0.2s ease;">
                        <i class="fas fa-trash-alt" style="margin-right: 6px;"></i>Clear All
                    </button>
                </div>
            </div>
        </div>

        <div style="padding: 30px;" id="carrier-quote-sections">
            <div style="text-align: center; padding: 40px; color: #6b7280;">
                <i class="fas fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 10px;"></i><br>
                Loading quote data...
            </div>
        </div>
    `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Load quote sections asynchronously
    generateCarrierQuoteSections(carrierName).then(sectionsHTML => {
        const sectionsContainer = document.getElementById('carrier-quote-sections');
        if (sectionsContainer) {
            sectionsContainer.innerHTML = sectionsHTML + `
                <!-- Action Buttons -->
                <div style="margin-top: 30px; display: flex; gap: 12px; justify-content: center;">
                    <button onclick="closeCarrierDetailsModal()"
                            style="background: #6b7280; color: white; border: none; padding: 14px 24px;
                                   border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer;
                                   transition: all 0.2s ease;">
                        <i class="fas fa-times" style="margin-right: 8px;"></i>Close
                    </button>
                </div>
            `;
        }
    }).catch(error => {
        console.error('Error loading carrier quote sections:', error);
        const sectionsContainer = document.getElementById('carrier-quote-sections');
        if (sectionsContainer) {
            sectionsContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #dc2626;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 10px;"></i><br>
                    Error loading quote data
                </div>
            `;
        }
    });

    // Close on overlay click
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            closeCarrierDetailsModal();
        }
    });

    console.log(`✅ Carrier details modal created for: ${carrierName}`);
}

// Generate carrier quote sections for details modal
async function generateCarrierQuoteSections(carrierName) {
    let quotes = [];

    try {
        const response = await fetch('/api/market-quotes');
        if (response.ok) {
            quotes = await response.json();
            // Convert to frontend format
            quotes = quotes.map(quote => ({
                id: quote.id,
                carrier: quote.carrier,
                clientName: quote.physical_coverage,
                physicalCoverage: quote.physical_coverage,
                premiumText: quote.premium_text,
                liabilityPerUnit: quote.liability_per_unit,
                dateCreated: quote.date_created,
                source: quote.source || 'MANUAL ENTRY'
            }));
        }
    } catch (error) {
        console.error('Error fetching quotes for carrier details:', error);
        // Fallback to localStorage
        quotes = JSON.parse(localStorage.getItem('market_quotes') || '[]');
    }

    const carrierQuotes = quotes.filter(q => q.carrier === carrierName);

    // Separate quotes by type
    const liabilityQuotes = carrierQuotes.filter(q => q.liabilityPerUnit).map(q => ({
        id: q.id,
        value: q.liabilityPerUnit,
        date: new Date(q.dateCreated).toLocaleDateString(),
        source: q.source || 'MANUAL ENTRY'
    }));

    const physicalQuotes = carrierQuotes.filter(q => q.physicalCoverage || q.clientName).map(q => ({
        id: q.id,
        value: q.physicalCoverage || q.clientName,
        date: new Date(q.dateCreated).toLocaleDateString(),
        source: q.source || 'MANUAL ENTRY'
    }));

    const cargoQuotes = carrierQuotes.filter(q => q.premiumText).map(q => ({
        id: q.id,
        value: q.premiumText,
        date: new Date(q.dateCreated).toLocaleDateString(),
        source: q.source || 'MANUAL ENTRY'
    }));

    return `
        <!-- Liability Section -->
        <div style="margin-bottom: 30px;">
            <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1f2937;">
                <i class="fas fa-shield-alt" style="color: #8b5cf6; margin-right: 8px;"></i>Liability Per Unit
                <span style="font-size: 14px; color: #6b7280; font-weight: 400;">(${liabilityQuotes.length} entries)</span>
            </h3>
            <div style="background: #f8fafc; border-radius: 8px; padding: 16px; max-height: 200px; overflow-y: auto;">
                ${liabilityQuotes.length === 0 ?
                    '<div style="color: #9ca3af; text-align: center; padding: 20px;">No liability data recorded</div>' :
                    liabilityQuotes.map(quote => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                            <div style="flex: 1;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-weight: 600; color: #374151;">${quote.value}</span>
                                    <span style="font-size: 12px; color: #6b7280;">${quote.date}</span>
                                </div>
                                <div style="font-size: 11px; color: ${quote.source === 'MANUAL ENTRY' ? '#8b5cf6' : '#059669'}; font-weight: 500; margin-top: 2px;">
                                    ${quote.source === 'MANUAL ENTRY' ? '📝 Manual Entry' : `📥 From: ${quote.source}`}
                                </div>
                            </div>
                            <button onclick="deleteQuote(${quote.id}, '${carrierName}')"
                                    style="background: #dc2626; color: white; border: none; padding: 4px 8px;
                                           border-radius: 4px; font-size: 12px; cursor: pointer;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `).join('')
                }
            </div>
        </div>

        <!-- Physical Coverage Section -->
        <div style="margin-bottom: 30px;">
            <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1f2937;">
                <i class="fas fa-shield-alt" style="color: #3b82f6; margin-right: 8px;"></i>Physical Coverage
                <span style="font-size: 14px; color: #6b7280; font-weight: 400;">(${physicalQuotes.length} entries)</span>
            </h3>
            <div style="background: #f8fafc; border-radius: 8px; padding: 16px; max-height: 200px; overflow-y: auto;">
                ${physicalQuotes.length === 0 ?
                    '<div style="color: #9ca3af; text-align: center; padding: 20px;">No physical coverage data recorded</div>' :
                    physicalQuotes.map(quote => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                            <div style="flex: 1;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-weight: 600; color: #374151;">${quote.value}</span>
                                    <span style="font-size: 12px; color: #6b7280;">${quote.date}</span>
                                </div>
                                <div style="font-size: 11px; color: ${quote.source === 'MANUAL ENTRY' ? '#8b5cf6' : '#059669'}; font-weight: 500; margin-top: 2px;">
                                    ${quote.source === 'MANUAL ENTRY' ? '📝 Manual Entry' : `📥 From: ${quote.source}`}
                                </div>
                            </div>
                            <button onclick="deleteQuote(${quote.id}, '${carrierName}')"
                                    style="background: #dc2626; color: white; border: none; padding: 4px 8px;
                                           border-radius: 4px; font-size: 12px; cursor: pointer;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `).join('')
                }
            </div>
        </div>

        <!-- Cargo Section -->
        <div style="margin-bottom: 30px;">
            <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1f2937;">
                <i class="fas fa-dollar-sign" style="color: #059669; margin-right: 8px;"></i>Cargo Cost
                <span style="font-size: 14px; color: #6b7280; font-weight: 400;">(${cargoQuotes.length} entries)</span>
            </h3>
            <div style="background: #f8fafc; border-radius: 8px; padding: 16px; max-height: 200px; overflow-y: auto;">
                ${cargoQuotes.length === 0 ?
                    '<div style="color: #9ca3af; text-align: center; padding: 20px;">No cargo cost data recorded</div>' :
                    cargoQuotes.map(quote => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                            <div style="flex: 1;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-weight: 600; color: #374151;">${quote.value}</span>
                                    <span style="font-size: 12px; color: #6b7280;">${quote.date}</span>
                                </div>
                                <div style="font-size: 11px; color: ${quote.source === 'MANUAL ENTRY' ? '#8b5cf6' : '#059669'}; font-weight: 500; margin-top: 2px;">
                                    ${quote.source === 'MANUAL ENTRY' ? '📝 Manual Entry' : `📥 From: ${quote.source}`}
                                </div>
                            </div>
                            <button onclick="deleteQuote(${quote.id}, '${carrierName}')"
                                    style="background: #dc2626; color: white; border: none; padding: 4px 8px;
                                           border-radius: 4px; font-size: 12px; cursor: pointer;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `).join('')
                }
            </div>
        </div>
    `;
}

// Delete individual quote
async function deleteQuote(quoteId, carrierName) {
    if (confirm('Are you sure you want to delete this quote entry?')) {
        try {
            const response = await fetch(`/api/market-quotes/${quoteId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const result = await response.json();
            console.log(`🗑️ Deleted quote ${quoteId} for ${carrierName}`);

            // Refresh the modal and market data
            closeCarrierDetailsModal();
            setTimeout(() => {
                showCarrierDetails(carrierName);
                if (window.refreshMarketData) {
                    window.refreshMarketData();
                }
            }, 100);

        } catch (error) {
            console.error('Error deleting quote:', error);
            alert('Error deleting quote from server. Please try again.');
        }
    }
}

// Clear all data for a specific carrier
async function clearAllCarrierData(carrierName) {
    if (confirm(`Are you sure you want to clear ALL quote data for ${carrierName}? This cannot be undone.`)) {
        try {
            const response = await fetch(`/api/market-quotes/carrier/${encodeURIComponent(carrierName)}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const result = await response.json();
            console.log(`🗑️ Cleared ${result.deletedCount} quotes for ${carrierName}`);

            // Refresh the modal and market data
            closeCarrierDetailsModal();
            setTimeout(() => {
                showCarrierDetails(carrierName);
                if (window.refreshMarketData) {
                    window.refreshMarketData();
                }
            }, 100);

        } catch (error) {
            console.error('Error clearing carrier data:', error);
            alert('Error clearing carrier data from server. Please try again.');
        }
    }
}

// Close carrier details modal
function closeCarrierDetailsModal() {
    const modal = document.getElementById('carrier-details-modal');
    if (modal) {
        modal.remove();
        console.log('✅ Carrier details modal closed');
    }
}

// Show log quote modal
function showLogQuoteModal(carrierName = null) {
    console.log(`📝 Opening Log Quote modal${carrierName ? ' for: ' + carrierName : ''}`);

    // Close details modal if open
    closeCarrierDetailsModal();

    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'log-quote-modal';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        backdrop-filter: blur(4px);
    `;

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 16px;
        width: 98%;
        max-width: 1400px;
        max-height: 85vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: modalSlideIn 0.3s ease-out;
    `;

    modalContent.innerHTML = `
        <div style="padding: 24px 30px; background: linear-gradient(135deg, #059669, #047857); color: white; border-radius: 16px 16px 0 0;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h2 style="margin: 0; font-size: 24px; font-weight: 700;">
                    <i class="fas fa-edit" style="margin-right: 12px; color: #6ee7b7;"></i>
                    Log Quote
                </h2>
                <button onclick="closeLogQuoteModal()"
                        style="background: rgba(255,255,255,0.1); border: 2px solid rgba(255,255,255,0.3);
                               color: white; font-size: 20px; font-weight: bold; cursor: pointer;
                               padding: 8px 12px; border-radius: 8px; transition: all 0.2s ease;">
                    ✕
                </button>
            </div>
            <div style="margin-top: 8px; opacity: 0.9; font-size: 16px;">
                Enter quote details for insurance carriers (minimum 2 quotes required)
            </div>
        </div>

        <div style="padding: 30px;">
            <div style="display: flex; gap: 20px;">
                <!-- First Quote Form -->
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 20px 0; color: #374151; font-size: 18px; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                        <i class="fas fa-file-alt" style="color: #059669; margin-right: 8px;"></i>Quote #1
                    </h3>
                    <form class="quote-form" data-quote-number="1">
                <!-- Carrier Selection -->
                <div style="margin-bottom: 24px;">
                    <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #374151; font-size: 16px;">
                        <i class="fas fa-building" style="color: #059669; margin-right: 8px;"></i>Insurance Carrier
                    </label>
                    <select id="carrier-selection-1"
                            style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px;
                                   font-size: 15px; transition: border-color 0.2s ease; background: white;">
                        <option value="">Select a carrier...</option>
                        <option value="Progressive">Progressive</option>
                        <option value="Geico">Geico</option>
                        <option value="Northland">Northland</option>
                        <option value="Canal">Canal</option>
                        <option value="Occidental">Occidental</option>
                        <option value="Crum & Forster">Crum & Forster</option>
                        <option value="Nico">Nico</option>
                        <option value="Berkley Prime">Berkley Prime</option>
                        <option value="Star Mutual">Star Mutual</option>
                        <option value="Corgi">Corgi</option>
                    </select>
                </div>

                <!-- Physical Coverage -->
                <div style="margin-bottom: 24px;">
                    <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #374151; font-size: 16px;">
                        <i class="fas fa-shield-alt" style="color: #3b82f6; margin-right: 8px;"></i>Physical Coverage
                    </label>
                    <input type="text" id="client-name-1"
                           style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px;
                                  font-size: 15px; transition: border-color 0.2s ease;">
                </div>

                <!-- Cargo Cost -->
                <div style="margin-bottom: 24px;">
                    <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #374151; font-size: 16px;">
                        <i class="fas fa-dollar-sign" style="color: #059669; margin-right: 8px;"></i>Cargo Cost: 100K
                    </label>
                    <input type="text" id="premium-text-1"
                           style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px;
                                  font-size: 15px; transition: border-color 0.2s ease;"
                           inputmode="numeric" pattern="[0-9]*">
                </div>

                <!-- Liability Per Unit -->
                <div style="margin-bottom: 24px;">
                    <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #374151; font-size: 16px;">
                        <i class="fas fa-shield-alt" style="color: #8b5cf6; margin-right: 8px;"></i>Liability
                    </label>
                    <input type="text" id="liability-per-unit-1"
                           style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px;
                                  font-size: 15px; transition: border-color 0.2s ease;"
                           inputmode="numeric" pattern="[0-9]*">
                </div>

                    </form>
                </div>

                <!-- Second Quote Form -->
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 20px 0; color: #374151; font-size: 18px; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                        <i class="fas fa-file-alt" style="color: #059669; margin-right: 8px;"></i>Quote #2
                    </h3>
                    <form class="quote-form" data-quote-number="2">
                        <!-- Carrier Selection -->
                        <div style="margin-bottom: 24px;">
                            <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #374151; font-size: 16px;">
                                <i class="fas fa-building" style="color: #059669; margin-right: 8px;"></i>Insurance Carrier
                            </label>
                            <select id="carrier-selection-2"
                                    style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px;
                                           font-size: 15px; transition: border-color 0.2s ease; background: white;">
                                <option value="">Select a carrier...</option>
                                <option value="Progressive">Progressive</option>
                                <option value="Geico">Geico</option>
                                <option value="Northland">Northland</option>
                                <option value="Canal">Canal</option>
                                <option value="Occidental">Occidental</option>
                                <option value="Crum & Forster">Crum & Forster</option>
                                <option value="Nico">Nico</option>
                                <option value="Berkley Prime">Berkley Prime</option>
                            </select>
                        </div>

                        <!-- Physical Coverage -->
                        <div style="margin-bottom: 24px;">
                            <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #374151; font-size: 16px;">
                                <i class="fas fa-shield-alt" style="color: #3b82f6; margin-right: 8px;"></i>Physical Coverage
                            </label>
                            <input type="text" id="client-name-2"
                                   style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px;
                                          font-size: 15px; transition: border-color 0.2s ease;">
                        </div>

                        <!-- Cargo Cost -->
                        <div style="margin-bottom: 24px;">
                            <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #374151; font-size: 16px;">
                                <i class="fas fa-dollar-sign" style="color: #059669; margin-right: 8px;"></i>Cargo Cost: 100K
                            </label>
                            <input type="text" id="premium-text-2"
                                   style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px;
                                          font-size: 15px; transition: border-color 0.2s ease;"
                                   inputmode="numeric" pattern="[0-9]*">
                        </div>

                        <!-- Liability Per Unit -->
                        <div style="margin-bottom: 24px;">
                            <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #374151; font-size: 16px;">
                                <i class="fas fa-shield-alt" style="color: #8b5cf6; margin-right: 8px;"></i>Liability
                            </label>
                            <input type="text" id="liability-per-unit-2"
                                   style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px;
                                          font-size: 15px; transition: border-color 0.2s ease;"
                                   inputmode="numeric" pattern="[0-9]*">
                        </div>
                    </form>
                </div>

                <!-- Third Quote Form -->
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 20px 0; color: #374151; font-size: 18px; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                        <i class="fas fa-file-alt" style="color: #059669; margin-right: 8px;"></i>Quote #3
                    </h3>
                    <form class="quote-form" data-quote-number="3">
                        <!-- Carrier Selection -->
                        <div style="margin-bottom: 24px;">
                            <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #374151; font-size: 16px;">
                                <i class="fas fa-building" style="color: #059669; margin-right: 8px;"></i>Insurance Carrier
                            </label>
                            <select id="carrier-selection-3"
                                    style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px;
                                           font-size: 15px; transition: border-color 0.2s ease; background: white;">
                                <option value="">Select a carrier...</option>
                                <option value="Progressive">Progressive</option>
                                <option value="Geico">Geico</option>
                                <option value="Northland">Northland</option>
                                <option value="Canal">Canal</option>
                                <option value="Occidental">Occidental</option>
                                <option value="Crum & Forster">Crum & Forster</option>
                                <option value="Nico">Nico</option>
                                <option value="Berkley Prime">Berkley Prime</option>
                            </select>
                        </div>

                        <!-- Physical Coverage -->
                        <div style="margin-bottom: 24px;">
                            <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #374151; font-size: 16px;">
                                <i class="fas fa-shield-alt" style="color: #3b82f6; margin-right: 8px;"></i>Physical Coverage
                            </label>
                            <input type="text" id="client-name-3"
                                   style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px;
                                          font-size: 15px; transition: border-color 0.2s ease;">
                        </div>

                        <!-- Cargo Cost -->
                        <div style="margin-bottom: 24px;">
                            <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #374151; font-size: 16px;">
                                <i class="fas fa-dollar-sign" style="color: #059669; margin-right: 8px;"></i>Cargo Cost: 100K
                            </label>
                            <input type="text" id="premium-text-3"
                                   style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px;
                                          font-size: 15px; transition: border-color 0.2s ease;"
                                   inputmode="numeric" pattern="[0-9]*">
                        </div>

                        <!-- Liability Per Unit -->
                        <div style="margin-bottom: 24px;">
                            <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #374151; font-size: 16px;">
                                <i class="fas fa-shield-alt" style="color: #8b5cf6; margin-right: 8px;"></i>Liability
                            </label>
                            <input type="text" id="liability-per-unit-3"
                                   style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px;
                                          font-size: 15px; transition: border-color 0.2s ease;"
                                   inputmode="numeric" pattern="[0-9]*">
                        </div>
                    </form>
                </div>
            </div>

            <!-- Action Buttons -->
            <div style="display: flex; gap: 12px; justify-content: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
                <button onclick="saveAllQuotes()"
                        style="background: linear-gradient(135deg, #059669, #047857); color: white;
                               border: none; padding: 14px 28px; border-radius: 8px; font-size: 16px;
                               font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                    <i class="fas fa-save" style="margin-right: 8px;"></i>Save All Quotes
                </button>
                <button type="button" onclick="closeLogQuoteModal()"
                        style="background: #6b7280; color: white; border: none; padding: 14px 28px;
                               border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;
                               transition: all 0.2s ease;">
                    <i class="fas fa-times" style="margin-right: 8px;"></i>Cancel
                </button>
            </div>
        </div>
    `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Add numeric input validation for all three forms
    const numericInputs = ['premium-text-1', 'liability-per-unit-1', 'premium-text-2', 'liability-per-unit-2', 'premium-text-3', 'liability-per-unit-3'];
    numericInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', function(e) {
                // Allow only numbers, commas, periods, and dollar signs
                this.value = this.value.replace(/[^0-9,.$]/g, '');
            });
        }
    });

    // Close on overlay click
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            closeLogQuoteModal();
        }
    });

    // Focus on first input (carrier selection for form 1)
    document.getElementById('carrier-selection-1').focus();

    console.log(`✅ Log Quote modal created for: ${carrierName}`);
}

// Close log quote modal
function closeLogQuoteModal() {
    const modal = document.getElementById('log-quote-modal');
    if (modal) {
        modal.remove();
        console.log('✅ Log Quote modal closed');
    }
}

// Save quote function
async function saveQuote() {
    const carrierName = document.getElementById('carrier-selection').value.trim();
    const physicalCoverage = document.getElementById('client-name').value.trim();
    const premiumText = document.getElementById('premium-text').value.trim();
    const liabilityPerUnit = document.getElementById('liability-per-unit').value.trim();

    if (!carrierName) {
        alert('Please select a carrier');
        return;
    }

    // Check that at least one field is filled
    if (!physicalCoverage && !premiumText && !liabilityPerUnit) {
        alert('Please fill in at least one field (Physical Coverage, Cargo Cost, or Liability Per Unit)');
        return;
    }

    try {
        // Save to server
        const response = await fetch('/api/market-quotes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                carrier: carrierName,
                physical_coverage: physicalCoverage || null,
                premium_text: premiumText || null,
                liability_per_unit: liabilityPerUnit || null,
                source: 'MANUAL ENTRY'
            })
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const savedQuote = await response.json();
        console.log('💾 Quote saved to server:', savedQuote);

        // Show success message
        closeLogQuoteModal();

        // Refresh market data and table
        setTimeout(() => {
            if (typeof refreshMarketData === 'function') {
                refreshMarketData();
            }
        }, 100);

        // Create success notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            z-index: 10001;
            animation: slideInRight 0.3s ease-out;
            font-weight: 600;
        `;
        notification.innerHTML = `
            <i class="fas fa-check-circle" style="margin-right: 8px;"></i>
            Quote saved for ${carrierName}! Market data updated.
        `;

        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);

    } catch (error) {
        console.error('Error saving quote:', error);
        alert('Error saving quote to server. Please try again.');
    }
}

// Save all quotes function
async function saveAllQuotes() {
    const quote1 = {
        carrier: document.getElementById('carrier-selection-1').value.trim(),
        physicalCoverage: document.getElementById('client-name-1').value.trim(),
        premiumText: document.getElementById('premium-text-1').value.trim(),
        liabilityPerUnit: document.getElementById('liability-per-unit-1').value.trim()
    };

    const quote2 = {
        carrier: document.getElementById('carrier-selection-2').value.trim(),
        physicalCoverage: document.getElementById('client-name-2').value.trim(),
        premiumText: document.getElementById('premium-text-2').value.trim(),
        liabilityPerUnit: document.getElementById('liability-per-unit-2').value.trim()
    };

    const quote3 = {
        carrier: document.getElementById('carrier-selection-3').value.trim(),
        physicalCoverage: document.getElementById('client-name-3').value.trim(),
        premiumText: document.getElementById('premium-text-3').value.trim(),
        liabilityPerUnit: document.getElementById('liability-per-unit-3').value.trim()
    };

    // Count how many quotes have carriers selected
    const quotesWithCarriers = [quote1, quote2, quote3].filter(quote => quote.carrier).length;

    // Validate that at least 2 quotes have carriers selected
    if (quotesWithCarriers < 2) {
        alert('Please select at least 2 insurance carriers to compare quotes');
        return;
    }

    let savedQuotes = 0;
    const errors = [];

    // Save quote 1 if it has data
    if (quote1.carrier && (quote1.physicalCoverage || quote1.premiumText || quote1.liabilityPerUnit)) {
        try {
            const response = await fetch('/api/market-quotes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    carrier: quote1.carrier,
                    physical_coverage: quote1.physicalCoverage || null,
                    premium_text: quote1.premiumText || null,
                    liability_per_unit: quote1.liabilityPerUnit || null,
                    source: 'MANUAL ENTRY'
                })
            });

            if (response.ok) {
                savedQuotes++;
                console.log('💾 Quote 1 saved successfully');
            } else {
                errors.push(`Quote 1 (${quote1.carrier}): Server error ${response.status}`);
            }
        } catch (error) {
            errors.push(`Quote 1 (${quote1.carrier}): ${error.message}`);
        }
    }

    // Save quote 2 if it has data
    if (quote2.carrier && (quote2.physicalCoverage || quote2.premiumText || quote2.liabilityPerUnit)) {
        try {
            const response = await fetch('/api/market-quotes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    carrier: quote2.carrier,
                    physical_coverage: quote2.physicalCoverage || null,
                    premium_text: quote2.premiumText || null,
                    liability_per_unit: quote2.liabilityPerUnit || null,
                    source: 'MANUAL ENTRY'
                })
            });

            if (response.ok) {
                savedQuotes++;
                console.log('💾 Quote 2 saved successfully');
            } else {
                errors.push(`Quote 2 (${quote2.carrier}): Server error ${response.status}`);
            }
        } catch (error) {
            errors.push(`Quote 2 (${quote2.carrier}): ${error.message}`);
        }
    }

    // Save quote 3 if it has data
    if (quote3.carrier && (quote3.physicalCoverage || quote3.premiumText || quote3.liabilityPerUnit)) {
        try {
            const response = await fetch('/api/market-quotes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    carrier: quote3.carrier,
                    physical_coverage: quote3.physicalCoverage || null,
                    premium_text: quote3.premiumText || null,
                    liability_per_unit: quote3.liabilityPerUnit || null,
                    source: 'MANUAL ENTRY'
                })
            });

            if (response.ok) {
                savedQuotes++;
                console.log('💾 Quote 3 saved successfully');
            } else {
                errors.push(`Quote 3 (${quote3.carrier}): Server error ${response.status}`);
            }
        } catch (error) {
            errors.push(`Quote 3 (${quote3.carrier}): ${error.message}`);
        }
    }

    // Show results
    if (savedQuotes < 2) {
        alert('At least 2 quotes must be saved. Please fill in at least 2 complete quotes with a carrier and one other field.');
        return;
    }

    // Close modal
    closeLogQuoteModal();

    // Refresh market data
    setTimeout(() => {
        if (typeof refreshMarketData === 'function') {
            refreshMarketData();
        }
    }, 100);

    // Show success/error message
    let message = `✅ Successfully saved ${savedQuotes} quote${savedQuotes > 1 ? 's' : ''}`;
    if (errors.length > 0) {
        message += `\n\n⚠️ Errors:\n${errors.join('\n')}`;
    }

    // Create notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10001;
        max-width: 300px;
        font-weight: 500;
    `;
    notification.innerHTML = `
        <div style="display: flex; align-items: center;">
            <i class="fas fa-check-circle" style="margin-right: 8px; color: #6ee7b7;"></i>
            <span>Quotes saved successfully!</span>
        </div>
    `;

    document.body.appendChild(notification);

    // Remove notification after 4 seconds
    setTimeout(() => {
        notification.remove();
    }, 4000);

    console.log(`✅ Saved ${savedQuotes} quotes successfully`);
}

// Add modal animation styles
const modalStyles = document.createElement('style');
modalStyles.textContent = `
    @keyframes modalSlideIn {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(modalStyles);

// Metric selector functionality
function showMetricSelector() {
    console.log('⚙️ Showing metric selector');

    // Close any existing metric selector
    closeMetricSelector();

    // Create dropdown overlay
    const dropdown = document.createElement('div');
    dropdown.id = 'metric-selector-dropdown';
    dropdown.style.cssText = `
        position: absolute;
        top: 100%;
        right: 0;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        min-width: 220px;
        padding: 8px 0;
        margin-top: 4px;
    `;

    // Get current metric from localStorage or default
    const currentMetric = localStorage.getItem('market_metric') || 'liability';

    dropdown.innerHTML = `
        <div style="padding: 8px 16px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">
            Calculation Method
        </div>
        <div class="metric-option ${currentMetric === 'liability' ? 'selected' : ''}"
             onclick="selectMetric('liability')" data-metric="liability">
            <i class="fas fa-shield-alt" style="width: 16px; color: #8b5cf6;"></i>
            <span>Liability % Difference</span>
            ${currentMetric === 'liability' ? '<i class="fas fa-check" style="color: #059669; margin-left: auto;"></i>' : ''}
        </div>
        <div class="metric-option ${currentMetric === 'physical' ? 'selected' : ''}"
             onclick="selectMetric('physical')" data-metric="physical">
            <i class="fas fa-shield-alt" style="width: 16px; color: #3b82f6;"></i>
            <span>Physical % Difference</span>
            ${currentMetric === 'physical' ? '<i class="fas fa-check" style="color: #059669; margin-left: auto;"></i>' : ''}
        </div>
        <div class="metric-option ${currentMetric === 'cargo' ? 'selected' : ''}"
             onclick="selectMetric('cargo')" data-metric="cargo">
            <i class="fas fa-dollar-sign" style="width: 16px; color: #059669;"></i>
            <span>Cargo % Difference</span>
            ${currentMetric === 'cargo' ? '<i class="fas fa-check" style="color: #059669; margin-left: auto;"></i>' : ''}
        </div>
    `;

    // Add dropdown styles
    const style = document.createElement('style');
    style.id = 'metric-selector-styles';
    style.textContent = `
        .metric-option {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            cursor: pointer;
            transition: background-color 0.2s ease;
            font-size: 14px;
            color: #374151;
        }
        .metric-option:hover {
            background: #f8fafc;
        }
        .metric-option.selected {
            background: #ecfdf5;
            color: #065f46;
            font-weight: 600;
        }
        .metric-selector-icon:hover {
            color: #3b82f6 !important;
        }
    `;
    document.head.appendChild(style);

    // Position relative to the header
    const priceHeader = document.querySelector('.price-col');
    priceHeader.style.position = 'relative';
    priceHeader.appendChild(dropdown);

    // Close on outside click
    setTimeout(() => {
        document.addEventListener('click', function closeOnOutside(e) {
            if (!dropdown.contains(e.target) && !e.target.classList.contains('metric-selector-icon')) {
                closeMetricSelector();
                document.removeEventListener('click', closeOnOutside);
            }
        });
    }, 100);
}

function closeMetricSelector() {
    const dropdown = document.getElementById('metric-selector-dropdown');
    const styles = document.getElementById('metric-selector-styles');
    if (dropdown) dropdown.remove();
    if (styles) styles.remove();
}

function selectMetric(metric) {
    console.log(`📊 Selected metric: ${metric}`);

    // Save selection to localStorage
    localStorage.setItem('market_metric', metric);

    // Update header text
    const priceHeader = document.querySelector('.price-col');
    let headerText = 'Market % Difference';

    switch(metric) {
        case 'physical':
            headerText = 'Physical % Difference';
            break;
        case 'cargo':
            headerText = 'Cargo % Difference';
            break;
        case 'liability':
            headerText = 'Liability % Difference';
            break;
    }

    // Update the header text while preserving the icon
    const icon = priceHeader.querySelector('.metric-selector-icon');
    priceHeader.innerHTML = `${headerText}`;
    priceHeader.appendChild(icon);

    // Close dropdown
    closeMetricSelector();

    // Refresh market data with new metric
    if (window.marketDataCalculator) {
        window.marketDataCalculator.setMetric(metric);
        window.rebuildMarketTable();
    }
}

// Make functions globally available
window.showCarrierDetails = showCarrierDetails;
window.closeCarrierDetailsModal = closeCarrierDetailsModal;
window.showLogQuoteModal = showLogQuoteModal;
window.closeLogQuoteModal = closeLogQuoteModal;
window.saveAllQuotes = saveAllQuotes;
window.showMetricSelector = showMetricSelector;
window.closeMetricSelector = closeMetricSelector;
window.selectMetric = selectMetric;
window.deleteQuote = deleteQuote;
window.clearAllCarrierData = clearAllCarrierData;
window.autoImportLeadQuotes = autoImportLeadQuotes;
window.checkAutoImportEligibility = checkAutoImportEligibility;

// Auto-import quotes from lead profile to market tab
async function autoImportLeadQuotes(leadId, leadName) {
    console.log(`🔄 Auto-importing quotes from lead ${leadId} (${leadName}) to market tab`);

    try {
        const response = await fetch('/api/market-quotes/auto-import', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                leadId: leadId
            })
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.imported > 0) {
            // Show success notification
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                padding: 16px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                z-index: 10001;
                animation: slideInRight 0.3s ease-out;
                font-weight: 600;
                max-width: 300px;
            `;
            notification.innerHTML = `
                <div style="display: flex; align-items: center;">
                    <i class="fas fa-check-circle" style="margin-right: 8px; color: #6ee7b7;"></i>
                    <span>Auto-imported ${result.imported} quotes from ${result.leadName}!</span>
                </div>
            `;

            document.body.appendChild(notification);

            // Remove notification after 4 seconds
            setTimeout(() => {
                notification.remove();
            }, 4000);

            // Refresh market data
            setTimeout(() => {
                if (typeof refreshMarketData === 'function') {
                    refreshMarketData();
                }
            }, 100);

            console.log(`✅ Auto-imported ${result.imported} quotes from ${leadName}`);
        } else {
            console.log(`ℹ️ Auto-import not eligible: ${result.message}`);

            // Show error notification for eligibility issues
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #f59e0b;
                color: white;
                padding: 16px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
                z-index: 10001;
                animation: slideInRight 0.3s ease-out;
                font-weight: 600;
                max-width: 400px;
            `;
            notification.innerHTML = `
                <div style="display: flex; align-items: center;">
                    <i class="fas fa-info-circle" style="margin-right: 8px; color: #fbbf24;"></i>
                    <span>${result.message}</span>
                </div>
            `;

            document.body.appendChild(notification);

            // Remove notification after 5 seconds (longer for error messages)
            setTimeout(() => {
                notification.remove();
            }, 5000);
        }

        return result;

    } catch (error) {
        console.error('Error auto-importing quotes:', error);
        return {
            success: false,
            message: `Error: ${error.message}`,
            imported: 0
        };
    }
}

// Check if lead is eligible for auto-import
async function checkAutoImportEligibility(leadId) {
    console.log(`🔍 Checking auto-import eligibility for lead ${leadId}`);

    try {
        const response = await fetch(`/api/quotes/${leadId}`);
        if (!response.ok) {
            return { eligible: false, reason: 'Could not fetch lead quotes' };
        }

        const result = await response.json();
        const quotes = result.quotes || [];

        if (quotes.length < 2) {
            return { eligible: false, reason: 'Need at least 2 quotes' };
        }

        // Check if at least one quote matches carriers that ALREADY EXIST in market database
        let existingCarriers = [];
        try {
            const marketResponse = await fetch('/api/market-quotes');
            if (marketResponse.ok) {
                const marketQuotes = await marketResponse.json();
                existingCarriers = [...new Set(marketQuotes.map(q => q.carrier))];
            }
        } catch (error) {
            console.error('Error fetching existing market carriers:', error);
            return { eligible: false, reason: 'Error checking existing market carriers' };
        }

        // EXCEPTION: If market is empty, allow any 2+ quotes to import freely
        if (existingCarriers.length === 0) {
            return {
                eligible: true,
                totalQuotes: quotes.length,
                matchingQuotes: quotes.length,
                carriers: quotes.map(q => q.insuranceCarrier),
                freshMarket: true
            };
        }

        const matchingQuotes = quotes.filter(quote =>
            existingCarriers.includes(quote.insuranceCarrier)
        );

        if (matchingQuotes.length === 0) {
            return { eligible: false, reason: `No quotes match existing market carriers. Available: ${existingCarriers.join(', ')}` };
        }

        return {
            eligible: true,
            totalQuotes: quotes.length,
            matchingQuotes: matchingQuotes.length,
            carriers: matchingQuotes.map(q => q.insuranceCarrier)
        };

    } catch (error) {
        console.error('Error checking eligibility:', error);
        return { eligible: false, reason: 'Error checking eligibility' };
    }
}

console.log('✅ Market functions loaded successfully');