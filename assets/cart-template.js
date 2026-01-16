document.addEventListener("DOMContentLoaded", () => {
  initCartQuantity();
  initCartRemove();
  interceptAddToCart();
});

/* ============================
   INTERCEPT ADD TO CART
   (works everywhere)
============================ */
function interceptAddToCart() {
  const originalFetch = window.fetch;

  window.fetch = function (...args) {
    const [url] = args;

    if (typeof url === "string" && url.includes("/cart/add")) {
      return originalFetch(...args).then((response) => {
        reloadCartSection();
        updateCartCount();
        return response;
      });
    }

    return originalFetch(...args);
  };
}

/* ============================
   UPDATE CART (QTY / REMOVE)
============================ */
function updateCartAjax(updates) {
  fetch("/cart/update.js", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ updates }),
  })
    .then(() => {
      reloadCartSection();
      updateCartCount();
    });
}

/* ============================
   RELOAD CART SECTION
   (Shopify official way)
============================ */
function reloadCartSection() {
  fetch(`${window.location.pathname}?sections=cart-template`)
    .then((res) => res.json())
    .then((sections) => {
      const html = sections["cart-template"];
      if (!html) return;

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      const newCart = doc.querySelector("#CartTemplate");
      const oldCart = document.querySelector("#CartTemplate");

      if (newCart && oldCart) {
        oldCart.replaceWith(newCart);
      }
    });
}

/* ============================
   QUANTITY BUTTONS
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
   REMOVE ITEM
============================ */
function initCartRemove() {
  document.addEventListener("click", (e) => {
    if (!e.target.classList.contains("cart-item-remove")) return;

    const item = e.target.closest(".cart-item");
    if (!item) return;

    updateCartAjax({ [item.dataset.key]: 0 });
  });
}
