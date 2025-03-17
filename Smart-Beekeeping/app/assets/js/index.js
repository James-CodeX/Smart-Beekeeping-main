// JavaScript for index.html

// Global chart variables
let metricsChart, temperatureChart, humidityChart, weightChart, soundChart;

// Initialize charts and data when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for auth to be checked
    await waitForAuth();
    
    // Load necessary data managers
    if (!window.dataManager) {
        console.error('Data manager not loaded');
        return;
    }
    
    // Initialize the charts
    initializeCharts();
    
    // Load metrics data
    loadMetricsData();
    
    // Update health indicators
    updateHealthIndicators();
    
    // Update dropdowns
    updateAlertsDropdown();
    updateMessagesDropdown();
    
    // Schedule periodic updates
    setInterval(() => {
        loadMetricsData();
        updateHealthIndicators();
        updateAlertsDropdown();
        updateMessagesDropdown();
    }, 30000);
});

// Initialize all charts with common options
function initializeCharts() {
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'hour',
                    stepSize: 1,
                    displayFormats: {
                        hour: 'HH:mm'
                    },
                    tooltipFormat: 'MMM D, YYYY HH:mm'
                },
                grid: {
                    display: true,
                    drawBorder: true,
                    drawOnChartArea: true,
                    drawTicks: true,
                },
                ticks: {
                    autoSkip: true,
                    maxTicksLimit: 10,
                    maxRotation: 0,
                    minRotation: 0
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    drawBorder: true,
                    drawOnChartArea: true,
                    drawTicks: true,
                },
                ticks: {
                    padding: 5
                }
            }
        },
        plugins: {
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    title: function(tooltipItems) {
                        return moment(tooltipItems[0].parsed.x).format('MMM D, YYYY HH:mm');
                    }
                }
            },
            legend: {
                position: 'top',
                labels: {
                    padding: 10,
                    usePointStyle: true
                }
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        },
        elements: {
            line: {
                tension: 0.4
            },
            point: {
                radius: 2,
                hitRadius: 4,
                hoverRadius: 4
            }
        }
    };

    // Main overview chart
    const ctx = document.getElementById('metricsChart').getContext('2d');
    metricsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Temperature (°C)',
                    borderColor: '#4e73df',
                    data: [],
                    fill: false
                },
                {
                    label: 'Humidity (%)',
                    borderColor: '#1cc88a',
                    data: [],
                    fill: false
                },
                {
                    label: 'Weight (kg)',
                    borderColor: '#36b9cc',
                    data: [],
                    fill: false
                },
                {
                    label: 'Sound (dB)',
                    borderColor: '#f6c23e',
                    data: [],
                    fill: false
                }
            ]
        },
        options: commonOptions
    });

    // Individual metric charts with the same time formatting
    temperatureChart = new Chart(document.getElementById('temperatureChart').getContext('2d'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Temperature (°C)',
                borderColor: '#4e73df',
                backgroundColor: 'rgba(78, 115, 223, 0.05)',
                data: [],
                fill: true
            }]
        },
        options: {
            ...commonOptions,
            plugins: {
                ...commonOptions.plugins,
                annotation: {
                    annotations: {
                        box1: {
                            type: 'box',
                            yMin: 25,
                            yMax: 36,
                            backgroundColor: 'rgba(46, 204, 113, 0.1)',
                            borderColor: 'rgba(46, 204, 113, 0.5)'
                        }
                    }
                }
            }
        }
    });

    humidityChart = new Chart(document.getElementById('humidityChart').getContext('2d'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Humidity (%)',
                borderColor: '#1cc88a',
                backgroundColor: 'rgba(28, 200, 138, 0.05)',
                data: [],
                fill: true
            }]
        },
        options: commonOptions
    });

    weightChart = new Chart(document.getElementById('weightChart').getContext('2d'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Weight (kg)',
                borderColor: '#36b9cc',
                backgroundColor: 'rgba(54, 185, 204, 0.05)',
                data: [],
                fill: true
            }]
        },
        options: commonOptions
    });

    soundChart = new Chart(document.getElementById('soundChart').getContext('2d'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Sound (dB)',
                borderColor: '#f6c23e',
                backgroundColor: 'rgba(246, 194, 62, 0.05)',
                data: [],
                fill: true
            }]
        },
        options: commonOptions
    });
}

