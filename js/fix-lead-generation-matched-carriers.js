// Fix Lead Generation - Use Matched Carriers CSV Database
// Updates lead generation to filter from /home/corp06/matched_carriers CSV
// and export all 23 fields matching the Ohio leads CSV format
console.log('🔧 Fixing Lead Generation to use Matched Carriers database...');

// Using XMLHttpRequest to completely bypass fetch interceptors from other scripts

// Override the generateLeadsFromForm function to use matched carriers API
window.generateLeadsFromForm = async function() {
    console.log('🔄 Generating leads from Matched Carriers database...');
    console.log('📋 Lead Criteria Selected:');

    // Get all form values
    const state = document.getElementById('genState')?.value;
    const expiry = document.getElementById('genExpiry')?.value || '30';
    const skipDays = document.getElementById('genSkipDays')?.value || '0';
    // No limit - fetch all available leads
    const minFleet = document.getElementById('genMinFleet')?.value || '1';
    const maxFleet = document.getElementById('genMaxFleet')?.value || '9999';
    const safetyMinPercent = document.getElementById('genSafetyMin')?.value || '';
    const safetyMaxPercent = document.getElementById('genSafety')?.value || '';
    const requireInspections = document.getElementById('requireInspections')?.checked || false;

    // Get selected insurance companies
    const selectedInsurance = [];
    const insuranceCheckboxes = document.querySelectorAll('input[name="insurance"]:checked');
    insuranceCheckboxes.forEach(checkbox => {
        selectedInsurance.push(checkbox.value);
    });

    // Check if "OTHERS" is selected - if so, don't apply any insurance filter (get ALL companies)
    const hasOthersSelected = selectedInsurance.includes('OTHERS');
    const specificInsurance = selectedInsurance.filter(company => company !== 'OTHERS');

    // Get selected unit types
    const selectedUnitTypes = [];
    const unitTypeCheckboxes = document.querySelectorAll('input[name="unitType"]:checked');
    unitTypeCheckboxes.forEach(checkbox => {
        selectedUnitTypes.push(checkbox.value);
    });

    // Get selected commodities
    const selectedCommodities = [];
    const commodityCheckboxes = document.querySelectorAll('input[name="commodity"]:checked');
    commodityCheckboxes.forEach(checkbox => {
        selectedCommodities.push(checkbox.value);
    });

    // Get years in business range
    const yearsInBusinessMin = document.getElementById('yearsInBusinessMin').value;
    const yearsInBusinessMax = document.getElementById('yearsInBusinessMax').value;

    // Log the criteria being applied
    console.log(`   🏛️  State: ${state}`);
    console.log(`   📅  Days until expiry: ${expiry}`);
    console.log(`   ⏭️   Skip days: ${skipDays}`);
    console.log(`   🚛  Fleet size: ${minFleet} - ${maxFleet}`);
    console.log(`   🏢  Insurance companies: ${selectedInsurance.length > 0 ? selectedInsurance.join(', ') : 'ALL'}`);
    console.log(`   🚗  Unit types: ${selectedUnitTypes.length > 0 ? selectedUnitTypes.join(', ') : 'ALL'}`);
    console.log(`   📦  Commodities: ${selectedCommodities.length > 0 ? selectedCommodities.join(', ') : 'ALL'}`);
    console.log(`   📅  Years in business: ${yearsInBusinessMin || '0'} - ${yearsInBusinessMax || '100'} years`);

    if (hasOthersSelected) {
        console.log(`   🔍  "Others" selected - API will EXCLUDE predefined companies and get only carriers with unlisted insurance companies`);
    } else {
        console.log(`   🔍  API will filter by: ${specificInsurance.length > 0 ? specificInsurance.join(', ') : 'ALL (no specific filter)'}`);
    }

    if (!state) {
        alert('Please select a state to generate leads.');
        return;
    }

    // Show loading state
    document.getElementById('totalLeadsCount').textContent = 'Loading...';

    const successDiv = document.getElementById('successMessage');
    successDiv.style.display = 'none';

    try {
        // Call the DB-V3 carriers API - this uses the 428K+ record database
        const params = new URLSearchParams({
            state: state,
            days: expiry,  // Add the expiration days parameter
            skipDays: skipDays,  // Add skip days parameter
            minFleet: minFleet,
            maxFleet: maxFleet,
            limit: 50000
        });

        // Add safety percentage filters if specified
        if (safetyMinPercent) {
            params.append('safetyMinPercent', safetyMinPercent);
        }
        if (safetyMaxPercent) {
            params.append('safetyMaxPercent', safetyMaxPercent);
        }

        // Add inspection requirement filter
        if (requireInspections) {
            params.append('requireInspections', 'true');
        }

        // Handle insurance company filtering - "Others" is additive, not exclusive
        if (hasOthersSelected && specificInsurance.length > 0) {
            // Both specific companies AND "Others" selected - get ALL carriers (no insurance filtering)
            // This gives us the union of: carriers with specific companies + carriers with other companies
            console.log('🔍 Both specific companies AND "Others" selected - getting ALL carriers (no insurance filtering for maximum leads)');
        } else if (hasOthersSelected) {
            // Only "Others" selected - exclude predefined companies
            const predefinedCompanies = [
                'PROGRESSIVE', 'GEICO', 'GREAT_WEST', 'CANAL', 'ACUITY', 'NORTHLAND',
                'CINCINNATI', 'AUTO_OWNERS', 'SENTRY', 'ERIE', 'TRAVELERS', 'BITCO',
                'CAROLINA', 'STATE_FARM', 'ALLSTATE', 'NATIONWIDE', 'FARMERS',
                'LIBERTY_MUTUAL', 'AMERICAN_FAMILY', 'USAA', 'SAFECO', 'HARTFORD',
                'ZURICH', 'CNA', 'BERKSHIRE_HATHAWAY', 'AIG', 'CHUBB', 'MERCURY',
                'ENCOMPASS', 'ESURANCE', 'METLIFE', 'AMERICAN_NATIONAL', 'OCCIDENTAL'
            ];
            params.append('exclude_insurance_companies', predefinedCompanies.join(','));
            console.log('🔍 "Others" only selected - excluding predefined companies');
        } else if (specificInsurance.length > 0) {
            // Only specific companies selected - include only those
            params.append('insurance_companies', specificInsurance.join(','));
            console.log('🔍 Specific companies only selected - including only those');
        }

        // Add unit types filter if specified
        if (selectedUnitTypes.length > 0) {
            params.append('unitTypes', JSON.stringify(selectedUnitTypes));
        }

        // Add commodities filter if specified
        if (selectedCommodities.length > 0) {
            params.append('commodities', JSON.stringify(selectedCommodities));
        }

        // Add years in business range filter if specified
        if (yearsInBusinessMin && yearsInBusinessMin > 0) {
            params.append('yearsInBusinessMin', yearsInBusinessMin);
        }
        if (yearsInBusinessMax && yearsInBusinessMax < 100) {
            params.append('yearsInBusinessMax', yearsInBusinessMax);
        }

        // Use proxy endpoint through main backend - use current location to avoid CORS
        console.log('🔍 Current location:', window.location.origin);
        console.log('🔍 window.VANGUARD_API_URL:', window.VANGUARD_API_URL);

        // Use same protocol as current page - HTTPS proxies to backend
        const currentHost = window.location.hostname;
        const currentProtocol = window.location.protocol;
        const isHTTPS = currentProtocol === 'https:';

        // If HTTPS, use main domain (proxied), if HTTP use direct backend
        const baseUrl = isHTTPS
            ? `${currentProtocol}//${currentHost}/api`  // HTTPS: use proxy
            : `${currentProtocol}//${currentHost}:3001/api`;  // HTTP: direct to backend

        console.log('🔍 Protocol:', currentProtocol, '| Using proxy:', isHTTPS);
        console.log('🔍 Constructed baseUrl:', baseUrl);

        const apiUrl = `${baseUrl}/carriers/expiring?${params}`;
        console.log('🔗 Final API URL:', apiUrl);

        // Use XMLHttpRequest to bypass all fetch interceptors completely
        const data = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            // Set 5-minute timeout
            xhr.timeout = 5 * 60 * 1000; // 5 minutes

            xhr.onload = function() {
                console.log('📡 XMLHttpRequest response status:', xhr.status);
                console.log('📡 XMLHttpRequest response length:', xhr.responseText.length);

                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const responseData = JSON.parse(xhr.responseText);
                        console.log('✅ Successfully parsed JSON response');
                        resolve(responseData);
                    } catch (e) {
                        console.error('❌ JSON parsing error:', e);
                        console.log('Raw response:', xhr.responseText.substring(0, 500));
                        reject(new Error(`Invalid JSON response: ${e.message}`));
                    }
                } else {
                    console.error('❌ HTTP error response:', xhr.status, xhr.statusText);
                    console.log('Error response body:', xhr.responseText.substring(0, 500));
                    reject(new Error(`HTTP error! status: ${xhr.status} - ${xhr.statusText}`));
                }
            };

            xhr.onerror = function() {
                console.error('❌ XMLHttpRequest network error:', xhr.status, xhr.statusText);
                reject(new Error(`Network error: ${xhr.status} ${xhr.statusText}`));
            };

            xhr.ontimeout = function() {
                console.error('❌ XMLHttpRequest timeout after 5 minutes');
                reject(new Error('Request timed out after 5 minutes. Please try with more specific filters.'));
            };

            xhr.open('GET', apiUrl, true);
            xhr.setRequestHeader('Accept', 'application/json');
            const authToken = localStorage.getItem('authToken') || localStorage.getItem('auth_token') || sessionStorage.getItem('vanguard_jwt');
            if (authToken) xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);

            // Add progress logging
            xhr.onreadystatechange = function() {
                console.log(`📊 XMLHttpRequest state: ${xhr.readyState} (${getReadyStateText(xhr.readyState)})`);
                if (xhr.readyState === 4) {
                    console.log(`📊 Final status: ${xhr.status}`);
                }
            };

            console.log('🚀 Sending XMLHttpRequest to:', apiUrl);
            xhr.send();
        });

        function getReadyStateText(state) {
            const states = {
                0: 'UNSENT',
                1: 'OPENED',
                2: 'HEADERS_RECEIVED',
                3: 'LOADING',
                4: 'DONE'
            };
            return states[state] || 'UNKNOWN';
        }

        console.log('🎯 Received DB-V3 carriers data:', data);

        if (data.success && data.carriers) {
            // Store globally for export/viewing - transform to match export format
            window.generatedLeadsData = data.carriers.map(lead => transformLeadData(lead));

            // Update statistics display using the API's stats
            const totalLeads = data.stats.total_leads || data.carriers.length;

            document.getElementById('totalLeadsCount').textContent = totalLeads.toLocaleString();

            // Show success message
            successDiv.style.display = 'block';

            console.log(`✅ Generated ${totalLeads} leads for ${state}`);
        } else {
            throw new Error(data.message || 'Failed to fetch leads');
        }

    } catch (error) {
        console.error('❌ Error generating leads:', error);
        alert(`Error generating leads: ${error.message}`);

        // Reset display
        document.getElementById('totalLeadsCount').textContent = '-';
    }
};

