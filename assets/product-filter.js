document.addEventListener('DOMContentLoaded', () => {
  window.COLLECTION_AJAX = {
    currentPage: 1,
    isLoading: false,
    isMobileFilterOpen: false
  };

  setInitialPaginationData();
  initFilters();
  initPagination();
  initMobileFilterToggle();

  // Render pagination immediately on first load
  updatePaginationUIFromCurrentDOM();
});

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

function getFiltersWrapper() {
  return document.querySelector('.filters-wrapper');
}

/* ---------------------------
  MOBILE FILTER TOGGLE
---------------------------- */
function initMobileFilterToggle() {
  const mobileToggle = document.querySelector('.mobile-filter-toggle');
  const filtersWrapper = getFiltersWrapper();
  const closeBtn = filtersWrapper?.querySelector('.filters-close-btn');

  if (mobileToggle && filtersWrapper) {
    mobileToggle.addEventListener('click', () => {
      filtersWrapper.classList.add('active');
      document.body.classList.add('filter-open');
      window.COLLECTION_AJAX.isMobileFilterOpen = true;
    });
  }

  if (closeBtn && filtersWrapper) {
    closeBtn.addEventListener('click', () => {
      filtersWrapper.classList.remove('active');
      document.body.classList.remove('filter-open');
      window.COLLECTION_AJAX.isMobileFilterOpen = false;
    });
  }

  // Close filter when clicking outside on mobile
  document.addEventListener('click', (e) => {
    const filtersWrapper = getFiltersWrapper();
    if (!filtersWrapper || !window.COLLECTION_AJAX.isMobileFilterOpen) return;

    const isClickInsideFilter = filtersWrapper.contains(e.target);
    const isToggleButton = e.target.closest('.mobile-filter-toggle');

    if (!isClickInsideFilter && !isToggleButton && window.innerWidth <= 749) {
      filtersWrapper.classList.remove('active');
      document.body.classList.remove('filter-open');
      window.COLLECTION_AJAX.isMobileFilterOpen = false;
    }
  });
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

  // Price range slider functionality
  initPriceSliders(form);

  // Filter form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    applyFilters();
  });

  // Real-time filtering on change (optional - you might want to remove this if using submit button)
  form.addEventListener('change', () => {
    // Debounce the filter application
    clearTimeout(window.filterTimeout);
    window.filterTimeout = setTimeout(() => {
      applyFilters();
    }, 300);
  });

  const clearBtn = document.getElementById('clearFiltersBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      form.reset();
      window.COLLECTION_AJAX.currentPage = 1;
      
      // Reset price sliders
      const priceSliders = form.querySelectorAll('.price-slider');
      priceSliders.forEach(slider => {
        if (slider.hasAttribute('data-min-input')) {
          slider.value = slider.min;
        } else if (slider.hasAttribute('data-max-input')) {
          slider.value = slider.max;
        }
      });
      
      applyFilters();
    });
  }
}

function initPriceSliders(form) {
  const minSlider = form.querySelector('[data-min-input]');
  const maxSlider = form.querySelector('[data-max-input]');
  const minInput = form.querySelector('.price-min-input');
  const maxInput = form.querySelector('.price-max-input');

  if (minSlider && maxSlider && minInput && maxInput) {
    // Update input when slider changes
    minSlider.addEventListener('input', () => {
      minInput.value = minSlider.value;
    });

    maxSlider.addEventListener('input', () => {
      maxInput.value = maxSlider.value;
    });

    // Update slider when input changes
    minInput.addEventListener('input', () => {
      minSlider.value = minInput.value;
    });

    maxInput.addEventListener('input', () => {
      maxSlider.value = maxInput.value;
    });
  }
}

