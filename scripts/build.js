const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const {
  ROOT_DIR,
  getCityDir,
  getCityPath,
  getTemplatePath,
  getSharedPath,
  listCitySlugs
} = require('../lib/project-paths');

Handlebars.registerHelper('json', function(context) {
  return JSON.stringify(context);
});

const DIST = path.join(ROOT_DIR, 'public');

// 1. Create dist folder
if (!fs.existsSync(DIST)) {
  fs.mkdirSync(DIST, { recursive: true });
}

// 2. Load Helpers & Partials
const footerPath = getSharedPath('components', 'footer.hbs');
if (fs.existsSync(footerPath)) {
  const footerSource = fs.readFileSync(footerPath, 'utf8');
  Handlebars.registerPartial('footer', footerSource);
}

// 3. Load Templates
const masterSource = fs.readFileSync(getTemplatePath('guide-master.hbs'), 'utf8');
const template = Handlebars.compile(masterSource);
const catTemplateSource = fs.readFileSync(getTemplatePath('category-master.hbs'), 'utf8');
const categoryTemplate = Handlebars.compile(catTemplateSource);

const DEFAULT_GLOBAL_NETWORK = [
  { name: 'Kanazawa Insider', url: 'https://kanazawa-insider.com' },
  { name: 'London Insider', url: 'https://london-insider.com' },
  { name: 'Rome Insider', url: 'https://rome-insider.com' }
];

// --- BUILD THE HUB ---
const hubSource = path.join(ROOT_DIR, 'index.html');
if (fs.existsSync(hubSource)) {
  fs.copyFileSync(hubSource, path.join(DIST, 'index.html'));
  console.log('✓ Copied root index.html to public/index.html (Hub Page)');
}

// --- BUILD CITIES ---
const CITIES = listCitySlugs();

function withCityDefaults(pageData, citySlug, rootData = null) {
  const nextPageData = { ...pageData };
  const source = rootData || pageData;

  nextPageData.city_slug = citySlug;
  nextPageData.city_name =
    source.city_name || citySlug.charAt(0).toUpperCase() + citySlug.slice(1);
  nextPageData.footer_categories =
    source.footer_categories ||
    (source.categories || []).slice(0, 4).map(c => ({ title: c.title, url: c.url }));
  nextPageData.global_network = source.global_network || DEFAULT_GLOBAL_NETWORK;
  nextPageData.current_year = new Date().getFullYear();

  return nextPageData;
}

CITIES.forEach(citySlug => {
  const cityDir = getCityDir(citySlug);
  const cityIdx = getCityPath(citySlug, 'data.json');
  
  if (!fs.existsSync(cityIdx)) return;

  console.log(`\nBuilding city: ${citySlug.toUpperCase()}`);
  const cityDist = path.join(DIST, citySlug);
  if (!fs.existsSync(cityDist)) fs.mkdirSync(cityDist, { recursive: true });

  const data = withCityDefaults(
    JSON.parse(fs.readFileSync(cityIdx, 'utf8')),
    citySlug
  );

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
    
    const jsonPath = getCityPath(citySlug, cleanPath, 'data.json');
    if (fs.existsSync(jsonPath)) {
      const localData = withCityDefaults(
        JSON.parse(fs.readFileSync(jsonPath, 'utf8')),
        citySlug,
        data
      );
      fs.writeFileSync(path.join(p, 'index.html'), categoryTemplate(localData));
      console.log(`    - Generated subpage: /${citySlug}/${cleanPath}/`);
    }
  };

  if (data.categories) data.categories.forEach(c => generateSubpage(c.url));
  if (data.neighbourhoods) data.neighbourhoods.forEach(n => generateSubpage(n.url));

  // 3. Copy city-specific images
  const cityImages = getCityPath(citySlug, 'images');
  if (fs.existsSync(cityImages)) {
    const destImages = path.join(cityDist, 'images');
    copyDir(cityImages, destImages);
    console.log(`  ✓ Copied ${citySlug}/images/`);
  }

  const authorDir = getCityPath(citySlug, 'authors');
  if (fs.existsSync(authorDir)) {
    const destAuthors = path.join(cityDist, 'authors');
    copyDir(authorDir, destAuthors);
    console.log(`  ✓ Copied ${citySlug}/authors/`);
  }
});

// --- COPY SHARED ASSETS ---
copyDir(getSharedPath(), path.join(DIST, 'shared'));
console.log('\n✓ Copied template/shared assets to public/');

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
