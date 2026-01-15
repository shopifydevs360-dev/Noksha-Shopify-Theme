document.addEventListener('DOMContentLoaded', function() {
  const productWrapper = document.querySelector('.product-list-wapper');
  if (!productWrapper) return;

  const paginationType = productWrapper.dataset.paginationType;
  if (!paginationType || paginationType === 'pagination_by_number') return;

  const loadMoreBtn = document.getElementById('load-more-btn');
  const productsContainer = document.getElementById('productsContainer');
  let currentPage = {{ paginate.current_page }};
  const totalPages = {{ paginate.pages }};

  if (paginationType === 'load_more_button' && loadMoreBtn) {
    loadMoreBtn.addEventListener('click', loadMoreProducts);
  } else if (paginationType === 'infinity_loading') {
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadMoreProducts();
        }
      });
    }, { threshold: 1.0 });

    const infinityLoadingTrigger = document.querySelector('.infinity-loading');
    if (infinityLoadingTrigger) {
      observer.observe(infinityLoadingTrigger);
    }
  }

  function loadMoreProducts() {
    if (currentPage >= totalPages) {
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
      return;
    }

    currentPage++;
    // Preserve all current URL parameters (sort, filters)
    const currentUrlParams = new URLSearchParams(window.location.search);
    currentUrlParams.set('page', currentPage);
    const nextUrl = `${window.location.pathname}?${currentUrlParams.toString()}`;

    // Show loading state
    if (loadMoreBtn) {
      loadMoreBtn.textContent = 'Loading...';
      loadMoreBtn.disabled = true;
    }

    fetch(nextUrl)
      .then(response => response.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const newProducts = doc.querySelectorAll('#productsContainer .product-card');
        
        newProducts.forEach(product => {
          productsContainer.appendChild(product);
        });

        // Hide loading state
        if (loadMoreBtn) {
          loadMoreBtn.textContent = 'Load More';
          loadMoreBtn.disabled = false;
          if (currentPage >= totalPages) {
            loadMoreBtn.style.display = 'none';
          }
        }
      })
      .catch(error => {
        console.error('Error loading more products:', error);
        if (loadMoreBtn) {
          loadMoreBtn.textContent = 'Load More';
          loadMoreBtn.disabled = false;
        }
      });
  }
});