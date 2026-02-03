document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('CollectionFilters');

  window.COLLECTION_AJAX = {
    currentPage: 1,
    isLoading: false
  };

  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });
  }

  setInitialPaginationData();
  initApplyFilters();
  initClearFilters();
  initPagination();
  initFilterToggle();
  syncFiltersWithURL(); // Add this
initRemoveSingleFilter(); // Add this
initClearAllFilters(); // Add this
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
    closeFilterUI(); // ✅ CLOSE & HIDE EVERYTHING
  });
}

/* ======================================================
  CLEAR FILTERS
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
  });
}

/* ======================================================
  PAGINATION
====================================================== */
function initPagination() {
  window.removeEventListener('scroll', infiniteScrollHandler);

  if (getPaginationType() === 'infinity_loading') {
    window.addEventListener('scroll', infiniteScrollHandler);
  }

  document.addEventListener('click', e => {
    const pageBtn = e.target.closest('[data-page-number]');
    if (pageBtn) {
      e.preventDefault();
      window.COLLECTION_AJAX.currentPage = parseInt(pageBtn.dataset.pageNumber, 10);
      fetchProducts(false, false);
    }

    const loadMoreBtn = e.target.closest('#loadMoreBtn');
    if (loadMoreBtn) {
      e.preventDefault();
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

  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
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
      if (value) params.append(key, value);
    }
  }

  const collectionHandle = params.get('collection_handle');
  params.delete('collection_handle');

  params.set('page', window.COLLECTION_AJAX.currentPage);
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

  if (resetPage) {
    window.COLLECTION_AJAX.currentPage = 1;
    append = false;
  }

  const { params, collectionHandle } = buildQueryParams();
  const baseUrl = collectionHandle
    ? `/collections/${collectionHandle}`
    : window.location.pathname;

  fetch(`${baseUrl}?${params.toString()}`, {
    headers: { 'X-Requested-With': 'XMLHttpRequest' }
  })
    .then(res => res.text())
    .then(html => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const newBox = doc.querySelector('#productsContainer');
      const oldBox = getProductsContainer();

      if (!newBox || !oldBox) return;

      oldBox.dataset.totalPages = newBox.dataset.totalPages;
      oldBox.dataset.currentPage = newBox.dataset.currentPage;

      append
        ? oldBox.insertAdjacentHTML('beforeend', newBox.innerHTML)
        : oldBox.innerHTML = newBox.innerHTML;

      if (typeof initAllProductCartEvents === 'function') {
        initAllProductCartEvents();
      }
    })
    .catch(err => console.error('Filter AJAX error:', err))
    .finally(() => {
      window.COLLECTION_AJAX.isLoading = false;
      if (loader) loader.hidden = true;
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
    btn.addEventListener('click', () => {
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
      if (action === 'sort') sortItem?.classList.remove('hide');
    });
  });

  window.addEventListener('resize', closeSidebar);
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


/* ======================================================
  ACTIVE FILTERS DISPLAY
====================================================== */
function updateActiveFiltersDisplay() {
  const form = document.getElementById('CollectionFilters');
  const activeFiltersContainer = document.querySelector('[data-active-filters]');
  const clearAllBtn = document.querySelector('[data-clear-all-filters]');
  
  if (!form || !activeFiltersContainer) return;
  
  // Get all active filter inputs
  const activeFilters = [];
  
  // Check checkboxes
  form.querySelectorAll('input[type="checkbox"]:checked').forEach(input => {
    const label = input.closest('label');
    if (label) {
      const text = label.textContent.trim();
      // Remove count from text (e.g., "Red (12)" becomes "Red")
      const filterName = text.split('(')[0].trim();
      activeFilters.push({
        type: input.name,
        value: input.value,
        label: filterName,
        element: input
      });
    }
  });
  
  // Check radio buttons
  form.querySelectorAll('input[type="radio"]:checked').forEach(input => {
    const label = input.closest('label');
    if (label) {
      const text = label.textContent.trim();
      activeFilters.push({
        type: input.name,
        value: input.value,
        label: text,
        element: input
      });
    }
  });
  
  // Check price range inputs
  const minPrice = form.querySelector('input[name^="filter.v.price.gte"]');
  const maxPrice = form.querySelector('input[name^="filter.v.price.lte"]');
  
  if (minPrice?.value || maxPrice?.value) {
    const minVal = minPrice?.value || 0;
    const maxVal = maxPrice?.value || '∞';
    activeFilters.push({
      type: 'price',
      value: `${minVal}-${maxVal}`,
      label: `Price: ${formatCurrency(minVal)} - ${formatCurrency(maxVal)}`,
      element: minPrice || maxPrice
    });
  }
  
  // Check sort by
  const sortBy = form.querySelector('input[name="sort_by"]:checked');
  if (sortBy && sortBy.value !== collectionDefaultSort) {
    const label = sortBy.closest('label');
    if (label) {
      const text = label.textContent.trim();
      activeFilters.push({
        type: 'sort_by',
        value: sortBy.value,
        label: `Sort: ${text}`,
        element: sortBy
      });
    }
  }
  
  // Update UI
  if (activeFilters.length === 0) {
    activeFiltersContainer.innerHTML = '';
    clearAllBtn?.classList.add('hide');
  } else {
    // Build active filters HTML
    const filtersHtml = activeFilters.map(filter => `
      <div class="active-filter-tag" 
           data-filter-type="${filter.type}" 
           data-filter-value="${filter.value}"
           data-action="remove-filter">
        <span class="filter-label">${filter.label}</span>
        <span class="remove-icon">
          {%- render 'theme-icon', icon: 'close' -%}
        </span>
      </div>
    `).join('');
    
    activeFiltersContainer.innerHTML = filtersHtml;
    clearAllBtn?.classList.remove('hide');
  }
}

// Helper function to format currency (adjust based on your shop)
function formatCurrency(value) {
  if (value === '∞' || value === '') return '∞';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value / 100);
}

