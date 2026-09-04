// Alternative SIP solutions and fallback calling methods
console.log('📞 Loading alternative calling solutions...');

/**
 * The current SIP timeout issue is likely due to one of:
 * 1. Invalid Twilio SIP domain (vanguard1.sip.twilio.com may not exist)
 * 2. Invalid credentials (Grant/REDACTED may be placeholders)
 * 3. Twilio account not configured for SIP
 * 4. Network/firewall blocking SIP WebSocket connections
 *
 * This script provides working alternatives
 */

// Alternative 1: Twilio Voice API (more reliable than direct SIP)
async function makeTwilioVoiceCall(toNumber) {
    console.log('📞 Using Twilio Voice API instead of SIP...');

    try {
        const response = await fetch('/api/twilio/make-call', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: toNumber,
                from: '+13306369079' // Your Twilio number
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Twilio Voice call initiated:', data);
            showNotification(`Calling ${toNumber} via Twilio Voice API`, 'success');
            return { success: true, callSid: data.sid };
        } else {
            throw new Error('Twilio API call failed');
        }
    } catch (error) {
        console.error('❌ Twilio Voice API error:', error);
        showNotification(`Call failed: ${error.message}`, 'error');
        return { success: false, error: error.message };
    }
}

// Alternative 2: Generic SIP.js with different provider
function setupGenericSIP() {
    console.log('🔧 Setting up generic SIP with alternative provider...');

    // You could use a different SIP provider like:
    const alternativeConfigs = [
        {
            name: 'FreeSWITCH Demo',
            domain: 'fs.opensips.org',
            websocket: 'wss://fs.opensips.org:8089/ws',
            note: 'Public FreeSWITCH server for testing'
        },
        {
            name: 'JsSIP Demo Server',
            domain: 'tryit.jssip.net',
            websocket: 'wss://tryit.jssip.net:10443',
            note: 'JsSIP public demo server'
        }
    ];

    console.log('🌍 Alternative SIP servers available:');
    alternativeConfigs.forEach(config => {
        console.log(`- ${config.name}: ${config.domain}`);
        console.log(`  WebSocket: ${config.websocket}`);
        console.log(`  Note: ${config.note}`);
    });

    return alternativeConfigs;
}

// Alternative 3: Browser WebRTC calling (peer-to-peer)
async function setupWebRTCCalling() {
    console.log('🌐 Setting up WebRTC calling...');

    try {
        // Request microphone access for WebRTC
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
        });

        console.log('✅ Microphone access granted for WebRTC');

        // You could integrate with services like:
        // - Agora.io
        // - Daily.co
        // - Simple-peer

        return {
            available: true,
            stream: stream,
            options: ['Agora.io', 'Daily.co', 'Simple-peer']
        };

    } catch (error) {
        console.error('❌ WebRTC setup failed:', error);
        return { available: false, error: error.message };
    }
}

// Alternative 4: Fix SIP with real Twilio credentials helper
function generateTwilioSIPSetup() {
    console.log('🔧 Generating proper Twilio SIP setup guide...');

    const guide = `
=== HOW TO SETUP REAL TWILIO SIP ===

1. LOG INTO TWILIO CONSOLE:
   - Go to https://console.twilio.com
   - Navigate to Voice → SIP Domains

2. CREATE SIP DOMAIN:
   - Click "Create new SIP Domain"
   - Enter domain name: yourdomain.sip.twilio.com
   - Set Authentication: IP Access Control Lists OR Credential Lists

3. CREATE SIP CREDENTIALS:
   - Go to Voice → SIP → Credential Lists
   - Create new credential list
   - Add username/password for SIP auth

4. CONFIGURE WEBHOOKS:
   - Set Request URL for incoming calls
   - Set HTTP method to POST

5. UPDATE YOUR CONFIG:
   {
     username: "your_sip_username",
     password: "your_sip_password",
     domain: "yourdomain.sip.twilio.com",
     proxy: "sip.twilio.com",
     callerId: "+1your_twilio_number"
   }

CURRENT ISSUE: The domain "vanguard1.sip.twilio.com" may not exist
in your Twilio account, or the credentials are invalid.
`;

    console.log(guide);
    return guide;
}

