// Vicidial Lead Uploader - Push leads FROM database TO Vicidial
// Reverses the traditional flow

const vicidialUploader = {
    // Test connection to Vicidial
    testConnection: async function() {
        try {
            // Use the same origin to avoid CORS issues
            const API_URL = window.location.origin;
            console.log('Testing Vicidial connection at:', `${API_URL}/api/vicidial/test`);

            const response = await fetch(`${API_URL}/api/vicidial/test`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            console.log('Response status:', response.status);

            // Check if response is JSON
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                console.error('Non-JSON response from Vicidial test endpoint');
                console.error('Content-Type:', contentType);
                const text = await response.text();
                console.error('Response text:', text);
                return {
                    connected: false,
                    error: 'Invalid response from server (expected JSON)'
                };
            }

            const data = await response.json();
            console.log('Connection test result:', data);
            return data;
        } catch (error) {
            console.error('Error testing Vicidial connection:', error);
            console.error('Error details:', error.stack);
            return {
                connected: false,
                error: error.message
            };
        }
    },

    // Upload leads to Vicidial
    uploadLeads: async function(criteria) {
        try {
            console.log('Uploading leads to Vicidial with criteria:', criteria);
            
            const params = new URLSearchParams({
                state: criteria.state || '',
                insurance_company: criteria.insuranceCompany || '',
                days_until_expiry: criteria.daysUntilExpiry || 30,
                skip_days: criteria.skipDays || 0,  // Add skip days for 5/30 filter
                limit: criteria.limit || 100,
                list_name: criteria.listName || '',
                campaign_id: criteria.campaignId || 'TEST'
            });
            
            const API_URL = window.location.origin;
            const response = await fetch(`${API_URL}/api/vicidial/upload?${params}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error uploading leads to Vicidial:', error);
            throw error;
        }
    },

    // Get existing Vicidial lists
    getVicidialLists: async function() {
        try {
            const API_URL = window.location.origin;
            const response = await fetch(`${API_URL}/api/vicidial/lists`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                }
            });
            
            // Check if response is JSON
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                console.error('Non-JSON response from Vicidial lists endpoint');
                return [];
            }
            
            const data = await response.json();
            return data.lists || [];
        } catch (error) {
            console.error('Error getting Vicidial lists:', error);
            return [];
        }
    },

    // Clear and upload to list (replaces overwriteList)
    overwriteList: async function(listId, criteria) {
        try {
            console.log('Overwriting Vicidial list:', listId, 'with criteria:', criteria);

            // Step 1: Clear the list first for true overwrite
            console.log('Clearing list', listId, 'before adding new leads');
            try {
                const clearResponse = await fetch(`${window.location.origin}/api/vicidial/clear-list?list_id=${listId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true'
                    }
                });

                const clearResult = await clearResponse.json();
                console.log('Clear list result:', clearResult);

                if (!clearResult.success) {
                    console.warn('Could not clear list:', clearResult.error, '- proceeding with upload anyway');
                } else {
                    console.log('List cleared successfully');
                }
            } catch (error) {
                console.warn('Error clearing list:', error, '- proceeding with upload anyway');
            }

            // Step 2: Upload new leads (in batches to avoid timeout)
            const insuranceCompaniesStr = criteria.insuranceCompanies
                ? criteria.insuranceCompanies.join(',')
                : (criteria.insuranceCompany || '');

            // Check if we need to batch large uploads
            const actualLeads = criteria.leads || [];
            const totalLeads = actualLeads.length;
            const BATCH_SIZE = 400; // Upload 400 leads at a time

            if (totalLeads > BATCH_SIZE) {
                console.log(`Large upload detected (${totalLeads} leads). Processing in batches of ${BATCH_SIZE}...`);

                let totalUploaded = 0;
                let totalErrors = 0;
                const batches = Math.ceil(totalLeads / BATCH_SIZE);

                // Show progress in UI
                if (this.showProcessingMessage) {
                    this.showProcessingMessage({
                        message: `Uploading ${totalLeads} leads in ${batches} batches...`,
                        processing: true
                    });
                }

                for (let i = 0; i < batches; i++) {
                    const batchStart = i * BATCH_SIZE;
                    const batchLimit = Math.min(BATCH_SIZE, totalLeads - batchStart);

                    const batchTimeout = Math.max(300000, batchLimit * 500);
                    console.log(`Uploading batch ${i + 1}/${batches}: ${batchLimit} leads (offset ${batchStart}) with ${batchTimeout/1000}s timeout...`);

                    // Update progress message
                    if (this.showProcessingMessage) {
                        this.showProcessingMessage({
                            message: `Uploading batch ${i + 1} of ${batches} (${totalUploaded} leads uploaded so far)...`,
                            processing: true
                        });
                    }

                    const batchParams = new URLSearchParams({
                        list_id: listId,
                        state: criteria.state || '',
                        insurance_company: insuranceCompaniesStr,
                        days_until_expiry: String(criteria.daysUntilExpiry || 30),
                        skip_days: String((criteria.skipDays || 0) + batchStart),
                        limit: String(batchLimit)
                    });

                    // Get the actual leads data from criteria
                    const allLeads = criteria.leads || [];
                    const batchLeads = allLeads.slice(batchStart, batchStart + batchLimit);

                    console.log(`Sending ${batchLeads.length} actual leads in batch ${i + 1}`);

                    const API_URL = window.location.origin;
                    // Use the new direct upload endpoint that accepts leads data
                    const batchResponse = await fetch(`${API_URL}/api/vicidial/overwrite`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'ngrok-skip-browser-warning': 'true'
                        },
                        body: JSON.stringify({
                            list_id: listId,
                            leads: batchLeads
                        }),
                        signal: AbortSignal.timeout(batchTimeout) // Dynamic timeout calculated above
                    });

                    if (!batchResponse.ok) {
                        console.error(`Batch ${i + 1} failed with status ${batchResponse.status}`);
                        totalErrors++;
                        // Continue with next batch instead of failing completely
                        continue;
                    }

                    const batchResult = await batchResponse.json();
                    totalUploaded += batchResult.uploaded || 0;

                    console.log(`Batch ${i + 1} complete. Uploaded: ${batchResult.uploaded || 0}`);
                }

                return {
                    success: true,
                    uploaded: totalUploaded,
                    errors: totalErrors,
                    message: `Successfully uploaded ${totalUploaded} leads in ${batches} batches`
                };
            }

            // Original single request for smaller uploads
            const params = new URLSearchParams({
                list_id: listId,
                state: criteria.state || '',
                insurance_company: insuranceCompaniesStr,
                days_until_expiry: String(criteria.daysUntilExpiry || 30),
                skip_days: String(criteria.skipDays || 0),
                limit: String(criteria.limit || 100)
            });

            console.log('Uploading leads with params:', params.toString());

            // Get the actual leads data from criteria
            const allLeads = criteria.leads || [];
            if (allLeads.length > 50) {
                console.log(`🔄 Sending ${allLeads.length} leads to backend for batch processing (${Math.ceil(allLeads.length / 50)} batches expected)`);
            } else {
                console.log(`🔄 Sending ${allLeads.length} leads for standard processing`);
            }

            const API_URL = window.location.origin;
            // Use the new direct upload endpoint that accepts leads data
            const response = await fetch(`${API_URL}/api/vicidial/overwrite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({
                    list_id: listId,
                    leads: allLeads
                }),
                // Dynamic timeout for large uploads - be more generous for batch processing
                signal: AbortSignal.timeout(Math.max(1200000, allLeads.length * 2000)) // Min 20 minutes, or 2 seconds per lead
            });

            if (!response.ok) {
                // Try to get error details from response
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    if (errorData.error || errorData.detail) {
                        errorMessage = errorData.error || errorData.detail;
                    }
                } catch (e) {
                    // Response wasn't JSON
                    if (response.status === 504) {
                        errorMessage = 'Upload is taking too long. Try uploading fewer leads at once.';
                    }
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error overwriting Vicidial list:', error);
            throw error;
        }
    },

    // Show upload dialog
    showUploadDialog: async function(criteria = null) {
        // Create modal HTML
        const modalHtml = `
            <div id="vicidialUploadModal" class="modal">
                <div class="modal-content" style="max-width: 700px;">
                    <div class="modal-header">
                        <h2><i class="fas fa-upload"></i> Upload Leads to Vicidial</h2>
                        <span class="close" onclick="vicidialUploader.closeDialog()">&times;</span>
                    </div>
                    
                    <div class="modal-body">
                        <!-- Connection Status -->
                        <div id="vicidialConnectionStatus" class="alert alert-info">
                            <i class="fas fa-spinner fa-spin"></i> Scanning Vicidial lists...
                        </div>
                        
                        <!-- List Selection -->
                        <div id="vicidialListSelection" style="display: none;">
                            <div class="form-section">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                    <h3><i class="fas fa-list"></i> Select Vicidial List to Overwrite</h3>
                                    <button onclick="vicidialUploader.forceRefreshLists()" class="btn btn-sm btn-outline-secondary" style="font-size: 12px;">
                                        <i class="fas fa-sync"></i> Refresh Lists
                                    </button>
                                </div>
                                <div id="vicidialListsContainer" style="
                                    max-height: 200px;
                                    overflow-y: auto;
                                    border: 1px solid #dee2e6;
                                    border-radius: 6px;
                                    padding: 10px;
                                    background: #f8f9fa;
                                ">
                                    <div class="text-center">
                                        <i class="fas fa-spinner fa-spin"></i> Loading lists...
                                    </div>
                                </div>
                                <div style="margin-top: 10px; color: #dc3545;">
                                    <i class="fas fa-exclamation-triangle"></i>
                                    <strong>Warning:</strong> Selected list will be CLEARED and replaced with new leads!
                                </div>
                            </div>
                        </div>
                        
                        <!-- Lead Criteria Display -->
                        <div class="form-section" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 15px;">
                            <h3><i class="fas fa-filter"></i> Using Generated Lead Criteria</h3>
                            <div id="criteriaDisplay" style="margin-top: 10px;">
                                <p><strong>State:</strong> <span id="displayState">Loading...</span></p>
                                <p><strong>Insurance Companies:</strong> <span id="displayCompanies">Loading...</span></p>
                                <p><strong>Days Until Expiry:</strong> <span id="displayDays">Loading...</span></p>
                                <p style="font-size: 1.2em; color: #28a745;"><strong>Total Leads to Upload:</strong> <span id="displayTotalLeads" style="font-weight: bold;">Loading...</span></p>
                            </div>
                            <div style="margin-top: 10px; padding: 10px; background: #e7f3ff; border-left: 4px solid #007bff; border-radius: 4px;">
                                <i class="fas fa-info-circle" style="color: #007bff;"></i>
                                Will upload EXACTLY <strong><span id="confirmLeadCount">0</span></strong> leads that were just generated. No more, no less.
                            </div>
                        </div>
                            
                            <!-- Action Buttons -->
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" 
                                        onclick="vicidialUploader.closeDialog()">
                                    Cancel
                                </button>
                                <button type="button" class="btn btn-danger"
                                        onclick="vicidialUploader.performUpload()"
                                        id="vicidialUploadBtn" disabled>
                                    <i class="fas fa-sync-alt"></i> Overwrite Selected List
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to page if not exists
        // Always remove old modal so fresh HTML is inserted (previous upload may have replaced body)
        const existingModal = document.getElementById('vicidialUploadModal');
        if (existingModal) existingModal.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show modal
        document.getElementById('vicidialUploadModal').style.display = 'block';
        
        // Store the criteria for later use
        console.log('\n=== STORING UPLOAD CRITERIA ===');
        console.log('Received criteria:', JSON.stringify(criteria, null, 2));
        this.uploadCriteria = criteria;
        console.log('Stored uploadCriteria:', JSON.stringify(this.uploadCriteria, null, 2));
        console.log('==============================');
        
        // Display the criteria if provided
        if (criteria) {
            setTimeout(() => {
                const stateDisplay = document.getElementById('displayState');
                const companiesDisplay = document.getElementById('displayCompanies');
                const daysDisplay = document.getElementById('displayDays');
                const totalLeadsDisplay = document.getElementById('displayTotalLeads');
                const confirmLeadCount = document.getElementById('confirmLeadCount');

                if (stateDisplay) {
                    stateDisplay.textContent = criteria.state || 'All States';
                }
                if (companiesDisplay) {
                    if (criteria.insuranceCompanies && criteria.insuranceCompanies.length > 0) {
                        companiesDisplay.textContent = criteria.insuranceCompanies.join(', ');
                    } else {
                        companiesDisplay.textContent = 'All Companies';
                    }
                }
                if (daysDisplay) {
                    // Handle 5/30 filter display
                    if (criteria.displayExpiry) {
                        daysDisplay.textContent = criteria.displayExpiry;
                    } else if (criteria.skipDays && criteria.skipDays > 0) {
                        daysDisplay.textContent = `Days ${criteria.skipDays + 1}-${criteria.daysUntilExpiry} (skipping first ${criteria.skipDays} days)`;
                    } else {
                        daysDisplay.textContent = criteria.daysUntilExpiry || 30;
                    }
                }
                // Display the EXACT lead count
                if (totalLeadsDisplay && criteria.totalLeads) {
                    totalLeadsDisplay.textContent = criteria.totalLeads;
                }
                if (confirmLeadCount && criteria.totalLeads) {
                    confirmLeadCount.textContent = criteria.totalLeads;
                }
            }, 100);
        }
        
        // Load Vicidial lists and test connection
        this.loadVicidialLists();
    },

    // Load Vicidial lists
    loadVicidialLists: async function() {
        const statusDiv = document.getElementById('vicidialConnectionStatus');
        const listsContainer = document.getElementById('vicidialListsContainer');
        const listSelection = document.getElementById('vicidialListSelection');

        // If dialog body was replaced (e.g. previous result still showing), bail out
        if (!statusDiv) {
            console.warn('⚠️ vicidialConnectionStatus not found — dialog may need reset');
            return;
        }

        // Check if we have cached lists to avoid re-scanning
        if (this.cachedLists && this.cachedLists.length > 0 && this.listsAlreadyLoaded) {
            console.log('💾 Using cached Vicidial lists to avoid timeout:', this.cachedLists.length, 'lists');

            statusDiv.className = 'alert alert-success';
            statusDiv.innerHTML = `
                <i class="fas fa-check-circle"></i>
                Connected! Using cached lists (${this.cachedLists.length} found)
                <button onclick="vicidialUploader.forceRefreshLists()" class="btn btn-sm btn-outline-primary" style="margin-left: 15px; font-size: 12px; padding: 4px 8px;">
                    <i class="fas fa-sync"></i> Refresh Lists
                </button>
            `;

            // Show list selection with cached data
            this.displayListSelection(this.cachedLists, listsContainer, listSelection);
            return;
        }

        // Test connection first (only if not using cached lists)
        const connectionResult = await this.testConnection();
        
        if (!connectionResult.connected) {
            statusDiv.className = 'alert alert-danger';
            statusDiv.innerHTML = `
                <i class="fas fa-exclamation-circle"></i> 
                Cannot connect to Vicidial: ${connectionResult.error || 'Connection failed'}
            `;
            return;
        }
        
        // Get lists
        const lists = await this.getVicidialLists();
        
        if (lists && lists.length > 0) {
            statusDiv.className = 'alert alert-success';
            statusDiv.innerHTML = `
                <i class="fas fa-check-circle"></i>
                Connected! Found ${lists.length} Vicidial lists
            `;

            // Cache the lists for future use
            this.cachedLists = lists;
            this.listsAlreadyLoaded = true;

            // Show list selection using helper function
            this.displayListSelection(lists, listsContainer, listSelection);
        } else {
            statusDiv.className = 'alert alert-warning';
            statusDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i> 
                No Vicidial lists found. Using default list 1006.
            `;
            
            // Show default list
            listSelection.style.display = 'block';
            listsContainer.innerHTML = `
                <div class="list-item" style="
                    padding: 10px;
                    background: white;
                    border: 2px solid #28a745;
                    border-radius: 6px;
                " onclick="vicidialUploader.selectList('1006', this)">
                    <input type="radio" name="vicidialList" value="1006" 
                           id="list_1006" checked style="margin-right: 10px;">
                    <label for="list_1006" style="cursor: pointer; margin: 0;">
                        <strong>List 1006</strong> - Default Insurance Leads List
                    </label>
                </div>
            `;
            
            this.selectedListId = '1006';
            document.getElementById('vicidialUploadBtn').disabled = false;
        }
    },
    
    // Select a list
    selectList: function(listId, element) {
        // Remove selected class from all items
        document.querySelectorAll('.list-item').forEach(item => {
            item.style.border = '2px solid #dee2e6';
            item.style.background = 'white';
        });
        
        // Add selected class to clicked item
        element.style.border = '2px solid #28a745';
        element.style.background = '#f0fdf4';
        
        // Check the radio button
        document.getElementById(`list_${listId}`).checked = true;
        
        // Store selected list ID
        this.selectedListId = listId;
        
        // Enable upload button
        document.getElementById('vicidialUploadBtn').disabled = false;
    },

    // Perform the upload
    performUpload: async function() {
        const btn = document.getElementById('vicidialUploadBtn');
        const originalText = btn.innerHTML;
        
        // Check if list is selected
        if (!this.selectedListId) {
            alert('Please select a Vicidial list to overwrite');
            return;
        }
        
        // Confirm overwrite
        if (!confirm(`WARNING: This will CLEAR List ${this.selectedListId} and replace it with ${this.uploadCriteria?.totalLeads || 'the generated'} new leads.\n\nAre you sure you want to OVERWRITE this list?`)) {
            return;
        }
        
        // Disable button and show loading
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Overwriting list...';
        
        try {
            // Use the stored criteria from generation (with all insurance companies AND leads data)
            const criteria = {
                state: this.uploadCriteria?.state || '',
                insuranceCompanies: this.uploadCriteria?.insuranceCompanies || [],  // Pass ALL companies
                daysUntilExpiry: this.uploadCriteria?.daysUntilExpiry || 30,
                skipDays: this.uploadCriteria?.skipDays || 0,  // Include skip days for 5/30 filter
                limit: this.uploadCriteria?.limit || this.uploadCriteria?.totalLeads || 100,  // Use EXACT count from generation
                leads: this.uploadCriteria?.leads || []  // ADD THE ACTUAL LEADS DATA
            };

            console.log(`📤 Uploading ${criteria.leads.length} leads to list ${this.selectedListId}`);
            
            // Overwrite the selected list
            const result = await this.overwriteList(this.selectedListId, criteria);
            
            if (result.success) {
                // Check if it's async upload
                if (result.status === 'uploading') {
                    // Show processing message
                    this.showProcessingMessage(result);
                } else {
                    // Show success message
                    this.showUploadResult(result);
                    // Don't re-enable button after success - user should close dialog
                    return;
                }
            } else {
                throw new Error(result.error || 'Upload failed');
            }

        } catch (error) {
            alert('Upload failed: ' + error.message);
            console.error('Upload error:', error);
            // Re-enable button on error
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    },

    // Show processing message for async uploads
    showProcessingMessage: function(result) {
        // Try modal content first, then modal body
        let modalContent = document.getElementById('vicidialModalContent');
        if (!modalContent) {
            modalContent = document.querySelector('#vicidialUploadModal .modal-body');
        }
        
        if (!modalContent) {
            alert('Upload started! Processing in background...');
            return;
        }
        
        modalContent.innerHTML = `
            <div class="upload-result">
                <div class="text-center">
                    <i class="fas fa-cloud-upload-alt fa-5x text-primary mb-3"></i>
                    <h3 class="mb-3">Upload Started!</h3>
                    <p class="lead">${result.message}</p>
                    
                    <div class="alert alert-info mt-4">
                        <i class="fas fa-info-circle"></i> 
                        The leads are being uploaded to list ${result.list_id} in the background.
                        This process will continue even if you close this dialog.
                    </div>
                    
                    <div class="spinner-border text-primary mt-3" role="status">
                        <span class="sr-only">Processing...</span>
                    </div>
                </div>
                
                <div class="modal-footer mt-4">
                    <button class="btn btn-primary" onclick="vicidialUploader.closeDialog()">
                        Close
                    </button>
                    <a href="https://204.13.233.29/vicidial/admin.php?ADD=311&list_id=${result.list_id}" 
                       target="_blank" class="btn btn-success">
                        <i class="fas fa-external-link-alt"></i> View List in Vicidial
                    </a>
                </div>
            </div>
        `;
    },
    
    // Show upload result
    showUploadResult: function(result) {
        const modalBody = document.querySelector('#vicidialUploadModal .modal-body');

        // Log result for debugging
        console.log('Upload result received:', JSON.stringify(result, null, 2));

        // Ensure we have valid data
        if (!result) {
            console.error('No result data received');
            return;
        }

        // Prevent showing results if already showing (avoid overwrite)
        if (this.resultsShown) {
            console.log('Results already shown, preventing duplicate display');
            return;
        }
        this.resultsShown = true;

        // Calculate failed count from errors
        const failedCount = result.errors ? result.errors.length : 0;

        modalBody.innerHTML = `
            <div class="upload-result">
                <div class="alert alert-success">
                    <h3><i class="fas fa-check-circle"></i> List Overwrite Complete!</h3>
                </div>

                <div class="result-details" style="text-align: center; padding: 20px;">
                    <p style="font-size: 1.2em;"><strong>List ID:</strong> ${this.selectedListId || result.list_id || 'Unknown'}</p>
                    <p style="font-size: 1.1em;"><strong>Status:</strong> List has been cleared and new leads added</p>
                    ${result.message ? `<p style="font-size: 1.3em; color: #28a745; margin-top: 20px;"><i class="fas fa-check"></i> ${result.message}</p>` : ''}
                </div>

                ${result.errors && result.errors.length > 0 ? `
                <div class="result-preview">
                    <h4>Sample Errors:</h4>
                    <ul style="color: #dc3545;">
                        ${result.errors.slice(0, 5).map(error => `
                            <li>${error}</li>
                        `).join('')}
                    </ul>
                </div>
                ` : ''}

                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="vicidialUploader.closeDialog()">
                        Close
                    </button>
                    <a href="https://204.13.233.29/vicidial/admin.php?ADD=311&list_id=${this.selectedListId || result.list_id || '1006'}"
                       target="_blank" class="btn btn-success">
                        <i class="fas fa-external-link-alt"></i> View in Vicidial
                    </a>
                </div>
            </div>
        `;
    },

    // Helper function to display list selection (reusable for cached and fresh lists)
    displayListSelection: function(lists, listsContainer, listSelection) {
        // Show list selection
        listSelection.style.display = 'block';

        // Build list selection HTML
        let listsHtml = '';
        lists.forEach((list, index) => {
            listsHtml += `
                <div class="list-item" style="
                    padding: 10px;
                    margin: 5px 0;
                    background: white;
                    border: 2px solid #dee2e6;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                " onclick="vicidialUploader.selectList('${list.list_id}', this)">
                    <input type="radio" name="vicidialList" value="${list.list_id}"
                           id="list_${list.list_id}" style="margin-right: 10px;">
                    <label for="list_${list.list_id}" style="cursor: pointer; margin: 0;">
                        <strong>List ${list.list_id}</strong> - ${list.list_name || 'Unnamed List'}
                        ${list.campaign ? `<span style="color: #6c757d; margin-left: 10px;">[Campaign: ${list.campaign}]</span>` : ''}
                    </label>
                </div>
            `;
        });

        listsContainer.innerHTML = listsHtml;
    },

    // Close dialog
    closeDialog: function() {
        const modal = document.getElementById('vicidialUploadModal');
        if (modal) {
            modal.style.display = 'none';
        }
        // Reset the results shown flag for next upload
        this.resultsShown = false;

        // Preserve cached lists for subsequent uploads
        // (don't reset cachedLists or listsAlreadyLoaded here)
    },

    // Complete reset function for split uploads
    completeReset: function() {
        console.log('🔄 Performing complete Vicidial uploader reset');

        // Close and remove modal
        const modal = document.getElementById('vicidialUploadModal');
        if (modal) {
            modal.remove();
        }

        // Reset ALL internal states
        this.resultsShown = false;
        this.uploadCriteria = null;
        this.selectedListId = null;

        // Keep cached lists but reset the loaded flag to force fresh display
        // Don't clear cachedLists to avoid re-scanning
        if (this.cachedLists) {
            console.log('💾 Preserving cached lists but resetting display state');
            this.listsAlreadyLoaded = true; // Keep this true to use cache
        }

        console.log('✅ Complete reset finished - ready for fresh upload');
    },

    // Force refresh lists function
    forceRefreshLists: async function() {
        console.log('🔄 Force refreshing Vicidial lists...');
        console.log('📋 Previous cached lists count:', this.cachedLists ? this.cachedLists.length : 0);

        // Clear cache to force fresh scan
        this.cachedLists = null;
        this.listsAlreadyLoaded = false;

        // Show loading indicator
        const statusDiv = document.getElementById('vicidialConnectionStatus');
        statusDiv.className = 'alert alert-info';
        statusDiv.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            Refreshing lists from Vicidial... Please wait.
        `;

        try {
            // Reload lists (this will now do a fresh scan)
            await this.loadVicidialLists();
            console.log('✅ Lists refresh completed');
            console.log('📋 New lists count:', this.cachedLists ? this.cachedLists.length : 0);
        } catch (error) {
            console.error('❌ Error refreshing lists:', error);
            statusDiv.className = 'alert alert-danger';
            statusDiv.innerHTML = `
                <i class="fas fa-exclamation-circle"></i>
                Error refreshing lists: ${error.message}
            `;
        }
    }
};

