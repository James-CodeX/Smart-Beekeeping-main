// Sidebar template to ensure consistency across all pages
document.addEventListener('DOMContentLoaded', function() {
  const sidebarPlaceholder = document.getElementById('sidebar-placeholder');
  
  if (sidebarPlaceholder) {
    // Determine the current page to highlight the active link
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Check if the sidebar should be toggled (collapsed)
    const sidebarState = localStorage.getItem('sidebarToggled');
    const isToggled = sidebarState === 'true';
    
    // Create the standard sidebar content
    const sidebarHTML = `
      <div class="container-fluid d-flex flex-column p-0">
        <a class="navbar-brand d-flex justify-content-center align-items-center sidebar-brand m-0" href="index.html">
          <div class="sidebar-brand-icon rotate-n-15"><i class="fas fa-bee"></i></div>
          <div class="sidebar-brand-text mx-3"><span>Smart Nyuki</span></div>
        </a>
        <hr class="sidebar-divider my-0">
        <ul class="navbar-nav text-light" id="accordionSidebar">
          <li class="nav-item"><a class="nav-link ${currentPage === 'index.html' ? 'active' : ''}" href="index.html"><i class="fas fa-tachometer-alt"></i><span>Dashboard</span></a></li>
          <li class="nav-item"><a class="nav-link ${currentPage === 'table.html' ? 'active' : ''}" href="table.html"><i class="fas fa-table"></i><span>Table</span></a></li>
          <li class="nav-item"><a class="nav-link ${currentPage === 'manage-my-bees.html' ? 'active' : ''}" href="manage-my-bees.html"><i class="fas fa-map-marker-alt"></i><span>Manage My Bees</span></a></li>
          <li class="nav-item"><a class="nav-link ${currentPage === 'add-apiary.html' ? 'active' : ''}" href="add-apiary.html"><i class="fas fa-plus"></i><span>Add Apiary</span></a></li>
          <li class="nav-item"><a class="nav-link ${currentPage === 'add-hive.html' ? 'active' : ''}" href="add-hive.html"><i class="fas fa-plus-circle"></i><span>Add Hive</span></a></li>
          <li class="nav-item"><a class="nav-link ${currentPage === 'alerts.html' ? 'active' : ''}" href="alerts.html"><i class="fas fa-bell"></i><span>Alerts</span></a></li>
          <li class="nav-item"><a class="nav-link ${currentPage === 'messages.html' ? 'active' : ''}" href="messages.html"><i class="fas fa-envelope"></i><span>Messages</span></a></li>
          <li class="nav-item"><a class="nav-link ${currentPage === 'profile.html' ? 'active' : ''}" href="profile.html"><i class="fas fa-user"></i><span>Profile</span></a></li>
          <li class="nav-item"><a class="nav-link" href="#" onclick="handleLogout()"><i class="fas fa-sign-out-alt"></i><span>Logout</span></a></li>
        </ul>
        <div class="text-center d-none d-md-inline mt-auto">
          <button class="btn rounded-circle border-0" id="sidebarToggle" type="button">
            <i class="fas fa-angle-left"></i>
          </button>
        </div>
      </div>
    `;
    
    // Insert the sidebar content
    sidebarPlaceholder.innerHTML = sidebarHTML;
    
    // Apply toggled class to the sidebar element immediately after it's created
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && isToggled && window.innerWidth >= 768) {
      sidebar.classList.add('toggled');
      
      // Also ensure other required classes are applied
      document.documentElement.classList.add('sidebar-collapsed');
      document.body.classList.add('sidebar-toggled');
    }
    
    // Add simple click handlers to navigation links to maintain collapsed state
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href !== '#' && !link.getAttribute('onclick')) {
        link.addEventListener('click', function(e) {
          if (e.ctrlKey || e.shiftKey || e.metaKey) return;
          
          // If sidebar is collapsed, ensure it stays collapsed during navigation
          const isCurrentlyToggled = document.querySelector('.sidebar').classList.contains('toggled');
          if (isCurrentlyToggled) {
            localStorage.setItem('sidebarToggled', 'true');
          }
        });
      }
    });
  }

  // Set up sidebar toggle
  const sidebarToggle = document.getElementById('sidebarToggle');
  
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function(e) {
      e.preventDefault();
      const sidebar = document.querySelector('.sidebar');
      
      // Toggle the sidebar
      if (sidebar) {
        sidebar.classList.toggle('toggled');
        
        // Store state in localStorage for persistence
        const isToggled = sidebar.classList.contains('toggled');
        localStorage.setItem('sidebarToggled', isToggled);
        
        // Add/remove classes on document and body for proper styling
        if (isToggled) {
          document.documentElement.classList.add('sidebar-collapsed');
          document.body.classList.add('sidebar-toggled');
        } else {
          document.documentElement.classList.remove('sidebar-collapsed');
          document.body.classList.remove('sidebar-toggled');
        }
      }
    });
  }
}); 