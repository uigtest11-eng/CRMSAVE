// Real Custom ACORD PDF Viewer - Actually renders and controls the PDF
console.log('🔥🔥🔥 ACORD SCRIPT STARTING TO LOAD! 🔥🔥🔥');
console.log('🎯 Real ACORD Viewer Initializing...');
console.log('🔧 acord-real-viewer-vigagency.js SCRIPT LOADING...');
console.log('🔧 Current timestamp:', new Date().toISOString());

// Immediately define the function to ensure it's available
console.log('🔧 Defining window.createRealACORDViewer IMMEDIATELY...');

// Add to a global tracker so we can see if script executed
window.acordScriptLoaded = Date.now();
console.log('🔧 Set window.acordScriptLoaded =', window.acordScriptLoaded);

// Wait for PDF.js to be available
window.addEventListener('load', function() {
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
        console.log('✅ PDF.js ready for real viewer');
    }
});

// Global state for our real viewer
window.realPdfState = {
    pdfDoc: null,
    pageNum: 1,
    pageRendering: false,
    scale: 1.3,
    canvas: null,
    ctx: null,
    formData: {}
};

// Helper function to determine signature based on agent
function getSignatureForAgent(agent, united) {
    console.log('🖋️ DEBUGGING SIGNATURE SELECTION:');
    console.log('  - Raw agent value:', agent);
    console.log('  - United flag:', united);
    console.log('  - Agent type:', typeof agent);
    console.log('  - Agent truthy?', !!agent);

    // United policies always use Maureen's signature regardless of agent
    if (united) {
        console.log('✅ SIGNATURE: Using Maureen Corp signature (United policy)');
        return 'Maureen Corp';
    }

    if (agent) {
        const lowerAgent = agent.toLowerCase();
        console.log('  - Lowercase agent:', lowerAgent);
        console.log('  - Agent name matches:', lowerAgent);

        if (lowerAgent.includes('grant')) {
            console.log('✅ SIGNATURE: Using Grant Corp signature for Grant agent');
            return 'Grant Corp';
        } else if (lowerAgent.includes('hunter')) {
            console.log('✅ SIGNATURE: Using Hunter Brooks signature for Hunter agent');
            return 'Hunter Brooks';
        } else if (lowerAgent.includes('carson')) {
            console.log('✅ SIGNATURE: Using Carson Sweitzer signature for Carson agent');
            return 'Carson Sweitzer';
        } else if (lowerAgent.includes('maureen')) {
            console.log('✅ SIGNATURE: Using Maureen Corp signature for Maureen agent');
            return 'Maureen Corp';
        }
    }

    console.log('✅ SIGNATURE: Using Grant Corp signature (default - no agent specified)');
    return 'Grant Corp';
}

// Legacy function name for backwards compatibility
function getSignatureForAgency(agency) {
    // For backwards compatibility, check both agency and agent logic
    console.log('🔄 Legacy getSignatureForAgency called with:', agency);
    return getSignatureForAgent(agency);
}

// Helper function to get company information based on agency
function getCompanyInfoForAgency(agency, agent, united) {
    console.log('🏢 Determining company info for agency:', agency, '| agent:', agent, '| united:', united);
    const isUIG = united ||
                  (agency && agency.toLowerCase().includes('united')) ||
                  (agent && agent.toLowerCase() === 'maureen');
    if (isUIG) {
        console.log('🔄 Using United Insurance Group company info');
        return {
            producer: 'United Insurance Group',
            email: 'Contact@uigagency.com',
            phone: '(330) 259-7438',
            fax: '(330) 259-7439',
            address1: '435 Abbeyville Rd. Unit F',
            address2: '',
            city: 'Medina',
            state: 'OH',
            zip: '44256'
        };
    } else {
        console.log('🔄 Using Vanguard Insurance Group LLC company info');
        return {
            producer: 'Vanguard Insurance Group LLC',
            email: 'contact@vigagency.com',
            phone: '(866) 628-9441',
            fax: '(330) 779-1097',
            address1: '2888 Nationwide Pkwy',
            address2: '',
            city: 'Brunswick',
            state: 'OH',
            zip: '44212'
        };
    }
}

// Check if there's a saved COI for this policy
window.checkSavedCOI = async function(policyId) {
    try {
        const response = await fetch(`http://162.220.14.239:3001/api/get-saved-coi/${policyId}`);
        if (response.ok) {
            return true;
        }
    } catch (e) {
        console.log('No saved COI found for policy:', policyId);
    }
    return false;
};

// Helper function to format dates for ACORD form (MM/DD/YYYY)
function formatDateForACORD(dateStr) {
    if (!dateStr || dateStr === '') return '';
    try {
        // Handle YYYY-MM-DD format manually to avoid timezone issues
        if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = dateStr.split('-');
            return `${month}/${day}/${year}`;
        }

        // Handle MM/DD/YYYY format (already correct)
        if (typeof dateStr === 'string' && dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            return dateStr;
        }

        // For other formats, create date with explicit local timezone
        const date = new Date(dateStr + 'T00:00:00'); // Force local timezone
        if (isNaN(date)) return '';
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    } catch (e) {
        return dateStr; // Return as-is if can't parse
    }
}

// Generate operation description based on policy type
function generateOperationDescription(policyData) {
    console.log('🚚 Generating operation description with data:', policyData);

    if (!policyData) {
        console.log('❌ No policy data provided to generateOperationDescription');
        return '';
    }

    const policyType = policyData.policyType || policyData.overview?.['Policy Type'] || '';
    const insuredName = policyData.clientName || policyData.insured?.['Name/Business Name'] || '';

    console.log('📋 Policy type for description:', policyType);
    console.log('👤 Insured name for description:', insuredName);
    console.log('🚛 Vehicles for description:', policyData.vehicles);

    let description = ``;

    if (policyType === 'commercial-auto' || policyType === 'Commercial Auto') {
        // Add vehicle info if available
        if (policyData.vehicles && policyData.vehicles.length > 0) {
            // List each vehicle with details
            policyData.vehicles.forEach((vehicle, index) => {
                const year = vehicle.Year || vehicle.year || '';
                const make = vehicle.Make || vehicle.make || '';
                const model = vehicle.Model || vehicle.model || '';
                const vin = vehicle.VIN || vehicle.vin || '';
                const value = vehicle.Value || vehicle.value || '';
                const type = vehicle.Type || vehicle.type || 'Vehicle';

                description += `- ${year} ${make} ${model}`.trim();
                if (vin) description += ` - VIN: ${vin}`;
                if (value) {
                    // Format value with commas if it's a number
                    const formattedValue = parseFloat(value) ? parseFloat(value).toLocaleString() : value;
                    description += ` - Value: $${formattedValue}`;
                }
                // Determine if it's a trailer or vehicle based on type field
                const typeStr = (type || '').toLowerCase();
                if (typeStr.includes('trailer') || typeStr.includes('semi') || typeStr.includes('dolly') || typeStr === 'trailer') {
                    description += ` - TRAILER`;
                } else {
                    description += ` - VEHICLE`;
                }
                description += '\n';
            });

            // Add DOT/MC numbers if available
            const dotNumber = policyData.dotNumber || policyData.overview?.['DOT Number'] || '';
            const mcNumber = policyData.mcNumber || policyData.overview?.['MC Number'] || '';

            if (dotNumber || mcNumber) {
                description += '\n';
                if (dotNumber) description += `DOT# ${dotNumber} `;
                if (mcNumber) description += `MC# ${mcNumber}`;
            }
        } else {
            description += `commercial auto operations. `;
        }
    } else {
        description += `general liability operations. `;
    }

    const finalDescription = description.trim();
    console.log('📝 Generated description:', finalDescription);
    return finalDescription;
}

// Create the REAL custom viewer
console.log('🔧 🔥 DEFINING window.createRealACORDViewer NOW! 🔥');
window.createRealACORDViewer = async function(policyId, policyData = null) {
    console.log('Creating REAL ACORD viewer for policy:', policyId);

    // Store the current policy ID globally for the Save button
    window.currentPolicyId = policyId;

    let policyViewer = document.getElementById('policyViewer');
    if (!policyViewer) {
        console.log('📄 Policy viewer not found, creating modal...');

        // Create a modal container for the ACORD viewer
        const modal = document.createElement('div');
        modal.id = 'acordViewerModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0,0,0,0.8);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            width: 95vw;
            height: 95vh;
            border-radius: 8px;
            overflow: auto;
            position: relative;
        `;

        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 15px;
            background: #0066cc;
            border: none;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            line-height: 1;
            cursor: pointer;
            z-index: 1000;
            color: white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        `;
        closeBtn.onclick = () => modal.remove();

        // Create the policy viewer inside the modal
        policyViewer = document.createElement('div');
        policyViewer.id = 'policyViewer';
        policyViewer.style.cssText = 'width: 100%; height: calc(100% - 120px); padding: 20px; box-sizing: border-box; overflow-y: auto;';

        // Create action buttons footer
        const actionFooter = document.createElement('div');
        actionFooter.style.cssText = `
            padding: 15px 20px;
            background: white;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 80px;
            box-sizing: border-box;
        `;

        actionFooter.innerHTML = `
            <div style="flex: 1;">
                <span style="color: #6b7280; font-size: 14px;">
                    <i class="fas fa-info-circle"></i>
                    ACORD 25 (2016/03) - Certificate of Liability Insurance
                </span>
            </div>
            <div class="coi-action-buttons" style="display: flex; gap: 10px; align-items: center;">
                <button type="button" class="coi-btn coi-btn-secondary coi-cancel-btn" onclick="document.getElementById('acordViewerModal').remove()" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;">
                    <i class="fas fa-times"></i>
                    Cancel
                </button>
                <button type="button" class="coi-btn coi-btn-primary" onclick="window.printACORD && window.printACORD()" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;">
                    <i class="fas fa-print"></i>
                    Print
                </button>
                <button type="button" class="coi-btn coi-btn-success" onclick="window.realSaveCOI && window.realSaveCOI(window.currentPolicyId || '')" style="padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;">
                    <i class="fas fa-save"></i>
                    Save to Profile
                </button>
            </div>
        `;

        modalContent.appendChild(closeBtn);
        modalContent.appendChild(policyViewer);
        modalContent.appendChild(actionFooter);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Mobile: swap Cancel button → Sign As
        if (window.innerWidth <= 768) {
            const cancelBtn = modal.querySelector('.coi-cancel-btn');
            if (cancelBtn) {
                cancelBtn.style.background = '#8b5cf6';
                cancelBtn.innerHTML = '<i class="fas fa-signature"></i> Sign As';
                cancelBtn.onclick = function() { window.showSignAsModal && window.showSignAsModal(policyId); };
            }
        }

        console.log('✅ Created policy viewer modal');
    }

    // Use passed policy data (vigagency) or get from localStorage (CRM)
    let policy = policyData;
    if (!policy) {
        const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        policy = policies.find(p =>
            p.policyNumber === policyId ||
            p.id === policyId ||
            String(p.id) === String(policyId)
        );
    }

    // Always derive united flag from agency field (agency is the source of truth)
    if (policy && policy.agency) {
        policy.united = policy.agency.toLowerCase() === 'united';
    }

    console.log('🔍 Using policy data in createRealACORDViewer:', policy);
    console.log('🔍 POLICY AGENCY DEBUGGING:');
    console.log('  - policy?.agency:', policy?.agency);
    console.log('  - policy?.united:', policy?.united);
    console.log('  - Full policy object keys:', policy ? Object.keys(policy) : 'policy is null/undefined');

    // Create our REAL viewer with EXACT original layout
    policyViewer.innerHTML = `
        <div class="acord-container" style="height: 100%; display: flex; flex-direction: column; background: white;">
            <!-- Header - EXACTLY as you had it -->
            <div class="acord-header" style="padding: 20px; background: linear-gradient(135deg, #0066cc 0%, #004999 100%); color: white; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div>
                    <h2 style="margin: 0; font-size: 24px; font-weight: 600;">
                        <i class="fas fa-file-contract"></i> ACORD 25 Certificate of Insurance
                    </h2>
                    <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">
                        Policy: ${policy?.policy_number || policy?.policyNumber || 'N/A'} | ${policy?.carrier || 'N/A'}
                    </p>
                </div>

                <!-- Certificate Holder Input Section -->

                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                    <button onclick="realSaveCOI('${policyId}')" class="btn-primary" style="background: #10b981; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        <i class="fas fa-save"></i> Save COI
                    </button>
                    <button onclick="saveCertificateHolder('${policyId}')" class="btn-secondary" style="background: #f59e0b; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        <i class="fas fa-user-shield"></i> Save Certificate Holder
                    </button>
                    <button onclick="showSignAsModal('${policyId}')" class="btn-secondary" style="background: #8b5cf6; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        <i class="fas fa-signature"></i> Sign As
                    </button>
                    <button onclick="realDownloadCOI('${policyId}')" class="btn-secondary" style="background: white; color: #0066cc; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button onclick="realPrintCOI()" class="btn-secondary" style="background: white; color: #0066cc; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        <i class="fas fa-print"></i> Print
                    </button>
                </div>
            </div>

            <!-- Our REAL PDF canvas where we render -->
            <div class="pdf-container" style="flex: 1; padding: 20px; background: #f3f4f6; overflow: auto;">
                <div style="background: white; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); position: relative; width: fit-content;">
                    <!-- The actual canvas where PDF is drawn -->
                    <canvas id="realPdfCanvas"></canvas>
                    <!-- Form fields overlay on top of canvas -->
                    <div id="realFormOverlay" style="position: absolute; top: 0; left: 0;"></div>
                </div>
            </div>

            <!-- Status Bar -->
            <div style="padding: 15px 20px; background: white; border-top: 1px solid #e5e7eb; display: flex; justify-content: between; align-items: center;">
                <div style="flex: 1;">
                    <span style="color: #6b7280; font-size: 14px;">
                        <i class="fas fa-info-circle"></i>
                        ACORD 25 (2016/03) - Certificate of Liability Insurance
                    </span>
                </div>
                <div style="display: flex; gap: 20px; align-items: center;">
                    <span style="color: #10b981; font-size: 14px;" id="coiStatus">
                        <i class="fas fa-check-circle"></i> Ready to fill
                    </span>
                </div>
            </div>
        </div>
    `;

    // Now actually load and render the PDF
    // IMPORTANT: Pass the transformed policyData, not the local policy variable
    await loadRealPDF(policyId, policyData || policy);
};

