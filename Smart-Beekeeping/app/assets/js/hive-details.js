// JavaScript for hive-details.html

document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await updateProfileUI();
    await loadHiveDetails();
    
    // Load additional data sections
    const hiveId = getHiveIdFromUrl();
    if (hiveId) {
        await loadInspectionHistory(hiveId);
        await loadHiveEquipment(hiveId);
    }
    
    // Set up event listeners after all content is loaded
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('editHiveBtn')?.addEventListener('click', () => {
        const hiveId = getHiveIdFromUrl();
        if (hiveId) {
            editHive(hiveId);
        }
    });

    document.getElementById('deleteHiveBtn')?.addEventListener('click', () => {
        const hiveId = getHiveIdFromUrl();
        if (hiveId) {
            deleteHive(hiveId);
        }
    });

    document.getElementById('addNoteBtn')?.addEventListener('click', () => {
        showAddNoteModal();
    });
    
    // Also handle the second Add Note button in the Notes card
    document.getElementById('addNoteBtn2')?.addEventListener('click', () => {
        showAddNoteModal();
    });

    document.getElementById('addNoteForm')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        await addNote();
    });
    
    // Time period selector for charts
    document.querySelectorAll('.time-period-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const period = e.target.dataset.period;
            updateChartTimePeriod(period);
        });
    });
    
    // Add health status update handlers
    document.querySelectorAll('.update-health-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const hiveId = getHiveIdFromUrl();
            const newStatus = e.target.dataset.status;
            if (hiveId && newStatus) {
                await updateHiveHealth(hiveId, newStatus);
            }
        });
    });
    
    // Add inspection button
    document.getElementById('addInspectionBtn')?.addEventListener('click', () => {
        showAddInspectionModal();
    });
    
    // Inspection form submission
    document.getElementById('addInspectionForm')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const hiveId = getHiveIdFromUrl();
        if (hiveId) {
            await addInspection(hiveId);
        }
    });
    
    // Add equipment button
    document.getElementById('addEquipmentBtn')?.addEventListener('click', () => {
        showAddEquipmentModal();
    });
    
    // Equipment form submission
    document.getElementById('addEquipmentForm')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const hiveId = getHiveIdFromUrl();
        if (hiveId) {
            await addEquipment(hiveId);
        }
    });
    
    // Export data button
    document.getElementById('exportDataBtn')?.addEventListener('click', () => {
        const hiveId = getHiveIdFromUrl();
        const hiveName = document.getElementById('hiveDetailTitle').textContent || 'Hive';
        if (hiveId) {
            exportHiveData(hiveId, hiveName);
        }
    });
}

async function loadHiveDetails() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        const hiveId = getHiveIdFromUrl();
        if (!hiveId) {
            alert('No hive specified');
            window.location.href = 'apiary-details.html';
            return;
        }

        // Load hive data
        const { data: hive, error: hiveError } = await supabaseClient
            .from('hive_details')
            .select('*, apiaries(*)')
            .eq('id', hiveId)
            .single();

        if (hiveError) throw hiveError;

        if (!hive || hive.user_id !== user.id) {
            alert('Hive not found or you do not have permission to view it');
            window.location.href = 'apiary-details.html';
            return;
        }

        // Update the page with hive details
        document.getElementById('hiveDetailTitle').textContent = hive.hive_name || 'Unnamed Hive';
        document.getElementById('hiveLocation').textContent = `Location: ${hive.location || 'Unknown'}`;
        document.getElementById('hiveType').textContent = `Type: ${hive.hive_type || 'Standard'}`;
        document.getElementById('hiveDateInstalled').textContent = `Installed: ${new Date(hive.date_installed).toLocaleDateString()}`;
        
        // Update breadcrumb navigation
        if (hive.apiaries) {
            document.getElementById('apiaryBreadcrumb').textContent = hive.apiaries.apiary_name || 'Apiary';
            document.getElementById('apiaryBreadcrumb').href = `apiary-details.html?id=${hive.apiary_id}`;
        }

        // Set hive details in the info card
        document.getElementById('hiveId').textContent = hive.id || 'N/A';
        document.getElementById('hiveName').textContent = hive.hive_name || 'Unnamed';
        document.getElementById('queenAge').textContent = calculateQueenAge(hive.queen_installed_date) || 'Unknown';
        document.getElementById('dateInstalled').textContent = new Date(hive.date_installed).toLocaleDateString() || 'Unknown';
        document.getElementById('lastInspection').textContent = hive.last_inspection ? new Date(hive.last_inspection).toLocaleDateString() : 'No inspection recorded';

        // Load additional data and charts
        await loadHiveMetrics(hiveId);
        await loadHiveNotes(hiveId);
        await loadHiveActivityLog(hiveId);
        
        // Set the health status
        updateHealthStatus(hive.health_status);

    } catch (error) {
        console.error('Error loading hive details:', error);
        alert('Failed to load hive details: ' + error.message);
    }
}

