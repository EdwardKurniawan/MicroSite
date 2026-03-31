/**
 * download-kanazawa-images.js
 * Downloads optimised images for the Kanazawa guide from Unsplash.
 *
 * SETUP (one-time):
 *   1. Go to https://unsplash.com/developers → "New Application" (free)
 *   2. Copy your Access Key
 *   3. Add to .env:  UNSPLASH_ACCESS_KEY=your_key_here
 *   4. Run: node scripts/download-kanazawa-images.js
 *
 * Images are saved to kanazawa/images/
 */

require('dotenv').config();
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const { getCityPath } = require('../lib/project-paths');

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
if (!ACCESS_KEY) {
  console.error('\n❌  UNSPLASH_ACCESS_KEY not set in .env');
  console.error('   Get a free key at https://unsplash.com/developers\n');
  process.exit(1);
}

const OUT_DIR = getCityPath('kanazawa', 'images');
fs.mkdirSync(OUT_DIR, { recursive: true });

// Images needed — query → saved filename
// Set to true to only re-download missing files
const SKIP_EXISTING = true;

const IMAGES = [
  { query: 'kenroku-en garden kanazawa',       file: 'hero.jpg',           w: 1400, h: 700,  orientation: 'landscape' },
  { query: 'kenroku-en garden stone lantern',  file: 'gardens.jpg',        w: 700,  h: 400,  orientation: 'landscape' },
  { query: 'higashi chaya kanazawa geisha',     file: 'culture.jpg',        w: 700,  h: 400,  orientation: 'landscape' },
  { query: 'japanese market seafood fresh',     file: 'food.jpg',           w: 700,  h: 400,  orientation: 'landscape' },
  { query: 'shirakawa-go japan mountain village',file:'day-trips.jpg',      w: 700,  h: 400,  orientation: 'landscape' },
  { query: 'japan temple stone path lantern',   file: 'higashiyama.jpg',    w: 400,  h: 300,  orientation: 'squarish'  },
  { query: 'japan traditional earthen wall lane',file: 'nagamachi.jpg',     w: 400,  h: 300,  orientation: 'squarish'  },
  { query: 'japan city night street lights',    file: 'katamachi.jpg',      w: 400,  h: 300,  orientation: 'squarish'  },
  { query: 'nishi chaya traditional japan',     file: 'nishi-chaya.jpg',    w: 400,  h: 300,  orientation: 'squarish'  },
  { query: 'kanazawa castle japan white',       file: 'kanazawa-castle.jpg',w: 700,  h: 400,  orientation: 'landscape' },
  { query: 'omicho market kanazawa fish',       file: 'omicho.jpg',         w: 700,  h: 400,  orientation: 'landscape' },
  { query: 'kanazawa japan traditional town',  file: 'og-image.jpg',       w: 1200, h: 630,  orientation: 'landscape' },
];

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { Authorization: `Client-ID ${ACCESS_KEY}` } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return get(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', err => { fs.unlinkSync(dest); reject(err); });
  });
}

async function fetchAndSave({ query, file, w, h, orientation }) {
  const savePath = path.join(OUT_DIR, file);
  if (SKIP_EXISTING && fs.existsSync(savePath)) {
    console.log(`\n⏭️   Skipping (exists): ${file}`);
    return null;
  }

  const apiUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=${orientation}`;
  console.log(`\n🔍  Searching: "${query}"`);

  const raw = await get(apiUrl);
  const json = JSON.parse(raw);

  if (!json.results || !json.results.length) {
    console.warn(`   ⚠️  No results for "${query}" — skipping`);
    return null;
  }

  const photo  = json.results[0];
  const imgUrl = `${photo.urls.raw}&w=${w}&h=${h}&fit=crop&auto=format&q=82`;

  console.log(`   📸  Photo by ${photo.user.name} (${photo.user.links.html})`);
  console.log(`   💾  Saving → kanazawa/images/${file}`);
  await download(imgUrl, savePath);

  // Print attribution line (copy into HTML if needed)
  console.log(`   ✅  Done  |  Credit: ${photo.user.name} on Unsplash`);
  return {
    file,
    photographer: photo.user.name,
    profile: photo.user.links.html,
    unsplash: `https://unsplash.com/photos/${photo.id}`,
  };
}

(async () => {
  console.log('\n🇯🇵  Kanazawa Image Downloader');
  console.log('================================');
  const credits = [];

  for (const img of IMAGES) {
    try {
      const result = await fetchAndSave(img);
      if (result) credits.push(result);
      // Unsplash free tier: 50 req/hour — small pause to be safe
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`   ❌  Failed: ${img.file} — ${err.message}`);
    }
  }

  // Write credits file
  const creditsPath = path.join(OUT_DIR, 'CREDITS.json');
  fs.writeFileSync(creditsPath, JSON.stringify(credits, null, 2));
  console.log('\n📋  Photo credits saved → kanazawa/images/CREDITS.json');
  console.log('\n✨  All done! Restart the server to see the new images.\n');
})();
