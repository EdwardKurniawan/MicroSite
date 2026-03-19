---
name: TravelSides City Guide Project
description: Multi-city travel guide site monetised via ticket affiliate commissions. One domain per city, one Node.js server handles all via hostname routing.
type: project
last_updated: 2026-03-18
---

## Business Model
Rank for city guide SEO keywords → monetise via affiliate ticket commissions (GetYourGuide, Viator, Tiqets). Primary keyword pattern: "things to do in [city]", "best [city] attractions", "[city] travel guide 2026".

---

## Supabase Database

- **Project URL:** https://hgedrvcjulaeqguizpqn.supabase.co
- **Host:** db.hgedrvcjulaeqguizpqn.supabase.co
- **Port:** 5432 · **DB:** postgres · **User:** postgres
- **Connection string:** in `city-guide-template/.env` as `DATABASE_URL`
- **SSL:** required (`rejectUnauthorized: false`)
- **Unsplash API Key:** in `.env` as `UNSPLASH_ACCESS_KEY` (used for image downloads)

### `cities` table
| column | type |
|--------|------|
| id | uuid (PK) |
| name | text |
| country | text |
| slug | text |
| description | text |
| created_at | timestamptz |

### `venues` table
| column | type | notes |
|--------|------|-------|
| id | uuid (PK) | gen_random_uuid() |
| city_id | uuid (FK → cities.id) | |
| name | text | |
| slug | text | used in URL + image filename |
| category | text | used for filter buttons |
| short_description | text | shown in venue cards |
| long_description | text | for detail pages (future) |
| image_url | text | local path e.g. `/images/venues/kenroku-en-garden.jpg` |
| opening_hours | text | |
| address | text | |
| latitude | float8 | |
| longitude | float8 | |
| tiqets_product_id | text | for affiliate widget (future) |
| rating | numeric | shown in cards |
| reviews | integer | shown in cards |
| duration | text | e.g. "1.5–2 hours" |
| created_at | timestamptz | |

### Cities in DB
| City | city_id | Venues | Status |
|------|---------|--------|--------|
| Amsterdam | 59840d0d-d90c-4777-9034-f29cd948768d | 10 | ✅ Live |
| London | 20163dae-9d4b-4b2a-8363-7e38d1f1f6fa | 5 | 🔜 Coming soon |
| Rome | b4c8ae6e-635d-4716-8cc4-1769854a998a | 5 | 🔜 Coming soon |
| Berlin | 8fd41c31-de5b-4b7c-ba2b-3fff93c91ce2 | 3 | 🔜 Coming soon |
| Beijing | 6c939daa-ac3e-4ccc-a929-66197f02fcf4 | 2 | 🔜 Coming soon |
| Kanazawa | 2ebaaaf3-f7d8-45af-9302-bce38b1a847b | 10 | ✅ Live |

### Kanazawa venues (10) — all have image_url set
| name | slug | category | rating |
|------|------|----------|--------|
| Kenroku-en Garden | kenroku-en-garden | Garden | 4.8 |
| Higashi Chaya District | higashi-chaya-district | Cultural District | 4.7 |
| 21st Century Museum | 21st-century-museum | Museum | 4.7 |
| Kanazawa Castle Park | kanazawa-castle-park | Historic Site | 4.6 |
| Omicho Market | omicho-market | Market | 4.6 |
| Nagamachi Samurai District | nagamachi-samurai-district | Cultural District | 4.5 |
| Myoryuji (Ninja-dera Temple) | myoryuji-ninja-temple | Temple | 4.5 |
| Nishi Chaya District | nishi-chaya-district | Cultural District | 4.4 |
| Higashiyama Temple Walk | higashiyama-temple-walk | Walking Tour | 4.6 |
| D.T. Suzuki Museum | dt-suzuki-museum | Museum | 4.5 |

---

## Server Architecture (`server.js`)

### City-to-hostname mapping (`CITY_HOSTS`)
```js
'amsterdam-guide.com'    → { slug: 'amsterdam', cityId: '59840d0d-...' }
'london-guide.com'       → { slug: 'london',    cityId: '20163dae-...' }
'rome-guide.com'         → { slug: 'rome',      cityId: 'b4c8ae6e-...' }
'berlin-guide.com'       → { slug: 'berlin',    cityId: '8fd41c31-...' }
'kanazawa-guide.com'     → { slug: 'kanazawa',  cityId: '2ebaaaf3-...' }
```

