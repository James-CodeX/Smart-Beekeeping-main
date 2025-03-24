// This script runs before the DOM is fully loaded to prevent sidebar flickering
(function() {
  // Check if sidebar should be collapsed based on localStorage
  const shouldBeCollapsed = localStorage.getItem('sidebarToggled') === 'true';
  
  if (shouldBeCollapsed) {
    // Create a style element that will be applied immediately
    const style = document.createElement('style');
    style.id = 'immediate-sidebar-state';
    style.innerHTML = `
      /* Hide sidebar expansion during page load */
      .sidebar {
        width: 6.5rem !important;
        transition: none !important;
      }
      
      /* Ensure sidebar text is hidden */
      .sidebar .nav-item .nav-link span,
      .sidebar .sidebar-brand-text {
        display: none !important;
        width: 0 !important;
        opacity: 0 !important;
        transition: none !important;
      }
      
      /* Position content correctly from the start */
      @media (min-width: 768px) {
        #content-wrapper {
          margin-left: 6.5rem !important;
          width: calc(100% - 6.5rem) !important;
          transition: none !important;
        }
      }
      
      /* Ensure body has the right class */
      body {
        background-color: #f8f9fc;
      }
      
      /* Override any transitions during page load */
      .sidebar, .sidebar *, #content-wrapper {
        transition: none !important;
      }
    `;
    
    // Add the style to head immediately
    document.head.appendChild(style);
    
    // Also add a class to the HTML element to allow for CSS targeting
    document.documentElement.classList.add('sidebar-collapsed');
    
    // When DOM is ready, ensure proper classes are applied
    document.addEventListener('DOMContentLoaded', function() {
      // Apply proper classes
      document.body.classList.add('sidebar-toggled');
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        sidebar.classList.add('toggled');
        // Ensure text is hidden
        const sidebarTexts = sidebar.querySelectorAll('.nav-item .nav-link span, .sidebar-brand-text');
        sidebarTexts.forEach(text => {
          text.style.display = 'none';
          text.style.width = '0';
          text.style.opacity = '0';
        });
      }
      
      // Remove our temporary style after everything is initialized
      setTimeout(function() {
        const tempStyle = document.getElementById('immediate-sidebar-state');
        if (tempStyle) tempStyle.remove();
      }, 500);
    });
  } else {
    // If sidebar should be expanded, ensure text is visible
    document.addEventListener('DOMContentLoaded', function() {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        // Ensure sidebar is not toggled
        sidebar.classList.remove('toggled');
        document.body.classList.remove('sidebar-toggled');
        document.documentElement.classList.remove('sidebar-collapsed');
        
        // Force text to be visible
        const sidebarTexts = sidebar.querySelectorAll('.nav-item .nav-link span, .sidebar-brand-text');
        sidebarTexts.forEach(text => {
          text.style.display = 'inline';
          text.style.width = 'auto';
          text.style.opacity = '1';
        });
      }
    });
  }
})(); 