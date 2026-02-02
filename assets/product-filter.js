document.addEventListener('DOMContentLoaded', () => {
  window.COLLECTION_AJAX = {
    currentPage: 1,
    isLoading: false
  };

  setInitialPaginationData();
  initFilters();
  initPagination();
  initMobileFilterToggle();
  initPriceRangeSlider();

  // Render pagination immediately on first load
  updatePaginationUIFromCurrentDOM();
});

/* ---------------------------
  MOBILE FILTER TOGGLE
---------------------------- */
function initMobileFilterToggle() {
  const mobileToggle = document.querySelector('.mobile-filter-toggle');
  const filtersWrapper = document.getElementById('filtersWrapper');
  const closeBtn = document.querySelector('.filters-close-btn');
  
  if (mobileToggle && filtersWrapper) {
    mobileToggle.addEventListener('click', () => {
      filtersWrapper.classList.add('active');
      document.body.classList.add('filter-open');
    });
  }
  
  if (closeBtn && filtersWrapper) {
    closeBtn.addEventListener('click', () => {
      filtersWrapper.classList.remove('active');
      document.body.classList.remove('filter-open');
    });
  }
  
  // Close filter when clicking outside on mobile
  document.addEventListener('click', (e) => {
    const filtersWrapper = document.getElementById('filtersWrapper');
    const mobileToggle = document.querySelector('.mobile-filter-toggle');
    
    if (filtersWrapper && filtersWrapper.classList.contains('active') && 
        !filtersWrapper.contains(e.target) && 
        (!mobileToggle || !mobileToggle.contains(e.target))) {
      filtersWrapper.classList.remove('active');
      document.body.classList.remove('filter-open');
    }
  });
}

/* ---------------------------
  PRICE RANGE SLIDER
---------------------------- */
function initPriceRangeSlider() {
  const minInput = document.querySelector('[data-min-input]');
  const maxInput = document.querySelector('[data-max-input]');
  const minDisplay = document.querySelector('[data-min-display]');
  const maxDisplay = document.querySelector('[data-max-display]');
  
  if (minInput && maxInput && minDisplay && maxDisplay) {
    function updatePriceDisplay() {
      const minVal = parseFloat(minInput.value);
      const maxVal = parseFloat(maxInput.value);
      
      // Ensure min doesn't exceed max
      if (minVal > maxVal) {
        minInput.value = maxVal;
        minDisplay.value = maxVal;
      }
      
      // Ensure max doesn't go below min
      if (maxVal < minVal) {
        maxInput.value = minVal;
        maxDisplay.value = minVal;
      }
      
      minDisplay.value = minInput.value;
      maxDisplay.value = maxInput.value;
    }
    
    minInput.addEventListener('input', updatePriceDisplay);
    maxInput.addEventListener('input', updatePriceDisplay);
    minDisplay.addEventListener('input', (e) => {
      minInput.value = e.target.value;
      updatePriceDisplay();
    });
    maxDisplay.addEventListener('input', (e) => {
      maxInput.value = e.target.value;
      updatePriceDisplay();
    });
  }
}

/* ---------------------------
  HELPERS
---------------------------- */
function getMainContainer() {
  return document.querySelector('.main-product-list');
}

function getPaginationWrapper() {
  return document.getElementById('paginationWrapper');
}

function getProductsContainer() {
  return document.getElementById('productsContainer');
}

function getPaginationType() {
  const main = getMainContainer();
  return main?.dataset.paginationType || 'pagination_by_number';
}

function getEnablePagination() {
  const main = getMainContainer();
  return main?.dataset.enablePagination === 'true';
}

function getLoaderElement() {
  const wrapper = getPaginationWrapper();
  if (!wrapper) return null;
  return wrapper.querySelector('[data-loader]');
}

function getLoadMoreBtn() {
  const wrapper = getPaginationWrapper();
  if (!wrapper) return null;
  return wrapper.querySelector('#loadMoreBtn');
}

/* ---------------------------
  INITIAL PAGINATION DATA
---------------------------- */
function setInitialPaginationData() {
  const productsBox = getProductsContainer();
  if (!productsBox) return;

  const page = parseInt(productsBox.dataset.currentPage || '1', 10);
  window.COLLECTION_AJAX.currentPage = page > 0 ? page : 1;
}

