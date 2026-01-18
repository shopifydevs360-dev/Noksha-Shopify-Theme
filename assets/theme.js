/* ======================================
   THEME INITIALIZER
====================================== */
document.addEventListener("DOMContentLoaded", () => {
  initBodyScrollState();
  initPromoBarState();
  initAccordion();
});

document.addEventListener("shopify:section:load", () => {
  initPromoBarState();
});

/* ===============================
   BODY: SCROLLED STATE
================================ */
/* ===============================
   BODY: SCROLL STATES
================================ */
function initBodyScrollState() {
  const SCROLL_THRESHOLD = 100;
  const body = document.body;

  function onScroll() {
    const scrollY = window.scrollY;

    // Existing behavior
    body.classList.toggle("scrolled", scrollY > SCROLL_THRESHOLD);

    // NEW behavior
    body.classList.toggle("top-home", scrollY === 0);
  }

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ===============================
   BODY: PROMO BAR STATE
================================ */
function initPromoBarState() {
  const body = document.body;
  const promoBar = document.getElementById("announcement-bar");

  body.classList.toggle("has-promo-bar", !!promoBar);
}

/* ===============================
   ACCORDION FUNCTIONALITY
================================ */
function initAccordion() {
  document.addEventListener("click", function (e) {
    const trigger = e.target.closest(".accordion-trigger");
    if (!trigger) return;

    const item = trigger.closest(".accordion-item");
    if (!item) return;

    item.classList.toggle("active");
  });
}

