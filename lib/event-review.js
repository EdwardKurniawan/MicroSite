function reviewCandidates(payload, limit = 10) {
  const seen = new Set();

  return (payload.results || [])
    .slice()
    .filter(isReviewableEvent)
    .sort(compareEvents)
    .filter((event) => {
      const key = normalizeTitle(event.title);
      if (!key) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit)
    .map((event) => ({
      source_event: event,
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

function isReviewableEvent(event) {
  const title = String(event.title || '').trim();
  const status = String(event.status || '').toLowerCase();
  const venue = String(event.venue_name || '').trim();

  if (!title) return false;
  if (['offsale', 'cancelled', 'postponed', 'rescheduled'].includes(status)) return false;

  const blockedTitlePattern = /\b(parking|permit|vip|upgrade|comfort seats|packages?|sold out|parking permit)\b/i;
  if (blockedTitlePattern.test(title)) return false;

  if (!venue && /\bparking\b/i.test(title)) return false;

  return true;
}

function normalizeTitle(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/\|\s.*$/g, '')
    .replace(/\s*-\s*sold out$/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
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
  const venue = String(event.venue_name || '').toLowerCase();

  if (segment.includes('music') && (venue.includes('melkweg') || venue.includes('ziggo dome') || venue.includes('paradiso'))) {
    return 'Strong live-ticketed pick for weekend nightlife or a single anchored concert night.';
  }
  if (segment.includes('music')) return 'Good candidate for month/weekend nightlife or live-music angle.';
  if (segment.includes('arts') || genre.includes('museum') || genre.includes('exhibition')) return 'Good candidate for culture-heavy month or weekend planning.';
  if (segment.includes('sports')) return 'Use if the city has strong match-day demand or hotel-pressure relevance.';
  if (segment.includes('film') || segment.includes('miscellaneous')) return 'Review manually for city relevance before promotion.';

  return 'Review manually for whether this changes where to stay, what to book, or weekend atmosphere.';
}

module.exports = {
  reviewCandidates,
  compareEvents,
  isReviewableEvent,
  normalizeTitle,
  buildDateLine,
  buildWhyItMatters,
  buildSuggestedAngle
};
