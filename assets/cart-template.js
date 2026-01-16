document.addEventListener("DOMContentLoaded", () => {
  initCartAjax();
  initCartQuantity();
  initCartRemove();
  initCartInitialSync();
});

/* ============================
   CART AJAX CORE
============================ */
function initCartAjax() {
  window.updateCartAjax = function (updates) {
    fetch("/cart/update.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    })
      .then(res => res.json())
      .then(cart => {
        renderAllCarts(cart);
        updateCartCount(); // ✅ sync header counter
      });
  };
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
  updateLineItems(cart, root);
  removeDeletedItems(cart, root);
}

/* ============================
   SUBTOTAL
============================ */
function updateSubtotal(cart, root) {
  const subtotalEl = root.querySelector(".cart-subtotal");
  if (!subtotalEl) return;

  subtotalEl.textContent = formatMoney(cart.items_subtotal_price);
}

/* ============================
   FREE SHIPPING PROGRESS
============================ */
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

/* ============================
   LINE ITEMS (PRICE + QTY)
============================ */
function updateLineItems(cart, root) {
  const list = root.querySelector(".cart-list-items");
  if (!list) return;

  cart.items.forEach((item) => {
    let row = list.querySelector(
      `.cart-item[data-key="${item.key}"]`
    );

    // 🆕 Item does not exist → create it
    if (!row) {
      list.insertAdjacentHTML(
        "beforeend",
        createCartItem(item)
      );
      return;
    }

    // Existing item → update
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


/* ============================
   REMOVE DELETED ITEMS
============================ */
function removeDeletedItems(cart, root) {
  root.querySelectorAll(".cart-item").forEach((row) => {
    const key = row.dataset.key;
    const exists = cart.items.some((item) => item.key === key);

    if (!exists) {
      row.remove();
    }
  });
}

/* ============================
   QUANTITY EVENTS
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
   REMOVE EVENT
============================ */
function initCartRemove() {
  document.addEventListener("click", (e) => {
    if (!e.target.classList.contains("cart-item-remove")) return;

    const item = e.target.closest(".cart-item");
    if (!item) return;

    updateCartAjax({ [item.dataset.key]: 0 });
  });
}

/* ============================
   INITIAL SYNC
============================ */
function initCartInitialSync() {
  fetch("/cart.js")
    .then((res) => res.json())
    .then((cart) => {
      renderAllCarts(cart);
    });
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



