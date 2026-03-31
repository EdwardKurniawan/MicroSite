const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const CITIES_DIR = path.join(ROOT_DIR, 'cities');
const TEMPLATE_DIR = path.join(ROOT_DIR, 'template');
const TEMPLATE_SHARED_DIR = path.join(TEMPLATE_DIR, 'shared');
const TEMPLATE_PARTIALS_DIR = path.join(TEMPLATE_SHARED_DIR, 'components');

function getCityDir(citySlug) {
  return path.join(CITIES_DIR, citySlug);
}

function getCityPath(citySlug, ...segments) {
  return path.join(getCityDir(citySlug), ...segments);
}

function getTemplatePath(...segments) {
  return path.join(TEMPLATE_DIR, ...segments);
}

function getSharedPath(...segments) {
  return path.join(TEMPLATE_SHARED_DIR, ...segments);
}

function listCitySlugs() {
  if (!fs.existsSync(CITIES_DIR)) {
    return [];
  }

  return fs
    .readdirSync(CITIES_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .filter(citySlug => fs.existsSync(getCityPath(citySlug, 'data.json')))
    .sort();
}

module.exports = {
  ROOT_DIR,
  CITIES_DIR,
  TEMPLATE_DIR,
  TEMPLATE_SHARED_DIR,
  TEMPLATE_PARTIALS_DIR,
  getCityDir,
  getCityPath,
  getTemplatePath,
  getSharedPath,
  listCitySlugs
};
