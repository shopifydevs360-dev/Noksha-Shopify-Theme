document.addEventListener('DOMContentLoaded', () => {
  window.COLLECTION_AJAX = {
    currentPage: 1,
    isLoading: false
  };

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
  INITIAL DATA
=========================== */
function setInitialPaginationData() {
  const products = getProductsContainer();
  if (!products) return;

  window.COLLECTION_AJAX.currentPage =
    parseInt(products.dataset.currentPage || '1', 10) || 1;
}

/* ===========================
  FILTERS (AUTO + SUBMIT)
=========================== */
function initFilters() {
  const form = getFiltersContainer();
  if (!form) return;

  /* Auto apply on change */
  form.addEventListener('change', (e) => {
    if (!e.target.name) return;

    window.COLLECTION_AJAX.currentPage = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchProducts();
  });

  /* Apply Filters button */
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    window.COLLECTION_AJAX.currentPage = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchProducts();
  });
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
      fetchProducts(true);
    }

    const pageBtn = e.target.closest('[data-page-number]');
    if (pageBtn && !window.COLLECTION_AJAX.isLoading) {
      const page = parseInt(pageBtn.dataset.pageNumber, 10);
      if (!page) return;

      window.COLLECTION_AJAX.currentPage = page;
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
    fetchProducts(true);
  }
}

/* ===========================
  QUERY PARAMS
=========================== */
function buildQueryParams() {
  const form = getFiltersContainer();
  const params = new URLSearchParams();

  if (form) {
    const formData = new FormData(form);
    for (const [key, value] of formData.entries()) {
      if (!value) continue;
      params.append(key, value);
    }
  }

  params.set('page', window.COLLECTION_AJAX.currentPage);
  return params;
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

  window.COLLECTION_AJAX.currentPage = currentPage || 1;
  renderPaginationUI(totalPages);
}

/* ===========================
  AJAX FETCH
=========================== */
function fetchProducts(append = false) {
  if (window.COLLECTION_AJAX.isLoading) return;
  window.COLLECTION_AJAX.isLoading = true;

  const loader = getLoaderElement();
  if (loader) loader.hidden = false;

  const params = buildQueryParams();

  fetch(`${window.location.pathname}?${params.toString()}`, {
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

      append
        ? oldProducts.insertAdjacentHTML('beforeend', newProducts.innerHTML)
        : oldProducts.innerHTML = newProducts.innerHTML;

      /* 🔥 update filters (counts, price range, active states) */
      const newFilters = doc.getElementById('CollectionFilters');
      const oldFilters = getFiltersContainer();
      if (newFilters && oldFilters) {
        oldFilters.innerHTML = newFilters.innerHTML;
      }

      updatePaginationUIFromCurrentDOM();
    })
    .catch(err => console.error('AJAX error:', err))
    .finally(() => {
      window.COLLECTION_AJAX.isLoading = false;
      if (loader) loader.hidden = true;
    });
}
