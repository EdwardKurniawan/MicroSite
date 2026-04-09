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
const REQUIRED_PILLARS = [
  'best-things-to-do',
  'where-to-stay',
  'best-restaurants',
  'events',
  'events/this-month',
  'events/this-weekend'
];

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

function buildSiteOrigin(domain) {
  return `https://${domain || DEFAULT_DOMAIN}`;
}

function buildCanonical(domain, citySlug, subPath = '') {
  const clean = String(subPath || '').replace(/^\/|\/$/g, '');
  const suffix = clean ? `/${clean}/` : '/';
  return `${buildSiteOrigin(domain)}/${citySlug}${suffix}`;
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
      slug: 'experiences',
      title: 'Experiences',
      count: '5 picks',
      description: `Use this category for the views, activities, tours, and signature moments that make ${cityName} feel more than museum-deep.`,
      eyebrow: 'Experiences'
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
  const origin = buildSiteOrigin(options.domain);
  const canonical = buildCanonical(options.domain, options.citySlug);
  const heroImage = `/${options.citySlug}/images/hero.svg`;
  const guidePages = [
    {
      title: 'Best Things To Do',
      url: `/${options.citySlug}/best-things-to-do/`,
      description: `A ranked starter shortlist for what to do first in ${options.cityName}.`
    },
    {
      title: 'Where To Stay',
      url: `/${options.citySlug}/where-to-stay/`,
      description: `A district-led stay guide for choosing the right base in ${options.cityName}.`
    },
    {
      title: 'Best Restaurants',
      url: `/${options.citySlug}/best-restaurants/`,
      description: `A dinner-first guide to the strongest tables and food neighborhoods in ${options.cityName}.`
    },
    {
      title: `${options.cityName} Events`,
      url: `/${options.citySlug}/events/`,
      description: `The monthly and weekend moments that should shape a trip to ${options.cityName}.`
    }
  ];

  return {
    city_url: `/${options.citySlug}/`,
    city_name: options.cityName,
    theme: {
      accent: options.accent,
      accentDark: options.accentDark,
      accentLight: options.accentLight
    },
    seo: {
      title: `What To Do in ${options.cityName} (${DEFAULT_YEAR}): Best Things To See, Eat, Stay, and Plan`,
      description: `A starter ${DEFAULT_YEAR} guide to ${options.cityName}: what to do, what to see, where to stay, what to eat, and what should shape the trip first.`,
      canonical,
      og: {
        title: `What To Do in ${options.cityName} (${DEFAULT_YEAR}): Best Things To See, Eat, Stay, and Plan`,
        description: `A starter ${DEFAULT_YEAR} guide to ${options.cityName}: what to do, what to see, where to stay, what to eat, and what should shape the trip first.`,
        image: `${origin}/${options.citySlug}/images/hero.svg`
      },
      twitter: {
        title: `What To Do in ${options.cityName} (${DEFAULT_YEAR}): Best Things To See, Eat, Stay, and Plan`,
        description: `A starter ${DEFAULT_YEAR} guide to ${options.cityName}: what to do, what to see, where to stay, what to eat, and what should shape the trip first.`,
        image: `${origin}/${options.citySlug}/images/hero.svg`
      }
    },
    author: {
      name: options.authorName,
      slug: options.authorSlug,
      bio: `${options.authorName} is the placeholder editor for ${options.cityName}. Replace this with a real local perspective before launch.`
    },
    hero: {
      eyebrow: `${options.flag || '🌍'} ${options.cityName} City Guide`,
      title: `What to do in ${options.cityName}, without wasting the trip`,
      tagline: `Use this starter guide to shape the strongest first version of ${options.cityName}: what to do first, what to book early, where to stay, and which city moments matter most.`,
      image: heroImage,
      alt: `${options.cityName} skyline placeholder`
    },
    navigation: {
      local_links: [
        { label: 'Overview', url: '#city-overview', key: 'overview' },
        { label: 'Best Things To Do', url: `/${options.citySlug}/best-things-to-do/`, key: 'top-things' },
        { label: 'Where To Stay', url: `/${options.citySlug}/where-to-stay/`, key: 'where-to-stay' },
        { label: "What's On", url: '#events', key: 'events' },
        { label: 'Collections', url: '#collections', key: 'collections' }
      ],
      cta: {
        label: 'Best Things To Do',
        url: `/${options.citySlug}/best-things-to-do/`
      }
    },
    hero_actions: [
      { label: 'Best Things To Do', url: `/${options.citySlug}/best-things-to-do/`, style: 'primary' },
      { label: "What's Happening", url: `/${options.citySlug}/events/`, style: 'secondary' },
      { label: 'Where To Stay', url: `/${options.citySlug}/where-to-stay/`, style: 'secondary' }
    ],
    guide_pages: guidePages,
    footer: {
      brand_name: options.cityName,
      description: `An independent ${options.cityName} travel guide for what to do, what to see, where to stay, what to eat, and what is happening right now.`,
      newsletter: {
        title: 'Stay Inner-Circle',
        description: `Get seasonal ${options.cityName} notes, planning windows, and local picks without the fluff.`,
        placeholder: 'Your email address',
        button_label: 'Join'
      }
    },
    footer_categories: categories.slice(0, 4).map(category => ({
      title: category.title,
      url: category.url
    })),
    global_network: buildGlobalNetwork(options.citySlug, cityRecords),
    meta_title: `What To Do in ${options.cityName} (${DEFAULT_YEAR}): Best Things To See, Eat, Stay, and Plan`,
    meta_description: `A starter ${DEFAULT_YEAR} guide to ${options.cityName}: what to do, what to see, where to stay, what to eat, and what should shape the trip first.`,
    canonical_url: canonical,
    og_title: `What To Do in ${options.cityName} (${DEFAULT_YEAR}): Best Things To See, Eat, Stay, and Plan`,
    og_description: `A starter ${DEFAULT_YEAR} guide to ${options.cityName}: what to do, what to see, where to stay, what to eat, and what should shape the trip first.`,
    og_image: `${origin}/${options.citySlug}/images/hero.svg`,
    theme_accent: options.accent,
    theme_accent_dark: options.accentDark,
    theme_accent_light: options.accentLight,
    country: options.country,
    author_name: options.authorName,
    author_slug: options.authorSlug,
    updated_date: `${DEFAULT_YEAR}-01-01`,
    read_time: '10 min read',
    hero_image: heroImage,
    hero_alt: `${options.cityName} skyline placeholder`,
    hero_eyebrow: `${options.flag || '🌍'} ${options.cityName} City Guide`,
    hero_h1: `What to do in ${options.cityName}, without wasting the trip`,
    hero_tagline: `Use this starter guide to shape the strongest first version of ${options.cityName}: what to do first, what to book early, where to stay, and which city moments matter most.`,
    standfirst: `${options.cityName} needs a strong editorial thesis here. Start with broad search intent first, then layer in local detail and booking logic.`,
    intro_text: `<p>${options.cityName} is now wired into the shared TravelSides template system. This starter homepage is intentionally structured around the real product model: broad-intent answers up top, deeper guide families beneath, and clear paths into events, neighborhoods, and booking-sensitive choices.</p><p>Start by refining the positioning, pillar pages, categories, and neighbourhoods. Then replace the placeholder seasonal cues, top picks, and editorial guidance with researched local insight.</p>`,
    intro_html: `<p>${options.cityName} is now wired into the shared TravelSides template system. This starter homepage is intentionally structured around the real product model: broad-intent answers up top, deeper guide families beneath, and clear paths into events, neighborhoods, and booking-sensitive choices.</p><p>Start by refining the positioning, pillar pages, categories, and neighbourhoods. Then replace the placeholder seasonal cues, top picks, and editorial guidance with researched local insight.</p>`,
    quick_info: [
      { icon: '📅', label: 'Ideal Trip Length', value: 'Replace with the recommended trip length.' },
      { icon: '🌤', label: 'Best Time to Visit', value: 'Replace with real seasonal guidance.' },
      { icon: '💶', label: 'Typical Daily Budget', value: 'Replace with local cost guidance.' },
      { icon: '🎟', label: 'Book First', value: 'Replace with the tickets, seasons, or restaurants that shape this city earliest.' }
    ],
    top_things: [
      {
        kicker: 'Priority Guide',
        title: `Build the first version of ${options.cityName} fast`,
        description: `Use the ranked shortlist to decide what matters most on a first trip to ${options.cityName}.`,
        url: `/${options.citySlug}/best-things-to-do/`,
        image: `/${options.citySlug}/images/category-museums-culture.svg`,
        alt: `${options.cityName} best things placeholder`,
        cta: 'Open the ranked guide'
      },
      {
        kicker: 'Stay Strategy',
        title: `Choose the part of ${options.cityName} that fits your pace`,
        description: `Use the stay guide to decide whether your base should be central, food-led, quieter, or more local-feeling.`,
        url: `/${options.citySlug}/where-to-stay/`,
        image: `/${options.citySlug}/images/neighbourhood-old-town.svg`,
        alt: `${options.cityName} stay guide placeholder`,
        cta: 'Open the stay guide'
      },
      {
        kicker: 'Dinner Guide',
        title: `Let one evening become part of the trip`,
        description: `Use the restaurant guide to decide which meal deserves real planning in ${options.cityName}.`,
        url: `/${options.citySlug}/best-restaurants/`,
        image: `/${options.citySlug}/images/category-food-drink.svg`,
        alt: `${options.cityName} restaurant guide placeholder`,
        cta: 'See the dinner shortlist'
      }
    ],
    events: [
      {
        kicker: 'This Month',
        timing: `${DEFAULT_YEAR} monthly view`,
        title: `See what is happening in ${options.cityName} this month`,
        description: 'Replace this with the current month’s strongest seasonal swing, cultural spike, or booking-pressure window.',
        venue: `${options.cityName} citywide`,
        url: `/${options.citySlug}/events/this-month/`,
        link_label: 'Open the monthly guide'
      },
      {
        kicker: 'This Weekend',
        timing: `${DEFAULT_YEAR} weekend lens`,
        title: `See how the city feels this weekend`,
        description: 'Replace this with the neighborhood mood, after-dark angle, or short-break structure that matters most right now.',
        venue: `${options.cityName} short-break view`,
        url: `/${options.citySlug}/events/this-weekend/`,
        link_label: 'Open the weekend guide'
      },
      {
        kicker: 'Seasonal',
        timing: 'Ongoing planning layer',
        title: `Use the events hub before you lock the trip`,
        description: 'Replace this with the recurring seasonal moment or annual citywide event that most often changes how visitors should plan.',
        venue: `${options.cityName} seasonal planning`,
        url: `/${options.citySlug}/events/`,
        link_label: 'Open the events hub'
      }
    ],
    category_intro: `Starter category structure for ${options.cityName}. Replace with a real editorial summary once categories are finalized.`,
    categories,
    neighbourhoods,
    faqs: [
      { q: `How many days do you need in ${options.cityName}?`, a: 'Replace with a practical answer once the itinerary is defined.' },
      { q: `What is ${options.cityName} best known for?`, a: 'Replace with the city’s strongest traveler-facing hook.' },
      { q: `What should you book in advance in ${options.cityName}?`, a: 'Replace with the attractions or seasons that actually sell out.' }
    ]
  };
}

