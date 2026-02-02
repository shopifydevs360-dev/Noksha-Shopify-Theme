document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('CollectionFilters');
  const applyBtn = document.getElementById('applyFiltersBtn');
  const clearBtn = document.getElementById('clearFiltersBtn');

  window.COLLECTION_AJAX = {
    currentPage: 1,
    isLoading: false
  };

  /* ===============================
    🚫 BLOCK NORMAL FORM SUBMIT
  =============================== */
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });
  }

  setInitialPaginationData();
  initApplyFilters();
  initClearFilters();
  initPagination();
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
  return getMainContainer()?.dataset.paginationType || 'pagination_by_number';
}

function getEnablePagination() {
  return getMainContainer()?.dataset.enablePagination === 'true';
}

function getLoaderElement() {
  return getPaginationWrapper()?.querySelector('[data-loader]') || null;
}

function getLoadMoreBtn() {
  return getPaginationWrapper()?.querySelector('#loadMoreBtn') || null;
}

/* ---------------------------
  INITIAL PAGE DATA
---------------------------- */
function setInitialPaginationData() {
  const box = getProductsContainer();
  if (!box) return;

  window.COLLECTION_AJAX.currentPage =
    parseInt(box.dataset.currentPage || '1', 10);
}

/* ---------------------------
  APPLY FILTERS (AJAX ONLY)
---------------------------- */
function initApplyFilters() {
  const btn = document.getElementById('applyFiltersBtn');
  if (!btn) return;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (window.COLLECTION_AJAX.isLoading) return;

    window.COLLECTION_AJAX.currentPage = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    fetchProducts(false, true);
  });
}

/* ---------------------------
  CLEAR FILTERS (AJAX)
---------------------------- */
function initClearFilters() {
  const btn = document.getElementById('clearFiltersBtn');
  const form = document.getElementById('CollectionFilters');

  if (!btn || !form) return;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    form.reset();
    window.COLLECTION_AJAX.currentPage = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    fetchProducts(false, true);
  });
}

/* ---------------------------
  PAGINATION INIT
---------------------------- */
function initPagination() {
  window.removeEventListener('scroll', infiniteScrollHandler);

  const type = getPaginationType();

  if (type === 'infinity_loading') {
    window.addEventListener('scroll', infiniteScrollHandler);
  }

  document.addEventListener('click', (e) => {
    const pageBtn = e.target.closest('[data-page-number]');
    if (pageBtn) {
      e.preventDefault();
      if (window.COLLECTION_AJAX.isLoading) return;

      window.COLLECTION_AJAX.currentPage =
        parseInt(pageBtn.dataset.pageNumber, 10);

      window.scrollTo({ top: 0, behavior: 'smooth' });
      fetchProducts(false, false);
    }

    const loadMoreBtn = e.target.closest('#loadMoreBtn');
    if (loadMoreBtn) {
      e.preventDefault();
      if (window.COLLECTION_AJAX.isLoading) return;

      window.COLLECTION_AJAX.currentPage++;
      fetchProducts(true, false);
    }
  });
}

/* ---------------------------
  INFINITE SCROLL
---------------------------- */
function infiniteScrollHandler() {
  if (window.COLLECTION_AJAX.isLoading) return;
  if (getPaginationType() !== 'infinity_loading') return;

  const box = getProductsContainer();
  if (!box) return;

  const totalPages = parseInt(box.dataset.totalPages || '1', 10);
  if (window.COLLECTION_AJAX.currentPage >= totalPages) return;

  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    window.COLLECTION_AJAX.currentPage++;
    fetchProducts(true, false);
  }
}

/* ---------------------------
  QUERY PARAMS
---------------------------- */
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

/* ---------------------------
  PAGINATION UI
---------------------------- */
function updatePaginationUIFromCurrentDOM() {
  const box = getProductsContainer();
  if (!box) return;

  window.COLLECTION_AJAX.currentPage =
    parseInt(box.dataset.currentPage || '1', 10);
}

/* ---------------------------
  AJAX FETCH PRODUCTS
---------------------------- */
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
    })
    .catch(err => console.error('AJAX error:', err))
    .finally(() => {
      window.COLLECTION_AJAX.isLoading = false;
      if (loader) loader.hidden = true;
    });
}