function applyFilters() {
  // Close mobile filter on apply
  if (window.COLLECTION_AJAX.isMobileFilterOpen) {
    const filtersWrapper = getFiltersWrapper();
    if (filtersWrapper) {
      filtersWrapper.classList.remove('active');
      document.body.classList.remove('filter-open');
      window.COLLECTION_AJAX.isMobileFilterOpen = false;
    }
  }

  window.COLLECTION_AJAX.currentPage = 1;
  window.scrollTo({ top: 0, behavior: 'smooth' });
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
    const formData = new FormData(form);

    // Handle collection handle (radio button)
    const collectionHandle = form.querySelector('input[name="collection_handle"]:checked');
    if (collectionHandle && collectionHandle.value) {
      params.set('collection_handle', collectionHandle.value);
    }

    // Handle other form fields
    for (const [key, value] of formData.entries()) {
      if (value === '' || value == null || key === 'collection_handle') continue;
      
      // Convert price values from dollars to cents
      if (key.includes('filter.v.price')) {
        params.append(key, Math.round(value * 100));
      } else {
        params.append(key, value);
      }
    }
  }

  params.set('page', window.COLLECTION_AJAX.currentPage);
  params.set('view', 'ajax'); // Helps identify AJAX requests

  return params.toString();
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

  // Pagination by Number
  if (type === 'pagination_by_number') {
    const numbersBox = wrapper.querySelector('[data-pagination-numbers]');
    if (!numbersBox) return;

    if (!totalPages || totalPages <= 1) {
      numbersBox.innerHTML = '';
      return;
    }

    let html = '';
    const currentPage = window.COLLECTION_AJAX.currentPage;
    const maxVisible = 5;

    // Previous button
    if (currentPage > 1) {
      html += `
        <button type="button" data-page-number="${currentPage - 1}" class="pagination-btn prev" aria-label="Previous page">
          &laquo;
        </button>
      `;
    }

    // Page numbers
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      html += `
        <button
          type="button"
          data-page-number="${i}"
          class="pagination-btn ${i === currentPage ? 'active' : ''}"
          aria-label="Page ${i}"
          ${i === currentPage ? 'aria-current="page"' : ''}
        >
          ${i}
        </button>
      `;
    }

    // Next button
    if (currentPage < totalPages) {
      html += `
        <button type="button" data-page-number="${currentPage + 1}" class="pagination-btn next" aria-label="Next page">
          &raquo;
        </button>
      `;
    }

    numbersBox.innerHTML = html;
    return;
  }

  // Load More Button
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
      btn.textContent = 'Load More';
    }

    return;
  }

  // Infinity Loading
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

  // Show loader
  const loader = getLoaderElement();
  if (loader) loader.hidden = false;

  // Disable load more button while loading
  const loadMoreBtn = getLoadMoreBtn();
  if (loadMoreBtn) {
    loadMoreBtn.disabled = true;
    if (getPaginationType() === 'load_more_button') {
      loadMoreBtn.textContent = 'Loading...';
    }
  }

  if (resetPage) {
    window.COLLECTION_AJAX.currentPage = 1;
    append = false;
  }

  const queryParams = buildQueryParams();
  const url = `${window.location.pathname}?${queryParams}`;

  fetch(url, {
    method: 'GET',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'text/html'
    }
  })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    .then((html) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');

      const newProducts = doc.querySelector('#productsContainer');
      const oldProducts = getProductsContainer();

      if (!oldProducts || !newProducts) {
        console.error('Could not find products container');
        return;
      }

      // Update dataset info
      oldProducts.dataset.totalPages = newProducts.dataset.totalPages || '1';
      oldProducts.dataset.currentPage = newProducts.dataset.currentPage || '1';
      oldProducts.dataset.totalProducts = newProducts.dataset.totalProducts || '0';

      // Update products HTML
      if (append) {
        oldProducts.insertAdjacentHTML('beforeend', newProducts.innerHTML);
      } else {
        oldProducts.innerHTML = newProducts.innerHTML;
      }

      // Update pagination UI
      updatePaginationUIFromCurrentDOM();

      // Update URL without reloading
      updateURL(queryParams);
    })
    .catch((err) => {
      console.error('AJAX fetch error:', err);
      // Fallback to normal page load
      window.location.href = url;
    })
    .finally(() => {
      window.COLLECTION_AJAX.isLoading = false;

      // Hide loader
      if (loader) loader.hidden = true;

      // Enable load more button
      if (loadMoreBtn) {
        loadMoreBtn.disabled = false;
        if (getPaginationType() === 'load_more_button') {
          loadMoreBtn.textContent = 'Load More';
        }
      }
    });
}

/* ---------------------------
  UPDATE URL WITHOUT RELOAD
---------------------------- */
function updateURL(queryParams) {
  const newUrl = `${window.location.pathname}?${queryParams}`;
  window.history.replaceState({ path: newUrl }, '', newUrl);
}