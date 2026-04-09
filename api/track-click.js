const { Pool } = require('pg');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const slug = req.query.slug || null;
  const provider = req.query.provider || 'external';
  const source = req.query.source || 'city-guide';
  const redirectUrl = req.query.redirect || '/';
  const safeRedirectUrl = isSafeRedirectUrl(redirectUrl) ? redirectUrl : '/';

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await pool.query(
      'INSERT INTO affiliate_clicks (venue_slug, clicked_at) VALUES ($1, NOW())',
      [slug]
    );
    console.log(`Tracked click: slug=${slug || 'unknown'} provider=${provider} source=${source}`);
  } catch (error) {
    console.error('Vercel /api/track-click error:', error);
  } finally {
    await pool.end();
  }

  res.writeHead(302, { Location: safeRedirectUrl });
  res.end();
};

function isSafeRedirectUrl(value) {
  if (typeof value !== 'string' || !value) {
    return false;
  }

  if (value.startsWith('/')) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch (_error) {
    return false;
  }
}
