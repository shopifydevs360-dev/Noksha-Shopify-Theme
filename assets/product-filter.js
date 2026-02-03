// product-filter.js
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
  initClearAllFilters(); // Initialize clear all filters
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
    closeFilterUI();
  });
}

/* ======================================================
  SHOW FILTER RESULT FUNCTION
====================================================== */
function showFilterResult() {
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
      let text = label.textContent.trim();
      // Remove count from text (e.g., "Red (12)" becomes "Red")
      text = text.split('(')[0].trim();
      if (text) {
        activeFilters.push({
          type: input.name,
          value: input.value,
          label: text
        });
      }
    }
  });
  
  // Check radio buttons
  form.querySelectorAll('input[type="radio"]:checked').forEach(input => {
    // Skip default sort if needed
    if (input.name === 'sort_by' && input.value === 'manual') return;
    
    const label = input.closest('label');
    if (label) {
      let text = label.textContent.trim();
      text = text.split('(')[0].trim();
      if (text) {
        activeFilters.push({
          type: input.name,
          value: input.value,
          label: text
        });
      }
    }
  });
  
  // Check price range inputs
  const minPrice = form.querySelector('input[name*="price.gte"]');
  const maxPrice = form.querySelector('input[name*="price.lte"]');
  
  if ((minPrice && minPrice.value) || (maxPrice && maxPrice.value)) {
    const minVal = minPrice?.value || 0;
    const maxVal = maxPrice?.value || '∞';
    
    if (minVal > 0 || maxVal !== '∞') {
      // SIMPLIFIED PRICE FORMAT - JUST SHOW THE NUMBERS
      const minDisplay = minVal === 0 ? '0' : (minVal * 1).toFixed(2);
      const maxDisplay = maxVal === '∞' ? '∞' : (maxVal * 1).toFixed(2);
      
      activeFilters.push({
        type: 'price_range',
        value: `${minVal}-${maxVal}`,
        label: `Price: ${minDisplay} - ${maxDisplay}`
      });
    }
  }
  
  // Update UI - Show active filters
  if (activeFilters.length === 0) {
    activeFiltersContainer.innerHTML = '';
    if (clearAllBtn) clearAllBtn.classList.add('hide');
  } else {
    // Build active filters HTML
    const filtersHtml = activeFilters.map(filter => {
      // Create display text
      let displayText = filter.label;
      
      return `
        <div class="active-filter-tag" 
             data-filter-type="${filter.type}" 
             data-filter-value="${filter.value}">
          <span class="filter-label">${displayText}</span>
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
    
    // Add click event to remove buttons
    activeFiltersContainer.querySelectorAll('.active-filter-tag').forEach(tag => {
      tag.addEventListener('click', function() {
        const filterType = this.dataset.filterType;
        const filterValue = this.dataset.filterValue;
        removeSingleFilter(filterType, filterValue);
      });
    });
  }
}

/* ======================================================
  REMOVE SINGLE FILTER
====================================================== */
function removeSingleFilter(filterType, filterValue) {
  const form = document.getElementById('CollectionFilters');
  if (!form) return;
  
  // Handle price range
  if (filterType === 'price_range') {
    const minInput = form.querySelector('input[name*="price.gte"]');
    const maxInput = form.querySelector('input[name*="price.lte"]');
    if (minInput) minInput.value = '';
    if (maxInput) maxInput.value = '';
  } 
  // Handle sort by - reset to default
  else if (filterType === 'sort_by') {
    const defaultSort = form.querySelector('input[name="sort_by"][value="manual"]');
    if (defaultSort) defaultSort.checked = true;
  }
  // Handle other inputs
  else {
    const input = form.querySelector(`[name="${filterType}"][value="${CSS.escape(filterValue)}"]`);
    if (input) input.checked = false;
  }
  
  // Update UI and fetch new results
  window.COLLECTION_AJAX.currentPage = 1;
  fetchProducts(false, false);
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
  if (!form) return;
  
  // Reset form
  form.reset();
  
  // Update UI and fetch results
  window.COLLECTION_AJAX.currentPage = 1;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  fetchProducts(false, false);
  closeFilterUI();
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

  const scrollPosition = window.scrollY + window.innerHeight;
  const triggerPoint = box.offsetTop + box.offsetHeight - 80; // 👈 only 80px from bottom

  if (scrollPosition >= triggerPoint) {
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
        // Skip default sort
        if (key === 'sort_by' && value === 'manual') continue;
        params.append(key, value);
      }
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

      // Update product container data
      oldBox.dataset.totalPages = newBox.dataset.totalPages || '1';
      oldBox.dataset.currentPage = newBox.dataset.currentPage || '1';
      oldBox.dataset.totalProducts = newBox.dataset.totalProducts || '0';

      // Update products
      if (append) {
        oldBox.insertAdjacentHTML('beforeend', newBox.innerHTML);
      } else {
        oldBox.innerHTML = newBox.innerHTML;
      }

      // Update product events
      if (typeof initAllProductCartEvents === 'function') {
        initAllProductCartEvents();
      }
      
      // UPDATE THE PRODUCT COUNTER
      updateProductCounter();
      
      // Show filter result tags
      showFilterResult();
    })
    .catch(err => console.error('Filter AJAX error:', err))
    .finally(() => {
      window.COLLECTION_AJAX.isLoading = false;
      if (loader) loader.hidden = true;
    });
}

/* ======================================================
  UPDATE PRODUCT COUNTER - SIMPLIFIED
====================================================== */
function updateProductCounter() {
  const filterResultCount = document.querySelector('[data-filter-result-count]');
  const productsContainer = getProductsContainer();
  
  if (!filterResultCount || !productsContainer) return;
  
  const totalProducts = parseInt(productsContainer.dataset.totalProducts || '0', 10);
  
  // ALWAYS show "X Products Found" - never show "Showing X-Y of Z Products"
  filterResultCount.textContent = `${totalProducts} Products Found`;
}

/* ======================================================
  FILTER TOGGLE & OTHER FUNCTIONS
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

function closeFilterUI() {
  document.querySelectorAll('.filter-item').forEach(i => i.classList.add('hide'));
  document.querySelector('.filter-actions')?.classList.add('hide');
  document.querySelector('.product-filter')
    ?.classList.remove('is-expanded', 'is-offcanvas');

  document.body.classList.remove('is-filter-open');
  document.querySelector('.filter-overlay')?.remove();
}