// Add CSS for the upload modal
const uploadStyles = `
<style>
.upload-result {
    padding: 20px;
}

/* Removed unused stat card styles */

.result-details {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    margin: 20px 0;
}

.result-preview {
    margin-top: 20px;
}

.result-preview ul {
    list-style: none;
    padding: 0;
}

.result-preview li {
    padding: 8px;
    background: #fff;
    margin: 5px 0;
    border-left: 3px solid #28a745;
    border-radius: 4px;
}

.form-section {
    margin-bottom: 25px;
    padding-bottom: 20px;
    border-bottom: 1px solid #dee2e6;
}

.form-section h3 {
    margin-bottom: 15px;
    color: #495057;
}

.form-row {
    display: flex;
    gap: 15px;
    margin-bottom: 15px;
}

.form-group {
    flex: 1;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
    color: #495057;
}

.form-control {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 14px;
}

.alert {
    padding: 12px 16px;
    border-radius: 4px;
    margin-bottom: 20px;
}

.alert-info {
    background: #d1ecf1;
    color: #0c5460;
    border: 1px solid #bee5eb;
}

.alert-success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.alert-danger {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}
</style>
`;

// Add styles to document if not already added
if (!document.getElementById('vicidialUploaderStyles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'vicidialUploaderStyles';
    styleElement.innerHTML = uploadStyles;
    document.head.appendChild(styleElement.firstElementChild);
}

// Make globally available
window.vicidialUploader = vicidialUploader;