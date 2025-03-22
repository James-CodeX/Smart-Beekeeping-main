// JavaScript for index.html

// Global variables
let metricsChart, temperatureChart, humidityChart, weightChart, soundChart;
let currentHiveSubscription = null;

// Initialize dashboard
async function initializeDashboard() {
    try {
        // Initialize Supabase
        await window.initializeSupabase();
        
        // Wait for auth to be checked
        await waitForAuth();
        
        // Get current user
        const { data: { user }, error: userError } = await window.supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) {
            window.location.href = '/login.html';
            return;
        }
        
        // Initialize the charts
        initializeCharts();
        
        // Load user's apiaries and populate the selector
        await loadApiarySelector();
        
        // Set up event listeners
        setupEventListeners();
        
        // Schedule periodic updates for non-realtime data
        setInterval(() => {
            updateAlertsDropdown();
            updateMessagesDropdown();
        }, 30000);
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showAlert('Error initializing dashboard: ' + error.message, 'error');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM fully loaded, initializing dashboard...');
    
    try {
        // Initialize alert container
        const alertsContainer = document.createElement('div');
        alertsContainer.id = 'alerts-container';
        alertsContainer.className = 'position-fixed top-0 end-0 p-3';
        alertsContainer.style.zIndex = '1050';
        document.body.appendChild(alertsContainer);
        
        // Explicitly initialize Supabase with retries
        await initializeSupabaseWithRetry();
        
        // Load selectors after confirming Supabase is ready
        if (window.supabase) {
            console.log('Supabase initialized successfully, loading apiaries...');
            await loadApiarySelector();
        } else {
            console.error('Supabase not available after initialization attempts');
            showAlert('Error connecting to database. Please check console for details.', 'error');
        }
        
        // Set up event listeners
        setupEventListeners();
        
        // Set up logout handler
        setupLogoutHandler();
        
        // Show welcome message with debug instructions
        showAlert('Welcome to Smart Beekeeping! If you encounter issues, use the Debug button for diagnostics.', 'info');
        
        console.log('Dashboard initialization complete');
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showAlert('Error initializing dashboard: ' + error.message, 'error');
    }
});

