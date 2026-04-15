document.addEventListener('DOMContentLoaded', function () {
  initProductMedia(document);
});

document.addEventListener('shopify:section:load', function (event) {
  initProductMedia(event.target);
});

function initProductMedia(scope) {
  const container = scope || document;

  initProductMediaMain(container);
  initProductMediaThumbs(container);
  initProductMediaLightbox(container);
  initProductVideoLightbox(container);
}

/* =========================
   MAIN PRODUCT SWIPER
========================= */
function initProductMediaMain(scope) {
  const mainEl = scope.querySelector('#MainProductMedia');
  if (!mainEl || mainEl.dataset.swiperInitialized === 'true') return;

  mainEl.dataset.swiperInitialized = 'true';

  const mainSwiper = new Swiper(mainEl, {
    loop: true,
    slidesPerView: 1,
    autoHeight: true,
    effect: 'fade',
    fadeEffect: { crossFade: true },
    allowTouchMove: false,
    simulateTouch: false
  });

  const variantsJsonEl = document.getElementById('ProductVariantsJson');
  if (!variantsJsonEl) return;

  let variants = [];

  try {
    variants = JSON.parse(variantsJsonEl.textContent);
  } catch (error) {
    console.warn('ProductVariantsJson parse failed:', error);
    return;
  }

  function getSelectedOptions() {
    const selected = [];

    document
      .querySelectorAll('.main-product-variant-selector fieldset')
      .forEach(function (fieldset) {
        const checked = fieldset.querySelector('input:checked');
        const select = fieldset.querySelector('select');

        if (checked) {
          selected.push(checked.value);
        } else if (select) {
          selected.push(select.value);
        }
      });

    return selected;
  }

  function findMatchingVariant(options) {
    return variants.find(function (variant) {
      return variant.options.every(function (opt, index) {
        return opt === options[index];
      });
    });
  }

  function slideToVariant(variant) {
    if (!variant || !variant.featured_media) return;

    const mediaId = String(variant.featured_media.id);
    const slides = mainEl.querySelectorAll('.swiper-slide:not(.swiper-slide-duplicate)');

    slides.forEach(function (slide, index) {
      if (String(slide.dataset.mediaId) === mediaId) {
        mainSwiper.slideToLoop(index);
      }
    });
  }

  document
    .querySelectorAll('.main-product-variant-selector input, .main-product-variant-selector select')
    .forEach(function (element) {
      if (element.dataset.variantMediaBound === 'true') return;

      element.dataset.variantMediaBound = 'true';

      element.addEventListener('change', function () {
        const selected = getSelectedOptions();
        const variant = findMatchingVariant(selected);
        slideToVariant(variant);
      });
    });
}

/* =========================
   THUMBS SWIPER
========================= */
function initProductMediaThumbs(scope) {
  const thumbs = scope.querySelector('.product-media__thumbs');
  if (!thumbs || thumbs.dataset.swiperInitialized === 'true') return;

  thumbs.dataset.swiperInitialized = 'true';

  new Swiper(thumbs, {
    slidesPerView: 1,
    loop: true,
    navigation: {
      nextEl: '.product-media__thumbs .swiper-button-next',
      prevEl: '.product-media__thumbs .swiper-button-prev'
    },
    pagination: {
      el: '.product-media__thumbs .swiper-pagination',
      clickable: true,
      type: 'fraction',
      formatFractionCurrent: function (number) {
        return number < 10 ? '0' + number : number;
      },
      formatFractionTotal: function (number) {
        return number < 10 ? '0' + number : number;
      }
    }
  });
}

