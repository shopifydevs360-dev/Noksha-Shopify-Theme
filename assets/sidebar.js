document.addEventListener("DOMContentLoaded", () => {
  initSidebarScrollBehavior();
  initHamburgerAnimation();
  initSidebarDrawers();
  initColorControlByPosition();
});

/* ===============================
   SIDEBAR: SCROLL STATE
================================ */
function initSidebarScrollBehavior() {
  const sidebar = document.getElementById("js-sidebar");
  if (!sidebar) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 100) {
      sidebar.classList.remove("expended");
      sidebar.classList.add("minimal");
    } else {
      sidebar.classList.remove("minimal");
      sidebar.classList.add("expended");
    }
  });
}

/* ===============================
   HAMBURGER: LOAD ANIMATION
================================ */
function initHamburgerAnimation() {
  const hamburger = document.querySelector(".hamburger");
  if (!hamburger) return;

  setTimeout(() => {
    hamburger.classList.add("loaded");
  }, 200);
}

/* ===============================
   SIDEBAR DRAWER CONTROLLER
================================ */
function initSidebarDrawers() {
  const triggers = document.querySelectorAll("[data-trigger-section]");
  const overlay = document.getElementById("js-open-overlay");
  const expandedArea = document.getElementById("area-expended");

  let isTransitioning = false;
  const SWITCH_DELAY = 400;

  triggers.forEach(trigger => {
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      if (isTransitioning) return;

      const sectionName = trigger.dataset.triggerSection;
      const isActive = trigger.classList.contains("is-active");
      const hasOpenDrawer = document.querySelector("[data-open-section].is-open");

      // Close if clicking active trigger
      if (isActive) {
        closeAllDrawers(overlay, expandedArea);
        return;
      }

      // Switch drawers with delay
      if (hasOpenDrawer) {
        isTransitioning = true;
        closeAllDrawers(overlay, expandedArea);

        setTimeout(() => {
          openDrawer(sectionName, overlay, expandedArea);
          toggleTriggerText(sectionName);
          setActiveTrigger(trigger);
          isTransitioning = false;
        }, SWITCH_DELAY);
      } else {
        openDrawer(sectionName, overlay, expandedArea);
        toggleTriggerText(sectionName);
        setActiveTrigger(trigger);
      }
    });
  });

  overlay?.addEventListener("click", () => {
    if (!isTransitioning) {
      closeAllDrawers(overlay, expandedArea);
    }
  });
}

/* ===============================
   OPEN DRAWER
================================ */
function openDrawer(sectionName, overlay, expandedArea) {
  const drawer = document.querySelector(
    `[data-open-section="${sectionName}"]`
  );
  if (!drawer) return;

  drawer.classList.add(`${sectionName}-open`, "is-open");
  overlay.classList.remove("hide");
  expandedArea.classList.add("expended-area-active");

  addDrawerBodyState();
}

/* ===============================
   CLOSE ALL DRAWERS
================================ */
function closeAllDrawers(overlay, expandedArea) {
  document.querySelectorAll("[data-open-section]").forEach(drawer => {
    const sectionName = drawer.dataset.openSection;
    drawer.classList.remove(`${sectionName}-open`, "is-open");
  });

  document.querySelectorAll("[data-trigger-section]").forEach(trigger => {
    trigger.classList.remove("is-active");
  });

  document.querySelectorAll("[data-open-item]").forEach(el => {
    el.classList.remove("hide");
  });

  document.querySelectorAll("[data-close-item]").forEach(el => {
    el.classList.add("hide");
  });

  overlay.classList.add("hide");
  expandedArea.classList.remove("expended-area-active");

  removeDrawerBodyState();
}

/* ===============================
   TRIGGER STATE
================================ */
function setActiveTrigger(activeTrigger) {
  document.querySelectorAll("[data-trigger-section]").forEach(trigger => {
    trigger.classList.remove("is-active");
  });
  activeTrigger.classList.add("is-active");
}

/* ===============================
   TOGGLE OPEN / CLOSE TEXT
================================ */
function toggleTriggerText(sectionName) {
  const scope = document.querySelectorAll(
    `[data-trigger-section="${sectionName}"]`
  );

  // Reset ALL
  document.querySelectorAll("[data-open-item]").forEach(el => {
    el.classList.remove("hide");
  });

  document.querySelectorAll("[data-close-item]").forEach(el => {
    el.classList.add("hide");
  });

  // Toggle ONLY within this section
  scope.forEach(trigger => {
    trigger
      .querySelector(`[data-open-item="${sectionName}-open-item"]`)
      ?.classList.add("hide");

    trigger
      .querySelector(`[data-close-item="${sectionName}-close-item"]`)
      ?.classList.remove("hide");
  });
}


/* ===============================
   BODY STATE HELPERS
================================ */
function addDrawerBodyState() {
  document.body.classList.add("drawer-flyout", "disable-scrollbars");
}

function removeDrawerBodyState() {
  document.body.classList.remove("drawer-flyout", "disable-scrollbars");
}


/* ===============================
   COLOR CONTROL (PER ELEMENT)
================================ */
function initColorControlByPosition() {
  const controls = document.querySelectorAll(".color-control");
  const sections = document.querySelectorAll(".section-dark, .section-light");

  if (!controls.length || !sections.length) return;

  function updateColors() {
    controls.forEach(control => {
      const rect = control.getBoundingClientRect();
      const controlY = rect.top + rect.height / 2;

      let matchedSection = null;

      sections.forEach(section => {
        const sRect = section.getBoundingClientRect();
        if (controlY >= sRect.top && controlY <= sRect.bottom) {
          matchedSection = section;
        }
      });

      // Reset
      control.classList.remove("color-light", "color-dark");

      if (!matchedSection) return;

      if (matchedSection.classList.contains("section-dark")) {
        control.classList.add("color-light");
      } else if (matchedSection.classList.contains("section-light")) {
        control.classList.add("color-dark");
      }
    });
  }

  // Run on load + scroll
  updateColors();
  window.addEventListener("scroll", updateColors);
  window.addEventListener("resize", updateColors);
}