// Explicitly initialize Supabase with retries
async function initializeSupabaseWithRetry(maxRetries = 3) {
    console.log('Initializing Supabase with retry...');
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Initialization attempt ${attempt}/${maxRetries}`);
            
            // Check if already initialized
            if (window.supabase && typeof window.supabase.from === 'function') {
                console.log('Supabase already initialized');
                return window.supabase;
            }
            
            // Confirm environment variables are loaded
            if (!window.ENV || !window.ENV.SUPABASE_URL || !window.ENV.SUPABASE_ANON_KEY) {
                console.error('Environment variables not properly loaded');
                throw new Error('Supabase environment variables missing');
            }
            
            // Check if initialization function exists
            if (typeof initializeSupabase !== 'function') {
                console.error('initializeSupabase function not found');
                throw new Error('Supabase initialization function not found');
            }
            
            // Call initialization function
            await initializeSupabase();
            
            // Verify initialization was successful
            if (!window.supabase || typeof window.supabase.from !== 'function') {
                throw new Error('Supabase not properly initialized');
            }
            
            console.log('Supabase initialized successfully on attempt', attempt);
            return window.supabase;
        } catch (error) {
            console.error(`Initialization attempt ${attempt} failed:`, error);
            
            if (attempt === maxRetries) {
                console.error('All initialization attempts failed');
                showAlert('Failed to connect to database after multiple attempts', 'error');
                throw error;
            }
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

// Load user's apiaries into the selector
async function loadApiarySelector() {
    console.log('Loading apiary selector...');
    
    try {
        // Get the selector element
        const selector = document.getElementById('apiarySelector');
        if (!selector) {
            console.error('Apiary selector element not found');
            return;
        }
        
        // Disable the selector during loading
        selector.disabled = true;
        selector.innerHTML = '<option value="" disabled selected>Loading apiaries...</option>';
        
        // Verify Supabase is initialized
        if (!window.supabase) {
            console.error('Supabase client not available for loadApiarySelector');
            selector.innerHTML = '<option value="" disabled selected>Database connection error</option>';
            showAlert('Database connection not available', 'error');
            return;
        }
        
        // Check authentication with explicit error handling
        console.log('Checking user authentication...');
        let userId;
        
        try {
            // Check if auth method exists first
            if (!window.supabase.auth || typeof window.supabase.auth.getSession !== 'function') {
                throw new Error('Authentication methods not available');
            }
            
            const { data, error } = await window.supabase.auth.getSession();
            
            if (error) {
                console.error('Auth error:', error);
                selector.innerHTML = '<option value="" disabled selected>Authentication error</option>';
                showAlert('Authentication error: ' + error.message, 'error');
                return;
            }
            
            if (!data || !data.session) {
                console.warn('No active session found');
                selector.innerHTML = '<option value="" disabled selected>Please log in</option>';
                showAlert('You need to log in to view your apiaries', 'warning');
                setTimeout(() => window.location.href = '/login.html', 2000);
                return;
            }
            
            userId = data.session.user.id;
            console.log('User ID:', userId);
        } catch (authError) {
            console.error('Exception during authentication check:', authError);
            selector.innerHTML = '<option value="" disabled selected>Authentication failed</option>';
            showAlert('Failed to check login status: ' + authError.message, 'error');
            return;
        }
        
        // Fetch apiaries directly from the database
        console.log('Fetching apiaries for user:', userId);
        try {
            const { data, error } = await window.supabase
                .from('apiaries')
                .select('*')
                .eq('user_id', userId);
                
            if (error) {
                console.error('Error fetching apiaries:', error);
                selector.innerHTML = '<option value="" disabled selected>Error loading apiaries</option>';
                showAlert('Error loading apiaries: ' + error.message, 'error');
                return;
            }
            
            const apiaries = data || [];
            console.log('Fetched apiaries:', apiaries);
            
            // Update the selector with apiaries
            selector.innerHTML = '<option value="" disabled selected>Select an apiary...</option>';
            
            if (apiaries.length > 0) {
                apiaries.forEach(apiary => {
                    const option = document.createElement('option');
                    option.value = apiary.id;
                    option.textContent = apiary.name;
                    selector.appendChild(option);
                });
                
                // Enable the selector
                selector.disabled = false;
                
                // Set the first apiary as selected
                selector.value = apiaries[0].id;
                
                // Trigger change event to load hives for the first apiary
                console.log('Triggering change event for first apiary');
                const event = new Event('change');
                selector.dispatchEvent(event);
            } else {
                console.log('No apiaries found for user');
                selector.innerHTML = '<option value="" disabled selected>No apiaries found</option>';
                
                // Offer to create a test apiary
                setTimeout(() => {
                    const createTest = confirm('No apiaries found. Would you like to create a test apiary for debugging?');
                    if (createTest) {
                        createTestApiary(userId);
                    }
                }, 1000);
            }
        } catch (apiaryError) {
            console.error('Exception during apiaries fetch:', apiaryError);
            selector.innerHTML = '<option value="" disabled selected>Error loading apiaries</option>';
            showAlert('Error loading apiaries: ' + apiaryError.message, 'error');
        }
    } catch (error) {
        console.error('Error in loadApiarySelector:', error);
        const selector = document.getElementById('apiarySelector');
        if (selector) {
            selector.innerHTML = '<option value="" disabled selected>Error loading apiaries</option>';
            selector.disabled = true;
        }
        showAlert('Error loading apiary selector: ' + error.message, 'error');
    }
}

// Load hives for the selected apiary
async function loadHiveSelector(apiaryId) {
    console.log(`Loading hive selector for apiary ID: ${apiaryId}`);
    
    try {
        // Ensure Supabase is initialized
        await ensureSupabaseInitialized();
        
        // Get the selector element
        const selector = document.getElementById('hiveSelector');
        if (!selector) {
            console.error('Hive selector element not found');
            return;
        }
        
        // Clear and disable the selector during loading
        selector.innerHTML = '<option value="" disabled selected>Loading hives...</option>';
        selector.disabled = true;
        
        // If no apiary is selected, disable the selector and return
        if (!apiaryId) {
            selector.innerHTML = '<option value="" disabled selected>Select an apiary first</option>';
            selector.disabled = true;
            return;
        }
        
        // Try to get hives using data manager first
        let hives = [];
        let useDirectMethod = false;
        
        if (window.supabaseDataManager) {
            try {
                console.log('Attempting to load hives via data manager...');
                hives = await window.supabaseDataManager.getHives(apiaryId);
                console.log('Hives from data manager:', hives);
            } catch (dataManagerError) {
                console.warn('Failed to get hives from data manager:', dataManagerError);
                useDirectMethod = true;
            }
        } else {
            console.warn('Data manager not available, using direct method');
            useDirectMethod = true;
        }
        
        // Fall back to direct method if needed
        if (useDirectMethod || hives.length === 0) {
            console.log('Using direct method to load hives...');
            const { data, error } = await window.supabase
                .from('hive_details')
                .select('*')
                .eq('apiary_id', apiaryId);
                
            if (error) {
                console.error('Error fetching hives:', error);
                selector.innerHTML = '<option value="" disabled selected>Error loading hives</option>';
                showAlert('Error loading hives: ' + error.message, 'error');
                return;
            }
            
            hives = data;
            console.log('Hives from direct query:', hives);
        }
        
        // Update the selector with hives
        selector.innerHTML = '<option value="" disabled selected>Select a hive...</option>';
        
        if (hives && hives.length > 0) {
            hives.forEach(hive => {
                const option = document.createElement('option');
                option.value = hive.node_id || hive.id;
                option.textContent = hive.hive_name || `Hive #${hive.node_id || hive.id}`;
                selector.appendChild(option);
            });
            
            // Enable the selector
            selector.disabled = false;
            
            // Set the first hive as selected
            selector.value = hives[0].node_id || hives[0].id;
            
            // Trigger change event to load data for the first hive
            console.log('Triggering change event for first hive');
            const event = new Event('change');
            selector.dispatchEvent(event);
        } else {
            console.log('No hives found for apiary');
            selector.innerHTML = '<option value="" disabled selected>No hives found</option>';
            selector.disabled = true;
            
            // Show add hive button if no hives found
            const addHiveButton = document.getElementById('addHiveButton');
            if (addHiveButton) {
                addHiveButton.style.display = 'inline-block';
            }
        }
    } catch (error) {
        console.error('Error loading hive selector:', error);
        const selector = document.getElementById('hiveSelector');
        if (selector) {
            selector.innerHTML = '<option value="" disabled selected>Error loading hives</option>';
            selector.disabled = true;
        }
        showAlert('Error loading hive selector: ' + error.message, 'error');
    }
}

