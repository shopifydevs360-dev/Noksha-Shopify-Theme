document.addEventListener('DOMContentLoaded', () => {
  window.COLLECTION_AJAX = {
    currentPage: 1,
    isLoading: false,
    currentCollectionHandle: window.location.pathname.split('/').pop() || ''
  };

  setInitialPaginationData();
  initFilters();
  initPagination();
  updateURLState();

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

function getApplyFiltersBtn() {
  return document.getElementById('applyFiltersBtn');
}

/* ---------------------------
  INITIAL PAGINATION DATA
---------------------------- */
function setInitialPaginationData() {
  const productsBox = getProductsContainer();
  if (!productsBox) return;

  const page = parseInt(productsBox.dataset.currentPage || '1', 10);
  window.COLLECTION_AJAX.currentPage = page > 0 ? page : 1;
  
  // Get collection handle from URL
  const pathParts = window.location.pathname.split('/');
  const handle = pathParts[pathParts.length - 1];
  if (handle && handle !== 'collections') {
    window.COLLECTION_AJAX.currentCollectionHandle = handle;
  }
}

/* ---------------------------
  FILTERS
---------------------------- */
function initFilters() {
  const form = document.getElementById('CollectionFilters');
  if (!form) return;

  // Apply filters button
  const applyBtn = getApplyFiltersBtn();
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      window.COLLECTION_AJAX.currentPage = 1;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      fetchProducts(false, true);
    });
  }

  // Auto-apply for some filters (radio buttons)
  form.addEventListener('change', (e) => {
    const target = e.target;
    
    // Auto-apply for collection handles (radio buttons)
    if (target.name === 'collection_handle') {
      window.COLLECTION_AJAX.currentPage = 1;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      fetchProducts(false, true);
    }
  });

  const clearBtn = document.getElementById('clearFiltersBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      form.reset();
      window.COLLECTION_AJAX.currentPage = 1;
      window.COLLECTION_AJAX.currentCollectionHandle = '';
      
      // Clear URL parameters
      const url = new URL(window.location);
      url.search = '';
      window.history.replaceState({}, '', url);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
      fetchProducts(false, true);
    });
  }
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

    // Handle special cases
    for (const [key, value] of formData.entries()) {
      if (value === '' || value == null) continue;
      
      // Collection handle - set as new collection
      if (key === 'collection_handle' && value) {
        window.COLLECTION_AJAX.currentCollectionHandle = value;
        continue;
      }
      
      // Price filter - convert to cents
      if (key.includes('filter.v.price')) {
        params.append(key, Math.round(value * 100));
      } else {
        params.append(key, value);
      }
    }
  }

  // Add page parameter
  params.set('page', window.COLLECTION_AJAX.currentPage);

  return { params };
}