// Load metrics data from the data manager
async function loadMetricsData() {
    try {
        // Get the selected hive data
        const hiveId = document.getElementById('hiveSelector').value;
        const timeRange = document.getElementById('timeRangeSelector').value;
        
        // Get metrics data
        const data = await window.dataManager.getHiveMetrics(hiveId, timeRange);
        if (!data || data.length === 0) {
            console.warn('No metrics data found');
            return;
        }
        
        // Update metrics display
        updateMetricsDisplay(data);
        
        // Update charts
        updateCharts(data);
        
        // Update current values and status
        const latestData = data[data.length - 1];
        updateCurrentValues(latestData);
        updateStatus('temperature', latestData.temperature);
        updateStatus('humidity', latestData.humidity);
        updateStatus('weight', latestData.weight/1000); // Convert to kg
        updateStatus('sound', latestData.sound);
        
    } catch (error) {
        console.error('Error loading metrics data:', error);
    }
}

// Update the display of metrics values
function updateMetricsDisplay(data) {
    if (!data || data.length === 0) return;
    
    const latest = data[data.length - 1];
    
    // Update current values
    document.getElementById('current-temperature').textContent = latest.temperature.toFixed(1) + '°C';
    document.getElementById('current-humidity').textContent = latest.humidity.toFixed(1) + '%';
    document.getElementById('current-weight').textContent = (latest.weight/1000).toFixed(2) + ' kg';
    document.getElementById('current-sound').textContent = latest.sound.toFixed(1) + ' dB';
    
    // Calculate and display trends
    if (data.length > 1) {
        const previous = data[data.length - 2];
        
        updateTrend('temperature-trend', latest.temperature - previous.temperature);
        updateTrend('humidity-trend', latest.humidity - previous.humidity);
        updateTrend('weight-trend', (latest.weight - previous.weight)/1000);
        updateTrend('sound-trend', latest.sound - previous.sound);
    }
}

// Update trend indicators
function updateTrend(elementId, change) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const absChange = Math.abs(change).toFixed(1);
    if (change > 0) {
        element.innerHTML = `<i class="fas fa-arrow-up text-success"></i> ${absChange}`;
    } else if (change < 0) {
        element.innerHTML = `<i class="fas fa-arrow-down text-danger"></i> ${absChange}`;
    } else {
        element.innerHTML = `<i class="fas fa-equals text-info"></i> ${absChange}`;
    }
}

// Update all charts with new data
function updateCharts(data) {
    if (!data || data.length === 0) return;
    
    // Create timestamps for the x-axis
    const timestamps = data.map(d => new Date(d.created_at).getTime());
    
    // Determine the time range for filtering
    const timeRangeSelector = document.getElementById('timeRangeSelector');
    let timeRange = 24; // default to 24 hours
    if (timeRangeSelector) {
        timeRange = parseInt(timeRangeSelector.value, 10);
    }
    
    // Filter data based on time range
    const now = new Date().getTime();
    const cutoff = now - (timeRange * 60 * 60 * 1000);
    const filteredData = data.filter(d => new Date(d.created_at).getTime() > cutoff);
    
    // Update the main metrics chart
    if (metricsChart) {
        metricsChart.data.labels = timestamps;
        metricsChart.data.datasets[0].data = filteredData.map(d => ({
            x: new Date(d.created_at).getTime(),
            y: d.temperature
        }));
        metricsChart.data.datasets[1].data = filteredData.map(d => ({
            x: new Date(d.created_at).getTime(),
            y: d.humidity
        }));
        metricsChart.data.datasets[2].data = filteredData.map(d => ({
            x: new Date(d.created_at).getTime(),
            y: d.weight/1000 // Convert to kg
        }));
        metricsChart.data.datasets[3].data = filteredData.map(d => ({
            x: new Date(d.created_at).getTime(),
            y: d.sound
        }));
        metricsChart.update();
    }
    
    // Update individual charts
    if (temperatureChart) {
        temperatureChart.data.labels = timestamps;
        temperatureChart.data.datasets[0].data = filteredData.map(d => ({
            x: new Date(d.created_at).getTime(),
            y: d.temperature
        }));
        temperatureChart.update();
    }
    
    if (humidityChart) {
        humidityChart.data.labels = timestamps;
        humidityChart.data.datasets[0].data = filteredData.map(d => ({
            x: new Date(d.created_at).getTime(),
            y: d.humidity
        }));
        humidityChart.update();
    }
    
    if (weightChart) {
        weightChart.data.labels = timestamps;
        weightChart.data.datasets[0].data = filteredData.map(d => ({
            x: new Date(d.created_at).getTime(),
            y: d.weight/1000 // Convert to kg
        }));
        weightChart.update();
    }
    
    if (soundChart) {
        soundChart.data.labels = timestamps;
        soundChart.data.datasets[0].data = filteredData.map(d => ({
            x: new Date(d.created_at).getTime(),
            y: d.sound
        }));
        soundChart.update();
    }
}

