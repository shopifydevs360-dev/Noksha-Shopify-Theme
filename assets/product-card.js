document.addEventListener("DOMContentLoaded", () => {
  initAjaxAddToCart();
  initVariantAjaxAddToCart();
});

/* ============================
   SINGLE PRODUCT – AJAX
============================ */
function initAjaxAddToCart() {
  document.querySelectorAll(
    '.cart-button-wrapper.btn-action--ajax .product-form,' +
    '.cart-button-wrapper.btn-action--ajax_drawer .product-form'
  ).forEach(form => {
    form.addEventListener("submit", e => {
      e.preventDefault();

      const wrapper = form.closest(".cart-button-wrapper");
      const isDrawer = wrapper.classList.contains("btn-action--ajax_drawer");

      fetch("/cart/add.js", {
        method: "POST",
        body: new FormData(form),
      })
        .then(res => res.json())
        .then(cart => {
          refreshCart(cart); // 🔥 FULL SYNC
          if (isDrawer) openBagDrawer();
        })
        .catch(err => console.error(err));
    });
  });
}

/* ============================
   MULTI VARIANT – AJAX
============================ */
function initVariantAjaxAddToCart() {
  document.querySelectorAll(
    '.cart-button-wrapper.btn-action--ajax .card-variant-btn,' +
    '.cart-button-wrapper.btn-action--ajax_drawer .card-variant-btn'
  ).forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;

      const wrapper = btn.closest(".cart-button-wrapper");
      const isDrawer = wrapper.classList.contains("btn-action--ajax_drawer");

      fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: btn.dataset.variantId,
          quantity: 1,
        }),
      })
        .then(res => res.json())
        .then(cart => {
          refreshCart(cart); // 🔥 FULL SYNC
          if (isDrawer) openBagDrawer();
        })
        .catch(err => console.error(err));
    });
  });
}

/* ============================
   OPEN CART DRAWER
============================ */
function openBagDrawer() {
  const trigger = document.querySelector('[data-trigger-section="bag-drawer"]');
  if (trigger) trigger.click();
}
