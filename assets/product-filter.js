document.addEventListener('DOMContentLoaded', () => {
  initFilters();
  initPagination();
});

let currentPage = 1;

function initFilters() {
  document.addEventListener('change', (e) => {
    if (!e.target.closest('#CollectionFilters')) return;
    currentPage = 1;
    fetchProducts();
  });
}

function initPagination() {
  const container = document.querySelector('.main-product-list');
  if (!container) return;

  if (container.dataset.paginationType === 'infinity_loading') {
    window.addEventListener('scroll', infiniteScroll);
  }
}

function infiniteScroll() {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    currentPage++;
    fetchProducts(true);
  }
}

function fetchProducts(append = false) {
  const form = document.getElementById('CollectionFilters');
  const params = new URLSearchParams(new FormData(form));

  const collectionHandle = params.get('collection_handle');
  params.delete('collection_handle');

  params.set('page', currentPage);

  const baseUrl = collectionHandle
    ? `/collections/${collectionHandle}`
    : window.location.pathname;

  fetch(`${baseUrl}?${params.toString()}`)
    .then(res => res.text())
    .then(html => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const newProducts = doc.querySelector('#productsContainer');

      const container = document.getElementById('productsContainer');
      if (!container || !newProducts) return;

      if (append) {
        container.insertAdjacentHTML('beforeend', newProducts.innerHTML);
      } else {
        container.innerHTML = newProducts.innerHTML;
      }
    });
}
