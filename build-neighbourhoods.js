const fs = require('fs');
const path = require('path');

const BASE = 'C:\\Users\\edwar\\OneDrive\\Documents\\Gemini AI Craziness\\city-guide-template';

// ── Shared CSS (same as subpages) ───────────────────────────────────────────
const CSS = `
    :root {
      --accent:#E8601C;--accent-dark:#c44f14;--accent-light:#fff3ee;
      --ink:#1a1a1a;--ink-muted:#555;--surface:#fff;--surface-2:#f8f7f5;
      --border:#e5e3df;--radius-sm:6px;--radius-md:12px;--radius-lg:20px;
      --shadow-sm:0 1px 3px rgba(0,0,0,.08);--shadow-md:0 4px 16px rgba(0,0,0,.10);
      --font-display:'Playfair Display',Georgia,serif;
      --font-body:'Inter',system-ui,sans-serif;
      --max-w:760px;--max-w-wide:1160px;
      --canal:#1a3a5c;--flag-red:#AE1C28;--flag-blue:#21468B;
    }
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth;font-size:16px}
    body{font-family:var(--font-body);color:var(--ink);background:var(--surface);line-height:1.7;-webkit-font-smoothing:antialiased}
    img{max-width:100%;height:auto;display:block}
    a{color:var(--accent);text-decoration:none}
    a:hover{text-decoration:underline}
    .container{max-width:var(--max-w-wide);margin:0 auto;padding:0 24px}
    .content-wrap{max-width:var(--max-w);margin:0 auto}
    .site-header{position:sticky;top:0;z-index:100;background:rgba(255,255,255,.95);backdrop-filter:blur(8px);border-bottom:1px solid var(--border)}
    .site-header::before{content:'';display:block;height:4px;background:linear-gradient(to right,var(--flag-red) 0%,var(--flag-red) 33.33%,#fff 33.33%,#fff 66.66%,var(--flag-blue) 66.66%,var(--flag-blue) 100%)}
    .nav-inner{display:flex;align-items:center;justify-content:space-between;height:60px}
    .nav-logo{font-family:var(--font-display);font-size:1.1rem;font-weight:800;color:var(--ink);letter-spacing:-.02em;white-space:nowrap}
    .nav-logo span{color:var(--accent)}
    .nav-links{display:flex;gap:28px;list-style:none}
    .nav-links a{font-size:.875rem;font-weight:500;color:var(--ink-muted);transition:color .2s}
    .nav-links a:hover{color:var(--accent);text-decoration:none}
    .nav-cta{background:var(--accent);color:#fff;padding:8px 18px;border-radius:40px;font-size:.875rem;font-weight:600;transition:background .2s}
    .nav-cta:hover{background:var(--accent-dark);text-decoration:none}
    .nav-hamburger{display:none;cursor:pointer;background:none;border:none;padding:4px}
    .nav-hamburger span{display:block;width:22px;height:2px;background:var(--ink);margin:5px 0;border-radius:2px}
    .breadcrumb{padding:14px 0 0;font-size:.8rem;color:var(--ink-muted)}
    .breadcrumb a{color:var(--ink-muted)}
    .breadcrumb a:hover{color:var(--accent);text-decoration:none}
    .breadcrumb span{margin:0 6px}
    /* HERO */
    .page-hero{background:linear-gradient(135deg,#1a2744 0%,#2d4a7a 60%,#1f3560 100%);border-radius:var(--radius-lg);margin:12px 0 0;min-height:400px;position:relative;overflow:hidden;display:flex;align-items:flex-end}
    .page-hero-img{position:absolute;inset:0;object-fit:cover;width:100%;height:100%;opacity:.55}
    .page-hero-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.78) 0%,rgba(0,0,0,.15) 55%,transparent 100%)}
    .page-hero-content{position:relative;z-index:2;padding:36px 44px 44px;max-width:700px}
    .hero-eyebrow{display:inline-flex;align-items:center;gap:8px;background:var(--accent);color:#fff;font-size:.75rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:5px 14px;border-radius:40px;margin-bottom:14px}
    .page-hero h1{font-family:var(--font-display);font-size:clamp(1.9rem,4.5vw,3rem);font-weight:800;line-height:1.15;color:#fff;margin-bottom:14px;letter-spacing:-.025em}
    .hero-standfirst{color:rgba(255,255,255,.88);font-size:1rem;line-height:1.55;margin-bottom:18px;max-width:540px}
    .page-hero-meta{display:flex;flex-wrap:wrap;gap:14px;color:rgba(255,255,255,.75);font-size:.83rem}
    /* QUICK FACTS GRID */
    .nb-facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;margin:32px 0 40px}
    .nb-fact{background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-md);padding:18px 20px}
    .nb-fact-icon{font-size:1.4rem;margin-bottom:6px}
    .nb-fact-label{font-size:.68rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:4px}
    .nb-fact-value{font-weight:600;font-size:.92rem;color:var(--ink)}
    /* SECTION HEADINGS */
    .section-heading{font-family:var(--font-display);font-size:1.7rem;font-weight:800;letter-spacing:-.02em;margin:48px 0 18px;padding-top:20px}
    .section-heading::after{content:'';display:block;width:44px;height:3px;background:var(--accent);border-radius:2px;margin-top:8px}
    .section-sub{font-family:var(--font-display);font-size:1.2rem;font-weight:700;color:var(--ink);margin:32px 0 12px}
    /* INTRO */
    .intro p{font-size:1.03rem;color:var(--ink-muted);margin-bottom:18px}
    .intro strong{color:var(--ink)}
    /* THINGS TO DO LIST */
    .todo-list{list-style:none;display:grid;gap:24px;margin-bottom:48px}
    .todo-item{display:flex;gap:20px;align-items:flex-start;padding:22px 24px;border:1px solid var(--border);border-radius:var(--radius-md);background:var(--surface);transition:box-shadow .2s}
    .todo-item:hover{box-shadow:var(--shadow-sm)}
    .todo-num{font-family:var(--font-display);font-size:1.5rem;font-weight:800;color:var(--accent);flex-shrink:0;min-width:36px;line-height:1}
    .todo-body h3{font-size:1rem;font-weight:700;margin-bottom:5px;color:var(--ink)}
    .todo-body p{font-size:.9rem;color:var(--ink-muted);margin:0;line-height:1.6}
    /* FOOD LIST */
    .food-list{list-style:none;display:grid;gap:16px;margin-bottom:48px}
    .food-item{padding:20px 22px;border:1px solid var(--border);border-radius:var(--radius-md);background:var(--surface-2)}
    .food-item h3{font-size:.95rem;font-weight:700;color:var(--ink);margin-bottom:4px}
    .food-item p{font-size:.88rem;color:var(--ink-muted);margin:0;line-height:1.6}
    .food-tag{display:inline-block;font-size:.68rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;background:var(--accent-light);color:var(--accent);padding:2px 8px;border-radius:20px;margin-bottom:6px}
    /* PRODUCT LINKS (ticket cards) */
    .product-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px;margin-bottom:48px}
    .product-card{border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;text-decoration:none;color:inherit;background:var(--surface);transition:box-shadow .2s,transform .2s;display:flex;flex-direction:column}
    .product-card:hover{box-shadow:var(--shadow-md);transform:translateY(-2px);text-decoration:none}
    .product-card-img{width:100%;height:140px;object-fit:cover;display:block}
    .product-card-body{padding:16px 18px 20px;display:flex;flex-direction:column;flex:1}
    .product-card-cat{font-size:.68rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--accent);margin-bottom:5px}
    .product-card-body h3{font-family:var(--font-display);font-size:1rem;font-weight:800;color:var(--ink);margin:0 0 8px;line-height:1.3}
    .product-card-body p{font-size:.84rem;color:var(--ink-muted);line-height:1.55;flex:1;margin:0 0 14px}
    .product-card-cta{display:inline-flex;align-items:center;gap:6px;background:var(--accent);color:#fff;font-size:.78rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:9px 16px;border-radius:6px;text-decoration:none;align-self:flex-start;transition:background .15s;margin-top:auto}
    .product-card-cta:hover{background:var(--accent-dark);text-decoration:none;color:#fff}
    /* TIP BOX */
    .tip-box{background:var(--accent-light);border-left:3px solid var(--accent);border-radius:0 var(--radius-sm) var(--radius-sm) 0;padding:14px 18px;margin:20px 0;font-size:.9rem}
    .tip-box strong{color:var(--accent)}
    /* GETTING THERE */
    .getting-there{background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-md);padding:24px 28px;margin:0 0 48px}
    .getting-there h3{font-family:var(--font-display);font-size:1.1rem;font-weight:700;margin-bottom:14px}
    .gt-list{list-style:none;display:grid;gap:10px}
    .gt-item{display:flex;gap:12px;align-items:flex-start;font-size:.9rem;color:var(--ink-muted)}
    .gt-icon{font-size:1.1rem;flex-shrink:0;margin-top:1px}
    /* CTA BANNER */
    .cta-banner{background:linear-gradient(135deg,var(--accent) 0%,var(--accent-dark) 100%);border-radius:var(--radius-lg);padding:44px 36px;text-align:center;margin:44px 0;position:relative;overflow:hidden}
    .cta-banner::before{content:'';position:absolute;top:-60px;right:-60px;width:240px;height:240px;border-radius:50%;background:rgba(255,255,255,.08)}
    .cta-banner h3{font-family:var(--font-display);font-size:1.7rem;color:#fff;margin-bottom:10px;font-weight:800}
    .cta-banner p{color:rgba(255,255,255,.85);margin-bottom:26px}
    .cta-form{display:flex;gap:10px;max-width:420px;margin:0 auto}
    .cta-form input{flex:1;padding:12px 16px;border-radius:40px;border:none;font-size:.9rem;outline:none}
    .cta-form button{background:var(--ink);color:#fff;border:none;padding:12px 22px;border-radius:40px;font-weight:700;cursor:pointer;font-size:.9rem;white-space:nowrap;transition:opacity .2s}
    .cta-form button:hover{opacity:.88}
    /* FOOTER */
    .site-footer{background:var(--ink);color:rgba(255,255,255,.6);padding:44px 0 22px;margin-top:72px;font-size:.85rem}
    .footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:36px;margin-bottom:36px}
    .footer-brand .nav-logo{color:#fff}
    .footer-brand p{margin-top:10px;color:rgba(255,255,255,.5);font-size:.82rem;line-height:1.6}
    .footer-col h4{color:#fff;font-weight:600;margin-bottom:12px;font-size:.875rem}
    .footer-col ul{list-style:none}
    .footer-col ul li{margin-bottom:7px}
    .footer-col ul a{color:rgba(255,255,255,.55);transition:color .2s}
    .footer-col ul a:hover{color:#fff;text-decoration:none}
    .footer-bottom{border-top:1px solid rgba(255,255,255,.1);padding-top:18px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}
    .scroll-top{position:fixed;bottom:26px;right:26px;z-index:200;width:42px;height:42px;border-radius:50%;background:var(--accent);color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-md);opacity:0;pointer-events:none;transition:opacity .3s,transform .2s;font-size:1.1rem}
    .scroll-top.visible{opacity:1;pointer-events:all}
    @media(max-width:900px){.footer-grid{grid-template-columns:1fr 1fr}.nb-facts{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:640px){.page-hero{min-height:300px;border-radius:var(--radius-md)}.page-hero-content{padding:24px 22px 30px}.nav-links,.nav-cta{display:none}.nav-hamburger{display:block}.footer-grid{grid-template-columns:1fr}.cta-form{flex-direction:column}.product-grid{grid-template-columns:1fr}.nb-facts{grid-template-columns:1fr}}
`;

