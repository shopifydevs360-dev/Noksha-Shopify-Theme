document.addEventListener('DOMContentLoaded', () => {

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
      .then(r => r.json())
      .then(cart => renderAllCarts(cart));
  }

  function renderAllCarts(cart) {
    document.querySelectorAll('[data-cart-root]').forEach(root => {
      renderCart(cart, root);
    });
  }

  function renderCart(cart, root) {
    const threshold = parseInt(root.dataset.freeShippingThreshold, 10);
    const wrapper = root.querySelector('.cart-shipping-wrapper');
    const bar = root.querySelector('.shipping-progress-bar');
    const remaining = root.querySelector('.cart-shipping-remaining');
    const subtotal = root.querySelector('.cart-subtotal');

    /* Subtotal */
    if (subtotal) {
      subtotal.textContent = formatMoney(cart.items_subtotal_price);
    }

    /* Progress */
    const progress = Math.min((cart.total_price / threshold) * 100, 100);
    bar.style.width = progress + '%';

    if (cart.total_price >= threshold) {
      wrapper.classList.add('is-success');
    } else {
      wrapper.classList.remove('is-success');
      remaining.textContent = formatMoney(threshold - cart.total_price);
    }

    /* Qty sync */
    cart.items.forEach(item => {
      const row = root.querySelector(`.cart-item[data-key="${item.key}"]`);
      if (row) row.querySelector('input').value = item.quantity;
    });
  }

  /* Qty buttons */
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

  /* Remove */
  document.addEventListener('click', e => {
    if (!e.target.classList.contains('cart-item-remove')) return;
    const item = e.target.closest('.cart-item');
    updateCart({ [item.dataset.key]: 0 });
  });

  /* Init */
  fetch('/cart.js')
    .then(r => r.json())
    .then(cart => renderAllCarts(cart));
});
