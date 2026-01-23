document.addEventListener("DOMContentLoaded", () => {
  initNavDrawer();
  initBackButtons();
  initMobileLinkControl();
});

/* ======================================
   BREAKPOINT DETECTION
====================================== */
const isMobileView = window.matchMedia("(max-width: 991px)").matches;

/* ======================================
   MOBILE LINK CONTROL
====================================== */
function initMobileLinkControl() {
  if (!isMobileView) return;

  const drawer = document.getElementById("js-nav-drawer");

  // Parent
  drawer.querySelectorAll('[data-level="parent"]').forEach(item => {
    if (item.dataset.hasChildren === "true" || item.dataset.isCollection === "true") {
      disableLink(item);
    }
  });

  // Child
  drawer.querySelectorAll(".child-menu-item").forEach(item => {
    if (item.dataset.hasChildren === "true" || item.dataset.isCollection === "true") {
      disableLink(item);
    }
  });

  // Grandchild (collection only)
  drawer.querySelectorAll(".grandchild-menu-item").forEach(item => {
    if (item.dataset.isCollection === "true") {
      disableLink(item);
    }
  });
}

function disableLink(item) {
  const link = item.querySelector("a");
  if (!link) return;

  if (!link.dataset.href) {
    link.dataset.href = link.getAttribute("href");
  }

  link.removeAttribute("href");
}

/* ======================================
   NAV DRAWER MAIN
====================================== */
function initNavDrawer() {
  const drawer = document.getElementById("js-nav-drawer");
  const triggerEvent = isMobileView ? "click" : "mouseenter";

  /* ---------- PARENT ---------- */
  drawer.querySelectorAll('[data-level="parent"]').forEach(parent => {
    parent.addEventListener(triggerEvent, e => {
      const hasChildren = parent.dataset.hasChildren === "true";
      const isCollection = parent.dataset.isCollection === "true";

      // ✅ Prevent navigation ONLY on mobile when needed
      if (isMobileView && (hasChildren || isCollection)) {
        e.preventDefault();
      }

      // ✅ Desktop hover ALWAYS works
      resetAllPanels();

      if (hasChildren) {
        openChildPanel(parent.dataset.parentHandle, parent.textContent.trim());
      }

      if (isCollection) {
        openCollectionPanel(
          parent.dataset.collectionHandle,
          parent.textContent.trim()
        );
      }
    });
  });

  /* ---------- CHILD ---------- */
  drawer.querySelectorAll(".child-menu-item").forEach(child => {
    child.addEventListener(triggerEvent, e => {
      const hasChildren = child.dataset.hasChildren === "true";
      const isCollection = child.dataset.isCollection === "true";

      if (isMobileView && (hasChildren || isCollection)) {
        e.preventDefault();
      }

      resetGrandChild();
      resetCollection();

      if (hasChildren) {
        openGrandChildPanel(
          child.dataset.childHandle,
          child.textContent.trim()
        );
      }

      if (isCollection) {
        openCollectionPanel(
          child.dataset.collectionHandle,
          child.textContent.trim()
        );
      }
    });
  });

  /* ---------- GRAND CHILD ---------- */
  drawer.querySelectorAll(".grandchild-menu-item").forEach(gc => {
    gc.addEventListener(triggerEvent, e => {
      const isCollection = gc.dataset.isCollection === "true";

      if (isMobileView && isCollection) {
        e.preventDefault();
      }

      if (isCollection) {
        openCollectionPanel(
          gc.dataset.collectionHandle,
          gc.textContent.trim()
        );
      }
    });
  });
}

/* ======================================
   CHILD PANEL
====================================== */
function openChildPanel(parentHandle, titleText) {
  const drawer = document.getElementById("js-nav-drawer");
  const panel = document.getElementById("js-child-linklist");

  drawer.classList.add("panel-1");
  panel.classList.remove("hide");

  panel.querySelector(".child-linklist-title").textContent = titleText;

  panel.querySelectorAll(".child-menu-item").forEach(item => {
    item.classList.toggle("hide", item.dataset.parent !== parentHandle);
  });
}

/* ======================================
   GRAND CHILD PANEL
====================================== */
function openGrandChildPanel(childHandle, titleText) {
  const drawer = document.getElementById("js-nav-drawer");
  const panel = document.getElementById("js-grandchild-linklist");

  drawer.classList.add("panel-2");
  panel.classList.remove("hide");

  panel.querySelector(".grandchild-linklist-title").textContent = titleText;

  panel.querySelectorAll(".grandchild-menu-item").forEach(item => {
    item.classList.toggle("hide", item.dataset.child !== childHandle);
  });
}

/* ======================================
   COLLECTION PANEL
====================================== */
function openCollectionPanel(handle, titleText) {
  const drawer = document.getElementById("js-nav-drawer");
  const panel = document.getElementById("js-collections");
  const container = document.getElementById("CollectionProducts");

  drawer.classList.add("panel-product");
  panel.classList.remove("hide");

  panel.querySelector(".collections-productlist-title").textContent = titleText;

  fetch(`/collections/${handle}?view=ajax-search`)
    .then(res => res.text())
    .then(html => {
      container.innerHTML = html;
    });
}

/* ======================================
   BACK BUTTONS
====================================== */
function initBackButtons() {
  document.getElementById("js-back-to-parent")?.addEventListener("click", () => {
    resetGrandChild();
    resetCollection();
    resetChild();
  });

  document.getElementById("js-back-to-child")?.addEventListener("click", () => {
    resetCollection();
    resetGrandChild();
  });

  document.getElementById("js-back-to-collections")?.addEventListener("click", () => {
    resetCollection();
  });
}

/* ======================================
   RESET HELPERS
====================================== */
function resetAllPanels() {
  resetCollection();
  resetGrandChild();
  resetChild();
}

function resetChild() {
  document.getElementById("js-child-linklist").classList.add("hide");
  document.getElementById("js-nav-drawer").classList.remove("panel-1");
}

function resetGrandChild() {
  document.getElementById("js-grandchild-linklist").classList.add("hide");
  document.getElementById("js-nav-drawer").classList.remove("panel-2");
}

function resetCollection() {
  document.getElementById("js-collections").classList.add("hide");
  document.getElementById("js-nav-drawer").classList.remove("panel-product");
}
