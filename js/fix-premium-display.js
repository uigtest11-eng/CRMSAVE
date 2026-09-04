// Fix Premium Display in Clients Management
console.log('Fixing premium display in clients management...');

// Override loadClientsView to use the proper implementation with fresh data loading
window.loadClientsView = function() {
    console.log('Loading clients view with proper premium calculation...');
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;

    // Force refresh policies from server to ensure we have the latest data
    fetch('/api/policies?includeInactive=true&limit=500')
        .then(response => response.json())
        .then(serverPolicies => {
            console.log('Loaded fresh policies from server:', serverPolicies.length);
            // Update localStorage with fresh server data
            localStorage.setItem('insurance_policies', JSON.stringify(serverPolicies));
            // Now render the clients view with fresh data
            renderClientsViewWithFreshData(serverPolicies);
        })
        .catch(error => {
            console.warn('Failed to load fresh policies from server, using localStorage:', error);
            // Fallback to localStorage if server request fails
            const allPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
            console.log('Total policies in storage:', allPolicies.length);
            renderClientsViewWithFreshData(allPolicies);
        });
};

// Separate function to render clients view with provided policy data
function renderClientsViewWithFreshData(allPolicies) {
    const dashboardContent = document.querySelector('.dashboard-content');

    // Get current user and check if they are admin for template rendering
    const sessionData = sessionStorage.getItem('vanguard_user');
    let isAdmin = false;
    let currentUser = null;
    if (sessionData) {
        try {
            const user = JSON.parse(sessionData);
            currentUser = user.username;
            isAdmin = ['grant', 'maureen'].includes(user.username.toLowerCase());
        } catch (error) {
            console.error('Error parsing session data:', error);
        }
    }

    dashboardContent.innerHTML = `
        <div class="clients-view">
            <header class="content-header">
                <h1>Clients Management</h1>
                <div class="header-actions">
                    <button class="btn-secondary" onclick="importClients()">
                        <i class="fas fa-upload"></i> Import
                    </button>
                    <button class="btn-primary" onclick="showNewClient()">
                        <i class="fas fa-plus"></i> New Client
                    </button>
                </div>
            </header>

            <div class="filters-bar">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Search clients by name, phone, email..." id="clientSearch" onkeyup="filterClients()">
                </div>
                <div class="filter-group">
                    <select class="filter-select">
                        <option>All Types</option>
                        <option>Personal Lines</option>
                        <option>Commercial Lines</option>
                        <option>Commercial Auto</option>
                        <option>Life & Health</option>
                    </select>
                    ${isAdmin ? `<select class="filter-select" id="clientAgentFilter" onchange="filterClients()">
                        <option value="">${currentUser && currentUser.toLowerCase() === 'maureen' ? 'All My Clients' : 'All Agents'}</option>
                        ${currentUser && currentUser.toLowerCase() === 'maureen' ? '<option value="Maureen">Maureen</option>' : `
                        <option value="Grant">Grant</option>
                        <option value="Carson">Carson</option>
                        <option value="Hunter">Hunter</option>
                        <option value="Maureen" style="color: #2563eb;">MAUREEN</option>`}
                    </select>` : ''}
                    <select class="filter-select" id="clientNameDisplayFilter" onchange="applyClientNameDisplay()" style="min-width:160px;">
                        <option value="person">Person's Name</option>
                        <option value="business" selected>Business Name</option>
                    </select>
                    <button class="btn-filter" id="missing-data-btn" onclick="toggleMissingDataFilter()" style="transition:0.2s;">
                        <i class="fas fa-exclamation-triangle"></i> Missing Data
                    </button>
                    <button class="btn-filter" onclick="showMergeDuplicates()" style="transition:0.2s;background:#fef3c7;color:#92400e;border-color:#f59e0b;">
                        <i class="fas fa-compress-alt"></i> Merge Duplicates
                    </button>
                </div>
            </div>

            <div class="data-table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Client Name <i class="fas fa-sort"></i></th>
                            <th>Phone</th>
                            <th>Email</th>
                            <th>Policies</th>
                            <th>Premium</th>
                            <th>Assigned to</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="clientsTableBody">
                        ${generateClientRowsWithPremium(allPolicies)}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // AUTO-FILTER: Apply filter immediately after rendering
    setTimeout(() => {
        const agentFilter = document.getElementById('clientAgentFilter');
        if (agentFilter) {
            agentFilter.value = '';
            if (currentUser && currentUser.toLowerCase() === 'maureen') {
                console.log('🔒 IMMEDIATE AUTO-FILTER: Set client filter to "All My Clients" for Maureen');
            } else {
                console.log('🔒 IMMEDIATE AUTO-FILTER: Set client filter to "All Agents" (excluding Maureen)');
            }
            // Trigger the filter function
            if (typeof filterClients === 'function') {
                filterClients();
                console.log('✅ IMMEDIATE AUTO-FILTER: Applied client auto-filter');
            }
        }
    }, 100); // Small delay to ensure DOM is updated
};

// Generate client rows with proper premium calculation
function generateClientRowsWithPremium(allPolicies) {
    // Get clients from localStorage
    let clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');

    // Get current user and check if they are admin - filter clients for non-admin users
    const sessionData = sessionStorage.getItem('vanguard_user');
    let currentUser = null;
    let isAdmin = false;

    if (sessionData) {
        try {
            const user = JSON.parse(sessionData);
            currentUser = user.username;
            const userRole = (user.role || '').toLowerCase();
            isAdmin = ['grant', 'maureen'].includes(currentUser.toLowerCase()) || userRole === 'csr' || userRole.includes('admin');
            console.log(`🔒 Client filtering - Current user: ${currentUser}, Is Admin: ${isAdmin}`);
        } catch (error) {
            console.error('Error parsing session data:', error);
        }
    }

    // Remove duplicates based on name
    const uniqueClients = [];
    const seenNames = new Set();

    clients.forEach(client => {
        const name = (client.name || '').toUpperCase().trim();
        if (name && !seenNames.has(name)) {
            seenNames.add(name);
            uniqueClients.push(client);
        }
    });

    clients = uniqueClients;
    console.log('Found unique clients:', clients.length);

    // Filter clients based on user role
    if (!isAdmin && currentUser) {
        const originalCount = clients.length;
        clients = clients.filter(client => {
            const assignedTo = client.assignedTo ||
                              client.agent ||
                              client.assignedAgent ||
                              client.producer ||
                              'Grant'; // Default to Grant if no assignment
            return assignedTo.toLowerCase() === currentUser.toLowerCase();
        });
        console.log(`🔒 Filtered clients: ${originalCount} -> ${clients.length} (showing only ${currentUser}'s clients)`);
    } else if (isAdmin) {
        console.log(`🔒 Admin user - showing all ${clients.length} clients`);
    }

    if (clients.length === 0) {
        return `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #6b7280;">
                    <i class="fas fa-users" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                    <p style="font-size: 16px; margin: 0;">No clients found</p>
                    <p style="font-size: 14px; margin-top: 8px;">Convert leads or add new clients to get started</p>
                </td>
            </tr>
        `;
    }

    // Use the policies passed as parameter (already fresh from server or localStorage)
    console.log('Using provided policies for premium calculation:', allPolicies.length);

    // Generate rows for each client
    return clients.map(client => {
        // Ensure client has an ID - generate one if missing
        if (!client.id) {
            // Generate a unique ID based on name and timestamp
            const clientName = client.name || client.companyName || client.businessName || `client_${Date.now()}`;
            const nameId = clientName.toLowerCase().replace(/[^a-z0-9]/g, '_');
            client.id = `client_${nameId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            console.log(`📝 Generated ID for client ${clientName}: ${client.id}`);

            // Update localStorage to persist the ID
            const allClients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
            const clientIndex = allClients.findIndex(c => c.name === client.name);
            if (clientIndex !== -1) {
                allClients[clientIndex].id = client.id;
                localStorage.setItem('insurance_clients', JSON.stringify(allClients));
                console.log(`💾 Saved ID for ${client.name} to localStorage`);
            }
        }

        // Get initials for avatar
        const nameParts = (client.name || 'Unknown').split(' ').filter(n => n);
        const initials = nameParts.map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'UN';

        // Find all policies for this client using broad matching
        const _ns = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
        const _np = s => (s || '').replace(/\D/g, '');
        const cNameN = _ns(client.name);
        const cBizN  = _ns(client.businessName || client.companyName || '');
        const cEmailN = (client.email || '').toLowerCase().trim();
        const cPhoneN = _np(client.phone);
        const cPeople = (client.people || []).map(p => _ns((p.firstName||'') + ' ' + (p.lastName||'') || p.name || '')).filter(Boolean);
        const cDob = client.dateOfBirth || client['Date of Birth'] || '';
        const cKey = typeof _clientIdentityKey === 'function' ? _clientIdentityKey(client.name || client.businessName || '', cDob) : null;

        const matchesClient = (policy) => {
            // 1. clientId
            if (policy.clientId && String(policy.clientId) === String(client.id)) return true;

            // 2. Identity key (name + DOB)
            if (cKey && typeof _clientIdentityKey === 'function') {
                const polOwner = policy.contact?.['Owner Name'] || policy.insuredName || '';
                const polDob = policy.contact?.['Date of Birth'] || '';
                const polKey = _clientIdentityKey(polOwner, polDob);
                if (polKey && polKey === cKey) return true;
            }

            // Gather policy name variants
            const polNames = [
                policy.insured?.['Name/Business Name'], policy.insured?.['Primary Named Insured'],
                policy.insured?.['Business Name'], policy.insured?.['Full Name'],
                policy.insuredName, policy.clientName,
                policy.contact?.['Owner Name'], policy.contact?.['Business Name']
            ].filter(Boolean);

            // 3. Exact name match (person, business, people)
            for (const pn of polNames) {
                const pnN = _ns(pn);
                if (pnN && cNameN && pnN === cNameN) return true;
                if (pnN && cBizN && pnN === cBizN) return true;
                if (pnN && cPeople.some(cn => cn === pnN)) return true;
            }

            // 4. Business name containment
            if (cBizN && cBizN.length >= 4) {
                for (const pn of polNames) {
                    const pnN = _ns(pn);
                    if (pnN && (pnN.includes(cBizN) || cBizN.includes(pnN))) return true;
                }
            }

            // 5. Email match
            const polEmail = (policy.contact?.['Email'] || policy.contact?.['email'] || policy.contact?.['Email Address'] || policy.insured?.['Email'] || '').toLowerCase().trim();
            if (cEmailN && polEmail && cEmailN === polEmail) return true;

            // 6. Phone match
            const polPhone = _np(policy.contact?.['Phone'] || policy.contact?.['phone'] || policy.contact?.['Phone Number'] || policy.insured?.['Phone'] || '');
            if (cPhoneN && cPhoneN.length >= 10 && polPhone.length >= 10 && cPhoneN === polPhone) return true;

            // 7. clientName field (IVANS sets this)
            if (policy.clientName && client.name) {
                if (_ns(policy.clientName) === cNameN) return true;
            }

            return false;
        };

        const clientPoliciesAll = allPolicies.filter(p => matchesClient(p));

        // Only count active (non-expired) policies
        const _today = new Date(); _today.setHours(0,0,0,0);
        const _parseExp = (d) => {
            if (!d) return null;
            const sm = String(d).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
            if (sm) return new Date(sm[3], sm[1]-1, sm[2]);
            const dm = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (dm) return new Date(dm[1], dm[2]-1, dm[3]);
            const p = new Date(d); return isNaN(p) ? null : p;
        };
        const clientPolicies = clientPoliciesAll.filter(p => {
            const exp = _parseExp(p.expirationDate || p.overview?.['Expiration Date']);
            return !exp || exp >= _today;
        });

        const policyCount = clientPolicies.length;
        console.log(`Client ${client.name}: Found ${policyCount} policies`);

        // Calculate total premium from policies
        let totalPremium = 0;
        clientPolicies.forEach(policy => {
            // Check ALL possible premium field locations with enhanced search
            let premiumValue = 0;

            // Check financial object
            if (policy.financial) {
                premiumValue = policy.financial['Annual Premium'] ||
                              policy.financial['Premium'] ||
                              policy.financial.annualPremium ||
                              policy.financial.premium ||
                              0;
                console.log(`  Policy ${policy.policyNumber || policy.id}: financial.* = ${premiumValue}`);
            }

            // Check top-level fields if not found in financial
            if (!premiumValue) {
                premiumValue = policy['Annual Premium'] ||
                              policy.Premium ||
                              policy.premium ||
                              policy.annualPremium ||
                              0;
                console.log(`  Policy ${policy.policyNumber || policy.id}: top-level = ${premiumValue}`);
            }

            // Convert to number and handle various formats
            let numericPremium = 0;
            if (premiumValue) {
                // Handle string formats like "$17,423.00" or "17423"
                const cleanValue = typeof premiumValue === 'string' ?
                    premiumValue.replace(/[$,\s]/g, '') :
                    String(premiumValue);

                numericPremium = parseFloat(cleanValue) || 0;
                console.log(`  Policy ${policy.policyNumber || policy.id}: Raw value "${premiumValue}" -> Clean "${cleanValue}" -> Final premium = ${numericPremium}`);
            }

            totalPremium += numericPremium;
        });

        // Format premium display
        const premiumDisplay = totalPremium > 0 ? `$${totalPremium.toLocaleString()}/yr` : '-';
        console.log(`Client ${client.name}: Total Premium = ${totalPremium} -> Display = ${premiumDisplay}`);

        // Get assigned agent
        const assignedTo = client.assignedTo || client.agent || client.assignedAgent || client.producer || 'Grant';

        // Debug client ID for viewClient functionality
        console.log(`👤 Generating button for client: ${client.name} with ID: ${client.id} (type: ${typeof client.id})`);

        const personName = client.name || '';
        const bizName = client.businessName || client.companyName || '';

        return `
            <tr data-person-name="${personName.replace(/"/g, '&quot;')}" data-biz-name="${bizName.replace(/"/g, '&quot;')}">
                <td class="client-name">
                    <div class="client-avatar">${initials}</div>
                    <span class="client-display-name">${bizName || personName}</span>
                </td>
                <td>${client.phone || '-'}</td>
                <td>${client.email || '-'}</td>
                <td>${policyCount}</td>
                <td>${premiumDisplay}</td>
                <td>${assignedTo}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="console.log('🔍 Eye button clicked for client:', '${client.id}'); viewClient('${client.id}')" title="View Client"><i class="fas fa-eye"></i></button>
                        <button class="btn-icon" onclick="editClient('${client.id}')" title="Edit Client"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon" onclick="emailClient('${client.id}')" title="Email Client"><i class="fas fa-envelope"></i></button>
                        <button class="btn-icon" onclick="deleteClient('${client.id}')" title="Delete Client" style="color: #dc2626;"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// If we're on the clients page, reload it
setTimeout(() => {
    if (window.location.hash === '#clients') {
        console.log('Reloading clients view with fixed premium display...');
        loadClientsView();

        // AUTO-FILTER FOR MAUREEN: Set filter to show only her clients
        const sessionData = sessionStorage.getItem('vanguard_user');
        if (sessionData) {
            try {
                const user = JSON.parse(sessionData);
                if (user.username && user.username.toLowerCase() === 'maureen') {
                    setTimeout(() => {
                        const agentFilter = document.getElementById('clientAgentFilter');
                        if (agentFilter) {
                            agentFilter.value = '';
                            console.log('🔒 AUTO-FILTER (Premium Display): Set client filter to "All My Clients" for Maureen');
                            // Trigger the filter function
                            if (typeof filterClients === 'function') {
                                filterClients();
                                console.log('✅ AUTO-FILTER (Premium Display): Applied Maureen "All My Clients" filter');
                            }
                        }
                    }, 200); // Shorter delay since we also have immediate filter above
                }
            } catch (error) {
                console.error('Error setting Maureen auto-filter:', error);
            }
        }
    }
}, 500);

console.log('Premium display fix applied');