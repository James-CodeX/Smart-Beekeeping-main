// JavaScript for alerts.html

document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    loadAlerts();
    setupFilterListeners();
});

function loadAlerts() {
    const alertsList = document.getElementById('alertsList');
    const noAlerts = document.getElementById('noAlerts');
    const totalUnreadAlerts = document.getElementById('totalUnreadAlerts');
    const totalAlerts = document.getElementById('totalAlerts');

    // Get current filter values
    const filters = {
        type: document.getElementById('alertTypeFilter').value,
        severity: document.getElementById('severityFilter').value,
        date: document.getElementById('dateFilter').value,
        status: document.getElementById('statusFilter').value
    };

    // Get filtered alerts
    const alerts = alertsManager.filterAlerts(filters);
    const allAlerts = alertsManager.getAllAlerts();
    const unreadCount = alertsManager.getUnreadCount();

    // Update counters
    totalUnreadAlerts.textContent = `${unreadCount} Unread`;
    totalAlerts.textContent = `${allAlerts.length} Total`;

    if (!alerts || alerts.length === 0) {
        alertsList.innerHTML = '';
        noAlerts.style.display = 'block';
        return;
    }

    noAlerts.style.display = 'none';
    alertsList.innerHTML = alerts.map(alert => createAlertHTML(alert)).join('');
}

function createAlertHTML(alert) {
    const icon = alert.metric === 'temperature' ? 'fa-thermometer-high' : 
                alert.metric === 'humidity' ? 'fa-tint' :
                alert.metric === 'weight' ? 'fa-weight' : 'fa-volume-up';
    
    return `
        <div class="alert alert-${alert.type} d-flex align-items-center ${alert.read ? 'opacity-75' : ''}" role="alert">
            <div class="me-3">
                <div class="bg-${alert.type} icon-circle">
                    <i class="fas ${icon} text-white"></i>
                </div>
            </div>
            <div class="flex-grow-1">
                <div class="d-flex justify-content-between align-items-center">
                    <small class="text-muted">${new Date(alert.created_at).toLocaleString()}</small>
                    <div>
                        ${!alert.read ? `
                            <button class="btn btn-sm btn-outline-secondary me-1" onclick="markAsRead('${alert.id}')">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteAlert('${alert.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <p class="mb-0 mt-1">${alert.message}</p>
            </div>
        </div>
    `;
}

function setupFilterListeners() {
    const filters = ['alertType', 'severity', 'date', 'status'];
    filters.forEach(filter => {
        document.getElementById(`${filter}Filter`).addEventListener('change', loadAlerts);
    });
}

function markAsRead(alertId) {
    alertsManager.markAlertAsRead(alertId);
    loadAlerts();
}

function markAllAsRead() {
    alertsManager.markAllAlertsAsRead();
    loadAlerts();
}

function deleteAlert(alertId) {
    if (!confirm('Are you sure you want to delete this alert?')) return;
    alertsManager.deleteAlert(alertId);
    loadAlerts();
}

function clearAllAlerts() {
    if (!confirm('Are you sure you want to clear all alerts? This cannot be undone.')) return;
    alertsManager.clearAllAlerts();
    loadAlerts();
}

async function handleLogout() {
    await logout();
} 