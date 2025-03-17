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
    if (!confirm('Are you sure you want to delete this apiary? This action cannot be undone.')) {
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('apiaries')
            .delete()
            .eq('id', apiaryId);
            
        if (error) throw error;
        
        // Reload the apiaries list
        await loadApiaries();
        
    } catch (error) {
        console.error('Error deleting apiary:', error);
        alert('Failed to delete apiary: ' + error.message);
    }
}

function editApiary(apiaryId) {
    // TODO: Implement edit functionality
    alert('Edit functionality coming soon!');
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