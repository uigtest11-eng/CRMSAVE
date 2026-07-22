// Policy Filters Functionality
console.log('🔍 Loading policy filters functionality...');

// Policy filtering function
window.filterPolicies = function() {
    const typeFilter = document.getElementById('policyTypeFilter');
    const carrierFilter = document.getElementById('policyCarrierFilter');
    const statusFilter = document.getElementById('policyStatusFilter');
    const agentFilter = document.getElementById('policyAgentFilter');
    const searchInput = document.querySelector('.filters-bar .search-box input');

    if (!typeFilter || !carrierFilter || !statusFilter) {
        console.log('Filter elements not found, skipping filter');
        return;
    }

    const typeValue = typeFilter.value.toLowerCase();
    const carrierValue = carrierFilter.value.toLowerCase();
    const statusValue = statusFilter.value.toLowerCase();
    const agentValue = agentFilter ? agentFilter.value : '';
    const searchValue = searchInput ? searchInput.value.toLowerCase() : '';

    // Check user role
    const sessionData = sessionStorage.getItem('vanguard_user');
    let isMaureen = false;
    let isCsrUser = false;
    if (sessionData) {
        try {
            const user = JSON.parse(sessionData);
            isMaureen = user.username && user.username.toLowerCase() === 'maureen';
            isCsrUser = (user.role || '') === 'csr';
        } catch (error) {
            console.error('Error checking user in filterPolicies:', error);
        }
    }

    // Get all policy table rows
    const tbody = document.getElementById('policyTableBody');
    if (!tbody) {
        console.log('Policy table body not found');
        return;
    }

    const rows = tbody.querySelectorAll('tr');


    console.log(`🔍 Filtering policies: Type="${typeValue}", Carrier="${carrierValue}", Status="${statusValue}", Search="${searchValue}"`);
    let visibleCount = 0;

    // Variables to track filtered stats
    let visibleTotal = 0;
    let visibleActive = 0;
    let visiblePendingRenewal = 0;
    let visibleTotalPremium = 0;

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 4) {
            // Skip empty rows or header rows
            return;
        }

        // Extract data from row cells
        const policyNumber = cells[0]?.textContent?.toLowerCase() || '';
        const policyTypeCell = cells[1]?.textContent?.toLowerCase() || '';
        const clientName = cells[2]?.textContent?.toLowerCase() || '';
        const carrier = cells[3]?.textContent?.toLowerCase() || '';
        const premiumText = cells[6]?.textContent || '$0';
        const assignedAgent = cells[7]?.textContent?.trim() || '';
        const status = cells.length > 8 ? cells[8]?.textContent?.toLowerCase() || '' : '';

        // Policy type matching
        let typeMatch = true;
        if (typeValue) {
            typeMatch = false;
            // Handle different policy type formats
            if (typeValue === 'auto' && (policyTypeCell.includes('personal') && policyTypeCell.includes('auto'))) {
                typeMatch = true;
            } else if (typeValue === 'commercial-auto' && (policyTypeCell.includes('commercial') && policyTypeCell.includes('auto'))) {
                typeMatch = true;
            } else if (typeValue === 'homeowners' && (policyTypeCell.includes('homeowners') || policyTypeCell.includes('home'))) {
                typeMatch = true;
            } else if (typeValue === 'commercial-property' && (policyTypeCell.includes('commercial') && policyTypeCell.includes('property'))) {
                typeMatch = true;
            } else if (typeValue === 'general-liability' && (policyTypeCell.includes('general') || policyTypeCell.includes('liability'))) {
                typeMatch = true;
            } else if (typeValue === 'life' && policyTypeCell.includes('life')) {
                typeMatch = true;
            }
        }

        // Carrier matching
        const carrierMatch = !carrierValue || carrier.includes(carrierValue);

        // Status matching (exact match to prevent "active" matching "inactive")
        const statusMatch = !statusValue || status.trim() === statusValue;

        // Search matching (policy number or client name)
        const searchMatch = !searchValue ||
            policyNumber.includes(searchValue) ||
            clientName.includes(searchValue) ||
            carrier.includes(searchValue);

        // Agent filtering with agency group support
        const vanguardAgents = ['Grant', 'Carson', 'Hunter'];
        const unitedAgents = ['Maureen'];
        let agentMatch = true;
        if (isMaureen) {
            if (!agentValue) {
                agentMatch = assignedAgent === 'Maureen';
            } else {
                agentMatch = assignedAgent === agentValue;
            }
        } else if (!agentValue) {
            // "All Agencies" — show everyone
            agentMatch = true;
        } else if (agentValue === 'Vanguard') {
            agentMatch = vanguardAgents.includes(assignedAgent);
        } else if (agentValue === 'United') {
            agentMatch = unitedAgents.includes(assignedAgent);
        } else {
            agentMatch = assignedAgent === agentValue;
        }

        // Show/hide row based on all filters
        const shouldShow = typeMatch && carrierMatch && statusMatch && searchMatch && agentMatch;

        if (shouldShow) {
            row.style.display = '';
            visibleCount++;

            // Track stats for visible policies
            visibleTotal++;

            // Count active policies (exact match)
            if (status.trim() === 'active') {
                visibleActive++;
            }

            // Count pending renewal policies
            if (status.trim() === 'pending' || status.includes('renewal')) {
                visiblePendingRenewal++;
            }

            // Parse and sum premium amounts
            const premiumMatch = premiumText.match(/[\d,]+\.?\d*/);
            if (premiumMatch) {
                const premiumValue = parseFloat(premiumMatch[0].replace(/,/g, ''));
                if (!isNaN(premiumValue)) {
                    visibleTotalPremium += premiumValue;
                }
            }
        } else {
            row.style.display = 'none';
        }
    });

    console.log(`📊 Policy filter results: ${visibleCount} policies visible out of ${rows.length} total`);

    // Update any count displays if they exist
    const countDisplay = document.querySelector('.showing-info');
    if (countDisplay) {
        countDisplay.textContent = `Showing ${visibleCount} policies`;
    }

    // Update policy statistics with filtered data
    updatePolicyStats(visibleTotal, visibleActive, visiblePendingRenewal, visibleTotalPremium);
};

