// JavaScript for login.html

// Handle login form submission
async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    await login(email, password);
}

// Check if user is already logged in and redirect if needed
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        // User is already logged in, redirect to dashboard
        window.location.href = 'index.html';
    }
}); 