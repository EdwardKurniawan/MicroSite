/* global-nav.js */
(function() {
  const WP_NAV_HTML = `
    <div class="wp-nav-wrapper">
      <nav class="wp-nav">
        <a href="/" class="wp-logo">Wonder<span>Pass</span></a>
        <ul class="wp-links">
          <li><a href="/" id="nav-home">Home</a></li>
          <li><a href="/amsterdam/" id="nav-amsterdam">Amsterdam</a></li>
          <li><a href="/kanazawa/" id="nav-kanazawa">Kanazawa</a></li>
          <li><a href="/near-me/" id="nav-nearme">Near Me</a></li>
        </ul>
        <a href="#tickets" class="wp-cta">🎟 Buy Tickets</a>
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
    
    if (path === '/' && !cityParam) {
      document.getElementById('nav-home').classList.add('active');
    } else if (path.includes('amsterdam') || cityParam === 'amsterdam') {
      document.getElementById('nav-amsterdam').classList.add('active');
    } else if (path.includes('kanazawa') || cityParam === 'kanazawa') {
      document.getElementById('nav-kanazawa').classList.add('active');
    }
  }

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }
})();
