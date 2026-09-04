// Authentication Manager for Vanguard AMS
(function() {
    'use strict';

    // Check if user is authenticated
    function checkAuth() {
        // Check for session data in sessionStorage (from login.html)
        const sessionData = sessionStorage.getItem('vanguard_user');

        if (!sessionData) {
            window.location.href = '/login.html';
            return false;
        }

        try {
            const user = JSON.parse(sessionData);
            console.log('User data from sessionStorage:', user); // Debug log

            // Validate user object structure
            if (!user || !user.username) {
                console.error('Invalid session data structure:', user);
                sessionStorage.removeItem('vanguard_user');
                window.location.href = '/login.html';
                return false;
            }

            console.log('User authenticated:', user); // Debug log

            // Control admin UI elements
            controlAdminUI(user.username);

            return user;
        } catch (error) {
            console.error('Error reading session data:', error);
            // Clear corrupted session data
            sessionStorage.removeItem('vanguard_user');
            window.location.href = '/login.html';
            return false;
        }
    }

    // Extract username from email for display
    function extractUsernameFromEmail(email) {
        if (!email) return 'User';

        // Handle specific emails
        if (email.includes('grant.corp')) return 'grant';
        if (email.includes('maureen')) return 'maureen';
        if (email.includes('uigtest')) return 'uigtest';

        // Extract username part from email
        return email.split('@')[0].toLowerCase();
    }

    // Logout function
    function logout() {
        // Notify server (best-effort)
        const token = sessionStorage.getItem('vanguard_jwt');
        if (token) {
            fetch('/api/auth/logout', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token }
            }).catch(() => {});
        }
        // Clear all session data
        sessionStorage.removeItem('vanguard_user');
        sessionStorage.removeItem('vanguard_jwt');
        var portal = localStorage.getItem('vanguard_login_portal');
        window.location.href = (portal === 'united') ? '/login-united.html' : '/login.html';
    }

    // Get session user object
    function getSessionUser() {
        try { return JSON.parse(sessionStorage.getItem('vanguard_user') || '{}'); } catch(e) { return {}; }
    }

    const ADMIN_ROLES = ['admin', 'master_admin', 'united_admin', 'vanguard_admin'];

    function _isAdmin() {
        const u = getSessionUser();
        return ADMIN_ROLES.includes(u.role);
    }

    function isCsr() {
        return getSessionUser().role === 'csr';
    }

    // Badge config per role
    const ROLE_BADGE = {
        master_admin:  { text: 'Master Admin', icon: 'fa-crown',    bg: 'linear-gradient(135deg,#f59e0b,#d97706)' },
        united_admin:  { text: 'United Admin', icon: 'fa-shield-alt', bg: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' },
        vanguard_admin:{ text: 'Vanguard Admin',icon:'fa-crown',    bg: 'linear-gradient(135deg,#ff6b6b,#ee5a52)' },
        admin:         { text: 'Admin',         icon: 'fa-crown',    bg: 'linear-gradient(135deg,#ff6b6b,#ee5a52)' },
        csr:           { text: 'CSR',           icon: 'fa-headset',  bg: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' },
    };

    function getRoleBadgeHTML() {
        const role = getSessionUser().role;
        const cfg = ROLE_BADGE[role];
        if (!cfg) return '';
        return `<span style="background:${cfg.bg};color:white;padding:2px 6px;border-radius:10px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-left:6px;box-shadow:0 2px 4px rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.3);">
            <i class="fas ${cfg.icon}" style="margin-right:3px;font-size:9px;"></i>${cfg.text}
        </span>`;
    }

    // Display user info in header
    function displayUserInfo() {
        const user = checkAuth();
        if (!user) return;

        // Wait for DOM to be ready
        const setupUserDisplay = () => {
            // Badge is already injected by index.html's updateUserDisplay() inside #userNameDisplay.
            // Skipping duplicate injection here to avoid showing two badges.

            // Legacy: also inject into .top-header if present and not already done
            let userInfoElement = document.getElementById('userInfoDisplay');
            if (!userInfoElement) {
                const header = document.querySelector('.top-header') || document.querySelector('.dashboard-header');
                if (header) {
                    const adminBadge = getRoleBadgeHTML();
                    userInfoElement = document.createElement('div');
                    userInfoElement.id = 'userInfoDisplay';
                    userInfoElement.style.cssText = `position:absolute;right:20px;top:50%;transform:translateY(-50%);display:flex;align-items:center;gap:15px;color:white;font-size:14px;z-index:1000;`;
                    userInfoElement.innerHTML = `
                        <div style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.1);padding:8px 16px;border-radius:30px;">
                            <i class="fas fa-user-circle" style="font-size:20px;"></i>
                            <span style="font-weight:500;">${user.username}</span>
                            ${adminBadge}
                        </div>
                        <button onclick="logout()" style="background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);color:white;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:14px;font-weight:500;transition:all 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                            <i class="fas fa-sign-out-alt" style="margin-right:6px;"></i>Logout
                        </button>`;
                    if (getComputedStyle(header).position === 'static') header.style.position = 'relative';
                    header.appendChild(userInfoElement);
                }
            }
        };

        // Try to set up immediately
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setupUserDisplay();
        }

        // Also try after DOM loads
        document.addEventListener('DOMContentLoaded', setupUserDisplay);

        // And after a short delay for dynamic content
        setTimeout(setupUserDisplay, 1000);
        setTimeout(setupUserDisplay, 2000);
    }

    // Set current user as default assigned agent
    function setDefaultAssignedAgent() {
        const user = checkAuth();
        if (!user) return;

        // Wait for forms to load
        const setDefaults = () => {
            // Find all agent select dropdowns
            const agentSelects = document.querySelectorAll('select[name="assignedTo"], select#leadAssignedTo, select#clientAssignedTo');

            agentSelects.forEach(select => {
                // Check if user's name is an option
                const options = Array.from(select.options);
                const userOption = options.find(opt => opt.value === user.username);

                if (userOption && !select.value) {
                    select.value = user.username;
                }
            });
        };

        // Set up observer for dynamically added forms
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    setDefaults();
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Initial setup
        setTimeout(setDefaults, 500);
    }

    // Control admin UI visibility based on user role
    function controlAdminUI(username) {
        console.log('AUTH-MANAGER: controlAdminUI called with username:', username);

        const sessionUser = getSessionUser();
        const userRole = sessionUser.role || 'agent';
        const _isAdmin = () => ADMIN_ROLES.includes(userRole);
        const isCsrRole = () => userRole === 'csr';
        const canViewPremiums = () => ADMIN_ROLES.includes(userRole) || ['carson','hunter'].includes(username.toLowerCase());

        // Wait for DOM to be ready before manipulating elements
        const applyAdminControls = () => {
            console.log('AUTH-MANAGER: Applying admin controls...');

            // Find Administration section in sidebar
            const menuSections = document.querySelectorAll('.sidebar-menu .menu-section');
            console.log('AUTH-MANAGER: Found menu sections:', menuSections.length);

            let administrationSectionFound = false;

            menuSections.forEach((section, index) => {
                const heading = section.querySelector('h3');
                if (heading) {
                    console.log(`AUTH-MANAGER: Section ${index} heading:`, heading.textContent.trim());

                    if (heading.textContent.trim() === 'Administration') {
                        administrationSectionFound = true;
                        console.log('AUTH-MANAGER: Found Administration section!');

                        if (_isAdmin()) {
                            section.style.display = 'block';
                            section.style.visibility = 'visible';
                        } else if (isCsrRole()) {
                            // CSR: show section, applyCsrNavRestrictions controls individual items
                            section.style.display = 'block';
                            section.style.visibility = 'visible';
                        } else {
                            section.style.display = 'none';
                            section.style.visibility = 'hidden';
                        }
                    }
                }
            });

            if (!administrationSectionFound) {
                console.warn('AUTH-MANAGER: ⚠️ Administration section not found in sidebar!');
            }

            // Hide dashboard stats for non-admin users
            const adminOnlyStats = [
                'Active Clients',
                'App Sents',
                'Last 2 Month New Premium',
                'Current Month Lead Premium'
            ];

            const statCards = document.querySelectorAll('.stat-card');
            console.log('AUTH-MANAGER: Found stat cards:', statCards.length);

            statCards.forEach((card, index) => {
                const statTitle = card.querySelector('.stat-details h3');
                if (statTitle) {
                    const titleText = statTitle.textContent.trim();
                    console.log(`AUTH-MANAGER: Stat card ${index} title:`, titleText);

                    if (adminOnlyStats.includes(titleText)) {
                        if (_isAdmin()) {
                            card.style.display = 'block';
                            card.style.visibility = 'visible';
                            console.log(`AUTH-MANAGER: ✅ Admin - Showing stat: ${titleText}`);
                        } else {
                            card.style.display = 'none';
                            card.style.visibility = 'hidden';
                            console.log(`AUTH-MANAGER: ❌ Non-admin - Hiding stat: ${titleText}`);
                        }
                    }
                }
            });

            // Hide premium column in clients table for non-admin users
            const clientsTable = document.querySelector('.clients-view .data-table');
            if (clientsTable) {
                console.log('AUTH-MANAGER: Found clients table, checking premium column...');

                // Find and hide/show premium column header
                const headers = clientsTable.querySelectorAll('thead th');
                headers.forEach((header, index) => {
                    if (header.textContent.trim() === 'Premium') {
                        console.log(`AUTH-MANAGER: Found Premium column header at index ${index}`);
                        if (_isAdmin()) {
                            header.style.display = 'table-cell';
                            header.style.visibility = 'visible';
                            console.log('AUTH-MANAGER: ✅ Admin - Showing Premium column header');
                        } else {
                            header.style.display = 'none';
                            header.style.visibility = 'hidden';
                            console.log('AUTH-MANAGER: ❌ Non-admin - Hiding Premium column header');
                        }

                        // Also hide/show corresponding cells in each row
                        const rows = clientsTable.querySelectorAll('tbody tr');
                        rows.forEach((row, rowIndex) => {
                            const cells = row.querySelectorAll('td');
                            if (cells[index]) {
                                if (_isAdmin()) {
                                    cells[index].style.display = 'table-cell';
                                    cells[index].style.visibility = 'visible';
                                } else {
                                    cells[index].style.display = 'none';
                                    cells[index].style.visibility = 'hidden';
                                }
                            }
                        });
                    }
                });
            }

            // Hide premium column in policy management table for non-admin users
            const policiesTable = document.querySelector('.policies-view .data-table');
            if (policiesTable) {
                console.log('AUTH-MANAGER: Found policies table, checking premium column...');

                // Find and hide/show premium column header
                const headers = policiesTable.querySelectorAll('thead th');
                headers.forEach((header, index) => {
                    if (header.textContent.trim() === 'Premium') {
                        console.log(`AUTH-MANAGER: Found Premium column header in policies table at index ${index}`);
                        if (_isAdmin()) {
                            header.style.display = 'table-cell';
                            header.style.visibility = 'visible';
                            console.log('AUTH-MANAGER: ✅ Admin - Showing Premium column header in policies');
                        } else {
                            header.style.display = 'none';
                            header.style.visibility = 'hidden';
                            console.log('AUTH-MANAGER: ❌ Non-admin - Hiding Premium column header in policies');
                        }

                        // Also hide/show corresponding cells in each row
                        const rows = policiesTable.querySelectorAll('tbody tr');
                        rows.forEach((row, rowIndex) => {
                            const cells = row.querySelectorAll('td');
                            if (cells[index]) {
                                if (_isAdmin()) {
                                    cells[index].style.display = 'table-cell';
                                    cells[index].style.visibility = 'visible';
                                } else {
                                    cells[index].style.display = 'none';
                                    cells[index].style.visibility = 'hidden';
                                }
                            }
                        });
                    }
                });
            }

            // Hide "Total Premium" stat card in policy management for non-admin users
            const policyStats = document.querySelectorAll('.mini-stat');
            policyStats.forEach(stat => {
                const label = stat.querySelector('.mini-stat-label');
                if (label && label.textContent.trim() === 'Total Premium') {
                    if (_isAdmin()) {
                        stat.style.display = 'block';
                        stat.style.visibility = 'visible';
                        console.log('AUTH-MANAGER: ✅ Admin - Showing Total Premium stat');
                    } else {
                        stat.style.display = 'none';
                        stat.style.visibility = 'hidden';
                        console.log('AUTH-MANAGER: ❌ Non-admin - Hiding Total Premium stat');
                    }
                }
            });

            // Hide premium information in policy views for users without premium view permission
            if (!canViewPremiums()) {
                console.log('AUTH-MANAGER: User without premium permissions - applying continuous premium hiding...');

                // Function to hide premium content aggressively
                const hidePremiumContent = () => {
                    let hiddenCount = 0;

                    // 1. Hide any element that contains exactly "Premium:" as text
                    document.querySelectorAll('*').forEach(element => {
                        if (element.textContent && element.textContent.trim() === 'Premium:' &&
                            element.tagName !== 'SCRIPT' && element.tagName !== 'STYLE') {
                            element.style.display = 'none';
                            hiddenCount++;
                        }
                    });

                    // 2. Hide any element that contains premium amounts like "14,537.00/yr"
                    document.querySelectorAll('*').forEach(element => {
                        if (element.textContent && element.textContent.match(/^\$?[\d,]+\.?\d*\/?(yr|year)$/i) &&
                            element.tagName !== 'SCRIPT' && element.tagName !== 'STYLE') {
                            const parent = element.parentElement;
                            // Only hide if the parent or nearby elements mention premium
                            if (parent && (parent.textContent?.includes('Premium') ||
                                          parent.previousElementSibling?.textContent?.includes('Premium'))) {
                                element.style.display = 'none';
                                hiddenCount++;
                            }
                        }
                    });

                    // 3. Hide "Total Annual Premium" containers
                    document.querySelectorAll('*').forEach(element => {
                        if (element.textContent && element.textContent.trim() === 'Total Annual Premium') {
                            const container = element.closest('div[style*="background"], div[style*="padding"]');
                            if (container) {
                                container.style.display = 'none';
                                hiddenCount++;
                            }
                        }
                    });

                    // 4. Specifically target policy card premium rows
                    document.querySelectorAll('.info-group, .info-item, .detail-row').forEach(container => {
                        const text = container.textContent;
                        if (text && text.includes('Premium:')) {
                            container.style.display = 'none';
                            hiddenCount++;
                        }
                    });

                    // 5. Target policy overview modal premium section
                    document.querySelectorAll('.view-item').forEach(viewItem => {
                        const label = viewItem.querySelector('label');
                        if (label && label.textContent &&
                            (label.textContent.toUpperCase().includes('PREMIUM') ||
                             label.textContent.trim() === 'Premium')) {
                            viewItem.style.display = 'none';
                            hiddenCount++;
                        }
                    });

                    // 6. Target renewal card premium spans specifically
                    document.querySelectorAll('.renewal-card .premium').forEach(premiumSpan => {
                        premiumSpan.style.display = 'none';
                        hiddenCount++;
                    });

                    if (hiddenCount > 0) {
                        console.log(`AUTH-MANAGER: ❌ Hidden ${hiddenCount} premium elements (including renewal cards)`);
                    }
                };

                // Run immediately
                hidePremiumContent();

                // Set up continuous monitoring every 500ms
                const premiumHideInterval = setInterval(() => {
                    if (!_isAdmin()) {
                        hidePremiumContent();
                    } else {
                        clearInterval(premiumHideInterval);
                    }
                }, 500);

                // Store interval ID so we can clear it later
                window.premiumHideInterval = premiumHideInterval;

            } else {
                console.log('AUTH-MANAGER: ✅ Admin user - All premium information visible');

                // Clear any existing interval
                if (window.premiumHideInterval) {
                    clearInterval(window.premiumHideInterval);
                    window.premiumHideInterval = null;
                }
            }
        };

        // Apply controls immediately if DOM is ready
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            applyAdminControls();
        }

        // Also apply after DOM loads
        document.addEventListener('DOMContentLoaded', applyAdminControls);

        // Apply with multiple delays for dynamic content
        setTimeout(applyAdminControls, 100);
        setTimeout(applyAdminControls, 500);
        setTimeout(applyAdminControls, 1000);

        // Set up MutationObserver to watch for content changes (like dashboard reload)
        const adminControlObserver = new MutationObserver((mutations) => {
            let shouldReapply = false;

            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    const addedNodes = Array.from(mutation.addedNodes);
                    const hasStatCard = addedNodes.some(node =>
                        node.nodeType === 1 && (
                            node.classList?.contains('stat-card') ||
                            node.querySelector?.('.stat-card') ||
                            node.classList?.contains('menu-section') ||
                            node.querySelector?.('.menu-section') ||
                            node.classList?.contains('clients-view') ||
                            node.querySelector?.('.clients-view') ||
                            node.classList?.contains('policies-view') ||
                            node.querySelector?.('.policies-view') ||
                            node.classList?.contains('data-table') ||
                            node.querySelector?.('.data-table') ||
                            node.classList?.contains('policy-view') ||
                            node.querySelector?.('.policy-view') ||
                            node.classList?.contains('client-profile') ||
                            node.querySelector?.('.client-profile') ||
                            node.classList?.contains('mini-stat') ||
                            node.querySelector?.('.mini-stat') ||
                            node.textContent?.includes('Premium') ||
                            node.textContent?.includes('Total Annual')
                        )
                    );

                    if (hasStatCard) {
                        shouldReapply = true;
                        console.log('AUTH-MANAGER: Content reload detected, reapplying admin controls...');
                    }
                }
            });

            if (shouldReapply) {
                setTimeout(applyAdminControls, 100);
            }
        });

        // Start observing the document body for changes
        adminControlObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('AUTH-MANAGER: MutationObserver set up for persistent admin controls');
    }

    // Hide nav items that CSR cannot access
    function applyCsrNavRestrictions() {
        if (!isCsr()) return;

        const hideNavItem = (el) => {
            if (el) { el.style.display = 'none'; el.style.visibility = 'hidden'; }
        };

        // Show Administration section but only Downloads for CSR
        document.querySelectorAll('.menu-section').forEach(sec => {
            const h3 = sec.querySelector('h3');
            if (h3 && h3.textContent.trim() === 'Administration') {
                // Keep the section visible, but hide individual admin-only items
                sec.style.display = '';
                sec.style.visibility = '';
                const items = sec.querySelectorAll('ul > li');
                items.forEach(li => {
                    const anchor = li.querySelector('a');
                    if (!anchor) return;
                    const href = anchor.getAttribute('href') || '';
                    // Only show Downloads for CSR
                    if (href === '#downloads') {
                        li.style.display = '';
                        li.style.visibility = '';
                    } else {
                        hideNavItem(li);
                    }
                });
            }
        });

        // Hide Lead Generation and Market nav links (but NOT Leads)
        document.querySelectorAll('.sidebar-menu a, .sidebar-menu li').forEach(el => {
            const href = el.getAttribute('href') || '';
            const onclick = el.getAttribute('onclick') || '';
            const text = el.querySelector('span')?.textContent.trim() || el.textContent.trim();
            if (
                onclick.includes('toggleLeadGenFolder') ||
                href === '#market' ||
                text === 'Lead Generation' ||
                text === 'Market'
            ) {
                const li = el.closest('li') || el;
                hideNavItem(li);
            }
        });

        // Also hide any lead-gen sub-folder items
        const leadGenFolder = document.getElementById('leadGenFolder');
        if (leadGenFolder) hideNavItem(leadGenFolder);

        // Hide goals bar
        const goalsBar = document.getElementById('dashboard-goals-bar');
        if (goalsBar) hideNavItem(goalsBar);
    }

    // Check session expiry (not used with sessionStorage login)
    function checkSessionExpiry() {
        // No session expiry with the original login system
        return;
    }

    // Initialize
    window.addEventListener('DOMContentLoaded', () => {
        const user = checkAuth();
        if (user) {
            displayUserInfo();
            setDefaultAssignedAgent();
            setInterval(checkSessionExpiry, 30 * 60 * 1000);

            // Apply CSR nav restrictions with retries for dynamic sidebar
            if (isCsr()) {
                applyCsrNavRestrictions();
                setTimeout(applyCsrNavRestrictions, 300);
                setTimeout(applyCsrNavRestrictions, 1000);
                setTimeout(applyCsrNavRestrictions, 2000);
                const csrObserver = new MutationObserver(() => applyCsrNavRestrictions());
                csrObserver.observe(document.body, { childList: true, subtree: true });
            }
        }
    });

    // Make logout function globally available
    window.logout = logout;

    // Check auth on page visibility change (tab switching)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            checkAuth();
        }
    });

    console.log('🔐 Auth Manager initialized');
})();