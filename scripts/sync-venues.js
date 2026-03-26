const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const citySlug = process.argv[2] || 'amsterdam';
const cityIdMap = {
  'amsterdam': '59840d0d-d90c-4777-9034-f29cd948768d',
  'kanazawa': '2ebaaaf3-f7d8-45af-9302-bce38b1a847b',
  'london': '20163dae-9d4b-4b2a-8363-7e38d1f1f6fa',
  'rome': 'b4c8ae6e-635d-4716-8cc4-1769854a998a'
};

const cityId = cityIdMap[citySlug];

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

  const cityDir = path.join(__dirname, '..', citySlug);
  const mainDataPath = path.join(cityDir, 'data.json');
  
  if (!fs.existsSync(mainDataPath)) {
    console.error(`Main data.json for ${citySlug} not found.`);
    return;
  }

  const mainData = JSON.parse(fs.readFileSync(mainDataPath, 'utf8'));

  // Iterate categories to find sub-data.json files
  if (mainData.categories) {
    for (const cat of mainData.categories) {
      const catSlug = cat.url.replace(/\//g, '');
      const catDataPath = path.join(cityDir, catSlug, 'data.json');

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
                baseAttr.checkoutUrl = `/api/track-click?slug=${match.slug}&redirect=https://www.tiqets.com/en/product/${match.tiqets_product_id}/?partner=amsterdam_insider`;
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
