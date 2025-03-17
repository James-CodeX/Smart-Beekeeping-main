// JavaScript for apiary-details.html

let currentApiaryId = null;
let hiveData = {};

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await updateProfileUI();
    await loadApiaryDetails();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('editApiaryBtn').addEventListener('click', () => {
        if (currentApiaryId) {
            editApiary(currentApiaryId);
        }
    });
    
    document.getElementById('addHiveBtn').addEventListener('click', () => {
        if (currentApiaryId) {
            window.location.href = `add-hive.html?apiary=${currentApiaryId}`;
        }
    });
}

async function loadApiaryDetails() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        // Get apiary ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const apiaryId = urlParams.get('id');
        
        if (!apiaryId) {
            alert('No apiary specified');
            window.location.href = 'manage-my-bees.html';
            return;
        }
        
        currentApiaryId = apiaryId;
        
        // Load apiary data
        const { data: apiary, error: apiaryError } = await supabaseClient
            .from('apiaries')
            .select('*')
            .eq('id', apiaryId)
            .single();
            
        if (apiaryError) throw apiaryError;
        
        if (!apiary || apiary.user_id !== user.id) {
            alert('Apiary not found or you do not have permission to view it');
            window.location.href = 'manage-my-bees.html';
            return;
        }
        
        // Update the page with apiary details
        document.getElementById('apiaryName').textContent = apiary.name;
        document.getElementById('apiaryLocation').textContent = apiary.location;
        document.title = `${apiary.name} - Smart Nyuki`;
        
        // Load hives in this apiary
        await loadHives(apiaryId);
        
        // For demo/development, simulate real-time updates
        // Comment this out in production
        simulateRealTimeUpdates();
        
    } catch (error) {
        console.error('Error loading apiary details:', error);
        alert('Failed to load apiary details: ' + error.message);
    }
}

