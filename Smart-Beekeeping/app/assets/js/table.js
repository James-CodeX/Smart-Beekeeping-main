// JavaScript for table.html

// Global state variables
let allHiveData = [];
let apiaries = [];
let hives = [];
let filteredData = [];
let currentPage = 1;
let recordsPerPage = 10;
let dateRange = {
    startDate: moment().subtract(30, 'days'),
    endDate: moment()
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Table page loaded');
    await checkAuth();
    
    try {
        // Initialize daterangepicker
        initializeDateRangePicker();
        console.log('DateRangePicker initialized');
        
        // Load apiaries for filter dropdown
        await loadApiaries();
        console.log('Apiaries loaded');
        
        // Initial data load
        await loadHiveData();
        console.log('Hive data loaded');
        
        // Add event listeners
        setupEventListeners();
        console.log('Event listeners setup complete');
        
        // Initialize pagination
        updatePagination();
        console.log('Pagination initialized');
    } catch (error) {
        console.error('Error during initialization:', error);
        alert('There was an error loading the page. Please check the console for details.');
    }
});

// Initialize the date range picker
function initializeDateRangePicker() {
    try {
        // Ensure jQuery is available
        if (typeof $ !== 'function') {
            console.error('jQuery not loaded');
            throw new Error('jQuery is required for DateRangePicker but is not loaded');
        }
        
        // Check if element exists
        const dateRangeElement = document.getElementById('dateRangeSelector');
        if (!dateRangeElement) {
            console.error('Date range selector element not found');
            return;
        }
        
        // Initialize the daterangepicker
        $('#dateRangeSelector').daterangepicker({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            opens: 'left',
            locale: {
                format: 'YYYY-MM-DD'
            },
            ranges: {
               'Today': [moment(), moment()],
               'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
               'Last 7 Days': [moment().subtract(6, 'days'), moment()],
               'Last 30 Days': [moment().subtract(29, 'days'), moment()],
               'This Month': [moment().startOf('month'), moment().endOf('month')],
               'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
            }
        }, function(start, end) {
            dateRange.startDate = start;
            dateRange.endDate = end;
            console.log('Date range selected:', start.format('YYYY-MM-DD'), 'to', end.format('YYYY-MM-DD'));
        });
        console.log('DateRangePicker successfully initialized');
    } catch (error) {
        console.error('Error initializing DateRangePicker:', error);
    }
}

// Set up event listeners for the filter controls
function setupEventListeners() {
    try {
        console.log('Setting up event listeners...');
        
        // Apply filters button
        const applyFiltersBtn = document.getElementById('applyFilters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', function() {
                console.log('Apply filters button clicked');
                applyFilters();
            });
        }
        
        // Reset filters button
        const resetFiltersBtn = document.getElementById('resetFilters');
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', function() {
                console.log('Reset filters button clicked');
                resetFilters();
            });
        }
        
        // Export data button
        const exportDataBtn = document.getElementById('exportData');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', function() {
                console.log('Export data button clicked');
                exportTableData();
            });
        }
        
        // Clear table data button
        const clearTableDataBtn = document.getElementById('clearTableData');
        if (clearTableDataBtn) {
            clearTableDataBtn.addEventListener('click', function() {
                console.log('Clear table data button clicked');
                clearTableDataAndReload();
            });
        }
        
        // Debug button (only show on localhost/development)
        const debugBtn = document.getElementById('debugData');
        if (debugBtn) {
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                debugBtn.style.display = 'block';
                debugBtn.addEventListener('click', function() {
                    console.log('Debug button clicked');
                    debugDataRelationships();
                });
            }
        }
        
        // Apiary selector dropdown
        const apiarySelector = document.getElementById('apiarySelector');
        if (apiarySelector) {
            apiarySelector.addEventListener('change', function() {
                const apiaryId = this.value;
                console.log('Apiary selected:', apiaryId);
                updateHiveDropdown(apiaryId);
            });
        }
        
        // Records per page dropdown
        const recordsPerPageSelect = document.getElementById('recordsPerPage');
        if (recordsPerPageSelect) {
            recordsPerPageSelect.addEventListener('change', function() {
                recordsPerPage = parseInt(this.value);
                currentPage = 1;
                console.log('Records per page changed to:', recordsPerPage);
                updateTableDisplay();
            });
        }
        
        // Table search box
        const tableSearch = document.getElementById('tableSearch');
        if (tableSearch) {
            tableSearch.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                console.log('Search term:', searchTerm);
                if (searchTerm.length > 0) {
                    filterBySearchTerm(searchTerm);
                } else {
                    applyFilters(); // Reset to current filters if search is cleared
                }
            });
        }
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

