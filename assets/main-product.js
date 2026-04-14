document.addEventListener('DOMContentLoaded', () => {
  initVariantPriceUpdate();
  initMainProductCart();
  initQuantityDropdown();
  initQuantityButtons();
  initVariantButtonState();
  initVariantSelectedLabelUpdate();
});

/* =================================
   VARIANT PRICE UPDATE (EXTENDED)
================================= */
function initVariantPriceUpdate() {
  const root = document.querySelector('.main-product');
  if (!root) return;

  const form = root.querySelector('form[action*="/cart/add"]');
  const priceItems = root.querySelectorAll('.variant-price-item');
  const variantInput = form?.querySelector('input[name="id"]');

  const addToCartBtn = root.querySelector('[data-role="add-to-cart"]');
  const buyNowBtn = root.querySelector('[data-role="buy-now"]');
  const notifyBtn = root.querySelector('[data-role="notify"]');

  if (!form || !variantInput || !addToCartBtn) {
    console.warn('Variant price update: missing elements');
    return;
  }

  if (priceItems.length) {
    togglePrice(variantInput.value);
  }

  toggleStockUI(variantInput.value);

  form.addEventListener('change', () => {
    const selectedOptions = [];

    form.querySelectorAll('.variant-group').forEach(group => {
      const checked = group.querySelector('input[type="radio"]:checked');
      const select = group.querySelector('select');

      if (checked) {
        selectedOptions.push(checked.value);
      } else if (select) {
        selectedOptions.push(select.value);
      }
    });

    const variant = window.product?.variants?.find(v =>
      v.options.every((opt, i) => opt === selectedOptions[i])
    );

    if (!variant) return;

    variantInput.value = variant.id;

    if (priceItems.length) {
      togglePrice(variant.id);
    }

    toggleStockUI(variant.id);
  });

  function togglePrice(variantId) {
    priceItems.forEach(item => {
      if (item.dataset.variantId === String(variantId)) {
        item.classList.remove('hide-price');
        item.classList.add('show-price');
      } else {
        item.classList.add('hide-price');
        item.classList.remove('show-price');
      }
    });
  }

  function toggleStockUI(variantId) {
    const variant = window.product?.variants?.find(v => v.id == variantId);
    if (!variant) return;

    if (variant.available) {
      addToCartBtn.disabled = false;
      buyNowBtn?.classList.remove('hide');
      notifyBtn?.classList.add('hide');
    } else {
      addToCartBtn.disabled = true;
      buyNowBtn?.classList.add('hide');
      notifyBtn?.classList.remove('hide');
    }
  }
}

/* =================================
   VARIANT BUTTON UI STATE
================================= */
function initVariantButtonState() {
  const productData = window.product;
  if (!productData || !productData.variants) return;

  const variantGroups = document.querySelectorAll('.variant-group');
  if (!variantGroups.length) return;

  function getSelectedOptions() {
    const options = [];

    variantGroups.forEach(group => {
      const checked = group.querySelector('input[type="radio"]:checked');
      const select = group.querySelector('select');

      if (checked) {
        options.push(checked.value);
      } else if (select) {
        options.push(select.value);
      }
    });

    return options;
  }

  function updateCheckedState() {
    document.querySelectorAll('.variant-btn').forEach(btn => {
      const input = btn.querySelector('input[type="radio"]');
      btn.classList.toggle('checked', input && input.checked);
    });
  }

  function updateStockState() {
    const selectedOptions = getSelectedOptions();

    variantGroups.forEach(group => {
      const optionIndex = parseInt(group.dataset.optionIndex, 10);

      group.querySelectorAll('.variant-btn').forEach(btn => {
        const input = btn.querySelector('input[type="radio"]');
        if (!input) return;

        btn.classList.remove('stock-out');

        const testOptions = [...selectedOptions];
        testOptions[optionIndex] = input.value;

        const match = productData.variants.find(v =>
          v.options.every((opt, i) => opt === testOptions[i])
        );

        if (!match || !match.available) {
          btn.classList.add('stock-out');
        }
      });
    });
  }

  updateCheckedState();
  updateStockState();

  document.addEventListener('change', e => {
    if (e.target.matches('.variant-btn input') || e.target.matches('.variant-group select')) {
      updateCheckedState();
      updateStockState();
    }
  });
}

