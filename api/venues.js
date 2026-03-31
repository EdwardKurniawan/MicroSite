const { Pool } = require('pg');

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
  const match = Object.values(CITY_HOSTS).find(city => city.slug === explicitCity);
  return match || CITY_HOSTS['amsterdam-guide.com'];
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
