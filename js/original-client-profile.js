// Original Simple Client Profile Design
window.viewClientOriginal = async function(id) {
    console.log('Loading original client profile for:', id);

    // Store the client ID globally for refresh after policy deletion
    window.currentViewingClientId = id;

    // Get fresh client data from API to ensure password updates are reflected
    let client;
    try {
        const response = await fetch('/api/clients');
        const data = await response.json();
        const clients = Array.isArray(data) ? data : (data.clients || []);
        client = clients.find(c => c.id == id);

        if (!client) {
            // Fallback to localStorage if not found in API
            const localClients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
            client = localClients.find(c => c.id == id);
        }
    } catch (error) {
        console.error('Error fetching client data from API:', error);
        // Fallback to localStorage on error
        const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
        client = clients.find(c => c.id == id);
    }

    if (!client) {
        showNotification('Client not found', 'error');
        loadClientsView();
        return;
    }

    // Merge server policies into localStorage without overwriting local-only entries
    try {
        const response = await fetch('/api/policies?includeInactive=true&limit=500');
        if (response.ok) {
            const serverPolicies = await response.json();
            const localPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
            // Build map of server policies by id
            const serverMap = {};
            serverPolicies.forEach(p => { if (p.id) serverMap[p.id] = p; });
            // Keep local-only policies (not on server) and merge with server data
            const merged = [...serverPolicies];
            localPolicies.forEach(p => { if (p.id && !serverMap[p.id]) merged.push(p); });
            localStorage.setItem('insurance_policies', JSON.stringify(merged));
            console.log(`✅ Merged ${serverPolicies.length} server + ${merged.length - serverPolicies.length} local-only policies`);
        }
    } catch (error) {
        console.log('⚠️ Could not sync from server, using localStorage data:', error.message);
    }

    const allPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    console.log('Total policies in storage:', allPolicies.length);
    console.log('Client ID:', id, 'Client Name:', client.name);

    // Build identity key for this client (name + DOB) for fuzzy matching
    const clientDob = client.dateOfBirth || client['Date of Birth'] || '';
    const clientKey = _clientIdentityKey(client.name || client.businessName || '', clientDob);

    // Normalize helpers for broad matching
    const _nStr = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    const _nPh  = s => (s || '').replace(/\D/g, '');
    const clientNameN = _nStr(client.name);
    const clientBizN  = _nStr(client.businessName || client.companyName || '');
    const clientEmailN = (client.email || '').toLowerCase().trim();
    const clientPhoneN = _nPh(client.phone);
    const clientPeopleNames = (client.people || []).map(p => _nStr((p.firstName || '') + ' ' + (p.lastName || '') || p.name || '')).filter(Boolean);

    const clientPolicies = allPolicies.filter(policy => {
        // 1. Exact clientId match — always wins
        if (policy.clientId && String(policy.clientId) === String(id)) return true;

        // 2. Identity key: owner name + DOB (catches policies linked to duplicate auto-created client records)
        const polOwner = policy.contact?.['Owner Name'] || policy.insuredName || '';
        const polDob   = policy.contact?.['Date of Birth'] || '';
        const polKey   = _clientIdentityKey(polOwner, polDob);
        if (clientKey && polKey && polKey === clientKey) return true;

        // Gather all name variants from the policy
        const polNames = [
            policy.insured?.['Name/Business Name'],
            policy.insured?.['Primary Named Insured'],
            policy.insured?.['Business Name'],
            policy.insured?.['Full Name'],
            policy.insuredName,
            policy.clientName,
            policy.contact?.['Owner Name'],
            policy.contact?.['Business Name']
        ].filter(Boolean);

        // 3. Exact name match (person name, business name, people contacts)
        for (const pn of polNames) {
            const pnN = _nStr(pn);
            if (pnN && clientNameN && pnN === clientNameN) return true;
            if (pnN && clientBizN && pnN === clientBizN) return true;
            if (pnN && clientPeopleNames.some(cn => cn === pnN)) return true;
        }

        // 4. Fuzzy identity key on insured/client name
        for (const pn of polNames) {
            const polKeyFallback = _clientIdentityKey(pn, '');
            if (clientKey && polKeyFallback && polKeyFallback === clientKey) return true;
        }

        // 5. Business name containment (handles "LOPEZ TRUCKING COMPANY LLC" vs "Lopez Trucking")
        if (clientBizN && clientBizN.length >= 4) {
            for (const pn of polNames) {
                const pnN = _nStr(pn);
                if (pnN && (pnN.includes(clientBizN) || clientBizN.includes(pnN))) return true;
            }
        }

        // 6. Email match
        const polEmail = (policy.contact?.['Email'] || policy.contact?.['email'] || policy.contact?.['Email Address'] || policy.insured?.['Email'] || '').toLowerCase().trim();
        if (clientEmailN && polEmail && clientEmailN === polEmail) return true;

        // 7. Phone match
        const polPhone = _nPh(policy.contact?.['Phone'] || policy.contact?.['phone'] || policy.contact?.['Phone Number'] || policy.insured?.['Phone'] || '');
        if (clientPhoneN && clientPhoneN.length >= 10 && polPhone.length >= 10 && clientPhoneN === polPhone) return true;

        // 8. Client name match against policy.clientName (IVANS imports set this)
        if (policy.clientName && client.name) {
            const pcN = _nStr(policy.clientName);
            if (pcN && clientNameN && pcN === clientNameN) return true;
        }

        // 9. Legacy client.policies array
        if (client.policies && Array.isArray(client.policies)) {
            return client.policies.some(p => {
                if (typeof p === 'string') return p === policy.id || p === policy.policyNumber;
                if (typeof p === 'object' && p) return p.id === policy.id || p.policyNumber === policy.policyNumber;
                return false;
            });
        }

        return false;
    });

    console.log('Client policies found:', clientPolicies.length);

    // Calculate total premium
    let totalPremium = 0;
    clientPolicies.forEach(policy => {
        const premiumValue = policy.financial?.['Annual Premium'] ||
                            policy.financial?.['Premium'] ||
                            policy.financial?.annualPremium ||
                            policy.financial?.premium ||
                            policy['Annual Premium'] ||
                            policy.Premium ||
                            policy.premium ||
                            policy.annualPremium || 0;
        const numericPremium = typeof premiumValue === 'string' ?
            parseFloat(premiumValue.replace(/[$,]/g, '')) || 0 :
            parseFloat(premiumValue) || 0;
        console.log(`Profile - Policy ${policy.policyNumber}: Premium = ${premiumValue} -> ${numericPremium}`);
        totalPremium += numericPremium;
    });

    // Resolve full name: prefer stored fields, then fall back to linked policy contact/driver data
    const resolvedFullName = client.fullName || client.contactName || (() => {
        for (const p of clientPolicies) {
            const n = (p.contact && p.contact['Owner Name']) || p.clientName || p.insuredName ||
                      (Array.isArray(p.drivers) && p.drivers[0] && p.drivers[0].name) || '';
            if (n) return n;
        }
        return '';
    })();

    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;

    dashboardContent.innerHTML = `
        <div class="client-profile-view">
            <header class="content-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
                <div class="header-back">
                    <button class="btn-back" onclick="loadClientsView()" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; backdrop-filter: blur(10px);">
                        <i class="fas fa-arrow-left"></i> Back to Clients
                    </button>
                    <h1 style="color: white; margin: 12px 0 0 0; font-size: 28px; font-weight: 600;">${client.name}</h1>
                </div>
                <div class="header-actions">
                    <button class="btn-secondary" onclick="editClient('${id}')" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white;">
                        <i class="fas fa-edit"></i> Edit Client
                    </button>
                    <button class="btn-primary" onclick="addPolicyToClient('${id}')" style="background: white; color: #667eea;">
                        <i class="fas fa-plus"></i> Add Policy
                    </button>
                </div>
            </header>

            <div style="padding: 0 24px;">
            <!-- Client Portal Box -->
            <div style="background: white; border-radius: 12px; padding: 28px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); border: 1px solid #e5e7eb; margin-bottom: 24px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
                    <div style="display: flex; align-items: center;">
                        <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; margin-right: 12px;">
                            <i class="fas fa-user-circle" style="font-size: 20px;"></i>
                        </div>
                        <div>
                            <h3 style="margin: 0; color: #1f2937; font-size: 20px; font-weight: 600;">Client Portal</h3>
                            <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">Portal Access & Settings</p>
                        </div>
                    </div>
                    <div>
                        ${client.portalPassword ?
                            `<a href="https://vigagency.com/pages/login.html" target="_blank" style="color: #3b82f6; text-decoration: none; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 6px; padding: 8px 16px; border: 1px solid #3b82f6; border-radius: 6px; transition: all 0.2s; background: transparent;">
                                <i class="fas fa-external-link-alt" style="font-size: 14px;"></i>
                                Go to Client Portal
                            </a>` :
                            `<span style="color: #9ca3af; text-decoration: none; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 6px; padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: #f9fafb; cursor: not-allowed;">
                                <i class="fas fa-external-link-alt" style="font-size: 14px;"></i>
                                Go to Client Portal
                            </span>`
                        }
                    </div>
                </div>
                <div style="display: grid; gap: 20px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-envelope" style="color: #6b7280; font-size: 16px;"></i>
                            <div>
                                <label style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 2px; text-transform: uppercase;">Portal Email</label>
                                <p style="margin: 0; font-size: 14px; color: #1f2937;">${client.email || 'No email set'}</p>
                            </div>
                        </div>
                        <button onclick="window.editClientPortalEmail('${client.id}', '${client.email || ''}')" style="padding: 6px 12px; background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px; cursor: pointer; transition: all 0.2s;">
                            <i class="fas fa-edit" style="font-size: 10px; margin-right: 4px;"></i>Edit
                        </button>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-lock" style="color: #6b7280; font-size: 16px;"></i>
                            <div>
                                <label style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 2px; text-transform: uppercase;">Portal Password</label>
                                <p style="margin: 0; font-size: 14px; color: ${client.portalPassword ? '#1f2937' : '#9ca3af'};">
                                    <span id="password-display-${client.id}" style="font-family: monospace;">${client.portalPassword ? '●●●●●●●●' : 'NOT CREATED'}</span>
                                    <span style="margin-left: 8px; color: #6b7280; font-size: 12px;">${client.portalPassword ? '(Set)' : ''}</span>
                                </p>
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            ${client.portalPassword ? `
                                <button onclick="window.togglePasswordVisibility('${client.id}', '${client.portalPassword.replace(/'/g, "\\'")}', this)" style="padding: 6px 8px; background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px; cursor: pointer; transition: all 0.2s;" title="Show/Hide Password">
                                    <i class="fas fa-eye" style="font-size: 10px;"></i>
                                </button>
                            ` : ''}
                            <button onclick="window.${client.portalPassword ? 'changeClientPortalPassword' : 'createClientPortalPassword'}('${client.id}')" style="padding: 6px 12px; background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px; cursor: pointer; transition: all 0.2s;">
                                <i class="fas fa-${client.portalPassword ? 'edit' : 'plus'}" style="font-size: 10px; margin-right: 4px;"></i>${client.portalPassword ? 'Change' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 24px 24px 0;">
                <!-- Left Side: People + Addresses -->
                <div style="display: flex; flex-direction: column; gap: 16px;">

                    <!-- People Box -->
                    <div style="background: white; border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); border: 1px solid #e5e7eb; overflow: hidden;">
                        <div style="background: #3c8dbc; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: white; font-weight: 600; font-size: 14px;">People</span>
                            <button onclick="window.addClientPerson && window.addClientPerson('${client.id}')" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.35); color: white; border-radius: 5px; padding: 3px 9px; cursor: pointer; font-size: 13px;" title="Add Person">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <div style="padding: 0;">
                            ${(() => {
                                // Companies (LLC, Inc, Corp, etc.) belong in the Business box.
                                // For company clients, pull driver[0] from the first policy as the owner.
                                const _isCompany = n => /LLC|Inc\b|Corp\b|L\.L\.C|Incorporated|Company|Transport|Trucking|Logistics|Enterprise|Services|Group|Industries|Solutions|Associates|Partners/i.test(n || '');
                                const _primaryName = resolvedFullName || client.name || '';
                                const _clientIsCompany = _isCompany(_primaryName) || _isCompany(client.businessName);

                                // Find first driver from linked policies to use as owner
                                let _owner = null;
                                if (_clientIsCompany) {
                                    for (const _p of clientPolicies) {
                                        if (Array.isArray(_p.drivers) && _p.drivers.length > 0) {
                                            const _d = _p.drivers[0];
                                            _owner = {
                                                name:  _d.name || _d['Full Name'] || '',
                                                dob:   _d.dateOfBirth || _d['Date of Birth'] || '',
                                                email: _p.contact?.['Email'] || _p.contact?.['Email Address'] || client.email || '',
                                                phone: _p.contact?.['Phone'] || _p.contact?.['Phone Number'] || client.phone || '',
                                                license: _d.licenseNumber ? `${_d.licenseState || ''} ${_d.licenseNumber}`.trim() : '',
                                            };
                                            break;
                                        }
                                    }
                                }

                                const _personName  = _clientIsCompany ? (_owner?.name || '') : _primaryName;
                                const _personEmail = _clientIsCompany ? (_owner?.email || '') : (client.email || '');
                                const _personPhone = _clientIsCompany ? (_owner?.phone || '') : (client.phone || '');
                                const _personDob   = _clientIsCompany ? (_owner?.dob   || '') : (client.dateOfBirth || '');
                                const _personRole  = _clientIsCompany ? 'Owner / Primary Driver' : 'Insured';

                                if (!_personName) {
                                    return `<div style="padding:20px 16px;text-align:center;color:#9ca3af;font-size:13px;">
                                        <i class="fas fa-user-slash" style="margin-right:6px;opacity:0.4;"></i>No individual contacts on file
                                        <div style="margin-top:6px;font-size:12px;">Use <strong>Add Person</strong> to add a contact for this business</div>
                                    </div>`;
                                }

                                return `<table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                                <tbody>
                                    <tr style="border-bottom: 1px solid #f3f4f6;">
                                        <td style="padding: 10px 8px; width: 60px; vertical-align: top;">
                                            <button onclick="window.editClientPerson && window.editClientPerson('${client.id}')" style="background: #3b82f6; color: white; border: none; border-radius: 4px; padding: 3px 6px; cursor: pointer; font-size: 11px; margin-right: 3px;" title="Edit"><i class="fas fa-pencil-alt"></i></button>
                                        </td>
                                        <td style="padding: 10px 8px; vertical-align: top;">
                                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px;">
                                                <!-- Col 1: Name + role + Added + DOB -->
                                                <div>
                                                    <div style="font-weight: 700; color: #111827; margin-bottom: 2px;">
                                                        ${_personName}
                                                    </div>
                                                    <div style="color: #6b7280; font-size: 12px;">(${_personRole})</div>
                                                    <div style="margin-top: 6px; display: flex; gap: 12px; flex-wrap: wrap;">
                                                        <div>
                                                            <span style="color: #6380b0; font-size: 11px; font-weight: 600;">Added</span>
                                                            <span style="color: #374151; margin-left: 4px; font-size: 12px;">${client.createdAt ? new Date(client.createdAt).toLocaleDateString('en-US',{month:'2-digit',day:'2-digit',year:'numeric'}).replace(/\//g,'-') : 'N/A'}</span>
                                                        </div>
                                                        ${_personDob ? `<div>
                                                            <span style="color: #6380b0; font-size: 11px; font-weight: 600;">DOB</span>
                                                            <span style="color: #374151; margin-left: 4px; font-size: 12px;">${_personDob}</span>
                                                        </div>` : ''}
                                                        ${_owner?.license ? `<div>
                                                            <span style="color: #6380b0; font-size: 11px; font-weight: 600;">License</span>
                                                            <span style="color: #374151; margin-left: 4px; font-size: 12px;">${_owner.license}</span>
                                                        </div>` : ''}
                                                    </div>
                                                </div>
                                                <!-- Col 2: Email + Phone -->
                                                <div>
                                                    ${_personEmail ? `
                                                    <div style="margin-bottom: 4px;">
                                                        <span style="color: #6380b0; font-size: 11px; font-weight: 600;">Email</span>
                                                        <div style="font-size: 12px;"><a href="mailto:${_personEmail}" style="color: #3b82f6; text-decoration: none;">${_personEmail}</a></div>
                                                    </div>` : ''}
                                                    ${_personPhone ? `
                                                    <div style="margin-bottom: 4px;">
                                                        <span style="color: #6380b0; font-size: 11px; font-weight: 600;">Primary</span>
                                                        <div style="font-size: 12px;"><a href="tel:${_personPhone}" style="color: #374151; text-decoration: none;">${_personPhone}</a></div>
                                                    </div>` : ''}
                                                    ${!_clientIsCompany && client.workPhone ? `
                                                    <div>
                                                        <span style="color: #6380b0; font-size: 11px; font-weight: 600;">Work</span>
                                                        <div style="font-size: 12px;"><a href="tel:${client.workPhone}" style="color: #374151; text-decoration: none;">${client.workPhone}</a></div>
                                                    </div>` : ''}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>`;
                            })()}
                        </div>
                    </div>

                    <!-- Business Box -->
                    <div style="background: white; border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); border: 1px solid #e5e7eb; overflow: hidden;">
                        <div style="background: #3c8dbc; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: white; font-weight: 600; font-size: 14px;">Business</span>
                            <button onclick="window.saveClientBusiness('${client.id}')" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.35); color: white; border-radius: 5px; padding: 3px 10px; cursor: pointer; font-size: 12px; font-weight: 600;" title="Save Business Info">
                                <i class="fas fa-save" style="margin-right:4px;"></i>Save
                            </button>
                        </div>
                        <div style="padding: 14px 16px;">
                            ${(() => {
                                const fRow = (label, id, val, colW) => `
                                    <div style="display:grid;grid-template-columns:${colW||'120px'} 1fr;gap:6px;align-items:center;margin-bottom:10px;">
                                        <label style="font-size:12px;color:#4b5563;font-weight:600;text-align:right;padding-right:8px;">${label}</label>
                                        <input id="biz-${id}" value="${String(val||'').replace(/"/g,'&quot;')}" style="border:1px solid #d1d5db;border-radius:5px;padding:5px 8px;font-size:13px;width:100%;box-sizing:border-box;color:#111827;">
                                    </div>`;
                                const fRow2 = (label1, id1, val1, label2, id2, val2) => `
                                    <div style="display:grid;grid-template-columns:120px 1fr 100px 1fr;gap:6px;align-items:center;margin-bottom:10px;">
                                        <label style="font-size:12px;color:#4b5563;font-weight:600;text-align:right;padding-right:8px;">${label1}</label>
                                        <input id="biz-${id1}" value="${String(val1||'').replace(/"/g,'&quot;')}" style="border:1px solid #d1d5db;border-radius:5px;padding:5px 8px;font-size:13px;width:100%;box-sizing:border-box;color:#111827;">
                                        <label style="font-size:12px;color:#4b5563;font-weight:600;text-align:right;padding-right:8px;">${label2}</label>
                                        <input id="biz-${id2}" value="${String(val2||'').replace(/"/g,'&quot;')}" style="border:1px solid #d1d5db;border-radius:5px;padding:5px 8px;font-size:13px;width:100%;box-sizing:border-box;color:#111827;">
                                    </div>`;
                                return fRow('Business Name','name', client.company||client.businessName||client.name||'')
                                    + fRow('DBA','dba', client.dba||'')
                                    + fRow2('Business Type','type', client.businessType||'', 'FEIN','fein', client.fein||'')
                                    + fRow('Website','website', client.website||'')
                                    + fRow('Email','email', client.businessEmail||client.email||'')
                                    + fRow('GL Code','glCode', client.glCode||'')
                                    + fRow('SIC Code','sicCode', client.sicCode||'')
                                    + fRow('NAICS Code','naicsCode', client.naicsCode||'');
                            })()}
                        </div>
                    </div>

                    <!-- Addresses Box -->
                    <div style="background: white; border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); border: 1px solid #e5e7eb; overflow: hidden;">
                        <div style="background: #3c8dbc; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: white; font-weight: 600; font-size: 14px;">Addresses</span>
                            <button onclick="window.addClientAddress && window.addClientAddress('${client.id}')" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.35); color: white; border-radius: 5px; padding: 3px 9px; cursor: pointer; font-size: 13px;" title="Add Address">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <div style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                                <thead>
                                    <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                                        <th style="padding: 8px; width: 50px;"></th>
                                        <th style="padding: 8px; text-align: left; color: #374151; font-weight: 600;">Address</th>
                                        <th style="padding: 8px; text-align: left; color: #374151; font-weight: 600;">City</th>
                                        <th style="padding: 8px; text-align: left; color: #374151; font-weight: 600;">State</th>
                                        <th style="padding: 8px; text-align: left; color: #374151; font-weight: 600;">Zip</th>
                                        <th style="padding: 8px; text-align: left; color: #374151; font-weight: 600;">Type</th>
                                        <th style="padding: 8px; width: 36px;"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${(() => {
                                        const addr = client.address || '';
                                        if (!addr && !client.city && !client.state && !client.zip) return `<tr><td colspan="7" style="padding:16px;text-align:center;color:#9ca3af;font-size:13px;">No addresses on file</td></tr>`;
                                        // Use dedicated fields first, fall back to parsing address string
                                        const parts = addr.split(',').map(s => s.trim());
                                        const street = parts[0] || addr;
                                        const parsedCityPart = parts[1] || '';
                                        const parsedStateZip = (parts[2] || '').trim().split(/\s+/);
                                        const city = client.city || parsedCityPart;
                                        const state = client.state || parsedStateZip[0] || '';
                                        const zip = client.zip || parsedStateZip[1] || '';
                                        const gmapsUrl = `https://www.google.com/maps/place/${encodeURIComponent(addr)}`;
                                        return `<tr style="border-bottom: 1px solid #f3f4f6;">
                                            <td style="padding: 8px;">
                                                <button onclick="window.editClientAddress && window.editClientAddress('${client.id}')" style="background:#3b82f6;color:white;border:none;border-radius:3px;padding:2px 5px;cursor:pointer;font-size:11px;margin-right:2px;" title="Edit"><i class="fas fa-pencil-alt"></i></button>
                                            </td>
                                            <td style="padding: 8px; color: #111827;">${street}</td>
                                            <td style="padding: 8px; color: #374151;">${city}</td>
                                            <td style="padding: 8px; color: #374151;">${state}</td>
                                            <td style="padding: 8px; color: #374151;">${zip}</td>
                                            <td style="padding: 8px; color: #374151;">Mailing &amp; Physical</td>
                                            <td style="padding: 8px;">
                                                <a href="${gmapsUrl}" target="_blank" style="background:#17a2b8;color:white;border:none;border-radius:3px;padding:3px 6px;cursor:pointer;font-size:11px;text-decoration:none;" title="Map"><i class="fas fa-map-marked"></i></a>
                                            </td>
                                        </tr>`;
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

                <!-- Policies - Right Side -->
                ${(() => {
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const _parseExpDate = (d) => {
                        if (!d) return null;
                        // Handle MM/DD/YYYY
                        const slashMatch = String(d).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                        if (slashMatch) return new Date(slashMatch[3], slashMatch[1]-1, slashMatch[2]);
                        // Handle YYYY-MM-DD
                        const dashMatch = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/);
                        if (dashMatch) return new Date(dashMatch[1], dashMatch[2]-1, dashMatch[3]);
                        const parsed = new Date(d);
                        return isNaN(parsed) ? null : parsed;
                    };
                    const activePolicies = clientPolicies.filter(p => {
                        const exp = _parseExpDate(p.expirationDate || p.overview?.['Expiration Date']);
                        return !exp || exp >= today;
                    });
                    const expiredPolicies = clientPolicies.filter(p => {
                        const exp = _parseExpDate(p.expirationDate || p.overview?.['Expiration Date']);
                        return exp && exp < today;
                    });
                    window._clientExpiredPolicies = expiredPolicies;
                    return `
                <div style="background: white; border-radius: 12px; padding: 28px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px;">
                        <div style="display: flex; align-items: center;">
                            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; margin-right: 12px;">
                                <i class="fas fa-file-contract" style="font-size: 20px;"></i>
                            </div>
                            <div>
                                <h2 style="margin: 0; color: #1f2937; font-size: 22px; font-weight: 600;">Active Policies</h2>
                                <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">${activePolicies.length} Active${expiredPolicies.length ? ', ' + expiredPolicies.length + ' Expired' : ''}</p>
                            </div>
                        </div>
                        ${expiredPolicies.length ? `<button onclick="window._showExpiredPolicies()" style="display:flex;align-items:center;gap:6px;background:#f3f4f6;color:#6b7280;border:1px solid #d1d5db;padding:8px 14px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;transition:all 0.2s;" onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='#f3f4f6'"><i class="fas fa-history"></i> Policy History (${expiredPolicies.length})</button>` : ''}
                    </div>

                    <div style="display: grid; gap: 16px;">
                        ${activePolicies.length > 0 ? activePolicies.map(policy => {
                            const premium = policy.financial?.['Annual Premium'] ||
                                          policy.financial?.['Premium'] ||
                                          policy.premium || 0;
                            const formattedPremium = typeof premium === 'string' ?
                                premium : `$${Number(premium).toLocaleString()}`;

                            // Debug the policy status values
                            const currentStatus = policy.policyStatus || policy.status || 'Active';
                            const isActive = currentStatus === 'Active';
                            console.log(`🔍 RENDER DEBUG: Policy ${policy.policyNumber} - status: "${policy.status}", policyStatus: "${policy.policyStatus}", currentStatus: "${currentStatus}", isActive: ${isActive}`);

                            return `
                            <div style="border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; background: linear-gradient(135deg, #fafafa 0%, #f9fafb 100%); transition: all 0.3s ease; cursor: pointer; position: relative; overflow: hidden;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 10px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                                <div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);"></div>
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
                                    <div>
                                        <p style="margin: 0; font-weight: 600; color: #3b82f6; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
                                            ${policy.policyNumber || 'No Policy Number'}
                                        </p>
                                        <p style="margin: 6px 0 0 0; color: #1f2937; font-size: 18px; font-weight: 600;">
                                            ${policy.policyType || policy.type || 'Unknown Type'}
                                        </p>
                                        ${(() => {
                                            // Get business name from Named Insured tab first, then fallback to clientName
                                            const businessName = policy.insured?.['Name/Business Name'] ||
                                                                policy.insured?.['Primary Named Insured'] ||
                                                                policy.namedInsured?.name ||
                                                                policy.clientName;
                                            return businessName ? `
                                        <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px; font-weight: 500;">
                                            ${businessName}
                                        </p>` : '';
                                        })()}
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <label style="position: relative; display: inline-block; width: 40px; height: 20px; cursor: pointer;">
                                            <input type="checkbox"
                                                   id="policyActiveToggle-${policy.id || policy.policyNumber}"
                                                   ${isActive ? 'checked' : ''}
                                                   onchange="window.togglePolicyStatus('${policy.id || policy.policyNumber}', this.checked)"
                                                   style="opacity: 0; width: 0; height: 0;">
                                            <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${isActive ? '#10b981' : '#cbd5e0'}; transition: .4s; border-radius: 20px;">
                                                <span style="position: absolute; content: ''; height: 16px; width: 16px; left: ${isActive ? '22px' : '2px'}; bottom: 2px; background-color: white; transition: .4s; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></span>
                                            </span>
                                        </label>
                                        <span style="background: ${isActive ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'}; color: white; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                            Client Portal ${isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>

                                <div style="display: grid; gap: 8px; font-size: 14px; color: #4b5563;">
                                    <div style="display: flex; justify-content: space-between;">
                                        <span>Carrier:</span>
                                        <span style="color: #1f2937; font-weight: 500;">${policy.carrier || 'N/A'}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between;">
                                        <span>Premium:</span>
                                        <span style="color: #059669; font-weight: bold;">${formattedPremium}/yr</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between;">
                                        <span>Effective:</span>
                                        <span style="color: #1f2937;">${policy.effectiveDate ? formatDate(policy.effectiveDate) : 'N/A'}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between;">
                                        <span>Expires:</span>
                                        <span style="color: #1f2937;">${policy.expirationDate ? formatDate(policy.expirationDate) : 'N/A'}</span>
                                    </div>
                                </div>

                                <div style="display: flex; gap: 8px; margin-top: 12px;">
                                    <button onclick="viewPolicy('${policy.id}')" style="flex: 1; padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                                        View Details
                                    </button>
                                    <button onclick="deletePolicy('${policy.id}', '${id}')" style="padding: 6px 12px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                            `;
                        }).join('') : `
                            <div style="text-align: center; padding: 40px; color: #9ca3af;">
                                <i class="fas fa-file-contract" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                                <p style="margin: 0 0 16px 0; font-size: 16px;">No active policies</p>
                                ${expiredPolicies.length ? `<p style="margin: 0 0 16px 0; font-size: 14px;">Check <strong>Policy History</strong> for ${expiredPolicies.length} expired ${expiredPolicies.length === 1 ? 'policy' : 'policies'}</p>` : ''}
                                <button onclick="addPolicyToClient('${id}')" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
                                    <i class="fas fa-plus"></i> Add Policy
                                </button>
                                <button onclick="syncPoliciesForClient('${id}')" style="padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; margin-left: 8px;">
                                    <i class="fas fa-sync-alt"></i> Sync Policies
                                </button>
                            </div>
                        `}
                    </div>
                </div>`; })()}
            </div>

            <!-- Media / Files + Notes Row -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 24px;">

                <!-- Media / Files -->
                <div style="background: white; border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); border: 1px solid #e5e7eb; overflow: hidden;">
                    <div style="background: #3c8dbc; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: white; font-weight: 600; font-size: 14px;"><i class="far fa-folder-open" style="margin-right:7px;"></i>Media / Files</span>
                        <button onclick="window.uploadClientDocument('${id}')" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.35); color: white; border-radius: 5px; padding: 3px 10px; cursor: pointer; font-size: 13px;" title="Upload file">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                            <thead>
                                <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                                    <th style="padding: 7px 10px; width: 28px;"></th>
                                    <th style="padding: 7px 10px; text-align: left; color: #374151; font-weight: 600;">File Name</th>
                                    <th style="padding: 7px 10px; text-align: right; color: #374151; font-weight: 600; white-space: nowrap;">Date</th>
                                    <th style="padding: 7px 10px; width: 60px;"></th>
                                </tr>
                            </thead>
                            <tbody id="client-documents-list">
                                ${window.renderClientDocuments(id)}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Notes -->
                <div style="background: white; border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); border: 1px solid #e5e7eb; overflow: hidden; display: flex; flex-direction: column;">
                    <div style="background: #3c8dbc; padding: 10px 16px; display: flex; align-items: center; flex-shrink: 0;">
                        <span style="color: white; font-weight: 600; font-size: 14px;"><i class="fas fa-sticky-note" style="margin-right:7px;"></i>Notes</span>
                    </div>
                    <div style="flex: 1; overflow-y: auto; max-height: 320px;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 13px;" id="client-notes-table">
                            <tbody id="client-notes-list">
                                ${(() => {
                                    const notesArr = Array.isArray(client.notesLog) ? client.notesLog
                                        : (client.notes && typeof client.notes === 'string' && client.notes.trim())
                                            ? [{ text: client.notes, date: client.updatedAt || client.createdAt || '' }]
                                            : [];
                                    if (!notesArr.length) return `<tr><td style="padding:24px;text-align:center;color:#9ca3af;font-size:13px;"><i class="fas fa-sticky-note" style="margin-right:6px;opacity:0.4;"></i>No notes yet</td></tr>`;
                                    return notesArr.map((n, i) => {
                                        const dateStr = n.date ? new Date(n.date).toLocaleDateString('en-US',{month:'2-digit',day:'2-digit',year:'numeric'}) : '';
                                        const text = typeof n === 'string' ? n : (n.text || n.content || '');
                                        const preview = text.length > 120 ? text.slice(0, 120) + '…' : text;
                                        return `<tr style="border-bottom:1px solid #f3f4f6;cursor:pointer;${i%2===1?'background:#fafafa;':''}" onclick="window.viewClientNote && window.viewClientNote('${id}', ${i})" title="${String(text).replace(/"/g,'&quot;')}">
                                            <td style="padding:8px 10px;color:#374151;line-height:1.4;">${preview}</td>
                                            <td style="padding:8px 10px;text-align:right;white-space:nowrap;color:#9ca3af;font-size:11px;vertical-align:top;">${dateStr}</td>
                                        </tr>`;
                                    }).join('');
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
            </div>
        </div>
    `;
};