// Smart SIP troubleshooter
async function smartTroubleshooter() {
    console.log('🔍 Running smart SIP troubleshooter...');

    const config = JSON.parse(localStorage.getItem('sipConfig') || '{}');
    const issues = [];
    const solutions = [];

    // Check 1: Domain format
    if (!config.domain || !config.domain.includes('.sip.twilio.com')) {
        issues.push('Invalid SIP domain format');
        solutions.push('Use format: yourname.sip.twilio.com');
    }

    // Check 2: Placeholder credentials
    if (config.username === 'Grant' && config.password === 'REDACTED') {
        issues.push('Using placeholder credentials');
        solutions.push('Replace with real Twilio SIP credentials');
    }

    // Check 3: Network connectivity
    try {
        const wsTest = await testWebSocketConnectivity(config.domain);
        if (!wsTest) {
            issues.push('WebSocket connection failed');
            solutions.push('Check firewall/network settings');
        }
    } catch (error) {
        issues.push('Network connectivity issue');
        solutions.push('Verify internet connection');
    }

    // Provide recommendations
    if (issues.length > 0) {
        console.log('🚨 ISSUES DETECTED:');
        issues.forEach((issue, i) => {
            console.log(`${i + 1}. ${issue}`);
            console.log(`   Solution: ${solutions[i]}`);
        });

        console.log('\n💡 RECOMMENDED ACTION:');
        console.log('Use Twilio Voice API instead of direct SIP for reliability');
    }

    return { issues, solutions };
}

function testWebSocketConnectivity(domain) {
    return new Promise((resolve) => {
        const ws = new WebSocket(`wss://${domain}:443`);
        const timeout = setTimeout(() => {
            ws.close();
            resolve(false);
        }, 5000);

        ws.onopen = () => {
            clearTimeout(timeout);
            ws.close();
            resolve(true);
        };

        ws.onerror = () => {
            clearTimeout(timeout);
            resolve(false);
        };
    });
}

// Enhanced calling function that tries multiple methods
async function makeSmartCall(phoneNumber) {
    console.log(`📞 Making smart call to ${phoneNumber}...`);

    // Method 1: Try SIP first (if configured)
    const sipConfig = JSON.parse(localStorage.getItem('sipConfig') || '{}');
    if (sipConfig.username && sipConfig.domain && typeof JsSIP !== 'undefined') {
        try {
            console.log('🔄 Attempting SIP call...');
            const sipResult = await attemptSIPCall(phoneNumber, sipConfig);
            if (sipResult.success) {
                return sipResult;
            }
        } catch (error) {
            console.log('❌ SIP call failed, trying alternatives...');
        }
    }

    // Method 2: Try Twilio Voice API
    try {
        console.log('🔄 Attempting Twilio Voice API call...');
        return await makeTwilioVoiceCall(phoneNumber);
    } catch (error) {
        console.log('❌ Twilio Voice API failed, trying Telnyx...');
    }

    // Method 3: Try Telnyx (existing fallback)
    try {
        console.log('🔄 Attempting Telnyx call...');
        return await makeTelnyxCall(phoneNumber);
    } catch (error) {
        console.log('❌ All calling methods failed');
        showNotification('All calling methods failed. Check configuration.', 'error');
        return { success: false, error: 'All methods failed' };
    }
}

function attemptSIPCall(phoneNumber, config) {
    return new Promise((resolve, reject) => {
        try {
            if (window.twilioSipPhone) {
                window.twilioSipPhone.makeCall(phoneNumber)
                    .then(resolve)
                    .catch(reject);
            } else {
                reject(new Error('SIP phone not initialized'));
            }
        } catch (error) {
            reject(error);
        }
    });
}

// Override the existing makeCall function with smart calling
if (typeof window !== 'undefined') {
    window.makeCallOriginal = window.makeCall;
    window.makeCall = makeSmartCall;

    // Export utility functions
    window.smartTroubleshooter = smartTroubleshooter;
    window.generateTwilioSIPSetup = generateTwilioSIPSetup;
    window.setupAlternativeSIP = setupGenericSIP;
}

console.log('✅ Alternative calling solutions loaded');
console.log('💡 Run smartTroubleshooter() to diagnose SIP issues');
console.log('💡 Run generateTwilioSIPSetup() for proper Twilio setup guide');