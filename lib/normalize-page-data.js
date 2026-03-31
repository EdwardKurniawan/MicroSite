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
    footer: normalizeFooter(source),
    intro: normalizeGuideIntro(source),
    quick_info: source.quick_info || [],
    categories: normalizeCategoryCards(source.categories || []),
    neighbourhoods: normalizeNeighbourhoodCards(source.neighbourhoods || []),
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
    intro: {
      body_html: source.intro_html || source.intro_text || ''
    },
    facts: source.facts || [],
    getting_there: source.getting_there || [],
    todos: normalizeTodos(source.todos || []),
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
      image: og.image || source.og_image || source.hero_image || source.image_url || ''
    },
    twitter: {
      title: twitter.title || source.og_title || title,
      description: twitter.description || source.og_description || description,
      image: twitter.image || source.og_image || source.hero_image || source.image_url || ''
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
  const localLinks =
    navigation.local_links ||
    [
      { label: 'Overview', url: pageType === 'guide' ? '#city-overview' : homeUrl, key: 'overview' },
      { label: 'Collections', url: `${homeUrl}#collections`, key: 'collections' },
      { label: 'Neighbourhoods', url: `${homeUrl}#neighbourhoods`, key: 'neighbourhoods' },
      { label: 'AI Planner', url: pageType === 'guide' ? '#hero-search-input' : `${homeUrl}#plan-your-trip`, key: 'planner' }
    ];

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
      source.footer_categories ||
      (source.categories || []).slice(0, 4).map(item => ({ title: item.title, url: item.url })),
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
    body_html: source.intro_text || source.intro_html || ''
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

function normalizeNeighbourhoodCards(items) {
  return items.map(item => ({
    url: item.url,
    image: item.image,
    alt: item.alt || item.name,
    name: item.name,
    tagline: item.tagline || item.standfirst || ''
  }));
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
    items: source.transport || [],
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
        : 'Jump back into the city guide, compare collections, and use the planner to tighten the trip.',
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
  const image = source.og_image || source.hero_image || source.image_url || '';
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
      name: source.title || source.name || source.city_name,
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
