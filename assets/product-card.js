document.addEventListener("DOMContentLoaded", () => {
  initAjaxAddToCart();
  initVariantAjaxAddToCart();
});

/* ---------------------------------
   SINGLE PRODUCT – AJAX MODE
---------------------------------- */
function initAjaxAddToCart() {
  document.querySelectorAll(
    '.cart-button-wrapper.btn-action--ajax .product-form,' +
    '.cart-button-wrapper.btn-action--ajax_drawer .product-form'
  ).forEach(form => {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const wrapper = this.closest('.cart-button-wrapper');
      const isDrawer = wrapper.classList.contains('btn-action--ajax_drawer');

      fetch('/cart/add.js', {
        method: 'POST',
        body: new FormData(this)
      })
        .then(res => res.json())
        .then(cart => {
          document.querySelectorAll('.cart-count').forEach(el => {
            el.textContent = cart.item_count;
          });
          renderAllCarts(cart);
          if (isDrawer) openBagDrawer();
        })
        .catch(err => console.error(err));
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
    button.addEventListener('click', function () {
      if (this.disabled) return;

      const wrapper = this.closest('.cart-button-wrapper');
      const isDrawer = wrapper.classList.contains('btn-action--ajax_drawer');

      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: this.dataset.variantId,
          quantity: 1
        })
      })
        .then(res => res.json())
        .then(cart => {
          document.querySelectorAll('.cart-count').forEach(el => {
            el.textContent = cart.item_count;
          });
          renderAllCarts(cart);
          if (isDrawer) openBagDrawer();
        })
        .catch(err => console.error(err));
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
   OPEN BAG DRAWER (EXISTING SYSTEM)
---------------------------------- */
function openBagDrawer() {
  const drawer = document.querySelector('[data-open-section="bag-drawer"]');
  const overlay = document.getElementById("js-open-overlay");
  const expandedArea = document.getElementById("area-expended");

  if (!drawer) return;

  drawer.classList.add('bag-drawer-open', "is-open");
  if (overlay) overlay.classList.remove("hide");
  if (expandedArea) expandedArea.classList.add("expended-area-active");

  // Add body states
  document.body.classList.add("drawer-flyout", "disable-scrollbars");
}