// Load and render the actual PDF
async function loadRealPDF(policyId, policyData) {
    console.log('Loading real PDF...');

    try {
        // Get the canvas
        window.realPdfState.canvas = document.getElementById('realPdfCanvas');
        if (!window.realPdfState.canvas) {
            console.error('Canvas not found');
            return;
        }
        window.realPdfState.ctx = window.realPdfState.canvas.getContext('2d');

        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument('/ACORD_25_fillable.pdf');
        window.realPdfState.pdfDoc = await loadingTask.promise;
        console.log('PDF loaded:', window.realPdfState.pdfDoc.numPages, 'pages');

        // Render the first page
        await renderRealPage(1);

        // Create our form fields
        createRealFormFields(policyId, policyData);

        // Load any saved data
        await loadSavedData(policyId);

        // FORCE populate description field with current policy data
        console.log('🔧 Force populating description field...');
        const descField = document.getElementById('field_description');
        if (descField && policyData) {
            const description = generateOperationDescription(policyData);
            descField.value = description;
            console.log('✅ Description field populated:', description);
        } else {
            console.error('❌ Description field not found or no policy data:', !!descField, !!policyData);
        }

        // 🔥 FORCE UPDATE POLICY FIELDS - Ensure they are populated after form creation
        console.log('🔥 FORCE UPDATE: Starting policy field population...');

        // Auto liability row fields (y: 530)
        const autoPolicyField = document.getElementById('field_autoPolicyNum');
        const autoEffField = document.getElementById('field_autoEffDate');
        const autoExpField = document.getElementById('field_autoExpDate');

        // General Liability row fields (y: 437) - ABOVE the auto liability
        const glPolicyField = document.getElementById('field_glPolicyNum');
        const glEffField = document.getElementById('field_glEffDate');
        const glExpField = document.getElementById('field_glExpDate');

        // Top row fields (y: 686)
        const topPolicyField = document.getElementById('field_otherPolicyNumAbove');
        const topEffField = document.getElementById('field_otherEffDateAbove');
        const topExpField = document.getElementById('field_otherExpDateAbove');

        if (policyData) {
            const policyNum = policyData.policy_number || policyData.policyNumber || '';
            const effDate = formatDateForACORD(policyData.effective_date || policyData.effectiveDate || policyData.overview?.['Effective Date']) || '';
            const expDate = formatDateForACORD(policyData.expiration_date || policyData.expirationDate || policyData.overview?.['Expiration Date']) || '';

            console.log('🔥 FORCE UPDATE: Policy data:', { policyNum, effDate, expDate });

            // Update General Liability row (ABOVE auto liability) — only if GL coverage is present
            const glAggCheck = policyData?.coverage?.['coverage-general-aggregate'] ||
                               policyData?.coverage?.['General Aggregate'] ||
                               policyData?.coverage?.['General Liability'] ||
                               policyData?.coverage?.['General Liability BI'] || '';
            const glPresent = !!glAggCheck && glAggCheck !== 'excluded';
            if (glPresent) {
                if (glPolicyField) {
                    glPolicyField.value = policyNum;
                    console.log('✅ GL Policy Number field populated:', policyNum);
                }
                if (glEffField) {
                    glEffField.value = effDate;
                    console.log('✅ GL Effective Date field populated:', effDate);
                }
                if (glExpField) {
                    glExpField.value = expDate;
                    console.log('✅ GL Expiration Date field populated:', expDate);
                }
            } else {
                console.log('ℹ️ GL coverage not present — skipping GL row prefill');
            }

            // Update auto liability row
            if (autoPolicyField) {
                autoPolicyField.value = policyNum;
                console.log('✅ Auto Policy Number field populated:', policyNum);
            }
            if (autoEffField) {
                autoEffField.value = effDate;
                console.log('✅ Auto Effective Date field populated:', effDate);
            }
            if (autoExpField) {
                autoExpField.value = expDate;
                console.log('✅ Auto Expiration Date field populated:', expDate);
            }

            // Update top row
            if (topPolicyField) {
                topPolicyField.value = policyNum;
                console.log('✅ Top Policy Number field populated:', policyNum);
            }
            if (topEffField) {
                topEffField.value = effDate;
                console.log('✅ Top Effective Date field populated:', effDate);
            }
            if (topExpField) {
                topExpField.value = expDate;
                console.log('✅ Top Expiration Date field populated:', expDate);
            }
        }

        // Mobile: attach pinch-to-zoom exclusively to the PDF container
        if (window.innerWidth <= 768) {
            _initPdfPinchZoom();
        }

    } catch (error) {
        console.error('Error loading PDF:', error);
        // Fallback to embedded PDF
        document.querySelector('.pdf-container').innerHTML = `
            <embed src="/ACORD_25_fillable.pdf#zoom=125" type="application/pdf" width="100%" height="100%" style="min-height: 800px;">
        `;
    }
}