/* ---------------------------
  UPDATE URL STATE
---------------------------- */
function updateURLState() {
  const form = document.getElementById('CollectionFilters');
  if (!form) return;

  form.addEventListener('change', () => {
    const params = new URLSearchParams();
    const formData = new FormData(form);
    
    for (const [key, value] of formData.entries()) {
      if (value && value !== '') {
        params.append(key, value);
      }
    }
    
    const url = new URL(window.location);
    url.search = params.toString();
    window.history.replaceState({}, '', url);
  });
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
      wrapper.style.display = 'none';
      return;
    }

    wrapper.style.display = '';
    let html = '';
    const currentPage = window.COLLECTION_AJAX.currentPage;
    
    // Always show first page
    html += `
      <button
        type="button"
        data-page-number="1"
        class="${1 === currentPage ? 'active' : ''}"
      >
        1
      </button>
    `;

    // Show ellipsis if needed
    if (currentPage > 3) {
      html += `<span class="pagination-ellipsis">...</span>`;
    }

    // Show pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i === 1 || i === totalPages) continue;
      html += `
        <button
          type="button"
          data-page-number="${i}"
          class="${i === currentPage ? 'active' : ''}"
        >
          ${i}
        </button>
      `;
    }

    // Show ellipsis if needed
    if (currentPage < totalPages - 2) {
      html += `<span class="pagination-ellipsis">...</span>`;
    }

    // Always show last page if there is more than 1 page
    if (totalPages > 1) {
      html += `
        <button
          type="button"
          data-page-number="${totalPages}"
          class="${totalPages === currentPage ? 'active' : ''}"
        >
          ${totalPages}
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
      wrapper.style.display = 'none';
      return;
    }

    wrapper.style.display = '';
    
    // Hide if last page
    if (window.COLLECTION_AJAX.currentPage >= totalPages) {
      btn.style.display = 'none';
    } else {
      btn.style.display = '';
      btn.textContent = 'Load More';
    }
    return;
  }

  // -------------------------
  // Infinity Loading
  // -------------------------
  if (type === 'infinity_loading') {
    if (!totalPages || totalPages <= 1) {
      wrapper.style.display = 'none';
    } else {
      wrapper.style.display = '';
    }
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
function fetchProducts(append = false, updateURL = false) {
  if (window.COLLECTION_AJAX.isLoading) return;
  window.COLLECTION_AJAX.isLoading = true;

  // Loader show
  const loader = getLoaderElement();
  if (loader) loader.hidden = false;

  // Disable load more button while loading
  const loadMoreBtn = getLoadMoreBtn();
  if (loadMoreBtn) loadMoreBtn.disabled = true;

  const { params } = buildQueryParams();

  // Determine collection URL
  let collectionUrl = '/collections/all';
  if (window.COLLECTION_AJAX.currentCollectionHandle) {
    collectionUrl = `/collections/${window.COLLECTION_AJAX.currentCollectionHandle}`;
  } else {
    const pathParts = window.location.pathname.split('/');
    if (pathParts.includes('collections') && pathParts.length > 2) {
      collectionUrl = window.location.pathname;
    }
  }

  // Build complete URL
  const url = `${collectionUrl}?${params.toString()}&section_id={{ section.id }}`;

  fetch(url, {
    method: 'GET',
    headers: { 
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/json'
    }
  })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.text();
    })
    .then((html) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      const newProducts = doc.querySelector('#productsContainer');
      const oldProducts = getProductsContainer();

      if (!oldProducts || !newProducts) {
        // Handle empty results
        const productsGrid = document.querySelector('.products-grid');
        if (productsGrid) {
          productsGrid.innerHTML = '<p class="no-products-found">No products match your filters.</p>';
        }
        return;
      }

      // Replace dataset info
      oldProducts.dataset.totalPages = newProducts.dataset.totalPages || '1';
      oldProducts.dataset.currentPage = newProducts.dataset.currentPage || '1';
      oldProducts.dataset.totalProducts = newProducts.dataset.totalProducts || '0';

      // Update products HTML
      if (append) {
        oldProducts.insertAdjacentHTML('beforeend', newProducts.innerHTML);
      } else {
        oldProducts.innerHTML = newProducts.innerHTML;
      }

      // Update URL if needed
      if (updateURL) {
        const newUrl = new URL(window.location.origin + collectionUrl);
        params.forEach((value, key) => {
          if (key !== 'page' || value !== '1') {
            newUrl.searchParams.set(key, value);
          }
        });
        window.history.replaceState({}, '', newUrl);
      }

      // Update pagination UI
      updatePaginationUIFromCurrentDOM();
      
      // Dispatch custom event for any external listeners
      document.dispatchEvent(new CustomEvent('collection:filtered', {
        detail: { 
          totalProducts: oldProducts.dataset.totalProducts,
          currentPage: window.COLLECTION_AJAX.currentPage
        }
      }));
    })
    .catch((err) => {
      console.error('AJAX fetch error:', err);
      // Show error message to user
      const errorElement = document.createElement('div');
      errorElement.className = 'filter-error-message';
      errorElement.textContent = 'Failed to load products. Please try again.';
      
      const productsContainer = getProductsContainer();
      if (productsContainer) {
        productsContainer.innerHTML = '';
        productsContainer.appendChild(errorElement);
      }
    })
    .finally(() => {
      window.COLLECTION_AJAX.isLoading = false;

      // Hide loader
      if (loader) loader