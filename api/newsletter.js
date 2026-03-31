const { Pool } = require('pg');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const { email, city_slug } = req.body || {};

    if (!email || !city_slug) {
      res.status(400).json({ error: 'Email and city_slug are required' });
      return;
    }

    await pool.query(
      'INSERT INTO newsletter_signups (email, city_slug, signed_up_at) VALUES ($1, $2, NOW()) ON CONFLICT (email) DO UPDATE SET city_slug = EXCLUDED.city_slug, signed_up_at = NOW()',
      [email, city_slug]
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Vercel /api/newsletter error:', error);
    res.status(500).json({ error: 'Database error' });
  } finally {
    await pool.end();
  }
};
