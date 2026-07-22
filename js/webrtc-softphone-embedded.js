/*
 * Embedded WebRTC Softphone for Vanguard CRM
 * Based on ctxSip but integrated directly into the CRM interface
 */

class VanguardWebRTCSoftphone {
    constructor() {
        this.ua = null;
        this.session = null;
        this.isRegistered = false;
        this.config = {
            user: '',
            password: '',
            realm: '',
            display: 'Vanguard Agent',
            // Try multiple WebSocket URLs - Twilio SIP domains may use different formats
            wsServers: [
                'wss://vanguard1.sip.twilio.com',
                'wss://vanguard1.sip.twilio.com:443',
                'ws://vanguard1.sip.twilio.com:80',
                'wss://sip.twilio.com:443'
            ]
        };

        this.init();
    }

    async init() {
        // Load SIP config from server
        try {
            const jwt = sessionStorage.getItem('vanguard_jwt');
            const resp = await fetch('/api/sip-config', { headers: { Authorization: 'Bearer ' + jwt } });
            if (resp.ok) {
                const cfg = await resp.json();
                this.config.user = cfg.username;
                this.config.password = cfg.password;
                this.config.realm = cfg.domain;
            }
        } catch (e) { console.warn('Could not load SIP config'); }
        this.createUI();
        this.initializeSIP();
    }