// Load apiaries for the dropdown
async function loadApiaries() {
    try {
        console.log('Loading apiaries...');
        const user = await getCurrentUser();
        if (!user) {
            console.error('No authenticated user found');
            throw new Error('User not authenticated');
        }

        console.log('User authenticated, fetching apiaries for user ID:', user.id);
        
        // Get all apiaries for this user
        const { data: userApiaries, error } = await supabaseClient
            .from('apiaries')
            .select('*')
            .eq('user_id', user.id);

        if (error) {
            console.error('Error fetching apiaries from Supabase:', error);
            
            // Try a different approach - maybe the table name is different
            try {
                console.log('Trying alternate table name for apiaries');
                const { data: altApiaries, error: altError } = await supabaseClient
                    .from('apiary')
                    .select('*')
                    .eq('user_id', user.id);
                    
                if (altError) {
                    console.error('Alternative apiaries query failed:', altError);
                    throw error; // Use the original error
                }
                
                console.log('Alternative apiaries query succeeded:', altApiaries);
                apiaries = altApiaries || [];
            } catch (altError) {
                console.error('All apiaries queries failed');
                throw error;
            }
        } else {
            console.log('Apiaries data received:', userApiaries);
            apiaries = userApiaries || [];
        }
        
        // Log sample apiary data for debugging
        if (apiaries.length > 0) {
            console.log('Sample apiary data structure:', JSON.stringify(apiaries[0]));
        }
        
        // Populate apiaries dropdown
        const apiarySelector = document.getElementById('apiarySelector');
        if (!apiarySelector) {
            console.error('Apiary selector element not found');
            return;
        }
        
        if (apiaries.length === 0) {
            console.log('No apiaries found for this user');
            apiarySelector.innerHTML = '<option value="all">No Apiaries Found</option>';
            return;
        }
        
        let options = '<option value="all">All Apiaries</option>';
        apiaries.forEach(apiary => {
            // Try multiple field names for the apiary name
            const apiaryName = apiary.name || apiary.title || `Apiary ${apiary.id}`;
            console.log('Adding apiary to dropdown:', apiary.id, apiaryName);
            options += `<option value="${apiary.id}">${escapeHtml(apiaryName)}</option>`;
        });
        
        apiarySelector.innerHTML = options;
        console.log('Apiary dropdown populated with', apiaries.length, 'apiaries');
        
        // Now load all hives for this user
        await loadAllHives(user.id);
        
    } catch (error) {
        console.error('Error loading apiaries:', error);
        // Create a fallback option
        const apiarySelector = document.getElementById('apiarySelector');
        if (apiarySelector) {
            apiarySelector.innerHTML = '<option value="all">Error Loading Apiaries</option>';
        }
    }
}

// Load all hives belonging to the user
async function loadAllHives(userId) {
    try {
        console.log('Loading hives for user ID:', userId);
        
        // First, try to get hives with the expected query
        let { data: userHives, error } = await supabaseClient
            .from('hive_details')
            .select('*, apiaries(name, id)')
            .eq('user_id', userId);

        // If there's an error or no data, try a fallback query
        if (error || !userHives || userHives.length === 0) {
            console.log('First query failed or returned no data, trying fallback query');
            console.error('First query error:', error);
            
            // Maybe the join is failing or the table structure is different
            // Try a simpler query just to get the hives
            const { data: basicHives, error: basicError } = await supabaseClient
                .from('hive_details')
                .select('*')
                .eq('user_id', userId);
                
            if (basicError) {
                console.error('Even basic hives query failed:', basicError);
                
                // Last resort - try a different table name
                try {
                    const { data: alternativeHives, error: altError } = await supabaseClient
                        .from('hives')
                        .select('*')
                        .eq('user_id', userId);
                        
                    if (altError) {
                        console.error('Alternative hives query failed:', altError);
                        throw basicError; // Use the original error
                    }
                    
                    userHives = alternativeHives || [];
                    console.log('Alternative query returned', userHives.length, 'hives');
                } catch (altQueryError) {
                    console.error('All hive queries failed, using empty array');
                    userHives = [];
                }
            } else {
                userHives = basicHives || [];
                console.log('Fallback query returned', userHives.length, 'hives');
            }
        }

        console.log('Hives data received:', userHives);
        hives = userHives || [];
        
        // Print sample hive data for debugging
        if (hives.length > 0) {
            console.log('Sample hive data structure:', JSON.stringify(hives[0]));
        }
        
        // Initially populate the hives dropdown with all hives
        updateHiveDropdown('all');
        
    } catch (error) {
        console.error('Error loading hives:', error);
        // Create a fallback option
        const hiveSelector = document.getElementById('hiveSelector');
        if (hiveSelector) {
            hiveSelector.innerHTML = '<option value="all">Error Loading Hives</option>';
        }
    }
}

