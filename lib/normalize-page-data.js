const DEFAULT_ORIGIN = 'https://travelsides.com';
const DEFAULT_NETWORK = [
  { name: 'Kanazawa Insider', url: 'https://kanazawa-insider.com' },
  { name: 'London Insider', url: 'https://london-insider.com' },
  { name: 'Rome Insider', url: 'https://rome-insider.com' }
];
const DEFAULT_THEME = {
  accent: '#C56B2B',
  accentDark: '#9C4F19',
  accentLight: '#F6EADF'
};

function normalizeGuidePageData(pageData, citySlug) {
  const source = withCityDefaults(pageData, citySlug);

  return {
    page_type: 'guide',
    city_slug: source.city_slug,
    city_name: source.city_name,
    current_year: source.current_year,
    home_url: source.city_url,
    theme: normalizeTheme(source),
    seo: normalizeSeo(source, 'guide'),
    hero: normalizeHero(source, 'guide'),
    author: normalizeAuthor(source),
    navigation: normalizeNavigation(source, 'guide'),
    hero_actions: normalizeHeroActions(source),
    footer: normalizeFooter(source),
    page_context: normalizePageContext(source, 'guide'),
    intro: normalizeGuideIntro(source),
    quick_info: source.quick_info || [],
    top_things: normalizeTopThings(source.top_things || []),
    events: normalizeGuideEvents(source.events || []),
    guide_pages: normalizeGuidePages(source.guide_pages || []),
    planning_highlights: normalizePlanningHighlights(source.planning_highlights || []),
    categories: normalizeCategoryCards(source.categories || []),
    neighbourhoods: normalizeNeighbourhoodCards(source.neighbourhoods || []),
    neighbourhood_map: normalizeNeighbourhoodMap(source.neighbourhoods || [], source.city_slug),
    category_intro: source.category_intro || '',
    itinerary: normalizeItinerary(source),
    transport: normalizeTransport(source),
    faqs: normalizeFaqs(source.faqs || []),
    cta_band: normalizeCtaBand(source, 'guide')
  };
}

function normalizeSubpageData(pageData, citySlug, rootData = null) {
  const source = withCityDefaults(pageData, citySlug, rootData);

  return {
    page_type: 'subpage',
    city_slug: source.city_slug,
    city_name: source.city_name,
    current_year: source.current_year,
    home_url: source.city_url,
    theme: normalizeTheme(source),
    seo: normalizeSeo(source, 'subpage'),
    hero: normalizeHero(source, 'subpage'),
    author: normalizeAuthor(source),
    navigation: normalizeNavigation(source, 'subpage'),
    footer: normalizeFooter(source),
    page_context: normalizePageContext(source, 'subpage'),
    intro: {
      body_html: source.intro_html || source.intro_text || ''
    },
    guide_pages: normalizeGuidePages(source.guide_pages || []),
    facts: source.facts || [],
    getting_there: source.getting_there || [],
    todos: normalizeTodos(source.todos || []),
    events: normalizeGuideEvents(source.events || []),
    attractions: normalizeAttractions(source.attractions || [], source.city_slug),
    products: normalizeProducts(source.products || []),
    foods: source.foods || [],
    faqs: normalizeFaqs(source.faqs || []),
    cta_band: normalizeCtaBand(source, 'subpage')
  };
}

function normalizeVenuePageData(pageData, citySlug, rootData = null) {
  const source = withCityDefaults(pageData, citySlug, rootData);

  return {
    page_type: 'venue',
    city_slug: source.city_slug,
    city_name: source.city_name,
    current_year: source.current_year,
    home_url: source.city_url,
    theme: normalizeTheme(source),
    seo: normalizeSeo(source, 'venue'),
    hero: normalizeHero(source, 'venue'),
    author: normalizeAuthor(source),
    navigation: normalizeNavigation(source, 'venue'),
    footer: normalizeFooter(source),
    venue: {
      ...source,
      booking_url:
        source.tiqets_product_id
          ? `/api/track-click?slug=${source.slug}&redirect=https://www.tiqets.com/en/product/${source.tiqets_product_id}/?partner=${source.city_slug}_insider`
          : null,
      lead: source.short_description || '',
      body_html:
        source.long_description ||
        `<p>${escapeHtml(source.short_description || `Plan a visit to ${source.name} in ${source.city_name}.`)}</p>`
    },
    cta_band: normalizeCtaBand(source, 'venue')
  };
}

