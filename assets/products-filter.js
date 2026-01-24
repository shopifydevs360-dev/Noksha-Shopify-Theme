document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.querySelector(".filter-toggle-btn");
  const filters = document.getElementById("CollectionFilters");

  if (!toggleBtn || !filters) return;

  toggleBtn.addEventListener("click", () => {
    const expanded = toggleBtn.getAttribute("aria-expanded") === "true";
    toggleBtn.setAttribute("aria-expanded", !expanded);
    filters.classList.toggle("is-open");
    document.body.classList.toggle("filters-open");
  });

  // Auto-submit on desktop
  if (window.innerWidth > 991) {
    document.querySelectorAll(".filters-form input").forEach(input => {
      input.addEventListener("change", () => {
        input.closest("form").submit();
      });
    });
  }
});
