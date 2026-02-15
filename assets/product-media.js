document.addEventListener("DOMContentLoaded", () => {
  initProductMedia();
});

function initProductMedia() {
  const productMedia = document.querySelector('.product-media');
  if (!productMedia) return;
  
  initMainMediaSwitcher(productMedia);
  initThumbnails(productMedia);
  initLightbox(productMedia);
}

function initMainMediaSwitcher(container) {
  const thumbs = container.querySelectorAll('.product-media__thumb');
  const featuredContainer = container.querySelector('.product-media__featured');
  const videoRow = container.querySelector('.product-media__video-row');
  const counter = container.querySelector('.product-media__counter .current');
  
  thumbs.forEach((thumb, index) => {
    thumb.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Update active states
      thumbs.forEach(t => t.classList.remove('is-active'));
      thumb.classList.add('is-active');
      
      // Update counter
      if (counter) counter.textContent = index + 1;
      
      // Get media data
      const mediaId = thumb.dataset.mediaId;
      const mediaType = thumb.dataset.mediaType;
      
      // Here you would load the corresponding media
      // This might require an AJAX call or preloaded data
      loadMediaIntoFeatured(mediaId, mediaType, featuredContainer);
      
      // Hide video row if featured is video
      if (videoRow) {
        videoRow.style.display = mediaType === 'video' ? 'none' : 'flex';
      }
    });
  });
}

function loadMediaIntoFeatured(mediaId, mediaType, container) {
  // Implementation depends on your data structure
  // Could be preloaded HTML or AJAX fetch
}

function initThumbnails(container) {
  const thumbsSlider = container.querySelector('[data-thumbs-slider]');
  if (!thumbsSlider) return;
  
  const isVertical = container.querySelector('.product-media__container--thumbnails-left');
  
  new Swiper(thumbsSlider, {
    slidesPerView: 4,
    spaceBetween: 10,
    direction: isVertical ? 'vertical' : 'horizontal',
    navigation: {
      nextEl: '.product-media__thumbs .swiper-button-next',
      prevEl: '.product-media__thumbs .swiper-button-prev',
    },
    pagination: {
      el: '.product-media__thumbs .swiper-pagination',
      clickable: true,
    },
    breakpoints: {
      320: { slidesPerView: 3 },
      768: { slidesPerView: 4 },
      1024: { slidesPerView: isVertical ? 5 : 4 }
    }
  });
}

function initLightbox(container) {
  const lightbox = document.getElementById('mediaLightbox');
  if (!lightbox) return;
  
  const openButtons = container.querySelectorAll('.js-media-trigger, .js-open-lightbox');
  const closeBtn = lightbox.querySelector('.media-lightbox__close');
  const overlay = lightbox.querySelector('.media-lightbox__overlay');
  const sliderEl = lightbox.querySelector('[data-lightbox-slider]');
  const thumbsEl = lightbox.querySelector('[data-lightbox-thumbs]');
  
  // Initialize main lightbox slider
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
    thumbs: {
      swiper: thumbsEl ? new Swiper(thumbsEl, {
        slidesPerView: 5,
        spaceBetween: 10,
        freeMode: true,
        watchSlidesProgress: true,
      }) : null
    }
  });
  
  // Open lightbox with specific slide
  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      
      let slideIndex = 0;
      const mediaId = btn.closest('[data-media-id]')?.dataset.mediaId;
      
      if (mediaId) {
        // Find slide index by media ID
        const slides = lightbox.querySelectorAll('[data-media-id]');
        slides.forEach((slide, i) => {
          if (slide.dataset.mediaId === mediaId) {
            slideIndex = i;
          }
        });
      }
      
      openLightbox(lightbox, lightboxSwiper, slideIndex);
    });
  });
  
  // Tab functionality
  const tabs = lightbox.querySelectorAll('.media-lightbox__tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabType = tab.dataset.tab;
      
      tabs.forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      
      filterLightboxSlides(lightbox, lightboxSwiper, tabType);
    });
  });
  
  // Close handlers
  closeBtn.addEventListener('click', () => closeLightbox(lightbox));
  overlay.addEventListener('click', () => closeLightbox(lightbox));
  document.addEventListener('keydown', e => { 
    if (e.key === 'Escape') closeLightbox(lightbox); 
  });
  
  // Initialize zoom functionality
  initLightboxZoom(lightbox, sliderEl);
}

