/* ======================================
   WISHLIST FUNCTIONALITY
====================================== */
const WISHLIST_STORAGE_KEY = 'theme-wishlist-items';
const WISHLIST_PRODUCT_CARD_SECTION_ID = 'wishlist-product-card';

document.addEventListener('DOMContentLoaded', () => {
  initWishlist();
});

document.addEventListener('shopify:section:load', (event) => {
  syncWishlistUI(event.target);
  renderWishlistPage();
  renderWishlistDrawer();
});

document.addEventListener('shopify:block:select', () => {
  syncWishlistUI(document);
});

function initWishlist() {
  bindWishlistEvents();
  syncWishlistUI(document);
  renderWishlistPage();
  renderWishlistDrawer();
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
      const productId = removeButton.dataset.wishlistRemove;
      if (!productId) return;
      removeWishlistItemById(productId);
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
  renderWishlistDrawer();

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
  renderWishlistPage();
  renderWishlistDrawer();

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
    if (loadingElement) {
      loadingElement.classList.add('hide');
    }

    if (emptyElement) {
      emptyElement.classList.remove('hide');
    }

    return;
  }

  Promise.all(wishlistItems.map((item) => fetchWishlistProductCard(item)))
    .then((cards) => {
      const validCards = cards.filter((card) => card && card.trim() !== '');

      if (loadingElement) {
        loadingElement.classList.add('hide');
      }

      if (!validCards.length) {
        if (emptyElement) {
          emptyElement.classList.remove('hide');
        }
        return;
      }

      validCards.forEach((cardHtml) => {
        itemsContainer.insertAdjacentHTML('beforeend', cardHtml);
      });

      syncWishlistUI(itemsContainer);
    })
    .catch((error) => {
      console.warn('Failed to render wishlist page:', error);

      if (loadingElement) {
        loadingElement.classList.add('hide');
      }

      if (emptyElement) {
        emptyElement.classList.remove('hide');
      }
    });
}

function fetchWishlistProductCard(item) {
  if (!item || !item.handle) return Promise.resolve('');

  const url = `/products/${encodeURIComponent(item.handle)}?section_id=${encodeURIComponent(
    WISHLIST_PRODUCT_CARD_SECTION_ID
  )}`;

  return fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load wishlist product card for handle: ${item.handle}`);
      }
      return response.text();
    })
    .then((html) => extractSectionInnerHtml(html))
    .catch((error) => {
      console.warn(error);
      return '';
    });
}

function extractSectionInnerHtml(html) {
  if (!html) return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const sectionRoot =
    doc.querySelector(`#shopify-section-${WISHLIST_PRODUCT_CARD_SECTION_ID}`) ||
    doc.querySelector('.shopify-section') ||
    doc.body;

  return sectionRoot ? sectionRoot.innerHTML.trim() : '';
}

/* ======================================
   WISHLIST DRAWER RENDER
====================================== */
function renderWishlistDrawer() {
  const itemsContainer = document.querySelector('[data-wishlist-drawer-items]');
  const emptyElement = document.querySelector('[data-wishlist-drawer-empty]');

  if (!itemsContainer) return;

  const wishlistItems = getWishlistItems();
  itemsContainer.innerHTML = '';

  if (emptyElement) {
    emptyElement.classList.add('hide');
  }

  if (!wishlistItems.length) {
    if (emptyElement) {
      emptyElement.classList.remove('hide');
    }
    return;
  }

  Promise.all(wishlistItems.map((item) => fetchWishlistProduct(item)))
    .then((products) => {
      const validProducts = products.filter(Boolean);

      if (!validProducts.length) {
        if (emptyElement) {
          emptyElement.classList.remove('hide');
        }
        return;
      }

      validProducts.forEach((product) => {
        itemsContainer.insertAdjacentHTML('beforeend', renderWishlistDrawerCard(product));
      });
    })
    .catch((error) => {
      console.warn('Failed to render wishlist drawer:', error);

      if (emptyElement) {
        emptyElement.classList.remove('hide');
      }
    });
}

function fetchWishlistProduct(item) {
  if (!item || !item.handle) return Promise.resolve(null);

  return fetch(`/products/${encodeURIComponent(item.handle)}.js`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load wishlist product: ${item.handle}`);
      }
      return response.json();
    })
    .then((product) => {
      return {
        id: product.id || item.id,
        title: product.title || item.title || '',
        url: product.url || item.url || '#',
        price: formatMoney(product.price),
        image: getWishlistProductImage(product, item)
      };
    })
    .catch((error) => {
      console.warn(error);
      return {
        id: item.id || '',
        title: item.title || '',
        url: item.url || '#',
        price: item.price || '',
        image: item.image || ''
      };
    });
}

function getWishlistProductImage(product, item) {
  if (product && product.featured_image) {
    if (typeof product.featured_image === 'string') {
      return product.featured_image;
    }

    if (product.featured_image.src) {
      return product.featured_image.src;
    }

    if (product.featured_image.url) {
      return product.featured_image.url;
    }
  }

  return item.image || '';
}

function renderWishlistDrawerCard(product) {
  const imageMarkup = product.image
    ? `
      <div class="product-card__image cropped-image-wrapper cropped-image--portrait">
        <img
          src="${escapeHtml(product.image)}"
          alt="${escapeHtml(product.title)}"
          class="wishlist-drawer__card-image"
          loading="lazy"
        >
      </div>
    `
    : `
      <div class="product-card__image cropped-image-wrapper cropped-image--portrait wishlist-drawer__card-image-placeholder" aria-hidden="true">
        <div class="wishlist-drawer__placeholder-inner">
          <svg viewBox="0 0 24 24" class="wishlist-drawer__placeholder-icon" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="5" width="18" height="14" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M7 15L10 12L13 15L15.5 12.5L18 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="9" cy="9" r="1.5" fill="currentColor"/>
          </svg>
        </div>
      </div>
    `;

  return `
    <div class="wishlist-drawer__card" data-wishlist-item="${escapeHtml(product.id)}">
      <button
        type="button"
        class="wishlist-drawer__remove"
        data-wishlist-remove="${escapeHtml(product.id)}"
        aria-label="Remove ${escapeHtml(product.title)} from wishlist"
      >
        <span aria-hidden="true">&times;</span>
      </button>

      <a
        href="${escapeHtml(product.url)}"
        class="wishlist-drawer__card-image-link"
        aria-label="${escapeHtml(product.title)}"
      >
        ${imageMarkup}
      </a>

      <div class="wishlist-drawer__card-content">
        <h5 class="wishlist-drawer__card-title">
          <a href="${escapeHtml(product.url)}">${escapeHtml(product.title)}</a>
        </h5>

        <div class="wishlist-drawer__card-price">
          ${escapeHtml(product.price)}
        </div>
      </div>
    </div>
  `;
}

/* ======================================
   HELPERS
====================================== */
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