// Update the hives dropdown based on selected apiary
function updateHiveDropdown(apiaryId) {
    try {
        const hiveSelector = document.getElementById('hiveSelector');
        if (!hiveSelector) {
            console.error('Hive selector element not found');
            return;
        }
        
        console.log('Updating hive dropdown for apiary ID:', apiaryId);
        console.log('Total hives available:', hives.length);
        if (hives.length > 0) {
            console.log('Sample hive data structure:', JSON.stringify(hives[0]));
        }
        
        if (hives.length === 0) {
            console.log('No hives available');
            hiveSelector.innerHTML = '<option value="all">No Hives Found</option>';
            return;
        }
        
        let options = '<option value="all">All Hives</option>';
        
        // Filter hives by apiary if a specific one is selected
        let filteredHives = [];
        if (apiaryId === 'all') {
            filteredHives = hives;
            console.log('Showing all hives');
        } else {
            console.log('Attempting to filter hives for apiary ID:', apiaryId);
            
            // Try all possible field combinations for matching apiaries to hives
            filteredHives = hives.filter(hive => {
                // Log all potential apiary reference fields for this hive
                console.log('Checking hive:', hive.id, 'Node ID:', hive.node_id);
                console.log('- apiary_id =', hive.apiary_id);
                console.log('- apiaryId =', hive.apiaryId);
                console.log('- apiary =', hive.apiary);
                
                // Try with string and number comparisons (database might store as string or number)
                const apiaryIdStr = apiaryId.toString();
                const matches = 
                    (hive.apiary_id !== undefined && (hive.apiary_id === apiaryId || hive.apiary_id.toString() === apiaryIdStr)) ||
                    (hive.apiaryId !== undefined && (hive.apiaryId === apiaryId || hive.apiaryId.toString() === apiaryIdStr)) ||
                    (hive.apiary !== undefined && (hive.apiary === apiaryId || hive.apiary.toString() === apiaryIdStr));
                
                console.log('- Matches apiary:', matches);
                return matches;
            });
            
            // If no results with standard fields, try looking at nested data
            if (filteredHives.length === 0) {
                console.log('No direct matches found, looking for nested apiary references');
                filteredHives = hives.filter(hive => {
                    if (hive.apiaries && typeof hive.apiaries === 'object') {
                        console.log('Found apiaries object in hive:', hive.id);
                        if (hive.apiaries.id !== undefined) {
                            const matches = hive.apiaries.id === apiaryId || hive.apiaries.id.toString() === apiaryId.toString();
                            console.log('- apiaries.id match:', matches);
                            return matches;
                        }
                    }
                    return false;
                });
            }
            
            // If still no results, the database schema might be entirely different
            // Let's try one more approach - looking for any field that contains the apiary ID
            if (filteredHives.length === 0) {
                console.log('Still no matches found, searching all fields for apiary ID');
                filteredHives = hives.filter(hive => {
                    for (const key in hive) {
                        if (key.toLowerCase().includes('apiary') && 
                            (hive[key] === apiaryId || hive[key]?.toString() === apiaryId.toString())) {
                            console.log('Found match in field:', key);
                            return true;
                        }
                    }
                    return false;
                });
            }
            
            // If we still have no matches, let's check if there are hives that explicitly mention this apiary ID
            // in any string field
            if (filteredHives.length === 0) {
                console.log('No matches by ID comparison, showing all hives as fallback');
                filteredHives = hives;
            }
            
            console.log('Filtered to', filteredHives.length, 'hives in the selected apiary');
        }
        
        // Build the dropdown options
        filteredHives.forEach(hive => {
            // Try multiple field names for the hive name
            const hiveName = hive.hive_name || hive.name || hive.title || ('Hive ' + (hive.node_id || hive.id));
            console.log('Adding hive to dropdown:', hive.id, hiveName);
            options += `<option value="${hive.id}">${escapeHtml(hiveName)}</option>`;
        });
        
        hiveSelector.innerHTML = options;
        console.log('Hive dropdown updated with', filteredHives.length, 'hives');
    } catch (error) {
        console.error('Error updating hive dropdown:', error);
        // Add a fallback in case of error
        const hiveSelector = document.getElementById('hiveSelector');
        if (hiveSelector) {
            hiveSelector.innerHTML = '<option value="all">All Hives</option>';
        }
    }
}

