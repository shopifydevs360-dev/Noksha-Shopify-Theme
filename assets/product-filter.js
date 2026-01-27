document.addEventListener('DOMContentLoaded', () => {
  window.COLLECTION_AJAX = {
    currentPage: 1,
    isLoading: false
  };

  // 🔒 price filter interaction guard
  window.PRICE_FILTER_USED = false;

  setInitialPaginationData();
  initFilters();
  initPagination();
  updatePaginationUIFromCurrentDOM();
});

/* ===========================
  HELPERS
=========================== */
function getMainContainer() {
  return document.querySelector('.main-product-list');
}

function getProductsContainer() {
  return document.getElementById('productsContainer');
}

function getFiltersContainer() {
  return document.getElementById('CollectionFilters');
}

function getPaginationWrapper() {
  return document.getElementById('paginationWrapper');
}

function getPaginationType() {
  return getMainContainer()?.dataset.paginationType || 'pagination_by_number';
}

function getEnablePagination() {
  return getMainContainer()?.dataset.enablePagination === 'true';
}

function getLoaderElement() {
  return getPaginationWrapper()?.querySelector('[data-loader]');
}

function getLoadMoreBtn() {
  return getPaginationWrapper()?.querySelector('#loadMoreBtn');
}

/* ===========================
  INITIAL PAGINATION DATA
=========================== */
function setInitialPaginationData() {
  const products = getProductsContainer();
  if (!products) return;

  const page = parseInt(products.dataset.currentPage || '1', 10);
  window.COLLECTION_AJAX.currentPage = page > 0 ? page : 1;
}

/* ===========================
  FILTERS (PRICE SAFE)
=========================== */
function initFilters() {
  const form = getFiltersContainer();
  if (!form) return;

  let debounceTimer = null;

  // ✅ detect real price interaction only
  form.addEventListener('input', (e) => {
    if (e.target.name?.includes('filter.v.price')) {
      window.PRICE_FILTER_USED = true;
    }
  });

  form.addEventListener('change', (e) => {
    window.COLLECTION_AJAX.currentPage = 1;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      fetchProducts({ replaceFilters: true });
    }, e.target.name?.includes('filter.v.price') ? 400 : 0);
  });

  const clearBtn = document.getElementById('clearFiltersBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = window.location.pathname;
    });
  }
}

/* ===========================
  PAGINATION
=========================== */
function initPagination() {
  window.removeEventListener('scroll', infiniteScrollHandler);

  if (getPaginationType() === 'infinity_loading') {
    window.addEventListener('scroll', infiniteScrollHandler);
  }

  document.addEventListener('click', (e) => {
    const loadMore = e.target.closest('#loadMoreBtn');
    if (loadMore && !window.COLLECTION_AJAX.isLoading) {
      window.COLLECTION_AJAX.currentPage++;
      fetchProducts({ append: true });
    }

    const pageBtn = e.target.closest('[data-page-number]');
    if (pageBtn && !window.COLLECTION_AJAX.isLoading) {
      window.COLLECTION_AJAX.currentPage = parseInt(
        pageBtn.dataset.pageNumber,
        10
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      fetchProducts();
    }
  });
}

function infiniteScrollHandler() {
  if (window.COLLECTION_AJAX.isLoading) return;
  if (getPaginationType() !== 'infinity_loading') return;

  const products = getProductsContainer();
  const totalPages = parseInt(products?.dataset.totalPages || '1', 10);
  if (window.COLLECTION_AJAX.currentPage >= totalPages) return;

  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
    window.COLLECTION_AJAX.currentPage++;
    fetchProducts({ append: true });
  }
}

/* ===========================
  QUERY PARAMS (PRICE GUARD)
=========================== */
function buildQueryParams() {
  const form = getFiltersContainer();
  const params = new URLSearchParams();

  if (form) {
    const formData = new FormData(form);

    for (const [key, value] of formData.entries()) {
      if (!value) continue;

      // 🚨 HARD PRICE FILTER GUARD
      if (key.includes('filter.v.price')) {
        if (!window.PRICE_FILTER_USED) continue;

        const numeric = parseFloat(value);

        // block browser auto-filled defaults
        if (isNaN(numeric) || numeric <= 0) continue;

        params.append(key, numeric);
      } else {
        params.append(key, value);
      }
    }
  }

  const collectionHandle = params.get('collection_handle');
  params.delete('collection_handle');

  params.set('page', window.COLLECTION_AJAX.currentPage);

  return { params, collectionHandle };
}

/* ===========================
  PAGINATION UI
=========================== */
function renderPaginationUI(totalPages) {
  if (!getEnablePagination()) return;

  const wrapper = getPaginationWrapper();
  if (!wrapper) return;

  const type = getPaginationType();
  const loader = getLoaderElement();
  if (loader) loader.hidden = true;

  if (type === 'pagination_by_number') {
    const box = wrapper.querySelector('[data-pagination-numbers]');
    if (!box) return;

    box.innerHTML = '';
    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
      box.innerHTML += `
        <button
          type="button"
          data-page-number="${i}"
          class="${i === window.COLLECTION_AJAX.currentPage ? 'active' : ''}"
        >${i}</button>
      `;
    }
  }

  if (type === 'load_more_button') {
    const btn = getLoadMoreBtn();
    if (!btn) return;

    btn.style.display =
      window.COLLECTION_AJAX.currentPage >= totalPages ? 'none' : '';
  }
}

function updatePaginationUIFromCurrentDOM() {
  const products = getProductsContainer();
  if (!products) return;

  const totalPages = parseInt(products.dataset.totalPages || '1', 10);
  const currentPage = parseInt(products.dataset.currentPage || '1', 10);

  window.COLLECTION_AJAX.currentPage = currentPage;
  renderPaginationUI(totalPages);
}

/* ===========================
  FETCH PRODUCTS
=========================== */
function fetchProducts({
  append = false,
  replaceFilters = false
} = {}) {
  if (window.COLLECTION_AJAX.isLoading) return;
  window.COLLECTION_AJAX.isLoading = true;

  const loader = getLoaderElement();
  if (loader) loader.hidden = false;

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

      const newProducts = doc.getElementById('productsContainer');
      const oldProducts = getProductsContainer();
      if (!newProducts || !oldProducts) return;

      oldProducts.dataset.totalPages = newProducts.dataset.totalPages || '1';
      oldProducts.dataset.currentPage = newProducts.dataset.currentPage || '1';

      if (append) {
        oldProducts.insertAdjacentHTML('beforeend', newProducts.innerHTML);
      } else {
        oldProducts.innerHTML = newProducts.innerHTML;
      }

      if (replaceFilters) {
        const newFilters = doc.getElementById('CollectionFilters');
        const oldFilters = getFiltersContainer();
        if (newFilters && oldFilters) {
          oldFilters.innerHTML = newFilters.innerHTML;
        }
      }

      updatePaginationUIFromCurrentDOM();
    })
    .catch(err => {
      console.error('AJAX filter error:', err);
    })
    .finally(() => {
      window.COLLECTION_AJAX.isLoading = false;
      if (loader) loader.hidden = true;
    });
}
