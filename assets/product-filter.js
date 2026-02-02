/*- comment - File Name: product-filter.js -*/
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
  form.addEventListener('change', () => {
    // Reset page
    window.COLLECTION_AJAX.currentPage = 1;
    // Reset scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchProducts(false, true);
  });
  const clearBtn = document.getElementById('clearFiltersBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      form.reset();
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
    // allow multiple values
    for (const [key, value] of formData.entries()) {
      if (value === '' || value == null) continue;
      params.append(key, value);
    }
  }
  // collection handle logic
  const collectionHandle = params.get('collection_handle');
  params.delete('collection_handle');
  params.set('page', window.COLLECTION_AJAX.currentPage);
  return { params, collectionHandle };
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
    for (let i = 1; i <= totalPages; i++) {
      html += `
        <button
          type="button"
          data-page-number="${i}"
          class="${i === window.COLLECTION_AJAX.currentPage ? 'active' : ''}"
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
    headers: { 'X-Requested-With': 'XMLHttpRequest' }
  })
    .then((res) => res.text())
    .then((html) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const newProducts = doc.querySelector('#productsContainer');
      const oldProducts = getProductsContainer();
      if (!oldProducts || !newProducts) return;
      // Replace dataset info (important)
      oldProducts.dataset.totalPages = newProducts.dataset.totalPages || '1';
      oldProducts.dataset.currentPage = newProducts.dataset.currentPage || '1';
      oldProducts.dataset.totalProducts = newProducts.dataset.totalProducts || '';
      // Update products HTML
      if (append) {
        oldProducts.insertAdjacentHTML('beforeend', newProducts.innerHTML);
      } else {
        oldProducts.innerHTML = newProducts.innerHTML;
      }
      // Update pagination UI
      updatePaginationUIFromCurrentDOM();
    })
    .catch((err) => {
      console.error('AJAX fetch error:', err);
    })
    .finally(() => {
      window.COLLECTION_AJAX.isLoading = false;
      // hide loader
      const loader = getLoaderElement();
      if (loader) loader.hidden = true;
      // enable load more button
      const loadMoreBtn = getLoadMoreBtn();
      if (loadMoreBtn) loadMoreBtn.disabled = false;
    });
}