function createCategoryData(options, category) {
  return {
    title: `${category.title} in ${options.cityName}`,
    seo: {
      title: `${category.title} in ${options.cityName} (${DEFAULT_YEAR} Guide)`,
      description: `Starter guide to ${category.title.toLowerCase()} in ${options.cityName}. Replace this with a sharper local angle and booking logic.`,
      canonical: buildCanonical(options.domain, options.citySlug, category.slug)
    },
    hero: {
      eyebrow: category.eyebrow,
      title: `${category.title} in ${options.cityName}`,
      tagline: `Starter page for ${category.title.toLowerCase()} in ${options.cityName}. Replace this with a tighter local angle.`,
      image: category.image
    },
    navigation: {
      cta: {
        label: 'Explore the City Guide',
        url: `/${options.citySlug}/`
      }
    },
    page_context: {
      label: 'Collection guide',
      timeframe: `${DEFAULT_YEAR} starter page`,
      last_updated: `${DEFAULT_YEAR}-01-01`,
      freshness: 'Placeholder content',
      note: `Replace this page with researched local recommendations, structured picks, and booking advice for ${category.title.toLowerCase()} in ${options.cityName}.`,
      next_refresh: 'After initial city research'
    },
    eyebrow: category.eyebrow,
    standfirst: `Starter page for ${category.title.toLowerCase()} in ${options.cityName}. Replace this with a tighter local angle.`,
    hero_image: category.image,
    intro_html: `<p>This is the starter page for ${category.title.toLowerCase()} in ${options.cityName}. Replace the opening with original local knowledge, then add real attractions, booking logic, and practical advice.</p>`,
    facts: [
      { icon: '🎯', label: 'Best for', value: `Who should use this ${category.title.toLowerCase()} category?` },
      { icon: '🕒', label: 'Time needed', value: 'Add a practical time estimate.' }
    ],
    todos: [
      {
        title: 'Choose the right use case first',
        body: `Replace this with the main decision travelers need to make before they use the ${category.title.toLowerCase()} guide in ${options.cityName}.`
      },
      {
        title: 'Add one booking or timing note that matters',
        body: 'Use this slot for the reservation, line-skipping, or seasonal note that most changes how the page should be used.'
      }
    ],
    attractions: [
      {
        id: `${category.slug}-anchor`,
        name: `${category.title} Placeholder`,
        category: category.title,
        badge: 'Starter',
        image_url: `/${options.citySlug}/images/placeholder-venue.svg`,
        description: `<p>Replace this card with the first real attraction, venue, or experience you want this category to lead with in ${options.cityName}.</p>`,
        price: 'Add price'
      }
    ],
    products: [
      {
        title: `${options.cityName} Best Things To Do`,
        description: `Use this if the traveler still needs the broad first-timer shortlist before going deeper into ${category.title.toLowerCase()}.`,
        link: `/${options.citySlug}/best-things-to-do/`,
        cta: 'Open the ranked guide'
      }
    ],
    getting_there: [
      { icon: '🚇', text: `Add the transport or access note people need for ${category.title.toLowerCase()} in ${options.cityName}.` }
    ],
    faqs: [
      { q: `What is the best ${category.title.toLowerCase()} pick in ${options.cityName}?`, a: 'Replace with your strongest editorial recommendation.' }
    ]
  };
}

