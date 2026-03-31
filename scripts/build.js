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
const { registerHandlebarsDefaults } = require('../lib/handlebars');
const {
  normalizeGuidePageData,
  normalizeSubpageData
} = require('../lib/normalize-page-data');

registerHandlebarsDefaults(Handlebars);

const DIST = path.join(ROOT_DIR, 'public');

if (fs.existsSync(DIST)) {
  fs.rmSync(DIST, { recursive: true, force: true });
}
fs.mkdirSync(DIST, { recursive: true });

const guideTemplate = Handlebars.compile(fs.readFileSync(getTemplatePath('guide-master.hbs'), 'utf8'));
const categoryTemplate = Handlebars.compile(fs.readFileSync(getTemplatePath('category-master.hbs'), 'utf8'));

const hubSource = path.join(ROOT_DIR, 'index.html');
if (fs.existsSync(hubSource)) {
  fs.copyFileSync(hubSource, path.join(DIST, 'index.html'));
  console.log('✓ Copied root index.html to public/index.html (Hub Page)');
}

const CITIES = listCitySlugs();

CITIES.forEach((citySlug) => {
  const cityDir = getCityDir(citySlug);
  const cityIdx = getCityPath(citySlug, 'data.json');

  if (!fs.existsSync(cityIdx)) return;

  console.log(`\nBuilding city: ${citySlug.toUpperCase()}`);
  const cityDist = path.join(DIST, citySlug);
  if (!fs.existsSync(cityDist)) fs.mkdirSync(cityDist, { recursive: true });

  const rawRootData = JSON.parse(fs.readFileSync(cityIdx, 'utf8'));
  const rootData = normalizeGuidePageData(rawRootData, citySlug);

  fs.writeFileSync(path.join(cityDist, 'index.html'), guideTemplate(rootData));
  console.log(`  ✓ Rendered ${citySlug}/index.html`);

  const generateSubpage = (urlPath) => {
    if (!urlPath) return;
    const cleanPath = urlPath.replace(/^\/|\/$/g, '').split('/').pop();
    if (!cleanPath || cleanPath === citySlug) return;

    const jsonPath = getCityPath(citySlug, cleanPath, 'data.json');
    if (!fs.existsSync(jsonPath)) return;

    const pageDist = path.join(cityDist, cleanPath);
    if (!fs.existsSync(pageDist)) fs.mkdirSync(pageDist, { recursive: true });

    const rawSubData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    if (!rawSubData.url) {
      rawSubData.url = `/${citySlug}/${cleanPath}/`;
    }
    const subpageData = normalizeSubpageData(rawSubData, citySlug, rawRootData);
    fs.writeFileSync(path.join(pageDist, 'index.html'), categoryTemplate(subpageData));
    console.log(`    - Generated subpage: /${citySlug}/${cleanPath}/`);
  };

  (rawRootData.categories || []).forEach((item) => generateSubpage(item.url));
  (rawRootData.neighbourhoods || []).forEach((item) => generateSubpage(item.url));

  const cityImages = getCityPath(citySlug, 'images');
  if (fs.existsSync(cityImages)) {
    copyDir(cityImages, path.join(cityDist, 'images'));
    console.log(`  ✓ Copied ${citySlug}/images/`);
  }

  const authorDir = getCityPath(citySlug, 'authors');
  if (fs.existsSync(authorDir)) {
    copyDir(authorDir, path.join(cityDist, 'authors'));
    console.log(`  ✓ Copied ${citySlug}/authors/`);
  }
});

copyDir(getSharedPath(), path.join(DIST, 'shared'));
console.log('\n✓ Copied template/shared assets to public/');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('\nBuild Complete! Multi-city static site is ready in "public/".');
