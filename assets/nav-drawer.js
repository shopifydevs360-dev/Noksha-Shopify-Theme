document.addEventListener("DOMContentLoaded", () => {
  initNavDrawer();
  initBackButtons();
});

/* ======================================
   MAIN NAV DRAWER
====================================== */
function initNavDrawer() {
  const drawer = document.getElementById("js-nav-drawer");
  const parentItems = drawer.querySelectorAll('[data-level="parent"]');

  parentItems.forEach(item => {
    item.addEventListener("mouseenter", () => {
      resetPanels();

      const hasChildren = item.dataset.hasChildren === "true";
      const isCollection = item.dataset.isCollection === "true";

      if (hasChildren) {
        openChildPanel(item);
      }

      if (isCollection) {
        openCollectionPanel(item.dataset.collectionHandle, item.textContent.trim());
      }
    });
  });
}

/* ======================================
   CHILD PANEL
====================================== */
function openChildPanel(parentItem) {
  const drawer = document.getElementById("js-nav-drawer");
  const panel = document.getElementById("js-child-linklist");
  const title = panel.querySelector(".child-linklist-title");
  const list = panel.querySelector(".child-menu");

  drawer.classList.add("panel-1");
  panel.classList.remove("hide");

  title.textContent = parentItem.textContent.trim();
  list.innerHTML = "";

  const links = parentItem.querySelectorAll(":scope > ul > li");

  links.forEach(link => {
    const li = document.createElement("li");
    li.className = "child-item";
    li.textContent = link.textContent.trim();

    li.dataset.hasChildren = link.querySelector("ul") ? "true" : "false";
    li.dataset.isCollection = link.dataset.isCollection || "false";
    li.dataset.collectionHandle = link.dataset.collectionHandle || "";

    li.addEventListener("mouseenter", () => {
      resetGrandChild();
      resetCollection();

      if (li.dataset.hasChildren === "true") {
        openGrandChildPanel(li);
      }

      if (li.dataset.isCollection === "true") {
        openCollectionPanel(li.dataset.collectionHandle, li.textContent.trim());
      }
    });

    list.appendChild(li);
  });
}

/* ======================================
   GRAND CHILD PANEL
====================================== */
function openGrandChildPanel(childItem) {
  const drawer = document.getElementById("js-nav-drawer");
  const panel = document.getElementById("js-grandchild-linklist");

  drawer.classList.add("panel-2");
  panel.classList.remove("hide");

  panel.querySelector(".grandchild-linklist-title").textContent =
    childItem.textContent.trim();
}

/* ======================================
   COLLECTION PRODUCTS
====================================== */
function openCollectionPanel(handle, titleText) {
  const drawer = document.getElementById("js-nav-drawer");
  const panel = document.getElementById("js-collections");
  const title = panel.querySelector(".collections-productlist-title");
  const container = document.getElementById("CollectionProducts");

  drawer.classList.add("panel-product");
  panel.classList.remove("hide");
  title.textContent = titleText;

  fetch(
    `/search?view=ajax-search&type=product&q=collection:${handle}`
  )
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
function resetPanels() {
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