function createNeighbourhoodData(options, neighbourhood) {
  return {
    title: `${neighbourhood.name} in ${options.cityName}`,
    seo: {
      title: `${neighbourhood.name} in ${options.cityName} (${DEFAULT_YEAR} Guide)`,
      description: `Starter guide to ${neighbourhood.name} in ${options.cityName}. Replace this with local context, best-for guidance, and why travelers should spend time here.`,
      canonical: buildCanonical(options.domain, options.citySlug, neighbourhood.slug)
    },
    hero: {
      eyebrow: `${options.cityName} Neighbourhood`,
      title: neighbourhood.name,
      tagline: neighbourhood.standfirst,
      image: neighbourhood.image
    },
    navigation: {
      cta: {
        label: 'Open the stay guide',
        url: `/${options.citySlug}/where-to-stay/`
      }
    },
    page_context: {
      label: 'Neighbourhood guide',
      timeframe: `${DEFAULT_YEAR} starter page`,
      last_updated: `${DEFAULT_YEAR}-01-01`,
      freshness: 'Placeholder content',
      note: `Replace this page with real district logic: what the area feels like, who it suits, and how it changes the trip in ${options.cityName}.`,
      next_refresh: 'After district research'
    },
    eyebrow: `📍 ${neighbourhood.name}`,
    standfirst: neighbourhood.standfirst,
    hero_image: neighbourhood.image,
    intro_html: `<p>${neighbourhood.name} is a starter neighbourhood page for ${options.cityName}. Replace this with the local context, best walking route, and practical reasons people should spend time here.</p>`,
    todos: [
      {
        num: '01',
        title: 'Anchor experience',
        description: `Replace with the best first thing to do in ${neighbourhood.name}.`,
        image: `/${options.citySlug}/images/placeholder-venue.svg`
      }
    ],
    foods: [
      {
        tag: 'Starter',
        title: 'Signature food stop',
        description: `Replace with the cafe, market, bar, or restaurant that best represents ${neighbourhood.name}.`
      }
    ],
    products: [
      {
        title: `Where To Stay in ${options.cityName}`,
        description: `Use this to explain how ${neighbourhood.name} compares with the other districts before someone books a hotel.`,
        link: `/${options.citySlug}/where-to-stay/`,
        cta: 'Open the stay guide'
      }
    ],
    facts: neighbourhood.facts,
    getting_there: [
      { icon: '🚶', text: `Add the easiest way to reach ${neighbourhood.name} from the city center.` }
    ],
    faqs: [
      { q: `Is ${neighbourhood.name} worth visiting in ${options.cityName}?`, a: 'Replace with a crisp local answer and who it suits best.' }
    ]
  };
}

