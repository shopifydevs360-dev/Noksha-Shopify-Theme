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
  if (cart.items.length > domItems) {
    refreshCartItemList(root);
  }
}

/* ============================
   SETTINGS / PRICE HELPERS
============================ */
function getPriceDisplaySettings() {
  const settings = window.themePriceDisplaySettings || {};

  return {
    enabled: !!settings.enabled,
    mode: settings.mode || "single_price",
    manualTaxRate: Number(settings.manualTaxRate || 0),
    taxesIncluded: !!settings.taxesIncluded,
  };
}

function getTaxMultiplier() {
  const { manualTaxRate } = getPriceDisplaySettings();
  return manualTaxRate > 0 ? manualTaxRate / 100 + 1 : 1;
}

function getDisplayPrice(cents) {
  const settings = getPriceDisplaySettings();

  if (!settings.enabled) return cents;
  if (settings.mode !== "single_price_without_tax") return cents;
  if (settings.manualTaxRate <= 0) return cents;
  if (!settings.taxesIncluded) return cents;

  return Math.round(cents / getTaxMultiplier());
}

function getSecondaryPrice(cents) {
  const settings = getPriceDisplaySettings();

  if (!settings.enabled) return null;
  if (settings.mode !== "price_with_and_without_tax") return null;
  if (settings.manualTaxRate <= 0) return null;

  if (settings.taxesIncluded) {
    return Math.round(cents / getTaxMultiplier());
  }

  return cents;
}

function getTaxLabelText(type) {
  if (type === "included") return "Incl. tax";
  if (type === "excluded") return "Excl. tax";
  return "";
}

function ensureSingleElement(parent, selector, tagName, className) {
  let el = parent.querySelector(selector);
  if (!el) {
    el = document.createElement(tagName);
    if (className) el.className = className;
    parent.appendChild(el);
  }
  return el;
}

function removeElement(parent, selector) {
  const el = parent.querySelector(selector);
  if (el) el.remove();
}

/* ============================
   SUBTOTAL
============================ */
function updateSubtotal(cart, root) {
  const subtotalEl = root.querySelector(".cart-subtotal");
  if (!subtotalEl) return;

  const settings = getPriceDisplaySettings();
  const subtotalRow = subtotalEl.closest(".cart-summary-row");
  if (!subtotalRow) {
    subtotalEl.textContent = formatMoney(getDisplayPrice(cart.items_subtotal_price));
    return;
  }

  const mainSubtotal = getDisplayPrice(cart.items_subtotal_price);
  const secondarySubtotal = getSecondaryPrice(cart.items_subtotal_price);

  subtotalEl.textContent = formatMoney(mainSubtotal);

  if (!settings.enabled) {
    removeElement(subtotalRow, ".cart-subtotal-tax-label");
    removeElement(subtotalRow, ".cart-subtotal-secondary");
    removeElement(subtotalRow, ".cart-subtotal-secondary-tax-label");
    return;
  }

  if (settings.mode === "single_price_with_tax_label") {
    const labelEl = ensureSingleElement(
      subtotalRow,
      ".cart-subtotal-tax-label",
      "span",
      "cart-subtotal-tax-label"
    );
    labelEl.textContent = settings.taxesIncluded
      ? getTaxLabelText("included")
      : getTaxLabelText("excluded");

    removeElement(subtotalRow, ".cart-subtotal-secondary");
    removeElement(subtotalRow, ".cart-subtotal-secondary-tax-label");
    return;
  }

  if (settings.mode === "price_with_and_without_tax" && secondarySubtotal !== null) {
    const mainLabelEl = ensureSingleElement(
      subtotalRow,
      ".cart-subtotal-tax-label",
      "span",
      "cart-subtotal-tax-label"
    );
    mainLabelEl.textContent = getTaxLabelText("included");

    const secondaryEl = ensureSingleElement(
      subtotalRow,
      ".cart-subtotal-secondary",
      "div",
      "cart-subtotal-secondary"
    );
    secondaryEl.textContent = formatMoney(secondarySubtotal);

    const secondaryLabelEl = ensureSingleElement(
      subtotalRow,
      ".cart-subtotal-secondary-tax-label",
      "span",
      "cart-subtotal-secondary-tax-label"
    );
    secondaryLabelEl.textContent = getTaxLabelText("excluded");
    return;
  }

  removeElement(subtotalRow, ".cart-subtotal-tax-label");
  removeElement(subtotalRow, ".cart-subtotal-secondary");
  removeElement(subtotalRow, ".cart-subtotal-secondary-tax-label");
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

  const displayTotal = getDisplayPrice(cart.total_price);
  const progress = Math.min((displayTotal / threshold) * 100, 100);

  if (bar) {
    bar.style.width = progress + "%";
  }

  if (displayTotal >= threshold) {
    wrapper.classList.add("is-success");
  } else {
    wrapper.classList.remove("is-success");
    if (remainingEl) {
      remainingEl.textContent = formatMoney(threshold - displayTotal);
    }
  }
}

