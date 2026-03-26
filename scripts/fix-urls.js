const fs = require('fs');
const path = require('path');

const cities = ['amsterdam', 'kanazawa', 'london', 'rome', 'berlin'];

function fixData(filePath, city) {
  if (!fs.existsSync(filePath)) return;
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  function prefix(url) {
    if (typeof url !== 'string' || !url.startsWith('/') || url.startsWith(`/${city}/`)) return url;
    return `/${city}${url}`.replace('//', '/');
  }

  if (data.categories) {
    data.categories.forEach(c => { if (c.url) c.url = prefix(c.url); });
  }
  if (data.neighbourhoods) {
    data.neighbourhoods.forEach(n => { if (n.url) n.url = prefix(n.url); });
  }
  // Also check top-level url if exists
  if (data.url) data.url = prefix(data.url);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`✓ Fixed ${filePath}`);
}

cities.forEach(city => {
  const cityDir = path.join(process.cwd(), city);
  if (!fs.existsSync(cityDir)) return;

  // Fix root data.json
  fixData(path.join(cityDir, 'data.json'), city);

  // Fix all sub-directories recursively
  const items = fs.readdirSync(cityDir);
  items.forEach(item => {
    const subDir = path.join(cityDir, item);
    if (fs.lstatSync(subDir).isDirectory()) {
      fixData(path.join(subDir, 'data.json'), city);
    }
  });
});
