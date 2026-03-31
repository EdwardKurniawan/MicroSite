# Handoff

Last updated: 2026-03-31
Current head: `f44d8e8` (`feat: overhaul shared city template system`)

## What changed

The repo now has a normalized shared template system instead of city pages reading legacy JSON fields directly.

Key additions:

- `lib/normalize-page-data.js`
  - Normalizes guide, subpage, and venue data into grouped render inputs:
    - `seo`
    - `theme`
    - `hero`
    - `navigation`
    - `footer`
    - `author`
- `lib/handlebars.js`
  - Registers shared partials from `template/shared/components/`
- New reusable partials:
  - `guide-hero.hbs`
  - `subpage-hero.hbs`
  - `venue-hero.hbs`
  - `section-heading.hbs`
  - `fact-grid.hbs`
  - `category-card.hbs`
  - `district-card.hbs`
  - `attraction-card.hbs`
  - `faq-list.hbs`
  - `cta-band.hbs`

Shared templates rewritten:

- `template/guide-master.hbs`
- `template/category-master.hbs`
- `template/venue-master.hbs`
- `template/shared/index.css`
- `template/shared/global-nav.css`
- `template/shared/global-nav.js`
- `template/shared/components/footer.hbs`

Runtime/build rewired:

- `server.js`
- `scripts/build.js`
- `scripts/test-render.js`

Amsterdam sample migration started:

- `cities/amsterdam/data.json`
- `cities/amsterdam/museums/data.json`
- `cities/amsterdam/noord/data.json`

Author-page placeholder cleanup:

- `cities/amsterdam/authors/sarah-mitchell/index.html`
- `cities/kanazawa/authors/yuki-tanaka/index.html`

## Architecture now

The source of truth for layout is `template/`.

- City JSON can still use legacy flat fields.
- Templates no longer need to read those legacy fields directly.
- The normalizer adapts old JSON into the new grouped structure at render time.

That means we can keep improving the shared template without needing to immediately rewrite every city and every subpage by hand.

## What was verified

Passed locally:

- `node --check server.js`
- `node --check scripts/build.js`
- `node --check scripts/test-render.js`
- `node --check lib/handlebars.js`
- `node --check lib/normalize-page-data.js`
- `node scripts/test-render.js`
- `npm run build`

Smoke-tested successfully:

- `http://localhost:3001/?city=amsterdam`
- `http://localhost:3001/museums/?city=amsterdam`
- `http://localhost:3001/noord/?city=amsterdam`
- `http://localhost:3001/rijksmuseum/?city=amsterdam`
- `http://localhost:3001/?city=kanazawa`

Validated during smoke tests:

- guide page metadata and schema
- category page metadata and schema
- neighbourhood page metadata and schema
- venue page metadata and schema
- city-aware nav/footer rendering
- Amsterdam grouped sample data still works
- Kanazawa still renders through compatibility normalization
- FAQ normalization works for both `q/a` and `question/answer`

## Important implementation notes

### 1. Build now clears `public/`

`scripts/build.js` deletes and recreates `public/` before building.

This matters because older builds had stale legacy pages sitting in `public/`, which made verification noisy and could have caused bad deploy output.

### 2. Subpage canonical URLs

Some subpages did not have an explicit `url` in their JSON.

The build/runtime now inject:

- `/${citySlug}/${subpageSlug}/`

before normalization, so canonical URLs and breadcrumbs stay correct without needing to rewrite every file first.

### 3. Navigation behavior

Shared nav is now page-aware and local-first.

- Guide pages use local anchors like `#city-overview` and `#collections`
- Subpages/venue pages use the same nav model, but route back to the city guide where needed
- CTA resolves per city instead of assuming a hardcoded ticket route

### 4. Footer behavior

Footer now renders from normalized data:

- local links
- about/editor links
- network links
- newsletter copy
- legal copy

### 5. Venue rendering

Venue pages now use the shared visual language and normalized schema, and keep tracked booking URLs when a `tiqets_product_id` exists.

## What is intentionally incomplete

This is a strong foundation, but not the final city-system end state yet.

Still not fully migrated:

- most Amsterdam subpages still rely on legacy flat content fields and are adapted at runtime
- Kanazawa has not been manually migrated to grouped `seo/theme/hero/footer/navigation/author`
- author pages are still standalone HTML rather than shared-template pages
- bootstrap output still needs to be aligned more closely to the grouped schema over time

## Best next steps

Recommended order:

1. Migrate more Amsterdam subpages into grouped data shape
2. Update `scripts/bootstrap-city.js` to emit the grouped schema by default
3. Decide whether author pages should become shared-template pages
4. Add one more round of content primitives if needed:
   - map block
   - quote/testimonial block
   - “best for” chips
   - comparison/table block
5. Do a deployment-quality visual QA pass on:
   - Amsterdam home
   - Amsterdam museums
   - Amsterdam Noord
   - Rijksmuseum venue page
   - Kanazawa home

## Fast restart commands

```bash
npm run build
node server.js
node scripts/test-render.js
```

Useful local URLs:

- `http://localhost:3001/?city=amsterdam`
- `http://localhost:3001/museums/?city=amsterdam`
- `http://localhost:3001/noord/?city=amsterdam`
- `http://localhost:3001/rijksmuseum/?city=amsterdam`
- `http://localhost:3001/?city=kanazawa`

## If we resume next session

The fastest pickup is:

1. Read this file
2. Read `docs/ARCHITECTURE.md`
3. Inspect `lib/normalize-page-data.js`
4. Open the three master templates in `template/`
5. Continue with Amsterdam-first grouped data migration or bootstrap-schema upgrades
