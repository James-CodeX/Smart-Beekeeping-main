// Sidebar functionality
// Apply sidebar state immediately before DOM is ready
(function() {
  const sidebarState = localStorage.getItem('sidebarToggled');
  if (sidebarState === 'true') {
    document.documentElement.classList.add('sidebar-collapsed');
  }
})();

document.addEventListener('DOMContentLoaded', function() {
  const sidebar = document.querySelector('.sidebar');
  const contentWrapper = document.getElementById('content-wrapper');
  
  // Clean up temporary styles after sidebar is fully initialized
  setTimeout(() => {
    // Remove any temporary styles that might have been added
    const tempStyles = [
      document.getElementById('immediate-sidebar-state'),
      document.getElementById('instant-sidebar-state'),
      document.getElementById('sidebarStatePreserve'),
      document.getElementById('sidebarNavigationStyle')
    ];
    
    tempStyles.forEach(style => {
      if (style) style.remove();
    });
    
    // Re-enable transitions
    if (sidebar) {
      sidebar.style.transition = '';
      sidebar.style.opacity = '1';
    }
  }, 100);
  
  // Load saved sidebar state from localStorage
  const sidebarState = localStorage.getItem('sidebarToggled');
  if (sidebarState === 'true' && window.innerWidth >= 768) {
    document.body.classList.add('sidebar-toggled');
    if (sidebar) sidebar.classList.add('toggled');
  } else if (sidebarState !== 'true') {
    // Ensure all collapsed classes are removed if sidebar should be expanded
    document.documentElement.classList.remove('sidebar-collapsed');
    document.body.classList.remove('sidebar-toggled');
    if (sidebar) sidebar.classList.remove('toggled');
  }
  
  // Handle sidebar toggle for desktop
  const sidebarToggle = document.getElementById('sidebarToggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function(e) {
      e.preventDefault();
      document.body.classList.toggle('sidebar-toggled');
      sidebar.classList.toggle('toggled');
      
      // Update html class for immediate CSS rules
      if (sidebar.classList.contains('toggled')) {
        document.documentElement.classList.add('sidebar-collapsed');
      } else {
        document.documentElement.classList.remove('sidebar-collapsed');
      }
      
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
        document.documentElement.classList.add('sidebar-collapsed');
      } else {
        document.body.classList.remove('sidebar-toggled');
        sidebar.classList.remove('toggled');
        document.documentElement.classList.remove('sidebar-collapsed');
      }
    }
  });

  // Highlight the active page in the sidebar
  const currentPage = window.location.pathname.split('/').pop();
  const navLinks = document.querySelectorAll('.sidebar .nav-link');
  
  // Add navigation state preservation to all nav links
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    
    // Set active state
    if (href === currentPage) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
    
    // Add click handler to nav links (except ones with # that have their own handlers)
    if (href && href !== '#' && !link.getAttribute('onclick')) {
      // We may already have added this in sidebar-template.js, but add it here as a fallback
      if (!link.hasAttribute('data-nav-handler-added')) {
        link.setAttribute('data-nav-handler-added', 'true');
        
        link.addEventListener('click', function(e) {
          // Don't intercept if modifier keys are pressed (like ctrl+click for new tab)
          if (e.ctrlKey || e.shiftKey || e.metaKey) {
            return;
          }
          
          // Get current toggle state and preserve it
          const isCurrentlyToggled = sidebar.classList.contains('toggled');
          
          if (isCurrentlyToggled) {
            // Since we're navigating, make sure we keep the collapsed state
            localStorage.setItem('sidebarToggled', 'true');
            sessionStorage.setItem('sidebarToggled', 'true');
          }
        });
      }
    }
  });
}); 