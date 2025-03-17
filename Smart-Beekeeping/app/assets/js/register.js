// JavaScript for register.html

// Handle registration form submission
async function handleRegister() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const repeatPassword = document.getElementById('repeatPassword').value;
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;

    if (password !== repeatPassword) {
        alert('Passwords do not match!');
        return;
    }

    try {
        await register(email, password, firstName, lastName);
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed: ' + error.message);
    }
}

// Check if user is already logged in and redirect if needed
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        // User is already logged in, redirect to dashboard
        window.location.href = 'index.html';
    }
}); 