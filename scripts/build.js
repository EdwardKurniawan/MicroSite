const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

Handlebars.registerHelper('json', function(context) {
  return JSON.stringify(context);
});

const DIR = path.join(__dirname, '..');
const DIST = path.join(DIR, 'public');

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

// 3. Load Templates
const masterSource = fs.readFileSync(path.join(DIR, 'templates/guide-master.hbs'), 'utf8');
const template = Handlebars.compile(masterSource);
const catTemplateSource = fs.readFileSync(path.join(DIR, 'templates/category-master.hbs'), 'utf8');
const categoryTemplate = Handlebars.compile(catTemplateSource);

// --- BUILD THE HUB ---
const hubSource = path.join(DIR, 'index.html');
if (fs.existsSync(hubSource)) {
  fs.copyFileSync(hubSource, path.join(DIST, 'index.html'));
  console.log('✓ Copied root index.html to public/index.html (Hub Page)');
}

// --- BUILD CITIES ---
const CITIES = ['amsterdam', 'kanazawa', 'london', 'rome', 'berlin'];

CITIES.forEach(citySlug => {
  const cityDir = path.join(DIR, citySlug);
  const cityIdx = path.join(DIR, citySlug, 'data.json');
  
  if (!fs.existsSync(cityIdx)) return;

  console.log(`\nBuilding city: ${citySlug.toUpperCase()}`);
  const cityDist = path.join(DIST, citySlug);
  if (!fs.existsSync(cityDist)) fs.mkdirSync(cityDist, { recursive: true });

  const data = JSON.parse(fs.readFileSync(cityIdx, 'utf8'));
  data.current_year = new Date().getFullYear();

  // 1. Render City Home
  const html = template(data);
  fs.writeFileSync(path.join(cityDist, 'index.html'), html);
  console.log(`  ✓ Rendered ${citySlug}/index.html`);

  // 2. Generate Subpages (Categories/Neighbourhoods)
  const generateSubpage = (urlPath) => {
    if (!urlPath) return;
    const cleanPath = urlPath.replace(/^\/|\/$/g, '').split('/').pop(); // Get leaf name
    if (!cleanPath || cleanPath === citySlug) return;

    const p = path.join(cityDist, cleanPath);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
    
    const jsonPath = path.join(cityDir, cleanPath, 'data.json');
    if (fs.existsSync(jsonPath)) {
      const localData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      localData.current_year = data.current_year;
      fs.writeFileSync(path.join(p, 'index.html'), categoryTemplate(localData));
      console.log(`    - Generated subpage: /${citySlug}/${cleanPath}/`);
    }
  };

  if (data.categories) data.categories.forEach(c => generateSubpage(c.url));
  if (data.neighbourhoods) data.neighbourhoods.forEach(n => generateSubpage(n.url));

  // 3. Copy city-specific images
  const cityImages = path.join(cityDir, 'images');
  if (fs.existsSync(cityImages)) {
    const destImages = path.join(cityDist, 'images');
    copyDir(cityImages, destImages);
    console.log(`  ✓ Copied ${citySlug}/images/`);
  }
});

// --- COPY SHARED ASSETS ---
copyDir(path.join(DIR, 'shared'), path.join(DIST, 'shared'));
console.log('\n✓ Copied shared/ assets to public/');

// --- UTILS ---
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

console.log(`\nBuild Complete! Multi-city static site is ready in "public/".`);