### Routing logic
- `/` → serves `{city}/index.html` (if exists) else root `index.html` hub
- `/images/*` → serves from `{city}/images/`
- `/any/path/` → serves `{city}/any/path/index.html`

### API endpoints
- `GET /api/venues` → all venues for current city, ordered by rating DESC
- `GET /api/venues?category=Museum` → filtered by category

### Local dev npm scripts (package.json)
```
npm run dev:amsterdam   → PORT=3001 CITY=amsterdam
npm run dev:kanazawa    → PORT=3002 CITY=kanazawa
npm run dev:london      → PORT=3003 CITY=london
npm run dev:rome        → PORT=3004 CITY=rome
```
Uses `cross-env` (devDependency) for Windows compatibility.

### Kill port (Windows)
```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3002).OwningProcess -Force
```

---

## File Structure

```
city-guide-template/
├── index.html                          ← TravelSides hub (Amsterdam ✅ + Kanazawa ✅ listed)
├── server.js                           ← Node HTTP server + API
├── package.json                        ← deps: pg, dotenv, cross-env
├── .env                                ← DATABASE_URL + UNSPLASH_ACCESS_KEY (git-ignored)
├── .gitignore
├── HOW-TO-REPLICATE.md
├── scripts/
│   ├── download-kanazawa-images.js     ← Downloads page images via Unsplash API
│   └── download-venue-images.js        ← Downloads venue card images + updates DB image_url
├── amsterdam/                          ← Amsterdam site (fully built)
│   ├── index.html
│   ├── museums/ canal-cruises/ experiences/ history-heritage/ nature-day-trips/ tours/
│   ├── jordaan/ de-pijp/ centrum/ museumplein/ noord/
│   └── authors/sarah-mitchell/
└── kanazawa/                           ← Kanazawa site (fully built ✅)
    ├── index.html                      ← Main guide (17 things to do)
    ├── gardens/index.html              ← Category page
    ├── culture/index.html              ← Category page
    ├── food/index.html                 ← Category page
    ├── day-trips/index.html            ← Category page
    ├── higashiyama/index.html          ← Neighbourhood page
    ├── nagamachi/index.html            ← Neighbourhood page
    ├── katamachi/index.html            ← Neighbourhood page
    ├── nishi-chaya/index.html          ← Neighbourhood page
    ├── authors/yuki-tanaka/index.html  ← Author page
    └── images/
        ├── hero.jpg                    ← Kenroku-en (Roméo A.)
        ├── gardens.jpg                 ← Stone lantern (Soyoung HAN)
        ├── culture.jpg                 ← Higashi Chaya (Fumiaki Hayashi)
        ├── food.jpg                    ← Seafood market (Beth Macdonald)
        ├── day-trips.jpg               ← Shirakawa-go (inti albuquerque)
        ├── higashiyama.jpg             ← Temple path (Chase Eggenberger)
        ├── nagamachi.jpg               ← Traditional lane (masahiro miyagi)
        ├── katamachi.jpg               ← Night street (Pakata Goh)
        ├── nishi-chaya.jpg             ← Teahouse (Shaqyl Shamsudheen)
        ├── kanazawa-castle.jpg         ← Castle (moreau tokyo)
        ├── omicho.jpg                  ← Market (Poppy Lin)
        ├── og-image.jpg                ← OG social image (Artem Shuba)
        ├── CREDITS.json
        └── venues/
            ├── kenroku-en-garden.jpg           (Gang Hao)
            ├── higashi-chaya-district.jpg      (Margarita B)
            ├── 21st-century-museum.jpg         (Gang Hao)
            ├── kanazawa-castle-park.jpg        (moreau tokyo)
            ├── omicho-market.jpg               (Tara Vester)
            ├── nagamachi-samurai-district.jpg  (Benjamin Dehant)
            ├── myoryuji-ninja-temple.jpg       (Yosuke Ota)
            ├── nishi-chaya-district.jpg        (Yuya Yoshioka)
            ├── higashiyama-temple-walk.jpg     (Yosuke Ota)
            └── dt-suzuki-museum.jpg            (Yanhao Fang)
```

---

## Kanazawa Design System

