const CITY_HOSTS = {
  'amsterdam-guide.com': { slug: 'amsterdam', cityId: '59840d0d-d90c-4777-9034-f29cd948768d' },
  'www.amsterdam-guide.com': { slug: 'amsterdam', cityId: '59840d0d-d90c-4777-9034-f29cd948768d' },
  'london-guide.com': { slug: 'london', cityId: '20163dae-9d4b-4b2a-8363-7e38d1f1f6fa' },
  'www.london-guide.com': { slug: 'london', cityId: '20163dae-9d4b-4b2a-8363-7e38d1f1f6fa' },
  'rome-guide.com': { slug: 'rome', cityId: 'b4c8ae6e-635d-4716-8cc4-1769854a998a' },
  'www.rome-guide.com': { slug: 'rome', cityId: 'b4c8ae6e-635d-4716-8cc4-1769854a998a' },
  'berlin-guide.com': { slug: 'berlin', cityId: '8fd41c31-de5b-4b7c-ba2b-3fff93c91ce2' },
  'www.berlin-guide.com': { slug: 'berlin', cityId: '8fd41c31-de5b-4b7c-ba2b-3fff93c91ce2' },
  'kanazawa-guide.com': { slug: 'kanazawa', cityId: '2ebaaaf3-f7d8-45af-9302-bce38b1a847b' },
  'www.kanazawa-guide.com': { slug: 'kanazawa', cityId: '2ebaaaf3-f7d8-45af-9302-bce38b1a847b' }
};

const DEFAULT_CITY_SLUG = process.env.CITY || 'amsterdam';

function getCityRecordBySlug(slug) {
  return Object.values(CITY_HOSTS).find(city => city.slug === slug) || null;
}

function getDefaultCityRecord() {
  return getCityRecordBySlug(DEFAULT_CITY_SLUG) || CITY_HOSTS['amsterdam-guide.com'];
}

module.exports = {
  CITY_HOSTS,
  DEFAULT_CITY_SLUG,
  getCityRecordBySlug,
  getDefaultCityRecord
};