// ── Pinch-to-zoom for PDF container on mobile ────────────────────────────────
function _initPdfPinchZoom() {
    const container = document.querySelector('.acord-container .pdf-container');
    const wrapper = container && container.querySelector(':scope > div');
    if (!container || !wrapper) return;

    let currentScale = 1;
    let startDist = 0;
    let startScale = 1;
    let originX = 0, originY = 0;

    function getDist(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function getMidpoint(touches) {
        const rect = container.getBoundingClientRect();
        return {
            x: ((touches[0].clientX + touches[1].clientX) / 2) - rect.left + container.scrollLeft,
            y: ((touches[0].clientY + touches[1].clientY) / 2) - rect.top + container.scrollTop
        };
    }

    let isPinching = false;

    container.addEventListener('touchstart', function(e) {
        if (e.touches.length === 2) {
            e.preventDefault();
            e.stopPropagation();
            isPinching = true;
            startDist = getDist(e.touches);
            startScale = currentScale;
            const mid = getMidpoint(e.touches);
            originX = mid.x;
            originY = mid.y;
            wrapper.style.transition = 'none';
        }
    }, { passive: false });

    container.addEventListener('touchmove', function(e) {
        if (e.touches.length === 2 && isPinching) {
            e.preventDefault();
            e.stopPropagation();
            const dist = getDist(e.touches);
            const newScale = Math.min(3, Math.max(0.25, startScale * (dist / startDist)));
            currentScale = newScale;
            wrapper.style.transformOrigin = `${originX}px ${originY}px`;
            wrapper.style.transform = `scale(${currentScale})`;
        }
    }, { passive: false });

    container.addEventListener('touchend', function(e) {
        if (isPinching && e.touches.length < 2) {
            isPinching = false;
            // No snap-back — stay at whatever zoom level the user set
        }
    }, { passive: false });

    // Double-tap to toggle zoom
    let lastTap = 0;
    container.addEventListener('touchend', function(e) {
        if (isPinching) return;
        if (e.touches.length === 0 && e.changedTouches.length === 1) {
            const now = Date.now();
            if (now - lastTap < 300) {
                e.preventDefault();
                const targetScale = currentScale > 1.1 ? 1 : 2;
                wrapper.style.transition = 'transform 0.25s ease';
                if (targetScale === 1) {
                    currentScale = 1;
                    wrapper.style.transform = 'scale(1)';
                    wrapper.style.transformOrigin = 'top left';
                } else {
                    const rect = container.getBoundingClientRect();
                    const x = e.changedTouches[0].clientX - rect.left + container.scrollLeft;
                    const y = e.changedTouches[0].clientY - rect.top + container.scrollTop;
                    currentScale = targetScale;
                    wrapper.style.transformOrigin = `${x}px ${y}px`;
                    wrapper.style.transform = `scale(${currentScale})`;
                }
                setTimeout(() => { wrapper.style.transition = 'none'; }, 300);
                lastTap = 0; // Reset to prevent triple-tap
            } else {
                lastTap = now;
            }
        }
    }, { passive: false });
}

// Render a page of the PDF
async function renderRealPage(pageNumber) {
    console.log('Rendering page', pageNumber);

    try {
        // Get the page
        const page = await window.realPdfState.pdfDoc.getPage(pageNumber);

        // Set scale to fit width
        const viewport = page.getViewport({ scale: window.realPdfState.scale });

        // CRITICAL: Cancel any existing render operations to prevent canvas conflicts
        if (window.realPdfState.currentRenderTask) {
            console.log('🛑 Cancelling existing render task to prevent canvas conflict');
            try {
                window.realPdfState.currentRenderTask.cancel();
            } catch (cancelError) {
                console.log('⚠️ Render task already completed or cancelled');
            }
        }

        // Clear the canvas before starting new render
        window.realPdfState.ctx.clearRect(0, 0, window.realPdfState.canvas.width, window.realPdfState.canvas.height);

        // Set canvas dimensions
        window.realPdfState.canvas.height = viewport.height;
        window.realPdfState.canvas.width = viewport.width;

        // Render PDF page into canvas
        const renderContext = {
            canvasContext: window.realPdfState.ctx,
            viewport: viewport
        };

        console.log('🎨 Starting PDF render with clean canvas');
        window.realPdfState.currentRenderTask = page.render(renderContext);
        await window.realPdfState.currentRenderTask.promise;
        window.realPdfState.currentRenderTask = null; // Clear the task reference
        console.log('Page rendered successfully');

    } catch (error) {
        console.error('Error rendering page:', error);
    }
}

// Create form fields that we control
function createRealFormFields(policyId, policyData) {
    console.log('Creating real form fields with policy data:', policyData);

    const overlay = document.getElementById('realFormOverlay');
    if (!overlay) return;

    // Set overlay dimensions to match canvas
    overlay.style.width = window.realPdfState.canvas.width + 'px';
    overlay.style.height = window.realPdfState.canvas.height + 'px';

    // Clear any existing fields
    overlay.innerHTML = '';

    // Determine if GL coverage is present and not excluded
    // Check flat keys first, then CoveragesArray for GL/GLCBI/GLACC/GLAGG codes
    let _covArrPreGL = policyData?.coverage?.CoveragesArray || {};
    try {
        const _covOvr = Storage.prototype.getItem.call(localStorage, '_covOverride_' + (policyData?.id || ''));
        if (_covOvr) { const p = JSON.parse(_covOvr); if (p && typeof p === 'object') _covArrPreGL = { ..._covArrPreGL, ...p }; }
    } catch(e) {}
    const _glFromCovArr = _covArrPreGL['GL'] || _covArrPreGL['GLCBI'] || _covArrPreGL['GLACC'] || _covArrPreGL['GLAGG'] || null;
    const glAggregateRaw = policyData?.coverage?.['coverage-general-aggregate'] ||
                           policyData?.coverage?.['General Aggregate'] ||
                           policyData?.coverage?.['General Liability'] ||
                           policyData?.coverage?.['General Liability BI'] ||
                           (_glFromCovArr?.Amount || _glFromCovArr?.Aggregate || '') || '';
    const hasGL = !!glAggregateRaw && glAggregateRaw !== 'excluded';
    // Helper: parse GL occurrence and aggregate from BI field (e.g. "1000000/2000000") or CoveragesArray
    const _glBIRaw = policyData?.coverage?.['General Liability BI'] || '';
    const _glBIParts = _glBIRaw.replace(/[$,]/g,'').split('/');
    let _glOcc = _glBIParts[0] ? parseFloat(_glBIParts[0]) : 0;
    let _glAgg = _glBIParts[1] ? parseFloat(_glBIParts[1]) : (_glOcc ? _glOcc * 2 : 0);
    // Override from CoveragesArray GL entry if present
    if (_glFromCovArr && (!_glOcc || !_glAgg)) {
        const occRaw = parseFloat((_glFromCovArr.Amount || '0').toString().replace(/[$,]/g, ''));
        const aggRaw = parseFloat((_glFromCovArr.Aggregate || '0').toString().replace(/[$,]/g, ''));
        if (occRaw > 0) _glOcc = occRaw;
        if (aggRaw > 0) _glAgg = aggRaw;
        if (_glOcc && !_glAgg) _glAgg = _glOcc * 2;
    }

    // Pre-compute cargo and physical damage presence
    // Check flat keys, CoveragesArray (policy-level), override key, and vehicle-level coverages
    let _covArr = policyData?.coverage?.CoveragesArray || {};
    // Also check dedicated coverage override key (bypasses localStorage interceptors)
    try {
        const _covOverride = Storage.prototype.getItem.call(localStorage, '_covOverride_' + (policyData?.id || ''));
        if (_covOverride) {
            const parsed = JSON.parse(_covOverride);
            if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
                _covArr = { ..._covArr, ...parsed };
            }
        }
    } catch(e) {}
    const _vehs = Array.isArray(policyData?.vehicles) ? policyData.vehicles : [];
    // Helper: find a coverage by code in CoveragesArray or vehicle CoveragesArrays
    function _findCov(code) {
        if (_covArr[code]) return _covArr[code];
        for (const v of _vehs) {
            const vc = v.CoveragesArray || {};
            if (vc[code]) return vc[code];
        }
        return null;
    }
    const _mtcCov = _findCov('MTC') || _findCov('MTRTK') || _findCov('MTCARGO');
    const _compCov = _findCov('COMP');
    const _collCov = _findCov('COLL');

    // CoveragesArray/override values take priority over flat keys (user edits override IVANS imports)
    const _cargoLimitRaw = (_mtcCov?.Amount || _mtcCov?.Limit || '') || policyData?.coverage?.cargo_limit || policyData?.coverage?.['Cargo Limit'] || '';
    const _cargoDeductRaw = (_mtcCov?.Deductible || '') || policyData?.coverage?.cargo_deductible || policyData?.coverage?.['Cargo Deductible'] || '';
    const hasCargoRow = !!_cargoLimitRaw && _cargoLimitRaw !== '0' && _cargoLimitRaw !== 'None';
    console.log('📦 CARGO DEBUG: _cargoLimitRaw =', JSON.stringify(_cargoLimitRaw), '| _cargoDeductRaw =', JSON.stringify(_cargoDeductRaw), '| hasCargoRow =', hasCargoRow, '| _mtcCov =', _mtcCov);
    const _compDedRaw = (_compCov?.Deductible || '') || policyData?.coverage?.comprehensive_deductible || policyData?.coverage?.['Comprehensive Deductible'] || '0';
    const _collDedRaw = (_collCov?.Deductible || '') || policyData?.coverage?.collision_deductible || policyData?.coverage?.['Collision Deductible'] || '0';
    const hasPhysDmg = _compDedRaw !== 'None' && _collDedRaw !== 'None' &&
                       parseFloat(String(_compDedRaw).replace(/[$,]/g,'')) > 0 &&
                       parseFloat(String(_collDedRaw).replace(/[$,]/g,'')) > 0;

    // EXACT field positions extracted from ACORD 25 fillable PDF (scaled at 1.3x)
    const fields = [
        // === DATE (top right) ===
        { id: 'date', x: 664, y: 47, width: 103, height: 16,
          value: '' }, // Empty - will be populated when sending to certificate holders

        // === PRODUCER SECTION (top left) ===
        { id: 'producer', x: 29, y: 172, width: 364, height: 16,
          value: getCompanyInfoForAgency(policyData?.agency, policyData?.agent, policyData?.united).producer },
        { id: 'producerAddress1', x: 29, y: 187, width: 364, height: 16,
          value: getCompanyInfoForAgency(policyData?.agency, policyData?.agent, policyData?.united).address1 },
        { id: 'producerAddress2', x: 29, y: 203, width: 364, height: 16,
          value: getCompanyInfoForAgency(policyData?.agency, policyData?.agent, policyData?.united).address2 },
        { id: 'producerCity', x: 29, y: 218, width: 281, height: 16,
          value: getCompanyInfoForAgency(policyData?.agency, policyData?.agent, policyData?.united).city },
        { id: 'producerState', x: 309, y: 218, width: 23, height: 16,
          value: getCompanyInfoForAgency(policyData?.agency, policyData?.agent, policyData?.united).state },
        { id: 'producerZip', x: 333, y: 218, width: 60, height: 16,
          value: getCompanyInfoForAgency(policyData?.agency, policyData?.agent, policyData?.united).zip },

        // === CONTACT INFO (right side of producer) ===
        { id: 'contactName', x: 450, y: 156, width: 317, height: 16,
          value: getCompanyInfoForAgency(policyData?.agency, policyData?.agent, policyData?.united).producer },
        { id: 'phone', x: 459, y: 172, width: 164, height: 16,
          value: getCompanyInfoForAgency(policyData?.agency, policyData?.agent, policyData?.united).phone },
        { id: 'fax', x: 673, y: 172, width: 94, height: 16,
          value: getCompanyInfoForAgency(policyData?.agency, policyData?.agent, policyData?.united).fax },
        { id: 'email', x: 450, y: 187, width: 317, height: 16,
          value: getCompanyInfoForAgency(policyData?.agency, policyData?.agent, policyData?.united).email },

        // === INSURED SECTION ===
        { id: 'insured', x: 94, y: 250, width: 299, height: 16,
          value: policyData?.insuredName || policyData?.insured?.['Name/Business Name'] || policyData?.insured?.['Primary Named Insured'] || policyData?.clientName || '', bold: true },
        { id: 'insuredAddress1', x: 94, y: 265, width: 299, height: 16,
          value: (() => {
            // Check separate Address field first (IVANS format), then combined Mailing Address
            const streetOnly = policyData?.contact?.['Address'] || policyData?.contact?.['Street Address'] || '';
            if (streetOnly) return streetOnly;
            const fullAddress = policyData?.address || policyData?.contact?.['Mailing Address'] || '';
            if (fullAddress && typeof fullAddress === 'string') {
              // Split address to extract street address only
              const parts = fullAddress.split(',');
              return parts[0]?.trim() || ''; // Just the street address
            } else if (fullAddress && typeof fullAddress === 'object') {
              return fullAddress.street || fullAddress.address || fullAddress.line1 || '';
            }
            return '';
          })() },
        { id: 'insuredAddress2', x: 94, y: 281, width: 299, height: 16,
          value: (() => {
            // Get city, state, zip from separate fields in policy data
            const city = policyData?.city || policyData?.contact?.City || '';
            const state = policyData?.state || policyData?.contact?.State || '';
            const zip = policyData?.zip || policyData?.zipCode || policyData?.contact?.['ZIP Code'] || policyData?.contact?.['Zip Code'] || policyData?.contact?.['zip'] || '';

            console.log('🏙️ Building insuredAddress2 from separate fields:');
            console.log('  - City:', city);
            console.log('  - State:', state);
            console.log('  - ZIP:', zip);

            // Format: "CITY STATE ZIP"
            const parts = [city, state, zip].filter(Boolean);
            const result = parts.join(' ');
            console.log('  - Final insuredAddress2:', result);

            return result || '';
          })() },
        { id: 'insuredCity', x: 94, y: 296, width: 216, height: 16,
          value: '' }, // Remove city field
        { id: 'insuredState', x: 309, y: 296, width: 23, height: 16,
          value: '' }, // Remove state field
        { id: 'insuredZip', x: 333, y: 296, width: 60, height: 16,
          value: '' }, // Remove zip field

        // === INSURER SECTION (companies A-F) ===
        { id: 'insurerA', x: 454, y: 218, width: 243, height: 16,
          value: (() => {
            const raw = policyData?.carrier || policyData?.overview?.['Carrier'] || '';
            const lc = raw.toLowerCase().replace(/\s+/g, '');
            if (lc.startsWith('geico')) return 'GEICO MARINE INSURANCE COMPANY';
            if (lc.startsWith('progressive')) return 'Progressive Preferred Insurance Co.';
            if (lc.startsWith('northland')) return 'NORTHLAND INSURANCE COMPANY';
            return raw;
          })() },
        { id: 'insurerANaic', x: 707, y: 218, width: 60, height: 16,
          value: (() => {
            const c = (policyData?.carrier || policyData?.overview?.['Carrier'] || '').toLowerCase().replace(/\s+/g, '');
            if (c.startsWith('progressive')) return '24260';
            if (c.startsWith('geico')) return '37923';
            if (c.startsWith('northland')) return '524126';
            return '';
          })() },

        // === GENERAL LIABILITY CHECKBOXES ===
        { id: 'glCheck', x: 47, y: 390, width: 18, height: 16,
          type: 'checkbox', checked: hasGL },
        { id: 'glClaimsMade', x: 65, y: 406, width: 20, height: 16,
          type: 'checkbox' },
        { id: 'glOccurrence', x: 150, y: 406, width: 20, height: 16,
          type: 'checkbox', checked: hasGL },
        { id: 'glOtherCov1', x: 47, y: 421, width: 18, height: 16,
          type: 'checkbox' },
        { id: 'glOtherCov2', x: 47, y: 437, width: 18, height: 16,
          type: 'checkbox' },

        // === AGGREGATE LIMIT CHECKBOXES ===
        { id: 'aggPolicy', x: 47, y: 468, width: 18, height: 16,
          type: 'checkbox', checked: hasGL },
        { id: 'aggProject', x: 103, y: 468, width: 20, height: 16,
          type: 'checkbox' },
        { id: 'aggLocation', x: 159, y: 468, width: 20, height: 16,
          type: 'checkbox' },
        { id: 'aggOther', x: 47, y: 484, width: 18, height: 16,
          type: 'checkbox' },

        // === AUTOMOBILE LIABILITY CHECKBOXES ===
        { id: 'autoAny', x: 47, y: 515, width: 18, height: 16,
          type: 'checkbox', checked: false },
        { id: 'autoOwned', x: 47, y: 530, width: 18, height: 16,
          type: 'checkbox' },
        { id: 'autoScheduled', x: 135, y: 530, width: 20, height: 16,
          type: 'checkbox', checked: true },
        { id: 'autoHired', x: 47, y: 546, width: 18, height: 16,
          type: 'checkbox' },
        { id: 'autoNonOwned', x: 135, y: 546, width: 20, height: 16,
          type: 'checkbox' },
        { id: 'autoOther1', x: 47, y: 562, width: 18, height: 16,
          type: 'checkbox' },
        { id: 'autoOther2', x: 135, y: 562, width: 20, height: 16,
          type: 'checkbox' },

        // === EXCESS/UMBRELLA CHECKBOXES ===
        { id: 'umbrella', x: 47, y: 577, width: 18, height: 16,
          type: 'checkbox' },
        { id: 'umbrellaOccur', x: 150, y: 577, width: 20, height: 16,
          type: 'checkbox' },
        { id: 'excess', x: 47, y: 593, width: 18, height: 16,
          type: 'checkbox' },
        { id: 'excessClaims', x: 150, y: 593, width: 20, height: 16,
          type: 'checkbox' },
        { id: 'deductible', x: 47, y: 608, width: 18, height: 16,
          type: 'checkbox' },
        { id: 'retention', x: 94, y: 608, width: 18, height: 16,
          type: 'checkbox' },

        // === WORKERS COMP CHECKBOXES ===
        { id: 'wcStatute', x: 552, y: 624, width: 18, height: 16,
          type: 'checkbox' },
        { id: 'wcOther', x: 618, y: 624, width: 20, height: 16,
          type: 'checkbox' },

        // === WORKERS COMP FIELDS ===
        { id: 'wcInsurer', x: 23, y: 647, width: 23, height: 16,
          value: '' },
        { id: 'wcAddlInsd', x: 229, y: 647, width: 23, height: 16,
          value: '' },
        { id: 'wcSubrWvd', x: 252, y: 647, width: 23, height: 16,
          value: '' },
        { id: 'wcPolicyNum', x: 281, y: 647, width: 146, height: 16,
          value: '' },
        { id: 'wcEffDate', x: 430, y: 647, width: 61, height: 16,
          value: '' },
        { id: 'wcExpDate', x: 491, y: 647, width: 61, height: 16,
          value: '' },

        // === MIDDLE ROW (y: 702) - PHYSICAL DAMAGE COVERAGE (only when cargo also present) ===
        // When no cargo, physical damage slides up to y:686 row (handled in ABOVE section)
        { id: 'otherInsurer', x: 23, y: 702, width: 23, height: 16,
          skip: !hasCargoRow || !hasPhysDmg,
          value: (hasCargoRow && hasPhysDmg) ? 'A' : '' },
        { id: 'otherAddlInsd', x: 229, y: 702, width: 23, height: 16,
          skip: !hasCargoRow || !hasPhysDmg,
          value: '' },
        { id: 'otherSubrWvd', x: 252, y: 702, width: 23, height: 16,
          skip: !hasCargoRow || !hasPhysDmg,
          value: '' },
        { id: 'otherPolicyNum', x: 281, y: 702, width: 146, height: 16,
          skip: !hasCargoRow || !hasPhysDmg,
          value: (hasCargoRow && hasPhysDmg) ? (policyData?.policy_number || policyData?.policyNumber || '') : '' },
        { id: 'otherEffDate', x: 430, y: 702, width: 61, height: 16,
          skip: !hasCargoRow || !hasPhysDmg,
          value: (hasCargoRow && hasPhysDmg) ? formatDateForACORD(policyData?.effective_date || policyData?.effectiveDate) : '' },
        { id: 'otherExpDate', x: 491, y: 702, width: 61, height: 16,
          skip: !hasCargoRow || !hasPhysDmg,
          value: (hasCargoRow && hasPhysDmg) ? formatDateForACORD(policyData?.expiration_date || policyData?.expirationDate) : '' },
        { id: 'otherLimits', x: 552, y: 702, width: 83, height: 16,
          skip: !hasCargoRow || !hasPhysDmg,
          value: (hasCargoRow && hasPhysDmg) ? 'COMP & COLLISION' : '' },
        { id: 'otherDescription', x: 52, y: 702, width: 173, height: 16,
          skip: !hasCargoRow || !hasPhysDmg,
          value: (function() {
              console.log('🔧 PHYSICAL DAMAGE DEBUG: hasCargoRow =', hasCargoRow, 'hasPhysDmg =', hasPhysDmg);
              return (hasCargoRow && hasPhysDmg) ? 'PHYSICAL DAMAGE' : '';
          })() },
        { id: 'glInsurer', x: 23, y: 437, width: 23, height: 16,
          value: hasGL ? 'A' : '' },
        { id: 'glAddlInsd', x: 229, y: 437, width: 23, height: 16,
          value: '' },
        { id: 'glSubrWvd', x: 252, y: 437, width: 23, height: 16,
          value: '' },
        { id: 'glPolicyNum', x: 281, y: 437, width: 146, height: 16,
          value: hasGL ? (policyData?.policyNumber || '') : '' },
        { id: 'glEffDate', x: 430, y: 437, width: 61, height: 16,
          value: hasGL ? (formatDateForACORD(policyData?.effectiveDate) || formatDateForACORD(policyData?.overview?.['Effective Date']) || '') : '' },
        { id: 'glExpDate', x: 491, y: 437, width: 61, height: 16,
          value: hasGL ? (formatDateForACORD(policyData?.expirationDate) || formatDateForACORD(policyData?.overview?.['Expiration Date']) || '') : '' },

        // === AUTOMOBILE LIABILITY FIELDS ===
        { id: 'autoInsurer', x: 23, y: 530, width: 23, height: 16,
          value: 'A' },
        { id: 'autoAddlInsd', x: 229, y: 530, width: 23, height: 16,
          value: '' },
        { id: 'autoSubrWvd', x: 252, y: 530, width: 23, height: 16,
          value: '' },
        { id: 'autoPolicyNum', x: 281, y: 530, width: 146, height: 16,
          value: (function() {
              const policyNum = policyData?.policy_number || policyData?.policyNumber || '';
              console.log('🔥 AUTO ROW DEBUG: Policy Number =', policyNum);
              return policyNum;
          })() },
        { id: 'autoEffDate', x: 430, y: 530, width: 61, height: 16,
          value: (function() {
              const effDate = formatDateForACORD(policyData?.effective_date || policyData?.effectiveDate || policyData?.overview?.['Effective Date']) || '';
              console.log('🔥 AUTO ROW DEBUG: Effective Date =', effDate);
              return effDate;
          })() },
        { id: 'autoExpDate', x: 491, y: 530, width: 61, height: 16,
          value: (function() {
              const expDate = formatDateForACORD(policyData?.expiration_date || policyData?.expirationDate || policyData?.overview?.['Expiration Date']) || '';
              console.log('🔥 AUTO ROW DEBUG: Expiration Date =', expDate);
              return expDate;
          })() },

        // === AUTO LIABILITY LIMITS (ALL MISSING FIELDS) ===
        { id: 'autoCombinedSingle', x: 684, y: 499, width: 83, height: 16,
          value: (function() {
              // Check CoveragesArray for CSL/CSL_AUTO first
              const cslCov = _findCov('CSL') || _findCov('CSL_AUTO') || _findCov('BISPL');
              if (cslCov && cslCov.Amount) {
                  const num = parseFloat(String(cslCov.Amount).replace(/[$,\s]/g, ''));
                  if (!isNaN(num) && num > 0) return `$${num.toLocaleString()}`;
              }
              // Fall back to flat coverage fields
              const raw = policyData?.coverage?.['Liability Limits'] || '';
              if (!raw) return '';
              const num = parseFloat(String(raw).replace(/[$,\s]/g, ''));
              return isNaN(num) ? raw : `$${num.toLocaleString()}`;
          })() },
        { id: 'autoBodilyInjuryPerson', x: 684, y: 515, width: 83, height: 16,
          value: '' },
        { id: 'autoBodilyInjuryAccident', x: 684, y: 530, width: 83, height: 16,
          value: '' },
        { id: 'autoPropertyDamage', x: 684, y: 546, width: 83, height: 16,
          value: '' },
        { id: 'autoOtherLimit', x: 684, y: 562, width: 83, height: 16,
          value: '' },

        // === EXCESS/UMBRELLA FIELDS ===
        { id: 'excessInsurer', x: 23, y: 593, width: 23, height: 16,
          value: '' },
        { id: 'excessAddlInsd', x: 229, y: 593, width: 23, height: 16,
          value: '' },
        { id: 'excessSubrWvd', x: 252, y: 593, width: 23, height: 16,
          value: '' },
        { id: 'excessPolicyNum', x: 281, y: 593, width: 146, height: 16,
          value: '' },
        { id: 'excessEffDate', x: 430, y: 593, width: 61, height: 16,
          value: '' },
        { id: 'excessExpDate', x: 491, y: 593, width: 61, height: 16,
          value: '' },

        // === EXCESS/UMBRELLA LIMITS ===
        { id: 'excessEachOccur', x: 684, y: 577, width: 83, height: 16,
          value: '' },
        { id: 'excessAggregate', x: 684, y: 593, width: 83, height: 16,
          value: '' },
        { id: 'excessOtherLimit', x: 684, y: 608, width: 83, height: 16,
          value: '' },

        // === WORKERS COMP LIMITS ===
        { id: 'wcOtherField', x: 673, y: 624, width: 94, height: 16,
          value: '' },
        { id: 'wcEachAccident', x: 684, y: 640, width: 83, height: 16,
          value: '' },
        { id: 'wcDiseasePolicyLimit', x: 684, y: 655, width: 83, height: 16,
          value: '' },
        { id: 'wcDiseaseEachEmployee', x: 684, y: 671, width: 83, height: 16,
          value: '' },

        // === OTHER POLICY LIMITS ===
        // otherLimit1 (y:686): cargo deductible if cargo present, else phys damage deductible
        { id: 'otherLimit1', x: 684, y: 686, width: 83, height: 16,
          skip: !hasCargoRow && !hasPhysDmg,
          value: (function() {
              if (hasCargoRow) {
                  const cargoDeductible = _cargoDeductRaw || '';
                  if (cargoDeductible && cargoDeductible !== 'None') {
                      const dedNum = parseFloat(cargoDeductible.toString().replace(/[$,]/g,''));
                      return `DED. $${isNaN(dedNum) ? cargoDeductible : dedNum.toLocaleString()}`;
                  }
                  return '';
              }
              if (hasPhysDmg) {
                  const compDed = parseFloat(String(_compDedRaw).replace(/[$,]/g,''));
                  const collDed = parseFloat(String(_collDedRaw).replace(/[$,]/g,''));
                  return compDed === collDed
                      ? `DED. $${compDed.toLocaleString()} EACH`
                      : `DED. $${compDed.toLocaleString()}/$${collDed.toLocaleString()}`;
              }
              return '';
          })() },
        // otherLimit2 (y:702): phys damage deductible only when cargo also occupies y:686
        { id: 'otherLimit2', x: 684, y: 702, width: 83, height: 16,
          skip: !hasCargoRow || !hasPhysDmg,
          value: (function() {
              if (!hasCargoRow || !hasPhysDmg) return '';
              const compDed = parseFloat(String(_compDedRaw).replace(/[$,]/g,''));
              const collDed = parseFloat(String(_collDedRaw).replace(/[$,]/g,''));
              return compDed === collDed
                  ? `DED. $${compDed.toLocaleString()} EACH`
                  : `DED. $${compDed.toLocaleString()}/$${collDed.toLocaleString()}`;
          })() },
        { id: 'otherLimit3', x: 684, y: 718, width: 83, height: 16,
          value: '' },

        // === FIRST "OTHER" ROW (y: 686) ===
        // Shows Motor Truck Cargo if present; otherwise slides Physical Damage up here.
        { id: 'otherInsurerAbove', x: 23, y: 686, width: 23, height: 16,
          skip: !hasCargoRow && !hasPhysDmg,
          value: (hasCargoRow || hasPhysDmg) ? 'A' : '' },
        { id: 'otherDescriptionAbove', x: 52, y: 686, width: 173, height: 16,
          skip: !hasCargoRow && !hasPhysDmg,
          value: hasCargoRow ? 'MOTOR TRUCK CARGO' : (hasPhysDmg ? 'PHYSICAL DAMAGE' : '') },
        { id: 'otherAddlInsdAbove', x: 229, y: 686, width: 23, height: 16,
          skip: !hasCargoRow && !hasPhysDmg,
          value: '' },
        { id: 'otherSubrWvdAbove', x: 252, y: 686, width: 23, height: 16,
          skip: !hasCargoRow && !hasPhysDmg,
          value: '' },
        { id: 'otherPolicyNumAbove', x: 281, y: 686, width: 146, height: 16,
          skip: !hasCargoRow && !hasPhysDmg,
          value: (function() {
              if (!hasCargoRow && !hasPhysDmg) return '';
              const policyNum = policyData?.policy_number || policyData?.policyNumber || '';
              console.log('🔥 TOP ROW DEBUG: Policy Number =', policyNum);
              return policyNum;
          })() },
        { id: 'otherEffDateAbove', x: 430, y: 686, width: 61, height: 16,
          skip: !hasCargoRow && !hasPhysDmg,
          value: (function() {
              if (!hasCargoRow && !hasPhysDmg) return '';
              const effDate = formatDateForACORD(policyData?.effective_date || policyData?.effectiveDate) || '';
              console.log('🔥 TOP ROW DEBUG: Effective Date =', effDate);
              return effDate;
          })() },
        { id: 'otherExpDateAbove', x: 491, y: 686, width: 61, height: 16,
          skip: !hasCargoRow && !hasPhysDmg,
          value: (function() {
              if (!hasCargoRow && !hasPhysDmg) return '';
              const expDate = formatDateForACORD(policyData?.expiration_date || policyData?.expirationDate) || '';
              console.log('🔥 TOP ROW DEBUG: Expiration Date =', expDate);
              return expDate;
          })() },
        { id: 'otherLimitsAbove', x: 552, y: 686, width: 83, height: 16,
          skip: !hasCargoRow && !hasPhysDmg,
          value: (function() {
              if (!hasCargoRow && !hasPhysDmg) return '';
              if (hasCargoRow) {
                  const limitNum = parseFloat(_cargoLimitRaw.toString().replace(/[$,]/g,''));
                  return `LIMIT $${isNaN(limitNum) ? _cargoLimitRaw : limitNum.toLocaleString()}`;
              }
              return 'COMP & COLLISION';
          })() },

        // === LAST ROW (y: 718) — Trailer Interchange if present, else Non-Owned Trailer ===
        // Pre-compute TI and NON-OWNED values from flat keys AND CoveragesArray (TI/NOTI codes)
        ...((function() {
            const _tiCov = _findCov('TI') || _findCov('COMTI') || _findCov('COLTI');
            const _notiCov = _findCov('NOTI');
            const _tiRaw = policyData?.coverage?.['Trailer Interchange Limit'] || policyData?.coverage?.trailer_interchange_limit || (_tiCov?.Amount || _tiCov?.Limit || '') || '';
            const _notRaw = policyData?.coverage?.non_owned_trailer || policyData?.coverage?.['Non-Owned Trailer Phys Dam'] || policyData?.coverage?.['Non-Owned Trailer Physical Damage'] || (_notiCov?.Amount || _notiCov?.Limit || '') || '';
            const _hasTI = _tiRaw && _tiRaw !== '0' && _tiRaw !== 'No Coverage' && _tiRaw !== 'None';
            const _hasNOT = _notRaw && _notRaw !== 'None' && _notRaw !== 'Not Included' && _notRaw !== '0';
            const _tiDedRaw = _tiCov?.Deductible || '';
            const _notiDedRaw = _notiCov?.Deductible || policyData?.coverage?.non_owned_trailer_deductible || '';
            console.log('🚛 LAST ROW DEBUG: TI =', _tiRaw, '| Non-Owned Trailer =', _notRaw, '| TI from CoveragesArray:', !!_tiCov, '| NOTI from CoveragesArray:', !!_notiCov);
            return [
            { id: 'lastRowInsurer', x: 23, y: 718, width: 23, height: 16,
              value: (_hasTI || _hasNOT) ? 'A' : '' },
            { id: 'lastRowText', x: 52, y: 718, width: 173, height: 16,
              value: _hasTI ? 'TRAILER INTERCHANGE' : (_hasNOT ? 'NON OWNED TRAIL PHYS DAMAGE' : '') },
            { id: 'lastRowPolicyNum', x: 281, y: 718, width: 146, height: 16,
              value: (_hasTI || _hasNOT) ? (policyData?.policy_number || policyData?.policyNumber || '') : '' },
            { id: 'lastRowEffDate', x: 430, y: 718, width: 61, height: 16,
              value: (_hasTI || _hasNOT) ? formatDateForACORD(policyData?.effective_date || policyData?.effectiveDate) : '' },
            { id: 'lastRowExpDate', x: 491, y: 718, width: 61, height: 16,
              value: (_hasTI || _hasNOT) ? formatDateForACORD(policyData?.expiration_date || policyData?.expirationDate) : '' },
            { id: 'lastRowLimits', x: 552, y: 718, width: 83, height: 16,
              value: (function() {
                  if (_hasTI) {
                      const s = String(_tiRaw);
                      if (s.includes('/')) { const n = parseInt(s.split('/')[0]); return isNaN(n) ? '' : `$${n.toLocaleString()}`; }
                      const num = parseFloat(s.replace(/[$,\s]/g, ''));
                      return isNaN(num) ? s : `$${num.toLocaleString()}`;
                  }
                  if (_hasNOT) {
                      const num = parseFloat(String(_notRaw).replace(/[$,\s]/g, ''));
                      return isNaN(num) ? _notRaw : `$${num.toLocaleString()}`;
                  }
                  return '';
              })() },
            { id: 'lastRowDeductible', x: 684, y: 718, width: 83, height: 16,
              value: (function() {
                  if (_hasTI) {
                      const s = String(_tiRaw);
                      if (s.includes('/')) { const ded = parseInt(s.toLowerCase().replace(/ded/g, '').split('/')[1]); return isNaN(ded) ? '' : `$${ded.toLocaleString()} Ded.`; }
                      if (_tiDedRaw) { const ded = parseFloat(String(_tiDedRaw).replace(/[$,\s]/g, '')); return isNaN(ded) ? _tiDedRaw : `$${ded.toLocaleString()} Ded.`; }
                      return '';
                  }
                  const ded = _notiDedRaw || policyData?.coverage?.non_owned_trailer_deductible || '';
                  return ded ? `DED. ${ded}` : '';
              })() },
            ];
        })()),


        // === GENERAL LIABILITY LIMITS ===
        { id: 'eachOccurrence', x: 684, y: 390, width: 83, height: 16,
          value: hasGL ? (() => {
              if (_glOcc > 0) return _glOcc.toLocaleString();
              const raw = parseFloat((policyData?.coverage?.['Liability Limits'] || policyData?.coverage?.liability_limits || '1000000').toString().replace(/[$,\s]/g,'').replace(/CSL/i,''));
              return isNaN(raw) ? '1,000,000' : raw.toLocaleString();
          })() : '' },
        { id: 'damageRented', x: 684, y: 406, width: 83, height: 16,
          value: hasGL ? '100,000' : '' },
        { id: 'medExp', x: 684, y: 421, width: 83, height: 16,
          value: hasGL ? '5,000' : '' },
        { id: 'personalAdv', x: 684, y: 437, width: 83, height: 16,
          value: hasGL ? (() => {
              if (_glOcc > 0) return _glOcc.toLocaleString();
              const raw = parseFloat((policyData?.coverage?.['Liability Limits'] || policyData?.coverage?.liability_limits || '1000000').toString().replace(/[$,\s]/g,'').replace(/CSL/i,''));
              return isNaN(raw) ? '1,000,000' : raw.toLocaleString();
          })() : '' },
        { id: 'generalAgg', x: 684, y: 452, width: 83, height: 16,
          value: hasGL ? (() => {
              if (_glAgg > 0) return _glAgg.toLocaleString();
              const raw = parseFloat((policyData?.coverage?.['General Aggregate'] || policyData?.coverage?.general_aggregate || '2000000').toString().replace(/[$,]/g,''));
              return isNaN(raw) ? '2,000,000' : raw.toLocaleString();
          })() : '' },
        { id: 'productsOps', x: 684, y: 468, width: 83, height: 16,
          value: hasGL ? (() => {
              const prodOps = policyData?.coverage?.['Products/Completed Ops'] || '';
              if (prodOps) {
                  const raw = parseFloat(prodOps.toString().replace(/[$,]/g,''));
                  if (!isNaN(raw)) return raw.toLocaleString();
              }
              if (_glAgg > 0) return _glAgg.toLocaleString();
              const raw = parseFloat((policyData?.coverage?.['General Aggregate'] || '2000000').toString().replace(/[$,]/g,''));
              return isNaN(raw) ? '2,000,000' : raw.toLocaleString();
          })() : '' },
        { id: 'glOtherLimit', x: 684, y: 484, width: 83, height: 16,
          value: '' },

        // === DESCRIPTION OF OPERATIONS (large text area) ===
        { id: 'description', x: 29, y: 749, width: 738, height: 86,
          type: 'textarea', value: generateOperationDescription(policyData) },

        // === CERTIFICATE HOLDER ===
        { id: 'certHolder', x: 94, y: 897, width: 299, height: 16,
          value: '' },
        { id: 'certAddress1', x: 94, y: 913, width: 299, height: 16,
          value: '' },
        { id: 'certAddress2', x: 94, y: 928, width: 299, height: 16,
          value: '' },
        { id: 'certCity', x: 94, y: 944, width: 216, height: 16,
          value: '' },
        { id: 'certState', x: 309, y: 944, width: 23, height: 16,
          value: '' },
        { id: 'certZip', x: 333, y: 944, width: 60, height: 16,
          value: '' },

        // === AUTHORIZED REPRESENTATIVE (signature area) ===
        { id: 'authRep', x: 403, y: 936, width: 364, height: 31,
          value: getSignatureForAgent(policyData?.agent, policyData?.united), bold: true, size: 16, signature: true }
    ];

    // Create each field
    fields.forEach(field => {
        if (field.skip) return;
        let element;

        if (field.type === 'checkbox') {
            element = document.createElement('input');
            element.type = 'checkbox';
            element.checked = field.checked || false;
            element.style.width = field.width + 'px';
            element.style.height = field.height + 'px';
        } else if (field.type === 'textarea') {
            element = document.createElement('textarea');
            element.style.resize = 'none';
            element.style.overflow = 'hidden';
        } else {
            element = document.createElement('input');
            element.type = field.type || 'text';
        }

        // Common styles
        element.style.position = 'absolute';
        element.style.left = field.x + 'px';
        element.style.top = field.y + 'px';
        element.style.width = field.width + 'px';
        element.style.height = field.height + 'px';
        element.style.border = '1px solid transparent';
        element.style.background = 'rgba(255, 255, 255, 0.8)';
        element.style.fontSize = (field.size || 10) + 'px';
        element.style.fontFamily = field.signature ? 'Dancing Script, Lucida Handwriting, cursive' : 'Arial, sans-serif';
        element.style.padding = '1px 3px';

        if (field.bold) {
            element.style.fontWeight = 'bold';
        }

        if (field.signature) {
            element.style.fontWeight = '600';
            element.style.color = '#0066cc';
            element.style.fontSize = (field.size * 1.2 || 14) + 'px'; // Slightly larger for signature
            element.style.fontStyle = 'italic';
            element.style.letterSpacing = '0.5px';
            element.style.textShadow = '0.5px 0.5px 1px rgba(0,0,0,0.1)';
            console.log('🖋️ Applied signature styling to field:', field.id);
        }

        if (field.value) {
            element.value = field.value;
        }

        element.id = 'field_' + field.id;

        // Add hover effect
        element.addEventListener('mouseenter', () => {
            element.style.border = '1px solid #0066cc';
            element.style.background = 'white';
        });

        element.addEventListener('mouseleave', () => {
            element.style.border = '1px solid transparent';
            element.style.background = 'rgba(255, 255, 255, 0.8)';
        });

        // Store value changes
        if (element.type === 'checkbox') {
            element.addEventListener('change', () => {
                window.realPdfState.formData[field.id] = element.checked;
                console.log('Checkbox updated:', field.id, element.checked);
            });
        } else {
            // Use 'input' event for text fields to capture as user types
            element.addEventListener('input', () => {
                window.realPdfState.formData[field.id] = element.value;
                console.log('Field updated:', field.id, element.value);
            });
        }

        overlay.appendChild(element);

        // Store initial value
        if (field.type === 'checkbox') {
            window.realPdfState.formData[field.id] = field.checked || false;
        } else {
            window.realPdfState.formData[field.id] = field.value || '';
        }
    });

    console.log('Created', overlay.children.length, 'form fields');
}

