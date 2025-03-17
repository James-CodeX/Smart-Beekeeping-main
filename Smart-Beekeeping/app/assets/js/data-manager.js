// Constants for local storage keys
const ALERTS_KEY = 'smart_nyuki_alerts';
const MESSAGES_KEY = 'smart_nyuki_messages';
const ALERT_COOLDOWNS_KEY = 'smart_nyuki_alert_cooldowns';

// Initialize local storage if not exists
function initializeStorage() {
    if (!localStorage.getItem(ALERTS_KEY)) {
        localStorage.setItem(ALERTS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(MESSAGES_KEY)) {
        localStorage.setItem(MESSAGES_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(ALERT_COOLDOWNS_KEY)) {
        localStorage.setItem(ALERT_COOLDOWNS_KEY, JSON.stringify({}));
    }
}

// Initialize storage on load
initializeStorage();

// Alerts Manager
const alertsManager = {
    getAllAlerts() {
        return JSON.parse(localStorage.getItem(ALERTS_KEY) || '[]');
    },

    getLatestAlerts(limit = 3) {
        const alerts = this.getAllAlerts();
        return alerts.slice(0, limit);
    },

    getUnreadCount() {
        return this.getAllAlerts().filter(alert => !alert.read).length;
    },

    canAddAlert(metric) {
        const cooldowns = JSON.parse(localStorage.getItem(ALERT_COOLDOWNS_KEY) || '{}');
        const lastAlert = cooldowns[metric];
        
        if (!lastAlert) return true;

        // Check if 3 hours have passed since the last alert
        const threeHoursAgo = new Date(Date.now() - (3 * 60 * 60 * 1000));
        return new Date(lastAlert) < threeHoursAgo;
    },

    updateAlertCooldown(metric) {
        const cooldowns = JSON.parse(localStorage.getItem(ALERT_COOLDOWNS_KEY) || '{}');
        cooldowns[metric] = new Date().toISOString();
        localStorage.setItem(ALERT_COOLDOWNS_KEY, JSON.stringify(cooldowns));
    },

    addAlert(alert) {
        // Check cooldown for temperature and humidity alerts
        if (alert.metric === 'temperature' || alert.metric === 'humidity') {
            if (!this.canAddAlert(alert.metric)) {
                console.log(`Alert for ${alert.metric} is in cooldown`);
                return null;
            }
            this.updateAlertCooldown(alert.metric);
        }

        // Check for existing similar alerts to prevent repopulation
        const alerts = this.getAllAlerts();
        const similarAlert = alerts.find(a => 
            a.metric === alert.metric && 
            a.type === alert.type && 
            a.message === alert.message &&
            // Check if the existing alert is less than 3 hours old
            (new Date() - new Date(a.created_at)) < (3 * 60 * 60 * 1000)
        );

        if (similarAlert) {
            console.log('Similar alert already exists');
            return null;
        }

        const newAlert = {
            id: Date.now().toString(),
            created_at: new Date().toISOString(),
            read: false,
            ...alert
        };
        alerts.unshift(newAlert);

        // Keep only the latest 50 alerts to prevent excessive storage
        const trimmedAlerts = alerts.slice(0, 50);
        localStorage.setItem(ALERTS_KEY, JSON.stringify(trimmedAlerts));
        return newAlert;
    },

    filterAlerts(filters) {
        let alerts = this.getAllAlerts();

        if (filters.type && filters.type !== 'all') {
            alerts = alerts.filter(alert => alert.metric === filters.type);
        }

        if (filters.severity && filters.severity !== 'all') {
            alerts = alerts.filter(alert => alert.type === filters.severity);
        }

        if (filters.status && filters.status !== 'all') {
            const isRead = filters.status === 'read';
            alerts = alerts.filter(alert => alert.read === isRead);
        }

        if (filters.date && filters.date !== 'all') {
            const now = new Date();
            alerts = alerts.filter(alert => {
                const alertDate = new Date(alert.created_at);
                switch (filters.date) {
                    case '24h':
                        return (now - alertDate) <= 24 * 60 * 60 * 1000;
                    case '7d':
                        return (now - alertDate) <= 7 * 24 * 60 * 60 * 1000;
                    case '30d':
                        return (now - alertDate) <= 30 * 24 * 60 * 60 * 1000;
                    default:
                        return true;
                }
            });
        }

        return alerts;
    },

    markAlertAsRead(alertId) {
        const alerts = this.getAllAlerts();
        const updatedAlerts = alerts.map(alert => 
            alert.id === alertId ? { ...alert, read: true } : alert
        );
        localStorage.setItem(ALERTS_KEY, JSON.stringify(updatedAlerts));
    },

    markAllAlertsAsRead() {
        const alerts = this.getAllAlerts();
        const updatedAlerts = alerts.map(alert => ({ ...alert, read: true }));
        localStorage.setItem(ALERTS_KEY, JSON.stringify(updatedAlerts));
    },

    deleteAlert(alertId) {
        const alerts = this.getAllAlerts();
        const updatedAlerts = alerts.filter(alert => alert.id !== alertId);
        localStorage.setItem(ALERTS_KEY, JSON.stringify(updatedAlerts));
    },

    clearAllAlerts() {
        localStorage.setItem(ALERTS_KEY, JSON.stringify([]));
    }
};

// Messages Manager
const messagesManager = {
    getAllMessages() {
        return JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
    },

    getLatestMessages(limit = 3) {
        const messages = this.getAllMessages();
        return messages.slice(0, limit);
    },

    getUnreadCount() {
        return this.getAllMessages().filter(message => !message.read).length;
    },

    addMessage(message) {
        const messages = this.getAllMessages();
        const newMessage = {
            id: Date.now().toString(),
            created_at: new Date().toISOString(),
            read: false,
            ...message
        };
        messages.unshift(newMessage);
        localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
        return newMessage;
    },

    filterMessages(filters) {
        let messages = this.getAllMessages();

        if (filters.type !== 'all') {
            messages = messages.filter(message => message.type === filters.type);
        }

        if (filters.priority !== 'all') {
            messages = messages.filter(message => message.priority === filters.priority);
        }

        if (filters.status !== 'all') {
            messages = messages.filter(message => 
                filters.status === 'read' ? message.read : !message.read
            );
        }

        if (filters.date !== 'all') {
            const now = new Date();
            messages = messages.filter(message => {
                const messageTime = new Date(message.created_at);
                switch (filters.date) {
                    case 'today':
                        return messageTime.toDateString() === now.toDateString();
                    case 'week':
                        const weekAgo = new Date(now.setDate(now.getDate() - 7));
                        return messageTime >= weekAgo;
                    case 'month':
                        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
                        return messageTime >= monthAgo;
                    default:
                        return true;
                }
            });
        }

        return messages;
    },

    markMessageAsRead(messageId) {
        const messages = this.getAllMessages();
        const updatedMessages = messages.map(message => 
            message.id === messageId ? { ...message, read: true } : message
        );
        localStorage.setItem(MESSAGES_KEY, JSON.stringify(updatedMessages));
    },

    markAllMessagesAsRead() {
        const messages = this.getAllMessages();
        const updatedMessages = messages.map(message => ({ ...message, read: true }));
        localStorage.setItem(MESSAGES_KEY, JSON.stringify(updatedMessages));
    },

    deleteMessage(messageId) {
        const messages = this.getAllMessages();
        const updatedMessages = messages.filter(message => message.id !== messageId);
        localStorage.setItem(MESSAGES_KEY, JSON.stringify(updatedMessages));
    },

    clearAllMessages() {
        localStorage.setItem(MESSAGES_KEY, JSON.stringify([]));
    }
};

// Export managers for use in other files
window.alertsManager = alertsManager;
window.messagesManager = messagesManager;

// Add some sample data
function addSampleData() {
    const alerts = alertsManager.getAllAlerts();
    const messages = messagesManager.getAllMessages();

    // Only add sample data if there are no existing alerts and messages
    if (alerts.length === 0) {
        alertsManager.addAlert({
            type: 'warning',
            metric: 'temperature',
            message: 'Temperature is below optimal range',
            severity: 'medium'
        });
        alertsManager.addAlert({
            type: 'danger',
            metric: 'humidity',
            message: 'Humidity levels are critically high',
            severity: 'high'
        });
    }

    if (messages.length === 0) {
        messagesManager.addMessage({
            type: 'system',
            title: 'System Update',
            content: 'System maintenance scheduled for tonight',
            priority: 'high'
        });
        messagesManager.addMessage({
            type: 'notification',
            title: 'Hive Status Update',
            content: 'Your hive is performing well',
            priority: 'medium'
        });
        messagesManager.addMessage({
            type: 'update',
            title: 'New Feature Available',
            content: 'Check out our new hive monitoring features',
            priority: 'low'
        });
    }
}

// Initialize sample data
addSampleData();

function updateAlertsDropdown() {
    const alertsDropdown = document.getElementById('alertsDropdown');
    if (!alertsDropdown) return;

    // Get only the 3 most recent alerts
    const alerts = alertsManager.getLatestAlerts(3);
    const alertsCount = alertsManager.getUnreadCount();
    
    // Update the alerts count badge
    const alertsCountElement = document.getElementById('alertsCount');
    if (alertsCountElement) {
        alertsCountElement.textContent = alertsCount > 0 ? alertsCount : '';
    }

    const alertsHtml = alerts.map(alert => `
        <a class="dropdown-item d-flex align-items-center" href="alerts.html">
            <div class="me-3">
                <div class="bg-${alert.type} icon-circle">
                    <i class="fas ${getAlertIcon(alert.metric)} text-white"></i>
                </div>
            </div>
            <div>
                <div class="small text-gray-500">${new Date(alert.created_at).toLocaleString()}</div>
                <p class="mb-0">${alert.message}</p>
            </div>
        </a>
    `).join('');

    // Add "Show All" link if there are more than 3 alerts
    const allAlerts = alertsManager.getAllAlerts();
    const dropdownContent = `
        ${alertsHtml || '<div class="dropdown-item text-center">No alerts</div>'}
        ${allAlerts.length > 3 ? `
            <div class="dropdown-divider"></div>
            <a class="dropdown-item text-center small text-gray-500" href="alerts.html">Show All Alerts</a>
        ` : ''}
    `;
    
    alertsDropdown.innerHTML = dropdownContent;
}

function getAlertIcon(metric) {
    switch (metric) {
        case 'temperature':
            return 'fa-thermometer-high';
        case 'humidity':
            return 'fa-tint';
        case 'weight':
            return 'fa-weight';
        case 'sound':
            return 'fa-volume-up';
        default:
            return 'fa-exclamation-circle';
    }
}

function updateMessagesDropdown() {
    const messages = messagesManager.getLatestMessages(3);
    const messagesCount = messagesManager.getUnreadCount();
    
    // Show total unread count
    document.getElementById('messagesCount').textContent = messagesCount > 0 ? messagesCount : '';
    
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