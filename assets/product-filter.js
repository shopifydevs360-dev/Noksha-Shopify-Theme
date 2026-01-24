document.addEventListener('change', (e) => {
  if (!e.target.closest('#CollectionFilters')) return;
  fetchCollection();
});

document.addEventListener('click', (e) => {
  const link = e.target.closest('#paginationWrapper a');
  if (!link) return;

  e.preventDefault();
  fetchCollection(link.href);
});

function fetchCollection(url = null) {
  const form = document.getElementById('CollectionFilters');
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

      // Replace products
      document.querySelector('#productsContainer').innerHTML =
        doc.querySelector('#productsContainer').innerHTML;

      // Replace pagination
      const newPagination = doc.querySelector('#paginationWrapper');
      const paginationWrapper = document.querySelector('#paginationWrapper');

      if (paginationWrapper) {
        paginationWrapper.innerHTML = newPagination ? newPagination.innerHTML : '';
      }

      history.pushState({}, '', fetchUrl.pathname + '?' + fetchUrl.searchParams.toString());
    });
}
