document.addEventListener("DOMContentLoaded", () => {
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

  // Levenshtein Distance (edit distance)
  function levenshtein(a, b) {
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  function renderSuggestions(query = "") {
    list.innerHTML = "";

    if (!query) {
      // Default: first 5
      keywords.slice(0, 5).forEach(word => {
        list.insertAdjacentHTML(
          "beforeend",
          `<li><a href="/search?q=${encodeURIComponent(word)}">${word}</a></li>`
        );
      });
      return;
    }

    const q = query.toLowerCase();

    const scored = keywords.map(word => {
      const w = word.toLowerCase();

      let score = 999;

      if (w.includes(q)) {
        score = 0; // best
      } else {
        score = levenshtein(q, w);
      }

      return { word, score };
    });

    scored
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
      .forEach(item => {
        list.insertAdjacentHTML(
          "beforeend",
          `<li><a href="/search?q=${encodeURIComponent(item.word)}">${item.word}</a></li>`
        );
      });
  }

  // Initial
  renderSuggestions();

  // On typing
  input.addEventListener("input", e => {
    renderSuggestions(e.target.value.trim());
  });
});
