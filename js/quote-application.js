// Quote Application System for Trucking Insurance
// Auto-fills application with lead data from Vicidial

class QuoteApplication {
    constructor() {
        this.applications = JSON.parse(localStorage.getItem('quoteApplications') || '[]');
    }

    // Create new application from lead data
    createApplicationFromLead(lead) {
        const application = {
            id: 'app_' + Date.now(),
            leadId: lead.id,
            created: new Date().toISOString(),
            status: 'draft',
            formData: this.populateFromLead(lead)
        };
        
        this.applications.push(application);
        this.saveApplications();
        return application;
    }

    // Populate application with lead data
    populateFromLead(lead) {
        // Extract relevant data from lead
        const dotNumber = lead.dotNumber || lead.dot || '';
        const mcNumber = lead.mcNumber || lead.mc || '';
        
        // Parse years in business from lead data
        let yearsInBusiness = '';
        if (lead.yearsInBusiness) {
            yearsInBusiness = lead.yearsInBusiness;
        } else if (lead.established) {
            const year = parseInt(lead.established);
            if (year) {
                yearsInBusiness = new Date().getFullYear() - year;
            }
        }

        return {
            // GENERAL INFORMATION
            effectiveDate: new Date().toISOString().split('T')[0],
            insuredName: lead.name || lead.contact || '',
            dba: lead.company || '',
            mailingAddress: lead.address || '',
            businessPhone: lead.phone || '',
            email: lead.email || '',
            garagingAddress: lead.garagingAddress || lead.address || '',
            usDotNumber: dotNumber,
            mcNumber: mcNumber,
            yearsInBusiness: yearsInBusiness,
            
            // OWNER/PRINCIPAL
            ownerName: lead.ownerName || lead.contact || '',
            ownerAddress: lead.ownerAddress || '',
            
            // DESCRIPTION OF OPERATION
            haulForHire: lead.haulForHire || false,
            nonTrucking: lead.nonTrucking || false,
            otherOperation: lead.otherOperation || '',
            
            // PERCENTAGE OF LOADS (by distance)
            loads0to100: lead.loads0to100 || '25',
            loads101to300: lead.loads101to300 || '25',
            loads301to500: lead.loads301to500 || '25',
            loads500plus: lead.loads500plus || '25',
            
            // CLASS OF RISK
            dryVan: lead.dryVan || '0',
            dumpTruck: lead.dumpTruck || '0',
            flatBed: lead.flatBed || '0',
            vanBuses: lead.vanBuses || '0',
            autoHauler: lead.autoHauler || '0',
            boxTruck: lead.boxTruck || '0',
            reefer: lead.reefer || '0',
            hopperBottom: lead.hopperBottom || '0',
            otherClass: lead.otherClass || '0',
            
            // INSURANCE HISTORY
            hasBeenCanceled: lead.hasBeenCanceled || false,
            priorCarriers: lead.priorCarriers || [],
            
            // COMMODITIES
            commodities: lead.commodities || [
                { commodity: '', percentOfLoads: '', maxValue: '' }
            ],
            
            // DRIVERS INFORMATION
            drivers: lead.drivers || [
                { 
                    name: '', 
                    dateOfBirth: '', 
                    licenseNumber: '', 
                    state: '', 
                    yearsExperience: '', 
                    dateOfHire: '', 
                    accidentsViolations: '0' 
                }
            ],
            
            // SCHEDULE OF AUTOS
            vehicles: lead.vehicles || [
                {
                    year: '',
                    makeModel: '',
                    truckType: '',
                    trailerType: '',
                    vin: '',
                    value: '',
                    radius: ''
                }
            ],
            
            // COVERAGES
            autoLiability: lead.autoLiability || '1000000',
            medicalPayments: lead.medicalPayments || '5000',
            uninsuredBi: lead.uninsuredBi || '25000/50000',
            uninsuredPd: lead.uninsuredPd || '25000',
            comprehensiveDeductible: lead.comprehensiveDeductible || '1000',
            collisionDeductible: lead.collisionDeductible || '1000',
            nonOwnedTrailer: lead.nonOwnedTrailer || false,
            trailerInterchange: lead.trailerInterchange || false,
            roadsideAssistance: lead.roadsideAssistance || true,
            generalLiability: lead.generalLiability || '1000000',
            cargoLimit: lead.cargoLimit || '100000',
            cargoDeductible: lead.cargoDeductible || '1000',
            
            // ADDITIONAL INTERESTS
            additionalInterests: lead.additionalInterests || []
        };
    }

    // Save application
    saveApplication(applicationId, formData) {
        const app = this.applications.find(a => a.id === applicationId);
        if (app) {
            app.formData = formData;
            app.lastModified = new Date().toISOString();
            app.status = 'completed';
            this.saveApplications();
        }
    }

    // Save to localStorage
    saveApplications() {
        localStorage.setItem('quoteApplications', JSON.stringify(this.applications));
    }

    // Get application by lead ID
    getApplicationByLeadId(leadId) {
        return this.applications.find(app => app.leadId === leadId);
    }
    