function createBestThingsPage(options) {
  return {
    title: `Best Things To Do in ${options.cityName} (${DEFAULT_YEAR} Guide)`,
    seo: {
      title: `Best Things To Do in ${options.cityName} (${DEFAULT_YEAR})`,
      description: `Starter ranked guide to the best things to do in ${options.cityName}. Replace this with the first-timer shortlist that should shape the trip.`,
      canonical: buildCanonical(options.domain, options.citySlug, 'best-things-to-do')
    },
    hero: {
      eyebrow: `${options.cityName} Top 10 Guide`,
      title: `Best Things To Do in ${options.cityName}`,
      tagline: `The starter shortlist for ${options.cityName}: what to do first, what deserves real time, and what should shape a first trip.`,
      image: `/${options.citySlug}/images/hero.svg`
    },
    navigation: {
      cta: {
        label: "See What's Happening",
        url: `/${options.citySlug}/events/`
      }
    },
    page_context: {
      label: 'Pillar guide',
      timeframe: `Best things to do in ${DEFAULT_YEAR}`,
      last_updated: `${DEFAULT_YEAR}-01-01`,
      freshness: 'Starter shortlist',
      note: `Replace this page with the real broad-intent shortlist for ${options.cityName}: the few decisions that matter most on a first trip.`,
      next_refresh: 'After first editorial pass'
    },
    intro_html: `<p><strong>This is the broad-intent page for ${options.cityName}.</strong> Replace it with the ranked shortlist that answers the main search question fast: what to do first, what to see, what to book, and what deserves space in a first itinerary.</p>`,
    facts: [
      { icon: '📅', label: 'Ideal trip', value: 'Replace with the real trip length sweet spot.' },
      { icon: '🎟', label: 'Book first', value: 'Replace with the tickets or experiences that actually shape the dates.' },
      { icon: '📍', label: 'Best balancing move', value: 'Replace with the advice that keeps the trip from feeling overstuffed.' }
    ],
    todos: [
      { title: 'Choose the first non-negotiable booking', body: 'Replace with the attraction or event that should anchor the dates.' },
      { title: 'Balance headline sights with city feel', body: 'Replace with the tip that keeps the itinerary from becoming a checklist.' },
      { title: 'Use one evening to define the trip mood', body: 'Replace with the advice that shapes the best after-dark plan.' }
    ],
    attractions: [
      {
        name: `${options.cityName} signature sight`,
        category: 'Top Pick #1',
        badge: 'First-timer essential',
        image_url: `/${options.citySlug}/images/placeholder-venue.svg`,
        metas: ['Replace with best-for note', 'Replace with time allowance', 'Replace with pairing advice'],
        hook: 'Replace this with the strongest one-line case for why this belongs near the top.',
        description: `Replace this with the first ranked pick for ${options.cityName} and explain why it should shape a first trip.`,
        tip: 'Replace with the practical note that makes this pick easier to use.',
        url: `/${options.citySlug}/museums-culture/`,
        cta: 'Open the category guide'
      },
      {
        name: `${options.cityName} local-feel district`,
        category: 'Top Pick #2',
        badge: 'Most underrated move',
        image_url: `/${options.citySlug}/images/neighbourhood-old-town.svg`,
        metas: ['Replace with best-for note', 'Replace with when to go', 'Replace with why it matters'],
        hook: 'Replace this with the district or walk that gives the city its local texture.',
        description: `Replace this with the neighborhood-led pick that makes ${options.cityName} feel like more than attractions.`,
        tip: 'Replace with the note that helps travelers use this well.',
        url: `/${options.citySlug}/where-to-stay/`,
        cta: 'Open the stay guide'
      }
    ],
    products: [
      { title: `${options.cityName} Events`, description: 'Use this if dates and current city mood might change the smartest version of the trip.', link: `/${options.citySlug}/events/`, cta: 'Open events guide' },
      { title: `Where To Stay in ${options.cityName}`, description: 'Use this if the right base will matter more than another attraction.', link: `/${options.citySlug}/where-to-stay/`, cta: 'Open stay guide' },
      { title: `Best Restaurants in ${options.cityName}`, description: 'Use this if one memorable dinner should become part of the trip.', link: `/${options.citySlug}/best-restaurants/`, cta: 'Open restaurant guide' }
    ],
    getting_there: [
      { icon: '🚶', text: 'Replace with the best first-time movement pattern for this city.' },
      { icon: '💡', text: 'Replace with the advice that stops travelers from overbuilding the schedule.' }
    ],
    faqs: [
      { q: `What are the best things to do in ${options.cityName}?`, a: 'Replace with the concise first-timer answer that you want this page to rank for.' }
    ]
  };
}

