document.addEventListener("DOMContentLoaded", () => {
  initSearchDrawerSuggestions();
  initPredictiveSearch();
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
   PREDICTIVE SEARCH
================================ */
function initPredictiveSearch() {
  const input = document.getElementById("SearchDrawerInput");
  const resultsContainer = document.getElementById("SearchProducts");

  if (!input || !resultsContainer) return;

  let controller = null;

  input.addEventListener("input", () => {
    const query = input.value.trim();

    if (query.length < 2) {
      resultsContainer.innerHTML = "";
      return;
    }

    if (controller) controller.abort();
    controller = new AbortController();

    fetchPredictiveResults(query, controller.signal);
  });

  function fetchPredictiveResults(query, signal) {
    fetch(
      `/search/suggest.json?q=${encodeURIComponent(
        query
      )}&resources[type]=product&resources[limit]=6`,
      { signal }
    )
      .then(res => res.json())
      .then(data => {
        renderProducts(data.resources.results.products);
      })
      .catch(err => {
        if (err.name !== "AbortError") {
          console.error("Search error:", err);
        }
      });
  }

  function renderProducts(products) {
    resultsContainer.innerHTML = "";

    if (!products.length) {
      resultsContainer.innerHTML =
        "<p class='no-results'>No products found</p>";
      return;
    }

    products.forEach(product => {
      const el = document.createElement("a");
      el.href = product.url;
      el.className = "predictive-product-item";

      el.innerHTML = `
        <div class="product-image">
          <img src="${product.image}" alt="${product.title}">
        </div>
        <div class="product-info">
          <p class="product-title">${product.title}</p>
          <p class="product-price">
            ${formatMoney(product.price)}
          </p>
        </div>
      `;

      resultsContainer.appendChild(el);
    });
  }
}

/* ===============================
   MONEY FORMAT
================================ */
function formatMoney(cents) {
  return (cents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: Shopify.currency.active
  });
}