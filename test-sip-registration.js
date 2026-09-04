// SIP Registration Test
// This tests just the SIP registration without making a call

console.log('🧪 Testing SIP Registration...');
console.log('================================');

// Use the saved config
const sipConfig = JSON.parse(localStorage.getItem('sipConfig') || '{}');

if (!sipConfig.username) {
    console.error('❌ No SIP configuration found in localStorage');
    console.log('💡 Run the quick setup first:');
    console.log(`
        const sipConfig = {
            username: 'Grant',
            password: 'REDACTED',
            domain: 'vanguard1.sip.twilio.com',
            proxy: 'sip.twilio.com',
            callerId: '+13306369079'
        };
        localStorage.setItem('sipConfig', JSON.stringify(sipConfig));
    `);
} else {
    console.log('✅ SIP config found:', {
        username: sipConfig.username,
        domain: sipConfig.domain,
        proxy: sipConfig.proxy
    });

    if (typeof JsSIP === 'undefined') {
        console.error('❌ JsSIP library not loaded');
    } else {
        console.log('✅ JsSIP library available:', JsSIP.version || 'unknown version');

        // Test SIP registration
        const workingDomain = sipConfig.domain;
        console.log(`🔗 Testing connection to: wss://${workingDomain}:443`);

        const testConfig = {
            uri: `sip:${sipConfig.username}@${workingDomain}`,
            password: sipConfig.password,
            ws_servers: [`wss://${workingDomain}:443`],
            display_name: sipConfig.username,
            register: true,
            register_expires: 600,
            session_timers: false,
            connection_recovery_min_interval: 2,
            connection_recovery_max_interval: 30,
            use_preloaded_route: false,
            authorization_user: sipConfig.username
        };

        if (sipConfig.proxy) {
            testConfig.outbound_proxy_set = `sip:${sipConfig.proxy};transport=ws`;
        }

        console.log('🚀 Creating SIP User Agent...');
        const testClient = new JsSIP.UA(testConfig);

        testClient.on('connecting', () => {
            console.log('🔗 SIP connecting to WebSocket...');
        });

        testClient.on('connected', () => {
            console.log('✅ SIP WebSocket connected successfully!');
        });

        testClient.on('disconnected', () => {
            console.log('❌ SIP WebSocket disconnected');
        });

        testClient.on('registered', () => {
            console.log('🎉 SIP REGISTRATION SUCCESSFUL!');
            console.log(`📋 Registered as: ${sipConfig.username}@${workingDomain}`);
            console.log('✅ SIP is ready for making calls!');

            // Test successful, clean up
            setTimeout(() => {
                testClient.stop();
                console.log('🧪 Test completed successfully');
            }, 2000);
        });

        testClient.on('unregistered', () => {
            console.log('⚠️ SIP unregistered');
        });

        testClient.on('registrationFailed', (e) => {
            console.error('❌ SIP REGISTRATION FAILED!');
            console.error('   Cause:', e.cause);
            console.error('   Status:', e.response?.status_code);
            console.error('   Reason:', e.response?.reason_phrase);

            if (e.response?.status_code === 401) {
                console.log('💡 401 = Authentication failed');
                console.log('   Check: username, password, domain');
            } else if (e.response?.status_code === 403) {
                console.log('💡 403 = Forbidden');
                console.log('   Check: account permissions, IP restrictions');
            } else if (e.response?.status_code === 404) {
                console.log('💡 404 = Not Found');
                console.log('   Check: domain name, SIP server availability');
            }
        });

        console.log('🚀 Starting SIP registration test...');
        testClient.start();

        // Set timeout
        setTimeout(() => {
            if (!testClient.isRegistered()) {
                console.warn('⏱️ Registration timeout after 15 seconds');
                console.log('🔧 Possible issues:');
                console.log('   - Network connectivity');
                console.log('   - SIP server overload');
                console.log('   - Firewall blocking WebSocket connections');
                console.log('   - Incorrect domain or credentials');
                testClient.stop();
            }
        }, 15000);
    }
}

console.log('\n📝 To run this test, copy and paste into browser console');