    // Show application form modal
    showApplicationModal(application) {
        console.log('showApplicationModal called with:', application);
        
        try {
            // Remove any existing modal
            const existingModal = document.getElementById('quote-application-modal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // Create modal
            const modal = document.createElement('div');
            modal.id = 'quote-application-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 9999999;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            
            const modalContent = document.createElement('div');
            modalContent.style.cssText = `
                background: white;
                border-radius: 8px;
                width: 80vw;
                height: 80vh;
                overflow-y: auto;
                position: relative;
            `;
            
            // Generate form HTML
            let formHTML = '';
            try {
                formHTML = this.generateApplicationForm(application);
            } catch (formError) {
                console.error('Error generating form:', formError);
                formHTML = '<p style="color: red;">Error generating form. Please check console.</p>';
            }
            
            modalContent.innerHTML = `
                <div style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
                    <h2 style="margin: 0; font-size: 24px;">
                        <i class="fas fa-file-alt"></i> Trucking Quote Application
                    </h2>
                    <button onclick="document.getElementById('quote-application-modal').remove()" 
                            style="position: absolute; top: 20px; right: 20px; font-size: 30px; background: none; border: none; cursor: pointer;">
                        &times;
                    </button>
                </div>
                
                <div style="padding: 20px;">
                    ${formHTML}
                    
                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        <button onclick="saveQuoteApplication('${application.id}')" 
                                style="background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                            <i class="fas fa-save"></i> Save Application
                        </button>
                        <button onclick="printQuoteApplication('${application.id}')" 
                                style="background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                            <i class="fas fa-print"></i> Print
                        </button>
                        <button onclick="document.getElementById('quote-application-modal').remove()" 
                                style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                            Cancel
                        </button>
                    </div>
                </div>
            `;
            
            modal.appendChild(modalContent);
            document.body.appendChild(modal);
            console.log('Modal added to DOM');
            
        } catch (error) {
            console.error('Error in showApplicationModal:', error);
            alert('Error showing application form. Please check console for details.');
        }
    }
    
    // Generate the application form HTML
    generateApplicationForm(application) {
        console.log('Generating form for application:', application);
        
        if (!application || !application.formData) {
            console.error('Invalid application or missing formData');
            return '<p>Error: Invalid application data</p>';
        }
        
        const data = application.formData || {};
        
        // Use a simpler form for now to avoid template literal issues
        const formHTML = [
            '<form id="quote-application-form">',
            '<div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">',
            '<h3 style="margin: 0 0 15px 0; color: #111827;">GENERAL INFORMATION</h3>',
            '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">',
            
            '<div>',
            '<label style="font-weight: 600; font-size: 12px;">Effective Date:</label>',
            '<input type="date" name="effectiveDate" value="' + (data.effectiveDate || '') + '" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">',
            '</div>',
            
            '<div>',
            '<label style="font-weight: 600; font-size: 12px;">Insured Name:</label>',
            '<input type="text" name="insuredName" value="' + (data.insuredName || '') + '" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">',
            '</div>',
            
            '<div>',
            '<label style="font-weight: 600; font-size: 12px;">Business Phone:</label>',
            '<input type="tel" name="businessPhone" value="' + (data.businessPhone || '') + '" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">',
            '</div>',
            
            '<div>',
            '<label style="font-weight: 600; font-size: 12px;">Email:</label>',
            '<input type="email" name="email" value="' + (data.email || '') + '" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">',
            '</div>',
            
            '<div>',
            '<label style="font-weight: 600; font-size: 12px;">US DOT #:</label>',
            '<input type="text" name="usDotNumber" value="' + (data.usDotNumber || '') + '" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">',
            '</div>',
            
            '<div>',
            '<label style="font-weight: 600; font-size: 12px;">MC #:</label>',
            '<input type="text" name="mcNumber" value="' + (data.mcNumber || '') + '" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">',
            '</div>',
            
            '<div>',
            '<label style="font-weight: 600; font-size: 12px;">Years in Business:</label>',
            '<input type="text" name="yearsInBusiness" value="' + (data.yearsInBusiness || '') + '" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">',
            '</div>',
            
            '<div>',
            '<label style="font-weight: 600; font-size: 12px;">Mailing Address:</label>',
            '<input type="text" name="mailingAddress" value="' + (data.mailingAddress || '') + '" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">',
            '</div>',
            
            '</div>',
            '</div>',
            '</form>'
        ].join('');
        
        return formHTML;
    }

    // Generate PDF or print view
    generatePrintView(application) {
        const data = application.formData;
        
        return `
            <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #0066cc;">Vanguard Insurance Group LLC</h1>
                    <p>Brunswick, OH 44256 • 330-460-0872</p>
                    <h2>TRUCKING APPLICATION</h2>
                </div>
                
                <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 20px;">
                    <h3 style="background: #f3f4f6; margin: -15px -15px 15px; padding: 10px;">GENERAL INFORMATION</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 5px;"><strong>Effective Date:</strong></td>
                            <td style="padding: 5px;">${data.effectiveDate || ''}</td>
                            <td style="padding: 5px;"><strong>US DOT #:</strong></td>
                            <td style="padding: 5px;">${data.usDotNumber || ''}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px;"><strong>Insured Name:</strong></td>
                            <td style="padding: 5px;">${data.insuredName || ''}</td>
                            <td style="padding: 5px;"><strong>MC #:</strong></td>
                            <td style="padding: 5px;">${data.mcNumber || ''}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px;"><strong>DBA:</strong></td>
                            <td style="padding: 5px;">${data.dba || ''}</td>
                            <td style="padding: 5px;"><strong>Years in Business:</strong></td>
                            <td style="padding: 5px;">${data.yearsInBusiness || ''}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px;"><strong>Mailing Address:</strong></td>
                            <td colspan="3" style="padding: 5px;">${data.mailingAddress || ''}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px;"><strong>Business Phone:</strong></td>
                            <td style="padding: 5px;">${data.businessPhone || ''}</td>
                            <td style="padding: 5px;"><strong>Email:</strong></td>
                            <td style="padding: 5px;">${data.email || ''}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px;"><strong>Garaging Address:</strong></td>
                            <td colspan="3" style="padding: 5px;">${data.garagingAddress || ''}</td>
                        </tr>
                    </table>
                </div>
                
                <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 20px;">
                    <h3 style="background: #f3f4f6; margin: -15px -15px 15px; padding: 10px;">OWNER/PRINCIPAL</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 5px;"><strong>Owner's Name:</strong></td>
                            <td style="padding: 5px;">${data.ownerName || ''}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px;"><strong>Home Address:</strong></td>
                            <td style="padding: 5px;">${data.ownerAddress || ''}</td>
                        </tr>
                    </table>
                </div>
                
                <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 20px;">
                    <h3 style="background: #f3f4f6; margin: -15px -15px 15px; padding: 10px;">DESCRIPTION OF OPERATION</h3>
                    <div style="margin-bottom: 10px;">
                        <label><input type="checkbox" ${data.haulForHire ? 'checked' : ''} disabled> Haul for Hire</label>
                        <label style="margin-left: 20px;"><input type="checkbox" ${data.nonTrucking ? 'checked' : ''} disabled> Non-Trucking</label>
                        <label style="margin-left: 20px;">Other: ${data.otherOperation || ''}</label>
                    </div>
                </div>
                
                <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 20px;">
                    <h3 style="background: #f3f4f6; margin: -15px -15px 15px; padding: 10px;">PERCENTAGE OF LOADS</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 5px;">0-100 miles: ${data.loads0to100 || '0'}%</td>
                            <td style="padding: 5px;">101-300 miles: ${data.loads101to300 || '0'}%</td>
                            <td style="padding: 5px;">301-500 miles: ${data.loads301to500 || '0'}%</td>
                            <td style="padding: 5px;">500+ miles: ${data.loads500plus || '0'}%</td>
                        </tr>
                    </table>
                </div>
                
                <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 20px;">
                    <h3 style="background: #f3f4f6; margin: -15px -15px 15px; padding: 10px;">CLASS OF RISK</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 5px;">Dry Van: ${data.dryVan || '0'}%</td>
                            <td style="padding: 5px;">Dump Truck: ${data.dumpTruck || '0'}%</td>
                            <td style="padding: 5px;">Flat Bed: ${data.flatBed || '0'}%</td>
                            <td style="padding: 5px;">Van/Buses: ${data.vanBuses || '0'}%</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px;">Auto Hauler: ${data.autoHauler || '0'}%</td>
                            <td style="padding: 5px;">Box Truck: ${data.boxTruck || '0'}%</td>
                            <td style="padding: 5px;">Reefer: ${data.reefer || '0'}%</td>
                            <td style="padding: 5px;">Hopper-Bottom Trailer: ${data.hopperBottom || '0'}%</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px;">Other: ${data.otherClass || '0'}%</td>
                        </tr>
                    </table>
                </div>
                
                ${data.drivers && data.drivers.length > 0 ? `
                <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 20px;">
                    <h3 style="background: #f3f4f6; margin: -15px -15px 15px; padding: 10px;">DRIVERS INFORMATION</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                        <thead>
                            <tr style="background: #f9fafb;">
                                <th style="padding: 5px; text-align: left;">Name</th>
                                <th style="padding: 5px; text-align: left;">DOB</th>
                                <th style="padding: 5px; text-align: left;">License #</th>
                                <th style="padding: 5px; text-align: left;">State</th>
                                <th style="padding: 5px; text-align: left;">Yrs Exp</th>
                                <th style="padding: 5px; text-align: left;">Hire Date</th>
                                <th style="padding: 5px; text-align: left;">Accidents</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.drivers.map(driver => `
                                <tr>
                                    <td style="padding: 5px;">${driver.name || ''}</td>
                                    <td style="padding: 5px;">${driver.dateOfBirth || ''}</td>
                                    <td style="padding: 5px;">${driver.licenseNumber || ''}</td>
                                    <td style="padding: 5px;">${driver.state || ''}</td>
                                    <td style="padding: 5px;">${driver.yearsExperience || ''}</td>
                                    <td style="padding: 5px;">${driver.dateOfHire || ''}</td>
                                    <td style="padding: 5px;">${driver.accidentsViolations || '0'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ` : ''}
                
                ${data.vehicles && data.vehicles.length > 0 ? `
                <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 20px;">
                    <h3 style="background: #f3f4f6; margin: -15px -15px 15px; padding: 10px;">SCHEDULE OF AUTOS</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                        <thead>
                            <tr style="background: #f9fafb;">
                                <th style="padding: 5px; text-align: left;">Year</th>
                                <th style="padding: 5px; text-align: left;">Make/Model</th>
                                <th style="padding: 5px; text-align: left;">Truck Type</th>
                                <th style="padding: 5px; text-align: left;">Trailer Type</th>
                                <th style="padding: 5px; text-align: left;">VIN</th>
                                <th style="padding: 5px; text-align: left;">Value</th>
                                <th style="padding: 5px; text-align: left;">Radius</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.vehicles.map(vehicle => `
                                <tr>
                                    <td style="padding: 5px;">${vehicle.year || ''}</td>
                                    <td style="padding: 5px;">${vehicle.makeModel || ''}</td>
                                    <td style="padding: 5px;">${vehicle.truckType || ''}</td>
                                    <td style="padding: 5px;">${vehicle.trailerType || ''}</td>
                                    <td style="padding: 5px;">${vehicle.vin || ''}</td>
                                    <td style="padding: 5px;">$${vehicle.value || ''}</td>
                                    <td style="padding: 5px;">${vehicle.radius || ''}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ` : ''}
                
                <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 20px;">
                    <h3 style="background: #f3f4f6; margin: -15px -15px 15px; padding: 10px;">COVERAGES</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 5px;"><strong>Auto Liability:</strong> $${data.autoLiability || ''}</td>
                            <td style="padding: 5px;"><strong>Medical Payments:</strong> $${data.medicalPayments || ''}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px;"><strong>Uninsured/Underinsured BI:</strong> ${data.uninsuredBi || ''}</td>
                            <td style="padding: 5px;"><strong>Uninsured Motorist PD:</strong> $${data.uninsuredPd || ''}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px;"><strong>Comprehensive Deductible:</strong> $${data.comprehensiveDeductible || ''}</td>
                            <td style="padding: 5px;"><strong>Collision Deductible:</strong> $${data.collisionDeductible || ''}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px;"><strong>General Liability:</strong> $${data.generalLiability || ''}</td>
                            <td style="padding: 5px;"><strong>Cargo Limit:</strong> $${data.cargoLimit || ''}</td>
                        </tr>
                    </table>
                </div>
                
                <div style="margin-top: 40px; border-top: 2px solid #333; padding-top: 20px;">
                    <table style="width: 100%;">
                        <tr>
                            <td style="width: 50%;">
                                <p><strong>Signature:</strong> _________________________________</p>
                            </td>
                            <td style="width: 50%;">
                                <p><strong>Date:</strong> _________________________________</p>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>
        `;
    }
}

// Initialize Quote Application system
const quoteAppManager = new QuoteApplication();

// Function to show Quote Application in lead profile
function showQuoteApplication(leadId) {
    // Get the lead data from both possible sources
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const insuranceLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const allLeads = [...leads, ...insuranceLeads];
    const lead = allLeads.find(l => l.id == leadId); // Use == for type coercion

    if (!lead) {
        showNotification('Lead not found', 'error');
        return;
    }
    
    // Check if application already exists
    let application = quoteAppManager.getApplicationByLeadId(leadId);
    
    // Create new application if doesn't exist
    if (!application) {
        application = quoteAppManager.createApplicationFromLead(lead);
        showNotification('Quote application created from lead data', 'success');
    }
    
    // Show application form modal
    showApplicationFormModal(application, lead);
}

// Show application form modal
function showApplicationFormModal(application, lead) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'quoteApplicationModal';
    modal.style.zIndex = '9999999';
    
    const data = application.formData;
    
    modal.innerHTML = `
        <div class="modal-container" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
            <div class="modal-header">
                <h2>Quote Application - ${lead.name || lead.contact}</h2>
                <button class="close-btn" onclick="document.getElementById('quoteApplicationModal').remove()">&times;</button>
            </div>
            <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                <div style="margin-bottom: 20px;">
                    <button class="btn-secondary" onclick="printQuoteApplication('${application.id}')">
                        <i class="fas fa-print"></i> Print
                    </button>
                    <button class="btn-secondary" onclick="exportQuoteApplication('${application.id}')">
                        <i class="fas fa-download"></i> Export
                    </button>
                    <button class="btn-primary" onclick="saveQuoteApplication('${application.id}')">
                        <i class="fas fa-save"></i> Save
                    </button>
                </div>
                
                <form id="quoteApplicationForm">
                    <!-- GENERAL INFORMATION -->
                    <fieldset style="border: 1px solid #e5e7eb; padding: 15px; margin-bottom: 20px;">
                        <legend style="font-weight: bold; color: #0066cc;">GENERAL INFORMATION</legend>
                        <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div class="form-group">
                                <label>Effective Date</label>
                                <input type="date" id="effectiveDate" value="${data.effectiveDate || ''}">
                            </div>
                            <div class="form-group">
                                <label>US DOT #</label>
                                <input type="text" id="usDotNumber" value="${data.usDotNumber || ''}">
                            </div>
                            <div class="form-group">
                                <label>Insured Name</label>
                                <input type="text" id="insuredName" value="${data.insuredName || ''}">
                            </div>
                            <div class="form-group">
                                <label>MC #</label>
                                <input type="text" id="mcNumber" value="${data.mcNumber || ''}">
                            </div>
                            <div class="form-group">
                                <label>DBA</label>
                                <input type="text" id="dba" value="${data.dba || ''}">
                            </div>
                            <div class="form-group">
                                <label>Years in Business</label>
                                <input type="number" id="yearsInBusiness" value="${data.yearsInBusiness || ''}">
                            </div>
                            <div class="form-group" style="grid-column: 1 / -1;">
                                <label>Mailing Address</label>
                                <input type="text" id="mailingAddress" value="${data.mailingAddress || ''}">
                            </div>
                            <div class="form-group">
                                <label>Business Phone</label>
                                <input type="tel" id="businessPhone" value="${data.businessPhone || ''}">
                            </div>
                            <div class="form-group">
                                <label>Email</label>
                                <input type="email" id="email" value="${data.email || ''}">
                            </div>
                            <div class="form-group" style="grid-column: 1 / -1;">
                                <label>Garaging Address</label>
                                <input type="text" id="garagingAddress" value="${data.garagingAddress || ''}">
                            </div>
                        </div>
                    </fieldset>
                    
                    <!-- OWNER/PRINCIPAL -->
                    <fieldset style="border: 1px solid #e5e7eb; padding: 15px; margin-bottom: 20px;">
                        <legend style="font-weight: bold; color: #0066cc;">OWNER/PRINCIPAL</legend>
                        <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div class="form-group">
                                <label>Owner's Name</label>
                                <input type="text" id="ownerName" value="${data.ownerName || ''}">
                            </div>
                            <div class="form-group">
                                <label>Home Address</label>
                                <input type="text" id="ownerAddress" value="${data.ownerAddress || ''}">
                            </div>
                        </div>
                    </fieldset>
                    
                    <!-- DESCRIPTION OF OPERATION -->
                    <fieldset style="border: 1px solid #e5e7eb; padding: 15px; margin-bottom: 20px;">
                        <legend style="font-weight: bold; color: #0066cc;">DESCRIPTION OF OPERATION</legend>
                        <div style="display: flex; gap: 20px; margin-bottom: 10px;">
                            <label><input type="checkbox" id="haulForHire" ${data.haulForHire ? 'checked' : ''}> Haul for Hire</label>
                            <label><input type="checkbox" id="nonTrucking" ${data.nonTrucking ? 'checked' : ''}> Non-Trucking</label>
                            <label>Other: <input type="text" id="otherOperation" value="${data.otherOperation || ''}" style="width: 200px;"></label>
                        </div>
                    </fieldset>
                    
                    <!-- PERCENTAGE OF LOADS -->
                    <fieldset style="border: 1px solid #e5e7eb; padding: 15px; margin-bottom: 20px;">
                        <legend style="font-weight: bold; color: #0066cc;">PERCENTAGE OF LOADS</legend>
                        <div class="form-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
                            <div class="form-group">
                                <label>0-100 miles (%)</label>
                                <input type="number" id="loads0to100" value="${data.loads0to100 || ''}" min="0" max="100">
                            </div>
                            <div class="form-group">
                                <label>101-300 miles (%)</label>
                                <input type="number" id="loads101to300" value="${data.loads101to300 || ''}" min="0" max="100">
                            </div>
                            <div class="form-group">
                                <label>301-500 miles (%)</label>
                                <input type="number" id="loads301to500" value="${data.loads301to500 || ''}" min="0" max="100">
                            </div>
                            <div class="form-group">
                                <label>500+ miles (%)</label>
                                <input type="number" id="loads500plus" value="${data.loads500plus || ''}" min="0" max="100">
                            </div>
                        </div>
                    </fieldset>
                    
                    <!-- CLASS OF RISK -->
                    <fieldset style="border: 1px solid #e5e7eb; padding: 15px; margin-bottom: 20px;">
                        <legend style="font-weight: bold; color: #0066cc;">CLASS OF RISK (%)</legend>
                        <div class="form-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
                            <div class="form-group">
                                <label>Dry Van</label>
                                <input type="number" id="dryVan" value="${data.dryVan || '0'}" min="0" max="100">
                            </div>
                            <div class="form-group">
                                <label>Dump Truck</label>
                                <input type="number" id="dumpTruck" value="${data.dumpTruck || '0'}" min="0" max="100">
                            </div>
                            <div class="form-group">
                                <label>Flat Bed</label>
                                <input type="number" id="flatBed" value="${data.flatBed || '0'}" min="0" max="100">
                            </div>
                            <div class="form-group">
                                <label>Van/Buses</label>
                                <input type="number" id="vanBuses" value="${data.vanBuses || '0'}" min="0" max="100">
                            </div>
                            <div class="form-group">
                                <label>Auto Hauler</label>
                                <input type="number" id="autoHauler" value="${data.autoHauler || '0'}" min="0" max="100">
                            </div>
                            <div class="form-group">
                                <label>Box Truck</label>
                                <input type="number" id="boxTruck" value="${data.boxTruck || '0'}" min="0" max="100">
                            </div>
                            <div class="form-group">
                                <label>Reefer</label>
                                <input type="number" id="reefer" value="${data.reefer || '0'}" min="0" max="100">
                            </div>
                            <div class="form-group">
                                <label>Hopper-Bottom Trailer</label>
                                <input type="number" id="hopperBottom" value="${data.hopperBottom || '0'}" min="0" max="100">
                            </div>
                            <div class="form-group">
                                <label>Other</label>
                                <input type="number" id="otherClass" value="${data.otherClass || '0'}" min="0" max="100">
                            </div>
                        </div>
                    </fieldset>

                    <!-- SCHEDULE OF AUTOS/VEHICLES -->
                    <fieldset style="border: 1px solid #e5e7eb; padding: 15px; margin-bottom: 20px;">
                        <legend style="font-weight: bold; color: #0066cc;">SCHEDULE OF AUTOS/VEHICLES</legend>
                        <div id="vehiclesContainer">
                            ${data.vehicles && data.vehicles.map((vehicle, index) => `
                                <div class="vehicle-row" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; margin-bottom: 10px;">
                                    <input type="text" placeholder="Year" value="${vehicle.year || ''}" data-field="year">
                                    <input type="text" placeholder="Make/Model" value="${vehicle.makeModel || ''}" data-field="makeModel">
                                    <input type="text" placeholder="Truck Type" value="${vehicle.truckType || ''}" data-field="truckType">
                                    <input type="text" placeholder="Trailer Type" value="${vehicle.trailerType || ''}" data-field="trailerType">
                                    <input type="text" placeholder="VIN" value="${vehicle.vin || ''}" data-field="vin">
                                    <input type="text" placeholder="Value" value="${vehicle.value || ''}" data-field="value">
                                    <input type="text" placeholder="Radius" value="${vehicle.radius || ''}" data-field="radius">
                                </div>
                            `).join('') || '<div class="vehicle-row" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; margin-bottom: 10px;"><input type="text" placeholder="Year" data-field="year"><input type="text" placeholder="Make/Model" data-field="makeModel"><input type="text" placeholder="Truck Type" data-field="truckType"><input type="text" placeholder="Trailer Type" data-field="trailerType"><input type="text" placeholder="VIN" data-field="vin"><input type="text" placeholder="Value" data-field="value"><input type="text" placeholder="Radius" data-field="radius"></div>'}
                        </div>
                        <button type="button" class="btn-secondary" onclick="addVehicleRow()">
                            <i class="fas fa-plus"></i> Add Vehicle
                        </button>
                    </fieldset>

                    <!-- DRIVERS INFORMATION -->
                    <fieldset style="border: 1px solid #e5e7eb; padding: 15px; margin-bottom: 20px;">
                        <legend style="font-weight: bold; color: #0066cc;">DRIVERS INFORMATION</legend>
                        <div id="driversContainer">
                            ${data.drivers && data.drivers.map((driver, index) => `
                                <div class="driver-row" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; margin-bottom: 10px;">
                                    <input type="text" placeholder="Name" value="${driver.name || ''}" data-field="name">
                                    <input type="date" placeholder="DOB" value="${driver.dateOfBirth || ''}" data-field="dateOfBirth">
                                    <input type="text" placeholder="License #" value="${driver.licenseNumber || ''}" data-field="licenseNumber">
                                    <input type="text" placeholder="State" value="${driver.state || ''}" data-field="state" maxlength="2">
                                    <input type="number" placeholder="Yrs Exp" value="${driver.yearsExperience || ''}" data-field="yearsExperience">
                                    <input type="date" placeholder="Hire Date" value="${driver.dateOfHire || ''}" data-field="dateOfHire">
                                    <input type="number" placeholder="Accidents" value="${driver.accidentsViolations || '0'}" data-field="accidentsViolations">
                                </div>
                            `).join('') || '<div class="driver-row" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; margin-bottom: 10px;"><input type="text" placeholder="Name" data-field="name"><input type="date" placeholder="DOB" data-field="dateOfBirth"><input type="text" placeholder="License #" data-field="licenseNumber"><input type="text" placeholder="State" data-field="state" maxlength="2"><input type="number" placeholder="Yrs Exp" data-field="yearsExperience"><input type="date" placeholder="Hire Date" data-field="dateOfHire"><input type="number" placeholder="Accidents" data-field="accidentsViolations" value="0"></div>'}
                        </div>
                        <button type="button" class="btn-secondary" onclick="addDriverRow()">
                            <i class="fas fa-plus"></i> Add Driver
                        </button>
                    </fieldset>
                    
                    <!-- COVERAGES -->
                    <fieldset style="border: 1px solid #e5e7eb; padding: 15px; margin-bottom: 20px;">
                        <legend style="font-weight: bold; color: #0066cc;">COVERAGES</legend>
                        <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div class="form-group">
                                <label>Auto Liability</label>
                                <select id="autoLiability">
                                    <option value="750000" ${data.autoLiability == '750000' ? 'selected' : ''}>$750,000</option>
                                    <option value="1000000" ${data.autoLiability == '1000000' ? 'selected' : ''}>$1,000,000</option>
                                    <option value="2000000" ${data.autoLiability == '2000000' ? 'selected' : ''}>$2,000,000</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Medical Payments</label>
                                <input type="number" id="medicalPayments" value="${data.medicalPayments || '5000'}">
                            </div>
                            <div class="form-group">
                                <label>Comprehensive Deductible</label>
                                <input type="number" id="comprehensiveDeductible" value="${data.comprehensiveDeductible || '1000'}">
                            </div>
                            <div class="form-group">
                                <label>Collision Deductible</label>
                                <input type="number" id="collisionDeductible" value="${data.collisionDeductible || '1000'}">
                            </div>
                            <div class="form-group">
                                <label>General Liability</label>
                                <select id="generalLiability">
                                    <option value="1000000" ${data.generalLiability == '1000000' ? 'selected' : ''}>$1,000,000</option>
                                    <option value="2000000" ${data.generalLiability == '2000000' ? 'selected' : ''}>$2,000,000</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Cargo Limit</label>
                                <input type="number" id="cargoLimit" value="${data.cargoLimit || '100000'}">
                            </div>
                        </div>
                    </fieldset>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="document.getElementById('quoteApplicationModal').remove()">Cancel</button>
                <button class="btn-primary" onclick="saveAndSubmitApplication('${application.id}', '${lead.id}')">
                    <i class="fas fa-check"></i> Save & Submit
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Add vehicle row
function addVehicleRow() {
    const container = document.getElementById('vehiclesContainer');
    const newRow = document.createElement('div');
    newRow.className = 'vehicle-row';
    newRow.style.cssText = 'display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; margin-bottom: 10px;';
    newRow.innerHTML = `
        <input type="text" placeholder="Year" data-field="year">
        <input type="text" placeholder="Make/Model" data-field="makeModel">
        <input type="text" placeholder="Truck Type" data-field="truckType">
        <input type="text" placeholder="Trailer Type" data-field="trailerType">
        <input type="text" placeholder="VIN" data-field="vin">
        <input type="text" placeholder="Value" data-field="value">
        <input type="text" placeholder="Radius" data-field="radius">
    `;
    container.appendChild(newRow);
}

// Add driver row
function addDriverRow() {
    const container = document.getElementById('driversContainer');
    const newRow = document.createElement('div');
    newRow.className = 'driver-row';
    newRow.style.cssText = 'display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; margin-bottom: 10px;';
    newRow.innerHTML = `
        <input type="text" placeholder="Name" data-field="name">
        <input type="date" placeholder="DOB" data-field="dateOfBirth">
        <input type="text" placeholder="License #" data-field="licenseNumber">
        <input type="text" placeholder="State" data-field="state" maxlength="2">
        <input type="number" placeholder="Yrs Exp" data-field="yearsExperience">
        <input type="date" placeholder="Hire Date" data-field="dateOfHire">
        <input type="number" placeholder="Accidents" data-field="accidentsViolations" value="0">
    `;
    container.appendChild(newRow);
}

// Save and submit application
function saveAndSubmitApplication(applicationId, leadId) {
    const formData = collectFormData();
    
    // Save application
    quoteAppManager.saveApplication(applicationId, formData);
    
    // Add to lead's quote submissions
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => l.id == leadId);
    if (lead) {
        if (!lead.quoteApplications) {
            lead.quoteApplications = [];
        }
        lead.quoteApplications.push({
            applicationId: applicationId,
            submittedDate: new Date().toISOString(),
            status: 'submitted'
        });
        localStorage.setItem('leads', JSON.stringify(leads));
    }
    
    showNotification('Quote application saved and submitted', 'success');
    document.getElementById('quoteApplicationModal').remove();
    
    // Refresh lead view if open
    if (window.viewLead) {
        viewLead(leadId);
    }
}

// Collect form data
function collectFormData() {
    const formData = {
        // General Information
        effectiveDate: document.getElementById('effectiveDate').value,
        insuredName: document.getElementById('insuredName').value,
        dba: document.getElementById('dba').value,
        mailingAddress: document.getElementById('mailingAddress').value,
        businessPhone: document.getElementById('businessPhone').value,
        email: document.getElementById('email').value,
        garagingAddress: document.getElementById('garagingAddress').value,
        usDotNumber: document.getElementById('usDotNumber').value,
        mcNumber: document.getElementById('mcNumber').value,
        yearsInBusiness: document.getElementById('yearsInBusiness').value,
        
        // Owner/Principal
        ownerName: document.getElementById('ownerName').value,
        ownerAddress: document.getElementById('ownerAddress').value,
        
        // Description of Operation
        haulForHire: document.getElementById('haulForHire').checked,
        nonTrucking: document.getElementById('nonTrucking').checked,
        otherOperation: document.getElementById('otherOperation').value,
        
        // Percentage of Loads
        loads0to100: document.getElementById('loads0to100').value,
        loads101to300: document.getElementById('loads101to300').value,
        loads301to500: document.getElementById('loads301to500').value,
        loads500plus: document.getElementById('loads500plus').value,
        
        // Class of Risk
        dryVan: document.getElementById('dryVan').value,
        dumpTruck: document.getElementById('dumpTruck').value,
        flatBed: document.getElementById('flatBed').value,
        vanBuses: document.getElementById('vanBuses').value,
        autoHauler: document.getElementById('autoHauler').value,
        boxTruck: document.getElementById('boxTruck').value,
        reefer: document.getElementById('reefer').value,
        hopperBottom: document.getElementById('hopperBottom').value,
        otherClass: document.getElementById('otherClass').value,
        
        // Vehicles
        vehicles: [],

        // Drivers
        drivers: [],
        
        // Coverages
        autoLiability: document.getElementById('autoLiability').value,
        medicalPayments: document.getElementById('medicalPayments').value,
        comprehensiveDeductible: document.getElementById('comprehensiveDeductible').value,
        collisionDeductible: document.getElementById('collisionDeductible').value,
        generalLiability: document.getElementById('generalLiability').value,
        cargoLimit: document.getElementById('cargoLimit').value
    };

    // Collect vehicle data
    const vehicleRows = document.querySelectorAll('.vehicle-row');
    vehicleRows.forEach(row => {
        const vehicle = {};
        row.querySelectorAll('input').forEach(input => {
            vehicle[input.dataset.field] = input.value;
        });
        if (vehicle.year || vehicle.makeModel) { // Add if year or make/model is provided
            formData.vehicles.push(vehicle);
        }
    });

    // Collect driver data
    const driverRows = document.querySelectorAll('.driver-row');
    driverRows.forEach(row => {
        const driver = {};
        row.querySelectorAll('input').forEach(input => {
            driver[input.dataset.field] = input.value;
        });
        if (driver.name) { // Only add if name is provided
            formData.drivers.push(driver);
        }
    });
    
    return formData;
}

// Print application
function printQuoteApplication(applicationId) {
    const application = quoteAppManager.applications.find(a => a.id === applicationId);
    if (!application) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Quote Application</title>
            <style>
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            ${quoteAppManager.generatePrintView(application)}
            <script>window.print();</script>
        </body>
        </html>
    `);
}