function calculateQueenAge(queenDate) {
    if (!queenDate) return 'Unknown';
    
    const today = new Date();
    const installedDate = new Date(queenDate);
    
    const yearDiff = today.getFullYear() - installedDate.getFullYear();
    const monthDiff = today.getMonth() - installedDate.getMonth();
    
    let ageText = '';
    
    if (yearDiff > 0) {
        ageText = `${yearDiff} year${yearDiff !== 1 ? 's' : ''}`;
        if (monthDiff > 0) {
            ageText += ` ${monthDiff} month${monthDiff !== 1 ? 's' : ''}`;
        }
    } else {
        ageText = `${monthDiff} month${monthDiff !== 1 ? 's' : ''}`;
    }
    
    return ageText;
}

function updateHealthStatus(status) {
    const healthIndicators = document.querySelectorAll('.health-indicator');
    const statusClass = status ? `health-${status.toLowerCase()}` : 'health-unknown';
    
    healthIndicators.forEach(indicator => {
        // Remove all possible status classes
        indicator.classList.remove('health-excellent', 'health-good', 'health-caution', 'health-warning', 'health-critical', 'health-unknown');
        // Add the current status class
        indicator.classList.add(statusClass);
    });
    
    const statusElement = document.getElementById('hiveHealthStatus');
    if (statusElement) {
        statusElement.textContent = status || 'Unknown';
        
        // Update the status badge class
        statusElement.classList.remove('bg-success', 'bg-primary', 'bg-warning', 'bg-danger', 'bg-secondary');
        
        switch(status?.toLowerCase()) {
            case 'excellent':
                statusElement.classList.add('bg-success');
                break;
            case 'good':
                statusElement.classList.add('bg-primary');
                break;
            case 'caution':
                statusElement.classList.add('bg-warning');
                break;
            case 'warning':
            case 'critical':
                statusElement.classList.add('bg-danger');
                break;
            default:
                statusElement.classList.add('bg-secondary');
        }
    }
}

function getHiveIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

async function loadHiveMetrics(hiveId) {
    try {
        // Fetch metrics data for the hive
        const { data: metrics, error } = await supabaseClient
            .from('hive_metrics')
            .select('*')
            .eq('hive_id', hiveId)
            .order('timestamp', { ascending: false })
            .limit(100);

        if (error) throw error;

        if (!metrics || metrics.length === 0) {
            console.log('No metrics data available for this hive');
            displayNoMetricsMessage();
            return;
        }

        // Process and display the metrics
        processMetricsData(metrics);
        
        // Create charts with the data
        createTemperatureChart(metrics);
        createHumidityChart(metrics);
        createSoundChart(metrics);
        createWeightChart(metrics);
        
        // Update the last data transmission time
        if (metrics.length > 0) {
            const lastTransmission = new Date(metrics[0].timestamp);
            document.getElementById('lastDataTransmission').textContent = formatLastTransmissionTime(lastTransmission);
        }
        
        // Update sensor status
        updateSensorStatus(metrics);

    } catch (error) {
        console.error('Error loading hive metrics:', error);
    }
}

function formatLastTransmissionTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMins > 0) {
        return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else {
        return 'Just now';
    }
}

function displayNoMetricsMessage() {
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
        container.innerHTML = '<div class="text-center my-5 text-muted">No metrics data available for this hive</div>';
    });
    
    // Update the current values to show no data
    document.getElementById('tempCurrentValue').textContent = 'No data';
    document.getElementById('humidityCurrentValue').textContent = 'No data';
    document.getElementById('soundCurrentValue').textContent = 'No data';
    document.getElementById('weightCurrentValue').textContent = 'No data';
}

function processMetricsData(metrics) {
    // Sort metrics by timestamp ascending for processing
    metrics.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Get the most recent values to display
    const latestMetric = metrics[metrics.length - 1];
    
    if (latestMetric) {
        // Update temperature
        const tempElement = document.getElementById('tempCurrentValue');
        if (tempElement && latestMetric.temperature) {
            tempElement.textContent = `${latestMetric.temperature.toFixed(1)} °C`;
            updateMetricStatus('tempStatus', latestMetric.temperature, 30, 35, 25, 38);
        }
        
        // Update min, avg, max temperature
        updateRangeIndicators('tempMin', 'tempAvg', 'tempMax', metrics, 'temperature', '°C');
        
        // Update humidity
        const humidityElement = document.getElementById('humidityCurrentValue');
        if (humidityElement && latestMetric.humidity) {
            humidityElement.textContent = `${Math.round(latestMetric.humidity)} %`;
            updateMetricStatus('humidityStatus', latestMetric.humidity, 40, 60, 30, 70);
        }
        
        // Update min, avg, max humidity
        updateRangeIndicators('humidityMin', 'humidityAvg', 'humidityMax', metrics, 'humidity', '%');
        
        // Update sound
        const soundElement = document.getElementById('soundCurrentValue');
        if (soundElement && latestMetric.sound_level) {
            soundElement.textContent = `${Math.round(latestMetric.sound_level)} dB`;
            updateMetricStatus('soundStatus', latestMetric.sound_level, 45, 60, 35, 70);
        }
        
        // Update min, avg, max sound
        updateRangeIndicators('soundMin', 'soundAvg', 'soundMax', metrics, 'sound_level', 'dB');
        
        // Update weight
        const weightElement = document.getElementById('weightCurrentValue');
        if (weightElement && latestMetric.weight) {
            weightElement.textContent = `${latestMetric.weight.toFixed(1)} kg`;
            
            // For weight, higher is generally better (more honey)
            const weightStatus = document.getElementById('weightStatus');
            if (weightStatus) {
                if (latestMetric.weight > 25) {
                    weightStatus.textContent = 'Excellent';
                    weightStatus.className = 'badge bg-success';
                } else if (latestMetric.weight > 20) {
                    weightStatus.textContent = 'Good';
                    weightStatus.className = 'badge bg-primary';
                } else if (latestMetric.weight > 15) {
                    weightStatus.textContent = 'Average';
                    weightStatus.className = 'badge bg-light text-dark';
                } else {
                    weightStatus.textContent = 'Low';
                    weightStatus.className = 'badge bg-warning text-dark';
                }
            }
        }
        
        // Update min, avg, max weight
        updateRangeIndicators('weightMin', 'weightAvg', 'weightMax', metrics, 'weight', 'kg');
    }
}

