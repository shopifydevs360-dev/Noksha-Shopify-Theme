document.addEventListener("DOMContentLoaded", initAllProductMedia);
document.addEventListener("shopify:section:load", initAllProductMedia);

function initAllProductMedia() {
  document.querySelectorAll("[data-product-media]").forEach(section => {
    initProductMedia(section);
  });
}

function initProductMedia(section) {

  if (section.dataset.initialized) return;
  section.dataset.initialized = "true";

  const mainEl = section.querySelector("[data-main-slider]");
  const thumbEl = section.querySelector("[data-thumb-slider]");
  const lightbox = document.querySelector("[data-media-lightbox]");

  if (!mainEl) return;

  /* =====================
     THUMB SLIDER
  ====================== */
  let thumbsSwiper = null;

  if (thumbEl) {
    thumbsSwiper = new Swiper(thumbEl, {
      slidesPerView: 4,
      spaceBetween: 10,
      watchSlidesProgress: true,
    });
  }

  /* =====================
     MAIN SLIDER
  ====================== */
  const mainSwiper = new Swiper(mainEl, {
    loop: false,
    navigation: {
      nextEl: mainEl.querySelector(".swiper-button-next"),
      prevEl: mainEl.querySelector(".swiper-button-prev"),
    },
    pagination: {
      el: mainEl.querySelector(".swiper-pagination"),
      clickable: true,
    },
    thumbs: thumbsSwiper ? { swiper: thumbsSwiper } : {},
  });


  /* =====================
     LIGHTBOX
  ====================== */

  if (!lightbox) return;

  const sliderEl = lightbox.querySelector("[data-lightbox-slider]");
  const closeBtn = lightbox.querySelector(".media-lightbox__close");
  const overlay = lightbox.querySelector(".media-lightbox__overlay");

  const lightboxSwiper = new Swiper(sliderEl, {
    loop: false,
    navigation: {
      nextEl: sliderEl.querySelector(".swiper-button-next"),
      prevEl: sliderEl.querySelector(".swiper-button-prev"),
    },
    pagination: {
      el: sliderEl.querySelector(".swiper-pagination"),
      clickable: true,
    },
  });

  /* OPEN LIGHTBOX */
  section.addEventListener("click", e => {
    const slide = e.target.closest("[data-lightbox-index]");
    if (!slide) return;

    const index = parseInt(slide.dataset.lightboxIndex);
    if (isNaN(index)) return;

    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    lightboxSwiper.slideTo(index, 0);
  });

  /* CLOSE */
  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  closeBtn?.addEventListener("click", closeLightbox);
  overlay?.addEventListener("click", closeLightbox);
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeLightbox();
  });


  /* =====================
     SIMPLE ZOOM
  ====================== */

  let zoomed = false;

  sliderEl.addEventListener("click", e => {
    const img = e.target.closest("img");
    if (!img) return;

    zoomed = !zoomed;

    if (zoomed) {
      img.style.transform = "scale(2)";
      img.style.cursor = "zoom-out";
      lightboxSwiper.allowTouchMove = false;
    } else {
      img.style.transform = "scale(1)";
      img.style.cursor = "zoom-in";
      lightboxSwiper.allowTouchMove = true;
    }
  });

}
