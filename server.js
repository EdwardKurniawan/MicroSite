require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const Handlebars = require('handlebars');
const {
  CITY_HOSTS,
  getCityRecordBySlug,
  getDefaultCityRecord
} = require('./config/city-registry');
const {
  ROOT_DIR,
  getCityPath,
  getTemplatePath,
  getSharedPath
} = require('./lib/project-paths');
const { registerHandlebarsDefaults } = require('./lib/handlebars');
const {
  normalizeGuidePageData,
  normalizeSubpageData,
  normalizeVenuePageData
} = require('./lib/normalize-page-data');

registerHandlebarsDefaults(Handlebars);

const PORT = process.env.PORT || 3001;
const DIR = ROOT_DIR;
const DEFAULT_CITY = process.env.CITY || 'amsterdam';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const mime = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
  '.txt': 'text/plain'
};

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

function compileTemplate(templateName) {
  const source = fs.readFileSync(getTemplatePath(templateName), 'utf8');
  return Handlebars.compile(source);
}

function getCityFromRequest(req) {
  const host = (req.headers.host || '').replace(/:\d+$/, '');
  if (CITY_HOSTS[host]) return CITY_HOSTS[host];

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let slug = url.searchParams.get('city');

  if (!slug && req.headers.referer) {
    try {
      const refUrl = new URL(req.headers.referer);
      slug = refUrl.searchParams.get('city');
    } catch (_error) {
      // ignore invalid referrers
    }
  }

  slug = slug || DEFAULT_CITY;
  return getCityRecordBySlug(slug) || getDefaultCityRecord();
}

function expandCategoryFilter(category) {
  if (!category) return [];
  return CATEGORY_ALIASES[category] || [category];
}

async function readJson(filePath) {
  return JSON.parse(await fs.promises.readFile(filePath, 'utf8'));
}

