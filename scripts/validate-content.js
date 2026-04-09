const fs = require('fs');
const path = require('path');
const { listCitySlugs, getCityDir, getCityPath } = require('../lib/project-paths');

const REQUIRED_PILLARS = [
  'best-things-to-do',
  'where-to-stay',
  'best-restaurants',
  'events',
  path.join('events', 'this-month'),
  path.join('events', 'this-weekend')
];

const errors = [];
const warnings = [];

for (const citySlug of listCitySlugs()) {
  validateCity(citySlug);
}

if (errors.length) {
  console.error('Content validation errors:\n');
  errors.forEach((line) => console.error(`- ${line}`));
}

if (warnings.length) {
  console.log('Content validation warnings:\n');
  warnings.forEach((line) => console.log(`- ${line}`));
}

if (!errors.length && !warnings.length) {
  console.log('Content validation passed.');
}

process.exit(errors.length ? 1 : 0);

function validateCity(citySlug) {
  const cityDir = getCityDir(citySlug);
  const rootPath = getCityPath(citySlug, 'data.json');
  const rootData = readJson(rootPath);

  validateRequiredText(rootPath, rootData.city_name, '`city_name`');
  validateRequiredText(rootPath, readSeoTitle(rootData), 'root SEO title');
  validateRequiredText(rootPath, readSeoDescription(rootData), 'root SEO description');
  validateRequiredText(rootPath, readCanonical(rootData), 'root canonical');
  validateRequiredText(rootPath, readHeroTitle(rootData), 'root hero title');
  validateRequiredText(rootPath, readHeroImage(rootData), 'root hero image');

  validateArray(rootPath, rootData.categories, '`categories`');
  validateArray(rootPath, rootData.neighbourhoods, '`neighbourhoods`');
  validateArray(rootPath, rootData.top_things, '`top_things`', true);
  validateArray(rootPath, rootData.guide_pages, '`guide_pages`', true);

  for (const pillar of REQUIRED_PILLARS) {
    const pillarPath = getCityPath(citySlug, pillar, 'data.json');
    if (!fs.existsSync(pillarPath)) {
      warnings.push(`${citySlug}: missing recommended pillar page ${pillar}`);
    }
  }

  for (const item of rootData.guide_pages || []) {
    validateInternalUrl(rootPath, citySlug, item.url, `guide page "${item.title || 'untitled'}"`);
  }

  for (const item of rootData.categories || []) {
    validateInternalUrl(rootPath, citySlug, item.url, `category "${item.title || 'untitled'}"`);
  }

  for (const item of rootData.neighbourhoods || []) {
    validateInternalUrl(rootPath, citySlug, item.url, `neighbourhood "${item.name || 'untitled'}"`);
  }

  for (const item of rootData.top_things || []) {
    validateInternalUrl(rootPath, citySlug, item.url, `top_things "${item.title || 'untitled'}"`);
  }

  for (const item of rootData.events || []) {
    validateInternalUrl(rootPath, citySlug, item.url, `homepage event "${item.title || 'untitled'}"`);
  }

  walkDataFiles(cityDir, (dataPath, json) => {
    if (dataPath === rootPath) {
      return;
    }

    validateRequiredText(dataPath, json.title || readHeroTitle(json), '`title`', true);
    validateRequiredText(dataPath, readSeoTitle(json), 'SEO title', true);
    validateRequiredText(dataPath, readSeoDescription(json), 'SEO description', true);
    validateRequiredText(dataPath, readHeroTitle(json), 'hero title', true);
    validateRequiredText(dataPath, readHeroImage(json), 'hero image', true);

    const canonical = readCanonical(json);
    if (!canonical) {
      warnings.push(`${relative(dataPath)}: missing canonical URL`);
    }
  });
}

function walkDataFiles(dirPath, visitor) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkDataFiles(fullPath, visitor);
      continue;
    }

    if (entry.name !== 'data.json') {
      continue;
    }

    visitor(fullPath, readJson(fullPath));
  }
}

function validateRequiredText(filePath, value, label, warningOnly = false) {
  if (!String(value || '').trim()) {
    const target = `${relative(filePath)}: missing ${label}`;
    if (warningOnly) {
      warnings.push(target);
    } else {
      errors.push(target);
    }
  }
}

function validateArray(filePath, value, label, warningOnly = false) {
  if (!Array.isArray(value) || !value.length) {
    const target = `${relative(filePath)}: missing or empty ${label}`;
    if (warningOnly) {
      warnings.push(target);
    } else {
      errors.push(target);
    }
  }
}

function validateInternalUrl(filePath, citySlug, value, label) {
  const url = String(value || '').trim();
  if (!url || url.startsWith('#') || /^https?:\/\//i.test(url)) {
    return;
  }

  if (!url.startsWith('/')) {
    warnings.push(`${relative(filePath)}: ${label} has non-absolute internal URL "${url}"`);
    return;
  }

  const clean = url.replace(/[#?].*$/, '').replace(/^\/|\/$/g, '');
  if (!clean) {
    return;
  }

  if (clean === citySlug) {
    return;
  }

  const expectedPrefix = `${citySlug}/`;
  if (!clean.startsWith(expectedPrefix)) {
    warnings.push(`${relative(filePath)}: ${label} points outside city scope "${url}"`);
    return;
  }

  const subPath = clean.slice(expectedPrefix.length);
  const targetPath = getCityPath(citySlug, subPath, 'data.json');
  if (!fs.existsSync(targetPath)) {
    errors.push(`${relative(filePath)}: ${label} points to missing page "${url}"`);
  }
}

function readSeoTitle(json) {
  return json?.seo?.title || json?.meta_title || '';
}

function readSeoDescription(json) {
  return json?.seo?.description || json?.meta_description || '';
}

function readCanonical(json) {
  return json?.seo?.canonical || json?.canonical_url || '';
}

function readHeroTitle(json) {
  return json?.hero?.title || json?.hero_h1 || json?.title || '';
}

function readHeroImage(json) {
  return json?.hero?.image || json?.hero_image || json?.og_image || '';
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function relative(filePath) {
  return path.relative(process.cwd(), filePath);
}