// Apply all filters and update the table display
function applyFilters() {
    try {
        console.log('=== FILTER DEBUG START ===');
        console.log('Applying filters...');
        const apiarySelector = document.getElementById('apiarySelector');
        const hiveSelector = document.getElementById('hiveSelector');
        
        if (!apiarySelector || !hiveSelector) {
            console.error('Filter selectors not found');
            return;
        }
        
        const apiaryId = apiarySelector.value;
        const hiveId = hiveSelector.value;
        
        console.log('Filter values:', {
            apiaryId,
            hiveId,
            dateRange: {
                startDate: dateRange.startDate.format('YYYY-MM-DD'),
                endDate: dateRange.endDate.format('YYYY-MM-DD')
            }
        });
        
        // Create global tracking maps if we don't have them yet
        // Only calculate these once and reuse for better performance
        if (!window.nodeToApiaryMap) {
            console.log('Creating node to apiary mapping for faster filtering');
            window.nodeToApiaryMap = {};
            window.nodeToHiveMap = {};
            
            // First map each hive to its apiary
            const hiveToApiaryMap = {};
            hives.forEach(hive => {
                let apiaryId = null;
                if (hive.apiary_id !== undefined) apiaryId = hive.apiary_id;
                else if (hive.apiaryId !== undefined) apiaryId = hive.apiaryId;
                else if (hive.apiary !== undefined) apiaryId = hive.apiary;
                else if (hive.apiaries && hive.apiaries.id !== undefined) apiaryId = hive.apiaries.id;
                
                if (apiaryId !== null && hive.id) {
                    hiveToApiaryMap[hive.id] = apiaryId;
                }
            });
            
            // Then map each node_id to its hive and apiary
            hives.forEach(hive => {
                if (hive.node_id && hive.id) {
                    // Map node to hive
                    window.nodeToHiveMap[hive.node_id] = hive.id;
                    
                    // Map node to apiary
                    let apiaryId = null;
                    if (hive.apiary_id !== undefined) apiaryId = hive.apiary_id;
                    else if (hive.apiaryId !== undefined) apiaryId = hive.apiaryId;
                    else if (hive.apiary !== undefined) apiaryId = hive.apiary;
                    else if (hive.apiaries && hive.apiaries.id !== undefined) apiaryId = hive.apiaries.id;
                    
                    if (apiaryId !== null) {
                        window.nodeToApiaryMap[hive.node_id] = apiaryId;
                    }
                }
            });
            
            console.log('Mapping complete:', {
                nodeToHiveMap: window.nodeToHiveMap,
                nodeToApiaryMap: window.nodeToApiaryMap
            });
        }
        
        console.log('Total records before filtering:', allHiveData.length);
        if (allHiveData.length > 0) {
            console.log('Sample data record before filtering:', JSON.stringify(allHiveData[0]));
        }
        
        // Check if we have any data to filter
        if (!allHiveData || allHiveData.length === 0) {
            console.warn('No data to filter!');
            filteredData = [];
            updateTableDisplay();
            updatePagination();
            return;
        }
        
        // TESTING MODE - If you're still having trouble, set this to true to bypass filtering
        const BYPASS_FILTERING = false;
        if (BYPASS_FILTERING) {
            console.log('*** TEST MODE: Bypassing filtering ***');
            filteredData = allHiveData;
            updateTableDisplay();
            updatePagination();
            return;
        }
        
        // First, filter by date range
        let dateFilteredData = allHiveData.filter(record => {
            if (!record || !record.created_at) return false;
            
            const recordDate = moment(record.created_at);
            return recordDate.isSameOrAfter(dateRange.startDate, 'day') && 
                   recordDate.isSameOrBefore(dateRange.endDate, 'day');
        });
        
        console.log('After date filtering:', dateFilteredData.length, 'records');
        
        // If no filters selected, use the date filtered data
        if (apiaryId === 'all' && hiveId === 'all') {
            console.log('No specific filters selected, showing all date-filtered data');
            filteredData = dateFilteredData;
            currentPage = 1;
            updateTableDisplay();
            updatePagination();
            return;
        }
        
        // Apply selected filters
        filteredData = dateFilteredData.filter(record => {
            // Skip null/undefined records
            if (!record || !record.node_id) {
                return false;
            }
            
            // Store node_id as string for easier comparison
            const nodeIdStr = record.node_id.toString();
            
            // For debugging
            console.log('Filtering record with node_id:', nodeIdStr);
            
            // Filter by apiary if selected
            if (apiaryId !== 'all') {
                const apiaryIdStr = apiaryId.toString();
                
                // First try the direct linked apiary ID we added during data loading
                if (record.linked_apiary_id) {
                    const linkedApiaryIdStr = record.linked_apiary_id.toString();
                    if (linkedApiaryIdStr !== apiaryIdStr) {
                        return false;
                    }
                }
                // Then try the global mapping
                else if (window.nodeToApiaryMap && window.nodeToApiaryMap[nodeIdStr]) {
                    const mappedApiaryId = window.nodeToApiaryMap[nodeIdStr].toString();
                    if (mappedApiaryId !== apiaryIdStr) {
                        return false;
                    }
                } 
                // If still no match, try to find via the hive relationship
                else {
                    // Find the corresponding hive
                    const hiveDetails = findHiveByNodeId(record.node_id);
                    if (!hiveDetails) {
                        return false;
                    }
                    
                    // Check if it belongs to the selected apiary using all possible fields
                    const matchesApiary = 
                        (hiveDetails.apiary_id !== undefined && (hiveDetails.apiary_id === apiaryId || hiveDetails.apiary_id.toString() === apiaryIdStr)) ||
                        (hiveDetails.apiaryId !== undefined && (hiveDetails.apiaryId === apiaryId || hiveDetails.apiaryId.toString() === apiaryIdStr)) ||
                        (hiveDetails.apiary !== undefined && (hiveDetails.apiary === apiaryId || hiveDetails.apiary.toString() === apiaryIdStr)) ||
                        (hiveDetails.apiaries && hiveDetails.apiaries.id !== undefined && 
                            (hiveDetails.apiaries.id === apiaryId || hiveDetails.apiaries.id.toString() === apiaryIdStr));
                    
                    if (!matchesApiary) {
                        return false;
                    }
                }
            }
            
            // Filter by hive if selected
            if (hiveId !== 'all') {
                const hiveIdStr = hiveId.toString();
                
                // First check direct hive_id that we added during data loading
                if (record.hive_id) {
                    const recordHiveIdStr = record.hive_id.toString();
                    if (recordHiveIdStr !== hiveIdStr) {
                        return false;
                    }
                }
                // Then try the global mapping
                else if (window.nodeToHiveMap && window.nodeToHiveMap[nodeIdStr]) {
                    const mappedHiveId = window.nodeToHiveMap[nodeIdStr].toString();
                    if (mappedHiveId !== hiveIdStr) {
                        return false;
                    }
                }
                // If still no match, try other methods
                else {
                    let matchesHive = false;
                    
                    // Try direct node_id matching
                    if (nodeIdStr === hiveIdStr) {
                        matchesHive = true;
                    } 
                    // Try finding via hive details
                    else {
                        const hiveDetails = findHiveByNodeId(record.node_id);
                        matchesHive = hiveDetails && hiveDetails.id.toString() === hiveIdStr;
                    }
                    
                    if (!matchesHive) {
                        return false;
                    }
                }
            }
            
            // If we passed all filters, keep the record
            return true;
        });
        
        console.log('Filtered data count:', filteredData.length);
        if (filteredData.length > 0) {
            console.log('Sample filtered record:', JSON.stringify(filteredData[0]));
        }
        
        console.log('=== FILTER DEBUG END ===');
        
        // Reset to first page when filters change
        currentPage = 1;
        
        // Update table with filtered data
        updateTableDisplay();
        
        // Update pagination
        updatePagination();
    } catch (error) {
        console.error('Error in applyFilters:', error);
        filteredData = allHiveData; // Fallback to showing all data on error
        updateTableDisplay();
        updatePagination();
    }
}

// Helper function to find a hive by node ID with better error handling
function findHiveByNodeId(nodeId) {
    if (!nodeId) {
        console.log('No node ID provided');
        return null;
    }
    
    const hive = hives.find(h => h.node_id === nodeId);
    if (!hive) {
        console.log('No hive found with node ID:', nodeId);
        // Try alternative fields
        return hives.find(h => h.nodeId === nodeId || h.id === nodeId);
    }
    
    return hive;
}

