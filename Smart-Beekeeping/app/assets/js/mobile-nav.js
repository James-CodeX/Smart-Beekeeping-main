// Mobile Navigation Script
document.addEventListener('DOMContentLoaded', function() {
    console.log('Mobile nav script loaded, window width:', window.innerWidth);
    
    // Only proceed if we're on a mobile device
    if (window.innerWidth <= 767.98) {
        console.log('Mobile width detected, adding mobile navigation');
        
        // Get the current page to highlight the active item
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        console.log('Current page:', currentPage);
        
        // Create mobile navigation HTML
        const mobileNavHTML = `
        <nav class="mobile-nav">
            <ul class="mobile-nav-items">
                <li>
                    <a href="index.html" class="mobile-nav-item ${currentPage === 'index.html' ? 'active' : ''}">
                        <i class="fas fa-home mobile-nav-icon"></i>
                        <span class="mobile-nav-text">Home</span>
                    </a>
                </li>
                <li>
                    <a href="manage-my-bees.html" class="mobile-nav-item ${currentPage === 'manage-my-bees.html' ? 'active' : ''}">
                        <i class="fas fa-bug mobile-nav-icon"></i>
                        <span class="mobile-nav-text">My Bees</span>
                    </a>
                </li>
                <li>
                    <a href="alerts.html" class="mobile-nav-item ${currentPage === 'alerts.html' ? 'active' : ''}">
                        <i class="fas fa-bell mobile-nav-icon"></i>
                        <span class="mobile-nav-text">Alerts</span>
                        <span class="badge bg-danger mobile-nav-badge" id="mobileAlertsCount"></span>
                    </a>
                </li>
                <li>
                    <a href="messages.html" class="mobile-nav-item ${currentPage === 'messages.html' ? 'active' : ''}">
                        <i class="fas fa-envelope mobile-nav-icon"></i>
                        <span class="mobile-nav-text">Messages</span>
                        <span class="badge bg-danger mobile-nav-badge" id="mobileMessagesCount"></span>
                    </a>
                </li>
                <li>
                    <a href="profile.html" class="mobile-nav-item ${currentPage === 'profile.html' ? 'active' : ''}">
                        <i class="fas fa-user mobile-nav-icon"></i>
                        <span class="mobile-nav-text">Profile</span>
                    </a>
                </li>
            </ul>
        </nav>`;
        
        // Insert navigation at the end of wrapper
        const wrapper = document.getElementById('wrapper');
        console.log('Wrapper element found:', wrapper ? 'Yes' : 'No');
        
        if (wrapper) {
            wrapper.insertAdjacentHTML('beforeend', mobileNavHTML);
            console.log('Mobile navigation inserted');
            
            // Add padding to content wrapper to make room for nav
            const contentWrapper = document.getElementById('content-wrapper');
            if (contentWrapper) {
                contentWrapper.style.paddingBottom = '70px';
                console.log('Added padding to content wrapper');
            } else {
                console.log('Content wrapper not found');
            }
        } else {
            // Alternative approach - add to body if wrapper not found
            document.body.insertAdjacentHTML('beforeend', mobileNavHTML);
            console.log('Mobile navigation inserted into body as fallback');
        }
        
        // Sync notification counts if we're on a page with notifications
        function syncNotificationCounts() {
            // Alerts count
            const alertsCount = document.getElementById('alertsCount');
            const mobileAlertsCount = document.getElementById('mobileAlertsCount');
            
            if (alertsCount && mobileAlertsCount) {
                mobileAlertsCount.textContent = alertsCount.textContent;
                mobileAlertsCount.style.display = alertsCount.textContent === '0' ? 'none' : 'flex';
            }
            
            // Messages count
            const messagesCount = document.getElementById('messagesCount');
            const mobileMessagesCount = document.getElementById('mobileMessagesCount');
            
            if (messagesCount && mobileMessagesCount) {
                mobileMessagesCount.textContent = messagesCount.textContent;
                mobileMessagesCount.style.display = messagesCount.textContent === '0' ? 'none' : 'flex';
            }
        }
        
        // Run initially
        syncNotificationCounts();
        
        // Then set interval to update
        setInterval(syncNotificationCounts, 5000);
    } else {
        console.log('Not adding mobile navigation - screen width > 767.98px');
    }
}); 