#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const {
  listCandidateFiles,
  readCandidatePayload
} = require('../lib/event-candidate-storage');
const {
  reviewCandidates,
  normalizeTitle
} = require('../lib/event-review');

const ROOT = path.resolve(__dirname, '..');

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const citySlug = args.city;
  const providerName = args.provider || 'ticketmaster';
  const target = normalizeTarget(args.target || 'this-month');

  if (!citySlug) {
    throw new Error('Usage: node scripts/promote-event-candidate.js --city amsterdam --provider ticketmaster --target this-month --index 1 [--dry-run]');
  }

  const filePath = resolveCandidateFile({
    citySlug,
    providerName,
    filePath: args.file || ''
  });
  const payload = readCandidatePayload(filePath);
  const reviewed = reviewCandidates(payload, Number(args.limit || 50));
  const selected = selectCandidate(reviewed, args);

  if (!selected) {
    throw new Error('No reviewed candidate matched the provided selector. Use --index, --match, or --provider-event-id.');
  }

  const targetPath = resolveTargetPath(citySlug, target);
  const pageData = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
  const eventCard = buildEditorialEventCard(selected.source_event, { citySlug, target });

  const existingEvents = Array.isArray(pageData.events) ? pageData.events : [];
  const mergedEvents = mergeEvents(existingEvents, eventCard);

  pageData.events = mergedEvents;
  if (pageData.page_context && typeof pageData.page_context === 'object') {
    pageData.page_context.last_updated = formatDisplayDate(new Date());
  }

  if (args['dry-run']) {
    process.stdout.write(`${JSON.stringify({
      file: filePath,
      target: targetPath,
      selected: {
        title: selected.title,
        date_line: selected.date_line,
        venue_line: selected.venue_line
      },
      event_card: eventCard
    }, null, 2)}\n`);
    return;
  }

  fs.writeFileSync(targetPath, `${JSON.stringify(pageData, null, 2)}\n`);

  process.stdout.write(`Promoted "${selected.title}" into ${targetPath}\n`);
}

function resolveCandidateFile({ citySlug, providerName, filePath }) {
  if (filePath) return path.resolve(filePath);

  const files = listCandidateFiles({ citySlug, providerName });
  if (!files.length) {
    throw new Error(`No candidate files found for city="${citySlug}" provider="${providerName}".`);
  }

  return files[0];
}

function resolveTargetPath(citySlug, target) {
  const base = path.join(ROOT, 'cities', citySlug, 'events');

  if (target === 'events') return path.join(base, 'data.json');
  if (target === 'this-month') return path.join(base, 'this-month', 'data.json');
  if (target === 'this-weekend') return path.join(base, 'this-weekend', 'data.json');

  throw new Error(`Unknown target "${target}". Use events, this-month, or this-weekend.`);
}

function normalizeTarget(target) {
  const value = String(target || '').trim().toLowerCase();
  if (['events', 'main', 'hub'].includes(value)) return 'events';
  if (['month', 'this-month', 'monthly'].includes(value)) return 'this-month';
  if (['weekend', 'this-weekend'].includes(value)) return 'this-weekend';
  return value;
}

function selectCandidate(reviewed, args) {
  if (args.index) {
    const index = Number(args.index);
    if (!Number.isInteger(index) || index < 1 || index > reviewed.length) {
      throw new Error(`--index must be between 1 and ${reviewed.length}.`);
    }
    return reviewed[index - 1];
  }

  if (args['provider-event-id']) {
    return reviewed.find((item) => item.source_event.provider_event_id === args['provider-event-id']) || null;
  }

  if (args.match) {
    const query = normalizeTitle(args.match);
    return reviewed.find((item) => normalizeTitle(item.title).includes(query)) || null;
  }

  return null;
}

function buildEditorialEventCard(event, options) {
  const target = options.target;
  const district = inferDistrict(event);
  const venue = event.venue_name || 'Amsterdam';
  const dateLabel = formatEventDate(event);
  const segment = String(event.segment || '').toLowerCase();

  return {
    kicker: buildKicker(target, segment),
    timing: dateLabel,
    start_date: event.start_date || '',
    end_date: event.end_date || event.start_date || '',
    event_type: 'live-ticketed',
    status: humanizeStatus(event.status),
    district,
    booking_priority: buildBookingPriority(event),
    title: event.title || '',
    description: buildDescription(event, { target, district, venue, dateLabel }),
    venue,
    url: event.url || '',
    link_label: 'Check live availability',
    provider: event.provider || '',
    provider_event_id: event.provider_event_id || ''
  };
}

