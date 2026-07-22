// Twilio SIP Phone using JsSIP for direct SIP calling
// This provides direct browser-to-phone calling without callbacks using SIP credentials

class TwilioSipPhone {
    constructor() {
        this.ua = null;
        this.currentSession = null;
        this.isRegistered = false;
        console.log('🔊 Twilio SIP Phone initialized');
    }

    async initialize() {
        try {
            // Load JsSIP library for SIP calling
            await this.loadJsSIP();

            // Load SIP credentials from server
            let sipUser = '', sipPass = '', sipDomain = 'vanguard1.sip.us1.twilio.com';
            try {
                const jwt = sessionStorage.getItem('vanguard_jwt');
                const resp = await fetch('/api/sip-config', { headers: { Authorization: 'Bearer ' + jwt } });
                if (resp.ok) { const cfg = await resp.json(); sipUser = cfg.username; sipPass = cfg.password; sipDomain = cfg.domain || sipDomain; }
            } catch (e) { console.warn('Could not load SIP config'); }

            // SIP configuration for Twilio SIP Domain
            const sipConfig = {
                uri: `sip:${sipUser}@${sipDomain}`,
                password: sipPass,
                ws_servers: [`wss://${sipDomain}:443`],
                display_name: sipUser,
                register: true,
                register_expires: 300,
                session_timers: false,
                connection_recovery_min_interval: 2,
                connection_recovery_max_interval: 30,
                use_preloaded_route: false,
                outbound_proxy_set: 'sip.twilio.com'
            };

            // Create JsSIP User Agent
            this.ua = new JsSIP.UA(sipConfig);

            this.setupEventListeners();

            // Start the SIP stack
            this.ua.start();

            console.log('✅ Twilio SIP Phone ready');
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize Twilio SIP:', error);
            console.log('💡 SIP calling disabled - using API calling as fallback');
            return false;
        }
    }