async function loadHives(apiaryId) {
    try {
        // Show loading indicator
        const hivesLoading = document.getElementById('hivesLoading');
        if (hivesLoading) {
            hivesLoading.style.display = 'block';
        }
        
        const { data: hives, error: hivesError } = await supabaseClient
            .from('hive_details')
            .select('*')
            .eq('apiary_id', apiaryId);
            
        if (hivesError) throw hivesError;
        
        // Hide loading indicator
        if (hivesLoading) {
            hivesLoading.style.display = 'none';
        }
        
        // If no hives, show message
        const hivesList = document.getElementById('hivesList');
        
        if (!hives || hives.length === 0) {
            hivesList.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info">
                        <h5><i class="fas fa-info-circle me-2"></i>No Hives Yet</h5>
                        <p>You haven't added any hives to this apiary. Click the "Add Hive" button to get started.</p>
                    </div>
                </div>
            `;
            
            // Set default values for metrics
            document.getElementById('avgTemperature').textContent = 'N/A';
            document.getElementById('avgHumidity').textContent = 'N/A';
            document.getElementById('avgSoundLevel').textContent = 'N/A';
            document.getElementById('avgWeight').textContent = 'N/A';
            
            // Hide trend indicators
            document.getElementById('tempTrend').style.display = 'none';
            document.getElementById('humidityTrend').style.display = 'none';
            document.getElementById('soundTrend').style.display = 'none';
            document.getElementById('weightTrend').style.display = 'none';
            
            return;
        }
        
        // Process hives and get their latest data
        for (const hive of hives) {
            await loadHiveData(hive.id, hive.node_id);
        }
        
        // Calculate and display average metrics
        updateAverageMetrics();
        
        // Generate hive cards
        hivesList.innerHTML = hives.map(hive => {
            const hiveInfo = hiveData[hive.id] || { 
                temperature: 'N/A', 
                humidity: 'N/A', 
                sound: 'N/A', 
                weight: 'N/A'
            };
            
            return `
                <div class="col-lg-6 mb-4">
                    <div class="card shadow hive-card" data-hive-id="${hive.id}">
                        <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                            <h6 class="m-0 font-weight-bold text-primary">${escapeHtml(hive.hive_name || 'Unnamed Hive')}</h6>
                            <div class="dropdown no-arrow">
                                <a class="dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    <i class="fas fa-ellipsis-v fa-sm fa-fw text-gray-400"></i>
                                </a>
                                <div class="dropdown-menu dropdown-menu-right shadow animated--fade-in">
                                    <div class="dropdown-header">Hive Actions:</div>
                                    <a class="dropdown-item" href="hive-details.html?id=${hive.id}">View Dashboard</a>
                                    <a class="dropdown-item" href="#" onclick="editHive(${hive.id})">Edit Details</a>
                                    <div class="dropdown-divider"></div>
                                    <a class="dropdown-item text-danger" href="#" onclick="deleteHive(${hive.id})">Delete</a>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <p><strong>Temperature:</strong> <span class="text-success temperature-value">${hiveInfo.temperature !== 'N/A' ? `${hiveInfo.temperature} °C` : 'N/A'}</span></p>
                                    <div class="chart-container">
                                        <canvas id="temp-chart-${hive.id}" class="temp-chart"></canvas>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <p><strong>Humidity:</strong> <span class="humidity-value">${hiveInfo.humidity !== 'N/A' ? `${hiveInfo.humidity} %` : 'N/A'}</span></p>
                                    <div class="chart-container">
                                        <canvas id="humidity-chart-${hive.id}" class="humidity-chart"></canvas>
                                    </div>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <p><strong>Sound Level:</strong> <span class="text-purple sound-value">${hiveInfo.sound !== 'N/A' ? `${hiveInfo.sound} dB` : 'N/A'}</span></p>
                                    <div class="chart-container">
                                        <canvas id="sound-chart-${hive.id}" class="sound-chart"></canvas>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <p><strong>Weight:</strong> <span class="text-warning weight-value">${hiveInfo.weight !== 'N/A' ? `${hiveInfo.weight} kg` : 'N/A'}</span></p>
                                    <div class="chart-container">
                                        <canvas id="weight-chart-${hive.id}" class="weight-chart"></canvas>
                                    </div>
                                </div>
                            </div>
                            <div class="text-center mt-3">
                                <a href="hive-details.html?id=${hive.id}" class="btn btn-primary btn-sm view-details-btn">View Details <i class="fas fa-arrow-right ms-1"></i></a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Initialize charts for each hive
        for (const hive of hives) {
            if (hiveData[hive.id] && hiveData[hive.id].history) {
                initializeCharts(hive.id, hiveData[hive.id].history);
            }
        }
        
        // Update the last updated time
        updateLastUpdatedTime();
        
    } catch (error) {
        console.error('Error loading hives:', error);
        alert('Failed to load hives: ' + error.message);
        
        // Hide loading indicator on error as well
        const hivesLoading = document.getElementById('hivesLoading');
        if (hivesLoading) {
            hivesLoading.style.display = 'none';
        }
    }
}

async function loadHiveData(hiveId, nodeId) {
    if (!nodeId) {
        hiveData[hiveId] = { 
            temperature: 'N/A', 
            humidity: 'N/A', 
            sound: 'N/A', 
            weight: 'N/A',
            history: null
        };
        return;
    }
    
    try {
        // Get the last 24 hours of data
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const { data, error } = await supabaseClient
            .from('hive_data')
            .select('*')
            .eq('node_id', nodeId)
            .gte('recorded_at', yesterday.toISOString())
            .order('recorded_at', { ascending: false })
            .limit(48);  // Get enough data points for a good chart
            
        if (error) throw error;
        
        if (!data || data.length === 0) {
            // If no real data, generate some sample data for demo purposes
            const sampleData = generateSampleData(hiveId);
            hiveData[hiveId] = sampleData;
            return;
        }
        
        // Get the most recent data point
        const latestData = data[0];
        
        // Store data for this hive
        hiveData[hiveId] = {
            temperature: latestData.temperature ? parseFloat(latestData.temperature).toFixed(1) : 'N/A',
            humidity: latestData.humidity ? Math.round(parseFloat(latestData.humidity)) : 'N/A',
            sound: latestData.sound_level ? Math.round(parseFloat(latestData.sound_level)) : 'N/A',
            weight: latestData.weight ? parseFloat(latestData.weight).toFixed(1) : 'N/A',
            history: data.reverse()  // Reverse to get chronological order for charts
        };
        
    } catch (error) {
        console.error(`Error loading data for hive ${hiveId}:`, error);
        // Generate sample data for demo purposes
        const sampleData = generateSampleData(hiveId);
        hiveData[hiveId] = sampleData;
    }
}

// Function to generate sample data for demo/testing purposes
function generateSampleData(hiveId) {
    const now = new Date();
    const history = [];
    const baseTemp = 32 + Math.random() * 3; // Base temperature around 32-35°C
    const baseHumidity = 35 + Math.random() * 15; // Base humidity around 35-50%
    const baseSound = 50 + Math.random() * 20; // Base sound around 50-70dB
    const baseWeight = 15 + Math.random() * 8; // Base weight around 15-23kg
    
    // Generate 24 hours of sample data at hourly intervals
    for (let i = 0; i < 24; i++) {
        const timestamp = new Date(now);
        timestamp.setHours(now.getHours() - 24 + i);
        
        // Add some variation to each reading
        const temp = baseTemp + (Math.random() * 2 - 1);
        const humidity = baseHumidity + (Math.random() * 10 - 5);
        const sound = baseSound + (Math.random() * 10 - 5);
        const weight = baseWeight + (i * 0.05) + (Math.random() * 0.2 - 0.1); // Slight upward trend for weight
        
        history.push({
            recorded_at: timestamp.toISOString(),
            temperature: temp.toFixed(1),
            humidity: Math.round(humidity),
            sound_level: Math.round(sound),
            weight: weight.toFixed(1)
        });
    }
    
    return {
        temperature: history[history.length - 1].temperature,
        humidity: history[history.length - 1].humidity,
        sound: history[history.length - 1].sound_level,
        weight: history[history.length - 1].weight,
        history: history
    };
}

function updateAverageMetrics() {
    let totalTemp = 0;
    let totalHumidity = 0;
    let totalSound = 0;
    let totalWeight = 0;
    
    let countTemp = 0;
    let countHumidity = 0;
    let countSound = 0;
    let countWeight = 0;
    
    // For trend calculations
    let prevTotalTemp = 0;
    let prevTotalHumidity = 0;
    let prevTotalSound = 0;
    let prevTotalWeight = 0;
    
    let prevCountTemp = 0;
    let prevCountHumidity = 0;
    let prevCountSound = 0;
    let prevCountWeight = 0;
    
    // Calculate averages from all hives with data
    for (const hiveId in hiveData) {
        const data = hiveData[hiveId];
        
        if (data.temperature !== 'N/A') {
            totalTemp += parseFloat(data.temperature);
            countTemp++;
            
            // Calculate previous values for trends (if history available)
            if (data.history && data.history.length > 12) {
                const pastIndex = Math.max(0, data.history.length - 12); // 12 hours ago
                const pastTemp = data.history[pastIndex].temperature;
                if (pastTemp) {
                    prevTotalTemp += parseFloat(pastTemp);
                    prevCountTemp++;
                }
            }
        }
        
        if (data.humidity !== 'N/A') {
            totalHumidity += parseFloat(data.humidity);
            countHumidity++;
            
            if (data.history && data.history.length > 12) {
                const pastIndex = Math.max(0, data.history.length - 12);
                const pastHumidity = data.history[pastIndex].humidity;
                if (pastHumidity) {
                    prevTotalHumidity += parseFloat(pastHumidity);
                    prevCountHumidity++;
                }
            }
        }
        
        if (data.sound !== 'N/A') {
            totalSound += parseFloat(data.sound);
            countSound++;
            
            if (data.history && data.history.length > 12) {
                const pastIndex = Math.max(0, data.history.length - 12);
                const pastSound = data.history[pastIndex].sound_level;
                if (pastSound) {
                    prevTotalSound += parseFloat(pastSound);
                    prevCountSound++;
                }
            }
        }
        
        if (data.weight !== 'N/A') {
            totalWeight += parseFloat(data.weight);
            countWeight++;
            
            if (data.history && data.history.length > 12) {
                const pastIndex = Math.max(0, data.history.length - 12);
                const pastWeight = data.history[pastIndex].weight;
                if (pastWeight) {
                    prevTotalWeight += parseFloat(pastWeight);
                    prevCountWeight++;
                }
            }
        }
    }
    
    // Update UI with averages
    const avgTempEl = document.getElementById('avgTemperature');
    const avgHumidityEl = document.getElementById('avgHumidity');
    const avgSoundEl = document.getElementById('avgSoundLevel');
    const avgWeightEl = document.getElementById('avgWeight');
    
    // Update trend indicators
    const tempTrendEl = document.getElementById('tempTrend');
    const humidityTrendEl = document.getElementById('humidityTrend');
    const soundTrendEl = document.getElementById('soundTrend');
    const weightTrendEl = document.getElementById('weightTrend');
    
    // Calculate current averages
    const currentTemp = countTemp > 0 ? (totalTemp / countTemp) : 0;
    const currentHumidity = countHumidity > 0 ? (totalHumidity / countHumidity) : 0;
    const currentSound = countSound > 0 ? (totalSound / countSound) : 0;
    const currentWeight = countWeight > 0 ? (totalWeight / countWeight) : 0;
    
    // Calculate previous averages for trends
    const previousTemp = prevCountTemp > 0 ? (prevTotalTemp / prevCountTemp) : currentTemp;
    const previousHumidity = prevCountHumidity > 0 ? (prevTotalHumidity / prevCountHumidity) : currentHumidity;
    const previousSound = prevCountSound > 0 ? (prevTotalSound / prevCountSound) : currentSound;
    const previousWeight = prevCountWeight > 0 ? (prevTotalWeight / prevCountWeight) : currentWeight;
    
    // Update values
    avgTempEl.textContent = countTemp > 0 ? currentTemp.toFixed(1) : 'N/A';
    avgHumidityEl.textContent = countHumidity > 0 ? Math.round(currentHumidity) : 'N/A';
    avgSoundEl.textContent = countSound > 0 ? Math.round(currentSound) : 'N/A';
    avgWeightEl.textContent = countWeight > 0 ? currentWeight.toFixed(1) : 'N/A';
    
    // Update trend indicators
    if (countTemp > 0 && prevCountTemp > 0) {
        const tempDiff = currentTemp - previousTemp;
        updateTrendIndicator(tempTrendEl, tempDiff, 0.5, '°');
    } else {
        tempTrendEl.style.display = 'none';
    }
    
    if (countHumidity > 0 && prevCountHumidity > 0) {
        const humidityDiff = currentHumidity - previousHumidity;
        updateTrendIndicator(humidityTrendEl, humidityDiff, 1, '%');
    } else {
        humidityTrendEl.style.display = 'none';
    }
    
    if (countSound > 0 && prevCountSound > 0) {
        const soundDiff = currentSound - previousSound;
        updateTrendIndicator(soundTrendEl, soundDiff, 2, 'dB');
    } else {
        soundTrendEl.style.display = 'none';
    }
    
    if (countWeight > 0 && prevCountWeight > 0) {
        const weightDiff = currentWeight - previousWeight;
        updateTrendIndicator(weightTrendEl, weightDiff, 0.1, 'kg');
    } else {
        weightTrendEl.style.display = 'none';
    }
    
    // Update progress bars
    const tempBar = document.querySelector('.progress-bar-temp');
    const humidityBar = document.querySelector('.progress-bar-humidity');
    const soundBar = document.querySelector('.progress-bar-sound');
    const weightBar = document.querySelector('.progress-bar-weight');
    
    if (countTemp > 0) {
        const tempPercent = Math.min(Math.max((totalTemp / countTemp) / 40 * 100, 10), 100);
        tempBar.style.width = `${tempPercent}%`;
    }
    
    if (countHumidity > 0) {
        const humidityPercent = Math.min(Math.max((totalHumidity / countHumidity) / 100 * 100, 10), 100);
        humidityBar.style.width = `${humidityPercent}%`;
    }
    
    if (countSound > 0) {
        const soundPercent = Math.min(Math.max((totalSound / countSound) / 100 * 100, 10), 100);
        soundBar.style.width = `${soundPercent}%`;
    }
    
    if (countWeight > 0) {
        const weightPercent = Math.min(Math.max((totalWeight / countWeight) / 30 * 100, 10), 100);
        weightBar.style.width = `${weightPercent}%`;
    }
    
    // Update last updated time
    updateLastUpdatedTime();
}

// Helper function to update trend indicators
function updateTrendIndicator(element, diff, threshold, unit) {
    element.style.display = 'inline-block';
    
    if (Math.abs(diff) < threshold) {
        // Stable trend
        element.className = 'metric-trend trend-stable';
        element.innerHTML = `<i class="fas fa-minus"></i> ${Math.abs(diff).toFixed(1)}${unit}`;
    } else if (diff > 0) {
        // Upward trend
        element.className = 'metric-trend trend-up';
        element.innerHTML = `<i class="fas fa-arrow-up"></i> ${diff.toFixed(1)}${unit}`;
    } else {
        // Downward trend
        element.className = 'metric-trend trend-down';
        element.innerHTML = `<i class="fas fa-arrow-down"></i> ${Math.abs(diff).toFixed(1)}${unit}`;
    }
}

// Function to update the "Last updated" timestamp
function updateLastUpdatedTime() {
    const updateTimeElement = document.getElementById('updateTime');
    if (updateTimeElement) {
        const now = new Date();
        updateTimeElement.textContent = now.toLocaleTimeString();
        
        // Add a brief pulse animation to the update icon
        const syncIcon = updateTimeElement.previousElementSibling;
        if (syncIcon) {
            syncIcon.classList.add('pulse-animation');
            setTimeout(() => {
                syncIcon.classList.remove('pulse-animation');
            }, 2000);
        }
    }
}

function initializeCharts(hiveId, historyData) {
    if (!historyData || historyData.length === 0) return;
    
    // Prepare data for charts
    const times = historyData.map(d => new Date(d.recorded_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
    const temps = historyData.map(d => d.temperature);
    const humidity = historyData.map(d => d.humidity);
    const sound = historyData.map(d => d.sound_level);
    const weight = historyData.map(d => d.weight);
    
    // Create temperature chart
    createChart(`temp-chart-${hiveId}`, times, temps, 'Temperature', '#2ecc71', '#f39c12');
    
    // Create humidity chart
    createChart(`humidity-chart-${hiveId}`, times, humidity, 'Humidity', '#3498db', '#2980b9');
    
    // Create sound chart
    createChart(`sound-chart-${hiveId}`, times, sound, 'Sound Level', '#9b59b6', '#8e44ad');
    
    // Create weight chart
    createChart(`weight-chart-${hiveId}`, times, weight, 'Weight', '#f1c40f', '#f39c12');
}

function createChart(canvasId, labels, data, label, startColor, endColor) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    // Filter out any null values
    const filteredData = [];
    const filteredLabels = [];
    
    for (let i = 0; i < data.length; i++) {
        if (data[i] !== null) {
            filteredData.push(parseFloat(data[i]));
            filteredLabels.push(labels[i]);
        }
    }
    
    // If after filtering there's no data, don't create chart
    if (filteredData.length === 0) return;
    
    // Sample the data to show fewer points if there are many
    let sampledData = filteredData;
    let sampledLabels = filteredLabels;
    
    if (filteredData.length > 12) {
        const sampleRate = Math.ceil(filteredData.length / 12);
        sampledData = [];
        sampledLabels = [];
        
        for (let i = 0; i < filteredData.length; i += sampleRate) {
            sampledData.push(filteredData[i]);
            sampledLabels.push(filteredLabels[i]);
        }
    }
    
    // Create gradient background
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 60);
    gradient.addColorStop(0, `${startColor}30`);  // 30 = 30% opacity
    gradient.addColorStop(1, `${endColor}00`);    // 00 = 0% opacity
    
    // Add animations to make the charts more dynamic
    const animation = {
        tension: {
            duration: 1000,
            easing: 'linear',
            from: 0.4,
            to: 0.4,
            loop: false
        }
    };
    
    // Create chart
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: sampledLabels,
            datasets: [{
                label: label,
                data: sampledData,
                borderColor: startColor,
                backgroundColor: gradient,
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            animation,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function(context) {
                            let value = context.parsed.y;
                            if (label === 'Temperature') return value.toFixed(1) + ' °C';
                            if (label === 'Humidity') return Math.round(value) + ' %';
                            if (label === 'Sound Level') return Math.round(value) + ' dB';
                            if (label === 'Weight') return value.toFixed(1) + ' kg';
                            return value;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: false,
                    grid: {
                        display: false
                    }
                },
                y: {
                    display: false,
                    beginAtZero: false,
                    grid: {
                        display: false
                    }
                }
            },
            maintainAspectRatio: false,
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false
            }
        }
    });
}

