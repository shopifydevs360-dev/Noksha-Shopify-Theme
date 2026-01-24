document.addEventListener('DOMContentLoaded', () => {
  initCollectionFilters();
  initCollectionPagination();
  initPopStateHandler();
});

/* ===============================
   FILTER CHANGE HANDLER
================================ */
function initCollectionFilters() {
  document.addEventListener('change', (e) => {
    if (!e.target.closest('#CollectionFilters')) return;
    fetchCollection();
  });
}

/* ===============================
   PAGINATION CLICK HANDLER
================================ */
function initCollectionPagination() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('#paginationWrapper a');
    if (!link) return;

    e.preventDefault();
    fetchCollection(link.href);
  });
}

/* ===============================
   BACK / FORWARD SUPPORT
================================ */
function initPopStateHandler() {
  window.addEventListener('popstate', () => {
    fetchCollection(window.location.href);
  });
}

/* ===============================
   CORE FETCH FUNCTION
================================ */
function fetchCollection(url = null) {
  const form = document.getElementById('CollectionFilters');
  if (!form) return;

  const params = new URLSearchParams(new FormData(form));
  let fetchUrl;

  if (url) {
    fetchUrl = new URL(url);
    params.forEach((value, key) => {
      fetchUrl.searchParams.set(key, value);
    });
  } else {
    fetchUrl = new URL(window.location.href);
    fetchUrl.search = params.toString();
  }

  fetch(fetchUrl.toString())
    .then(res => res.text())
    .then(html => {
      const doc = new DOMParser().parseFromString(html, 'text/html');

      replaceProducts(doc);
      replacePagination(doc);
      updateURL(fetchUrl);
    });
}

/* ===============================
   DOM REPLACERS
================================ */
function replaceProducts(doc) {
  const newProducts = doc.querySelector('#productsContainer');
  const currentProducts = document.querySelector('#productsContainer');

  if (newProducts && currentProducts) {
    currentProducts.innerHTML = newProducts.innerHTML;
  }
}

function replacePagination(doc) {
  const newPagination = doc.querySelector('#paginationWrapper');
  const paginationWrapper = document.querySelector('#paginationWrapper');

  if (paginationWrapper) {
    paginationWrapper.innerHTML = newPagination ? newPagination.innerHTML : '';
  }
}

/* ===============================
   URL SYNC
================================ */
function updateURL(urlObj) {
  history.pushState({}, '', urlObj.pathname + '?' + urlObj.searchParams.toString());
}