function createWhereToStayPage(options) {
  return {
    title: `Where To Stay in ${options.cityName} (${DEFAULT_YEAR} Guide)`,
    seo: {
      title: `Where To Stay in ${options.cityName} (${DEFAULT_YEAR})`,
      description: `Starter stay guide to ${options.cityName}. Replace this with the district-by-district advice that helps travelers choose the right base.`,
      canonical: buildCanonical(options.domain, options.citySlug, 'where-to-stay')
    },
    hero: {
      eyebrow: `${options.cityName} Stay Guide`,
      title: `Where To Stay in ${options.cityName}`,
      tagline: `The district-led starter guide for choosing the right base: where first-timers should stay, which areas suit food or calm nights, and where not to overpay by default.`,
      image: `/${options.citySlug}/images/neighbourhood-old-town.svg`
    },
    navigation: {
      cta: {
        label: 'Compare neighbourhoods',
        url: `/${options.citySlug}/neighbourhoods/`
      }
    },
    page_context: {
      label: 'Pillar guide',
      timeframe: `Where to stay in ${DEFAULT_YEAR}`,
      last_updated: `${DEFAULT_YEAR}-01-01`,
      freshness: 'Stay strategy',
      note: `Replace this page with the real district logic for ${options.cityName}: where first-timers should stay, which areas suit different budgets, and how evenings should shape the choice.`,
      next_refresh: 'After district positioning pass'
    },
    intro_html: `<p><strong>Where you stay changes the whole trip.</strong> Replace this with the district-by-district guidance that helps travelers choose a base in ${options.cityName} before they compare hotel names.</p>`,
    facts: [
      { icon: '🛏', label: 'Best first-time base', value: 'Replace with the strongest district answer.' },
      { icon: '🍽', label: 'Best for food', value: 'Replace with the district that works best after dark.' },
      { icon: '🌿', label: 'Best for calm', value: 'Replace with the district for quieter stays.' }
    ],
    todos: [
      { title: 'Choose your base by evenings, not landmarks', body: 'Replace with the advice that keeps people from picking the wrong area for the wrong reasons.' },
      { title: 'Avoid defaulting to the busiest central pocket', body: 'Replace with the note that helps travelers avoid overpaying for a weak base.' },
      { title: 'Match the district to trip rhythm', body: 'Replace with the pairing logic between stay area and itinerary style.' }
    ],
    attractions: [
      {
        name: 'Historic core',
        category: 'Best Area #1',
        badge: 'Best first-time stay',
        image_url: `/${options.citySlug}/images/neighbourhood-old-town.svg`,
        metas: ['Replace with best-for note', 'Replace with mood', 'Replace with access note'],
        hook: 'Replace this with the strongest all-round stay answer.',
        description: `Replace this with the district that makes the most sense as the safest first-time base in ${options.cityName}.`,
        tip: 'Replace with the reason this area works or fails for certain travelers.',
        url: `/${options.citySlug}/old-town/`,
        cta: 'See the district guide'
      },
      {
        name: 'Creative quarter',
        category: 'Best Area #2',
        badge: 'Best for local edge',
        image_url: `/${options.citySlug}/images/neighbourhood-creative-quarter.svg`,
        metas: ['Replace with best-for note', 'Replace with after-dark note', 'Replace with transit note'],
        hook: 'Replace this with the district that gives the city a more contemporary mood.',
        description: `Replace this with the stay option that works best for travelers who want ${options.cityName} to feel less polished and more local.`,
        tip: 'Replace with the note that explains when this area is worth the tradeoff.',
        url: `/${options.citySlug}/creative-quarter/`,
        cta: 'See the district guide'
      }
    ],
    products: [
      { title: `${options.cityName} Neighbourhoods`, description: 'Use this for the full district comparison before picking a base.', link: `/${options.citySlug}/neighbourhoods/`, cta: 'Open neighbourhood guide' },
      { title: `Best Things To Do in ${options.cityName}`, description: 'Use this if the stay choice should line up with the sights that matter most.', link: `/${options.citySlug}/best-things-to-do/`, cta: 'Open ranked guide' },
      { title: `${options.cityName} Events`, description: 'Use this if dates and city mood might change which district works best.', link: `/${options.citySlug}/events/`, cta: 'Open events guide' }
    ],
    getting_there: [
      { icon: '🚶', text: 'Replace with the districts that work best on foot.' },
      { icon: '🚋', text: 'Replace with the districts that only make sense once transit enters the picture.' }
    ],
    faqs: [
      { q: `Where should first-time visitors stay in ${options.cityName}?`, a: 'Replace with the concise district answer this page should own.' }
    ]
  };
}

