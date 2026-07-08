// Fix Twilio SIP - Remove Telnyx and ensure only Twilio calling works
console.log('🔧 Fixing Twilio SIP configuration (removing Telnyx)...');

/**
 * Since you only use Twilio SIP, we need to:
 * 1. Remove all Telnyx calling code
 * 2. Fix the Twilio SIP domain and credentials
 * 3. Ensure the SIP configuration is correct
 * 4. Set up proper Twilio Voice API as fallback
 */

// Step 1: Remove Telnyx calling and replace with Twilio only
function removeTelnyxCalling() {
    console.log('🗑️ Removing Telnyx calling code...');

    // Override any Telnyx calling functions
    if (typeof window !== 'undefined') {
        window.makeTelnyxCall = function() {
            console.log('🚫 Telnyx calling disabled - using Twilio only');
            return makeTwilioCall.apply(this, arguments);
        };
    }
}

// Step 2: Setup correct Twilio SIP configuration
async function setupTwilioSIPConfig() {
    console.log('⚙️ Setting up Twilio SIP configuration...');

    // Load SIP config from server instead of hardcoding
    let correctTwilioConfig = { username: '', password: '', domain: 'vanguard1.sip.us1.twilio.com', proxy: 'sip.twilio.com', callerId: '', wsServer: '', realm: '' };
    try {
        const jwt = sessionStorage.getItem('vanguard_jwt');
        const resp = await fetch('/api/sip-config', { headers: { Authorization: 'Bearer ' + jwt } });
        if (resp.ok) {
            const cfg = await resp.json();
            correctTwilioConfig = { username: cfg.username, password: cfg.password, domain: cfg.domain || 'vanguard1.sip.us1.twilio.com', proxy: 'sip.twilio.com', callerId: cfg.callerId, wsServer: 'wss://' + (cfg.domain || 'vanguard1.sip.us1.twilio.com') + ':443', realm: cfg.domain || 'vanguard1.sip.us1.twilio.com' };
        }
    } catch (e) { console.warn('Could not load SIP config'); }

    // Save to localStorage
    localStorage.setItem('sipConfig', JSON.stringify(correctTwilioConfig));
    console.log('✅ Updated SIP config with Twilio settings');

    return correctTwilioConfig;
}

// Step 3: Test multiple Twilio SIP domains to find the working one
async function findWorkingTwilioSIPDomain() {
    console.log('🔍 Testing Twilio SIP domains...');

    const twilioSIPDomains = [
        'vanguard1.sip.us1.twilio.com',
        'vanguard1.sip.twilio.com',
        'vanguard1.sip.us-east-1.twilio.com',
        'vanguard1.sip.us-west-1.twilio.com'
    ];

    for (const domain of twilioSIPDomains) {
        console.log(`Testing ${domain}...`);

        try {
            const isReachable = await testTwilioSIPDomain(domain);
            if (isReachable) {
                console.log(`✅ Found working Twilio SIP domain: ${domain}`);

                // Update config with working domain
                const config = JSON.parse(localStorage.getItem('sipConfig') || '{}');
                config.domain = domain;
                config.wsServer = `wss://${domain}:443`;
                config.realm = domain;
                localStorage.setItem('sipConfig', JSON.stringify(config));

                return domain;
            }
        } catch (error) {
            console.log(`❌ ${domain} failed: ${error.message}`);
        }
    }

    console.log('⚠️ No working Twilio SIP domains found');
    return null;
}

