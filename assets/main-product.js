

document.addEventListener('DOMContentLoaded', () => {
  initVariantPriceUpdate();
  initMainProductCart();
  initQuantityDropdown();
  initVariantButtonState();
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

  // NEW – buttons
  const addToCartBtn = root.querySelector('[data-role="add-to-cart"]');
  const buyNowBtn = root.querySelector('[data-role="buy-now"]');
  const notifyBtn = root.querySelector('[data-role="notify"]');

  if (!form || !priceItems.length || !window.product || !variantInput || !addToCartBtn) {
    console.warn('Variant price update: missing elements');
    return;
  }

  // Initial load
  togglePrice(variantInput.value);
  toggleStockUI(variantInput.value);

  form.addEventListener('change', () => {
    const selectedOptions = [];

    form.querySelectorAll('.variant-group').forEach(group => {
      const checked = group.querySelector('input[type="radio"]:checked');
      if (checked) selectedOptions.push(checked.value);
    });

    const variant = window.product.variants.find(v =>
      v.options.every((opt, i) => opt === selectedOptions[i])
    );

    if (!variant) return;

    // Update variant ID
    variantInput.value = variant.id;

    // Existing price logic
    togglePrice(variant.id);

    // NEW stock logic
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

  // NEW – stock control
  function toggleStockUI(variantId) {
    const variant = window.product.variants.find(v => v.id == variantId);
    if (!variant) return;

    if (variant.available) {
      addToCartBtn.textContent = 'Add to cart';
      addToCartBtn.disabled = false;
      buyNowBtn?.classList.remove('hide');
      notifyBtn?.classList.add('hide');
    } else {
      addToCartBtn.textContent = 'Out of stock';
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
      if (checked) options.push(checked.value);
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

  // Initial state
  updateCheckedState();
  updateStockState();

  // On variant change
  document.addEventListener('change', e => {
    if (e.target.matches('.variant-btn input')) {
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

  /* -----------------------------
     ADD TO CART
  ----------------------------- */
  form.addEventListener('submit', e => {
    e.preventDefault();

    if (behavior === 'redirect') {
      form.submit();
      return;
    }

    // Block sold out add
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

  /* -----------------------------
     BUY IT NOW
  ----------------------------- */
  const buyNowBtn = root.querySelector('.btn-buy-now');
  if (buyNowBtn) {
    buyNowBtn.addEventListener('click', () => {
      // Block sold out
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
  document.addEventListener('click', (e) => {
    const dropdown = e.target.closest('[data-qty-dropdown]');
    const toggle = e.target.closest('[data-qty-toggle]');
    const item = e.target.closest('.qty-item');

    // Close all other dropdowns
    document.querySelectorAll('.quantity-dropdown').forEach(d => {
      if (d !== dropdown) d.classList.remove('is-open');
    });

    // Toggle dropdown
    if (toggle && dropdown) {
      dropdown.classList.toggle('is-open');
    }

    // Select quantity
    if (item) {
      const value = item.dataset.qty;
      const container = item.closest('.quantity-dropdown');

      if (!container) return;

      const input = container.querySelector("input[name='quantity']");
      const label = container.querySelector('.qty-toggle');

      if (input) input.value = value;
      if (label) label.textContent = item.textContent;

      container.querySelectorAll('.qty-item').forEach(i =>
        i.classList.remove('is-selected')
      );

      item.classList.add('is-selected');
      container.classList.remove('is-open');
    }
  });
}

