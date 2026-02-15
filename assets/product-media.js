document.addEventListener("DOMContentLoaded", () => {
  initProductMedia();
});

function initProductMedia() {
  initProductMediaMain();
  initProductMediaThumbs();
  initProductMediaLightbox();
}
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
    if (!variant?.featured_media) return;

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
