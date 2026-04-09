const TICKETMASTER_DISCOVERY_URL = 'https://app.ticketmaster.com/discovery/v2/events.json';

async function searchTicketmasterEvents(options) {
  const {
    apiKey,
    cityName,
    countryCode,
    startDateTime,
    endDateTime,
    keyword,
    classificationName,
    size = 20,
    page = 0,
    sort = 'date,asc'
  } = options;

  if (!apiKey) {
    throw new Error('Missing TICKETMASTER_API_KEY.');
  }

  if (!cityName) {
    throw new Error('Ticketmaster search requires a city name.');
  }

  const params = new URLSearchParams({
    apikey: apiKey,
    city: cityName,
    size: String(size),
    page: String(page),
    sort
  });

  if (countryCode) params.set('countryCode', countryCode);
  if (startDateTime) params.set('startDateTime', startDateTime);
  if (endDateTime) params.set('endDateTime', endDateTime);
  if (keyword) params.set('keyword', keyword);
  if (classificationName) params.set('classificationName', classificationName);

  const response = await fetch(`${TICKETMASTER_DISCOVERY_URL}?${params.toString()}`, {
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ticketmaster request failed (${response.status}): ${text.slice(0, 300)}`);
  }

  const json = await response.json();
  const events = json?._embedded?.events || [];

  return {
    provider: 'ticketmaster',
    query: {
      cityName,
      countryCode,
      startDateTime,
      endDateTime,
      keyword,
      classificationName,
      size,
      page,
      sort
    },
    page: json?.page || null,
    count: events.length,
    results: events.map(normalizeTicketmasterEvent)
  };
}

function normalizeTicketmasterEvent(event) {
  const venue = event?._embedded?.venues?.[0] || {};
  const classification = event?.classifications?.[0] || {};
  const segment = classification.segment?.name || '';
  const genre = classification.genre?.name || '';
  const subGenre = classification.subGenre?.name || '';
  const priceRange = event?.priceRanges?.[0] || null;
  const image = pickBestImage(event?.images || []);

  return {
    provider: 'ticketmaster',
    provider_event_id: event.id || '',
    title: event.name || '',
    url: event.url || '',
    start_date: event?.dates?.start?.localDate || '',
    start_time: event?.dates?.start?.localTime || '',
    end_date: event?.dates?.end?.localDate || '',
    end_time: event?.dates?.end?.localTime || '',
    timezone: event?.dates?.timezone || '',
    status: event?.dates?.status?.code || '',
    segment,
    genre,
    sub_genre: subGenre,
    venue_name: venue.name || '',
    venue_city: venue.city?.name || '',
    venue_country: venue.country?.countryCode || '',
    venue_address: venue.address?.line1 || '',
    image_url: image?.url || '',
    min_price: priceRange?.min || null,
    max_price: priceRange?.max || null,
    currency: priceRange?.currency || ''
  };
}

function pickBestImage(images) {
  const preferred = ['16_9', '4_3', '3_2'];

  for (const ratio of preferred) {
    const found = images
      .filter((image) => image.ratio === ratio)
      .sort((a, b) => (b.width || 0) - (a.width || 0))[0];

    if (found) {
      return found;
    }
  }

  return images.sort((a, b) => (b.width || 0) - (a.width || 0))[0] || null;
}

module.exports = {
  searchTicketmasterEvents
};
