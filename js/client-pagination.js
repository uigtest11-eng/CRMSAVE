// Client Pagination System
(function() {
    console.log('🎯 Initializing Client Pagination System...');
    
    // Configuration
    const CLIENTS_PER_PAGE = 12;
    let currentPage = 1;
    
    // Enhanced loadClientsView with pagination
    window.loadClientsViewWithPagination = function(page = 1) {
        currentPage = page;
        const dashboardContent = document.querySelector('.dashboard-content');
        if (!dashboardContent) return;

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

        // Get all clients
        const allClients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
        const totalClients = allClients.length;
        const totalPages = Math.ceil(totalClients / CLIENTS_PER_PAGE);

        // Calculate pagination
        const startIndex = (currentPage - 1) * CLIENTS_PER_PAGE;
        const endIndex = Math.min(startIndex + CLIENTS_PER_PAGE, totalClients);
        const clientsToShow = allClients.slice(startIndex, endIndex);

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
                            <option value="Hunter">Hunter</option>`}
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
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="clientsTableBody">
                            ${generatePaginatedClientRows(clientsToShow)}
                        </tbody>
                    </table>
                </div>
                
                <div class="table-footer">
                    <div class="showing-info">
                        ${totalClients > 0 ? 
                            `Showing ${startIndex + 1}-${endIndex} of ${totalClients} clients` : 
                            'No clients to display'}
                    </div>
                    ${generatePaginationControls(currentPage, totalPages)}
                </div>
            </div>
        `;
        
        // Scan for clickable content
        if (window.scanForClickableContent) {
            setTimeout(() => {
                window.scanForClickableContent(dashboardContent);
            }, 100);
        }
    };
    
    // Generate client rows for current page
    function generatePaginatedClientRows(clients) {
        if (clients.length === 0) {
            return `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: #6b7280;">
                        <i class="fas fa-users" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                        <p style="font-size: 16px; margin: 0;">No clients found</p>
                        <p style="font-size: 14px; margin-top: 8px;">Convert leads or add new clients to get started</p>
                    </td>
                </tr>
            `;
        }
        
        return clients.map(client => {
            // Get initials for avatar
            const nameParts = (client.name || 'Unknown').split(' ').filter(n => n);
            const initials = nameParts.map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'UN';
            
            // Determine badge color based on type
            const typeColor = client.type === 'Commercial' ? 'purple' : 'blue';
            
            // Count policies with enhanced matching
            let policyCount = 0;
            if (client.policies && Array.isArray(client.policies)) {
                policyCount = client.policies.length;
            } else {
                // If no client.policies array, get from localStorage and match
                const allPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
                const matchedPolicies = [];

                allPolicies.forEach(policyRecord => {
                    const matchesClient = (policy) => {
                        if (policy.clientId && String(policy.clientId) === String(client.id)) {
                            return true;
                        }
                        const insuredName = policy.insured?.['Name/Business Name'] ||
                                           policy.insured?.['Primary Named Insured'] ||
                                           policy.insuredName ||
                                           policy.clientName;
                        if (insuredName && client.name &&
                            insuredName.toLowerCase().includes(client.name.toLowerCase())) {
                            return true;
                        }
                        return false;
                    };

                    if (matchesClient(policyRecord)) {
                        matchedPolicies.push(policyRecord);
                        return;
                    }

                    if (policyRecord.policies && Array.isArray(policyRecord.policies)) {
                        policyRecord.policies.forEach(nestedPolicy => {
                            if (matchesClient(nestedPolicy)) {
                                matchedPolicies.push(nestedPolicy);
                                return;
                            }
                            if (nestedPolicy.policies && Array.isArray(nestedPolicy.policies)) {
                                nestedPolicy.policies.forEach(deepNestedPolicy => {
                                    if (matchesClient(deepNestedPolicy)) {
                                        matchedPolicies.push(deepNestedPolicy);
                                    }
                                });
                            }
                        });
                    }
                });

                policyCount = matchedPolicies.length;
            }
            
            // Format premium
            const premium = client.totalPremium || 0;
            const formattedPremium = premium > 0 ? `$${premium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';
            
            // Determine status
            const status = client.status || 'Active';
            const statusColor = status === 'Active' ? 'green' : status === 'Inactive' ? 'red' : 'yellow';
            
            const _personName = client.name || '';
            const _bizName = client.businessName || client.companyName || '';

            return `
                <tr data-person-name="${_personName.replace(/"/g, '&quot;')}" data-biz-name="${_bizName.replace(/"/g, '&quot;')}">
                    <td>
                        <div class="client-name-cell">
                            <div class="avatar-small" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                                ${initials}
                            </div>
                            <div>
                                <div class="client-name client-display-name">${_personName || 'Unknown'}</div>
                                ${client.company ? `<div class="client-company">${client.company}</div>` : ''}
                                ${client.dotNumber ? `<div class="text-muted small">DOT: ${client.dotNumber}</div>` : ''}
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="clickable-phone">${client.phone || '-'}</span>
                    </td>
                    <td>
                        <span class="clickable-email">${client.email || '-'}</span>
                    </td>
                    <td>
                        <span class="policy-count">${policyCount}</span>
                    </td>
                    <td>
                        <span class="premium-amount">${formattedPremium}</span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon" onclick="viewClient('${client.id}')" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-icon" onclick="editClient('${client.id}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon" onclick="emailClient('${client.id}')" title="Send Email">
                                <i class="fas fa-envelope"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    // Generate pagination controls
    function generatePaginationControls(currentPage, totalPages) {
        if (totalPages <= 1) {
            return '<div class="pagination"></div>';
        }
        
        let paginationHTML = '<div class="pagination">';
        
        // Previous button
        paginationHTML += `
            <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} 
                    onclick="loadClientsViewWithPagination(${currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        // Adjust start if we're near the end
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // First page if not visible
        if (startPage > 1) {
            paginationHTML += `
                <button class="page-btn" onclick="loadClientsViewWithPagination(1)">1</button>
            `;
            if (startPage > 2) {
                paginationHTML += '<span>...</span>';
            }
        }
        
        // Visible page numbers
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="page-btn ${i === currentPage ? 'active' : ''}" 
                        onclick="loadClientsViewWithPagination(${i})">${i}</button>
            `;
        }
        
        // Last page if not visible
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += '<span>...</span>';
            }
            paginationHTML += `
                <button class="page-btn" onclick="loadClientsViewWithPagination(${totalPages})">${totalPages}</button>
            `;
        }
        
        // Next button
        paginationHTML += `
            <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} 
                    onclick="loadClientsViewWithPagination(${currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        paginationHTML += '</div>';
        return paginationHTML;
    }
    
    // Override the original loadClientsView function
    const originalLoadClientsView = window.loadClientsView;
    window.loadClientsView = function() {
        console.log('Loading clients view with pagination...');
        window.loadClientsViewWithPagination(1);
    };
    
    // Add pagination styles if not already present
    const style = document.createElement('style');
    style.textContent = `
        .pagination {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .page-btn {
            padding: 6px 12px;
            border: 1px solid #e5e7eb;
            background: white;
            color: #374151;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
        }
        
        .page-btn:hover:not(:disabled) {
            background: #f3f4f6;
            border-color: #d1d5db;
        }
        
        .page-btn.active {
            background: #3b82f6;
            color: white;
            border-color: #3b82f6;
        }
        
        .page-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .pagination span {
            color: #9ca3af;
            padding: 0 4px;
        }
        
        .client-name-cell {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .avatar-small {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            font-size: 14px;
        }
        
        .client-company {
            font-size: 12px;
            color: #6b7280;
        }
        
        .policy-count {
            background: #eff6ff;
            color: #3b82f6;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: 600;
            font-size: 14px;
        }
        
        .premium-amount {
            font-weight: 600;
            color: #059669;
        }
    `;
    document.head.appendChild(style);
    
    console.log('✅ Client Pagination System initialized');
    console.log('   - 12 clients per page');
    console.log('   - Smart pagination controls');
    console.log('   - Proper page navigation');
})();