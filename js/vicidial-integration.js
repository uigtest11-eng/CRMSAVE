// ViciDial API Integration for Vanguard Insurance Software
// Automatically imports sales leads from ViciDial to management system

class ViciDialIntegration {
    constructor() {
        this.apiUrl = '';
        this.apiUser = '';
        this.apiPass = '';
        this.syncInterval = null;
        this.lastSyncTime = null;
        this.isConnected = false;
    }

    // Initialize connection with ViciDial
    async init(config) {
        // Use proxy to avoid CORS issues
        // If a global proxy URL is configured, use it
        this.apiUrl = window.VICIDIAL_PROXY_URL || config.apiUrl || 'http://localhost:5001/vicidial/api';
        this.apiUser = config.apiUser;
        this.apiPass = config.apiPass;
        
        // Test connection
        const connected = await this.testConnection();
        if (connected) {
            this.isConnected = true;
            // Disabled auto-sync to prevent overwriting archived leads
            // this.startAutoSync();
            console.log('ViciDial auto-sync disabled - manual sync only to preserve archived status');
            return { success: true, message: 'Connected to ViciDial successfully' };
        } else {
            return { success: false, message: 'Failed to connect to ViciDial' };
        }
    }

    // Test ViciDial API connection
    async testConnection() {
        try {
            // Check if we're on HTTPS and trying to access HTTP
            if (window.location.protocol === 'https:' && this.apiUrl.startsWith('http:')) {
                console.error('Cannot access HTTP API from HTTPS page due to mixed content restrictions');
                alert('⚠️ ViciDial Integration requires HTTP access.\n\nPlease access the management system directly at:\nhttp://204.13.233.29:8888/\n\n(Not through ngrok/HTTPS)');
                return false;
            }
            
            const params = new URLSearchParams({
                source: 'vanguard_insurance',
                user: this.apiUser,
                pass: this.apiPass,
                function: 'version'
            });

            const fullUrl = `${this.apiUrl}?${params}`;
            console.log('Testing ViciDial connection:', fullUrl);
            console.log('API User:', this.apiUser, 'API Pass:', this.apiPass);
            
            const response = await fetch(fullUrl);
            const data = await response.text();
            console.log('ViciDial response:', data);
            
            return data.includes('VERSION') || data.includes('SUCCESS');
        } catch (error) {
            console.error('ViciDial connection test failed:', error);
            return false;
        }
    }

    // Get all campaigns from ViciDial
    async getCampaigns() {
        try {
            const params = new URLSearchParams({
                source: 'vanguard_insurance',
                user: this.apiUser,
                pass: this.apiPass,
                function: 'campaigns_list'
            });

            const response = await fetch(`${this.apiUrl}?${params}`);
            const data = await response.text();
            
            // Parse campaign data
            const campaigns = this.parseApiResponse(data);
            return campaigns;
        } catch (error) {
            console.error('Failed to get campaigns:', error);
            return [];
        }
    }

    // Get sales leads from ViciDial (status = SALE)
    async getSalesLeads() {
        try {
            const params = new URLSearchParams({
                source: 'vanguard_insurance',
                user: this.apiUser,
                pass: this.apiPass,
                function: 'list_export',
                status: 'SALE',
                header: 'YES',
                rec_fields: 'lead_id,list_id,status,first_name,last_name,phone_number,email,address1,city,state,postal_code,comments,last_local_call_time,length_in_sec'
            });

            const response = await fetch(`${this.apiUrl}?${params}`);
            const data = await response.text();
            
            return this.parseLeadsData(data);
        } catch (error) {
            console.error('Failed to get sales leads:', error);
            return [];
        }
    }

