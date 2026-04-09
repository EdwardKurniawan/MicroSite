const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CITIES_DIR = path.join(ROOT, 'cities');
const TODAY = new Date().toISOString().slice(0, 10);

let failed = false;
const warnings = [];

for (const city of safeReadDir(CITIES_DIR)) {
  const cityDir = path.join(CITIES_DIR, city);
  inspectDirectory(cityDir, []);
}

if (warnings.length) {
  console.log('Event freshness warnings:\n');
  warnings.forEach((warning) => console.log(`- ${warning}`));
} else {
  console.log('Event freshness check passed.');
}

process.exit(failed ? 1 : 0);

function inspectDirectory(dirPath, trail) {
  const dataPath = path.join(dirPath, 'data.json');

  if (fs.existsSync(dataPath)) {
    const relativePath = path.relative(ROOT, dataPath);
    const json = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const looksLikeEventsPage =
      trail.includes('events') ||
      relativePath.includes(`${path.sep}events${path.sep}`) ||
      /event/i.test(json.title || '') ||
      /event/i.test(json.hero?.title || '') ||
      /event/i.test(json.page_context?.label || '');

    if (looksLikeEventsPage) {
      inspectEventsPage(relativePath, json);
    }
  }

  for (const entry of safeReadDir(dirPath)) {
    const childPath = path.join(dirPath, entry);
    if (!fs.statSync(childPath).isDirectory()) {
      continue;
    }
    inspectDirectory(childPath, trail.concat(entry));
  }
}

function inspectEventsPage(relativePath, json) {
  const pageContext = json.page_context || {};
  const events = Array.isArray(json.events) ? json.events : [];

  if (!pageContext.last_updated) {
    warn(relativePath, 'missing `page_context.last_updated`');
  }

  if (!pageContext.next_refresh) {
    warn(relativePath, 'missing `page_context.next_refresh`');
  }

  if (!pageContext.timeframe) {
    warn(relativePath, 'missing `page_context.timeframe`');
  }

  if (!events.length) {
    warn(relativePath, 'has no `events` entries');
    return;
  }

  events.forEach((event, index) => {
    const ref = `${relativePath} [event ${index + 1}: ${event.title || 'untitled'}]`;

    if (!event.event_type) {
      warn(ref, 'missing `event_type`');
    }

    if (!event.status) {
      warn(ref, 'missing `status`');
    }

    if (!event.booking_priority) {
      warn(ref, 'missing `booking_priority`');
    }

    if (!event.district) {
      warn(ref, 'missing `district`');
    }

    if (!event.start_date && !event.recurrence) {
      warn(ref, 'needs either `start_date` or `recurrence`');
    }

    if (event.start_date && !isIsoDate(event.start_date)) {
      warn(ref, `invalid \`start_date\`: ${event.start_date}`);
    }

    if (event.end_date && !isIsoDate(event.end_date)) {
      warn(ref, `invalid \`end_date\`: ${event.end_date}`);
    }

    if (event.start_date && event.end_date && event.end_date < event.start_date) {
      warn(ref, '`end_date` is earlier than `start_date`');
    }
  });

  if (pageContext.next_refresh && pageContext.next_refresh === TODAY) {
    warn(relativePath, '`next_refresh` is due today');
  }
}

function warn(target, message) {
  warnings.push(`${target}: ${message}`);
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

function safeReadDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs.readdirSync(dirPath).filter((entry) => !entry.startsWith('.'));
}