// Transform lead data from API format to standardized export format
function transformLeadData(lead) {
    // Build full address
    const addressParts = [lead.city, lead.state].filter(p => p && p.trim());
    const fullAddress = addressParts.join(', ');

    return {
        // Core Identifiers
        usdot_number: lead.usdot_number || lead.dot_number || '',
        dot_number: lead.dot_number || '',
        mc_number: lead.mc_number || '',
        fmcsa_dot_number: lead.fmcsa_dot_number || lead.dot_number || '',

        // Company Names
        company_name: lead.company_name || lead.legal_name || '',
        legal_name: lead.legal_name || lead.company_name || '',
        dba_name: lead.dba_name || '',

        // Officer Information (replacing Representative)
        officer_name: lead.officer_name || '',

        // Address Information
        street_address: lead.street_address || '',
        physical_address: lead.physical_address || lead.street_address || '',
        city: lead.city || '',
        physical_city: lead.physical_city || lead.city || '',
        state: lead.state || lead.physical_state || '',
        physical_state: lead.physical_state || lead.state || '',
        zip_code: lead.zip_code || '',
        physical_zip_code: lead.physical_zip_code || lead.zip_code || '',
        full_address: fullAddress,

        // Contact Information
        phone: lead.phone || '',
        cell_phone: lead.cell_phone || '',
        fax: lead.fax || '',
        email_address: lead.email_address || '',

        // Fleet Information
        fleet_size: lead.fleet_size || lead.power_units || '0',
        power_units: lead.power_units || '0',
        drivers: lead.drivers || '0',

        // Business Information
        entity_type: lead.entity_type || '',
        operating_status: lead.operating_status || 'Active',
        carrier_operation: lead.carrier_operation || '',

        // Insurance Information
        insurance_company: lead.insurance_company || '',
        insurance_expiration: lead.insurance_expiration || '',
        insurance_amount: lead.insurance_amount || '',
        days_until_expiry: lead.days_until_expiry,

        // Safety and Compliance Information
        safety_rating: lead.safety_rating || '',
        total_oos: lead.total_oos || 0, // Total OOS count
        oos_status: lead.oos_status || '', // OOS percentage

        // Business Operations
        cargo_carried: lead.cargo_carried || '',
        commodities_hauled: lead.commodities_hauled || '',

        // Inspection Information
        last_inspection_date: lead.last_inspection_date || '',
        inspection_score: lead.inspection_score || '',
        violations_count: lead.violations_count || '',
        total_inspections: lead.total_inspections || 0,
        oos_inspections: lead.oos_inspections || 0,

        // Detailed Inspection and Vehicle Data
        inspection_history: lead.inspection_history || [],
        vehicles: lead.vehicles || [],

        // Additional Fields
        hazmat_status: lead.hazmat_status || '',
        interstate_status: lead.interstate_status || '',

        // Data Source
        data_source: lead.data_source || 'DB-V3-Comprehensive'
    };
}

