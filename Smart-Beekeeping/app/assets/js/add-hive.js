// JavaScript for add-hive.html

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await loadApiaries();
    
    // Check for apiary ID in URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.has('apiary')) {
        const apiaryId = urlParams.get('apiary');
        document.getElementById('apiaryId').value = apiaryId;
    }
});

// Load apiaries into select dropdown
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
            .eq('user_id', user.id);

        if (error) {
            console.error('Error loading apiaries:', error);
            return;
        }

        const apiarySelect = document.getElementById('apiaryId');
        apiarySelect.innerHTML = '<option value="">Select Apiary</option>';

        if (apiaries && apiaries.length > 0) {
            apiaries.forEach(apiary => {
                const option = document.createElement('option');
                option.value = apiary.id;
                option.textContent = apiary.name;
                apiarySelect.appendChild(option);
            });
        } else {
            // No apiaries found - show message
            const formContainer = document.querySelector('.card-body');
            const noApiaryMessage = document.createElement('div');
            noApiaryMessage.className = 'alert alert-info mt-3';
            noApiaryMessage.innerHTML = `
                <p>You don't have any apiaries yet. Please create an apiary first.</p>
                <a href="manage-my-bees.html" class="btn btn-primary">Manage My Bees</a>
            `;
            formContainer.appendChild(noApiaryMessage);
            
            // Disable the form
            document.getElementById('addHiveForm').querySelectorAll('input, select, button[type="submit"]').forEach(el => {
                el.disabled = true;
            });
        }
    } catch (error) {
        console.error('Error loading apiaries:', error);
        alert('Failed to load apiaries: ' + error.message);
    }
}

// Handle the form submission
async function handleAddHive(event) {
    event.preventDefault();
    
    try {
        const user = await getCurrentUser();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        // Get form values
        const apiaryId = document.getElementById('apiaryId').value;
        const nodeId = document.getElementById('nodeId').value;
        const location = document.getElementById('location').value;
        const hiveType = document.getElementById('hiveType').value;
        const dateInstalled = document.getElementById('dateInstalled').value;
        const colonySource = document.getElementById('colonySource').value;
        const queenAge = document.getElementById('queenAge').value;
        const notes = document.getElementById('notes').value;

        // Validation
        if (!apiaryId || !nodeId) {
            throw new Error('Please fill in all required fields');
        }

        // Check if device ID is already claimed
        const { data: existingHives, error: checkError } = await supabaseClient
            .from('hive_details')
            .select('*')
            .eq('node_id', nodeId);

        if (checkError) {
            console.error('Check error:', checkError);
            throw new Error(`Failed to check Node ID: ${checkError.message}`);
        }

        if (existingHives && existingHives.length > 0) {
            throw new Error('This Node ID is already assigned to a hive. Please use a different one.');
        }

        // Prepare hive details
        const hiveDetails = {
            user_id: user.id,
            apiary_id: apiaryId,
            node_id: nodeId,
            hive_name: location, // Using location as hive name
            hive_type: hiveType,
            date_installed: dateInstalled,
            queen_age: queenAge ? parseInt(queenAge) : null,
            colony_source: colonySource,
            location: location,
            notes: notes || null,
            created_at: new Date().toISOString()
        };

        console.log('Inserting hive details:', hiveDetails);

        // Insert the new hive details
        const { data: insertData, error: insertError } = await supabaseClient
            .from('hive_details')
            .insert([hiveDetails])
            .select();

        if (insertError) {
            console.error('Insert error:', insertError);
            throw new Error(`Failed to add hive: ${insertError.message}`);
        }

        console.log('Insert successful:', insertData);

        // Success! Show message and redirect
        alert('Hive successfully added! You can now view its data on the dashboard.');
        window.location.href = `manage-my-bees.html`;

    } catch (error) {
        console.error('Error adding hive:', error);
        alert(error.message || 'An error occurred while adding the hive.');
    }
}

async function handleLogout() {
    await logout();
} 