function updateMetricStatus(statusElementId, value, normalMin, normalMax, cautionMin, cautionMax) {
    const statusElement = document.getElementById(statusElementId);
    if (!statusElement || value === undefined) return;
    
    if (value >= normalMin && value <= normalMax) {
        statusElement.textContent = 'Normal';
        statusElement.className = 'badge bg-success text-white';
    } else if (value >= cautionMin && value <= cautionMax) {
        statusElement.textContent = 'Caution';
        statusElement.className = 'badge bg-warning text-dark';
    } else {
        statusElement.textContent = 'Alert';
        statusElement.className = 'badge bg-danger text-white';
    }
}

function updateRangeIndicators(minElementId, avgElementId, maxElementId, metrics, metricName, unit) {
    // Extract the values for the specified metric
    const values = metrics
        .map(m => m[metricName])
        .filter(val => val !== null && val !== undefined);
    
    if (values.length === 0) return;
    
    // Calculate min, avg, max
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // Format based on the metric type
    let minFormatted, avgFormatted, maxFormatted;
    
    if (metricName === 'temperature' || metricName === 'weight') {
        minFormatted = min.toFixed(1);
        avgFormatted = avg.toFixed(1);
        maxFormatted = max.toFixed(1);
    } else {
        minFormatted = Math.round(min);
        avgFormatted = Math.round(avg);
        maxFormatted = Math.round(max);
    }
    
    // Update the elements
    document.getElementById(minElementId)?.textContent = `Min: ${minFormatted} ${unit}`;
    document.getElementById(avgElementId)?.textContent = `Avg: ${avgFormatted} ${unit}`;
    document.getElementById(maxElementId)?.textContent = `Max: ${maxFormatted} ${unit}`;
}

function updateSensorStatus(metrics) {
    if (!metrics || metrics.length === 0) return;
    
    // Get the most recent metrics
    const latest = metrics[0];
    const timestamp = new Date(latest.timestamp);
    const now = new Date();
    const diffHours = (now - timestamp) / (1000 * 60 * 60);
    
    // Update battery status
    const batteryElement = document.querySelector('td:contains("Battery Status") + td .badge');
    if (batteryElement && latest.battery_level) {
        batteryElement.textContent = `${Math.round(latest.battery_level)}%`;
        
        if (latest.battery_level < 20) {
            batteryElement.className = 'badge bg-danger';
        } else if (latest.battery_level < 40) {
            batteryElement.className = 'badge bg-warning text-dark';
        } else {
            batteryElement.className = 'badge bg-success';
        }
    }
    
    // Update sensor status indicators based on how recent the data is and if values are present
    updateSensorIndicator('Temperature Sensor', latest.temperature !== null, diffHours);
    updateSensorIndicator('Humidity Sensor', latest.humidity !== null, diffHours);
    updateSensorIndicator('Sound Sensor', latest.sound_level !== null, diffHours);
    updateSensorIndicator('Weight Sensor', latest.weight !== null, diffHours);
}

function updateSensorIndicator(sensorName, hasValue, diffHours) {
    // Find the row containing this sensor
    const sensorRow = document.querySelector(`td div:contains("${sensorName}")`).closest('tr');
    if (!sensorRow) return;
    
    const statusIndicator = sensorRow.querySelector('.sensor-status-indicator');
    const statusBadge = sensorRow.querySelector('.badge');
    
    if (!statusIndicator || !statusBadge) return;
    
    // Clear all existing status classes
    statusIndicator.classList.remove('sensor-status-active', 'sensor-status-warning', 'sensor-status-inactive');
    statusBadge.classList.remove('bg-success', 'bg-warning', 'bg-danger');
    
    // Update status based on data recency and presence
    if (!hasValue) {
        // No value at all
        statusIndicator.classList.add('sensor-status-inactive');
        statusBadge.classList.add('bg-danger');
        statusBadge.textContent = 'Inactive';
    } else if (diffHours > 24) {
        // No recent data (more than 24 hours old)
        statusIndicator.classList.add('sensor-status-inactive');
        statusBadge.classList.add('bg-danger');
        statusBadge.textContent = 'Inactive';
    } else if (diffHours > 6) {
        // Data is somewhat old (6-24 hours)
        statusIndicator.classList.add('sensor-status-warning');
        statusBadge.classList.add('bg-warning');
        statusBadge.textContent = 'Intermittent';
    } else {
        // Data is recent (less than 6 hours old)
        statusIndicator.classList.add('sensor-status-active');
        statusBadge.classList.add('bg-success');
        statusBadge.textContent = 'Active';
    }
}