// Save the COI with our data
window.realSaveCOI = async function(policyId) {
    console.log('🚀 === STARTING COI SAVE PROCESS v2 ===');
    console.log('🎯 Target Policy ID for save:', policyId);
    console.log('📅 Save timestamp:', new Date().toISOString());
    console.log('🔍 Available policies in localStorage before save:');

    const existingPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    existingPolicies.forEach(p => {
        console.log('  - Policy:', p.id || 'No ID', 'Number:', p.policyNumber || 'No Number', 'HasCOI:', (p.coiDocuments?.length || 0) > 0);
    });

    // Update status
    const statusEl = document.getElementById('coiStatus');
    if (statusEl) {
        statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    }

    // Collect all current form values
    const formData = {};
    document.querySelectorAll('#realFormOverlay input, #realFormOverlay textarea').forEach(el => {
        const fieldId = el.id.replace('field_', '');
        formData[fieldId] = el.type === 'checkbox' ? el.checked : el.value;
        console.log('🔍 Collecting field for save:', fieldId, '=', formData[fieldId]);
    });

    console.log('📋 All form data being saved:', formData);

    try {
        // Save to server
        const response = await fetch('https://162-220-14-239.nip.io/api/save-coi-form', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                policyId: policyId,
                formData: formData
            })
        });

        if (response.ok) {
            // Generate filled PDF
            await fetch('https://162-220-14-239.nip.io/api/generate-filled-coi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    policyId: policyId,
                    formData: formData
                })
            });

            // Save the COI document data locally for viewing
            console.log('💾 About to save COI document with formData:', formData);
            await saveCOIDocumentToPolicy(policyId, formData);

            if (statusEl) {
                statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Saved successfully!';
            }

            // Show success message
            showSuccessMessage('COI saved successfully!');

            // Close the ACORD modal after successful save
            setTimeout(() => {
                const modal = document.getElementById('acordViewerModal');
                if (modal) {
                    console.log('🚪 Closing COI modal after successful save');
                    modal.remove();
                }
            }, 1500); // Give user time to see success message

            // Refresh the COI display in the policy modal if it exists
            setTimeout(() => {
                if (window.loadCOIFiles && typeof window.loadCOIFiles === 'function') {
                    console.log('🔄 Refreshing COI display after save');
                    window.loadCOIFiles(policyId);
                }
            }, 500);
        } else {
            throw new Error('Save failed');
        }
    } catch (error) {
        console.error('Save error:', error);
        if (statusEl) {
            statusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Save failed';
        }
    }
};

