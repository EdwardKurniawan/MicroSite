#!/usr/bin/env node

const path = require('path');

const {
  listCandidateFiles,
  readCandidatePayload
} = require('../lib/event-candidate-storage');
const { reviewCandidates } = require('../lib/event-review');

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