function createTemperatureChart(metrics) {
    const ctx = document.getElementById('temperatureChart');
    if (!ctx) return;
    
    // Process data for chart
    const data = processChartData(metrics, 'temperature');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: data.values,
                borderColor: '#f39c12',
                backgroundColor: 'rgba(243, 156, 18, 0.1)',
                borderWidth: 2,
                pointRadius: 1,
                tension: 0.3,
                fill: true
            }]
        },
        options: getChartOptions('Temperature (°C)')
    });
}

function createHumidityChart(metrics) {
    const ctx = document.getElementById('humidityChart');
    if (!ctx) return;
    
    // Process data for chart
    const data = processChartData(metrics, 'humidity');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Humidity (%)',
                data: data.values,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 2,
                pointRadius: 1,
                tension: 0.3,
                fill: true
            }]
        },
        options: getChartOptions('Humidity (%)')
    });
}

function createSoundChart(metrics) {
    const ctx = document.getElementById('soundChart');
    if (!ctx) return;
    
    // Process data for chart
    const data = processChartData(metrics, 'sound_level');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Sound (dB)',
                data: data.values,
                borderColor: '#9b59b6',
                backgroundColor: 'rgba(155, 89, 182, 0.1)',
                borderWidth: 2,
                pointRadius: 1,
                tension: 0.3,
                fill: true
            }]
        },
        options: getChartOptions('Sound (dB)')
    });
}

function createWeightChart(metrics) {
    const ctx = document.getElementById('weightChart');
    if (!ctx) return;
    
    // Process data for chart
    const data = processChartData(metrics, 'weight');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Weight (kg)',
                data: data.values,
                borderColor: '#f1c40f',
                backgroundColor: 'rgba(241, 196, 15, 0.1)',
                borderWidth: 2,
                pointRadius: 1,
                tension: 0.3,
                fill: true
            }]
        },
        options: getChartOptions('Weight (kg)')
    });
}

function processChartData(metrics, metricName) {
    // Sort by timestamp
    const sortedMetrics = [...metrics].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // For simplicity, we'll use the last 48 data points (or fewer if not available)
    const recentMetrics = sortedMetrics.slice(-48);
    
    // Extract labels (timestamps) and values
    const labels = recentMetrics.map(m => {
        const date = new Date(m.timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
    
    const values = recentMetrics.map(m => m[metricName]);
    
    return { labels, values };
}

function getChartOptions(yAxisLabel) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#333',
                bodyColor: '#333',
                borderColor: '#ddd',
                borderWidth: 1
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                }
            },
            y: {
                title: {
                    display: true,
                    text: yAxisLabel
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                }
            }
        }
    };
}

function updateChartTimePeriod(period) {
    // Update the active button
    document.querySelectorAll('.time-period-btn').forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline-primary');
    });
    
    const activeBtn = document.querySelector(`.time-period-btn[data-period="${period}"]`);
    if (activeBtn) {
        activeBtn.classList.remove('btn-outline-primary');
        activeBtn.classList.add('btn-primary');
    }
    
    // Re-fetch the data with the new time period and update charts
    const hiveId = getHiveIdFromUrl();
    if (hiveId) {
        loadHiveMetricsForPeriod(hiveId, period);
    }
}

async function loadHiveMetricsForPeriod(hiveId, period) {
    try {
        // Calculate date range based on period
        const now = new Date();
        let startDate;
        
        switch (period) {
            case 'day':
                startDate = new Date(now.getTime() - (24 * 60 * 60 * 1000));
                break;
            case 'week':
                startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
                break;
            case 'month':
                startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
                break;
            default:
                startDate = new Date(now.getTime() - (24 * 60 * 60 * 1000)); // Default to day
        }
        
        // Fetch metrics for the specified time period
        const { data: metrics, error } = await supabaseClient
            .from('hive_metrics')
            .select('*')
            .eq('hive_id', hiveId)
            .gte('timestamp', startDate.toISOString())
            .order('timestamp', { ascending: true });
            
        if (error) throw error;
        
        if (!metrics || metrics.length === 0) {
            console.log('No metrics data available for this time period');
            return;
        }
        
        // Update charts with new data
        updateCharts(metrics);
        
    } catch (error) {
        console.error('Error loading metrics for period:', error);
    }
}

