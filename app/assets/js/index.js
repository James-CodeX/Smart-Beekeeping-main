// Load user's apiaries into the selector
async function loadApiarySelector() {
    try {
        console.log('Loading apiary selector...');
        
        const { data: apiaries, error } = await window.supabase
            .from('apiaries')
            .select('*')
            .order('name', { ascending: true });
            
        if (error) throw error;
        
        const selector = document.getElementById('apiarySelector');
        if (!selector) {
            console.error('Apiary selector element not found');
            return;
        }
        
        // Clear existing options
        selector.innerHTML = '<option value="" disabled selected>Select an apiary...</option>';
        
        if (!apiaries || apiaries.length === 0) {
            console.log('No apiaries found');
            selector.innerHTML += '<option value="" disabled>No apiaries available</option>';
            return;
        }
        
        // Add apiaries to selector
        apiaries.forEach(apiary => {
            const option = document.createElement('option');
            option.value = apiary.id;
            option.textContent = apiary.name;
            selector.appendChild(option);
        });
        
        // Select first apiary and load its hives
        if (apiaries.length > 0) {
            selector.value = apiaries[0].id;
            await loadHiveSelector(apiaries[0].id);
        }
    } catch (error) {
        console.error('Error in loadApiarySelector:', error);
        showAlert('Error loading apiaries: ' + error.message, 'error');
        
        const selector = document.getElementById('apiarySelector');
        if (selector) {
            selector.innerHTML = '<option value="" disabled>Error loading apiaries</option>';
        }
    }
}

// Load hives for a specific apiary into the selector
async function loadHiveSelector(apiaryId = null) {
    try {
        console.log('Loading hive selector...');
        
        const hiveSelector = document.getElementById('hiveSelector');
        if (!hiveSelector) {
            console.error('Hive selector element not found');
            return;
        }
        
        // Clear existing options and disable if no apiary selected
        hiveSelector.innerHTML = '<option value="" disabled selected>Select a hive...</option>';
        hiveSelector.disabled = !apiaryId;
        
        if (!apiaryId) {
            console.log('No apiary selected');
            return;
        }
        
        // Get hives for the selected apiary
        const { data: hives, error } = await window.supabase
            .from('hive_details')
            .select('*')
            .eq('apiary_id', apiaryId)
            .order('hive_name', { ascending: true });
            
        if (error) throw error;
        
        if (!hives || hives.length === 0) {
            console.log('No hives found for apiary');
            hiveSelector.innerHTML += '<option value="" disabled>No hives available</option>';
            return;
        }
        
        // Add hives to selector
        hives.forEach(hive => {
            const option = document.createElement('option');
            option.value = hive.node_id;
            option.textContent = hive.hive_name || `Hive ${hive.node_id}`;
            hiveSelector.appendChild(option);
        });
        
        // Enable the hive selector
        hiveSelector.disabled = false;
        
        // Select first hive and set up subscription
        if (hives.length > 0) {
            hiveSelector.value = hives[0].node_id;
            subscribeToHiveUpdates(hives[0].node_id);
            // Load initial data for the first hive
            loadMetricsData();
        }
    } catch (error) {
        console.error('Error in loadHiveSelector:', error);
        showAlert('Error loading hives: ' + error.message, 'error');
        
        const selector = document.getElementById('hiveSelector');
        if (selector) {
            selector.innerHTML = '<option value="" disabled>Error loading hives</option>';
            selector.disabled = true;
        }
    }
}

// Initialize dashboard
async function initializeDashboard() {
    try {
        console.log('Initializing dashboard...');
        
        // Initialize Supabase
        await window.initializeSupabase();
        console.log('Supabase initialized');
        
        // Wait for auth to be checked
        await waitForAuth();
        console.log('Auth checked');
        
        // Get current user
        const { data: { user }, error: userError } = await window.supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) {
            console.log('No authenticated user, redirecting to login...');
            window.location.href = '/login.html';
            return;
        }
        console.log('User authenticated:', user.id);
        
        // Initialize the charts
        initializeCharts();
        console.log('Charts initialized');
        
        // Load user's apiaries and populate the selector
        await loadApiarySelector();
        console.log('Apiary selector loaded');
        
        // Set up event listeners
        setupEventListeners();
        console.log('Event listeners set up');
        
        // Schedule periodic updates for non-realtime data
        setInterval(() => {
            updateAlertsDropdown();
            updateMessagesDropdown();
        }, 30000);
        
        console.log('Dashboard initialization complete');
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showAlert('Error initializing dashboard: ' + error.message, 'error');
    }
}

// Set up event listeners for the dashboard
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Apiary selector change event
    const apiarySelector = document.getElementById('apiarySelector');
    if (apiarySelector) {
        apiarySelector.addEventListener('change', async (event) => {
            try {
                const apiaryId = event.target.value;
                if (!apiaryId) {
                    console.log('No apiary selected');
                    return;
                }
                
                console.log('Apiary selected:', apiaryId);
                
                // Load hives for the selected apiary
                await loadHiveSelector(apiaryId);
            } catch (error) {
                console.error('Error handling apiary selection:', error);
                showAlert('Error loading apiary data: ' + error.message, 'error');
            }
        });
    }
    
    // Hive selector change event
    const hiveSelector = document.getElementById('hiveSelector');
    if (hiveSelector) {
        hiveSelector.addEventListener('change', async (event) => {
            try {
                const hiveId = event.target.value;
                if (!hiveId) {
                    console.log('No hive selected');
                    return;
                }
                
                console.log('Hive selected:', hiveId);
                
                // Unsubscribe from previous hive's updates if any
                if (currentHiveSubscription) {
                    currentHiveSubscription.unsubscribe();
                }
                
                // Subscribe to new hive's updates
                await subscribeToHiveUpdates(hiveId);
                
                // Load initial data for the selected hive
                await loadMetricsData(hiveId);
            } catch (error) {
                console.error('Error handling hive selection:', error);
                showAlert('Error loading hive data: ' + error.message, 'error');
            }
        });
    }
    
    // Time range selector change events
    const timeRangeSelector = document.getElementById('timeRangeSelector');
    if (timeRangeSelector) {
        timeRangeSelector.addEventListener('change', async () => {
            const hiveId = document.getElementById('hiveSelector').value;
            if (hiveId) {
                await loadMetricsData(hiveId);
            }
        });
    }
} 