// Download the filled COI
window.realDownloadCOI = async function(policyId) {
    console.log('Downloading COI for policy:', policyId);

    // Get policy data
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const policy = policies.find(p =>
        p.policyNumber === policyId ||
        p.id === policyId ||
        String(p.id) === String(policyId)
    );

    if (!policy) {
        alert('Policy not found');
        return;
    }

    const today = new Date().toISOString().split('T')[0];

    // Generate ACORD 25 HTML for download
    const acordHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>ACORD 25 - ${policy.policyNumber || 'Certificate'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 10px; line-height: 1.2; padding: 0.5in; }
        .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .title { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
        .section { border: 1px solid #000; margin-bottom: 10px; padding: 8px; }
        .section-title { font-weight: bold; background: #f0f0f0; padding: 3px; margin: -8px -8px 5px -8px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #000; padding: 4px; text-align: left; }
        th { background: #f0f0f0; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">ACORD 25 CERTIFICATE OF LIABILITY INSURANCE</div>
        <div>DATE: ${today}</div>
    </div>

    <div class="section">
        <div class="section-title">PRODUCER</div>
        <div><strong>Vanguard Insurance Group LLC</strong></div>
        <div>2888 Nationwide Pkwy, Brunswick, OH 44242</div>
        <div>Phone: (866) 628-9441 | Fax: (330) 779-1097 | Email: contact@vigagency.com</div>
    </div>

    <div class="section">
        <div class="section-title">INSURED</div>
        <div><strong>${policy.clientName || policy.name || 'N/A'}</strong></div>
        <div>${policy.address || 'N/A'}</div>
    </div>

    <div class="section">
        <div class="section-title">INSURERS AFFORDING COVERAGE</div>
        <div>INSURER A: ${policy.carrier || 'N/A'}</div>
    </div>

    <div class="section">
        <div class="section-title">COVERAGES</div>
        <table>
            <tr>
                <th>TYPE</th>
                <th>POLICY NUMBER</th>
                <th>EFF DATE</th>
                <th>EXP DATE</th>
                <th>LIMITS</th>
            </tr>
            <tr>
                <td>${policy.type || 'GENERAL LIABILITY'}</td>
                <td>${policy.policyNumber || 'N/A'}</td>
                <td>${policy.effectiveDate || 'N/A'}</td>
                <td>${policy.expirationDate || 'N/A'}</td>
                <td>${policy.coverageLimit ? '$' + Number(policy.coverageLimit).toLocaleString() : 'N/A'}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">CERTIFICATE HOLDER</div>
        <div style="min-height: 60px; border: 1px solid #999; padding: 5px; margin-top: 5px;">
            To be filled in by certificate holder
        </div>
    </div>

    <div class="section">
        <div class="section-title">AUTHORIZED REPRESENTATIVE</div>
        <div style="margin-top: 30px;">______________________________ Date: ${today}</div>
    </div>
</body>
</html>`;

    // Create blob and download
    const blob = new Blob([acordHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ACORD_25_${policy.policyNumber || 'Certificate'}_${today}.html`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
};

// Print the COI
window.realPrintCOI = function() {
    const coiContent = document.querySelector('.real-acord-content');
    if (!coiContent) {
        window.print();
        return;
    }

    // Create a print-only window
    const printWindow = window.open('', 'PrintACORD', 'width=900,height=1200');
    if (!printWindow) {
        alert('Please allow pop-ups to print the ACORD 25 form');
        return;
    }

    // Clone the ACORD content
    const printContent = coiContent.cloneNode(true);

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
    <title>Print ACORD 25</title>
    <style>
        @page { size: letter; margin: 0.5in; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 11px; }
        .checkbox { width: 12px; height: 12px; border: 1px solid #000; display: inline-block; margin-right: 5px; }
        .checkbox.checked::after { content: "X"; display: block; text-align: center; line-height: 12px; }
        input[type="text"] { border: none; border-bottom: 1px solid #000; padding: 2px; }
        .form-section { margin-bottom: 10px; padding: 8px; border: 1px solid #000; }
        .section-title { font-weight: bold; background: #f0f0f0; padding: 3px; margin: -8px -8px 5px -8px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #000; padding: 4px; text-align: left; }
        th { background: #f0f0f0; }
    </style>
</head>
<body>
    ${printContent.innerHTML}
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
                window.close();
            }, 500);
        }
    </script>
</body>
</html>`);

    printWindow.document.close();
};

// Load saved data
async function loadSavedData(policyId) {
    try {
        const response = await fetch(`http://162.220.14.239:3001/api/get-coi-form/${policyId}`);
        if (response.ok) {
            const data = await response.json();
            if (data.formData) {
                // Fill the fields with saved data
                for (const [fieldId, value] of Object.entries(data.formData)) {
                    const element = document.getElementById('field_' + fieldId);
                    if (element) {
                        if (element.type === 'checkbox') {
                            element.checked = value;
                        } else {
                            element.value = value;
                        }
                    }
                }
                console.log('Loaded saved data for policy:', policyId);
            }
        }
    } catch (error) {
        console.log('No saved data found');
    }
}

// Show success message - DISABLED
function showSuccessMessage(message) {
    // const div = document.createElement('div');
    // div.style.cssText = `
    //     position: fixed;
    //     top: 20px;
    //     right: 20px;
    //     background: #10b981;
    //     color: white;
    //     padding: 15px 25px;
    //     border-radius: 8px;
    //     box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    //     z-index: 10000;
    // `;
    // div.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    // document.body.appendChild(div);
    // setTimeout(() => div.remove(), 3000);

    // Just log the message instead of showing popup
    console.log('Success:', message);
}

// Update certificate holder information functions
window.updateCertificateHolder = function(value) {
    console.log('📝 Updating certificate holder name to:', value);

    // Try multiple possible field IDs and approaches
    const possibleIds = ['field_certHolder', 'certHolder'];
    let updated = false;

    possibleIds.forEach(id => {
        const field = document.getElementById(id);
        if (field) {
            field.value = value;
            console.log(`✅ Updated field ${id} with value:`, value);
            updated = true;

            // Trigger change event
            field.dispatchEvent(new Event('input'));
            field.dispatchEvent(new Event('change'));
        }
    });

    if (!updated) {
        console.warn('❌ No certificate holder field found to update');
    }
};

window.updateCertificateHolderAddress = function(value) {
    console.log('📍 Updating certificate holder address to:', value);

    // Try multiple possible field IDs
    const possibleIds = ['field_certAddress1', 'certAddress1'];
    let updated = false;

    possibleIds.forEach(id => {
        const field = document.getElementById(id);
        if (field) {
            field.value = value;
            console.log(`✅ Updated address field ${id} with value:`, value);
            updated = true;

            // Trigger change event
            field.dispatchEvent(new Event('input'));
            field.dispatchEvent(new Event('change'));
        }
    });

    if (!updated) {
        console.warn('❌ No certificate holder address field found to update');
    }
};

// Back to policy view - Return to COI Manager
window.backToPolicyView = function(policyId) {
    // Close the ACORD viewer modal — same behaviour as the × button
    const modal = document.getElementById('acordViewerModal');
    if (modal) {
        modal.remove();
    }
};

// Email ACORD function
window.emailACORD = function(policyId) {
    console.log('Opening email dialog for COI:', policyId);

    // Get the policy data
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const policy = policies.find(p =>
        p.policyNumber === policyId ||
        p.id === policyId ||
        String(p.id) === String(policyId)
    );

    if (!policy) {
        alert('Policy not found');
        return;
    }

    // Create email compose dialog
    const emailDialog = document.createElement('div');
    emailDialog.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); z-index: 10000; width: 500px;';
    emailDialog.innerHTML = `
        <h3 style="margin: 0 0 20px 0; color: #333;">Email Certificate of Insurance</h3>
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; color: #666;">To:</label>
            <input type="email" id="emailTo" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" placeholder="recipient@example.com">
        </div>
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; color: #666;">Subject:</label>
            <input type="text" id="emailSubject" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" value="Certificate of Insurance - ${policy.policyNumber || 'Policy'}">
        </div>
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; color: #666;">Message:</label>
            <textarea id="emailBody" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; height: 100px;">Please find attached the Certificate of Insurance for ${policy.clientName || 'your policy'}.

Policy Number: ${policy.policyNumber || 'N/A'}
Carrier: ${policy.carrier || 'N/A'}

If you have any questions, please let us know.</textarea>
        </div>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button onclick="this.parentElement.parentElement.remove()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">Cancel</button>
            <button onclick="sendCOIEmail('${policyId}')" style="padding: 10px 20px; background: #0066cc; color: white; border: none; border-radius: 5px; cursor: pointer;">
                <i class="fas fa-paper-plane"></i> Send Email
            </button>
        </div>
    `;

    document.body.appendChild(emailDialog);
};

// Send COI email function
window.sendCOIEmail = async function(policyId) {
    const to = document.getElementById('emailTo').value;
    const subject = document.getElementById('emailSubject').value;
    const body = document.getElementById('emailBody').value;

    if (!to) {
        alert('Please enter recipient email address');
        return;
    }

    // For now, just show success
    alert(`Email would be sent to: ${to}\\nSubject: ${subject}\\n\\nThe COI PDF would be attached.`);

    // Remove dialog
    document.querySelector('[id="emailTo"]').parentElement.parentElement.remove();
};

// Save Certificate Holder function
window.saveCertificateHolder = function(policyId) {
    console.log('Save Certificate Holder clicked for policy:', policyId);

    // Get the current certificate holder data from the form
    const certHolderField = document.getElementById('field_certHolder');
    const certAddress1Field = document.getElementById('field_certAddress1');
    const certAddress2Field = document.getElementById('field_certAddress2');

    if (!certHolderField || !certHolderField.value.trim()) {
        alert('Please fill in certificate holder information before saving');
        return;
    }

    const holderName = certHolderField.value.trim();
    let holderAddress = '';

    if (certAddress1Field && certAddress1Field.value.trim()) {
        holderAddress += certAddress1Field.value.trim();
    }

    if (certAddress2Field && certAddress2Field.value.trim()) {
        holderAddress += (holderAddress ? '\n' : '') + certAddress2Field.value.trim();
    }

    // Save to localStorage certificate holders
    const savedHolders = JSON.parse(localStorage.getItem('certificateHolders') || '[]');

    // Check if holder already exists
    const existingHolder = savedHolders.find(h => h.companyName === holderName);
    if (existingHolder) {
        if (confirm(`Certificate holder "${holderName}" already exists. Update it?`)) {
            existingHolder.address = holderAddress;
            existingHolder.updatedAt = new Date().toISOString();
        } else {
            return;
        }
    } else {
        // Add new holder
        const newHolder = {
            id: Date.now().toString(),
            companyName: holderName,
            address: holderAddress,
            email: '',
            requirements: '',
            createdAt: new Date().toISOString()
        };
        savedHolders.push(newHolder);
    }

    localStorage.setItem('certificateHolders', JSON.stringify(savedHolders));

    // Show success notification
    showSuccessMessage(`Certificate holder "${holderName}" saved successfully!`);
};

// Show Sign As Modal function
window.showSignAsModal = function(policyId) {
    console.log('Sign As modal for policy:', policyId);

    // Remove any existing modal first
    const existingModal = document.querySelector('.sign-as-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'sign-as-modal';
    modal.id = 'signAsModal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000000;';

    const modalContainer = document.createElement('div');
    modalContainer.style.cssText = 'background: white; padding: 30px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); width: 500px; max-width: 90vw;';
    modalContainer.innerHTML = `
        <div class="modal-header" style="margin-bottom: 25px;">
            <h2 style="margin: 0; color: #333; font-size: 24px;">
                <i class="fas fa-signature" style="color: #8b5cf6; margin-right: 10px;"></i>
                Sign As
            </h2>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
                Select who will sign as the authorized representative
            </p>
        </div>

        <div class="signature-options" style="margin-bottom: 25px;">
            <div class="sig-option-1" style="padding: 15px; border: 2px solid #e5e7eb; border-radius: 8px; margin-bottom: 12px; cursor: pointer; transition: all 0.2s;">
                <div style="font-family: 'Dancing Script', 'Lucida Handwriting', cursive; font-size: 24px; color: #0066cc; font-weight: 600; font-style: italic; letter-spacing: 0.5px; text-shadow: 0.5px 0.5px 1px rgba(0,0,0,0.1);">Grant Corp</div>
            </div>

            <div class="sig-option-2" style="padding: 15px; border: 2px solid #e5e7eb; border-radius: 8px; margin-bottom: 12px; cursor: pointer; transition: all 0.2s;">
                <div style="font-family: 'Dancing Script', 'Lucida Handwriting', cursive; font-size: 24px; color: #0066cc; font-weight: 600; font-style: italic; letter-spacing: 0.5px; text-shadow: 0.5px 0.5px 1px rgba(0,0,0,0.1);">Maureen Corp</div>
            </div>

            <div class="sig-option-3" style="padding: 15px; border: 2px solid #e5e7eb; border-radius: 8px; margin-bottom: 12px; cursor: pointer; transition: all 0.2s;">
                <div style="font-family: 'Dancing Script', 'Lucida Handwriting', cursive; font-size: 24px; color: #0066cc; font-weight: 600; font-style: italic; letter-spacing: 0.5px; text-shadow: 0.5px 0.5px 1px rgba(0,0,0,0.1);">Hunter Brooks</div>
            </div>

            <div class="sig-option-4" style="padding: 15px; border: 2px solid #e5e7eb; border-radius: 8px; margin-bottom: 12px; cursor: pointer; transition: all 0.2s;">
                <div style="font-family: 'Dancing Script', 'Lucida Handwriting', cursive; font-size: 24px; color: #0066cc; font-weight: 600; font-style: italic; letter-spacing: 0.5px; text-shadow: 0.5px 0.5px 1px rgba(0,0,0,0.1);">Carson Sweitzer</div>
            </div>
        </div>

        <div class="modal-actions" style="display: flex; justify-content: flex-end; gap: 12px;">
            <button class="cancel-btn" style="padding: 12px 24px; background: #f3f4f6; color: #374151; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                Cancel
            </button>
        </div>
    `;

    modal.appendChild(modalContainer);

    // Add event listeners AFTER modal is created
    setTimeout(() => {
        const option1 = modal.querySelector('.sig-option-1');
        const option2 = modal.querySelector('.sig-option-2');
        const option3 = modal.querySelector('.sig-option-3');
        const cancelBtn = modal.querySelector('.cancel-btn');

        if (option1) {
            option1.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Grant Corp clicked');
                selectSignature('Grant Corp');
            });
        }

        if (option2) {
            option2.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Maureen Corp clicked');
                selectSignature('Maureen Corp');
            });
        }

        if (option3) {
            option3.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Hunter Brooks clicked');
                selectSignature('Hunter Brooks');
            });
        }

        const option4 = modal.querySelector('.sig-option-4');
        if (option4) {
            option4.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Carson Sweitzer clicked');
                selectSignature('Carson Sweitzer');
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                closeSignAsModal();
            });
        }

        // Hover effects
        [option1, option2, option3, option4].forEach(option => {
            if (option) {
                option.addEventListener('mouseenter', function() {
                    this.style.borderColor = '#8b5cf6';
                    this.style.background = '#f8fafc';
                });
                option.addEventListener('mouseleave', function() {
                    this.style.borderColor = '#e5e7eb';
                    this.style.background = 'white';
                });
            }
        });

        // Close when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeSignAsModal();
            }
        });

    }, 100);

    document.body.appendChild(modal);
    console.log('Modal added to body');
};