function withCityDefaults(pageData, citySlug, rootData = null) {
  const base = rootData || pageData;
  return {
    ...pageData,
    city_slug: citySlug,
    city_name: base.city_name || titleize(citySlug),
    city_url: base.city_url || `/${citySlug}/`,
    current_year: new Date().getFullYear(),
    footer_categories:
      pageData.footer_categories ||
      base.footer_categories ||
      (base.categories || []).slice(0, 4).map(item => ({ title: item.title, url: item.url })),
    global_network:
      pageData.global_network ||
      base.global_network ||
      DEFAULT_NETWORK,
    theme:
      pageData.theme ||
      base.theme,
    navigation:
      pageData.navigation ||
      base.navigation,
    footer:
      pageData.footer ||
      base.footer,
    author:
      pageData.author ||
      base.author
  };
}

function normalizeTheme(source) {
  const theme = source.theme || {};
  return {
    accent: theme.accent || source.theme_accent || DEFAULT_THEME.accent,
    accentDark: theme.accentDark || source.theme_accent_dark || DEFAULT_THEME.accentDark,
    accentLight: theme.accentLight || source.theme_accent_light || DEFAULT_THEME.accentLight
  };
}

function normalizeSeo(source, pageType) {
  const seo = source.seo || {};
  const canonical =
    seo.canonical ||
    source.canonical_url ||
    buildAbsolute(pageType === 'guide' ? source.city_url : inferRelativePath(source, pageType));
  const title =
    seo.title ||
    source.meta_title ||
    source.title ||
    source.name ||
    `${source.city_name} Travel Guide`;
  const description =
    seo.description ||
    source.meta_description ||
    source.standfirst ||
    stripHtml(source.short_description || source.intro_html || source.intro_text || `Plan a visit to ${source.city_name}.`);
  const breadcrumbs = buildBreadcrumbs(source, pageType, canonical);
  const og = seo.og || {};
  const twitter = seo.twitter || {};

  return {
    title,
    description,
    canonical,
    og: {
      title: og.title || source.og_title || title,
      description: og.description || source.og_description || description,
      image: og.image || source.og_image || source.hero?.image || source.hero_image || source.image_url || ''
    },
    twitter: {
      title: twitter.title || source.og_title || title,
      description: twitter.description || source.og_description || description,
      image: twitter.image || source.og_image || source.hero?.image || source.hero_image || source.image_url || ''
    },
    breadcrumbs,
    schema: buildSchema(source, pageType, canonical, title, description, breadcrumbs)
  };
}

function normalizeHero(source, pageType) {
  const hero = source.hero || {};

  if (pageType === 'guide') {
    return {
      eyebrow: hero.eyebrow || source.hero_eyebrow || `${source.city_name} Insider Guide`,
      title: hero.title || source.hero_h1 || source.meta_title || `Best Things To Do in ${source.city_name}`,
      tagline:
        hero.tagline ||
        source.hero_tagline ||
        source.category_intro ||
        source.meta_description ||
        '',
      image: hero.image || source.hero_image || source.og_image || '',
      alt: hero.alt || source.hero_alt || `${source.city_name} hero image`
    };
  }

  if (pageType === 'venue') {
    return {
      eyebrow: hero.eyebrow || source.category || source.city_name,
      title: hero.title || source.name || source.title,
      tagline: hero.tagline || source.short_description || '',
      image: hero.image || source.image_url || source.hero_image || '',
      alt: hero.alt || source.name || source.title
    };
  }

  return {
    eyebrow: hero.eyebrow || source.eyebrow || `${source.city_name} Guide`,
    title: hero.title || source.title || source.name,
    tagline: hero.tagline || source.standfirst || '',
    image: hero.image || source.hero_image || '',
    alt: hero.alt || source.title || source.name
  };
}

function normalizeAuthor(source) {
  const author = source.author || {};
  const slug = author.slug || source.author_slug || '';
  return {
    name: author.name || source.author_name || `${source.city_name} Editorial Team`,
    slug,
    url: slug ? `${source.city_url}authors/${slug}/` : source.city_url,
    bio:
      author.bio ||
      `Independent local coverage for ${source.city_name}, with practical booking advice and neighborhood context.`
  };
}

