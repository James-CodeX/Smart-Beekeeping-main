// This file will be dynamically generated during the Netlify build process
// The default values are only used for local development
try {
    window.ENV = window.ENV || {
        SUPABASE_URL: 'https://bjmdehrjrvbojtewvltf.supabase.co',
        SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqbWRlaHJqcnZib2p0ZXd2bHRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzNTc4MjMsImV4cCI6MjA1NDkzMzgyM30.8MYy2CGMAKjO0qa62_xgADKegrgmMTdInCVQeilg2X8'
    };
    
    console.log('Environment variables loaded from env.js');
    console.log('Supabase URL:', window.ENV.SUPABASE_URL);
    console.log('Supabase key exists:', !!window.ENV.SUPABASE_ANON_KEY);
} catch (error) {
    console.error('Error initializing environment variables:', error);
} 