function updateCharts(metrics) {
    // Get references to the chart canvases
    const tempChartCanvas = document.getElementById('temperatureChart');
    const humidityChartCanvas = document.getElementById('humidityChart');
    const soundChartCanvas = document.getElementById('soundChart');
    const weightChartCanvas = document.getElementById('weightChart');
    
    // Destroy existing charts if they exist
    const chartInstances = Chart.instances;
    Array.from(chartInstances).forEach(instance => {
        if (['temperatureChart', 'humidityChart', 'soundChart', 'weightChart'].includes(instance.canvas.id)) {
            instance.destroy();
        }
    });
    
    // Create new charts with updated data
    createTemperatureChart(metrics);
    createHumidityChart(metrics);
    createSoundChart(metrics);
    createWeightChart(metrics);
}

async function loadHiveNotes(hiveId) {
    try {
        // Fetch notes for this hive
        const { data: notes, error } = await supabaseClient
            .from('hive_notes')
            .select('*')
            .eq('hive_id', hiveId)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        const notesContainer = document.getElementById('notesContainer');
        if (!notesContainer) return;
        
        if (!notes || notes.length === 0) {
            notesContainer.innerHTML = '<div class="text-center my-3 text-muted">No notes yet. Add your first note!</div>';
            return;
        }
        
        // Clear the container first
        notesContainer.innerHTML = '';
        
        // Add each note to the container
        notes.forEach((note, index) => {
            const noteElement = document.createElement('div');
            noteElement.className = index < notes.length - 1 ? 'mb-3 pb-3 border-bottom' : '';
            
            noteElement.innerHTML = `
                <p class="mb-1">${note.note_content}</p>
                <small class="text-muted">Added on ${new Date(note.created_at).toLocaleDateString()}</small>
            `;
            
            notesContainer.appendChild(noteElement);
        });
        
    } catch (error) {
        console.error('Error loading hive notes:', error);
    }
}

async function loadHiveActivityLog(hiveId) {
    try {
        // Fetch activity log for this hive
        const { data: activities, error } = await supabaseClient
            .from('hive_activity')
            .select('*')
            .eq('hive_id', hiveId)
            .order('activity_date', { ascending: false })
            .limit(10);
            
        if (error) throw error;
        
        const activityContainer = document.getElementById('activityLogContainer');
        if (!activityContainer) return;
        
        if (!activities || activities.length === 0) {
            activityContainer.innerHTML = '<div class="text-center my-3 text-muted">No activity recorded yet.</div>';
            return;
        }
        
        // Clear the container first
        activityContainer.innerHTML = '';
        
        // Add timeline container
        const timelineContainer = document.createElement('div');
        timelineContainer.className = 'timeline-container';
        activityContainer.appendChild(timelineContainer);
        
        // Add each activity to the timeline
        activities.forEach(activity => {
            const activityElement = document.createElement('div');
            activityElement.className = 'timeline-item';
            
            activityElement.innerHTML = `
                <div class="d-flex justify-content-between mb-1">
                    <span class="fw-bold">${activity.activity_type}</span>
                    <small class="text-muted">${new Date(activity.activity_date).toLocaleDateString()}</small>
                </div>
                <p class="mb-0 small">${activity.description}</p>
            `;
            
            timelineContainer.appendChild(activityElement);
        });
        
    } catch (error) {
        console.error('Error loading hive activity log:', error);
    }
}

function showAddNoteModal() {
    const addNoteModal = new bootstrap.Modal(document.getElementById('addNoteModal'));
    addNoteModal.show();
}

async function addNote() {
    const noteContent = document.getElementById('noteContent').value.trim();
    if (!noteContent) {
        alert('Please enter a note');
        return;
    }
    
    const hiveId = getHiveIdFromUrl();
    if (!hiveId) {
        alert('Hive ID not found');
        return;
    }
    
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }
        
        // Add note to database
        const { data, error } = await supabaseClient
            .from('hive_notes')
            .insert([
                {
                    hive_id: hiveId,
                    user_id: user.id,
                    note_content: noteContent,
                    created_at: new Date().toISOString()
                }
            ]);
            
        if (error) throw error;
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addNoteModal'));
        modal.hide();
        
        // Clear form
        document.getElementById('noteContent').value = '';
        
        // Reload notes to show the new one
        await loadHiveNotes(hiveId);
        
        // Also add to activity log
        await addActivity(hiveId, 'Note Added', `Added a new note: "${noteContent.substring(0, 30)}${noteContent.length > 30 ? '...' : ''}"`);
        
    } catch (error) {
        console.error('Error adding note:', error);
        alert('Failed to add note: ' + error.message);
    }
}

async function addActivity(hiveId, activityType, description) {
    try {
        const user = await getCurrentUser();
        if (!user) return;
        
        const { error } = await supabaseClient
            .from('hive_activity')
            .insert([
                {
                    hive_id: hiveId,
                    user_id: user.id,
                    activity_type: activityType,
                    description: description,
                    activity_date: new Date().toISOString()
                }
            ]);
            
        if (error) throw error;
        
        // Reload activity log
        await loadHiveActivityLog(hiveId);
        
    } catch (error) {
        console.error('Error adding activity:', error);
    }
}

