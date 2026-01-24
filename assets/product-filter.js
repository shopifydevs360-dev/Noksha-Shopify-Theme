document.addEventListener('DOMContentLoaded', () => {
  window.COLLECTION_AJAX = {
    currentPage: 1,
    isLoading: false
  };

  // Initial current page + total pages from HTML
  setInitialPaginationData();

  initFilters();
  initPagination();

  // Render pagination immediately on first load
  updatePaginationUIFromCurrentDOM();
});

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
    window.COLLECTION_AJAX.currentPage = 1;

    // Reset scroll position (as you requested)
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
  // remove previous scroll handler
  window.removeEventListener('scroll', infiniteScrollHandler);

  const type = getPaginationType();

  // Infinity scroll enable
  if (type === 'infinity_loading') {
    window.addEventListener('scroll', infiniteScrollHandler);
  }

  // Load more button click
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#loadMoreBtn');
    if (!btn) return;

    window.COLLECTION_AJAX.currentPage++;
    fetchProducts(true, false);
  });

  // Pagination by number click
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-page-number]');
    if (!btn) return;

    const page = parseInt(btn.dataset.pageNumber, 10);
    if (!page) return;

    window.COLLECTION_AJAX.currentPage = page;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    fetchProducts(false, false);
  });
}

function infiniteScrollHandler() {
  if (window.COLLECTION_AJAX.isLoading) return;

  const type = getPaginationType();
  if (type !== 'infinity_loading') return;

  // load next page near bottom
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

    for (const [key, value] of formData.entries()) {
      if (value === '' || value == null) continue;
      params.append(key, value);
    }
  }

  // custom menu collection selector
  const collectionHandle = params.get('collection_handle');
  params.delete('collection_handle');

  params.set('page', window.COLLECTION_AJAX.currentPage);

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

  if (!totalPages || totalPages <= 1) {
    wrapper.innerHTML = '';
    return;
  }

  // Infinity loading = no UI
  if (type === 'infinity_loading') {
    wrapper.innerHTML = '';
    return;
  }

  // Load More Button
  if (type === 'load_more_button') {
    // Hide button if already last page
    if (window.COLLECTION_AJAX.currentPage >= totalPages) {
      wrapper.innerHTML = '';
      return;
    }

    wrapper.innerHTML = `
      <button type="button" id="loadMoreBtn">
        Load More
      </button>
    `;
    return;
  }

  // Pagination by Number
  if (type === 'pagination_by_number') {
    let html = `<div class="pagination-numbers">`;

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

    html += `</div>`;
    wrapper.innerHTML = html;
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
   AJAX FETCH
---------------------------- */
function fetchProducts(append = false, resetPage = false) {
  if (window.COLLECTION_AJAX.isLoading) return;
  window.COLLECTION_AJAX.isLoading = true;

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

      if (append) {
        oldProducts.insertAdjacentHTML('beforeend', newProducts.innerHTML);
      } else {
        oldProducts.innerHTML = newProducts.innerHTML;
      }

      // Update dataset from new response (VERY IMPORTANT)
      oldProducts.dataset.totalPages = newProducts.dataset.totalPages || '1';
      oldProducts.dataset.currentPage = newProducts.dataset.currentPage || '1';
      oldProducts.dataset.totalProducts = newProducts.dataset.totalProducts || '';

      // Update pagination UI properly
      updatePaginationUIFromCurrentDOM();
    })
    .catch((err) => console.error('AJAX fetch error:', err))
    .finally(() => {
      window.COLLECTION_AJAX.isLoading = false;
    });
}
