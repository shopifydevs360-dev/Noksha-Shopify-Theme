/* ======================================
   THEME INITIALIZER
====================================== */
document.addEventListener("DOMContentLoaded", () => {
  initBodyScrollState();
  initPromoBarState();
  initAccordion();
});

document.addEventListener("shopify:section:load", () => {
  initPromoBarState();
});

/* ===============================
   BODY: SCROLLED STATE
================================ */
function initBodyScrollState() {
  const SCROLL_THRESHOLD = 100;
  const body = document.body;

  function onScroll() {
    body.classList.toggle("scrolled", window.scrollY > SCROLL_THRESHOLD);
  }

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ===============================
   BODY: PROMO BAR STATE
================================ */
function initPromoBarState() {
  const body = document.body;
  const promoBar = document.getElementById("announcement-bar");

  body.classList.toggle("has-promo-bar", !!promoBar);
}

/* ===============================
   ACCORDION FUNCTIONALITY
================================ */
function initAccordion() {
  document.addEventListener("click", function (e) {
    const trigger = e.target.closest(".accordion-trigger");
    if (!trigger) return;

    const item = trigger.closest(".accordion-item");
    if (!item) return;

    item.classList.toggle("active");
  });
}

/* ===============================
   SHARED CART RENDER FUNCTIONS
================================ */
function renderAllCarts(cart) {
  document.querySelectorAll("[data-cart-root]").forEach((root) => {
    renderSingleCart(cart, root);
  });
}

function renderSingleCart(cart, root) {
  updateSubtotal(cart, root);
  updateFreeShipping(cart, root);
  updateLineItems(cart, root);
  removeDeletedItems(cart, root);
}

function updateSubtotal(cart, root) {
  const subtotalEl = root.querySelector(".cart-subtotal");
  if (!subtotalEl) return;

  subtotalEl.textContent = formatMoney(cart.items_subtotal_price);
}

function updateFreeShipping(cart, root) {
  const wrapper = root.querySelector(".cart-shipping-wrapper");
  if (!wrapper) return;

  const bar = wrapper.querySelector(".shipping-progress-bar");
  const remainingEl = wrapper.querySelector(".cart-shipping-remaining");
  const threshold = parseInt(root.dataset.freeShippingThreshold, 10);

  const progress = Math.min(
    (cart.total_price / threshold) * 100,
    100
  );

  if (bar) {
    bar.style.width = progress + "%";
  }

  if (cart.total_price >= threshold) {
    wrapper.classList.add("is-success");
  } else {
    wrapper.classList.remove("is-success");
    if (remainingEl) {
      remainingEl.textContent = formatMoney(
        threshold - cart.total_price
      );
    }
  }
}

function updateLineItems(cart, root) {
  const container = root.querySelector('.cart-list-items');
  if (!container) return;

  // Update existing items
  cart.items.forEach((item) => {
    const row = root.querySelector(
      `.cart-item[data-key="${item.key}"]`
    );
    if (!row) {
      // Add new item
      const itemHTML = generateCartItemHTML(item);
      container.insertAdjacentHTML('beforeend', itemHTML);
      return;
    }

    const priceEl = row.querySelector(".cart-item-price");
    const qtyInput = row.querySelector("input");

    if (priceEl) {
      priceEl.textContent = formatMoney(item.final_line_price);
    }

    if (qtyInput) {
      qtyInput.value = item.quantity;
    }
  });
}

function generateCartItemHTML(item) {
  const variantHTML = item.variant.title !== 'Default Title' ? `<p class="cart-item-variant">${item.variant.title}</p>` : '';
  return `
    <div class="cart-item" data-key="${item.key}">
      <div class="cart-item-image">
        <a href="${item.url}">
          <img src="${item.image}" alt="${item.product.title}">
        </a>
      </div>
      <div class="cart-item-info">
        <div class="info-left">
          <a href="${item.url}" class="cart-item-title">
            ${item.product.title}
          </a>
          ${variantHTML}
          <div class="cart-item-qty">
            <button type="button" class="qty-btn qty-minus">−</button>
            <input type="number" value="${item.quantity}" min="1">
            <button type="button" class="qty-btn qty-plus">+</button>
          </div>
        </div>
        <div class="info-right">
          <p class="cart-item-price">
            ${formatMoney(item.final_line_price)}
          </p>
          <button type="button" class="cart-item-remove">
            Remove
          </button>
        </div>
      </div>
    </div>
  `;
}

function removeDeletedItems(cart, root) {
  root.querySelectorAll(".cart-item").forEach((row) => {
    const key = row.dataset.key;
    const exists = cart.items.some((item) => item.key === key);

    if (!exists) {
      row.remove();
    }
  });
}

function formatMoney(cents) {
  return (cents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: Shopify.currency.active,
  });
}

