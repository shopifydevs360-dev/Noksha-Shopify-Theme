// product-filter.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('CollectionFilters');

  // Global state
  window.COLLECTION_AJAX = {
    currentPage: 1,
    isLoading: false,
    collectionDefaultSort: 'manual' // Default sort from Shopify
  };

  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });
  }

  // Initialize everything
  setInitialPaginationData();
  initApplyFilters();
  initClearFilters();
  initPagination();
  initFilterToggle();
  syncFiltersWithURL(); // Sync filters on page load
  initRemoveSingleFilter();
  initClearAllFilters();
  
  // Update active filters when filter toggles change
  if (form) {
    form.addEventListener('change', () => {
      updateActiveFiltersDisplay();
    });
  }
});

/* ======================================================
  HELPERS
====================================================== */
function getMainContainer() {
  return document.querySelector('.main-product-list');
}

function getProductsContainer() {
  return document.getElementById('productsContainer');
}

function getPaginationWrapper() {
  return document.getElementById('paginationWrapper');
}

function getPaginationType() {
  return getMainContainer()?.dataset.paginationType || 'pagination_by_number';
}

function getLoaderElement() {
  return getPaginationWrapper()?.querySelector('[data-loader]');
}

function formatCurrency(value) {
  if (value === '∞' || value === '' || value === '0' || value === 0) return '∞';
  if (typeof value === 'string' && value.toLowerCase() === 'max') return '∞';
  
  // Try to parse as number
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return value;
  
  // Format as currency (adjust based on your shop settings)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numValue / 100); // Assuming value is in cents
}

/* ======================================================
  INITIAL DATA
====================================================== */
function setInitialPaginationData() {
  const box = getProductsContainer();
  if (!box) return;
  window.COLLECTION_AJAX.currentPage = parseInt(box.dataset.currentPage || '1', 10);
}

/* ======================================================
  APPLY FILTERS
====================================================== */
function initApplyFilters() {
  const btn = document.getElementById('applyFiltersBtn');
  if (!btn) return;

  btn.addEventListener('click', e => {
    e.preventDefault();
    if (window.COLLECTION_AJAX.isLoading) return;

    window.COLLECTION_AJAX.currentPage = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    fetchProducts(false, true);
    closeFilterUI();
  });
}

/* ======================================================
  CLEAR FILTERS (FORM BUTTON)
====================================================== */
function initClearFilters() {
  const btn = document.getElementById('clearFiltersBtn');
  const form = document.getElementById('CollectionFilters');
  if (!btn || !form) return;

  btn.addEventListener('click', e => {
    e.preventDefault();
    form.reset();

    window.COLLECTION_AJAX.currentPage = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    fetchProducts(false, true);
    closeFilterUI();
    updateActiveFiltersDisplay(); // Also update the active filters display
  });
}