// Document Management Functions
window.renderClientDocuments = function(clientId) {
    // Load documents from server asynchronously
    loadClientDocuments(clientId);
    return `<tr><td colspan="4" style="padding:20px;text-align:center;color:#9ca3af;font-size:13px;"><i class="fas fa-spinner fa-spin" style="margin-right:6px;"></i>Loading...</td></tr>`;
};

// Load client documents from server
async function loadClientDocuments(clientId) {
    try {
        console.log('📁 Loading documents for client:', clientId);
        const url = `/api/documents?clientId=${clientId}`;
        console.log('📁 Fetching from URL:', url);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('📁 Raw API response:', data);
        const clientDocs = data.documents || [];

        console.log(`📁 Loaded ${clientDocs.length} documents from server`);

        // Update the documents display
        const documentsList = document.getElementById('client-documents-list');
        if (documentsList) {
            if (clientDocs.length === 0) {
                documentsList.innerHTML = `<tr><td colspan="4" style="padding:24px;text-align:center;color:#9ca3af;font-size:13px;"><i class="fas fa-folder-open" style="margin-right:6px;opacity:0.4;"></i>No documents uploaded yet</td></tr>`;
            } else {
                documentsList.innerHTML = clientDocs.map((doc, i) => {
                    const fileIcon = getFileIcon(doc.type);
                    const uploadDate = doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString('en-US', {month:'2-digit',day:'2-digit',year:'numeric'}) + ' ' + new Date(doc.uploadDate).toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'}) : '';
                    return `
                        <tr style="border-bottom:1px solid #f3f4f6;${i%2===1?'background:#fafafa;':''}">
                            <td style="padding:6px 10px;"><i class="fas fa-pencil-alt" style="color:#6b7280;cursor:pointer;font-size:11px;" onclick="window.editClientDocument && window.editClientDocument('${clientId}','${doc.id}')" title="Edit"></i></td>
                            <td style="padding:6px 10px;"><i class="${fileIcon.icon}" style="color:${fileIcon.color};margin-right:6px;font-size:13px;"></i><a href="/api/documents/${doc.id}/download" target="_blank" style="color:#374151;text-decoration:none;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${doc.name}</a></td>
                            <td style="padding:6px 10px;text-align:right;white-space:nowrap;color:#6b7280;font-size:12px;">${uploadDate}</td>
                            <td style="padding:6px 10px;text-align:center;white-space:nowrap;">
                                <button onclick="window.downloadClientDocument('${clientId}','${doc.id}')" style="background:#3b82f6;color:white;border:none;border-radius:3px;padding:2px 6px;cursor:pointer;font-size:11px;margin-right:2px;" title="Download"><i class="fas fa-download"></i></button>
                                <button onclick="window.deleteClientDocument('${clientId}','${doc.id}')" style="background:#dc2626;color:white;border:none;border-radius:3px;padding:2px 6px;cursor:pointer;font-size:11px;" title="Delete"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>`;
                }).join('');
            }
        }
    } catch (error) {
        console.error('📁 Error loading documents:', error);
        const documentsList = document.getElementById('client-documents-list');
        if (documentsList) {
            documentsList.innerHTML = `<tr><td colspan="4" style="padding:24px;text-align:center;color:#ef4444;font-size:13px;"><i class="fas fa-exclamation-triangle" style="margin-right:6px;"></i>Error loading documents</td></tr>`;
        }
    }
}