function testTwilioSIPDomain(domain) {
    return new Promise((resolve) => {
        const wsUrl = `wss://${domain}:443`;
        const ws = new WebSocket(wsUrl);

        const timeout = setTimeout(() => {
            ws.close();
            resolve(false);
        }, 5000);

        ws.onopen = () => {
            clearTimeout(timeout);
            console.log(`✅ ${domain}: WebSocket connection successful`);
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

// Step 4: Enhanced Twilio SIP calling function
async function makeTwilioSIPCall(phoneNumber) {
    console.log(`📞 Making Twilio SIP call to ${phoneNumber}...`);

    const config = JSON.parse(localStorage.getItem('sipConfig') || '{}');

    if (!config.domain || !config.username) {
        throw new Error('Twilio SIP not configured');
    }

    if (typeof JsSIP === 'undefined') {
        throw new Error('JsSIP library not loaded');
    }

    return new Promise((resolve, reject) => {
        try {
            // Create WebSocket interface
            const socket = new JsSIP.WebSocketInterface(config.wsServer || `wss://${config.domain}:443`);

            // Configure JsSIP UA
            const sipConfig = {
                sockets: [socket],
                uri: `sip:${config.username}@${config.domain}`,
                password: config.password,
                display_name: config.username,
                register: true,
                register_expires: 60,
                session_timers: false,
                use_preloaded_route: false,
                authorization_user: config.username,
                realm: config.realm || config.domain
            };

            console.log('🔧 Creating Twilio SIP UA...', {
                domain: config.domain,
                username: config.username,
                wsServer: config.wsServer
            });

            const ua = new JsSIP.UA(sipConfig);

            // Set up event handlers
            ua.on('connected', () => {
                console.log('✅ Connected to Twilio SIP server');
            });

            ua.on('registered', () => {
                console.log('✅ Registered with Twilio SIP');

                // Make the call
                const formattedNumber = phoneNumber.replace(/\D/g, '');
                const e164Number = formattedNumber.startsWith('1') ? `+${formattedNumber}` : `+1${formattedNumber}`;
                const sipUri = `sip:${e164Number}@${config.domain}`;

                console.log(`📞 Calling ${sipUri}...`);

                const callOptions = {
                    mediaConstraints: { audio: true, video: false },
                    pcConfig: {
                        iceServers: [
                            { urls: 'stun:stun.twilio.com:3478' }
                        ]
                    }
                };

                const session = ua.call(sipUri, callOptions);

                if (session) {
                    session.on('accepted', () => {
                        console.log('✅ Call connected');
                        resolve({
                            success: true,
                            session: session,
                            callId: session.id
                        });
                    });

                    session.on('failed', (e) => {
                        console.error('❌ Call failed:', e.cause);
                        ua.stop();
                        reject(new Error(`Call failed: ${e.cause}`));
                    });

                    session.on('ended', () => {
                        console.log('📞 Call ended');
                        ua.stop();
                    });
                } else {
                    ua.stop();
                    reject(new Error('Failed to create call session'));
                }
            });

            ua.on('registrationFailed', (e) => {
                console.error('❌ Twilio SIP registration failed:', e.cause);
                ua.stop();

                let errorMsg = 'SIP registration failed';
                if (e.cause === 'Forbidden') {
                    errorMsg = 'Invalid Twilio SIP credentials';
                } else if (e.cause === 'Request Timeout') {
                    errorMsg = 'Twilio SIP domain unreachable';
                }

                reject(new Error(errorMsg));
            });

            ua.on('disconnected', () => {
                console.log('🔌 Disconnected from Twilio SIP');
            });

            // Start the UA
            ua.start();

            // Timeout after 15 seconds
            setTimeout(() => {
                if (ua.isRegistered() === false) {
                    ua.stop();
                    reject(new Error('Twilio SIP registration timeout'));
                }
            }, 15000);

        } catch (error) {
            console.error('❌ Twilio SIP call error:', error);
            reject(error);
        }
    });
}

// Step 5: Fallback to Twilio Voice API if SIP fails
async function makeTwilioVoiceAPICall(phoneNumber) {
    console.log(`📞 Using Twilio Voice API fallback for ${phoneNumber}...`);

    try {
        const response = await fetch('/api/twilio/make-call', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: phoneNumber,
                from: '+13306369079' // Your Twilio number
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Twilio Voice API call initiated');
            return { success: true, callSid: data.sid, method: 'voice_api' };
        } else {
            throw new Error('Twilio Voice API call failed');
        }
    } catch (error) {
        console.error('❌ Twilio Voice API error:', error);
        throw error;
    }
}

// Step 6: Smart Twilio calling that tries SIP first, then Voice API
async function makeTwilioCall(phoneNumber) {
    console.log(`📞 Making Twilio call to ${phoneNumber}...`);

    try {
        // Try SIP first
        console.log('🔄 Attempting Twilio SIP calling...');
        const sipResult = await makeTwilioSIPCall(phoneNumber);

        if (sipResult.success) {
            showNotification(`Connected via Twilio SIP to ${phoneNumber}`, 'success');
            return sipResult;
        }
    } catch (sipError) {
        console.log(`❌ Twilio SIP failed: ${sipError.message}`);
        console.log('🔄 Falling back to Twilio Voice API...');

        try {
            // Fallback to Voice API
            const voiceResult = await makeTwilioVoiceAPICall(phoneNumber);
            showNotification(`Connected via Twilio Voice API to ${phoneNumber}`, 'success');
            return voiceResult;
        } catch (voiceError) {
            console.error('❌ Both Twilio methods failed:', voiceError.message);
            showNotification(`Twilio call failed: ${voiceError.message}`, 'error');
            throw new Error(`All Twilio calling methods failed: SIP (${sipError.message}), Voice API (${voiceError.message})`);
        }
    }
}

// Step 7: Initialize everything
async function initializeTwilioOnly() {
    console.log('🚀 Initializing Twilio-only calling system...');

    // Remove Telnyx
    removeTelnyxCalling();

    // Setup Twilio SIP config
    setupTwilioSIPConfig();

    // Test and find working Twilio domain
    const workingDomain = await findWorkingTwilioSIPDomain();

    if (workingDomain) {
        console.log(`✅ Twilio SIP ready with domain: ${workingDomain}`);
    } else {
        console.log('⚠️ Twilio SIP domains not reachable, will use Voice API only');
    }

    // Override global calling function
    if (typeof window !== 'undefined') {
        window.makeCall = makeTwilioCall;
        window.makeTwilioCall = makeTwilioCall;
        window.makeTwilioSIPCall = makeTwilioSIPCall;
        window.makeTwilioVoiceAPICall = makeTwilioVoiceAPICall;

        console.log('✅ Twilio calling functions installed');
    }
}

// Auto-initialize on load
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeTwilioOnly, 1000);
    });

    // Manual initialization function
    window.initializeTwilioOnly = initializeTwilioOnly;
    window.findWorkingTwilioSIPDomain = findWorkingTwilioSIPDomain;
}

console.log('✅ Twilio-only calling system ready');
console.log('💡 Run initializeTwilioOnly() to set up Twilio calling');
console.log('💡 Run findWorkingTwilioSIPDomain() to test SIP domains');