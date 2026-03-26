require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const Handlebars = require('handlebars');

Handlebars.registerHelper('json', function(context) {
  return JSON.stringify(context);
});

const PORT = process.env.PORT || 3001;
const DIR = __dirname;

// Pre-compile handlebars template
let masterTemplate = null;
let categoryTemplate = null;

try {
  const footerPartial = fs.readFileSync(path.join(DIR, 'shared', 'components', 'footer.hbs'), 'utf8');
  Handlebars.registerPartial('footer', footerPartial);
  
  const hbsSource = fs.readFileSync(path.join(DIR, 'templates', 'guide-master.hbs'), 'utf8');
  masterTemplate = Handlebars.compile(hbsSource);

  const catHbsSource = fs.readFileSync(path.join(DIR, 'templates', 'category-master.hbs'), 'utf8');
  categoryTemplate = Handlebars.compile(catHbsSource);

  console.log('[System] Master & Category Handlebars templates compiling active.');
} catch (e) {
  console.error('[Warning] Failed to load Handlebars templates. Data-driven routing may fail:', e.message);
}

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

  // Local dev fallback — use ?city= query param, then Referer query param, then CITY env var, then amsterdam
  const url = new URL(req.url, `http://${req.headers.host}`);
  let slug = url.searchParams.get('city');

  if (!slug && req.headers.referer) {
    try {
      const refUrl = new URL(req.headers.referer);
      slug = refUrl.searchParams.get('city');
    } catch (e) {}
  }

  slug = slug || DEFAULT_CITY;
  const match = Object.values(CITY_HOSTS).find(c => c.slug === slug);
  return match || CITY_HOSTS['amsterdam-guide.com'];
}

