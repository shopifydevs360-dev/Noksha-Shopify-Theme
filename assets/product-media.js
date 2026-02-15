document.addEventListener("DOMContentLoaded", () => {
  initProductMedia();
});

function initProductMedia() {
  initProductMediaMain();
  initProductMediaThumbs();
  initProductMediaLightbox();
}

/* =========================
   MAIN PRODUCT SWIPER
========================= */
function initProductMediaMain() {

  const mainEl = document.getElementById('MainProductMedia');
  if (!mainEl) return;

  const mainSwiper = new Swiper(mainEl, {
    loop: true,
    slidesPerView: 1,
    autoHeight: true,
    effect: 'fade',
    fadeEffect: { crossFade: true },
    allowTouchMove: false,
    simulateTouch: false,
  });

  const variantsJsonEl = document.getElementById('ProductVariantsJson');
  if (!variantsJsonEl) return;

  const variants = JSON.parse(variantsJsonEl.textContent);

  function getSelectedOptions() {
    const selected = [];
    document.querySelectorAll('.main-product-variant-selector fieldset')
      .forEach(fieldset => {
        const checked = fieldset.querySelector('input:checked');
        const select = fieldset.querySelector('select');
        if (checked) selected.push(checked.value);
        else if (select) selected.push(select.value);
      });
    return selected;
  }

  function findMatchingVariant(options) {
    return variants.find(v =>
      v.options.every((opt, i) => opt === options[i])
    );
  }

  function slideToVariant(variant) {
    if (!variant || !variant.featured_media) return;

    const mediaId = variant.featured_media.id;

    const slides = mainEl.querySelectorAll(
      '.swiper-slide:not(.swiper-slide-duplicate)'
    );

    slides.forEach((slide, index) => {
      if (slide.dataset.mediaId == mediaId) {
        mainSwiper.slideToLoop(index);
      }
    });
  }

  document.querySelectorAll(
    '.main-product-variant-selector input, .main-product-variant-selector select'
  ).forEach(el => {
    el.addEventListener('change', () => {
      const selected = getSelectedOptions();
      const variant = findMatchingVariant(selected);
      slideToVariant(variant);
    });
  });
}

/* =========================
   THUMBS SWIPER
========================= */
function initProductMediaThumbs() {

  const thumbs = document.querySelector('.product-media__thumbs');
  if (!thumbs) return;

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

/* =========================
   LIGHTBOX
========================= */
function initProductMediaLightbox() {

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

  initProductMediaLightboxOpen(lightbox, lightboxSwiper);
  initProductMediaZoom(sliderEl, lightboxSwiper);

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', closeLightbox);
  overlay.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLightbox();
  });
}

/* =========================
   LIGHTBOX OPEN
========================= */
function initProductMediaLightboxOpen(lightbox, swiper) {

  document.addEventListener('click', e => {

    const slide = e.target.closest(
      '.product-media__thumbs .swiper-slide, .product-media__main'
    );
    if (!slide) return;

    const img = e.target.closest('img');
    if (!img) return;

    e.preventDefault();

    let index = 0;

    if (slide.classList.contains('swiper-slide')) {
      index = Array.from(slide.parentNode.children).indexOf(slide);
    }

    lightbox.classList.add('is-open');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    swiper.slideToLoop(index, 0);
  });
}

/* =========================
   ZOOM + DRAG
========================= */
function initProductMediaZoom(sliderEl, swiper) {

  if (!sliderEl || !swiper) return;

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

    swiper.allowTouchMove = false;
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

    if (Math.abs(dx - currentX) > MOVE_THRESHOLD ||
        Math.abs(dy - currentY) > MOVE_THRESHOLD) {
      hasMoved = true;
    }

    const scale = zoomLevel === 1 ? 1.6 : 2.6;
    const containerRect = sliderEl.getBoundingClientRect();
    const imgRect = activeImg.getBoundingClientRect();

    const limitX = Math.max((imgRect.width - containerRect.width) / 2, 0);
    const limitY = Math.max((imgRect.height - containerRect.height) / 2, 0);

    currentX = Math.max(-limitX, Math.min(limitX, dx));
    currentY = Math.max(-limitY, Math.min(limitY, dy));

    activeImg.style.transform =
      `scale(${scale}) translate(${currentX}px, ${currentY}px)`;
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

    swiper.allowTouchMove = true;
  }
}