    createUI() {
        // Create floating softphone widget
        const widget = document.createElement('div');
        widget.id = 'webrtc-softphone-widget';
        widget.innerHTML = `
            <div class="softphone-header">
                <span class="softphone-title">📞 WebRTC Phone</span>
                <span id="sip-status" class="status-indicator">●</span>
            </div>
            <div class="softphone-body">
                <div class="phone-display">
                    <input type="text" id="phone-number" placeholder="Enter phone number" maxlength="15" />
                </div>
                <div class="phone-keypad">
                    <div class="keypad-row">
                        <button class="key" onclick="webRTCPhone.addDigit('1')">1</button>
                        <button class="key" onclick="webRTCPhone.addDigit('2')">2</button>
                        <button class="key" onclick="webRTCPhone.addDigit('3')">3</button>
                    </div>
                    <div class="keypad-row">
                        <button class="key" onclick="webRTCPhone.addDigit('4')">4</button>
                        <button class="key" onclick="webRTCPhone.addDigit('5')">5</button>
                        <button class="key" onclick="webRTCPhone.addDigit('6')">6</button>
                    </div>
                    <div class="keypad-row">
                        <button class="key" onclick="webRTCPhone.addDigit('7')">7</button>
                        <button class="key" onclick="webRTCPhone.addDigit('8')">8</button>
                        <button class="key" onclick="webRTCPhone.addDigit('9')">9</button>
                    </div>
                    <div class="keypad-row">
                        <button class="key" onclick="webRTCPhone.addDigit('*')">*</button>
                        <button class="key" onclick="webRTCPhone.addDigit('0')">0</button>
                        <button class="key" onclick="webRTCPhone.addDigit('#')">#</button>
                    </div>
                </div>
                <div class="phone-controls">
                    <button id="call-btn" class="control-btn call" onclick="webRTCPhone.makeCall()">📞 Call</button>
                    <button id="hangup-btn" class="control-btn hangup" onclick="webRTCPhone.hangup()" disabled>🔴 Hangup</button>
                </div>
                <div class="phone-status">
                    <div id="call-status">Ready</div>
                    <div id="call-timer" style="display: none;">00:00</div>
                </div>
            </div>
        `;

        // Add CSS
        const style = document.createElement('style');
        style.textContent = `
            #webrtc-softphone-widget {
                position: fixed;
                top: 80px;
                right: 20px;
                width: 280px;
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            }

            .softphone-header {
                background: #059669;
                color: white;
                padding: 12px 15px;
                border-radius: 8px 8px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-weight: 600;
            }

            .status-indicator {
                font-size: 12px;
                color: #fbbf24;
            }

            .status-indicator.connected {
                color: #10b981;
            }

            .status-indicator.error {
                color: #ef4444;
            }

            .softphone-body {
                padding: 15px;
            }

            .phone-display input {
                width: 100%;
                padding: 12px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 16px;
                text-align: center;
                margin-bottom: 15px;
            }

            .phone-keypad {
                margin-bottom: 15px;
            }

            .keypad-row {
                display: flex;
                gap: 8px;
                margin-bottom: 8px;
            }

            .key {
                flex: 1;
                padding: 12px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                background: #f9fafb;
                cursor: pointer;
                font-size: 16px;
                font-weight: 600;
            }

            .key:hover {
                background: #e5e7eb;
            }

            .key:active {
                background: #d1d5db;
            }

            .phone-controls {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
            }

            .control-btn {
                flex: 1;
                padding: 12px;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
            }

            .control-btn.call {
                background: #10b981;
                color: white;
            }

            .control-btn.hangup {
                background: #ef4444;
                color: white;
            }

            .control-btn:disabled {
                background: #9ca3af;
                cursor: not-allowed;
            }

            .phone-status {
                text-align: center;
                font-size: 14px;
                color: #6b7280;
            }

            #call-timer {
                font-weight: 600;
                color: #059669;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(widget);
    }

    initializeSIP() {
        if (typeof SIP === 'undefined') {
            console.error('❌ SIP.js not loaded');
            this.updateStatus('SIP.js missing', 'error');
            return;
        }

        try {
            console.log('📞 SIP Configuration:', {
                user: this.config.user,
                realm: this.config.realm,
                wsServers: this.config.wsServers
            });

            // Create SIP User Agent
            this.ua = new SIP.UA({
                uri: `sip:${this.config.user}@${this.config.realm}`,
                wsServers: this.config.wsServers,
                authorizationUser: this.config.user,
                password: this.config.password,
                displayName: this.config.display,
                userAgentString: 'Vanguard WebRTC Phone',
                register: true,
                autostart: true,
                traceSip: true,
                // Add debugging options
                log: {
                    builtinEnabled: true,
                    level: 'debug'
                }
            });

            console.log('📞 SIP User Agent created');

            // Event handlers
            this.ua.on('registered', () => {
                console.log('✅ SIP Registration successful');
                this.isRegistered = true;
                this.updateStatus('Connected', 'connected');
                this.updateCallStatus('Ready to make calls');
            });

            this.ua.on('registrationFailed', (e) => {
                console.error('❌ SIP Registration failed:', e);
                console.error('❌ Error details:', {
                    cause: e.cause,
                    response: e.response,
                    uri: e.uri
                });
                this.updateStatus('Registration failed', 'error');
                this.updateCallStatus(`Registration failed: ${e.cause || 'Unknown error'}`);
            });

            this.ua.on('disconnected', () => {
                console.warn('⚠️ SIP WebSocket disconnected');
                this.updateStatus('Disconnected', 'error');
                this.updateCallStatus('Connection lost');
            });

            this.ua.on('connected', () => {
                console.log('🔗 SIP WebSocket connected');
                this.updateStatus('Connecting...', '');
            });

            this.ua.on('unregistered', () => {
                console.warn('⚠️ SIP unregistered');
                this.isRegistered = false;
                this.updateStatus('Unregistered', 'error');
            });

            this.ua.on('invite', (session) => {
                console.log('📞 Incoming call from:', session.remoteIdentity.uri);
                this.handleIncomingCall(session);
            });

        } catch (error) {
            console.error('❌ SIP initialization error:', error);
            this.updateStatus('Init error', 'error');
        }
    }

    updateStatus(text, type = '') {
        const statusEl = document.getElementById('sip-status');
        if (statusEl) {
            statusEl.className = `status-indicator ${type}`;
            statusEl.title = text;
        }
    }

    updateCallStatus(text) {
        const statusEl = document.getElementById('call-status');
        if (statusEl) {
            statusEl.textContent = text;
        }
    }

    addDigit(digit) {
        const input = document.getElementById('phone-number');
        if (input) {
            input.value += digit;
        }
    }

    makeCall() {
        const phoneNumber = document.getElementById('phone-number')?.value;
        if (!phoneNumber) {
            alert('Please enter a phone number');
            return;
        }

        if (!this.isRegistered) {
            alert('SIP not registered. Please wait for connection.');
            return;
        }

        try {
            // Format number for SIP calling
            const sipUri = `sip:${phoneNumber}@${this.config.realm}`;
            console.log('📞 Making call to:', sipUri);

            this.session = this.ua.invite(sipUri, {
                mediaConstraints: {
                    audio: true,
                    video: false
                }
            });

            this.session.on('accepted', () => {
                console.log('✅ Call answered');
                this.updateCallStatus('Call connected');
                this.startCallTimer();
                document.getElementById('call-btn').disabled = true;
                document.getElementById('hangup-btn').disabled = false;
            });

            this.session.on('bye', () => {
                console.log('📞 Call ended');
                this.endCall();
            });

            this.session.on('failed', (e) => {
                console.error('❌ Call failed:', e);
                this.updateCallStatus('Call failed');
                this.endCall();
            });

            this.updateCallStatus('Calling...');

        } catch (error) {
            console.error('❌ Call error:', error);
            this.updateCallStatus('Call error');
        }
    }

    hangup() {
        if (this.session) {
            this.session.bye();
        }
        this.endCall();
    }

    endCall() {
        this.session = null;
        this.updateCallStatus('Ready');
        this.stopCallTimer();
        document.getElementById('call-btn').disabled = false;
        document.getElementById('hangup-btn').disabled = true;
    }

    startCallTimer() {
        this.callStartTime = Date.now();
        this.callTimerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.callStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');

            const timerEl = document.getElementById('call-timer');
            if (timerEl) {
                timerEl.textContent = `${minutes}:${seconds}`;
                timerEl.style.display = 'block';
            }
        }, 1000);
    }

    stopCallTimer() {
        if (this.callTimerInterval) {
            clearInterval(this.callTimerInterval);
            this.callTimerInterval = null;
        }
        const timerEl = document.getElementById('call-timer');
        if (timerEl) {
            timerEl.style.display = 'none';
        }
    }

    handleIncomingCall(session) {
        // Auto-answer for now - you can add UI for this later
        const shouldAnswer = confirm(`Incoming call from ${session.remoteIdentity.uri}. Answer?`);

        if (shouldAnswer) {
            this.session = session;
            this.session.accept({
                mediaConstraints: {
                    audio: true,
                    video: false
                }
            });

            this.updateCallStatus('Incoming call connected');
            this.startCallTimer();
            document.getElementById('call-btn').disabled = true;
            document.getElementById('hangup-btn').disabled = false;

            this.session.on('bye', () => {
                this.endCall();
            });
        } else {
            session.reject();
        }
    }
}

// Initialize when SIP.js is loaded
function initWebRTCSoftphone() {
    if (typeof SIP !== 'undefined') {
        window.webRTCPhone = new VanguardWebRTCSoftphone();
        console.log('📞 Embedded WebRTC Softphone initialized');
    } else {
        console.log('⏳ Waiting for SIP.js to load...');
        setTimeout(initWebRTCSoftphone, 1000);
    }
}

// Auto-initialize when script loads
console.log('📞 WebRTC Softphone script starting...');

// Initialize immediately and also on DOMContentLoaded
initWebRTCSoftphone();

document.addEventListener('DOMContentLoaded', () => {
    console.log('📞 DOM loaded, initializing WebRTC softphone...');
    setTimeout(initWebRTCSoftphone, 2000);
});

// Also try after window load
window.addEventListener('load', () => {
    console.log('📞 Window loaded, ensuring WebRTC softphone...');
    setTimeout(initWebRTCSoftphone, 1000);
});

// Manual initialization function
window.initWebRTCSoftphone = initWebRTCSoftphone;

// Function to show/hide the widget
window.toggleWebRTCSoftphone = function() {
    const widget = document.getElementById('webrtc-softphone-widget');
    if (widget) {
        widget.style.display = widget.style.display === 'none' ? 'block' : 'none';
        console.log('📞 WebRTC softphone toggled');
    } else {
        console.log('📞 Creating WebRTC softphone...');
        initWebRTCSoftphone();
    }
};

console.log('✅ WebRTC Softphone script loaded');