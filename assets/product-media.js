document.addEventListener("DOMContentLoaded", () => {
  initProductMedia();
  initVariantMainImageSwitch();
});

function initProductMedia() {

  const thumbs = document.querySelector('.product-media__thumbs');

  if (thumbs) {
    new Swiper(thumbs, {
      slidesPerView: 1,
      loop: true,
      navigation: {
        nextEl: '.product-media__thumbs .swiper-button-next',
        prevEl: '.product-media__thumbs .swiper-button-prev',
      },
      pagination: {
        el: '.product-media__thumbs .swiper-pagination',
        clickable: true,
      },
    });
  }

  const lightbox = document.getElementById('mediaLightbox');
  if (!lightbox) return;

  const closeBtn = lightbox.querySelector('.media-lightbox__close');
  const overlay = lightbox.querySelector('.media-lightbox__overlay');
  const sliderEl = lightbox.querySelector('.media-lightbox__slider');

  const lightboxSwiper = new Swiper(sliderEl, {
    loop: true,
    navigation: {
      nextEl: '.media-lightbox .swiper-button-next',
      prevEl: '.media-lightbox .swiper-button-prev',
    },
    pagination: {
      el: '.media-lightbox .swiper-pagination',
      clickable: true,
    },
  });

  document.addEventListener('click', e => {
    const slide = e.target.closest('.product-media__thumbs .swiper-slide, .product-media__main');
    if (!slide) return;

    const img = e.target.closest('img');
    if (!img) return;

    e.preventDefault();
    e.stopPropagation();

    let index = 0;
    if (slide.classList.contains('swiper-slide')) {
      index = Array.from(slide.parentNode.children).indexOf(slide);
    }

    lightbox.classList.add('is-open');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    resetZoom();
    lightboxSwiper.slideToLoop(index, 0);
  });

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    resetZoom();
  }

  closeBtn.addEventListener('click', closeLightbox);
  overlay.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

  let zoomLevel = 0;
  let activeImg = null;

  let isDragging = false;
  let hasMoved = false;

  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;

  const MOVE_THRESHOLD = 5;

  sliderEl.addEventListener('click', e => {
    const img = e.target.closest('img');
    if (!img) return;

    if (hasMoved) {
      hasMoved = false;
      return;
    }

    zoomLevel = (zoomLevel + 1) % 3;

    if (zoomLevel === 0) {
      resetZoom();
      return;
    }

    activeImg = img;
    const scale = zoomLevel === 1 ? 1.6 : 2.6;

    img.classList.add('is-zoomed');
    img.style.transform = `scale(${scale}) translate(0px, 0px)`;

    sliderEl.swiper.allowTouchMove = false;
  });

  sliderEl.addEventListener('mousedown', e => {
    if (!activeImg || zoomLevel === 0) return;

    isDragging = true;
    hasMoved = false;

    startX = e.clientX - currentX;
    startY = e.clientY - currentY;

    activeImg.classList.add('is-dragging');
  });

  window.addEventListener('mousemove', e => {
    if (!isDragging || !activeImg) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (Math.abs(dx - currentX) > MOVE_THRESHOLD || Math.abs(dy - currentY) > MOVE_THRESHOLD) {
      hasMoved = true;
    }

    const scale = zoomLevel === 1 ? 1.6 : 2.6;
    const containerRect = sliderEl.getBoundingClientRect();
    const imgRect = activeImg.getBoundingClientRect();

    const scaledWidth = imgRect.width;
    const scaledHeight = imgRect.height;

    // calculate how far it can move without leaving container
    const limitX = Math.max((scaledWidth - containerRect.width) / 2, 0);
    const limitY = Math.max((scaledHeight - containerRect.height) / 2, 0);

    currentX = Math.max(-limitX, Math.min(limitX, dx));
    currentY = Math.max(-limitY, Math.min(limitY, dy));

    activeImg.style.transform = `scale(${scale}) translate(${currentX}px, ${currentY}px)`;
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
    if (activeImg) activeImg.classList.remove('is-dragging');
  });

  function resetZoom() {
    sliderEl.querySelectorAll('img').forEach(img => {
      img.style.transform = "scale(1) translate(0px, 0px)";
      img.classList.remove('is-zoomed', 'is-dragging');
    });

    zoomLevel = 0;
    currentX = 0;
    currentY = 0;
    activeImg = null;
    hasMoved = false;
    isDragging = false;

    sliderEl.swiper.allowTouchMove = true;
  }

}

function initVariantMainImageSwitch() {

  const productJson = document.getElementById('ProductJson-' + window.ShopifyAnalytics.meta.product.id);
  if (!productJson) return;

  const productData = JSON.parse(productJson.textContent);
  const form = document.querySelector('form[action*="/cart/add"]');
  if (!form) return;

  const mainMediaContainer = document.querySelector('.product-media__main');
  if (!mainMediaContainer) return;

  form.addEventListener('change', () => {

    const formData = new FormData(form);

    const selectedOptions = productData.options.map(optionName =>
      formData.get(`options[${optionName}]`)
    );

    const selectedVariant = productData.variants.find(variant =>
      variant.options.every((opt, index) => opt === selectedOptions[index])
    );

    if (!selectedVariant || !selectedVariant.featured_media) return;

    const newImageUrl = selectedVariant.featured_media.preview_image.src;

    const existingImg = mainMediaContainer.querySelector('img');
    if (!existingImg) return;

    existingImg.src = newImageUrl;
  });
}
