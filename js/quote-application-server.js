// Quote Application System with Server-side Storage
// Auto-fills application with lead data from Vicidial and saves to server

class QuoteApplicationServer {
    constructor() {
        // Use current domain for API
        this.apiUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:3001/api'
            : `http://${window.location.hostname}:3001/api`;
    }

    // Create new application from lead data
    async createApplicationFromLead(lead) {
        const application = {
            id: 'app_' + Date.now(),
            leadId: lead.id,
            created: new Date().toISOString(),
            status: 'draft',
            formData: this.populateFromLead(lead)
        };

        // Save to server
        try {
            const response = await fetch(`${this.apiUrl}/quote-submissions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    lead_id: lead.id,
                    application_id: application.id,
                    form_data: application.formData,
                    status: application.status
                })
            });

            if (response.ok) {
                const result = await response.json();
                application.server_id = result.submission_id;
                console.log('Application saved to server:', result);
            }
        } catch (error) {
            console.error('Error saving to server:', error);
        }

        return application;
    }

    // Populate application with lead data
    populateFromLead(lead) {
        const dotNumber = lead.dotNumber || lead.dot || '';
        const mcNumber = lead.mcNumber || lead.mc || '';

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

            // PERCENTAGE OF LOADS
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

            // DRIVERS
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

            // VEHICLES
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

    // Save application to server
    async saveApplication(submissionId, formData, status = 'completed') {
        try {
            const response = await fetch(`${this.apiUrl}/quote-submissions/${submissionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    form_data: formData,
                    status: status,
                    submitted_date: new Date().toISOString()
                })
            });

