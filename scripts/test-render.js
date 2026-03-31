const fs = require('fs');
const Handlebars = require('handlebars');
const { getCityPath, getTemplatePath, getSharedPath } = require('../lib/project-paths');

const footerPartial = fs.readFileSync(getSharedPath('components', 'footer.hbs'), 'utf8');
Handlebars.registerPartial('footer', footerPartial);

const hbsSource = fs.readFileSync(getTemplatePath('guide-master.hbs'), 'utf8');
const masterTemplate = Handlebars.compile(hbsSource);

const dataPath = getCityPath('amsterdam', 'data.json');
const pageData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

try {
  const html = masterTemplate(pageData);
  console.log('Template render successful! Length:', html.length);
} catch (e) {
  console.error('Render failed:', e);
}
