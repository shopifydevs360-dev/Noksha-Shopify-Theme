document.addEventListener("DOMContentLoaded", () => {
  if (!window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  const mask = document.querySelector(".scaling-mask");
  if (!mask) return;

  ScrollTrigger.matchMedia({

    /* =====================
       DESKTOP
    ===================== */
    "(min-width: 1025px)": function () {
      gsap.fromTo(
        mask,
        {
          clipPath: "inset(22rem 34rem 22rem 34rem)"
        },
        {
          clipPath: "inset(0rem 0rem 0rem 0rem)",
          ease: "power1.inOut",
          scrollTrigger: {
            trigger: ".home-intro",
            start: "100px center",
            end: "bottom center",
            scrub: true
          }
        }
      );
    },

    /* =====================
       TABLET
    ===================== */
    "(max-width: 1024px) and (min-width: 768px)": function () {
      gsap.fromTo(
        mask,
        {
          clipPath: "inset(7rem 16rem 12rem 16rem)"
        },
        {
          clipPath: "inset(0rem 0rem 0rem 0rem)",
          ease: "power1.inOut",
          scrollTrigger: {
            trigger: ".home-intro",
            start: "100px center",
            end: "bottom center",
            scrub: true
          }
        }
      );
    },

    /* =====================
       MOBILE
    ===================== */
    "(max-width: 767px)": function () {
      gsap.fromTo(
        mask,
        {
          clipPath: "inset(7rem 9rem 10rem 9rem)"
        },
        {
          clipPath: "inset(0rem 0rem 0rem 0rem)",
          ease: "power1.inOut",
          scrollTrigger: {
            trigger: ".home-intro",
            start: "top bottom",
            end: "bottom center",
            scrub: true
          }
        }
      );
    }

  });
});