function createBestRestaurantsPage(options) {
  return {
    title: `Best Restaurants in ${options.cityName} (${DEFAULT_YEAR} Guide)`,
    seo: {
      title: `Best Restaurants in ${options.cityName} (${DEFAULT_YEAR})`,
      description: `Starter dinner guide to ${options.cityName}. Replace this with the strongest tables, dinner districts, and booking logic.`,
      canonical: buildCanonical(options.domain, options.citySlug, 'best-restaurants')
    },
    hero: {
      eyebrow: `${options.cityName} Restaurant Guide`,
      title: `Best Restaurants in ${options.cityName}`,
      tagline: `The dinner-first starter guide: which tables matter most, where the city feels best at night, and which meal deserves real planning.`,
      image: `/${options.citySlug}/images/category-food-drink.svg`
    },
    navigation: {
      cta: {
        label: 'See the food guide',
        url: `/${options.citySlug}/food-drink/`
      }
    },
    page_context: {
      label: 'Pillar guide',
      timeframe: `Best restaurants in ${DEFAULT_YEAR}`,
      last_updated: `${DEFAULT_YEAR}-01-01`,
      freshness: 'Dinner shortlist',
      note: `Replace this page with the restaurants and dinner neighborhoods that should shape a traveler’s best evening in ${options.cityName}.`,
      next_refresh: 'After food and dining research'
    },
    intro_html: `<p><strong>This page should answer the restaurant question fast.</strong> Replace it with the shortlist of tables and dinner neighborhoods that are worth planning ahead for in ${options.cityName}.</p>`,
    facts: [
      { icon: '🌙', label: 'Best use', value: 'Replace with how many serious dinner bookings a trip usually needs.' },
      { icon: '📍', label: 'Best dinner areas', value: 'Replace with the neighborhoods that work best at night.' },
      { icon: '🎟', label: 'Book ahead', value: 'Replace with the tables that actually tighten first.' }
    ],
    todos: [
      { title: 'Choose the evening before the cuisine', body: 'Replace with the advice that helps travelers pick the right dinner mood first.' },
      { title: 'Reserve the one meal that matters most', body: 'Replace with the note that keeps dinner planning proportionate.' },
      { title: 'Let the neighborhood finish the night', body: 'Replace with the reason some dining areas are stronger than others after the meal.' }
    ],
    attractions: [
      {
        name: `${options.cityName} signature dinner`,
        category: 'Best Table #1',
        badge: 'Most iconic dinner',
        image_url: `/${options.citySlug}/images/category-food-drink.svg`,
        metas: ['Replace with best-for note', 'Replace with neighborhood', 'Replace with price band'],
        hook: 'Replace this with the clearest case for one table that belongs in the broad-intent shortlist.',
        description: `Replace this with the strongest dinner recommendation in ${options.cityName}.`,
        tip: 'Replace with the practical timing or booking advice for this table.',
        url: `/${options.citySlug}/food-drink/`,
        cta: 'Open the food guide'
      },
      {
        name: `${options.cityName} food district`,
        category: 'Best Area #2',
        badge: 'Best for lively nights',
        image_url: `/${options.citySlug}/images/neighbourhood-market-district.svg`,
        metas: ['Replace with best-for note', 'Replace with district mood', 'Replace with why it works'],
        hook: 'Replace this with the neighborhood that best supports dinner as part of a night out.',
        description: `Replace this with the district that works best when dinner should spill into drinks, walking, or local atmosphere in ${options.cityName}.`,
        tip: 'Replace with the note that helps travelers use this area well.',
        url: `/${options.citySlug}/market-district/`,
        cta: 'See the district guide'
      }
    ],
    products: [
      { title: `${options.cityName} Food & Drink`, description: 'Use this for the deeper food guide once the restaurant shortlist is set.', link: `/${options.citySlug}/food-drink/`, cta: 'Open the food guide' },
      { title: `Where To Stay in ${options.cityName}`, description: 'Use this if dining neighborhoods should influence where you base yourself.', link: `/${options.citySlug}/where-to-stay/`, cta: 'Open the stay guide' },
      { title: `${options.cityName} Events`, description: 'Use this if city dates and seasonal mood may change the best dining areas.', link: `/${options.citySlug}/events/`, cta: 'Open events guide' }
    ],
    getting_there: [
      { icon: '🚶', text: 'Replace with the neighborhoods best explored on foot for dinner and drinks.' },
      { icon: '🚋', text: 'Replace with the dinner areas that depend on tram or taxi convenience.' }
    ],
    faqs: [
      { q: `What are the best restaurants in ${options.cityName}?`, a: 'Replace with the concise broad-intent answer this page should own.' }
    ]
  };
}