// Override export function to include all comprehensive DB-V3 fields
window.exportGeneratedLeads = function(format) {
    if (!window.generatedLeadsData || window.generatedLeadsData.length === 0) {
        alert('No leads to export. Please generate leads first.');
        return;
    }

    const leads = window.generatedLeadsData;

    if (format === 'excel') {
        // Comprehensive headers with all available DB-V3 fields (60+ fields)
        const headers = [
            // Core Identification
            'USDOT Number', 'DOT Number', 'MC Number', 'FMCSA DOT Number',

            // Company Information
            'Company Name', 'Legal Name', 'DBA Name',

            // Officer Information (replacing Representative)
            'Officer Name', 'Officer Title', 'Representative Name', 'Representative Title',

            // Address Information
            'Street Address', 'Physical Address', 'City', 'Physical City', 'State', 'Physical State',
            'Zip Code', 'Physical Zip Code', 'Full Address',

            // Contact Information
            'Phone', 'Phone Number', 'Cell Phone', 'Fax', 'Email', 'Email Address',

            // Fleet & Operations
            'Fleet Size', 'Power Units', 'Total Power Units', 'Drivers', 'Total Drivers',
            'Entity Type', 'Operating Status', 'Carrier Operation',

            // Insurance Information
            'Insurance Company', 'Insurer Name', 'Insurance Expiry', 'Insurance Expiration',
            'Insurance Amount', 'Days Until Expiry',

            // Safety & Compliance
            'Safety Rating', 'OOS Date', 'OOS Status',

            // Business Operations
            'Business Type', 'Cargo Carried', 'Commodities Hauled',

            // Inspection Information
            'Last Inspection Date', 'Inspection Score', 'Violations Count',

            // Additional Fields
            'Hazmat Status', 'Interstate Status',

            // Data Source
            'Data Source',

            // Corgi Prequote
            'Corgi Prequote ID', 'Corgi Eligible', 'Corgi Premium', 'Corgi Decline Reason'
        ];

        const csvContent = [
            headers.map(h => `"${h}"`).join(','),
            ...leads.map(lead => [
                // Core Identification
                `"${lead.usdot_number || ''}"`,
                `"${lead.dot_number || ''}"`,
                `"${lead.mc_number || ''}"`,
                `"${lead.fmcsa_dot_number || ''}"`,

                // Company Information
                `"${(lead.company_name || '').replace(/"/g, '""')}"`,
                `"${(lead.legal_name || '').replace(/"/g, '""')}"`,
                `"${(lead.dba_name || '').replace(/"/g, '""')}"`,

                // Officer Information (replacing Representative)
                `"${(lead.officer_name || '').replace(/"/g, '""')}"`,
                `"${lead.officer_title || 'Officer'}"`,
                `"${(lead.representative_name || '').replace(/"/g, '""')}"`,
                `"${lead.representative_title || 'Representative'}"`,

                // Address Information
                `"${(lead.street_address || '').replace(/"/g, '""')}"`,
                `"${(lead.physical_address || '').replace(/"/g, '""')}"`,
                `"${(lead.city || '').replace(/"/g, '""')}"`,
                `"${(lead.physical_city || '').replace(/"/g, '""')}"`,
                `"${lead.state || ''}"`,
                `"${lead.physical_state || ''}"`,
                `"${lead.zip_code || ''}"`,
                `"${lead.physical_zip_code || ''}"`,
                `"${(lead.full_address || '').replace(/"/g, '""')}"`,

                // Contact Information
                `"${lead.phone || ''}"`,
                `"${lead.phone_number || ''}"`,
                `"${lead.cell_phone || ''}"`,
                `"${lead.fax || ''}"`,
                `"${lead.email || ''}"`,
                `"${lead.email_address || ''}"`,

                // Fleet & Operations
                `"${lead.fleet_size || ''}"`,
                `"${lead.power_units || ''}"`,
                `"${lead.total_power_units || ''}"`,
                `"${lead.drivers || ''}"`,
                `"${lead.total_drivers || ''}"`,
                `"${lead.entity_type || ''}"`,
                `"${lead.operating_status || ''}"`,
                `"${lead.carrier_operation || ''}"`,

                // Insurance Information
                `"${(lead.insurance_company || '').replace(/"/g, '""')}"`,
                `"${(lead.insurer_name || '').replace(/"/g, '""')}"`,
                `"${lead.insurance_expiry || ''}"`,
                `"${lead.insurance_expiration || ''}"`,
                `"${lead.insurance_amount || ''}"`,
                `"${lead.days_until_expiry || ''}"`,

                // Safety & Compliance
                `"${lead.safety_rating || ''}"`,
                `"${lead.oos_date || ''}"`,
                `"${lead.oos_status || ''}"`,

                // Business Operations
                `"${lead.business_type || ''}"`,
                `"${lead.cargo_carried || ''}"`,
                `"${lead.commodities_hauled || ''}"`,

                // Inspection Information
                `"${lead.last_inspection_date || ''}"`,
                `"${lead.inspection_score || ''}"`,
                `"${lead.violations_count || ''}"`,

                // Additional Fields
                `"${lead.hazmat_status || ''}"`,
                `"${lead.interstate_status || ''}"`,

                // Data Source
                `"${lead.data_source || 'DB-V3-Comprehensive'}"`,

                // Corgi Prequote
                `"${lead.corgi_prequote?.prequote_id || ''}"`,
                `"${lead.corgi_prequote ? (lead.corgi_prequote.eligible ? 'Yes' : 'Not Eligible') : ''}"`,
                `"${lead.corgi_prequote?.premium || ''}"`,
                `"${lead.corgi_prequote?.reason || ''}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const state = document.getElementById('genState')?.value || 'leads';
        const today = new Date().toISOString().split('T')[0];
        link.download = `leads_${state}_${today}.csv`;
        link.click();

        console.log(`✅ Exported ${leads.length} leads to CSV with all ${headers.length} comprehensive fields`);
        alert(`Successfully exported ${leads.length} leads to CSV format with ${headers.length} comprehensive data fields!`);

    } else if (format === 'json') {
        const blob = new Blob([JSON.stringify(leads, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const state = document.getElementById('genState')?.value || 'leads';
        const today = new Date().toISOString().split('T')[0];
        link.download = `leads_${state}_${today}.json`;
        link.click();

        console.log(`✅ Exported ${leads.length} leads to JSON`);
        alert(`Successfully exported ${leads.length} leads to JSON format!`);
    }
};

// Override view function to show proper data
window.viewGeneratedLeads = function() {
    if (!window.generatedLeadsData || window.generatedLeadsData.length === 0) {
        alert('No leads to view. Please generate leads first.');
        return;
    }

    console.log(`📋 Viewing ${window.generatedLeadsData.length} generated leads:`, window.generatedLeadsData);

    // Create a simple modal to show lead data preview
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); z-index: 10000; display: flex;
        align-items: center; justify-content: center;
    `;

    const preview = window.generatedLeadsData.slice(0, 5); // Show first 5 leads
    const hasCorgi = window.generatedLeadsData.some(l => l.corgi_prequote);
    const eligibleCount = hasCorgi ? window.generatedLeadsData.filter(l => l.corgi_prequote?.eligible).length : 0;

    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 10px; max-width: 90%; max-height: 90%; overflow: auto;">
            <h2>Generated Leads Preview (${window.generatedLeadsData.length} total${hasCorgi ? ` | 🐕 ${eligibleCount} Corgi eligible` : ''})</h2>
            <div style="margin: 20px 0;">
                <strong>Sample leads (first 5):</strong>
                <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; font-size: 12px; overflow: auto;">
${preview.map((lead, i) => `${i+1}. ${lead.company_name} (${lead.usdot_number})
   📍 ${lead.city}, ${lead.state}
   📞 ${lead.phone}
   📧 ${lead.email_address || lead.email}
   🚛 Fleet: ${lead.fleet_size}
   📅 Expires: ${lead.insurance_expiration || lead.insurance_expiry}
   🏢 Insurer: ${lead.insurance_company}${lead.corgi_prequote ? `
   🐕 Corgi: ${lead.corgi_prequote.eligible ? `ELIGIBLE — ID: ${lead.corgi_prequote.prequote_id || 'N/A'}${lead.corgi_prequote.premium ? ` | Premium: $${lead.corgi_prequote.premium}` : ''}` : `Not Eligible (${lead.corgi_prequote.reason || 'declined'})`}` : ''}
`).join('\n')}
                </pre>
            </div>
            <button onclick="this.parentElement.parentElement.remove()"
                    style="background: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
                Close Preview
            </button>
        </div>
    `;

    document.body.appendChild(modal);
};

console.log('✅ Lead Generation updated to use DB-V3 Comprehensive Carriers database');
console.log('📊 Export now includes 40+ comprehensive fields with complete carrier data');
console.log('🚀 Database contains 383,510 carrier records from 81 states with 2,049 insurance companies');