// Quick SIP Setup Script
// This saves the SIP configuration to localStorage so it's ready for use

console.log('🔧 Setting up SIP configuration...');

const sipConfig = {
    username: 'Grant',
    password: 'REDACTED',
    domain: 'vanguard1.sip.twilio.com',
    proxy: 'sip.twilio.com',
    callerId: '+13306369079'
};

// Save to localStorage
localStorage.setItem('sipConfig', JSON.stringify(sipConfig));

console.log('✅ SIP configuration saved!');
console.log('📋 Configuration:');
console.log(`   Username: ${sipConfig.username}`);
console.log(`   Domain: ${sipConfig.domain}`);
console.log(`   Caller ID: ${sipConfig.callerId}`);
console.log('');
console.log('🎯 Next steps:');
console.log('1. Open the phone tool');
console.log('2. Go to the SIP tab');
console.log('3. Click "Test Connection" to register with the SIP server');
console.log('4. Once registered, you can make calls from the dialer');
console.log('');
console.log('💡 The dialer should now show "SIP Calling Enabled" instead of needing configuration.');

// Also trigger a page refresh of the phone tool if it's open
if (typeof window.showPhoneTab === 'function') {
    // Find any phone windows that might be open
    const phoneWindows = document.querySelectorAll('[id*="tool-window-"');
    phoneWindows.forEach(win => {
        if (win.innerHTML.includes('Phone -')) {
            console.log('🔄 Refreshing phone tool display...');
            // Trigger a refresh of the phone tool content
            const phoneId = win.id.replace('tool-window-', '');
            if (phoneId) {
                setTimeout(() => {
                    window.showPhoneTab(phoneId, 'dialer');
                }, 500);
            }
        }
    });
}