function normalizeNavigation(source, pageType) {
  const navigation = source.navigation || {};
  const homeUrl = source.city_url;
  const defaultLinks = [
    { label: 'Overview', url: pageType === 'guide' ? '#city-overview' : homeUrl, key: 'overview' },
    ...((source.top_things || []).length ? [{ label: 'Best Things To Do', url: pageType === 'guide' ? '#top-things' : `${homeUrl}#top-things`, key: 'top-things' }] : []),
    ...((source.events || []).length ? [{ label: 'What\'s On', url: pageType === 'guide' ? '#events' : `${homeUrl}#events`, key: 'events' }] : []),
    { label: 'Collections', url: `${homeUrl}#collections`, key: 'collections' },
    { label: 'Neighbourhoods', url: `${homeUrl}#neighbourhoods`, key: 'neighbourhoods' }
  ];

  const localLinks = (navigation.local_links || defaultLinks).map((link) => ({
      ...link,
      url:
        pageType !== 'guide' && typeof link.url === 'string' && link.url.startsWith('#')
          ? `${homeUrl}${link.url}`
          : link.url
    }));

  return {
    home_url: homeUrl,
    local_links: localLinks,
    cta: {
      label: navigation.cta?.label || 'Book Tickets',
      url:
        navigation.cta?.url ||
        source.footer_categories?.[0]?.url ||
        source.categories?.[0]?.url ||
        homeUrl
    }
  };
}

function normalizeHeroActions(source) {
  const actions = source.hero_actions || source.hero?.actions || [];

  if (actions.length) {
    return actions
      .map((item) => ({
        label: item.label || '',
        url: item.url || '',
        style: item.style || 'secondary'
      }))
      .filter((item) => item.label && item.url)
      .slice(0, 3);
  }

  const defaults = [];

  if ((source.top_things || []).length) {
    defaults.push({ label: 'Best Things To Do', url: '#top-things', style: 'primary' });
  }

  if ((source.events || []).length) {
    defaults.push({ label: 'What\'s Happening', url: '#events', style: defaults.length ? 'secondary' : 'primary' });
  }

  defaults.push({
    label: source.navigation?.cta?.label || 'Explore Collections',
    url: source.navigation?.cta?.url || `${source.city_url}#collections`,
    style: defaults.length ? 'secondary' : 'primary'
  });

  if (!(source.top_things || []).length) {
    defaults.push({ label: 'See Neighbourhoods', url: '#neighbourhoods', style: 'secondary' });
  }

  return defaults.slice(0, 3);
}

function normalizeFooter(source) {
  const footer = source.footer || {};
  const author = normalizeAuthor(source);
  return {
    brand_name: footer.brand_name || source.city_name,
    description:
      footer.description ||
      `An independent ${source.city_name} travel guide with honest reviews, practical booking tips, and local-first recommendations.`,
    local_links:
      footer.local_links ||
      [
        ...(source.guide_pages || []).map((item) => ({ title: item.title, url: item.url })),
        ...(source.footer_categories || (source.categories || []).slice(0, 4).map(item => ({ title: item.title, url: item.url })))
      ].slice(0, 6),
    network_links: footer.network_links || source.global_network || DEFAULT_NETWORK,
    about_links:
      footer.about_links ||
      [
        { title: 'Meet the Editor', url: author.url },
        { title: `${source.city_name} Guide`, url: source.city_url },
        { title: 'TravelSides Network', url: '/' }
      ],
    newsletter: {
      title: footer.newsletter?.title || 'Stay Inner-Circle',
      description:
        footer.newsletter?.description ||
        `Get seasonal ${source.city_name} tips, smarter booking windows, and local notes without the fluff.`,
      placeholder: footer.newsletter?.placeholder || 'Your email address',
      button_label: footer.newsletter?.button_label || 'Join'
    },
    legal:
      footer.legal ||
      'We may earn a commission on ticket bookings — at no extra cost to you.'
  };
}

function normalizeGuideIntro(source) {
  return {
    eyebrow: 'City Insights',
    title: source.standfirst || source.hero_tagline || `Start with the shape of ${source.city_name}`,
    body_html: source.intro_html || source.intro_text || ''
  };
}

