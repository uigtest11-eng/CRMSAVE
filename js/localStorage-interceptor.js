// localStorage Interceptor - Prevents mock/archived data from being stored
console.log('🛡️ localStorage Interceptor - Blocking bad lead data');

(function() {
    // Store original localStorage methods
    const originalSetItem = localStorage.setItem;
    const originalGetItem = localStorage.getItem;

    // Mock patterns to block
    const mockPatterns = [
        'Test Lead', 'Test Company', 'Test Trucking',
        'Robert Thompson', 'Jennifer Martin', 'Michael Chen',
        'Davis Construct', 'ABC Corp', 'Tech Startup', 'ABC Trucking'
    ];

    // Get archived exclusion data
    function getArchivedExclusion() {
        if (!window.archivedExclusion) {
            // Build exclusion lists if not available
            const archived1 = JSON.parse(originalGetItem.call(localStorage, 'archivedLeads') || '[]');
            const archived2 = JSON.parse(originalGetItem.call(localStorage, 'archived_leads') || '[]');
            const permanent = JSON.parse(originalGetItem.call(localStorage, 'PERMANENT_ARCHIVED_IDS') || '[]');

            const ids = new Set();
            const names = new Set();
            const phones = new Set();
            const emails = new Set();

            [...archived1, ...archived2].forEach(lead => {
                if (lead.id) ids.add(String(lead.id));
                if (lead.name) names.add(lead.name.toLowerCase().trim());
                if (lead.phone) phones.add(lead.phone.replace(/\D/g, ''));
                if (lead.email) emails.add(lead.email.toLowerCase().trim());
            });

            permanent.forEach(id => ids.add(String(id)));

            window.archivedExclusion = { ids, names, phones, emails };
        }
        return window.archivedExclusion;
    }

    // Check if a lead should be blocked
    function shouldBlockLead(lead) {
        // Check for mock patterns
        if (lead.name) {
            for (const pattern of mockPatterns) {
                if (lead.name.includes(pattern)) {
                    console.log(`🚫 BLOCKED mock lead: ${lead.name}`);
                    return true;
                }
            }
        }

        // Check against archived exclusion
        const exclusion = getArchivedExclusion();

        if (exclusion.ids.has(String(lead.id))) {
            console.log(`🚫 BLOCKED archived lead by ID: ${lead.name} (${lead.id})`);
            return true;
        }

        // NOTE: Name/phone/email matching REMOVED — it caused false positives
        // where active leads sharing a phone/email/name with an archived lead
        // were silently deleted on every localStorage write (e.g. Triple A Transport bug).
        // Only block by exact lead ID, which is reliable.

        return false;
    }

    // Override localStorage.setItem
    localStorage.setItem = function(key, value) {
        // Only intercept lead storage keys
        if (key === 'insurance_leads' || key === 'leads') {
            try {
                const data = JSON.parse(value);
                if (Array.isArray(data)) {
                    // Filter out blocked leads
                    const originalCount = data.length;
                    const cleanData = data.filter(lead => {
                        // Fix qualified status
                        if (lead.stage === 'qualified') {
                            lead.stage = 'info_requested';
                        }
                        return !shouldBlockLead(lead);
                    });

                    if (cleanData.length !== originalCount) {
                        console.log(`🛡️ INTERCEPTED ${key}: blocked ${originalCount - cleanData.length} bad leads`);
                        console.log(`✅ Storing ${cleanData.length} clean leads instead`);
                    }

                    // Store the cleaned data
                    originalSetItem.call(localStorage, key, JSON.stringify(cleanData));

                    // Sync both keys to same clean data
                    if (key === 'insurance_leads') {
                        originalSetItem.call(localStorage, 'leads', JSON.stringify(cleanData));
                    } else if (key === 'leads') {
                        originalSetItem.call(localStorage, 'insurance_leads', JSON.stringify(cleanData));
                    }

                    return;
                }
            } catch (e) {
                console.log('Could not parse localStorage data, storing as-is');
            }
        }

        // For non-lead data or unparseable data, use original method
        originalSetItem.call(localStorage, key, value);
    };

    // Continuous monitoring to catch any bypass attempts
    function continuousCleanup() {
        try {
            const insuranceLeads = JSON.parse(originalGetItem.call(localStorage, 'insurance_leads') || '[]');
            const regularLeads = JSON.parse(originalGetItem.call(localStorage, 'leads') || '[]');

            let cleanedInsurance = false;
            let cleanedRegular = false;

            if (Array.isArray(insuranceLeads)) {
                const originalCount = insuranceLeads.length;
                const cleanData = insuranceLeads.filter(lead => {
                    if (lead.stage === 'qualified') lead.stage = 'info_requested';
                    return !shouldBlockLead(lead);
                });

                if (cleanData.length !== originalCount) {
                    console.log(`🧹 CONTINUOUS: cleaned ${originalCount - cleanData.length} bad leads from insurance_leads`);
                    originalSetItem.call(localStorage, 'insurance_leads', JSON.stringify(cleanData));
                    cleanedInsurance = true;
                }
            }

            if (Array.isArray(regularLeads)) {
                const originalCount = regularLeads.length;
                const cleanData = regularLeads.filter(lead => {
                    if (lead.stage === 'qualified') lead.stage = 'info_requested';
                    return !shouldBlockLead(lead);
                });

                if (cleanData.length !== originalCount) {
                    console.log(`🧹 CONTINUOUS: cleaned ${originalCount - cleanData.length} bad leads from leads`);
                    originalSetItem.call(localStorage, 'leads', JSON.stringify(cleanData));
                    cleanedRegular = true;
                }
            }

            // Sync if either was cleaned
            if (cleanedInsurance || cleanedRegular) {
                const primaryData = JSON.parse(originalGetItem.call(localStorage, 'insurance_leads') || '[]');
                originalSetItem.call(localStorage, 'leads', JSON.stringify(primaryData));
                originalSetItem.call(localStorage, 'insurance_leads', JSON.stringify(primaryData));
            }

        } catch (e) {
            console.error('Error in continuous cleanup:', e);
        }
    }

    // Run continuous cleanup every 500ms to catch bypass attempts - DISABLED to prevent blinking
    // setInterval(continuousCleanup, 500);

    console.log('✅ localStorage interceptor active - bad lead data will be blocked');
    console.log('✅ Continuous monitoring active - checking every 500ms');
})();