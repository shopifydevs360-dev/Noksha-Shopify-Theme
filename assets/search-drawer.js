document.addEventListener("DOMContentLoaded", () => {
  initSearchDrawer();
});

/* ===============================
   SEARCH DRAWER: CORE
================================ */
function initSearchDrawer() {
  const input = document.getElementById("SearchDrawerInput");
  const suggestionList = document.getElementById("SearchSuggestionList");
  const resultsWrapper = document.querySelector(".serch-results");

  if (!input || !suggestionList || !resultsWrapper) return;

  const productItems = document.querySelectorAll(".search-product-item");
  const pageItems = document.querySelectorAll(".search-page-item");
  const postItems = document.querySelectorAll(".search-post-item");

  let keywords = [];

  try {
    keywords = JSON.parse(suggestionList.dataset.keywords);
  } catch (e) {
    console.error("Search keywords JSON error", e);
  }

  // Initial state
  resultsWrapper.style.display = "none";
  renderSuggestions("");

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();

    if (!query) {
      // Empty input → show suggestions, hide results
      resultsWrapper.style.display = "none";
      showSuggestions();
      renderSuggestions("");
      hideAll(productItems);
      hideAll(pageItems);
      hideAll(postItems);
      return;
    }

    // Typing → hide suggestions, show results
    hideSuggestions();
    resultsWrapper.style.display = "block";

    filterGroup(productItems, query);
    filterGroup(pageItems, query);
    filterGroup(postItems, query);
  });

  /* ===============================
     SUGGESTIONS
  ================================ */
  function renderSuggestions(query) {
    suggestionList.innerHTML = "";

    const results = query
      ? getScoredKeywords(query).slice(0, 5)
      : keywords.slice(0, 5).map(word => ({ word }));

    results.forEach(item => {
      suggestionList.insertAdjacentHTML(
        "beforeend",
        `<li><a href="/search?q=${encodeURIComponent(item.word)}">${item.word}</a></li>`
      );
    });
  }

  function showSuggestions() {
    suggestionList.closest(".search-suggestions").style.display = "";
  }

  function hideSuggestions() {
    suggestionList.closest(".search-suggestions").style.display = "none";
  }

  function getScoredKeywords(query) {
    return keywords
      .map(word => {
        const score = getScore(word, query);
        return score !== null ? { word, score } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.score - b.score);
  }

  /* ===============================
     FUZZY MATCHING
  ================================ */
  function getScore(word, query) {
    const w = word.toLowerCase();
    const q = query.toLowerCase();

    if (w.startsWith(q)) return 0;
    if (w.split(/[\s-]/).some(p => p.startsWith(q))) return 1;
    if (w.includes(q)) return 2;

    const d = levenshtein(q, w);
    if (d <= 2) return 3 + d;

    return null;
  }

  function levenshtein(a, b) {
    const m = Array.from({ length: b.length + 1 }, (_, i) => [i]);
    for (let j = 0; j <= a.length; j++) m[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        m[i][j] = b[i - 1] === a[j - 1]
          ? m[i - 1][j - 1]
          : Math.min(m[i - 1][j - 1] + 1, m[i][j - 1] + 1, m[i - 1][j] + 1);
      }
    }
    return m[b.length][a.length];
  }
}

/* ===============================
   RESULTS FILTERING
================================ */
function filterGroup(items, query) {
  if (!items.length) return;

  let hasVisible = false;

  items.forEach(item => {
    const searchable = Object.values(item.dataset).join(" ").toLowerCase();

    if (searchable.includes(query)) {
      item.style.display = "";
      hasVisible = true;
    } else {
      item.style.display = "none";
    }
  });

  const section = items[0].closest(".products-results, .pages-results, .posts-results");
  if (section) {
    section.style.display = hasVisible ? "" : "none";
  }
}

/* ===============================
   HELPERS
================================ */
function hideAll(items) {
  items.forEach(item => {
    item.style.display = "none";
  });

  const section = items[0]?.closest(".products-results, .pages-results, .posts-results");
  if (section) {
    section.style.display = "none";
  }
}
