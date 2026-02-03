document.addEventListener('DOMContentLoaded', () => {
  initAllProductCartEvents();
});

/* ======================================================
   🔁 GLOBAL INIT (USED AFTER AJAX)
====================================================== */
function initAllProductCartEvents() {
  initAjaxAddToCart();
  initVariantAjaxAddToCart();
  fixMobileProductCardNavigation();
}

/* ======================================================
   ✅ MOBILE FIX – PRODUCT CARD NAVIGATION
   Prevents double-tap issue
====================================================== */
function fixMobileProductCardNavigation() {
  // Make sure product links always navigate on first tap
  document.querySelectorAll('.product-card a[href]').forEach(link => {
    if (link.dataset.navInit === 'true') return;
    link.dataset.navInit = 'true';

    // Touch devices fix
    link.addEventListener('touchend', function (e) {
      // If tap came from cart/variant button, ignore
      if (e.target.closest('.cart-button-wrapper')) return;

      window.location.href = this.href;
    });
  });
}

/* ======================================================
   SINGLE PRODUCT – AJAX ADD TO CART
====================================================== */
function initAjaxAddToCart() {
  document.querySelectorAll(
    '.cart-button-wrapper.btn-action--ajax .product-form,' +
    '.cart-button-wrapper.btn-action--ajax_drawer .product-form'
  ).forEach(form => {
    if (form.dataset.ajaxInit === 'true') return;
    form.dataset.ajaxInit = 'true';

    form.addEventListener('submit', function (e) {
      // ✅ Allow normal navigation clicks
      if (e.submitter && e.submitter.closest('a')) return;

      e.preventDefault();
      e.stopPropagation();

      const wrapper = this.closest('.cart-button-wrapper');
      const isDrawer = wrapper?.classList.contains('btn-action--ajax_drawer');

      fetch('/cart/add.js', {
        method: 'POST',
        body: new FormData(this)
      })
        .then(res => res.json())
        .then(() => {
          refreshAllCartsUI();
          updateCartCount();
          if (isDrawer) openBagDrawer();
        })
        .catch(err => console.error('Add to cart error:', err));
    });
  });
}

/* ======================================================
   MULTI VARIANT – AJAX ADD TO CART
====================================================== */
function initVariantAjaxAddToCart() {
  document.querySelectorAll(
    '.cart-button-wrapper.btn-action--ajax .card-variant-btn,' +
    '.cart-button-wrapper.btn-action--ajax_drawer .card-variant-btn'
  ).forEach(button => {
    if (button.dataset.ajaxInit === 'true') return;
    button.dataset.ajaxInit = 'true';

    const handler = function (e) {
      e.preventDefault();
      e.stopPropagation(); // 🔑 CRITICAL FIX FOR MOBILE

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
          updateCartCount();
          if (isDrawer) openBagDrawer();
        })
        .catch(err => console.error('Variant add error:', err));
    };

    // Attach to BOTH click & touchend (mobile fix)
    button.addEventListener('click', handler);
    button.addEventListener('touchend', handler);
  });
}

/* ======================================================
   CART COUNT UPDATE
====================================================== */
function updateCartCount() {
  fetch('/cart.js')
    .then(res => res.json())
    .then(cart => {
      document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = cart.item_count;
      });
    });
}

/* ======================================================
   OPEN BAG DRAWER
====================================================== */
function openBagDrawer() {
  const trigger = document.querySelector('[data-trigger-section="bag-drawer"]');
  if (trigger) trigger.click();
}
