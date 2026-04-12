/* ======================================
   WISHLIST FUNCTIONALITY
====================================== */
const WISHLIST_STORAGE_KEY = 'theme-wishlist-items';

document.addEventListener('DOMContentLoaded', () => {
  initWishlist();
});

document.addEventListener('shopify:section:load', (event) => {
  syncWishlistUI(event.target);
  renderWishlistPage();
});

document.addEventListener('shopify:block:select', () => {
  syncWishlistUI(document);
});

function initWishlist() {
  bindWishlistEvents();
  syncWishlistUI(document);
  renderWishlistPage();
}

function bindWishlistEvents() {
  if (document.body.dataset.wishlistBound === 'true') return;
  document.body.dataset.wishlistBound = 'true';

  document.addEventListener('click', function (event) {
    const toggleButton = event.target.closest('[data-wishlist-toggle]');
    if (toggleButton) {
      event.preventDefault();
      toggleWishlistItem(toggleButton);
      return;
    }

    const removeButton = event.target.closest('[data-wishlist-remove]');
    if (removeButton) {
      event.preventDefault();
      const productId = removeButton.dataset.productId;
      removeWishlistItemById(productId);
      renderWishlistPage();
    }
  });
}

function getWishlistItems() {
  try {
    const storedItems = localStorage.getItem(WISHLIST_STORAGE_KEY);
    const parsedItems = storedItems ? JSON.parse(storedItems) : [];
    return Array.isArray(parsedItems) ? parsedItems : [];
  } catch (error) {
    console.warn('Failed to read wishlist items:', error);
    return [];
  }
}

function saveWishlistItems(items) {
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn('Failed to save wishlist items:', error);
  }
}

function isProductInWishlist(productId) {
  if (!productId) return false;

  return getWishlistItems().some((item) => String(item.id) === String(productId));
}

function buildWishlistItem(button) {
  return {
    id: button.dataset.productId || '',
    handle: button.dataset.productHandle || '',
    url: button.dataset.productUrl || '',
    title: button.dataset.productTitle || '',
    price: button.dataset.productPrice || '',
    image: button.dataset.productImage || ''
  };
}

function toggleWishlistItem(button) {
  const productId = button.dataset.productId;
  if (!productId) return;

  const items = getWishlistItems();
  const existingIndex = items.findIndex((item) => String(item.id) === String(productId));

  if (existingIndex > -1) {
    items.splice(existingIndex, 1);
  } else {
    items.push(buildWishlistItem(button));
  }

  saveWishlistItems(items);
  syncWishlistUI(document);
  renderWishlistPage();

  document.dispatchEvent(
    new CustomEvent('wishlist:updated', {
      detail: { items }
    })
  );
}

function removeWishlistItemById(productId) {
  if (!productId) return;

  const filteredItems = getWishlistItems().filter(
    (item) => String(item.id) !== String(productId)
  );

  saveWishlistItems(filteredItems);
  syncWishlistUI(document);

  document.dispatchEvent(
    new CustomEvent('wishlist:updated', {
      detail: { items: filteredItems }
    })
  );
}

function syncWishlistUI(scope = document) {
  updateWishlistButtons(scope);
  updateWishlistCount();
}

function updateWishlistButtons(scope = document) {
  const buttons = scope.querySelectorAll('[data-wishlist-toggle]');
  if (!buttons.length) return;

  buttons.forEach((button) => {
    const productId = button.dataset.productId;
    const isActive = isProductInWishlist(productId);
    const productTitle = button.dataset.productTitle || 'product';

    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    button.setAttribute(
      'aria-label',
      isActive
        ? `Remove ${productTitle} from wishlist`
        : `Add ${productTitle} to wishlist`
    );
  });
}

function updateWishlistCount() {
  const countElements = document.querySelectorAll('[data-wishlist-count]');
  if (!countElements.length) return;

  const count = getWishlistItems().length;

  countElements.forEach((element) => {
    element.textContent = count;

    if (count > 0) {
      element.classList.remove('hide');
    } else {
      element.classList.add('hide');
    }
  });
}