function editHive(hiveId) {
    // Redirect to hive edit page
    window.location.href = `edit-hive.html?id=${hiveId}`;
}

// Function to delete a hive (with confirmation)
function deleteHive(hiveId) {
    if (!confirm('Are you sure you want to delete this hive? This action cannot be undone.')) {
        return;
    }

    try {
        // Show loading state
        const deleteBtn = document.getElementById('deleteHiveBtn');
        if (deleteBtn) {
            deleteBtn.disabled = true;
            deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deleting...';
        }

        // Delete the hive from the database
        supabaseClient
            .from('hive_details')
            .delete()
            .eq('id', hiveId)
            .then(async ({ error }) => {
                if (error) throw error;
                
                // Get the apiary ID to redirect back to
                const { data: hive, error: hiveError } = await supabaseClient
                    .from('hive_details')
                    .select('apiary_id')
                    .eq('id', hiveId)
                    .single();
                
                // Show success message
                alert('Hive deleted successfully');
                
                // Redirect to the apiary details page or dashboard
                if (hive && hive.apiary_id) {
                    window.location.href = `apiary-details.html?id=${hive.apiary_id}`;
                } else {
                    window.location.href = 'manage-my-bees.html';
                }
            })
            .catch(error => {
                console.error('Error deleting hive:', error);
                alert('Failed to delete hive: ' + error.message);
                
                // Reset button state
                if (deleteBtn) {
                    deleteBtn.disabled = false;
                    deleteBtn.innerHTML = 'Delete Hive';
                }
            });
    } catch (error) {
        console.error('Error in delete hive function:', error);
        alert('An error occurred while trying to delete the hive');
    }
}

// Function to update the hive's health status
async function updateHiveHealth(hiveId, newStatus) {
    try {
        const { error } = await supabaseClient
            .from('hive_details')
            .update({ 
                health_status: newStatus,
                last_updated: new Date().toISOString()
            })
            .eq('id', hiveId);
            
        if (error) throw error;
        
        // Update the UI without reloading
        updateHealthStatus(newStatus);
        
        // Add to activity log
        await addActivity(hiveId, 'Health Status Updated', `Health status changed to ${newStatus}`);
        
        // Show success message
        showToast('Health status updated successfully', 'success');
        
    } catch (error) {
        console.error('Error updating hive health:', error);
        showToast('Failed to update health status: ' + error.message, 'error');
    }
}

