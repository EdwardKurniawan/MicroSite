const fs = require('fs');
const path = require('path');
const { ROOT_DIR, getCityDir, getCityPath } = require('../lib/project-paths');

const PACKAGE_JSON_PATH = path.join(ROOT_DIR, 'package.json');
const CITY_REGISTRY_PATH = path.join(ROOT_DIR, 'config', 'cities.json');
const DEFAULT_ACCENT = '#C56B2B';
const DEFAULT_ACCENT_DARK = '#9C4F19';
const DEFAULT_ACCENT_LIGHT = '#F9EEE6';
const DEFAULT_YEAR = new Date().getFullYear();
const DEFAULT_DOMAIN = 'travelsides.com';

function parseArgs(argv) {
  const args = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (!token.startsWith('--')) {
      continue;
    }

    const key = token.slice(2);
    const next = argv[i + 1];

    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }

    args[key] = next;
    i += 1;
  }

  return args;
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function titleCaseFromSlug(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data, dryRun) {
  if (dryRun) return;
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function ensureDir(dirPath, dryRun) {
  if (dryRun) return;
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeFile(filePath, content, dryRun) {
  if (dryRun) return;
  fs.writeFileSync(filePath, content);
}

function detectNextPort(pkg) {
  const devPorts = Object.entries(pkg.scripts || {})
    .filter(([name]) => name.startsWith('dev:'))
    .map(([, command]) => {
      const match = command.match(/PORT=(\d+)/);
      return match ? Number(match[1]) : null;
    })
    .filter(Boolean);

  return devPorts.length ? Math.max(...devPorts) + 1 : 3001;
}

function buildGlobalNetwork(slug, cityRecords) {
  return cityRecords
    .filter(city => city.slug !== slug)
    .slice(0, 4)
    .map(city => ({
      name: `${titleCaseFromSlug(city.slug)} Insider`,
      url: `https://${city.slug}-insider.com`
    }));
}

function createDefaultCategories(cityName, citySlug) {
  return [
    {
      slug: 'highlights',
      title: 'Top Highlights',
      count: '6 highlights',
      description: `The essential first-pass guide to the headline sights, signature experiences, and easiest wins in ${cityName}.`,
      eyebrow: 'Top Highlights'
    },
    {
      slug: 'museums-culture',
      title: 'Museums & Culture',
      count: '5 picks',
      description: `A starter collection of museums, galleries, landmarks, and cultural anchors worth shaping a trip around in ${cityName}.`,
      eyebrow: 'Museums & Culture'
    },
    {
      slug: 'food-drink',
      title: 'Food & Drink',
      count: '5 picks',
      description: `Use this category to map the market halls, signature dishes, neighbourhood cafes, and higher-end dining in ${cityName}.`,
      eyebrow: 'Food & Drink'
    },
    {
      slug: 'day-trips',
      title: 'Day Trips',
      count: '4 escapes',
      description: `Nearby towns, nature, coastlines, or heritage sites that make sense as half-day or full-day escapes from ${cityName}.`,
      eyebrow: 'Day Trips'
    }
  ].map(category => ({
    ...category,
    url: `/${citySlug}/${category.slug}/`,
    cta: `Explore ${category.title}`,
    alt: `${category.title} in ${cityName}`,
    image: `/${citySlug}/images/category-${category.slug}.svg`
  }));
}

function createDefaultNeighbourhoods(cityName, citySlug) {
  return [
    {
      slug: 'old-town',
      name: 'Old Town',
      tagline: 'Historic core · landmarks · walkable streets'
    },
    {
      slug: 'creative-quarter',
      name: 'Creative Quarter',
      tagline: 'Design spots · nightlife · independent energy'
    },
    {
      slug: 'market-district',
      name: 'Market District',
      tagline: 'Food halls · daily life · local rhythm'
    },
    {
      slug: 'riverside',
      name: 'Riverside',
      tagline: 'Views · promenades · slower pace'
    }
  ].map(neighbourhood => ({
    ...neighbourhood,
    url: `/${citySlug}/${neighbourhood.slug}/`,
    image: `/${citySlug}/images/neighbourhood-${neighbourhood.slug}.svg`,
    alt: `${neighbourhood.name} in ${cityName}`,
    title: `${neighbourhood.name} ${cityName} Guide ${DEFAULT_YEAR}`,
    desc: `Starter guide to ${neighbourhood.name} in ${cityName}. Replace this with a sharper local angle once research is ready.`,
    h1: `${neighbourhood.name}`,
    standfirst: `${neighbourhood.name} is one of the most useful starting districts to map once you begin local research for ${cityName}.`,
    facts: [
      { icon: '📍', label: 'Location', value: `Update the best one-line location note for ${neighbourhood.name}.` },
      { icon: '🌟', label: 'Best for', value: 'Add the ideal traveler profile for this district.' },
      { icon: '🚶', label: 'Best way', value: 'Walking, transit, bike, or taxi — update after local research.' },
      { icon: '🕒', label: 'Best time', value: 'Add the time of day or season this area shines.' }
    ]
  }));
}

function createCityData(options, cityRecords) {
  const categories = createDefaultCategories(options.cityName, options.citySlug);
  const neighbourhoods = createDefaultNeighbourhoods(options.cityName, options.citySlug);

  return {
    city_url: `/${options.citySlug}/`,
    city_name: options.cityName,
    footer_categories: categories.slice(0, 4).map(category => ({
      title: category.title,
      url: category.url
    })),
    global_network: buildGlobalNetwork(options.citySlug, cityRecords),
    meta_title: `Top Things To Do in ${options.cityName} (${DEFAULT_YEAR} City Guide)`,
    meta_description: `Start building your ${DEFAULT_YEAR} guide to ${options.cityName}. Replace this starter copy with local insight, real booking advice, and city-specific SEO.`,
    canonical_url: `https://${DEFAULT_DOMAIN}/${options.citySlug}/`,
    og_title: `Top Things To Do in ${options.cityName} (${DEFAULT_YEAR} City Guide)`,
    og_description: `Starter guide structure for ${options.cityName}. Replace with a real editorial angle before launch.`,
    og_image: `https://${DEFAULT_DOMAIN}/${options.citySlug}/images/hero.svg`,
    theme_accent: options.accent,
    theme_accent_dark: options.accentDark,
    theme_accent_light: options.accentLight,
    country: options.country,
    author_name: options.authorName,
    author_slug: options.authorSlug,
    updated_date: `${DEFAULT_YEAR}-01-01`,
    read_time: '10 min read',
    hero_image: `/${options.citySlug}/images/hero.svg`,
    hero_alt: `${options.cityName} skyline placeholder`,
    hero_eyebrow: `${options.flag || '🌍'} ${options.cityName} Insider Guide`,
    hero_h1: `Best Things To Do in ${options.cityName}`,
    hero_tagline: `Starter city scaffold for ${options.cityName}. Replace this with a sharper local promise once the real editorial build begins.`,
    standfirst: `${options.cityName} needs a strong editorial thesis here. Use this scaffold to define why the city matters and how your guide is different.`,
    intro_text: `<p>${options.cityName} is now wired into the shared TravelSides template architecture. This starter guide is intentionally generic so you can replace it with researched, city-specific copy without rebuilding the site structure.</p><p>Start by refining the positioning, categories, neighbourhoods, and quick facts below. Then add real images, venue inventory, and booking guidance.</p>`,
    intro_html: `<p>${options.cityName} is now wired into the shared TravelSides template architecture. This starter guide is intentionally generic so you can replace it with researched, city-specific copy without rebuilding the site structure.</p><p>Start by refining the positioning, categories, neighbourhoods, and quick facts below. Then add real images, venue inventory, and booking guidance.</p>`,
    quick_info: [
      { icon: '📅', label: 'Ideal Trip Length', value: 'Replace with the recommended trip length.' },
      { icon: '🌤', label: 'Best Time to Visit', value: 'Replace with real seasonal guidance.' },
      { icon: '💶', label: 'Typical Daily Budget', value: 'Replace with local cost guidance.' },
      { icon: '🚆', label: 'Getting Around', value: 'Replace with the most useful transport summary.' }
    ],
    category_intro: `Starter category structure for ${options.cityName}. Replace with a real editorial summary once categories are finalized.`,
    categories,
    itinerary_days: 3,
    itinerary_intro: `Use this section to turn ${options.cityName} into a practical 2-4 day itinerary once the guide is researched.`,
    itinerary_tip_bold: 'Booking tip:',
    itinerary_tip_html: 'Replace this with the one reservation or timing note that matters most for this city.',
    itinerary: [],
    neighbourhoods,
    weather_intro: `Add a useful seasonality summary for ${options.cityName}.`,
    weather_note: 'Replace this with the months that matter most for planning.',
    weather: [],
    faqs: [
      { q: `How many days do you need in ${options.cityName}?`, a: 'Replace with a practical answer once the itinerary is defined.' },
      { q: `What is ${options.cityName} best known for?`, a: 'Replace with the city’s strongest traveler-facing hook.' },
      { q: `What should you book in advance in ${options.cityName}?`, a: 'Replace with the attractions or seasons that actually sell out.' }
    ]
  };
}

function createCategoryData(cityName, citySlug, category) {
  return {
    title: `${category.title} in ${cityName}`,
    eyebrow: category.eyebrow,
    standfirst: `Starter page for ${category.title.toLowerCase()} in ${cityName}. Replace this with a tighter local angle.`,
    hero_image: category.image,
    intro_html: `<p>This is the starter page for ${category.title.toLowerCase()} in ${cityName}. Replace the opening with original local knowledge, then add real attractions, booking logic, and practical advice.</p>`,
    attractions: [
      {
        id: `${category.slug}-anchor`,
        name: `${category.title} Placeholder`,
        category: category.title,
        badge: 'Starter',
        image_url: `/${citySlug}/images/placeholder-venue.svg`,
        description: `<p>Replace this card with the first real attraction, venue, or experience you want this category to lead with in ${cityName}.</p>`,
        price: 'Add price'
      }
    ],
    facts: [
      { icon: '🎯', label: 'Best for', value: `Who should use this ${category.title.toLowerCase()} category?` },
      { icon: '🕒', label: 'Time needed', value: 'Add a practical time estimate.' }
    ],
    getting_there: [
      { icon: '🚇', text: `Add the transport or access note people need for ${category.title.toLowerCase()} in ${cityName}.` }
    ],
    faqs: [
      { q: `What is the best ${category.title.toLowerCase()} pick in ${cityName}?`, a: 'Replace with your strongest editorial recommendation.' }
    ]
  };
}

function createNeighbourhoodData(cityName, citySlug, neighbourhood) {
  return {
    title: `${neighbourhood.name} in ${cityName}`,
    eyebrow: `📍 ${neighbourhood.name}`,
    standfirst: neighbourhood.standfirst,
    hero_image: neighbourhood.image,
    intro_html: `<p>${neighbourhood.name} is a starter neighbourhood page for ${cityName}. Replace this with the local context, best walking route, and practical reasons people should spend time here.</p>`,
    todos: [
      {
        num: '01',
        title: 'Anchor experience',
        description: `Replace with the best first thing to do in ${neighbourhood.name}.`,
        image: `/${citySlug}/images/placeholder-venue.svg`
      }
    ],
    foods: [
      {
        tag: 'Starter',
        title: 'Signature food stop',
        description: `Replace with the cafe, market, bar, or restaurant that best represents ${neighbourhood.name}.`
      }
    ],
    facts: neighbourhood.facts,
    getting_there: [
      { icon: '🚶', text: `Add the easiest way to reach ${neighbourhood.name} from the city center.` }
    ],
    faqs: [
      { q: `Is ${neighbourhood.name} worth visiting in ${cityName}?`, a: 'Replace with a crisp local answer and who it suits best.' }
    ]
  };
}

function createAuthorPage(options) {
  const escapedAuthor = escapeHtml(options.authorName);
  const escapedCity = escapeHtml(options.cityName);
  const escapedCountry = escapeHtml(options.country);
  const canonical = `https://${DEFAULT_DOMAIN}/${options.citySlug}/authors/${options.authorSlug}/`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapedAuthor} - ${escapedCity} Local Expert</title>
  <meta name="description" content="${escapedAuthor} is the local expert placeholder for ${escapedCity}. Replace this with a real author bio before launch." />
  <link rel="canonical" href="${canonical}" />
  <link rel="stylesheet" href="/shared/index.css">
  <link rel="stylesheet" href="/shared/global-nav.css">
  <script src="/shared/global-nav.js" defer></script>
  <script>
    window.CITY_NAME = "${escapedCity}";
    window.CITY_SLUG = "${options.citySlug}";
  </script>
</head>
<body class="bg-[#02060D] text-[#EEF4FF] overflow-x-hidden min-h-screen">
  <main class="max-w-4xl mx-auto px-5 py-24">
    <section class="glass-card rounded-[2.5rem] border border-white/10 p-10 md:p-14">
      <span class="text-gold text-[10px] font-accent font-black tracking-[0.4em] uppercase mb-4 block">Author Profile</span>
      <h1 class="font-display text-4xl md:text-6xl font-bold text-white mb-4">${escapedAuthor}</h1>
      <p class="text-white/60 text-lg mb-8">${escapedCity}, ${escapedCountry}</p>
      <div class="prose prose-invert prose-lg text-white/70 max-w-none">
        <p>This is the starter author profile for ${escapedAuthor}. Replace this page with a real biography, experience credentials, bylines, and editorial focus before launch.</p>
        <p>Suggested additions: years in ${escapedCity}, topics covered, publications, credentials, and why this person is qualified to guide travelers here.</p>
      </div>
    </section>
  </main>
</body>
</html>
`;
}

function createPlaceholderSvg(label, accent, detail) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" role="img" aria-label="${escapeHtml(label)}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#02060D" />
      <stop offset="100%" stop-color="${accent}" />
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#bg)" />
  <circle cx="1270" cy="180" r="180" fill="rgba(255,255,255,0.06)" />
  <circle cx="300" cy="760" r="220" fill="rgba(255,255,255,0.04)" />
  <text x="120" y="380" fill="#D4AF37" font-family="Georgia, serif" font-size="42" font-weight="700" letter-spacing="12">TRAVELSIDES</text>
  <text x="120" y="500" fill="#FFFFFF" font-family="Georgia, serif" font-size="112" font-weight="700">${escapeHtml(label)}</text>
  <text x="120" y="575" fill="rgba(255,255,255,0.75)" font-family="Arial, sans-serif" font-size="34">${escapeHtml(detail)}</text>
</svg>
`;
}

function createCitySkeleton(options, cityRecords, dryRun) {
  const cityDir = getCityDir(options.citySlug);
  const imagesDir = getCityPath(options.citySlug, 'images');
  const venuesDir = getCityPath(options.citySlug, 'images', 'venues');
  const authorDir = getCityPath(options.citySlug, 'authors', options.authorSlug);
  const cityData = createCityData(options, cityRecords);

  if (fs.existsSync(cityDir) && !options.force) {
    throw new Error(`City folder already exists: ${cityDir}. Re-run with --force only if you really want to overwrite files.`);
  }

  ensureDir(cityDir, dryRun);
  ensureDir(imagesDir, dryRun);
  ensureDir(venuesDir, dryRun);
  ensureDir(authorDir, dryRun);

  writeJson(getCityPath(options.citySlug, 'data.json'), cityData, dryRun);
  writeFile(getCityPath(options.citySlug, 'authors', options.authorSlug, 'index.html'), createAuthorPage(options), dryRun);
  writeFile(getCityPath(options.citySlug, 'images', 'hero.svg'), createPlaceholderSvg(options.cityName, options.accent, `${options.country} starter hero image`), dryRun);
  writeFile(getCityPath(options.citySlug, 'images', 'placeholder-venue.svg'), createPlaceholderSvg(`${options.cityName} Venue`, options.accentDark, 'Replace with a real venue image'), dryRun);

  for (const category of cityData.categories) {
    ensureDir(getCityPath(options.citySlug, category.slug), dryRun);
    writeJson(
      getCityPath(options.citySlug, category.slug, 'data.json'),
      createCategoryData(options.cityName, options.citySlug, category),
      dryRun
    );
    writeFile(
      getCityPath(options.citySlug, 'images', `category-${category.slug}.svg`),
      createPlaceholderSvg(`${options.cityName} ${category.title}`, options.accent, `Starter category image for ${category.title}`),
      dryRun
    );
  }

  for (const neighbourhood of cityData.neighbourhoods) {
    ensureDir(getCityPath(options.citySlug, neighbourhood.slug), dryRun);
    writeJson(
      getCityPath(options.citySlug, neighbourhood.slug, 'data.json'),
      createNeighbourhoodData(options.cityName, options.citySlug, neighbourhood),
      dryRun
    );
    writeFile(
      getCityPath(options.citySlug, 'images', `neighbourhood-${neighbourhood.slug}.svg`),
      createPlaceholderSvg(`${options.cityName} ${neighbourhood.name}`, options.accent, `Starter neighbourhood image for ${neighbourhood.name}`),
      dryRun
    );
  }
}

function updateCityRegistry(options, dryRun) {
  if (!options.domain || !options.cityId) {
    return { updated: false, reason: 'Skipped registry update because --domain or --city-id was not provided.' };
  }

  const cityRegistry = readJson(CITY_REGISTRY_PATH);
  const normalizedDomains = Array.from(new Set([options.domain, `www.${options.domain}`]));
  const existingIndex = cityRegistry.findIndex(city => city.slug === options.citySlug);
  const nextRecord = {
    slug: options.citySlug,
    cityId: options.cityId,
    domains: normalizedDomains
  };

  if (existingIndex >= 0) {
    cityRegistry[existingIndex] = nextRecord;
  } else {
    cityRegistry.push(nextRecord);
    cityRegistry.sort((a, b) => a.slug.localeCompare(b.slug));
  }

  if (!dryRun) {
    writeJson(CITY_REGISTRY_PATH, cityRegistry);
  }

  return { updated: true, domains: normalizedDomains };
}

function updatePackageJson(options, dryRun) {
  const pkg = readJson(PACKAGE_JSON_PATH);
  const scripts = pkg.scripts || {};
  const scriptName = `dev:${options.citySlug}`;
  const port = options.port || detectNextPort(pkg);

  scripts[scriptName] = `cross-env PORT=${port} CITY=${options.citySlug} node server.js`;
  scripts['bootstrap:city'] = 'node scripts/bootstrap-city.js';
  pkg.scripts = Object.fromEntries(Object.entries(scripts).sort(([a], [b]) => a.localeCompare(b)));

  if (!dryRun) {
    writeJson(PACKAGE_JSON_PATH, pkg);
  }

  return { scriptName, port };
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  const cityName = args.name ? String(args.name).trim() : '';
  const citySlug = args.slug ? slugify(args.slug) : slugify(cityName);

  if (!cityName || !citySlug) {
    console.error('Usage: node scripts/bootstrap-city.js --name "Prague" --slug prague --country "Czech Republic" --author "Local Expert" [--domain prague-guide.com] [--city-id uuid] [--port 3005] [--dry-run]');
    process.exit(1);
  }

  const dryRun = Boolean(args['dry-run']);
  const packageJson = readJson(PACKAGE_JSON_PATH);
  const cityRecords = readJson(CITY_REGISTRY_PATH);
  const authorName = args.author ? String(args.author).trim() : `${cityName} Editorial Team`;
  const authorSlug = args['author-slug'] ? slugify(args['author-slug']) : slugify(authorName);

  const options = {
    cityName,
    citySlug,
    country: args.country ? String(args.country).trim() : 'Country TBD',
    authorName,
    authorSlug,
    cityId: args['city-id'] ? String(args['city-id']).trim() : '',
    domain: args.domain ? String(args.domain).trim().replace(/^https?:\/\//, '').replace(/\/$/, '') : '',
    port: args.port ? Number(args.port) : null,
    accent: args.accent || DEFAULT_ACCENT,
    accentDark: args['accent-dark'] || DEFAULT_ACCENT_DARK,
    accentLight: args['accent-light'] || DEFAULT_ACCENT_LIGHT,
    flag: args.flag || '',
    force: Boolean(args.force)
  };

  createCitySkeleton(options, cityRecords, dryRun);
  const registryResult = updateCityRegistry(options, dryRun);
  const packageResult = updatePackageJson(options, dryRun);

  console.log(`${dryRun ? '[dry-run] ' : ''}Bootstrapped ${options.cityName} (${options.citySlug}).`);
  console.log(`City folder: ${getCityDir(options.citySlug)}`);
  console.log(`Dev script: npm run ${packageResult.scriptName} (PORT=${packageResult.port})`);

  if (registryResult.updated) {
    console.log(`Domains registered: ${registryResult.domains.join(', ')}`);
  } else {
    console.log(registryResult.reason);
  }

  if (!options.cityId) {
    console.log('Next step: add a real Supabase city UUID with --city-id once the city exists in the database.');
  }

  if (!options.domain) {
    console.log('Next step: add a production domain with --domain once the microsite domain is chosen.');
  }
}

main();