/* ======================================
   WISHLIST PAGE RENDER
====================================== */
function renderWishlistPage() {
  const wishlistPage = document.querySelector('[data-wishlist-page]');
  if (!wishlistPage) return;

  const loadingElement = wishlistPage.querySelector('[data-wishlist-loading]');
  const emptyElement = wishlistPage.querySelector('[data-wishlist-empty]');
  const itemsContainer = wishlistPage.querySelector('[data-wishlist-items]');

  if (!itemsContainer) return;

  const wishlistItems = getWishlistItems();

  itemsContainer.innerHTML = '';

  if (loadingElement) {
    loadingElement.classList.remove('hide');
  }

  if (emptyElement) {
    emptyElement.classList.add('hide');
  }

  if (!wishlistItems.length) {
    if (loadingElement) loadingElement.classList.add('hide');
    if (emptyElement) emptyElement.classList.remove('hide');
    return;
  }

  Promise.all(wishlistItems.map((item) => fetchWishlistProduct(item)))
    .then((products) => {
      const validProducts = products.filter(Boolean);

      if (loadingElement) {
        loadingElement.classList.add('hide');
      }

      if (!validProducts.length) {
        if (emptyElement) emptyElement.classList.remove('hide');
        return;
      }

      validProducts.forEach((product) => {
        itemsContainer.insertAdjacentHTML('beforeend', renderWishlistProductCard(product));
      });

      syncWishlistUI(itemsContainer);
    })
    .catch((error) => {
      console.warn('Failed to render wishlist page:', error);

      if (loadingElement) loadingElement.classList.add('hide');
      if (emptyElement) emptyElement.classList.remove('hide');
    });
}

function fetchWishlistProduct(item) {
  if (!item || !item.handle) return Promise.resolve(null);

  return fetch(`/products/${item.handle}.js`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load product: ${item.handle}`);
      }
      return response.json();
    })
    .then((product) => {
      return {
        id: item.id || product.id,
        handle: product.handle,
        title: product.title,
        url: product.url,
        price: formatMoney(product.price),
        image: product.featured_image || item.image || '',
        available: product.available
      };
    })
    .catch(() => null);
}

function renderWishlistProductCard(product) {
  const imageMarkup = product.image
    ? `
      <img
        src="${escapeHtml(product.image)}"
        alt="${escapeHtml(product.title)}"
        class="product-card__image"
        loading="lazy"
      >
    `
    : '';

  return `
    <div class="product-card" data-product-id="${escapeHtml(String(product.id))}">
      <div class="image-wrap">
        <button
          type="button"
          class="product-card__wishlist-btn is-active"
          aria-label="Remove ${escapeHtml(product.title)} from wishlist"
          aria-pressed="true"
          data-wishlist-toggle
          data-product-id="${escapeHtml(String(product.id))}"
          data-product-handle="${escapeHtml(product.handle)}"
          data-product-url="${escapeHtml(product.url)}"
          data-product-title="${escapeHtml(product.title)}"
          data-product-price=""
          data-product-image="${escapeHtml(product.image || '')}"
        >
          <span class="icon icon-wishlist" aria-hidden="true">♥</span>
        </button>

        <a href="${escapeHtml(product.url)}" aria-label="${escapeHtml(product.title)}">
          <div class="cropped-image-wrapper cropped-image--square is-hover-zoom-out">
            ${imageMarkup}
          </div>
        </a>
      </div>

      <div class="product-card-info">
        <div class="split-aligner">
          <span class="title">
            <a href="${escapeHtml(product.url)}">${escapeHtml(product.title)}</a>
          </span>
          <p class="price">${escapeHtml(product.price)}</p>
        </div>
      </div>
    </div>
  `;
}

function formatMoney(cents) {
  if (typeof cents !== 'number') return '';

  const activeCurrency =
    window.Shopify &&
    window.Shopify.currency &&
    window.Shopify.currency.active
      ? window.Shopify.currency.active
      : 'USD';

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: activeCurrency
  }).format(cents / 100);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}