| Token | Value | Usage |
|-------|-------|-------|
| `--accent` | `#B5451B` | Japanese vermillion / torii gate |
| `--accent-dark` | `#8f3515` | Hover states |
| `--accent-light` | `#fdf1ec` | Tip boxes, light backgrounds |
| `--japan-red` | `#BC002D` | Header top border stripe |
| `--ink` | `#1a1a1a` | Body text |
| `--ink-muted` | `#555` | Secondary text |
| `--surface-2` | `#f8f7f5` | Cards, alt backgrounds |
| `--font-display` | Playfair Display 700,800 | Headings |
| `--font-body` | Inter 400,500,600 | Body |

**Author:** Yuki Tanaka (Kanazawa-based, 12 years local, traditional crafts expert)

---

## Kanazawa — All Pages Live ✅

| URL | File | Status |
|-----|------|--------|
| `/` | `kanazawa/index.html` | ✅ Done |
| `/gardens/` | `kanazawa/gardens/index.html` | ✅ Done |
| `/culture/` | `kanazawa/culture/index.html` | ✅ Done |
| `/food/` | `kanazawa/food/index.html` | ✅ Done |
| `/day-trips/` | `kanazawa/day-trips/index.html` | ✅ Done |
| `/higashiyama/` | `kanazawa/higashiyama/index.html` | ✅ Done |
| `/nagamachi/` | `kanazawa/nagamachi/index.html` | ✅ Done |
| `/katamachi/` | `kanazawa/katamachi/index.html` | ✅ Done |
| `/nishi-chaya/` | `kanazawa/nishi-chaya/index.html` | ✅ Done |
| `/authors/yuki-tanaka/` | `kanazawa/authors/yuki-tanaka/index.html` | ✅ Done |

---

## Amsterdam — Status

**Fully built.** 10 venues in DB. All neighbourhood and category pages exist.
**Remaining:** Wire up Tiqets affiliate product IDs, newsletter signups to DB.
**Hub listing:** ✅ Listed on root index.html as "Live"

---

## Image Download Workflow (reuse for every new city)

1. Add city image queries to `scripts/download-kanazawa-images.js` (or copy and rename)
2. Run `node scripts/download-kanazawa-images.js` → saves to `{city}/images/`
3. Run `node scripts/download-venue-images.js` → saves to `{city}/images/venues/` AND updates `image_url` in DB
4. Unsplash API key in `.env` as `UNSPLASH_ACCESS_KEY`
5. Script skips existing files (SKIP_EXISTING = true) — safe to re-run

---

## Next Priorities

### Immediate (Kanazawa)
- [ ] Wire up Tiqets/GYG affiliate links in venue CTAs (replace `/{slug}/` placeholder hrefs)
- [ ] Newsletter signup → save emails to Supabase `newsletter_signups` table
- [ ] Affiliate click tracking → log clicks to Supabase `affiliate_clicks` table
- [ ] Add venue detail pages: `kanazawa/{slug}/index.html` for each attraction

### Next City
- Start with **London** or **Amsterdam** (already have 5 venues each in DB)
- Run `npm run dev:london` → port 3003
- Copy Kanazawa image download scripts, update queries
- Add to hub `index.html` when ready (change "Coming Soon" → "Live")

### Platform
- Add `sitemap.xml` per city
- Add `robots.txt` per city
- Set up actual domains (kanazawa-guide.com etc.) + deploy to VPS/Vercel
- Consider migrating to Express.js for easier routing as site grows

---

## How to Add a New City (checklist)

1. **DB:** Insert city into `cities` table, get `city_id`
2. **DB:** Insert venues into `venues` table with `city_id`
3. **server.js:** Add hostname entries to `CITY_HOSTS`
4. **package.json:** Add `dev:{city}` script with correct PORT + CITY
5. **Create folder:** `{city}/` with `index.html`, category pages, neighbourhood pages, author page
6. **Images:** Copy & update image download scripts → run them
7. **Hub:** Add city card to root `index.html`
8. **Test:** `npm run dev:{city}` → check all pages + venue API

---

## Key Technical Notes

- **Windows dev:** Use `cross-env` for PORT/CITY env vars in npm scripts (installed as devDependency)
- **Port conflicts:** Use PowerShell `Stop-Process -Id (Get-NetTCPConnection -LocalPort XXXX).OwningProcess -Force`
- **DB password:** NOT stored in memory. Lives only in `.env`
- **Image paths:** All images referenced as root-relative `/images/...` — server routes them to `{city}/images/...`
- **Venue card JS:** All pages fetch `/api/venues` — server auto-filters by active city via CITY env / hostname
- **Schema:** Every page has Article + BreadcrumbList JSON-LD. Main index has FAQPage + ItemList + TouristAttraction
