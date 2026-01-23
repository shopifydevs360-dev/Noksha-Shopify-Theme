document.addEventListener("DOMContentLoaded", () => {
  initNavDrawer();
  initBackButtons();
  initMobileLinkControl(); // ✅ NEW
});

/* ======================================
   DEVICE DETECTION
====================================== */
const isMobile = window.matchMedia("(hover: none)").matches;

/* ======================================
   MOBILE LINK CONTROL (NEW)
====================================== */
function initMobileLinkControl() {
  if (!isMobile) return;

  const drawer = document.getElementById("js-nav-drawer");

  // Parent items
  drawer.querySelectorAll('[data-level="parent"]').forEach(item => {
    if (
      item.dataset.hasChildren === "true" ||
      item.dataset.isCollection === "true"
    ) {
      disableLink(item);
    }
  });

  // Child items
  drawer.querySelectorAll(".child-menu-item").forEach(item => {
    if (
      item.dataset.hasChildren === "true" ||
      item.dataset.isCollection === "true"
    ) {
      disableLink(item);
    }
  });

  // Grandchild items (collection only)
  drawer.querySelectorAll(".grandchild-menu-item").forEach(item => {
    if (item.dataset.isCollection === "true") {
      disableLink(item);
    }
  });
}

function disableLink(item) {
  const link = item.querySelector("a");
  if (!link) return;

  link.dataset.href = link.getAttribute("href"); // keep for later if needed
  link.removeAttribute("href");

  link.addEventListener("click", e => {
    e.preventDefault();
  });
}

/* ======================================
   NAV DRAWER MAIN
====================================== */
function initNavDrawer() {
  const drawer = document.getElementById("js-nav-drawer");

  /* ---------- PARENT ---------- */
  drawer.querySelectorAll('[data-level="parent"]').forEach(parent => {
    parent.addEventListener(isMobile ? "click" : "mouseenter", e => {
      if (isMobile) e.preventDefault();

      resetAllPanels();

      if (parent.dataset.hasChildren === "true") {
        openChildPanel(parent.dataset.parentHandle, parent.textContent.trim());
      }

      if (parent.dataset.isCollection === "true") {
        openCollectionPanel(
          parent.dataset.collectionHandle,
          parent.textContent.trim()
        );
      }
    });
  });

  /* ---------- CHILD ---------- */
  drawer.querySelectorAll(".child-menu-item").forEach(child => {
    child.addEventListener(isMobile ? "click" : "mouseenter", e => {
      if (isMobile) e.preventDefault();

      resetGrandChild();
      resetCollection();

      if (child.dataset.hasChildren === "true") {
        openGrandChildPanel(
          child.dataset.childHandle,
          child.textContent.trim()
        );
      }

      if (child.dataset.isCollection === "true") {
        openCollectionPanel(
          child.dataset.collectionHandle,
          child.textContent.trim()
        );
      }
    });
  });

  /* ---------- GRAND CHILD ---------- */
  drawer.querySelectorAll(".grandchild-menu-item").forEach(gc => {
    gc.addEventListener(isMobile ? "click" : "mouseenter", e => {
      if (isMobile) e.preventDefault();

      if (gc.dataset.isCollection === "true") {
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
