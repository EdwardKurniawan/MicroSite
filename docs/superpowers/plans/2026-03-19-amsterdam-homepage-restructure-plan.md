# Amsterdam Homepage Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the Amsterdam homepage by moving detailed content (itineraries, FAQs, neighbourhood guides, etc.) to separate pages while keeping core attraction cards and categories on the homepage, based on Option A from the brainstorming session.

**Architecture:** Create new detail pages for moved content, update the homepage to remove those sections and replace with links to the new pages, maintain all existing functionality and navigation.

**Tech Stack:** HTML, CSS, JavaScript (existing), static site generation (manual copy/paste)

---

### Task 1: Create Directory Structure for New Pages

**Files:**
- Create: `amsterdam/itinerary/3-day/`
- Create: `amsterdam/faq/`
- Create: `amsterdam/when-to-visit/`
- Create: `amsterdam/reviews/`

- [ ] **Step 1: Create directories**

```bash
mkdir -p amsterdam/itinerary/3-day amsterdam/faq amsterdam/when-to-visit amsterdam/reviews
```

- [ ] **Step 2: Verify directories created**

Run: `ls -la amsterdam/`
Expected: See the new directories listed

- [ ] **Step 3: Commit**

```bash
git add amsterdam/itinerary/ amsterdam/faq/ amsterdam/when-to-visit/ amsterdam/reviews/
git commit -m "feat: create directory structure for Amsterdam detail pages"
```

### Task 2: Move 3-Day Itinerary Content to New Page

**Files:**
- Create: `amsterdam/itinerary/3-day/index.html`
- Modify: `amsterdam/index.html:1322-1413` (remove itinerary section)
- Modify: `amsterdam/index.html:1132-1143` (update TOC link)

- [ ] **Step 1: Extract itinerary content from homepage**

Copy the section from `<section id="itinerary" aria-labelledby="itinerary-heading">` to `</section>` (approximately lines 1322-1413) and save it as a complete HTML page with proper header, head, body structure.

- [ ] **Step 2: Create new itinerary page**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>3-Day Amsterdam Itinerary - Amsterdam Insider Guide</title>
  <meta name="description" content="Detailed day-by-day 3-day Amsterdam itinerary with museum visits, canal cruises, neighbourhood exploration and day trip options." />
  <!-- Add appropriate CSS and JS links -->
  <!-- Add JSON-LD schema for ItemList -->
</head>
<body>
  <!-- Include header/nav if shared, or recreate minimal version -->
  <main>
    <!-- Insert the itinerary content here -->
  </main>
  <!-- Include footer if shared -->
