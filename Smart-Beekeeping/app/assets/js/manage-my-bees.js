// JavaScript for manage-my-bees.html

let currentApiaryId = null;

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await updateProfileUI();
    await loadApiaries();
});

async function loadApiaries() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        const { data: apiaries, error } = await supabaseClient
            .from('apiaries')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const apiariesList = document.getElementById('apiariesList');
        
        if (!apiaries || apiaries.length === 0) {
            apiariesList.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info">
                        <h4 class="alert-heading">Welcome to Smart Nyuki!</h4>
                        <p>You haven't added any apiaries yet. Click the "Add New Apiary" button to get started.</p>
                    </div>
                </div>
            `;
            return;
        }

        apiariesList.innerHTML = apiaries.map(apiary => `
            <div class="col-md-6 col-xl-4 mb-4">
                <div class="card shadow h-100">
                    <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                        <h6 class="m-0 font-weight-bold text-primary">${escapeHtml(apiary.name)}</h6>
                        <div class="dropdown no-arrow">
                            <a class="dropdown-toggle" href="#" role="button" id="dropdownMenuLink" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                <i class="fas fa-ellipsis-v fa-sm fa-fw text-gray-400"></i>
                            </a>
                            <div class="dropdown-menu dropdown-menu-right shadow animated--fade-in" aria-labelledby="dropdownMenuLink">
                                <div class="dropdown-header">Apiary Actions:</div>
                                <a class="dropdown-item" href="#" onclick="viewHives(${apiary.id})">View Hives</a>
                                <a class="dropdown-item" href="#" onclick="editApiary(${apiary.id})">Edit Apiary</a>
                                <div class="dropdown-divider"></div>
                                <a class="dropdown-item text-danger" href="#" onclick="deleteApiary(${apiary.id})">Delete</a>
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <strong>Location:</strong> ${escapeHtml(apiary.location)}
                        </div>
                        ${apiary.notes ? `<div class="mb-3"><strong>Notes:</strong> ${escapeHtml(apiary.notes)}</div>` : ''}
                        <div class="d-flex justify-content-between align-items-center mt-4">
                            <span><i class="fas fa-calendar-alt me-1"></i> ${new Date(apiary.created_at).toLocaleDateString()}</span>
                            <button class="btn btn-primary btn-sm" onclick="viewHives(${apiary.id})">
                                <i class="fas fa-bee me-1"></i> View Hives
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading apiaries:', error);
        alert('Failed to load apiaries: ' + error.message);
    }
}

