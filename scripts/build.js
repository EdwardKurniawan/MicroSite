const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

Handlebars.registerHelper('json', function(context) {
  return JSON.stringify(context);
});

const DIR = path.join(__dirname, '..');
const CITY = process.env.CITY || 'amsterdam';
const CITY_DIR = path.join(DIR, CITY);
const DIST = path.join(DIR, 'public');

console.log(`Building city: ${CITY.toUpperCase()}`);

// 1. Create dist folder
if (!fs.existsSync(DIST)) {
  fs.mkdirSync(DIST, { recursive: true });
}

// 2. Load Helpers & Partials
const footerPath = path.join(DIR, 'shared/components/footer.hbs');
if (fs.existsSync(footerPath)) {
  const footerSource = fs.readFileSync(footerPath, 'utf8');
  Handlebars.registerPartial('footer', footerSource);
}

// 3. Load Master Template
const masterSource = fs.readFileSync(path.join(DIR, 'templates/guide-master.hbs'), 'utf8');
const template = Handlebars.compile(masterSource);

// 4. Load City Data
const cityDataPath = path.join(CITY_DIR, 'data.json');
if (!fs.existsSync(cityDataPath)) {
  console.error(`Error: ${CITY}/data.json not found. Run migrate-legacy.js ${CITY} first.`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(cityDataPath, 'utf8'));
data.current_year = new Date().getFullYear();

// 5. Render HTML
const html = template(data);
fs.writeFileSync(path.join(DIST, 'index.html'), html);
console.log(`✓ Rendered ${CITY}/data.json -> dist/index.html`);

// 5a. Load Category/Neighbourhood Template
const catTemplateSource = fs.readFileSync(path.join(DIR, 'templates/category-master.hbs'), 'utf8');
const categoryTemplate = Handlebars.compile(catTemplateSource);

// 5b. Generate subpages for categories and neighbourhoods using unified generic template
const generateSubpage = (urlPath) => {
  if (!urlPath) return;
  // Handle paths with leading/trailing slashes
  const cleanPath = urlPath.replace(/^\/|\/$/g, '');
  if (!cleanPath) return;

  const p = path.join(DIST, cleanPath);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  
  const jsonPath = path.join(CITY_DIR, cleanPath, 'data.json');
  if (fs.existsSync(jsonPath)) {
    const localData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    // Pass global data if needed (like year)
    localData.current_year = data.current_year;
    fs.writeFileSync(path.join(p, 'index.html'), categoryTemplate(localData));
    console.log(`  - Generated subpage: /${cleanPath}/`);
  } else {
    // console.log(`  - No data for /${cleanPath}/, skipping.`);
  }
};

if (data.categories) {
  data.categories.forEach(c => generateSubpage(c.url || c.slug));
}
if (data.neighbourhoods) {
  data.neighbourhoods.forEach(n => generateSubpage(n.url || n.slug));
}
console.log(`✓ Compiled all available subpages using category-master.hbs`);

// 5c. Optional: Generate static /api/venues (mostly for demo/testing)
const apiDir = path.join(DIST, 'api');
if (data.venues && data.venues.length > 0) {
  if (!fs.existsSync(apiDir)) fs.mkdirSync(apiDir, { recursive: true });
  fs.writeFileSync(path.join(apiDir, 'venues'), JSON.stringify(data.venues));
  console.log('✓ Generated static /api/venues data.');
  
  data.venues.forEach(v => generateSubpage(`/${v.slug}/`));
}

// 6. Copy Assets
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
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
const cityImages = path.join(CITY_DIR, 'images');
if (fs.existsSync(cityImages)) {
  copyDir(cityImages, path.join(DIST, 'images'));
  console.log(`✓ Copied ${CITY}/images to dist/images/`);
}

console.log(`\nBuild complete for ${CITY.toUpperCase()}! Static site is ready in "public/".`);
