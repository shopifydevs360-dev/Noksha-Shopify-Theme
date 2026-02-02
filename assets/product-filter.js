document.addEventListener('DOMContentLoaded', () => {
  window.COLLECTION_AJAX = {
    currentPage: 1,
    isLoading: false
  };

  setInitialPaginationData();
  initFilters();
  initPagination();

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

  // Handle form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    window.COLLECTION_AJAX.currentPage = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchProducts(false, true);
  });

  // Handle individual changes (for instant filtering if desired)
  const filterInputs = form.querySelectorAll('input[type="checkbox"], input[type="radio"]');
  filterInputs.forEach(input => {
    input.addEventListener('change', () => {
      // Optional: Add debounce here for better performance
      window.COLLECTION_AJAX.currentPage = 1;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      fetchProducts(false, true);
    });
  });

  const clearBtn = document.getElementById('clearFiltersBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      // Reset all form inputs
      const allInputs = form.querySelectorAll('input[type="checkbox"], input[type="radio"], input[type="number"]');
      allInputs.forEach(input => {
        if (input.type === 'checkbox' || input.type === 'radio') {
          input.checked = false;
        } else if (input.type === 'number') {
          input.value = '';
        }
      });

      // Special handling for collection handle radio
      const allCollectionRadios = form.querySelectorAll('input[name="collection_handle"]');
      if (allCollectionRadios.length > 0) {
        allCollectionRadios[allCollectionRadios.length - 1].checked = true; // Check "All" option
      }

      window.COLLECTION_AJAX.currentPage = 1;
      window.scrollTo({ top: 0, behavior: 'smooth' });

      fetchProducts(false, true);
    });
  }
}

/* ---------------------------
  PAGINATION INIT
---------------------------- */
function initPagination() {
  // remove old scroll handlers (avoid duplicates)
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
    if (!page || page < 1) return;

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

    // Handle collection handle separately
    const collectionHandle = formData.get('collection_handle');
    formData.delete('collection_handle');

    // Add all other form data to params
    for (const [key, value] of formData.entries()) {
      if (value === '' || value == null) continue;
      
      // Special handling for price filters (convert to cents)
      if (key.includes('filter.v.price')) {
        const cents = Math.round(parseFloat(value) * 100);
        if (!isNaN(cents)) {
          params.append(key, cents.toString());
        }
      } else {
        params.append(key, value);
      }
    }

    params.set('page', window.COLLECTION_AJAX.currentPage);
    params.set('section_id', getMainContainer()?.dataset.sectionId || '');

    return { params, collectionHandle };
  }

  // Default params if no form
  const params = new URLSearchParams();
  params.set('page', window.COLLECTION_AJAX.currentPage);
  params.set('section_id', getMainContainer()?.dataset.sectionId || '');
  
  return { params, collectionHandle: null };
}

/* ---------------------------
  PAGINATION UI RENDER (LIQUID UI BASE)
---------------------------- */
function renderPaginationUI(totalPages) {
  if (!getEnablePagination()) return;

  const wrapper = getPaginationWrapper();
  if (!wrapper) return;

  const type = getPaginationType();

  // hide loader always by default
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
      html += `<span class="ellipsis">...</span>`;
    }
    
    // Show pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
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
      html += `<span class="ellipsis">...</span>`;
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
    // no UI buttons, loader will show only while fetching
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

  // disable load more button while loading
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

  fetch(`${baseUrl}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'X-Requested-With': 'XMLHttpRequest'
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
        console.error('Could not find products container');
        return;
      }

      // Replace dataset info (important)
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
      
      // Update URL without reloading page
      const newUrl = `${baseUrl}?${params.toString()}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    })
    .catch((err) => {
      console.error('AJAX fetch error:', err);
      // Show error message to user
      const oldProducts = getProductsContainer();
      if (oldProducts && !append) {
        oldProducts.innerHTML = '<div class="error-message"><p>Failed to load products. Please try again.</p></div>';
      }
    })
    .finally(() => {
      window.COLLECTION_AJAX.isLoading = false;

      // hide loader
      if (loader) loader.hidden = true;

      // enable load more button
      if (loadMoreBtn) loadMoreBtn.disabled = false;
    });
}

// Handle browser back/forward buttons
window.addEventListener('popstate', function(event) {
  // Parse URL and update filters/pagination accordingly
  const urlParams = new URLSearchParams(window.location.search);
  const page = parseInt(urlParams.get('page') || '1', 10);
  window.COLLECTION_AJAX.currentPage = page;
  
  // You would need to update form inputs based on URL params here
  // This is a more advanced feature that would require additional logic
  
  fetchProducts(false, false);
});