window.uploadClientDocument = function(clientId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.xls,.xlsx';

    input.onchange = async function(event) {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        console.log(`📤 Uploading ${files.length} files for client ${clientId}...`);
        showNotification('Uploading documents...', 'info');

        try {
            const uploadPromises = files.map(file => uploadFileToServer(file, clientId));
            await Promise.all(uploadPromises);

            showNotification(`${files.length} document(s) uploaded successfully`, 'success');

            // Refresh documents display
            loadClientDocuments(clientId);

        } catch (error) {
            console.error('📤 Upload error:', error);
            showNotification('Error uploading documents', 'error');
        }
    };

    input.click();
};

// Upload single file to server
async function uploadFileToServer(file, clientId) {
    console.log('📤 Uploading file:', file.name, 'for client:', clientId);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('clientId', clientId);
    formData.append('uploadedBy', sessionStorage.getItem('vanguard_user') || 'User');

    const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('📤 Upload error response:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('📤 Upload success response:', result);
    return result;
}

window.downloadClientDocument = function(clientId, docId) {
    console.log(`📥 CLIENT DOCUMENT DOWNLOAD CALLED - Client: ${clientId}, Doc: ${docId}`);

    // Prevent any potential conflicts by explicitly calling this function
    try {
        console.log(`📥 Creating download link for document ${docId}...`);

        // Create download link to server endpoint
        const link = document.createElement('a');
        const downloadUrl = `/api/download-document?docId=${docId}`;
        console.log(`📥 Download URL: ${downloadUrl}`);

        link.href = downloadUrl;
        link.target = '_blank'; // Open in new tab for better UX
        link.click();

        console.log(`📥 Download link clicked successfully`);
        showNotification('Download started', 'info');
    } catch (error) {
        console.error('📥 Download error:', error);
        showNotification('Download failed', 'error');
    }
};

window.deleteClientDocument = async function(clientId, docId) {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
        return;
    }

    try {
        console.log(`🗑️ Deleting document ${docId}...`);

        const response = await fetch(`/api/documents/${docId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        showNotification('Document deleted successfully', 'success');

        // Refresh documents display
        loadClientDocuments(clientId);

    } catch (error) {
        console.error('🗑️ Delete error:', error);
        showNotification('Error deleting document', 'error');
    }
};

function getFileIcon(fileType) {
    const type = (fileType || '').toLowerCase();

    if (type.includes('pdf')) {
        return { icon: 'fas fa-file-pdf', color: '#dc2626' };
    } else if (type.includes('word') || type.includes('doc')) {
        return { icon: 'fas fa-file-word', color: '#2563eb' };
    } else if (type.includes('excel') || type.includes('sheet')) {
        return { icon: 'fas fa-file-excel', color: '#059669' };
    } else if (type.includes('image') || type.includes('jpg') || type.includes('jpeg') || type.includes('png')) {
        return { icon: 'fas fa-file-image', color: '#7c3aed' };
    } else if (type.includes('text')) {
        return { icon: 'fas fa-file-alt', color: '#6b7280' };
    } else {
        return { icon: 'fas fa-file', color: '#6b7280' };
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Function to toggle policy status in policy cards
window.togglePolicyStatus = function(policyId, isActive) {
    console.log('🔄 [HTTPS VERSION] Toggling policy status for policy:', policyId, 'Active:', isActive);

    const newStatus = isActive ? 'Active' : 'Inactive';

    // Update the visual feedback of the toggle
    const toggle = document.getElementById(`policyActiveToggle-${policyId}`);
    if (toggle) {
        const slider = toggle.nextElementSibling;
        const knob = slider.querySelector('span:last-child');

        // Update colors and position
        slider.style.backgroundColor = isActive ? '#10b981' : '#cbd5e0';
        knob.style.left = isActive ? '22px' : '2px';

        // Update the status badge text and color
        const statusBadge = slider.parentElement.nextElementSibling;
        if (statusBadge) {
            statusBadge.textContent = `Client Portal ${newStatus}`;
            // Update badge background color based on status
            statusBadge.style.background = isActive
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)';
        }
    }

    // Find and update the policy in localStorage
    try {
        const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        const policyIndex = policies.findIndex(p => p.id === policyId || p.policyNumber === policyId);

        if (policyIndex !== -1) {
            policies[policyIndex].status = newStatus;
            policies[policyIndex].policyStatus = newStatus;
            localStorage.setItem('insurance_policies', JSON.stringify(policies));
            console.log('✅ Policy status updated in localStorage:', newStatus);
        }

        // Also update in window.allPolicies if it exists
        if (window.allPolicies && Array.isArray(window.allPolicies)) {
            const windowPolicyIndex = window.allPolicies.findIndex(p => p.id === policyId || p.policyNumber === policyId);
            if (windowPolicyIndex !== -1) {
                window.allPolicies[windowPolicyIndex].status = newStatus;
                window.allPolicies[windowPolicyIndex].policyStatus = newStatus;
                console.log('✅ Policy status updated in window.allPolicies:', newStatus);
            }
        }

        // Update database via API
        const timestamp = new Date().getTime();
        const apiUrl = `https://162-220-14-239.nip.io/api/policies?t=${timestamp}`;
        console.log('🌐 Making API request to:', apiUrl);
        fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: policyId,
                status: newStatus,
                policyStatus: newStatus
            })
        }).then(response => {
            console.log('🔄 Server response status:', response.status);
            return response.json();
        }).then(data => {
            console.log('✅ Server response data:', data);
            if (data.success) {
                console.log('✅ Policy status updated in database:', newStatus);
                if (window.showNotification) {
                    window.showNotification(`Policy status updated to ${newStatus}`, 'success');
                }

                // Force refresh the UI to reflect the new status
                console.log('🔄 Force refreshing UI to reflect new status...');
                setTimeout(() => {
                    if (window.currentViewingClientId && window.viewClientOriginal) {
                        window.viewClientOriginal(window.currentViewingClientId);
                    } else {
                        location.reload();
                    }
                }, 500);

            } else {
                console.warn('⚠️ Failed to update status in database:', data.message);
                if (window.showNotification) {
                    window.showNotification('Status updated locally only', 'warning');
                }
            }
        }).catch(error => {
            console.error('❌ Error updating status:', error);
            if (window.showNotification) {
                window.showNotification('Status updated locally only', 'warning');
            }
        });

    } catch (error) {
        console.error('❌ Error updating policy status:', error);
        if (window.showNotification) {
            window.showNotification('Error updating policy status', 'error');
        }
    }
};

