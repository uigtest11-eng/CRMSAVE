// Enhanced Quote Application Form with Dynamic Rows
console.log('📝 Enhanced Quote Form Loading...');

// Functions to add/remove rows dynamically
function addCommodityRow() {
    const container = document.getElementById('commodities-container');
    const rows = container.querySelectorAll('.commodity-row');
    if (rows.length >= 4) {
        alert('Maximum 4 commodity rows allowed');
        return;
    }

    const rowHtml = `
        <div class="commodity-row" style="display: grid; grid-template-columns: 2fr 1fr auto; gap: 10px; align-items: end; margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;">
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Commodity:</label>
                <input type="text" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">% of Loads:</label>
                <input type="text" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
            </div>
            <div>
                <button type="button" onclick="removeCommodityRow(this)" style="background: #dc2626; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">Delete</button>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', rowHtml);
}

function removeCommodityRow(button) {
    button.closest('.commodity-row').remove();
}

function addDriverRow() {
    const container = document.getElementById('drivers-container');
    const rowHtml = `
        <div class="driver-row" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 2fr auto; gap: 8px; align-items: end; margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;">
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Name:</label>
                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Date of Birth:</label>
                <input type="date" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">License Number:</label>
                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">State:</label>
                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Years Experience:</label>
                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Date of Hire:</label>
                <input type="date" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;"># Accidents/Violations:</label>
                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <button type="button" onclick="removeDriverRow(this)" style="background: #dc2626; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">Delete</button>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', rowHtml);
}

function removeDriverRow(button) {
    button.closest('.driver-row').remove();
}

function addTruckRow() {
    const container = document.getElementById('trucks-container');
    const rows = container.querySelectorAll('.truck-row');
    if (rows.length >= 40) {
        alert('Maximum 40 truck rows allowed');
        return;
    }

    const rowHtml = `
        <div class="truck-row" style="display: grid; grid-template-columns: 1fr 2fr 1fr 2fr 1fr 1fr auto; gap: 8px; align-items: end; margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;">
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Year:</label>
                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Make/Model:</label>
                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Type of Truck:</label>
                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">VIN:</label>
                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Value:</label>
                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Radius:</label>
                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <button type="button" onclick="removeTruckRow(this)" style="background: #dc2626; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">Delete</button>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', rowHtml);
}

function removeTruckRow(button) {
    button.closest('.truck-row').remove();
}

function addTrailerRow() {
    const container = document.getElementById('trailers-container');
    const rows = container.querySelectorAll('.trailer-row');
    if (rows.length >= 40) {
        alert('Maximum 40 trailer rows allowed');
        return;
    }

    const rowHtml = `
        <div class="trailer-row" style="display: grid; grid-template-columns: 1fr 2fr 1fr 2fr 1fr 1fr auto; gap: 8px; align-items: end; margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;">
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Year:</label>
                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Make/Model:</label>
                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Trailer Type:</label>
                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">VIN:</label>
                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Value:</label>
                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Radius:</label>
                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <button type="button" onclick="removeTrailerRow(this)" style="background: #dc2626; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">Delete</button>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', rowHtml);
}

function removeTrailerRow(button) {
    button.closest('.trailer-row').remove();
}

// Make functions globally available
window.addCommodityRow = addCommodityRow;
window.removeCommodityRow = removeCommodityRow;
window.addDriverRow = addDriverRow;
window.removeDriverRow = removeDriverRow;
window.addTruckRow = addTruckRow;
window.removeTruckRow = removeTruckRow;
window.addTrailerRow = addTrailerRow;
window.removeTrailerRow = removeTrailerRow;

// ── VIN Auto-Decode (NHTSA free API) ──────────────────────────────────────────
// Uses event delegation on the quote modal so it works for initial + dynamically added rows
function initVinDecoder() {
    const modal = document.getElementById('quote-application-modal');
    if (!modal) return;

    modal.addEventListener('focusout', function(e) {
        const inp = e.target;
        if (inp.tagName !== 'INPUT' || inp.type !== 'text') return;

        // Check if this is a VIN input (4th input in a truck-row or trailer-row)
        const row = inp.closest('.truck-row') || inp.closest('.trailer-row');
        if (!row) return;
        const inputs = row.querySelectorAll('input');
        if (inputs.length < 4 || inputs[3] !== inp) return;

        const vin = inp.value.trim().toUpperCase();
        if (!vin || vin.length !== 17) return;

        // Don't re-decode if we already decoded this VIN
        if (inp.dataset.decodedVin === vin) return;

        // Show loading indicator on the VIN input
        const origBorder = inp.style.border;
        inp.style.border = '2px solid #f59e0b';
        inp.value = vin; // normalize to uppercase

        fetch('https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/' + encodeURIComponent(vin) + '?format=json')
            .then(function(res) { return res.json(); })
            .then(function(data) {
                var results = data.Results || [];
                var year = '', make = '', model = '', bodyClass = '';

                results.forEach(function(r) {
                    var val = (r.Value || '').trim();
                    if (!val || val === 'Not Applicable') return;
                    switch (r.Variable) {
                        case 'Model Year': year = val; break;
                        case 'Make': make = val; break;
                        case 'Model': model = val; break;
                        case 'Body Class': bodyClass = val; break;
                    }
                });

                if (!year && !make && !model) {
                    inp.style.border = '2px solid #ef4444';
                    setTimeout(function() { inp.style.border = origBorder; }, 2000);
                    console.warn('VIN decode returned no data for:', vin);
                    return;
                }

                // inputs[0]=Year, inputs[1]=Make/Model, inputs[2]=Type, inputs[3]=VIN
                if (year && !inputs[0].value) inputs[0].value = year;
                if ((make || model) && !inputs[1].value) {
                    inputs[1].value = (make + ' ' + model).trim();
                }
                if (bodyClass && !inputs[2].value) inputs[2].value = bodyClass;

                inp.dataset.decodedVin = vin;
                inp.style.border = '2px solid #10b981';
                setTimeout(function() { inp.style.border = origBorder; }, 2000);
                console.log('VIN decoded:', vin, '->', year, make, model, bodyClass);
            })
            .catch(function(err) {
                console.error('VIN decode error:', err);
                inp.style.border = '2px solid #ef4444';
                setTimeout(function() { inp.style.border = origBorder; }, 2000);
            });
    });
}

// Watch for the quote modal to appear and attach VIN decoder
var _vinObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
        m.addedNodes.forEach(function(node) {
            if (node.id === 'quote-application-modal' || (node.querySelector && node.querySelector('#quote-application-modal'))) {
                setTimeout(initVinDecoder, 200);
            }
        });
    });
});
_vinObserver.observe(document.body, { childList: true });

// Also init if modal already exists
if (document.getElementById('quote-application-modal')) initVinDecoder();

window.initVinDecoder = initVinDecoder;

console.log('✅ Enhanced Quote Form Functions Loaded (with VIN decode)');