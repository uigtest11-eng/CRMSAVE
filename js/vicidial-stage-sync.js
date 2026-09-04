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
    const fleetSize = lead.fleetSize || '';
    const drivers = lead.drivers || fleetSize;

    const headerLine = `Driver count: ${drivers || '?'} | Fleet size: ${fleetSize || '?'}`;

    // Build dynamic DRIVERS INFO section
    const numDrivers = Math.min(Math.max(parseInt(drivers) || 1, 1), 20);
    const driverBlocks = [];
    for (let d = 1; d <= numDrivers; d++) {
        driverBlocks.push(`Driver ${d}\nName:\nDOB:\nDL#:\nCDL Length:\nHire Date: MM/YYYY`);
    }
    const driversInfoSection = `--DRIVERS INFO(${numDrivers})-----\n` + driverBlocks.join('\n\n');

    // Build UNITS section from lead.vehicles
    const vehicles = Array.isArray(lead.vehicles) ? lead.vehicles : [];
    const unitLines = vehicles.map(v =>
        `Year: ${v.year || 'XXXX'}\nMake: ${v.make || 'Unknown'}\nModel:\nType: ${v.type || 'Unknown'}\nVIN: ${v.vin || 'XXXXXXXXXXXXXXXX'}\nValue: ${v.value || ''}`
    );
    // Pad to fleet size with placeholders
    const fleetInt = parseInt(fleetSize) || 0;
    while (unitLines.length < fleetInt) {
        unitLines.push('Year: XXXX\nMake: Unknown\nModel:\nType: Unknown\nVIN: XXXXXXXXXXXXXXXX\nValue:');
    }
    const unitsCount = unitLines.length || '?';
    const unitsBody = unitLines.join('\n\n');

    // Build TRAILERS section from lead.trailers — pad to fleet size same as units
    const trailers = Array.isArray(lead.trailers) ? lead.trailers : [];
    const trailerLines = trailers.map(t =>
        `Year: ${t.year || 'XXXX'}\nMake: ${t.make || 'Unknown'}\nType: ${t.type || 'Dry Van'}\nVIN: ${t.vin || 'XXXXXXXXXXXXXXXX'}\nValue: ${t.value || ''}`
    );
    while (trailerLines.length < fleetInt) {
        trailerLines.push('Year: XXXX\nMake: Unknown\nType: Unknown\nVIN: XXXXXXXXXXXXXXXX\nValue:');
    }
    const trailersCount = trailerLines.length || '?';
    const trailersBody = trailerLines.join('\n\n');

    // Doc status markers
    const docStatus = {
        coi: lead.docStatus_coi === 'received' ? 'RC' : lead.docStatus_coi === 'requested' ? 'RQ' : ' ',
        decPage: lead.docStatus_dec_page === 'received' ? 'RC' : lead.docStatus_dec_page === 'requested' ? 'RQ' : ' ',
        lossRuns: lead.docStatus_loss_runs === 'received' ? 'RC' : lead.docStatus_loss_runs === 'requested' ? 'RQ' : ' ',
        iftas: lead.docStatus_iftas === 'received' ? 'RC' : lead.docStatus_iftas === 'requested' ? 'RQ' : ' '
    };

    const commodities = lead.commodityHauled || '';
    const mileRadius = lead.radiusOfOperation || '';
    const mtcCoverage = lead.mtcCoverage || '$100k';

    const stage = lead.stage || 'new';

    const comments = `${headerLine}
Stage: ${stage}

-----NEXT CALL---------------
Date: MM/DD/2026 Time: 00:00AM
Callback Notes:

---DOCUMENTATION----- Requested = RQ | Received = RC
COI (${docStatus.coi})
DEC PAGE (${docStatus.decPage})
LOSS RUNS (${docStatus.lossRuns})
IFTAS (${docStatus.iftas})

----OWNERS INFO-------
Name: ${lead.ownerName || ''}
DOB: ${lead.ownerDob || ''}
DL#: ${lead.ownerDl || ''}
CDL Length: ${lead.ownerCdlLength || ''}

---OPERATION-------
Mile Radius: ${mileRadius}
Commodities: ${commodities}
MTC: ${mtcCoverage}

${driversInfoSection}

-----UNITS(${unitsCount})----------
${unitsBody}

-----TRAILERS(${trailersCount})----------
${trailersBody}`;

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