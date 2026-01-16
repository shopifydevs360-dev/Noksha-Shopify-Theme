document.addEventListener('DOMContentLoaded', () => {
  const FREE_SHIPPING_THRESHOLD = 10000;
  let isUpdating = false;

  /* ============================
     UTIL
  ============================ */
  function formatMoney(cents) {
    return (cents / 100).toLocaleString(undefined, {
      style: 'currency',
      currency: Shopify.currency.active
    });
  }

  /* ============================
     CART API
  ============================ */
  function fetchCart() {
    return fetch('/cart.js').then(res => res.json());
  }

  function updateCart(updates) {
    if (isUpdating) return;
    isUpdating = true;

    fetch('/cart/update.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates })
    })
      .then(res => res.json())
      .then(cart => {
        renderAllCarts(cart);
        isUpdating = false;
      })
      .catch(() => {
        isUpdating = false;
      });
  }

  /* ============================
     RENDER
  ============================ */
  function renderAllCarts(cart) {
    document.querySelectorAll('[data-cart-root]').forEach(cartRoot => {
      renderCart(cart, cartRoot);
    });
  }

  function renderCart(cart, root) {
    /* ----- Subtotal ----- */
    const subtotalEl = root.querySelector('.cart-subtotal');
    if (subtotalEl) {
      subtotalEl.textContent = formatMoney(cart.items_subtotal_price);
    }

    /* ----- Free Shipping ----- */
  /* ---------- Free Shipping (NO innerHTML) ---------- */
  const shippingWrapper = root.querySelector('.cart-shipping-wrapper');
  if (shippingWrapper) {
    const threshold = parseInt(
      shippingWrapper.dataset.freeShippingThreshold,
      10
    );

    const messageEl = shippingWrapper.querySelector('.cart-free-shipping p');
    const barEl = shippingWrapper.querySelector('.shipping-progress-bar');
    const successEl = shippingWrapper.querySelector('.cart-free-shipping.success');

    if (cart.total_price >= threshold) {
      // Success state
      shippingWrapper.classList.add('is-success');

      if (messageEl) {
        messageEl.textContent = '🎉 You’ve unlocked free shipping!';
      }
      if (barEl) {
        barEl.style.width = '100%';
      }
    } else {
      // Normal state
      const remaining = threshold - cart.total_price;
      const progress = Math.min(
        (cart.total_price / threshold) * 100,
        100
      );

      shippingWrapper.classList.remove('is-success');

      if (messageEl) {
        messageEl.textContent =
          `You are ${formatMoney(remaining)} away from free shipping`;
      }
      if (barEl) {
        barEl.style.width = `${progress}%`;
      }
    }
  }

    /* ----- Items ----- */
    cart.items.forEach(item => {
      const row = root.querySelector(`.cart-item[data-key="${item.key}"]`);
      if (!row) return;

      row.querySelector('.cart-item-price').textContent =
        formatMoney(item.final_line_price);

      row.querySelector('input').value = item.quantity;
    });

    /* ----- Remove deleted ----- */
    root.querySelectorAll('.cart-item').forEach(el => {
      const key = el.dataset.key;
      if (!cart.items.some(i => i.key === key)) {
        el.remove();
      }
    });
  }

  /* ============================
     EVENTS
  ============================ */

  // + / − buttons
  document.addEventListener('click', e => {
    if (!e.target.classList.contains('qty-btn')) return;

    const item = e.target.closest('.cart-item');
    const input = item.querySelector('input');
    let qty = parseInt(input.value, 10);

    if (e.target.classList.contains('qty-plus')) qty++;
    if (e.target.classList.contains('qty-minus')) qty--;

    if (qty < 1) qty = 1;

    updateCart({ [item.dataset.key]: qty });
  });

  // Manual quantity input
  document.addEventListener('change', e => {
    if (!e.target.closest('.cart-item-qty input')) return;

    const input = e.target;
    const item = input.closest('.cart-item');
    let qty = parseInt(input.value, 10);

    if (isNaN(qty) || qty < 1) qty = 1;

    updateCart({ [item.dataset.key]: qty });
  });

  // Remove item
  document.addEventListener('click', e => {
    if (!e.target.classList.contains('cart-item-remove')) return;

    const item = e.target.closest('.cart-item');
    updateCart({ [item.dataset.key]: 0 });
  });

  /* ============================
     INIT
  ============================ */
  fetchCart().then(cart => {
    renderAllCarts(cart);
  });
});
