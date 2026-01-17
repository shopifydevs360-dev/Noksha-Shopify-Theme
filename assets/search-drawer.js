document.addEventListener("DOMContentLoaded", () => {
  initSearchDrawerCore();
});

/* ===============================
   SEARCH DRAWER: CORE CONTROLLER
================================ */
function initSearchDrawerCore() {
  const input = document.getElementById("SearchDrawerInput");
  const resultsWrapper = document.querySelector(".serch-results");

  if (!input || !resultsWrapper) return;

  const suggestionAPI = initSearchDrawerSuggestions(input);
  const productAPI = initSearchDrawerProducts();
  const pageAPI = initSearchDrawerPages();
  const postAPI = initSearchDrawerPosts();

  // Initial state
  resultsWrapper.style.display = "none";
  suggestionAPI.showDefault();

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();

    if (!query) {
      resultsWrapper.style.display = "none";
      suggestionAPI.showDefault();
      productAPI.reset();
      pageAPI.reset();
      postAPI.reset();
      return;
    }

    suggestionAPI.hide();
    resultsWrapper.style.display = "block";

    productAPI.filter(query);
    pageAPI.filter(query);
    postAPI.filter(query);
  });
}

/* ===============================
   SUGGESTED SEARCHES
================================ */
function initSearchDrawerSuggestions(input) {
  const wrapper = document.querySelector(".search-suggestions");
  const list = document.getElementById("SearchSuggestionList");
  if (!wrapper || !list) return {};

  let keywords = [];

  try {
    keywords = JSON.parse(list.dataset.keywords);
  } catch (e) {
    console.error("Keyword JSON error", e);
  }

  function showDefault() {
    wrapper.style.display = "";
    render("");
  }

  function hide() {
    wrapper.style.display = "none";
  }

  function render(query) {
    list.innerHTML = "";

    const results = query
      ? getScoredKeywords(query).slice(0, 5)
      : keywords.slice(0, 5).map(word => ({ word }));

    results.forEach(item => {
      list.insertAdjacentHTML(
        "beforeend",
        `<li><a href="/search?q=${encodeURIComponent(item.word)}">${item.word}</a></li>`
      );
    });
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

  return { showDefault, hide };

  /* ---- matching helpers ---- */
  function getScore(word, query) {
    const w = word.toLowerCase();
    if (w.startsWith(query)) return 0;
    if (w.includes(query)) return 1;
    const d = levenshtein(query, w);
    return d <= 2 ? 2 + d : null;
  }

  function levenshtein(a, b) {
    const m = Array.from({ length: b.length + 1 }, (_, i) => [i]);
    for (let j = 0; j <= a.length; j++) m[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        m[i][j] =
          b[i - 1] === a[j - 1]
            ? m[i - 1][j - 1]
            : Math.min(m[i - 1][j - 1] + 1, m[i][j - 1] + 1, m[i - 1][j] + 1);
      }
    }
    return m[b.length][a.length];
  }
}

/* ===============================
   PRODUCTS FILTER
================================ */
function initSearchDrawerProducts() {
  const items = document.querySelectorAll(".search-product-item");
  return createFilterAPI(items);
}

/* ===============================
   PAGES FILTER
================================ */
function initSearchDrawerPages() {
  const items = document.querySelectorAll(".search-page-item");
  return createFilterAPI(items);
}

/* ===============================
   POSTS FILTER
================================ */
function initSearchDrawerPosts() {
  const items = document.querySelectorAll(".search-post-item");
  return createFilterAPI(items);
}

/* ===============================
   SHARED FILTER ENGINE
================================ */
function createFilterAPI(items) {
  if (!items.length) {
    return { filter() {}, reset() {} };
  }

  const section = items[0].closest(
    ".products-results, .pages-results, .posts-results"
  );

  function filter(query) {
    let visible = false;

    items.forEach(item => {
      const text = Object.values(item.dataset).join(" ").toLowerCase();
      const match = text.includes(query);
      item.style.display = match ? "" : "none";
      if (match) visible = true;
    });

    if (section) section.style.display = visible ? "" : "none";
  }

  function reset() {
    items.forEach(item => (item.style.display = "none"));
    if (section) section.style.display = "none";
  }

  return { filter, reset };
}
