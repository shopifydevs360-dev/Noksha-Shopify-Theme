document.addEventListener('DOMContentLoaded', function() {
  const filterToggleBtn = document.querySelector('.toolbar-actions button[onclick="toggleDesktopFilters()"]');
  const mobileFilterToggleBtn = document.querySelector('.mobile-filter-toggle');
  const filtersWrapper = document.getElementById('filters-wrapper');
  const filtersCloseBtn = document.querySelector('.filters-close-btn');

  function toggleFilters() {
    if (filtersWrapper) {
      filtersWrapper.classList.toggle('active');
      // Prevent body scroll when filter is open on mobile
      document.body.classList.toggle('filter-open');
    }
  }

  if (filterToggleBtn) {
    filterToggleBtn.addEventListener('click', toggleFilters);
  }

  if (mobileFilterToggleBtn) {
    mobileFilterToggleBtn.addEventListener('click', toggleFilters);
  }

  if (filtersCloseBtn) {
    filtersCloseBtn.addEventListener('click', toggleFilters);
  }
});