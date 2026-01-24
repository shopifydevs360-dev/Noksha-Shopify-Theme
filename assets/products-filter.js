document.addEventListener('change', (e) => {
  if (!e.target.closest('#CollectionFilters')) return;
  applyClientSideFilters();
});

function applyClientSideFilters() {
  const activeFilters = {
    tag: [],
    vendor: [],
    collection: []
  };

  document.querySelectorAll('#CollectionFilters input:checked').forEach(input => {
    const type = input.dataset.filterType;
    activeFilters[type].push(input.value.toLowerCase());
  });

  document.querySelectorAll('.product-card').forEach(card => {
    let visible = true;

    if (activeFilters.tag.length) {
      visible = activeFilters.tag.some(tag =>
        card.dataset.productTags.includes(tag)
      );
    }

    if (visible && activeFilters.collection.length) {
      visible = activeFilters.collection.some(col =>
        card.dataset.productCollections.includes(col)
      );
    }

    card.style.display = visible ? '' : 'none';
  });
}
