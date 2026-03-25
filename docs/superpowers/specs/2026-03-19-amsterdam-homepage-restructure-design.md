# Amsterdam Homepage Restructure Design (Option A)

## Overview
Based on user feedback and brainstorming session, we will implement **Option A**: Keep core attraction cards and categories on the homepage while moving detailed content (itineraries, neighborhood guides, FAQs, and other deep-dive sections) to separate dedicated pages. This approach maintains the homepage's SEO value and user engagement while reducing scroll length and cognitive overload.

## Goals
1. Reduce homepage vertical length by ~40-50%
2. Maintain or improve SEO performance for key phrases
3. Improve user experience by reducing decision fatigue and scroll fatigue
4. Keep the homepage as an effective gateway to all Amsterdam content
5. Ensure easy navigation between homepage and new detail pages

## Current Homepage Structure (Baseline)
The current `amsterdam/index.html` contains these major sections:
1. Hero section
2. Author bar
3. Quick facts
4. Introduction
5. Table of Contents (on-page jumps)
6. WorldPride 2026 callout
7. Best time to visit (weather table)
8. Explore by category (category grid)
9. **3-Day Itinerary** (identified as too long)
10. Neighbourhoods (horizontal scroll)
11. Free things to do
12. Getting around
13. Weather table (duplicate?)
14. Reader reviews
15. Category hub grid
16. CTA banner (newsletter)
17. Footer

## Proposed New Structure

### Homepage (amsterdam/index.html) - Streamlined
Will retain:
- Hero section
- Author bar
- Quick facts
- Introduction
- Table of Contents (updated to link to new pages)
- WorldPride 2026 callout (keep if timely)
- Explore by category (category grid) - **KEEP**
- Neighbourhoods (horizontal scroll) - **KEEP**
- Free things to do - **KEEP (maybe shortened)**
- Getting around - **KEEP (maybe shortened)**
- CTA banner (newsletter)
- Footer

Will **MOVE** to separate pages:
- 3-Day Itinerary → `amsterdam/itinerary/3-day/index.html`
- Detailed neighbourhood guides (individual pages already exist, but we'll link from neighbourhood cards)
- FAQ → `amsterdam/faq/index.html`
- Best time to visit → `amsterdam/when-to-visit/index.html`
- Reader reviews → `amsterdam/reviews/index.html`
- Weather table (if duplicated) → consolidate with when-to-visit
- Any other deep-dive sections

### New Detail Pages to Create
1. **amsterdam/itinerary/3-day/index.html** - Full 3-day itinerary with day-by-day breakdown
2. **amsterdam/itinerary/2-day/index.html** - Optional 2-day itinerary
3. **amsterdam/itinerary/1-day/index.html** - Optional 1-day itinerary
4. **amsterdam/faq/index.html** - Comprehensive FAQ with schema
5. **amsterdam/when-to-visit/index.html** - Detailed weather, events, seasons guide
6. **amsterdam/reviews/index.html** - Aggregated reader reviews/testimonials
7. Individual neighbourhood pages already exist: `/jordaan/`, `/de-pijp/`, etc. - we'll ensure they're properly linked

### Navigation Updates
- Update Table of Contents links to point to new pages instead of on-page anchors
- Update neighbourhood cards to link to their respective neighbourhood pages (they already do)
- Update category cards to link to category sections (they already do)
- Add new links in header/footer or contextual links where appropriate
- Consider adding a "More Amsterdam" section in footer with links to detail pages

### SEO Considerations
- Ensure all moved content pages have proper:
  - Title tags and meta descriptions targeting long-tail keywords
  - H1 headings matching user intent
  - JSON-LD schema (FAQPage, ItemList for itineraries, etc.)
  - Internal linking from homepage with descriptive anchor text
  - Breadcrumb schema
  - Canonical tags pointing to the new URLs
- Homepage should retain:
  - Primary keyword targeting: "things to do in Amsterdam"
  - Strong introduction content
  - Category grid with descriptive links
  - Author expertise signals
  - Schema.org WebSite, Organization, etc.

### Component Impact
- No changes needed to existing components (attraction cards, neighbourhood cards, category cards, etc.)
- New pages will reuse existing CSS classes and components
- May need to create new templates for itinerary and FAQ pages

### Data Flow
- All content is static HTML; no database changes needed
- Content migration involves copy/paste from existing homepage sections to new files
- Update links in homepage to point to new locations

### Error Handling
- Standard 404 handling if pages are missing
- Ensure all links are updated and tested
- Use relative paths where possible for easier deployment

### Testing Plan
1. Visual regression testing: compare homepage before/after
2. Link validation: ensure all internal links work
3. SEO validation: check title tags, meta descriptions, schema
4. Performance testing: measure homepage load time improvement
5. User testing: verify new navigation is intuitive

### Implementation Steps
1. Create new directory structure for detail pages
2. Copy content from homepage sections to new files
3. Update homepage to remove moved sections and update TOC links
4. Update any broken links or references
5. Test locally on both Amsterdam and Kanazawa servers
6. Deploy and monitor

## Acceptance Criteria
- [ ] Homepage vertical scroll length reduced by at least 40%
- [ ] All moved content accessible via new URLs
- [ ] All internal links from homepage to detail pages work correctly
- [ ] SEO meta tags present on all new detail pages
- [ ] Schema.org markup present where appropriate (FAQPage, etc.)
- [ ] No loss of existing functionality (navigation, booking, etc.)
- [ ] Homepage loads faster (measured by LCP or similar metric)

## References
- Current Amsterdam homepage: `amsterdam/index.html`
- Existing neighbourhood pages: `amsterdam/jordaan/index.html`, etc.
- Existing category pages: `amsterdam/museums/index.html`, etc.
- Design system tokens: defined in CSS `:root` of homepage

## Open Questions
1. Should we keep a shortened version of any moved sections on the homepage as teaser content?
2. How should we handle the WorldPride 2026 callout (time-sensitive)?
3. Should we create a generic itinerary index page that lists all available itineraries?
4. What is the target date for removing or updating the WorldPride 2026 content?