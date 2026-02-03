/* ======================================================
  PRODUCT FILTER – CLEAN & FIXED VERSION
====================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('CollectionFilters');

  window.COLLECTION_AJAX = {
    currentPage: 1,
    isLoading: false
  };

  /* 🚫 Block default form submit */
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      e.stopPropagation();
    });
  }

  setInitialPaginationData();
  initApplyFilters();
  initClearFilters();
  initPagination();
  initFilterToggle();
  initClearAllFilters();

  // ✅ SHOW ACTIVE FILTERS ON FIRST LOAD
  showFilterResult();
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

function escapeValue(value) {
  return window.CSS?.escape
    ? CSS.escape(value)
    : value.replace(/"/g, '\\"');
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
    closeFilterUI();
  });
}

/* ======================================================
  ACTIVE FILTER TAGS
====================================================== */
function showFilterResult() {
  const form = document.getElementById('CollectionFilters');
  const container = document.querySelector('[data-active-filters]');
  const clearAllBtn = document.querySelector('[data-clear-all-filters]');

  if (!form || !container) return;

  const activeFilters = [];

  // Checkboxes
  form.querySelectorAll('input[type="checkbox"]:checked').forEach(input => {
    const label = input.closest('label')?.textContent.split('(')[0].trim();
    if (label) activeFilters.push({ type: input.name, value: input.value, label });
  });

  // Radios
  form.querySelectorAll('input[type="radio"]:checked').forEach(input => {
    if (input.name === 'sort_by' && input.value === 'manual') return;
    const label = input.closest('label')?.textContent.split('(')[0].trim();
    if (label) activeFilters.push({ type: input.name, value: input.value, label });
  });

  // Price range
  const min = form.querySelector('input[name*="price.gte"]')?.value;
  const max = form.querySelector('input[name*="price.lte"]')?.value;

  if (min || max) {
    activeFilters.push({
      type: 'price_range',
      value: `${min || 0}-${max || '∞'}`,
      label: `Price: ${min || 0} - ${max || '∞'}`
    });
  }

  if (!activeFilters.length) {
    container.innerHTML = '';
    clearAllBtn?.classList.add('hide');
    return;
  }

  container.innerHTML = activeFilters.map(f => `
    <div class="active-filter-tag" data-filter-type="${f.type}" data-filter-value="${f.value}">
      <span>${f.label}</span>
      <span class="remove-icon">✕</span>
    </div>
  `).join('');

  clearAllBtn?.classList.remove('hide');

  container.querySelectorAll('.active-filter-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      removeSingleFilter(tag.dataset.filterType, tag.dataset.filterValue);
    });
  });
}

/* ======================================================
  REMOVE SINGLE FILTER
====================================================== */
function removeSingleFilter(type, value) {
  const form = document.getElementById('CollectionFilters');
  if (!form) return;

  if (type === 'price_range') {
    form.querySelector('input[name*="price.gte"]').value = '';
    form.querySelector('input[name*="price.lte"]').value = '';
  } else if (type === 'sort_by') {
    form.querySelector('input[name="sort_by"][value="manual"]')?.click();
  } else {
    const safeValue = escapeValue(value);
    form.querySelector(`[name="${type}"][value="${safeValue}"]`)?.click();
  }

  window.COLLECTION_AJAX.currentPage = 1;
  fetchProducts(false, false);
}

/* ======================================================
  CLEAR ALL FILTERS
====================================================== */
function initClearAllFilters() {
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-clear-all-filters]')) return;
    e.preventDefault();
    clearAllFilters();
  });
}

function clearAllFilters() {
  const form = document.getElementById('CollectionFilters');
  if (!form) return;

  form.reset();
  form.querySelector('input[name="sort_by"][value="manual"]')?.click();

  window.COLLECTION_AJAX.currentPage = 1;
  fetchProducts(false, false);
  closeFilterUI();
}