// Function to toggle client portal access
window.toggleClientPortalAccess = function(clientId, isEnabled) {
    console.log('🔄 Toggling client portal access for client:', clientId, 'Enabled:', isEnabled);

    // Update the visual feedback of the toggle
    const toggle = document.getElementById(`clientPortalToggle-${clientId}`);
    if (toggle) {
        const slider = toggle.nextElementSibling;
        const knob = slider.querySelector('span:last-child');

        // Update colors and position
        slider.style.backgroundColor = isEnabled ? '#10b981' : '#cbd5e0';
        knob.style.left = isEnabled ? '24px' : '2px';
    }

    // Find and update the client in localStorage
    try {
        const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
        const clientIndex = clients.findIndex(c => c.id === clientId);

        if (clientIndex !== -1) {
            clients[clientIndex].portalAccess = isEnabled;
            localStorage.setItem('insurance_clients', JSON.stringify(clients));
            console.log('✅ Client portal access updated in localStorage:', isEnabled);
        }

        // Update database via API
        fetch('/api/clients', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: clientId,
                portalAccess: isEnabled
            })
        }).then(response => {
            if (response.ok) {
                console.log('✅ Client portal access updated in database:', isEnabled);
                if (window.showNotification) {
                    window.showNotification(`Client portal access ${isEnabled ? 'enabled' : 'disabled'}`, 'success');
                }
            } else {
                console.warn('⚠️ Failed to update portal access in database');
                if (window.showNotification) {
                    window.showNotification('Portal access updated locally only', 'warning');
                }
            }
        }).catch(error => {
            console.error('❌ Error updating portal access:', error);
            if (window.showNotification) {
                window.showNotification('Portal access updated locally only', 'warning');
            }
        });

    } catch (error) {
        console.error('❌ Error updating client portal access:', error);
        if (window.showNotification) {
            window.showNotification('Error updating portal access', 'error');
        }
    }
};

