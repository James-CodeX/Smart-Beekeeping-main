// JavaScript for messages.html

document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    loadMessages();
    setupFilterListeners();
});

function loadMessages() {
    const messagesList = document.getElementById('messagesList');
    const noMessages = document.getElementById('noMessages');

    // Get current filter values
    const filters = {
        type: document.getElementById('messageTypeFilter').value,
        priority: document.getElementById('priorityFilter').value,
        date: document.getElementById('dateFilter').value,
        status: document.getElementById('statusFilter').value
    };

    // Get filtered messages
    const messages = messagesManager.filterMessages(filters);

    if (!messages || messages.length === 0) {
        messagesList.innerHTML = '';
        noMessages.style.display = 'block';
        return;
    }

    noMessages.style.display = 'none';
    messagesList.innerHTML = messages.map(message => createMessageHTML(message)).join('');
}

function createMessageHTML(message) {
    const priorityClass = message.priority === 'high' ? 'danger' : 
                        message.priority === 'medium' ? 'warning' : 'info';
    const icon = message.type === 'system' ? 'fa-cog' :
                message.type === 'notification' ? 'fa-bell' : 'fa-sync';
    
    return `
        <div class="card mb-3 ${message.read ? 'bg-light' : ''}">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <div class="bg-${priorityClass} icon-circle me-3">
                            <i class="fas ${icon} text-white"></i>
                        </div>
                        <div>
                            <h5 class="mb-1">${message.title}</h5>
                            <small class="text-muted">${new Date(message.created_at).toLocaleString()}</small>
                        </div>
                    </div>
                    <div>
                        ${!message.read ? `
                            <button class="btn btn-sm btn-outline-secondary me-1" onclick="markAsRead('${message.id}')">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteMessage('${message.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <p class="mt-2 mb-0">${message.content}</p>
            </div>
        </div>
    `;
}

function setupFilterListeners() {
    const filters = ['messageType', 'priority', 'date', 'status'];
    filters.forEach(filter => {
        document.getElementById(`${filter}Filter`).addEventListener('change', loadMessages);
    });
}

function markAsRead(messageId) {
    messagesManager.markMessageAsRead(messageId);
    loadMessages();
}

function markAllAsRead() {
    messagesManager.markAllMessagesAsRead();
    loadMessages();
}

function deleteMessage(messageId) {
    if (!confirm('Are you sure you want to delete this message?')) return;
    messagesManager.deleteMessage(messageId);
    loadMessages();
}

function clearAllMessages() {
    if (!confirm('Are you sure you want to clear all messages? This cannot be undone.')) return;
    messagesManager.clearAllMessages();
    loadMessages();
}

async function handleLogout() {
    await logout();
} 