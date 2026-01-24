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
      const type = input.dataset.filterType;
      filters[type].push(input.value);
    });

  document.querySelectorAll('.product-card').forEach(card => {
    let visible = true;

    // Availability
    if (filters.availability.length) {
      const isAvailable = !card.querySelector('.add-to-cart-btn[disabled]');
      visible = isAvailable;
    }

    // Collection
    if (visible && filters.collection.length) {
      visible = filters.collection.some(col =>
        card.dataset.productCollections.includes(col)
      );
    }

    // Vendor (from title or data attr if added later)
    if (visible && filters.vendor.length) {
      visible = filters.vendor.some(v =>
        card.dataset.productTitle.includes(v)
      );
    }

    // Tags / Colors
    if (visible && filters.tag.length) {
      visible = filters.tag.some(tag =>
        card.dataset.productTags.includes(tag)
      );
    }

    card.style.display = visible ? '' : 'none';
  });
}
