#!/usr/bin/env node

/**
 * Notification System Test Script
 * Tests email notifications and creates sample callbacks
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const EmailService = require('./email-service');

// Database connection
const dbPath = path.join(__dirname, '../vanguard.db');
const db = new sqlite3.Database(dbPath);

// Email Configuration (same as notification service)
const emailConfig = {
    provider: 'smtp',
    smtpHost: 'smtpout.secureserver.net',
    smtpPort: 465,
    smtpSecure: true,
    smtpUser: 'contact@vigagency.com',
    smtpPass: process.env.GODADDY_VIG_PASSWORD || '',
    fromEmail: 'contact@vigagency.com'
};

const emailService = new EmailService(emailConfig);

// Test email functionality
async function testEmailService() {
    console.log('🧪 Testing Email Service...');

    try {
        const testResult = await emailService.testConnection();

        if (testResult.success) {
            console.log('✅ Email service connection successful');

            // Test callback reminder email
            const testCallbackData = {
                leadName: 'TEST COMPANY LLC',
                leadPhone: '330-123-4567',
                dateTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
                notes: 'This is a test callback reminder email'
            };

            console.log('📧 Sending test callback reminder email...');

            const emailResult = await emailService.sendCallbackReminderEmail(
                'grant@vigagency.com',
                testCallbackData
            );

            if (emailResult.success) {
                console.log('✅ Test email sent successfully:', emailResult.messageId);
            } else {
                console.error('❌ Test email failed:', emailResult.error);
            }

        } else {
            console.error('❌ Email service connection failed:', testResult.error);
        }
    } catch (error) {
        console.error('❌ Error testing email service:', error);
    }
}

// Create test callbacks for different time scenarios
function createTestCallbacks() {
    console.log('📅 Creating test callbacks...');

    const now = new Date();
    const testCallbacks = [
        {
            id: `test_immediate_${Date.now()}`,
            leadId: '1770232268749',
            dateTime: new Date(now.getTime() + 2 * 60 * 1000), // 2 minutes from now
            notes: 'Test callback - Due immediately (2 min)'
        },
        {
            id: `test_warning_${Date.now()}`,
            leadId: '1770232268749',
            dateTime: new Date(now.getTime() + 25 * 60 * 1000), // 25 minutes from now
            notes: 'Test callback - Due soon with email reminder (25 min)'
        },
        {
            id: `test_future_${Date.now()}`,
            leadId: '1770232268749',
            dateTime: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour from now
            notes: 'Test callback - Future callback (60 min)'
        }
    ];

    testCallbacks.forEach(callback => {
        db.run(
            `INSERT INTO scheduled_callbacks (callback_id, lead_id, date_time, notes, completed) VALUES (?, ?, ?, ?, 0)`,
            [callback.id, callback.leadId, callback.dateTime.toISOString(), callback.notes],
            function(err) {
                if (err) {
                    console.error(`❌ Failed to create test callback ${callback.id}:`, err);
                } else {
                    console.log(`✅ Created test callback: ${callback.notes}`);
                }
            }
        );
    });
}

// Check current notifications
function checkNotifications() {
    console.log('📋 Checking current notifications...');

    db.all(
        `SELECT type, title, message, priority, created_at FROM notifications
         WHERE dismissed_at IS NULL
         ORDER BY created_at DESC LIMIT 10`,
        (err, notifications) => {
            if (err) {
                console.error('❌ Error fetching notifications:', err);
                return;
            }

            console.log(`\n📬 Found ${notifications.length} active notifications:`);
            notifications.forEach((notif, index) => {
                console.log(`${index + 1}. [${notif.priority.toUpperCase()}] ${notif.title}`);
                console.log(`   ${notif.message}`);
                console.log(`   Created: ${notif.created_at}\n`);
            });
        }
    );
}

// Check scheduled callbacks
function checkCallbacks() {
    console.log('📅 Checking scheduled callbacks...');

    db.all(
        `SELECT callback_id, lead_id, date_time, notes, completed
         FROM scheduled_callbacks
         WHERE completed = 0
         ORDER BY date_time ASC LIMIT 10`,
        (err, callbacks) => {
            if (err) {
                console.error('❌ Error fetching callbacks:', err);
                return;
            }

            console.log(`\n📞 Found ${callbacks.length} active callbacks:`);
            callbacks.forEach((callback, index) => {
                const callbackTime = new Date(callback.date_time);
                const now = new Date();
                const minutesUntil = Math.round((callbackTime - now) / (1000 * 60));

                let status;
                if (minutesUntil < -15) status = '🔴 OVERDUE';
                else if (minutesUntil <= 0) status = '🟡 DUE NOW';
                else if (minutesUntil <= 30) status = '⚡ DUE SOON';
                else status = '⏰ FUTURE';

                console.log(`${index + 1}. ${status} ${callback.callback_id}`);
                console.log(`   Due: ${callbackTime.toLocaleString()}`);
                console.log(`   Minutes until due: ${minutesUntil}`);
                console.log(`   Notes: ${callback.notes}\n`);
            });
        }
    );
}

// Main execution
const command = process.argv[2];

switch (command) {
    case 'test-email':
        testEmailService();
        break;
    case 'create-test':
        createTestCallbacks();
        break;
    case 'check-notifications':
        checkNotifications();
        break;
    case 'check-callbacks':
        checkCallbacks();
        break;
    case 'full-test':
        console.log('🧪 Running full notification system test...\n');
        checkCallbacks();
        setTimeout(() => {
            checkNotifications();
            setTimeout(() => {
                testEmailService();
            }, 2000);
        }, 2000);
        break;
    default:
        console.log('📋 Notification System Test Commands:');
        console.log('  test-email         - Test email service connection and send test email');
        console.log('  create-test        - Create test callbacks for different scenarios');
        console.log('  check-notifications - Show current notifications');
        console.log('  check-callbacks    - Show scheduled callbacks');
        console.log('  full-test          - Run all checks');
        break;
}

// Close database connection after operation
setTimeout(() => {
    db.close();
}, 5000);