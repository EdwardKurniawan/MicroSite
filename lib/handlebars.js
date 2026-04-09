const fs = require('fs');
const path = require('path');
const { getSharedPath } = require('./project-paths');

function registerHandlebarsDefaults(Handlebars) {
  if (!Handlebars.helpers.json) {
    Handlebars.registerHelper('json', function json(context) {
      return JSON.stringify(context);
    });
  }

  if (!Handlebars.helpers.excerpt) {
    Handlebars.registerHelper('excerpt', function excerpt(value, maxLength = 180) {
      const limit = Number(maxLength) || 180;
      const text = stripHtml(value)
        .replace(/\s+/g, ' ')
        .trim();

      if (text.length <= limit) {
        return text;
      }

      const sliced = text.slice(0, limit);
      const clean = sliced.slice(0, Math.max(sliced.lastIndexOf(' '), 0)).trim();
      return `${clean || sliced.trim()}...`;
    });
  }

  if (!Handlebars.helpers.firstParagraph) {
    Handlebars.registerHelper('firstParagraph', function firstParagraph(value) {
      const html = String(value || '').trim();
      const match = html.match(/<p\b[^>]*>[\s\S]*?<\/p>/i);

      if (match) {
        return new Handlebars.SafeString(match[0]);
      }

      const fallback = stripHtml(html);
      return fallback ? new Handlebars.SafeString(`<p>${escapeHtml(fallback)}</p>`) : '';
    });
  }

  if (!Handlebars.helpers.eq) {
    Handlebars.registerHelper('eq', function eq(left, right) {
      return left === right;
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

function stripHtml(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = {
  registerHandlebarsDefaults
};