// Function to edit client portal email
window.editClientPortalEmail = function(clientId, currentEmail) {
    console.log('📧 Editing client portal email for client:', clientId);

    const newEmail = prompt('Enter new portal email:', currentEmail || '');
    if (newEmail === null) return; // User cancelled

    if (newEmail && !newEmail.includes('@')) {
        alert('Please enter a valid email address');
        return;
    }

    try {
        // Update localStorage
        const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
        const clientIndex = clients.findIndex(c => String(c.id) === String(clientId));

        if (clientIndex !== -1) {
            clients[clientIndex].email = newEmail;
            // Sync: if no business email, copy portal email there
            if (newEmail && !clients[clientIndex].businessEmail) {
                clients[clientIndex].businessEmail = newEmail;
            }
            localStorage.setItem('insurance_clients', JSON.stringify(clients));
            console.log('✅ Client email updated in localStorage:', newEmail);
        }

        // Also update the Business Email input if it's on the page and empty
        const bizEmailInput = document.getElementById('biz-email');
        if (bizEmailInput && !bizEmailInput.value && newEmail) {
            bizEmailInput.value = newEmail;
        }

        // Update database via API — send full client object to avoid data loss
        const payload = clientIndex !== -1 ? clients[clientIndex] : { id: clientId, email: newEmail };
        fetch('/api/clients', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        }).then(response => {
            if (response.ok) {
                console.log('✅ Client email updated in database:', newEmail);
                if (window.showNotification) {
                    window.showNotification('Portal email updated successfully', 'success');
                }
                // Refresh the client profile to show new email
                window.viewClient(clientId);
            } else {
                console.warn('⚠️ Failed to update email in database');
                if (window.showNotification) {
                    window.showNotification('Email updated locally only', 'warning');
                }
            }
        }).catch(error => {
            console.error('❌ Error updating email:', error);
            if (window.showNotification) {
                window.showNotification('Email updated locally only', 'warning');
            }
        });

    } catch (error) {
        console.error('❌ Error updating client email:', error);
        if (window.showNotification) {
            window.showNotification('Error updating email', 'error');
        }
    }
};

