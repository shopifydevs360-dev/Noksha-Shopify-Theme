document.addEventListener('DOMContentLoaded', () => {
  initAllProductCartEvents();
});

/* ======================================================
   🔁 GLOBAL INIT (USED AFTER AJAX)
====================================================== */
function initAllProductCartEvents() {
  initAjaxAddToCart();
  initVariantAjaxAddToCart();
  initSafeMobileNavigation();
}

/* ======================================================
   ✅ SAFE MOBILE PRODUCT CARD NAVIGATION
   - Allows tap
   - Blocks scroll/swipe
====================================================== */
function initSafeMobileNavigation() {
  const TAP_THRESHOLD = 10; // px – movement allowed for a tap

  document.querySelectorAll('.product-card a[href]').forEach(link => {
    if (link.dataset.navInit === 'true') return;
    link.dataset.navInit = 'true';

    let startX = 0;
    let startY = 0;
    let moved = false;

    link.addEventListener('touchstart', e => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      moved = false;
    }, { passive: true });

    link.addEventListener('touchmove', e => {
      const touch = e.touches[0];
      const diffX = Math.abs(touch.clientX - startX);
      const diffY = Math.abs(touch.clientY - startY);

      if (diffX > TAP_THRESHOLD || diffY > TAP_THRESHOLD) {
        moved = true; // user is scrolling
      }
    }, { passive: true });

    link.addEventListener('touchend', e => {
      // If user scrolled, DO NOT navigate
      if (moved) return;

      // Ignore taps on cart buttons
      if (e.target.closest('.cart-button-wrapper')) return;

      window.location.href = link.href;
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
      e.stopPropagation(); // 🔑 critical for mobile

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
