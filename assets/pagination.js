document.addEventListener('click', (e) => {
  const link = e.target.closest('#paginationWrapper a');
  if (!link) return;

  e.preventDefault();

  const page = new URL(link.href).searchParams.get('page');
  applyFilters(page);
});