/* =================================
   MAIN PRODUCT – CART HANDLER
================================= */
function initMainProductCart() {
  const root = document.querySelector('.main-product');
  if (!root) return;

  const form = root.querySelector('.product-form');
  const actions = root.querySelector('.product-actions');
  const variantInput = form?.querySelector('input[name="id"]');

  if (!form || !actions || !variantInput) return;

  const behavior = actions.dataset.cartBehavior;

  form.addEventListener('submit', e => {
    e.preventDefault();

    if (behavior === 'redirect') {
      form.submit();
      return;
    }

    if (form.querySelector('[data-role="add-to-cart"]').disabled) {
      return;
    }

    const formData = new FormData(form);

    fetch('/cart/add.js', {
      method: 'POST',
      body: formData
    })
      .then(res => res.json())
      .then(() => {
        refreshAllCartsUI();

        if (behavior === 'ajax_drawer') {
          openBagDrawer();
        }
      })
      .catch(err => console.error(err));
  });

  const buyNowBtn = root.querySelector('.btn-buy-now');
  if (buyNowBtn) {
    buyNowBtn.addEventListener('click', () => {
      if (buyNowBtn.classList.contains('hide')) return;

      const formData = new FormData(form);

      fetch('/cart/add.js', {
        method: 'POST',
        body: formData
      })
        .then(() => {
          window.location.href = '/checkout';
        })
        .catch(err => console.error(err));
    });
  }
}

/* =================================
   QUANTITY DROPDOWN
================================= */
function initQuantityDropdown() {
  document.addEventListener('click', e => {
    const dropdown = e.target.closest('[data-qty-dropdown]');
    const toggle = e.target.closest('[data-qty-toggle]');
    const item = e.target.closest('.qty-item');

    document.querySelectorAll('.quantity-dropdown').forEach(d => {
      if (d !== dropdown) d.classList.remove('is-open');
    });

    if (toggle && dropdown) {
      dropdown.classList.toggle('is-open');
    }

    if (item) {
      const value = item.dataset.qty;
      const container = item.closest('.quantity-dropdown');
      if (!container) return;

      const input = container.querySelector("input[name='quantity']");
      const label = container.querySelector('.qty-toggle');

      if (input) input.value = value;
      if (label) label.textContent = item.textContent;

      container.querySelectorAll('.qty-item').forEach(i => {
        i.classList.remove('is-selected');
      });

      item.classList.add('is-selected');
      container.classList.remove('is-open');
    }
  });
}

/* =================================
   QUANTITY BUTTONS (PLUS / MINUS)
================================= */
function initQuantityButtons() {
  document.addEventListener('click', e => {
    const minusBtn = e.target.closest('.qty-minus');
    const plusBtn = e.target.closest('.qty-plus');

    if (!minusBtn && !plusBtn) return;

    const wrapper = e.target.closest('[data-quantity-wrapper]');
    if (!wrapper) return;

    const input = wrapper.querySelector('input[name="quantity"]');
    if (!input) return;

    let value = parseInt(input.value, 10) || 1;

    if (minusBtn) {
      value = Math.max(1, value - 1);
    }

    if (plusBtn) {
      value += 1;
    }

    input.value = value;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

/* =================================
   VARIANT LABEL UPDATE
================================= */
function initVariantSelectedLabelUpdate() {
  const variantGroups = document.querySelectorAll('.variant-group');

  variantGroups.forEach(group => {
    const selectedValueEl = group.querySelector('[data-selected-value]');
    if (!selectedValueEl) return;

    const radios = group.querySelectorAll('input[type="radio"]');
    const select = group.querySelector('select');

    radios.forEach(radio => {
      radio.addEventListener('change', function () {
        if (this.checked) {
          selectedValueEl.textContent = this.value;
        }
      });
    });

    if (select) {
      select.addEventListener('change', function () {
        selectedValueEl.textContent = this.value;
      });
    }
  });
}