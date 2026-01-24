document.addEventListener('change', (e) => {
  if (!e.target.closest('#CollectionFilters')) return;
  applyFilters(1);
});

function applyFilters(page = 1) {
  const params = new URLSearchParams();

  document
    .querySelectorAll('#CollectionFilters input:checked')
    .forEach(input => {
      params.append(input.dataset.filter, input.value);
    });

  params.set('page', page);

  const url = `${window.location.pathname}?${params.toString()}`;

  fetch(url)
    .then(res => res.text())
    .then(html => {
      const doc = new DOMParser().parseFromString(html, 'text/html');

      // Update products
      const newProducts = doc.querySelector('#productsContainer');
      if (newProducts) {
        document.querySelector('#productsContainer').innerHTML =
          newProducts.innerHTML;
      }

      // Update pagination
      const newPagination = doc.querySelector('#paginationWrapper');
      const paginationWrapper = document.querySelector('#paginationWrapper');

      if (paginationWrapper && newPagination) {
        paginationWrapper.innerHTML = newPagination.innerHTML;
      }

      history.pushState({}, '', url);
    });
}
