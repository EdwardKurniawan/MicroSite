const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

const DIR = path.join(__dirname, '..');

const footerPartial = fs.readFileSync(path.join(DIR, 'shared/components/footer.hbs'), 'utf8');
Handlebars.registerPartial('footer', footerPartial);

const hbsSource = fs.readFileSync(path.join(DIR, 'templates/guide-master.hbs'), 'utf8');
const masterTemplate = Handlebars.compile(hbsSource);

const dataPath = path.join(DIR, 'amsterdam/data.json');
const pageData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

try {
  const html = masterTemplate(pageData);
  console.log('Template render successful! Length:', html.length);
} catch (e) {
  console.error('Render failed:', e);
}