// Function to set up all event listeners for selectors
function setupEventListeners() {
    console.log('Setting up event listeners for selectors');
    
    const apiarySelector = document.getElementById('apiarySelector');
    if (apiarySelector) {
        console.log('Setting up apiary selector event listener');
        // Remove existing listener to avoid duplicates
        apiarySelector.removeEventListener('change', handleApiaryChange);
        apiarySelector.addEventListener('change', handleApiaryChange);
    } else {
        console.warn('Apiary selector not found');
    }
    
    const hiveSelector = document.getElementById('hiveSelector');
    if (hiveSelector) {
        console.log('Setting up hive selector event listener');
        // Remove existing listener to avoid duplicates
        hiveSelector.removeEventListener('change', handleHiveChange);
        hiveSelector.addEventListener('change', handleHiveChange);
    } else {
        console.warn('Hive selector not found');
    }
    
    const timeRangeSelector = document.getElementById('timeRangeSelector');
    if (timeRangeSelector) {
        console.log('Setting up time range selector event listener');
        // Remove existing listener to avoid duplicates
        timeRangeSelector.removeEventListener('change', handleTimeRangeChange);
        timeRangeSelector.addEventListener('change', handleTimeRangeChange);
    } else {
        console.warn('Time range selector not found');
    }
}

// Handle apiary selector change
function handleApiaryChange(event) {
    const apiaryId = event.target.value;
    console.log('Apiary changed to:', apiaryId);
    if (apiaryId) {
        loadHiveSelector(apiaryId);
    }
}

// Handle hive selector change
function handleHiveChange(event) {
    const hiveNodeId = event.target.value;
    console.log('Hive changed to:', hiveNodeId);
    if (hiveNodeId) {
        loadHiveData(hiveNodeId);
        setupRealtimeSubscription(hiveNodeId);
    }
}

// Handle time range selector change
function handleTimeRangeChange(event) {
    const timeRange = event.target.value;
    console.log('Time range changed to:', timeRange);
    const hiveSelector = document.getElementById('hiveSelector');
    if (hiveSelector && hiveSelector.value) {
        loadHiveData(hiveSelector.value, timeRange);
    }
}

// Initialize selectors when document is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded, initializing selectors');
    loadApiarySelector();
    setupEventListeners();
});

// Subscribe to real-time updates for a hive
async function setupRealtimeSubscription(hiveNodeId) {
    console.log(`Setting up realtime subscription for hive ${hiveNodeId}`);
    
    // Unsubscribe from previous subscription if exists
    if (window.currentSubscription) {
        console.log('Unsubscribing from previous subscription');
        window.currentSubscription.unsubscribe();
        window.currentSubscription = null;
    }
    
    try {
        // Try using data manager first
        if (window.supabaseDataManager) {
            try {
                window.currentSubscription = await window.supabaseDataManager.subscribeToHiveUpdates(
                    hiveNodeId, 
                    (newMetrics) => {
                        console.log('Received new metrics via subscription:', newMetrics);
                        updateLatestReadings(newMetrics);
                        checkHiveHealth(newMetrics);
                        // Add new data point to charts
                        addMetricDataPoint(newMetrics);
                    }
                );
                console.log('Subscription set up via data manager');
            } catch (error) {
                console.warn('Failed to set up subscription via data manager:', error);
                setupDirectSubscription(hiveNodeId);
            }
        } else {
            // Fall back to direct subscription
            setupDirectSubscription(hiveNodeId);
        }
    } catch (error) {
        console.error('Error setting up realtime subscription:', error);
    }
}

// Set up direct subscription without data manager
function setupDirectSubscription(hiveNodeId) {
    console.log(`Setting up direct subscription for hive ${hiveNodeId}`);
    
    if (!window.supabase) {
        console.error('Supabase client not available for direct subscription');
        return;
    }
    
    try {
        window.currentSubscription = window.supabase
            .channel('hive-metrics-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'hives',
                    filter: `node_id=eq.${hiveNodeId}`
                },
                (payload) => {
                    console.log('Received new metrics via direct subscription:', payload.new);
                    updateLatestReadings(payload.new);
                    checkHiveHealth(payload.new);
                    // Add new data point to charts
                    addMetricDataPoint(payload.new);
                }
            )
            .subscribe((status) => {
                console.log('Direct subscription status:', status);
            });
        
        console.log('Direct subscription set up');
    } catch (error) {
        console.error('Error setting up direct subscription:', error);
    }
}

