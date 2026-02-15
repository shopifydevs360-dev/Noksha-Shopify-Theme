document.addEventListener("DOMContentLoaded", () => {
  initProductMedia();
});

function initProductMedia() {

  /* =========================
     INLINE SLIDER
  ========================== */
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

  /* =========================
     LIGHTBOX
  ========================== */
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

  /* =========================
     OPEN LIGHTBOX
  ========================== */
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

  /* =========================
     CLOSE LIGHTBOX
  ========================== */
  function closeLightbox() {
    lightbox.classList.remove('is-open');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    resetZoom();
  }

  closeBtn.addEventListener('click', closeLightbox);
  overlay.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

  /* =========================
     ZOOM + PAN (PERCENT BASED)
  ========================== */
  let zoomLevel = 0;
  let activeImg = null;

  let isDragging = false;
  let hasMoved = false;

  let startX = 0;
  let startY = 0;
  let dragX = 0;
  let dragY = 0;

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
    img.classList.add('is-zoomed');

    sliderEl.swiper.allowTouchMove = false;
    updateTransform();
  });

  sliderEl.addEventListener('mousedown', e => {
    if (!activeImg || zoomLevel === 0) return;

    isDragging = true;
    hasMoved = false;

    startX = e.clientX;
    startY = e.clientY;
  });

  window.addEventListener('mousemove', e => {
    if (!isDragging || !activeImg) return;

    dragX = e.clientX - startX;
    dragY = e.clientY - startY;

    if (Math.abs(dragX) > MOVE_THRESHOLD || Math.abs(dragY) > MOVE_THRESHOLD) {
      hasMoved = true;
    }

    updateTransform();
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  function updateTransform() {
    if (!activeImg) return;

    const scale = zoomLevel === 1 ? 1.6 : 2.6;

    const container = sliderEl.getBoundingClientRect();
    const imgRect = activeImg.getBoundingClientRect();

    const extraW = (imgRect.width * scale - container.width) / scale;
    const extraH = (imgRect.height * scale - container.height) / scale;

    const percentX = extraW ? Math.max(-100, Math.min(100, (dragX / extraW) * 100)) : 0;
    const percentY = extraH ? Math.max(-100, Math.min(100, (dragY / extraH) * 100)) : 0;

    activeImg.style.transform = `scale(${scale}) translate(${percentX}%, ${percentY}%)`;
  }

  function resetZoom() {
    sliderEl.querySelectorAll('img').forEach(img => {
      img.style.transform = "scale(1) translate(0%, 0%)";
      img.classList.remove('is-zoomed');
    });

    zoomLevel = 0;
    activeImg = null;
    dragX = 0;
    dragY = 0;

    sliderEl.swiper.allowTouchMove = true;
  }

}