function openLightbox(lightbox, swiper, index = 0) {
  lightbox.classList.add('is-open');
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  
  // Reset zoom
  resetAllZoom(lightbox);
  
  // Go to slide
  swiper.slideToLoop(index, 0);
}

function closeLightbox(lightbox) {
  lightbox.classList.remove('is-open');
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
  
  // Stop any playing videos
  lightbox.querySelectorAll('video').forEach(video => {
    video.pause();
  });
  
  resetAllZoom(lightbox);
}

function filterLightboxSlides(lightbox, swiper, filterType) {
  const slides = lightbox.querySelectorAll('.swiper-slide');
  
  slides.forEach(slide => {
    const mediaType = slide.dataset.mediaType;
    
    if (filterType === 'all') {
      slide.style.display = 'flex';
    } else if (filterType === 'images' && mediaType === 'image') {
      slide.style.display = 'flex';
    } else if (filterType === 'videos' && (mediaType === 'video' || mediaType === 'external_video')) {
      slide.style.display = 'flex';
    } else if (filterType === 'models' && mediaType === 'model') {
      slide.style.display = 'flex';
    } else {
      slide.style.display = 'none';
    }
  });
  
  swiper.update();
}

function initLightboxZoom(lightbox, sliderEl) {
  let zoomLevel = 0;
  let activeImg = null;
  let isDragging = false;
  let hasMoved = false;
  let startX, startY, currentX = 0, currentY = 0;
  const MOVE_THRESHOLD = 5;
  
  sliderEl.addEventListener('click', (e) => {
    const img = e.target.closest('img');
    if (!img || img.closest('.swiper-button') || img.closest('.media-lightbox__thumb')) return;
    
    if (hasMoved) {
      hasMoved = false;
      return;
    }
    
    // Cycle zoom levels: 0 (none) -> 1 (1.5x) -> 2 (2.5x) -> 3 (4x)
    zoomLevel = (zoomLevel + 1) % 4;
    
    if (zoomLevel === 0) {
      resetImageZoom(img);
      activeImg = null;
      sliderEl.swiper.allowTouchMove = true;
      return;
    }
    
    activeImg = img;
    const scales = [1, 1.5, 2.5, 4];
    const scale = scales[zoomLevel];
    
    img.classList.add('is-zoomed');
    img.style.transform = `scale(${scale}) translate(0px, 0px)`;
    sliderEl.swiper.allowTouchMove = false;
  });
  
  // Drag to pan when zoomed
  sliderEl.addEventListener('mousedown', (e) => {
    if (!activeImg || zoomLevel === 0) return;
    
    isDragging = true;
    hasMoved = false;
    
    startX = e.clientX - currentX;
    startY = e.clientY - currentY;
    
    activeImg.classList.add('is-dragging');
  });
  
  window.addEventListener('mousemove', (e) => {
    if (!isDragging || !activeImg) return;
    
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    if (Math.abs(dx - currentX) > MOVE_THRESHOLD || Math.abs(dy - currentY) > MOVE_THRESHOLD) {
      hasMoved = true;
    }
    
    const scales = [1, 1.5, 2.5, 4];
    const scale = scales[zoomLevel];
    const containerRect = sliderEl.getBoundingClientRect();
    const imgRect = activeImg.getBoundingClientRect();
    
    const scaledWidth = imgRect.width;
    const scaledHeight = imgRect.height;
    
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
}

function resetImageZoom(img) {
  if (!img) return;
  img.style.transform = "scale(1) translate(0px, 0px)";
  img.classList.remove('is-zoomed', 'is-dragging');
}

function resetAllZoom(lightbox) {
  lightbox.querySelectorAll('img').forEach(resetImageZoom);
}