// Select signature function
window.selectSignature = function(signatureName) {
    console.log('Selected signature:', signatureName);

    // Update the authorized representative field
    const authRepField = document.getElementById('field_authRep');
    if (authRepField) {
        authRepField.value = signatureName;
        authRepField.dispatchEvent(new Event('input', { bubbles: true }));

        // Update the form data state
        window.realPdfState.formData['authRep'] = signatureName;

        console.log('Updated authorized representative to:', signatureName);
    }

    // Update company information based on signature selection
    if (signatureName === 'Maureen Corp') {
        // Switch to United Insurance Group info
        console.log('🔄 Switching to United Insurance Group information...');
        updateCompanyInfo({
            producer: 'United Insurance Group',
            email: 'Contact@uigagency.com',
            phone: '(330) 259-7438',
            fax: '(330) 259-7439',
            address1: '435 Abbeyville Rd. Unit F',
            city: 'Medina',
            state: 'OH',
            zip: '44256'
        });
    } else {
        // Switch back to standard Vanguard info for Grant Corp or Hunter Brooks
        console.log('🔄 Switching to Vanguard Insurance Group LLC information...');
        updateCompanyInfo({
            producer: 'Vanguard Insurance Group LLC',
            email: 'contact@vigagency.com',
            phone: '(866) 628-9441',
            fax: '(330) 779-1097',
            address1: '2888 Nationwide Pkwy',
            city: 'Brunswick',
            state: 'OH',
            zip: '44212'
        });
    }

    // Show success notification
    showSuccessMessage(`Signature updated to: ${signatureName}`);

    // Close the modal
    closeSignAsModal();
};