// Reset all filters to default
function resetFilters() {
    try {
        console.log('Resetting filters...');
        // Reset filter UI
        const apiarySelector = document.getElementById('apiarySelector');
        if (apiarySelector) {
            apiarySelector.value = 'all';
            updateHiveDropdown('all');
        }
        
        // Reset date range to last 30 days
        dateRange.startDate = moment().subtract(30, 'days');
        dateRange.endDate = moment();
        
        try {
            const dateRangePicker = $('#dateRangeSelector').data('daterangepicker');
            if (dateRangePicker) {
                dateRangePicker.setStartDate(dateRange.startDate);
                dateRangePicker.setEndDate(dateRange.endDate);
                console.log('Date range reset successfully');
            } else {
                console.error('DateRangePicker not initialized');
            }
        } catch (dateError) {
            console.error('Error resetting date range:', dateError);
        }
        
        // Clear search box
        const tableSearch = document.getElementById('tableSearch');
        if (tableSearch) {
            tableSearch.value = '';
        }
        
        // Reset to showing all data
        filteredData = allHiveData;
        currentPage = 1;
        
        // Update display
        updateTableDisplay();
        updatePagination();
        
        console.log('Filters reset complete');
    } catch (error) {
        console.error('Error resetting filters:', error);
    }
}

// Filter data by search term
function filterBySearchTerm(searchTerm) {
    try {
        console.log('Filtering by search term:', searchTerm);
        // First apply the current dropdown and date filters
        applyFilters();
        
        // Then further filter by search term
        filteredData = filteredData.filter(record => {
            // Check if the search term appears in any field
            const hiveDetails = findHiveByNodeId(record.node_id);
            const apiaryName = getApiaryName(hiveDetails);
            const hiveName = getHiveName(hiveDetails, record.node_id);
            
            return (
                hiveName.toLowerCase().includes(searchTerm) ||
                apiaryName.toLowerCase().includes(searchTerm) ||
                (record.node_id && record.node_id.toString().toLowerCase().includes(searchTerm)) ||
                record.temperature.toString().includes(searchTerm) ||
                record.humidity.toString().includes(searchTerm) ||
                record.weight.toString().includes(searchTerm) ||
                record.sound.toString().includes(searchTerm) ||
                record.rssi.toString().includes(searchTerm) ||
                new Date(record.created_at).toLocaleString().toLowerCase().includes(searchTerm)
            );
        });
        
        console.log('Search filtered data count:', filteredData.length);
        
        // Reset to first page
        currentPage = 1;
        
        // Update display
        updateTableDisplay();
        updatePagination();
    } catch (error) {
        console.error('Error filtering by search term:', error);
    }
}

// Helper function to get apiary name with better error handling
function getApiaryName(hiveDetails) {
    if (!hiveDetails) return 'Unknown';
    
    // Try different possible structures
    if (hiveDetails.apiaries && hiveDetails.apiaries.name) {
        return hiveDetails.apiaries.name;
    }
    
    if (hiveDetails.apiary_name) {
        return hiveDetails.apiary_name;
    }
    
    // If we have the apiary ID, try to find it in the apiaries array
    const apiaryId = hiveDetails.apiary_id || hiveDetails.apiaryId || hiveDetails.apiary;
    if (apiaryId) {
        const apiary = apiaries.find(a => a.id === apiaryId);
        if (apiary) {
            return apiary.name;
        }
    }
    
    return 'Unknown';
}

// Helper function to get hive name with better error handling
function getHiveName(hiveDetails, nodeId) {
    if (!hiveDetails) return nodeId ? 'Hive ' + nodeId : 'Unknown Hive';
    
    return hiveDetails.hive_name || hiveDetails.name || ('Hive ' + (hiveDetails.node_id || hiveDetails.nodeId || nodeId || hiveDetails.id));
}

// Export table data to CSV
function exportTableData() {
    try {
        console.log('Exporting data to CSV...');
        if (filteredData.length === 0) {
            alert('No data to export.');
            return;
        }
        
        // Create CSV content
        let csvContent = 'data:text/csv;charset=utf-8,';
        
        // Add headers
        csvContent += 'Date,Apiary,Hive,Temperature (°C),Humidity (%),Weight (g),Sound (dB),RSSI\n';
        
        // Add data rows
        filteredData.forEach(record => {
            const hiveDetails = findHiveByNodeId(record.node_id);
            const apiaryName = getApiaryName(hiveDetails);
            const hiveName = getHiveName(hiveDetails, record.node_id);
            
            const row = [
                new Date(record.created_at).toLocaleString(),
                apiaryName,
                hiveName,
                record.temperature.toFixed(1),
                record.humidity.toFixed(1),
                record.weight.toFixed(0),
                record.sound.toFixed(0),
                record.rssi
            ].join(',');
            
            csvContent += row + '\n';
        });
        
        // Create download link
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `hive-data-export-${moment().format('YYYY-MM-DD')}.csv`);
        document.body.appendChild(link);
        
        // Trigger download
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        
        console.log('CSV export complete');
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('Error exporting data: ' + error.message);
    }
}

