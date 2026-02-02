document.addEventListener('DOMContentLoaded', () => {
  // Initialize the filter system
  initFilterSystem();
});

function initFilterSystem() {
  const filterForm = document.getElementById('CollectionFilters');
  if (!filterForm) return;

  // Filter search functionality
  initFilterSearch();
  
  // Price range filter with apply button
  initPriceRangeFilter();
  
  // Sort by change
  initSortBy();
  
  // Form submission
  filterForm.addEventListener('submit', handleFilterSubmit);
  
  // Reset button
  const resetBtn = filterForm.querySelector('.reset-filters-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', handleResetFilters);
  }
  
  // Active filter removal
  initActiveFilterRemoval();
  
  // Collection radio buttons - immediate redirect
  const collectionRadios = filterForm.querySelectorAll('input[name="collection_handle"]');
  collectionRadios.forEach(radio => {
    radio.addEventListener('change', handleCollectionChange);
  });
}

function initFilterSearch() {
  const searchInputs = document.querySelectorAll('[data-filter-search]');
  
  searchInputs.forEach(input => {
    input.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase();
      const filterGroup = this.closest('.filter-content');
      const options = filterGroup.querySelectorAll('.filter-checkbox');
      
      options.forEach(option => {
        const labelText = option.querySelector('.filter-label-text').textContent.toLowerCase();
        option.style.display = labelText.includes(searchTerm) ? 'flex' : 'none';
      });
    });
  });
}

function initPriceRangeFilter() {
  const applyButtons = document.querySelectorAll('.apply-price-filter');
  
  applyButtons.forEach(button => {
    button.addEventListener('click', function() {
      const filterGroup = this.closest('.filter-group');
      const fromInput = filterGroup.querySelector('input[placeholder*="From"]');
      const toInput = filterGroup.querySelector('input[placeholder*="To"]');
      
      // Convert to cents for Shopify
      if (fromInput.value) {
        fromInput.value = Math.round(parseFloat(fromInput.value) * 100);
      }
      if (toInput.value) {
        toInput.value = Math.round(parseFloat(toInput.value) * 100);
      }
      
      // Submit the form
      const filterForm = document.getElementById('CollectionFilters');
      if (filterForm) {
        handleFilterSubmit(new Event('submit', { cancelable: true }));
      }
    });
  });
}

function initSortBy() {
  const sortSelect = document.querySelector('#sort-by');
  if (!sortSelect) return;
  
  sortSelect.addEventListener('change', function() {
    // Get current URL
    const url = new URL(window.location.href);
    
    // Update sort parameter
    if (this.value) {
      url.searchParams.set('sort_by', this.value);
    } else {
      url.searchParams.delete('sort_by');
    }
    
    // Reset to page 1 when sorting
    url.searchParams.set('page', '1');
    
    // Redirect with new sort
    window.location.href = url.toString();
  });
}

function handleFilterSubmit(e) {
  e.preventDefault();
  
  const filterForm = document.getElementById('CollectionFilters');
  const formData = new FormData(filterForm);
  const params = new URLSearchParams();
  
  // Collect all form data
  for (const [key, value] of formData.entries()) {
    if (value === '' || value == null) continue;
    
    // Special handling for price inputs
    if (key.includes('filter.v.price')) {
      if (value) {
        params.append(key, value);
      }
    } else if (key === 'collection_handle') {
      // Collection radio button - redirect immediately
      if (value) {
        window.location.href = `/collections/${value}`;
        return;
      }
    } else {
      params.append(key, value);
    }
  }
  
  // Get current URL
  const url = new URL(window.location.href);
  const currentParams = new URLSearchParams(window.location.search);
  
  // Preserve sort_by if not in form
  if (!params.has('sort_by') && currentParams.has('sort_by')) {
    params.set('sort_by', currentParams.get('sort_by'));
  }
  
  // Reset to page 1 when filtering
  params.set('page', '1');
  
  // Build new URL
  const newUrl = `${url.pathname}?${params.toString()}`;
  
  // Use AJAX for filtering if pagination AJAX is enabled
  if (window.COLLECTION_AJAX) {
    window.COLLECTION_AJAX.currentPage = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Trigger AJAX fetch
    if (typeof fetchProducts === 'function') {
      fetchProducts(false, false);
    }
  } else {
    // Fallback to normal navigation
    window.location.href = newUrl;
  }
}

function handleResetFilters() {
  const filterForm = document.getElementById('CollectionFilters');
  if (!filterForm) return;
  
  // Reset form
  filterForm.reset();
  
  // Reset sort by to default
  const sortSelect = filterForm.querySelector('#sort-by');
  if (sortSelect) {
    sortSelect.value = 'manual';
  }
  
  // Submit the reset form
  handleFilterSubmit(new Event('submit', { cancelable: true }));
}

function initActiveFilterRemoval() {
  const activeFilters = document.querySelectorAll('.active-filter');
  
  activeFilters.forEach(filter => {
    filter.addEventListener('click', function(e) {
      e.preventDefault();
      
      const url = this.getAttribute('href');
      
      if (window.COLLECTION_AJAX) {
        // Remove filter via AJAX
        const newUrl = new URL(url, window.location.origin);
        const params = new URLSearchParams(newUrl.search);
        
        // Update the main AJAX function
        window.COLLECTION_AJAX.currentPage = 1;
        
        // Build fetch URL
        const fetchUrl = `${window.location.pathname}?${params.toString()}`;
        
        fetch(fetchUrl, {
          method: 'GET',
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        })
          .then(res => res.text())
          .then(html => {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            
            // Update products
            const newProducts = doc.querySelector('#productsContainer');
            const oldProducts = document.getElementById('productsContainer');
            
            if (oldProducts && newProducts) {
              oldProducts.dataset.totalPages = newProducts.dataset.totalPages || '1';
              oldProducts.dataset.currentPage = newProducts.dataset.currentPage || '1';
              oldProducts.dataset.totalProducts = newProducts.dataset.totalProducts || '';
              oldProducts.innerHTML = newProducts.innerHTML;
            }
            
            // Update pagination UI
            if (typeof updatePaginationUIFromCurrentDOM === 'function') {
              updatePaginationUIFromCurrentDOM();
            }
            
            // Update filter form
            const newFilterForm = doc.querySelector('#CollectionFilters');
            const oldFilterForm = document.getElementById('CollectionFilters');
            
            if (oldFilterForm && newFilterForm) {
              oldFilterForm.innerHTML = newFilterForm.innerHTML;
              initFilterSystem(); // Reinitialize
            }
          })
          .catch(err => console.error('Error removing filter:', err));
      } else {
        // Normal navigation
        window.location.href = url;
      }
    });
  });
}

function handleCollectionChange(e) {
  if (e.target.value) {
    window.location.href = `/collections/${e.target.value}`;
  }
}