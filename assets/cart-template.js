document.addEventListener('DOMContentLoaded', () => {

  const freeShippingThreshold = 10000;

  function formatMoney(cents) {
    return (cents / 100).toLocaleString(undefined, {
      style: 'currency',
      currency: Shopify.currency.active
    });
  }

  function updateCart(updates) {
    fetch('/cart/update.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates })
    })
    .then(res => res.json())
    .then(cart => {
      renderCart(cart);
    });
  }

  function renderCart(cart) {

    // Update subtotal
    document.querySelector('.cart-subtotal').innerText =
      formatMoney(cart.items_subtotal_price);

    // Update free shipping text & bar
    const freeWrap = document.querySelector('.cart-free-shipping');
    if (!freeWrap) return;

    const remaining = freeShippingThreshold - cart.total_price;
    const progress = Math.min((cart.total_price / freeShippingThreshold) * 100, 100);

    freeWrap.querySelector('p').innerText =
      remaining > 0
        ? `You are ${formatMoney(remaining)} away from free shipping`
        : `You’ve unlocked free shipping`;

    freeWrap.querySelector('.shipping-progress-bar').style.width =
      progress + '%';

    // Update item prices
    cart.items.forEach(item => {
      const row = document.querySelector(`[data-key="${item.key}"]`);
      if (!row) return;

      row.querySelector('.cart-item-price').innerText =
        formatMoney(item.final_line_price);

      row.querySelector('input').value = item.quantity;
    });
  }

  // Quantity buttons
  document.addEventListener('click', e => {
    if (!e.target.classList.contains('qty-btn')) return;

    const item = e.target.closest('.cart-item');
    const input = item.querySelector('input');
    let qty = parseInt(input.value, 10);

    qty = e.target.classList.contains('qty-plus') ? qty + 1 : qty - 1;
    if (qty < 1) return;

    const key = item.dataset.key;
    updateCart({ [key]: qty });
  });

  // Remove item
  document.addEventListener('click', e => {
    if (!e.target.classList.contains('cart-item-remove')) return;

    const item = e.target.closest('.cart-item');
    const key = item.dataset.key;

    updateCart({ [key]: 0 });
    item.remove();
  });

});
