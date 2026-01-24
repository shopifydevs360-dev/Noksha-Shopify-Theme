document.addEventListener('DOMContentLoaded', () => {
  window.COLLECTION_AJAX = {
    currentPage: 1,
    isLoading: false
  };

  initFilters();
  initPagination();
  renderPaginationUI();
});

function getMainContainer() {
  return document.querySelector('.main-product-list');
}

function getPaginationType() {
  const main = getMainContainer();
  return main?.dataset.paginationType || 'pagination_by_number';
}

function getEnablePagination() {
  const main = getMainContainer();
  return main?.dataset.enablePagination === 'true';
}

function initFilters() {
  const form = document.getElementById('CollectionFilters');
  if (!form) return;

  form.addEventListener('change', (e) => {
    // Reset pagination page
    window.COLLECTION_AJAX.currentPage = 1;

    // Reset scroll position
    window.scrollTo({ top: 0, behavior: 'smooth' });

    fetchProducts(false, true);
  });

  const clearBtn = document.getElementById('clearFiltersBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      form.reset();

      // Reset page
      window.COLLECTION_AJAX.currentPage = 1;

      // Reset scroll
      window.scrollTo({ top: 0, behavior: 'smooth' });

      fetchProducts(false, true);
    });
  }
}

function initPagination() {
  const type = getPaginationType();

  // Remove old handlers if any
  window.removeEventListener('scroll', infiniteScrollHandler);

  if (type === 'infinity_loading') {
    window.addEventListener('scroll', infiniteScrollHandler);
  }

  // Load more button init
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#loadMoreBtn')) return;

    window.COLLECTION_AJAX.currentPage++;
    fetchProducts(true, false);
  });

  // Pagination by number init
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-page-number]');
    if (!btn) return;

    const page = parseInt(btn.dataset.pageNumber, 10);
    if (!page) return;

    window.COLLECTION_AJAX.currentPage = page;
    fetchProducts(false, false);
  });
}

function infiniteScrollHandler() {
  if (window.COLLECTION_AJAX.isLoading) return;

  const type = getPaginationType();
  if (type !== 'infinity_loading') return;

  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    window.COLLECTION_AJAX.currentPage++;
    fetchProducts(true, false);
  }
}

function buildQueryParams() {
  const form = document.getElementById('CollectionFilters');
  const params = new URLSearchParams();

  if (!form) return { params, collectionHandle: null };

  const formData = new FormData(form);

  // Support multiple checkbox values with same name
  for (const [key, value] of formData.entries()) {
    if (value === '' || value == null) continue;
    params.append(key, value);
  }

  // Collection handle custom
  const collectionHandle = params.get('collection_handle');
  params.delete('collection_handle');

  // Current page
  params.set('page', window.COLLECTION_AJAX.currentPage);

  return { params, collectionHandle };
}

function renderPaginationUI(totalPages = null) {
  if (!getEnablePagination()) return;

  const wrapper = document.getElementById('paginationWrapper');
  if (!wrapper) return;

  const type = getPaginationType();

  // If pagination disabled
  if (!totalPages || totalPages <= 1) {
    wrapper.innerHTML = '';
    return;
  }

  if (type === 'load_more_button') {
    wrapper.innerHTML = `
      <button type="button" id="loadMoreBtn">
        Load More
      </button>
    `;
    return;
  }

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
    return;
  }

  // Infinity loading = no buttons
  if (type === 'infinity_loading') {
    wrapper.innerHTML = '';
  }
}

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
    .then(res => res.text())
    .then(html => {
      const doc = new DOMParser().parseFromString(html, 'text/html');

      const newProducts = doc.querySelector('#productsContainer');
      const oldContainer = document.getElementById('productsContainer');
      if (!oldContainer || !newProducts) return;

      if (append) {
        oldContainer.insertAdjacentHTML('beforeend', newProducts.innerHTML);
      } else {
        oldContainer.innerHTML = newProducts.innerHTML;
      }

      // Build pagination based on found pagination in Shopify HTML
      const totalPages = getTotalPagesFromHTML(doc);
      renderPaginationUI(totalPages);
    })
    .catch(err => {
      console.error('AJAX fetch error:', err);
    })
    .finally(() => {
      window.COLLECTION_AJAX.isLoading = false;
    });
}

function getTotalPagesFromHTML(doc) {
  // Shopify paginate creates links in `paginate` object BUT not always in HTML.
  // So we calculate pages using product count if we can detect it.
  // If not possible, fallback to 1.

  const main = getMainContainer();
  const perPage = parseInt(main?.dataset.productsPerPage || '24', 10);

  // Shopify outputs product JSON count sometimes (depends on theme)
  // Here we attempt to read from meta tag if exists (optional)
  const countMeta = doc.querySelector('[data-collection-products-count]');
  if (countMeta) {
    const count = parseInt(countMeta.dataset.collectionProductsCount, 10);
    if (count && perPage) return Math.ceil(count / perPage);
  }

  // fallback: try to find pagination links
  const links = doc.querySelectorAll('.pagination a, nav.pagination a');
  if (links.length > 0) {
    // Try detect max page number from href
    let maxPage = 1;
    links.forEach(a => {
      const url = new URL(a.href, window.location.origin);
      const page = parseInt(url.searchParams.get('page') || '1', 10);
      if (page > maxPage) maxPage = page;
    });
    return maxPage;
  }

  return 1;
}