// Load data for the selected hive
async function loadHiveData(hiveNodeId, timeRange) {
    console.log(`Loading data for hive: ${hiveNodeId}, timeRange: ${timeRange}`);
    
    if (!timeRange) {
        const timeRangeSelector = document.getElementById('timeRangeSelector');
        timeRange = timeRangeSelector ? timeRangeSelector.value : '24h';
    }
    
    try {
        // Show loading indicators
        document.getElementById('temperature').textContent = 'Loading...';
        document.getElementById('humidity').textContent = 'Loading...';
        document.getElementById('weight').textContent = 'Loading...';
        document.getElementById('sound').textContent = 'Loading...';
        
        // Calculate time range
        const now = new Date();
        let startTime;
        
        switch (timeRange) {
            case '1h': startTime = new Date(now - 60 * 60 * 1000); break;
            case '6h': startTime = new Date(now - 6 * 60 * 60 * 1000); break;
            case '7d': startTime = new Date(now - 7 * 24 * 60 * 60 * 1000); break;
            case '30d': startTime = new Date(now - 30 * 24 * 60 * 60 * 1000); break;
            default: startTime = new Date(now - 24 * 60 * 60 * 1000); // 24h default
        }
        
        console.log(`Fetching metrics from ${startTime.toISOString()} to now`);
        
        // Direct database query
        const { data, error } = await window.supabase
            .from('hives')
            .select('*')
            .eq('node_id', hiveNodeId)
            .gte('created_at', startTime.toISOString())
            .order('created_at', { ascending: true });
            
        if (error) {
            console.error('Error fetching metrics:', error);
            showAlert('Error loading hive data: ' + error.message, 'error');
            return;
        }
        
        const metrics = data || [];
        console.log('Metrics retrieved:', metrics.length);
        
        if (metrics.length === 0) {
            console.warn('No metrics found for this hive in the selected time range');
            showAlert('No data found for this hive in the selected time range. Try selecting a longer time range.', 'warning');
            
            // Clear charts and display no data message
            document.getElementById('temperature').textContent = 'No data';
            document.getElementById('humidity').textContent = 'No data';
            document.getElementById('weight').textContent = 'No data';
            document.getElementById('sound').textContent = 'No data';
            return;
        }
        
        // Convert data to numbers
        const processedMetrics = metrics.map(metric => ({
            ...metric,
            temperature: Number(metric.temperature),
            humidity: Number(metric.humidity),
            weight: metric.weight !== undefined ? Number(metric.weight) : undefined,
            sound: metric.sound !== undefined ? Number(metric.sound) : undefined
        }));
        
        // Update the charts with the metrics data
        updateCharts(processedMetrics);
        
        // Update latest readings display with the most recent metrics
        const latestMetric = processedMetrics[processedMetrics.length - 1];
        updateLatestReadings(latestMetric);
        
        // Check hive health based on latest metrics
        checkHiveHealth(latestMetric);
        
        showAlert(`Loaded ${metrics.length} data points for hive #${hiveNodeId}`, 'success');
    } catch (error) {
        console.error('Error loading hive data:', error);
        showAlert('Error loading hive data: ' + error.message, 'error');
    }
}

// Update the current metrics display
function updateMetricsDisplay(data) {
    document.getElementById('temperature').textContent = `${data.temperature.toFixed(1)}°C`;
    document.getElementById('humidity').textContent = `${data.humidity.toFixed(1)}%`;
    document.getElementById('weight').textContent = `${data.weight.toFixed(1)} kg`;
    document.getElementById('sound').textContent = `${data.sound} dB`;
}

// Update charts with metrics data
function updateCharts(metrics) {
    console.log('Updating charts with metrics data, count:', metrics ? metrics.length : 0);
    
    if (!metrics || metrics.length === 0) {
        console.warn('No metrics data provided to updateCharts');
        return;
    }
    
    // Sort metrics by timestamp
    const sortedMetrics = [...metrics].sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
    );
    
    // Prepare data for charts
    const labels = sortedMetrics.map(metric => {
        const date = new Date(metric.created_at);
        return date.toLocaleTimeString();
    });
    
    const temperatureData = sortedMetrics.map(metric => Number(metric.temperature));
    const humidityData = sortedMetrics.map(metric => Number(metric.humidity));
    
    // Create temperature chart
    createOrUpdateChart('temperatureChart', 'Temperature (°C)', labels, temperatureData, 'rgb(255, 99, 132)');
    
    // Create humidity chart
    createOrUpdateChart('humidityChart', 'Humidity (%)', labels, humidityData, 'rgb(54, 162, 235)');
    
    // Create weight chart if data available
    if (sortedMetrics.some(metric => metric.weight !== undefined && metric.weight !== null)) {
        const weightData = sortedMetrics.map(metric => Number(metric.weight) || 0);
        createOrUpdateChart('weightChart', 'Weight (kg)', labels, weightData, 'rgb(75, 192, 192)');
    }
    
    // Create sound level chart if data available
    if (sortedMetrics.some(metric => metric.sound !== undefined && metric.sound !== null)) {
        const soundData = sortedMetrics.map(metric => Number(metric.sound) || 0);
        createOrUpdateChart('soundChart', 'Sound Level (dB)', labels, soundData, 'rgb(153, 102, 255)');
    }
    
    // Update the metrics chart
    updateMetricsChart(sortedMetrics);
}

