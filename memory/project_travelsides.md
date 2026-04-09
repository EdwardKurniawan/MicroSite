---
name: TravelSides City Guide Project
description: Multi-city travel guide platform with shared templates, city-specific editorial content, event freshness pages, and future ticket monetization.
type: project
last_updated: 2026-04-09
---

## Core direction

TravelSides is now a template-driven city-guide system designed to scale to hundreds of city microsites.

Primary product goals:

- rank for broad-intent city-guide keywords
- cover both evergreen and freshness-sensitive travel intent
- monetize ticket/event demand later through TicketPass or partner links
- keep each city locally branded while sharing one central template system

Primary keyword families:

- `what to do in <city>`
- `best things to do in <city>`
- `what to see in <city>`
- `where to stay in <city>`
- `best restaurants in <city>`
- `what's happening in <city>`
- `what's happening in <city> this month`
- `what's happening in <city> this weekend`

## Repo architecture

### Shared system

- `template/`
  - shared page templates
  - shared components
  - shared CSS
- `lib/normalize-page-data.js`
  - normalizes grouped and legacy fields into render-ready page data
- `server.js`
  - local runtime renderer and API handling
- `scripts/build.js`
  - builds static output to `public/`

### City content

- `cities/amsterdam/`
- `cities/kanazawa/`

Each city now uses the same main page-family model:

- root guide
- `best-things-to-do`
- `where-to-stay`
- `best-restaurants`
- `events`
- `events/this-month`
- `events/this-weekend`
- category pages
- neighbourhood pages
- venue pages rendered dynamically from DB

### Scale tooling

- `scripts/bootstrap-city.js`
  - scaffolds the newer city structure
- `scripts/validate-content.js`
  - content validation
- `scripts/check-event-freshness.js`
  - event freshness validation
- `scripts/fetch-events.js`
  - provider fetch entry point
- `scripts/review-event-candidates.js`
  - review layer for provider results

## Cities

### Amsterdam

Amsterdam is the flagship reference city.

Current state:

- homepage polished
- collections polished
- neighbourhood layer polished
- broad-intent pillar family polished
- venue pages upgraded
- event freshness pages in place

### Kanazawa

Kanazawa is now the second city on the same strategic structure.

Current state:

- homepage aligned
- `best-things-to-do`
- `where-to-stay`
- `best-restaurants`
- `events`
- `events/this-month`
- `events/this-weekend`
- grouped `seo` on core category/district pages
- venue/detail pages upgraded via shared system

## Current event strategy

### Editorial model

The public-facing event pages remain editorial, not raw API dumps.

That means:

- APIs are for discovery
- curated JSON remains the final city-facing output
- non-ticketed and city-mood events still need editorial judgment

### Provider recommendation

Use this order:

1. Ticketmaster
2. PredictHQ
3. Eventbrite only if specific partner/private use cases emerge

Why:

- Ticketmaster is the best first public event API to ship
- PredictHQ is the best next paid aggregator if scaling coverage becomes the issue
- Eventbrite is not a good primary public-discovery source because public event search access was shut down

Official references are documented in:

- `docs/EVENT-SOURCES.md`

### Event ingestion workflow

List providers:

```bash
npm run events:fetch -- --list-providers
```

Fetch provider results:

```bash
npm run events:fetch -- \
  --provider ticketmaster \
  --city amsterdam \
  --start 2026-04-01T00:00:00Z \
  --end 2026-04-30T23:59:59Z \
  --write
```

Review latest candidate payload:

```bash
npm run events:review -- --city amsterdam --provider ticketmaster
```

Candidate payload location:

```text
data/event-candidates/<city>/<provider>/
```

Important current blocker:

- `TICKETMASTER_API_KEY` is not set in the environment on this machine yet

## Current validation commands

```bash
npm run build
npm run check:content
npm run check:events
npm run events:fetch -- --list-providers
```

## Most important recent commits

```text
4024836 feat: add event candidate review workflow
c7fb184 docs: add official event provider references
ec402f1 feat: add event source research and ingestion scaffold
a1cb3aa seo: align stay dining and events pillar pages
fa53cbd seo: tighten broad-intent page phrasing
ab03a47 feat: improve flagship venue guide linking
e39ec41 design: upgrade venue detail pages
26bef08 design: polish kanazawa editorial presentation
43cc097 feat: bring kanazawa up to pillar-page standard
aa0fb6e feat: upgrade city bootstrap and content validation
```

## Resume point

If the next session starts cold, do this first:

1. read `docs/HANDOFF.md`
2. check whether `TICKETMASTER_API_KEY` is available
3. if yes, run a real Ticketmaster fetch with `--write`
4. run `events:review`
5. promote the strongest candidate events into:
   - `cities/amsterdam/events/data.json`
   - `cities/amsterdam/events/this-month/data.json`
   - `cities/amsterdam/events/this-weekend/data.json`

After that, likely next product step:

- build a “promote candidate to curated event card” helper so event-refresh work becomes much faster

## Working preferences captured in practice

- after a coherent work pass, commit and push to `origin main`
- prefer shared-system fixes over city-specific hacks
- use Amsterdam as flagship reference but keep Kanazawa aligned
- keep the product city-first and network-light
