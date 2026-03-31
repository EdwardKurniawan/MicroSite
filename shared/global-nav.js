/* global-nav.js */
(function() {
  const cityName = window.CITY_NAME || 'Travel';
  const citySlug = window.CITY_SLUG || '';
  const rootPath = citySlug ? `/${citySlug}/` : '/';

  const WP_NAV_HTML = `
    <div class="wp-nav-wrapper">
      <nav class="wp-nav">
        <a href="${rootPath}" class="wp-logo" id="main-logo">${cityName}<span>Insider</span></a>
        <ul class="wp-links">
          <li><a href="${rootPath}" id="nav-home">Explore</a></li>
          <li><a href="${rootPath}#neighbourhoods" id="nav-nb">Neighbourhoods</a></li>
          <li><a href="#hero-search-input" id="nav-ai" class="hidden md:block">AI Guide</a></li>
        </ul>
        <a href="${rootPath}tickets/" class="wp-cta">Book Tickets</a>
      </nav>
    </div>
  `;

  function initNav() {
    // Find existing header or body start
    const existingHeader = document.querySelector('header.site-header');
    if (existingHeader) {
      existingHeader.innerHTML = WP_NAV_HTML;
    } else {
      document.body.insertAdjacentHTML('afterbegin', WP_NAV_HTML);
    }

    // Highlight active link
    const path = window.location.pathname;
    
    // Simple active state check
    if (path === rootPath || (citySlug && path === `/${citySlug}`)) {
      const homeLink = document.getElementById('nav-home');
      if (homeLink) homeLink.classList.add('active');
    } else if (path.includes('neighbourhoods')) {
      const nbLink = document.getElementById('nav-nb');
      if (nbLink) nbLink.classList.add('active');
    }

    // AI Guide scroll-to-search
    const aiLink = document.getElementById('nav-ai');
    if (aiLink) {
      aiLink.addEventListener('click', (e) => {
        const searchInput = document.getElementById('hero-search-input');
        if (searchInput) {
          e.preventDefault();
          searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => searchInput.focus(), 800);
        }
      });
    }
  }

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }
})();