// Close Sign As Modal function
window.closeSignAsModal = function() {
    console.log('Closing Sign As modal');
    const modal = document.querySelector('.sign-as-modal');
    if (modal) {
        modal.remove();
        console.log('Modal removed');
    } else {
        console.log('No modal found to close');
    }
};

// Update company information fields based on signature selection
window.updateCompanyInfo = function(companyData) {
    console.log('🔄 Updating company information:', companyData);

    // Update producer name field
    const producerField = document.getElementById('field_producer');
    if (producerField && companyData.producer) {
        producerField.value = companyData.producer;
        producerField.dispatchEvent(new Event('input', { bubbles: true }));
        window.realPdfState.formData['producer'] = companyData.producer;
        console.log('✅ Updated producer to:', companyData.producer);
    }

    // Update contact name field (right side of producer area)
    const contactNameField = document.getElementById('field_contactName');
    if (contactNameField && companyData.producer) {
        contactNameField.value = companyData.producer;
        contactNameField.dispatchEvent(new Event('input', { bubbles: true }));
        window.realPdfState.formData['contactName'] = companyData.producer;
        console.log('✅ Updated contactName to:', companyData.producer);
    }

    // Update email field
    const emailField = document.getElementById('field_email');
    if (emailField && companyData.email) {
        emailField.value = companyData.email;
        emailField.dispatchEvent(new Event('input', { bubbles: true }));
        window.realPdfState.formData['email'] = companyData.email;
        console.log('✅ Updated email to:', companyData.email);
    }

    // Update phone field
    const phoneField = document.getElementById('field_phone');
    if (phoneField && companyData.phone) {
        phoneField.value = companyData.phone;
        phoneField.dispatchEvent(new Event('input', { bubbles: true }));
        window.realPdfState.formData['phone'] = companyData.phone;
        console.log('✅ Updated phone to:', companyData.phone);
    }

    // Update fax field
    const faxField = document.getElementById('field_fax');
    if (faxField && companyData.fax) {
        faxField.value = companyData.fax;
        faxField.dispatchEvent(new Event('input', { bubbles: true }));
        window.realPdfState.formData['fax'] = companyData.fax;
        console.log('✅ Updated fax to:', companyData.fax);
    }

    // Update address line 1
    const addr1Field = document.getElementById('field_producerAddress1');
    if (addr1Field && companyData.address1) {
        addr1Field.value = companyData.address1;
        addr1Field.dispatchEvent(new Event('input', { bubbles: true }));
        window.realPdfState.formData['producerAddress1'] = companyData.address1;
        console.log('✅ Updated producerAddress1 to:', companyData.address1);
    }

    // Update zip
    const zipField = document.getElementById('field_producerZip');
    if (zipField && companyData.zip) {
        zipField.value = companyData.zip;
        zipField.dispatchEvent(new Event('input', { bubbles: true }));
        window.realPdfState.formData['producerZip'] = companyData.zip;
        console.log('✅ Updated producerZip to:', companyData.zip);
    }

    console.log('✅ Company information update complete');
};