function normalizeCategoryCards(items) {
  return items.map(item => ({
    url: item.url,
    image: item.image,
    alt: item.alt || item.title,
    count: item.count,
    title: item.title,
    description: item.description,
    cta: item.cta || `Explore ${item.title}`
  }));
}

function normalizePlanningHighlights(items) {
  return items.map((item, index) => ({
    kicker: item.kicker || `0${index + 1}`,
    title: item.title || '',
    description: item.description || '',
    link_label: item.link_label || '',
    url: item.url || ''
  }))
  .filter(item => item.title && item.description);
}

function normalizeTopThings(items) {
  return items
    .map((item) => ({
      kicker: item.kicker || item.badge || '',
      title: item.title || '',
      description: item.description || '',
      url: item.url || '',
      image: item.image || '',
      alt: item.alt || item.title || '',
      cta: item.cta || 'See Why It Matters'
    }))
    .filter((item) => item.title && item.description && item.url);
}

function normalizeGuideEvents(items) {
  return items
    .map((item) => ({
      kicker: item.kicker || item.timing || '',
      timing: item.timing || '',
      title: item.title || '',
      description: item.description || '',
      url: item.url || '',
      link_label: item.link_label || item.cta || 'See the city angle',
      venue: item.venue || ''
    }))
    .filter((item) => item.title && item.description);
}

function normalizeGuidePages(items) {
  return items
    .map((item) => ({
      title: item.title || '',
      url: item.url || '',
      description: item.description || ''
    }))
    .filter((item) => item.title && item.url);
}

function normalizePageContext(source, pageType) {
  const context = source.page_context || {};
  const lastUpdated = context.last_updated || source.updated_date || '';
  const label =
    context.label ||
    (pageType === 'guide'
      ? 'City guide'
      : 'Editorial guide');

  return {
    label,
    timeframe: context.timeframe || '',
    last_updated: lastUpdated,
    next_refresh: context.next_refresh || '',
    note: context.note || '',
    freshness: context.freshness || ''
  };
}

function normalizeNeighbourhoodCards(items) {
  return items.map(item => ({
    url: item.url,
    image: item.image,
    alt: item.alt || item.name,
    name: item.name,
    tagline: item.tagline || item.standfirst || ''
  }));
}

function normalizeNeighbourhoodMap(items, citySlug) {
  const cityCoordinates = NEIGHBOURHOOD_MAP_COORDINATES[citySlug] || {};

  return items
    .map((item, index) => {
      const slug = item.slug || slugify(item.name);
      const coordinates = cityCoordinates[slug];

      if (!coordinates) {
        return null;
      }

      return {
        name: item.name,
        slug,
        url: item.url,
        label: item.map_label || item.name,
        lat: coordinates.lat,
        lng: coordinates.lng,
        tone: coordinates.tone || `tone-${(index % 4) + 1}`
      };
    })
    .filter(item => item && item.name && item.url && Number.isFinite(item.lat) && Number.isFinite(item.lng));
}

function normalizeItinerary(source) {
  return {
    title: `Plan ${source.itinerary_days || 3} Days in ${source.city_name}`,
    intro: source.itinerary_intro || '',
    tip_label: source.itinerary_tip_bold || '',
    tip_html: source.itinerary_tip_html || '',
    days: source.itinerary || []
  };
}

function normalizeTransport(source) {
  return {
    items: (source.transport || []).map((item) => ({
      ...item,
      label: item.label || item.title || '',
      value: item.value || item.description || '',
      text: item.text || ''
    })),
    tip_label: source.transport_tip_bold || '',
    tip_html: source.transport_tip_html || '',
    intro: source.weather_intro || ''
  };
}

function normalizeCtaBand(source, pageType) {
  return {
    eyebrow: pageType === 'venue' ? 'Plan Your Visit' : 'Ready When You Are',
    title:
      pageType === 'guide'
        ? `Start booking ${source.city_name} the smart way`
        : `Keep building your ${source.city_name} plan`,
    description:
      pageType === 'venue'
        ? 'Use the city guide to compare neighborhoods, booking windows, and nearby stops before locking in the day.'
        : 'Jump back into the city guide, compare the best things to do, and line up the pages worth opening before you book.',
    primary: {
      label: pageType === 'venue' ? 'Back to the City Guide' : 'Explore the City Guide',
      url: source.city_url
    },
    secondary: {
      label: 'See Collections',
      url: `${source.city_url}#collections`
    }
  };
}