// Update the combined metrics chart
function updateMetricsChart(metrics) {
    const canvas = document.getElementById('metricsChart');
    if (!canvas) {
        console.warn("Combined chart canvas not found");
        return;
    }
    
    // Format dates for labels
    const labels = metrics.map(metric => {
        const date = new Date(metric.created_at);
        return date.toLocaleTimeString();
    });
    
    // Extract data for each metric type
    const temperatureData = metrics.map(metric => Number(metric.temperature));
    const humidityData = metrics.map(metric => Number(metric.humidity));
    
    // Clear existing chart safely
    try {
        if (window.metricsChart && typeof window.metricsChart.destroy === 'function') {
            window.metricsChart.destroy();
        } else if (window.metricsChart) {
            console.warn('Invalid metrics chart instance found, cleaning up before recreating');
            window.metricsChart = null;
        }
    } catch (error) {
        console.error('Error destroying previous metrics chart:', error);
        window.metricsChart = null;
    }
    
    // Create datasets array
    const datasets = [
        {
            label: 'Temperature (°C)',
            data: temperatureData,
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            borderWidth: 2,
            yAxisID: 'y-temperature'
        },
        {
            label: 'Humidity (%)',
            data: humidityData,
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            borderWidth: 2,
            yAxisID: 'y-humidity'
        }
    ];
    
    // Add weight data if available
    if (metrics.some(metric => metric.weight !== undefined && metric.weight !== null)) {
        const weightData = metrics.map(metric => Number(metric.weight) || 0);
        datasets.push({
            label: 'Weight (kg)',
            data: weightData,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            borderWidth: 2,
            yAxisID: 'y-weight'
        });
    }
    
    // Add sound data if available
    if (metrics.some(metric => metric.sound !== undefined && metric.sound !== null)) {
        const soundData = metrics.map(metric => Number(metric.sound) || 0);
        datasets.push({
            label: 'Sound Level (dB)',
            data: soundData,
            borderColor: 'rgb(153, 102, 255)',
            backgroundColor: 'rgba(153, 102, 255, 0.1)',
            borderWidth: 2,
            yAxisID: 'y-sound'
        });
    }
    
    // Create new combined chart with error handling
    try {
        window.metricsChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    'y-temperature': {
                        type: 'linear',
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Temperature (°C)'
                        }
                    },
                    'y-humidity': {
                        type: 'linear',
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Humidity (%)'
                        }
                    },
                    'y-weight': {
                        type: 'linear',
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Weight (kg)'
                        },
                        display: metrics.some(metric => metric.weight !== undefined && metric.weight !== null)
                    },
                    'y-sound': {
                        type: 'linear',
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Sound (dB)'
                        },
                        display: metrics.some(metric => metric.sound !== undefined && metric.sound !== null)
                    }
                }
            }
        });
        console.log('Combined metrics chart created successfully');
    } catch (error) {
        console.error('Error creating combined metrics chart:', error);
        window.metricsChart = null;
        showAlert(`Failed to create combined chart: ${error.message}`, 'error');
    }
}

// Add a single metric data point to existing charts
function addMetricDataPoint(metric) {
    console.log('Adding metric data point to charts:', metric);
    
    const date = new Date(metric.created_at);
    const timestamp = date.toLocaleTimeString();
    
    // Update temperature chart
    if (metric.temperature !== undefined && window.temperatureChart) {
        window.temperatureChart.data.labels.push(timestamp);
        window.temperatureChart.data.datasets[0].data.push(Number(metric.temperature));
        
        // Remove oldest data if too many points
        if (window.temperatureChart.data.labels.length > 50) {
            window.temperatureChart.data.labels.shift();
            window.temperatureChart.data.datasets[0].data.shift();
        }
        
        window.temperatureChart.update();
    }
    
    // Update humidity chart
    if (metric.humidity !== undefined && window.humidityChart) {
        window.humidityChart.data.labels.push(timestamp);
        window.humidityChart.data.datasets[0].data.push(Number(metric.humidity));
        
        // Remove oldest data if too many points
        if (window.humidityChart.data.labels.length > 50) {
            window.humidityChart.data.labels.shift();
            window.humidityChart.data.datasets[0].data.shift();
        }
        
        window.humidityChart.update();
    }
    
    // Update weight chart
    if (metric.weight !== undefined && window.weightChart) {
        window.weightChart.data.labels.push(timestamp);
        window.weightChart.data.datasets[0].data.push(Number(metric.weight));
        
        // Remove oldest data if too many points
        if (window.weightChart.data.labels.length > 50) {
            window.weightChart.data.labels.shift();
            window.weightChart.data.datasets[0].data.shift();
        }
        
        window.weightChart.update();
    }
    
    // Update sound chart
    if (metric.sound !== undefined && window.soundChart) {
        window.soundChart.data.labels.push(timestamp);
        window.soundChart.data.datasets[0].data.push(Number(metric.sound));
        
        // Remove oldest data if too many points
        if (window.soundChart.data.labels.length > 50) {
            window.soundChart.data.labels.shift();
            window.soundChart.data.datasets[0].data.shift();
        }
        
        window.soundChart.update();
    }
    
    // Update metrics chart
    if (window.metricsChart) {
        // Add timestamp to labels
        window.metricsChart.data.labels.push(timestamp);
        
        // Update each dataset
        window.metricsChart.data.datasets.forEach((dataset) => {
            let value = null;
            if (dataset.label.includes('Temperature')) {
                value = metric.temperature;
            } else if (dataset.label.includes('Humidity')) {
                value = metric.humidity;
            } else if (dataset.label.includes('Weight')) {
                value = metric.weight;
            } else if (dataset.label.includes('Sound')) {
                value = metric.sound;
            }
            
            dataset.data.push(value !== undefined ? Number(value) : null);
        });
        
        // Remove oldest data if too many points
        if (window.metricsChart.data.labels.length > 50) {
            window.metricsChart.data.labels.shift();
            window.metricsChart.data.datasets.forEach(dataset => {
                dataset.data.shift();
            });
        }
        
        window.metricsChart.update();
    }
    
    // Update latest readings
    updateLatestReadings(metric);
}

