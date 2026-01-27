document.addEventListener('DOMContentLoaded', () => {
  window.COLLECTION_AJAX = {
    currentPage: 1,
    isLoading: false
  };

  setInitialPaginationData();
  initFilters();
  initPagination();
  initPriceRangeSlider();
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
  INITIAL PAGINATION
=========================== */
function setInitialPaginationData() {
  const box = getProductsContainer();
  if (!box) return;

  window.COLLECTION_AJAX.currentPage =
    parseInt(box.dataset.currentPage || '1', 10) || 1;
}

/* ===========================
  FILTERS
=========================== */
function initFilters() {
  const form = document.getElementById('CollectionFilters');
  if (!form) return;

  form.addEventListener('change', () => {
    window.COLLECTION_AJAX.currentPage = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchProducts(false, true);
  });

  const clearBtn = document.getElementById('clearFiltersBtn');
  if (!clearBtn) return;

  clearBtn.addEventListener('click', () => {
    form.reset();

    // reset price slider UI
    initPriceRangeSlider(true);

    window.COLLECTION_AJAX.currentPage = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchProducts(false, true);
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
    if (window.COLLECTION_AJAX.isLoading) return;

    const loadMore = e.target.closest('#loadMoreBtn');
    const pageBtn = e.target.closest('[data-page-number]');

    if (loadMore) {
      window.COLLECTION_AJAX.currentPage++;
      fetchProducts(true, false);
    }

    if (pageBtn) {
      const page = parseInt(pageBtn.dataset.pageNumber, 10);
      if (!page) return;

      window.COLLECTION_AJAX.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      fetchProducts(false, false);
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

/* ===========================
  QUERY PARAMS
=========================== */
function buildQueryParams() {
  const form = document.getElementById('CollectionFilters');
  const params = new URLSearchParams();

  if (form) {
    const data = new FormData(form);
    for (const [key, value] of data.entries()) {
      if (value !== '') params.append(key, value);
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

  const loader = getLoaderElement();
  if (loader) loader.hidden = true;

  const type = getPaginationType();

  if (type === 'pagination_by_number') {
    const box = wrapper.querySelector('[data-pagination-numbers]');
    if (!box) return;

    if (totalPages <= 1) {
      box.innerHTML = '';
      return;
    }

    box.innerHTML = Array.from({ length: totalPages }, (_, i) => {
      const page = i + 1;
      return `
        <button
          type="button"
          data-page-number="${page}"
          class="${page === window.COLLECTION_AJAX.currentPage ? 'active' : ''}"
        >${page}</button>
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

  renderPaginationUI(
    parseInt(box.dataset.totalPages || '1', 10)
  );
}

/* ===========================
  AJAX FETCH
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

  fetch(`${baseUrl}?${params}`, {
    headers: { 'X-Requested-With': 'XMLHttpRequest' }
  })
    .then(res => res.text())
    .then(html => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const newBox = doc.querySelector('#productsContainer');
      const oldBox = getProductsContainer();
      if (!newBox || !oldBox) return;

      oldBox.dataset.totalPages = newBox.dataset.totalPages || '1';
      oldBox.dataset.currentPage = newBox.dataset.currentPage || '1';

      if (append) {
        oldBox.insertAdjacentHTML('beforeend', newBox.innerHTML);
      } else {
        oldBox.innerHTML = newBox.innerHTML;
      }

      updatePaginationUIFromCurrentDOM();

      // 🔥 Re-init price slider after AJAX
      initPriceRangeSlider(true);
    })
    .finally(() => {
      window.COLLECTION_AJAX.isLoading = false;
      if (loader) loader.hidden = true;
      if (loadMoreBtn) loadMoreBtn.disabled = false;
    });
}

/* ===========================
  PRICE RANGE SLIDER (FINAL)
=========================== */
function initPriceRangeSlider(force = false) {
  const minRange = document.getElementById('MinRange');
  const maxRange = document.getElementById('MaxRange');
  const minInput = document.getElementById('PriceMinInput');
  const maxInput = document.getElementById('PriceMaxInput');
  const fill = document.getElementById('RangeFill');
  const minBubble = document.getElementById('MinBubble');
  const maxBubble = document.getElementById('MaxBubble');
  const form = document.getElementById('CollectionFilters');

  if (!minRange || !maxRange || !form) return;

  if (!force && minRange.dataset.initialized === 'true') return;
  minRange.dataset.initialized = 'true';

  function update(trigger = false) {
    let min = parseInt(minRange.value, 10);
    let max = parseInt(maxRange.value, 10);

    if (min >= max) min = max - 1;
    if (max <= min) max = min + 1;

    minRange.value = min;
    maxRange.value = max;

    minInput.value = min;
    maxInput.value = max;

    const maxVal = parseInt(minRange.getAttribute('max'), 10) || 1;
    const minPct = (min / maxVal) * 100;
    const maxPct = (max / maxVal) * 100;

    fill.style.left = `${minPct}%`;
    fill.style.width = `${maxPct - minPct}%`;

    minBubble.style.left = `${minPct}%`;
    maxBubble.style.left = `${maxPct}%`;

    minBubble.textContent = `$${min}`;
    maxBubble.textContent = `$${max}`;

    if (trigger) {
      form.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  minRange.oninput = () => update(false);
  maxRange.oninput = () => update(false);
  minRange.onchange = () => update(true);
  maxRange.onchange = () => update(true);

  update(false);
}
