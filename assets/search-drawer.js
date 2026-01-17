document.addEventListener("DOMContentLoaded", () => {
  initSearchDrawer();
});

/* ===============================
   SEARCH DRAWER: CORE
================================ */
function initSearchDrawer() {
  const input = document.getElementById("SearchDrawerInput");
  const resultsWrapper = document.getElementById("SearchResults");
  const suggestionList = document.getElementById("SearchSuggestionList");

  if (!input || !resultsWrapper) return;

  let isLoaded = false;

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();

    if (!query) {
      resultsWrapper.style.display = "none";
      showSuggestions();
      return;
    }

    hideSuggestions();
    resultsWrapper.style.display = "block";

    if (!isLoaded) {
      loadSearchResults(() => {
        filterAll(query);
        isLoaded = true;
      });
    } else {
      filterAll(query);
    }
  });

  function showSuggestions() {
    document.querySelector(".search-suggestions")?.style.removeProperty("display");
  }

  function hideSuggestions() {
    document.querySelector(".search-suggestions")?.style.setProperty("display", "none");
  }
}

/* ===============================
   LOAD SEARCH HTML (ONCE)
================================ */
function loadSearchResults(callback) {
  fetch("/search?view=drawer")
    .then(res => res.text())
    .then(html => {
      const temp = document.createElement("div");
      temp.innerHTML = html;

      const results = document.getElementById("SearchResults");
      results.innerHTML += temp.innerHTML;

      callback && callback();
    });
}

/* ===============================
   FILTER ALL SECTIONS
================================ */
function filterAll(query) {
  filterGroup(".search-product-item", query);
  filterGroup(".search-page-item", query);
  filterGroup(".search-post-item", query);
}

/* ===============================
   FILTER GROUP
================================ */
function filterGroup(selector, query) {
  const items = document.querySelectorAll(selector);
  if (!items.length) return;

  let visible = false;

  items.forEach(item => {
    const text = Object.values(item.dataset).join(" ").toLowerCase();
    const match = text.includes(query);
    item.style.display = match ? "" : "none";
    if (match) visible = true;
  });

  const section = items[0].closest(".products-results, .pages-results, .posts-results");
  if (section) {
    section.style.display = visible ? "" : "none";
  }
}