// Update the latest readings display with new metric data
function updateLatestReadings(metric) {
    if (!metric) return;
    
    // Update temperature
    if (metric.temperature !== undefined) {
        const temperatureElement = document.getElementById('temperature');
        if (temperatureElement) {
            temperatureElement.textContent = `${Number(metric.temperature).toFixed(1)}°C`;
        }
        
        const tempStatus = document.getElementById('temperature-indicator');
        if (tempStatus) {
            const temp = Number(metric.temperature);
            if (temp < 32) {
                tempStatus.textContent = 'Too Cold';
            } else if (temp > 37) {
                tempStatus.textContent = 'Too Hot';
            } else {
                tempStatus.textContent = 'Optimal Range';
            }
        }
    }
    
    // Update humidity
    if (metric.humidity !== undefined) {
        const humidityElement = document.getElementById('humidity');
        if (humidityElement) {
            humidityElement.textContent = `${Number(metric.humidity).toFixed(1)}%`;
        }
        
        const humidityStatus = document.getElementById('humidity-indicator');
        if (humidityStatus) {
            const humidity = Number(metric.humidity);
            if (humidity < 50) {
                humidityStatus.textContent = 'Too Dry';
            } else if (humidity > 75) {
                humidityStatus.textContent = 'Too Humid';
            } else {
                humidityStatus.textContent = 'Normal Levels';
            }
        }
    }
    
    // Update weight
    if (metric.weight !== undefined) {
        const weightElement = document.getElementById('weight');
        if (weightElement) {
            weightElement.textContent = `${Number(metric.weight).toFixed(2)} kg`;
        }
        
        const weightStatus = document.getElementById('weight-indicator');
        if (weightStatus) {
            const weight = Number(metric.weight);
            if (weight < 1.2) {
                weightStatus.textContent = 'Low Weight';
            } else if (weight > 1.6) {
                weightStatus.textContent = 'High Weight';
            } else {
                weightStatus.textContent = 'Healthy Growth';
            }
        }
    }
    
    // Update sound
    if (metric.sound !== undefined) {
        const soundElement = document.getElementById('sound');
        if (soundElement) {
            soundElement.textContent = `${Number(metric.sound).toFixed(1)} dB`;
        }
        
        const soundStatus = document.getElementById('sound-indicator');
        if (soundStatus) {
            const sound = Number(metric.sound);
            if (sound < 30) {
                soundStatus.textContent = 'Low Activity';
            } else if (sound > 60) {
                soundStatus.textContent = 'High Activity';
            } else {
                soundStatus.textContent = 'Normal Activity';
            }
        }
    }
}

// Function to check hive health based on metrics
function checkHiveHealth(latestMetric) {
    if (!latestMetric) return;
    
    console.log('Checking hive health with metrics:', latestMetric);
    
    // Get health status element
    const healthStatusElement = document.getElementById('hiveHealthStatus');
    const healthDescriptionElement = document.getElementById('hiveHealthDescription');
    
    if (!healthStatusElement || !healthDescriptionElement) {
        console.warn('Health status elements not found');
        return;
    }
    
    // Convert metrics to numbers if they're strings
    const temp = typeof latestMetric.temperature === 'string' ? parseFloat(latestMetric.temperature) : latestMetric.temperature;
    const humidity = typeof latestMetric.humidity === 'string' ? parseFloat(latestMetric.humidity) : latestMetric.humidity;
    const weight = typeof latestMetric.weight === 'string' ? parseFloat(latestMetric.weight) : latestMetric.weight;
    const sound = typeof latestMetric.sound === 'string' ? parseFloat(latestMetric.sound) : latestMetric.sound;
    
    // Check for any out-of-range values
    let issues = [];
    
    // Temperature checks (optimal range 32-36°C for brood nest)
    if (temp !== undefined && temp !== null) {
        if (temp < 32) issues.push('Temperature too low');
        if (temp > 36) issues.push('Temperature too high');
    }
    
    // Humidity checks (optimal range 40-60%)
    if (humidity !== undefined && humidity !== null) {
        if (humidity < 40) issues.push('Humidity too low');
        if (humidity > 60) issues.push('Humidity too high');
    }
    
    // Weight checks (sudden drops could indicate swarming or theft)
    // This is just a placeholder - actual implementation would compare with previous readings
    if (weight !== undefined && weight !== null && weight < 15) {
        issues.push('Weight unusually low');
    }
    
    // Sound checks (high sound levels might indicate distress)
    if (sound !== undefined && sound !== null && sound > 65) {
        issues.push('Unusual sound levels detected');
    }
    
    // Update health status
    if (issues.length === 0) {
        healthStatusElement.textContent = 'Good';
        healthStatusElement.className = 'text-success';
        healthDescriptionElement.textContent = 'All metrics are within normal ranges.';
    } else {
        healthStatusElement.textContent = 'Attention Needed';
        healthStatusElement.className = 'text-warning';
        healthDescriptionElement.textContent = issues.join(', ') + '.';
    }
}

// Create or update chart
function createOrUpdateChart(chartId, label, labels, data, backgroundColor) {
    console.log(`Creating/updating chart: ${chartId} with ${data.length} data points`);
    
    const canvas = document.getElementById(chartId);
    if (!canvas) {
        console.warn(`Canvas element with ID '${chartId}' not found`);
        return;
    }
    
    // More safely destroy the existing chart if it exists
    try {
        if (window[chartId] && typeof window[chartId].destroy === 'function') {
            window[chartId].destroy();
        } else if (window[chartId]) {
            console.warn(`Invalid chart instance found for ${chartId}, cleaning up before recreating`);
            window[chartId] = null;
        }
    } catch (error) {
        console.error(`Error destroying previous chart ${chartId}:`, error);
        // Clean up the reference regardless of error
        window[chartId] = null;
    }
    
    // Create new chart with proper configuration
    try {
        window[chartId] = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: data,
                    backgroundColor: backgroundColor,
                    borderColor: backgroundColor,
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            precision: 1
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
        console.log(`Chart ${chartId} created successfully`);
    } catch (error) {
        console.error(`Error creating chart ${chartId}:`, error);
        window[chartId] = null; // Clear the reference on error
        showAlert(`Failed to create chart: ${error.message}`, 'error');
    }
}

