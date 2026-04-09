# Event Sources

This repo now has a provider-ready event ingestion entry point:

```bash
npm run events:fetch -- --list-providers
npm run events:fetch -- --provider ticketmaster --city amsterdam --start 2026-04-01T00:00:00Z --end 2026-04-30T23:59:59Z --keyword exhibition
npm run events:fetch -- --provider ticketmaster --city amsterdam --start 2026-04-01T00:00:00Z --end 2026-04-30T23:59:59Z --write
npm run events:review -- --city amsterdam --provider ticketmaster
npm run events:promote -- --city amsterdam --provider ticketmaster --target this-weekend --index 1 --dry-run
```

## Current recommendation

Use a three-layer model:

1. Ticketmaster as the first live provider
2. PredictHQ as the likely paid aggregator once coverage becomes a priority
3. Editorial curation for city-specific moments that APIs miss

Eventbrite should not be the primary public-city discovery source for this system.

## Provider notes

### Ticketmaster

- Best first implementation for scalable event discovery
- Official Discovery API supports event search by location, date, and filters
- Works well for concerts, performances, sports, and many ticketed city events
- Official docs:
  - https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
- Current script support in this repo:
  - provider: `ticketmaster`
  - env var: `TICKETMASTER_API_KEY`

### PredictHQ

- Strongest scaling option if we need broader, normalized event coverage
- Official API supports search by location and date range with good filtering
- Better long-term choice than building many one-off provider adapters
- Official docs:
  - https://docs.predicthq.com/api/events
- Not implemented in code yet

### Eventbrite

- Not suitable as the main public event-discovery source
- Eventbrite shut down public access to `GET /v3/events/search/` on December 12, 2019
- Remaining official APIs are mainly useful for:
  - event by ID
  - events by venue
  - events by organization
  - owned/private event workflows
- Public multi-city discovery requires distribution-partner access
- Official announcement:
  - https://groups.google.com/g/eventbrite-api/c/FT2MsDswdrA

## Recommended architecture

### Stage 1

- Keep city event pages in JSON for editorial control
- Use `events:fetch` to pull candidate events from Ticketmaster
- Use `--write` to store raw candidate payloads under:
  - `data/event-candidates/<city>/<provider>/...json`
- Use `events:review` to turn the latest raw fetch into a shortlist for editorial promotion
- Use `events:promote` to convert one reviewed candidate into an editorial event card and write it directly into a city page
- Curate the strongest event candidates into:
  - `events/`
  - `events/this-month/`
  - `events/this-weekend/`

### Stage 2

- Add a normalized ingest layer:
  - provider name
  - provider event id
  - title
  - dates
  - venue
  - location
  - category
  - price
  - booking URL
  - editorial score
  - freshness score
- Store raw provider fetches separately from curated city JSON

### Stage 3

- Add PredictHQ if Ticketmaster coverage is not broad enough
- Use provider data for discovery, then keep the final city-facing cards editorial
- Continue to reserve hand-curated space for:
  - seasonal city moments
  - local cultural weekends
  - markets and district patterns
  - non-ticketed events that APIs underrepresent

## Environment

Add this when ready:

```bash
TICKETMASTER_API_KEY=...
```

Future:

```bash
PREDICTHQ_API_KEY=...
EVENTBRITE_PRIVATE_TOKEN=...
```

## Workflow

1. Fetch provider results into the candidate store:

```bash
npm run events:fetch -- \
  --provider ticketmaster \
  --city amsterdam \
  --start 2026-04-01T00:00:00Z \
  --end 2026-04-30T23:59:59Z \
  --classification music \
  --write
```

2. Review the latest candidate file for that city/provider:

```bash
npm run events:review -- --city amsterdam --provider ticketmaster
```

3. Promote the strongest candidates into the editorial city pages:

```bash
npm run events:promote -- \
  --city amsterdam \
  --provider ticketmaster \
  --target this-month \
  --index 1
```

You can target:

- `events`
- `this-month`
- `this-weekend`

You can select the reviewed candidate by:

- `--index`
- `--match`
- `--provider-event-id`

4. Final editorial pages remain:

- `cities/<city>/events/data.json`
- `cities/<city>/events/this-month/data.json`
- `cities/<city>/events/this-weekend/data.json`