async function viewHives(apiaryId) {
    try {
        currentApiaryId = apiaryId;
        const { data: apiary, error: apiaryError } = await supabaseClient
            .from('apiaries')
            .select('*')
            .eq('id', apiaryId)
            .single();
            
        if (apiaryError) throw apiaryError;
        
        const { data: hives, error: hivesError } = await supabaseClient
            .from('hive_details')
            .select('*')
            .eq('apiary_id', apiaryId);
            
        if (hivesError) throw hivesError;
        
        // Update UI to show apiary details
        document.getElementById('apiaryDetailsTitle').textContent = apiary.name;
        document.getElementById('apiaryDetailsLocation').textContent = apiary.location;
        document.getElementById('apiaryDetailsNotes').textContent = apiary.notes || 'No notes';
        document.getElementById('apiaryDetailsCreated').textContent = new Date(apiary.created_at).toLocaleDateString();
        
        // Update add hive button
        document.getElementById('addHiveBtn').href = `add-hive.html?apiary=${apiaryId}`;
        
        // Update hives list
        const hivesList = document.getElementById('hivesList');
        
        if (!hives || hives.length === 0) {
            hivesList.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info">
                        <p>No hives added to this apiary yet. Add a hive to get started.</p>
                        <a href="add-hive.html?apiary=${apiaryId}" class="btn btn-primary btn-sm">
                            <i class="fas fa-plus-circle me-1"></i> Add Hive
                        </a>
                    </div>
                </div>
            `;
        } else {
            hivesList.innerHTML = hives.map(hive => `
                <div class="col-md-6 mb-4">
                    <div class="card shadow">
                        <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                            <h6 class="m-0 font-weight-bold text-primary">
                                <i class="fas fa-circle text-success me-1" style="font-size: 0.7rem;"></i>
                                ${escapeHtml(hive.hive_name || 'Unnamed Hive')}
                            </h6>
                            <div class="dropdown no-arrow">
                                <a class="dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    <i class="fas fa-ellipsis-v fa-sm fa-fw text-gray-400"></i>
                                </a>
                                <div class="dropdown-menu dropdown-menu-right shadow animated--fade-in">
                                    <div class="dropdown-header">Hive Actions:</div>
                                    <a class="dropdown-item" href="index.html?hive=${hive.id}">View Dashboard</a>
                                    <a class="dropdown-item" href="#" onclick="editHive(${hive.id})">Edit Details</a>
                                    <div class="dropdown-divider"></div>
                                    <a class="dropdown-item text-danger" href="#" onclick="deleteHive(${hive.id})">Delete</a>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="mb-2"><strong>Node ID:</strong> ${escapeHtml(hive.node_id || 'Unknown')}</div>
                            <div class="mb-2"><strong>Type:</strong> ${capitalizeFirstLetter(escapeHtml(hive.hive_type || 'Unknown'))}</div>
                            <div class="mb-2"><strong>Installed:</strong> ${hive.date_installed ? new Date(hive.date_installed).toLocaleDateString() : 'Unknown'}</div>
                            <div class="d-flex justify-content-between align-items-center mt-3">
                                <span class="badge bg-success">Active</span>
                                <a href="index.html?hive=${hive.id}" class="btn btn-primary btn-sm">
                                    <i class="fas fa-chart-line me-1"></i> View Data
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        
        // Show apiary details view
        document.getElementById('apiariesView').style.display = 'none';
        document.getElementById('apiaryDetailsView').style.display = 'block';
        
    } catch (error) {
        console.error('Error viewing hives:', error);
        alert('Failed to load hive details: ' + error.message);
    }
}

function goBackToApiaries() {
    document.getElementById('apiariesView').style.display = 'block';
    document.getElementById('apiaryDetailsView').style.display = 'none';
    currentApiaryId = null;
}

async function deleteApiary(apiaryId) {
    if (!confirm('Are you sure you want to delete this apiary? This will delete ALL hives and data associated with this apiary and cannot be undone.')) {
        return;
    }
    
    try {
        // First, get all hives in this apiary
        const { data: hives, error: hivesError } = await supabaseClient
            .from('hive_details')
            .select('id, node_id')
            .eq('apiary_id', apiaryId);
            
        if (hivesError) throw hivesError;
        
        // If there are hives, delete their data and then the hives
        if (hives && hives.length > 0) {
            // Collect all node_ids to delete associated data
            const nodeIds = hives.map(hive => hive.node_id).filter(Boolean);
            
            if (nodeIds.length > 0) {
                // Delete data associated with these nodes
                try {
                    const { error: dataError } = await supabaseClient
                        .from('hive_data')
                        .delete()
                        .in('node_id', nodeIds);
                        
                    if (dataError) {
                        console.error('Warning: Error deleting hive data:', dataError);
                        // Continue with deletion even if this fails
                    }
                } catch (dataDeleteError) {
                    console.error('Warning: Error during data deletion:', dataDeleteError);
                    // Continue with deletion even if this fails
                }
            }
            
            // Delete all hives in this apiary
            const { error: hivesDeleteError } = await supabaseClient
                .from('hive_details')
                .delete()
                .eq('apiary_id', apiaryId);
                
            if (hivesDeleteError) throw hivesDeleteError;
        }
        
        // Finally, delete the apiary
        const { error } = await supabaseClient
            .from('apiaries')
            .delete()
            .eq('id', apiaryId);
            
        if (error) throw error;
        
        // Reload the apiaries list
        await loadApiaries();
        
        // If we're in the apiary details view, go back to the main view
        if (currentApiaryId === apiaryId) {
            goBackToApiaries();
        }
        
        alert('Apiary and all associated hives and data deleted successfully!');
        
    } catch (error) {
        console.error('Error deleting apiary:', error);
        alert('Failed to delete apiary: ' + error.message);
    }
}

function editApiary(apiaryId) {
    // Load the apiary data and populate the edit form
    try {
        supabaseClient
            .from('apiaries')
            .select('*')
            .eq('id', apiaryId)
            .single()
            .then(({ data: apiary, error }) => {
                if (error) throw error;
                
                // Create a modal for editing if it doesn't exist
                if (!document.getElementById('editApiaryModal')) {
                    const modalHtml = `
                    <div class="modal fade" id="editApiaryModal" tabindex="-1" aria-labelledby="editApiaryModalLabel" aria-hidden="true">
                        <div class="modal-dialog">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title" id="editApiaryModalLabel">Edit Apiary</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <form id="editApiaryForm" onsubmit="handleUpdateApiary(event)">
                                    <div class="modal-body">
                                        <input type="hidden" id="edit_apiary_id">
                                        <div class="mb-3">
                                            <label class="form-label" for="edit_apiaryName"><strong>Apiary Name</strong> <span class="text-danger">*</span></label>
                                            <input class="form-control" type="text" id="edit_apiaryName" name="edit_apiaryName" placeholder="Enter Apiary Name" required>
                                            <small class="text-muted">Give your apiary a unique, descriptive name</small>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label" for="edit_apiaryLocation"><strong>Location</strong> <span class="text-danger">*</span></label>
                                            <input class="form-control" type="text" id="edit_apiaryLocation" name="edit_apiaryLocation" placeholder="Enter Location" required>
                                            <small class="text-muted">Physical location of the apiary</small>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label" for="edit_apiaryNotes"><strong>Notes</strong></label>
                                            <textarea class="form-control" id="edit_apiaryNotes" name="edit_apiaryNotes" rows="3" placeholder="Enter any additional notes about the apiary"></textarea>
                                        </div>
                                    </div>
                                    <div class="modal-footer">
                                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                        <button type="submit" class="btn btn-primary">Save Changes</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>`;
                    
                    document.body.insertAdjacentHTML('beforeend', modalHtml);
                }
                
                // Populate the form with the apiary data
                document.getElementById('edit_apiary_id').value = apiary.id;
                document.getElementById('edit_apiaryName').value = apiary.name || '';
                document.getElementById('edit_apiaryLocation').value = apiary.location || '';
                document.getElementById('edit_apiaryNotes').value = apiary.notes || '';
                
                // Show the modal
                const editModal = new bootstrap.Modal(document.getElementById('editApiaryModal'));
                editModal.show();
            });
    } catch (error) {
        console.error('Error loading apiary for edit:', error);
        alert('Failed to load apiary details: ' + error.message);
    }
}

async function handleUpdateApiary(event) {
    event.preventDefault();
    
    try {
        const apiaryId = document.getElementById('edit_apiary_id').value;
        
        const apiaryData = {
            name: document.getElementById('edit_apiaryName').value,
            location: document.getElementById('edit_apiaryLocation').value,
            notes: document.getElementById('edit_apiaryNotes').value,
            updated_at: new Date().toISOString()
        };
        
        const { error } = await supabaseClient
            .from('apiaries')
            .update(apiaryData)
            .eq('id', apiaryId);
            
        if (error) throw error;
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editApiaryModal'));
        modal.hide();
        
        // Reload apiaries list
        await loadApiaries();
        
        // If we're in the apiary details view, reload that too
        if (currentApiaryId === parseInt(apiaryId)) {
            viewHives(currentApiaryId);
        }
        
        alert('Apiary updated successfully!');
        
    } catch (error) {
        console.error('Error updating apiary:', error);
        alert('Failed to update apiary: ' + error.message);
    }
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

async function handleLogout() {
    await logout();
}

async function handleAddApiary(event) {
    event.preventDefault();
    
    try {
        const user = await getCurrentUser();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        
        const apiaryData = {
            name: document.getElementById('apiaryName').value,
            location: document.getElementById('apiaryLocation').value,
            notes: document.getElementById('apiaryNotes').value,
            user_id: user.id,
            created_at: new Date().toISOString()
        };
        
        const { data, error } = await supabaseClient
            .from('apiaries')
            .insert([apiaryData])
            .select();
            
        if (error) throw error;
        
        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(document.getElementById('addApiaryModal'));
        modal.hide();
        document.getElementById('addApiaryForm').reset();
        
        // Reload apiaries list
        await loadApiaries();
        
        alert('Apiary added successfully!');
        
    } catch (error) {
        console.error('Error adding apiary:', error);
        alert('Failed to add apiary: ' + error.message);
    }
}

function editHive(hiveId) {
    try {
        supabaseClient
            .from('hive_details')
            .select('*')
            .eq('id', hiveId)
            .single()
            .then(({ data: hive, error }) => {
                if (error) throw error;
                
                // Create a modal for editing if it doesn't exist
                if (!document.getElementById('editHiveModal')) {
                    const modalHtml = `
                    <div class="modal fade" id="editHiveModal" tabindex="-1" aria-labelledby="editHiveModalLabel" aria-hidden="true">
                        <div class="modal-dialog modal-lg">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title" id="editHiveModalLabel">Edit Hive</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <form id="editHiveForm" onsubmit="handleUpdateHive(event)">
                                    <div class="modal-body">
                                        <input type="hidden" id="edit_hive_id">
                                        <div class="row mb-3">
                                            <div class="col-sm-6">
                                                <label class="form-label" for="edit_nodeid"><strong>Node ID</strong> <span class="text-danger">*</span></label>
                                                <input class="form-control" type="text" id="edit_nodeid" name="edit_nodeid" placeholder="Enter ESP32 Node ID (e.g., 000000000000)" pattern="[A-Za-z0-9]+" required>
                                                <small class="text-muted">ID of your ESP32 node</small>
                                            </div>
                                            <div class="col-sm-6">
                                                <label class="form-label" for="edit_hivename"><strong>Hive Name</strong></label>
                                                <input class="form-control" type="text" id="edit_hivename" name="edit_hivename" placeholder="Enter Hive Name">
                                                <small class="text-muted">Optional name for your hive</small>
                                            </div>
                                        </div>
                                        <div class="row mb-3">
                                            <div class="col-sm-6">
                                                <label class="form-label" for="edit_location"><strong>Location</strong></label>
                                                <input class="form-control" type="text" id="edit_location" name="edit_location" placeholder="Enter Hive Location">
                                            </div>
                                            <div class="col-sm-6">
                                                <label class="form-label" for="edit_queenage"><strong>Queen Age (months)</strong></label>
                                                <input class="form-control" type="number" id="edit_queenage" name="edit_queenage" min="0" placeholder="Enter Queen Age">
                                            </div>
                                        </div>
                                        <div class="row mb-3">
                                            <div class="col-sm-6">
                                                <label class="form-label" for="edit_hivetype"><strong>Hive Type</strong></label>
                                                <select class="form-control" id="edit_hivetype" name="edit_hivetype">
                                                    <option value="">Select Hive Type</option>
                                                    <option value="langstroth">Langstroth</option>
                                                    <option value="topBar">Top Bar</option>
                                                    <option value="warre">Warré</option>
                                                    <option value="flowhive">Flow Hive</option>
                                                </select>
                                            </div>
                                            <div class="col-sm-6">
                                                <label class="form-label" for="edit_dateinstalled"><strong>Date Installed</strong></label>
                                                <input class="form-control" type="date" id="edit_dateinstalled" name="edit_dateinstalled">
                                            </div>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label" for="edit_hivenotes"><strong>Notes</strong></label>
                                            <textarea class="form-control" id="edit_hivenotes" name="edit_hivenotes" rows="3" placeholder="Enter any additional notes about the hive"></textarea>
                                        </div>
                                    </div>
                                    <div class="modal-footer">
                                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                        <button type="submit" class="btn btn-primary">Save Changes</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>`;
                    
                    document.body.insertAdjacentHTML('beforeend', modalHtml);
                }
                
                // Populate the form with hive data
                document.getElementById('edit_hive_id').value = hive.id;
                document.getElementById('edit_nodeid').value = hive.node_id || '';
                document.getElementById('edit_hivename').value = hive.hive_name || '';
                document.getElementById('edit_location').value = hive.location || '';
                document.getElementById('edit_queenage').value = hive.queen_age || '';
                document.getElementById('edit_hivetype').value = hive.hive_type || '';
                
                // Format the date for input if it exists
                if (hive.date_installed) {
                    const date = new Date(hive.date_installed);
                    const formattedDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
                    document.getElementById('edit_dateinstalled').value = formattedDate;
                } else {
                    document.getElementById('edit_dateinstalled').value = '';
                }
                
                document.getElementById('edit_hivenotes').value = hive.notes || '';
                
                // Show the modal
                const editModal = new bootstrap.Modal(document.getElementById('editHiveModal'));
                editModal.show();
            });
    } catch (error) {
        console.error('Error loading hive for edit:', error);
        alert('Failed to load hive details: ' + error.message);
    }
}

async function handleUpdateHive(event) {
    event.preventDefault();
    
    try {
        const hiveId = document.getElementById('edit_hive_id').value;
        
        const hiveData = {
            node_id: document.getElementById('edit_nodeid').value,
            hive_name: document.getElementById('edit_hivename').value,
            location: document.getElementById('edit_location').value,
            queen_age: document.getElementById('edit_queenage').value || null,
            hive_type: document.getElementById('edit_hivetype').value,
            date_installed: document.getElementById('edit_dateinstalled').value || null,
            notes: document.getElementById('edit_hivenotes').value,
            updated_at: new Date().toISOString()
        };
        
        const { error } = await supabaseClient
            .from('hive_details')
            .update(hiveData)
            .eq('id', hiveId);
            
        if (error) throw error;
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editHiveModal'));
        modal.hide();
        
        // Reload the hives list if we're in the apiary details view
        if (currentApiaryId) {
            viewHives(currentApiaryId);
        }
        
        alert('Hive updated successfully!');
        
    } catch (error) {
        console.error('Error updating hive:', error);
        alert('Failed to update hive: ' + error.message);
    }
}

async function deleteHive(hiveId) {
    if (!confirm('Are you sure you want to delete this hive? This action cannot be undone and will delete all associated data.')) {
        return;
    }
    
    try {
        // First, try to get the hive details to check the node_id for deleting associated data
        const { data: hive, error: fetchError } = await supabaseClient
            .from('hive_details')
            .select('node_id, apiary_id')
            .eq('id', hiveId)
            .single();
            
        if (fetchError) throw fetchError;
        
        // Delete any sensor data associated with this hive's node_id
        if (hive.node_id) {
            try {
                // Delete from hive_data table
                const { error: dataError } = await supabaseClient
                    .from('hive_data')
                    .delete()
                    .eq('node_id', hive.node_id);
                
                if (dataError) {
                    console.error('Warning: Error deleting hive data:', dataError);
                    // Continue with deletion even if this fails
                }
            } catch (dataDeleteError) {
                console.error('Warning: Error during data deletion:', dataDeleteError);
                // Continue with hive deletion even if this fails
            }
        }
        
        // Delete the hive
        const { error: deleteError } = await supabaseClient
            .from('hive_details')
            .delete()
            .eq('id', hiveId);
            
        if (deleteError) throw deleteError;
        
        // Reload the hives list if we're in the apiary details view
        if (currentApiaryId) {
            viewHives(currentApiaryId);
        }
        
        alert('Hive and associated data deleted successfully!');
        
    } catch (error) {
        console.error('Error deleting hive:', error);
        alert('Failed to delete hive: ' + error.message);
    }
} 