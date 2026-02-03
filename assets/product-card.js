document.addEventListener("DOMContentLoaded", () => {
  initAllProductCartEvents();
});

/* ======================================================
   🔁 GLOBAL INIT (USED AFTER AJAX)
====================================================== */
function initAllProductCartEvents() {
  initAjaxAddToCart();
  initVariantAjaxAddToCart();
}

/* ---------------------------------
   SINGLE PRODUCT – AJAX MODE
---------------------------------- */
function initAjaxAddToCart() {
  document.querySelectorAll(
    '.cart-button-wrapper.btn-action--ajax .product-form,' +
    '.cart-button-wrapper.btn-action--ajax_drawer .product-form'
  ).forEach(form => {
    if (form.dataset.ajaxInit === 'true') return;
    form.dataset.ajaxInit = 'true';

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const wrapper = this.closest('.cart-button-wrapper');
      const isDrawer = wrapper?.classList.contains('btn-action--ajax_drawer');

      fetch('/cart/add.js', {
        method: 'POST',
        body: new FormData(this)
      })
        .then(res => res.json())
        .then(() => {
          refreshAllCartsUI();
          if (isDrawer) openBagDrawer();
        })
        .catch(err => console.error('Add to cart error:', err));
    });
  });
}

/* ---------------------------------
   MULTI VARIANT – AJAX MODE
---------------------------------- */
function initVariantAjaxAddToCart() {
  document.querySelectorAll(
    '.cart-button-wrapper.btn-action--ajax .card-variant-btn,' +
    '.cart-button-wrapper.btn-action--ajax_drawer .card-variant-btn'
  ).forEach(button => {
    if (button.dataset.ajaxInit === 'true') return;
    button.dataset.ajaxInit = 'true';

    button.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation(); // ✅ FIX mobile double-tap

      if (this.disabled) return;

      const wrapper = this.closest('.cart-button-wrapper');
      const isDrawer = wrapper?.classList.contains('btn-action--ajax_drawer');

      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: this.dataset.variantId,
          quantity: 1
        })
      })
        .then(res => res.json())
        .then(() => {
          refreshAllCartsUI();
          if (isDrawer) openBagDrawer();
        });
    });
  });
}


/* ---------------------------------
   CART COUNT UPDATE
---------------------------------- */
function updateCartCount() {
  fetch('/cart.js')
    .then(res => res.json())
    .then(cart => {
      document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = cart.item_count;
      });
    });
}

/* ---------------------------------
   OPEN BAG DRAWER
---------------------------------- */
function openBagDrawer() {
  const trigger = document.querySelector('[data-trigger-section="bag-drawer"]');
  if (trigger) trigger.click();
}
