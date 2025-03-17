/**
 * sidebar-state.js
 * This concise script should be copied to all HTML pages to ensure consistent sidebar behavior
 * Insert it at the very top of your HTML head section
 */

// For use as an inline script in the HTML head (copy this minified version)
// (function(){if(localStorage.getItem('sidebarToggled')==='true'){document.documentElement.className+=' sidebar-collapsed';var s=document.createElement('style');s.innerHTML='.sidebar{width:6.5rem!important;transition:none!important}.sidebar .nav-link span,.sidebar .sidebar-brand-text{display:none!important}@media(min-width:768px){#content-wrapper{margin-left:6.5rem!important;width:calc(100% - 6.5rem)!important}}';document.head.appendChild(s)}})();

// For use when loaded as an external script
(function() {
  // Apply sidebar collapsed state immediately if needed
  if (localStorage.getItem('sidebarToggled') === 'true') {
    // Add class to HTML element for CSS targeting
    document.documentElement.classList.add('sidebar-collapsed');
    
    // Create and apply immediate styles
    const style = document.createElement('style');
    style.id = 'sidebar-instant-state';
    style.innerHTML = `
      /* Ensure sidebar is collapsed immediately */
      .sidebar {
        width: 6.5rem !important;
        transition: none !important;
      }
      
      /* Hide sidebar text */
      .sidebar .nav-link span,
      .sidebar .sidebar-brand-text {
        display: none !important;
        width: 0 !important;
        opacity: 0 !important;
      }
      
      /* Position content correctly */
      @media (min-width: 768px) {
        #content-wrapper {
          margin-left: 6.5rem !important;
          width: calc(100% - 6.5rem) !important;
          transition: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Clean up the style after the page has fully loaded
    window.addEventListener('load', function() {
      setTimeout(function() {
        const styleEl = document.getElementById('sidebar-instant-state');
        if (styleEl) styleEl.remove();
      }, 300);
    });
  }
})(); 