/* ======================================================
  ACTIVE FILTERS DISPLAY
====================================================== */
function updateActiveFiltersDisplay() {
  const form = document.getElementById('CollectionFilters');
  const activeFiltersContainer = document.querySelector('[data-active-filters]');
  const clearAllBtn = document.querySelector('[data-clear-all-filters]');
  const filterResultCount = document.querySelector('[data-filter-result-count]');
  
  if (!form || !activeFiltersContainer) return;
  
  // Get all active filter inputs
  const activeFilters = [];
  
  // Check checkboxes (regular filters)
  form.querySelectorAll('input[type="checkbox"]:checked').forEach(input => {
    // Skip sort checkboxes
    if (input.name === 'sort_by') return;
    
    const label = input.closest('label');
    if (label) {
      let text = label.textContent.trim();
      // Remove count from text (e.g., "Red (12)" becomes "Red")
      text = text.replace(/\(\d+\)/g, '').trim();
      if (text) {
        activeFilters.push({
          type: input.name,
          value: input.value,
          label: text,
          element: input
        });
      }
    }
  });
  
  // Check radio buttons (sort and collection selection)
  form.querySelectorAll('input[type="radio"]:checked').forEach(input => {
    // Skip default sort option
    if (input.name === 'sort_by' && input.value === 'manual') return;
    
    const label = input.closest('label');
    if (label) {
      let text = label.textContent.trim();
      text = text.replace(/\(\d+\)/g, '').trim();
      if (text) {
        activeFilters.push({
          type: input.name,
          value: input.value,
          label: text,
          element: input
        });
      }
    }
  });
  
  // Check price range inputs
  const minPrice = form.querySelector('input[name*="price.gte"], input[name*="price.gte"]');
  const maxPrice = form.querySelector('input[name*="price.lte"], input[name*="price.lte"]');
  
  if ((minPrice && minPrice.value) || (maxPrice && maxPrice.value)) {
    const minVal = minPrice?.value || 0;
    const maxVal = maxPrice?.value || '∞';
    
    // Only add if at least one value is set and not zero/default
    if (minVal > 0 || maxVal !== '∞') {
      activeFilters.push({
        type: 'price_range',
        value: `${minVal}-${maxVal}`,
        label: `Price: ${formatCurrency(minVal)} - ${formatCurrency(maxVal)}`,
        element: minPrice || maxPrice
      });
    }
  }
  
  // Check for any other number inputs (if any)
  form.querySelectorAll('input[type="number"]:not([name*="price"])').forEach(input => {
    if (input.value && input.value > 0) {
      const label = input.previousElementSibling?.textContent?.trim() || 'Filter';
      activeFilters.push({
        type: input.name,
        value: input.value,
        label: `${label}: ${input.value}`,
        element: input
      });
    }
  });
  
  // Update UI
  if (activeFilters.length === 0) {
    activeFiltersContainer.innerHTML = '';
    if (clearAllBtn) clearAllBtn.classList.add('hide');
    
    // Update result count to show total products
    if (filterResultCount) {
      const totalProducts = getProductsContainer()?.dataset.totalProducts || '0';
      filterResultCount.textContent = `${totalProducts} Products Found`;
    }
  } else {
    // Build active filters HTML
    const filtersHtml = activeFilters.map(filter => {
      // Determine filter type for display
      let displayType = '';
      if (filter.type.includes('availability')) displayType = 'Availability';
      else if (filter.type.includes('vendor')) displayType = 'Brand';
      else if (filter.type.includes('product_type')) displayType = 'Type';
      else if (filter.type.includes('color')) displayType = 'Color';
      else if (filter.type.includes('size')) displayType = 'Size';
      else if (filter.type.includes('tag')) displayType = 'Tag';
      else if (filter.type === 'price_range') displayType = '';
      else if (filter.type === 'sort_by') displayType = 'Sort';
      else if (filter.type === 'collection_handle') displayType = 'Collection';
      else displayType = filter.type.split('.').pop() || '';
      
      const displayLabel = displayType ? `${displayType}: ${filter.label}` : filter.label;
      
      return `
        <div class="active-filter-tag" 
             data-filter-type="${filter.type}" 
             data-filter-value="${filter.value}"
             data-action="remove-filter">
          <span class="filter-label">${displayLabel}</span>
          <span class="remove-icon">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </span>
        </div>
      `;
    }).join('');
    
    activeFiltersContainer.innerHTML = filtersHtml;
    if (clearAllBtn) clearAllBtn.classList.remove('hide');
    
    // Update result count - this will be updated after fetch
  }
}

/* ======================================================
  REMOVE SINGLE FILTER
====================================================== */
function initRemoveSingleFilter() {
  document.addEventListener('click', (e) => {
    const filterTag = e.target.closest('[data-action="remove-filter"]');
    if (!filterTag) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const filterType = filterTag.dataset.filterType;
    const filterValue = filterTag.dataset.filterValue;
    
    removeFilter(filterType, filterValue);
  });
}

function removeFilter(filterType, filterValue) {
  const form = document.getElementById('CollectionFilters');
  if (!form) return;
  
  // Handle price range
  if (filterType === 'price_range') {
    const [minVal, maxVal] = filterValue.split('-');
    const minInput = form.querySelector('input[name*="price.gte"]');
    const maxInput = form.querySelector('input[name*="price.lte"]');
    
    if (minInput && minInput.value === minVal) minInput.value = '';
    if (maxInput && maxInput.value === maxVal) maxInput.value = '';
  } 
  // Handle sort by
  else if (filterType === 'sort_by') {
    const defaultSort = form.querySelector('input[name="sort_by"][value="manual"]');
    if (defaultSort) defaultSort.checked = true;
  }
  // Handle other inputs
  else {
    const inputs = form.querySelectorAll(`[name="${filterType}"]`);
    let found = false;
    
    inputs.forEach(input => {
      if (input.value === filterValue || 
          input.value.includes(filterValue) ||
          filterValue.includes(input.value)) {
        input.checked = false;
        found = true;
      }
    });
    
    // If not found by exact match, try partial match (for tags)
    if (!found && filterType.includes('.tag')) {
      inputs.forEach(input => {
        if (input.value.toLowerCase().includes(filterValue.toLowerCase().split(': ').pop())) {
          input.checked = false;
        }
      });
    }
  }
  
  // Update UI and fetch new results
  window.COLLECTION_AJAX.currentPage = 1;
  fetchProducts(false, false);
  updateActiveFiltersDisplay();
}

