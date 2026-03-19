require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const PORT = process.env.PORT || 3001;
const DIR = __dirname;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const mime = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'text/javascript',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.xml':  'application/xml',
  '.txt':  'text/plain',
};

// Map hostname → { citySlug, cityId }
// Add a new entry here for each new city domain
const CITY_HOSTS = {
  'amsterdam-guide.com':     { slug: 'amsterdam', cityId: '59840d0d-d90c-4777-9034-f29cd948768d' },
  'www.amsterdam-guide.com': { slug: 'amsterdam', cityId: '59840d0d-d90c-4777-9034-f29cd948768d' },
  'london-guide.com':        { slug: 'london',    cityId: '20163dae-9d4b-4b2a-8363-7e38d1f1f6fa' },
  'www.london-guide.com':    { slug: 'london',    cityId: '20163dae-9d4b-4b2a-8363-7e38d1f1f6fa' },
  'rome-guide.com':          { slug: 'rome',      cityId: 'b4c8ae6e-635d-4716-8cc4-1769854a998a' },
  'www.rome-guide.com':      { slug: 'rome',      cityId: 'b4c8ae6e-635d-4716-8cc4-1769854a998a' },
  'berlin-guide.com':        { slug: 'berlin',    cityId: '8fd41c31-de5b-4b7c-ba2b-3fff93c91ce2' },
  'www.berlin-guide.com':    { slug: 'berlin',    cityId: '8fd41c31-de5b-4b7c-ba2b-3fff93c91ce2' },
  'kanazawa-guide.com':      { slug: 'kanazawa', cityId: '2ebaaaf3-f7d8-45af-9302-bce38b1a847b' },
  'www.kanazawa-guide.com':  { slug: 'kanazawa', cityId: '2ebaaaf3-f7d8-45af-9302-bce38b1a847b' },
};

// Local dev: CITY env var or ?city= query param overrides hostname
const DEFAULT_CITY = process.env.CITY || 'amsterdam';

function getCityFromRequest(req) {
  const host = (req.headers.host || '').replace(/:\d+$/, '');
  if (CITY_HOSTS[host]) return CITY_HOSTS[host];

  // Local dev fallback — use ?city= query param, then CITY env var, then amsterdam
  const params = new URLSearchParams(req.url.split('?')[1] || '');
  const slug = params.get('city') || DEFAULT_CITY;
  const match = Object.values(CITY_HOSTS).find(c => c.slug === slug);
  return match || CITY_HOSTS['amsterdam-guide.com'];
}

http.createServer(async (req, res) => {
  const urlPath = req.url.split('?')[0];
  const city = getCityFromRequest(req);

  // ── API: GET /api/venues ──────────────────────────────
  if (urlPath === '/api/venues') {
    try {
      const params = new URLSearchParams(req.url.split('?')[1] || '');
      const category = params.get('category');

      let query = `
        SELECT id, name, slug, category, short_description,
               image_url, address, rating, reviews, duration,
               tiqets_product_id, opening_hours
        FROM venues
        WHERE city_id = $1
      `;
      const values = [city.cityId];

      if (category) {
        query += ` AND category = $2`;
        values.push(category);
      }

      query += ` ORDER BY rating DESC NULLS LAST`;

      const result = await pool.query(query, values);
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify(result.rows));
    } catch (err) {
      console.error('DB error:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Database error' }));
    }
    return;
  }

  // ── Static files — serve from city folder ─────────────
  // If a specific city is active and has its own index.html, serve that.
  // Root hub index.html only served when no city folder index exists.
  let filePath;
  if (urlPath === '/' || urlPath === '') {
    const cityIndex = path.join(DIR, city.slug, 'index.html');
    filePath = fs.existsSync(cityIndex) ? cityIndex : path.join(DIR, 'index.html');
  } else if (urlPath.startsWith('/images/')) {
    // Serve images from the active city's images folder
    filePath = path.join(DIR, city.slug, urlPath);
  } else {
    filePath = path.join(DIR, city.slug, urlPath);
    if (!path.extname(filePath)) {
      filePath = path.join(filePath, 'index.html');
    }
  }

  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain' });
    res.end(data);
  });

}).listen(PORT, () => {
  console.log(`TravelSides running on http://localhost:${PORT}`);
  console.log(`  Local dev: http://localhost:${PORT}/?city=amsterdam`);
  console.log(`  Local dev: http://localhost:${PORT}/?city=london`);
});