// Ensure Supabase is initialized
async function ensureSupabaseInitialized() {
    if (!window.supabase || typeof window.supabase.from !== 'function') {
        console.error('Supabase not initialized');
        throw new Error('Supabase not initialized');
    }
}

// Create a test apiary
async function createTestApiary(userId) {
    console.log('Creating test apiary...');
    
    try {
        // Ensure Supabase is initialized
        await ensureSupabaseInitialized();
        
        // Create test apiary data
        const testApiary = {
            name: 'Test Apiary',
            user_id: userId
        };
        
        // Insert test apiary into database
        const { data, error } = await window.supabase
            .from('apiaries')
            .insert([testApiary])
            .returning('*');
        
        if (error) {
            console.error('Error creating test apiary:', error);
            showAlert('Error creating test apiary: ' + error.message, 'error');
            return;
        }
        
        console.log('Test apiary created successfully');
        showAlert('Test apiary created successfully', 'success');
        
        // Load apiaries again
        await loadApiarySelector();
    } catch (error) {
        console.error('Error creating test apiary:', error);
        showAlert('Error creating test apiary: ' + error.message, 'error');
    }
}

// Set up logout handler
function setupLogoutHandler() {
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', async function() {
            try {
                await window.supabase.auth.signOut();
                window.location.href = '/login.html';
            } catch (error) {
                console.error('Error logging out:', error);
                showAlert('Error logging out: ' + error.message, 'error');
            }
        });
    }
}

// Debug function to diagnose apiary selection issues
async function debugApiarySelection() {
    console.log('Debug: Starting apiary selection diagnostics...');
    
    try {
        // 1. Show alert that debugging has started
        showAlert('Running diagnostics...', 'info');
        
        // 2. Check if Supabase is initialized
        let diagOutput = 'DEBUG RESULTS:\n\n';
        
        if (!window.supabase) {
            diagOutput += '❌ Supabase client NOT initialized\n';
            console.error('Debug: Supabase client not initialized');
            
            // Try initializing it
            try {
                if (typeof initializeSupabase === 'function') {
                    await initializeSupabase();
                    diagOutput += '✅ Successfully initialized Supabase during debug\n';
            } else {
                    diagOutput += '❌ initializeSupabase function not found\n';
                }
            } catch (initError) {
                diagOutput += `❌ Failed to initialize Supabase: ${initError.message}\n`;
            }
        } else {
            diagOutput += '✅ Supabase client is initialized\n';
            
            // 3. Check authentication
            try {
                const { data, error } = await window.supabase.auth.getSession();
                
                if (error) {
                    diagOutput += `❌ Auth error: ${error.message}\n`;
                } else if (!data || !data.session) {
                    diagOutput += '❌ No active session found\n';
                } else {
                    const userId = data.session.user.id;
                    diagOutput += `✅ Authenticated as user: ${userId}\n`;
                    
                    // 4. Try to query apiaries directly
                    try {
                        diagOutput += '\nQuerying apiaries for this user...\n';
                        
                        const { data: apiaries, error: apiaryError } = await window.supabase
                            .from('apiaries')
                            .select('*')
                            .eq('user_id', userId);
                            
                        if (apiaryError) {
                            diagOutput += `❌ Error querying apiaries: ${apiaryError.message}\n`;
                        } else {
                            if (apiaries && apiaries.length > 0) {
                                diagOutput += `✅ Found ${apiaries.length} apiaries:\n`;
                                apiaries.forEach(apiary => {
                                    diagOutput += `   - ${apiary.name} (ID: ${apiary.id})\n`;
                                });
                                
                                // Add a sample query for hives in the first apiary
                                const firstApiaryId = apiaries[0].id;
                                diagOutput += `\nQuerying hives for first apiary (ID: ${firstApiaryId})...\n`;
                                
                                const { data: hives, error: hivesError } = await window.supabase
                                    .from('hive_details')
                                    .select('*')
                                    .eq('apiary_id', firstApiaryId);
                                
                                if (hivesError) {
                                    diagOutput += `❌ Error querying hives: ${hivesError.message}\n`;
                                } else if (!hives || hives.length === 0) {
                                    diagOutput += '❌ No hives found for this apiary\n';
                                } else {
                                    diagOutput += `✅ Found ${hives.length} hives\n`;
                                    
                                    // Try to get metrics for the first hive
                                    const firstHiveId = hives[0].node_id || hives[0].id;
                                    diagOutput += `\nQuerying metrics for first hive (ID: ${firstHiveId})...\n`;
                                    
                                    const { data: metrics, error: metricsError } = await window.supabase
                                        .from('hives')
                                        .select('*')
                                        .eq('node_id', firstHiveId)
                                        .limit(5);
                                    
                                    if (metricsError) {
                                        diagOutput += `❌ Error querying metrics: ${metricsError.message}\n`;
                                    } else if (!metrics || metrics.length === 0) {
                                        diagOutput += '❌ No metrics found for this hive\n';
                                    } else {
                                        diagOutput += `✅ Found ${metrics.length} metric entries\n`;
                                        diagOutput += '✅ Sample data for first metric: \n';
                                        diagOutput += `   Temperature: ${metrics[0].temperature}°C\n`;
                                        diagOutput += `   Humidity: ${metrics[0].humidity}%\n`;
                                        
                                        if (metrics[0].weight !== undefined) {
                                            diagOutput += `   Weight: ${metrics[0].weight} kg\n`;
                                        }
                                        
                                        if (metrics[0].sound !== undefined) {
                                            diagOutput += `   Sound: ${metrics[0].sound} dB\n`;
                                        }
                                    }
                                }
                            } else {
                                diagOutput += '❌ No apiaries found for this user\n';
                                
                                // Offer to create a test apiary
                                const createTest = confirm('No apiaries found. Would you like to create a test apiary?');
                                if (createTest) {
                                    await createTestApiary(userId);
                                    diagOutput += '✅ Test apiary creation requested\n';
                                }
                            }
                        }
                    } catch (queryError) {
                        diagOutput += `❌ Exception querying apiaries: ${queryError.message}\n`;
                    }
                }
            } catch (authError) {
                diagOutput += `❌ Auth exception: ${authError.message}\n`;
            }
        }
        
        // Output the diagnostic results
        console.log(diagOutput);
        alert(diagOutput);
        
        // Try to reload the apiary selector
        try {
            await loadApiarySelector();
        } catch (reloadError) {
            console.error('Error reloading apiary selector:', reloadError);
        }
        
        showAlert('Diagnostics complete. See the console for details.', 'info');
    } catch (error) {
        console.error('Error in debug function:', error);
        showAlert('Error running diagnostics: ' + error.message, 'error');
    }
}

