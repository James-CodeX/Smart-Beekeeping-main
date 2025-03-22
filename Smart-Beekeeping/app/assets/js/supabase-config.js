// Supabase configuration
async function initializeSupabase() {
    try {
        // Get environment variables
        const SUPABASE_URL = window.ENV?.SUPABASE_URL;
        const SUPABASE_ANON_KEY = window.ENV?.SUPABASE_ANON_KEY;

        console.log('Supabase config values:', { 
            url: SUPABASE_URL ? 'Found' : 'Missing', 
            key: SUPABASE_ANON_KEY ? 'Found' : 'Missing' 
        });

        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            throw new Error('Supabase configuration missing. Please check env.js file.');
        }

        // Initialize Supabase client if not already initialized
        if (!window.supabase || typeof window.supabase.from !== 'function') {
            console.log('Creating new Supabase client...');
            
            if (typeof supabase === 'undefined' || !supabase.createClient) {
                throw new Error('Supabase library not loaded. Make sure to include the script tag.');
            }
            
            const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            window.supabase = client;
        }
        
        // Test the connection
        console.log('Testing connection to Supabase...');
        try {
            const { data, error } = await window.supabase.from('apiaries').select('count').limit(1);
            
            if (error) {
                console.error('Connection test failed:', error);
            } else {
                console.log('Connection test successful!');
            }
        } catch (connError) {
            console.error('Connection test exception:', connError);
            // We'll continue anyway, as this might just be permissions
        }
    
        console.log('Supabase initialized successfully');
        
        // Initialize data manager after Supabase is ready
        await ensureSupabaseDataManager();
        
        return window.supabase;
    } catch (error) {
        console.error('Error initializing Supabase:', error);
        throw error;
    }
}

// Make sure SupabaseDataManager is initialized
async function ensureSupabaseDataManager() {
    try {
        // Check if the data manager already exists
        if (window.supabaseDataManager) {
            console.log('SupabaseDataManager already exists');
            return;
        }
        
        console.log('Creating new SupabaseDataManager instance...');
        
        // Check if the SupabaseDataManager class is available
        if (typeof SupabaseDataManager !== 'function') {
            console.error('SupabaseDataManager class not found. Make sure supabase-data-manager.js is loaded.');
            return;
        }
        
        // Create a new instance
        window.supabaseDataManager = new SupabaseDataManager();
        
        // Verify auth status for debugging purposes
        try {
            const { data, error } = await window.supabase.auth.getSession();
            if (error) {
                console.error('Auth check failed after creating data manager:', error);
            } else {
                console.log('Auth session exists:', !!data.session);
                if (data.session) {
                    console.log('User is authenticated with ID:', data.session.user.id);
                } else {
                    console.warn('No user session exists');
                }
            }
        } catch (authError) {
            console.error('Auth check exception:', authError);
        }
    } catch (error) {
        console.error('Error creating SupabaseDataManager:', error);
    }
}

// Export the initialization function
window.initializeSupabase = initializeSupabase; 