document.addEventListener("DOMContentLoaded", () => {
  initSearchDrawerSuggestions();
  initSearchDrawerAjaxProducts();
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

    if (!query) {
      keywords.slice(0, 5).forEach(appendItem);
      return;
    }

    keywords
      .map(word => {
        const score = getScore(word, query);
        return score !== null ? { word, score } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
      .forEach(item => appendItem(item.word));
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
   (Template-based, no layout break)
================================ */
function initSearchDrawerAjaxProducts() {
  const input = document.getElementById("SearchDrawerInput");
  const resultsWrap = document.getElementById("SearchProducts");
  const template = document.getElementById("SearchProductTemplate");
  const noResults = document.getElementById("SearchNoResults");

  if (!input || !resultsWrap || !template) return;

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

      fetchProducts(query);
    }, 300);
  });

  function fetchProducts(query) {
    if (controller) controller.abort();
    controller = new AbortController();

    fetch(
      `/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=6`,
      { signal: controller.signal }
    )
      .then(res => res.json())
      .then(data => {
        const products = data.resources.results.products || [];
        renderProducts(products);
      })
      .catch(err => {
        if (err.name !== "AbortError") {
          console.error("Search error", err);
        }
      });
  }

  function renderProducts(products) {
    resultsWrap.innerHTML = "";

    if (!products.length) {
      noResults?.classList.remove("hide");
      return;
    }

    noResults?.classList.add("hide");

    products.forEach(product => {
      const clone = template.content.cloneNode(true);

      clone.querySelector("[data-product-url]").href = product.url;
      clone.querySelector("[data-product-title]").textContent = product.title;
      clone.querySelector("[data-product-image]").src = product.image;
      clone.querySelector("[data-product-image]").alt = product.title;
      clone.querySelector("[data-product-price]").textContent =
        Shopify.formatMoney(product.price);

      resultsWrap.appendChild(clone);
    });
  }
}