function editApiary(apiaryId) {
    // Show a modal to edit the apiary
    // This would be implemented in a modal on the page
    // For now, we just redirect to the manage page which has the edit functionality
    window.location.href = `manage-my-bees.html?edit=${apiaryId}`;
}

function editHive(hiveId) {
    // Redirect to hive edit page
    window.location.href = `edit-hive.html?id=${hiveId}`;
}

async function deleteHive(hiveId) {
    if (!confirm('Are you sure you want to delete this hive? This will delete ALL data associated with this hive and cannot be undone.')) {
        return;
    }
    
    try {
        // Get the hive details first
        const { data: hive, error: hiveError } = await supabaseClient
            .from('hive_details')
            .select('*')
            .eq('id', hiveId)
            .single();
            
        if (hiveError) throw hiveError;
        
        // If there's a node_id, delete associated data
        if (hive.node_id) {
            const { error: dataError } = await supabaseClient
                .from('hive_data')
                .delete()
                .eq('node_id', hive.node_id);
                
            if (dataError) {
                console.error('Warning: Error deleting hive data:', dataError);
                // Continue with deletion even if this fails
            }
        }
        
        // Delete the hive
        const { error } = await supabaseClient
            .from('hive_details')
            .delete()
            .eq('id', hiveId);
            
        if (error) throw error;
        
        // Reload the page to show updated status
        window.location.reload();
        
    } catch (error) {
        console.error('Error deleting hive:', error);
        alert('Failed to delete hive: ' + error.message);
    }
}