// Function to update policy statistics display
function updatePolicyStats(total, active, pendingRenewal, totalPremium) {
    // Update total policies
    const totalElement = document.querySelector('.mini-stat:nth-child(1) .mini-stat-value');
    if (totalElement) {
        totalElement.textContent = total;
    }

    // Update active policies
    const activeElement = document.querySelector('.mini-stat:nth-child(2) .mini-stat-value');
    if (activeElement) {
        activeElement.textContent = active;
    }

    // Update pending renewal
    const pendingElement = document.querySelector('.mini-stat:nth-child(3) .mini-stat-value');
    if (pendingElement) {
        pendingElement.textContent = pendingRenewal;
    }

    // Update total premium
    const premiumElement = document.querySelector('.mini-stat:nth-child(4) .mini-stat-value');
    if (premiumElement) {
        // Format premium as $240K style for large numbers
        let formattedPremium;
        if (totalPremium >= 1000000) {
            formattedPremium = `$${(totalPremium / 1000000).toFixed(1)}M`;
        } else if (totalPremium >= 1000) {
            formattedPremium = `$${Math.round(totalPremium / 1000)}K`;
        } else {
            formattedPremium = `$${totalPremium.toFixed(0)}`;
        }
        premiumElement.textContent = formattedPremium;
    }

    console.log(`📈 Policy stats updated: ${total} total, ${active} active, ${pendingRenewal} pending renewal, $${totalPremium.toFixed(2)} total premium`);
}

// Add search functionality to search input
function initializePolicySearch() {
    const searchInput = document.querySelector('.policies-view .filters-bar .search-box input');
    if (searchInput && !searchInput.hasAttribute('data-policy-search-initialized')) {
        searchInput.setAttribute('data-policy-search-initialized', 'true');

        // Add event listeners for real-time search
        searchInput.addEventListener('keyup', function() {
            filterPolicies();
        });

        searchInput.addEventListener('search', function() {
            filterPolicies();
        });

        console.log('✅ Policy search functionality initialized');
    }
}

// Initialize search when policies view loads
function initializePolicyFilters() {
    // Wait a bit for the DOM to be ready
    setTimeout(() => {
        initializePolicySearch();

        // Add event listeners to filters if not already added
        const typeFilter = document.getElementById('policyTypeFilter');
        const carrierFilter = document.getElementById('policyCarrierFilter');
        const statusFilter = document.getElementById('policyStatusFilter');

        if (typeFilter && !typeFilter.hasAttribute('data-filter-initialized')) {
            typeFilter.setAttribute('data-filter-initialized', 'true');
            console.log('✅ Policy type filter initialized');
        }

        if (carrierFilter && !carrierFilter.hasAttribute('data-filter-initialized')) {
            carrierFilter.setAttribute('data-filter-initialized', 'true');
            console.log('✅ Policy carrier filter initialized');
        }

        if (statusFilter && !statusFilter.hasAttribute('data-filter-initialized')) {
            statusFilter.setAttribute('data-filter-initialized', 'true');
            console.log('✅ Policy status filter initialized');
        }

        console.log('🎯 Policy filters fully initialized');

        // Apply auto-filter after initialization
        applyMaureenAutoFilter();
    }, 500);
}

// Auto-filter function for Maureen
function applyMaureenAutoFilter() {
    const sessionData = sessionStorage.getItem('vanguard_user');
    if (sessionData) {
        try {
            const user = JSON.parse(sessionData);
            if (user.username && user.username.toLowerCase() === 'maureen') {
                setTimeout(() => {
                    const agentFilter = document.getElementById('policyAgentFilter');
                    if (agentFilter) {
                        agentFilter.value = '';
                        console.log('🔒 AUTO-FILTER (Policies): Set policy filter to "All My Policies" for Maureen');
                        // Trigger the filter function immediately
                        filterPolicies();
                        console.log('✅ AUTO-FILTER (Policies): Applied Maureen "All My Policies" filter');
                    }
                }, 300); // Allow time for DOM to update
            } else {
                // For non-Maureen users, apply "All Agents" filter which excludes Maureen
                setTimeout(() => {
                    const agentFilter = document.getElementById('policyAgentFilter');
                    if (agentFilter) {
                        agentFilter.value = '';
                        console.log('🔒 AUTO-FILTER (Policies): Applied "All Agents" filter (excluding Maureen)');
                        // Trigger the filter function immediately to hide Maureen policies
                        filterPolicies();
                        console.log('✅ AUTO-FILTER (Policies): Maureen policies hidden from view');
                    }
                }, 300);
            }
        } catch (error) {
            console.error('Error applying Maureen auto-filter for policies:', error);
        }
    }
}

// Auto-initialize when the script loads and when policies view loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePolicyFilters);
} else {
    initializePolicyFilters();
}

// Also initialize when hash changes to policies
window.addEventListener('hashchange', function() {
    if (window.location.hash === '#policies') {
        setTimeout(() => {
            initializePolicyFilters();
            applyMaureenAutoFilter(); // Apply auto-filter for Maureen
        }, 200);
    }
});

// Apply auto-filter when script loads and we're already on policies page
setTimeout(() => {
    if (window.location.hash === '#policies') {
        applyMaureenAutoFilter();
    }
}, 1000);

console.log('✅ Policy filters script loaded');