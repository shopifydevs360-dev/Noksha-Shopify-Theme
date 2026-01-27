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
  return getPaginationWrapper()?.querySelector('[data-loader]');
}

function getLoadMoreBtn() {
  return getPaginationWrapper()?.querySelector('#loadMoreBtn');
}

/* ===========================
  INITIAL PAGINATION DATA
=========================== */
function setInitialPaginationData() {
  const productsBox = getProductsContainer();
  if (!productsBox) return;

  const page = parseInt(productsBox.dataset.currentPage || '1', 10);
  window.COLLECTION_AJAX.currentPage = page > 0 ? page : 1;
}

/* ===========================
  FILTERS
=========================== */
function initFilters() {
  const form = document.getElementById('CollectionFilters');
  if (!form) return;

  form.addEventListener('change', (e) => {
    if (!e.target.name) return;

    window.COLLECTION_AJAX.currentPage = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchProducts(false, true);
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
  PAGINATION INIT
=========================== */
function initPagination() {
  window.removeEventListener('scroll', infiniteScrollHandler);

  if (getPaginationType() === 'infinity_loading') {
    window.addEventListener('scroll', infiniteScrollHandler);
  }

  document.addEventListener('click', (e) => {
    const loadMoreBtn = e.target.closest('#loadMoreBtn');
    if (loadMoreBtn && !window.COLLECTION_AJAX.isLoading) {
      window.COLLECTION_AJAX.currentPage++;
      fetchProducts(true, false);
    }

    const pageBtn = e.target.closest('[data-page-number]');
    if (pageBtn && !window.COLLECTION_AJAX.isLoading) {
      const page = parseInt(pageBtn.dataset.pageNumber, 10);
      if (!page) return;

      window.COLLECTION_AJAX.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      fetchProducts(false, false);
    }
  });
}

/* ===========================
  INFINITE SCROLL
=========================== */
function infiniteScrollHandler() {
  if (window.COLLECTION_AJAX.isLoading) return;
  if (getPaginationType() !== 'infinity_loading') return;

  const productsBox = getProductsContainer();
  if (!productsBox) return;

  const totalPages = parseInt(productsBox.dataset.totalPages || '1', 10);
  if (window.COLLECTION_AJAX.currentPage >= totalPages) return;

  if (
    window.innerHeight + window.scrollY >=
    document.body.offsetHeight - 300
  ) {
    window.COLLECTION_AJAX.currentPage++;
    fetchProducts(true, false);
  }
}

/* ===========================
  BUILD QUERY PARAMS
=========================== */
function buildQueryParams() {
  const form = document.getElementById('CollectionFilters');
  const params = new URLSearchParams();

  if (form) {
    const formData = new FormData(form);
    for (const [key, value] of formData.entries()) {
      if (!value) continue;
      params.append(key, value);
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
  const productsBox = getProductsContainer();
  if (!productsBox) return;

  const totalPages = parseInt(productsBox.dataset.totalPages || '1', 10);
  const currentPage = parseInt(productsBox.dataset.currentPage || '1', 10);

  window.COLLECTION_AJAX.currentPage = currentPage > 0 ? currentPage : 1;
  renderPaginationUI(totalPages);
}

/* ===========================
  AJAX FETCH PRODUCTS
=========================== */
function fetchProducts(append = false, resetPage = false) {
  if (window.COLLECTION_AJAX.isLoading) return;
  window.COLLECTION_AJAX.isLoading = true;

  const loader = getLoaderElement();
  if (loader) loader.hidden = false;

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

      // 🔥 IMPORTANT: update filters UI (counts, price range, active states)
      const newFilters = doc.getElementById('CollectionFilters');
      const oldFilters = document.getElementById('CollectionFilters');
      if (newFilters && oldFilters) {
        oldFilters.innerHTML = newFilters.innerHTML;
      }

      updatePaginationUIFromCurrentDOM();
    })
    .catch(err => {
      console.error('AJAX fetch error:', err);
    })
    .finally(() => {
      window.COLLECTION_AJAX.isLoading = false;
      if (loader) loader.hidden = true;
      if (loadMoreBtn) loadMoreBtn.disabled = false;
    });
}