http
  .createServer(async (req, res) => {
    const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const urlPath = requestUrl.pathname;
    const city = getCityFromRequest(req);
    console.log(`[${req.method}] ${req.url} -> City: ${city.slug}`);

    if (urlPath === '/api/venues') {
      try {
        const category = requestUrl.searchParams.get('category');
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
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify(result.rows));
      } catch (err) {
        console.error('DB error:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Database error' }));
      }
      return;
    }

    if (urlPath === '/api/search' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', async () => {
        try {
          const { prompt, city: cityParam } = JSON.parse(body);
          const citySlug = cityParam || city.slug;
          const activeCity = getCityRecordBySlug(citySlug) || city;
          const dataPath = getCityPath(citySlug, 'data.json');

          if (!fs.existsSync(dataPath)) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'City data not found' }));
            return;
          }

          const cityData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
          const allAttractions = [];

          for (const cat of cityData.categories || []) {
            const catSlug = cat.url.replace(/\//g, '');
            const catDataPath = getCityPath(citySlug, catSlug, 'data.json');
            if (!fs.existsSync(catDataPath)) continue;

            try {
              const catData = JSON.parse(fs.readFileSync(catDataPath, 'utf8'));
              for (const attr of catData.attractions || []) {
                const item = {
                  name: attr.name,
                  slug: attr.id,
                  type: 'ticket',
                  image: attr.image_url,
                  checkoutUrl: `/${citySlug}/${catSlug}/#${attr.id}`
                };

                try {
                  const venueRes = await pool.query(
                    'SELECT tiqets_product_id FROM venues WHERE slug = $1 AND city_id = $2',
                    [attr.id, activeCity.cityId]
                  );
                  if (venueRes.rows.length > 0 && venueRes.rows[0].tiqets_product_id) {
                    const pid = venueRes.rows[0].tiqets_product_id;
                    item.checkoutUrl = `/api/track-click?slug=${attr.id}&redirect=https://www.tiqets.com/en/product/${pid}/?partner=${citySlug}_insider`;
                  }
                } catch (dbErr) {
                  console.error('DB enrichment error:', dbErr.message);
                }

                allAttractions.push(item);
              }
            } catch (_error) {
              // skip bad category JSON
            }
          }

          const freeGems = (cityData.quick_info || [])
            .filter((info) => String(info.value || '').toLowerCase().includes('free'))
            .map((info) => ({ name: info.label, description: info.value, type: 'free' }));

          const inventory = [
            ...allAttractions,
            ...(cityData.neighbourhoods || []).map((n) => ({
              name: n.name,
              slug: n.slug,
              type: 'neighbourhood',
              image: n.image
            })),
            ...freeGems
          ];

          const systemPrompt = `You are ${cityData.city_name} Insider's premium AI guide.
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
Create a 1-day journey using this inventory:
${JSON.stringify(inventory, null, 2)}`;

          const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'nvidia/nemotron-3-nano-30b-a3b:free',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
              ]
            })
          });

          const aiData = await aiResponse.json();
          const content = aiData.choices[0].message.content;
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          const cleaned = jsonMatch ? jsonMatch[0] : content;
          const parsed = JSON.parse(cleaned);

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

    if (req.method === 'GET' && urlPath === '/api/track-click') {
      const slug = requestUrl.searchParams.get('slug');
      const redirectUrl = requestUrl.searchParams.get('redirect') || '/';
      try {
        await pool.query('INSERT INTO affiliate_clicks (venue_slug, clicked_at) VALUES ($1, NOW())', [slug]);
      } catch (err) {
        console.error('Click tracking error:', err.message);
      }
      res.writeHead(302, { Location: redirectUrl });
      res.end();
      return;
    }

    if (req.method === 'POST' && urlPath === '/api/newsletter') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', async () => {
        try {
          const { email, city_slug } = JSON.parse(body);
          await pool.query(
            'INSERT INTO newsletter_signups (email, city_slug, signed_up_at) VALUES ($1, $2, NOW())',
            [email, city_slug]
          );
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

    let filePath;

    if (urlPath === '/' || urlPath === '') {
      const dataPath = getCityPath(city.slug, 'data.json');
      if (fs.existsSync(dataPath)) {
        try {
          registerHandlebarsDefaults(Handlebars);
          const liveTemplate = compileTemplate('guide-master.hbs');
          const pageData = normalizeGuidePageData(await readJson(dataPath), city.slug);
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(liveTemplate(pageData));
          return;
        } catch (err) {
          console.error(`[Template Render Error for ${city.slug}]:`, err);
        }
      }

      const cityIndex = getCityPath(city.slug, 'index.html');
      filePath = fs.existsSync(cityIndex) ? cityIndex : path.join(DIR, 'index.html');
    } else if (urlPath.startsWith('/shared/')) {
      filePath = getSharedPath(urlPath.replace(/^\/shared\//, ''));
    } else if (urlPath.startsWith('/images/')) {
      filePath = getCityPath(city.slug, urlPath.replace(/^\//, ''));
    } else {
      const cleanSubPath = urlPath.replace(/^\/|\/$/g, '');
      const subDataPath = getCityPath(city.slug, cleanSubPath, 'data.json');

      if (cleanSubPath && fs.existsSync(subDataPath)) {
        try {
          registerHandlebarsDefaults(Handlebars);
          const liveTemplate = compileTemplate('category-master.hbs');
          const pageData = await readJson(subDataPath);
          if (!pageData.url) {
            pageData.url = `/${city.slug}/${cleanSubPath}/`;
          }
          const rootDataPath = getCityPath(city.slug, 'data.json');
          const rootData = fs.existsSync(rootDataPath) ? await readJson(rootDataPath) : null;

          if (pageData.attractions && pageData.attractions.length > 0) {
            const venueRes = await pool.query(
              'SELECT slug, tiqets_product_id FROM venues WHERE city_id = $1',
              [city.cityId]
            );
            const venueMap = {};
            venueRes.rows.forEach((venue) => {
              if (venue.slug) venueMap[venue.slug] = venue.tiqets_product_id;
            });

            pageData.attractions = pageData.attractions.map((attr) => {
              const nextAttr = { ...attr };
              if (nextAttr.id && venueMap[nextAttr.id]) {
                nextAttr.tiqets_product_id = venueMap[nextAttr.id];
                nextAttr.booking_url = `/api/track-click?slug=${nextAttr.id}&redirect=https://www.tiqets.com/en/product/${venueMap[nextAttr.id]}/?partner=${city.slug}_insider`;
              }
              return nextAttr;
            });
          }

          const normalized = normalizeSubpageData(pageData, city.slug, rootData);
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(liveTemplate(normalized));
          return;
        } catch (err) {
          console.error(`[Subpage Render Error for ${urlPath}]:`, err);
        }
      }

      try {
        const venueRes = await pool.query(
          `
            SELECT v.*, c.name as city_name, c.slug as city_slug
            FROM venues v
            JOIN cities c ON v.city_id = c.id
            WHERE v.slug = $1 AND c.slug = $2
          `,
          [cleanSubPath, city.slug]
        );

        if (venueRes.rows.length > 0) {
          registerHandlebarsDefaults(Handlebars);
          const liveTemplate = compileTemplate('venue-master.hbs');
          const rootDataPath = getCityPath(city.slug, 'data.json');
          const rootData = fs.existsSync(rootDataPath) ? await readJson(rootDataPath) : null;
          const venueData = normalizeVenuePageData(venueRes.rows[0], city.slug, rootData);
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(liveTemplate(venueData));
          return;
        }
      } catch (dbErr) {
        console.error(`[Venue Render Error for ${urlPath}]:`, dbErr.message);
      }

      filePath = getCityPath(city.slug, urlPath.replace(/^\//, ''));
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
  })
  .listen(PORT, () => {
    console.log(`TravelSides running on http://localhost:${PORT}`);
    console.log(`  Local dev: http://localhost:${PORT}/?city=amsterdam`);
    console.log(`  Local dev: http://localhost:${PORT}/?city=kanazawa`);
  });
