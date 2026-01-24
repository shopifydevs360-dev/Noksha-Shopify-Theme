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
   VISIBILITY HELPERS
====================================== */
function showElement(el) {
  if (!el) return;
  el.classList.remove("element-hide");
  el.classList.add("active");
}

function hideElement(el) {
  if (!el) return;
  el.classList.add("element-hide");
  el.classList.remove("active");
}

/* ======================================
   MOBILE LINK CONTROL
====================================== */
function initMobileLinkControl() {
  if (!isMobileView) return;

  const drawer = document.getElementById("js-nav-drawer");

  drawer.querySelectorAll('[data-level="parent"]').forEach(item => {
    if (item.dataset.hasChildren === "true" || item.dataset.isCollection === "true") {
      disableLink(item);
    }
  });

  drawer.querySelectorAll(".child-menu-item").forEach(item => {
    if (item.dataset.hasChildren === "true" || item.dataset.isCollection === "true") {
      disableLink(item);
    }
  });

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

  drawer.querySelectorAll('[data-level="parent"]').forEach(parent => {
    parent.addEventListener(triggerEvent, e => {
      const hasChildren = parent.dataset.hasChildren === "true";
      const isCollection = parent.dataset.isCollection === "true";

      if (isMobileView && (hasChildren || isCollection)) {
        e.preventDefault();
      }

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
  showElement(panel);

  panel.querySelector(".child-linklist-title").textContent = titleText;

  panel.querySelectorAll(".child-menu-item").forEach(item => {
    item.classList.toggle("element-hide", item.dataset.parent !== parentHandle);
  });
}

/* ======================================
   GRAND CHILD PANEL
====================================== */
function openGrandChildPanel(childHandle, titleText) {
  const drawer = document.getElementById("js-nav-drawer");
  const panel = document.getElementById("js-grandchild-linklist");

  drawer.classList.add("panel-2");
  showElement(panel);

  panel.querySelector(".grandchild-linklist-title").textContent = titleText;

  panel.querySelectorAll(".grandchild-menu-item").forEach(item => {
    item.classList.toggle("element-hide", item.dataset.child !== childHandle);
  });
}

/* ======================================
   COLLECTION PANEL + LOADER
====================================== */
let activeCollectionHandle = null;

function openCollectionPanel(handle, titleText) {
  const drawer = document.getElementById("js-nav-drawer");
  const panel = document.getElementById("js-collections");
  const container = document.getElementById("CollectionProducts");
  const loader = panel.querySelector(".collection-product-loader");

  drawer.classList.add("panel-product");
  showElement(panel);

  panel.querySelector(".collections-productlist-title").textContent = titleText;

  loader.classList.add("active");
  hideElement(container);

  fetch(`/collections/${handle}?view=ajax-search`)
    .then(res => res.text())
    .then(html => {
      activeCollectionHandle = handle;
      container.innerHTML = html;
      loader.classList.remove("active");
      showElement(container);
    })
    .catch(() => {
      loader.classList.remove("active");
    });
}

/* ======================================
   BACK BUTTONS
====================================== */
function initBackButtons() {
  document.getElementById("js-back-to-parent")?.addEventListener("click", () => {
    resetAllPanels();
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
  hideElement(document.getElementById("js-child-linklist"));
  document.getElementById("js-nav-drawer").classList.remove("panel-1");
}

function resetGrandChild() {
  hideElement(document.getElementById("js-grandchild-linklist"));
  document.getElementById("js-nav-drawer").classList.remove("panel-2");
}

function resetCollection() {
  const panel = document.getElementById("js-collections");
  const loader = panel.querySelector(".collection-product-loader");
  const container = document.getElementById("CollectionProducts");

  hideElement(panel);
  loader.classList.remove("active");
  hideElement(container);

  activeCollectionHandle = null;

  document.getElementById("js-nav-drawer").classList.remove("panel-product");
}
