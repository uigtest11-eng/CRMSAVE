/**
 * App Submissions - View and manage trucking insurance application submissions
 */

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
            <div style="color: #ef4444; font-size: 48px; margin-bottom: 20px;">
                <div class="loading-spinner" style="
                    width: 40px;
                    height: 40px;
                    border: 4px solid #e5e7eb;
                    border-top: 4px solid #ef4444;
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

class AppSubmissions {
    constructor() {
        this.submissions = [];
        this.loadSubmissions();
    }

    async loadSubmissions() {
        // Try to load from server first
        try {
            const API_URL = window.VANGUARD_API_URL || (window.location.hostname === 'localhost'
                ? 'http://localhost:3001'
                : `http://${window.location.hostname}:3001`);
            const response = await fetch(`${API_URL}/api/app-submissions`);

            if (response.ok) {
                this.submissions = await response.json();
                console.log('Loaded App Submissions from server:', this.submissions.length);

                // Update localStorage cache
                localStorage.setItem('appSubmissions', JSON.stringify(this.submissions));
                return;
            }
        } catch (error) {
            console.error('Failed to load submissions from server:', error);
        }

        // Fallback to localStorage
        this.submissions = JSON.parse(localStorage.getItem('appSubmissions') || '[]');
        console.log('Loaded App Submissions from localStorage (fallback):', this.submissions.length);
    }

    saveSubmissions() {
        localStorage.setItem('appSubmissions', JSON.stringify(this.submissions));
    }

