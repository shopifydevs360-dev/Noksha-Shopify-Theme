document.addEventListener('DOMContentLoaded', initPinnedArticles);
document.addEventListener('shopify:section:load', initPinnedArticles);

function initPinnedArticles() {
  gsap.registerPlugin(ScrollTrigger);

  document.querySelectorAll('[data-featured-articles]').forEach(section => {
    if (section.dataset.init) return;
    section.dataset.init = 'true';

    const slides = section.querySelectorAll('.article-slide');
    const counterGroups = section.querySelectorAll('.featured-post-count');
    
    const slidesCount = slides.length;
    const SCROLL_STEP = 400;


    function activateSlide(index) {
      slides.forEach((slide, i) => {
        slide.classList.toggle('is-active', i === index);
      });

      counterGroups.forEach(group => {
        const buttons = group.querySelectorAll('.counter-item');
        buttons.forEach((btn, i) => {
          btn.classList.toggle('active-counter', i === index);
        });
      });
    }

counterGroups.forEach(group => {
  group.querySelectorAll('.counter-item').forEach(btn => {
    btn.addEventListener('click', () => {
      activateSlide(+btn.dataset.index);
    });
  });
});


    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: `+=${slidesCount * SCROLL_STEP}`,
      pin: true,
      scrub: true,

      onUpdate(self) {
        const index = Math.round(self.progress * (slidesCount - 1));
        activateSlide(index);
      }
    });
    
  });
}