/* ======================================================
  CLEAR ALL FILTERS (RESULT BAR BUTTON)
====================================================== */
function initClearAllFilters() {
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-clear-all-filters]')) {
      e.preventDefault();
      clearAllFilters();
    }
  });
}

function clearAllFilters() {
  const form = document.getElementById('CollectionFilters');
  
  // Reset form
  if (form) {
    form.reset();
    
    // Set default sort
    const defaultSort = form.querySelector('input[name="sort_by"][value="manual"]');
    if (defaultSort) defaultSort.checked = true;
  }
  
  // Clear URL parameters
  const url = new URL(window.location.href);
  url.search = '';
  history.replaceState({}, '', url);
  
  // Update UI and fetch results
  window.COLLECTION_AJAX.currentPage = 1;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  fetchProducts(false, false);
  updateActiveFiltersDisplay();
  closeFilterUI();
}

/* ======================================================
  URL SYNC FUNCTIONS
====================================================== */
function syncFiltersWithURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const form = document.getElementById('CollectionFilters');
  if (!form) return;
  
  // Reset form first (but keep default values)
  form.reset();
  
  // Set default sort
  const defaultSort = form.querySelector('input[name="sort_by"][value="manual"]');
  if (defaultSort) defaultSort.checked = true;
  
  // Apply filters from URL
  urlParams.forEach((value, key) => {
    if (key === 'page') return;
    
    // Handle checkboxes (multiple values for same key)
    if (key.includes('filter.v.')) {
      const values = urlParams.getAll(key);
      values.forEach(val => {
        const input = form.querySelector(`[name="${key}"][value="${CSS.escape(val)}"]`);
        if (input) {
          input.checked = true;
        } else {
          // Try with decoded value
          const decodedVal = decodeURIComponent(val);
          const decodedInput = form.querySelector(`[name="${key}"][value="${CSS.escape(decodedVal)}"]`);
          if (decodedInput) decodedInput.checked = true;
        }
      });
    }
    // Handle radios (single value)
    else {
      const input = form.querySelector(`[name="${key}"][value="${CSS.escape(value)}"]`);
      if (input) {
        input.checked = true;
      } else {
        // Try with decoded value
        const decodedVal = decodeURIComponent(value);
        const decodedInput = form.querySelector(`[name="${key}"][value="${CSS.escape(decodedVal)}"]`);
        if (decodedInput) decodedInput.checked = true;
      }
    }
  });
  
  // Update UI
  setTimeout(() => {
    updateActiveFiltersDisplay();
  }, 100);
}

function updateURL(params, collectionHandle) {
  const url = new URL(window.location.origin);
  
  if (collectionHandle) {
    url.pathname = `/collections/${collectionHandle}`;
  } else {
    url.pathname = window.location.pathname;
  }
  
  // Remove page parameter
  params.delete('page');
  
  // Only add search params if there are any filters
  let hasFilters = false;
  for (const [key, value] of params.entries()) {
    if (key && value && value !== 'manual') { // Exclude default sort
      hasFilters = true;
      break;
    }
  }
  
  if (hasFilters) {
    url.search = params.toString();
  } else {
    url.search = '';
  }
  
  history.replaceState({}, '', url.toString());
}

