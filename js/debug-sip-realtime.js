// Real-time SIP debugging to identify the exact issue
console.log('🔍 Starting real-time SIP debugging...');

// Function to test SIP connectivity step by step
async function debugSIPConnection() {
    console.log('=== SIP DEBUG SESSION STARTED ===');

    const config = JSON.parse(localStorage.getItem('sipConfig') || '{}');
    console.log('📋 Current SIP Config:', {
        username: config.username,
        domain: config.domain,
        proxy: config.proxy,
        callerId: config.callerId,
        hasPassword: !!config.password
    });

    // Test 1: Basic domain connectivity
    console.log('\n🔍 TEST 1: Domain Connectivity');
    const domains = [
        'vanguard1.sip.twilio.com',
        'vanguard1.sip.us1.twilio.com',
        'vanguard1.sip.us-east-1.twilio.com'
    ];

    for (const domain of domains) {
        try {
            console.log(`Testing ${domain}...`);

            // Try to make a basic HTTPS request
            const response = await fetch(`https://${domain}`, {
                mode: 'no-cors',
                signal: AbortSignal.timeout(5000)
            });
            console.log(`✅ ${domain}: HTTPS accessible`);

        } catch (error) {
            console.log(`❌ ${domain}: ${error.message}`);
        }
    }

    // Test 2: WebSocket connectivity
    console.log('\n🔍 TEST 2: WebSocket Connectivity');
    for (const domain of domains) {
        await testWebSocketDirect(domain);
    }

    // Test 3: SIP Registration Test (if JsSIP available)
    if (typeof JsSIP !== 'undefined') {
        console.log('\n🔍 TEST 3: SIP Registration Test');
        await testSIPRegistration(config);
    } else {
        console.log('\n❌ JsSIP library not loaded');
    }

    console.log('\n=== SIP DEBUG SESSION COMPLETE ===');
}

// Direct WebSocket test
function testWebSocketDirect(domain) {
    return new Promise((resolve) => {
        const wsUrl = `wss://${domain}:443`;
        console.log(`🔗 Testing WebSocket: ${wsUrl}`);

        const ws = new WebSocket(wsUrl);
        const timeout = setTimeout(() => {
            ws.close();
            console.log(`⏰ ${domain}: WebSocket timeout (5s)`);
            resolve(false);
        }, 5000);

        ws.onopen = () => {
            clearTimeout(timeout);
            console.log(`✅ ${domain}: WebSocket connection successful`);
            ws.close();
            resolve(true);
        };

        ws.onerror = (error) => {
            clearTimeout(timeout);
            console.log(`❌ ${domain}: WebSocket error -`, error);
            resolve(false);
        };

        ws.onclose = (event) => {
            clearTimeout(timeout);
            if (event.code === 1006) {
                console.log(`❌ ${domain}: Connection refused`);
            } else {
                console.log(`🔌 ${domain}: WebSocket closed - code: ${event.code}`);
            }
            resolve(false);
        };
    });
}

// Test SIP registration with detailed logging
function testSIPRegistration(config) {
    return new Promise((resolve) => {
        console.log('🧪 Testing SIP registration...');

        const domain = config.domain || 'vanguard1.sip.us1.twilio.com';
        const socket = new JsSIP.WebSocketInterface(`wss://${domain}:443`);

        const sipConfig = {
            sockets: [socket],
            uri: `sip:${config.username}@${domain}`,
            password: config.password,
            display_name: config.username,
            register: true,
            register_expires: 30,
            session_timers: false
        };

        console.log('📞 Creating SIP UA with config:', {
            uri: sipConfig.uri,
            domain: domain,
            register: sipConfig.register,
            hasPassword: !!sipConfig.password
        });

        const ua = new JsSIP.UA(sipConfig);
        let resolved = false;

        // Connection events
        ua.on('connecting', () => {
            console.log('🔄 SIP UA: Connecting to server...');
        });

        ua.on('connected', () => {
            console.log('✅ SIP UA: Connected to WebSocket server');
        });

        ua.on('disconnected', () => {
            console.log('❌ SIP UA: Disconnected from server');
            if (!resolved) {
                resolved = true;
                resolve(false);
            }
        });

        // Registration events
        ua.on('registered', () => {
            console.log('✅ SIP UA: Successfully registered!');
            if (!resolved) {
                resolved = true;
                ua.stop();
                resolve(true);
            }
        });

        ua.on('unregistered', () => {
            console.log('📤 SIP UA: Unregistered');
        });

        ua.on('registrationFailed', (event) => {
            console.log('❌ SIP Registration Failed:', {
                cause: event.cause,
                code: event.response?.status_code,
                reason: event.response?.reason_phrase
            });

            if (event.response) {
                console.log('📋 Server Response:', {
                    status: event.response.status_code,
                    reason: event.response.reason_phrase,
                    headers: event.response.headers
                });
            }

            if (!resolved) {
                resolved = true;
                ua.stop();
                resolve(false);
            }
        });

        // Start the UA
        try {
            console.log('🚀 Starting SIP UA...');
            ua.start();

            // Timeout after 15 seconds
            setTimeout(() => {
                if (!resolved) {
                    console.log('⏰ SIP registration timeout (15s)');
                    ua.stop();
                    resolved = true;
                    resolve(false);
                }
            }, 15000);

        } catch (error) {
            console.error('❌ Error starting SIP UA:', error);
            if (!resolved) {
                resolved = true;
                resolve(false);
            }
        }
    });
}

// Check if we're likely dealing with an invalid Twilio account
function checkTwilioAccountStatus() {
    console.log('\n🔍 Analyzing potential Twilio account issues...');

    const config = JSON.parse(localStorage.getItem('sipConfig') || '{}');

    // Check for common issues
    const issues = [];

    if (!config.username || config.username === 'Grant') {
        issues.push('🚨 Username appears to be a placeholder - may not be a real Twilio SIP user');
    }

    if (!config.password || config.password === 'REDACTED') {
        issues.push('🚨 Password appears to be a placeholder - likely not valid Twilio credentials');
    }

    if (config.domain && config.domain.includes('vanguard1.sip')) {
        issues.push('🚨 SIP domain appears to be custom - verify this domain exists in your Twilio account');
    }

    if (issues.length > 0) {
        console.log('⚠️  POTENTIAL ISSUES FOUND:');
        issues.forEach(issue => console.log(issue));

        console.log('\n💡 RECOMMENDATIONS:');
        console.log('1. Verify you have a valid Twilio account with SIP enabled');
        console.log('2. Check your Twilio Console -> Voice -> SIP Domains');
        console.log('3. Ensure the SIP domain "vanguard1.sip.twilio.com" exists');
        console.log('4. Verify the username/password are correct SIP credentials');
        console.log('5. Consider using Twilio Voice API instead of direct SIP');
    } else {
        console.log('✅ Configuration appears to have valid format');
    }
}

// Export debug function globally
window.debugSIP = debugSIPConnection;
window.checkTwilioAccount = checkTwilioAccountStatus;

// Auto-run on page load if we're in debug mode
if (window.location.hash.includes('debug') || window.location.search.includes('debug')) {
    setTimeout(() => {
        debugSIPConnection();
        checkTwilioAccountStatus();
    }, 2000);
}

console.log('🛠️ SIP Debug tools loaded');
console.log('💡 Run debugSIP() to test SIP connectivity');
console.log('💡 Run checkTwilioAccount() to analyze account configuration');