/**
 * download-venue-images.js
 * Downloads images for each Kanazawa venue, saves locally,
 * and updates the image_url in Supabase.
 *
 * Run: node scripts/download-venue-images.js
 */

require('dotenv').config();
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const { Pool } = require('pg');
const { getCityPath } = require('../lib/project-paths');

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const OUT_DIR = getCityPath('kanazawa', 'images', 'venues');
fs.mkdirSync(OUT_DIR, { recursive: true });

// Each venue: slug (matches DB), Unsplash search query, emoji fallback
const VENUES = [
  { slug: 'kenroku-en-garden',             query: 'kenroku-en garden stone lantern kanazawa',    emoji: '🌿' },
  { slug: 'higashi-chaya-district',        query: 'higashi chaya kanazawa geisha teahouse street',emoji: '🏮' },
  { slug: '21st-century-museum',           query: '21st century museum kanazawa contemporary art', emoji: '🎨' },
  { slug: 'kanazawa-castle-park',          query: 'kanazawa castle white turret japan',            emoji: '🏯' },
  { slug: 'omicho-market',                 query: 'omicho market kanazawa fresh seafood fish',     emoji: '🐟' },
  { slug: 'nagamachi-samurai-district',    query: 'nagamachi kanazawa samurai earthen wall lane',  emoji: '⚔️'  },
  { slug: 'myoryuji-ninja-temple',         query: 'japan temple hidden ancient architecture',      emoji: '🥷' },
  { slug: 'nishi-chaya-district',          query: 'nishi chaya kanazawa traditional teahouse',     emoji: '🍵' },
  { slug: 'higashiyama-temple-walk',       query: 'japan temple stone path moss lantern hillside', emoji: '⛩️'  },
  { slug: 'dt-suzuki-museum',              query: 'zen museum water mirror garden japan minimalist',emoji: '🪷' },
];

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { Authorization: `Client-ID ${ACCESS_KEY}` } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) return get(res.headers.location).then(resolve).catch(reject);
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d)); res.on('error', reject);
    }).on('error', reject);
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) { file.close(); fs.unlinkSync(dest); return download(res.headers.location, dest).then(resolve).catch(reject); }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', err => { try { fs.unlinkSync(dest); } catch(e){} reject(err); });
  });
}

async function processVenue({ slug, query }) {
  const dest = path.join(OUT_DIR, `${slug}.jpg`);

  // Skip if already downloaded
  if (fs.existsSync(dest)) {
    console.log(`⏭️  Skip (exists): ${slug}`);
    return `/images/venues/${slug}.jpg`;
  }

  const raw  = await get(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`);
  const json = JSON.parse(raw);

  if (!json.results?.length) {
    // Fallback to broader Japan query
    const raw2  = await get(`https://api.unsplash.com/search/photos?query=${encodeURIComponent('kanazawa japan traditional')}&per_page=1&orientation=landscape`);
    const json2 = JSON.parse(raw2);
    if (!json2.results?.length) { console.warn(`⚠️  No image found: ${slug}`); return null; }
    const photo2 = json2.results[0];
    await download(`${photo2.urls.raw}&w=700&h=420&fit=crop&auto=format&q=82`, dest);
    console.log(`✅  ${slug} (fallback) — ${photo2.user.name}`);
    return `/images/venues/${slug}.jpg`;
  }

  const photo = json.results[0];
  await download(`${photo.urls.raw}&w=700&h=420&fit=crop&auto=format&q=82`, dest);
  console.log(`✅  ${slug} — ${photo.user.name}`);
  return `/images/venues/${slug}.jpg`;
}

async function updateDB(slug, imageUrl) {
  await pool.query('UPDATE venues SET image_url = $1 WHERE slug = $2', [imageUrl, slug]);
}

(async () => {
  console.log('\n🖼️  Kanazawa Venue Image Downloader');
  console.log('=====================================\n');

  for (const venue of VENUES) {
    try {
      const url = await processVenue(venue);
      if (url) {
        await updateDB(venue.slug, url);
        console.log(`   DB updated → ${venue.slug}\n`);
      }
      await new Promise(r => setTimeout(r, 400));
    } catch (err) {
      console.error(`❌  ${venue.slug}: ${err.message}`);
    }
  }

  console.log('\n✨  Done! Venue images saved to kanazawa/images/venues/');
  console.log('   Reload the page to see images in the venue cards.\n');
  await pool.end();
})();