function mergeEvents(existingEvents, nextEvent) {
  const nextProviderId = String(nextEvent.provider_event_id || '').trim();
  const nextTitle = canonicalizeEventTitle(nextEvent.title);
  const nextVenue = normalizeTitle(nextEvent.venue);

  const filtered = existingEvents.filter((item) => {
    const itemProviderId = String(item.provider_event_id || '').trim();
    const itemTitle = canonicalizeEventTitle(item.title);
    const itemVenue = normalizeTitle(item.venue);

    if (nextProviderId && itemProviderId && itemProviderId === nextProviderId) return false;
    if (nextTitle && itemTitle && titlesRepresentSameEvent(nextTitle, itemTitle, nextVenue, itemVenue)) return false;
    return true;
  });

  return [nextEvent, ...filtered];
}

function inferDistrict(event) {
  const venue = String(event.venue_name || '').toLowerCase();

  if (venue.includes('melkweg') || venue.includes('paradiso')) return 'Leidseplein';
  if (venue.includes('ziggo dome') || venue.includes('afas live') || venue.includes('johan cruijff')) return 'Amsterdam-Zuidoost';
  if (venue.includes('concertgebouw')) return 'Museumplein';
  if (venue.includes('de wester')) return 'Westerpark';

  return event.venue_city || 'Amsterdam';
}

function buildKicker(target, segment) {
  if (target === 'this-weekend') return 'Weekend Ticketed Pick';
  if (target === 'this-month') return 'Live Ticketed Pick';
  if (segment.includes('music')) return 'Live Ticketed Signal';
  return 'Current Ticketed Pick';
}

function buildBookingPriority(event) {
  const venue = String(event.venue_name || '').toLowerCase();
  const segment = String(event.segment || '').toLowerCase();

  if (venue.includes('ziggo dome') || venue.includes('afas live')) {
    return 'Plan dinner and late transport around the show';
  }
  if (venue.includes('melkweg') || venue.includes('paradiso')) {
    return 'Anchor one nightlife-led evening around it';
  }
  if (segment.includes('music')) {
    return 'Book one evening anchor before arrival';
  }
  if (segment.includes('arts')) {
    return 'Use this as a culture-led anchor, not a filler';
  }

  return 'Check live availability before arrival';
}

function buildDescription(event, context) {
  const segment = String(event.segment || '').toLowerCase();
  const venueLine = context.venue ? `${context.venue} in ${context.district}` : context.district;

  if (segment.includes('music')) {
    return `${event.title} gives ${venueLine} a real live-ticketed pull on ${context.dateLabel}. It is the kind of show that can justify shaping dinner, nightlife, and late transport around one proper night out.`;
  }

  if (segment.includes('arts')) {
    return `${event.title} is a strong culture-led pick for ${context.dateLabel}, especially if you want one timed event to shape the rest of the day around ${venueLine}.`;
  }

  return `${event.title} is a live candidate worth checking for ${context.dateLabel}, especially if you want one ticketed event to anchor the trip around ${venueLine}.`;
}

function formatEventDate(event) {
  const date = event.start_date ? new Date(`${event.start_date}T${event.start_time || '19:00:00'}${buildTimezoneOffset(event.timezone)}`) : null;
  const dateLine = date && !Number.isNaN(date.getTime())
    ? new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'Europe/Amsterdam'
      }).format(date)
    : event.start_date || 'Upcoming';

  if (event.start_time) {
    return `${dateLine} · ${event.start_time.slice(0, 5)}`;
  }

  return dateLine;
}

function buildTimezoneOffset(timezone) {
  if (timezone === 'Europe/Amsterdam') return '+02:00';
  return 'Z';
}

function humanizeStatus(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'onsale') return 'On sale now';
  if (!value) return 'Current signal';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function canonicalizeEventTitle(title) {
  return normalizeTitle(
    String(title || '')
      .replace(/\s+\|\s+.*$/g, '')
      .replace(/\s+at\s+.+$/gi, '')
      .replace(/\s*-\s+.*$/g, '')
  );
}

function titlesRepresentSameEvent(leftTitle, rightTitle, leftVenue, rightVenue) {
  if (!leftTitle || !rightTitle) return false;
  if (leftTitle === rightTitle) {
    if (!leftVenue || !rightVenue) return true;
    return leftVenue === rightVenue;
  }

  const contains = leftTitle.includes(rightTitle) || rightTitle.includes(leftTitle);
  if (!contains) return false;
  if (!leftVenue || !rightVenue) return true;
  return leftVenue === rightVenue;
}

function formatDisplayDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Europe/Amsterdam'
  }).format(date);
}

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;

    const key = token.slice(2);
    const next = argv[index + 1];

    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }

    args[key] = next;
    index += 1;
  }

  return args;
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
