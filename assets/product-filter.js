document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('CollectionFilters');

  window.COLLECTION_AJAX = {
    currentPage: 1,
    isLoading: false
  };

  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });
  }

  setInitialPaginationData();
  initApplyFilters();
  initClearFilters();
  initPagination();
  initFilterToggle();
});

/* ======================================================
  HELPERS
====================================================== */
function getMainContainer() {
  return document.querySelector('.main-product-list');
}

function getProductsContainer() {
  return document.getElementById('productsContainer');
}

function getPaginationWrapper() {
  return document.getElementById('paginationWrapper');
}

function getPaginationType() {
  return getMainContainer()?.dataset.paginationType || 'pagination_by_number';
}

function getLoaderElement() {
  return getPaginationWrapper()?.querySelector('[data-loader]');
}

/* ======================================================
  INITIAL DATA
====================================================== */
function setInitialPaginationData() {
  const box = getProductsContainer();
  if (!box) return;
  window.COLLECTION_AJAX.currentPage = parseInt(box.dataset.currentPage || '1', 10);
}

/* ======================================================
  APPLY FILTERS
====================================================== */
function initApplyFilters() {
  const btn = document.getElementById('applyFiltersBtn');
  if (!btn) return;

  btn.addEventListener('click', e => {
    e.preventDefault();
    if (window.COLLECTION_AJAX.isLoading) return;

    window.COLLECTION_AJAX.currentPage = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    fetchProducts(false, true);
  });
}

/* ======================================================
  CLEAR FILTERS
====================================================== */
function initClearFilters() {
  const btn = document.getElementById('clearFiltersBtn');
  const form = document.getElementById('CollectionFilters');
  if (!btn || !form) return;

  btn.addEventListener('click', e => {
    e.preventDefault();
    form.reset();

    window.COLLECTION_AJAX.currentPage = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    fetchProducts(false, true);
  });
}

/* ======================================================
  PAGINATION
====================================================== */
function initPagination() {
  window.removeEventListener('scroll', infiniteScrollHandler);

  if (getPaginationType() === 'infinity_loading') {
    window.addEventListener('scroll', infiniteScrollHandler);
  }

  document.addEventListener('click', e => {
    const pageBtn = e.target.closest('[data-page-number]');
    if (pageBtn) {
      e.preventDefault();
      window.COLLECTION_AJAX.currentPage = parseInt(pageBtn.dataset.pageNumber, 10);
      fetchProducts(false, false);
    }

    const loadMoreBtn = e.target.closest('#loadMoreBtn');
    if (loadMoreBtn) {
      e.preventDefault();
      window.COLLECTION_AJAX.currentPage++;
      fetchProducts(true, false);
    }
  });
}

function infiniteScrollHandler() {
  if (window.COLLECTION_AJAX.isLoading) return;

  const box = getProductsContainer();
  if (!box) return;

  const totalPages = parseInt(box.dataset.totalPages || '1', 10);
  if (window.COLLECTION_AJAX.currentPage >= totalPages) return;

  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    window.COLLECTION_AJAX.currentPage++;
    fetchProducts(true, false);
  }
}

/* ======================================================
  QUERY PARAMS
====================================================== */
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

/* ======================================================
  FETCH PRODUCTS (🔥 FIX HERE)
====================================================== */
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

      /* 🔥 RE-INIT ADD TO CART AFTER AJAX */
      if (typeof initAllProductCartEvents === 'function') {
        initAllProductCartEvents();
      }
    })
    .catch(err => console.error('Filter AJAX error:', err))
    .finally(() => {
      window.COLLECTION_AJAX.isLoading = false;
      if (loader) loader.hidden = true;
    });
}
/* ======================================================
  FILTER / SORT TOGGLE + OFFCANVAS
====================================================== */
function initFilterToggle() {
  const sidebar = document.querySelector('.product-filter');
  const buttons = document.querySelectorAll('.filter-toggle-btn');
  const filterItems = document.querySelectorAll('.filter-item');
  const sortItem = document.querySelector('.filter-sort');

  if (!sidebar || !buttons.length) return;

  let activeAction = null;

  const isMobile = () => window.innerWidth <= 991;

  function hideAll() {
    filterItems.forEach(item => item.classList.add('hide'));
  }

  function showAllFilters(includeSort = false) {
    filterItems.forEach(item => {
      if (item.classList.contains('filter-sort') && !includeSort) return;
      item.classList.remove('hide');
    });
  }

  function openSidebar() {
    sidebar.classList.add('is-expanded');

    if (isMobile()) {
      sidebar.classList.add('is-offcanvas');
      document.body.classList.add('is-filter-open'); // 🔒 LOCK SCROLL
      addOverlay();
    }
  }

  function closeSidebar() {
    sidebar.classList.remove('is-expanded', 'is-offcanvas');
    document.body.classList.remove('is-filter-open'); // 🔓 UNLOCK SCROLL
    hideAll();
    activeAction = null;
    removeOverlay();
  }

  function addOverlay() {
    if (document.querySelector('.filter-overlay')) return;

    const overlay = document.createElement('div');
    overlay.className = 'filter-overlay';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', closeSidebar);
  }

  function removeOverlay() {
    document.querySelector('.filter-overlay')?.remove();
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;

      // 🔁 reverse toggle
      if (activeAction === action) {
        closeSidebar();
        return;
      }

      activeAction = action;
      hideAll();
      openSidebar();

      if (isMobile()) {
        showAllFilters(true);
        return;
      }

      if (action === 'filter') {
        showAllFilters(false);
      }

      if (action === 'sort' && sortItem) {
        sortItem.classList.remove('hide');
      }
    });
  });

  window.addEventListener('resize', closeSidebar);
}
