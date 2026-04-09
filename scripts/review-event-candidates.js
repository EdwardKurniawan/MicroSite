#!/usr/bin/env node

const path = require('path');

const {
  listCandidateFiles,
  readCandidatePayload
} = require('../lib/event-candidate-storage');

async function main() {
  const args = parseArgs(process.argv.slice(2));

  let filePath = args.file ? path.resolve(args.file) : '';

  if (!filePath) {
    const citySlug = args.city;
    const providerName = args.provider || 'ticketmaster';

    if (!citySlug) {
      throw new Error('Usage: node scripts/review-event-candidates.js --city amsterdam --provider ticketmaster [--latest] [--limit 10] [--json]');
    }

    const files = listCandidateFiles({ citySlug, providerName });
    if (!files.length) {
      throw new Error(`No candidate files found for city="${citySlug}" provider="${providerName}".`);
    }

    filePath = files[0];
  }

  const payload = readCandidatePayload(filePath);
  const limit = Number(args.limit || 10);
  const reviewed = reviewCandidates(payload, limit);

  if (args.json) {
    process.stdout.write(`${JSON.stringify({ file: filePath, reviewed }, null, 2)}\n`);
    return;
  }

  process.stdout.write(`Review file: ${filePath}\n`);
  process.stdout.write(`City: ${payload.city_name} | Provider: ${payload.provider} | Results: ${payload.count}\n\n`);

  reviewed.forEach((item, index) => {
    process.stdout.write(`${index + 1}. ${item.title}\n`);
    process.stdout.write(`   Date: ${item.date_line}\n`);
    process.stdout.write(`   Venue: ${item.venue_line}\n`);
    process.stdout.write(`   Why it may matter: ${item.why_it_matters}\n`);
    process.stdout.write(`   Suggested angle: ${item.suggested_angle}\n`);
    process.stdout.write(`   URL: ${item.url}\n\n`);
  });
}

function reviewCandidates(payload, limit) {
  return (payload.results || [])
    .slice()
    .sort(compareEvents)
    .slice(0, limit)
    .map((event) => ({
      title: event.title,
      date_line: buildDateLine(event),
      venue_line: [event.venue_name, event.venue_city].filter(Boolean).join(' | '),
      why_it_matters: buildWhyItMatters(event),
      suggested_angle: buildSuggestedAngle(event),
      url: event.url
    }));
}

function compareEvents(left, right) {
  const leftDate = `${left.start_date || ''}T${left.start_time || '00:00:00'}`;
  const rightDate = `${right.start_date || ''}T${right.start_time || '00:00:00'}`;
  return leftDate.localeCompare(rightDate);
}

function buildDateLine(event) {
  const parts = [];
  if (event.start_date) parts.push(event.start_date);
  if (event.start_time) parts.push(event.start_time);
  if (event.status) parts.push(`status: ${event.status}`);
  return parts.join(' | ') || 'No date found';
}

function buildWhyItMatters(event) {
  const parts = [];
  if (event.segment) parts.push(event.segment);
  if (event.genre) parts.push(event.genre);
  if (event.min_price && event.max_price) {
    parts.push(`${event.currency || ''} ${event.min_price}-${event.max_price}`.trim());
  }
  return parts.join(' | ') || 'Check editorial fit manually';
}

function buildSuggestedAngle(event) {
  const segment = String(event.segment || '').toLowerCase();
  const genre = String(event.genre || '').toLowerCase();

  if (segment.includes('music')) return 'Good candidate for month/weekend nightlife or live-music angle.';
  if (segment.includes('arts') || genre.includes('museum') || genre.includes('exhibition')) return 'Good candidate for culture-heavy month or weekend planning.';
  if (segment.includes('sports')) return 'Use if the city has strong match-day demand or hotel-pressure relevance.';
  if (segment.includes('film') || segment.includes('miscellaneous')) return 'Review manually for city relevance before promotion.';

  return 'Review manually for whether this changes where to stay, what to book, or weekend atmosphere.';
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