    // Get call recording and transcript for a lead
    async getCallRecording(leadId, callDate) {
        try {
            const params = new URLSearchParams({
                source: 'vanguard_insurance',
                user: this.apiUser,
                pass: this.apiPass,
                function: 'recording_lookup',
                lead_id: leadId,
                date: callDate
            });

            const response = await fetch(`${this.apiUrl}?${params}`);
            const data = await response.text();
            
            // Parse recording URL and details
            const recordingInfo = this.parseRecordingInfo(data);
            
            // If recording exists, attempt to get transcript
            if (recordingInfo.url) {
                recordingInfo.transcript = await this.getCallTranscript(recordingInfo.url);
            }
            
            return recordingInfo;
        } catch (error) {
            console.error('Failed to get call recording:', error);
            return null;
        }
    }

    // Get or generate call transcript
    async getCallTranscript(recordingUrl) {
        // This would integrate with a transcription service
        // For now, return simulated transcript data
        return {
            text: "Agent: Good afternoon, this is John from Vanguard Insurance. Customer: Hi John, I'm interested in commercial auto insurance for my trucking company. Agent: Great! I can help you with that. How many vehicles do you need to insure? Customer: We have 5 trucks. Agent: Perfect, let me get you a quote...",
            confidence: 0.95,
            duration: 245
        };
    }