/* ---------------------------
  FILTERS
---------------------------- */
function initFilters() {
  const form = document.getElementById('CollectionFilters');
  if (!form) return;

  // Apply filters button
  const applyBtn = form.querySelector('.apply-filters-btn');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      applyFilters();
    });
  }

  // Clear filters button
  const clearBtn = form.querySelector('.clear-filters-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      clearFilters();
    });
  }

  // Auto-apply on input change for better UX
  const filterInputs = form.querySelectorAll('[data-filter-input]');
  filterInputs.forEach(input => {
    input.addEventListener('change', () => {
      // Small delay to allow multiple clicks (for checkboxes)
      setTimeout(() => {
        applyFilters();
      }, 100);
    });
  });
}

function applyFilters() {
  window.COLLECTION_AJAX.currentPage = 1;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Close mobile filter
  const filtersWrapper = document.getElementById('filtersWrapper');
  if (filtersWrapper) {
    filtersWrapper.classList.remove('active');
    document.body.classList.remove('filter-open');
  }
  
  fetchProducts(false, true);
}

function clearFilters() {
  const form = document.getElementById('CollectionFilters');
  if (!form) return;

  // Reset all form inputs
  form.reset();
  
  window.COLLECTION_AJAX.currentPage = 1;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Close mobile filter
  const filtersWrapper = document.getElementById('filtersWrapper');
  if (filtersWrapper) {
    filtersWrapper.classList.remove('active');
    document.body.classList.remove('filter-open');
  }
  
  fetchProducts(false, true);
}

/* ---------------------------
  PAGINATION INIT
---------------------------- */
function initPagination() {
  // Remove old scroll handlers (avoid duplicates)
  window.removeEventListener('scroll', infiniteScrollHandler);

  const type = getPaginationType();

  // Infinity scroll
  if (type === 'infinity_loading') {
    window.addEventListener('scroll', infiniteScrollHandler);
  }

  // Load more click
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#loadMoreBtn');
    if (!btn) return;

    if (window.COLLECTION_AJAX.isLoading) return;

    window.COLLECTION_AJAX.currentPage++;
    fetchProducts(true, false);
  });

  // Pagination by number click
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-page-number]');
    if (!btn) return;

    if (window.COLLECTION_AJAX.isLoading) return;

    const page = parseInt(btn.dataset.pageNumber, 10);
    if (!page) return;

    window.COLLECTION_AJAX.currentPage = page;

    // Scroll top for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });

    fetchProducts(false, false);
  });
}

/* ---------------------------
  INFINITY SCROLL HANDLER
---------------------------- */
function infiniteScrollHandler() {
  if (window.COLLECTION_AJAX.isLoading) return;

  const type = getPaginationType();
  if (type !== 'infinity_loading') return;

  const productsBox = getProductsContainer();
  if (!productsBox) return;

  const totalPages = parseInt(productsBox.dataset.totalPages || '1', 10);
  if (window.COLLECTION_AJAX.currentPage >= totalPages) return;

  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    window.COLLECTION_AJAX.currentPage++;
    fetchProducts(true, false);
  }
}

/* ---------------------------
  BUILD QUERY PARAMS
---------------------------- */
function buildQueryParams() {
  const form = document.getElementById('CollectionFilters');
  const params = new URLSearchParams();

  if (form) {
    // Get all filter inputs
    const inputs = form.querySelectorAll('[data-filter-input]');
    
    inputs.forEach(input => {
      if (input.type === 'checkbox' || input.type === 'radio') {
        if (input.checked && input.value) {
          params.append(input.name, input.value);
        }
      } else if (input.type === 'number' || input.type === 'text') {
        if (input.value) {
          // Handle price inputs (multiply by 100 for cents)
          if (input.name.includes('filter.v.price')) {
            params.append(input.name, Math.round(parseFloat(input.value) * 100));
          } else {
            params.append(input.name, input.value);
          }
        }
      }
    });
  }

  // Get collection handle from form data attribute
  const collectionHandle = form?.dataset.collectionHandle || '';

  params.set('page', window.COLLECTION_AJAX.currentPage);
  
  // Add section ID for AJAX reload
  const mainContainer = getMainContainer();
  if (mainContainer) {
    params.set('section_id', mainContainer.dataset.sectionId);
  }

  return { params, collectionHandle };
}