// Update the pagination controls
function updatePagination() {
    try {
        console.log('Updating pagination...');
        const paginationElement = document.getElementById('tablePagination');
        if (!paginationElement) {
            console.error('Pagination element not found');
            return;
        }
        
        // Calculate total pages based on filtered data
        const totalRecords = filteredData.length;
        const totalPages = Math.ceil(totalRecords / recordsPerPage);
        console.log('Total records:', totalRecords, 'Total pages:', totalPages);
        
        // Calculate exact range of records being shown
        const start = totalRecords === 0 ? 0 : (currentPage - 1) * recordsPerPage + 1;
        const end = Math.min(currentPage * recordsPerPage, totalRecords);
        
        // Update showing text
        const showingStartElem = document.getElementById('showingStart');
        const showingEndElem = document.getElementById('showingEnd');
        const totalRecordsElem = document.getElementById('totalRecords');
        
        if (showingStartElem) showingStartElem.textContent = start;
        if (showingEndElem) showingEndElem.textContent = end;
        if (totalRecordsElem) totalRecordsElem.textContent = totalRecords;
        
        console.log(`Showing records ${start} to ${end} of ${totalRecords}`);
        
        // Generate pagination HTML
        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" aria-label="Previous" data-page="${currentPage - 1}">
                    <span aria-hidden="true">«</span>
                </a>
            </li>
        `;
        
        // Determine page range to show
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        // Adjust if we're near the end
        if (endPage - startPage < 4 && startPage > 1) {
            startPage = Math.max(1, endPage - 4);
        }
        
        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }
        
        // Next button
        paginationHTML += `
            <li class="page-item ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}">
                <a class="page-link" href="#" aria-label="Next" data-page="${currentPage + 1}">
                    <span aria-hidden="true">»</span>
                </a>
            </li>
        `;
        
        // Update DOM
        paginationElement.innerHTML = paginationHTML;
        
        // Add event listeners to pagination links
        document.querySelectorAll('#tablePagination .page-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const page = parseInt(this.dataset.page);
                if (page >= 1 && page <= totalPages) {
                    currentPage = page;
                    console.log('Pagination: changed to page', page);
                    updateTableDisplay();
                    updatePagination();
                }
            });
        });
        
        console.log('Pagination update complete');
    } catch (error) {
        console.error('Error updating pagination:', error);
    }
}

// Update the table with current data and pagination
function updateTableDisplay() {
    try {
        console.log('Updating table display...');
        const tableBody = document.getElementById('hiveDataTableBody');
        if (!tableBody) {
            console.error('Table body element not found');
            return;
        }
        
        if (filteredData.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center">No data available</td></tr>';
            console.log('No data to display');
            
            // Make sure pagination info is updated even when no data
            updatePaginationInfo(0, 0, 0);
            return;
        }
        
        // Calculate slice for current page
        const start = (currentPage - 1) * recordsPerPage;
        const end = Math.min(start + recordsPerPage, filteredData.length);
        const pageData = filteredData.slice(start, end);
        
        console.log(`Displaying records ${start+1} to ${end} of ${filteredData.length}`);
        
        // Generate rows
        tableBody.innerHTML = pageData.map(record => {
            // Safely handle missing data
            if (!record) {
                console.log('Record is null or undefined');
                return '';
            }
            
            const hiveDetails = findHiveByNodeId(record.node_id);
            const apiaryName = getApiaryName(hiveDetails);
            const hiveName = getHiveName(hiveDetails, record.node_id);
            
            // Safely extract values with fallbacks
            const temperature = typeof record.temperature === 'number' ? record.temperature.toFixed(1) : 'N/A';
            const humidity = typeof record.humidity === 'number' ? record.humidity.toFixed(1) : 'N/A';
            const weight = typeof record.weight === 'number' ? record.weight.toFixed(0) : 'N/A';
            const sound = typeof record.sound === 'number' ? record.sound.toFixed(0) : 'N/A';
            const rssi = record.rssi !== undefined ? record.rssi : 'N/A';
            const timestamp = record.created_at ? new Date(record.created_at).toLocaleString() : 'Unknown Date';
            
            return `
                <tr>
                    <td>${timestamp}</td>
                    <td>${escapeHtml(apiaryName)}</td>
                    <td>${escapeHtml(hiveName)}</td>
                    <td>${temperature}</td>
                    <td>${humidity}</td>
                    <td>${weight}</td>
                    <td>${sound}</td>
                    <td>${rssi}</td>
                </tr>
            `;
        }).join('');
        
        // Update pagination info (this is separate to ensure it happens in all cases)
        updatePaginationInfo(start + 1, end, filteredData.length);
        
        console.log('Table display updated with', pageData.length, 'records');
    } catch (error) {
        console.error('Error updating table display:', error);
        // Display error in table
        const tableBody = document.getElementById('hiveDataTableBody');
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Error displaying data: ${error.message}</td></tr>`;
        }
        
        // Make sure pagination info is updated even on error
        updatePaginationInfo(0, 0, 0);
    }
}

// Helper function to update the pagination info text
function updatePaginationInfo(start, end, total) {
    const showingStartElem = document.getElementById('showingStart');
    const showingEndElem = document.getElementById('showingEnd');
    const totalRecordsElem = document.getElementById('totalRecords');
    
    if (showingStartElem) showingStartElem.textContent = start;
    if (showingEndElem) showingEndElem.textContent = end;
    if (totalRecordsElem) totalRecordsElem.textContent = total;
    
    console.log(`Updated pagination info: Showing ${start} to ${end} of ${total}`);
}

