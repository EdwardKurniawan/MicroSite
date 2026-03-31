const fs = require('fs');
const path = require('path');
const { getSharedPath } = require('./project-paths');

function registerHandlebarsDefaults(Handlebars) {
  if (!Handlebars.helpers.json) {
    Handlebars.registerHelper('json', function json(context) {
      return JSON.stringify(context);
    });
  }

  const componentsDir = getSharedPath('components');
  if (fs.existsSync(componentsDir)) {
    registerPartialsFromDir(Handlebars, componentsDir);
  }
}

function registerPartialsFromDir(Handlebars, dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      registerPartialsFromDir(Handlebars, absolutePath);
      continue;
    }

    if (!entry.name.endsWith('.hbs')) {
      continue;
    }

    const partialName = path.basename(entry.name, '.hbs');
    Handlebars.registerPartial(partialName, fs.readFileSync(absolutePath, 'utf8'));
  }
}

module.exports = {
  registerHandlebarsDefaults
};
