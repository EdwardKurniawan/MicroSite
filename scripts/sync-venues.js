const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();
const { getCityRecordBySlug } = require('../config/city-registry');
const { getCityPath } = require('../lib/project-paths');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const citySlug = process.argv[2] || 'amsterdam';
const cityRecord = getCityRecordBySlug(citySlug);
const cityId = cityRecord && cityRecord.cityId;

async function sync() {
  if (!cityId) {
    console.error(`City ${citySlug} not found in map.`);
    process.exit(1);
  }

  console.log(`Syncing venues for ${citySlug}...`);

  const { rows: venues } = await pool.query(
    'SELECT name, slug, image_url, tiqets_product_id FROM venues WHERE city_id = $1',
    [cityId]
  );

  console.log(`Found ${venues.length} venues in DB.`);

  const mainDataPath = getCityPath(citySlug, 'data.json');
  
  if (!fs.existsSync(mainDataPath)) {
    console.error(`Main data.json for ${citySlug} not found.`);
    return;
  }

  const mainData = JSON.parse(fs.readFileSync(mainDataPath, 'utf8'));

  // Iterate categories to find sub-data.json files
  if (mainData.categories) {
    for (const cat of mainData.categories) {
      const catSlug = cat.url.replace(/\//g, '');
      const catDataPath = getCityPath(citySlug, catSlug, 'data.json');

      if (fs.existsSync(catDataPath)) {
        console.log(`Processing category: ${catSlug}`);
        const catData = JSON.parse(fs.readFileSync(catDataPath, 'utf8'));

        if (catData.attractions) {
          catData.attractions = catData.attractions.map(attr => {
            // Try to find matching venue in DB by slug first, then name (fuzzy)
            const match = venues.find(v => 
              v.slug === attr.id ||
              v.name.toLowerCase().includes(attr.name.toLowerCase()) || 
              attr.name.toLowerCase().includes(v.name.toLowerCase())
            );

            if (match) {
              console.log(`  MATCH: [${attr.name}] -> [${match.name}] (${match.slug})`);
              const baseAttr = {
                ...attr,
                id: match.slug, // Use slug as ID
                image_url: match.image_url || attr.image_url
              };

              if (match.tiqets_product_id) {
                baseAttr.checkoutUrl = `/api/track-click?slug=${match.slug}&redirect=https://www.tiqets.com/en/product/${match.tiqets_product_id}/?partner=${citySlug}_insider`;
              }
              
              return baseAttr;
            }
            return attr;
          });

          fs.writeFileSync(catDataPath, JSON.stringify(catData, null, 2));
          console.log(`  Saved ${catSlug}/data.json`);
        }
      }
    }
  }

  await pool.end();
  console.log('Sync complete.');
}

sync().catch(err => {
  console.error(err);
  process.exit(1);
});