/* ======================================================
  PAGINATION
====================================================== */
function initPagination() {
  // Remove any existing scroll handlers
  window.removeEventListener('scroll', infiniteScrollHandler);

  if (getPaginationType() === 'infinity_loading') {
    window.addEventListener('scroll', infiniteScrollHandler);
  }

  document.addEventListener('click', e => {
    // Handle pagination number buttons
    const pageBtn = e.target.closest('[data-page-number]');
    if (pageBtn) {
      e.preventDefault();
      e.stopPropagation();
      window.COLLECTION_AJAX.currentPage = parseInt(pageBtn.dataset.pageNumber, 10);
      fetchProducts(false, false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Handle load more button
    const loadMoreBtn = e.target.closest('#loadMoreBtn');
    if (loadMoreBtn) {
      e.preventDefault();
      e.stopPropagation();
      window.COLLECTION_AJAX.currentPage++;
      fetchProducts(true, false);
    }
  });
}

function infiniteScrollHandler() {
  if (window.COLLECTION_AJAX.isLoading) return;

  const box = getProductsContainer();
  if (!box) return;

  const totalPages = parseInt(box.dataset.totalPages || '1', 10);
  if (window.COLLECTION_AJAX.currentPage >= totalPages) return;

  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
    window.COLLECTION_AJAX.currentPage++;
    fetchProducts(true, false);
  }
}

/* ======================================================
  QUERY PARAMS
====================================================== */
function buildQueryParams() {
  const form = document.getElementById('CollectionFilters');
  const params = new URLSearchParams();

  if (form) {
    const data = new FormData(form);
    for (const [key, value] of data.entries()) {
      if (value && value.toString().trim()) {
        // Skip collection_handle if it's the current collection
        if (key === 'collection_handle') {
          const currentHandle = window.location.pathname.split('/').pop();
          if (value === currentHandle) continue;
        }
        // Skip default sort
        if (key === 'sort_by' && value === 'manual') continue;
        
        params.append(key, value);
      }
    }
  }

  const collectionHandle = params.get('collection_handle');
  params.delete('collection_handle');

  params.set('page', window.COLLECTION_AJAX.currentPage);
  
  // Add view parameter for AJAX
  params.set('view', 'ajax');
  
  return { params, collectionHandle };
}

/* ======================================================
  FETCH PRODUCTS
====================================================== */
function fetchProducts(append = false, resetPage = false) {
  if (window.COLLECTION_AJAX.isLoading) return;
  window.COLLECTION_AJAX.isLoading = true;

  const loader = getLoaderElement();
  if (loader) loader.hidden = false;

  // Disable buttons during load
  const applyBtn = document.getElementById('applyFiltersBtn');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (applyBtn) applyBtn.disabled = true;
  if (loadMoreBtn) loadMoreBtn.disabled = true;

  if (resetPage) {
    window.COLLECTION_AJAX.currentPage = 1;
    append = false;
  }

  const { params, collectionHandle } = buildQueryParams();
  const baseUrl = collectionHandle
    ? `/collections/${collectionHandle}`
    : window.location.pathname;

  fetch(`${baseUrl}?${params.toString()}`, {
    headers: { 
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'text/html'
    }
  })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    .then(html => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const newBox = doc.querySelector('#productsContainer');
      const oldBox = getProductsContainer();
      const paginationWrapper = getPaginationWrapper();

      if (!newBox || !oldBox) {
        console.warn('Could not find products container in response');
        return;
      }

      // Update metadata
      oldBox.dataset.totalPages = newBox.dataset.totalPages || '1';
      oldBox.dataset.currentPage = newBox.dataset.currentPage || '1';
      oldBox.dataset.totalProducts = newBox.dataset.totalProducts || '0';

      // Update product count
      const filterResultCount = document.querySelector('[data-filter-result-count]');
      if (filterResultCount) {
        const totalProducts = newBox.dataset.totalProducts || '0';
        const currentPage = newBox.dataset.currentPage || '1';
        const perPage = getMainContainer()?.dataset.productsPerPage || '24';
        
        const start = ((parseInt(currentPage) - 1) * parseInt(perPage)) + 1;
        const end = Math.min(parseInt(currentPage) * parseInt(perPage), parseInt(totalProducts));
        
        if (parseInt(totalProducts) === 0) {
          filterResultCount.textContent = '0 Products Found';
        } else if (parseInt(totalProducts) <= parseInt(perPage)) {
          filterResultCount.textContent = `${totalProducts} Products Found`;
        } else {
          filterResultCount.textContent = `Showing ${start}-${end} of ${totalProducts} Products`;
        }
      }

      // Update products
      if (append) {
        oldBox.insertAdjacentHTML('beforeend', newBox.innerHTML);
      } else {
        oldBox.innerHTML = newBox.innerHTML;
      }

      // Update pagination UI
      if (paginationWrapper) {
        const newPagination = doc.querySelector('#paginationWrapper');
        if (newPagination) {
          paginationWrapper.innerHTML = newPagination.innerHTML;
        }
        
        // Hide pagination if no more pages
        const totalPages = parseInt(oldBox.dataset.totalPages || '1', 10);
        const currentPage = parseInt(oldBox.dataset.currentPage || '1', 10);
        
        if (currentPage >= totalPages) {
          if (loadMoreBtn) loadMoreBtn.style.display = 'none';
          const infinityLoader = paginationWrapper.querySelector('.pagination-ui--infinity [data-loader]');
          if (infinityLoader) infinityLoader.style.display = 'none';
        }
      }

      // Update URL without page parameter
      updateURL(params, collectionHandle);

      // Initialize product card events
      if (typeof initAllProductCartEvents === 'function') {
        setTimeout(() => {
          initAllProductCartEvents();
        }, 100);
      }

      // Update active filters display
      updateActiveFiltersDisplay();
    })
    .catch(err => {
      console.error('Filter AJAX error:', err);
      // Show error to user
      const oldBox = getProductsContainer();
      if (oldBox) {
        oldBox.innerHTML = '<div class="error-message">Sorry, there was an error loading products. Please try again.</div>';
      }
    })
    .finally(() => {
      window.COLLECTION_AJAX.isLoading = false;
      if (loader) loader.hidden = true;
      if (applyBtn) applyBtn.disabled = false;
      if (loadMoreBtn) loadMoreBtn.disabled = false;
    });
}

