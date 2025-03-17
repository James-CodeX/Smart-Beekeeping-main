// Initialize Supabase client
const SUPABASE_URL = 'https://bjmdehrjrvbojtewvltf.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqbWRlaHJqcnZib2p0ZXd2bHRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzNTc4MjMsImV4cCI6MjA1NDkzMzgyM30.8MYy2CGMAKjO0qa62_xgADKegrgmMTdInCVQeilg2X8'

const { createClient } = supabase
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Basic auth check function
async function checkAuth() {
    const currentPath = window.location.pathname;
    
    // Skip auth check for login and register pages
    if (currentPath.includes('login.html') || currentPath.includes('register.html')) {
        return;
    }

    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
    }
}

// Get hive data
async function getHiveData() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        // First get the user's hive details through their apiaries
        const { data: hiveDetails, error: detailsError } = await supabaseClient
            .from('hive_details')
            .select('node_id')
            .eq('user_id', user.id);

        if (detailsError) throw detailsError;
        if (!hiveDetails || hiveDetails.length === 0) return null;

        // Then get the actual hive data
        const { data: latestData, error } = await supabaseClient
            .from('hives')
            .select('*')
            .in('node_id', hiveDetails.map(h => h.node_id))
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) throw error;
        return latestData?.[0] || null;
    } catch (error) {
        console.error('Error fetching hive data:', error);
        return null;
    }
}

// Get historical hive data
async function getHistoricalHiveData() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        // First get the user's hive details through their apiaries
        const { data: hiveDetails, error: detailsError } = await supabaseClient
            .from('hive_details')
            .select('node_id')
            .eq('user_id', user.id);

        if (detailsError) throw detailsError;
        if (!hiveDetails || hiveDetails.length === 0) return [];

        // Then get the historical hive data
        const { data, error } = await supabaseClient
            .from('hives')
            .select('*')
            .in('node_id', hiveDetails.map(h => h.node_id))
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching historical hive data:', error);
        return [];
    }
}

// Check if node exists and has data
async function checkNodeExists(nodeId) {
    try {
        const { data, error } = await supabaseClient
            .from('hives')
            .select('node_id, created_at')
            .eq('node_id', nodeId)
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) {
            console.error('Error checking node:', error);
            throw error;
        }

        console.log('Node check result:', data);
        return data && data.length > 0;
    } catch (error) {
        console.error('Error checking node existence:', error);
        return false;
    }
}

// Login function
async function login(email, password) {
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        if (data.session) {
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
    }
}

// Register function
async function register(email, password, firstName, lastName) {
    try {
        // Input validation
        if (!email || !password || !firstName || !lastName) {
            throw new Error('All fields are required');
        }

        // First, sign up the user
        const { data: { user }, error: signUpError } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: `${firstName} ${lastName}`,
                    first_name: firstName,
                    last_name: lastName
                }
            }
        });
        
        if (signUpError) throw signUpError;
        if (!user) throw new Error('Registration failed');

        // Now create or update the profile
        const { error: profileError } = await supabaseClient
            .from('profiles')
            .upsert({
                id: user.id,
                full_name: `${firstName} ${lastName}`,
                first_name: firstName,
                last_name: lastName,
                updated_at: new Date().toISOString()
            });

        if (profileError) {
            console.error('Profile update error:', profileError);
            // Don't throw here as the user is already created
        }
        
        alert('Registration successful! Please check your email for verification.');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

// Logout function
async function logout() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Logout failed: ' + error.message);
    }
}

// Get current user
async function getCurrentUser() {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    return session?.user || null;
}

// Update profile UI
async function updateProfileUI() {
    const user = await getCurrentUser();
    if (user) {
        const profileNameElement = document.querySelector('.text-gray-600.small');
        if (profileNameElement) {
            const { data: profile, error } = await supabaseClient
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single();

            if (!error && profile) {
                profileNameElement.textContent = profile.full_name || user.email;
            } else {
                profileNameElement.textContent = user.email;
            }
        }
    }
}

// Initialize auth check
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await updateProfileUI();
});

