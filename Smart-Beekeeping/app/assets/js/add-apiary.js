// JavaScript for add-apiary.html

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await updateProfileUI();

    // Show welcome message if redirected from add-hive
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('welcome')) {
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'alert alert-info alert-dismissible fade show';
        welcomeDiv.innerHTML = `
            <h4 class="alert-heading">Welcome to Smart Nyuki!</h4>
            <p>To get started with your beekeeping journey, first create an apiary - this is a location where you'll keep your hives.</p>
            <p>Once you've added an apiary, you can start adding hives to it.</p>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        document.querySelector('.container-fluid h3').after(welcomeDiv);
    }
});

async function handleAddApiary(event) {
    event.preventDefault();
    
    try {
        const user = await getCurrentUser();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        const name = document.getElementById('apiaryName').value;
        const location = document.getElementById('apiaryLocation').value;
        const notes = document.getElementById('apiaryNotes').value;

        // Input validation
        if (!name || !location) {
            throw new Error('Please fill in all required fields');
        }

        const apiaryData = {
            name: name,
            location: location,
            notes: notes || null,
            user_id: user.id
        };

        console.log('Adding apiary:', apiaryData);

        const { data, error } = await supabaseClient
            .from('apiaries')
            .insert([apiaryData])
            .select();

        if (error) {
            console.error('Error adding apiary:', error);
            if (error.message.includes('does not exist')) {
                // Create the apiaries table if it doesn't exist
                await supabaseClient.rpc('setup_apiary_system');
                // Try the insert again
                const { data: retryData, error: retryError } = await supabaseClient
                    .from('apiaries')
                    .insert([apiaryData])
                    .select();
                    
                if (retryError) throw retryError;
                data = retryData;
            } else {
                throw error;
            }
        }

        console.log('Apiary added successfully:', data);

        // Success! Show message and redirect
        alert('Apiary added successfully! You can now add hives to this apiary.');
        window.location.href = 'add-hive.html';

    } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'An error occurred while adding the apiary.');
    }
}

async function handleLogout() {
    await logout();
} 