/* ======================================================
  FILTER / SORT TOGGLE + OFFCANVAS
====================================================== */
function initFilterToggle() {
  const sidebar = document.querySelector('.product-filter');
  const buttons = document.querySelectorAll('.filter-toggle-btn');
  const filterItems = document.querySelectorAll('.filter-item');
  const sortItem = document.querySelector('.filter-sort');
  const filterActions = document.querySelector('.filter-actions');

  if (!sidebar || !buttons.length) return;

  let activeAction = null;
  const isMobile = () => window.innerWidth <= 991;

  function hideAll() {
    filterItems.forEach(item => item.classList.add('hide'));
  }

  function showAllFilters(includeSort = false) {
    filterItems.forEach(item => {
      if (item.classList.contains('filter-sort') && !includeSort) return;
      item.classList.remove('hide');
    });
  }

  function openSidebar() {
    sidebar.classList.add('is-expanded');
    filterActions?.classList.remove('hide');

    if (isMobile()) {
      sidebar.classList.add('is-offcanvas');
      document.body.classList.add('is-filter-open');
      addOverlay();
    }
  }

  function closeSidebar() {
    sidebar.classList.remove('is-expanded', 'is-offcanvas');
    document.body.classList.remove('is-filter-open');

    hideAll();
    filterActions?.classList.add('hide');
    activeAction = null;

    removeOverlay();
  }

  function addOverlay() {
    if (document.querySelector('.filter-overlay')) return;
    const overlay = document.createElement('div');
    overlay.className = 'filter-overlay';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', closeSidebar);
  }

  function removeOverlay() {
    document.querySelector('.filter-overlay')?.remove();
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const action = btn.dataset.action;

      if (activeAction === action) {
        closeSidebar();
        return;
      }

      activeAction = action;
      hideAll();
      openSidebar();

      if (isMobile()) {
        showAllFilters(true);
        return;
      }

      if (action === 'filter') showAllFilters(false);
      if (action === 'sort' && sortItem) sortItem.classList.remove('hide');
    });
  });

  // Close on resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!isMobile() && document.body.classList.contains('is-filter-open')) {
        closeSidebar();
      }
    }, 250);
  });

  // Close on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('is-filter-open')) {
      closeSidebar();
    }
  });
}

/* ======================================================
  CLOSE FILTER UI (USED BY APPLY / CLEAR)
====================================================== */
function closeFilterUI() {
  document.querySelectorAll('.filter-item').forEach(i => i.classList.add('hide'));
  document.querySelector('.filter-actions')?.classList.add('hide');
  document.querySelector('.product-filter')
    ?.classList.remove('is-expanded', 'is-offcanvas');

  document.body.classList.remove('is-filter-open');
  document.querySelector('.filter-overlay')?.remove();
}

// Export for use in other scripts if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    updateActiveFiltersDisplay,
    removeFilter,
    clearAllFilters,
    fetchProducts
  };
}