# How to Replicate This Template for a New City

---

## New Canonical Structure

The repo now follows a shared-template model:

- `template/` = one shared layout system for every city
- `cities/<slug>/` = only that city's data, images, authors, and subpages

That means a template change should happen in `template/`, not by editing each city folder individually.

### Current pattern

```text
template/
  guide-master.hbs
  category-master.hbs
  venue-master.hbs
  shared/

cities/
  amsterdam/
    data.json
    images/
    authors/
    museums/data.json
  kanazawa/
    data.json
    images/
```

### Rule of thumb

- Update `template/` when you want to change all city sites.
- Update `cities/<slug>/` when you want to change one city's content.

## Quick-Start (DB-Aware) Checklist

### Step 0 — Check the Database First

Before touching any HTML, confirm the city exists in Supabase and get its `city_id`:

```js
// Run: node -e "..." from city-guide-template/
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
pool.query('SELECT id, name, slug FROM cities ORDER BY name').then(r => { console.log(r.rows); pool.end(); });
```

**Cities already in DB:**

| City | Slug | city_id | Venues |
|------|------|---------|--------|
| Amsterdam | amsterdam | 59840d0d-d90c-4777-9034-f29cd948768d | 10 |
| London | london | 20163dae-9d4b-4b2a-8363-7e38d1f1f6fa | 5 |
| Rome | rome | b4c8ae6e-635d-4716-8cc4-1769854a998a | 5 |
| Berlin | berlin | 8fd41c31-de5b-4b7c-ba2b-3fff93c91ce2 | 3 |
| Beijing | beijing | 6c939daa-ac3e-4ccc-a929-66197f02fcf4 | 2 |

If the city is **not** in the DB, insert it first:
```sql
INSERT INTO cities (id, name, country, slug)
VALUES (gen_random_uuid(), 'Prague', 'Czech Republic', 'prague');
```

Then add venues for it in the `venues` table.

### Step 1 — Copy the Template Folder

```bash
cp -r amsterdam <new-city-slug>
# e.g. cp -r amsterdam london
```

### Step 2 — Update the API Call in `index.html`

In the `<script>` block of the `#tickets` section, change the fetch URL:

```js
// Before (Amsterdam default):
fetch('/api/venues')

// After (e.g. London):
fetch('/api/venues?city_id=20163dae-9d4b-4b2a-8363-7e38d1f1f6fa')
```

### Step 3 — HTML Find & Replace

---

## 5-Minute City Swap Checklist

### 1. HTML — Find & Replace These Values

| Find | Replace With |
|------|-------------|
| `amsterdam` | `paris` (URL slugs, all lowercase) |
| `Amsterdam` | `Paris` (display name) |
| `Netherlands` | `France` |
| `Sarah Mitchell` | Your local expert's name |
| `Amsterdam-based travel writer • 6 years living in the city` | New author bio |
| `17 Best Things To Do in Amsterdam` | `21 Best Things To Do in Paris` |
| `2025 City Guide` | Keep or update year |
| `yourdomain.com/amsterdam/` | `yourdomain.com/paris/` |
| `🇳🇱` | `🇫🇷` (country flag emoji) |

### 2. CSS — Change the Accent Color Per City

In `:root`, change `--accent` to reflect the city's personality:

| City | Accent Color | Why |
|------|-------------|-----|
| Amsterdam | `#E8601C` | Dutch orange |
| Paris | `#C8102E` | French red |
| Barcelona | `#FCDD09` | Catalan yellow |
| London | `#003082` | Union Jack navy |
| Rome | `#009246` | Italian green |
| Prague | `#D52B1E` | Czech red |
| Lisbon | `#006600` | Portuguese green |
| Vienna | `#ED2939` | Austrian red |

### 3. Hero Image

Replace the Unsplash URL with a real licensed photo:
- **Free sources**: Unsplash.com, Pexels.com
- **Recommended**: Shoot your own or hire a local photographer for E-E-A-T

Alt text formula: `[City] [Landmark] at [time of day/season]`
Example: `Paris Eiffel Tower at golden hour, Seine river in foreground`

### 4. Schema JSON-LD — Critical SEO Swaps

In the `<script type="application/ld+json">` block:
- Update `headline`, `description`, `@id`, `url` everywhere
- Update `dateModified` to today's date
- Update `author.name` and `author.description`
- Update `BreadcrumbList` items
- Update all 4 FAQPage questions to be city-specific

### 5. Title Tag Formula (proven to rank)

```
[Number] Best Things To Do in [City] ([Year] [City Type] Guide)
```

