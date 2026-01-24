document.addEventListener('change', (e) => {
  if (!e.target.closest('#CollectionFilters')) return;
  applyFilters();
});

function applyFilters() {
  const filters = {
    availability: [],
    collection: [],
    vendor: [],
    tag: []
  };

  document
    .querySelectorAll('#CollectionFilters input:checked')
    .forEach(input => {
      filters[input.dataset.filterType].push(input.value);
    });

  const hasActiveFilters = Object.values(filters).some(arr => arr.length);

  document.querySelectorAll('.product-card').forEach(card => {
    let visible = true;

    if (filters.availability.length) {
      visible = !card.querySelector('.add-to-cart-btn[disabled]');
    }

    if (visible && filters.collection.length) {
      visible = filters.collection.some(v =>
        card.dataset.productCollections.includes(v)
      );
    }

    if (visible && filters.vendor.length) {
      visible = filters.vendor.some(v =>
        card.dataset.productTitle.includes(v)
      );
    }

    if (visible && filters.tag.length) {
      visible = filters.tag.some(v =>
        card.dataset.productTags.includes(v)
      );
    }

    card.style.display = visible ? '' : 'none';
  });

  // 🔥 KEY FIX: pagination handling
  const pagination = document.getElementById('paginationWrapper');
  if (pagination) {
    pagination.style.display = hasActiveFilters ? 'none' : '';
  }
}
