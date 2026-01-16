document.addEventListener("DOMContentLoaded", () => {
  initCartAjax();
  initCartQuantity();
  initCartRemove();
  initCartInitialSync();
  initCartChangeListener(); // ✅ NEW
});

/* ============================
   CART AJAX CORE (QTY / REMOVE)
============================ */
function initCartAjax() {
  window.updateCartAjax = function (updates) {
    fetch("/cart/update.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    })
      .then((res) => res.json())
      .then((cart) => {
        renderAllCarts(cart);
      });
  };
}

/* ============================
   LISTEN FOR CART CHANGES
============================ */
function initCartChangeListener() {
  document.addEventListener("cart:refresh", () => {
    fetch("/cart.js")
      .then((res) => res.json())
      .then((cart) => {
        renderAllCarts(cart);
      });
  });

  /* Fallback: poll once after page interactions */
  document.addEventListener("click", () => {
    debounceCartRefresh();
  });
}

let cartRefreshTimeout = null;
function debounceCartRefresh() {
  clearTimeout(cartRefreshTimeout);
  cartRefreshTimeout = setTimeout(() => {
    fetch("/cart.js")
      .then((res) => res.json())
      .then((cart) => {
        renderAllCarts(cart);
      });
  }, 400);
}

/* ============================
   RENDER ALL CARTS
============================ */
function renderAllCarts(cart) {
  document.querySelectorAll("[data-cart-root]").forEach((root) => {
    renderSingleCart(cart, root);
  });
}

/* ============================
   RENDER SINGLE CART
============================ */
function renderSingleCart(cart, root) {
  updateSubtotal(cart, root);
  updateFreeShipping(cart, root);
  renderCartItems(cart, root);
}

/* ============================
   SUBTOTAL
============================ */
function updateSubtotal(cart, root) {
  const el = root.querySelector(".cart-subtotal");
  if (el) el.textContent = formatMoney(cart.items_subtotal_price);
}

/* ============================
   FREE SHIPPING
============================ */
function updateFreeShipping(cart, root) {
  const wrapper = root.querySelector(".cart-shipping-wrapper");
  if (!wrapper) return;

  const bar = wrapper.querySelector(".shipping-progress-bar");
  const remaining = wrapper.querySelector(".cart-shipping-remaining");
  const threshold = parseInt(root.dataset.freeShippingThreshold, 10);

  const progress = Math.min((cart.total_price / threshold) * 100, 100);
  bar.style.width = progress + "%";

  if (cart.total_price >= threshold) {
    wrapper.classList.add("is-success");
  } else {
    wrapper.classList.remove("is-success");
    remaining.textContent = formatMoney(threshold - cart.total_price);
  }
}

/* ============================
   CART ITEMS (FULL RENDER)
============================ */
function renderCartItems() {
  fetch(`/cart?section_id=cart-template`)
    .then(res => res.text())
    .then(html => {
      const doc = new DOMParser().parseFromString(html, "text/html");

      const newItems = doc.querySelector("#CartItemsWrapper");
      const currentItems = document.querySelector("#CartItemsWrapper");

      if (newItems && currentItems) {
        currentItems.innerHTML = newItems.innerHTML;
      }
    });
}

/* ============================
   QUANTITY
============================ */
function initCartQuantity() {
  document.addEventListener("click", (e) => {
    if (!e.target.classList.contains("qty-btn")) return;

    const item = e.target.closest(".cart-item");
    if (!item) return;

    const input = item.querySelector("input");
    let qty = parseInt(input.value, 10);

    if (e.target.classList.contains("qty-plus")) qty++;
    if (e.target.classList.contains("qty-minus")) qty--;

    if (qty < 1) qty = 1;

    updateCartAjax({ [item.dataset.key]: qty });
  });
}

/* ============================
   REMOVE
============================ */
function initCartRemove() {
  document.addEventListener("click", (e) => {
    if (!e.target.classList.contains("cart-item-remove")) return;

    const item = e.target.closest(".cart-item");
    updateCartAjax({ [item.dataset.key]: 0 });
  });
}

/* ============================
   INITIAL SYNC
============================ */
function initCartInitialSync() {
  fetch("/cart.js")
    .then((res) => res.json())
    .then((cart) => renderAllCarts(cart));
}

/* ============================
   UTIL
============================ */
function formatMoney(cents) {
  return (cents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: Shopify.currency.active,
  });
}
