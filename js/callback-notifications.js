// Callback Notifications — exact-timer system with Web Notifications API
(function () {
    'use strict';

    console.log('🔔 Loading Callback Notification System (exact-timer v2)...');

    // ── State ──────────────────────────────────────────────────────────────────
    let callbackNotifications = JSON.parse(localStorage.getItem('callbackNotifications') || '[]');

    // Map of alarmKey → timeoutId  (value -1 = handled, no active timeout)
    const scheduledAlarms = new Map();

    // Same map for todo reminders
    const scheduledTodoAlarms = new Map();

    // Email keys sent this session (prevent duplicates)
    const sentEmailKeys = new Set();

    // ── Browser Notification permission ───────────────────────────────────────
    function requestBrowserPermission() {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(p =>
                console.log('🔔 Browser notification permission:', p)
            );
        }
    }

    function fireBrowserNotification(title, body, leadId) {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        try {
            const n = new Notification(title, {
                body,
                icon: '/favicon.ico',
                tag: `cb_${leadId}`,
                requireInteraction: true
            });
            n.onclick = () => {
                window.focus();
                if (typeof viewLead === 'function') viewLead(leadId);
                n.close();
            };
        } catch (e) { console.warn('Browser notification error:', e); }
    }

    // ── Lead lookup helper ─────────────────────────────────────────────────────
    // Called at FIRE time so we always have current localStorage data
    function getLeadData(leadId) {
        try {
            const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            const lead  = leads.find(l => String(l.id) === String(leadId));
            if (lead) return lead;
        } catch (e) { /* ignore */ }
        // Fallback minimal object so the alarm still fires
        return { id: leadId, name: `Lead #${leadId}`, phone: '', assignedTo: '' };
    }

    // ── Core scheduler ─────────────────────────────────────────────────────────
    // NOTE: We do NOT require lead data here — look it up only at fire time.
    // This prevents the case where insurance_leads hasn't loaded yet from
    // silently dropping all alarms.
    function scheduleAlarms() {
        let callbacks;
        try {
            callbacks = JSON.parse(localStorage.getItem('scheduled_callbacks') || '{}');
        } catch (e) {
            console.error('🔔 Error reading scheduled_callbacks:', e);
            return;
        }

        const now = Date.now();
        let scheduled = 0;

        Object.keys(callbacks).forEach(leadId => {
            (callbacks[leadId] || []).forEach(cb => {
                if (cb.completed) return;

                const cbId  = String(cb.id || cb.dateTime || Date.now());
                const cbTs  = new Date(cb.dateTime).getTime();
                if (isNaN(cbTs)) {
                    console.warn('🔔 Invalid dateTime for callback:', cb);
                    return;
                }
                const msOut = cbTs - now;

                // ── 30-minute warning ─────────────────────────────────────
                const warn30Key    = `${leadId}_${cbId}_30min`;
                const msUntilWarn  = msOut - 30 * 60 * 1000;

                if (!scheduledAlarms.has(warn30Key)) {
                    if (msUntilWarn > 0) {
                        // Fires in the future
                        const tid = setTimeout(() => {
                            fireAlarm(leadId, cb, '30min');
                            scheduledAlarms.delete(warn30Key);
                        }, msUntilWarn);
                        scheduledAlarms.set(warn30Key, tid);
                        console.log(`⏰ 30-min alarm set for lead ${leadId} in ${Math.round(msUntilWarn/60000)}m`);
                        scheduled++;
                    } else if (msUntilWarn > -30 * 60 * 1000 && msOut > 0) {
                        // Missed 30-min window by < 30 min but call not yet due — warn now
                        scheduledAlarms.set(warn30Key, -1);
                        setTimeout(() => fireAlarm(leadId, cb, '30min'), 0);
                    } else {
                        scheduledAlarms.set(warn30Key, -1); // too late for warning
                    }
                } else {
                    // Key exists — check if a live timer was throttled and is now overdue
                    const tid = scheduledAlarms.get(warn30Key);
                    if (tid !== -1 && msUntilWarn <= 0 && msUntilWarn > -30 * 60 * 1000 && msOut > 0) {
                        clearTimeout(tid);
                        scheduledAlarms.set(warn30Key, -1);
                        console.log(`⏰ 30-min alarm was throttled, firing now for lead ${leadId}`);
                        setTimeout(() => fireAlarm(leadId, cb, '30min'), 0);
                    }
                }

                // ── Due-now alarm ─────────────────────────────────────────
                const dueKey = `${leadId}_${cbId}_due`;

                // Grace window: 2 hours.  Catches callbacks missed while the
                // browser was throttled / the user was away from the computer.
                const GRACE_MS = 2 * 60 * 60 * 1000;

                if (!scheduledAlarms.has(dueKey)) {
                    if (msOut > 0) {
                        // Fires at exact moment
                        const tid = setTimeout(() => {
                            fireAlarm(leadId, cb, 'due');
                            scheduledAlarms.delete(dueKey);
                        }, msOut);
                        scheduledAlarms.set(dueKey, tid);
                        console.log(`⏰ Due-now alarm set for lead ${leadId} in ${Math.round(msOut/1000)}s`);
                        scheduled++;
                    } else if (msOut >= -GRACE_MS) {
                        // Overdue within grace window — fire now (page refresh / timer throttled)
                        scheduledAlarms.set(dueKey, -1);
                        setTimeout(() => fireAlarm(leadId, cb, 'due'), 0);
                    } else {
                        scheduledAlarms.set(dueKey, -1); // too old, skip
                    }
                } else {
                    // Key exists — check if a live timer was throttled and is now overdue
                    const tid = scheduledAlarms.get(dueKey);
                    if (tid !== -1 && msOut <= 0 && msOut >= -GRACE_MS) {
                        clearTimeout(tid);
                        scheduledAlarms.set(dueKey, -1);
                        console.log(`⏰ Due-now alarm was throttled, firing now for lead ${leadId}`);
                        setTimeout(() => fireAlarm(leadId, cb, 'due'), 0);
                    }
                }
            });
        });

        if (scheduled > 0) console.log(`🔔 Scheduled ${scheduled} alarm(s)`);
    }

    // ── Fire an alarm ──────────────────────────────────────────────────────────
    function fireAlarm(leadId, cb, type) {
        const isUrgent  = type === 'due';
        const lead      = getLeadData(leadId);   // look up NOW, not at schedule time
        const cbTime    = new Date(cb.dateTime);
        const fmtTime   = cbTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        const notifId   = `cb_${leadId}_${cb.id || cb.dateTime}_${type}`;

        // Session dedup: if we already fired this alarm this session, skip popup/sound
        // but still update badge
        if (callbackNotifications.find(n => n.id === notifId)) {
            console.log(`🔔 Alarm already fired this session: ${notifId}`);
            return;
        }

        const title   = isUrgent ? 'CALL DUE NOW!'              : 'Call Due in 30 Minutes';
        const message = isUrgent ? `URGENT: Call now with ${lead.name}` : `Scheduled call with ${lead.name}`;

        const notification = {
            id: notifId,
            type: isUrgent ? 'callback_due' : 'callback_reminder',
            title,
            message,
            leadId: String(leadId),
            leadName: lead.name,
            leadPhone: lead.phone,
            assignedAgent: lead.assignedTo || 'Unassigned',
            callbackTime: cb.dateTime,
            callbackTimeFormatted: fmtTime,
            callbackNotes: cb.notes,
            createdAt: new Date().toISOString(),
            read: false,
            actionable: true,
            urgent: isUrgent,
            dismissedBy: {}
        };

        callbackNotifications.push(notification);
        saveNotifications();
        updateNotificationDisplay();
        updateNotificationBadge();

        // ── User filter: only show popup/sound if this callback belongs to current user ──
        const _sess = JSON.parse(sessionStorage.getItem('vanguard_user') || '{}');
        const _curUsr = (_sess.username || '').toLowerCase();
        const _isGrant = _curUsr === 'grant';
        const _showAll = _isGrant && isGrantAllUsersOn();
        const _agent = (lead.assignedTo || '').toLowerCase();

        // Determine if this user should get the popup
        let _shouldPopup = true;
        if (_isGrant && !_showAll) {
            // Grant with "My Leads" toggle: only popup for Grant's leads (or unassigned)
            _shouldPopup = !_agent || _agent === _curUsr;
        } else if (!_isGrant && _curUsr) {
            // Non-admin users: only popup for their own leads (or unassigned)
            _shouldPopup = !_agent || _agent === _curUsr;
        }

        if (_shouldPopup) {
            showPopupNotification(notification);
            fireBrowserNotification(title, `${lead.name} · ${fmtTime}`, leadId);
            playNotificationSound(notification);
        } else {
            console.log(`🔔 Popup suppressed for ${lead.name} (assigned to "${lead.assignedTo}", current user "${_curUsr}")`);
        }

        if (!isUrgent) sendEmailReminder(notification);

        console.log(`🔔 Alarm FIRED [${type}] for ${lead.name} at ${fmtTime}${_shouldPopup ? '' : ' (no popup)'}`);
    }

    // ── Popup ──────────────────────────────────────────────────────────────────
    function showPopupNotification(notification) {
        try {
            const existing = document.querySelector('.callback-popup-notification');
            if (existing) existing.remove();

            const popup = document.createElement('div');
            popup.className = 'callback-popup-notification';
            popup.innerHTML = `
                <div class="popup-content ${notification.urgent ? 'urgent' : ''}">
                    <div class="popup-icon">
                        <i class="fas fa-phone" style="color:${notification.urgent ? '#dc2626' : '#059669'};"></i>
                    </div>
                    <div class="popup-text">
                        <div class="popup-title">${notification.title}</div>
                        <div class="popup-message">${notification.message}</div>
                        <div class="popup-time">${notification.callbackTimeFormatted}</div>
                    </div>
                    <div class="popup-actions">
                        <button class="popup-call-btn" onclick="CallbackNotifications.handleCallNow('${notification.leadId}','${notification.leadPhone || ''}')">
                            <i class="fas fa-phone"></i> CALL
                        </button>
                        <button class="popup-dismiss-btn" onclick="CallbackNotifications.dismissPopup()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>`;

            document.body.insertBefore(popup, document.body.firstChild);

            const delay = notification.urgent ? 30000 : 15000;
            setTimeout(() => {
                const p = document.querySelector('.callback-popup-notification');
                if (p) { p.style.transform = 'translateY(-100%)'; setTimeout(() => p.remove(), 300); }
            }, delay);

            console.log(`🔔 Popup shown for ${notification.leadName}`);
        } catch (e) {
            console.error('Error showing popup:', e);
        }
    }

    // ── Sound ──────────────────────────────────────────────────────────────────
    function playNotificationSound(notification) {
        try {
            let audio = document.querySelector('#callback-notification-audio');
            if (!audio) {
                audio = document.createElement('audio');
                audio.id = 'callback-notification-audio';
                audio.preload = 'auto';
                document.body.appendChild(audio);
            }
            audio.src = 'https://github.com/Corptech02/LLCinfo/blob/main/strong-minded-ringtone.ogg?raw=true';

            if (notification.urgent) {
                let count = 0;
                const next = () => { audio.play().catch(() => {}); if (++count < 3) setTimeout(next, 1500); };
                next();
            } else {
                audio.play().catch(() => {});
            }
        } catch (e) { /* autoplay policy — silent fail */ }
    }

    // ── Email ──────────────────────────────────────────────────────────────────
    function sendEmailReminder(notification) {
        const emailKey = `email_${notification.leadId}_${notification.callbackTime}`;
        if (sentEmailKeys.has(emailKey)) return;
        sentEmailKeys.add(emailKey);

        const sessionData = JSON.parse(sessionStorage.getItem('vanguard_user') || '{}');
        const userEmail   = sessionData.email;
        if (!userEmail) { console.log('🔔 No user email in session, skipping email reminder'); return; }

        const cbTime      = new Date(notification.callbackTime);
        const formattedDT = cbTime.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long',
            day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
        });

        const html = `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                <div style="background:linear-gradient(135deg,#dc2626,#ef4444);color:white;padding:20px;text-align:center">
                    <h1 style="margin:0">🔔 Callback Reminder</h1>
                    <p style="font-size:18px;margin:8px 0 0">30 Minutes Until Scheduled Call</p>
                </div>
                <div style="padding:30px;background:#f9fafb">
                    <div style="background:white;padding:20px;border-radius:8px;border-left:4px solid #dc2626">
                        <h2 style="margin-top:0;color:#1f2937">Callback Details</h2>
                        <ul style="list-style:none;padding:0;margin:0">
                            <li style="margin-bottom:10px"><strong>📋 Lead:</strong> ${notification.leadName}</li>
                            <li style="margin-bottom:10px"><strong>📞 Phone:</strong> ${notification.leadPhone || 'Not provided'}</li>
                            <li style="margin-bottom:10px"><strong>🕒 Scheduled:</strong> ${formattedDT}</li>
                            <li style="margin-bottom:10px"><strong>📝 Notes:</strong> ${notification.callbackNotes || 'No notes'}</li>
                        </ul>
                    </div>
                </div>
            </div>`;

        fetch('/api/send-callback-reminder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: userEmail,
                subject: `🔔 Callback in 30 min — ${notification.leadName}`,
                html
            })
        })
        .then(r => r.json())
        .then(d => { if (d.success) console.log(`✅ Reminder email sent for ${notification.leadName}`); else console.error('❌ Email failed:', d.error); })
        .catch(e => console.error('❌ Email error:', e));
    }

    // ── Grant all-users toggle ─────────────────────────────────────────────────
    function isGrantAllUsersOn() {
        return localStorage.getItem('grantAllUsersNotif') === 'true';
    }

    window.toggleGrantAllUsers = function() {
        const newState = !isGrantAllUsersOn();
        localStorage.setItem('grantAllUsersNotif', newState ? 'true' : 'false');
        const track = document.getElementById('grantToggleTrack');
        const thumb = document.getElementById('grantToggleThumb');
        const label = document.getElementById('grantToggleLabel');
        if (track) track.style.background = newState ? '#3b82f6' : '#d1d5db';
        if (thumb) thumb.style.left = newState ? '19px' : '3px';
        if (label) label.textContent = newState ? 'All Users' : 'My Leads';
        updateNotificationDisplay();
        updateNotificationBadge();
    };

    function injectGrantToggle() {
        const sessionData = JSON.parse(sessionStorage.getItem('vanguard_user') || '{}');
        if ((sessionData.username || '').toLowerCase() !== 'grant') return;
        if (document.getElementById('grantToggleTrack')) return;
        const header = document.querySelector('.notification-sidebar-header');
        if (!header) return;
        const isOn = isGrantAllUsersOn();
        const wrapper = document.createElement('label');
        wrapper.style.cssText = 'display:flex;align-items:center;gap:6px;cursor:pointer;margin:0 8px 0 0;user-select:none;flex-shrink:0;';
        wrapper.innerHTML = `
            <span id="grantToggleLabel" style="font-size:12px;font-weight:500;color:#374151;">${isOn ? 'All Users' : 'My Leads'}</span>
            <div style="position:relative;width:36px;height:20px;flex-shrink:0;">
                <span id="grantToggleTrack" onclick="toggleGrantAllUsers()" style="
                    position:absolute;inset:0;border-radius:10px;cursor:pointer;
                    background:${isOn ? '#3b82f6' : '#d1d5db'};transition:background 0.2s;"></span>
                <span id="grantToggleThumb" style="
                    position:absolute;top:3px;left:${isOn ? '19px' : '3px'};
                    width:14px;height:14px;border-radius:50%;background:white;
                    transition:left 0.2s;pointer-events:none;
                    box-shadow:0 1px 3px rgba(0,0,0,0.3);"></span>
            </div>`;
        const closeBtn = header.querySelector('.close-sidebar-btn');
        header.insertBefore(wrapper, closeBtn);
    }

    // ── Sidebar display ────────────────────────────────────────────────────────
    function updateNotificationDisplay() {
        const el = document.querySelector('.notification-sidebar-content');
        if (!el) return;

        cleanupOldNotifications();

        const sessionData = JSON.parse(sessionStorage.getItem('vanguard_user') || '{}');
        const currentUser = sessionData.username || '';
        const isGrant = currentUser.toLowerCase() === 'grant';
        const showAll = isGrant && isGrantAllUsersOn();

        const active = callbackNotifications
            .filter(n => !isNotificationExpired(n))
            .filter(n => !(n.dismissedBy && n.dismissedBy[currentUser]))
            .filter(n => {
                if (showAll) return true;
                // Non-Grant users already see only their own; Grant with toggle OFF: filter by assignedAgent
                if (!isGrant) return true;
                const agent = n.assignedAgent || (n.leadId ? (getLeadData(n.leadId).assignedTo || '') : '');
                return !agent || agent.toLowerCase() === currentUser.toLowerCase();
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (active.length === 0) {
            el.innerHTML = `
                <div class="notification-empty-state">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications yet</p>
                    <small>You'll see important updates here</small>
                </div>`;
        } else {
            el.innerHTML = `<div class="notifications-list">${active.map(generateNotificationHTML).join('')}</div>`;
            addNotificationClickHandlers();
        }
    }

    function generateNotificationHTML(notification) {
        const timeAgo = getTimeAgo(new Date(notification.createdAt));
        const readClass = notification.read ? 'read' : 'unread';
        let agent = notification.assignedAgent;
        if (!agent && notification.leadId) {
            const lead = getLeadData(notification.leadId);
            agent = lead.assignedTo || 'Unknown';
        }
        return `
            <div class="notification-item ${readClass} ${notification.urgent ? 'urgent-notification' : ''}" data-notification-id="${notification.id}">
                <button class="dismiss-btn-top-right" onclick="CallbackNotifications.dismissNotification('${notification.id}')" title="Dismiss">
                    <i class="fas fa-times"></i>
                </button>
                <div class="notification-icon">
                    <i class="fas ${notification.type && notification.type.startsWith('todo_') ? 'fa-clipboard-list' : 'fa-phone'}" style="color:${notification.urgent ? '#dc2626' : '#059669'};"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-details">
                        <span class="callback-time">${notification.callbackTimeFormatted}</span>
                        ${notification.leadPhone ? `<span class="lead-phone">${notification.leadPhone}</span>` : ''}
                        ${agent ? `<span class="assigned-agent">Assigned: ${agent}</span>` : ''}
                    </div>
                    <div class="notification-time">${timeAgo}</div>
                </div>
                <div class="notification-actions">
                    <button class="view-lead-btn" onclick="CallbackNotifications.handleViewLead('${notification.leadId}')" title="View Lead">
                        <i class="fas fa-user"></i>
                    </button>
                </div>
            </div>`;
    }

    function addNotificationClickHandlers() {
        document.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', e => {
                if (!e.target.closest('.notification-actions') && !e.target.closest('.dismiss-btn-top-right')) {
                    markAsRead(item.getAttribute('data-notification-id'));
                }
            });
        });
    }

    // ── Badge ──────────────────────────────────────────────────────────────────
    function updateNotificationBadge() {
        const sessionData = JSON.parse(sessionStorage.getItem('vanguard_user') || '{}');
        const currentUser = sessionData.username || '';
        const isGrant = currentUser.toLowerCase() === 'grant';
        const showAll = isGrant && isGrantAllUsersOn();

        const unread = callbackNotifications.filter(n => {
            if (n.read || isNotificationExpired(n)) return false;
            if (showAll) return true;
            if (!isGrant) return true;
            const agent = n.assignedAgent || (n.leadId ? (getLeadData(n.leadId).assignedTo || '') : '');
            return !agent || agent.toLowerCase() === currentUser.toLowerCase();
        }).length;
        const btn    = document.querySelector('.notification-btn');
        if (!btn) return;
        let badge = btn.querySelector('.notification-badge');
        if (unread > 0) {
            if (!badge) { badge = document.createElement('span'); badge.className = 'notification-badge'; btn.appendChild(badge); }
            badge.textContent = unread > 99 ? '99+' : unread;
            badge.style.display = 'inline-block';
        } else if (badge) {
            badge.style.display = 'none';
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────────
    function cleanupOldNotifications() {
        const before = callbackNotifications.length;
        callbackNotifications = callbackNotifications.filter(n => !isNotificationExpired(n));
        if (callbackNotifications.length !== before) saveNotifications();
    }

    function isNotificationExpired(n) {
        const now         = Date.now();
        const cbTime      = new Date(n.callbackTime).getTime();
        const createdTime = new Date(n.createdAt).getTime();
        if (now > cbTime + 60 * 60 * 1000)          return true; // 1h after callback
        if (now > createdTime + 24 * 60 * 60 * 1000) return true; // 24h old
        return false;
    }

    function getTimeAgo(date) {
        const diff  = Date.now() - date.getTime();
        const mins  = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        if (mins < 1)   return 'Just now';
        if (mins < 60)  return `${mins}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return date.toLocaleDateString();
    }

    function saveNotifications() {
        localStorage.setItem('callbackNotifications', JSON.stringify(callbackNotifications));
    }

    function markAsRead(notificationId) {
        const n = callbackNotifications.find(n => n.id === notificationId);
        if (n && !n.read) {
            n.read = true;
            saveNotifications();
            updateNotificationBadge();
            const el = document.querySelector(`[data-notification-id="${notificationId}"]`);
            if (el) { el.classList.remove('unread'); el.classList.add('read'); }
        }
    }

    // ── Shared single-alarm helper ─────────────────────────────────────────────
    // Schedules (or fires immediately) one alarm stage using the given map.
    // alarmMap  : scheduledTodoAlarms  (used for todos AND calendar events)
    // alarmKey  : unique string key
    // msOut     : ms until this stage should fire (negative = already past)
    // fireFn    : callback to invoke when the alarm fires
    // label     : debug label
    const REMINDER_GRACE = 2 * 60 * 60 * 1000; // 2-hour grace window

    function scheduleOne(alarmMap, alarmKey, msOut, fireFn, label) {
        if (!alarmMap.has(alarmKey)) {
            if (msOut > 0) {
                const tid = setTimeout(() => { fireFn(); alarmMap.delete(alarmKey); }, msOut);
                alarmMap.set(alarmKey, tid);
                console.log(`⏰ ${label} set in ${Math.round(msOut / 1000)}s`);
            } else if (msOut >= -REMINDER_GRACE) {
                alarmMap.set(alarmKey, -1);
                setTimeout(fireFn, 0);
            } else {
                alarmMap.set(alarmKey, -1); // too old — skip
            }
        } else {
            const tid = alarmMap.get(alarmKey);
            if (tid !== -1 && msOut <= 0 && msOut >= -REMINDER_GRACE) {
                clearTimeout(tid);
                alarmMap.set(alarmKey, -1);
                console.log(`⏰ ${label} throttled — firing now`);
                setTimeout(fireFn, 0);
            }
        }
    }

    // ── Todo reminder scheduler (1 h + 30 min + due-now) ──────────────────────
    function scheduleTodoAlarms() {
        const now = Date.now();

        ['syncedPersonalTodos', 'syncedAgencyTodos'].forEach(storageKey => {
            let todos;
            try { todos = JSON.parse(localStorage.getItem(storageKey) || '[]'); }
            catch (e) { return; }

            todos.forEach(todo => {
                if (todo.completed)          return;
                if (!todo.scheduledReminder) return;
                if (!todo.targetDate)        return;

                const targetTs = new Date(todo.targetDate).getTime();
                if (isNaN(targetTs))         return;

                const msOut = targetTs - now;
                const lbl   = `Todo "${todo.text.substring(0, 20)}"`;

                scheduleOne(scheduledTodoAlarms, `todo_${todo.id}_1hour`,
                    msOut - 60 * 60 * 1000,
                    () => fireTodoAlarm(todo, '1hour'), `${lbl} 1-hour warning`);

                scheduleOne(scheduledTodoAlarms, `todo_${todo.id}_30min`,
                    msOut - 30 * 60 * 1000,
                    () => fireTodoAlarm(todo, '30min'), `${lbl} 30-min warning`);

                scheduleOne(scheduledTodoAlarms, `todo_${todo.id}_due`,
                    msOut,
                    () => fireTodoAlarm(todo, 'due'),   `${lbl} due-now`);
            });
        });
    }

    // Fetch the latest version of a todo (check if since completed)
    function getLatestTodoData(todoId) {
        for (const key of ['syncedPersonalTodos', 'syncedAgencyTodos']) {
            try {
                const found = JSON.parse(localStorage.getItem(key) || '[]')
                    .find(t => String(t.id) === String(todoId));
                if (found) return found;
            } catch (e) { /* ignore */ }
        }
        return null;
    }

    function fireTodoAlarm(todo, stage) {
        const notifId = `todo_${todo.id}_${stage}`;
        if (callbackNotifications.find(n => n.id === notifId)) return;

        const current = getLatestTodoData(todo.id);
        if (current && current.completed) return;

        const targetTime = new Date(todo.targetDate);
        const fmtTime    = targetTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        const titleMap   = { due: 'Task Due Now!', '30min': 'Task in 30 Minutes', '1hour': 'Task in 1 Hour' };
        const title      = titleMap[stage] || 'Task Reminder';
        const todoData   = current || todo;
        const message    = todoData.text;
        const urgent     = stage === 'due';
        const author     = todoData.author || todo.author || '';

        const notification = {
            id: notifId, type: 'todo_' + stage, title, message,
            callbackTime: todo.targetDate, callbackTimeFormatted: fmtTime,
            callbackNotes: '', createdAt: new Date().toISOString(),
            read: false, actionable: false, urgent, dismissedBy: {},
            assignedAgent: author
        };

        callbackNotifications.push(notification);
        saveNotifications();
        updateNotificationDisplay();
        updateNotificationBadge();

        showReminderPopup(notification, '#3b82f6', 'fa-tasks');
        fireBrowserNotification(title, `${message} · ${fmtTime}`, notifId);
        if (urgent) playNotificationSound(notification);

        console.log(`📋 Todo alarm FIRED [${stage}] for "${message}" at ${fmtTime}`);
    }

    // ── Calendar event alarm scheduler (1 h + 30 min + due-now) ──────────────
    function scheduleCalendarEventAlarms() {
        const now = Date.now();

        // ── Server calendar events ─────────────────────────────────────────────
        const serverEvents = window.calendarState?.serverEvents || [];
        serverEvents.forEach(ev => {
            if (ev.completed) return;
            const targetTs = new Date(`${ev.date}T${ev.time || '09:00'}`).getTime();
            if (isNaN(targetTs)) return;

            const msOut  = targetTs - now;
            const evType = ev.description || 'meeting';
            const color  = calEventColor(evType);
            const icon   = calEventIcon(evType);
            const lbl    = `Cal-event "${(ev.title || '').substring(0, 20)}"`;
            const id     = `srv_${ev.id}`;

            scheduleOne(scheduledTodoAlarms, `calevent_${id}_1hour`,
                msOut - 60 * 60 * 1000,
                () => fireCalendarAlarm(ev, evType, color, icon, '1hour'), `${lbl} 1-hour`);
            scheduleOne(scheduledTodoAlarms, `calevent_${id}_30min`,
                msOut - 30 * 60 * 1000,
                () => fireCalendarAlarm(ev, evType, color, icon, '30min'), `${lbl} 30-min`);
            scheduleOne(scheduledTodoAlarms, `calevent_${id}_due`,
                msOut,
                () => fireCalendarAlarm(ev, evType, color, icon, 'due'),   `${lbl} due-now`);
        });

        // ── Local (fallback) calendar events ──────────────────────────────────
        let localEvents;
        try { localEvents = JSON.parse(localStorage.getItem('calendarEvents') || '[]'); }
        catch (e) { return; }

        localEvents.forEach(ev => {
            if (ev.completed) return;
            const targetTs = new Date(`${ev.date}T${ev.time || '09:00'}`).getTime();
            if (isNaN(targetTs)) return;

            const msOut  = targetTs - now;
            const evType = ev.type || 'meeting';
            const color  = calEventColor(evType);
            const icon   = calEventIcon(evType);
            const lbl    = `Cal-event "${(ev.title || '').substring(0, 20)}"`;
            const id     = `local_${ev.id}`;

            scheduleOne(scheduledTodoAlarms, `calevent_${id}_1hour`,
                msOut - 60 * 60 * 1000,
                () => fireCalendarAlarm(ev, evType, color, icon, '1hour'), `${lbl} 1-hour`);
            scheduleOne(scheduledTodoAlarms, `calevent_${id}_30min`,
                msOut - 30 * 60 * 1000,
                () => fireCalendarAlarm(ev, evType, color, icon, '30min'), `${lbl} 30-min`);
            scheduleOne(scheduledTodoAlarms, `calevent_${id}_due`,
                msOut,
                () => fireCalendarAlarm(ev, evType, color, icon, 'due'),   `${lbl} due-now`);
        });
    }

    function calEventColor(evType) {
        const map = {
            meeting: '#3b82f6', call: '#10b981', appointment: '#8b5cf6',
            reminder: '#ef4444', 'follow-up': '#8b5cf6', callback: '#f97316'
        };
        return map[evType] || '#6b7280';
    }

    function calEventIcon(evType) {
        const map = {
            meeting: 'fa-users', call: 'fa-phone', appointment: 'fa-calendar-check',
            reminder: 'fa-bell', 'follow-up': 'fa-redo', callback: 'fa-phone-alt'
        };
        return map[evType] || 'fa-calendar';
    }

    function fireCalendarAlarm(ev, evType, color, icon, stage) {
        const evId    = ev.id;
        const src     = ev.isLocalOnly ? 'local' : 'srv';
        const notifId = `calevent_${src}_${evId}_${stage}`;
        if (callbackNotifications.find(n => n.id === notifId)) return;

        // Re-check completion at fire time from live state
        const liveEv = (window.calendarState?.serverEvents || []).find(e => e.id === evId);
        if (liveEv && liveEv.completed) return;

        const targetTime = new Date(`${ev.date}T${ev.time || '09:00'}`);
        const fmtTime    = targetTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        const typeLabel  = evType.charAt(0).toUpperCase() + evType.slice(1);
        const titleMap   = {
            due:   `${typeLabel} Starting Now!`,
            '30min': `${typeLabel} in 30 Minutes`,
            '1hour': `${typeLabel} in 1 Hour`
        };
        const title   = titleMap[stage] || 'Event Reminder';
        const message = ev.title || 'Calendar Event';
        const urgent  = stage === 'due';

        const notification = {
            id: notifId, type: 'calendar_' + stage, title, message,
            callbackTime: targetTime.toISOString(), callbackTimeFormatted: fmtTime,
            callbackNotes: ev.description || ev.notes || '', createdAt: new Date().toISOString(),
            read: false, actionable: false, urgent, dismissedBy: {}
        };

        callbackNotifications.push(notification);
        saveNotifications();
        updateNotificationDisplay();
        updateNotificationBadge();

        showReminderPopup(notification, color, icon);
        fireBrowserNotification(title, `${message} · ${fmtTime}`, notifId);
        if (urgent) playNotificationSound(notification);

        console.log(`📅 Calendar alarm FIRED [${stage}] for "${message}" (${evType}) at ${fmtTime}`);
    }

    // ── Shared reminder popup (todos + calendar events) ────────────────────────
    function showReminderPopup(notification, color, icon) {
        try {
            const existing = document.querySelector('.callback-popup-notification');
            if (existing) existing.remove();

            const popup = document.createElement('div');
            popup.className = 'callback-popup-notification';
            popup.innerHTML = `
                <div class="popup-content">
                    <div class="popup-icon">
                        <i class="fas ${icon}" style="color:${color};"></i>
                    </div>
                    <div class="popup-text">
                        <div class="popup-title">${notification.title}</div>
                        <div class="popup-message">${notification.message}</div>
                        <div class="popup-time">${notification.callbackTimeFormatted}</div>
                    </div>
                    <div class="popup-actions">
                        <button class="popup-dismiss-btn" onclick="CallbackNotifications.dismissPopup()"
                            style="background:${color};">
                            <i class="fas fa-check"></i> Got it
                        </button>
                    </div>
                </div>`;

            document.body.insertBefore(popup, document.body.firstChild);

            const delay = notification.urgent ? 20_000 : 15_000;
            setTimeout(() => {
                const p = document.querySelector('.callback-popup-notification');
                if (p) { p.style.transform = 'translateY(-100%)'; setTimeout(() => p.remove(), 300); }
            }, delay);

            console.log(`🔔 Reminder popup shown: "${notification.title}" — ${notification.message}`);
        } catch (e) {
            console.error('Error showing reminder popup:', e);
        }
    }

    // ── Clear all live timers and re-scan (used when waking from throttle) ────
    function clearAndRescan(reason) {
        console.log(`🔔 ${reason} — clearing stale timers and re-scanning`);
        cleanupOldNotifications();
        // Clear every active callback timer
        scheduledAlarms.forEach((tid, key) => {
            if (tid !== -1) { clearTimeout(tid); scheduledAlarms.delete(key); }
        });
        // Clear every active todo timer
        scheduledTodoAlarms.forEach((tid, key) => {
            if (tid !== -1) { clearTimeout(tid); scheduledTodoAlarms.delete(key); }
        });
        scheduleAlarms();
        scheduleTodoAlarms();
        scheduleCalendarEventAlarms();
        updateNotificationBadge();
    }

    // ── Visibility-change handler ──────────────────────────────────────────────
    // Browsers throttle/suspend setTimeout in background tabs.
    // When the user switches back to this tab, immediately re-scan for overdue
    // callbacks so they are never silently missed.
    function onVisibilityChange() {
        if (document.visibilityState === 'visible') {
            clearAndRescan('Tab became visible');
        }
    }

    // ── Public API ─────────────────────────────────────────────────────────────
    const CallbackNotifications = {
        init() {
            requestBrowserPermission();
            cleanupOldNotifications();
            updateNotificationDisplay();
            updateNotificationBadge();

            // Schedule exact-fire alarms for callbacks, todos, and calendar events
            scheduleAlarms();
            scheduleTodoAlarms();
            scheduleCalendarEventAlarms();

            // ── Drift-aware polling loop ─────────────────────────────────────
            // 10-second interval stays under browser throttle thresholds.
            // We also track drift: if the interval fires significantly late it
            // means timers were suspended — clear everything and re-scan so
            // overdue notifications fire the moment the user returns.
            let lastTick = Date.now();
            setInterval(() => {
                const now   = Date.now();
                const drift = now - lastTick - 10_000;   // extra ms since last tick
                lastTick    = now;

                if (drift > 5_000) {
                    // Timers were throttled (browser background/suspend)
                    clearAndRescan(`Drift detected (${Math.round(drift / 1000)}s) — timers were throttled`);
                } else {
                    cleanupOldNotifications();
                    scheduleAlarms();
                    scheduleTodoAlarms();
                    scheduleCalendarEventAlarms();
                    updateNotificationBadge();
                }
            }, 10_000);

            // Re-scan when tab becomes visible (background-tab throttling)
            document.addEventListener('visibilitychange', onVisibilityChange);

            // Re-scan when the browser window regains focus (user switched to
            // another app while the tab stayed visible — visibilitychange won't
            // fire in that case, but focus will).
            window.addEventListener('focus', () => clearAndRescan('Window focused'));

            console.log('✅ Exact-timer notification system active (10 s poll + drift detection + focus listener)');
        },

        // Called immediately after a new callback, todo, or calendar event is saved
        refresh() {
            console.log('🔔 refresh() — rescheduling alarms');
            scheduleAlarms();
            scheduleTodoAlarms();
            scheduleCalendarEventAlarms();
        },

        dismissPopup() {
            const p = document.querySelector('.callback-popup-notification');
            if (p) { p.style.transform = 'translateY(-100%)'; setTimeout(() => p.remove(), 300); }
        },

        dismissNotification(notificationId) {
            const sessionData = JSON.parse(sessionStorage.getItem('vanguard_user') || '{}');
            const currentUser = sessionData.username || '';
            const n = callbackNotifications.find(n => n.id === notificationId);
            if (n) {
                if (!n.dismissedBy) n.dismissedBy = {};
                n.dismissedBy[currentUser] = true;
                saveNotifications();
                updateNotificationDisplay();
                updateNotificationBadge();
            }
        },

        handleCallNow(leadId, phone) {
            if (typeof handleReachOutCall === 'function') handleReachOutCall(leadId, phone);
            else window.open(`tel:${phone}`, '_self');
            if (typeof closeNotificationSidebar === 'function') closeNotificationSidebar();
        },

        handleViewLead(leadId) {
            if (typeof viewLead === 'function') viewLead(leadId);
            if (typeof closeNotificationSidebar === 'function') closeNotificationSidebar();
        },

        markAsRead,
        updateNotificationDisplay,
        updateNotificationBadge,

        addNotification(notification) {
            notification.id        = notification.id        || `custom_${Date.now()}`;
            notification.createdAt = notification.createdAt || new Date().toISOString();
            notification.read      = notification.read      || false;
            callbackNotifications.push(notification);
            saveNotifications();
            updateNotificationDisplay();
            updateNotificationBadge();
        },

        // ── COI email notification ─────────────────────────────────────────────
        // Called from _runCOICheck (app.js) whenever a genuinely new COI email
        // arrives.  Adds an entry to the sidebar notification list, increments
        // the badge, and shows the shared reminder popup.
        // Browser notification is NOT fired here — the existing showCOINotification
        // already handles that so we avoid doubling up.
        notifyNewCOI(email) {
            const notifId = `coi_${email.id || Date.now()}`;

            // Dedup — same email shouldn't fire twice
            if (callbackNotifications.find(n => n.id === notifId)) return;

            const fromRaw  = email.from  || '';
            const fromName = fromRaw.replace(/<.*>/, '').trim() || fromRaw;
            const subject  = email.subject || '(no subject)';
            const recvTime = new Date(email.date || Date.now());
            const fmtTime  = recvTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

            const title   = 'New COI Request';
            const message = subject + (fromName ? ' — ' + fromName : '');

            // Set callbackTime well in the future so isNotificationExpired()
            // condition #1 (1 h after callback) doesn't immediately remove it.
            // Condition #2 (24 h from createdAt) will clean it up naturally.
            const expiryTime = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString();

            const notification = {
                id:                    notifId,
                type:                  'coi_request',
                title,
                message,
                leadId:                null,
                callbackTime:          expiryTime,
                callbackTimeFormatted: fmtTime,
                callbackNotes:         email.snippet || '',
                createdAt:             new Date().toISOString(),
                read:                  false,
                actionable:            true,
                urgent:                false,
                dismissedBy:           {}
            };

            callbackNotifications.push(notification);
            saveNotifications();
            updateNotificationDisplay();
            updateNotificationBadge();

            // Show the unified slide-down popup (same style as todos/calendar events)
            showReminderPopup(notification, '#2563eb', 'fa-certificate');
            playNotificationSound(notification);

            console.log(`📧 COI notification added to sidebar: "${subject}"`);
        }
    };

    window.CallbackNotifications = CallbackNotifications;

    // ── Sidebar open/close globals ────────────────────────────────────────────
    // These were previously in notification-sidebar.js. They live here now so
    // the single notification system owns the sidebar lifecycle.
    window.openNotificationSidebar = function () {
        const sidebar = document.getElementById('notificationSidebar');
        const overlay = document.getElementById('notificationOverlay');
        if (sidebar) sidebar.classList.add('active');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        injectGrantToggle();
        // Mark all as read when opened
        callbackNotifications.forEach(n => { n.read = true; });
        saveNotifications();
        updateNotificationDisplay();
        updateNotificationBadge();
    };

    window.closeNotificationSidebar = function () {
        const sidebar = document.getElementById('notificationSidebar');
        const overlay = document.getElementById('notificationOverlay');
        if (sidebar) sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    window.toggleNotificationSidebar = function () {
        const sidebar = document.getElementById('notificationSidebar');
        if (sidebar && sidebar.classList.contains('active')) {
            window.closeNotificationSidebar();
        } else {
            window.openNotificationSidebar();
        }
    };

    // Used by the "Mark All Read" button in the sidebar header
    window.markAllAsRead = function () {
        callbackNotifications.forEach(n => { n.read = true; });
        saveNotifications();
        updateNotificationDisplay();
        updateNotificationBadge();
    };

    // Wire the bell button in the navbar
    function attachBellButton() {
        const btn = document.querySelector('.notification-btn');
        if (!btn) return false;
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            window.toggleNotificationSidebar();
        });
        return true;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { CallbackNotifications.init(); attachBellButton(); });
    } else {
        CallbackNotifications.init();
        attachBellButton();
    }

    // ── COI card watcher ──────────────────────────────────────────────────────
    // Poll #coi-request-reminders every 10s and track data-coi-id attributes.
    // Fires a notification for each genuinely new card ID that appears.
    // This is intentionally polling-based: the card container is rebuilt wholesale
    // by loadCOIRequestCards(), which destroys any MutationObserver on child nodes.
    (function startCOICardWatcher() {
        const _seenIds = new Set();
        let   _baselineSet = false;

        function scanCards() {
            const container = document.getElementById('coi-request-reminders');
            if (!container) return;

            const cards = container.querySelectorAll('.reminder-card[data-coi-id]');
            if (!_baselineSet) {
                // First scan — record all existing IDs without firing notifications
                cards.forEach(c => _seenIds.add(c.dataset.coiId));
                _baselineSet = true;
                console.log(`📧 COI card watcher baseline: ${_seenIds.size} existing card(s)`);
                return;
            }

            const newCards = [];
            cards.forEach(c => {
                if (!_seenIds.has(c.dataset.coiId)) {
                    _seenIds.add(c.dataset.coiId);
                    newCards.push(c);
                }
            });

            newCards.forEach(card => {
                const subject = card.querySelector('h4')?.textContent?.trim() || 'New COI Request';
                const timeStr = card.querySelector('.card-urgency span')?.textContent?.replace(/\n/g, ' ').trim() || '';
                const notifId = `coi_card_${card.dataset.coiId}`;

                if (callbackNotifications.find(n => n.id === notifId)) return;

                const notification = {
                    id: notifId, type: 'coi_request',
                    title: 'New COI Request',
                    message: subject + (timeStr ? ' — ' + timeStr : ''),
                    leadId: null,
                    callbackTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
                    callbackTimeFormatted: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
                    callbackNotes: '',
                    createdAt: new Date().toISOString(),
                    read: false, actionable: true, urgent: false, dismissedBy: {}
                };
                callbackNotifications.push(notification);
                saveNotifications();
                updateNotificationDisplay();
                updateNotificationBadge();
                showReminderPopup(notification, '#2563eb', 'fa-certificate');
                playNotificationSound(notification);
                console.log(`📧 New COI card detected: "${subject}" — notification fired`);
            });
        }

        // Start polling — runs on the same 10s cadence as the main notification loop
        // but with its own interval so it keeps running even when clearAndRescan fires
        setInterval(scanCards, 10_000);

        // Also run immediately once DOM is ready to set the baseline
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', scanCards);
        } else {
            // Container may not be rendered yet; try after a short delay
            setTimeout(scanCards, 3000);
        }
    })();

    console.log('✅ Callback Notifications loaded (exact-timer v2)');
})();
