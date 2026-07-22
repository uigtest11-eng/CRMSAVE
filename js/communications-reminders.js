// Communications Reminders Module - New Policies and Birthday Gifts
class CommunicationsReminders {
    constructor() {
        this.reminders = [];
        this.giftsSent = JSON.parse(localStorage.getItem('giftsSent') || '{}');
        this.recentClients = []; // Store recent clients from API
    }

    // Initialize communications reminders
    init() {
        this.updateRemindersDisplay();
        this.updateStats();

        // Load recent clients from API
        this.loadRecentClients();

        // Refresh every 30 seconds
        setInterval(() => {
            this.updateRemindersDisplay();
            this.updateStats();
            // Reload recent clients every refresh
            this.loadRecentClients();
        }, 30000);
    }

    // Check if a record matches the current agency filter
    _matchesAgency(agentValue) {
        const filter = window.currentCommsAgency || '';
        if (!filter) return true; // All Agencies
        const agent = (agentValue || '').trim();
        // Capitalize first letter for comparison
        const normalizedAgent = agent.charAt(0).toUpperCase() + agent.slice(1).toLowerCase();
        const vanguardAgents = ['Grant', 'Carson', 'Hunter'];
        const unitedAgents = ['Maureen'];
        if (filter === 'Vanguard') return vanguardAgents.includes(normalizedAgent);
        if (filter === 'United') return unitedAgents.includes(normalizedAgent);
        return normalizedAgent === filter;
    }