// Helper function to escape HTML
function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Load hive data from the database
async function loadHiveData() {
    try {
        console.log('Loading hive data...');
        // Get the data from the API
        allHiveData = await getHistoricalHiveData();
        
        if (!allHiveData || allHiveData.length === 0) {
            console.warn('No hive data returned from getHistoricalHiveData');
            allHiveData = [];
            
            // Create a demo record if no data available - this helps for testing
            if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
                console.log('Creating demo data for testing');
                const now = new Date();
                allHiveData = [
                    {
                        node_id: hives.length > 0 ? hives[0].node_id : '123',
                        created_at: now.toISOString(),
                        temperature: 25.5,
                        humidity: 65.2,
                        weight: 1250,
                        sound: 45,
                        rssi: -67
                    },
                    {
                        node_id: hives.length > 0 ? hives[0].node_id : '123',
                        created_at: new Date(now - 86400000).toISOString(), // 1 day ago
                        temperature: 24.8,
                        humidity: 62.5,
                        weight: 1245,
                        sound: 42,
                        rssi: -65
                    }
                ];
            }
        }
        
        console.log('Loaded', allHiveData.length, 'hive data records');
        
        // Check data structure
        if (allHiveData.length > 0) {
            console.log('Sample data record:', JSON.stringify(allHiveData[0]));
        }
        
        // Get all valid node_ids from the current hives
        const validNodeIds = new Set();
        hives.forEach(hive => {
            if (hive.node_id) {
                validNodeIds.add(hive.node_id.toString());
            }
        });
        
        console.log('Valid node IDs from current hives:', Array.from(validNodeIds));
        
        // Filter out data from deleted hives
        const originalCount = allHiveData.length;
        allHiveData = allHiveData.filter(record => {
            if (!record || !record.node_id) return false;
            
            const recordNodeId = record.node_id.toString();
            const isValid = validNodeIds.has(recordNodeId);
            
            if (!isValid) {
                console.log('Filtering out data from deleted node_id:', recordNodeId);
            }
            
            return isValid;
        });
        
        if (originalCount !== allHiveData.length) {
            console.log(`Removed ${originalCount - allHiveData.length} records from deleted hives`);
        }
        
        // Map the relationships explicitly to make filtering easier
        console.log('Building relationship maps between hives, apiaries, and data...');
        
        // First, create a node_id to hive mapping
        const nodeToHiveMap = {};
        hives.forEach(hive => {
            if (hive.node_id) {
                nodeToHiveMap[hive.node_id] = hive;
            }
        });
        
        // Then, create a hive to apiary mapping
        const hiveToApiaryMap = {};
        hives.forEach(hive => {
            // Try all possible apiary ID fields
            let apiaryId = null;
            if (hive.apiary_id !== undefined) apiaryId = hive.apiary_id;
            else if (hive.apiaryId !== undefined) apiaryId = hive.apiaryId;
            else if (hive.apiary !== undefined) apiaryId = hive.apiary;
            else if (hive.apiaries && hive.apiaries.id !== undefined) apiaryId = hive.apiaries.id;
            
            if (apiaryId !== null) {
                hiveToApiaryMap[hive.id] = apiaryId;
            }
        });
        
        // Finally, enhance each hive data record with references to its hive and apiary
        allHiveData = allHiveData.map(record => {
            if (!record || !record.node_id) return record;
            
            // Find the corresponding hive
            const hive = nodeToHiveMap[record.node_id];
            if (hive) {
                // Add hive_id to the record
                record.hive_id = hive.id;
                
                // Add apiary_id to the record if available
                if (hiveToApiaryMap[hive.id]) {
                    record.linked_apiary_id = hiveToApiaryMap[hive.id];
                }
            }
            
            return record;
        });
        
        console.log('Relationship mapping complete.');
        if (allHiveData.length > 0) {
            console.log('Enhanced data sample:', JSON.stringify(allHiveData[0]));
        }
        
        // Initialize filtered data to show all
        filteredData = allHiveData;
        
        // Update the table display
        updateTableDisplay();
        updatePagination();
        
    } catch (error) {
        console.error('Error loading hive data:', error);
        alert('Error loading hive data: ' + error.message);
    }
}

