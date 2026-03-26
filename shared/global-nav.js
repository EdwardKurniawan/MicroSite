/* global-nav.js */
(function() {
  const WP_NAV_HTML = `
    <div class="wp-nav-wrapper">
      <nav class="wp-nav">
        <a href="/" class="wp-logo" id="main-logo">Travel<span>Sides</span></a>
        <ul class="wp-links">
          <li><a href="/" id="nav-home">Explore</a></li>
          <li><a href="/#neighbourhoods" id="nav-nb">Neighbourhoods</a></li>
          <li><a href="/near-me/" id="nav-nearme">Near Me</a></li>
        </ul>
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
    const cityParam = new URLSearchParams(window.location.search).get('city');

    // Update logo based on city
    const logoEl = document.getElementById('main-logo');
    if (logoEl) {
      const cityNames = {
        'amsterdam': 'Amsterdam',
        'kanazawa': 'Kanazawa',
        'london': 'London',
        'rome': 'Rome',
        'berlin': 'Berlin'
      };
      
      for (const slug in cityNames) {
        if (path.includes(slug)) {
          logoEl.innerHTML = `${cityNames[slug]}<span>Insider</span>`;
          break;
        }
      }
    }

    if (path === '/' || path.includes('amsterdam') || cityParam === 'amsterdam') {
      document.getElementById('nav-home').classList.add('active');
    } else if (path.includes('neighbourhoods')) {
      document.getElementById('nav-nb').classList.add('active');
    }
  }

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }
})();
