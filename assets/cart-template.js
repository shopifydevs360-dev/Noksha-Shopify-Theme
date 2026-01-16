document.addEventListener('DOMContentLoaded', () => {
  const FREE_SHIPPING_THRESHOLD = 10000;
  let isUpdating = false;

  function formatMoney(cents) {
    return (cents / 100).toLocaleString(undefined, {
      style: 'currency',
      currency: Shopify.currency.active
    });
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
        renderCart(cart);
        isUpdating = false;
      })
      .catch(() => {
        isUpdating = false;
      });
  }

  function renderCart(cart) {
    /* ---------- Subtotal ---------- */
    const subtotalEl = document.querySelector('.cart-subtotal');
    if (subtotalEl) {
      subtotalEl.textContent = formatMoney(cart.items_subtotal_price);
    }

    /* ---------- Shipping Message ---------- */
    const shippingWrapper = document.querySelector('.cart-shipping-wrapper');
    if (shippingWrapper) {
      if (cart.total_price >= FREE_SHIPPING_THRESHOLD) {
        shippingWrapper.innerHTML = `
          <p class="cart-free-shipping success">
            🎉 You’ve unlocked free shipping!
          </p>
        `;
      } else {
        const remaining = FREE_SHIPPING_THRESHOLD - cart.total_price;
        const progress = Math.min(
          (cart.total_price / FREE_SHIPPING_THRESHOLD) * 100,
          100
        );

        shippingWrapper.innerHTML = `
          <div class="cart-free-shipping">
            <p>
              You are ${formatMoney(remaining)} away from free shipping
            </p>
            <div class="shipping-progress">
              <span class="shipping-progress-bar" style="width:${progress}%"></span>
            </div>
          </div>
        `;
      }
    }

    /* ---------- Update Items ---------- */
    cart.items.forEach(item => {
      const row = document.querySelector(`.cart-item[data-key="${item.key}"]`);
      if (!row) return;

      row.querySelector('.cart-item-price').textContent =
        formatMoney(item.final_line_price);

      row.querySelector('input').value = item.quantity;
    });

    /* ---------- Remove missing items ---------- */
    document.querySelectorAll('.cart-item').forEach(itemEl => {
      const key = itemEl.dataset.key;
      const exists = cart.items.some(i => i.key === key);
      if (!exists) itemEl.remove();
    });
  }

  /* ---------- Quantity buttons ---------- */
  document.addEventListener('click', e => {
    if (!e.target.classList.contains('qty-btn')) return;

    const item = e.target.closest('.cart-item');
    const input = item.querySelector('input');
    let qty = parseInt(input.value, 10);

    if (e.target.classList.contains('qty-plus')) qty++;
    if (e.target.classList.contains('qty-minus')) qty--;

    if (qty < 1) return;

    updateCart({ [item.dataset.key]: qty });
  });

  /* ---------- Remove item ---------- */
  document.addEventListener('click', e => {
    if (!e.target.classList.contains('cart-item-remove')) return;

    const item = e.target.closest('.cart-item');
    updateCart({ [item.dataset.key]: 0 });
  });
});
