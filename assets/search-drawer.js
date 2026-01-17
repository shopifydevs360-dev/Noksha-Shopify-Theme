document.addEventListener("DOMContentLoaded", () => {
  initSearchDrawerSuggestions();
  initSearchDrawerResults();
});

/* ===============================
   SEARCH DRAWER: SUGGESTIONS
================================ */
function initSearchDrawerSuggestions() {
  const input = document.getElementById("SearchDrawerInput");
  const list = document.getElementById("SearchSuggestionList");

  if (!input || !list) return;

  let keywords = [];

  try {
    keywords = JSON.parse(list.dataset.keywords);
  } catch (e) {
    console.error("Search keywords JSON error", e);
    return;
  }

  function levenshtein(a, b) {
    const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        matrix[i][j] = b[i - 1] === a[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
      }
    }

    return matrix[b.length][a.length];
  }

  function getScore(word, query) {
    const w = word.toLowerCase();
    const q = query.toLowerCase();

    // Highest priority: starts with query
    if (w.startsWith(q)) return 0;

    // Word boundary match (t → t-shirt)
    if (w.split(/[\s-]/).some(part => part.startsWith(q))) return 1;

    // Contains query
    if (w.includes(q)) return 2;

    // Fuzzy match (limit tolerance)
    const distance = levenshtein(q, w);
    if (distance <= 2) return 3 + distance;

    // Too unrelated → exclude
    return null;
  }

  function renderSuggestions(query = "") {
    list.innerHTML = "";

    if (!query) {
      keywords.slice(0, 5).forEach(word => {
        appendItem(word);
      });
      return;
    }

    const results = keywords
      .map(word => {
        const score = getScore(word, query);
        return score !== null ? { word, score } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5);

    results.forEach(item => {
      appendItem(item.word);
    });
  }

  function appendItem(word) {
    list.insertAdjacentHTML(
      "beforeend",
      `<li><a href="/search?q=${encodeURIComponent(word)}">${word}</a></li>`
    );
  }

  // Initial render
  renderSuggestions();

  // On typing
  input.addEventListener("input", e => {
    renderSuggestions(e.target.value.trim());
  });
}


/* ===============================
   SEARCH DRAWER: RESULTS FILTER
================================ */
function initSearchDrawerResults() {
  const input = document.getElementById("SearchDrawerInput");
  const resultsWrapper = document.querySelector(".serch-results");

  if (!input || !resultsWrapper) return;

  const productItems = document.querySelectorAll(".search-product-item");
  const pageItems = document.querySelectorAll(".search-page-item");
  const postItems = document.querySelectorAll(".search-post-item");

  // Hide results by default
  resultsWrapper.style.display = "none";

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();

    if (!query) {
      resultsWrapper.style.display = "none";
      hideAll(productItems);
      hideAll(pageItems);
      hideAll(postItems);
      return;
    }

    resultsWrapper.style.display = "block";

    filterGroup(productItems, query);
    filterGroup(pageItems, query);
    filterGroup(postItems, query);
  });
}

/* ===============================
   FILTER GROUP
================================ */
function filterGroup(items, query) {
  if (!items.length) return;

  let hasVisible = false;

  items.forEach(item => {
    const searchableText = Object.values(item.dataset)
      .join(" ")
      .toLowerCase();

    if (searchableText.includes(query)) {
      item.style.display = "";
      hasVisible = true;
    } else {
      item.style.display = "none";
    }
  });

  // Hide/show section wrapper
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

