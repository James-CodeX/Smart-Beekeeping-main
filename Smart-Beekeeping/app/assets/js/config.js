/**
 * Configuration file for Smart-Beekeeping application
 * 
 * This file provides access to configuration variables
 * with fallback values for local development.
 */

// Config object to store environment variables
const config = {
    // Default/fallback values for Supabase
    supabaseUrl: 'https://bjmdehrjrvbojtewvltf.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqbWRlaHJqcnZib2p0ZXd2bHRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzNTc4MjMsImV4cCI6MjA1NDkzMzgyM30.8MYy2CGMAKjO0qa62_xgADKegrgmMTdInCVQeilg2X8',
    
    // Initialize config - load from window globals if available
    init() {
        try {
            // Check if env variables are defined globally (for production)
            if (window.ENV && window.ENV.SUPABASE_URL) {
                this.supabaseUrl = window.ENV.SUPABASE_URL;
            }
            
            if (window.ENV && window.ENV.SUPABASE_ANON_KEY) {
                this.supabaseAnonKey = window.ENV.SUPABASE_ANON_KEY;
            }
            
            console.log('Configuration initialized successfully');
        } catch (error) {
            console.error('Error initializing config:', error);
            // Fallback values will be used
        }
        return this;
    },
    
    // Get Supabase URL
    getSupabaseUrl() {
        return this.supabaseUrl;
    },
    
    // Get Supabase anonymous key
    getSupabaseAnonKey() {
        return this.supabaseAnonKey;
    }
};

// Initialize config object immediately
config.init();

// Log configuration status (but don't log sensitive keys in production)
console.log('Config initialized with Supabase URL:', config.getSupabaseUrl()); 