function normalizeTodos(items) {
  return items.map((item, index) => ({
    ...item,
    num: item.num || String(index + 1).padStart(2, '0'),
    description: item.description || item.body || ''
  }));
}

function normalizeAttractions(items, citySlug) {
  return items.map(item => ({
    ...item,
    cta:
      item.cta ||
      (item.category === 'Neighbourhood' ? 'Explore District' : undefined),
    booking_url:
      item.booking_url ||
      (item.tiqets_product_id
        ? `/api/track-click?slug=${item.id}&redirect=https://www.tiqets.com/en/product/${item.tiqets_product_id}/?partner=${citySlug}_insider`
        : null)
  }));
}

function normalizeProducts(items) {
  return items.map(item => ({
    ...item,
    link: item.link || '#'
  }));
}

function normalizeFaqs(items) {
  return items
    .filter(Boolean)
    .map(item => ({
      q: item.q || item.question || '',
      a: item.a || item.answer || ''
    }))
    .filter(item => item.q && item.a);
}

function buildSchema(source, pageType, canonical, title, description, breadcrumbs) {
  const author = normalizeAuthor(source);
  const image = source.og_image || source.hero?.image || source.hero_image || source.image_url || '';
  const schema = [];

  if (pageType === 'venue') {
    schema.push({
      '@context': 'https://schema.org',
      '@type': 'TouristAttraction',
      name: source.name,
      description,
      url: canonical,
      image,
      address: source.address || undefined,
      touristType: source.category || undefined,
      aggregateRating:
        source.rating && source.reviews
          ? {
              '@type': 'AggregateRating',
              ratingValue: String(source.rating),
              reviewCount: String(source.reviews)
            }
          : undefined
    });
  } else {
    schema.push({
      '@context': 'https://schema.org',
      '@type': pageType === 'guide' || pageType === 'subpage' ? 'CollectionPage' : 'WebPage',
      name: title,
      description,
      url: canonical,
      image,
      author: {
        '@type': 'Person',
        name: author.name,
        url: buildAbsolute(author.url)
      },
      about: {
        '@type': 'Place',
        name: source.city_name
      }
    });
  }

  schema.push({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.item
    }))
  });

  return schema;
}

function buildBreadcrumbs(source, pageType, canonical) {
  const items = [
    { name: 'TravelSides', item: buildAbsolute('/') },
    { name: source.city_name, item: buildAbsolute(source.city_url) }
  ];

  if (pageType !== 'guide') {
    items.push({
      name: source.hero?.title || source.name || source.title || source.city_name,
      item: canonical
    });
  }

  return items;
}

function inferRelativePath(source, pageType) {
  if (pageType === 'venue') {
    return `${source.city_url}${source.slug}/`;
  }

  if (source.url) {
    return source.url;
  }

  return source.city_url;
}

function buildAbsolute(value) {
  return value && value.startsWith('http') ? value : `${DEFAULT_ORIGIN}${value || '/'}`;
}

function titleize(value) {
  return String(value || '')
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = {
  normalizeGuidePageData,
  normalizeSubpageData,
  normalizeVenuePageData
};

const NEIGHBOURHOOD_MAP_COORDINATES = {
  amsterdam: {
    noord: { lat: 52.3997, lng: 4.9046, tone: 'tone-3' },
    westerpark: { lat: 52.3868, lng: 4.8702, tone: 'tone-2' },
    jordaan: { lat: 52.3779, lng: 4.8817, tone: 'tone-1' },
    wallen: { lat: 52.3737, lng: 4.8984, tone: 'tone-4' },
    centrum: { lat: 52.3702, lng: 4.8952, tone: 'tone-1' },
    plantage: { lat: 52.3665, lng: 4.9142, tone: 'tone-2' },
    'oud-west': { lat: 52.3657, lng: 4.8687, tone: 'tone-3' },
    museumplein: { lat: 52.3584, lng: 4.8811, tone: 'tone-1' },
    'de-pijp': { lat: 52.3547, lng: 4.8976, tone: 'tone-4' },
    oost: { lat: 52.3608, lng: 4.9306, tone: 'tone-2' }
  }
};