</body>
</html>
```

- [ ] **Step 3: Update homepage**

1. Remove the itinerary section (lines ~1322-1413)
2. Update the TOC link from `<a href="#itinerary">` to `<a href="/amsterdam/itinerary/3-day/">>`
3. Consider adding a teaser/excerpt if desired

- [ ] **Step 4: Commit**

```bash
git add amsterdam/itinerary/3-day/index.html amsterdam/index.html
git commit -m "feat: move 3-day itinerary to dedicated page"
```

### Task 3: Move FAQ Content to New Page

**Files:**
- Create: `amsterdam/faq/index.html`
- Modify: `amsterdam/index.html:808-835` (remove FAQ section)
- Modify: `amsterdam/index.html:1141-1142` (update TOC link)

- [ ] **Step 1: Extract FAQ content from homepage**

Copy the FAQ section (approximately lines 808-835) and save as a complete HTML page.

- [ ] **Step 2: Create new FAQ page**

Structure similar to itinerary page, with proper FAQPage schema.

- [ ] **Step 3: Update homepage**

1. Remove the FAQ section
2. Update the TOC link from `<a href="#faq">` to `<a href="/amsterdam/faq/">>`
3. Consider adding a teaser with 2-3 sample FAQs

- [ ] **Step 4: Commit**

```bash
git add amsterdam/faq/index.html amsterdam/index.html
git commit -m "feat: move FAQ to dedicated page"
```

### Task 4: Move When to Visit/Best Time Content to New Page

**Files:**
- Create: `amsterdam/when-to-visit/index.html`
- Modify: `amsterdam/index.html:1162-1231` (remove Best Time section)
- Modify: `amsterdam/index.html:1139-1140` (update TOC link)

- [ ] **Step 1: Extract Best Time content from homepage**

Copy the Best Time to Visit section (approximately lines 1162-1231) and save as a complete HTML page.

- [ ] **Step 2: Create new when-to-visit page**

Expand on the weather table content with more detailed seasonal information, events, etc.

- [ ] **Step 3: Update homepage**

1. Remove the Best Time section
2. Update the TOC link from `<a href="#best-time">` to `<a href="/amsterdam/when-to-visit/">>`
3. Consider adding a teaser with current season highlight

- [ ] **Step 4: Commit**

```bash
git add amsterdam/when-to-visit/index.html amsterdam/index.html
git commit -m "feat: move when to visit/best time to dedicated page"
```

### Task 5: Move Reader Reviews Content to New Page

**Files:**
- Create: `amsterdam/reviews/index.html`
- Modify: `amsterdam/index.html:837-857` (remove reviews section)
- Modify: `amsterdam/index.html:??` (update TOC link if present)

- [ ] **Step 1: Extract Reviews content from homepage**

Copy the Reader Reviews section (approximately lines 837-857) and save as a complete HTML page.

- [ ] **Step 2: Create new reviews page**

Consider expanding with more review collection functionality or structured presentation.

- [ ] **Step 3: Update homepage**

1. Remove the Reader Reviews section
2. Update TOC link if it exists
3. Consider adding a teaser with 1-2 highlight reviews

- [ ] **Step 4: Commit**

```bash
git add amsterdam/reviews/index.html amsterdam/index.html
git commit -m "feat: move reader reviews to dedicated page"
```

### Task 6: Update Neighbourhood and Category Links (if needed)

**Files:**
- Modify: `amsterdam/index.html` (verify all links work correctly)

- [ ] **Step 1: Verify neighbourhood cards link correctly**

Check that `.nb-card` elements link to `/jordaan/`, `/de-pijp/`, etc. (these should already exist and work).

- [ ] **Step 2: Verify category cards link correctly**

Check that `.cat-card` elements link to `/museums/`, `/canal-cruises/`, etc. (these should already exist and work).

- [ ] **Step 3: Fix any broken links**

Update any href attributes that point to removed sections.

- [ ] **Step 4: Commit**

```bash
git add amsterdam/index.html
git commit -m "fix: verify and update internal links after restructuring"
```

### Task 7: Add SEO Metadata to New Pages

**Files:**
- Modify: All new detail pages (`amsterdam/itinerary/3-day/index.html`, `amsterdam/faq/index.html`, etc.)

- [ ] **Step 1: Add proper title tags**

Each page should have a unique, descriptive title targeting relevant keywords.

- [ ] **Step 2: Add meta descriptions**

Compelling descriptions that encourage click-through from search results.

- [ ] **Step 3: Add structured data (JSON-LD)**

- Itinerary page: ItemList schema for day-by-day activities
- FAQ page: FAQPage schema
- When to visit page: Consider appropriate schema
- Reviews page: Review schema or AggregateRating

- [ ] **Step 4: Add Open Graph tags**

For social sharing when links are shared.

- [ ] **Step 5: Commit**

```bash
git add amsterdam/itinerary/3-day/index.html amsterdam/faq/index.html amsterdam/when-to-visit/index.html amsterdam/reviews/index.html
git commit -m "feat: add SEO metadata and structured data to detail pages"
```

### Task 8: Test and Verify Changes

**Files:**
- Test: Local development servers for Amsterdam and Kanazawa

- [ ] **Step 1: Start Amsterdam dev server**

Run: `npm run dev:amsterdam`
Verify: Homepage loads correctly, new pages accessible via links

- [ ] **Step 2: Test navigation**

Click through all menu items, TOC links, neighbourhood cards, category cards
Verify: All links work, no 404 errors

- [ ] **Step 3: Test new pages directly**

Visit each new page URL directly
Verify: Content displays correctly, styling is consistent, links back to homepage work

- [ ] **Step 4: Test on Kanazawa server**

Run: `npm run dev:kanazawa`
Verify: Amsterdam content still accessible via ?city=amsterdam parameter

- [ ] **Step 5: Commit test results**

```bash
git commit -m "test: verify Amsterdam homepage restructuring works correctly"
```

### Task 9: Final Review and Cleanup

**Files:**
- Review: All modified and created files

- [ ] **Step 1: Compare homepage size**

Check line count before/after to verify ~40% reduction
Before: ~1931 lines
Target: <1200 lines

- [ ] **Step 2: Verify no lost functionality**

Ensure all original content is still accessible, just in new locations

- [ ] **Step 3: Check for duplicate content**

Remove any accidental duplicates

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete Amsterdam homepage restructuring - move detailed content to separate pages per Option A design"
```

## Acceptance Criteria

- [ ] Homepage vertical scroll length reduced by at least 40% (from ~1931 lines to <1200 lines)
- [ ] All moved content accessible via new URLs:
  - `/amsterdam/itinerary/3-day/`
  - `/amsterdam/faq/`
  - `/amsterdam/when-to-visit/`
  - `/amsterdam/reviews/`
- [ ] All internal links from homepage to detail pages work correctly
- [ ] SEO meta tags present on all new detail pages
- [ ] Schema.org markup present where appropriate (FAQPage, ItemList, etc.)
- [ ] No loss of existing functionality (navigation, booking, etc.)
- [ ] Homepage loads faster (or at least not slower) than before
- [ ] All existing neighbourhood and category pages still accessible and working