const { Pool } = require('pg');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const slug = req.query.slug || null;
  const redirectUrl = req.query.redirect || '/';

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await pool.query(
      'INSERT INTO affiliate_clicks (venue_slug, clicked_at) VALUES ($1, NOW())',
      [slug]
    );
  } catch (error) {
    console.error('Vercel /api/track-click error:', error);
  } finally {
    await pool.end();
  }

  res.writeHead(302, { Location: redirectUrl });
  res.end();
};