// Function to create client portal password
window.createClientPortalPassword = function(clientId) {
    window.changeClientPortalPassword(clientId);
};

// Function to change client portal password
window.changeClientPortalPassword = function(clientId) {
    console.log('🔄 Changing client portal password for client:', clientId);

    const newPassword = prompt('Enter new portal password (minimum 8 characters):');
    if (newPassword === null) return; // User cancelled

    if (!newPassword || newPassword.length < 8) {
        alert('Password must be at least 8 characters long');
        return;
    }

    // Get client email — try API first, fall back to localStorage
    function getClientEmail() {
        return fetch('/api/clients/' + clientId)
            .then(r => r.ok ? r.json() : null)
            .catch(() => null)
            .then(client => {
                if (client && (client.email || client.clientEmail)) return client.email || client.clientEmail;
                const locals = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
                const local = locals.find(c => c.id === clientId);
                return local ? (local.email || local.clientEmail || '') : '';
            });
    }

    getClientEmail().then(email => {
        if (!email) {
            if (window.showNotification) window.showNotification('Could not find client email', 'error');
            return;
        }

        return fetch('/api/portal/crm/set-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: clientId, email: email, password: newPassword })
        }).then(res => res.json().then(data => ({ ok: res.ok, data })));
    }).then(result => {
        if (!result) return;
        if (result.ok) {
            // Update localStorage to reflect new password
            try {
                const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
                const idx = clients.findIndex(c => c.id === clientId);
                if (idx !== -1) { clients[idx].portalPassword = newPassword; localStorage.setItem('insurance_clients', JSON.stringify(clients)); }
            } catch (e) { /* ignore */ }
            console.log('✅ Portal password updated');
            if (window.showNotification) window.showNotification('Portal password changed successfully!', 'success');
            window.viewClient(clientId);
        } else {
            console.warn('⚠️ Failed:', result.data);
            if (window.showNotification) window.showNotification(result.data.error || 'Failed to change password', 'error');
        }
    }).catch(error => {
        console.error('❌ Error changing password:', error);
        if (window.showNotification) window.showNotification('Error changing password', 'error');
    });
};

// Function to toggle password visibility
window.togglePasswordVisibility = function(clientId, password, buttonElement) {
    const displayElement = document.getElementById(`password-display-${clientId}`);
    const icon = buttonElement.querySelector('i');

    if (!displayElement || !icon) return;

    const isHidden = displayElement.textContent === '●●●●●●●●';

    if (isHidden) {
        // Show password
        displayElement.textContent = password;
        displayElement.style.letterSpacing = '1px';
        icon.className = 'fas fa-eye-slash';
        buttonElement.title = 'Hide Password';
        buttonElement.style.background = '#fee2e2';
        buttonElement.style.color = '#dc2626';
        buttonElement.style.borderColor = '#fecaca';
    } else {
        // Hide password
        displayElement.textContent = '●●●●●●●●';
        displayElement.style.letterSpacing = '2px';
        icon.className = 'fas fa-eye';
        buttonElement.title = 'Show Password';
        buttonElement.style.background = '#f3f4f6';
        buttonElement.style.color = '#374151';
        buttonElement.style.borderColor = '#d1d5db';
    }
};

