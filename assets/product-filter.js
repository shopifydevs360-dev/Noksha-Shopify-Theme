document.addEventListener('DOMContentLoaded', () => {
  window.COLLECTION_AJAX = {
    currentPage: 1,
    isLoading: false
  };

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
  APPLY FILTERS (ONLY BUTTON)
---------------------------- */
function initApplyFilters() {
  const btn = document.getElementById('applyFiltersBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    if (window.COLLECTION_AJAX.isLoading) return;

    window.COLLECTION_AJAX.currentPage = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    fetchProducts(false, true);
  });
}

/* ---------------------------
  CLEAR FILTERS
---------------------------- */
function initClearFilters() {
  const btn = document.getElementById('clearFiltersBtn');
  const form = document.getElementById('CollectionFilters');

  if (!btn || !form) return;

  btn.addEventListener('click', () => {
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
function renderPaginationUI(totalPages) {
  if (!getEnablePagination()) return;

  const wrapper = getPaginationWrapper();
  if (!wrapper) return;

  const loader = getLoaderElement();
  if (loader) loader.hidden = true;

  const type = getPaginationType();

  if (type === 'pagination_by_number') {
    const box = wrapper.querySelector('[data-pagination-numbers]');
    if (!box || totalPages <= 1) return;

    box.innerHTML = Array.from({ length: totalPages }, (_, i) => {
      const page = i + 1;
      return `
        <button
          type="button"
          data-page-number="${page}"
          class="${page === window.COLLECTION_AJAX.currentPage ? 'active' : ''}">
          ${page}
        </button>
      `;
    }).join('');
  }

  if (type === 'load_more_button') {
    const btn = getLoadMoreBtn();
    if (!btn) return;

    btn.style.display =
      window.COLLECTION_AJAX.currentPage >= totalPages ? 'none' : '';
  }
}

function updatePaginationUIFromCurrentDOM() {
  const box = getProductsContainer();
  if (!box) return;

  window.COLLECTION_AJAX.currentPage =
    parseInt(box.dataset.currentPage || '1', 10);

  renderPaginationUI(
    parseInt(box.dataset.totalPages || '1', 10)
  );
}

/* ---------------------------
  AJAX FETCH
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

      updatePaginationUIFromCurrentDOM();
    })
    .finally(() => {
      window.COLLECTION_AJAX.isLoading = false;
      if (loader) loader.hidden = true;
    });
}