// Thresholds adjusted based on actual data ranges (weight in kg)
const thresholds = {
    temperature: { min: 25, max: 36 },
    humidity: { min: 50, max: 70 },
    weight: { min: 1.2, max: 1.6 }, // Converted to kg
    sound: { min: 30, max: 50 }
};

// Update status indicators and show alerts
function updateStatus(metric, value) {
    console.log(`Updating status for ${metric}:`, value);
    const threshold = thresholds[metric];
    const status = document.getElementById(`${metric}-status`);
    const indicator = document.getElementById(`${metric}-indicator`);
    
    if (!status || !indicator) {
        console.error(`Missing elements for ${metric}-status or ${metric}-indicator`);
        return;
    }
    
    let alertMessage = '';
    let alertType = '';
    
    if (value < threshold.min) {
        status.textContent = 'Low';
        status.className = 'text-danger';
        indicator.textContent = 'Below Normal';
        
        // Create alert message for low values
        if (metric === 'temperature') {
            alertMessage = `Warning: Temperature is too low (${value.toFixed(1)}°C). Minimum safe temperature is ${threshold.min}°C.`;
            alertType = 'warning';
        } else if (metric === 'humidity') {
            alertMessage = `Warning: Humidity is too low (${value.toFixed(1)}%). Minimum safe humidity is ${threshold.min}%.`;
            alertType = 'warning';
        }
    } else if (value > threshold.max) {
        status.textContent = 'High';
        status.className = 'text-danger';
        indicator.textContent = 'Above Normal';
        
        // Create alert message for high values
        if (metric === 'temperature') {
            alertMessage = `Alert: Temperature is too high (${value.toFixed(1)}°C). Maximum safe temperature is ${threshold.max}°C.`;
            alertType = 'danger';
        } else if (metric === 'humidity') {
            alertMessage = `Alert: Humidity is too high (${value.toFixed(1)}%). Maximum safe humidity is ${threshold.max}%.`;
            alertType = 'danger';
        }
    } else {
        status.textContent = 'Normal';
        status.className = 'text-success';
        indicator.textContent = 'Optimal Range';
    }
    
    // Show alert if there's a message
    if (alertMessage) {
        showAlert(alertMessage, alertType, metric);
    }
}

// Function to show alerts in the alerts center
function showAlert(message, type, metric) {
    const alertsContainer = document.querySelector('.dropdown-list');
    if (!alertsContainer) return;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const dateString = now.toLocaleDateString();
    
    // Create alert data
    const alertData = {
        message,
        type,
        metric,
        created_at: now.toISOString()
    };
    
    // Add to alerts manager if available
    if (window.alertsManager) {
        window.alertsManager.addAlert(alertData);
    }
}

