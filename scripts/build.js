const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

const DIR = path.join(__dirname, '..');
const DIST = path.join(DIR, 'dist');

// 1. Create dist folder
if (!fs.existsSync(DIST)) {
  fs.mkdirSync(DIST, { recursive: true });
}

// 2. Load Helpers & Partials
const footerSource = fs.readFileSync(path.join(DIR, 'shared/components/footer.hbs'), 'utf8');
Handlebars.registerPartial('footer', footerSource);

// 3. Load Master Template
const masterSource = fs.readFileSync(path.join(DIR, 'templates/guide-master.hbs'), 'utf8');
const template = Handlebars.compile(masterSource);

// 4. Load Amsterdam Data
const amsterdamDataPath = path.join(DIR, 'amsterdam/data.json');
if (!fs.existsSync(amsterdamDataPath)) {
  console.error('Error: amsterdam/data.json not found. Run migrate-to-json.js first.');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(amsterdamDataPath, 'utf8'));
data.current_year = new Date().getFullYear();

// 5. Render HTML
const html = template(data);
fs.writeFileSync(path.join(DIST, 'index.html'), html);
console.log('✓ Rendered amsterdam/data.json -> dist/index.html');

// 6. Copy Assets
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy shared/ folder
copyDir(path.join(DIR, 'shared'), path.join(DIST, 'shared'));
console.log('✓ Copied shared/ assets to dist/');

// Copy city-specific images
const cityImages = path.join(DIR, 'amsterdam/images');
if (fs.existsSync(cityImages)) {
  copyDir(cityImages, path.join(DIST, 'images'));
  console.log('✓ Copied amsterdam/images to dist/images/');
}

console.log('\nBuild complete! Static site is ready in the "dist" folder.');
console.log('To deploy to Vercel, run: npx vercel --prod dist');
