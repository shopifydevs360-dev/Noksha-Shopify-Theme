function renderCart(cart) {
  document.querySelectorAll('[data-cart-root]').forEach(cartRoot => {

    /* Subtotal */
    const subtotal = cartRoot.querySelector('.cart-subtotal');
    if (subtotal) {
      subtotal.textContent = formatMoney(cart.items_subtotal_price);
    }

    /* Shipping */
    const shippingWrapper = cartRoot.querySelector('.cart-shipping-wrapper');
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

    /* Items */
    cart.items.forEach(item => {
      const row = cartRoot.querySelector(`.cart-item[data-key="${item.key}"]`);
      if (!row) return;

      row.querySelector('.cart-item-price').textContent =
        formatMoney(item.final_line_price);

      row.querySelector('input').value = item.quantity;
    });

    /* Remove missing */
    cartRoot.querySelectorAll('.cart-item').forEach(el => {
      const key = el.dataset.key;
      if (!cart.items.some(i => i.key === key)) {
        el.remove();
      }
    });
  });
}