const NAV = `  <header class="site-header">
    <div class="container">
      <nav class="nav-inner">
        <a href="/" class="nav-logo">Amsterdam<span>Insider</span></a>
        <ul class="nav-links">
          <li><a href="/museums/">Museums</a></li>
          <li><a href="/canal-cruises/">Canal Cruises</a></li>
          <li><a href="/experiences/">Experiences</a></li>
          <li><a href="/nature-day-trips/">Day Trips</a></li>
        </ul>
        <a href="#tickets" class="nav-cta">\uD83C\uDF9F Buy Tickets</a>
        <button class="nav-hamburger" aria-label="Menu"><span></span><span></span><span></span></button>
      </nav>
    </div>
  </header>`;

const FOOTER = `  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="/" class="nav-logo">Amsterdam<span>Insider</span></a>
          <p>An independent Amsterdam travel guide written by someone who lives here. Skip-the-line tickets, honest reviews, and genuine local knowledge \u2014 no filler.</p>
        </div>
        <div class="footer-col">
          <h4>Explore Amsterdam</h4>
          <ul>
            <li><a href="/museums/">Museums &amp; Art</a></li>
            <li><a href="/history-heritage/">History &amp; Heritage</a></li>
            <li><a href="/canal-cruises/">Canal Cruises</a></li>
            <li><a href="/nature-day-trips/">Nature &amp; Day Trips</a></li>
            <li><a href="/experiences/">Experiences</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Neighbourhoods</h4>
          <ul>
            <li><a href="/amsterdam/jordaan/">Jordaan</a></li>
            <li><a href="/amsterdam/de-pijp/">De Pijp</a></li>
            <li><a href="/amsterdam/centrum/">Centrum</a></li>
            <li><a href="/amsterdam/noord/">Amsterdam Noord</a></li>
            <li><a href="/amsterdam/museumplein/">Museumplein</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>About</h4>
          <ul>
            <li><a href="/authors/sarah-mitchell/">Sarah Mitchell</a></li>
            <li><a href="/#itinerary">3-Day Itinerary</a></li>
            <li><a href="/#faq">Amsterdam FAQ</a></li>
            <li><a href="/affiliate-disclosure/">Affiliate Disclosure</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>\u00A9 2026 Amsterdam Insider \u00B7 Independent Amsterdam travel guide</span>
        <span>\uD83D\uDD16 We may earn a commission on ticket bookings \u2014 at no extra cost to you.</span>
      </div>
    </div>
  </footer>
  <button class="scroll-top" id="scrollTop" aria-label="Scroll to top">\u2191</button>
  <script>
    const scrollBtn=document.getElementById('scrollTop');
    window.addEventListener('scroll',()=>scrollBtn.classList.toggle('visible',window.scrollY>400));
    scrollBtn.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
    const hamburger=document.querySelector('.nav-hamburger');
    hamburger&&hamburger.addEventListener('click',()=>{const links=document.querySelector('.nav-links');if(links){links.style.display=links.style.display==='flex'?'none':'flex';links.style.flexDirection='column';links.style.position='absolute';links.style.top='60px';links.style.left='0';links.style.right='0';links.style.background='#fff';links.style.padding='20px 24px';links.style.borderBottom='1px solid #e5e3df';links.style.boxShadow='0 4px 16px rgba(0,0,0,.10)'}});
  <\/script>`;

function buildPage(cfg) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${cfg.title}</title>
  <meta name="description" content="${cfg.desc}" />
  <link rel="canonical" href="https://yourdomain.com${cfg.slug}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${cfg.title}" />
  <meta property="og:description" content="${cfg.desc}" />
  <meta property="og:image" content="https://images.unsplash.com/${cfg.heroImg}?w=1200&auto=format&fit=crop&q=80" />
  <meta property="og:url" content="https://yourdomain.com${cfg.slug}" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${cfg.title}",
    "description": "${cfg.desc}",
    "image": "https://images.unsplash.com/${cfg.heroImg}?w=1200",
    "author": {"@type":"Person","name":"Sarah Mitchell","url":"https://yourdomain.com/authors/sarah-mitchell/"},
    "publisher": {"@type":"Organization","name":"Amsterdam Insider"},
    "dateModified": "2026-03-18",
    "about": {"@type":"Place","name":"${cfg.placeName}","containedInPlace":{"@type":"City","name":"Amsterdam"}}
  }
  <\/script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="preconnect" href="https://images.unsplash.com" />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>${CSS}</style>
