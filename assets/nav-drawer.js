document.addEventListener("DOMContentLoaded", () => {
  initNavDrawer();
  initBackButtons();
});

/* ======================================
   NAV DRAWER MAIN
====================================== */
function initNavDrawer() {
  const drawer = document.getElementById("js-nav-drawer");

  /* ---------- PARENT HOVER ---------- */
  drawer.querySelectorAll('[data-level="parent"]').forEach(parent => {
    parent.addEventListener("mouseenter", () => {
      resetAllPanels();

      const parentHandle = parent.dataset.parentHandle;

      if (parent.dataset.hasChildren === "true") {
        openChildPanel(parentHandle, parent.textContent.trim());
      }

      if (parent.dataset.isCollection === "true") {
        openCollectionPanel(
          parent.dataset.collectionHandle,
          parent.textContent.trim()
        );
      }
    });
  });

  /* ---------- CHILD HOVER ---------- */
  drawer.querySelectorAll(".child-menu-item").forEach(child => {
    child.addEventListener("mouseenter", () => {
      resetGrandChild();
      resetCollection();

      const childHandle = child.dataset.childHandle;

      if (child.dataset.hasChildren === "true") {
        openGrandChildPanel(childHandle, child.textContent.trim());
      }

      if (child.dataset.isCollection === "true") {
        openCollectionPanel(
          child.dataset.collectionHandle,
          child.textContent.trim()
        );
      }
    });
  });

  /* ---------- GRAND CHILD HOVER ---------- */
  drawer.querySelectorAll(".grandchild-menu-item").forEach(gc => {
    gc.addEventListener("mouseenter", () => {
      resetCollection();

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

  drawer.classList.add("panel-product");
  panel.classList.remove("hide");

  panel.querySelector(".collections-productlist-title").textContent = titleText;

  fetch(`/search?view=ajax-search&type=product&q=collection:${handle}`)
    .then(res => res.text())
    .then(html => {
      document.getElementById("CollectionProducts").innerHTML = html;
    });
}

/* ======================================
   BACK BUTTONS
====================================== */
function initBackButtons() {
  document.getElementById("js-back-to-parent")?.addEventListener("click", () => {
    resetChild();
  });

  document.getElementById("js-back-to-child")?.addEventListener("click", () => {
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
  resetChild();
  resetGrandChild();
  resetCollection();
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