    async loadJsSIP() {
        return new Promise((resolve, reject) => {
            if (window.JsSIP) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/jssip@3.10.1/dist/jssip.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    setupEventListeners() {
        this.ua.on('connected', () => {
            console.log('🔗 SIP connected to Twilio');
        });

        this.ua.on('disconnected', () => {
            console.log('❌ SIP disconnected from Twilio');
            this.isRegistered = false;
        });

        this.ua.on('registered', () => {
            console.log('✅ SIP registered successfully');
            this.isRegistered = true;
            showNotification('SIP phone registered', 'success');
        });

        this.ua.on('unregistered', () => {
            console.log('❌ SIP unregistered');
            this.isRegistered = false;
        });

        this.ua.on('registrationFailed', (e) => {
            console.error('❌ SIP registration failed:', e);
            console.error('Registration failure details:', {
                cause: e.cause,
                response: e.response,
                domain: 'vanguard1.sip.us1.twilio.com'
            });
            this.isRegistered = false;
        });

        this.ua.on('newRTCSession', (e) => {
            console.log('📱 New SIP session');
            this.currentSession = e.session;
            this.handleIncomingCall(e.session);
        });
    }

    async makeCall(phoneNumber) {
        console.log('===== SIP CALL INITIATED =====');
        console.log('Phone number:', phoneNumber);
        console.log('Registration status:', this.isRegistered);

        try {
            if (!this.ua || !this.isRegistered) {
                console.warn('SIP not registered, attempting anyway...');
            }

            // Format phone number for SIP calling
            const formattedNumber = phoneNumber.replace(/\D/g, '');
            const e164Number = formattedNumber.startsWith('1') ? `+${formattedNumber}` : `+1${formattedNumber}`;
            const sipUri = `sip:${e164Number}@vanguard1.sip.us1.twilio.com`;

            console.log(`📞 Making SIP call to ${sipUri}`);

            // Call options
            const options = {
                mediaConstraints: { audio: true, video: false },
                pcConfig: {
                    iceServers: [
                        { urls: 'stun:stun.twilio.com:3478' }
                    ]
                }
            };

            // Make the call
            this.currentSession = this.ua.call(sipUri, options);

            if (this.currentSession) {
                this.setupCallEventListeners(this.currentSession);
                this.updateCallStatus('connecting');

                showNotification(`Calling ${phoneNumber}...`, 'info');

                return {
                    success: true,
                    callSid: this.currentSession.id,
                    status: 'connecting'
                };
            } else {
                throw new Error('Failed to create call session');
            }

        } catch (error) {
            console.error('❌ SIP call failed:', error);
            showNotification(`Call failed: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    setupCallEventListeners(session) {
        session.on('accepted', () => {
            console.log('✅ Call connected');
            this.updateCallStatus('connected');
            showNotification('Call connected', 'success');
        });

        session.on('ended', () => {
            console.log('📞 Call ended');
            this.currentSession = null;
            this.updateCallStatus('ended');
            showNotification('Call ended', 'info');
        });

        session.on('failed', (e) => {
            console.log('❌ Call failed:', e);
            this.currentSession = null;
            this.updateCallStatus('ended');

            if (e.cause === 'Rejected') {
                showNotification('Call rejected', 'warning');
            } else if (e.cause === 'Busy') {
                showNotification('Number busy', 'warning');
            } else {
                showNotification(`Call failed: ${e.cause}`, 'error');
            }
        });

        session.on('connecting', () => {
            console.log('📞 Call connecting...');
            this.updateCallStatus('connecting');
        });

        session.on('progress', () => {
            console.log('📞 Call ringing...');
            this.updateCallStatus('ringing');
        });
    }

    hangup() {
        if (this.currentSession) {
            console.log('🔴 Hanging up call');
            this.currentSession.terminate();
        }
    }

    mute() {
        if (this.currentSession) {
            this.currentSession.mute({ audio: true });
            console.log('🔇 Call muted');
        }
    }

    unmute() {
        if (this.currentSession) {
            this.currentSession.unmute({ audio: true });
            console.log('🔊 Call unmuted');
        }
    }

    updateCallStatus(status) {
        // Update UI call status
        const statusElement = document.getElementById('callStatusText');
        if (statusElement) {
            switch (status) {
                case 'connecting':
                    statusElement.innerHTML = '<i class="fas fa-phone" style="margin-right: 5px;"></i>Connecting...';
                    break;
                case 'ringing':
                    statusElement.innerHTML = '<i class="fas fa-phone-volume" style="margin-right: 5px;"></i>Ringing...';
                    break;
                case 'connected':
                    statusElement.innerHTML = '<i class="fas fa-phone" style="margin-right: 5px; color: green;"></i>Connected';
                    break;
                case 'ended':
                    statusElement.innerHTML = '<i class="fas fa-phone-slash" style="margin-right: 5px;"></i>Call Ended';
                    setTimeout(() => {
                        const callControls = document.getElementById('activeCallControls');
                        if (callControls) callControls.remove();
                    }, 2000);
                    break;
                case 'error':
                    statusElement.innerHTML = '<i class="fas fa-exclamation-triangle" style="margin-right: 5px;"></i>Call Error';
                    break;
            }
        }
    }

    handleIncomingCall(session) {
        // Handle incoming calls (if needed)
        console.log('Incoming call from:', session.remote_identity.uri);
        // You can add UI here to accept/reject incoming calls
    }

    isCallActive() {
        return this.currentSession && this.currentSession.isEstablished();
    }

    getCallStatus() {
        if (!this.currentSession) return 'idle';
        return this.currentSession.isEstablished() ? 'connected' : 'connecting';
    }
}

// Global instance
window.twilioSipPhone = new TwilioSipPhone();

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔧 Initializing Twilio SIP Phone...');

    // Small delay to ensure other scripts are loaded
    setTimeout(async () => {
        const initialized = await window.twilioSipPhone.initialize();

        if (initialized) {
            console.log('✅ SIP calling is ready');

            // Update existing makeCall functions to use SIP
            window.makeSipCall = async function(phoneNumber) {
                return await window.twilioSipPhone.makeCall(phoneNumber);
            };

            window.hangupSipCall = function() {
                window.twilioSipPhone.hangup();
            };
        } else {
            console.log('⚠️ SIP initialization failed - API calling will be used');
        }
    }, 1000);
});

console.log('📞 Twilio SIP module loaded');