/* ---------------------------
  PAGINATION UI RENDER
---------------------------- */
function renderPaginationUI(totalPages) {
  if (!getEnablePagination()) return;

  const wrapper = getPaginationWrapper();
  if (!wrapper) return;

  const type = getPaginationType();

  // Hide loader always by default
  const loader = getLoaderElement();
  if (loader) loader.hidden = true;

  // -------------------------
  // Pagination by Number
  // -------------------------
  if (type === 'pagination_by_number') {
    const numbersBox = wrapper.querySelector('[data-pagination-numbers]');
    if (!numbersBox) return;

    if (!totalPages || totalPages <= 1) {
      numbersBox.innerHTML = '';
      return;
    }

    let html = '';
    for (let i = 1; i <= totalPages; i++) {
      html += `
        <button
          type="button"
          data-page-number="${i}"
          class="pagination-btn ${i === window.COLLECTION_AJAX.currentPage ? 'active' : ''}"
          ${i === window.COLLECTION_AJAX.currentPage ? 'disabled' : ''}
        >
          ${i}
        </button>
      `;
    }

    numbersBox.innerHTML = html;
    return;
  }

  // -------------------------
  // Load More Button
  // -------------------------
  if (type === 'load_more_button') {
    const btn = getLoadMoreBtn();
    if (!btn) return;

    if (!totalPages || totalPages <= 1) {
      btn.style.display = 'none';
      return;
    }

    // Hide if last page
    if (window.COLLECTION_AJAX.currentPage >= totalPages) {
      btn.style.display = 'none';
    } else {
      btn.style.display = '';
    }

    return;
  }

  // -------------------------
  // Infinity Loading
  // -------------------------
  if (type === 'infinity_loading') {
    // No UI buttons, loader will show only while fetching
    return;
  }
}

function updatePaginationUIFromCurrentDOM() {
  const productsBox = getProductsContainer();
  if (!productsBox) return;

  const totalPages = parseInt(productsBox.dataset.totalPages || '1', 10);
  const currentPage = parseInt(productsBox.dataset.currentPage || '1', 10);

  window.COLLECTION_AJAX.currentPage = currentPage > 0 ? currentPage : 1;

  renderPaginationUI(totalPages);
}

/* ---------------------------
  AJAX FETCH PRODUCTS
---------------------------- */
function fetchProducts(append = false, resetPage = false) {
  if (window.COLLECTION_AJAX.isLoading) return;
  window.COLLECTION_AJAX.isLoading = true;

  // Loader show
  const loader = getLoaderElement();
  if (loader) loader.hidden = false;

  // Disable load more button while loading
  const loadMoreBtn = getLoadMoreBtn();
  if (loadMoreBtn) loadMoreBtn.disabled = true;

  if (resetPage) {
    window.COLLECTION_AJAX.currentPage = 1;
    append = false;
  }

  const { params, collectionHandle } = buildQueryParams();

  const baseUrl = collectionHandle
    ? `/collections/${collectionHandle}`
    : window.location.pathname;

  // Build the URL
  let url = `${baseUrl}?${params.toString()}`;
  
  // Remove empty price parameters
  url = url.replace(/filter\.v\.price\.gte=&|filter\.v\.price\.lte=&/g, '');

  fetch(url, {
    method: 'GET',
    headers: { 
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'text/html'
    }
  })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.text();
    })
    .then((html) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      // Try to find the products container in the response
      const newProducts = doc.querySelector('#productsContainer');
      const oldProducts = getProductsContainer();

      if (!oldProducts || !newProducts) {
        // If AJAX fails, fallback to full page reload
        window.location.href = url;
        return;
      }

      // Replace dataset info
      oldProducts.dataset.totalPages = newProducts.dataset.totalPages || '1';
      oldProducts.dataset.currentPage = newProducts.dataset.currentPage || '1';
      oldProducts.dataset.totalProducts = newProducts.dataset.totalProducts || '';

      // Update products HTML
      if (append) {
        oldProducts.insertAdjacentHTML('beforeend', newProducts.innerHTML);
      } else {
        oldProducts.innerHTML = newProducts.innerHTML;
      }

      // Update pagination wrapper if it exists in response
      const newPagination = doc.querySelector('#paginationWrapper');
      const oldPagination = getPaginationWrapper();
      if (oldPagination && newPagination) {
        oldPagination.innerHTML = newPagination.innerHTML;
      }

      // Update pagination UI
      updatePaginationUIFromCurrentDOM();
      
      // Update URL without reload
      window.history.pushState({ path: url }, '', url);
    })
    .catch((err) => {
      console.error('AJAX fetch error:', err);
      // Fallback to page reload
      window.location.href = url;
    })
    .finally(() => {
      window.COLLECTION_AJAX.isLoading = false;

      // Hide loader
      const loader = getLoaderElement();
      if (loader) loader.hidden = true;

      // Enable load more button
      const loadMoreBtn = getLoadMoreBtn();
      if (loadMoreBtn) loadMoreBtn.disabled = false;
    });
}

// Handle browser back/forward buttons
window.addEventListener('popstate', () => {
  window.location.reload();
});