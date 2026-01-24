document.addEventListener('DOMContentLoaded', () => {
  initCollectionFilters();
  initCollectionPagination();
  initHistorySync();
});

/* ===============================
   FILTER CHANGE
================================ */
function initCollectionFilters() {
  document.addEventListener('change', (e) => {
    if (!e.target.closest('#CollectionFilters')) return;
    fetchCollection();
  });
}

/* ===============================
   PAGINATION CLICK
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
   BACK / FORWARD
================================ */
function initHistorySync() {
  window.addEventListener('popstate', () => {
    fetchCollection(window.location.href, false);
  });
}

/* ===============================
   CORE FETCH
================================ */
function fetchCollection(url = null, pushState = true) {
  const form = document.getElementById('CollectionFilters');
  if (!form) return;

  const params = new URLSearchParams(new FormData(form));
  let fetchUrl = url ? new URL(url) : new URL(window.location.href);

  params.forEach((value, key) => {
    fetchUrl.searchParams.set(key, value);
  });

  fetch(fetchUrl.toString())
    .then(res => res.text())
    .then(html => {
      const doc = new DOMParser().parseFromString(html, 'text/html');

      replaceProducts(doc);
      replacePagination(doc);

      if (pushState) {
        history.pushState({}, '', fetchUrl.pathname + '?' + fetchUrl.searchParams.toString());
      }
    });
}

/* ===============================
   DOM REPLACERS
================================ */
function replaceProducts(doc) {
  const current = document.getElementById('productsContainer');
  const incoming = doc.getElementById('productsContainer');
  if (current && incoming) {
    current.innerHTML = incoming.innerHTML;
  }
}

function replacePagination(doc) {
  const current = document.getElementById('paginationWrapper');
  const incoming = doc.getElementById('paginationWrapper');
  if (current) {
    current.innerHTML = incoming ? incoming.innerHTML : '';
  }
}
