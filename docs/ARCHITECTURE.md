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

1. Create `cities/<slug>/data.json`.
2. Add category and neighbourhood subfolders under `cities/<slug>/` as needed.
3. Add `images/` and optional `authors/` inside that city folder.
4. Add the city hostname mapping and city ID in `config/city-registry.js`.
5. Run `npm run build`.

`scripts/build.js` discovers cities automatically by scanning `cities/` for folders that contain a `data.json`, so there is no hardcoded city list anymore.
