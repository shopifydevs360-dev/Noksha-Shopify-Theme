document.addEventListener("DOMContentLoaded", () => {
  initSearchActiveState();
  initSearchDrawerSuggestions();
  initSearchDrawerAjaxProducts();
  initSearchDrawerAjaxPagesPosts();
});
/* ===============================
   SEARCH ACTIVE STATE
================================ */
function initSearchActiveState() {
  const input = document.getElementById("SearchDrawerInput");
  const searchSection = document.querySelector(".shopify-section-search .inner-section");

  if (!input || !searchSection) return;

  input.addEventListener("input", (e) => {
    const hasValue = e.target.value.trim().length > 0;
    searchSection.classList.toggle("search-active", hasValue);
  });
}

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
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        matrix[i][j] =
          b[i - 1] === a[j - 1]
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

    if (w.startsWith(q)) return 0;
    if (w.split(/[\s-]/).some(p => p.startsWith(q))) return 1;
    if (w.includes(q)) return 2;

    const distance = levenshtein(q, w);
    if (distance <= 2) return 3 + distance;

    return null;
  }

  function renderSuggestions(query = "") {
    list.innerHTML = "";

    // Default suggestions
    const defaultWords = keywords.slice(0, 5);

    // If input is empty → show default
    if (!query) {
      defaultWords.forEach(appendItem);
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

    // 🔥 No matches → fallback to default
    if (!results.length) {
      defaultWords.forEach(appendItem);
      return;
    }

    // Matches found
    results.forEach(item => appendItem(item.word));
  }


  function appendItem(word) {
    list.insertAdjacentHTML(
      "beforeend",
      `<li><a href="/search?q=${encodeURIComponent(word)}">${word}</a></li>`
    );
  }

  renderSuggestions();

  input.addEventListener("input", e => {
    renderSuggestions(e.target.value.trim());
  });
}

/* ===============================
   SEARCH DRAWER: AJAX PRODUCTS
   (Liquid-rendered, cart-style)
================================ */
function initSearchDrawerAjaxProducts() {
  const input = document.getElementById("SearchDrawerInput");
  const resultsWrap = document.getElementById("SearchProducts");
  const noResults = document.getElementById("SearchNoResults");

  if (!input || !resultsWrap) return;

  let debounceTimer;
  let controller;

  input.addEventListener("input", e => {
    const query = e.target.value.trim();
    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
      if (!query) {
        resultsWrap.innerHTML = "";
        noResults?.classList.add("hide");
        return;
      }

      fetchSearchHTML(query);
    }, 300);
  });

  function fetchSearchHTML(query) {
    if (controller) controller.abort();
    controller = new AbortController();

    fetch(`/search?view=ajax-search&q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    })
      .then(res => res.text())
      .then(html => {
        if (!html || !html.trim()) {
          resultsWrap.innerHTML = "";
          noResults?.classList.remove("hide");
          return;
        }

        resultsWrap.innerHTML = html;
        noResults?.classList.add("hide");
      })
      .catch(err => {
        if (err.name !== "AbortError") {
          console.error("Search AJAX error:", err);
        }
      });
  }
}

/* ===============================
   SEARCH DRAWER: AJAX PAGES & POSTS
   (JSON-based, no template needed)
================================ */
function initSearchDrawerAjaxPagesPosts() {
  const input = document.getElementById("SearchDrawerInput");
  const pagesWrap = document.getElementById("SearchPages");
  const postsWrap = document.getElementById("SearchPosts");

  if (!input || !pagesWrap || !postsWrap) return;

  let debounceTimer;
  let controller;

  input.addEventListener("input", e => {
    const query = e.target.value.trim();
    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
      if (!query) {
        pagesWrap.innerHTML = "";
        postsWrap.innerHTML = "";
        return;
      }

      fetchPagesAndPosts(query);
    }, 300);
  });

  function fetchPagesAndPosts(query) {
    if (controller) controller.abort();
    controller = new AbortController();

    fetch(
      `/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=page,article&resources[limit]=5`,
      { signal: controller.signal }
    )
      .then(res => res.json())
      .then(data => {
        renderPages(data.resources.results.pages || []);
        renderPosts(data.resources.results.articles || []);
      })
      .catch(err => {
        if (err.name !== "AbortError") {
          console.error("Page/Post search error:", err);
        }
      });
  }

  function renderPages(pages) {
    pagesWrap.innerHTML = "";

    pages.forEach(page => {
      pagesWrap.insertAdjacentHTML(
        "beforeend",
        `<li><a href="${page.url}">${page.title}</a></li>`
      );
    });
  }

  function renderPosts(posts) {
    postsWrap.innerHTML = "";

    posts.forEach(post => {
      postsWrap.insertAdjacentHTML(
        "beforeend",
        `<li><a href="${post.url}">${post.title}</a></li>`
      );
    });
  }
}