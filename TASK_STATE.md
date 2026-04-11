# Task State

Last updated: 2026-04-11
Current branch: `main`
Latest completed commit before this file: `f9fce71` (`feat: expand live event promotion workflow`)

## Completed Work

- Built the project into a reusable multi-city travel-guide system with shared templates in `template/` and city content in `cities/`.
- Reorganized the repo so future city launches can inherit one shared template/layout system instead of per-city one-offs.
- Added grouped/normalized page data handling through `lib/normalize-page-data.js`.
- Stabilized runtime/build paths across:
  - `server.js`
  - `scripts/build.js`
  - shared templates/components
- Added city bootstrap and validation tooling:
  - `scripts/bootstrap-city.js`
  - `scripts/validate-content.js`
  - `npm run check:content`
- Added event freshness tooling:
  - `scripts/check-event-freshness.js`
  - `npm run check:events`
- Added event source and candidate workflow:
  - `scripts/fetch-events.js`
  - `scripts/review-event-candidates.js`
  - `scripts/promote-event-candidate.js`
  - `lib/event-providers/ticketmaster.js`
  - `lib/event-candidate-storage.js`
  - `lib/event-review.js`
- Added promotion workflow so reviewed candidate events can be converted into editorial event cards and written into city JSON pages.
- Upgraded booking-link architecture so future TicketPass integration will be easier.
- Brought Amsterdam to flagship/reference-city quality across:
  - homepage
  - `best-things-to-do`
  - `where-to-stay`
  - `best-restaurants`
  - `events`
  - `events/this-month`
  - `events/this-weekend`
  - core collection pages
  - neighbourhood pages
  - venue pages
- Brought Kanazawa onto the same top-level page-family and shared-system standard.
- Removed the homepage search/planner and repositioned the site around broad search intent and editorial browsing.
- Added live Ticketmaster-backed Amsterdam event signals into:
  - `cities/amsterdam/events/data.json`
  - `cities/amsterdam/events/this-month/data.json`
  - `cities/amsterdam/events/this-weekend/data.json`

## In-Progress Work

- Event ingestion is now real for Amsterdam, but still early-stage.
- The promotion workflow works, but it is still one-event-at-a-time and not yet score-driven or batch-friendly.
- Amsterdam event coverage is now partly live-fed and partly editorial; that balance still needs refinement.
- Kanazawa event ingestion has been tested with Ticketmaster, but current live coverage is effectively empty for April 2026.

## Next Steps

1. Run keyword-led Kanazawa Ticketmaster pulls for likely local terms:
   - festivals
   - exhibitions
   - markets
   - specific venue or district names
2. If Kanazawa still returns weak coverage, add the next provider path for lower-coverage cities.
   - PredictHQ is the current best candidate.
3. Improve the promotion helper so it can:
   - score candidates
   - tag event type automatically
   - support faster multi-event promotion
4. Expand Amsterdam’s event mix with a few stronger culture-led and citywide picks, not just concert signals.
5. Decide when and how to start routing event/ticket CTAs toward `ticketpass.co` once the destination is ready.
6. Update handoff/memory docs again after the next meaningful event-ingestion pass so session restart stays accurate.

## Blockers Or Assumptions

- `TICKETMASTER_API_KEY` is available locally and has already been tested successfully for Amsterdam.
- Ticketmaster currently appears useful for Amsterdam but weak for Kanazawa based on live April 2026 tests:
  - generic city pull: `0` results
  - `classification=Music`: `0` results
  - `classification=Arts & Theatre`: `0` results
- Raw candidate fetches are intentionally kept local and ignored by git under `data/event-candidates/**`.
- The current workflow assumes final public event pages remain editorial JSON, not raw API dumps.
- The repo preference remains: after a coherent work pass, commit and push to `origin main` unless explicitly told not to.