// Show expired policies history popup
window._showExpiredPolicies = function() {
    const policies = window._clientExpiredPolicies || [];
    if (!policies.length) { _showInlineToast('No expired policies found', 'info'); return; }

    const formatDate = d => {
        if (!d) return 'N/A';
        const s = String(d);
        if (s.match(/^\d{4}-\d{2}-\d{2}/)) { const p = s.split('-'); return `${p[1]}/${p[2].substring(0,2)}/${p[0]}`; }
        return s;
    };

    const rows = policies.map(p => {
        const prem = p.financial?.['Annual Premium'] || p.financial?.['Premium'] || p.premium || '';
        const fmtPrem = prem ? '$' + String(prem).replace(/[^0-9.]/g, '').replace(/(\d)(?=(\d{3})+\.)/g,'$1,') + '/yr' : 'N/A';
        return `<tr style="border-bottom:1px solid #f3f4f6;">
            <td style="padding:10px 12px;font-weight:600;color:#1f2937;font-size:13px;">${p.policyNumber || p.id || '—'}</td>
            <td style="padding:10px 8px;font-size:13px;color:#374151;">${p.carrier || 'N/A'}</td>
            <td style="padding:10px 8px;font-size:13px;color:#374151;">${p.policyType || p.type || 'N/A'}</td>
            <td style="padding:10px 8px;font-size:13px;color:#374151;">${formatDate(p.effectiveDate)}</td>
            <td style="padding:10px 8px;font-size:13px;color:#dc2626;font-weight:500;">${formatDate(p.expirationDate)}</td>
            <td style="padding:10px 8px;font-size:13px;color:#059669;font-weight:600;">${fmtPrem}</td>
            <td style="padding:10px 8px;"><button onclick="document.getElementById('expired-policies-overlay').remove();viewPolicy('${p.id}')" style="background:#3b82f6;color:white;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:12px;"><i class="fas fa-eye"></i></button></td>
        </tr>`;
    }).join('');

    const overlay = document.createElement('div');
    overlay.id = 'expired-policies-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = `
        <div style="background:white;border-radius:16px;padding:32px;max-width:820px;width:95%;max-height:80vh;overflow-y:auto;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="width:40px;height:40px;background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;"><i class="fas fa-history" style="font-size:18px;"></i></div>
                    <div>
                        <h2 style="margin:0;font-size:20px;font-weight:700;color:#1f2937;">Policy History</h2>
                        <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">${policies.length} expired ${policies.length === 1 ? 'policy' : 'policies'}</p>
                    </div>
                </div>
                <button onclick="document.getElementById('expired-policies-overlay').remove()" style="background:none;border:none;font-size:22px;cursor:pointer;color:#9ca3af;line-height:1;">&times;</button>
            </div>
            <table style="width:100%;border-collapse:collapse;">
                <thead>
                    <tr style="background:#f9fafb;border-bottom:2px solid #e5e7eb;">
                        <th style="padding:8px 12px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;">Policy #</th>
                        <th style="padding:8px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;">Carrier</th>
                        <th style="padding:8px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;">Type</th>
                        <th style="padding:8px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;">Effective</th>
                        <th style="padding:8px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;">Expired</th>
                        <th style="padding:8px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;">Premium</th>
                        <th style="padding:8px;width:50px;"></th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
};

// Inline toast that always shows (bypasses disable-popups.js)
function _showInlineToast(msg, type) {
    const bg = type === 'success' ? '#059669' : type === 'error' ? '#dc2626' : type === 'warning' ? '#d97706' : '#1e40af';
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle';
    const t = document.createElement('div');
    t.style.cssText = `position:fixed;top:80px;right:24px;background:${bg};color:white;padding:14px 22px;border-radius:10px;font-size:14px;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,0.25);display:flex;align-items:center;gap:10px;max-width:420px;`;
    t.innerHTML = `<i class="fas fa-${icon}"></i> ${msg}`;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; setTimeout(() => t.remove(), 300); }, 4000);
}

// Override the current viewClient function with the original simple design
window.viewClient = window.viewClientOriginal;

