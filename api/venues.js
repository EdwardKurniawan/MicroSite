const { Pool } = require('pg');
const {
  CITY_HOSTS,
  getCityRecordBySlug,
  getDefaultCityRecord
} = require('../config/city-registry');

const DEFAULT_CITY = 'amsterdam';
const CATEGORY_ALIASES = {
  'Museum & Art': ['Museum'],
  'Museum & Science': ['Museum'],
  'Museum & History': ['Museum'],
  'Museum & Culture': ['Museum'],
  'Museum & Photography': ['Museum'],
  'Canal & Water': ['Tour'],
  Experience: ['Attraction'],
  'Experience & Views': ['Attraction'],
  'Exhibition & Experience': ['Attraction'],
  'Interactive Experience': ['Attraction'],
  'Immersive Experience': ['Attraction'],
  Entertainment: ['Attraction'],
  'Walking Tour': ['Walking Tour'],
  'Bike Tour': ['Tour'],
  'Food Tour': ['Tour'],
  'Neighbourhood Tour': ['Tour'],
  'Self-Guided Walk': ['Tour', 'Walking Tour'],
  'City Game': ['Tour']
};

function getCityFromRequest(req) {
  const host = (req.headers.host || '').replace(/:\d+$/, '');
  if (CITY_HOSTS[host]) return CITY_HOSTS[host];

  const explicitCity = req.query.city || DEFAULT_CITY;
  return getCityRecordBySlug(explicitCity) || getDefaultCityRecord();
}

function expandCategoryFilter(category) {
  if (!category) return [];
  return CATEGORY_ALIASES[category] || [category];
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const city = getCityFromRequest(req);
    const category = req.query.category;

    let query = `
      SELECT id, name, slug, category, short_description,
             image_url, address, rating, reviews, duration,
             tiqets_product_id, opening_hours
      FROM venues
      WHERE city_id = $1
    `;
    const values = [city.cityId];

    if (category) {
      const categoryValues = expandCategoryFilter(category);
      if (categoryValues.length === 1) {
        query += ' AND category = $2';
        values.push(categoryValues[0]);
      } else {
        query += ' AND category = ANY($2)';
        values.push(categoryValues);
      }
    }

    query += ' ORDER BY rating DESC NULLS LAST';

    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Vercel /api/venues error:', error);
    res.status(500).json({ error: 'Database error' });
  } finally {
    await pool.end();
  }
};