/* =========================
   IMAGE LIGHTBOX
========================= */
function initProductMediaLightbox(scope) {
  const lightbox = document.getElementById('mediaLightbox');
  if (!lightbox || lightbox.dataset.initialized === 'true') return;

  lightbox.dataset.initialized = 'true';

  const closeBtn = lightbox.querySelector('.media-lightbox__close');
  const overlay = lightbox.querySelector('.media-lightbox__overlay');
  const sliderEl = lightbox.querySelector('.media-lightbox__slider');

  if (!sliderEl) return;

  const lightboxSwiper = new Swiper(sliderEl, {
    loop: true,
    navigation: {
      nextEl: '.media-lightbox .swiper-button-next',
      prevEl: '.media-lightbox .swiper-button-prev'
    },
    pagination: {
      el: '.media-lightbox .swiper-pagination',
      clickable: true,
      type: 'fraction',
      formatFractionCurrent: function (number) {
        return number < 10 ? '0' + number : number;
      },
      formatFractionTotal: function (number) {
        return number < 10 ? '0' + number : number;
      }
    }
  });

  initProductMediaLightboxOpen(lightbox, lightboxSwiper);
  initProductMediaZoom(sliderEl, lightboxSwiper);

  function closeLightbox() {
    resetProductMediaZoom(sliderEl, lightboxSwiper);
    lightbox.classList.remove('is-open');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeLightbox);
  }

  if (overlay) {
    overlay.addEventListener('click', closeLightbox);
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && lightbox.classList.contains('is-open')) {
      closeLightbox();
    }
  });
}

/* =========================
   IMAGE LIGHTBOX OPEN
========================= */
function initProductMediaLightboxOpen(lightbox, swiper) {
  if (document.body.dataset.productMediaImageOpenBound === 'true') return;
  document.body.dataset.productMediaImageOpenBound = 'true';

  document.addEventListener('click', function (event) {
    const clickedImage = event.target.closest('img');
    if (!clickedImage) return;

    const videoTrigger = event.target.closest(
      '.product-media__video, .js-open-video-lightbox, [data-video-lightbox-trigger]'
    );

    if (videoTrigger) return;

    const mainSlide = event.target.closest('.product-media__main .swiper-slide');
    const thumbSlide = event.target.closest('.product-media__thumbs .swiper-slide');

    if (!mainSlide && !thumbSlide) return;

    event.preventDefault();

    let index = 0;

    if (thumbSlide) {
      index = getThumbImageIndex(thumbSlide);
    } else if (mainSlide) {
      index = getMainImageIndex(mainSlide);
    }

    lightbox.classList.add('is-open');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    swiper.slideToLoop(index, 0);
  });
}

function getMainImageIndex(slide) {
  const mainSlides = Array.from(
    document.querySelectorAll('#MainProductMedia .swiper-slide:not(.swiper-slide-duplicate)')
  );

  const index = mainSlides.indexOf(slide);
  return index >= 0 ? index : 0;
}

function getThumbImageIndex(slide) {
  const explicitIndex = slide.querySelector('[data-lightbox-index]');
  if (explicitIndex) {
    const parsed = parseInt(explicitIndex.getAttribute('data-lightbox-index'), 10);
    if (!Number.isNaN(parsed)) return parsed;
  }

  const slides = Array.from(
    document.querySelectorAll('.product-media__thumbs .swiper-slide:not(.swiper-slide-duplicate)')
  );

  const index = slides.indexOf(slide);
  return index >= 0 ? index : 0;
}

