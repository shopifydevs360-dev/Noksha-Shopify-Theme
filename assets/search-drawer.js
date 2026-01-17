document.addEventListener("DOMContentLoaded", () => {
  initSearchDrawerSuggestions();
  initSearchDrawerAjax();
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

    const results = !query
      ? keywords.slice(0, 5)
      : keywords
          .map(word => {
            const score = getScore(word, query);
            return score !== null ? { word, score } : null;
          })
          .filter(Boolean)
          .sort((a, b) => a.score - b.score)
          .slice(0, 5)
          .map(item => item.word);

    results.forEach(word => {
      list.insertAdjacentHTML(
        "beforeend",
        `<li><a href="/search?q=${encodeURIComponent(word)}">${word}</a></li>`
      );
    });
  }

  renderSuggestions();

  input.addEventListener("input", e => {
    renderSuggestions(e.target.value.trim());
  });
}

/* ===============================
   SEARCH DRAWER: AJAX PRODUCTS
================================ */
function initSearchDrawerAjax() {
  const input = document.getElementById("SearchDrawerInput");
  const results = document.getElementById("SearchProducts");

  if (!input || !results) return;

  let controller;

  input.addEventListener("input", () => {
    const query = input.value.trim();

    if (query.length < 2) {
      results.innerHTML = "";
      return;
    }

    if (controller) controller.abort();
    controller = new AbortController();

    fetch(
      `/?section_id=predictive-search&q=${encodeURIComponent(
        query
      )}&resources[type]=product&resources[limit]=8`,
      { signal: controller.signal }
    )
      .then(res => res.text())
      .then(html => {
        results.innerHTML = html;
      })
      .catch(err => {
        if (err.name !== "AbortError") {
          console.error("Search error", err);
        }
      });
  });
}