</head>
<body>
${NAV}
  <main>
    <div class="container">
      <div class="breadcrumb">
        <a href="/">Home</a><span>&#x203A;</span><a href="/tours/">Neighbourhoods</a><span>&#x203A;</span><span>${cfg.name}</span>
      </div>
      <section class="page-hero" aria-label="${cfg.name} Amsterdam hero">
        <img class="page-hero-img"
          src="https://images.unsplash.com/${cfg.heroImg}?w=1200&auto=format&fit=crop&q=80"
          alt="${cfg.heroAlt}" loading="eager" width="1200" height="600" />
        <div class="page-hero-overlay"></div>
        <div class="page-hero-content">
          <div class="hero-eyebrow">\uD83C\uDDF3\uD83C\uDDF1 Amsterdam Neighbourhood</div>
          <h1>${cfg.h1}</h1>
          <p class="hero-standfirst">${cfg.standfirst}</p>
          <div class="page-hero-meta">
            <span>\uD83D\uDCCD ${cfg.name}, Amsterdam</span>
            <span>\u270D\uFE0F By <a href="/authors/sarah-mitchell/" style="color:rgba(255,255,255,.85)">Sarah Mitchell</a></span>
            <span>\uD83D\uDD50 Updated March 2026</span>
          </div>
        </div>
      </section>

      <div class="content-wrap">

        <!-- QUICK FACTS -->
        <div class="nb-facts" role="region" aria-label="${cfg.name} quick facts">
          ${cfg.facts.map(f => `<div class="nb-fact">
            <div class="nb-fact-icon">${f.icon}</div>
            <div class="nb-fact-label">${f.label}</div>
            <div class="nb-fact-value">${f.value}</div>
          </div>`).join('\n          ')}
        </div>

        <!-- INTRO -->
        <div class="intro">
          ${cfg.intro}
        </div>

        <!-- WHAT TO DO -->
        <h2 class="section-heading" id="what-to-do">What to Do in ${cfg.name}</h2>
        <ol class="todo-list" aria-label="Things to do in ${cfg.name}">
          ${cfg.todos.map((t, i) => `<li class="todo-item">
            <div class="todo-num">${String(i+1).padStart(2,'0')}</div>
            <div class="todo-body">
              <h3>${t.title}</h3>
              <p>${t.body}</p>
            </div>
          </li>`).join('\n          ')}
        </ol>

        <!-- BOOK TICKETS -->
        <h2 class="section-heading" id="tickets">Book Tickets &amp; Tours</h2>
        <p style="color:var(--ink-muted);margin-bottom:24px;font-size:.97rem;">${cfg.bookIntro}</p>
        <div class="product-grid" id="tickets">
          ${cfg.products.map(p => `<a class="product-card" href="${p.href}">
            <img class="product-card-img"
              src="https://images.unsplash.com/${p.img}?w=600&auto=format&fit=crop&q=75"
              alt="${p.imgAlt}" loading="lazy" width="600" height="300" />
            <div class="product-card-body">
              <div class="product-card-cat">${p.cat}</div>
              <h3>${p.title}</h3>
              <p>${p.desc}</p>
              <span class="product-card-cta">${p.cta} &rarr;</span>
            </div>
          </a>`).join('\n          ')}
        </div>

        <!-- EAT & DRINK -->
        <h2 class="section-heading" id="eat-drink">Where to Eat &amp; Drink</h2>
        <p style="color:var(--ink-muted);margin-bottom:24px;font-size:.97rem;">${cfg.eatIntro}</p>
        <ul class="food-list" aria-label="Restaurants and cafes in ${cfg.name}">
          ${cfg.food.map(f => `<li class="food-item">
            <div class="food-tag">${f.tag}</div>
            <h3>${f.name}</h3>
            <p>${f.body}</p>
          </li>`).join('\n          ')}
        </ul>

        <!-- GETTING THERE -->
        <div class="getting-there" id="getting-there">
          <h3>\uD83D\uDDFA\uFE0F Getting to ${cfg.name}</h3>
          <ul class="gt-list">
            ${cfg.transport.map(t => `<li class="gt-item"><span class="gt-icon">${t.icon}</span><span>${t.text}</span></li>`).join('\n            ')}
          </ul>
        </div>

        <!-- NEWSLETTER -->
        <div class="cta-banner" role="complementary" aria-label="Newsletter signup">
          <h3>Know Amsterdam Before You Arrive</h3>
          <p>One email, once a week. What to book this month, what to skip, and the things locals notice that tourists miss.</p>
          <form class="cta-form" action="#" method="post" novalidate>
            <input type="email" placeholder="Your email address" aria-label="Email address" required />
            <button type="submit">Send Me the Tips</button>
          </form>
        </div>

      </div>
    </div>
  </main>
${FOOTER}
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// NEIGHBOURHOOD DATA
// ═══════════════════════════════════════════════════════════════════════════════

