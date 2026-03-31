/**
 * download-amsterdam-missing.js
 * Downloads the 2 missing Amsterdam page images with broader queries.
 * Run: node scripts/download-amsterdam-missing.js
 */

require('dotenv').config();
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const { getCityPath } = require('../lib/project-paths');

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
if (!ACCESS_KEY) { console.error('UNSPLASH_ACCESS_KEY not set'); process.exit(1); }

const OUT_DIR = getCityPath('amsterdam', 'images');

const IMAGES = [
  {
    file: 'noord.jpg',
    queries: [
      'amsterdam noord waterfront',
      'amsterdam industrial harbour',
      'amsterdam river ij waterfront',
    ],
    w: 700, h: 400, orientation: 'landscape',
  },
  {
    file: 'museumplein.jpg',
    queries: [
      'amsterdam park square netherlands',
      'amsterdam rijksmuseum facade',
      'amsterdam netherlands cityscape',
    ],
    w: 700, h: 400, orientation: 'landscape',
  },
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
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close(); fs.unlinkSync(dest);
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', err => { try { fs.unlinkSync(dest); } catch(e){} reject(err); });
  });
}

async function fetchWithFallbacks({ file, queries, w, h, orientation }) {
  const dest = path.join(OUT_DIR, file);
  if (fs.existsSync(dest)) { console.log(`⏭️  Skip (exists): ${file}`); return; }

  for (const query of queries) {
    console.log(`\n🔍  Trying: "${query}"`);
    const raw  = await get(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=${orientation}&order_by=relevant`);
    const json = JSON.parse(raw);
    if (!json.results?.length) { console.log('   ⚠️  No results'); continue; }

    // Pick highest-liked photo
    const photo = json.results.sort((a, b) => b.likes - a.likes)[0];
    const imgUrl = `${photo.urls.raw}&w=${w}&h=${h}&fit=crop&auto=format&q=90&sharp=10`;
    await download(imgUrl, dest);
    console.log(`   ✅  ${file}  by ${photo.user.name} (${photo.likes} likes)`);
    return;
  }
  console.error(`❌  Failed all queries for ${file}`);
}

(async () => {
  console.log('\n🇳🇱  Amsterdam Missing Images');
  console.log('================================\n');
  for (const img of IMAGES) {
    try {
      await fetchWithFallbacks(img);
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`❌  ${img.file}: ${err.message}`);
    }
  }
  console.log('\n✨  Done.\n');
})();