// Sync Policies — find unlinked policies that match this client and let user attach them
window.syncPoliciesForClient = async function(clientId) {
    // Get client info
    let client;
    try {
        const r = await fetch('/api/clients');
        const d = await r.json();
        const clients = Array.isArray(d) ? d : (d.clients || []);
        client = clients.find(c => String(c.id) === String(clientId));
    } catch(e) {}
    if (!client) { showNotification('Client not found', 'error'); return; }

    // Fetch fresh policies with high limit to ensure we find all matches
    let allPolicies = [];
    try {
        const polRes = await fetch('/api/policies?includeInactive=true&limit=500');
        if (polRes.ok) allPolicies = await polRes.json();
    } catch(e) {}
    if (!allPolicies.length) allPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');

    // Stop words that are too common to count as meaningful matches
    const STOP_WORDS = new Set(['llc','inc','ltd','co','corp','lp','the','and','of','transport',
        'trucking','transportation','logistics','hauling','services','enterprises','solutions',
        'construction','group','global','management','systems','company','associates']);

    function normalize(s) {
        return (s || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
    }
    function meaningfulTokens(s) {
        return normalize(s).split(/\s+/).filter(t => t.length > 1 && !STOP_WORDS.has(t));
    }

    const clientNameTokens = meaningfulTokens(client.name || '');
    const clientBizTokens  = meaningfulTokens(client.businessName || '');
    const clientBizNorm    = normalize(client.businessName || '');
    const clientNameNorm   = normalize(client.name || '');

    function nameScore(policyName) {
        if (!policyName) return 0;
        const pNorm   = normalize(policyName);
        // Exact business name match → highest score
        if (clientBizNorm && pNorm === clientBizNorm) return 10;
        if (clientNameNorm && pNorm === clientNameNorm) return 10;
        const pTokens = meaningfulTokens(policyName);
        if (pTokens.length === 0) return 0;
        let matches = 0;
        for (const t of clientNameTokens) if (pTokens.includes(t)) matches++;
        for (const t of clientBizTokens)  if (pTokens.includes(t)) matches++;
        return matches;
    }

    // Also match by email, phone, and business-name containment
    const _syncNormPhone = ph => (ph || '').replace(/\D/g, '');
    const clientEmail = (client.email || '').toLowerCase().trim();
    const clientPhone = _syncNormPhone(client.phone);
    const clientBizStripped = (client.businessName || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    // Find policies NOT already linked to this client but likely belonging to them
    const unlinked = allPolicies.filter(p => {
        if (p.clientId && String(p.clientId) === String(clientId)) return false; // already linked

        // Gather all name candidates from the policy
        const polNameCandidates = [
            p.insuredName, p.clientName, p.contact?.['Owner Name'],
            p.insured?.['Name/Business Name'], p.insured?.['Primary Named Insured'],
            p.insured?.['Business Name'], p.contact?.['Business Name']
        ].filter(Boolean);

        // Name token score check (original logic)
        for (const pName of polNameCandidates) {
            if (nameScore(pName) >= 2) return true;
        }

        // Business name containment check
        if (clientBizStripped && clientBizStripped.length >= 4) {
            for (const pName of polNameCandidates) {
                const pStripped = (pName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                if (pStripped && (pStripped.includes(clientBizStripped) || clientBizStripped.includes(pStripped))) return true;
            }
        }

        // Email match
        const polEmail = (p.contact?.['Email'] || p.contact?.['email'] || p.insured?.['Email'] || '').toLowerCase().trim();
        if (clientEmail && polEmail && clientEmail === polEmail) return true;

        // Phone match
        const polPhone = _syncNormPhone(p.contact?.['Phone'] || p.contact?.['phone'] || p.insured?.['Phone'] || '');
        if (clientPhone && clientPhone.length >= 10 && polPhone.length >= 10 && clientPhone === polPhone) return true;

        return false;
    });

    if (unlinked.length === 0) {
        _showInlineToast('No unlinked policies found — all policies are already linked or no matches found.', 'info');
        return;
    }

    // Build modal
    const overlay = document.createElement('div');
    overlay.id = 'sync-policies-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';

    const rows = unlinked.map(p => {
        const pName = p.insuredName || p.clientName || p.contact?.['Owner Name'] ||
                      p.insured?.['Name/Business Name'] || p.insured?.['Primary Named Insured'] || '—';
        const polNo  = p.policyNumber || p.id || '—';
        const type   = p.policyType || p.type || '—';
        const eff    = p.effectiveDate || p.overview?.['Effective Date'] || '—';
        const exp    = p.expirationDate || p.overview?.['Expiration Date'] || '—';
        const prem   = p.premium || p.financial?.['Annual Premium'] || p.financial?.premium || '—';
        const score  = nameScore(pName);
        const conf   = score >= 10 ? '🟢 Exact' : score >= 3 ? '🟢 High' : '🟡 Medium';
        return `
            <tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:10px 8px;"><input type="checkbox" class="sync-pol-cb" data-id="${p.id || ''}" data-polno="${polNo}" ${score >= 3 ? 'checked' : ''}></td>
                <td style="padding:10px 8px;font-size:13px;font-weight:600;color:#1f2937;">${polNo}</td>
                <td style="padding:10px 8px;font-size:13px;color:#374151;">${pName}</td>
                <td style="padding:10px 8px;font-size:13px;color:#374151;">${type}</td>
                <td style="padding:10px 8px;font-size:13px;color:#6b7280;">${eff} → ${exp}</td>
                <td style="padding:10px 8px;font-size:13px;color:#059669;font-weight:600;">${prem ? '$'+String(prem).replace(/[^0-9.]/g,'') : '—'}</td>
                <td style="padding:10px 8px;font-size:12px;">${conf}</td>
            </tr>`;
    }).join('');

    overlay.innerHTML = `
        <div style="background:white;border-radius:16px;padding:32px;max-width:860px;width:95%;max-height:80vh;overflow-y:auto;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
                <div>
                    <h2 style="margin:0;font-size:20px;font-weight:700;color:#1f2937;"><i class="fas fa-sync-alt" style="color:#10b981;margin-right:10px;"></i>Sync Policies</h2>
                    <p style="margin:6px 0 0;font-size:14px;color:#6b7280;">Found ${unlinked.length} unlinked ${unlinked.length === 1 ? 'policy' : 'policies'} matching <strong>${client.name || client.businessName}</strong>. Select the ones to link.</p>
                </div>
                <button onclick="document.getElementById('sync-policies-overlay').remove()" style="background:none;border:none;font-size:22px;cursor:pointer;color:#9ca3af;line-height:1;">&times;</button>
            </div>
            <table style="width:100%;border-collapse:collapse;">
                <thead>
                    <tr style="background:#f9fafb;border-bottom:2px solid #e5e7eb;">
                        <th style="padding:8px;width:36px;"><input type="checkbox" id="sync-pol-all" onchange="document.querySelectorAll('.sync-pol-cb').forEach(cb=>cb.checked=this.checked)" checked></th>
                        <th style="padding:8px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;">POLICY #</th>
                        <th style="padding:8px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;">INSURED NAME</th>
                        <th style="padding:8px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;">TYPE</th>
                        <th style="padding:8px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;">DATES</th>
                        <th style="padding:8px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;">PREMIUM</th>
                        <th style="padding:8px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;">MATCH</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
            <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:24px;padding-top:20px;border-top:1px solid #e5e7eb;">
                <button onclick="document.getElementById('sync-policies-overlay').remove()" style="padding:10px 20px;background:#f3f4f6;color:#374151;border:1px solid #d1d5db;border-radius:8px;cursor:pointer;font-size:14px;">Cancel</button>
                <button onclick="window._confirmSyncPolicies('${clientId}')" style="padding:10px 20px;background:#10b981;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;"><i class="fas fa-link"></i> Link Selected Policies</button>
            </div>
        </div>`;

    document.body.appendChild(overlay);
};

window._confirmSyncPolicies = async function(clientId) {
    const checked = [...document.querySelectorAll('.sync-pol-cb:checked')];
    if (checked.length === 0) { _showInlineToast('No policies selected', 'warning'); return; }

    const allPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    let linked = 0;

    for (const cb of checked) {
        const pid = cb.dataset.id;
        const idx = allPolicies.findIndex(p => String(p.id) === String(pid));
        if (idx === -1) continue;
        allPolicies[idx].clientId = clientId;
        // Persist to server
        try {
            await fetch(`/api/policies/${pid}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(allPolicies[idx])
            });
        } catch(e) { console.warn('Could not sync policy to server:', e); }
        linked++;
    }

    localStorage.setItem('insurance_policies', JSON.stringify(allPolicies));
    document.getElementById('sync-policies-overlay')?.remove();
    _showInlineToast(`Linked ${linked} ${linked === 1 ? 'policy' : 'policies'} to client`, 'success');

    // Reload the profile to reflect changes
    if (typeof window.viewClientOriginal === 'function') window.viewClientOriginal(clientId);
};

window.saveClientBusiness = async function(clientId) {
    const g = id => (document.getElementById('biz-' + id) || {}).value || '';
    const bizEmail = g('email');
    const updates = {
        company: g('name'), businessName: g('name'), dba: g('dba'),
        businessType: g('type'), fein: g('fein'),
        website: g('website'), businessEmail: bizEmail,
        glCode: g('glCode'), sicCode: g('sicCode'), naicsCode: g('naicsCode'),
    };
    // Update localStorage
    const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    const idx = clients.findIndex(c => String(c.id) === String(clientId));
    if (idx !== -1) {
        Object.assign(clients[idx], updates);
        // Sync: if business email set and no portal email, copy it over
        if (bizEmail && !clients[idx].email) {
            clients[idx].email = bizEmail;
        }
        localStorage.setItem('insurance_clients', JSON.stringify(clients));
    }
    // Update Portal Email display on the page if it currently shows "No email set"
    if (bizEmail) {
        document.querySelectorAll('label').forEach(lbl => {
            if (lbl.textContent.trim().toLowerCase() === 'portal email') {
                const pEl = lbl.parentElement?.querySelector('p');
                if (pEl && pEl.textContent.trim() === 'No email set') {
                    pEl.textContent = bizEmail;
                }
                // Also update the edit button's onclick to pass the new email
                const container = lbl.closest('[style*="padding: 16px"]') || lbl.closest('[style*="padding:16px"]');
                const editBtn = container?.querySelector('button[onclick*="editClientPortalEmail"]');
                if (editBtn) {
                    editBtn.setAttribute('onclick', `window.editClientPortalEmail('${clientId}', '${bizEmail.replace(/'/g, "\\'")}')`);
                }
            }
        });
    }
    // Sync to server
    try {
        const API = window.VANGUARD_API_URL || 'http://162-220-14-239.nip.io:3001';
        const jwt = sessionStorage.getItem('vanguard_jwt') || '';
        const payload = idx !== -1 ? clients[idx] : { id: clientId, ...updates };
        const r = await fetch(`${API}/api/clients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}`, 'Bypass-Tunnel-Reminder': 'true' },
            body: JSON.stringify(payload)
        });
        if (typeof showNotification === 'function') showNotification(r.ok ? 'Business info saved' : 'Saved locally (server error)', r.ok ? 'success' : 'warning');
    } catch(e) {
        if (typeof showNotification === 'function') showNotification('Saved locally (offline)', 'warning');
    }
};

window.viewClientNote = function(clientId, idx) {
    const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    const client = clients.find(c => String(c.id) === String(clientId));
    if (!client || !Array.isArray(client.notesLog)) return;
    const note = client.notesLog[idx];
    if (!note) return;
    const text = typeof note === 'string' ? note : (note.text || note.content || '');
    const date = note.date ? new Date(note.date).toLocaleString() : '';
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;';
    modal.innerHTML = `<div style="background:#fff;border-radius:12px;width:100%;max-width:560px;box-shadow:0 20px 60px rgba(0,0,0,0.25);">
        <div style="background:#3c8dbc;border-radius:12px 12px 0 0;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;">
            <span style="color:white;font-weight:600;"><i class="fas fa-sticky-note" style="margin-right:7px;"></i>Note</span>
            <button onclick="this.closest('[style*=fixed]').remove()" style="background:rgba(255,255,255,0.2);border:none;color:white;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:15px;">&times;</button>
        </div>
        <div style="padding:20px;">
            <p style="margin:0 0 12px;font-size:13px;color:#6b7280;">${date}</p>
            <p style="margin:0;font-size:14px;color:#111827;line-height:1.6;white-space:pre-wrap;">${text}</p>
        </div>
    </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
};

console.log('Original client profile design restored');