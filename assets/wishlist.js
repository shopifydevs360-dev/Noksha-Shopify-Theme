/* ======================================
   WISHLIST FUNCTIONALITY
====================================== */
const WISHLIST_STORAGE_KEY = "theme-wishlist-items";

document.addEventListener("DOMContentLoaded", () => {
  initWishlist();
});

document.addEventListener("shopify:section:load", (event) => {
  syncWishlistUI(event.target);
});

document.addEventListener("shopify:block:select", (event) => {
  syncWishlistUI(event.target);
});

function initWishlist() {
  bindWishlistEvents();
  syncWishlistUI(document);
}

function bindWishlistEvents() {
  if (document.body.dataset.wishlistBound === "true") return;
  document.body.dataset.wishlistBound = "true";

  document.addEventListener("click", function (event) {
    const button = event.target.closest("[data-wishlist-toggle]");
    if (!button) return;

    event.preventDefault();
    toggleWishlistItem(button);
  });
}

function getWishlistItems() {
  try {
    const storedItems = localStorage.getItem(WISHLIST_STORAGE_KEY);
    const parsedItems = storedItems ? JSON.parse(storedItems) : [];
    return Array.isArray(parsedItems) ? parsedItems : [];
  } catch (error) {
    console.warn("Failed to read wishlist items:", error);
    return [];
  }
}

function saveWishlistItems(items) {
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn("Failed to save wishlist items:", error);
  }
}

function isProductInWishlist(productId) {
  if (!productId) return false;

  const items = getWishlistItems();
  return items.some((item) => String(item.id) === String(productId));
}

function buildWishlistItem(button) {
  return {
    id: button.dataset.productId || "",
    handle: button.dataset.productHandle || "",
    url: button.dataset.productUrl || "",
    title: button.dataset.productTitle || "",
    price: button.dataset.productPrice || "",
    image: button.dataset.productImage || ""
  };
}

function toggleWishlistItem(button) {
  const productId = button.dataset.productId;
  if (!productId) return;

  const items = getWishlistItems();
  const existingIndex = items.findIndex(
    (item) => String(item.id) === String(productId)
  );

  if (existingIndex > -1) {
    items.splice(existingIndex, 1);
  } else {
    items.push(buildWishlistItem(button));
  }

  saveWishlistItems(items);
  syncWishlistUI(document);

  document.dispatchEvent(
    new CustomEvent("wishlist:updated", {
      detail: { items }
    })
  );
}

function syncWishlistUI(scope = document) {
  updateWishlistButtons(scope);
  updateWishlistCount();
}

function updateWishlistButtons(scope = document) {
  const buttons = scope.querySelectorAll("[data-wishlist-toggle]");
  if (!buttons.length) return;

  buttons.forEach((button) => {
    const productId = button.dataset.productId;
    const isActive = isProductInWishlist(productId);

    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");

    const productTitle = button.dataset.productTitle || "product";
    button.setAttribute(
      "aria-label",
      isActive
        ? `Remove ${productTitle} from wishlist`
        : `Add ${productTitle} to wishlist`
    );
  });
}

function updateWishlistCount() {
  const countElements = document.querySelectorAll("[data-wishlist-count]");
  if (!countElements.length) return;

  const count = getWishlistItems().length;

  countElements.forEach((element) => {
    element.textContent = count;

    if (count > 0) {
      element.classList.remove("hide");
    } else {
      element.classList.add("hide");
    }
  });
}

function removeWishlistItemById(productId) {
  if (!productId) return;

  const filteredItems = getWishlistItems().filter(
    (item) => String(item.id) !== String(productId)
  );

  saveWishlistItems(filteredItems);
  syncWishlistUI(document);

  document.dispatchEvent(
    new CustomEvent("wishlist:updated", {
      detail: { items: filteredItems }
    })
  );
}