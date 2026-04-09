#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { getEventProvider, listEventProviders } = require('../lib/event-providers');
const { writeCandidatePayload } = require('../lib/event-candidate-storage');

const ROOT = path.resolve(__dirname, '..');

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args['list-providers']) {
    process.stdout.write(`${JSON.stringify(listEventProviders(), null, 2)}\n`);
    return;
  }

  const providerName = args.provider || 'ticketmaster';
  const provider = getEventProvider(providerName);

  if (!provider) {
    throw new Error(`Unknown provider "${providerName}".`);
  }

  if (provider.status !== 'ready') {
    throw new Error(`${providerName} is not implemented yet: ${provider.notes}`);
  }

  const citySlug = args.city;
  if (!citySlug) {
    throw new Error('Usage: node scripts/fetch-events.js --provider ticketmaster --city amsterdam --start 2026-04-01T00:00:00Z --end 2026-04-30T23:59:59Z [--keyword tulips] [--classification music] [--size 20] [--output path]');
  }

  const cityData = readCityData(citySlug);
  const apiKey = process.env.TICKETMASTER_API_KEY;

  const result = await provider.search({
    apiKey,
    cityName: cityData.city_name,
    countryCode: countryNameToCode(cityData.country),
    startDateTime: args.start || '',
    endDateTime: args.end || '',
    keyword: args.keyword || '',
    classificationName: args.classification || '',
    size: Number(args.size || 20),
    page: Number(args.page || 0),
    sort: args.sort || 'date,asc'
  });

  const payload = {
    city: citySlug,
    city_name: cityData.city_name,
    country: cityData.country || '',
    fetched_at: new Date().toISOString(),
    ...result
  };

  if (args.output) {
    const outputPath = path.resolve(ROOT, args.output);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
    process.stdout.write(`Wrote ${outputPath}\n`);
    return;
  }

  if (args.write) {
    const outputPath = writeCandidatePayload(payload, {
      citySlug,
      providerName,
      startDateTime: args.start || '',
      endDateTime: args.end || '',
      keyword: args.keyword || '',
      classificationName: args.classification || ''
    });
    process.stdout.write(`Wrote ${outputPath}\n`);
    return;
  }

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

function readCityData(citySlug) {
  const cityPath = path.join(ROOT, 'cities', citySlug, 'data.json');
  if (!fs.existsSync(cityPath)) {
    throw new Error(`City data not found for "${citySlug}" at ${cityPath}`);
  }

  return JSON.parse(fs.readFileSync(cityPath, 'utf8'));
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

function countryNameToCode(countryName) {
  const mapping = {
    Netherlands: 'NL',
    Japan: 'JP',
    Germany: 'DE',
    Italy: 'IT',
    'United Kingdom': 'GB',
    England: 'GB',
    France: 'FR',
    Spain: 'ES',
    Portugal: 'PT',
    Belgium: 'BE',
    Czechia: 'CZ',
    'Czech Republic': 'CZ',
    Austria: 'AT',
    Switzerland: 'CH',
    Denmark: 'DK',
    Sweden: 'SE',
    Norway: 'NO',
    Finland: 'FI',
    Ireland: 'IE',
    'United States': 'US',
    Canada: 'CA'
  };

  return mapping[countryName] || '';
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