/* =========================
   ZOOM + DRAG
========================= */
function initProductMediaZoom(sliderEl, swiper) {
  if (!sliderEl || !swiper) return;
  if (sliderEl.dataset.zoomInitialized === 'true') return;

  sliderEl.dataset.zoomInitialized = 'true';

  let zoomLevel = 0;
  let activeImg = null;
  let isDragging = false;
  let hasMoved = false;
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;

  const MOVE_THRESHOLD = 5;

  function resetZoom() {
    sliderEl.querySelectorAll('img').forEach(function (img) {
      img.style.transform = 'scale(1) translate(0px, 0px)';
      img.classList.remove('is-zoomed', 'is-dragging');
    });

    zoomLevel = 0;
    activeImg = null;
    isDragging = false;
    hasMoved = false;
    startX = 0;
    startY = 0;
    currentX = 0;
    currentY = 0;

    swiper.allowTouchMove = true;
  }

  sliderEl.addEventListener('click', function (event) {
    const img = event.target.closest('img');
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
    img.style.transform = 'scale(' + scale + ') translate(0px, 0px)';

    currentX = 0;
    currentY = 0;

    swiper.allowTouchMove = false;
  });

  sliderEl.addEventListener('mousedown', function (event) {
    if (!activeImg || zoomLevel === 0) return;

    isDragging = true;
    hasMoved = false;

    startX = event.clientX - currentX;
    startY = event.clientY - currentY;

    activeImg.classList.add('is-dragging');
  });

  window.addEventListener('mousemove', function (event) {
    if (!isDragging || !activeImg) return;

    const dx = event.clientX - startX;
    const dy = event.clientY - startY;

    if (
      Math.abs(dx - currentX) > MOVE_THRESHOLD ||
      Math.abs(dy - currentY) > MOVE_THRESHOLD
    ) {
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
      'scale(' + scale + ') translate(' + currentX + 'px, ' + currentY + 'px)';
  });

  window.addEventListener('mouseup', function () {
    isDragging = false;

    if (activeImg) {
      activeImg.classList.remove('is-dragging');
    }
  });

  swiper.on('slideChange', resetZoom);
  swiper.on('transitionStart', resetZoom);

  sliderEl.resetZoom = resetZoom;
}

function resetProductMediaZoom(sliderEl, swiper) {
  if (sliderEl && typeof sliderEl.resetZoom === 'function') {
    sliderEl.resetZoom();
  } else if (swiper) {
    swiper.allowTouchMove = true;
  }
}

/* =========================
   VIDEO LIGHTBOX / MODAL
========================= */
function initProductVideoLightbox(scope) {
  const videoLightbox = document.getElementById('mediaVideoLightbox');
  if (!videoLightbox || videoLightbox.dataset.initialized === 'true') return;

  videoLightbox.dataset.initialized = 'true';

  const overlay = videoLightbox.querySelector('.media-video-lightbox__overlay');
  const closeBtn = videoLightbox.querySelector('.media-video-lightbox__close');
  const content = videoLightbox.querySelector('.media-video-lightbox__content');

  function stopVideoPlayback() {
    if (!content) return;

    const videos = content.querySelectorAll('video');
    const iframes = content.querySelectorAll('iframe');

    videos.forEach(function (video) {
      try {
        video.pause();
        video.currentTime = 0;
      } catch (error) {
        console.warn('Could not reset video:', error);
      }
    });

    iframes.forEach(function (iframe) {
      const src = iframe.getAttribute('src');
      iframe.setAttribute('src', src);
    });
  }

  function closeVideoLightbox() {
    stopVideoPlayback();
    videoLightbox.classList.remove('is-open');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeVideoLightbox);
  }

  if (overlay) {
    overlay.addEventListener('click', closeVideoLightbox);
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && videoLightbox.classList.contains('is-open')) {
      closeVideoLightbox();
    }
  });

  if (document.body.dataset.productMediaVideoOpenBound === 'true') return;
  document.body.dataset.productMediaVideoOpenBound = 'true';

  document.addEventListener('click', function (event) {
    const trigger = event.target.closest(
      '.product-media__video, .js-open-video-lightbox, [data-video-lightbox-trigger]'
    );

    if (!trigger) return;

    const sourceVideo = trigger.querySelector('video');
    const sourceIframe = trigger.querySelector('iframe');
    const modalInner = videoLightbox.querySelector('.media-video-lightbox__body');

    if (!modalInner) return;

    event.preventDefault();

    modalInner.innerHTML = '';

    if (sourceVideo) {
      const clonedVideo = sourceVideo.cloneNode(true);

      clonedVideo.removeAttribute('autoplay');
      clonedVideo.removeAttribute('loop');
      clonedVideo.removeAttribute('muted');
      clonedVideo.setAttribute('controls', 'controls');
      clonedVideo.controls = true;
      clonedVideo.autoplay = false;
      clonedVideo.loop = false;
      clonedVideo.muted = false;
      clonedVideo.currentTime = 0;

      modalInner.appendChild(clonedVideo);
    } else if (sourceIframe) {
      const clonedIframe = sourceIframe.cloneNode(true);
      let src = clonedIframe.getAttribute('src') || '';

      if (src.indexOf('autoplay=1') === -1) {
        src += (src.indexOf('?') > -1 ? '&' : '?') + 'autoplay=1';
      }

      clonedIframe.setAttribute('src', src);
      modalInner.appendChild(clonedIframe);
    } else {
      return;
    }

    videoLightbox.classList.add('is-open');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  });
}