// Export application
function exportQuoteApplication(applicationId) {
    const application = quoteAppManager.applications.find(a => a.id === applicationId);
    if (!application) return;
    
    const html = quoteAppManager.generatePrintView(application);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quote_application_${applicationId}.html`;
    a.click();
    URL.revokeObjectURL(url);
}

// Export the class
window.QuoteApplication = QuoteApplication;

// Export functions
window.quoteAppManager = quoteAppManager;
window.showQuoteApplication = showQuoteApplication;
window.showApplicationFormModal = showApplicationFormModal;
window.saveAndSubmitApplication = saveAndSubmitApplication;
window.printQuoteApplication = printQuoteApplication;
window.exportQuoteApplication = exportQuoteApplication;
window.addDriverRow = addDriverRow;
window.addVehicleRow = addVehicleRow;

// Global helper for saving from modal
window.saveQuoteApplication = function(applicationId) {
    console.log('Saving application:', applicationId);
    
    // Get form data
    const form = document.getElementById('quote-application-form');
    if (!form) {
        alert('Form not found');
        return;
    }
    
    const formData = {};
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        if (input.name) {
            formData[input.name] = input.value;
        }
    });
    
    // Get the QuoteApplication instance and save
    const apps = JSON.parse(localStorage.getItem('quoteApplications') || '[]');
    const appIndex = apps.findIndex(a => a.id === applicationId);
    
    if (appIndex !== -1) {
        apps[appIndex].formData = formData;
        apps[appIndex].lastModified = new Date().toISOString();
        apps[appIndex].status = 'saved';
        localStorage.setItem('quoteApplications', JSON.stringify(apps));
        
        alert('Application saved successfully!');
        
        // Close modal
        const modal = document.getElementById('quote-application-modal');
        if (modal) {
            modal.remove();
        }
    }
};

console.log('Quote Application system loaded');