function escapeHtml(unsafe) {
    return unsafe
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function handleLogout() {
    await logout();
}

// Update simulateRealTimeUpdates to show loading state
function simulateRealTimeUpdates() {
    // Only use this for demo/testing
    setInterval(async () => {
        // Add small random variations to each hive's current values
        for (const hiveId in hiveData) {
            if (hiveData[hiveId].history) {
                const lastData = hiveData[hiveId].history[hiveData[hiveId].history.length - 1];
                
                // Create a new data point with slight variations
                const newData = {
                    recorded_at: new Date().toISOString(),
                    temperature: (parseFloat(lastData.temperature) + (Math.random() * 0.4 - 0.2)).toFixed(1),
                    humidity: Math.round(parseFloat(lastData.humidity) + (Math.random() * 2 - 1)),
                    sound_level: Math.round(parseFloat(lastData.sound_level) + (Math.random() * 4 - 2)),
                    weight: (parseFloat(lastData.weight) + (Math.random() * 0.1 - 0.02)).toFixed(1)
                };
                
                // Add to history and update current values
                hiveData[hiveId].history.push(newData);
                if (hiveData[hiveId].history.length > 48) {
                    hiveData[hiveId].history.shift(); // Remove oldest if we have too many
                }
                
                hiveData[hiveId].temperature = newData.temperature;
                hiveData[hiveId].humidity = newData.humidity;
                hiveData[hiveId].sound = newData.sound_level;
                hiveData[hiveId].weight = newData.weight;
            }
        }
        
        // Recalculate averages and update UI
        updateAverageMetrics();
        
        // Redraw charts
        const hives = Object.keys(hiveData);
        for (const hiveId of hives) {
            if (hiveData[hiveId].history) {
                initializeCharts(hiveId, hiveData[hiveId].history);
            }
        }
        
        // Update hive cards with new values
        updateHiveCards();
    }, 30000); // Update every 30 seconds for demo
}

// Function to update hive cards with latest values
function updateHiveCards() {
    const hivesList = document.getElementById('hivesList');
    const hiveCards = hivesList.querySelectorAll('.hive-card');
    
    hiveCards.forEach(card => {
        const hiveId = card.dataset.hiveId;
        if (hiveId && hiveData[hiveId]) {
            const tempElement = card.querySelector('.temperature-value');
            const humidityElement = card.querySelector('.humidity-value');
            const soundElement = card.querySelector('.sound-value');
            const weightElement = card.querySelector('.weight-value');
            
            if (tempElement && hiveData[hiveId].temperature !== 'N/A') {
                tempElement.textContent = `${hiveData[hiveId].temperature} °C`;
            }
            
            if (humidityElement && hiveData[hiveId].humidity !== 'N/A') {
                humidityElement.textContent = `${hiveData[hiveId].humidity} %`;
            }
            
            if (soundElement && hiveData[hiveId].sound !== 'N/A') {
                soundElement.textContent = `${hiveData[hiveId].sound} dB`;
            }
            
            if (weightElement && hiveData[hiveId].weight !== 'N/A') {
                weightElement.textContent = `${hiveData[hiveId].weight} kg`;
            }
        }
    });
} 