    // Parse leads data from ViciDial CSV format
    parseLeadsData(csvData) {
        const lines = csvData.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const leads = [];

        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(',');
                const lead = {};
                headers.forEach((header, index) => {
                    lead[header] = values[index] ? values[index].trim() : '';
                });
                leads.push(lead);
            }
        }

        return leads;
    }

    // Parse API response
    parseApiResponse(response) {
        // ViciDial returns pipe-delimited data
        const lines = response.split('\n');
        const results = [];
        
        lines.forEach(line => {
            if (line.trim()) {
                const parts = line.split('|');
                if (parts.length > 1) {
                    results.push(parts);
                }
            }
        });
        
        return results;
    }

    // Parse recording info
    parseRecordingInfo(data) {
        const info = {
            url: '',
            filename: '',
            length: 0,
            date: ''
        };

        // Parse ViciDial recording response
        const lines = data.split('\n');
        lines.forEach(line => {
            if (line.includes('http')) {
                info.url = line.trim();
            }
            if (line.includes('filename')) {
                const parts = line.split(':');
                if (parts[1]) info.filename = parts[1].trim();
            }
        });

        return info;
    }

    // Extract fleet size and calculate premium from ViciDial comments
    extractFleetAndPremium(comments) {
        if (!comments) return { fleetSize: 0, premium: 0 };
        const patterns = [
            /Fleet size:\s*(\d+)/i,
            /Driver count:\s*\d+\s*\|\s*Fleet size:\s*(\d+)/i,
            /Fl:\s*(\d+)/i,
            /Dr:\s*\d+\s*\|\s*Fl:\s*(\d+)/i,
            /Size:\s*(\d+)/i,
            /Fleet Size:?\s*(\d+)/i,
            /(\d+)\s*vehicles?/i,
            /fleet\s*of\s*(\d+)/i,
            /(\d+)\s*units?/i,
            /(\d+)\s*trucks?/i,
            /(\d+)\s*power\s*units?/i,
        ];
        for (const p of patterns) {
            const m = comments.match(p);
            if (m) {
                const fleetSize = parseInt(m[1]);
                return { fleetSize, premium: fleetSize * 14400 };
            }
        }
        return { fleetSize: 0, premium: 0 };
    }

    // Format seconds into CRM-readable duration string
    formatDuration(seconds) {
        seconds = parseInt(seconds) || 0;
        if (seconds <= 0) return '< 1 min';
        if (seconds < 60) return `${seconds} sec`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return secs > 0 ? `${mins} min ${secs} sec` : `${mins} min`;
    }

    // Convert ViciDial lead to insurance profile
    async convertToInsuranceProfile(viciLead, callRecording) {
        const { fleetSize, premium } = this.extractFleetAndPremium(viciLead.comments);
        const callSeconds = parseInt(viciLead.length_in_sec) || 0;
        const callLog = {
            timestamp: viciLead.last_local_call_time
                ? new Date(viciLead.last_local_call_time).toISOString()
                : new Date().toISOString(),
            connected: true,
            duration: this.formatDuration(callSeconds),
            leftVoicemail: false,
            notes: `ViciDial SALE call${callSeconds > 0 ? ` — ${this.formatDuration(callSeconds)}` : ''}`
        };

        const profile = {
            // Basic Information
            id: `VICI-${viciLead.lead_id}`,
            source: 'ViciDial Import',
            importDate: new Date().toISOString(),

            // Contact Information
            firstName: viciLead.first_name,
            lastName: viciLead.last_name,
            phone: viciLead.phone_number,
            email: viciLead.email,

            // Address
            address: {
                street: viciLead.address1,
                city: viciLead.city,
                state: viciLead.state,
                zip: viciLead.postal_code
            },

            // Lead Details
            status: 'New',
            type: 'Commercial Auto',
            leadScore: this.calculateLeadScore(viciLead, callRecording),
            fleetSize: fleetSize > 0 ? String(fleetSize) : 'Unknown',
            premium: premium,

            // Call Information
            callDate: viciLead.last_local_call_time,
            callDuration: callSeconds,
            callRecordingUrl: callRecording?.url || '',

            // reachOut — populate so talk time bar shows correctly
            reachOut: {
                callAttempts: 1,
                callsConnected: 1,
                emailCount: 0,
                textCount: 0,
                voicemailCount: 0,
                callLogs: [callLog]
            },

            // Transcript Analysis
            transcript: callRecording?.transcript?.text || '',
            extractedInfo: this.extractInfoFromTranscript(callRecording?.transcript?.text),

            // Notes
            notes: viciLead.comments || '',

            // Follow-up
            needsFollowUp: true,
            followUpDate: this.calculateFollowUpDate(),
            assignedAgent: ''
        };

        // Auto-create callback from ViciDial comments if scheduled callback exists
        if (viciLead.comments && typeof window.createCallbackFromVicidialImport === 'function') {
            try {
                const callbackCreated = window.createCallbackFromVicidialImport(
                    viciLead.lead_id,
                    viciLead.first_name + ' ' + viciLead.last_name,
                    viciLead.comments
                );
                if (callbackCreated) {
                    console.log('📅 VICIDIAL INTEGRATION: Auto-created callback for lead', viciLead.lead_id);
                    profile.hasScheduledCallback = true;
                }
            } catch (error) {
                console.error('❌ VICIDIAL INTEGRATION: Error creating callback:', error);
            }
        }

        return profile;
    }

    // Extract relevant information from call transcript
    extractInfoFromTranscript(transcript) {
        if (!transcript) return {};

        const info = {
            insuranceType: '',
            numberOfVehicles: 0,
            currentCarrier: '',
            renewalDate: '',
            budget: '',
            painPoints: [],
            interested: false
        };

        // Extract insurance type
        if (transcript.toLowerCase().includes('commercial auto')) {
            info.insuranceType = 'Commercial Auto';
        } else if (transcript.toLowerCase().includes('general liability')) {
            info.insuranceType = 'General Liability';
        }

        // Extract number of vehicles
        const vehicleMatch = transcript.match(/(\d+)\s*(trucks?|vehicles?|cars?|vans?)/i);
        if (vehicleMatch) {
            info.numberOfVehicles = parseInt(vehicleMatch[1]);
        }

        // Check interest level
        info.interested = transcript.toLowerCase().includes('interested') || 
                         transcript.toLowerCase().includes('quote') ||
                         transcript.toLowerCase().includes('how much');

        return info;
    }

    // Calculate lead score based on various factors
    calculateLeadScore(lead, recording) {
        let score = 50; // Base score

        // Has email: +10
        if (lead.email) score += 10;

        // Has complete address: +10
        if (lead.address1 && lead.city && lead.state && lead.postal_code) score += 10;

        // Has recording: +10
        if (recording?.url) score += 10;

        // Transcript shows interest: +20
        if (recording?.transcript?.text) {
            const transcript = recording.transcript.text.toLowerCase();
            if (transcript.includes('interested') || transcript.includes('quote')) {
                score += 20;
            }
        }

        return Math.min(score, 100);
    }

    // Calculate follow-up date
    calculateFollowUpDate() {
        const date = new Date();
        date.setDate(date.getDate() + 1); // Next day by default
        return date.toISOString();
    }

    // Sync sales leads from ViciDial
    async syncSalesLeads() {
        console.log('Starting ViciDial sync...');
        
        try {
            // Get all sales leads
            const salesLeads = await this.getSalesLeads();
            console.log(`Found ${salesLeads.length} sales leads in ViciDial`);

            const importedLeads = [];
            
            for (const lead of salesLeads) {
                // Check if already imported
                if (this.isLeadImported(lead.lead_id)) {
                    continue;
                }

                // Get call recording and transcript
                const recording = await this.getCallRecording(lead.lead_id, lead.last_local_call_time);
                
                // Convert to insurance profile
                const profile = await this.convertToInsuranceProfile(lead, recording);
                
                // Save to management system
                const saved = await this.saveToManagementSystem(profile);
                
                if (saved) {
                    importedLeads.push(profile);
                    this.markLeadAsImported(lead.lead_id);
                }
            }

            this.lastSyncTime = new Date();
            
            return {
                success: true,
                imported: importedLeads.length,
                total: salesLeads.length,
                message: `Imported ${importedLeads.length} new sales leads`
            };
        } catch (error) {
            console.error('Sync failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Check if lead was already imported
    isLeadImported(leadId) {
        const imported = localStorage.getItem('vici_imported_leads') || '[]';
        const importedList = JSON.parse(imported);
        return importedList.includes(leadId);
    }

    // Mark lead as imported
    markLeadAsImported(leadId) {
        const imported = localStorage.getItem('vici_imported_leads') || '[]';
        const importedList = JSON.parse(imported);
        if (!importedList.includes(leadId)) {
            importedList.push(leadId);
            localStorage.setItem('vici_imported_leads', JSON.stringify(importedList));
        }
    }

    // Save profile to management system
    async saveToManagementSystem(profile) {
        try {
            // Here you would save to your actual database
            // For now, save to localStorage
            const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

            // Check if this lead already exists and preserve its archived status
            const existingLeadIndex = leads.findIndex(l =>
                l.id === profile.id ||
                (l.phone && profile.phone && l.phone.replace(/\D/g, '') === profile.phone.replace(/\D/g, ''))
            );

            if (existingLeadIndex !== -1) {
                // Preserve archived status if the lead was archived
                if (leads[existingLeadIndex].archived) {
                    profile.archived = true;
                    profile.archivedDate = leads[existingLeadIndex].archivedDate;
                    profile.archivedBy = leads[existingLeadIndex].archivedBy;
                }
                // Update existing lead
                leads[existingLeadIndex] = { ...leads[existingLeadIndex], ...profile };
            } else {
                // Add new lead
                leads.push(profile);
            }

            localStorage.setItem('insurance_leads', JSON.stringify(leads));
            
            // Trigger UI update
            if (window.updateLeadsDisplay) {
                window.updateLeadsDisplay();
            }
            
            return true;
        } catch (error) {
            console.error('Failed to save lead:', error);
            return false;
        }
    }

    // Start automatic synchronization
    startAutoSync(intervalMinutes = 5) {
        // Clear existing interval
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        // Initial sync
        this.syncSalesLeads();

        // Set up recurring sync
        this.syncInterval = setInterval(() => {
            this.syncSalesLeads();
        }, intervalMinutes * 60 * 1000);

        console.log(`Auto-sync started (every ${intervalMinutes} minutes)`);
    }

    // Stop automatic synchronization
    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('Auto-sync stopped');
        }
    }

    // Get sync status
    getSyncStatus() {
        return {
            connected: this.isConnected,
            lastSync: this.lastSyncTime,
            autoSync: !!this.syncInterval,
            apiUrl: this.apiUrl
        };
    }
}

// Export for use in other modules
window.ViciDialIntegration = ViciDialIntegration;

// Initialize global instance
window.viciDialAPI = new ViciDialIntegration();