            if (response.ok) {
                console.log('Application updated on server');
                return true;
            }
        } catch (error) {
            console.error('Error updating application:', error);
        }
        return false;
    }

    // Get all applications for a lead
    async getApplicationsByLeadId(leadId) {
        try {
            const response = await fetch(`${this.apiUrl}/quote-submissions/${leadId}`);
            if (response.ok) {
                const data = await response.json();
                return data.submissions || [];
            }
        } catch (error) {
            console.error('Error fetching submissions:', error);
        }
        return [];
    }

    // Generate PDF content
    generatePDF(application) {
        const data = application.formData || application.form_data;

        // Create a formatted HTML for PDF generation
        const pdfContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #0066cc; text-align: center; }
                    h2 { color: #333; border-bottom: 2px solid #0066cc; padding-bottom: 5px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th { background-color: #f3f4f6; text-align: left; padding: 10px; }
                    td { padding: 8px; border-bottom: 1px solid #ddd; }
                    .section { margin-bottom: 30px; page-break-inside: avoid; }
                    .header-info { text-align: center; margin-bottom: 30px; }
                </style>
            </head>
            <body>
                <div class="header-info">
                    <h1>VANGUARD INSURANCE GROUP LLC</h1>
                    <p>Brunswick, OH 44256 • Tel: 330-460-0872</p>
                    <h2>TRUCKING QUOTE APPLICATION</h2>
                </div>

                <div class="section">
                    <h2>GENERAL INFORMATION</h2>
                    <table>
                        <tr>
                            <td><strong>Effective Date:</strong></td>
                            <td>${data.effectiveDate || ''}</td>
                            <td><strong>US DOT #:</strong></td>
                            <td>${data.usDotNumber || ''}</td>
                        </tr>
                        <tr>
                            <td><strong>Insured Name:</strong></td>
                            <td>${data.insuredName || ''}</td>
                            <td><strong>MC #:</strong></td>
                            <td>${data.mcNumber || ''}</td>
                        </tr>
                        <tr>
                            <td><strong>DBA:</strong></td>
                            <td>${data.dba || ''}</td>
                            <td><strong>Years in Business:</strong></td>
                            <td>${data.yearsInBusiness || ''}</td>
                        </tr>
                        <tr>
                            <td><strong>Mailing Address:</strong></td>
                            <td colspan="3">${data.mailingAddress || ''}</td>
                        </tr>
                        <tr>
                            <td><strong>Business Phone:</strong></td>
                            <td>${data.businessPhone || ''}</td>
                            <td><strong>Email:</strong></td>
                            <td>${data.email || ''}</td>
                        </tr>
                    </table>
                </div>

                <div class="section">
                    <h2>COVERAGES</h2>
                    <table>
                        <tr>
                            <td><strong>Auto Liability:</strong></td>
                            <td>$${data.autoLiability || ''}</td>
                            <td><strong>Medical Payments:</strong></td>
                            <td>$${data.medicalPayments || ''}</td>
                        </tr>
                        <tr>
                            <td><strong>Comprehensive Deductible:</strong></td>
                            <td>$${data.comprehensiveDeductible || ''}</td>
                            <td><strong>Collision Deductible:</strong></td>
                            <td>$${data.collisionDeductible || ''}</td>
                        </tr>
                        <tr>
                            <td><strong>General Liability:</strong></td>
                            <td>$${data.generalLiability || ''}</td>
                            <td><strong>Cargo Limit:</strong></td>
                            <td>$${data.cargoLimit || ''}</td>
                        </tr>
                    </table>
                </div>

                <div class="section" style="margin-top: 50px;">
                    <table>
                        <tr>
                            <td width="50%">
                                <p><strong>Authorized Signature:</strong> _______________________</p>
                            </td>
                            <td width="50%">
                                <p><strong>Date:</strong> _______________________</p>
                            </td>
                        </tr>
                    </table>
                </div>
            </body>
            </html>
        `;

        return pdfContent;
    }

    // Print or save as PDF
    async generateAndSavePDF(application) {
        const pdfContent = this.generatePDF(application);

        // Create a blob from the HTML content
        const blob = new Blob([pdfContent], { type: 'text/html' });

        // For now, we'll trigger a print dialog which can save as PDF
        const printWindow = window.open('', '_blank');
        printWindow.document.write(pdfContent);
        printWindow.document.close();

        setTimeout(() => {
            printWindow.print();
        }, 500);

        return blob;
    }
}

// Initialize Quote Application system
const quoteAppServerManager = new QuoteApplicationServer();

// Function to show Quote Application in lead profile
async function showQuoteApplicationServer(leadId) {
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => l.id == leadId);
    if (!lead) {
        showNotification('Lead not found', 'error');
        return;
    }

    // Check for existing applications from server
    const submissions = await quoteAppServerManager.getApplicationsByLeadId(leadId);

    let application;
    if (submissions.length > 0) {
        // Use the most recent submission
        application = submissions[0];
        showNotification('Loaded existing quote application from server', 'success');
    } else {
        // Create new application
        application = await quoteAppServerManager.createApplicationFromLead(lead);
        showNotification('Created new quote application', 'success');
    }

    // Show application form modal
    showApplicationFormModalServer(application, lead);
}

// Show application form modal with server integration
function showApplicationFormModalServer(application, lead) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'quoteApplicationModal';
    modal.style.zIndex = '10000';

    const data = application.formData || application.form_data || {};
    const submissionId = application.server_id || application.id;

    modal.innerHTML = `
        <div class="modal-container" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
            <div class="modal-header">
                <h2>Quote Application - ${lead.name || lead.contact}</h2>
                <button class="close-btn" onclick="document.getElementById('quoteApplicationModal').remove()">&times;</button>
            </div>
            <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                <div style="margin-bottom: 20px;">
                    <button class="btn-secondary" onclick="printQuoteApplicationServer('${JSON.stringify(application).replace(/'/g, "\\'")}')">
                        <i class="fas fa-print"></i> Print/Save PDF
                    </button>
                    <button class="btn-primary" onclick="saveQuoteApplicationServer('${submissionId}')">
                        <i class="fas fa-save"></i> Save to Server
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
                <button class="btn-primary" onclick="saveAndSubmitApplicationServer('${submissionId}', '${lead.id}')">
                    <i class="fas fa-check"></i> Save & Submit
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// Collect form data
function collectFormDataServer() {
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

        // Coverages
        autoLiability: document.getElementById('autoLiability').value,
        medicalPayments: document.getElementById('medicalPayments').value,
        comprehensiveDeductible: document.getElementById('comprehensiveDeductible').value,
        collisionDeductible: document.getElementById('collisionDeductible').value,
        generalLiability: document.getElementById('generalLiability').value,
        cargoLimit: document.getElementById('cargoLimit').value
    };

    return formData;
}

// Save quote application to server
async function saveQuoteApplicationServer(submissionId) {
    const formData = collectFormDataServer();

    const success = await quoteAppServerManager.saveApplication(submissionId, formData, 'saved');

    if (success) {
        showNotification('Quote application saved to server', 'success');
    } else {
        showNotification('Failed to save to server', 'error');
    }
}

// Save and submit application
async function saveAndSubmitApplicationServer(submissionId, leadId) {
    const formData = collectFormDataServer();

    // Save to server with submitted status
    const success = await quoteAppServerManager.saveApplication(submissionId, formData, 'submitted');

    if (success) {
        // Also update lead status
        try {
            await fetch(`${quoteAppServerManager.apiUrl}/leads/${leadId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    stage: 'quoted',
                    notes: 'Quote application submitted on ' + new Date().toLocaleDateString()
                })
            });
        } catch (error) {
            console.error('Error updating lead status:', error);
        }

        showNotification('Quote application submitted successfully', 'success');
        document.getElementById('quoteApplicationModal').remove();

        // Refresh lead view if open
        if (window.viewLead) {
            viewLead(leadId);
        }
    } else {
        showNotification('Failed to submit application', 'error');
    }
}

// Print quote application
function printQuoteApplicationServer(applicationJson) {
    try {
        const application = JSON.parse(applicationJson);
        quoteAppServerManager.generateAndSavePDF(application);
    } catch (error) {
        console.error('Error printing application:', error);
    }
}

// Export functions
window.QuoteApplicationServer = QuoteApplicationServer;
window.quoteAppServerManager = quoteAppServerManager;
window.showQuoteApplicationServer = showQuoteApplicationServer;
window.showApplicationFormModalServer = showApplicationFormModalServer;
window.saveQuoteApplicationServer = saveQuoteApplicationServer;
window.saveAndSubmitApplicationServer = saveAndSubmitApplicationServer;
window.printQuoteApplicationServer = printQuoteApplicationServer;
window.collectFormDataServer = collectFormDataServer;

console.log('Quote Application Server system loaded');