// Update Health Indicators
function updateHealthIndicators() {
    try {
        const hiveId = document.getElementById('hiveSelector').value;
        const hiveData = window.dataManager.getHiveLatestData(hiveId);
        if (!hiveData) return;
        
        function updateProgressBar(elementId, value) {
            const progressBar = document.querySelector(`#${elementId} .progress-bar`);
            if (!progressBar) {
                console.log(`Progress bar not found for ${elementId}`);
                return;
            }
            const normalizedValue = Math.max(0, Math.min(100, value));
            progressBar.style.width = `${normalizedValue}%`;
            progressBar.setAttribute('aria-valuenow', normalizedValue);
        }

        // Calculate temperature stability
        const tempOptimal = 26.5;
        const tempStability = 100 - Math.abs((hiveData.temperature || 0) - tempOptimal) * 20;
        const tempElement = document.getElementById('temp-stability');
        if (tempElement) {
            tempElement.textContent = `${Math.max(0, Math.min(100, tempStability)).toFixed(0)}%`;
        }

        // Calculate humidity balance
        const humidityOptimal = 48;
        const humidityBalance = 100 - Math.abs((hiveData.humidity || 0) - humidityOptimal) * 2;
        const humidityElement = document.getElementById('humidity-balance');
        if (humidityElement) {
            humidityElement.textContent = `${Math.max(0, Math.min(100, humidityBalance)).toFixed(0)}%`;
        }

        // Calculate colony activity
        const activityOptimal = 40;
        const colonyActivity = 100 - Math.abs((hiveData.sound || 0) - activityOptimal) * 2;
        const activityElement = document.getElementById('colony-activity');
        if (activityElement) {
            activityElement.textContent = `${Math.max(0, Math.min(100, colonyActivity)).toFixed(0)}%`;
        }

        // Calculate honey production
        const honeyProduction = Math.min(100, ((hiveData.weight || 0) / 1600) * 100);
        const productionElement = document.getElementById('honey-production');
        if (productionElement) {
            productionElement.textContent = `${Math.max(0, Math.min(100, honeyProduction)).toFixed(0)}%`;
        }

        // Update progress bars
        updateProgressBar('temp-stability', tempStability);
        updateProgressBar('humidity-balance', humidityBalance);
        updateProgressBar('colony-activity', colonyActivity);
        updateProgressBar('honey-production', honeyProduction);
    } catch (error) {
        console.error('Error updating health indicators:', error);
    }
}

// Logout handler
async function handleLogout() {
    await logout();
}

// Update alerts dropdown
function updateAlertsDropdown() {
    const alerts = window.alertsManager.getLatestAlerts(3);
    const alertsCount = window.alertsManager.getUnreadCount();
    
    document.getElementById('alertsCount').textContent = alertsCount > 0 ? (alertsCount > 3 ? '3+' : alertsCount) : '';
    
    const alertsHtml = alerts.map(alert => `
        <a class="dropdown-item d-flex align-items-center" href="alerts.html">
            <div class="me-3">
                <div class="bg-${alert.type} icon-circle">
                    <i class="fas ${getAlertIcon(alert.metric)} text-white"></i>
                </div>
            </div>
            <div>
                <span class="small text-gray-500">${new Date(alert.created_at).toLocaleString()}</span>
                <p class="mb-0">${alert.message}</p>
            </div>
        </a>
    `).join('') || '<div class="dropdown-item text-center">No alerts</div>';
    
    document.getElementById('alertsDropdown').innerHTML = alertsHtml;
}

// Update messages dropdown
function updateMessagesDropdown() {
    const messages = window.messagesManager.getLatestMessages(3);
    const messagesCount = window.messagesManager.getUnreadCount();
    
    document.getElementById('messagesCount').textContent = messagesCount > 0 ? (messagesCount > 3 ? '3+' : messagesCount) : '';
    
    const messagesHtml = messages.map(message => `
        <a class="dropdown-item d-flex align-items-center" href="messages.html">
            <div class="me-3">
                <div class="bg-${getMessagePriorityClass(message.priority)} icon-circle">
                    <i class="fas ${getMessageIcon(message.type)} text-white"></i>
                </div>
            </div>
            <div>
                <div class="fw-bold">
                    <div class="text-truncate">${message.title}</div>
                    <div class="small text-gray-500">${new Date(message.created_at).toLocaleString()}</div>
                </div>
            </div>
        </a>
    `).join('') || '<div class="dropdown-item text-center">No messages</div>';
    
    document.getElementById('messagesDropdown').innerHTML = messagesHtml;
}

// Helper function for alert icons
function getAlertIcon(metric) {
    switch (metric) {
        case 'temperature': return 'fa-thermometer-high';
        case 'humidity': return 'fa-tint';
        case 'weight': return 'fa-weight';
        case 'sound': return 'fa-volume-up';
        default: return 'fa-exclamation-triangle';
    }
}

// Helper function for message icons
function getMessageIcon(type) {
    switch (type) {
        case 'system': return 'fa-cog';
        case 'notification': return 'fa-bell';
        case 'update': return 'fa-sync';
        default: return 'fa-envelope';
    }
}

// Helper function for message priority classes
function getMessagePriorityClass(priority) {
    switch (priority) {
        case 'high': return 'danger';
        case 'medium': return 'warning';
        default: return 'info';
    }
} 