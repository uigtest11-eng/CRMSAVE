/**
 * Vicidial Stage Sync - Bidirectional synchronization between CRM stages and Vicidial comments
 */

console.log('🔄 Loading Vicidial Stage Sync system...');

// Function to update lead stage in CRM and sync to Vicidial
async function updateLeadStage(leadId, newStage) {
    console.log(`🔄 Updating lead ${leadId} stage to: ${newStage}`);

    try {
        // Get current lead data
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const leadIndex = leads.findIndex(lead => lead.id === leadId);

        if (leadIndex === -1) {
            console.error(`❌ Lead ${leadId} not found`);
            return false;
        }

        const lead = leads[leadIndex];
        const oldStage = lead.stage;

        // Update the lead stage
        leads[leadIndex].stage = newStage;
        leads[leadIndex].lastActivity = new Date().toISOString();

        // Save to localStorage
        localStorage.setItem('insurance_leads', JSON.stringify(leads));

        // Save to server
        await saveLead(leads[leadIndex]);

        // Update Vicidial comments to reflect the stage change
        await updateVicidialStageComments(leadId, newStage, lead);

        console.log(`✅ Lead ${leadId} stage updated: ${oldStage} → ${newStage}`);

        // Refresh the display if needed
        if (typeof refreshLeadsTable === 'function') {
            refreshLeadsTable();
        }

        return true;

    } catch (error) {
        console.error(`❌ Error updating lead stage:`, error);
        return false;
    }
}

// Function to update lead field (like owner name) and sync to Vicidial
async function updateLeadField(leadId, fieldName, newValue) {
    console.log(`🔄 Updating lead ${leadId} ${fieldName} to: ${newValue}`);

    try {
        // Get current lead data
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const leadIndex = leads.findIndex(lead => lead.id === leadId);

        if (leadIndex === -1) {
            console.error(`❌ Lead ${leadId} not found`);
            return false;
        }

        const lead = leads[leadIndex];
        const oldValue = lead[fieldName];

        // Update the field
        leads[leadIndex][fieldName] = newValue;
        leads[leadIndex].lastActivity = new Date().toISOString();

        // Save to localStorage
        localStorage.setItem('insurance_leads', JSON.stringify(leads));

        // Save to server
        await saveLead(leads[leadIndex]);

        // Update Vicidial comments to reflect the field change
        await updateVicidialFieldComments(leadId, fieldName, newValue, lead);

        console.log(`✅ Lead ${leadId} ${fieldName} updated: "${oldValue}" → "${newValue}"`);

        return true;

    } catch (error) {
        console.error(`❌ Error updating lead field:`, error);
        return false;
    }
}

// Function to update Vicidial comments when stage changes in CRM
async function updateVicidialStageComments(leadId, newStage, lead) {
    console.log(`🔄 Syncing stage "${newStage}" to Vicidial comments for lead ${leadId}`);

    try {
        // Map CRM stages to comment format
        const stageMapping = {
            'new': 'New',
            'info_requested': 'Info Requested',
            'loss_runs_requested': 'Loss Runs Requested',
            'loss_runs_received': 'Loss Runs Received'
        };

        const stageName = stageMapping[newStage] || newStage;

        // Build updated comments with X marked for the selected stage
        const updatedComments = buildVicidialComments(lead, stageName);

        // Send to backend to update Vicidial
        const response = await fetch('/api/vicidial/update-comments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                leadId: leadId,
                comments: updatedComments,
                stage: newStage
            })
        });

        if (response.ok) {
            console.log(`✅ Vicidial comments updated for lead ${leadId}`);
        } else {
            console.warn(`⚠️ Failed to update Vicidial comments: ${response.status}`);
        }

    } catch (error) {
        console.warn(`⚠️ Error syncing to Vicidial:`, error);
    }
}

// Function to update Vicidial comments when field changes in CRM
async function updateVicidialFieldComments(leadId, fieldName, newValue, lead) {
    console.log(`🔄 Syncing ${fieldName} to Vicidial comments for lead ${leadId}`);

    try {
        // Build updated comments with the new field value
        const updatedComments = buildVicidialComments(lead, null, {[fieldName]: newValue});

        // Send to backend to update Vicidial
        const response = await fetch('/api/vicidial/update-comments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                leadId: leadId,
                comments: updatedComments,
                updatedField: fieldName,
                updatedValue: newValue
            })
        });

        if (response.ok) {
            console.log(`✅ Vicidial ${fieldName} updated for lead ${leadId}`);
        } else {
            console.warn(`⚠️ Failed to update Vicidial ${fieldName}: ${response.status}`);
        }

    } catch (error) {
        console.warn(`⚠️ Error syncing ${fieldName} to Vicidial:`, error);
    }
}

// Function to build Vicidial comments in the expected format
function buildVicidialComments(lead, selectedStage, fieldUpdates = {}) {
    const expiry = lead.renewalDate || '';
    const fleetSize = lead.fleetSize || '';
    const ownerName = fieldUpdates.ownerName !== undefined ? fieldUpdates.ownerName : (lead.ownerName || '');

    // Build basic info line - updated for new format
    const drivers = lead.drivers || fleetSize; // Default drivers to fleet size if not specified
    const basicInfo = `Dr: ${drivers} | Fl: ${fleetSize}`;

    // Build stage selection section with X marks - updated for new format
    const predefinedStages = ['new', 'contact_attempted', 'info_requested', 'info_received', 'loss_runs_requested', 'loss_runs_received', 'app_prepared', 'app_sent', 'quote_sent', 'sale', 'closed', 'custom'];
    const isCustomStage = selectedStage && !predefinedStages.includes(selectedStage);

    const stages = [
        { display: 'Custom', key: 'custom' },
        { display: 'New', key: 'new' },
        { display: 'LR Req', key: 'info_requested' },  // New format combines info_requested and loss_runs_requested
        { display: 'LR Rec', key: 'loss_runs_received' }
    ];
    let stageSection = 'SELECT\n';

    stages.forEach(stage => {
        if (stage.key === 'custom') {
            // For custom stage, write the custom text next to "Custom:"
            stageSection += `Custom: ${isCustomStage ? selectedStage : ''}\n`;
        } else {
            const isSelected = selectedStage === stage.key ||
                              (stage.key === 'info_requested' && selectedStage === 'loss_runs_requested');
            stageSection += `${stage.display}: ${isSelected ? 'X' : ''}\n`;
        }
    });

    // Build the complete comment structure
    const comments = `${basicInfo}
------------Name--------------
${ownerName}

${stageSection}
NEXT CALL
Date: MM/DD/2026 Time: 00:00AM

UNITS
[Unit information will be added here]

TRAILERS
[Trailer information will be added here]`;

    return comments;
}

// Function to visually update name field color (for required field indication)
function updateNameFieldColor(inputElement) {
    const value = inputElement.value.trim();

    if (value === '') {
        // Empty - red border to indicate required
        inputElement.style.border = '1px solid #ef4444';
        inputElement.style.backgroundColor = '#fef2f2';
    } else {
        // Has value - green border to indicate filled
        inputElement.style.border = '1px solid #10b981';
        inputElement.style.backgroundColor = '#f0fdf4';
    }
}

// Make functions globally available
window.updateLeadStage = updateLeadStage;
window.updateLeadField = updateLeadField;
window.updateNameFieldColor = updateNameFieldColor;

console.log('✅ Vicidial Stage Sync system loaded - bidirectional sync enabled');