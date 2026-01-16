document.addEventListener('DOMContentLoaded', () => {

  /* =====================
     UTIL
  ===================== */
  function formatMoney(cents) {
    return (cents / 100).toLocaleString(undefined, {
      style: 'currency',
      currency: Shopify.currency.active
    });
  }

  /* =====================
     CART API
  ===================== */
  function updateCart(updates) {
    fetch('/cart/update.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates })
    })
      .then(res => res.json())
      .then(cart => {
        renderAllCarts(cart);
      });
  }

  /* =====================
     RENDER
  ===================== */
  function renderAllCarts(cart) {
    document.querySelectorAll('[data-cart-root]').forEach(root => {
      renderCart(cart, root);
    });
  }

  function renderCart(cart, root) {
    const threshold = parseInt(
      root.dataset.freeShippingThreshold,
      10
    );

    /* ---------- Subtotal ---------- */
    const subtotalEl = root.querySelector('.cart-subtotal');
    if (subtotalEl) {
      subtotalEl.textContent =
        formatMoney(cart.items_subtotal_price);
    }

    /* ---------- Free shipping progress ---------- */
    const wrapper = root.querySelector('.cart-shipping-wrapper');
    const bar = root.querySelector('.shipping-progress-bar');
    const remainingEl = root.querySelector('.cart-shipping-remaining');

    if (wrapper && bar && remainingEl) {
      const progress = Math.min(
        (cart.total_price / threshold) * 100,
        100
      );

      bar.style.width = progress + '%';

      if (cart.total_price >= threshold) {
        wrapper.classList.add('is-success');
      } else {
        wrapper.classList.remove('is-success');
        remainingEl.textContent =
          formatMoney(threshold - cart.total_price);
      }
    }

    /* ---------- Line prices + quantities ---------- */
    cart.items.forEach(item => {
      const row = root.querySelector(
        `.cart-item[data-key="${item.key}"]`
      );
      if (!row) return;

      const priceEl = row.querySelector('.cart-item-price');
      const qtyInput = row.querySelector('input');

      if (priceEl) {
        priceEl.textContent =
          formatMoney(item.final_line_price);
      }

      if (qtyInput) {
        qtyInput.value = item.quantity;
      }
    });

    /* ---------- Remove deleted items ---------- */
    root.querySelectorAll('.cart-item').forEach(row => {
      const key = row.dataset.key;
      const exists = cart.items.some(item => item.key === key);
      if (!exists) {
        row.remove();
      }
    });
  }

  /* =====================
     EVENTS
  ===================== */

  // Quantity buttons
  document.addEventListener('click', e => {
    if (!e.target.classList.contains('qty-btn')) return;

    const item = e.target.closest('.cart-item');
    if (!item) return;

    const input = item.querySelector('input');
    let qty = parseInt(input.value, 10);

    if (e.target.classList.contains('qty-plus')) qty++;
    if (e.target.classList.contains('qty-minus')) qty--;

    if (qty < 1) qty = 1;

    updateCart({ [item.dataset.key]: qty });
  });

  // Remove item
  document.addEventListener('click', e => {
    if (!e.target.classList.contains('cart-item-remove')) return;

    const item = e.target.closest('.cart-item');
    if (!item) return;

    updateCart({ [item.dataset.key]: 0 });
  });

  /* =====================
     INIT
  ===================== */
  fetch('/cart.js')
    .then(res => res.json())
    .then(cart => {
      renderAllCarts(cart);
    });

});