// Debug function to help identify data relationship issues
function debugDataRelationships() {
    console.log('=== DEBUG DATA RELATIONSHIPS ===');
    
    // 1. Show all apiaries
    console.log('APIARIES:', apiaries.length);
    apiaries.forEach((apiary, index) => {
        console.log(`Apiary ${index + 1}:`, {
            id: apiary.id,
            name: apiary.name || apiary.title,
            user_id: apiary.user_id
        });
    });
    
    // 2. Show all hives
    console.log('HIVES:', hives.length);
    hives.forEach((hive, index) => {
        // Find the apiary this hive belongs to
        let apiaryId = null;
        if (hive.apiary_id !== undefined) apiaryId = hive.apiary_id;
        else if (hive.apiaryId !== undefined) apiaryId = hive.apiaryId;
        else if (hive.apiary !== undefined) apiaryId = hive.apiary;
        else if (hive.apiaries && hive.apiaries.id !== undefined) apiaryId = hive.apiaries.id;
        
        // Find the apiary name
        let apiaryName = 'Unknown';
        if (apiaryId) {
            const apiary = apiaries.find(a => a.id === apiaryId);
            if (apiary) {
                apiaryName = apiary.name || apiary.title || `Apiary ${apiary.id}`;
            }
        }
        
        console.log(`Hive ${index + 1}:`, {
            id: hive.id,
            name: hive.hive_name || hive.name || `Hive ${hive.id}`,
            node_id: hive.node_id,
            apiary_id: apiaryId,
            apiary_name: apiaryName,
            user_id: hive.user_id
        });
    });
    
    // 3. Show data records
    console.log('DATA RECORDS:', allHiveData.length);
    if (allHiveData.length > 0) {
        const sampleSize = Math.min(5, allHiveData.length);
        for (let i = 0; i < sampleSize; i++) {
            const record = allHiveData[i];
            if (!record) continue;
            
            // Find the hive this record belongs to
            let hiveName = 'Unknown';
            let apiaryName = 'Unknown';
            
            const hive = hives.find(h => h.node_id === record.node_id);
            if (hive) {
                hiveName = hive.hive_name || hive.name || `Hive ${hive.id}`;
                
                // Find the apiary
                let apiaryId = null;
                if (hive.apiary_id !== undefined) apiaryId = hive.apiary_id;
                else if (hive.apiaryId !== undefined) apiaryId = hive.apiaryId;
                else if (hive.apiary !== undefined) apiaryId = hive.apiary;
                else if (hive.apiaries && hive.apiaries.id !== undefined) apiaryId = hive.apiaries.id;
                
                if (apiaryId) {
                    const apiary = apiaries.find(a => a.id === apiaryId);
                    if (apiary) {
                        apiaryName = apiary.name || apiary.title || `Apiary ${apiary.id}`;
                    }
                }
            }
            
            console.log(`Record ${i + 1}:`, {
                created_at: record.created_at,
                node_id: record.node_id,
                hive_name: hiveName,
                apiary_name: apiaryName,
                temperature: record.temperature,
                humidity: record.humidity,
                weight: record.weight,
                linked_hive_id: record.hive_id,
                linked_apiary_id: record.linked_apiary_id
            });
        }
    }
    
    // 4. Test filtering for a specific apiary and hive
    if (apiaries.length > 0 && hives.length > 0) {
        // Get the first apiary
        const testApiary = apiaries[0];
        console.log('TEST FILTERING for apiary:', testApiary.id, testApiary.name || testApiary.title);
        
        // Find a hive in this apiary
        let testHive = null;
        for (const hive of hives) {
            let apiaryId = null;
            if (hive.apiary_id !== undefined) apiaryId = hive.apiary_id;
            else if (hive.apiaryId !== undefined) apiaryId = hive.apiaryId;
            else if (hive.apiary !== undefined) apiaryId = hive.apiary;
            else if (hive.apiaries && hive.apiaries.id !== undefined) apiaryId = hive.apiaries.id;
            
            if (apiaryId === testApiary.id) {
                testHive = hive;
                break;
            }
        }
        
        if (testHive) {
            console.log('TEST FILTERING for hive:', testHive.id, testHive.hive_name || testHive.name);
            
            // Count records that should match this apiary
            let apiaryMatchCount = 0;
            let hiveMatchCount = 0;
            
            allHiveData.forEach(record => {
                if (!record || !record.node_id) return;
                
                // Check if this record matches the test apiary
                const hive = hives.find(h => h.node_id === record.node_id);
                if (hive) {
                    let apiaryId = null;
                    if (hive.apiary_id !== undefined) apiaryId = hive.apiary_id;
                    else if (hive.apiaryId !== undefined) apiaryId = hive.apiaryId;
                    else if (hive.apiary !== undefined) apiaryId = hive.apiary;
                    else if (hive.apiaries && hive.apiaries.id !== undefined) apiaryId = hive.apiaries.id;
                    
                    if (apiaryId === testApiary.id) {
                        apiaryMatchCount++;
                    }
                    
                    if (hive.id === testHive.id) {
                        hiveMatchCount++;
                    }
                }
            });
            
            console.log('Records matching test apiary:', apiaryMatchCount);
            console.log('Records matching test hive:', hiveMatchCount);
            
            // Print example records that should match
            if (apiaryMatchCount > 0) {
                console.log('Example records that should match the test apiary:');
                let count = 0;
                for (const record of allHiveData) {
                    if (!record || !record.node_id) continue;
                    
                    const hive = hives.find(h => h.node_id === record.node_id);
                    if (hive) {
                        let apiaryId = null;
                        if (hive.apiary_id !== undefined) apiaryId = hive.apiary_id;
                        else if (hive.apiaryId !== undefined) apiaryId = hive.apiaryId;
                        else if (hive.apiary !== undefined) apiaryId = hive.apiary;
                        else if (hive.apiaries && hive.apiaries.id !== undefined) apiaryId = hive.apiaries.id;
                        
                        if (apiaryId === testApiary.id) {
                            console.log('Matching record:', {
                                created_at: record.created_at,
                                node_id: record.node_id,
                                hive_id: hive.id,
                                temperature: record.temperature,
                                humidity: record.humidity
                            });
                            count++;
                            if (count >= 3) break; // Show just a few examples
                        }
                    }
                }
            }
        } else {
            console.log('Could not find a hive in the test apiary for testing');
        }
    }
    
    console.log('=== DEBUG DATA RELATIONSHIPS END ===');
    
    alert('Data relationships debugging info has been output to the console (F12)');
}

// Clear cached table data and reload from server
async function clearTableDataAndReload() {
    try {
        console.log('Clearing table data and reloading from server...');
        
        // Reset all the data arrays
        allHiveData = [];
        filteredData = [];
        
        // Clear any cached data
        delete window.nodeToApiaryMap;
        delete window.nodeToHiveMap;
        delete window.currentValidHives;
        
        // Show a loading message in the table
        const tableBody = document.getElementById('hiveDataTableBody');
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center">Loading fresh data...</td></tr>`;
        }
        
        // Reset the filters UI
        resetFilters();
        
        // Reload everything
        await loadApiaries();
        await loadHiveData();
        
        alert('Table data successfully refreshed from server.');
    } catch (error) {
        console.error('Error clearing and reloading table data:', error);
        alert('Error refreshing data: ' + error.message);
    }
}
