document.addEventListener('DOMContentLoaded', function() {
  const filterForm = document.getElementById('filters-form');
  if (!filterForm) return;

  // Listen for changes on any filter input
  const filterInputs = filterForm.querySelectorAll('input');
  filterInputs.forEach(input => {
    input.addEventListener('change', function() {
      applyFilters();
    });
  });

  function applyFilters() {
    const formData = new FormData(filterForm);
    const searchParams = new URLSearchParams(window.location.search);

    // Clear existing filter parameters from the URL
    for (const [key] of searchParams) {
      if (key.startsWith('filter.')) {
        searchParams.delete(key);
      }
    }

    // Build the search parameters from the form data
    for (const [key, value] of formData.entries()) {
      searchParams.append(key, value);
    }

    // Get the current URL without any parameters
    const currentUrl = window.location.origin + window.location.pathname;

    // Construct the new URL with the filter parameters
    let newUrl = `${currentUrl}?${searchParams.toString()}`;

    // Reload the page with the new URL
    window.location.href = newUrl;
  }
});