/* ============================
   LINE ITEMS (PRICE + QTY)
============================ */
function updateLineItems(cart, root) {
  const settings = getPriceDisplaySettings();

  cart.items.forEach((item) => {
    const row = root.querySelector(`.cart-item[data-key="${item.key}"]`);
    if (!row) return;

    const priceEl = row.querySelector(".cart-item-price");
    const comparePriceEl = row.querySelector(".cart-item-price-compare");
    const qtyInput = row.querySelector("input");

    const mainPrice = getDisplayPrice(item.final_line_price);
    const secondaryPrice = getSecondaryPrice(item.final_line_price);

    const compareMainPrice =
      item.original_line_price > item.final_line_price
        ? getDisplayPrice(item.original_line_price)
        : null;

    if (priceEl) {
      priceEl.textContent = formatMoney(mainPrice);
    }

    if (qtyInput) {
      qtyInput.value = item.quantity;
    }

    if (comparePriceEl && compareMainPrice !== null) {
      comparePriceEl.textContent = formatMoney(compareMainPrice);
    }

    const infoRight = row.querySelector(".info-right");
    if (!infoRight) return;

    if (!settings.enabled) {
      removeElement(infoRight, ".cart-item-tax-label");
      removeElement(infoRight, ".cart-item-price--secondary");
      removeElement(infoRight, ".cart-item-tax-label-secondary");
      return;
    }

    if (settings.mode === "single_price_with_tax_label") {
      const labelEl = ensureSingleElement(
        infoRight,
        ".cart-item-tax-label",
        "p",
        "cart-item-tax-label"
      );
      labelEl.textContent = settings.taxesIncluded
        ? getTaxLabelText("included")
        : getTaxLabelText("excluded");

      removeElement(infoRight, ".cart-item-price--secondary");
      removeElement(infoRight, ".cart-item-tax-label-secondary");
      return;
    }

    if (settings.mode === "price_with_and_without_tax" && secondaryPrice !== null) {
      let mainLabelEl = infoRight.querySelector(".cart-item-tax-label");
      if (!mainLabelEl) {
        mainLabelEl = document.createElement("p");
        mainLabelEl.className = "cart-item-tax-label";
        if (priceEl && priceEl.nextSibling) {
          infoRight.insertBefore(mainLabelEl, priceEl.nextSibling);
        } else if (priceEl) {
          priceEl.insertAdjacentElement("afterend", mainLabelEl);
        } else {
          infoRight.prepend(mainLabelEl);
        }
      }
      mainLabelEl.textContent = getTaxLabelText("included");

      let secondaryPriceEl = infoRight.querySelector(".cart-item-price--secondary");
      if (!secondaryPriceEl) {
        secondaryPriceEl = document.createElement("p");
        secondaryPriceEl.className = "cart-item-price cart-item-price--secondary";
        if (mainLabelEl.nextSibling) {
          infoRight.insertBefore(secondaryPriceEl, mainLabelEl.nextSibling);
        } else {
          infoRight.appendChild(secondaryPriceEl);
        }
      }
      secondaryPriceEl.textContent = formatMoney(secondaryPrice);

      let secondaryLabelEl = infoRight.querySelector(".cart-item-tax-label-secondary");
      if (!secondaryLabelEl) {
        secondaryLabelEl = document.createElement("p");
        secondaryLabelEl.className = "cart-item-tax-label cart-item-tax-label-secondary";
        if (secondaryPriceEl.nextSibling) {
          infoRight.insertBefore(secondaryLabelEl, secondaryPriceEl.nextSibling);
        } else {
          infoRight.appendChild(secondaryLabelEl);
        }
      }
      secondaryLabelEl.textContent = getTaxLabelText("excluded");
      return;
    }

    removeElement(infoRight, ".cart-item-tax-label");
    removeElement(infoRight, ".cart-item-price--secondary");
    removeElement(infoRight, ".cart-item-tax-label-secondary");
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

      if (!currentList) {
        if (emptyMessage) emptyMessage.remove();
        if (continueLink) continueLink.remove();

        root.querySelector(".cart-template-left").appendChild(newList);
        return;
      }

      currentList.innerHTML = newList.innerHTML;
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

  const displayTotal = getDisplayPrice(cart.total_price);
  const progress = Math.min((displayTotal / threshold) * 100, 100);

  if (bar) {
    bar.style.width = progress + "%";
  }

  if (displayTotal >= threshold) {
    wrapper.classList.add("is-success");
    const textEl = wrapper.querySelector("p");
    if (textEl) {
      textEl.innerHTML = '<span class="success-text">🔥 Discount unlocked!</span>';
    }
  } else {
    wrapper.classList.remove("is-success");

    if (remainingEl) {
      remainingEl.textContent = formatMoney(threshold - displayTotal);
    }
  }
}

function refreshAllCartsUI() {
  fetch("/cart.js")
    .then((res) => res.json())
    .then((cart) => {
      renderAllCarts(cart);
      updateCartCount();
    });
}