    // Get all reminders (new policies, new clients, and birthdays)
    getReminders() {
        const reminders = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Detect current user for agent-based filtering
        const _remSessionUser = (JSON.parse(sessionStorage.getItem('vanguard_user') || '{}').username || '').toLowerCase();
        const _isMaureen = _remSessionUser === 'maureen';

        // Get new policies from the last 7 days
        const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        const sevenDaysAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));

        policies.filter(policy => {
            if (_isMaureen) return (policy.agent || '').toLowerCase().includes('maureen');
            const policyAgent = policy.agent || policy.assignedTo || policy.assignedAgent || policy.producer || '';
            return this._matchesAgency(policyAgent);
        }).forEach(policy => {
            const createdDate = new Date(policy.createdAt || policy.date);
            if (createdDate >= sevenDaysAgo && createdDate <= new Date()) {
                // Use same client name hierarchy as other components (Named Insured first, then fallbacks)
                const clientName = policy.insured?.['Name/Business Name'] ||
                                  policy.insured?.['Primary Named Insured'] ||
                                  policy.namedInsured?.name ||
                                  (policy.clientName && policy.clientName !== 'N/A' && policy.clientName !== 'Unknown' ? policy.clientName : null) ||
                                  'Unknown Client';

                reminders.push({
                    id: `policy_${policy.id}`,
                    type: 'new_policy',
                    clientName: clientName,
                    clientId: policy.clientId || null,
                    policyType: policy.type || 'Insurance',
                    premium: policy.premium || 0,
                    date: createdDate,
                    daysAgo: Math.floor((today - createdDate) / (1000 * 60 * 60 * 24)),
                    giftSent: this.giftsSent[`policy_${policy.id}`] || false
                });
            }
        });

        // Get new clients from the last 7 days (from database via API)
        // Note: This will be loaded asynchronously, so we'll update the display when data arrives
        this.loadRecentClients().then(recentClients => {
            // Update the display when client data arrives
            if (recentClients && recentClients.length > 0) {
                setTimeout(() => {
                    this.refreshDisplay();
                }, 100);
            }
        });

        // Get upcoming birthdays (within configurable days)
        const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
        const viewDays = window.currentBirthdayViewDays || 30;
        const viewDaysFromNow = new Date(today.getTime() + (viewDays * 24 * 60 * 60 * 1000));

        clients.filter(client => {
            if (_isMaureen) return (client.agent || '').toLowerCase().includes('maureen');
            const clientAgent = client.agent || client.assignedTo || '';
            return this._matchesAgency(clientAgent);
        }).forEach(client => {
            if (client.dateOfBirth) {
                const birthDate = new Date(client.dateOfBirth);
                const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
                const nextYearBirthday = new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());

                let upcomingBirthday = thisYearBirthday;
                if (thisYearBirthday < today) {
                    upcomingBirthday = nextYearBirthday;
                }

                if (upcomingBirthday >= today && upcomingBirthday <= viewDaysFromNow) {
                    const daysUntil = Math.ceil((upcomingBirthday - today) / (1000 * 60 * 60 * 24));

                    // Use fullName for birthday reminders (personal name), fallback to business name
                    const displayName = client.fullName || client.name || 'Unknown Client';

                    reminders.push({
                        id: `birthday_${client.id}_${upcomingBirthday.getFullYear()}`,
                        type: 'birthday',
                        clientName: displayName,
                        email: client.email,
                        phone: client.phone,
                        date: upcomingBirthday,
                        daysUntil: daysUntil,
                        age: upcomingBirthday.getFullYear() - birthDate.getFullYear(),
                        giftSent: this.giftsSent[`birthday_${client.id}_${upcomingBirthday.getFullYear()}`] || false
                    });
                }
            }
        });

        // Also get birthdays from insurance policies' named insured data
        const insurancePolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');

        insurancePolicies.filter(policy => {
            if (_isMaureen) return (policy.agent || '').toLowerCase().includes('maureen');
            const policyAgent = policy.agent || policy.assignedTo || policy.assignedAgent || policy.producer || '';
            return this._matchesAgency(policyAgent);
        }).forEach(policy => {
            // Check if policy has Date of Birth/Inception in insured data
            if (policy.insured && policy.insured['Date of Birth/Inception']) {
                const dateOfBirth = policy.insured['Date of Birth/Inception'];
                if (dateOfBirth && dateOfBirth.trim() !== '') {
                    try {
                        const birthDate = new Date(dateOfBirth);
                        // Ensure it's a valid date
                        if (!isNaN(birthDate.getTime()) && birthDate.getFullYear() > 1900 && birthDate.getFullYear() < today.getFullYear()) {
                            const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
                            const nextYearBirthday = new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());

                            let upcomingBirthday = thisYearBirthday;
                            if (thisYearBirthday < today) {
                                upcomingBirthday = nextYearBirthday;
                            }

                            if (upcomingBirthday >= today && upcomingBirthday <= viewDaysFromNow) {
                                const daysUntil = Math.ceil((upcomingBirthday - today) / (1000 * 60 * 60 * 24));

                                // Get client name from policy - use same hierarchy as other components
                                const clientName = policy.insured?.['Name/Business Name'] ||
                                                  policy.insured?.['Primary Named Insured'] ||
                                                  policy.namedInsured?.name ||
                                                  (policy.clientName && policy.clientName !== 'N/A' && policy.clientName !== 'Unknown' ? policy.clientName : null) ||
                                                  'Unknown Client';

                                // Create unique ID to avoid duplicates
                                const policyBirthdayId = `birthday_policy_${policy.id || policy.policyNumber}_${upcomingBirthday.getFullYear()}`;

                                // Check if we already have this birthday from clients array to avoid duplicates
                                const existingBirthday = reminders.find(r =>
                                    r.type === 'birthday' &&
                                    r.clientName === clientName &&
                                    r.date.getTime() === upcomingBirthday.getTime()
                                );

                                if (!existingBirthday) {
                                    reminders.push({
                                        id: policyBirthdayId,
                                        type: 'birthday',
                                        clientName: clientName,
                                        email: policy.contact?.['Email Address'] || policy.email || '',
                                        phone: policy.contact?.['Phone Number'] || policy.phone || '',
                                        date: upcomingBirthday,
                                        daysUntil: daysUntil,
                                        age: upcomingBirthday.getFullYear() - birthDate.getFullYear(),
                                        giftSent: this.giftsSent[policyBirthdayId] || false,
                                        source: 'policy' // Mark as coming from policy data
                                    });
                                }
                            }
                        }
                    } catch (error) {
                        console.warn('Invalid date format in policy:', dateOfBirth, error);
                    }
                }
            }
        });

        // Add recent clients to reminders (if loaded)
        if (this.recentClients && this.recentClients.length > 0) {
            reminders.push(...this.recentClients);
        }

        // Sort by priority (new policies/clients by recency, birthdays by proximity)
        reminders.sort((a, b) => {
            if ((a.type === 'new_policy' || a.type === 'new_client') && (b.type === 'new_policy' || b.type === 'new_client')) {
                return b.date - a.date; // Most recent first
            }
            if (a.type === 'birthday' && b.type === 'birthday') {
                return a.daysUntil - b.daysUntil; // Soonest first
            }
            // Prioritize birthdays happening today/tomorrow over new policies/clients
            if (a.type === 'birthday' && a.daysUntil <= 1) return -1;
            if (b.type === 'birthday' && b.daysUntil <= 1) return 1;
            // Otherwise prioritize new policies/clients
            return (a.type === 'new_policy' || a.type === 'new_client') ? -1 : 1;
        });

        return reminders;
    }

    // Load recent clients from API
    async loadRecentClients() {
        try {
            console.log('📅 Loading recent clients from API...');
            const _rcSessionUser = (JSON.parse(sessionStorage.getItem('vanguard_user') || '{}').username || '').toLowerCase();
            const _rcIsMaureen = _rcSessionUser === 'maureen';
            let recentUrl;
            if (_rcIsMaureen) {
                recentUrl = '/api/clients/recent?days=7&agent=maureen';
            } else {
                const agencyFilter = window.currentCommsAgency || '';
                recentUrl = agencyFilter ? `/api/clients/recent?days=7&agency=${encodeURIComponent(agencyFilter)}` : '/api/clients/recent?days=7';
            }
            const response = await fetch(recentUrl);

            if (response.ok) {
                const recentClients = await response.json();
                console.log(`✅ Loaded ${recentClients.length} recent clients`);

                // Store recent clients and convert them to reminder format
                this.recentClients = recentClients.map(client => ({
                    id: `client_${client.id}`,
                    type: 'new_client',
                    clientName: client.clientName,
                    clientId: client.id,
                    clientType: client.clientType,
                    date: new Date(client.createdAt),
                    daysAgo: client.daysAgo,
                    phone: client.phone,
                    email: client.email,
                    state: client.state,
                    giftSent: this.giftsSent[`client_${client.id}`] || false
                }));

                return this.recentClients;
            } else {
                console.warn('⚠️ Failed to load recent clients:', response.status);
                return [];
            }
        } catch (error) {
            console.error('❌ Error loading recent clients:', error);
            return [];
        }
    }

    // Refresh the display (used after async data loads)
    refreshDisplay() {
        this.updateRemindersDisplay();
        this.updateStats();
    }

    // Update reminders display
    updateRemindersDisplay() {
        const tbody = document.getElementById('communications-reminders-tbody');
        if (!tbody) return;

        const reminders = this.getReminders();

        if (reminders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px; color: #999;">
                        No reminders at this time
                    </td>
                </tr>
            `;
        } else {
            const html = reminders.map(reminder => {
                let reminderHTML = '';

                if (reminder.type === 'new_policy') {
                    const badgeClass = this.getPolicyBadgeClass(reminder.policyType);
                    reminderHTML = `
                        <tr class="${reminder.giftSent ? 'gift-sent' : ''}">
                            <td>
                                <span class="reminder-type-badge new-policy">
                                    <i class="fas fa-file-contract"></i> New Policy
                                </span>
                            </td>
                            <td>
                                <strong>${reminder.clientName}</strong>
                                <br>
                                <small class="text-muted">${reminder.policyType}</small>
                            </td>
                            <td>
                                <span class="policy-badge ${badgeClass}">$${reminder.premium}/mo</span>
                            </td>
                            <td>
                                ${reminder.daysAgo === 0 ? 'Today' :
                                  reminder.daysAgo === 1 ? 'Yesterday' :
                                  `${reminder.daysAgo} days ago`}
                            </td>
                            <td>
                                ${reminder.giftSent ?
                                    '<span class="status-badge completed"><i class="fas fa-check"></i> Gift Sent</span>' :
                                    '<span class="status-badge pending">Pending</span>'
                                }
                            </td>
                            <td>
                                ${!reminder.giftSent ?
                                    `<button class="btn-small btn-primary" onclick="window.communicationsReminders.markGiftSent('${reminder.id}', '${reminder.clientName}')">
                                        <i class="fas fa-gift"></i> Mark Gift Sent
                                    </button>` :
                                    `<button class="btn-small btn-secondary" onclick="window.communicationsReminders.undoGiftSent('${reminder.id}')">
                                        <i class="fas fa-undo"></i> Undo
                                    </button>`
                                }
                            </td>
                        </tr>
                    `;
                } else if (reminder.type === 'new_client') {
                    reminderHTML = `
                        <tr class="${reminder.giftSent ? 'gift-sent' : ''}">
                            <td>
                                <span class="reminder-type-badge new-client">
                                    <i class="fas fa-user-plus"></i> New Client
                                </span>
                            </td>
                            <td>
                                <strong>${reminder.clientName}</strong>
                                <br>
                                <small class="text-muted">${reminder.clientType}${reminder.state ? ` • ${reminder.state}` : ''}</small>
                            </td>
                            <td>
                                <span class="client-badge">
                                    ${reminder.phone ? `<i class="fas fa-phone"></i> ${reminder.phone}` : ''}
                                    ${reminder.email ? `<br><i class="fas fa-envelope"></i> ${reminder.email}` : ''}
                                </span>
                            </td>
                            <td>
                                ${reminder.daysAgo === 0 ? 'Today' :
                                  reminder.daysAgo === 1 ? 'Yesterday' :
                                  `${reminder.daysAgo} days ago`}
                            </td>
                            <td>
                                ${reminder.giftSent ?
                                    '<span class="status-badge completed"><i class="fas fa-check"></i> Gift Sent</span>' :
                                    '<span class="status-badge pending">Pending</span>'
                                }
                            </td>
                            <td>
                                ${!reminder.giftSent ?
                                    `<button class="btn-small btn-primary" onclick="window.communicationsReminders.markGiftSent('${reminder.id}', '${reminder.clientName}')">
                                        <i class="fas fa-gift"></i> Mark Gift Sent
                                    </button>` :
                                    `<button class="btn-small btn-secondary" onclick="window.communicationsReminders.undoGiftSent('${reminder.id}')">
                                        <i class="fas fa-undo"></i> Undo
                                    </button>`
                                }
                            </td>
                        </tr>
                    `;
                } else if (reminder.type === 'birthday') {
                    const urgencyClass = reminder.daysUntil <= 3 ? 'urgent' : reminder.daysUntil <= 7 ? 'soon' : '';
                    reminderHTML = `
                        <tr class="${reminder.giftSent ? 'gift-sent' : ''} ${urgencyClass}">
                            <td>
                                <span class="reminder-type-badge birthday">
                                    <i class="fas fa-birthday-cake"></i> Birthday
                                </span>
                            </td>
                            <td>
                                <strong>${reminder.clientName}</strong>
                                <br>
                                <small class="text-muted">Turning ${reminder.age}</small>
                            </td>
                            <td>
                                <small>${reminder.email || 'No email'}</small>
                            </td>
                            <td>
                                ${reminder.daysUntil === 0 ? '<strong style="color: #ef4444;">Today!</strong>' :
                                  reminder.daysUntil === 1 ? '<strong style="color: #f97316;">Tomorrow</strong>' :
                                  `In ${reminder.daysUntil} days`}
                                <br>
                                <small>${reminder.date.toLocaleDateString()}</small>
                            </td>
                            <td>
                                ${reminder.giftSent ?
                                    '<span class="status-badge completed"><i class="fas fa-check"></i> Gift Sent</span>' :
                                    '<span class="status-badge pending">Pending</span>'
                                }
                            </td>
                            <td>
                                ${!reminder.giftSent ? `
                                    <button class="btn-small btn-primary" onclick="window.communicationsReminders.markGiftSent('${reminder.id}', '${reminder.clientName}')">
                                        <i class="fas fa-gift"></i> Mark Sent
                                    </button>
                                ` : `
                                    <button class="btn-small btn-secondary" onclick="window.communicationsReminders.undoGiftSent('${reminder.id}')">
                                        <i class="fas fa-undo"></i> Undo
                                    </button>
                                `}
                            </td>
                        </tr>
                    `;
                }

                return reminderHTML;
            }).join('');

            tbody.innerHTML = html;
        }
    }

    // Update statistics
    updateStats() {
        const reminders = this.getReminders();
        const pendingGifts = reminders.filter(r => !r.giftSent).length;
        const sentGifts = reminders.filter(r => r.giftSent).length;
        const urgentBirthdays = reminders.filter(r => r.type === 'birthday' && r.daysUntil <= 3 && !r.giftSent).length;

        // Update stats if elements exist
        const pendingElement = document.getElementById('pending-gifts-count');
        if (pendingElement) pendingElement.textContent = pendingGifts;

        const sentElement = document.getElementById('sent-gifts-count');
        if (sentElement) sentElement.textContent = sentGifts;

        const urgentElement = document.getElementById('urgent-birthdays-count');
        if (urgentElement) urgentElement.textContent = urgentBirthdays;
    }

    // Mark gift as sent
    markGiftSent(reminderId, clientName) {
        if (confirm(`Mark gift as sent for ${clientName}?`)) {
            this.giftsSent[reminderId] = {
                sentAt: new Date().toISOString(),
                sentBy: sessionStorage.getItem('vanguard_user') || 'User'
            };
            localStorage.setItem('giftsSent', JSON.stringify(this.giftsSent));

            // Add to activity log
            this.addActivityLog(`Gift sent to ${clientName}`,
                reminderId.includes('birthday') ? 'birthday' :
                reminderId.includes('client') ? 'new_client' : 'new_policy');

            // Update display
            this.updateRemindersDisplay();
            this.updateStats();

            // Show success message
            this.showNotification(`Gift marked as sent for ${clientName}`, 'success');
        }
    }

    // Undo gift sent
    undoGiftSent(reminderId) {
        delete this.giftsSent[reminderId];
        localStorage.setItem('giftsSent', JSON.stringify(this.giftsSent));

        // Update display
        this.updateRemindersDisplay();
        this.updateStats();

        this.showNotification('Gift status updated', 'info');
    }

    // Add activity log
    addActivityLog(message, type) {
        const activities = JSON.parse(localStorage.getItem('gift_activities') || '[]');
        activities.unshift({
            message,
            type,
            timestamp: new Date().toISOString(),
            user: sessionStorage.getItem('vanguard_user') || 'User'
        });

        // Keep only last 100 activities
        if (activities.length > 100) {
            activities.splice(100);
        }

        localStorage.setItem('gift_activities', JSON.stringify(activities));
    }

    // Get policy badge class
    getPolicyBadgeClass(policyType) {
        const type = (policyType || '').toLowerCase();
        if (type.includes('auto')) return 'auto';
        if (type.includes('home')) return 'home';
        if (type.includes('commercial')) return 'commercial';
        if (type.includes('life')) return 'life';
        return 'general';
    }

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
            ${message}
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
}

// Initialize when loaded
window.communicationsReminders = new CommunicationsReminders();

// Export for use in other modules
window.CommunicationsReminders = CommunicationsReminders;