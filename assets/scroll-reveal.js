// document.addEventListener('DOMContentLoaded', function () {
//   if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

//   gsap.registerPlugin(ScrollTrigger);

//   const animations = [
//     { selector: '.reveal-up', y: 100, x: 0, opacity: 0 },
//     { selector: '.reveal-down', y: -60, x: 0, opacity: 0 },
//     { selector: '.reveal-left', x: 60, y: 0, opacity: 0 },
//     { selector: '.reveal-right', x: -60, y: 0, opacity: 0 },
//     { selector: '.reveal-fade', x: 0, y: 0, opacity: 0 },
//     { selector: '.reveal-zoom', x: 0, y: 0, opacity: 0, scale: 0.9 }
//   ];

//   animations.forEach((item) => {
//     document.querySelectorAll(item.selector).forEach((element) => {
//       const fromVars = {
//         opacity: item.opacity,
//         x: item.x || 0,
//         y: item.y || 0
//       };

//       if (item.scale !== undefined) {
//         fromVars.scale = item.scale;
//       }

//       gsap.fromTo(
//         element,
//         fromVars,
//         {
//           opacity: 1,
//           x: 0,
//           y: 0,
//           scale: 1,
//           duration: 1,
//           ease: 'power3.out',
//           scrollTrigger: {
//             trigger: element,
//             start: 'top 85%',
//             toggleActions: 'play none none none'
//           }
//         }
//       );
//     });
//   });
// });


document.addEventListener('DOMContentLoaded', function () {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  document.querySelectorAll('.js-product-scroll-reveal').forEach((grid) => {
    const cards = grid.querySelectorAll('.product-card');
    if (!cards.length) return;

    gsap.set(cards, {
      opacity: 0,
      x: 80
    });

    ScrollTrigger.create({
      trigger: grid,
      start: 'top 85%',
      once: true,
      onEnter: function () {
        gsap.to(cards, {
          opacity: 1,
          x: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12,
          clearProps: 'transform,opacity'
        });
      }
    });
  });
});