/* ======================================================
  CLEAR FILTERS (SIDEBAR BUTTON)
====================================================== */
function initClearFilters() {
  const btn = document.getElementById('clearFiltersBtn');
  const form = document.getElementById('CollectionFilters');
  if (!btn || !form) return;

  btn.addEventListener('click', e => {
    e.preventDefault();
    clearAllFilters();
  });
}

/* ======================================================
  PAGINATION + INFINITE SCROLL
====================================================== */
let scrollThrottle = null;

function initPagination() {
  window.removeEventListener('scroll', infiniteScrollHandler);

  if (getPaginationType() === 'infinity_loading') {
    window.addEventListener('scroll', infiniteScrollHandler);
  }

  document.addEventListener('click', e => {
    const pageBtn = e.target.closest('[data-page-number]');
    if (pageBtn) {
      e.preventDefault();
      window.COLLECTION_AJAX.currentPage = +pageBtn.dataset.pageNumber;
      fetchProducts(false, false);
    }
  });
}

function infiniteScrollHandler() {
  if (scrollThrottle) return;

  scrollThrottle = setTimeout(() => {
    scrollThrottle = null;

    if (window.COLLECTION_AJAX.isLoading) return;

    const box = getProductsContainer();
    const totalPages = +box.dataset.totalPages;

    if (window.COLLECTION_AJAX.currentPage >= totalPages) return;

    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
      window.COLLECTION_AJAX.currentPage++;
      fetchProducts(true, false);
    }
  }, 200);
}

/* ======================================================
  QUERY PARAMS
====================================================== */
function buildQueryParams() {
  const form = document.getElementById('CollectionFilters');
  const params = new URLSearchParams();
  const data = new FormData(form);

  for (const [key, value] of data.entries()) {
    if (!value || (key === 'sort_by' && value === 'manual')) continue;
    params.append(key, value);
  }

  params.set('page', window.COLLECTION_AJAX.currentPage);
  return params;
}

/* ======================================================
  FETCH PRODUCTS
====================================================== */
function fetchProducts(append = false, resetPage = false) {
  if (window.COLLECTION_AJAX.isLoading) return;
  window.COLLECTION_AJAX.isLoading = true;

  const loader = getLoaderElement();
  loader && (loader.hidden = false);

  if (resetPage) window.COLLECTION_AJAX.currentPage = 1;

  fetch(`${location.pathname}?${buildQueryParams()}`, {
    headers: { 'X-Requested-With': 'XMLHttpRequest' }
  })
    .then(res => res.text())
    .then(html => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const newBox = doc.querySelector('#productsContainer');
      const oldBox = getProductsContainer();

      if (!newBox || !oldBox) return;

      oldBox.dataset = newBox.dataset;
      append
        ? oldBox.insertAdjacentHTML('beforeend', newBox.innerHTML)
        : (oldBox.innerHTML = newBox.innerHTML);

      showFilterResult();
      updateProductCounter();
    })
    .catch(() => alert('Something went wrong. Please try again.'))
    .finally(() => {
      window.COLLECTION_AJAX.isLoading = false;
      loader && (loader.hidden = true);
    });
}

/* ======================================================
  PRODUCT COUNTER
====================================================== */
function updateProductCounter() {
  const count = document.querySelector('[data-filter-result-count]');
  const box = getProductsContainer();
  if (!count || !box) return;

  count.textContent = `${box.dataset.totalProducts || 0} Products Found`;
}

/* ======================================================
  FILTER UI TOGGLE
====================================================== */
function initFilterToggle() {
  const sidebar = document.querySelector('.product-filter');
  const buttons = document.querySelectorAll('.filter-toggle-btn');
  let lastWidth = window.innerWidth;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      sidebar.classList.toggle('is-expanded');
      document.body.classList.toggle('is-filter-open');
    });
  });

  window.addEventListener('resize', () => {
    if (Math.abs(window.innerWidth - lastWidth) > 100) {
      closeFilterUI();
      lastWidth = window.innerWidth;
    }
  });
}

function closeFilterUI() {
  document.querySelector('.product-filter')?.classList.remove('is-expanded');
  document.body.classList.remove('is-filter-open');
}
