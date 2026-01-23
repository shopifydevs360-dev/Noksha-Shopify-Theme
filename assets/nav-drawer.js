document.addEventListener("DOMContentLoaded", () => {
  initNavDrawer();
  initBackButtons();
  initMobileLinkControl();
});

/* ======================================
   BREAKPOINT
====================================== */
const isMobileView = window.matchMedia("(max-width: 991px)").matches;

/* ======================================
   MOBILE LINK CONTROL
====================================== */
function initMobileLinkControl() {
  if (!isMobileView) return;

  const drawer = document.getElementById("js-nav-drawer");

  drawer.querySelectorAll('[data-level="parent"], .child-menu-item, .grandchild-menu-item')
    .forEach(item => {
      if (
        item.dataset.hasChildren === "true" ||
        item.dataset.isCollection === "true"
      ) {
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
   NAV DRAWER
====================================== */
function initNavDrawer() {
  const drawer = document.getElementById("js-nav-drawer");
  const eventType = isMobileView ? "click" : "mouseenter";

  /* ---------- PARENT ---------- */
  drawer.querySelectorAll('[data-level="parent"]').forEach(parent => {
    parent.addEventListener(eventType, e => {
      const hasChildren = parent.dataset.hasChildren === "true";
      const isCollection = parent.dataset.isCollection === "true";

      if (isMobileView && (hasChildren || isCollection)) {
        e.preventDefault();
      }

      /* ❌ CLOSE EVERYTHING ONLY IF DEAD-END */
      if (!hasChildren && !isCollection) {
        resetAllPanels();
        return;
      }

      /* ✅ KEEP COLLECTION OPEN IF SAME FLOW */
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
    child.addEventListener(eventType, e => {
      const hasChildren = child.dataset.hasChildren === "true";
      const isCollection = child.dataset.isCollection === "true";

      if (isMobileView && (hasChildren || isCollection)) {
        e.preventDefault();
      }

      if (!hasChildren && !isCollection) {
        resetGrandChild();
        resetCollection();
        return;
      }

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
    gc.addEventListener(eventType, e => {
      const isCollection = gc.dataset.isCollection === "true";

      if (isMobileView && isCollection) {
        e.preventDefault();
      }

      if (!isCollection) {
        resetCollection();
        return;
      }

      openCollectionPanel(
        gc.dataset.collectionHandle,
        gc.textContent.trim()
      );
    });
  });
}

/* ======================================
   CHILD PANEL
====================================== */
function openChildPanel(parentHandle, title) {
  const panel = document.getElementById("js-child-linklist");

  panel.classList.remove("element-hide");
  panel.querySelector(".child-linklist-title").textContent = title;

  panel.querySelectorAll(".child-menu-item").forEach(item => {
    item.classList.toggle("element-hide", item.dataset.parent !== parentHandle);
  });

  /* 🔑 IMPORTANT */
  resetGrandChild();
}

/* ======================================
   GRAND CHILD PANEL
====================================== */
function openGrandChildPanel(childHandle, title) {
  const panel = document.getElementById("js-grandchild-linklist");

  panel.classList.remove("element-hide");
  panel.querySelector(".grandchild-linklist-title").textContent = title;

  panel.querySelectorAll(".grandchild-menu-item").forEach(item => {
    item.classList.toggle("element-hide", item.dataset.child !== childHandle);
  });
}

/* ======================================
   COLLECTION PANEL
====================================== */
let activeCollection = null;

function openCollectionPanel(handle, title) {
  if (activeCollection === handle) return;

  activeCollection = handle;

  const panel = document.getElementById("js-collections");
  const container = document.getElementById("CollectionProducts");
  const loader = panel.querySelector(".collection-product-loader");

  panel.classList.remove("element-hide");
  panel.querySelector(".collections-productlist-title").textContent = title;

  loader.classList.add("active");
  container.classList.add("element-hide");

  fetch(`/collections/${handle}?view=ajax-search`)
    .then(r => r.text())
    .then(html => {
      container.innerHTML = html;
      loader.classList.remove("active");
      container.classList.remove("element-hide");
    })
    .catch(() => loader.classList.remove("active"));
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
  document.getElementById("js-child-linklist").classList.add("element-hide");
}

function resetGrandChild() {
  document.getElementById("js-grandchild-linklist").classList.add("element-hide");
}

function resetCollection() {
  document.getElementById("js-collections").classList.add("element-hide");
  activeCollection = null;
}
