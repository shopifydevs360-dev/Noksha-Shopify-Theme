document.addEventListener("DOMContentLoaded", () => {
  initCartAjax();
  initCartQuantity();
  initCartRemove();
  initCouponAjax();
  initRemoveDiscount();
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
        updateCartCount();
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

  // ✅ If cart has NEW items, refresh HTML list
  const domItems = root.querySelectorAll(".cart-item").length;
  if (cart.items.length > domItems) {
    refreshCartItemList(root);
  }
}


/* ============================
   SUBTOTAL
============================ */
function updateSubtotal(cart, root) {
  const subtotalEl = root.querySelector(".cart-subtotal");
  const totalEl = root.querySelector(".cart-total");
  const discountRow = root.querySelector(".cart-discount-row");
  const discountAmountEl = root.querySelector(".cart-discount-amount");

  if (subtotalEl) {
    subtotalEl.textContent = formatMoney(cart.items_subtotal_price);
  }

  if (totalEl) {
    totalEl.textContent = formatMoney(cart.total_price);
  }

  if (cart.total_discount > 0) {
    if (discountRow) discountRow.style.display = "flex";
    if (discountAmountEl) {
      discountAmountEl.textContent =
        "-" + formatMoney(cart.total_discount);
    }
  } else {
    if (discountRow) discountRow.style.display = "none";
  }
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
  cart.items.forEach((item) => {
    const row = root.querySelector(
      `.cart-item[data-key="${item.key}"]`
    );
    if (!row) return;

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

      // 🔥 CART WAS EMPTY → CREATE LIST
      if (!currentList) {
        if (emptyMessage) emptyMessage.remove();
        if (continueLink) continueLink.remove();

        root.querySelector(".cart-template-left")
          .appendChild(newList);

        return;
      }

      // 🔁 CART HAD ITEMS → UPDATE LIST
      currentList.innerHTML = newList.innerHTML;
    });
}

function initCouponAjax() {
  document.addEventListener("click", function (e) {
    if (e.target.id !== "apply-coupon-btn") return;

    const codeInput = document.getElementById("coupon-code");
    const message = document.querySelector(".coupon-message");

    if (!codeInput || !codeInput.value.trim()) {
      message.textContent = "Please enter a coupon code.";
      return;
    }

    const code = codeInput.value.trim();

    // Shopify requires navigation for discount apply
    window.location.href = "/discount/" + code;
  });
}
function initRemoveDiscount() {
  document.addEventListener("click", function (e) {
    if (!e.target.classList.contains("remove-discount")) return;

    window.location.href = "/cart?discount=";
  });
}




function refreshAllCartsUI() {
  fetch("/cart.js")
    .then((res) => res.json())
    .then((cart) => {
      renderAllCarts(cart);
      updateCartCount();
    });
}
