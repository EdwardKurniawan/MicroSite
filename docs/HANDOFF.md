# Handoff

Last updated: 2026-04-09
Current milestone before next pass: `fc8d6fb` (`feat: integrate live amsterdam event signals`)

## Current state

TravelSides is now a reusable multi-city guide system with:

- shared templates in `template/`
- city content in `cities/`
- grouped/normalized render data through `lib/normalize-page-data.js`
- static build output in `public/`
- local runtime rendering in `server.js`
- bootstrap and validation tooling for scaling to many cities

Amsterdam is the flagship reference city.
Kanazawa is now the second city brought onto the same top-level page-family model.

## What was finished this session

### 1. Amsterdam and Kanazawa were aligned as top-of-funnel city systems

Both cities now have the same main page family:

- homepage
- `best-things-to-do`
- `where-to-stay`
- `best-restaurants`
- `events`
- `events/this-month`
- `events/this-weekend`

Kanazawa was upgraded to this structure during this session.

### 2. Shared design and information architecture were tightened

- homepage search/planner was removed
- homepage flow was simplified around:
  - hero
  - best things to do
  - what’s happening
  - collections
  - neighbourhoods
  - FAQs
- homepage map was upgraded to a real Leaflet/OpenStreetMap-based experience
- text density was reduced across cards and major page sections

### 3. Amsterdam was polished as the flagship city

Completed:

- homepage editorial polish
- collection-page polish
- neighbourhood-page polish
- broad-intent SEO phrasing on:
  - homepage
  - `best-things-to-do`
  - `where-to-stay`
  - `best-restaurants`
  - `events`
  - `events/this-month`
  - `events/this-weekend`

### 4. Kanazawa was brought up to reference-city standard

Completed:

- grouped root data
- new pillar pages
- new events family
- grouped `seo` coverage for category and district pages
- editorial polish for homepage, pillar pages, and event framing

### 5. Venue/detail pages were upgraded significantly

Shared venue pages now include:

- stronger hero context
- visit snapshot
- local angle
- planning guidance
- booking framing
- supporting guide links
- “Build The Next Move” blocks for flagship attractions

This was implemented in:

- `lib/normalize-page-data.js`
- `template/venue-master.hbs`
- `template/shared/components/venue-hero.hbs`
- `template/shared/index.css`

### 6. Booking architecture was cleaned up

Booking logic is now centralized in:

- `lib/booking-links.js`

This reduced hardcoded provider assumptions and makes a future TicketPass swap much easier.

### 7. City bootstrap and validation improved

Added and updated:

- `scripts/bootstrap-city.js`
- `scripts/validate-content.js`
- `npm run check:content`

Bootstrap now scaffolds the real pillar-page family by default.

### 8. Event freshness and source scaling groundwork is now in place

Freshness layer:

- `scripts/check-event-freshness.js`
- `npm run check:events`

Source/provider groundwork:

- `lib/event-providers/index.js`
- `lib/event-providers/ticketmaster.js`
- `scripts/fetch-events.js`
- `data/event-candidates/`
- `lib/event-candidate-storage.js`
- `scripts/review-event-candidates.js`
- `docs/EVENT-SOURCES.md`

## Event source conclusions

### Best first provider

Use Ticketmaster first.

Official docs:
- [Ticketmaster Discovery API](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/)

### Best next scaling option

If coverage becomes the bottleneck, add PredictHQ.

Official docs:
- [PredictHQ Events API](https://docs.predicthq.com/api/events)

### Important limitation

Do not design the system around Eventbrite as the main public discovery source.

Eventbrite shut down public event search API access in 2019.

Official announcement:
- [Eventbrite API announcement](https://groups.google.com/g/eventbrite-api/c/FT2MsDswdrA)

## Event workflow now

List providers:

```bash
npm run events:fetch -- --list-providers
```

Fetch candidate events:

```bash
npm run events:fetch -- \
  --provider ticketmaster \
  --city amsterdam \
  --start 2026-04-01T00:00:00Z \
  --end 2026-04-30T23:59:59Z \
  --write
```

Review the latest candidate file:

```bash
npm run events:review -- --city amsterdam --provider ticketmaster
```

Candidate payloads are stored under:

```text
data/event-candidates/<city>/<provider>/
```

Current state:

- `TICKETMASTER_API_KEY` has now been tested locally
- a real Ticketmaster Amsterdam fetch was completed successfully
- the review pipeline now filters obvious junk like parking permits, VIP packages, sold-out dupes, and offsale entries
- Amsterdam's event pages now include real live-ticketed signals from Ticketmaster

## What was verified this session

Repeatedly verified during the session:

- `npm run build`
- `npm run check:content`
- `npm run check:events`
- `node --check` on edited JS files
- local route smoke checks for:
  - Amsterdam home + pillars
  - Kanazawa home + pillars
  - Amsterdam venue pages
  - Kanazawa venue pages
  - event month/weekend pages

Also verified:

- `npm run events:fetch -- --list-providers`
- `npm run events:fetch -- --provider ticketmaster --city amsterdam --start 2026-04-01T00:00:00Z --end 2026-04-30T23:59:59Z --write`
- `npm run events:review -- --city amsterdam --provider ticketmaster --limit 12`

Fetched candidate payloads remain local-only because `data/event-candidates/**` is ignored except for `.gitkeep`.

## Important repo preferences

### Git workflow

After a coherent work pass, commit and push to `origin main` unless explicitly told not to.

### Active architecture rules

- shared template logic belongs in `template/`
- city-specific editorial data belongs in `cities/<slug>/`
- do not reintroduce city-specific logic into shared templates unless unavoidable
- prefer improving the normalized render layer instead of adding ad hoc template conditionals

## Best next steps

If resuming next session, start here:

1. use the new promotion helper to move candidates into city JSON faster:
   - `npm run events:promote -- --city amsterdam --provider ticketmaster --target this-month --index 1 --dry-run`
2. run multiple focused Amsterdam pulls instead of one generic fetch:
   - music
   - arts/exhibitions
   - family/city events if useful
3. promote the strongest new live results into:
   - `cities/<city>/events/data.json`
   - `cities/<city>/events/this-month/data.json`
   - `cities/<city>/events/this-weekend/data.json`
4. repeat the same live-event workflow for Kanazawa
After that, the strongest product step is:

5. make promotion smarter with scoring / tagging instead of one-event-at-a-time selection

## Fast restart commands

```bash
npm run build
npm run check:content
npm run check:events
npm run events:fetch -- --list-providers
npm run events:promote -- --city amsterdam --provider ticketmaster --target this-month --index 1 --dry-run
node server.js
```

## Good review URLs

```text
http://localhost:3001/?city=amsterdam
http://localhost:3001/best-things-to-do/?city=amsterdam
http://localhost:3001/where-to-stay/?city=amsterdam
http://localhost:3001/best-restaurants/?city=amsterdam
http://localhost:3001/events/?city=amsterdam
http://localhost:3001/events/this-month/?city=amsterdam
http://localhost:3001/events/this-weekend/?city=amsterdam

http://localhost:3001/?city=kanazawa
http://localhost:3001/best-things-to-do/?city=kanazawa
http://localhost:3001/where-to-stay/?city=kanazawa
http://localhost:3001/best-restaurants/?city=kanazawa
http://localhost:3001/events/?city=kanazawa
http://localhost:3001/events/this-month/?city=kanazawa
http://localhost:3001/events/this-weekend/?city=kanazawa
```