function createEventsPage(options) {
  return {
    title: `${options.cityName} Events (${DEFAULT_YEAR} Guide)`,
    seo: {
      title: `What's Happening in ${options.cityName} (${DEFAULT_YEAR})`,
      description: `Starter events guide to ${options.cityName}. Replace this with the seasonal moments, citywide spikes, and planning windows that matter most.`,
      canonical: buildCanonical(options.domain, options.citySlug, 'events')
    },
    hero: {
      eyebrow: `${options.cityName} Events Guide`,
      title: `What's Happening in ${options.cityName}`,
      tagline: `The seasonal and citywide starter guide: what is happening, what changes the mood of the city, and which dates should affect booking decisions.`,
      image: `/${options.citySlug}/images/hero.svg`
    },
    navigation: {
      cta: {
        label: `This Month in ${options.cityName}`,
        url: `/${options.citySlug}/events/this-month/`
      }
    },
    page_context: {
      label: 'Events planning guide',
      timeframe: `${DEFAULT_YEAR} starter page`,
      last_updated: `${DEFAULT_YEAR}-01-01`,
      freshness: 'Current signal',
      note: `Replace this page with the seasonal windows, cultural spikes, and citywide moments that most often change how travelers should plan ${options.cityName}.`,
      next_refresh: 'After first events research pass'
    },
    guide_pages: [
      { title: `${options.cityName} This Month`, url: `/${options.citySlug}/events/this-month/`, description: 'Monthly planning lens for the city right now.' },
      { title: `${options.cityName} This Weekend`, url: `/${options.citySlug}/events/this-weekend/`, description: 'Weekend planning lens for short breaks and city mood.' }
    ],
    intro_html: `<p><strong>This page should answer the freshness-sensitive question.</strong> Replace it with the seasons, citywide weekends, and cultural moments that actually change how travelers should plan ${options.cityName}.</p>`,
    facts: [
      { icon: '📅', label: 'Best use', value: 'Replace with the decision this page should help travelers make.' },
      { icon: '🌤', label: 'Big seasonal swing', value: 'Replace with the season or event window that matters most.' },
      { icon: '🌙', label: 'Night energy', value: 'Replace with the days or districts that change most after dark.' }
    ],
    todos: [
      { title: 'Check whether your dates sit inside a major city moment', body: 'Replace with the seasonal or annual cue that most often changes the trip.' },
      { title: 'Use the city mood to choose where to stay', body: 'Replace with the stay-location logic that follows the events calendar.' },
      { title: 'Book only the slots that tighten in these windows', body: 'Replace with the tickets or reservations that matter most in event-heavy periods.' }
    ],
    events: [
      {
        kicker: 'This Month',
        timing: `${DEFAULT_YEAR} monthly view`,
        start_date: `${DEFAULT_YEAR}-01-01`,
        end_date: `${DEFAULT_YEAR}-01-31`,
        event_type: 'monthly',
        status: 'Starter placeholder',
        district: `${options.cityName} citywide`,
        booking_priority: 'Replace with the real pressure point',
        title: `${options.cityName} this month`,
        description: 'Replace this with the strongest month-level planning pattern for the city right now.',
        venue: `${options.cityName} citywide`,
        url: `/${options.citySlug}/events/this-month/`,
        link_label: 'Open the monthly guide'
      },
      {
        kicker: 'This Weekend',
        timing: `${DEFAULT_YEAR} weekend lens`,
        recurrence: 'Weekly',
        event_type: 'weekend-pattern',
        status: 'Starter placeholder',
        district: `${options.cityName} central districts`,
        booking_priority: 'Replace with the real weekend booking pressure',
        title: `${options.cityName} this weekend`,
        description: 'Replace this with the neighborhood mood, after-dark angle, or short-break logic that matters most on a weekend.',
        venue: `${options.cityName} short-break view`,
        url: `/${options.citySlug}/events/this-weekend/`,
        link_label: 'Open the weekend guide'
      }
    ],
    products: [
      { title: `${options.cityName} This Month`, description: 'Use this if the month-level city mood should shape the trip.', link: `/${options.citySlug}/events/this-month/`, cta: 'Open monthly guide' },
      { title: `${options.cityName} This Weekend`, description: 'Use this if the weekend version of the city matters most.', link: `/${options.citySlug}/events/this-weekend/`, cta: 'Open weekend guide' }
    ],
    getting_there: [
      { icon: '🚶', text: 'Replace with the central movement pattern that matters most when the city is busiest.' }
    ],
    faqs: [
      { q: `What is happening in ${options.cityName}?`, a: 'Replace with the concise answer and date logic this page should own.' }
    ]
  };
}