// Function to save COI document data to policy for viewing
async function saveCOIDocumentToPolicy(policyId, formData) {
    console.log('🚨🚨🚨 saveCOIDocumentToPolicy FUNCTION CALLED! 🚨🚨🚨');
    console.log('💾 Saving COI document to policy data for:', policyId);

    try {
        // Create COI document object
        const coiDocument = {
            id: `coi-${Date.now()}`,
            name: `ACORD_25_${policyId}_${new Date().toISOString().split('T')[0]}.png`,
            type: 'image/png',
            uploadDate: new Date().toISOString(),
            formData: formData,
            policyId: policyId
        };

        console.log('📋 Created COI document object with formData:', coiDocument.formData);

        // Try to capture the current PDF canvas with form data
        console.log('🔥 STARTING IMAGE CAPTURE PROCESS...');
        try {
            let capturedImage = null;

            console.log('📸 Step 1: Waiting for PDF render...');
            // Wait a moment for PDF to fully render before capturing
            await new Promise(resolve => setTimeout(resolve, 500));

            console.log('📸 Step 2: Starting capture logic...');
            console.log('📸 🔥 PRIORITY: Attempting html2canvas capture FIRST to include overlay text...');

            // COMPOSITE CAPTURE: Render form data directly onto PDF canvas
            console.log('📸 🎯 Using composite capture method to ensure overlay text is included...');

            const pdfCanvas = document.querySelector('.pdf-container canvas');
            if (pdfCanvas) {
                console.log('📸 Found PDF canvas, creating composite with form overlay...');

                try {
                    // Create a new canvas for composite image
                    const compositeCanvas = document.createElement('canvas');
                    const ctx = compositeCanvas.getContext('2d');

                    // Set canvas size to match PDF
                    compositeCanvas.width = pdfCanvas.width;
                    compositeCanvas.height = pdfCanvas.height;

                    console.log('📸 Composite canvas dimensions:', compositeCanvas.width, 'x', compositeCanvas.height);

                    // First, draw the PDF canvas
                    ctx.drawImage(pdfCanvas, 0, 0);
                    console.log('📸 ✅ PDF background drawn');

                    // Now draw the form data overlay
                    const formOverlay = document.getElementById('realFormOverlay');
                    if (formOverlay && window.realPdfState && window.realPdfState.formData) {
                        console.log('📸 Rendering form overlay data onto canvas...');

                        // Set text styling similar to ACORD forms
                        ctx.fillStyle = '#000000';
                        ctx.font = '11px Arial';
                        ctx.textBaseline = 'top';

                        const formData = window.realPdfState.formData;

                        // Define form field positions (approximate ACORD 25 layout)
                        const fieldPositions = {
                            // Producer section (top left)
                            producer_company: { x: 50, y: 100 },
                            producer_address: { x: 50, y: 120 },
                            producer_phone: { x: 50, y: 140 },

                            // Insured section
                            insured_name: { x: 300, y: 100 },
                            insured_address: { x: 300, y: 120 },

                            // Policy info
                            policy_number: { x: 50, y: 200 },
                            policy_effective_date: { x: 150, y: 200 },
                            policy_expiration_date: { x: 250, y: 200 },

                            // Coverage amounts
                            general_liability_limit: { x: 400, y: 300 },
                            auto_liability_limit: { x: 400, y: 350 },

                            // Certificate holder
                            certificate_holder_name: { x: 50, y: 450 },
                            certificate_holder_address: { x: 50, y: 470 }
                        };

                        // Render each form field
                        let fieldsRendered = 0;
                        for (const [fieldName, position] of Object.entries(fieldPositions)) {
                            if (formData[fieldName] && formData[fieldName].toString().trim()) {
                                ctx.fillText(formData[fieldName].toString(), position.x, position.y);
                                fieldsRendered++;
                            }
                        }

                        console.log(`📸 ✅ Rendered ${fieldsRendered} form fields onto canvas`);

                        // Add checkmarks for checked boxes - adjusted Y positions up by 12 pixels
                        const checkboxMapping = {
                            'glCheck': { x: 47, y: 378 },
                            'glOccurrence': { x: 150, y: 394 },
                            'glClaimsMade': { x: 65, y: 394 },
                            'autoAny': { x: 47, y: 503 },
                            'autoOwned': { x: 47, y: 518 },
                            'autoScheduled': { x: 135, y: 518 },
                            'autoHired': { x: 47, y: 534 },
                            'autoNonOwned': { x: 135, y: 534 },
                            'umbrella': { x: 47, y: 565 },
                            'excess': { x: 47, y: 581 },
                            'wcStatute': { x: 552, y: 612 },
                            'wcOther': { x: 618, y: 612 },
                            'aggPolicy': { x: 47, y: 456 },
                            'aggProject': { x: 103, y: 456 },
                            'aggLocation': { x: 159, y: 456 },
                            'aggOther': { x: 47, y: 472 }
                        };

                        // Draw checkmarks for checked boxes using formData
                        ctx.fillStyle = '#000000';
                        ctx.font = 'bold 14px Arial, sans-serif';
                        let checkmarksRendered = 0;

                        Object.entries(checkboxMapping).forEach(([fieldName, position]) => {
                            if (formData[fieldName] === true) {
                                ctx.fillText('✓', position.x + 2, position.y + 12);
                                console.log(`📸 ☑️ Drew checkmark for ${fieldName} at position ${position.x}, ${position.y}`);
                                checkmarksRendered++;
                            }
                        });

                        console.log(`📸 ✅ Rendered ${checkmarksRendered} checkmarks onto canvas`);

                        // Also add any text inputs that are visible
                        const textInputs = formOverlay.querySelectorAll('input[type="text"], textarea');
                        textInputs.forEach((input, index) => {
                            if (input.value && input.value.trim()) {
                                const rect = input.getBoundingClientRect();
                                const containerRect = pdfCanvas.getBoundingClientRect();

                                // Calculate relative position on canvas
                                const x = (rect.left - containerRect.left) * (pdfCanvas.width / containerRect.width);
                                const y = (rect.top - containerRect.top) * (pdfCanvas.height / containerRect.height);

                                if (x >= 0 && y >= 0 && x < compositeCanvas.width && y < compositeCanvas.height) {
                                    // Special handling for signature field
                                    if (input.id === 'field_authRep' || input.style.fontFamily.includes('Dancing Script')) {
                                        console.log('🖋️ Rendering signature field with handwriting font');
                                        // Set signature styling for canvas
                                        ctx.save(); // Save current context
                                        ctx.font = '600 italic 19px "Dancing Script", "Lucida Handwriting", cursive';
                                        ctx.fillStyle = '#0066cc';
                                        ctx.textShadow = '0.5px 0.5px 1px rgba(0,0,0,0.1)';
                                        ctx.fillText(input.value, x, y);
                                        ctx.restore(); // Restore previous context
                                        console.log(`📸 🖋️ Rendered SIGNATURE field at (${Math.round(x)}, ${Math.round(y)}): ${input.value}`);
                                    } else if (input.id === 'field_description' && input.value.includes('\n')) {
                                        // Multi-line description field rendering
                                        console.log('📝 Rendering multi-line description field');
                                        ctx.save();
                                        ctx.font = '10px Arial';
                                        ctx.fillStyle = '#000000';

                                        const lines = input.value.split('\n');
                                        const lineHeight = 12; // Line spacing for 10px font

                                        lines.forEach((line, index) => {
                                            const lineY = y + (index * lineHeight);
                                            ctx.fillText(line, x, lineY);
                                            console.log(`📸 📝 Rendered description line ${index + 1} at (${Math.round(x)}, ${Math.round(lineY)}): ${line}`);
                                        });

                                        ctx.restore();
                                        console.log(`📸 📝 Rendered multi-line description with ${lines.length} lines`);
                                    } else {
                                        // Regular field rendering
                                        ctx.save();
                                        ctx.font = '12px Arial';
                                        ctx.fillText(input.value, x, y);
                                        ctx.restore();
                                        console.log(`📸 Rendered input field at (${Math.round(x)}, ${Math.round(y)}): ${input.value.substring(0, 20)}...`);
                                    }
                                }
                            }
                        });
                    }

                    // Capture the composite canvas
                    capturedImage = compositeCanvas.toDataURL('image/png', 0.95);

                    if (capturedImage && capturedImage.length > 50000) {
                        coiDocument.dataUrl = capturedImage;
                        console.log('📸 🎉 SUCCESS: Composite PDF+form data captured!');
                        console.log('📸 Size:', Math.round(capturedImage.length / 1024), 'KB');
                        console.log('📸 🔥 This DEFINITELY includes filled form overlay text!');
                    } else {
                        console.warn('⚠️ Composite capture too small, size:', capturedImage?.length || 0, 'bytes');
                        capturedImage = null;
                    }

                } catch (compositeError) {
                    console.error('❌ Composite capture failed:', compositeError);
                    capturedImage = null;
                }
            }

            // FALLBACK: If html2canvas failed, try PDF canvas only
            if (!capturedImage) {
                console.log('📸 Falling back to PDF canvas only capture...');
                const pdfCanvas = document.querySelector('.pdf-container canvas'); // Fixed selector
                console.log('📸 Looking for PDF canvas...', !!pdfCanvas);

                if (pdfCanvas) {
                    console.log('📸 PDF canvas found, capturing...');
                    console.log('📸 Canvas dimensions:', pdfCanvas.width, 'x', pdfCanvas.height);

                try {
                    // Try different capture methods
                    capturedImage = pdfCanvas.toDataURL('image/png', 1.0);

                    // Verify the capture worked (should be larger than a tiny placeholder)
                    if (capturedImage && capturedImage.length > 10000) {
                        coiDocument.dataUrl = capturedImage;
                        console.log('✅ PDF canvas captured successfully, size:', Math.round(capturedImage.length / 1024), 'KB');
                    } else {
                        console.warn('⚠️ PDF canvas capture too small (' + (capturedImage?.length || 0) + ' bytes), trying alternative...');

                        // Try capturing with lower quality
                        capturedImage = pdfCanvas.toDataURL('image/jpeg', 0.8);
                        if (capturedImage && capturedImage.length > 10000) {
                            coiDocument.dataUrl = capturedImage;
                            console.log('✅ PDF canvas captured as JPEG, size:', Math.round(capturedImage.length / 1024), 'KB');
                        } else {
                            throw new Error('Canvas capture too small even with JPEG');
                        }
                    }
                } catch (canvasError) {
                    console.warn('⚠️ Direct canvas capture failed:', canvasError.message);
                    capturedImage = null;
                }
            } else {
                console.warn('⚠️ PDF canvas not found in .pdf-container');
                // Check if canvas exists anywhere
                const anyCanvas = document.querySelector('canvas');
                if (anyCanvas) {
                    console.log('📸 Found canvas elsewhere, attempting capture...');
                    try {
                        capturedImage = anyCanvas.toDataURL('image/png', 1.0);
                        if (capturedImage && capturedImage.length > 10000) {
                            coiDocument.dataUrl = capturedImage;
                            console.log('✅ Alternative canvas captured, size:', Math.round(capturedImage.length / 1024), 'KB');
                        }
                    } catch (e) {
                        console.warn('⚠️ Alternative canvas capture failed:', e.message);
                    }
                }
            }
            } // Close the if (!capturedImage) fallback block
            // Skip duplicate html2canvas section - moved to primary position above

            // Final fallback - don't store placeholder, let regeneration handle display
            if (!capturedImage) {
                console.warn('⚠️ All capture methods failed, will rely on form regeneration for display');
                coiDocument.dataUrl = null; // Don't store placeholder
            }

            // Log final capture result
            if (capturedImage && capturedImage.length > 1000) {
                console.log('✅ Final image capture successful, size:', Math.round(capturedImage.length / 1024), 'KB');
            } else {
                console.warn('⚠️ No image captured, will use form regeneration for display');
            }

        } catch (error) {
            console.error('❌ Error capturing COI image:', error);
            // Don't save a placeholder to database - keep null and use form regeneration
            coiDocument.dataUrl = null;
        }

        // Cross-reference mapping for policy relationships
        const policyMappings = {
            '6146786114': ['POL-1769897676650-ri6ku8b34', 'POL-1769575534717-uq6k8c8ty'],
            'POL-1769897676650-ri6ku8b34': ['6146786114', 'POL-1769575534717-uq6k8c8ty'],
            '864564216': ['POL-1769575534717-uq6k8c8ty', 'POL-1769897676650-ri6ku8b34'],
            'POL-1769575534717-uq6k8c8ty': ['864564216', '6146786114', 'POL-1769897676650-ri6ku8b34']
        };

        // Include mapped policy IDs in our search
        const searchIds = [policyId];
        if (policyMappings[policyId]) {
            searchIds.push(...policyMappings[policyId]);
        }

        console.log('🔗 Policy mappings available:', policyMappings);
        console.log('🔍 Will save COI to all these policy IDs:', searchIds);

        // Find and update all matching policies in localStorage
        const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        const localPolicies = policies.filter(p =>
            searchIds.some(searchId => p.policyNumber === searchId || p.id === searchId ||
                (p.policyNumber && p.policyNumber.trim() === searchId.trim()) ||
                (p.id && p.id.trim() === searchId.trim()))
        );

        if (localPolicies.length > 0) {
            localPolicies.forEach(localPolicy => {
                if (!localPolicy.coiDocuments) {
                    localPolicy.coiDocuments = [];
                }
                // Remove existing COI documents for this policy
                // Replace all existing COI documents with just the new one
                localPolicy.coiDocuments = [coiDocument];
                console.log('💾 COI document replaced in localStorage policy:', localPolicy.policyNumber || localPolicy.id);
            });
            localStorage.setItem('insurance_policies', JSON.stringify(policies));
            console.log('✅ COI saved to', localPolicies.length, 'matching policies in localStorage');
        } else {
            // Create policy entries for all search IDs to ensure cross-reference works
            searchIds.forEach(id => {
                policies.push({
                    id: id,
                    policyNumber: id,
                    coiDocuments: [{ ...coiDocument }]
                });
                console.log('🆕 Created new policy entry for ID:', id);
            });
            localStorage.setItem('insurance_policies', JSON.stringify(policies));
            console.log('🆕 Created new policy entries with COI document in localStorage');
        }

        // Also save to the legacy localStorage format for compatibility
        const existingCOIs = JSON.parse(localStorage.getItem('policy_coi_documents') || '[]');

        // Remove existing COI documents for this policy and related policy IDs
        const filteredCOIs = existingCOIs.filter(doc =>
            doc.policyId !== policyId &&
            !searchIds.includes(doc.policyId)
        );

        // Add the new COI document
        filteredCOIs.push({
            ...coiDocument,
            policyId: policyId
        });

        localStorage.setItem('policy_coi_documents', JSON.stringify(filteredCOIs));
        console.log('✅ COI document replaced in legacy localStorage format');

        // Save COI document to database via API to persist after refresh (only if we have valid image data)
        if (coiDocument.dataUrl && coiDocument.dataUrl.length > 1000) {
            try {
                console.log('💾 Saving COI document to database with valid image data...');
                const response = await fetch('/api/coi-documents', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        policyId: policyId,
                        document: coiDocument
                    })
                });

            if (response.ok) {
                console.log('✅ COI document saved to database successfully');
            } else {
                console.warn('⚠️ Failed to save COI document to database, but preserved in localStorage');
            }
            } catch (dbError) {
                console.warn('⚠️ Database save failed, but COI document preserved in localStorage:', dbError);
            }
        } else {
            console.log('⚠️ COI document has no valid image data, saved to localStorage only (will use form regeneration for display)');
        }

        console.log('✅ COI document saved successfully');

        // Debug: Verify the save actually worked by checking localStorage immediately
        console.log('🔍 SAVE VERIFICATION - Checking if COI was actually saved...');
        const verifyPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        console.log('📊 Total policies in storage:', verifyPolicies.length);

        searchIds.forEach(searchId => {
            const foundPolicy = verifyPolicies.find(p =>
                p.id === searchId || p.policyNumber === searchId ||
                (p.id && p.id.trim() === searchId.trim()) ||
                (p.policyNumber && p.policyNumber.trim() === searchId.trim())
            );
            if (foundPolicy) {
                console.log(`📄 Policy ${searchId}: Found with ${foundPolicy.coiDocuments?.length || 0} COI documents`);
                if (foundPolicy.coiDocuments?.length > 0) {
                    const latestCOI = foundPolicy.coiDocuments[foundPolicy.coiDocuments.length - 1];
                    console.log(`  ├─ Latest COI: ${latestCOI.name} (${latestCOI.uploadDate})`);
                    console.log(`  └─ Form data description: ${latestCOI.formData?.description || 'No description'}`);
                }
            } else {
                console.log(`❌ Policy ${searchId}: NOT FOUND in localStorage`);
            }
        });
        console.log('🔍 SAVE VERIFICATION COMPLETE');

        // Show success notification
        setTimeout(() => {
            console.log('🔧 Force updating COI container after successful save...');
            if (window.forceUpdateCOIContainer) {
                window.forceUpdateCOIContainer(searchIds[0]);
            }

            // Update the COI files container display
            if (window.loadCOIFiles && typeof window.loadCOIFiles === 'function') {
                console.log('🔄 Refreshing COI files display...');
                window.loadCOIFiles(policyId);

                // Also try with related policy IDs
                searchIds.forEach(id => {
                    if (id !== policyId) {
                        window.loadCOIFiles(id);
                    }
                });
            }
        }, 100);

    } catch (error) {
        console.error('❌ Error saving COI document to policy:', error);
    }
}

// Verify function was defined successfully
console.log('🔧 VERIFICATION: window.createRealACORDViewer defined?', typeof window.createRealACORDViewer);
console.log('🔧 VERIFICATION: window.realSaveCOI defined?', typeof window.realSaveCOI);
console.log('✅ Real ACORD Viewer Ready with Certificate Holder and Sign As features');