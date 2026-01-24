document.addEventListener("click", e => {
  const btn = e.target.closest(".load-more-btn");
  if (!btn) return;

  e.preventDefault();

  fetch(btn.href)
    .then(res => res.text())
    .then(html => {
      const doc = new DOMParser().parseFromString(html, "text/html");
      const newProducts = doc.querySelectorAll("#productsContainer > *");
      const container = document.getElementById("productsContainer");

      newProducts.forEach(el => container.appendChild(el));

      const nextBtn = doc.querySelector(".load-more-btn");
      if (nextBtn) {
        btn.href = nextBtn.href;
      } else {
        btn.remove();
      }
    });
});
