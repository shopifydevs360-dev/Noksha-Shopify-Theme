document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const drawer = document.getElementById('menu-drawer');
  const overlay = document.getElementById('drawer-overlay');
  const drawerToggle = document.querySelector('[data-drawer-toggle="menu-drawer"]');
  const closeButton = document.querySelector('[data-drawer-close]');
  
  // Check if elements exist
  if (!drawer) {
    console.error('Drawer element not found');
    return;
  }
  
  if (!overlay) {
    console.error('Overlay element not found');
    return;
  }
  
  // Keep track of navigation history
  const navigationHistory = ['panel-main'];
  
  // Function to open the drawer
  function openDrawer() {
    drawer.classList.add('open');
    overlay.classList.add('active');
    // Prevent body scroll when drawer is open
    document.body.style.overflow = 'hidden';
    // Reset to main panel when opening
    showPanel('panel-main', false);
  }
  
  // Function to close the drawer
  function closeDrawer() {
    drawer.classList.remove('open');
    overlay.classList.remove('active');
    // Restore body scroll
    document.body.style.overflow = '';
    // Reset to main panel when closing
    setTimeout(() => {
      showPanel('panel-main', false);
    }, 300);
  }
  
  // Function to show a specific panel
  function showPanel(panelId, addToHistory = true) {
    console.log('Showing panel:', panelId); // Debug log
    
    // Find the target panel
    const targetPanel = document.getElementById(panelId);
    if (!targetPanel) {
      console.error('Panel not found:', panelId);
      return;
    }
    
    // Add to navigation history if needed
    if (addToHistory) {
      navigationHistory.push(panelId);
    } else {
      // Reset history
      navigationHistory.length = 0;
      navigationHistory.push('panel-main');
    }
    
    // Hide all panels
    document.querySelectorAll('.drawer__panel').forEach(panel => {
      panel.classList.remove('active');
      panel.style.transform = 'translateX(100%)';
    });
    
    // Show the target panel
    targetPanel.classList.add('active');
    targetPanel.style.transform = 'translateX(0)';
    
    // Update ARIA attributes
    document.querySelectorAll('[data-target-panel]').forEach(toggle => {
      const targetId = toggle.getAttribute('data-target-panel');
      toggle.setAttribute('aria-expanded', targetId === panelId);
    });
  }
  
  // Event listener for the menu trigger button
  if (drawerToggle) {
    drawerToggle.addEventListener('click', openDrawer);
  } else {
    console.error('Drawer toggle button not found');
  }
  
  // Event listener for the close button
  if (closeButton) {
    closeButton.addEventListener('click', closeDrawer);
  } else {
    console.error('Close button not found');
  }
  
  // Event listener for clicking on the overlay
  overlay.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    closeDrawer();
  });
  
  // Event listener for ESC key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && drawer.classList.contains('open')) {
      closeDrawer();
    }
  });
  
  // Event delegation for panel navigation
  document.addEventListener('click', function(e) {
    // Check if clicked element has data-target-panel attribute
    const targetButton = e.target.closest('[data-target-panel]');
    if (targetButton) {
      e.preventDefault();
      const targetPanelId = targetButton.getAttribute('data-target-panel');
      console.log('Navigation button clicked:', targetPanelId); // Debug log
      showPanel(targetPanelId);
    }
  });
});