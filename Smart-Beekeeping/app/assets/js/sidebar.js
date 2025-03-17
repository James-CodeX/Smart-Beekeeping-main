// Sidebar functionality
document.addEventListener('DOMContentLoaded', function() {
  const sidebar = document.querySelector('.sidebar');
  const contentWrapper = document.getElementById('content-wrapper');
  
  // Load saved sidebar state from localStorage
  const sidebarState = localStorage.getItem('sidebarToggled');
  if (sidebarState === 'true' && window.innerWidth >= 768) {
    document.body.classList.add('sidebar-toggled');
    sidebar.classList.add('toggled');
  }
  
  // Handle sidebar toggle for desktop
  const sidebarToggle = document.getElementById('sidebarToggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function(e) {
      e.preventDefault();
      document.body.classList.toggle('sidebar-toggled');
      sidebar.classList.toggle('toggled');
      
      // Save state to localStorage
      const isToggled = sidebar.classList.contains('toggled');
      localStorage.setItem('sidebarToggled', isToggled);
    });
  }

  // Handle sidebar toggle for mobile
  const sidebarToggleTop = document.getElementById('sidebarToggleTop');
  if (sidebarToggleTop) {
    sidebarToggleTop.addEventListener('click', function(e) {
      e.preventDefault();
      sidebar.classList.toggle('toggled');
      
      // For mobile, we add overlay if sidebar is shown
      if (window.innerWidth < 768) {
        if (sidebar.classList.contains('toggled')) {
          // Create overlay
          if (!document.getElementById('sidebar-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'sidebar-overlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0,0,0,0.4)';
            overlay.style.zIndex = '99';
            overlay.style.transition = 'opacity 0.3s ease';
            document.body.appendChild(overlay);
            
            // Add click handler to close sidebar when overlay is clicked
            overlay.addEventListener('click', function() {
              sidebar.classList.remove('toggled');
              overlay.remove();
            });
          }
        } else {
          // Remove overlay when sidebar is hidden
          const overlay = document.getElementById('sidebar-overlay');
          if (overlay) {
            overlay.remove();
          }
        }
      }
    });
  }

  // Handle window resize
  window.addEventListener('resize', function() {
    const width = window.innerWidth;
    
    // On mobile, hide sidebar when resizing
    if (width < 768) {
      sidebar.classList.remove('toggled');
      
      // Remove overlay if it exists
      const overlay = document.getElementById('sidebar-overlay');
      if (overlay) {
        overlay.remove();
      }
    } else {
      // On desktop, restore saved state
      const savedState = localStorage.getItem('sidebarToggled');
      if (savedState === 'true') {
        document.body.classList.add('sidebar-toggled');
        sidebar.classList.add('toggled');
      } else {
        document.body.classList.remove('sidebar-toggled');
        sidebar.classList.remove('toggled');
      }
    }
  });

  // Highlight the active page in the sidebar
  const currentPage = window.location.pathname.split('/').pop();
  const navLinks = document.querySelectorAll('.sidebar .nav-link');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}); 