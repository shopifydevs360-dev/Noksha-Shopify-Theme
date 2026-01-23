document.addEventListener("DOMContentLoaded", () => {
  initNavDrawer();
  initBackButtons();
  initMobileLinkControl();
});

/* ======================================
   BREAKPOINT DETECTION (dynamic)
====================================== */
function isMobile() {
  return window.matchMedia("(max-width: 991px)").matches;
}

/* ======================================
   MOBILE LINK CONTROL
====================================== */
function initMobileLinkControl() {
  if (!isMobile()) return;

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
   GLOBAL STATE (prevents jumping + double triggers)
====================================== */
let activeCollectionHandle = null;
let activeParentHandle = null;
let activeChildHandle = null;

let currentFetchRequestId = 0;

/* ======================================
   NAV DRAWER MAIN
====================================== */
function initNavDrawer() {
  const drawer = document.getElementById("js-nav-drawer");
  if (!drawer) return;

  const triggerEvent = isMobile() ? "click" : "mouseenter";

  /* ---------- PARENT ---------- */
  drawer.querySelectorAll('[data-level="parent"]').forEach(parent => {
    parent.addEventListener(triggerEvent, e => {
      const hasChildren = parent.dataset.hasChildren === "true";
      const isCollection = parent.dataset.isCollection === "true";

      if (isMobile() && (hasChildren || isCollection)) {
        e.preventDefault();
      }

      const parentHandle = parent.dataset.parentHandle;
      const title = parent.textContent.trim();

      // ✅ Prevent layout jumping from re-triggering same hover repeatedly
      if (!isMobile() && activeParentHandle === parentHandle && !isCollection) {
        return;
      }

      drawer.classList.add("is-switching");
      setTimeout(() => drawer.classList.remove("is-switching"), 80);

      resetAllPanels();

      activeParentHandle = parentHandle;
      activeChildHandle = null;

      if (hasChildren) {
        openChildPanel(parentHandle, title);
      }

      if (isCollection) {
        openCollectionPanel(parent.dataset.collectionHandle, title);
      }
    });
  });

  /* ---------- CHILD ---------- */
  drawer.querySelectorAll(".child-menu-item").forEach(child => {
    child.addEventListener(triggerEvent, e => {
      const hasChildren = child.dataset.hasChildren === "true";
      const isCollection = child.dataset.isCollection === "true";

      if (isMobile() && (hasChildren || isCollection)) {
        e.preventDefault();
      }

      const childHandle = child.dataset.childHandle;
      const title = child.textContent.trim();

      // ✅ Prevent re-open same child panel on hover
      if (!isMobile() && activeChildHandle === childHandle && !isCollection) {
        return;
      }

      drawer.classList.add("is-switching");
      setTimeout(() => drawer.classList.remove("is-switching"), 80);

      resetGrandChild();
      resetCollection();

      activeChildHandle = childHandle;

      if (hasChildren) {
        openGrandChildPanel(childHandle, title);
      }

      if (isCollection) {
        openCollectionPanel(child.dataset.collectionHandle, title);
      }
    });
  });

  /* ---------- GRAND CHILD ---------- */
  drawer.querySelectorAll(".grandchild-menu-item").forEach(gc => {
    gc.addEventListener(triggerEvent, e => {
      const isCollection = gc.dataset.isCollection === "true";

      if (isMobile() && isCollection) {
        e.preventDefault();
      }

      if (isCollection) {
        const title = gc.textContent.trim();
        openCollectionPanel(gc.dataset.collectionHandle, title);
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
  if (!drawer || !panel) return;

  drawer.classList.add("panel-1");
  panel.classList.remove("element-hide");

  const titleEl = panel.querySelector(".child-linklist-title");
  if (titleEl) titleEl.textContent = titleText;

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
  if (!drawer || !panel) return;

  drawer.classList.add("panel-2");
  panel.classList.remove("element-hide");

  const titleEl = panel.querySelector(".grandchild-linklist-title");
  if (titleEl) titleEl.textContent = titleText;

  panel.querySelectorAll(".grandchild-menu-item").forEach(item => {
    item.classList.toggle("element-hide", item.dataset.child !== childHandle);
  });
}

/* ======================================
   COLLECTION PANEL + LOADER ✅ FIXED
====================================== */
function openCollectionPanel(handle, titleText) {
  if (!handle) return;

  const drawer = document.getElementById("js-nav-drawer");
  const panel = document.getElementById("js-collections");
  const container = document.getElementById("CollectionProducts");

  if (!drawer || !panel || !container) return;

  const loader = panel.querySelector(".collection-product-loader");

  drawer.classList.add("panel-product");
  panel.classList.remove("element-hide");

  const titleEl = panel.querySelector(".collections-productlist-title");
  if (titleEl) titleEl.textContent = titleText;

  // ✅ If same collection already opened, don’t refetch
  if (activeCollectionHandle === handle && container.innerHTML.trim() !== "") {
    if (loader) loader.classList.remove("active");
    container.classList.remove("element-hide");
    return;
  }

  activeCollectionHandle = handle;

  // ✅ Reset UI for loader
  if (loader) loader.classList.add("active");
  container.classList.add("element-hide");
  container.innerHTML = ""; // optional (prevents old products flash)

  // ✅ requestId prevents old fetch from overriding
  const requestId = ++currentFetchRequestId;

  fetch(`/collections/${handle}?view=ajax-search`)
    .then(res => res.text())
    .then(html => {
      // ✅ Ignore old responses
      if (requestId !== currentFetchRequestId) return;

      container.innerHTML = html;

      if (loader) loader.classList.remove("active");
      container.classList.remove("element-hide");
    })
    .catch(() => {
      if (requestId !== currentFetchRequestId) return;

      if (loader) loader.classList.remove("active");
      container.classList.remove("element-hide");
      container.innerHTML = `<p style="padding:10px;">Failed to load products.</p>`;
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
   RESET HELPERS ✅ IMPROVED
====================================== */
function resetAllPanels() {
  resetCollection();
  resetGrandChild();
  resetChild();
}

function resetChild() {
  const childPanel = document.getElementById("js-child-linklist");
  const drawer = document.getElementById("js-nav-drawer");

  if (childPanel) childPanel.classList.add("element-hide");
  if (drawer) drawer.classList.remove("panel-1");
}

function resetGrandChild() {
  const gcPanel = document.getElementById("js-grandchild-linklist");
  const drawer = document.getElementById("js-nav-drawer");

  if (gcPanel) gcPanel.classList.add("element-hide");
  if (drawer) drawer.classList.remove("panel-2");
}

function resetCollection() {
  const panel = document.getElementById("js-collections");
  const drawer = document.getElementById("js-nav-drawer");
  const container = document.getElementById("CollectionProducts");

  if (!panel || !drawer || !container) return;

  const loader = panel.querySelector(".collection-product-loader");

  panel.classList.add("element-hide");

  if (loader) loader.classList.remove("active");

  container.classList.add("element-hide");
  container.innerHTML = "";

  // ✅ reset handle
  activeCollectionHandle = null;

  drawer.classList.remove("panel-product");

  // ✅ cancel any old fetch responses
  currentFetchRequestId++;
}