// Function to show a toast notification
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center ${type === 'error' ? 'text-bg-danger' : type === 'success' ? 'text-bg-success' : 'text-bg-primary'}`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    
    // Create toast content
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    // Add to container
    toastContainer.appendChild(toastEl);
    
    // Initialize and show the toast
    const toast = new bootstrap.Toast(toastEl, { autohide: true, delay: 3000 });
    toast.show();
    
    // Remove from DOM after hiding
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
}

// Function to add inspection record
async function addInspection(hiveId) {
    // Get form data
    const inspectionDate = document.getElementById('inspectionDate').value;
    const inspectionType = document.getElementById('inspectionType').value;
    const queenSighted = document.getElementById('queenSighted').checked;
    const broodPattern = document.getElementById('broodPattern').value;
    const hiveStrength = document.getElementById('hiveStrength').value;
    const pestsSighted = document.getElementById('pestsSighted').value;
    const diseasesSighted = document.getElementById('diseasesSighted').value;
    const honeyStores = document.getElementById('honeyStores').value;
    const inspectionNotes = document.getElementById('inspectionNotes').value;
    const healthStatus = document.getElementById('newHealthStatus').value;
    
    if (!inspectionDate || !inspectionType) {
        alert('Please fill in the required fields');
        return;
    }
    
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('User not authenticated');
        
        // Add inspection record to database
        const { data, error } = await supabaseClient
            .from('hive_inspections')
            .insert([
                {
                    hive_id: hiveId,
                    user_id: user.id,
                    inspection_date: inspectionDate,
                    inspection_type: inspectionType,
                    queen_sighted: queenSighted,
                    brood_pattern: broodPattern,
                    hive_strength: hiveStrength,
                    pests_sighted: pestsSighted,
                    diseases_sighted: diseasesSighted,
                    honey_stores: honeyStores,
                    notes: inspectionNotes,
                    created_at: new Date().toISOString()
                }
            ]);
            
        if (error) throw error;
        
        // Update hive's last inspection date and health status
        const { error: updateError } = await supabaseClient
            .from('hive_details')
            .update({ 
                last_inspection: inspectionDate,
                health_status: healthStatus,
                last_updated: new Date().toISOString()
            })
            .eq('id', hiveId);
            
        if (updateError) throw updateError;
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addInspectionModal'));
        modal.hide();
        
        // Clear form
        document.getElementById('addInspectionForm').reset();
        
        // Add to activity log
        await addActivity(hiveId, 'Inspection Completed', `Inspection of type ${inspectionType} completed`);
        
        // Update UI
        document.getElementById('lastInspection').textContent = new Date(inspectionDate).toLocaleDateString();
        updateHealthStatus(healthStatus);
        
        // Show success message
        showToast('Inspection added successfully', 'success');
        
        // Reload activity log
        await loadHiveActivityLog(hiveId);
        
    } catch (error) {
        console.error('Error adding inspection:', error);
        showToast('Failed to add inspection: ' + error.message, 'error');
    }
}

// Function to show add inspection modal
function showAddInspectionModal() {
    // Set today's date as the default inspection date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('inspectionDate').value = today;
    
    // Show the modal
    const addInspectionModal = new bootstrap.Modal(document.getElementById('addInspectionModal'));
    addInspectionModal.show();
}

// Function to load inspection history
async function loadInspectionHistory(hiveId) {
    try {
        // Fetch inspection records for this hive
        const { data: inspections, error } = await supabaseClient
            .from('hive_inspections')
            .select('*')
            .eq('hive_id', hiveId)
            .order('inspection_date', { ascending: false });
            
        if (error) throw error;
        
        const inspectionContainer = document.getElementById('inspectionHistoryContainer');
        if (!inspectionContainer) return;
        
        if (!inspections || inspections.length === 0) {
            inspectionContainer.innerHTML = '<div class="text-center my-3 text-muted">No inspection records yet.</div>';
            return;
        }
        
        // Clear the container first
        inspectionContainer.innerHTML = '';
        
        // Add each inspection to the container
        inspections.forEach((inspection, index) => {
            const inspectionCard = document.createElement('div');
            inspectionCard.className = 'card mb-3';
            
            const formattedDate = new Date(inspection.inspection_date).toLocaleDateString();
            
            inspectionCard.innerHTML = `
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">
                        <i class="fas fa-clipboard-check me-2"></i>
                        ${inspection.inspection_type} - ${formattedDate}
                    </h5>
                    <button type="button" class="btn btn-sm btn-outline-primary view-details-btn" data-inspection-id="${inspection.id}">
                        View Details
                    </button>
                </div>
                <div class="card-body inspection-details-${inspection.id}" style="display: none;">
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>Queen Sighted:</strong> ${inspection.queen_sighted ? 'Yes' : 'No'}</p>
                            <p><strong>Brood Pattern:</strong> ${inspection.brood_pattern || 'Not recorded'}</p>
                            <p><strong>Hive Strength:</strong> ${inspection.hive_strength || 'Not recorded'}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Pests Sighted:</strong> ${inspection.pests_sighted || 'None'}</p>
                            <p><strong>Diseases Sighted:</strong> ${inspection.diseases_sighted || 'None'}</p>
                            <p><strong>Honey Stores:</strong> ${inspection.honey_stores || 'Not recorded'}</p>
                        </div>
                    </div>
                    ${inspection.notes ? `<div class="mt-3"><strong>Notes:</strong><br>${inspection.notes}</div>` : ''}
                </div>
            `;
            
            inspectionContainer.appendChild(inspectionCard);
            
            // Add event listener to toggle details
            const viewDetailsBtn = inspectionCard.querySelector(`.view-details-btn[data-inspection-id="${inspection.id}"]`);
            viewDetailsBtn.addEventListener('click', function() {
                const detailsSection = document.querySelector(`.inspection-details-${inspection.id}`);
                if (detailsSection.style.display === 'none') {
                    detailsSection.style.display = 'block';
                    this.textContent = 'Hide Details';
                } else {
                    detailsSection.style.display = 'none';
                    this.textContent = 'View Details';
                }
            });
        });
        
    } catch (error) {
        console.error('Error loading inspection history:', error);
    }
}

// Function to track hive equipment
async function loadHiveEquipment(hiveId) {
    try {
        // Fetch equipment for this hive
        const { data: equipment, error } = await supabaseClient
            .from('hive_equipment')
            .select('*')
            .eq('hive_id', hiveId)
            .order('added_date', { ascending: false });
            
        if (error) throw error;
        
        const equipmentContainer = document.getElementById('equipmentContainer');
        if (!equipmentContainer) return;
        
        if (!equipment || equipment.length === 0) {
            equipmentContainer.innerHTML = '<div class="text-center my-3 text-muted">No equipment recorded for this hive.</div>';
            return;
        }
        
        // Clear the container first
        equipmentContainer.innerHTML = '';
        
        // Create a table for equipment
        const table = document.createElement('table');
        table.className = 'table table-hover';
        
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Equipment Type</th>
                    <th>Date Added</th>
                    <th>Condition</th>
                    <th>Notes</th>
                </tr>
            </thead>
            <tbody id="equipmentTableBody"></tbody>
        `;
        
        equipmentContainer.appendChild(table);
        
        const tableBody = document.getElementById('equipmentTableBody');
        
        // Add each equipment item to the table
        equipment.forEach(item => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${item.equipment_type}</td>
                <td>${new Date(item.added_date).toLocaleDateString()}</td>
                <td>
                    <span class="badge ${item.condition === 'Good' ? 'bg-success' : 
                                        item.condition === 'Fair' ? 'bg-warning text-dark' : 
                                        'bg-danger'}">
                        ${item.condition}
                    </span>
                </td>
                <td>${item.notes || '-'}</td>
            `;
            
            tableBody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading hive equipment:', error);
    }
}

// Function to add equipment to hive
async function addEquipment(hiveId) {
    // Get form data
    const equipmentType = document.getElementById('equipmentType').value;
    const addedDate = document.getElementById('equipmentDate').value;
    const condition = document.getElementById('equipmentCondition').value;
    const notes = document.getElementById('equipmentNotes').value;
    
    if (!equipmentType || !addedDate || !condition) {
        alert('Please fill in the required fields');
        return;
    }
    
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('User not authenticated');
        
        // Add equipment record to database
        const { error } = await supabaseClient
            .from('hive_equipment')
            .insert([
                {
                    hive_id: hiveId,
                    user_id: user.id,
                    equipment_type: equipmentType,
                    added_date: addedDate,
                    condition: condition,
                    notes: notes
                }
            ]);
            
        if (error) throw error;
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addEquipmentModal'));
        modal.hide();
        
        // Clear form
        document.getElementById('addEquipmentForm').reset();
        
        // Add to activity log
        await addActivity(hiveId, 'Equipment Added', `Added ${equipmentType} to hive`);
        
        // Reload equipment list
        await loadHiveEquipment(hiveId);
        
        // Show success message
        showToast('Equipment added successfully', 'success');
        
    } catch (error) {
        console.error('Error adding equipment:', error);
        showToast('Failed to add equipment: ' + error.message, 'error');
    }
}

// Function to show add equipment modal
function showAddEquipmentModal() {
    // Set today's date as the default date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('equipmentDate').value = today;
    
    // Show the modal
    const addEquipmentModal = new bootstrap.Modal(document.getElementById('addEquipmentModal'));
    addEquipmentModal.show();
}

// Function to export hive data as CSV
function exportHiveData(hiveId, hiveName) {
    showToast('Preparing data for export...', 'info');
    
    Promise.all([
        // Get hive details
        supabaseClient.from('hive_details').select('*').eq('id', hiveId).single(),
        // Get metrics
        supabaseClient.from('hive_metrics').select('*').eq('hive_id', hiveId).order('timestamp', { ascending: true }),
        // Get inspections
        supabaseClient.from('hive_inspections').select('*').eq('hive_id', hiveId).order('inspection_date', { ascending: true }),
        // Get notes
        supabaseClient.from('hive_notes').select('*').eq('hive_id', hiveId).order('created_at', { ascending: true })
    ])
    .then(([hiveRes, metricsRes, inspectionsRes, notesRes]) => {
        if (hiveRes.error) throw hiveRes.error;
        if (metricsRes.error) throw metricsRes.error;
        if (inspectionsRes.error) throw inspectionsRes.error;
        if (notesRes.error) throw notesRes.error;
        
        const hive = hiveRes.data;
        const metrics = metricsRes.data || [];
        const inspections = inspectionsRes.data || [];
        const notes = notesRes.data || [];
        
        // Create CSV content for metrics
        let metricsCSV = 'Timestamp,Temperature (°C),Humidity (%),Sound (dB),Weight (kg),Battery Level (%)\n';
        metrics.forEach(m => {
            metricsCSV += `${m.timestamp},${m.temperature || ''},${m.humidity || ''},${m.sound_level || ''},${m.weight || ''},${m.battery_level || ''}\n`;
        });
        
        // Create CSV content for inspections
        let inspectionsCSV = 'Date,Type,Queen Sighted,Brood Pattern,Hive Strength,Pests,Diseases,Honey Stores,Notes\n';
        inspections.forEach(i => {
            inspectionsCSV += `${i.inspection_date},${i.inspection_type || ''},${i.queen_sighted ? 'Yes' : 'No'},${i.brood_pattern || ''},${i.hive_strength || ''},${i.pests_sighted || ''},${i.diseases_sighted || ''},${i.honey_stores || ''},"${(i.notes || '').replace(/"/g, '""')}"\n`;
        });
        
        // Create CSV content for notes
        let notesCSV = 'Date,Note\n';
        notes.forEach(n => {
            notesCSV += `${n.created_at},"${(n.note_content || '').replace(/"/g, '""')}"\n`;
        });
        
        // Create a ZIP file containing all CSVs
        const zip = new JSZip();
        zip.file(`${hiveName}-metrics.csv`, metricsCSV);
        zip.file(`${hiveName}-inspections.csv`, inspectionsCSV);
        zip.file(`${hiveName}-notes.csv`, notesCSV);
        
        // Generate the ZIP file
        zip.generateAsync({ type: 'blob' })
            .then(content => {
                // Create download link
                const downloadLink = document.createElement('a');
                downloadLink.href = URL.createObjectURL(content);
                downloadLink.download = `${hiveName}-export.zip`;
                document.body.appendChild(downloadLink);
                
                // Trigger download
                downloadLink.click();
                
                // Clean up
                document.body.removeChild(downloadLink);
                showToast('Data exported successfully', 'success');
            });
    })
    .catch(error => {
        console.error('Error exporting hive data:', error);
        showToast('Failed to export data: ' + error.message, 'error');
    });
} 