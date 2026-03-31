(function () {
  function resolveContext() {
    return window.PAGE_CONTEXT || {};
  }

  function getText(link) {
    return link.label || link.title || '';
  }

  function getActiveKey(pathname) {
    const clean = pathname.replace(/\/+$/, '') || '/';
    if (/\/authors(\/|$)/.test(clean) || clean.split('/').filter(Boolean).length <= 1) {
      return 'overview';
    }
    return 'collections';
  }

  function bindInPageScrolling(root) {
    root.querySelectorAll('a[href*="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const href = link.getAttribute('href');
        if (!href) return;
        const url = new URL(href, window.location.origin);
        if (url.pathname !== window.location.pathname) return;
        if (!url.hash) return;
        const target = document.querySelector(url.hash);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function initNav() {
    const page = resolveContext();
    const navigation = page.navigation || {};
    const rootPath = navigation.home_url || (window.CITY_SLUG ? `/${window.CITY_SLUG}/` : '/');
    const localLinks = navigation.local_links || [];
    const cta = navigation.cta || { label: 'Explore City Guide', url: rootPath };
    const activeKey = getActiveKey(window.location.pathname);

    const linkHtml = localLinks
      .map((link) => {
        const label = getText(link);
        if (!label || !link.url) return '';
        const active = link.key === activeKey ? 'active' : '';
        return `<li><a href="${link.url}" data-nav-key="${link.key || ''}" class="${active}">${label}</a></li>`;
      })
      .join('');

    const html = `
      <div class="wp-nav-wrapper">
        <nav class="wp-nav">
          <div class="wp-nav-left">
            <a href="${rootPath}" class="wp-logo">${window.CITY_NAME || 'Travel'}<span>Insider</span></a>
            <ul class="wp-links">${linkHtml}</ul>
          </div>
          <div class="wp-nav-right">
            <a href="${cta.url || rootPath}" class="wp-cta">${cta.label || 'Explore'}</a>
          </div>
        </nav>
      </div>
    `;

    const existingHeader = document.querySelector('header.site-header');
    if (existingHeader) {
      existingHeader.innerHTML = html;
      bindInPageScrolling(existingHeader);
    } else {
      document.body.insertAdjacentHTML('afterbegin', html);
      bindInPageScrolling(document.body);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }
})();
