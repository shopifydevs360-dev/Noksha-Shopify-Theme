/* ======================================
   SIDEBAR INITIALIZER
====================================== */
(function () {
  let sidebarScrollBound = false;
  let colorControlBound = false;
  let drawerControllerBound = false;
  let currentSidebarScrollHandler = null;
  let currentColorControlHandler = null;

  function initSidebar() {
    initSidebarScrollBehavior();
    initHamburgerAnimation();
    initSidebarDrawers();
    initColorControlByPosition();
  }

  document.addEventListener("DOMContentLoaded", initSidebar);
  document.addEventListener("shopify:section:load", initSidebar);

  /* ===============================
     SIDEBAR: SCROLL STATE
  ================================ */
  function initSidebarScrollBehavior() {
    const sidebar = document.getElementById("js-sidebar");
    if (!sidebar) return;

    const isIndexTemplate = document.body.classList.contains("template-index");

    if (currentSidebarScrollHandler) {
      window.removeEventListener("scroll", currentSidebarScrollHandler);
      currentSidebarScrollHandler = null;
    }

    // If NOT homepage → always minimal
    if (!isIndexTemplate) {
      sidebar.classList.remove("expended");
      sidebar.classList.add("minimal");
      return;
    }

    function updateSidebarState() {
      if (window.scrollY > 100) {
        sidebar.classList.remove("expended");
        sidebar.classList.add("minimal");
      } else {
        sidebar.classList.remove("minimal");
        sidebar.classList.add("expended");
      }
    }

    updateSidebarState();
    currentSidebarScrollHandler = updateSidebarState;
    window.addEventListener("scroll", currentSidebarScrollHandler, { passive: true });
    sidebarScrollBound = true;
  }

  /* ===============================
     HAMBURGER: LOAD ANIMATION
  ================================ */
  function initHamburgerAnimation() {
    const hamburgers = document.querySelectorAll(".hamburger");
    if (!hamburgers.length) return;

    setTimeout(() => {
      hamburgers.forEach((hamburger) => {
        hamburger.classList.add("loaded");
      });
    }, 200);
  }

  /* ===============================
     SIDEBAR DRAWER CONTROLLER
  ================================ */
  function initSidebarDrawers() {
    if (drawerControllerBound) return;

    document.addEventListener("click", function (e) {
      const trigger = e.target.closest("[data-trigger-section]");
      if (!trigger) return;

      e.preventDefault();

      const overlay = document.getElementById("js-open-overlay");
      const expandedArea = document.getElementById("area-expended");
      const sectionName = trigger.dataset.triggerSection;

      if (!sectionName) return;

      const drawer = document.querySelector(`[data-open-section="${sectionName}"]`);
      const isDrawerOpen = drawer && drawer.classList.contains(`${sectionName}-open`);
      const hasOpenDrawer = document.querySelector("[data-open-section].is-open");

      const SWITCH_DELAY = 400;

      if (document.body.classList.contains("sidebar-switching")) return;

      // Close same drawer
      if (isDrawerOpen) {
        closeAllDrawers(overlay, expandedArea);
        return;
      }

      // Switch drawer
      if (hasOpenDrawer) {
        document.body.classList.add("sidebar-switching");
        closeAllDrawers(overlay, expandedArea);

        window.setTimeout(() => {
          openDrawer(sectionName, overlay, expandedArea);
          toggleTriggerText(sectionName);
          setActiveTrigger(trigger);
          document.body.classList.remove("sidebar-switching");
        }, SWITCH_DELAY);

        return;
      }

      // Open fresh drawer
      openDrawer(sectionName, overlay, expandedArea);
      toggleTriggerText(sectionName);
      setActiveTrigger(trigger);
    });

    document.addEventListener("click", function (e) {
      const overlay = e.target.closest("#js-open-overlay");
      if (!overlay) return;

      if (!document.body.classList.contains("sidebar-switching")) {
        const expandedArea = document.getElementById("area-expended");
        closeAllDrawers(overlay, expandedArea);
      }
    });

    drawerControllerBound = true;
  }

  /* ===============================
     OPEN DRAWER
  ================================ */
  function openDrawer(sectionName, overlay, expandedArea) {
    const drawer = document.querySelector(`[data-open-section="${sectionName}"]`);
    if (!drawer) return;

    drawer.classList.add(`${sectionName}-open", "is-open`);
    drawer.classList.add(`${sectionName}-open`);
    drawer.classList.add("is-open");

    if (overlay) {
      overlay.classList.remove("hide");
    }

    if (expandedArea) {
      expandedArea.classList.add("expended-area-active");
    }

    addDrawerBodyState();
  }

  /* ===============================
     CLOSE ALL DRAWERS
  ================================ */
  function closeAllDrawers(overlay, expandedArea) {
    document.querySelectorAll("[data-open-section]").forEach((drawer) => {
      const sectionName = drawer.dataset.openSection;
      if (!sectionName) return;

      drawer.classList.remove(`${sectionName}-open`);
      drawer.classList.remove("is-open");
    });

    document.querySelectorAll("[data-trigger-section]").forEach((trigger) => {
      trigger.classList.remove("is-active");
    });

    document.querySelectorAll("[data-open-item]").forEach((el) => {
      el.classList.remove("hide");
    });

    document.querySelectorAll("[data-close-item]").forEach((el) => {
      el.classList.add("hide");
    });

    if (overlay) {
      overlay.classList.add("hide");
    }

    if (expandedArea) {
      expandedArea.classList.remove("expended-area-active");
    }

    removeDrawerBodyState();
  }

  /* ===============================
     TRIGGER STATE
  ================================ */
  function setActiveTrigger(activeTrigger) {
    document.querySelectorAll("[data-trigger-section]").forEach((trigger) => {
      trigger.classList.remove("is-active");
    });

    if (activeTrigger) {
      activeTrigger.classList.add("is-active");
    }
  }

  /* ===============================
     TOGGLE OPEN / CLOSE TEXT
  ================================ */
  function toggleTriggerText(sectionName) {
    const scope = document.querySelectorAll(`[data-trigger-section="${sectionName}"]`);

    document.querySelectorAll("[data-open-item]").forEach((el) => {
      el.classList.remove("hide");
    });

    document.querySelectorAll("[data-close-item]").forEach((el) => {
      el.classList.add("hide");
    });

    scope.forEach((trigger) => {
      const openItem = trigger.querySelector(`[data-open-item="${sectionName}-open-item"]`);
      const closeItem = trigger.querySelector(`[data-close-item="${sectionName}-close-item"]`);

      if (openItem) {
        openItem.classList.add("hide");
      }

      if (closeItem) {
        closeItem.classList.remove("hide");
      }
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

    if (currentColorControlHandler) {
      window.removeEventListener("scroll", currentColorControlHandler);
      window.removeEventListener("resize", currentColorControlHandler);
      currentColorControlHandler = null;
    }

    let ticking = false;

    function updateColors() {
      controls.forEach((control) => {
        const rect = control.getBoundingClientRect();
        const controlY = rect.top + rect.height / 2;

        let matchedSection = null;

        sections.forEach((section) => {
          const sRect = section.getBoundingClientRect();
          if (controlY >= sRect.top && controlY <= sRect.bottom) {
            matchedSection = section;
          }
        });

        control.classList.remove("color-light", "color-dark");

        if (!matchedSection) return;

        if (matchedSection.classList.contains("section-dark")) {
          control.classList.add("color-light");
        } else if (matchedSection.classList.contains("section-light")) {
          control.classList.add("color-dark");
        }
      });

      ticking = false;
    }

    function requestUpdate() {
      if (!ticking) {
        window.requestAnimationFrame(updateColors);
        ticking = true;
      }
    }

    updateColors();
    currentColorControlHandler = requestUpdate;

    window.addEventListener("scroll", currentColorControlHandler, { passive: true });
    window.addEventListener("resize", currentColorControlHandler);

    colorControlBound = true;
  }
})();