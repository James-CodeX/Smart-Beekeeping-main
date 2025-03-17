// Initialize Supabase client
let supabaseClient;
try {
    const { createClient } = supabase;
    supabaseClient = createClient(
        config.getSupabaseUrl(),
        config.getSupabaseAnonKey()
    );
    console.log('Supabase client initialized');
} catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    // Don't alert here, as it would block the UI before we can handle auth properly
    supabaseClient = null;
}

// Basic auth check function
async function checkAuth() {
    const currentPath = window.location.pathname;
    console.log('Checking auth on page:', currentPath);
    
    // Skip auth check for login and register pages
    if (currentPath.includes('login.html') || currentPath.includes('register.html')) {
        console.log('Skipping auth check on login/register page');
        return;
    }

    try {
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized');
        }

        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (error) {
            console.error('Auth check error:', error);
        }
        
        if (!session) {
            console.log('No active session found, redirecting to login');
            window.location.href = 'login.html';
        } else {
            console.log('User authenticated successfully:', session.user.email);
        }
    } catch (error) {
        console.error('Critical auth error:', error);
        alert('There was an error with authentication. Please try logging in again.');
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
    try {
        const user = await getCurrentUser();
        if (user) {
            // Look for profile elements by various common selectors
            const profileElements = document.querySelectorAll('.text-gray-600.small, .d-none.d-lg-inline.me-2.text-gray-600.small');
            
            if (profileElements.length > 0) {
                // Get the user's profile data
                const { data: profile, error } = await supabaseClient
                    .from('profiles')
                    .select('full_name')
                    .eq('id', user.id)
                    .single();

                // Update all matching profile elements
                profileElements.forEach(element => {
                    if (!error && profile) {
                        element.textContent = profile.full_name || user.email;
                    } else {
                        element.textContent = user.email;
                    }
                });
                
                console.log('Profile UI updated successfully');
            } else {
                console.log('No profile elements found on this page');
            }
        }
    } catch (error) {
        console.error('Error updating profile UI:', error);
    }
}

// Initialize auth check
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await updateProfileUI();
});

