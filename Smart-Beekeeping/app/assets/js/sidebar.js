// Sidebar functionality
document.addEventListener('DOMContentLoaded', function() {
  // Handle sidebar toggle for desktop
  const sidebarToggle = document.getElementById('sidebarToggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function(e) {
      e.preventDefault();
      document.body.classList.toggle('sidebar-toggled');
      document.querySelector('.sidebar').classList.toggle('toggled');
    });
  }

  // Handle sidebar toggle for mobile
  const sidebarToggleTop = document.getElementById('sidebarToggleTop');
  if (sidebarToggleTop) {
    sidebarToggleTop.addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelector('.sidebar').classList.toggle('toggled');
    });
  }

  // Close sidebar on window resize (mobile to desktop)
  window.addEventListener('resize', function() {
    const width = window.innerWidth;
    if (width < 768) {
      document.querySelector('.sidebar').classList.remove('toggled');
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