// Supabase Data Manager

class SupabaseDataManager {
    constructor() {
        this.supabase = window.supabase;
        if (!this.supabase) {
            console.error('Supabase client not initialized when creating SupabaseDataManager');
            // We'll initialize it later when supabase becomes available
        } else {
            console.log('SupabaseDataManager initialized with supabase client');
        }
    }

    // Check and ensure supabase client is available
    ensureSupabaseClient() {
        if (!this.supabase && window.supabase) {
            this.supabase = window.supabase;
            console.log('Supabase client attached to SupabaseDataManager');
        }
        
        if (!this.supabase) {
            throw new Error('Supabase client not available');
        }
    }

    // Get user's apiaries
    async getApiaries() {
        // Make sure supabase client is available
        this.ensureSupabaseClient();

        try {
            const { data: { user }, error: userError } = await this.supabase.auth.getUser();
            if (userError) {
                console.error('Error getting user in getApiaries:', userError);
                throw userError;
            }
            
            if (!user) {
                console.error('No authenticated user in getApiaries');
                throw new Error('No authenticated user');
            }

            console.log('Fetching apiaries for user:', user.id);
            const { data, error } = await this.supabase
                .from('apiaries')
                .select('*')
                .eq('user_id', user.id)
                .order('name', { ascending: true });

            if (error) {
                console.error('Error fetching apiaries:', error);
                throw error;
            }
            
            console.log('Fetched apiaries:', data);
            return data;
        } catch (error) {
            console.error('Error in getApiaries:', error);
            throw error;
        }
    }

    // Get hives for a specific apiary
    async getHives(apiaryId) {
        // Make sure supabase client is available
        this.ensureSupabaseClient();

        try {
            console.log('Getting hives for apiary ID:', apiaryId);
            const { data, error } = await this.supabase
                .from('hive_details')
                .select('*')
                .eq('apiary_id', apiaryId);

            if (error) {
                console.error('Error getting hives:', error);
                throw error;
            }
            
            console.log('Hives retrieved:', data);
            return data || [];
        } catch (error) {
            console.error('Error in getHives:', error);
            throw error;
        }
    }

    // Get metrics for a specific hive within a time range
    async getHiveMetrics(hiveNodeId, timeRange = '24h') {
        // Make sure supabase client is available
        this.ensureSupabaseClient();

        try {
            console.log('Getting metrics for hive node ID:', hiveNodeId, 'with time range:', timeRange);
            
            const now = new Date();
            let startTime;

            switch (timeRange) {
                case '1h':
                    startTime = new Date(now - 60 * 60 * 1000);
                    break;
                case '6h':
                    startTime = new Date(now - 6 * 60 * 60 * 1000);
                    break;
                case '24h':
                    startTime = new Date(now - 24 * 60 * 60 * 1000);
                    break;
                case '7d':
                    startTime = new Date(now - 7 * 24 * 60 * 60 * 1000);
                    break;
                case '30d':
                    startTime = new Date(now - 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startTime = new Date(now - 24 * 60 * 60 * 1000);
            }

            const { data, error } = await this.supabase
                .from('hives')
                .select('*')
                .eq('node_id', hiveNodeId)
                .gte('created_at', startTime.toISOString())
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error getting hive metrics:', error);
                throw error;
            }
            
            console.log('Hive metrics retrieved:', data);
            return data || [];
        } catch (error) {
            console.error('Error in getHiveMetrics:', error);
            throw error;
        }
    }

    // Get latest metrics for a specific hive
    async getLatestHiveMetrics(hiveNodeId) {
        const { data, error } = await this.supabase
            .from('hives')
            .select('*')
            .eq('node_id', hiveNodeId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) throw error;
        return data;
    }

    // Subscribe to real-time updates for a specific hive
    subscribeToHiveUpdates(hiveNodeId, callback) {
        // Make sure supabase client is available
        this.ensureSupabaseClient();
        
        try {
            console.log('Setting up subscription for hive node ID:', hiveNodeId);
            
            const channel = this.supabase
                .channel(`hive-${hiveNodeId}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'hives',
                    filter: `node_id=eq.${hiveNodeId}`
                }, payload => {
                    console.log('Received new metrics via subscription:', payload.new);
                    callback(payload.new);
                })
                .subscribe((status) => {
                    console.log('Subscription status:', status);
                });
            
            return channel;
        } catch (error) {
            console.error('Error setting up subscription:', error);
            throw error;
        }
    }

    // Get all hives for the current user
    async getAllUserHives() {
        try {
            // Get current user
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) throw new Error('No authenticated user');

            // Get user's apiaries
            const { data: apiaries, error: apiariesError } = await this.supabase
                .from('apiaries')
                .select('id')
                .eq('user_id', user.id);

            if (apiariesError) throw apiariesError;
            if (!apiaries || apiaries.length === 0) {
                console.log('No apiaries found for user');
                return [];
            }

            const apiaryIds = apiaries.map(a => a.id);
            
            // Get all hives from user's apiaries
            const { data: hives, error: hivesError } = await this.supabase
                .from('hive_details')
                .select('*')
                .in('apiary_id', apiaryIds)
                .order('created_at', { ascending: false });

            if (hivesError) throw hivesError;
            return hives || [];
        } catch (error) {
            console.error('Error in getAllUserHives:', error);
            throw error;
        }
    }

    // Get health status for a specific hive
    getHiveHealth(metrics) {
        if (!metrics) return { status: 'unknown', issues: [] };
        
        const health = {
            status: 'healthy',
            issues: []
        };

        // Temperature check (ideal: 32-36°C)
        if (metrics.temperature < 32) {
            health.issues.push({ 
                metric: 'temperature', 
                status: 'low', 
                value: metrics.temperature,
                message: 'Temperature below ideal range'
            });
        } else if (metrics.temperature > 36) {
            health.issues.push({ 
                metric: 'temperature', 
                status: 'high', 
                value: metrics.temperature,
                message: 'Temperature above ideal range'
            });
        }

        // Humidity check (ideal: 40-60%)
        if (metrics.humidity < 40) {
            health.issues.push({ 
                metric: 'humidity', 
                status: 'low', 
                value: metrics.humidity,
                message: 'Humidity below ideal range'
            });
        } else if (metrics.humidity > 60) {
            health.issues.push({ 
                metric: 'humidity', 
                status: 'high', 
                value: metrics.humidity,
                message: 'Humidity above ideal range'
            });
        }

        // Set overall status based on issues
        if (health.issues.length > 0) {
            health.status = 'warning';
        }
        if (health.issues.length > 2) {
            health.status = 'critical';
        }

        return health;
    }
}

// Initialize global instance when the script is loaded
window.addEventListener('DOMContentLoaded', () => {
    try {
        if (window.supabase) {
            window.supabaseDataManager = new SupabaseDataManager();
            console.log('Global SupabaseDataManager instance created');
        } else {
            console.warn('Supabase client not available yet, deferring SupabaseDataManager creation');
        }
    } catch (error) {
        console.error('Error initializing SupabaseDataManager:', error);
    }
}); 