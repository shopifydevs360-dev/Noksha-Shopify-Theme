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
      .then((res) => res.json())
      .then((cart) => {
        renderAllCarts(cart);
        updateCartCount();
      })
      .catch((error) => {
        console.error("Cart update failed:", error);
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
  updateDiscountProgress(cart, root);
  updateLineItems(cart, root);
  removeDeletedItems(cart, root);

  const domItems = root.querySelectorAll(".cart-item").length;

  // Refresh full list only when cart was empty before and now has items
  if (domItems === 0 && cart.items.length > 0) {
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

  if (!threshold || threshold === 0) return;

  const progress = Math.min((cart.total_price / threshold) * 100, 100);

  if (bar) {
    bar.style.width = progress + "%";
  }

  if (cart.total_price >= threshold) {
    wrapper.classList.add("is-success");

    const textEl = wrapper.querySelector("p");
    if (textEl) {
      textEl.innerHTML = '<span class="success-text">🎉 You’ve unlocked free shipping!</span>';
    }
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
    const qtyInput = row.querySelector('input[type="number"]');

    if (priceEl) {
      priceEl.textContent = formatMoney(item.final_line_price);
    }

    if (qtyInput) {
      qtyInput.value = item.quantity;
    }

    row.setAttribute("data-quantity", item.quantity);
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
    const button = e.target.closest(".qty-btn");
    if (!button) return;

    const item = button.closest(".cart-item");
    if (!item) return;

    const input = item.querySelector('input[type="number"]');
    if (!input) return;

    let qty = parseInt(input.value, 10);

    if (button.classList.contains("qty-plus")) qty++;
    if (button.classList.contains("qty-minus")) qty--;

    if (qty < 1) qty = 1;

    updateCartAjax({ [item.dataset.key]: qty });
  });
}

/* ============================
   REMOVE EVENT
============================ */
function initCartRemove() {
  document.addEventListener("click", (e) => {
    const removeButton = e.target.closest(".cart-item-remove");
    if (!removeButton) return;

    const item = removeButton.closest(".cart-item");
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
    })
    .catch((error) => {
      console.error("Initial cart sync failed:", error);
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

/* ============================
   REFRESH ITEM LIST
============================ */
function refreshCartItemList(root) {
  fetch("/cart?view=ajax")
    .then((res) => res.text())
    .then((html) => {
      const temp = document.createElement("div");
      temp.innerHTML = html;

      const newList = temp.querySelector(".cart-list-items");
      if (!newList) return;

      let currentList = root.querySelector(".cart-list-items");
      const emptyMessage = root.querySelector(".cart-empty-message");
      const continueLink = root.querySelector(".continue-shopping");
      const cartLeft = root.querySelector(".cart-template-left");

      // Cart was empty before → create list
      if (!currentList) {
        if (emptyMessage) emptyMessage.remove();
        if (continueLink) continueLink.remove();

        if (cartLeft) {
          cartLeft.appendChild(newList);
        }

        return;
      }

      // Existing cart → replace list HTML only when needed
      currentList.innerHTML = newList.innerHTML;
    })
    .catch((error) => {
      console.error("Cart item list refresh failed:", error);
    });
}

/* ============================
   DISCOUNT PROGRESS
============================ */
function updateDiscountProgress(cart, root) {
  const wrapper = root.querySelector(".cart-discount-wrapper");
  if (!wrapper) return;

  const bar = wrapper.querySelector(".discount-progress-bar");
  const remainingEl = wrapper.querySelector(".cart-discount-remaining");
  const threshold = parseInt(root.dataset.discountThreshold, 10);

  if (!threshold || threshold === 0) return;

  const progress = Math.min((cart.total_price / threshold) * 100, 100);

  if (bar) {
    bar.style.width = progress + "%";
  }

  if (cart.total_price >= threshold) {
    wrapper.classList.add("is-success");

    const textEl = wrapper.querySelector("p");
    if (textEl) {
      textEl.innerHTML = '<span class="success-text">🔥 Discount unlocked!</span>';
    }
  } else {
    wrapper.classList.remove("is-success");

    if (remainingEl) {
      remainingEl.textContent = formatMoney(threshold - cart.total_price);
    }
  }
}

function refreshAllCartsUI() {
  fetch("/cart.js")
    .then((res) => res.json())
    .then((cart) => {
      renderAllCarts(cart);
      updateCartCount();
    })
    .catch((error) => {
      console.error("Cart UI refresh failed:", error);
    });
}