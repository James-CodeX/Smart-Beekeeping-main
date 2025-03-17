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

// Get historical hive data for all hives owned by the user
async function getHistoricalHiveData() {
    console.log('Fetching historical hive data');
    try {
        // First check authentication
        const user = await getCurrentUser();
        if (!user) {
            console.error('User not authenticated');
            return [];
        }
        
        console.log('Authenticated user:', user.id);
        
        // First, get the hive details owned by the user
        const { data: hiveDetails, error: detailsError } = await supabaseClient
            .from('hive_details')
            .select('*')
            .eq('user_id', user.id);
            
        // If there's an error with the first query, try an alternative approach
        if (detailsError) {
            console.error('Error fetching hive details:', detailsError);
            
            // Try alternative query - maybe the table name is different
            try {
                console.log('Trying alternative query...');
                
                // Try with 'hives' table
                const { data: altHiveDetails, error: altError } = await supabaseClient
                    .from('hives')
                    .select('*')
                    .eq('user_id', user.id);
                    
                if (altError) {
                    console.error('Alternative query failed:', altError);
                    
                    // Try with no user filter
                    console.log('Trying with no user filter...');
                    const { data: allHives, error: allHivesError } = await supabaseClient
                        .from('hive_details')
                        .select('*')
                        .limit(100);
                        
                    if (allHivesError) {
                        console.error('Query with no user filter failed:', allHivesError);
                        throw detailsError; // Use original error
                    }
                    
                    console.log('Query with no user filter returned data:', allHives ? allHives.length : 0);
                    if (allHives && allHives.length > 0) {
                        console.log('Sample all hives record:', JSON.stringify(allHives[0]));
                        return allHives;
                    }
                    
                    throw detailsError;
                }
                
                console.log('Alternative query succeeded:', altHiveDetails);
                if (altHiveDetails && altHiveDetails.length > 0) {
                    console.log('Sample alternative hive detail:', JSON.stringify(altHiveDetails[0]));
                    return altHiveDetails; // These might be the actual hive data records already
                }
            } catch (altError) {
                console.error('All hive details queries failed');
                throw detailsError;
            }
        }
        
        if (!hiveDetails || hiveDetails.length === 0) {
            console.log('No hives found for this user');
            
            // Try one more approach - maybe there's data but not linked to user
            try {
                console.log('Trying fallback query for all hive data...');
                const { data: allHiveData, error: allDataError } = await supabaseClient
                    .from('hives')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(100);
                    
                if (!allDataError && allHiveData && allHiveData.length > 0) {
                    console.log('Fallback query found data:', allHiveData.length);
                    return allHiveData;
                }
            } catch (fallbackError) {
                console.error('Fallback query failed:', fallbackError);
            }
            
            return [];
        }
        
        console.log('Found', hiveDetails.length, 'hives for user');
        if (hiveDetails.length > 0) {
            console.log('Sample hive detail:', JSON.stringify(hiveDetails[0]));
        }
        
        // Store the current valid hives for later filtering
        window.currentValidHives = hiveDetails;
        
        // Extract node IDs, ensure they're all valid
        const nodeIds = hiveDetails
            .filter(h => h.node_id !== null && h.node_id !== undefined)
            .map(h => h.node_id);
            
        console.log('Valid node IDs extracted:', nodeIds);
        
        // If no valid node IDs found, try alternative field names
        if (nodeIds.length === 0) {
            console.log('No node_id fields found, trying alternative field names');
            
            // Try other possible field names for node ID
            const alternativeIds = hiveDetails
                .filter(h => {
                    // Try various possible field names
                    return h.nodeId !== null && h.nodeId !== undefined ||
                           h.node !== null && h.node !== undefined ||
                           h.device_id !== null && h.device_id !== undefined;
                })
                .map(h => h.nodeId || h.node || h.device_id);
                
            if (alternativeIds.length > 0) {
                console.log('Found alternative IDs:', alternativeIds);
                
                // Use these IDs instead
                const { data, error } = await supabaseClient
                    .from('hives')
                    .select('*')
                    .in('node_id', alternativeIds)
                    .order('created_at', { ascending: false })
                    .limit(100);

                if (error) {
                    console.error('Error fetching historical data with alternative IDs:', error);
                    throw error;
                }
                
                console.log('Historical data retrieved with alternative IDs:', data ? data.length : 0, 'records');
                return data || [];
            }
            
            // If we still can't find any IDs, try using the hive IDs directly
            const hiveIds = hiveDetails.map(h => h.id).filter(id => id !== null && id !== undefined);
            
            if (hiveIds.length > 0) {
                console.log('Trying with hive IDs directly:', hiveIds);
                
                const { data, error } = await supabaseClient
                    .from('hives')
                    .select('*')
                    .in('id', hiveIds)
                    .order('created_at', { ascending: false })
                    .limit(100);
                    
                if (!error && data && data.length > 0) {
                    console.log('Found data using hive IDs:', data.length);
                    return data;
                }
            }
            
            // If we still can't find any data, try a last approach without filtering
            console.log('Last resort - trying to fetch all hives data without filtering');
            const { data: allData, error: allError } = await supabaseClient
                .from('hives')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);
                
            if (!allError && allData && allData.length > 0) {
                console.log('Found unfiltered data:', allData.length);
                
                // Filter for only valid node_ids from our hive_details
                const validNodeIdsSet = new Set(nodeIds);
                const filteredData = allData.filter(record => {
                    return record.node_id && validNodeIdsSet.has(record.node_id);
                });
                
                console.log(`Filtered from ${allData.length} to ${filteredData.length} records to remove deleted hives`);
                return filteredData;
            }
            
            // If we still can't find any IDs, return empty array
            console.log('No valid node IDs found in any field');
            return [];
        }
        
        console.log('Fetching historical data for node IDs:', nodeIds);

        // Then get the historical hive data
        const { data, error } = await supabaseClient
            .from('hives')
            .select('*')
            .in('node_id', nodeIds)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Error fetching historical data:', error);
            
            // Try without the node_id filter as a last resort
            console.log('Trying without node_id filter...');
            const { data: unfilteredData, error: unfilteredError } = await supabaseClient
                .from('hives')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);
                
            if (unfilteredError) {
                console.error('Error fetching unfiltered data:', unfilteredError);
                throw error;
            }
            
            console.log('Got unfiltered data:', unfilteredData ? unfilteredData.length : 0);
            
            // Filter for only valid node_ids from our hive_details
            const validNodeIdsSet = new Set(nodeIds);
            const filteredData = unfilteredData ? unfilteredData.filter(record => {
                return record.node_id && validNodeIdsSet.has(record.node_id);
            }) : [];
            
            console.log(`Filtered from ${unfilteredData ? unfilteredData.length : 0} to ${filteredData.length} records to remove deleted hives`);
            return filteredData;
        }
        
        console.log('Historical data retrieved successfully:', data ? data.length : 0, 'records');
        if (data && data.length > 0) {
            console.log('Sample historical data record:', JSON.stringify(data[0]));
        } else {
            console.warn('No historical data found for the given node IDs');
            
            // Try one more time without filtering
            console.log('Trying without node_id filter as fallback...');
            const { data: fallbackData, error: fallbackError } = await supabaseClient
                .from('hives')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);
                
            if (!fallbackError && fallbackData && fallbackData.length > 0) {
                console.log('Found fallback data:', fallbackData.length);
                
                // Filter for only valid node_ids from our hive_details
                const validNodeIdsSet = new Set(nodeIds);
                const filteredData = fallbackData.filter(record => {
                    return record.node_id && validNodeIdsSet.has(record.node_id);
                });
                
                console.log(`Filtered from ${fallbackData.length} to ${filteredData.length} records to remove deleted hives`);
                return filteredData;
            }
        }
        
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

