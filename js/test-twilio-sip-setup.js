// Test Twilio SIP Setup - Verify actual domain and credentials
console.log('🧪 Testing Twilio SIP setup...');

async function testTwilioSIPSetup() {
    console.log('=== TWILIO SIP CONFIGURATION TEST ===\n');

    const config = JSON.parse(localStorage.getItem('sipConfig') || '{}');

    console.log('📋 Current Configuration:');
    console.log(`  Username: ${config.username || 'Not set'}`);
    console.log(`  Domain: ${config.domain || 'Not set'}`);
    console.log(`  Proxy: ${config.proxy || 'Not set'}`);
    console.log(`  Caller ID: ${config.callerId || 'Not set'}`);
    console.log(`  Has Password: ${!!config.password}`);
    console.log('');

    // Test 1: Domain validation
    console.log('🔍 TEST 1: Domain Validation');
    if (!config.domain) {
        console.log('❌ No SIP domain configured');
        return false;
    }

    if (!config.domain.includes('.sip.twilio.com')) {
        console.log('⚠️ Domain does not follow Twilio SIP format');
        console.log('   Expected format: yourname.sip.twilio.com');
    } else {
        console.log('✅ Domain format looks correct');
    }

    // Test 2: Credentials validation
    console.log('\n🔍 TEST 2: Credentials Validation');
    if (!config.username || !config.password) {
        console.log('❌ Missing username or password');
        return false;
    }

    if (config.username === 'Grant' && config.password === 'REDACTED') {
        console.log('⚠️ Using example credentials - these may not be real');
        console.log('   For real SIP calling, you need actual Twilio SIP credentials');
    } else {
        console.log('✅ Credentials appear to be customized');
    }

    // Test 3: WebSocket connectivity
    console.log('\n🔍 TEST 3: WebSocket Connectivity');
    const domains = [config.domain];

    // Also test common alternatives
    if (config.domain === 'vanguard1.sip.twilio.com') {
        domains.push('vanguard1.sip.us1.twilio.com');
    }

    let workingDomain = null;
    for (const domain of domains) {
        console.log(`Testing ${domain}...`);

        try {
            const isReachable = await testWebSocketConnection(domain);
            if (isReachable) {
                console.log(`✅ ${domain}: WebSocket connection successful`);
                workingDomain = domain;
                break;
            } else {
                console.log(`❌ ${domain}: WebSocket connection failed`);
            }
        } catch (error) {
            console.log(`❌ ${domain}: ${error.message}`);
        }
    }

    if (!workingDomain) {
        console.log('\n❌ No working Twilio SIP domains found');
        console.log('\n💡 POSSIBLE SOLUTIONS:');
        console.log('1. Check if the SIP domain exists in your Twilio Console');
        console.log('2. Verify your Twilio account has SIP enabled');
        console.log('3. Try alternative domain: vanguard1.sip.us1.twilio.com');
        console.log('4. Use Twilio Voice API instead of direct SIP');
        return false;
    }

    // Test 4: SIP Registration (if JsSIP available)
    if (typeof JsSIP !== 'undefined') {
        console.log('\n🔍 TEST 4: SIP Registration Test');

        try {
            const registrationWorked = await testSIPRegistration(workingDomain, config);
            if (registrationWorked) {
                console.log('✅ SIP registration successful!');
                console.log('🎉 Twilio SIP is working correctly');
                return true;
            } else {
                console.log('❌ SIP registration failed');
            }
        } catch (error) {
            console.log(`❌ SIP registration error: ${error.message}`);
        }
    } else {
        console.log('\n⚠️ TEST 4 SKIPPED: JsSIP library not loaded');
    }

    console.log('\n=== TEST SUMMARY ===');
    console.log('📞 WebSocket connection: ' + (workingDomain ? '✅ Working' : '❌ Failed'));
    console.log('🔐 SIP registration: ❌ Failed (check credentials)');
    console.log('\n💡 RECOMMENDATION: Use Twilio Voice API instead of direct SIP');

    return false;
}

function testWebSocketConnection(domain) {
    return new Promise((resolve) => {
        const wsUrl = `wss://${domain}:443`;
        const ws = new WebSocket(wsUrl);

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

        ws.onclose = () => {
            clearTimeout(timeout);
            resolve(false);
        };
    });
}

function testSIPRegistration(domain, config) {
    return new Promise((resolve) => {
        try {
            const socket = new JsSIP.WebSocketInterface(`wss://${domain}:443`);

            const sipConfig = {
                sockets: [socket],
                uri: `sip:${config.username}@${domain}`,
                password: config.password,
                display_name: config.username,
                register: true,
                register_expires: 30,
                session_timers: false,
                use_preloaded_route: false,
                authorization_user: config.username
            };

            const ua = new JsSIP.UA(sipConfig);
            let resolved = false;

            ua.on('registered', () => {
                if (!resolved) {
                    resolved = true;
                    ua.stop();
                    resolve(true);
                }
            });

            ua.on('registrationFailed', (event) => {
                if (!resolved) {
                    resolved = true;
                    console.log(`Registration failed: ${event.cause}`);

                    if (event.cause === 'Forbidden') {
                        console.log('🚨 Invalid credentials - username/password incorrect');
                    } else if (event.cause === 'Request Timeout') {
                        console.log('🚨 Domain not responding - may not exist');
                    }

                    ua.stop();
                    resolve(false);
                }
            });

            ua.on('disconnected', () => {
                if (!resolved) {
                    resolved = true;
                    resolve(false);
                }
            });

            ua.start();

            // Timeout after 10 seconds
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    ua.stop();
                    resolve(false);
                }
            }, 10000);

        } catch (error) {
            console.error('SIP test error:', error);
            resolve(false);
        }
    });
}

// Auto-run test if in debug mode
if (window.location.search.includes('test-sip') || window.location.hash.includes('test-sip')) {
    setTimeout(testTwilioSIPSetup, 2000);
}

// Make available globally
window.testTwilioSIPSetup = testTwilioSIPSetup;

console.log('🧪 Twilio SIP test ready');
console.log('💡 Run testTwilioSIPSetup() to test your configuration');