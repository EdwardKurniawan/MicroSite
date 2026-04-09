const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EVENT_CANDIDATE_ROOT = path.join(ROOT, 'data', 'event-candidates');

function ensureEventCandidateRoot() {
  fs.mkdirSync(EVENT_CANDIDATE_ROOT, { recursive: true });
}

function buildCandidateOutputPath({
  citySlug,
  providerName,
  startDateTime,
  endDateTime,
  keyword,
  classificationName,
  fetchedAt
}) {
  ensureEventCandidateRoot();

  const safeCity = slugify(citySlug || 'unknown-city');
  const safeProvider = slugify(providerName || 'unknown-provider');
  const datePart = formatDatePart(startDateTime, endDateTime);
  const filterPart = [keyword, classificationName]
    .filter(Boolean)
    .map((value) => slugify(value))
    .filter(Boolean)
    .join('--');
  const fetchedStamp = formatTimestamp(fetchedAt || new Date().toISOString());
  const fileName = [fetchedStamp, datePart, filterPart].filter(Boolean).join('--') + '.json';

  return path.join(EVENT_CANDIDATE_ROOT, safeCity, safeProvider, fileName);
}

function writeCandidatePayload(payload, options) {
  const outputPath = buildCandidateOutputPath({
    citySlug: options.citySlug,
    providerName: options.providerName,
    startDateTime: options.startDateTime,
    endDateTime: options.endDateTime,
    keyword: options.keyword,
    classificationName: options.classificationName,
    fetchedAt: payload.fetched_at
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
  return outputPath;
}

function listCandidateFiles({ citySlug, providerName }) {
  const directory = path.join(
    EVENT_CANDIDATE_ROOT,
    slugify(citySlug || ''),
    slugify(providerName || '')
  );

  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory)
    .filter((entry) => entry.endsWith('.json'))
    .map((entry) => path.join(directory, entry))
    .sort((left, right) => right.localeCompare(left));
}

function readCandidatePayload(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function formatDatePart(startDateTime, endDateTime) {
  const start = normalizeDateToken(startDateTime);
  const end = normalizeDateToken(endDateTime);

  if (!start && !end) {
    return 'undated-window';
  }

  if (start && end) {
    return `${start}-to-${end}`;
  }

  return start || end;
}

function normalizeDateToken(value) {
  if (!value) return '';
  return String(value).replace(/[:]/g, '-').replace(/[.]/g, '').replace(/Z$/i, 'Z');
}

function formatTimestamp(value) {
  return String(value)
    .replace(/[:]/g, '-')
    .replace(/[.]/g, '')
    .replace(/Z$/i, 'Z')
    .replace(/[^\w-]/g, '-');
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

module.exports = {
  EVENT_CANDIDATE_ROOT,
  buildCandidateOutputPath,
  writeCandidatePayload,
  listCandidateFiles,
  readCandidatePayload
};
