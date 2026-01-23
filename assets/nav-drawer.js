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
  if (!drawer) return;

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
  if (!drawer) return;

  const triggerEvent = isMobileView ? "click" : "mouseenter";

  /* ---------- PARENT ---------- */
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
  const panel = document.getElementById("js-child-linklist");
  if (!panel) return;

  panel.classList.add("active");

  panel.querySelector(".child-linklist-title").textContent = titleText;

  panel.querySelectorAll(".child-menu-item").forEach(item => {
    item.classList.toggle("element-hide", item.dataset.parent !== parentHandle);
  });
}

/* ======================================
   GRAND CHILD PANEL
====================================== */
function openGrandChildPanel(childHandle, titleText) {
  const panel = document.getElementById("js-grandchild-linklist");
  if (!panel) return;

  panel.classList.add("active");

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
  const panel = document.getElementById("js-collections");
  const container = document.getElementById("CollectionProducts");
  const loader = panel.querySelector(".collection-product-loader");

  panel.classList.add("active");

  panel.querySelector(".collections-productlist-title").textContent = titleText;

  loader.classList.add("active");
  container.classList.add("element-hide");

  fetch(`/collections/${handle}?view=ajax-search`)
    .then(res => res.text())
    .then(html => {
      activeCollectionHandle = handle;
      container.innerHTML = html;
      loader.classList.remove("active");
      container.classList.remove("element-hide");
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
  document.getElementById("js-child-linklist")?.classList.remove("active");
}

function resetGrandChild() {
  document.getElementById("js-grandchild-linklist")?.classList.remove("active");
}

function resetCollection() {
  const panel = document.getElementById("js-collections");
  if (!panel) return;

  const loader = panel.querySelector(".collection-product-loader");
  const container = document.getElementById("CollectionProducts");

  panel.classList.remove("active");
  loader.classList.remove("active");
  container.classList.add("element-hide");

  activeCollectionHandle = null;
}
