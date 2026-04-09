# Architecture

This repo is now organized for a one-template-many-cities workflow.

## Core idea

- `template/` holds the shared presentation layer.
- `cities/` holds city-specific content and assets.
- `server.js`, `scripts/build.js`, and the API routes all resolve paths through shared helpers in `lib/project-paths.js`.

If you update a Handlebars template, shared CSS, nav, footer, or shared client-side script in `template/`, that change applies to every city that uses the template.

## Folder structure

```text
city-guide-template/
├── api/                     # Vercel/serverless endpoints
├── cities/
│   ├── amsterdam/
│   │   ├── data.json
│   │   ├── images/
│   │   ├── authors/
│   │   └── <category-or-area>/data.json
│   └── kanazawa/
├── config/
│   └── city-registry.js     # hostnames and city IDs
├── lib/
│   └── project-paths.js     # canonical path helpers
├── scripts/                 # build/sync/download utilities
├── template/
│   ├── guide-master.hbs
│   ├── category-master.hbs
│   ├── venue-master.hbs
│   └── shared/
│       ├── index.css
│       ├── global-nav.js
│       ├── ai-search.js
│       └── components/footer.hbs
├── index.html               # network hub page
├── robots.txt
├── sitemap.xml
└── server.js
```

## What belongs where

- Put layout, styling, footer/nav, and reusable page logic in `template/`.
- Put only city-specific JSON, images, and author pages in `cities/<slug>/`.
- Put hostname and database city ID mapping in `config/city-registry.js`.

## How to add a new city

Use the bootstrap command:

```bash
npm run bootstrap:city -- \
  --name "Prague" \
  --slug prague \
  --country "Czech Republic" \
  --author "Local Expert" \
  --domain prague-guide.com \
  --city-id 11111111-1111-1111-1111-111111111111
```

That command will:

1. Create `cities/<slug>/data.json`.
2. Create starter pillar pages:
   - `best-things-to-do`
   - `where-to-stay`
   - `best-restaurants`
   - `events`
   - `events/this-month`
   - `events/this-weekend`
3. Create starter category and neighbourhood `data.json` files.
4. Create starter placeholder SVG assets in `cities/<slug>/images/`.
5. Create a starter author page in `cities/<slug>/authors/<author-slug>/`.
6. Register the domain and `city_id` in `config/cities.json` when both are provided.
7. Add a matching `dev:<slug>` script to `package.json`.

Then run:

```bash
npm run check:content
npm run build
```

`scripts/build.js` discovers cities automatically by scanning `cities/` for folders that contain a `data.json`, so there is no hardcoded city list anymore.

## Content validation

There is now a lightweight structural validator for city content:

```bash
npm run check:content
```

What it checks:

- root guide essentials like `city_name`, SEO fields, hero fields, categories, and neighbourhoods
- basic page metadata presence across city `data.json` files
- internal root-guide links that should point to real local pages
- whether a city has the recommended pillar-family structure

Current expectation:

- Amsterdam should pass cleanly
- Kanazawa currently produces warnings because it has not yet been brought up to the new pillar-page standard

That is intentional for now. The validator is meant to make scale safer without blocking work on legacy cities that still need migration.

## Event freshness workflow

Events pages now support a richer event schema so the site can answer freshness-sensitive search intent without relying on loose prose alone.

Recommended event fields:

- `event_type`
- `timing`
- `start_date`
- `end_date`
- `recurrence`
- `status`
- `district`
- `booking_priority`

Recommended page-context fields for every events page:

- `page_context.timeframe`
- `page_context.last_updated`
- `page_context.next_refresh`

Current workflow:

1. Update the relevant event pages in `cities/<slug>/events/`.
2. Run `npm run check:events`.
3. Run `npm run build`.
4. Review the city homepage, `/events/`, `/events/this-month/`, and `/events/this-weekend/`.

This is intentionally lightweight for now: JSON-first, fast to edit, and compatible with the static build. It gives us a repeatable freshness process before we decide whether a CMS or event-feed workflow is necessary.
