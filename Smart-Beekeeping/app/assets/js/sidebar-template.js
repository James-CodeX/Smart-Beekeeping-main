// Sidebar template to ensure consistency across all pages
document.addEventListener('DOMContentLoaded', function() {
  const sidebarPlaceholder = document.getElementById('sidebar-placeholder');
  
  if (sidebarPlaceholder) {
    // Determine the current page to highlight the active link
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
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
        <div class="text-center d-none d-md-inline"><button class="btn rounded-circle border-0" id="sidebarToggle" type="button"></button></div>
      </div>
    `;
    
    // Insert the sidebar content
    sidebarPlaceholder.innerHTML = sidebarHTML;
  }
}); 