function createEventsThisMonthPage(options) {
  return {
    title: `${options.cityName} Events This Month`,
    seo: {
      title: `${options.cityName} Events This Month (${DEFAULT_YEAR})`,
      description: `Starter month guide to ${options.cityName}. Replace this with the month-level city mood, booking pressure, and seasonal windows that matter now.`,
      canonical: buildCanonical(options.domain, options.citySlug, 'events/this-month')
    },
    hero: {
      eyebrow: `${options.cityName} This Month`,
      title: `${options.cityName} Events This Month`,
      tagline: `The month-level starter guide: what is happening now, what deserves attention this month, and what should change how the trip gets planned.`,
      image: `/${options.citySlug}/images/hero.svg`
    },
    navigation: {
      cta: {
        label: `See all ${options.cityName} events`,
        url: `/${options.citySlug}/events/`
      }
    },
    page_context: {
      label: 'Month planning guide',
      timeframe: `${DEFAULT_YEAR} monthly placeholder`,
      last_updated: `${DEFAULT_YEAR}-01-01`,
      freshness: 'Updated now',
      note: `Replace this page with the current month’s strongest signals: seasonal windows, city mood, and the reservations that matter most right now in ${options.cityName}.`,
      next_refresh: 'Before the next monthly rollover'
    },
    intro_html: `<p><strong>This page should answer the month question directly.</strong> Replace it with the city signals that matter right now in ${options.cityName}: what deserves attention, what should be booked, and what changes the mood of the trip.</p>`,
    facts: [
      { icon: '📌', label: 'Use this for', value: 'Replace with the monthly planning job this page does.' },
      { icon: '🎟', label: 'Watch first', value: 'Replace with the reservations or dates to watch.' }
    ],
    todos: [
      { title: 'Use the month to decide the daytime anchor', body: 'Replace with the advice that helps travelers choose the right month-sensitive daytime move.' },
      { title: 'Then shape the evenings around the city mood', body: 'Replace with the note that turns the month into a better after-dark plan.' }
    ],
    events: [
      {
        kicker: 'Monthly swing',
        timing: `${DEFAULT_YEAR} month placeholder`,
        start_date: `${DEFAULT_YEAR}-01-01`,
        end_date: `${DEFAULT_YEAR}-01-31`,
        event_type: 'monthly',
        status: 'Starter placeholder',
        district: `${options.cityName} citywide`,
        booking_priority: 'Replace with the real monthly pressure point',
        title: `${options.cityName} monthly swing factor`,
        description: 'Replace this with the strongest month-level event, season, or cultural pattern right now.',
        venue: `${options.cityName} citywide`,
        url: `/${options.citySlug}/events/`,
        link_label: 'Back to the events guide'
      }
    ],
    getting_there: [
      { icon: '💡', text: 'Replace with the one flexibility note travelers should remember this month.' }
    ]
  };
}

function createEventsThisWeekendPage(options) {
  return {
    title: `${options.cityName} This Weekend`,
    seo: {
      title: `What's Happening in ${options.cityName} This Weekend (${DEFAULT_YEAR})`,
      description: `Starter weekend guide to ${options.cityName}. Replace this with the short-break city mood, evening shape, and neighborhood logic that matter most this weekend.`,
      canonical: buildCanonical(options.domain, options.citySlug, 'events/this-weekend')
    },
    hero: {
      eyebrow: `${options.cityName} This Weekend`,
      title: `What's Happening in ${options.cityName} This Weekend`,
      tagline: `The weekend starter guide: where the city feels strongest from Friday through Sunday, what deserves booking, and which areas justify your free time.`,
      image: `/${options.citySlug}/images/hero.svg`
    },
    navigation: {
      cta: {
        label: `See all ${options.cityName} events`,
        url: `/${options.citySlug}/events/`
      }
    },
    page_context: {
      label: 'Weekend planning guide',
      timeframe: `${DEFAULT_YEAR} weekend placeholder`,
      last_updated: `${DEFAULT_YEAR}-01-01`,
      freshness: 'Weekend read',
      note: `Replace this page with the weekend version of ${options.cityName}: where the atmosphere is strongest, what to book for the evening, and how to structure a short break.`,
      next_refresh: 'Before the next weekend handoff'
    },
    intro_html: `<p><strong>This page should answer the short-break question.</strong> Replace it with the weekend shape of ${options.cityName}: where the city feels liveliest, what deserves evening planning, and which district should get your free time.</p>`,
    facts: [
      { icon: '🌙', label: 'Weekend priority', value: 'Replace with the decision that matters most on a short break.' },
      { icon: '🍽', label: 'Book early', value: 'Replace with the dinners, cruises, or shows that tighten fastest.' }
    ],
    todos: [
      { title: 'Anchor one evening properly', body: 'Replace with the advice that makes the weekend feel structured, not random.' },
      { title: 'Keep one daytime block loose', body: 'Replace with the note that lets the city mood do some of the work.' }
    ],
    events: [
      {
        kicker: 'Friday night',
        timing: 'Best first move',
        recurrence: 'Weekly',
        event_type: 'weekend-pattern',
        status: 'Starter placeholder',
        district: `${options.cityName} central districts`,
        booking_priority: 'Replace with the right first booking',
        title: `${options.cityName} Friday-night starter`,
        description: 'Replace this with the Friday move that makes the city feel alive quickly.',
        venue: `${options.cityName} after-dark`,
        url: `/${options.citySlug}/events/`,
        link_label: 'Back to the events guide'
      }
    ],
    getting_there: [
      { icon: '🚶', text: 'Replace with the advice that keeps weekend movement simple.' }
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

  const pillarPages = [
    { slug: 'best-things-to-do', data: createBestThingsPage(options) },
    { slug: 'where-to-stay', data: createWhereToStayPage(options) },
    { slug: 'best-restaurants', data: createBestRestaurantsPage(options) },
    { slug: 'events', data: createEventsPage(options) },
    { slug: path.join('events', 'this-month'), data: createEventsThisMonthPage(options) },
    { slug: path.join('events', 'this-weekend'), data: createEventsThisWeekendPage(options) }
  ];

  for (const page of pillarPages) {
    ensureDir(getCityPath(options.citySlug, page.slug), dryRun);
    writeJson(getCityPath(options.citySlug, page.slug, 'data.json'), page.data, dryRun);
  }

  for (const category of cityData.categories) {
    ensureDir(getCityPath(options.citySlug, category.slug), dryRun);
    writeJson(
      getCityPath(options.citySlug, category.slug, 'data.json'),
      createCategoryData(options, category),
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
      createNeighbourhoodData(options, neighbourhood),
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
