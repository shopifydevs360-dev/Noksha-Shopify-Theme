document.addEventListener("DOMContentLoaded", () => {
  initNavDrawer();
  initBackButtons();
  initTouchLinkControl();
});

/* ======================================
   DEVICE DETECTION (MOBILE + TABLET)
====================================== */
const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

/* ======================================
   DISABLE LINKS ON TOUCH DEVICES
====================================== */
function initTouchLinkControl() {
  if (!isTouchDevice) return;

  const drawer = document.getElementById("js-nav-drawer");

  // Parent
  drawer.querySelectorAll('[data-level="parent"]').forEach(item => {
    if (
      item.dataset.hasChildren === "true" ||
      item.dataset.isCollection === "true"
    ) {
      disableLink(item);
    }
  });

  // Child
  drawer.querySelectorAll(".child-menu-item").forEach(item => {
    if (
      item.dataset.hasChildren === "true" ||
      item.dataset.isCollection === "true"
    ) {
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

  link.dataset.href = link.getAttribute("href");
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
  const parentEvent = isTouchDevice ? "click" : "mouseenter";

  /* ---------- PARENT ---------- */
  drawer.querySelectorAll('[data-level="parent"]').forEach(parent => {
    parent.addEventListener(parentEvent, e => {
      if (isTouchDevice) e.preventDefault();

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
    child.addEventListener(parentEvent, e => {
      if (isTouchDevice) e.preventDefault();

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
    gc.addEventListener(parentEvent, e => {
      if (isTouchDevice) e.preventDefault();

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
    resetCollection();
    resetGrandChild();
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
