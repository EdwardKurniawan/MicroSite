const cityRecords = require('./cities.json');

const CITY_HOSTS = cityRecords.reduce((hosts, city) => {
  for (const domain of city.domains || []) {
    hosts[domain] = { slug: city.slug, cityId: city.cityId };
  }
  return hosts;
}, {});

const DEFAULT_CITY_SLUG = process.env.CITY || 'amsterdam';

function getCityRecordBySlug(slug) {
  const record = cityRecords.find(city => city.slug === slug);
  return record ? { slug: record.slug, cityId: record.cityId } : null;
}

function getDefaultCityRecord() {
  return getCityRecordBySlug(DEFAULT_CITY_SLUG) || CITY_HOSTS['amsterdam-guide.com'];
}

module.exports = {
  CITY_HOSTS,
  CITY_RECORDS: cityRecords,
  DEFAULT_CITY_SLUG,
  getCityRecordBySlug,
  getDefaultCityRecord
};