http.createServer(async (req, res) => {
  const urlPath = req.url.split('?')[0];
  const city = getCityFromRequest(req);
  console.log(`[${req.method}] ${req.url} -> City: ${city.slug}`);

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
  // ── API: POST /api/search (WonderGenie style) ────────
  if (urlPath === '/api/search' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { prompt, city: cityParam } = JSON.parse(body);
        const citySlug = cityParam || city.slug;
        const dataPath = path.join(DIR, citySlug, 'data.json');
        
        if (!fs.existsSync(dataPath)) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'City data not found' }));
          return;
        }

        const cityData = JSON.parse(fs.readFileSync(path.join(DIR, citySlug, 'data.json'), 'utf8'));

        // Extract granular attractions from category subdirectories
        const allAttractions = [];
        if (cityData.categories) {
            for (const cat of cityData.categories) {
                const catSlug = cat.url.replace(/\//g, '');
                const catDataPath = path.join(DIR, citySlug, catSlug, 'data.json');
                if (fs.existsSync(catDataPath)) {
                    try {
                        const catData = JSON.parse(fs.readFileSync(catDataPath, 'utf8'));
                        if (catData.attractions) {
                            for (const attr of catData.attractions) {
                                // Default values from JSON
                                let item = {
                                    name: attr.name,
                                    slug: attr.id,
                                    type: 'ticket',
                                    image: attr.image_url,
                                    checkoutUrl: `/${citySlug}/${catSlug}/#${attr.id}`
                                };

                                // Enrich with DB if it's a known slug
                                try {
                                    const venueRes = await pool.query('SELECT tiqets_product_id FROM venues WHERE slug = $1', [attr.id]);
                                    if (venueRes.rows.length > 0 && venueRes.rows[0].tiqets_product_id) {
                                        const pid = venueRes.rows[0].tiqets_product_id;
                                        // use the new tracking endpoint for checkout
                                        item.checkoutUrl = `/api/track-click?slug=${attr.id}&redirect=https://www.tiqets.com/en/product/${pid}/?partner=amsterdam_insider`;
                                    }
                                } catch (dbErr) {
                                    console.error('DB enrichment error:', dbErr.message);
                                }

                                allAttractions.push(item);
                            }
                        }
                    } catch (e) {}
                }
            }
        }

        const freeGems = (cityData.quick_info || [])
            .filter(info => info.value.toLowerCase().includes('free'))
            .map(info => ({ name: info.label, description: info.value, type: 'free' }));

        const inventory = [
            ...allAttractions,
            ...(cityData.neighbourhoods || []).map(n => ({ 
                name: n.name, 
                slug: n.slug, 
                type: 'neighbourhood',
                image: n.image
            })),
            ...freeGems
        ];

        const systemPrompt = `You are AmsterdamInsider's premium AI guide.
CRITICAL: Return a JSON object with a "steps" array. 
For each step, include "image" and "checkoutUrl" from inventory if applicable.
Format:
{
  "summary": "Catchy headline",
  "themeColor": "Hex code",
  "steps": [
    { 
      "time": "Evening",
      "name": "Activity Name",
      "type": "FREE or TICKET or NEIGHBOURHOOD",
      "description": "Short narrative",
      "slug": "matching-slug",
      "image": "image url from inventory",
      "checkoutUrl": "checkoutUrl from inventory"
    }
  ]
}
1. Create a 1-day journey.
2. Mix FREE and TICKET items from inventory:
${JSON.stringify(inventory, null, 2)}`;

        const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            "model": "nvidia/nemotron-3-nano-30b-a3b:free",
            "messages": [
              { "role": "system", "content": systemPrompt },
              { "role": "user", "content": prompt }
            ]
          })
        });

        const aiData = await aiResponse.json();
        const content = aiData.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const cleaned = jsonMatch ? jsonMatch[0] : content;
        const parsed = JSON.parse(cleaned);

        // Insurance: Map 'items' to 'steps' if AI slips up
        if (parsed.items && !parsed.steps) {
            parsed.steps = parsed.items;
            delete parsed.items;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(parsed));
      } catch (err) {
        console.error('Search error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message || 'AI Error' }));
      }
    });
    return;
  }

  // ── Tracking & Newsletter Endpoints ──────────────────
  
  if (req.method === 'GET' && urlPath === '/api/track-click') {
    const slug = query.slug;
    const redirectUrl = query.redirect || '/';
    try {
      await pool.query('INSERT INTO affiliate_clicks (venue_slug, clicked_at) VALUES ($1, NOW())', [slug]);
    } catch (err) {
      console.error('Click tracking error:', err.message);
    }
    res.writeHead(302, { 'Location': redirectUrl });
    res.end();
    return;
  }

  if (req.method === 'POST' && urlPath === '/api/newsletter') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { email, city_slug } = JSON.parse(body);
        await pool.query('INSERT INTO newsletter_signups (email, city_slug, signed_up_at) VALUES ($1, $2, NOW())', [email, city_slug]);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        console.error('Newsletter error:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Database error' }));
      }
    });
    return;
  }

  // ── Static files / Data-driven rendering ─────────────
  let filePath;
  if (urlPath === '/' || urlPath === '') {
    // 1. Scalable Template Route: Check if data.json exists for this city
    const dataPath = path.join(DIR, city.slug, 'data.json');
    if (fs.existsSync(dataPath)) {
      try {
        // Dev Mode: Re-read template on every request for instant visual feedback
        const footerPartial = fs.readFileSync(path.join(DIR, 'shared', 'components', 'footer.hbs'), 'utf8');
        Handlebars.registerPartial('footer', footerPartial);
        const hbsSource = fs.readFileSync(path.join(DIR, 'templates', 'guide-master.hbs'), 'utf8');
        const liveTemplate = Handlebars.compile(hbsSource);

        const pageData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        pageData.current_year = new Date().getFullYear(); // Dynamic helper
        
        const html = liveTemplate(pageData);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
        return;
      } catch (err) {
        console.error(`[Template Render Error for ${city.slug}]:`, err);
      }
    }

    // 2. Legacy Static Route
    const cityIndex = path.join(DIR, city.slug, 'index.html');
    filePath = fs.existsSync(cityIndex) ? cityIndex : path.join(DIR, 'index.html');
  } else if (urlPath.startsWith('/shared/')) {
    // Serve shared assets from the root shared folder
    filePath = path.join(DIR, urlPath);
  } else if (urlPath.startsWith('/images/')) {
    // Serve images from the active city's images folder
    filePath = path.join(DIR, city.slug, urlPath);
  } else {
    // 3. Dynamic Subpage Route: Check if folder/data.json exists
    const cleanSubPath = urlPath.replace(/^\/|\/$/g, '');
    const subDataPath = path.join(DIR, city.slug, cleanSubPath, 'data.json');
    
    if (cleanSubPath && fs.existsSync(subDataPath)) {
      try {
        // Dev Mode: Re-read templates
        const catHbsSource = fs.readFileSync(path.join(DIR, 'templates', 'category-master.hbs'), 'utf8');
        const liveCatTemplate = Handlebars.compile(catHbsSource);
        
        const pageData = JSON.parse(fs.readFileSync(subDataPath, 'utf8'));
        pageData.current_year = new Date().getFullYear();
        
        const html = liveCatTemplate(pageData);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
        return;
      } catch (err) {
        console.error(`[Subpage Render Error for ${urlPath}]:`, err);
      }
    }

    // 4. Premium Venue Route: Check Supabase venues table
    try {
      const venueRes = await pool.query(`
        SELECT v.*, c.name as city_name, c.slug as city_slug 
        FROM venues v 
        JOIN cities c ON v.city_id = c.id 
        WHERE v.slug = $1 AND c.slug = $2
      `, [cleanSubPath, city.slug]);

      if (venueRes.rows.length > 0) {
        const venueHbsSource = fs.readFileSync(path.join(DIR, 'templates', 'venue-master.hbs'), 'utf8');
        const liveVenueTemplate = Handlebars.compile(venueHbsSource);
        
        const venueData = venueRes.rows[0];
        venueData.current_year = new Date().getFullYear();
        
        const html = liveVenueTemplate(venueData);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
        return;
      }
    } catch (dbErr) {
      console.error(`[Venue Render Error for ${urlPath}]:`, dbErr.message);
    }

    filePath = path.join(DIR, city.slug, urlPath);
    if (!path.extname(filePath)) {
      filePath = path.join(filePath, 'index.html');
    }
  }
  
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) { 
      res.writeHead(404); 
      res.end('Not found'); 
      return; 
    }
    res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain' });
    res.end(data);
  });

}).listen(PORT, () => {
  console.log(`TravelSides running on http://localhost:${PORT}`);
  console.log(`  Local dev: http://localhost:${PORT}/?city=amsterdam`);
  console.log(`  Local dev: http://localhost:${PORT}/?city=london`);
});
