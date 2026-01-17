document.addEventListener("DOMContentLoaded", () => {
  initSearchDrawerSuggestions();
  initPredictiveSearch();
  initSearchSubmit();
});

/* ===============================
   SEARCH DRAWER: SUGGESTED KEYWORDS
================================ */
function initSearchDrawerSuggestions() {
  const input = document.getElementById("SearchDrawerInput");
  const wrapper = document.querySelector(".search-suggestions");
  const list = document.getElementById("SearchSuggestionList");

  if (!input || !wrapper || !list) return;

  let keywords = [];

  try {
    keywords = JSON.parse(list.dataset.keywords);
  } catch (e) {
    console.error("Search keywords JSON error", e);
    return;
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

  function getScore(word, query) {
    const w = word.toLowerCase();
    const q = query.toLowerCase();
    if (w.startsWith(q)) return 0;
    if (w.includes(q)) return 1;
    const d = levenshtein(q, w);
    return d <= 2 ? 2 + d : null;
  }

  function render(query = "") {
    list.innerHTML = "";

    const results = query
      ? keywords
          .map(w => {
            const s = getScore(w, query);
            return s !== null ? { word: w, score: s } : null;
          })
          .filter(Boolean)
          .sort((a, b) => a.score - b.score)
          .slice(0, 5)
      : keywords.slice(0, 5).map(w => ({ word: w }));

    results.forEach(item => {
      list.insertAdjacentHTML(
        "beforeend",
        `<li><a href="${Shopify.routes.root}search?q=${encodeURIComponent(item.word)}">${item.word}</a></li>`
      );
    });
  }

  render();

  input.addEventListener("input", e => {
    const value = e.target.value.trim();
    if (!value) {
      wrapper.classList.remove("hidden");
      render();
    }
  });

  return {
    show(query) {
      wrapper.classList.remove("hidden");
      render(query);
    },
    hide() {
      wrapper.classList.add("hidden");
    }
  };
}

/* ===============================
   SEARCH DRAWER: PREDICTIVE SEARCH
================================ */
function initPredictiveSearch() {
  const input = document.getElementById("SearchDrawerInput");
  const predictive = document.getElementById("search-predictive");
  const productsList = document.getElementById("predictive-products-list");
  const suggestions = document.querySelector(".search-suggestions");

  if (!input || !predictive || !productsList) return;

  let timeout;
  let controller;

  input.addEventListener("input", e => {
    const query = e.target.value.trim();

    clearTimeout(timeout);
    if (controller) controller.abort();

    if (query.length < 2) {
      predictive.classList.add("hidden");
      productsList.innerHTML = "";
      return;
    }

    timeout = setTimeout(() => {
      controller = new AbortController();

      fetch(
        `/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=5`,
        { signal: controller.signal }
      )
        .then(res => res.json())
        .then(data => {
          const products = data.resources.results.products || [];
          productsList.innerHTML = "";

          if (!products.length) {
            predictive.classList.add("hidden");
            return;
          }

          suggestions.classList.add("hidden");
          predictive.classList.remove("hidden");

          products.forEach(p => {
            productsList.insertAdjacentHTML(
              "beforeend",
              `
              <a href="${p.url}" class="search-product-item">
                <div class="product-card__image">
                  <img src="${p.image}" alt="${p.title}" width="80">
                </div>
                <div class="product-card__info">
                  <h5>${p.title}</h5>
                  <span class="price">${p.price}</span>
                </div>
              </a>
            `
            );
          });
        })
        .catch(err => {
          if (err.name !== "AbortError") {
            console.error("Predictive search error", err);
          }
        });
    }, 300);
  });
}

/* ===============================
   SEARCH DRAWER: SUBMIT SEARCH
================================ */
function initSearchSubmit() {
  const form = document.getElementById("SearchDrawerForm");
  const resultsWrapper = document.getElementById("search-results");
  const resultsList = document.getElementById("search-results-list");
  const predictive = document.getElementById("search-predictive");

  if (!form || !resultsWrapper || !resultsList) return;

  form.addEventListener("submit", e => {
    e.preventDefault();

    const query = form.querySelector("input[name='q']").value.trim();
    if (!query) return;

    predictive.classList.add("hidden");
    resultsWrapper.classList.remove("hidden");
    resultsList.innerHTML = "<p>Loading…</p>";

    fetch(`${Shopify.routes.root}search?q=${encodeURIComponent(query)}&view=ajax`)
      .then(res => res.text())
      .then(html => {
        resultsList.innerHTML = html;
      })
      .catch(() => {
        resultsList.innerHTML = "<p>Something went wrong.</p>";
      });
  });
}