Examples:
- `21 Best Things To Do in Paris (2025 City Guide)`
- `19 Top Attractions in Barcelona — 2025 Visitor Guide`
- `15 Must-See Places in Prague (Complete 2025 Guide)`

### 6. URL Structure (follow this exactly)

```
yourdomain.com/[city-slug]/things-to-do/
yourdomain.com/[city-slug]/city-guide/
yourdomain.com/[city-slug]/top-attractions/
```

Never use: `/blog/amsterdam-guide/` or `/post/things-to-do-amsterdam/`

### 7. Ticket Widget Integration

Replace the placeholder `<div>` in `id="tickets"` with:

**GetYourGuide:**
```html
<script async defer src="https://widget.getyourguide.com/dist/pa.umd.production.min.js"
  data-gyg-partner-id="YOUR_PARTNER_ID"></script>
<div data-gyg-widget="activities" data-gyg-location-id="57" data-gyg-locale-code="en-US"
  data-gyg-number-of-items="8"></div>
```

**Viator:**
```html
<div id="viator-widget"></div>
<script src="https://www.viatoraffiliates.com/widget/v1/widget.js"></script>
```

**Tiqets (best for European venues):**
```html
<script src="https://cdn.tiqets.com/widgets/tiqets-widget.js"></script>
<div class="tiqets-widget" data-lang="en" data-venue-id="YOUR_ID"></div>
```

---

## SEO Strategy — What the #1 Sites Do

### Content Requirements (minimum to compete)
- **Word count**: 2,500–4,000 words (this template is ~2,800 words)
- **Attractions listed**: 15–25 (numbered, specific counts in title)
- **Author**: Named, local expert with photo and bio
- **Update frequency**: Re-date every 3–6 months minimum
- **Internal links**: Link to neighbourhood pages, best restaurants, transport guide

### Schema Stack (implement all of these)
1. ✅ `Article` — with author Person schema
2. ✅ `BreadcrumbList` — geo hierarchy: Home > Europe > City > Things To Do
3. ✅ `FAQPage` — 4–6 questions targeting PAA (People Also Ask) boxes
4. ⬜ `TouristAttraction` — add per-attraction schema for rich results
5. ⬜ `Event` — for seasonal/timed experiences

### On-Page SEO Checklist
- [ ] Primary keyword in H1 (exact match or close variant)
- [ ] Primary keyword in first 100 words of body text
- [ ] Primary keyword in URL slug
- [ ] Secondary keywords in H2/H3 headings naturally
- [ ] Alt text on every image (descriptive, includes location)
- [ ] Title tag ≤ 60 characters
- [ ] Meta description 150–160 characters with CTA
- [ ] Internal link to /[city]/tickets/ at least 3 times
- [ ] Canonical URL set correctly
- [ ] No duplicate content (each city guide must be unique)

### Page Speed (Core Web Vitals)
- `loading="lazy"` on all images except the hero
- `fetchpriority="high"` on the hero image only
- `width` and `height` attributes on all `<img>` tags (prevents layout shift)
- Google Fonts loaded via `preconnect` links
- No render-blocking JS (all scripts at end of body)

### E-E-A-T Signals (Experience, Expertise, Authority, Trust)
- Named author with bio and local connection ("lived here 6 years")
- Trust badges on author bar ("Expert verified", "Locally photographed")
- Affiliate disclosure in footer
- Last updated date prominently displayed
- Real photos, not generic stock when possible

---

## City Priority Roadmap (by search volume)

| City | Monthly Searches | Competition | Priority |
|------|-----------------|-------------|----------|
| Amsterdam | 110,000 | High | ✅ Launch first |
| Paris | 550,000 | Very High | 🟡 Month 2 |
| Barcelona | 210,000 | High | 🟡 Month 2 |
| Prague | 74,000 | Medium | 🟢 Month 3 |
| Lisbon | 90,000 | Medium | 🟢 Month 3 |
| Dubrovnik | 40,000 | Low | 🟢 Month 4 |
| Krakow | 33,000 | Low | 🟢 Month 4 |
| Porto | 45,000 | Low | 🟢 Month 4 |

**Strategy**: Start with medium-competition cities (Prague, Lisbon, Porto) to build
domain authority faster before tackling Paris/Barcelona.

---

## Affiliate Partner Sign-Ups

1. **GetYourGuide** — https://partner.getyourguide.com — 8% commission
2. **Viator / Tripadvisor** — https://www.tripadvisor.com/affiliates — 8% commission
3. **Tiqets** — https://affiliates.tiqets.com — up to 10% commission
4. **Klook** — https://affiliate.klook.com — 5% commission
5. **Musement** — https://www.musement.com/partners/ — 10% commission
