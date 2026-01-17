document.addEventListener("DOMContentLoaded", () => {
  initCartAjax();
  initCartQuantity();
  initCartRemove();
  initCartInitialSync();
});

/* ============================
   CART AJAX CORE (UPDATE + REMOVE)
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
        updateAllCartUI(cart);
      })
      .catch((err) => console.error("Cart update error:", err));
  };
}

/* ============================
   GLOBAL CART UI REFRESH
   ✅ Call this after /cart/add.js too
============================ */
window.refreshAllCartsUI = function () {
  fetch("/cart.js")
    .then((res) => res.json())
    .then((cart) => {
      updateAllCartUI(cart);
    })
    .catch((err) => console.error("Cart refresh error:", err));
};

/* ============================
   UPDATE ALL CART UI
============================ */
function updateAllCartUI(cart) {
  renderAllCarts(cart);
  updateCartCount(cart);
}

/* ============================
   RENDER ALL CARTS (Page + Drawer)
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

  // ✅ Update existing rows
  updateLineItems(cart, root);

  // ✅ Remove deleted items
  removeDeletedItems(cart, root);

  // ✅ Add new items instantly (refresh HTML list)
  const domItems = root.querySelectorAll(".cart-item").length;
  if (cart.items.length !== domItems) {
    refreshCartItemList(root);
  }
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
  if (!threshold || threshold <= 0) return;

  const progress = Math.min((cart.total_price / threshold) * 100, 100);

  if (bar) {
    bar.style.width = progress + "%";
  }

  if (cart.total_price >= threshold) {
    wrapper.classList.add("is-success");
  } else {
    wrapper.classList.remove("is-success");
    if (remainingEl) {
      remainingEl.textContent = formatMoney(threshold - cart.total_price);
    }
  }
}

/* ============================
   LINE ITEMS (PRICE + QTY)
============================ */
function updateLineItems(cart, root) {
  cart.items.forEach((item) => {
    const row = root.querySelector(`.cart-item[data-key="${item.key}"]`);
    if (!row) return;

    const priceEl = row.querySelector(".cart-item-price");
    const qtyInput = row.querySelector("input[type='number']");

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

    const itemRow = e.target.closest(".cart-item");
    if (!itemRow) return;

    const input = itemRow.querySelector("input[type='number']");
    if (!input) return;

    let qty = parseInt(input.value, 10);

    if (e.target.classList.contains("qty-plus")) qty++;
    if (e.target.classList.contains("qty-minus")) qty--;

    if (qty < 1) qty = 1;

    updateCartAjax({ [itemRow.dataset.key]: qty });
  });
}

/* ============================
   REMOVE EVENT
============================ */
function initCartRemove() {
  document.addEventListener("click", (e) => {
    if (!e.target.classList.contains("cart-item-remove")) return;

    const itemRow = e.target.closest(".cart-item");
    if (!itemRow) return;

    updateCartAjax({ [itemRow.dataset.key]: 0 });
  });
}

/* ============================
   INITIAL SYNC
============================ */
function initCartInitialSync() {
  refreshAllCartsUI();
}

/* ============================
   REFRESH CART ITEM LIST HTML
   ✅ This is what makes NEW items show instantly
============================ */
function refreshCartItemList(root) {
  fetch("/cart?view=ajax")
    .then((res) => res.text())
    .then((html) => {
      const temp = document.createElement("div");
      temp.innerHTML = html;

      const newList = temp.querySelector(".cart-list-items");
      const currentList = root.querySelector(".cart-list-items");

      if (newList && currentList) {
        currentList.innerHTML = newList.innerHTML;
      }
    })
    .catch((err) => console.error("Refresh cart items error:", err));
}

/* ============================
   CART COUNT UPDATE
============================ */
function updateCartCount(cart = null) {
  // If cart object already available, no need to fetch again
  if (cart && typeof cart.item_count !== "undefined") {
    document.querySelectorAll(".cart-count").forEach((el) => {
      el.textContent = cart.item_count;
    });
    return;
  }

  // fallback
  fetch("/cart.js")
    .then((res) => res.json())
    .then((cartData) => {
      document.querySelectorAll(".cart-count").forEach((el) => {
        el.textContent = cartData.item_count;
      });
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
