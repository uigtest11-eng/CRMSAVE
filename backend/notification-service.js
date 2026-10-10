#!/usr/bin/env node

/**
 * Vanguard Notification Service
 * Runs continuously in the background to track callbacks, overdue leads, and generate notifications
 * Works independently of user login status
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const axios = require('axios');
const EmailService = require('./email-service');

// Database connection
const dbPath = path.join(__dirname, '../vanguard.db');
const db = new sqlite3.Database(dbPath);

// Configuration
const CHECK_INTERVAL = 60000; // Check every minute
const CALLBACK_WARNING_MINUTES = 30; // Warn 30 minutes before callback is due
const OVERDUE_THRESHOLD_MINUTES = 15; // Mark as overdue 15 minutes after due time
const ENABLE_EMAIL_NOTIFICATIONS = true; // Enable email notifications

// Email Configuration
const emailConfig = {
    provider: 'smtp',
    smtpHost: 'smtpout.secureserver.net',
    smtpPort: 465,
    smtpSecure: true,
    smtpUser: 'contact@vigagency.com',
    smtpPass: process.env.GODADDY_VIG_PASSWORD || '',
    fromEmail: 'contact@vigagency.com'
};

// Initialize email service
const emailService = new EmailService(emailConfig);

console.log('🚀 Vanguard Notification Service Starting...');
console.log(`📊 Check interval: ${CHECK_INTERVAL / 1000} seconds`);
console.log(`⏰ Callback warning time: ${CALLBACK_WARNING_MINUTES} minutes before due`);
console.log(`🚨 Overdue threshold: ${OVERDUE_THRESHOLD_MINUTES} minutes after due`);

// Create notifications table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    lead_id TEXT,
    callback_id TEXT,
    priority TEXT DEFAULT 'medium',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME NULL,
    dismissed_at DATETIME NULL,
    metadata TEXT
)`, (err) => {
    if (err) {
        console.error('❌ Error creating notifications table:', err);
    } else {
        console.log('✅ Notifications table ready');
    }
});

// Create todos table for notification tracking
db.run(`CREATE TABLE IF NOT EXISTS tracked_todos (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    text TEXT NOT NULL,
    target_date DATETIME NOT NULL,
    completed INTEGER DEFAULT 0,
    todo_type TEXT DEFAULT 'personal',
    source TEXT DEFAULT 'manual',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`, (err) => {
    if (err) {
        console.error('❌ Error creating tracked_todos table:', err);
    } else {
        console.log('✅ Tracked todos table ready');
    }
});

// Store active notifications to avoid duplicates
const activeNotifications = new Set();
// Store sent email reminders to avoid duplicates
const sentEmailReminders = new Set();
// Store sent Slack alerts to avoid duplicate pings
const sentSlackAlerts = new Set();

// Resolve a CRM username/agent name → Slack @mention string (e.g. "<@U012AB3CD>")
// Falls back to null if not found in slack_user_map
function resolveSlackMention(agentName) {
    if (!agentName) return Promise.resolve(null);
    const lower = agentName.toLowerCase().trim();
    return new Promise((resolve) => {
        db.get(
            'SELECT slack_user_id FROM slack_user_map WHERE crm_username = ?',
            [lower],
            (err, row) => resolve((err || !row) ? null : `<@${row.slack_user_id}>`)
        );
    });
}

// Post a message to a Slack channel via bot token
async function postSlackAlert(channel, text) {
    const token = process.env.SLACK_BOT_TOKEN;
    if (!token || !channel) {
        console.warn(`[Slack Alert] Skipped — token:${!!token} channel:${channel}`);
        return;
    }
    try {
        const resp = await axios.post('https://slack.com/api/chat.postMessage', { channel, text }, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (resp.data.ok) {
            console.log(`[Slack Alert] ✅ Posted to ${channel}`);
        } else {
            console.error(`[Slack Alert] Slack error for ${channel}:`, resp.data.error);
        }
    } catch (e) {
        console.error(`[Slack Alert] Failed to post to ${channel}:`, e.message);
    }
}

// Helper function to create notification with deduplication
function createNotification(type, title, message, leadId = null, callbackId = null, priority = 'medium', metadata = {}) {
    // For callback overdue notifications, remove old notifications for the same lead
    if (type === 'callback_overdue' && leadId) {
        console.log(`🧹 DEDUPLICATION: Removing old callback_overdue notifications for lead ${leadId}`);

        // Remove old notifications for this lead from database
        const deleteStmt = db.prepare(`
            UPDATE notifications
            SET dismissed_at = CURRENT_TIMESTAMP
            WHERE type = 'callback_overdue' AND lead_id = ? AND dismissed_at IS NULL
        `);

        deleteStmt.run(leadId, (err) => {
            if (err) {
                console.error('❌ Error dismissing old notifications:', err);
            } else {
                console.log(`🧹 DEDUPLICATION: Dismissed old callback_overdue notifications for lead ${leadId}`);
            }
        });

        deleteStmt.finalize();

        // Also remove from active notifications set
        const oldNotificationKey = `callback_overdue_${leadId}_`;
        activeNotifications.delete(oldNotificationKey);
    }

    // For todo overdue notifications, remove old notifications for the same todo
    if (type === 'todo_overdue' && callbackId) {
        console.log(`🧹 DEDUPLICATION: Removing old todo_overdue notifications for todo ${callbackId}`);

        const deleteStmt = db.prepare(`
            UPDATE notifications
            SET dismissed_at = CURRENT_TIMESTAMP
            WHERE type = 'todo_overdue' AND callback_id = ? AND dismissed_at IS NULL
        `);

        deleteStmt.run(callbackId, (err) => {
            if (err) {
                console.error('❌ Error dismissing old todo notifications:', err);
            } else {
                console.log(`🧹 DEDUPLICATION: Dismissed old todo_overdue notifications for todo ${callbackId}`);
            }
        });

        deleteStmt.finalize();

        const oldNotificationKey = `todo_overdue_${callbackId}_`;
        activeNotifications.delete(oldNotificationKey);
    }

    // For event overdue notifications, remove old notifications for the same event
    if (type === 'event_overdue' && callbackId) {
        console.log(`🧹 DEDUPLICATION: Removing old event_overdue notifications for event ${callbackId}`);

        const deleteStmt = db.prepare(`
            UPDATE notifications
            SET dismissed_at = CURRENT_TIMESTAMP
            WHERE type = 'event_overdue' AND callback_id = ? AND dismissed_at IS NULL
        `);

        deleteStmt.run(callbackId, (err) => {
            if (err) {
                console.error('❌ Error dismissing old event notifications:', err);
            } else {
                console.log(`🧹 DEDUPLICATION: Dismissed old event_overdue notifications for event ${callbackId}`);
            }
        });

        deleteStmt.finalize();

        const oldNotificationKey = `event_overdue_${callbackId}_`;
        activeNotifications.delete(oldNotificationKey);
    }

    const notificationKey = `${type}_${leadId || ''}_${callbackId || ''}`;

    // For non-overdue notifications, still prevent immediate duplicates
    if (type !== 'callback_overdue' && activeNotifications.has(notificationKey)) {
        return;
    }

    const stmt = db.prepare(`
        INSERT INTO notifications (type, title, message, lead_id, callback_id, priority, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
        type,
        title,
        message,
        leadId,
        callbackId,
        priority,
        JSON.stringify(metadata),
        (err) => {
            if (err) {
                console.error('❌ Error creating notification:', err);
            } else {
                console.log(`📢 Created ${priority} notification: ${title} (lead: ${leadId})`);
                activeNotifications.add(notificationKey);

                // Remove from active set after some time to allow future notifications
                // Shorter timeout for overdue notifications to allow updates
                const timeout = type === 'callback_overdue' ? 5 * 60 * 1000 : 60 * 60 * 1000; // 5 min vs 1 hour
                setTimeout(() => {
                    activeNotifications.delete(notificationKey);
                }, timeout);
            }
        }
    );

    stmt.finalize();
}

// Helper function to send email reminder
async function sendEmailReminder(callback, leadData) {
    if (!ENABLE_EMAIL_NOTIFICATIONS) return;

    const reminderKey = `email_${callback.lead_id}_${callback.callback_id}`;

    // Prevent duplicate email reminders
    if (sentEmailReminders.has(reminderKey)) {
        return;
    }

    try {
        // Get agent email from lead data or use default
        let agentEmail = 'grant@vigagency.com'; // Default fallback

        if (leadData && leadData.assignedTo) {
            // Map assigned agents to their emails
            const agentEmails = {
                'Grant': 'grant@vigagency.com',
                'Carson': 'carson@vigagency.com',
                'Hunter': 'hunter@vigagency.com'
            };

            const assignedAgent = leadData.assignedTo;
            if (agentEmails[assignedAgent]) {
                agentEmail = agentEmails[assignedAgent];
            }
        }

        // Prepare callback data for email
        const callbackData = {
            leadName: leadData ? (leadData.name || 'Unknown Lead') : 'Unknown Lead',
            leadPhone: leadData ? leadData.phone : null,
            dateTime: callback.date_time,
            notes: callback.notes || 'No notes provided'
        };

        console.log(`📧 Sending 30-minute callback reminder email to ${agentEmail} for ${callbackData.leadName}`);

        // Send email reminder
        const result = await emailService.sendCallbackReminderEmail(agentEmail, callbackData);

        if (result.success) {
            console.log(`✅ Email reminder sent successfully to ${agentEmail}: ${result.messageId}`);

            // Mark as sent to prevent duplicates
            sentEmailReminders.add(reminderKey);

            // Remove from sent set after 2 hours to allow re-sending if needed
            setTimeout(() => {
                sentEmailReminders.delete(reminderKey);
            }, 2 * 60 * 60 * 1000);

            // Create notification record of email sent
            createNotification(
                'email_sent',
                '📧 Reminder Email Sent',
                `30-minute callback reminder email sent to ${agentEmail} for ${callbackData.leadName}`,
                callback.lead_id,
                callback.callback_id,
                'low',
                {
                    emailRecipient: agentEmail,
                    messageId: result.messageId,
                    callbackTime: callback.date_time
                }
            );
        } else {
            console.error(`❌ Failed to send email reminder to ${agentEmail}:`, result.error);

            // Create notification of email failure
            createNotification(
                'email_failed',
                '📧 Email Reminder Failed',
                `Failed to send 30-minute callback reminder email to ${agentEmail} for ${callbackData.leadName}`,
                callback.lead_id,
                callback.callback_id,
                'medium',
                {
                    emailRecipient: agentEmail,
                    error: result.error,
                    callbackTime: callback.date_time
                }
            );
        }
    } catch (error) {
        console.error('❌ Error in sendEmailReminder:', error);
    }
}

// Helper function to get lead name
function getLeadName(leadId, callback) {
    // First try clients table (JSON storage)
    db.get('SELECT id, data FROM clients WHERE id = ?', [leadId], (err, row) => {
        if (row && row.data) {
            try {
                const clientData = JSON.parse(row.data);
                const displayName = clientData.businessName || clientData.name || clientData.fullName || 'Unknown Lead';
                callback(displayName, clientData);
                return;
            } catch (e) {
                console.warn('Error parsing client data:', e.message);
            }
        }

        // Try leads table (JSON storage)
        db.get('SELECT id, data FROM leads WHERE id = ?', [leadId], (err, row) => {
            if (row && row.data) {
                try {
                    const leadData = JSON.parse(row.data);
                    const displayName = leadData.businessName || leadData.name || leadData.fullName || 'Unknown Lead';
                    callback(displayName, leadData);
                    return;
                } catch (e) {
                    console.warn('Error parsing lead data:', e.message);
                }
            }

            // Final fallback - try insurance_leads (JSON storage in settings)
            db.get('SELECT value FROM settings WHERE key = ?', ['insurance_leads'], (err, row) => {
                if (row && row.value) {
                    try {
                        const leads = JSON.parse(row.value);
                        const lead = leads.find(l => String(l.id) === String(leadId));
                        if (lead) {
                            const displayName = lead.businessName || lead.name || lead.fullName || 'Unknown Lead';
                            callback(displayName, lead);
                            return;
                        }
                    } catch (e) {
                        console.warn('Error parsing insurance_leads:', e.message);
                    }
                }

                // No data found anywhere
                callback('Unknown Lead', null);
            });
        });
    });
}

// Main monitoring function
function checkCallbacks() {
    console.log('🔍 Checking callbacks and notifications...');

    const now = new Date();
    const warningTime = new Date(now.getTime() + (CALLBACK_WARNING_MINUTES * 60 * 1000));
    const overdueTime = new Date(now.getTime() - (OVERDUE_THRESHOLD_MINUTES * 60 * 1000));

    // Query all active callbacks
    db.all(`
        SELECT * FROM scheduled_callbacks
        WHERE completed = 0
        ORDER BY date_time ASC
    `, (err, callbacks) => {
        if (err) {
            console.error('❌ Error querying callbacks:', err);
            return;
        }

        console.log(`📋 Found ${callbacks.length} active callbacks`);

        callbacks.forEach(callback => {
            const callbackTime = new Date(callback.date_time);
            const leadId = callback.lead_id;
            const callbackId = callback.callback_id;

            // Check if overdue
            if (callbackTime < overdueTime) {
                getLeadName(leadId, (leadName, leadData) => {
                    // Skip creating notifications for unknown/missing leads
                    if (leadName === 'Unknown Lead' || !leadData) {
                        console.warn(`⚠️ Skipping notification for missing lead ID: ${leadId}`);
                        return;
                    }

                    const minutesOverdue = Math.round((now - callbackTime) / (1000 * 60));
                    createNotification(
                        'callback_overdue',
                        '🔴 Callback Overdue',
                        `Callback for ${leadName} was due ${minutesOverdue} minutes ago`,
                        leadId,
                        callbackId,
                        'high',
                        {
                            dueTime: callback.date_time,
                            minutesOverdue: minutesOverdue,
                            notes: callback.notes,
                            leadData: leadData,
                            assignedAgent: leadData ? leadData.assignedTo : null
                        }
                    );

                    // No Slack alert for overdue — only "due soon" and "due now" go to Slack
                });
            }
            // Check if due soon (warning) - also send email if within 30 minutes
            else if (callbackTime <= warningTime && callbackTime > now) {
                getLeadName(leadId, (leadName, leadData) => {
                    // Skip creating notifications for unknown/missing leads
                    if (leadName === 'Unknown Lead' || !leadData) {
                        console.warn(`⚠️ Skipping due soon notification for missing lead ID: ${leadId}`);
                        return;
                    }

                    const minutesUntil = Math.round((callbackTime - now) / (1000 * 60));

                    // Create notification
                    createNotification(
                        'callback_due_soon',
                        '⚡ Callback Due Soon',
                        `Callback for ${leadName} is due in ${minutesUntil} minutes`,
                        leadId,
                        callbackId,
                        'medium',
                        {
                            dueTime: callback.date_time,
                            minutesUntil: minutesUntil,
                            notes: callback.notes,
                            leadData: leadData,
                            assignedAgent: leadData ? leadData.assignedTo : null
                        }
                    );

                    // Slack alert — once per callback
                    const slackKey = `cb_soon_${callbackId}`;
                    if (!sentSlackAlerts.has(slackKey)) {
                        sentSlackAlerts.add(slackKey);
                        const agentName = leadData?.assignedTo || null;
                        const agentLabel = agentName ? ` · Agent: ${agentName}` : '';
                        resolveSlackMention(agentName).then(mention => {
                            const mentionStr = mention ? `\n${mention}` : '';
                            postSlackAlert(process.env.SLACK_CALLBACKS_CHANNEL,
                                `⚡ *Callback Due Soon* — ${leadName}\nDue in *${minutesUntil} min*${agentLabel}${mentionStr}`);
                        });
                    }

                    // Send email reminder if within 30 minutes
                    if (minutesUntil <= CALLBACK_WARNING_MINUTES) {
                        sendEmailReminder(callback, leadData);
                    }
                });
            }
            // Check if due right now (within 5 minutes) - High priority notifications
            else if (Math.abs(callbackTime - now) <= 5 * 60 * 1000) {
                getLeadName(leadId, (leadName, leadData) => {
                    // Skip creating notifications for unknown/missing leads
                    if (leadName === 'Unknown Lead' || !leadData) {
                        console.warn(`⚠️ Skipping due now notification for missing lead ID: ${leadId}`);
                        return;
                    }

                    const minutesFromDue = Math.round((callbackTime - now) / (1000 * 60));
                    let urgencyLevel = 'high';
                    let title = '🔔 Callback Due Now';
                    let message = `Callback for ${leadName} is due now!`;

                    // More specific messaging based on exact timing
                    if (minutesFromDue > 0) {
                        title = '🚨 Callback Due Very Soon';
                        message = `URGENT: Callback for ${leadName} is due in ${minutesFromDue} minute${minutesFromDue === 1 ? '' : 's'}!`;
                    } else if (minutesFromDue === 0) {
                        title = '🔴 CALLBACK DUE RIGHT NOW';
                        message = `⏰ IMMEDIATE ACTION REQUIRED: Callback for ${leadName} is due RIGHT NOW!`;
                        urgencyLevel = 'critical';
                    } else {
                        // Overdue but still within 5 minutes
                        const minutesOverdue = Math.abs(minutesFromDue);
                        title = '🚨 CALLBACK OVERDUE';
                        message = `URGENT: Callback for ${leadName} was due ${minutesOverdue} minute${minutesOverdue === 1 ? '' : 's'} ago!`;
                        urgencyLevel = 'critical';
                    }

                    createNotification(
                        'callback_due_now',
                        title,
                        message,
                        leadId,
                        callbackId,
                        urgencyLevel,
                        {
                            dueTime: callback.date_time,
                            minutesFromDue: minutesFromDue,
                            notes: callback.notes,
                            leadData: leadData,
                            assignedAgent: leadData ? leadData.assignedTo : null
                        }
                    );

                    // Slack alert — once per callback at due time
                    const slackKey = `cb_now_${callbackId}`;
                    if (!sentSlackAlerts.has(slackKey)) {
                        sentSlackAlerts.add(slackKey);
                        const agentName = leadData?.assignedTo || null;
                        const agentLabel = agentName ? ` · Agent: ${agentName}` : '';
                        resolveSlackMention(agentName).then(mention => {
                            const mentionStr = mention ? `\n${mention}` : '';
                            const slackMsg = minutesFromDue > 0
                                ? `🚨 *Callback Due in ${minutesFromDue} min* — ${leadName}${agentLabel}${mentionStr}`
                                : `🔴 *CALLBACK DUE NOW* — ${leadName}${agentLabel}${mentionStr}`;
                            postSlackAlert(process.env.SLACK_CALLBACKS_CHANNEL, slackMsg);
                        });
                    }
                });
            }
        });
    });

    // Additional monitoring can be added here:
    // - Check for leads without recent activity
    // - Check for pending quote applications

    // Check todos and calendar events for notifications
    checkTodosAndEvents();
    // - Check for expired documents
    // - etc.

    console.log(`✅ Callback check completed at ${new Date().toISOString()}`);
}

// Check todos and calendar events for notifications
function checkTodosAndEvents() {
    console.log('📅 Checking todos and calendar events for notifications...');

    const now = new Date();
    const warningTime = new Date(now.getTime() + (CALLBACK_WARNING_MINUTES * 60 * 1000)); // 30 min warning
    const overdueTime = new Date(now.getTime() - (OVERDUE_THRESHOLD_MINUTES * 60 * 1000)); // 15 min overdue

    // Check tracked todos for notifications
    checkTrackedTodos(now, warningTime, overdueTime);

    // Check calendar events for notifications
    checkCalendarEvents(now, warningTime, overdueTime);
}

// Check tracked todos (synced from frontend localStorage)
function checkTrackedTodos(now, warningTime, overdueTime) {
    db.all(`
        SELECT * FROM tracked_todos
        WHERE completed = 0
        AND target_date IS NOT NULL
        ORDER BY target_date ASC
    `, (err, todos) => {
        if (err) {
            console.error('❌ Error querying tracked todos:', err);
            return;
        }

        console.log(`📋 Found ${todos.length} active tracked todos`);

        todos.forEach(todo => {
            // If stored without timezone (no Z or +), treat as Eastern time (EDT = UTC-4)
            const rawDate = todo.target_date;
            const hasTimezone = /Z|[+-]\d{2}:?\d{2}$/.test(rawDate);
            const todoTime = hasTimezone ? new Date(rawDate) : new Date(rawDate + '-04:00');
            const todoId = todo.id;
            const userId = todo.user_id;

            // Check if overdue (cap at 30 min — no more alerts beyond that)
            if (todoTime < overdueTime) {
                const minutesOverdue = Math.round((now - todoTime) / (1000 * 60));
                if (minutesOverdue > 30) return; // stop all notifications after 30 min overdue
                createNotification(
                    'todo_overdue',
                    '🔴 Todo Overdue',
                    `Todo "${todo.text}" was due ${minutesOverdue} minutes ago`,
                    null,
                    todoId,
                    'high',
                    {
                        todoId: todoId,
                        userId: userId,
                        dueTime: todo.target_date,
                        minutesOverdue: minutesOverdue,
                        todoType: todo.todo_type,
                        source: todo.source
                    }
                );

                const slackKey = `todo_overdue_${todoId}_${Math.floor(minutesOverdue / 30)}`;
                if (!sentSlackAlerts.has(slackKey)) {
                    sentSlackAlerts.add(slackKey);
                    resolveSlackMention(userId).then(mention => {
                        const who = userId ? ` · ${userId}` : '';
                        const mentionStr = mention ? `\n${mention}` : '';
                        postSlackAlert(process.env.SLACK_REMINDERS_CHANNEL,
                            `🔴 *Reminder Overdue* — ${todo.text}\nWas due *${minutesOverdue} min ago*${who}${mentionStr}`);
                    });
                }
            }
            // Check if due soon OR just became due (bridges the 0–15 min gap)
            else if (todoTime <= warningTime && todoTime > overdueTime) {
                const minutesFromNow = Math.round((todoTime - now) / (1000 * 60));
                const label = minutesFromNow > 0
                    ? `is due in ${minutesFromNow} minutes`
                    : minutesFromNow === 0 ? 'is due RIGHT NOW' : `was due ${Math.abs(minutesFromNow)} minute${Math.abs(minutesFromNow) === 1 ? '' : 's'} ago`;
                createNotification(
                    'todo_due_soon',
                    minutesFromNow > 0 ? '⏰ Todo Due Soon' : '🔔 Todo Due Now',
                    `Todo "${todo.text}" ${label}`,
                    null,
                    todoId,
                    minutesFromNow > 0 ? 'medium' : 'high',
                    {
                        todoId: todoId,
                        userId: userId,
                        dueTime: todo.target_date,
                        minutesFromNow: minutesFromNow,
                        todoType: todo.todo_type,
                        source: todo.source
                    }
                );

                const slackKey = `todo_soon_${todoId}`;
                if (!sentSlackAlerts.has(slackKey)) {
                    sentSlackAlerts.add(slackKey);
                    resolveSlackMention(userId).then(mention => {
                        const who = userId ? ` · ${userId}` : '';
                        const mentionStr = mention ? `\n${mention}` : '';
                        const slackMsg = minutesFromNow > 0
                            ? `⏰ *Reminder Due Soon* — ${todo.text}\nDue in *${minutesFromNow} min*${who}${mentionStr}`
                            : `🔔 *Reminder Due Now* — ${todo.text}${who}${mentionStr}`;
                        postSlackAlert(process.env.SLACK_REMINDERS_CHANNEL, slackMsg);
                    });
                }
            }
        });
    });
}

// Check calendar events for notifications
function checkCalendarEvents(now, warningTime, overdueTime) {
    db.all(`
        SELECT * FROM calendar_events
        WHERE date IS NOT NULL
        ORDER BY date ASC, time ASC
    `, (err, events) => {
        if (err) {
            console.error('❌ Error querying calendar events:', err);
            return;
        }

        console.log(`📅 Found ${events.length} calendar events`);

        events.forEach(event => {
            // Skip events that are actually callbacks synced from CRM (CB: prefix)
            if (/^CB:/i.test(event.title) || /call.?back/i.test(event.title)) return;

            // Parse as Eastern time (EDT = UTC-4, EST = UTC-5)
            // Append offset so Date math is correct regardless of server timezone
            const estOffset = '-04:00'; // EDT (Apr–Nov); change to -05:00 Nov–Mar
            const timeStr = event.time || '09:00';
            const eventDateTime = new Date(event.date + 'T' + timeStr + ':00' + estOffset);
            const eventId = event.id;
            const userId = event.created_by;

            // Check if overdue (cap at 30 min — no more alerts beyond that)
            if (eventDateTime < overdueTime) {
                const minutesOverdue = Math.round((now - eventDateTime) / (1000 * 60));
                if (minutesOverdue > 30) return; // stop all notifications after 30 min overdue
                createNotification(
                    'event_overdue',
                    '🔴 Event Overdue',
                    `Event "${event.title}" was due ${minutesOverdue} minutes ago`,
                    null,
                    eventId.toString(),
                    'high',
                    {
                        eventId: eventId,
                        userId: userId,
                        dueTime: eventDateTime.toISOString(),
                        minutesOverdue: minutesOverdue,
                        description: event.description,
                        eventType: 'calendar_event'
                    }
                );

                const slackKey = `event_overdue_${eventId}_${Math.floor(minutesOverdue / 30)}`;
                if (!sentSlackAlerts.has(slackKey)) {
                    sentSlackAlerts.add(slackKey);
                    resolveSlackMention(userId).then(mention => {
                        const who = userId ? ` · ${userId}` : '';
                        const mentionStr = mention ? `\n${mention}` : '';
                        postSlackAlert(process.env.SLACK_REMINDERS_CHANNEL,
                            `🔴 *Event Overdue* — ${event.title}\nWas due *${minutesOverdue} min ago*${who}${mentionStr}`);
                    });
                }
            }
            // Check if due soon OR just became due (bridges the 0–15 min gap)
            else if (eventDateTime <= warningTime && eventDateTime > overdueTime) {
                const minutesFromNow = Math.round((eventDateTime - now) / (1000 * 60));
                const label = minutesFromNow > 0
                    ? `is due in ${minutesFromNow} minutes`
                    : minutesFromNow === 0 ? 'is due RIGHT NOW' : `was due ${Math.abs(minutesFromNow)} minute${Math.abs(minutesFromNow) === 1 ? '' : 's'} ago`;
                createNotification(
                    'event_due_soon',
                    minutesFromNow > 0 ? '⏰ Event Due Soon' : '🔔 Event Due Now',
                    `Event "${event.title}" ${label}`,
                    null,
                    eventId.toString(),
                    minutesFromNow > 0 ? 'medium' : 'high',
                    {
                        eventId: eventId,
                        userId: userId,
                        dueTime: eventDateTime.toISOString(),
                        minutesFromNow: minutesFromNow,
                        description: event.description,
                        eventType: 'calendar_event'
                    }
                );

                const slackKey = `event_soon_${eventId}`;
                if (!sentSlackAlerts.has(slackKey)) {
                    sentSlackAlerts.add(slackKey);
                    resolveSlackMention(userId).then(mention => {
                        const who = userId ? ` · ${userId}` : '';
                        const mentionStr = mention ? `\n${mention}` : '';
                        const slackMsg = minutesFromNow > 0
                            ? `📅 *Reminder Due Soon* — ${event.title}\nDue in *${minutesFromNow} min*${who}${mentionStr}`
                            : `🔔 *Reminder Due Now* — ${event.title}${who}${mentionStr}`;
                        postSlackAlert(process.env.SLACK_REMINDERS_CHANNEL, slackMsg);
                    });
                }
            }
        });
    });
}

// Cleanup old notifications periodically (keep last 7 days)
function cleanupOldNotifications() {
    const sevenDaysAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)).toISOString();

    db.run(`DELETE FROM notifications WHERE created_at < ?`, [sevenDaysAgo], function(err) {
        if (err) {
            console.error('❌ Error cleaning up old notifications:', err);
        } else if (this.changes > 0) {
            console.log(`🧹 Cleaned up ${this.changes} old notifications`);
        }
    });
}

// API for external access (can be called from main server)
const NotificationService = {
    // Get all unread notifications
    getUnreadNotifications: (callback) => {
        db.all(`
            SELECT * FROM notifications
            WHERE read_at IS NULL AND dismissed_at IS NULL
            ORDER BY priority DESC, created_at DESC
        `, callback);
    },

    // Get notifications for specific lead
    getLeadNotifications: (leadId, callback) => {
        db.all(`
            SELECT * FROM notifications
            WHERE lead_id = ?
            ORDER BY created_at DESC
            LIMIT 50
        `, [leadId], callback);
    },

    // Mark notification as read
    markAsRead: (notificationId, callback) => {
        db.run(`
            UPDATE notifications
            SET read_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [notificationId], callback);
    },

    // Dismiss notification
    dismissNotification: (notificationId, callback) => {
        db.run(`
            UPDATE notifications
            SET dismissed_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [notificationId], callback);
    },

    // Create manual notification
    createManualNotification: createNotification,

    // Get notification stats
    getStats: (callback) => {
        db.all(`
            SELECT
                priority,
                type,
                COUNT(*) as count,
                COUNT(CASE WHEN read_at IS NULL THEN 1 END) as unread_count
            FROM notifications
            WHERE dismissed_at IS NULL
            GROUP BY priority, type
        `, callback);
    }
};

// ─── 45-Day Renewal Email System ─────────────────────────────────────────────

// TESTING: all renewal emails go to this address only — no client emails
const RENEWAL_TEST_EMAIL = 'grant@vigagency.com';

// Create tracking table so we never send the same 45-day email twice
db.run(`CREATE TABLE IF NOT EXISTS renewal_emails_sent (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    policy_id TEXT NOT NULL,
    client_id TEXT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(policy_id)
)`, (err) => {
    if (err) console.error('Error creating renewal_emails_sent table:', err.message);
    else console.log('✅ renewal_emails_sent table ready');
});

const nodemailer = require('nodemailer');

function decodBodyType(code) {
    const map = { TKTR:'Tractor', DMPT:'Dump Truck', STRK:'Straight Truck', VAN:'Van', TANK:'Tanker', TRLR:'Trailer', PICK:'Pickup', FLAT:'Flatbed', REFR:'Refrigerated', DUMP:'Dump' };
    return map[code] || code || '';
}

function buildRenewalEmailHTML(clientData, policyData, agencyName) {
    const biz = clientData.businessName || clientData.name || 'Your Business';
    const contact = clientData.name || biz;
    const carrier = policyData.carrier || 'your carrier';
    const policyNum = (policyData.policyNumber || '').trim();
    const expDate = policyData.expirationDate || 'N/A';
    const effDate = policyData.effectiveDate || 'N/A';
    const premium = policyData.premium || 'N/A';
    const dot = policyData.dotNumber || clientData.dotNumber || '';
    const mc = policyData.mcNumber || clientData.mcNumber || '';
    const addr = [clientData.address, clientData.city, clientData.state, clientData.zip].filter(Boolean).join(', ');

    const brandColor = agencyName === 'UIG Agency' ? '#7c3aed' : '#1d4ed8';
    const brandName = agencyName || 'VIG Agency';

    // Vehicles table
    const vehicles = policyData.vehicles || [];
    let vehicleRows = vehicles.map((v, i) => `
        <tr style="background:${i%2===0?'#f9fafb':'white'};">
            <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;">${v.vehicleNumber||i+1}</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;">${v.year||''}</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;">${v.make||''}</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;">${v.model||''}</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;font-family:monospace;font-size:12px;">${v.vin||''}</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;">${decodBodyType(v.bodyType)}</td>
        </tr>`).join('');

    // Drivers table
    const drivers = policyData.drivers || [];
    let driverRows = drivers.map((d, i) => `
        <tr style="background:${i%2===0?'#f9fafb':'white'};">
            <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;">${d.driverNumber||i+1}</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;font-weight:600;">${d.name||''}</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;">${d.dateOfBirth||''}</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;font-family:monospace;">${d.license||''}</td>
        </tr>`).join('');

    return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
<div style="max-width:680px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,${brandColor},#3b82f6);padding:32px 36px;text-align:center;">
    <h1 style="margin:0;color:white;font-size:26px;font-weight:700;">${brandName}</h1>
    <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">Policy Renewal Notice — 45 Days Out</p>
  </div>

  <!-- Body -->
  <div style="padding:32px 36px;">
    <p style="font-size:16px;color:#1f2937;margin:0 0 12px;">Hi <strong>${contact}</strong>,</p>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 20px;">
      Your commercial insurance policy through <strong>${carrier}</strong> is coming up for renewal on <strong>${expDate}</strong> — that's just 45 days away.
      We're actively shopping the market right now to make sure you get the most competitive rates available.
    </p>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 24px;">
      Below is what we have on file for your current operation. <strong>Please review everything and reply to let us know if anything has changed</strong> — any new or removed vehicles, driver updates, address changes, etc. The more current your info, the better rates we can get you.
    </p>

    <!-- Policy Summary -->
    <div style="background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:10px;padding:20px;margin-bottom:28px;">
      <h3 style="margin:0 0 14px;color:${brandColor};font-size:16px;">Current Policy Summary</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:5px 0;color:#6b7280;font-size:13px;width:40%;">Carrier</td><td style="padding:5px 0;font-weight:600;color:#1f2937;font-size:14px;">${carrier}</td></tr>
        <tr><td style="padding:5px 0;color:#6b7280;font-size:13px;">Policy Number</td><td style="padding:5px 0;font-weight:600;color:#1f2937;font-size:14px;">${policyNum}</td></tr>
        <tr><td style="padding:5px 0;color:#6b7280;font-size:13px;">Effective Date</td><td style="padding:5px 0;color:#1f2937;font-size:14px;">${effDate}</td></tr>
        <tr><td style="padding:5px 0;color:#6b7280;font-size:13px;">Expiration Date</td><td style="padding:5px 0;font-weight:700;color:#dc2626;font-size:14px;">${expDate}</td></tr>
        <tr><td style="padding:5px 0;color:#6b7280;font-size:13px;">Annual Premium</td><td style="padding:5px 0;font-weight:600;color:#059669;font-size:14px;">${premium}</td></tr>
        ${dot ? `<tr><td style="padding:5px 0;color:#6b7280;font-size:13px;">USDOT</td><td style="padding:5px 0;color:#1f2937;font-size:14px;">${dot}</td></tr>` : ''}
        ${mc ? `<tr><td style="padding:5px 0;color:#6b7280;font-size:13px;">MC Number</td><td style="padding:5px 0;color:#1f2937;font-size:14px;">${mc}</td></tr>` : ''}
      </table>
    </div>

    <!-- Contact Info -->
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px;margin-bottom:28px;">
      <h3 style="margin:0 0 12px;color:#374151;font-size:15px;">Insured Information</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:4px 0;color:#6b7280;font-size:13px;width:40%;">Business Name</td><td style="padding:4px 0;font-weight:600;color:#1f2937;font-size:13px;">${biz}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;font-size:13px;">Contact Name</td><td style="padding:4px 0;color:#1f2937;font-size:13px;">${contact}</td></tr>
        ${addr ? `<tr><td style="padding:4px 0;color:#6b7280;font-size:13px;">Address</td><td style="padding:4px 0;color:#1f2937;font-size:13px;">${addr}</td></tr>` : ''}
        ${clientData.phone ? `<tr><td style="padding:4px 0;color:#6b7280;font-size:13px;">Phone</td><td style="padding:4px 0;color:#1f2937;font-size:13px;">${clientData.phone}</td></tr>` : ''}
        ${clientData.email ? `<tr><td style="padding:4px 0;color:#6b7280;font-size:13px;">Email</td><td style="padding:4px 0;color:#1f2937;font-size:13px;">${clientData.email}</td></tr>` : ''}
      </table>
    </div>

    <!-- Vehicles -->
    ${vehicles.length > 0 ? `
    <h3 style="color:#374151;font-size:15px;margin:0 0 10px;">Scheduled Vehicles (${vehicles.length})</h3>
    <div style="overflow-x:auto;margin-bottom:28px;">
      <table style="width:100%;border-collapse:collapse;min-width:500px;">
        <thead>
          <tr style="background:${brandColor};color:white;">
            <th style="padding:10px 12px;text-align:left;font-size:12px;">#</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px;">Year</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px;">Make</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px;">Model</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px;">VIN</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px;">Type</th>
          </tr>
        </thead>
        <tbody>${vehicleRows}</tbody>
      </table>
    </div>` : ''}

    <!-- Drivers -->
    ${drivers.length > 0 ? `
    <h3 style="color:#374151;font-size:15px;margin:0 0 10px;">Scheduled Drivers (${drivers.length})</h3>
    <div style="overflow-x:auto;margin-bottom:28px;">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#374151;color:white;">
            <th style="padding:10px 12px;text-align:left;font-size:12px;">#</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px;">Name</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px;">Date of Birth</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px;">License #</th>
          </tr>
        </thead>
        <tbody>${driverRows}</tbody>
      </table>
    </div>` : ''}

    <!-- CTA -->
    <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;padding:20px;margin-bottom:24px;">
      <p style="margin:0;font-size:15px;color:#166534;font-weight:600;">Any changes to the above?</p>
      <p style="margin:8px 0 0;font-size:14px;color:#15803d;line-height:1.6;">
        Reply to this email with any updates — new vehicles, removed vehicles, new drivers, address changes, or anything else. We'll have renewal quotes ready for you well before your expiration date.
      </p>
    </div>
  </div>

  <!-- Footer -->
  <div style="background:#1f2937;padding:20px 36px;text-align:center;">
    <p style="margin:0;color:#9ca3af;font-size:12px;">${brandName} &nbsp;|&nbsp; contact@${agencyName === 'UIG Agency' ? 'uig' : 'vig'}agency.com</p>
    <p style="margin:6px 0 0;color:#6b7280;font-size:11px;">This is an automated renewal notice sent 45 days before policy expiration.</p>
  </div>

</div>
</body>
</html>`;
}

async function sendRenewalEmailForPolicy(policyRow, clientData, forceTest) {
    const policyData = JSON.parse(policyRow.data || '{}');
    const policies = policyData.policies || [policyData];
    const pol = policies[0];
    if (!pol) return;

    const agent = (pol.agent || clientData.assignedTo || '').toLowerCase();
    const isUIG = agent === 'maureen';
    const agencyName = isUIG ? 'UIG Agency' : 'VIG Agency';
    const fromEmail = isUIG ? 'contact@uigagency.com' : 'contact@vigagency.com';
    const fromPass  = isUIG ? process.env.GODADDY_UIG_PASSWORD : process.env.GODADDY_VIG_PASSWORD;

    const transporter = nodemailer.createTransport({
        host: 'smtpout.secureserver.net',
        port: 465,
        secure: true,
        auth: { user: fromEmail, pass: fromPass }
    });

    const biz = clientData.businessName || clientData.name || 'Client';
    const subject = `Policy Renewal in 45 Days — ${biz} (${pol.carrier || ''} #${(pol.policyNumber||'').trim()})`;
    const html = buildRenewalEmailHTML(clientData, pol, agencyName);

    // TESTING: Always send to grant@vigagency.com, never to client
    const toEmail = RENEWAL_TEST_EMAIL;

    try {
        const info = await transporter.sendMail({ from: `"${agencyName}" <${fromEmail}>`, to: toEmail, subject, html });
        console.log(`✅ 45-day renewal email sent for ${biz} → ${toEmail} (${info.messageId})`);

        if (!forceTest) {
            // Mark as sent so we don't duplicate
            db.run(`INSERT OR IGNORE INTO renewal_emails_sent (policy_id, client_id) VALUES (?, ?)`,
                [policyRow.id, policyRow.client_id]);
        }
        return { success: true, messageId: info.messageId, to: toEmail, business: biz };
    } catch (err) {
        console.error(`❌ Failed to send renewal email for ${biz}:`, err.message);
        return { success: false, error: err.message };
    }
}

let _lastRenewalCheckDate = '';

async function checkUpcomingRenewals() {
    const today = new Date().toISOString().slice(0, 10);
    if (_lastRenewalCheckDate === today) return; // already ran today
    _lastRenewalCheckDate = today;

    console.log('🔄 Checking for policies expiring in 45 days...');

    const target = new Date();
    target.setDate(target.getDate() + 45);
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    const yyyy = target.getFullYear();
    const targetDateStr = `${mm}/${dd}/${yyyy}`; // MM/DD/YYYY format used in policy data

    db.all(`SELECT p.id, p.client_id, p.data FROM policies p
            LEFT JOIN renewal_emails_sent r ON r.policy_id = p.id
            WHERE r.id IS NULL
            AND json_extract(p.data, '$.policies[0].policyStatus') != 'Cancelled'
            AND json_extract(p.data, '$.policies[0].expirationDate') = ?`,
        [targetDateStr],
        async (err, rows) => {
            if (err) { console.error('Error querying renewal policies:', err.message); return; }
            console.log(`📋 Found ${rows.length} policies expiring on ${targetDateStr} (45 days from today)`);

            for (const row of rows) {
                // Look up client
                db.get(`SELECT id, data FROM clients WHERE id = ?`, [row.client_id], async (cerr, clientRow) => {
                    if (cerr || !clientRow) {
                        console.warn(`⚠️ No client found for policy ${row.id} (client_id: ${row.client_id})`);
                        return;
                    }
                    let clientData = {};
                    try { clientData = JSON.parse(clientRow.data); } catch(e) {}
                    await sendRenewalEmailForPolicy(row, clientData, false);
                });
            }
        }
    );
}

// Export manual trigger for use by server.js API
global._triggerRenewalEmailForPolicy = sendRenewalEmailForPolicy;
global._getDB = () => db;

// Start the monitoring service
console.log('⏰ Starting periodic callback monitoring...');
setInterval(checkCallbacks, CHECK_INTERVAL);

// Check renewals every hour (actually sends once per day via date guard)
setInterval(checkUpcomingRenewals, 60 * 60 * 1000);
setTimeout(checkUpcomingRenewals, 10000); // First check 10s after startup

// Cleanup old notifications every hour
setInterval(cleanupOldNotifications, 60 * 60 * 1000);

// Initial check
setTimeout(checkCallbacks, 5000); // Start after 5 seconds

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down notification service...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('✅ Database connection closed');
        }
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    db.close();
    process.exit(0);
});

// Export for use as module
module.exports = NotificationService;

console.log('✅ Notification service initialized and running');