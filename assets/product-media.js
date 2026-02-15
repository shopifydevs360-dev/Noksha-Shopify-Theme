document.addEventListener("DOMContentLoaded", () => {
  initProductMedia();
});

function initProductMedia() {

  /* =============================
     MAIN SWIPER
  ============================== */

  const mainEl = document.querySelector('.product-media__main');
  let mainSwiper = null;

  if (mainEl) {
    mainSwiper = new Swiper(mainEl, {
      slidesPerView: 1,
      loop: false,
      navigation: {
        nextEl: mainEl.querySelector('.swiper-button-next'),
        prevEl: mainEl.querySelector('.swiper-button-prev'),
      },
      pagination: {
        el: mainEl.querySelector('.swiper-pagination'),
        clickable: true,
      },
    });
  }

  /* =============================
     THUMB SWIPER (Your 2nd slider)
  ============================== */

  const thumbsEl = document.querySelector('.product-media__thumbs');

  let thumbsSwiper = null;

  if (thumbsEl) {
    thumbsSwiper = new Swiper(thumbsEl, {
      slidesPerView: 1,
      loop: false,
      navigation: {
        nextEl: thumbsEl.querySelector('.swiper-button-next'),
        prevEl: thumbsEl.querySelector('.swiper-button-prev'),
      },
      pagination: {
        el: thumbsEl.querySelector('.swiper-pagination'),
        clickable: true,
      },
    });
  }

  /* =============================
     LIGHTBOX
  ============================== */

  const lightbox = document.getElementById('mediaLightbox');
  if (!lightbox) return;

  const closeBtn = lightbox.querySelector('.media-lightbox__close');
  const overlay = lightbox.querySelector('.media-lightbox__overlay');
  const sliderEl = lightbox.querySelector('.media-lightbox__slider');

  const lightboxSwiper = new Swiper(sliderEl, {
    loop: false,
    navigation: {
      nextEl: lightbox.querySelector('.swiper-button-next'),
      prevEl: lightbox.querySelector('.swiper-button-prev'),
    },
    pagination: {
      el: lightbox.querySelector('.swiper-pagination'),
      clickable: true,
    },
  });

  /* =============================
     OPEN LIGHTBOX (FIXED SELECTOR)
  ============================== */

  document.addEventListener('click', e => {

    const slide = e.target.closest('.product-media__main .swiper-slide, .product-media__thumbs .swiper-slide');
    if (!slide) return;

    const img = e.target.closest('img');
    if (!img) return;

    e.preventDefault();
    e.stopPropagation();

    const index = Array.from(slide.parentNode.children).indexOf(slide);

    lightbox.classList.add('is-open');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    resetZoom();
    lightboxSwiper.slideTo(index, 0);
  });

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    resetZoom();
  }

  closeBtn.addEventListener('click', closeLightbox);
  overlay.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLightbox();
  });

  /* =============================
     VARIANT AUTO SLIDE
  ============================== */

  document.addEventListener('variant:change', function(event) {

    if (!mainSwiper || !event.detail.variant) return;

    const variantMediaId = event.detail.variant.featured_media?.id;
    if (!variantMediaId) return;

    const slides = mainEl.querySelectorAll('.swiper-slide');

    slides.forEach((slide, index) => {
      if (slide.dataset.mediaId == variantMediaId) {
        mainSwiper.slideTo(index);
      }
    });

  });

  /* =============================
     ZOOM (UNCHANGED)
  ============================== */

  let zoomLevel = 0;
  let activeImg = null;

  function resetZoom() {
    sliderEl.querySelectorAll('img').forEach(img => {
      img.style.transform = "scale(1) translate(0px, 0px)";
      img.classList.remove('is-zoomed', 'is-dragging');
    });

    zoomLevel = 0;
    activeImg = null;

    if (sliderEl.swiper) {
      sliderEl.swiper.allowTouchMove = true;
    }
  }

}