/* ======================================================
  REMOVE SINGLE FILTER
====================================================== */
function initRemoveSingleFilter() {
  document.addEventListener('click', (e) => {
    const filterTag = e.target.closest('[data-action="remove-filter"]');
    if (!filterTag) return;
    
    e.preventDefault();
    
    const filterType = filterTag.dataset.filterType;
    const filterValue = filterTag.dataset.filterValue;
    
    removeFilter(filterType, filterValue);
  });
}

function removeFilter(filterType, filterValue) {
  const form = document.getElementById('CollectionFilters');
  if (!form) return;
  
  // Find and uncheck/unset the filter
  if (filterType === 'price') {
    // Handle price range
    const minInput = form.querySelector('input[name^="filter.v.price.gte"]');
    const maxInput = form.querySelector('input[name^="filter.v.price.lte"]');
    if (minInput) minInput.value = '';
    if (maxInput) maxInput.value = '';
  } else {
    // Handle checkboxes and radios
    const inputs = form.querySelectorAll(`[name="${filterType}"]`);
    inputs.forEach(input => {
      if (input.value === filterValue || 
          (filterType.includes('.tag') && input.value.includes(filterValue))) {
        input.checked = false;
      }
    });
  }
  
  // Update UI and fetch new results
  window.COLLECTION_AJAX.currentPage = 1;
  fetchProducts(false, false);
  updateActiveFiltersDisplay();
}

/* ======================================================
  CLEAR ALL FILTERS
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
  if (!form) return;
  
  // Reset form
  form.reset();
  
  // Clear URL parameters and reload
  const url = new URL(window.location.href);
  url.search = '';
  history.replaceState({}, '', url);
  
  // Update UI and fetch results
  window.COLLECTION_AJAX.currentPage = 1;
  fetchProducts(false, false);
  updateActiveFiltersDisplay();
}

/* ======================================================
  URL SYNC FUNCTIONS
====================================================== */
function syncFiltersWithURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const form = document.getElementById('CollectionFilters');
  if (!form) return;
  
  // Reset form first
  form.reset();
  
  // Apply filters from URL
  urlParams.forEach((value, key) => {
    if (key === 'page') return;
    
    // Handle checkboxes (multiple values for same key)
    if (key.includes('filter.v.')) {
      const values = urlParams.getAll(key);
      values.forEach(val => {
        const input = form.querySelector(`[name="${key}"][value="${val}"]`);
        if (input) input.checked = true;
      });
    }
    // Handle radios (single value)
    else {
      const input = form.querySelector(`[name="${key}"][value="${value}"]`);
      if (input) input.checked = true;
    }
  });
  
  // Update UI
  updateActiveFiltersDisplay();
}

/* ======================================================
  UPDATE FETCH PRODUCTS TO INCLUDE ACTIVE FILTERS UPDATE
====================================================== */
function fetchProducts(append = false, resetPage = false) {
  if (window.COLLECTION_AJAX.isLoading) return;
  window.COLLECTION_AJAX.isLoading = true;
  
  // ... [your existing fetchProducts code] ...
  
  fetch(`${baseUrl}?${params.toString()}`, {
    headers: { 'X-Requested-With': 'XMLHttpRequest' }
  })
    .then(res => res.text())
    .then(html => {
      // ... [your existing success code] ...
      
      // Update URL
      updateURL(params, collectionHandle);
      
      // Update active filters display
      updateActiveFiltersDisplay();
    })
    .catch(err => console.error('Filter AJAX error:', err))
    .finally(() => {
      window.COLLECTION_AJAX.isLoading = false;
      if (loader) loader.hidden = true;
    });
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
  
  if (params.toString()) {
    url.search = params.toString();
  }
  
  history.replaceState({}, '', url.toString());
}

/* ======================================================
  INITIALIZE ALL
====================================================== */
document.addEventListener('DOMContentLoaded', () => {
  // ... [your existing initialization] ...
  
  // New initializations
  syncFiltersWithURL(); // Sync filters on page load
  initRemoveSingleFilter();
  initClearAllFilters();
  
  // Also update active filters when filter toggles change
  const form = document.getElementById('CollectionFilters');
  if (form) {
    form.addEventListener('change', () => {
      updateActiveFiltersDisplay();
    });
  }
});