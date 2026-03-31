const fs = require('fs');
const Handlebars = require('handlebars');
const { getCityPath, getTemplatePath } = require('../lib/project-paths');
const { registerHandlebarsDefaults } = require('../lib/handlebars');
const { normalizeGuidePageData } = require('../lib/normalize-page-data');

registerHandlebarsDefaults(Handlebars);

const hbsSource = fs.readFileSync(getTemplatePath('guide-master.hbs'), 'utf8');
const masterTemplate = Handlebars.compile(hbsSource);

const dataPath = getCityPath('amsterdam', 'data.json');
const pageData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

try {
  const html = masterTemplate(normalizeGuidePageData(pageData, 'amsterdam'));
  console.log('Template render successful! Length:', html.length);
} catch (e) {
  console.error('Render failed:', e);
}
