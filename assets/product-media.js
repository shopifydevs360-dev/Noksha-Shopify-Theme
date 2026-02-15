document.addEventListener("DOMContentLoaded", () => {
  initProductMedia();
});

function initProductMedia() {

  /* =============================
     MAIN PRODUCT SWIPER
  ============================== */

  const mainSliderEl = document.querySelector('.product-media__main');

  let mainSwiper = null;

  if (mainSliderEl) {
    mainSwiper = new Swiper(mainSliderEl, {
      slidesPerView: 1,
      loop: true,
      navigation: {
        nextEl: '.product-media__main .swiper-button-next',
        prevEl: '.product-media__main .swiper-button-prev',
      },
      pagination: {
        el: '.product-media__main .swiper-pagination',
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

  /* =============================
     OPEN LIGHTBOX FROM MAIN
  ============================== */

  document.addEventListener('click', e => {
    const slide = e.target.closest('.product-media__main .swiper-slide');
    if (!slide) return;

    const img = e.target.closest('img');
    if (!img) return;

    e.preventDefault();
    e.stopPropagation();

    const index = Array.from(
      slide.parentNode.children
    ).indexOf(slide);

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
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLightbox();
  });

  /* =============================
     VARIANT CHANGE SUPPORT
  ============================== */

  document.addEventListener('variant:change', function(event) {
    if (!mainSwiper || !event.detail.variant) return;

    const variantMediaId = event.detail.variant.featured_media?.id;
    if (!variantMediaId) return;

    const slides = mainSliderEl.querySelectorAll('.swiper-slide');

    slides.forEach((slide, index) => {
      if (slide.dataset.mediaId == variantMediaId) {
        mainSwiper.slideToLoop(index);
      }
    });
  });

  /* =============================
     ZOOM LOGIC (UNCHANGED)
  ============================== */

  let zoomLevel = 0;
  let activeImg = null;

  function resetZoom() {
    sliderEl.querySelectorAll('img').forEach(img => {
      img.style.transform = "scale(1) translate(0px, 0px)";
      img.classList.remove('is-zoomed');
    });

    zoomLevel = 0;
    activeImg = null;
    sliderEl.swiper.allowTouchMove = true;
  }

}