// Debug function to diagnose chart rendering issues
function debugCharts() {
    console.log('Testing charts with sample data');
    showAlert('Loading sample test data...', 'info');
    
    try {
        // Generate 24 hours of dummy data
        const now = new Date();
        const testData = [];
        
        for (let i = 0; i < 24; i++) {
            const timestamp = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
            testData.push({
                created_at: timestamp.toISOString(),
                temperature: Math.random() * 6 + 32, // 32-38°C
                humidity: Math.random() * 20 + 40,   // 40-60%
                weight: Math.random() * 5 + 20,      // 20-25kg
                sound: Math.floor(Math.random() * 20) + 40, // 40-60dB
                node_id: 'test-node'
            });
        }
        
        // Update charts with test data
        updateCharts(testData);
        
        // Update latest readings with the most recent test data
        updateLatestReadings(testData[testData.length - 1]);
        
        // Update health indicators
        checkHiveHealth(testData[testData.length - 1]);
        
        showAlert('Sample data loaded successfully', 'success');
    } catch (error) {
        console.error('Error loading sample data:', error);
        showAlert('Error loading sample data: ' + error.message, 'error');
    }
}

// Add debug button to the DOM
document.addEventListener('DOMContentLoaded', function() {
    // Debug buttons have been removed to focus on actual data
});

// Function to insert a test metrics record
async function insertTestMetrics() {
    try {
        showAlert('Adding test data point...', 'info');
        
        // Get the current hive node id
        const hiveSelector = document.getElementById('hiveSelector');
        if (!hiveSelector || !hiveSelector.value) {
            showAlert('Please select a hive first', 'warning');
            return;
        }
        
        const hiveNodeId = hiveSelector.value;
        
        // Generate random metrics
        const testMetrics = {
            node_id: hiveNodeId,
            created_at: new Date().toISOString(),
            temperature: Math.random() * 6 + 32, // 32-38°C
            humidity: Math.random() * 20 + 40,   // 40-60%
            weight: Math.random() * 5 + 20,      // 20-25kg
            sound: Math.floor(Math.random() * 20) + 40 // 40-60dB
        };
        
        // Insert the test metrics into the database
        const { data, error } = await window.supabase
            .from('hives')
            .insert([testMetrics])
            .select();
            
        if (error) {
            console.error('Error inserting test metrics:', error);
            showAlert('Error adding test data: ' + error.message, 'error');
            return;
        }
        
        console.log('Test metrics added:', data);
        showAlert('Test data added successfully', 'success');
        
        // Add the new data point to the charts
        addMetricDataPoint(testMetrics);
    } catch (error) {
        console.error('Error inserting test metrics:', error);
        showAlert('Error adding test data: ' + error.message, 'error');
    }
}

// Add buttons for debugging charts
document.addEventListener('DOMContentLoaded', function() {
    // Empty function - no debug buttons needed
});

// Function to show alerts
function showAlert(message, type = 'info') {
    // Remove any existing alerts
    const existingAlerts = document.querySelectorAll('.alert-container .alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // Create alert container if it doesn't exist
    let alertContainer = document.querySelector('.alert-container');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.className = 'alert-container';
        alertContainer.style.position = 'fixed';
        alertContainer.style.top = '60px';
        alertContainer.style.right = '20px';
        alertContainer.style.zIndex = '9999';
        document.body.appendChild(alertContainer);
    }
    
    // Create alert
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = 'alert';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Add alert to container
    alertContainer.appendChild(alert);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (alert) {
            alert.classList.remove('show');
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.parentNode.removeChild(alert);
                }
            }, 150);
        }
    }, 5000);
}