    async showSubmissionsModal() {
        await this.loadSubmissions();

        // Remove existing modal
        const existingModal = document.getElementById('app-submissions-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal
        const modal = document.createElement('div');
        modal.id = 'app-submissions-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 9999998;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            border-radius: 12px;
            width: 95%;
            max-width: 1400px;
            max-height: 90vh;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        `;

        modalContent.innerHTML = `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; position: relative;">
                <h2 style="margin: 0; font-size: 28px; font-weight: 700;">
                    <i class="fas fa-file-contract"></i> App Submissions
                </h2>
                <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">View and manage trucking insurance application submissions</p>
                <button onclick="document.getElementById('app-submissions-modal').remove()"
                        style="position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.2); border: none; color: white; font-size: 24px; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                    ✕
                </button>
            </div>

            <div style="padding: 30px; background: #f8fafc; max-height: 70vh; overflow-y: auto;">
                ${this.generateSubmissionsList()}
            </div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    }

    generateSubmissionsList() {
        if (this.submissions.length === 0) {
            return `
                <div style="text-align: center; padding: 60px 20px; color: #6b7280;">
                    <i class="fas fa-file-contract" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i>
                    <h3 style="margin: 0 0 10px 0; color: #374151;">No App Submissions Yet</h3>
                    <p style="margin: 0;">Application submissions will appear here once saved.</p>
                </div>
            `;
        }

        return `
            <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0; color: #374151;">
                    <i class="fas fa-list"></i> ${this.submissions.length} Application${this.submissions.length !== 1 ? 's' : ''} Submitted
                </h3>
                <div style="display: flex; gap: 10px;">
                    <button onclick="appSubmissions.exportSubmissions()" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 12px;">
                        <i class="fas fa-download"></i> Export All
                    </button>
                    <button onclick="appSubmissions.loadSubmissions(); appSubmissions.showSubmissionsModal()" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 12px;">
                        <i class="fas fa-sync"></i> Refresh
                    </button>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 20px;">
                ${this.submissions.map(submission => this.generateSubmissionCard(submission)).join('')}
            </div>
        `;
    }

    generateSubmissionCard(submission) {
        const data = submission.formData || {};
        const submittedDate = new Date(submission.submittedDate).toLocaleString();

        const statusColor = {
            'saved': '#f59e0b',
            'submitted': '#3b82f6',
            'reviewed': '#10b981',
            'approved': '#059669',
            'denied': '#ef4444'
        }[submission.status] || '#6b7280';

        return `
            <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border-left: 4px solid ${statusColor};">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                    <div>
                        <h4 style="margin: 0 0 5px 0; color: #1f2937; font-size: 16px;">
                            ${data.insuredName || 'Trucking Application'}
                        </h4>
                        <p style="margin: 0; color: #6b7280; font-size: 12px;">
                            ID: ${submission.id}
                        </p>
                    </div>
                    <span style="background: ${statusColor}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase;">
                        ${submission.status}
                    </span>
                </div>

                <div style="margin-bottom: 15px; font-size: 13px; color: #374151;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                        <div><strong>DOT #:</strong> ${data.usDotNumber || 'N/A'}</div>
                        <div><strong>MC #:</strong> ${data.mcNumber || 'N/A'}</div>
                    </div>
                    <div style="margin-bottom: 8px;"><strong>Email:</strong> ${data.email || 'N/A'}</div>
                    <div><strong>Phone:</strong> ${data.businessPhone || 'N/A'}</div>
                </div>

                <div style="margin-bottom: 15px; padding: 10px; background: #f3f4f6; border-radius: 8px; font-size: 12px;">
                    <div style="color: #6b7280; margin-bottom: 2px;">Submitted:</div>
                    <div style="color: #374151; font-weight: 600;">${submittedDate}</div>
                </div>

                <div style="display: flex; gap: 8px;">
                    <button onclick="appSubmissions.viewSubmission('${submission.id}')"
                            style="flex: 1; background: #667eea; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button onclick="appSubmissions.downloadSubmission('${submission.id}')"
                            style="background: #10b981; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">
                        <i class="fas fa-download"></i> PDF
                    </button>
                    <button onclick="appSubmissions.deleteSubmission('${submission.id}')"
                            style="background: #ef4444; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    async viewSubmission(submissionId, returnContext = 'app-submissions') {
        console.log('=== viewSubmission DEBUG START ===');
        console.log('Viewing submission ID:', submissionId);
        console.log('Current submissions in memory BEFORE loadSubmissions:', this.submissions.length);

        // Check if we have the submission in memory already
        const existingSubmission = this.submissions.find(s => s.id === submissionId);
        if (existingSubmission) {
            console.log('Found submission in memory:', existingSubmission.formData?.insuredName);
            console.log('Sample field values:', {
                insuredName: existingSubmission.formData?.insuredName,
                businessPhone: existingSubmission.formData?.businessPhone,
                email: existingSubmission.formData?.email
            });
        }

        // Reload submissions to ensure we have the latest data
        await this.loadSubmissions();

        console.log('Current submissions in memory AFTER loadSubmissions:', this.submissions.length);
        console.log('Looking for submission ID:', submissionId);
        console.log('Available submissions:', this.submissions.map(s => ({ id: s.id, name: s.formData?.insuredName })));

        const submission = this.submissions.find(s => s.id === submissionId);
        if (!submission) {
            console.error('Submission not found. Available IDs:', this.submissions.map(s => s.id));
            alert(`Submission not found. ID: ${submissionId}\nAvailable submissions: ${this.submissions.length}`);
            return;
        }

        console.log('Found submission for viewing:', submission.formData?.insuredName);
        console.log('Submission form data keys:', Object.keys(submission.formData || {}));
        console.log('=== viewSubmission DEBUG END ===');

        // Close submissions modal
        const submissionsModal = document.getElementById('app-submissions-modal');
        if (submissionsModal) {
            submissionsModal.remove();
        }

        // Create view modal
        const modal = document.createElement('div');
        modal.id = 'submission-view-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 9999999;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            border-radius: 12px;
            width: 95%;
            max-width: 1200px;
            max-height: 90vh;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        `;

        const data = submission.formData;
        modalContent.innerHTML = `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; position: relative;">
                <h2 style="margin: 0; font-size: 24px; font-weight: 700;">
                    <i class="fas fa-file-contract"></i> Application Details
                </h2>
                <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">${data.insuredName || 'Trucking Application'} - ${submission.id}</p>
                <button onclick="document.getElementById('submission-view-modal').remove(); ${returnContext === 'app-submissions' ? 'appSubmissions.showSubmissionsModal();' : 'void(0);'}"
                        style="position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.2); border: none; color: white; font-size: 24px; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                    ✕
                </button>
            </div>

            <div style="padding: 30px; background: #f8fafc; max-height: 70vh; overflow-y: auto;">
                ${this.generateUIGFormat(submission)}
            </div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    }

    generateUIGFormat(submission) {
        const data = submission.formData;
        const submittedDate = new Date(submission.submittedDate).toLocaleString();

        // Debug: Log the actual form data to see what's missing
        console.log('Form data for submission:', submission.id);
        console.log('Available fields:', Object.keys(data));
        console.log('Sample data:', {
            usDotNumber: data.usDotNumber,
            mcNumber: data.mcNumber,
            yearsInBusiness: data.yearsInBusiness,
            haulForHirePercent: data.haulForHirePercent,
            miles0to100: data.miles0to100,
            dryVanPercent: data.dryVanPercent
        });

        return `
            <style>
                .uig-view {
                    font-family: Arial, sans-serif;
                    font-size: 12px;
                    line-height: 1.4;
                    color: #000;
                    background: white;
                    padding: 20px;
                    border: 1px solid #ddd;
                }
                .uig-view-header {
                    text-align: center;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #000;
                    padding-bottom: 10px;
                }
                .uig-view-section {
                    margin-bottom: 20px;
                    border: 1px solid #000;
                }
                .uig-view-section-title {
                    background: #000;
                    color: white;
                    padding: 5px 10px;
                    font-weight: bold;
                    font-size: 12px;
                    text-transform: uppercase;
                    margin: 0;
                }
                .uig-view-section-content {
                    padding: 10px;
                }
                .uig-view-row {
                    margin-bottom: 8px;
                }
                .uig-view-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 10px 0;
                }
                .uig-view-table th, .uig-view-table td {
                    border: 1px solid #000;
                    padding: 4px 6px;
                    text-align: left;
                    font-size: 10px;
                }
                .uig-view-table th {
                    background: #f0f0f0;
                    font-weight: bold;
                }
                @media print {
                    body {
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .no-print { display: none !important; }
                    .uig-view-section-title {
                        background: #000 !important;
                        color: white !important;
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .uig-view-table th {
                        background: #f0f0f0 !important;
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .uig-view-header {
                        border-bottom: 2px solid #000 !important;
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .uig-view-section {
                        border: 1px solid #000 !important;
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            </style>

            <div class="uig-view">
                <!-- Header -->
                <div class="uig-view-header">
                    <h1 style="font-size: 16px; font-weight: bold; margin: 0 0 5px 0;">VANGUARD INSURANCE GROUP LLC</h1>
                    <p style="margin: 2px 0; font-size: 10px;">Brunswick, OH 44212 • 330-241-7570 • Grant@Vigagency.com</p>
                    <h2 style="font-size: 14px; margin: 10px 0 0 0; text-decoration: underline;">TRUCKING APPLICATION</h2>
                    <p style="margin: 10px 0 0 0; font-size: 10px; color: #666;">
                        <strong>Submitted:</strong> ${submittedDate} | <strong>Status:</strong> ${submission.status.toUpperCase()}
                    </p>
                </div>

                <!-- General Information -->
                <div class="uig-view-section">
                    <h3 class="uig-view-section-title">GENERAL INFORMATION</h3>
                    <div class="uig-view-section-content">
                        <div class="uig-view-row"><strong>Effective Date:</strong> ${data.effectiveDate || ''}</div>
                        <div class="uig-view-row"><strong>Insured's Name including DBA:</strong> ${data.insuredName || ''}</div>
                        <div class="uig-view-row"><strong>Mailing Address:</strong> ${data.mailingAddress || ''}</div>
                        <div class="uig-view-row"><strong>Business Phone:</strong> ${data.businessPhone || ''} | <strong>Email:</strong> ${data.email || ''}</div>
                        <div class="uig-view-row"><strong>US DOT #:</strong> ${data.usDotNumber || ''} | <strong>MC#:</strong> ${data.mcNumber || ''} | <strong>Yrs. In Business:</strong> ${data.yearsInBusiness || ''}</div>
                    </div>
                </div>

                <!-- Owner/Principal -->
                <div class="uig-view-section">
                    <h3 class="uig-view-section-title">OWNER/PRINCIPAL</h3>
                    <div class="uig-view-section-content">
                        <div class="uig-view-row"><strong>Owner's Name:</strong> ${data.ownerName || ''}</div>
                    </div>
                </div>

                <!-- Description of Operation -->
                <div class="uig-view-section">
                    <h3 class="uig-view-section-title">DESCRIPTION OF OPERATION</h3>
                    <div class="uig-view-section-content">
                        <div class="uig-view-row">
                            <strong>Haul for Hire:</strong> ${data.haulForHirePercent || ''}% |
                            <strong>Non-Trucking:</strong> ${data.nonTruckingPercent || ''}% |
                            <strong>Other:</strong> ${data.otherPercent || ''}%
                        </div>
                        <h4 style="margin: 15px 0 5px 0; font-weight: bold;">PERCENTAGE OF LOADS</h4>
                        <div class="uig-view-row">
                            <strong>0-100 miles:</strong> ${data.miles0to100 || ''}% |
                            <strong>101-300 miles:</strong> ${data.miles101to300 || ''}% |
                            <strong>301-500 miles:</strong> ${data.miles301to500 || ''}% |
                            <strong>500+ miles:</strong> ${data.miles500plus || ''}%
                        </div>
                        <h4 style="margin: 15px 0 5px 0; font-weight: bold;">CLASS OF RISK</h4>
                        <div class="uig-view-row">
                            <strong>Dry Van:</strong> ${data.dryVanPercent || ''}% |
                            <strong>Dump Truck:</strong> ${data.dumpTruckPercent || ''}% |
                            <strong>Flat Bed:</strong> ${data.flatBedPercent || ''}% |
                            <strong>Reefer:</strong> ${data.reeferPercent || ''}% |
                            <strong>Hopper-Bottom Trailer:</strong> ${data.hopperBottomPercent || ''}%
                        </div>
                    </div>
                </div>

                <!-- Insurance History -->
                <div class="uig-view-section">
                    <h3 class="uig-view-section-title">INSURANCE HISTORY</h3>
                    <div class="uig-view-section-content">
                        <table class="uig-view-table">
                            <tr>
                                <th>Coverage Type</th>
                                <th>Expiration Date</th>
                                <th>Prior Carrier Effective Dates</th>
                                <th>Prior Carrier Name</th>
                                <th>Limits</th>
                                <th>Premium</th>
                            </tr>
                            <tr>
                                <td>${data.priorCoverageType1 || ''}</td>
                                <td>${data.priorExpirationDate1 || ''}</td>
                                <td>${data.priorEffectiveDates1 || ''}</td>
                                <td>${data.priorCarrierName1 || ''}</td>
                                <td>${data.priorLimits1 || ''}</td>
                                <td>${data.priorPremium1 || ''}</td>
                            </tr>
                            <tr>
                                <td>${data.priorCoverageType2 || ''}</td>
                                <td>${data.priorExpirationDate2 || ''}</td>
                                <td>${data.priorEffectiveDates2 || ''}</td>
                                <td>${data.priorCarrierName2 || ''}</td>
                                <td>${data.priorLimits2 || ''}</td>
                                <td>${data.priorPremium2 || ''}</td>
                            </tr>
                        </table>
                    </div>
                </div>

                <!-- Commodities -->
                <div class="uig-view-section">
                    <h3 class="uig-view-section-title">COMMODITIES</h3>
                    <div class="uig-view-section-content">
                        <table class="uig-view-table">
                            <tr>
                                <th>Commodity</th>
                                <th>%</th>
                            </tr>
                            <tr>
                                <td>${data.commodity1 || ''}</td>
                                <td>${data.commodityPercent1 || ''}%</td>
                            </tr>
                            <tr>
                                <td>${data.commodity2 || ''}</td>
                                <td>${data.commodityPercent2 || ''}%</td>
                            </tr>
                            <tr>
                                <td>${data.commodity3 || ''}</td>
                                <td>${data.commodityPercent3 || ''}%</td>
                            </tr>
                            <tr>
                                <td>${data.commodity4 || ''}</td>
                                <td>${data.commodityPercent4 || ''}%</td>
                            </tr>
                        </table>
                    </div>
                </div>

                <!-- Drivers Information -->
                <div class="uig-view-section">
                    <h3 class="uig-view-section-title">DRIVERS INFORMATION</h3>
                    <div class="uig-view-section-content">
                        <table class="uig-view-table">
                            <tr>
                                <th>Driver Name</th>
                                <th>DOB</th>
                                <th>License #</th>
                                <th>License State</th>
                                <th>Hire Date</th>
                                <th>Years of Experience</th>
                                <th>Violations</th>
                            </tr>
                            ${Array.from({length: 25}, (_, i) => i + 1).map(i => {
                                // Debug logging for first few drivers
                                if (i <= 3) {
                                    console.log(`Driver ${i} data:`, {
                                        name: `"${data[`driver${i}Name`]}"`,
                                        dob: `"${data[`driver${i}DOB`]}"`,
                                        license: `"${data[`driver${i}License`]}"`,
                                        state: `"${data[`driver${i}State`]}"`,
                                        hireDate: `"${data[`driver${i}HireDate`]}"`,
                                        experience: `"${data[`driver${i}Experience`]}"`,
                                        violations: `"${data[`driver${i}Violations`]}"`
                                    });
                                }

                                // Helper function to check if value has meaningful content
                                const hasContent = (value) => {
                                    if (!value) return false;
                                    const trimmed = value.toString().trim().toLowerCase();
                                    return trimmed &&
                                           trimmed !== '0' &&
                                           trimmed !== 'none' &&
                                           trimmed !== 'n/a' &&
                                           trimmed !== 'na' &&
                                           trimmed !== 'null' &&
                                           trimmed !== 'undefined';
                                };

                                return (hasContent(data[`driver${i}Name`]) || hasContent(data[`driver${i}DOB`]) ||
                                        hasContent(data[`driver${i}License`]) || hasContent(data[`driver${i}State`]) ||
                                        hasContent(data[`driver${i}HireDate`]) || hasContent(data[`driver${i}Experience`]) ||
                                        hasContent(data[`driver${i}Violations`])) ? `
                                <tr>
                                    <td>${data[`driver${i}Name`] || ''}</td>
                                    <td>${data[`driver${i}DOB`] || ''}</td>
                                    <td>${data[`driver${i}License`] || ''}</td>
                                    <td>${data[`driver${i}State`] || ''}</td>
                                    <td>${data[`driver${i}HireDate`] || ''}</td>
                                    <td>${data[`driver${i}Experience`] || ''}</td>
                                    <td>${data[`driver${i}Violations`] || ''}</td>
                                </tr>
                            ` : ''
                            }).join('')}
                            ${!Array.from({length: 25}, (_, i) => i + 1).some(i => {
                                const hasContent = (value) => {
                                    if (!value) return false;
                                    const trimmed = value.toString().trim().toLowerCase();
                                    return trimmed &&
                                           trimmed !== '0' &&
                                           trimmed !== 'none' &&
                                           trimmed !== 'n/a' &&
                                           trimmed !== 'na' &&
                                           trimmed !== 'null' &&
                                           trimmed !== 'undefined';
                                };
                                return hasContent(data[`driver${i}Name`]) || hasContent(data[`driver${i}DOB`]) ||
                                       hasContent(data[`driver${i}License`]) || hasContent(data[`driver${i}State`]) ||
                                       hasContent(data[`driver${i}HireDate`]) || hasContent(data[`driver${i}Experience`]) ||
                                       hasContent(data[`driver${i}Violations`]);
                            }) ? '<tr><td colspan="7" style="text-align: center; color: #999;">No driver information provided</td></tr>' : ''}
                        </table>
                    </div>
                </div>

                <!-- Schedule of Autos -->
                <div class="uig-view-section">
                    <h3 class="uig-view-section-title">SCHEDULE OF AUTOS</h3>
                    <div class="uig-view-section-content">
                        <table class="uig-view-table">
                            <tr>
                                <th>Year</th>
                                <th>Make/Model</th>
                                <th>Type of Truck</th>
                                <th>Trailer Type</th>
                                <th>VIN</th>
                                <th>Value</th>
                                <th>Radius</th>
                            </tr>
                            ${Array.from({length: 35}, (_, i) => i + 1).map(i =>
                                (data[`vehicle${i}Year`]?.trim() || data[`vehicle${i}Make`]?.trim() || data[`vehicle${i}Type`]?.trim() ||
                                 data[`vehicle${i}TrailerType`]?.trim() || data[`vehicle${i}VIN`]?.trim() || data[`vehicle${i}Value`]?.trim() ||
                                 data[`vehicle${i}Radius`]?.trim()) ? `
                                <tr>
                                    <td>${data[`vehicle${i}Year`] || ''}</td>
                                    <td>${data[`vehicle${i}Make`] || ''}</td>
                                    <td>${data[`vehicle${i}Type`] || ''}</td>
                                    <td>${data[`vehicle${i}TrailerType`] || ''}</td>
                                    <td>${data[`vehicle${i}VIN`] || ''}</td>
                                    <td>${data[`vehicle${i}Value`] || ''}</td>
                                    <td>${data[`vehicle${i}Radius`] || ''}</td>
                                </tr>
                            ` : ''
                            ).join('')}
                            ${!Array.from({length: 35}, (_, i) => i + 1).some(i =>
                                data[`vehicle${i}Year`]?.trim() || data[`vehicle${i}Make`]?.trim() || data[`vehicle${i}Type`]?.trim() ||
                                data[`vehicle${i}TrailerType`]?.trim() || data[`vehicle${i}VIN`]?.trim() || data[`vehicle${i}Value`]?.trim() ||
                                data[`vehicle${i}Radius`]?.trim()
                            ) ? '<tr><td colspan="7" style="text-align: center; color: #999;">No vehicle information provided</td></tr>' : ''}
                        </table>
                    </div>
                </div>

                <!-- Coverages -->
                <div class="uig-view-section">
                    <h3 class="uig-view-section-title">COVERAGES</h3>
                    <div class="uig-view-section-content">
                        <div class="uig-view-row"><strong>Auto Liability:</strong> ${data.autoLiability || ''} | <strong>Medical Payments:</strong> ${data.medicalPayments || ''}</div>
                        <div class="uig-view-row"><strong>Comprehensive Deductible:</strong> ${data.comprehensiveDeductible || ''} | <strong>Collision Deductible:</strong> ${data.collisionDeductible || ''}</div>
                        <div class="uig-view-row"><strong>General Liability:</strong> ${data.generalLiability || ''}</div>
                        <div class="uig-view-row"><strong>Cargo Limit:</strong> ${data.cargoLimit || ''} | <strong>Deductible:</strong> ${data.cargoDeductible || ''}</div>
                        <div class="uig-view-row"><strong>Roadside Assistance:</strong> ${data.roadsideAssistance || ''}</div>
                    </div>
                </div>

                <!-- Additional Interests -->
                <div class="uig-view-section">
                    <h3 class="uig-view-section-title">ADDITIONAL INTERESTS</h3>
                    <div class="uig-view-section-content">
                        <p style="margin: 0 0 10px 0; font-size: 10px;"><strong>AI</strong>-Additional insured &nbsp;&nbsp; <strong>LP</strong>-Loss Payee &nbsp;&nbsp; <strong>AL</strong>-Additional Insured & Loss Payee</p>
                        <table class="uig-view-table">
                            <tr>
                                <th>Name & Address</th>
                                <th>Type</th>
                                <th>% Interest</th>
                            </tr>
                            <tr>
                                <td>${data.additionalInterestName1 || ''}<br/>${data.additionalInterestAddress1 || ''}</td>
                                <td>${data.additionalInterestType1 || ''}</td>
                                <td>${data.additionalInterestPercent1 || ''}%</td>
                            </tr>
                        </table>
                    </div>
                </div>

                <div class="no-print" style="margin-top: 30px; text-align: center;">
                    <button onclick="event.stopPropagation(); event.stopImmediatePropagation(); appSubmissions.outputSubmission('${submission.id}'); return false;" style="background: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; margin-right: 10px;">
                        <i class="fas fa-file-alt"></i> Output PDF
                    </button>
                    <button onclick="appSubmissions.updateStatus('${submission.id}')" style="background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; margin-right: 10px;">
                        <i class="fas fa-edit"></i> Update Status
                    </button>
                    <button onclick="appSubmissions.editSubmission('${submission.id}')" style="background: #f59e0b; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer;">
                        <i class="fas fa-pen"></i> Edit
                    </button>
                </div>
            </div>
        `;
    }

    updateStatus(submissionId) {
        const submission = this.submissions.find(s => s.id === submissionId);
        if (!submission) return;

        const newStatus = prompt('Enter new status (saved, submitted, reviewed, approved, denied):', submission.status);
        if (newStatus && ['saved', 'submitted', 'reviewed', 'approved', 'denied'].includes(newStatus)) {
            submission.status = newStatus;
            this.saveSubmissions();

            // Refresh the view
            this.viewSubmission(submissionId);
        }
    }

    editSubmission(submissionId) {
        const submission = this.submissions.find(s => s.id === submissionId);
        if (!submission) {
            alert('Submission not found');
            return;
        }

        // Close the current modal first
        const currentModal = document.getElementById('submission-view-modal');
        if (currentModal) {
            currentModal.remove();
        }

        // Ensure the formData has the required structure for the form generator
        const formData = submission.formData || {};

        // Create drivers array if it doesn't exist, populated from individual driver fields
        if (!formData.drivers) {
            formData.drivers = [];
            // Create 25 drivers, populating from saved individual fields if they exist
            for (let i = 0; i < 25; i++) {
                const driverNum = i + 1;
                formData.drivers.push({
                    name: formData[`driver${driverNum}Name`] || '',
                    dateOfBirth: formData[`driver${driverNum}DOB`] || '',
                    licenseNumber: formData[`driver${driverNum}License`] || '',
                    state: formData[`driver${driverNum}State`] || '',
                    yearsExperience: formData[`driver${driverNum}Experience`] || '',
                    dateOfHire: formData[`driver${driverNum}HireDate`] || '',
                    accidentsViolations: formData[`driver${driverNum}Violations`] || '0'
                });
            }
        }

        // Create vehicles array if it doesn't exist, populated from individual vehicle fields
        if (!formData.vehicles) {
            formData.vehicles = [];
            // Create 35 vehicles, populating from saved individual fields if they exist
            for (let i = 0; i < 35; i++) {
                const vehicleNum = i + 1;
                formData.vehicles.push({
                    year: formData[`vehicle${vehicleNum}Year`] || '',
                    makeModel: formData[`vehicle${vehicleNum}Make`] || '',
                    truckType: formData[`vehicle${vehicleNum}Type`] || '',
                    trailerType: formData[`vehicle${vehicleNum}TrailerType`] || '',
                    vin: formData[`vehicle${vehicleNum}VIN`] || '',
                    value: formData[`vehicle${vehicleNum}Value`] || '',
                    radius: formData[`vehicle${vehicleNum}Radius`] || ''
                });
            }
        }

        // Create an application object that matches exactly what QuoteApplication expects
        const application = {
            id: submission.id, // Use the submission ID so it updates the same one
            leadId: submission.leadId || submission.id,
            created: submission.submittedDate,
            status: 'editing',
            formData: formData
        };

        // Debug logging to check the data structure
        console.log('Editing submission data:', submission);
        console.log('Application object for form:', application);
        console.log('Form data with arrays:', application.formData);

        // Store reference to the submission being edited BEFORE opening the form
        window.editingSubmissionId = submissionId;

        // Use the exact same method as createQuoteApplication: QuoteApplication.showApplicationModal
        if (typeof QuoteApplication !== 'undefined' && window.QuoteApplication) {
            try {
                const app = new QuoteApplication();

                // Validate the application object before passing it
                if (!application.formData) {
                    console.error('No formData found in application object');
                    alert('No form data found for this submission. Cannot edit.');
                    window.editingSubmissionId = null;
                    return;
                }

                app.showApplicationModal(application); // This is the EXACT same form as when creating new

                console.log('Editing submission using QuoteApplication.showApplicationModal:', submissionId);
            } catch (error) {
                console.error('Error opening application for editing:', error);
                console.error('Error details:', error.stack);
                alert('Error opening application for editing: ' + error.message + '\nCheck console for details.');
                window.editingSubmissionId = null; // Clear flag on error
            }
        } else {
            console.error('QuoteApplication not available:', typeof QuoteApplication, typeof window.QuoteApplication);
            alert('Quote Application editor not available. Please refresh the page.');
            window.editingSubmissionId = null; // Clear flag on error
        }
    }

    async deleteSubmission(submissionId) {
        if (confirm('Are you sure you want to delete this application submission?')) {
            // Show loading overlay for deletion
            showLoadingOverlay('Deleting Application', 'Please wait while we remove the application submission...');

            try {
                // Delete from server first
                const API_URL = window.VANGUARD_API_URL || (window.location.hostname === 'localhost'
                ? 'http://localhost:3001'
                : `http://${window.location.hostname}:3001`);
                const response = await fetch(`${API_URL}/api/app-submissions/${submissionId}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    console.warn('Server deletion failed, proceeding with local deletion');
                }

                // Delete from local storage
                this.submissions = this.submissions.filter(s => s.id !== submissionId);
                this.saveSubmissions();

                // Refresh the current view
                if (document.getElementById('app-submissions-modal')) {
                    this.showSubmissionsModal();
                }

                // Refresh lead profile if it's open
                const leadProfile = document.querySelector('.lead-details');
                if (leadProfile) {
                    // Trigger a refresh of the app submissions section in the lead profile
                    const appSubmissionsContainer = document.getElementById('app-submissions-container');
                    if (appSubmissionsContainer && window.generateAppSubmissionsHTML) {
                        // Get current lead data and refresh
                        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                        const currentLead = leads.find(l => leadProfile.querySelector('h2')?.textContent?.includes(l.name));
                        if (currentLead) {
                            // Show loading state first
                            appSubmissionsContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #6b7280;"><i class="fas fa-spinner fa-spin"></i> Loading quote applications...</div>';

                            // Load async
                            window.generateAppSubmissionsHTML(currentLead).then(html => {
                                appSubmissionsContainer.innerHTML = html;
                            }).catch(error => {
                                console.error('Error loading app submissions:', error);
                                appSubmissionsContainer.innerHTML = '<div style="color: #dc2626; text-align: center; padding: 20px;">Error loading quote applications</div>';
                            });
                        }
                    }
                }

                hideLoadingOverlay(); // Hide loading on success
                console.log('Application submission deleted:', submissionId);
            } catch (error) {
                hideLoadingOverlay(); // Hide loading on error
                console.error('Error deleting submission:', error);
                alert('Error deleting submission. Please try again.');
            }
        }
    }

    exportSubmissions() {
        if (this.submissions.length === 0) {
            alert('No submissions to export');
            return;
        }

        const csvContent = this.generateCSV();
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `app-submissions-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    generateCSV() {
        const headers = [
            'Submission ID', 'Application ID', 'Submitted Date', 'Status', 'Insured Name',
            'US DOT', 'MC Number', 'Email', 'Phone', 'Years in Business'
        ];

        const rows = this.submissions.map(submission => {
            const data = submission.formData;
            return [
                submission.id,
                submission.applicationId,
                submission.submittedDate,
                submission.status,
                data.insuredName || '',
                data.usDotNumber || '',
                data.mcNumber || '',
                data.email || '',
                data.businessPhone || '',
                data.yearsInBusiness || ''
            ].map(field => `"${field}"`).join(',');
        });

        return [headers.join(','), ...rows].join('\n');
    }

    outputSubmission(submissionId) {
        const submission = this.submissions.find(s => s.id === submissionId);
        if (!submission) {
            alert('Submission not found');
            return;
        }

        // Create a printable version in a new window
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Trucking Application - ${submission.formData.insuredName || submission.id}</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            margin: 20px;
                            font-size: 12px;
                            line-height: 1.4;
                            color: #000;
                        }
                        .uig-view {
                            background: white;
                            padding: 20px;
                        }
                        .uig-view-header {
                            text-align: center;
                            margin-bottom: 20px;
                            border-bottom: 2px solid #000;
                            padding-bottom: 10px;
                        }
                        .uig-view-section {
                            margin-bottom: 20px;
                            border: 1px solid #000;
                        }
                        .uig-view-section-title {
                            background: #000;
                            color: white;
                            padding: 5px 10px;
                            font-weight: bold;
                            font-size: 12px;
                            text-transform: uppercase;
                            margin: 0;
                        }
                        .uig-view-section-content {
                            padding: 10px;
                        }
                        .uig-view-row {
                            margin-bottom: 8px;
                        }
                        .uig-view-table {
                            width: 100%;
                            border-collapse: collapse;
                            margin: 10px 0;
                        }
                        .uig-view-table th, .uig-view-table td {
                            border: 1px solid #000;
                            padding: 4px 6px;
                            text-align: left;
                            font-size: 10px;
                        }
                        .uig-view-table th {
                            background: #f0f0f0;
                            font-weight: bold;
                        }
                        @media print {
                            body {
                                margin: 0;
                                -webkit-print-color-adjust: exact !important;
                                color-adjust: exact !important;
                                print-color-adjust: exact !important;
                            }
                            .no-print { display: none !important; }
                            .uig-view-section-title {
                                background: #000 !important;
                                color: white !important;
                                -webkit-print-color-adjust: exact !important;
                                color-adjust: exact !important;
                                print-color-adjust: exact !important;
                            }
                            .uig-view-table th {
                                background: #f0f0f0 !important;
                                -webkit-print-color-adjust: exact !important;
                                color-adjust: exact !important;
                                print-color-adjust: exact !important;
                            }
                            .uig-view-header {
                                border-bottom: 2px solid #000 !important;
                                -webkit-print-color-adjust: exact !important;
                                color-adjust: exact !important;
                                print-color-adjust: exact !important;
                            }
                            .uig-view-section {
                                border: 1px solid #000 !important;
                                -webkit-print-color-adjust: exact !important;
                                color-adjust: exact !important;
                                print-color-adjust: exact !important;
                            }
                        }
                    </style>
                </head>
                <body>
                    ${this.generateUIGFormat(submission)}
                    <script>
                        window.onload = function() {
                            window.print();
                            window.onafterprint = function() {
                                window.close();
                            };
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    }

    downloadSubmission(submissionId) {
        const submission = this.submissions.find(s => s.id === submissionId);
        if (!submission) return;

        // Create a viewable version
        const viewWindow = window.open('', '_blank');
        viewWindow.document.write(`
            <html>
                <head>
                    <title>Trucking Application - ${submission.formData.insuredName || submission.id}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                        .section { margin-bottom: 20px; border: 1px solid #000; }
                        .section-title { background: #000; color: white; padding: 5px 10px; margin: 0; font-weight: bold; }
                        .section-content { padding: 10px; }
                        .row { margin-bottom: 8px; }
                        @media print {
                            body { margin: 0; }
                        }
                    </style>
                </head>
                <body>
                    ${this.generateUIGFormat(submission)}
                </body>
            </html>
        `);
        viewWindow.document.close();
    }
}

// Initialize App Submissions
const appSubmissions = new AppSubmissions();

// Export to window for global access
window.appSubmissions = appSubmissions;

// Function to show App Submissions (can be called from anywhere)
window.showAppSubmissions = function() {
    appSubmissions.showSubmissionsModal();
};

console.log('App Submissions system loaded');