const neighbourhoods = [

  // ── 1. JORDAAN ─────────────────────────────────────────────────────────────
  {
    dir: 'amsterdam/jordaan',
    slug: '/amsterdam/jordaan/',
    name: 'Jordaan',
    placeName: 'Jordaan, Amsterdam',
    title: 'Jordaan Amsterdam Guide 2026 — The Best Neighbourhood in the City',
    desc: "The complete guide to the Jordaan — Amsterdam's most charming neighbourhood. Best things to do, where to eat, hidden courtyards, the 9 Straatjes, and local tips.",
    heroImg: 'photo-1598901855988-53e7f4b2edde',
    heroAlt: 'Jordaan neighbourhood Amsterdam canal houses and bicycles',
    h1: 'The Jordaan',
    standfirst: "Amsterdam's most beloved neighbourhood — narrow canals, 17th-century houses, hidden courtyards, and the kind of brown cafés where you lose track of an afternoon.",
    facts: [
      { icon: '🏘', label: 'Character', value: 'Historic, artsy, residential' },
      { icon: '📍', label: 'Location', value: 'West of the canal ring' },
      { icon: '🚶', label: 'Best way to explore', value: 'On foot or by bike' },
      { icon: '⏱', label: 'Time to allow', value: 'Half day to full day' },
      { icon: '🌟', label: 'Best for', value: 'Couples, culture lovers, shoppers' },
      { icon: '📅', label: 'Best day to visit', value: 'Saturday (Noordermarkt)' },
    ],
    intro: `
      <p>The Jordaan started as a mistake. When Amsterdam expanded its canal ring in the early 17th century, the city planners drew the new residential quarter to the west — narrow streets, dense housing, no grand waterways. It was built for workers: tanners, cloth-dyers, and craftsmen who couldn't afford the canal ring addresses being snapped up by Golden Age merchants. The name probably comes from the French <em>jardin</em> — garden — because the area was laid out on what had been market gardens.</p>
      <p>It stayed working-class for three centuries. The Jordaan had a reputation for poverty, overcrowding, and radical politics well into the 20th century. <strong>Then, slowly, the artists arrived. Then the galleries. Then the boutiques.</strong> Today the Jordaan has some of the highest residential property prices in the Netherlands, and the canal houses that once housed ten people to a room are selling for two million euros. The narrow streets are still there. The brown cafés are still there. The hofjes — hidden almshouse courtyards behind unmarked doors — are still there. The Jordaan absorbed its own gentrification without quite losing its character. That's a rare thing.</p>
      <p>This is the neighbourhood where Amsterdam feels most like itself: unhurried, slightly eccentric, genuinely beautiful. Give it at least a morning. Give it a full day if you can.</p>`,
    todos: [
      { title: 'Wander de 9 Straatjes (the Nine Streets)', body: 'The nine streets cross the Jordaan\'s three main canals (Keizersgracht, Herengracht, Prinsengracht) and contain the best concentration of independent boutiques in Amsterdam — vintage clothing, concept stores, specialist bookshops, and design studios. Start at Reestraat and work your way south. Allow 2 hours minimum.' },
      { title: 'Find the hidden hofjes', body: 'The Jordaan contains at least 20 hidden courtyards (hofjes) — former almshouses tucked behind unmarked doors on ordinary-looking streets. The best are Karthuizershofje (Karthuizerstraat 87), Claes Claeszhofje (1e Egelantiersdwarsstraat 3), and Suykerhofje (Lindengracht 149). Push the door. Walk in quietly.' },
      { title: 'Saturday Noordermarkt', body: 'Every Saturday morning, the Noordermarktplein fills with two markets running simultaneously: the Boerenmarkt (organic farmers\' market, 9am–4pm) and the Noordermarkt antique & vintage market (9am–2pm). This is where Jordaan residents actually shop. Arrive at 9am for the best selection and the fewest crowds.' },
      { title: 'Sit in a brown café (bruin café)', body: 'Amsterdam\'s brown cafés are the Dutch equivalent of a London pub — dark wood, candles in bottles, a regulars\' bar that\'s been the same for decades. In the Jordaan, Café \'t Smalle (Egelantiersgracht 12) and Café de Reiger (Nieuwe Leliestraat 34) are the most authentic. Order a jenever (Dutch gin) and a beer. Don\'t rush.' },
      { title: 'Walk the Prinsengracht and Brouwersgracht', body: 'The Prinsengracht is the outer ring of the main canal network and one of the most beautiful streets in the city — wide enough to feel airy, lined with elms, houseboats moored along both banks. Walk north from the Anne Frank House to the Brouwersgracht junction: this corner is consistently cited as the most beautiful canal intersection in Amsterdam.' },
      { title: 'Explore the Westerkerk and Westermarkt', body: 'The Westerkerk tower (1631) is the tallest church tower in Amsterdam and visible from most of the Jordaan. Rembrandt is buried somewhere inside — the exact location was lost in the 18th century. Every Monday morning, the Westermarkt hosts one of Amsterdam\'s longest-running outdoor markets. The Anne Frank House is directly beside it.' },
    ],
    bookIntro: 'The Jordaan is the best base for several of Amsterdam\'s most important attractions. All of these are bookable online in advance — the Anne Frank House especially sells out weeks ahead.',
    products: [
      { href: '/tours/', img: 'photo-1598901855988-53e7f4b2edde', imgAlt: 'Jordaan walking tour Amsterdam', cat: 'Walking Tour', title: 'Jordaan Walking Tour', desc: 'A 2-hour small-group guided walk through the nine streets, hidden hofjes, and canal-side architecture with a local guide who actually lives here.', cta: 'Book the Tour' },
      { href: '/history-heritage/', img: 'photo-1555921015-5532091f6026', imgAlt: 'Anne Frank House Amsterdam Prinsengracht', cat: 'History', title: 'Anne Frank House', desc: 'The Jordaan\'s most significant site — and the most visited in Amsterdam. Pre-booking is essential. Time slots release on the 1st of each month and sell out in hours.', cta: 'Reserve a Slot' },
      { href: '/canal-cruises/', img: 'photo-1534351590666-13e3e96b5017', imgAlt: 'Canal cruise departing near Anne Frank House Amsterdam', cat: 'Canal Cruise', title: 'Canal Cruise from Prinsengracht', desc: 'Several operators depart from near the Anne Frank House — putting you in the most scenic stretch of the canal ring from the first minute.', cta: 'See Canal Cruises' },
      { href: '/tours/', img: 'photo-1589909202802-8f4aadce1849', imgAlt: 'Amsterdam guided bike tour canal ring', cat: 'Bike Tour', title: 'Guided Bike Tour', desc: 'The Jordaan is the starting point for most of Amsterdam\'s guided bike tours — flat streets, quiet canals, and the perfect pace for seeing the city on two wheels.', cta: 'Book a Bike Tour' },
    ],
    eatIntro: 'The Jordaan has one of the best café and restaurant scenes in Amsterdam — none of it on the main tourist drag. These are the places locals actually go.',
    food: [
      { tag: 'Best apple pie in Amsterdam', name: 'Winkel 43', body: 'The appeltaart at Winkel 43 (Noordermarkt 43) has been called the best apple pie in Amsterdam for 20 years running. It\'s served warm, with a thick wedge of whipped cream. Arrive before 11am on Saturdays to beat the Noordermarkt queue.' },
      { tag: 'Brown café', name: "Café 't Smalle", body: "One of the oldest brown cafés in Amsterdam, operating from a converted 18th-century jenever distillery on the Egelantiersgracht. Wooden benches extend over the canal in summer. Go on a weekday afternoon when it's quiet enough to hear the waterway." },
      { tag: 'Local dinner', name: 'De Reiger', body: 'A genuine neighbourhood restaurant on Nieuwe Leliestraat — good Dutch-French cooking, chalk-written menu, no reservations taken. Arrive before 7pm or expect to wait. The kind of place that\'s been full every night for thirty years without ever appearing in a travel guide.' },
      { tag: 'Coffee', name: 'Lot Sixty One', body: 'Amsterdam\'s best specialty coffee roaster, operating out of a converted garage on Kinkerstraat (five minutes west of the Jordaan). The espresso is exceptional. The beans are sourced directly from farms in Ethiopia, Colombia, and Guatemala. No wifi, on purpose.' },
    ],
    transport: [
      { icon: '🚋', text: 'Tram 13, 17 or 19 to Westermarkt stop — puts you at the northern Jordaan entrance, directly beside the Westerkerk and Anne Frank House.' },
      { icon: '🚶', text: '20-minute walk from Amsterdam Centraal Station along the Singel canal, or 15 minutes from the Rijksmuseum area via Leidsegracht.' },
      { icon: '🚲', text: 'Most Amsterdam bike rental shops offer bikes from around €10/day. Cycling to the Jordaan from Centraal takes about 10 minutes.' },
      { icon: '🅿️', text: 'Don\'t drive. Parking in the Jordaan costs €7.50/hour and spaces are rare. Tram or bike in every time.' },
    ],
  },

  // ── 2. DE PIJP ─────────────────────────────────────────────────────────────
  {
    dir: 'amsterdam/de-pijp',
    slug: '/amsterdam/de-pijp/',
    name: 'De Pijp',
    placeName: 'De Pijp, Amsterdam',
    title: 'De Pijp Amsterdam Guide 2026 — Food, Markets & Local Life',
    desc: "The complete guide to De Pijp — Amsterdam's most multicultural neighbourhood. Albert Cuyp Market, the best food in the city, craft beer, and the Heineken Experience.",
    heroImg: 'photo-1602526432604-029a709e131b',
    heroAlt: 'De Pijp neighbourhood Amsterdam Albert Cuyp market street',
    h1: 'De Pijp',
    standfirst: "Amsterdam's food capital and most multicultural neighbourhood — where the Albert Cuyp Market has run every weekday since 1905 and the best dinner in the city costs €14.",
    facts: [
      { icon: '🌍', label: 'Character', value: 'Multicultural, foodie, young' },
      { icon: '📍', label: 'Location', value: 'South of the canal ring' },
      { icon: '🚶', label: 'Best way to explore', value: 'On foot' },
      { icon: '⏱', label: 'Time to allow', value: 'Half day minimum' },
      { icon: '🌟', label: 'Best for', value: 'Food lovers, nightlife, markets' },
      { icon: '📅', label: 'Best day to visit', value: 'Saturday (market at its liveliest)' },
    ],
    intro: `
      <p>De Pijp was built fast and cheap in the late 19th century to house Amsterdam's growing working class. The streets were laid out in a rigid grid — long, narrow blocks that gave the neighbourhood its name: "the pipe." The apartments were small, the ceilings low, and the families large. <strong>The Albert Cuyp Market started in 1905 because the residents couldn't afford shop prices.</strong> It has run on the same street every weekday since.</p>
      <p>What makes De Pijp unusual is the specific sequence of communities that settled there. Surinamese and Antillean families arrived in the 1960s and 70s. Moroccan and Turkish communities followed. Then, in the 1990s, art students and young professionals discovered the cheap rents. Today, the neighbourhood runs on that layering — you can eat roti and bara on one block, Moroccan pastilla on the next, and end the night at a craft beer bar in a converted Victorian swimming pool.</p>
      <p>De Pijp resists being tidied up. The Albert Cuyp is still genuinely working, not a tourist market — Amsterdammers shop here. The gentrification is real, but incomplete. It's the neighbourhood most likely to surprise you.</p>`,
    todos: [
      { title: 'Albert Cuyp Market (Monday–Saturday)', body: 'The largest street market in the Netherlands — 260 stalls, 1.5km long, running every weekday from 9am to 5pm. Go for raw herring (haring), stroopwafels hot off the waffle iron, Dutch cheese, Indonesian snacks, and the sheer momentum of a market that\'s been operating continuously for over a century. Saturday is the best day; arrive before noon.' },
      { title: 'Sarphatipark — the neighbourhood\'s living room', body: 'A small, beautifully maintained Victorian park in the heart of De Pijp — surrounded on all sides by the neighbourhood\'s characteristic 19th-century housing. On warm evenings, half of De Pijp seems to be here: picnics, football, wine on the grass. The park\'s ornate Victorian bandstand (1886) is one of Amsterdam\'s most photographed small structures.' },
      { title: 'Gerard Douplein — the social centre', body: 'The square at the heart of De Pijp, surrounded by outdoor café terraces that fill up at the first sign of spring sun. This is where you sit with a beer and watch the neighbourhood happen around you. On Friday evenings, the square turns into an informal party that starts at 5pm and goes until the cafés close.' },
      { title: 'Brouwerij Troost — craft beer in a swimming pool', body: 'Troost opened its De Pijp brewery in a restored 1920s swimming pool on Cornelis Troostplein. The pool has been converted into a brewing hall, keeping the original tiles, arched windows, and changing cubicles. They brew 15 beers on-site, from session IPAs to imperial stouts. The bitterballen (Dutch bar snacks) are exceptional.' },
      { title: 'Eerste van der Helststraat — independent shopping', body: 'The main shopping street of De Pijp runs parallel to the Albert Cuyp and is lined with independent businesses that have survived where chains haven\'t: a locksmith who\'s been there 40 years, a spice shop selling 200 varieties, a tiny natural wine bar. Walk the full length.' },
    ],
    bookIntro: 'De Pijp is home to the Heineken Experience and the departure point for several excellent food tours. Both are worth booking in advance, especially at weekends.',
    products: [
      { href: '/experiences/', img: 'photo-1608270586620-248524c67de9', imgAlt: 'Heineken Experience Amsterdam De Pijp brewery', cat: 'Experience', title: 'Heineken Experience', desc: 'The original 19th-century Heineken brewery is in De Pijp — a 2-hour self-guided tour ending with two complimentary beers at the rooftop bar. Book the 4pm slot and head straight to Albert Cuyp Market afterwards.', cta: 'Book + 2 Beers' },
      { href: '/tours/', img: 'photo-1602526432604-029a709e131b', imgAlt: 'De Pijp food tour Amsterdam Albert Cuyp market', cat: 'Food Tour', title: 'De Pijp Food & Market Tour', desc: 'The Albert Cuyp Market guided food tour covers 6 tastings — herring, stroopwafels, Dutch cheese, Indonesian snacks, and genever at a brown café. Includes stops most visitors walk straight past.', cta: 'Book the Food Tour' },
      { href: '/canal-cruises/', img: 'photo-1534351590666-13e3e96b5017', imgAlt: 'Amsterdam canal cruise southern canal ring', cat: 'Canal Cruise', title: 'Evening Canal Cruise', desc: 'The southern canal ring near De Pijp is quieter than the tourist-heavy Centraal area. An evening cruise from Leidseplein (10 minutes\' walk) shows the canal houses at their most beautiful.', cta: 'See Evening Cruises' },
      { href: '/tours/', img: 'photo-1589909202802-8f4aadce1849', imgAlt: 'Amsterdam guided bike tour De Pijp', cat: 'Bike Tour', title: 'Guided Bike Tour', desc: 'Most guided bike tours pass through De Pijp on their route south — a good way to see the neighbourhood\'s market streets and Sarphatipark from two wheels before heading to the Rijksmuseum.', cta: 'Book a Bike Tour' },
    ],
    eatIntro: 'De Pijp has a higher concentration of good restaurants per square metre than anywhere else in Amsterdam. These are the ones that have lasted.',
    food: [
      { tag: 'Surinamese / must-try', name: 'Roopram Roti', body: 'A Surinamese roti shop on Albert Cuypstraat that has been serving the same menu — roti, bara, chicken curry, dhal — for decades. Everything costs under €15. The queue on Saturday mornings tells you everything you need to know. Cash only.' },
      { tag: 'Coffee & brunch', name: 'CT Coffee & Coconuts', body: 'A 1920s cinema on Ceintuurbaan converted into a three-floor café with a retractable roof. The avocado toast has been excellent for years. Arrive early on weekends — the queue starts at 10am and doesn\'t stop until 2pm.' },
      { tag: 'Natural wine bar', name: 'Bar Botanique', body: 'A narrow wine bar on the edge of De Pijp serving natural and biodynamic wines alongside small plates. The decor — bare plaster, hanging plants, low light — is the template that half of Amsterdam\'s wine bars have copied since. Book a table at weekends.' },
      { tag: 'Craft beer', name: 'Brouwerij Troost De Pijp', body: 'The swimming pool brewery on Cornelis Troostplein. Order the Troost Blonde or the Weizen, get a plate of bitterballen, and spend two hours watching the neighbourhood through the arched former pool windows. One of the best drinking experiences in Amsterdam.' },
    ],
    transport: [
      { icon: '🚋', text: 'Tram 3 or 12 to Ferdinand Bolstraat stop — puts you at the top of Albert Cuypstraat in 10 minutes from the centre.' },
      { icon: '🚇', text: 'Metro 52 (North-South line) to De Pijp station — opened 2018, takes 5 minutes from Centraal Station.' },
      { icon: '🚲', text: 'De Pijp is a 10-minute cycle from the Rijksmuseum and 15 minutes from Amsterdam Centraal.' },
      { icon: '🚶', text: '20-minute walk from the Rijksmuseum along Ferdinand Bolstraat, or 25 minutes from Dam Square.' },
    ],
  },

  // ── 3. CENTRUM ─────────────────────────────────────────────────────────────
  {
    dir: 'amsterdam/centrum',
    slug: '/amsterdam/centrum/',
    name: 'Centrum',
    placeName: 'Amsterdam Centrum',
    title: 'Amsterdam Centrum Guide 2026 — Canal Ring, Dam Square & Old Town',
    desc: "The complete guide to Amsterdam Centrum — the historic canal ring, Dam Square, the Begijnhof, floating flower market, and what to do beyond the tourist crowds.",
    heroImg: 'photo-1534351590666-13e3e96b5017',
    heroAlt: 'Amsterdam Centrum canal ring houses reflection golden hour',
    h1: 'Amsterdam Centrum',
    standfirst: 'The historic heart of Amsterdam — four centuries of canal houses, the UNESCO-listed canal ring, Dam Square, and the hidden courtyards that most visitors walk straight past.',
    facts: [
      { icon: '🏛', label: 'Character', value: 'Historic, tourist-dense, magnificent' },
      { icon: '📍', label: 'Location', value: 'The city centre' },
      { icon: '🚶', label: 'Best way to explore', value: 'On foot — everything is walkable' },
      { icon: '⏱', label: 'Time to allow', value: '1–2 full days' },
      { icon: '🌟', label: 'Best for', value: 'Architecture, history, canal walks' },
      { icon: '📅', label: 'Best time', value: 'Early morning or evening' },
    ],
    intro: `
      <p>Amsterdam Centrum is the canal ring — three concentric waterways (Herengracht, Keizersgracht, Prinsengracht) dug between 1613 and 1665 that form the most intact urban landscape from the Dutch Golden Age anywhere in the world. <strong>It has been UNESCO World Heritage-listed since 2010.</strong> The canal houses lining those waterways were built by the merchants who made Amsterdam the wealthiest city on earth per capita in the 17th century. Most of them are still standing.</p>
      <p>Centrum is where Amsterdam's tourists concentrate — and for good reason. Dam Square, the Bloemenmarkt, the Begijnhof, the Royal Palace, and the entrance to the Red Light District are all within a 15-minute walk of each other. The density of history is extraordinary. But so is the density of visitors: in peak summer, Damrak and Nieuwendijk can feel more like a theme park than a city.</p>
      <p>The trick is simple: arrive early and stay late. Before 9am and after 7pm, Centrum is a different place — quieter, more beautiful, and easier to read. The canal ring at dusk, with the bridges lit and the reflections stretching across the water, is one of the great urban sights of Europe.</p>`,
    todos: [
      { title: 'Walk the Herengracht Golden Bend', body: 'The stretch of Herengracht between Leidsestraat and Vijzelstraat is known as the Golden Bend (Gouden Bocht) — the widest section of the canal ring, lined with the grandest double-fronted merchant houses. Built in the late 17th century by Amsterdam\'s wealthiest families, several still have their original interiors. Walk it on both sides; the light is better from the south bank in the afternoon.' },
      { title: 'Dam Square and the Royal Palace', body: 'Amsterdam\'s central square has been the city\'s commercial and political heart since the 13th century. The Royal Palace (1655) is the finest secular building of the Dutch Golden Age and was designed to demonstrate Amsterdam\'s supremacy. It\'s open to visitors when not in royal use. The National Monument (1956) on the east side of the square marks the Dutch war dead.' },
      { title: 'The Begijnhof — Amsterdam\'s secret courtyard', body: 'Through an unmarked door off the Spui square lies a hidden courtyard of medieval and 17th-century houses that has been inhabited continuously since the 14th century. Free entry. Visit at 9am before the tour groups arrive. The oldest wooden house in Amsterdam (c.1420) is on the north side.' },
      { title: 'Walk the canal ring — the full loop', body: 'The 6km canal ring walk is the best free thing you can do in Amsterdam. Start at Centraal Station, walk west along the IJ, turn south down the Brouwersgracht, then east along the Herengracht, Keizersgracht, and Prinsengracht. Allow 2–3 hours. The walk passes the Anne Frank House, dozens of bridge viewpoints, and the floating flower market (Bloemenmarkt) on Singel canal.' },
      { title: 'The Bloemenmarkt — the floating flower market', body: 'Amsterdam\'s floating flower market has been on the Singel canal since 1862. The stalls float on barges but haven\'t moved in decades — they\'re now fixed structures. Despite the tourist kitsch of the front stalls, the back of the market still sells genuine Dutch bulbs (tulips, narcissi, hyacinths) at prices well below what you\'d pay in a shop. Best visited in spring.' },
      { title: 'Explore beyond Damrak', body: 'The streets west of Damrak — Haarlemmerdijk, Haarlemmerstraat, and the Spui area — are where Centrum\'s independent businesses survive. Haarlemmerdijk is particularly good: cheese shops, wine merchants, small restaurants, and the Westergasfabriek cultural complex at its western end. Avoid the souvenir shops on the main tourist drag.' },
    ],
    bookIntro: 'Centrum contains or borders Amsterdam\'s most important historic sites. The canal ring is free to walk — the museums and palaces require tickets, most of which should be booked in advance.',
    products: [
      { href: '/history-heritage/', img: 'photo-1555921015-5532091f6026', imgAlt: 'Anne Frank House Amsterdam Prinsengracht Centrum', cat: 'History', title: 'Anne Frank House', desc: 'The canal house on Prinsengracht 263 where Anne Frank hid for 761 days. Requires advance online booking — no walk-ins. Time slots release on the 1st of each month.', cta: 'Reserve Your Slot' },
      { href: '/history-heritage/', img: 'photo-1534351590666-13e3e96b5017', imgAlt: 'Royal Palace Amsterdam Dam Square', cat: 'History', title: 'Royal Palace Amsterdam', desc: 'The greatest civic building of the Dutch Golden Age — built in 1655 on 13,659 wooden piles. Open to visitors when not in royal use. The Citizens\' Hall alone is worth the ticket.', cta: 'Book Palace Tickets' },
      { href: '/canal-cruises/', img: 'photo-1534351590666-13e3e96b5017', imgAlt: 'Amsterdam canal cruise Centrum historic ring', cat: 'Canal Cruise', title: 'Canal Ring Cruise', desc: 'The canal ring looks completely different from water level. Classic glass-roof boats depart every 30 minutes from several points near Centraal Station and the Leidseplein.', cta: 'See All Cruises' },
      { href: '/history-heritage/', img: 'photo-1558618666-fcd25c85cd64', imgAlt: 'Begijnhof Amsterdam Centrum hidden courtyard', cat: 'History', title: 'Begijnhof', desc: 'Free entry. One of the most surprising places in Amsterdam — a medieval courtyard hidden behind an unmarked door, 10 minutes\' walk from Dam Square.', cta: 'Plan Your Visit' },
    ],
    eatIntro: "Centrum is full of tourist traps — but there are excellent places if you know where to look. The rule is simple: the further from Damrak, the better the food.",
    food: [
      { tag: 'Grand café / canal view', name: 'Café de Jaren', body: 'A two-floor grand café on the Amstel river with one of the best terraces in Amsterdam — right on the waterfront, with unobstructed views down the river. The lunch menu is reliable and reasonably priced for the location. The reading table upstairs has newspapers from 30 countries.' },
      { tag: 'Local lunch', name: 'Café Luxembourg', body: 'The best brasserie on the Spui square — a proper Amsterdam grand café with banquette seating, tiled floors, and a menu that does both the Dutch uitsmijter (fried egg on bread with ham) and a solid steak frites. Been here since 1983. Order at the bar.' },
      { tag: 'Dutch snacks', name: 'Frens Haringhandel', body: 'A herring cart on the corner of Spui — the best place in Centrum to try haring (raw herring), broodje haring (herring on a roll with onions and gherkins), or kibbeling (battered fried cod). Stand up and eat it. This is what Amsterdam has eaten for lunch since the 15th century.' },
      { tag: 'Pancakes (Dutch classic)', name: 'Pannenkoekenhuis Upstairs', body: 'Tucked up a near-vertical staircase on Grimburgwal, this tiny restaurant (eight tables) has been serving Dutch pancakes since 1956. Reservations are taken by phone only. The pancakes with bacon and syrup are the thing to order. Be warned: the stairs are genuinely steep.' },
    ],
    transport: [
      { icon: '🚆', text: 'Amsterdam Centraal Station is the gateway to Centrum — all trams, metros, and ferries depart from here. Schiphol Airport is 17 minutes away by direct train.' },
      { icon: '🚋', text: 'Trams 2, 11, 12, 13, 17 all run through Centrum — but most of the area is faster and more enjoyable on foot.' },
      { icon: '🚶', text: 'The Centrum canal ring is extremely compact — you can walk from Centraal Station to the Rijksmuseum in 25 minutes. Most attractions are within 10 minutes of each other.' },
      { icon: '🚲', text: 'Cycling in Centrum is possible but the main streets (Damrak, Rokin) are busy. Stick to the canal-side paths and quieter cross streets.' },
    ],
  },

  // ── 4. NOORD ───────────────────────────────────────────────────────────────
  {
    dir: 'amsterdam/noord',
    slug: '/amsterdam/noord/',
    name: 'Amsterdam Noord',
    placeName: 'Amsterdam Noord',
    title: 'Amsterdam Noord Guide 2026 — The Creative Quarter Across the IJ',
    desc: "The complete guide to Amsterdam Noord — NDSM wharf, A'DAM Lookout, STRAAT Museum, Eye Filmmuseum, and the best food and culture across the IJ from Centraal Station.",
    heroImg: 'photo-1589909202802-8f4aadce1849',
    heroAlt: 'Amsterdam Noord NDSM wharf IJ waterway creative district',
    h1: 'Amsterdam Noord',
    standfirst: "Five minutes across the IJ from Centraal Station — Amsterdam's creative quarter in a former shipyard. Street art the size of buildings, rooftop observation decks, and a beach bar on the waterfront.",
    facts: [
      { icon: '🏭', label: 'Character', value: 'Creative, industrial, up-and-coming' },
      { icon: '📍', label: 'Location', value: 'North of the IJ waterway' },
      { icon: '⛴', label: 'Getting there', value: 'Free GVB ferry from Centraal' },
      { icon: '⏱', label: 'Time to allow', value: 'Half day to full day' },
      { icon: '🌟', label: 'Best for', value: 'Art, views, alternative culture' },
      { icon: '📅', label: 'Best day to visit', value: 'Last Sunday (NDSM flea market)' },
    ],
    intro: `
      <p>Amsterdam Noord was, for most of its history, the city Amsterdam pretended didn't exist. The IJ waterway kept it separate from the historic centre — no bridges, no trams, just the free ferry that workers took to the shipyards every morning. The NDSM wharf (Nederlandsche Dok en Scheepsbouw Maatschappij) employed 10,000 people at its peak. When the last shipyard closed in 1984, it took most of the neighbourhood's economy with it.</p>
      <p><strong>Then the artists arrived.</strong> In the 1990s, squatters took over the abandoned NDSM buildings. The city, unable to evict them, eventually formalised the arrangement. Studios, cultural venues, and creative businesses followed. Today the NDSM wharf is Amsterdam's most concentrated creative district — home to Greenpeace's international headquarters, MTV Netherlands, and some of the most significant street art in Europe.</p>
      <p>Noord is still in transition. The free ferry from Centraal Station takes five minutes and delivers you to a neighbourhood that feels genuinely different from the tourist-dense historic centre. The views back across the IJ — the water, the station, the medieval city behind it — are some of the best in Amsterdam. Come for a half-day. Stay for a full one.</p>`,
    todos: [
      { title: "A'DAM Lookout — 360° views across the IJ", body: "The former Shell oil company headquarters has been converted into a cultural complex with a 360° observation deck on the 20th floor. The views across the IJ waterway and into the historic Centrum are the best elevated views available anywhere in Amsterdam. Add the Over the Edge swing (€5 extra) if you're not afraid of heights. 100 metres above the ground, swinging out over the building edge." },
      { title: 'STRAAT Museum — the world\'s largest street art museum', body: 'An 8,800 square metre former shipyard building, covered floor-to-ceiling with commissioned murals by 150 international street artists. The scale makes it unlike anywhere else in Amsterdam — works that would be impressive outdoors are overwhelming inside. Allow 2 hours. The building alone is worth the ferry trip.' },
      { title: 'Eye Filmmuseum', body: "The Eye Filmmuseum occupies a 2012 Delugan Meissl-designed building on the IJ waterfront — angular, white, and immediately recognisable from the Centraal Station ferry terminal. The building is free to enter and worth seeing as architecture alone. The permanent exhibition on film history is included with a film ticket; screenings run daily including rare silent films with live musical accompaniment." },
      { title: 'NDSM flea market (last Sunday of the month)', body: 'The largest flea market in the Netherlands runs on the last Sunday of each month on the NDSM wharf — 300+ stalls selling vintage clothing, furniture, vinyl records, and general oddities. It runs from 9am to 5pm. The combination of the industrial setting, the scale, and the genuinely eclectic selection makes this one of the best market days in Amsterdam.' },
      { title: 'Café de Ceuvel — sustainability on a contaminated plot', body: 'De Ceuvel is a social enterprise built on a former industrial plot beside the NDSM wharf — contaminated land that couldn\'t be developed. A collective of architects converted 16 old houseboats into studios and a café, connected by raised wooden walkways. Solar-powered, composting toilets, and an in-house brewery. The terrace is one of the most atmospheric drinking spots in Amsterdam.' },
    ],
    bookIntro: "Noord's major attractions are bookable in advance — the A'DAM Lookout and STRAAT Museum both sell tickets online. The ferry is free and runs 24 hours.",
    products: [
      { href: '/experiences/', img: 'photo-1589909202802-8f4aadce1849', imgAlt: "A'DAM Lookout tower Amsterdam Noord observation deck", cat: 'Views & Experience', title: "A'DAM Lookout", desc: "360° observation deck + the Over the Edge swing. Best views of Amsterdam, full stop. Book online — the last entry is 30 minutes before closing. Add the swing for €5 if you can face it.", cta: 'Book the Lookout' },
      { href: '/museums/', img: 'photo-1536924940846-227afb31e2a5', imgAlt: 'STRAAT Museum Amsterdam NDSM street art', cat: 'Museum', title: 'STRAAT Museum', desc: "The world's largest street art museum — 150 artists, 8,800 square metres of murals in a former shipyard. Located at the NDSM wharf, 5 minutes by free ferry from Centraal.", cta: 'Book STRAAT Tickets' },
      { href: '/experiences/', img: 'photo-1534351590666-13e3e96b5017', imgAlt: 'THIS IS HOLLAND flying experience Amsterdam Noord', cat: 'Experience', title: 'THIS IS HOLLAND', desc: "A 4D flying experience that takes you over the Netherlands at low altitude — tulip fields, windmills, Rotterdam's port, and the Amsterdam canal ring from the air. In the same building as the A'DAM Lookout.", cta: 'Book the Flight' },
      { href: '/experiences/', img: 'photo-1536924940846-227afb31e2a5', imgAlt: 'Nxt Museum Amsterdam Noord digital art new media', cat: 'Museum', title: 'Nxt Museum', desc: "Amsterdam's museum of new media art — digital, generative, and interactive works in a converted transformer station. 3,500 square metres of industrial space turned over to works that respond to movement and live data.", cta: 'Book Nxt Museum' },
    ],
    eatIntro: 'Noord has developed its own food scene — less tourist-facing than the historic centre, and more interesting for it. These are the places residents and creatives actually use.',
    food: [
      { tag: 'Waterfront beach bar', name: 'Pllek', body: "A beach bar and restaurant built from shipping containers on the IJ waterfront, 10 minutes' walk from the NDSM ferry stop. Sand on the ground, the Amsterdam skyline across the water, and a menu that does both a good burger and a proper fish dish. In summer this is one of the most pleasant outdoor drinking spots in the city." },
      { tag: 'Sustainable café', name: 'Café de Ceuvel', body: 'A solar-powered café and social enterprise on a contaminated industrial plot, built from converted houseboats connected by raised wooden walkways. The terrace is unlike anywhere else in Amsterdam. The homemade lemonade and the rotating local beer selection are both good. The composting toilet is part of the experience.' },
      { tag: 'Seafood restaurant', name: 'Stork', body: "A large seafood restaurant in a former Fokker aircraft factory on the IJ waterfront — 15-metre ceilings, industrial fittings, and a menu built around North Sea fish. Expensive by Amsterdam standards (€35–50 for a main) but the setting is extraordinary and the quality matches. Book well ahead for evenings." },
      { tag: 'NDSM food trucks', name: 'NDSM Wharf food vendors', body: 'On market days and during cultural events, the NDSM wharf fills with food trucks ranging from decent to excellent. The permanent café inside the STRAAT Museum building is a reliable option for lunch on non-market days — industrial setting, good coffee, simple food.' },
    ],
    transport: [
      { icon: '⛴', text: 'Free GVB ferry from behind Amsterdam Centraal Station — the Buiksloterweg and IJplein ferries run 24/7. The NDSM ferry runs less frequently (check the schedule) but lands closest to the creative district.' },
      { icon: '🚲', text: 'Take your bike on the ferry (free) and cycle around Noord — the area is flat and well-connected by cycling paths. This is the best way to combine the NDSM wharf, Eye Filmmuseum, and A\'DAM Lookout in one visit.' },
      { icon: '🚌', text: 'Several bus lines connect Noord to the rest of Amsterdam, but the ferry is almost always faster and more pleasant.' },
      { icon: '⏱', text: "The ferry crossing takes 5 minutes. The ferries run continuously throughout the day — you'll rarely wait more than 10 minutes." },
    ],
  },

  // ── 5. MUSEUMPLEIN ─────────────────────────────────────────────────────────
  {
    dir: 'amsterdam/museumplein',
    slug: '/amsterdam/museumplein/',
    name: 'Museumplein',
    placeName: 'Museumplein, Amsterdam',
    title: 'Museumplein Amsterdam Guide 2026 — Rijksmuseum, Van Gogh & More',
    desc: "The complete guide to Museumplein — Rijksmuseum, Van Gogh Museum, Stedelijk, Vondelpark, and the best cafés and restaurants in Amsterdam's museum quarter.",
    heroImg: 'photo-1569429593410-b498b3fb3387',
    heroAlt: 'Museumplein Amsterdam Rijksmuseum lawn cycle',
    h1: 'Museumplein',
    standfirst: 'Three world-class museums on one lawn — the Rijksmuseum, Van Gogh, and Stedelijk are all within a 5-minute walk of each other. Add Vondelpark and the best shopping street in Amsterdam and you have a full day.',
    facts: [
      { icon: '🎨', label: 'Character', value: 'Cultural, residential, upscale' },
      { icon: '📍', label: 'Location', value: 'South of Leidseplein' },
      { icon: '🚶', label: 'Best way to explore', value: 'On foot between museums' },
      { icon: '⏱', label: 'Time to allow', value: '1–2 full days (museums alone = 1 day)' },
      { icon: '🌟', label: 'Best for', value: 'Art lovers, families, shoppers' },
      { icon: '📅', label: 'Best time', value: 'Open at 9am — arrive early' },
    ],
    intro: `
      <p>In 1877, the city of Amsterdam set aside a large open field south of the Leidseplein for culture. The Rijksmuseum (1885), the Concertgebouw (1888), and what would eventually become the Van Gogh Museum and Stedelijk Museum were all built on or around this space over the following decades. The result — three world-class institutions sharing a single square kilometre of lawn — is one of the great concentrations of cultural infrastructure anywhere in Europe.</p>
      <p><strong>On a good day, you can walk from Rembrandt's Night Watch to Van Gogh's Sunflowers to a Mondrian in under fifteen minutes.</strong> Add the Moco Museum (Banksy and contemporary art), the Concertgebouw (free lunchtime concerts on Wednesdays), and the Vondelpark (five minutes from the museums), and you have a cultural district that rivals anything in London, Paris, or New York — at a fraction of the price.</p>
      <p>The neighbourhood around Museumplein — Oud-Zuid — is also one of Amsterdam's most pleasant residential areas: wide leafy streets, independent cafés on Van Baerlestraat, and the PC Hooftstraat shopping street (Amsterdam's equivalent of Bond Street) for those who want to spend more than museum entry prices.</p>`,
    todos: [
      { title: 'Rijksmuseum — arrive at 9am', body: "The Rijksmuseum opens at 9am and closes at 5pm. The Night Watch is most manageable in the first hour — by 11am the Gallery of Honour is dense with tour groups. Book timed entry online. Allow 2.5 hours minimum. The museum garden (free) is worth 15 minutes of your time before or after." },
      { title: 'Van Gogh Museum — book well in advance', body: "5 minutes' walk from the Rijksmuseum, on the eastern edge of Museumplein. Online booking is mandatory — no walk-ups. The museum holds 200 paintings and 500 drawings, arranged chronologically. Friday evening sessions (6–9pm) are the quietest. Allow 1.5–2 hours." },
      { title: 'Sit on the Museumplein lawn', body: 'The Museumplein lawn is free. In summer it\'s where Amsterdammers picnic, children play football, and tourists eat their rijsttafel takeaway with the Rijksmuseum as backdrop. In winter it hosts an outdoor skating rink. The large AMSTERDAM sign (the I AMsterdam letters have moved, but the IJ logo remains) is at the eastern end.' },
      { title: 'Walk to Vondelpark (5 minutes)', body: 'Vondelpark is a 5-minute walk west from the Rijksmuseum — 47 hectares of lawns, ponds, and cycling paths that serve as Amsterdam\'s back garden. From June to August, the open-air theatre runs free concerts and performances every weekend. No booking required.' },
      { title: "PC Hooftstraat — Amsterdam's luxury shopping street", body: "The PC Hooftstraat runs along the southern edge of Museumplein and contains Amsterdam's highest concentration of designer and luxury retail — Gucci, Hermès, Louis Vuitton, Chanel, and several Dutch designers. Even if you're not buying, the street is worth a walk for the architecture (all 19th-century townhouses) and the window displays." },
      { title: 'Stedelijk Museum — same square, completely different art', body: 'The Stedelijk is directly adjacent to the Van Gogh Museum and covers modern and contemporary art from 1870 to the present — Mondrian, Kandinsky, Matisse, and Dutch Design. The controversial white "bathtub" annex (2012) is more interesting inside than the hostile exterior suggests. Rarely sells out.' },
    ],
    bookIntro: 'All three major Museumplein museums require advance online booking, especially in summer. The Rijksmuseum and Van Gogh Museum can sell out days ahead — book before you arrive in Amsterdam.',
    products: [
      { href: '/museums/', img: 'photo-1569429593410-b498b3fb3387', imgAlt: 'Rijksmuseum Amsterdam Museumplein facade', cat: 'Museum', title: 'Rijksmuseum', desc: '8,000 objects, 80 rooms, the Night Watch — the greatest Dutch Golden Age collection in the world. Timed entry, book online. Arrives at 9am for the quietest experience.', cta: 'Book Timed Entry' },
      { href: '/museums/', img: 'photo-1634228011564-0b1ad7b8dc2e', imgAlt: 'Van Gogh Museum Amsterdam interior artworks', cat: 'Museum', title: 'Van Gogh Museum', desc: "200 paintings, 500 drawings, the world's largest Van Gogh collection. No walk-ups accepted — online booking only. Friday evenings are the quietest time slot.", cta: 'Book Van Gogh Tickets' },
      { href: '/museums/', img: 'photo-1536924940846-227afb31e2a5', imgAlt: 'Stedelijk Museum Amsterdam modern art bathtub', cat: 'Museum', title: 'Stedelijk Museum', desc: 'Mondrian to Matisse to Dutch Design — modern and contemporary art on the same square as the Rijksmuseum and Van Gogh. Rarely sells out; good for same-day booking.', cta: 'Book Stedelijk Tickets' },
      { href: '/museums/', img: 'photo-1520250497591-112f2f40a3f4', imgAlt: 'Moco Museum Amsterdam Banksy Museumplein villa', cat: 'Museum', title: 'Moco Museum', desc: "Permanent Banksy collection plus rotating contemporary shows in a 1904 villa on Museumplein. The only dedicated Banksy museum in the world. Pairs perfectly with a Rijksmuseum morning.", cta: 'Book Moco Tickets' },
    ],
    eatIntro: 'The streets around Museumplein — particularly Van Baerlestraat and Cornelis Schuytstraat — have a good concentration of cafés and restaurants that serve the local residential crowd, not just museum visitors.',
    food: [
      { tag: 'Museum-side café', name: 'Café Cobra', body: 'On the Museumplein lawn, directly opposite the Van Gogh Museum, with a terrace that looks across to the Rijksmuseum. The name comes from the COBRA art movement (Copenhagen–Brussels–Amsterdam), and the interior reflects it. A reliable option for lunch between museums — the soup and sandwiches are good value.' },
      { tag: 'Breakfast / brunch', name: 'De Bakkerswinkel', body: 'A bakery and café on Roelof Hartstraat, 5 minutes from the Rijksmuseum. Arguably the best breakfast in Amsterdam — excellent bread, proper coffee, and Dutch pastries baked on the premises. Arrive before 9am on weekends to get a table.' },
      { tag: 'Neighbourhood dinner', name: 'Brasserie van Baerle', body: 'The best restaurant on Van Baerlestraat — a classic French-Dutch brasserie that has been feeding Oud-Zuid residents since 1993. The steak tartare and the sole meunière are the things to order. Book ahead for evenings.' },
      { tag: 'Quick lunch', name: 'Scandinavian Embassy', body: 'A Scandinavian-influenced café on Sarphatipark (15 minutes from Museumplein) that does exceptional open sandwiches (smørrebrød), good filter coffee, and the best cinnamon buns in Amsterdam. Small, often full — arrive early.' },
    ],
    transport: [
      { icon: '🚋', text: 'Tram 2 or 5 from Amsterdam Centraal to Hobbemastraat stop — 15 minutes. This puts you directly in front of the Rijksmuseum.' },
      { icon: '🚲', text: "Cycling from Centraal to Museumplein takes about 15 minutes via the Singel and Leidsegracht. The bike lanes on Stadhouderskade run directly to the museum quarter." },
      { icon: '🚶', text: '30-minute walk from Amsterdam Centraal through the Jordaan and Vondelpark — a pleasant route that lets you see two neighbourhoods on the way to the museums.' },
      { icon: '💡', text: 'The Museumkaart (€65, valid for one month) gives unlimited entry to 400+ Dutch museums including the Rijksmuseum, Van Gogh, and Stedelijk. Worth it if you plan to visit all three.' },
    ],
  },

];

// ── Write all 5 neighbourhood pages ────────────────────────────────────────
neighbourhoods.forEach(nb => {
  const dir = path.join(BASE, nb.dir);
  fs.mkdirSync(dir, { recursive: true });
  const html = buildPage(nb);
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
  console.log(`OK  ${nb.dir}/index.html  (${Math.round(html.length / 1024)}KB)`);
});

console.log('\nAll 5 neighbourhood pages written.');
