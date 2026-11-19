# nepali.no Project Progress Archive (2026-08-08 to 2026-11-19)

**Archive range:** Checkpoints 12–37 (August 2026 – 19 November 2026, through PR #132 / `87c2438`)
**Current canonical handover & status document:** `DEVELOPER_HANDOVER.md`
**Earlier history archive:** `PROJECT_PROGRESS_ARCHIVE_TO_2026-08-08.md`

This archive preserves Sections 12–37 verbatim from the former `PROJECT_PROGRESS.md` when `PROJECT_PROGRESS.md`, `DISCOURSE_GIGAHOST_RUNBOOK.md`, and `FORUM_ARCHITECTURE_AND_GOVERNANCE.md` were consolidated into `DEVELOPER_HANDOVER.md` on 19 November 2026.

---

## 12. Checkpoint: final Forum hostname and publishing diagnostics

The existing Gigahost Discourse installation was promoted in place from the pilot identity to the canonical production identity at `https://forum.nepali.no`. No fresh production installation or database migration was performed. DNS, TLS, canonical URLs, administrator access, existing categories, permissions, users, groups, and topics 13, 17, and 18 were verified after the transition. `https://forum-poc.nepali.no` has valid TLS and redirects to the canonical hostname.

The public application now uses `https://forum.nepali.no/` as its server-owned Forum base URL. Protected metadata diagnostics resolved topic 13 through the final hostname and returned a canonical `forum.nepali.no` topic URL. Public News and Guide Forum presentation remains disabled.

Connected-content work also completed through PRs #42 to #45:

- News may select one optional active same-language Primary Supporting Guide.
- Guide pages discover at most three recent eligible News articles through the reverse relationship.
- News and Guide context-rail links use compact clickable titles with safe empty states.
- The News desktop context rail no longer stretches to article height.

### Nepali News publishing incident resolved and evidence preserved

A real Nepali News publication on 10 August 2026 entered the signed automatic workflow but did not create a Forum topic. The request reached `POST /posts.json` at `forum.nepali.no`, authenticated `forum-publisher`, targeted category 10, and received HTTP 422. No matching topic was created and no topic ID was written to Sanity.

The original document remains preserved with its historical `forum-publishing-result-unconfirmed` state, bounded attempt evidence, timestamps, failure code, and empty relationship. It must not be casually reset, republished, manually linked, or replaced with a hand-created topic.

Controlled investigation after the post-promotion backup established that Nepali text was not the cause. Norwegian and Nepali representative opening posts both passed the same in-memory Discourse text and post validators. The actual cause was Discourse host-spam protection for the deliberately Trust Level 0 publisher account: two existing links to `nepali.no` plus the proposed companion link reached the configured threshold of three. The organization-controlled domain was added narrowly to `allowed_spam_host_domains`; the global threshold remained unchanged, and `forum-publisher` remained Trust Level 0, non-staff, non-admin, and category-limited.

A fresh synthetic Nepali News fixture then published exactly once through the signed automatic workflow. Discourse created topic 27 in category 10, authored by `forum-publisher`, and Sanity stored the durable relationship with `Created` status, completion time, and no failure code. A later ordinary editorial republication to enable homepage featuring preserved topic 27 and created no duplicate.

### Current operational priorities

1. Complete a clean disposable restoration test from a native backup and record recovery time and missing steps.
2. Preserve the original incident, the failed synthetic classifier fixture, the successful topic 27 proof, and topics 13, 17, and 18 as operational evidence.
3. Begin upgrade-safe visual harmonization of Discourse with nepali.no and verify mobile, accessibility, language selection, and account flows.
4. Keep public Forum presentation disabled until a separate frontend milestone is reviewed and approved.
5. Define backup retention, periodic restore testing, monitoring, upgrade, incident, and moderator-readiness procedures.

### Homepage visual checkpoint

PR #48 refined the desktop homepage composition by tightening hero and section spacing, aligning featured News media, linking the localized latest-News heading to the News archive, and giving the Community Directory a more professional card presentation. The responsive mobile-first structure was preserved. This checkpoint does not enable public Forum panels or alter Sanity publishing workflows.

## 13. 2026-09-01 presentation and social-sharing continuity update

At this 2026-09-01 checkpoint, the local branch `feature/news-and-events-presentation` contained six reviewed presentation and metadata checkpoints after protected production checkpoint `ec9651a`:

- `a291ca8` unified Event and Directory context rails
- `defb9d3` modernized the Event detail presentation
- `11a2a86` refined the homepage Important News presentation
- `a2540d3` expanded the homepage News presentation
- `6f38d8f` added social-sharing metadata
- `913e850` redesigned the News archive presentation

Presentation decisions:

- Event and Directory detail pages share reusable, responsive context-rail and panel components.
- Event details place date, time, venue, price, registration, and map access above the fold and use controlled 16:9 desktop and 4:3 mobile imagery.
- The homepage shows one featured News story, two supporting visual stories, and three compact stories, with consistent archive links above and below.
- The Important News band retains its pale-red treatment and accessible pulsing indicator. `importantUntil` controls automatic expiry but is never rendered publicly.
- The Nepali homepage News heading is `ताजा समाचार`; the former News eyebrow is not rendered.
- The News archive shows one featured article, two supporting visual stories, six medium cards, and every remaining article in a compact list. The three Guides at the end remain independent general information.

Social-sharing decisions:

- Astro now uses `https://nepali.no` as the production site origin.
- `BaseLayout.astro` emits canonical, Open Graph, and X Card metadata without loading third-party scripts.
- News uses `article` metadata, publication time, and a 1200 x 630 Sanity image crop.
- Events and Directory listings use suitable Sanity images when available.
- No Facebook or X script, pixel, widget, cookie, advertising SDK, or tracking integration was added.
- A branded global 1200 x 630 fallback image remains deferred for Guides, archives, static pages, and content without suitable imagery.

Validation completed after each implementation checkpoint: `git diff --check`, Astro Check with zero errors and zero warnings, production build, and desktop/mobile visual review. The branch remains local and production still serves protected checkpoint `ec9651a` until the branch is pushed, reviewed, merged, and deployed.

## 14. 2026-09-03 rich typography and editorial workspace continuity update

PR #50 and PR #51 are merged into protected `main` and deployed to production.

### Shared rich typography

PR #51, production checkpoint `812abf7`, added one shared `.prose` typography system for all current public long-form Portable Text surfaces:

- News article bodies
- Public Information Guide bodies
- Community Event descriptions
- Community Directory listing descriptions
- Public Information Topic Hub introductions

The shared system restores and improves visible bullet markers, numbered lists, nested-list indentation, multiline alignment, `h2` to `h4` hierarchy, blockquotes, strong and emphasized text, links, keyboard focus, inline code, and responsive spacing. The Family Reunification Guide was visually verified in production. No Sanity schema, query, document, or content migration was required.

### Sanity News editorial workspace

The News Article editor is functionally complete but visually and operationally cluttered. The next Studio-focused design discussion should evaluate:

- a writing-first default tab containing title, summary, featured image, and article content
- separate Classification, Translation, Publishing, Sources and trust, and Forum groups
- collapsed technical Forum and automation fields
- conditional visibility for Important Now lifecycle fields
- clearer News document lists and task-oriented filters
- an explicitly configured Portable Text toolbar for headings, quotation, bullet list, numbered list, bold, emphasis, links, and images
- a future Form and Preview document view

Existing document field names and published data must be preserved. Events and Directory already use tab-oriented form organization and should be treated as references rather than redesigned automatically.

### Confirmed small branding and routing work

At this historical checkpoint the site used Astro's default favicon. This was superseded by the branded favicon implementation in PR #81 (see section 20); hosted browser, mobile and cache behavior still require independent verification.

The root route intentionally sends `/` to `/ne/`. The `nepali-no.vercel.app` route must remain available until the Translation Editor production-domain GitHub OAuth callback is corrected and fully tested. Do not introduce a blanket Vercel-domain redirect before that dependency is removed.

### Four Sanity-managed trust pages

At this historical checkpoint, the proposed work was to move all four localized footer trust pages from hardcoded Astro content into Sanity-managed editorial content:

1. About
2. Project development and transparency
3. Privacy
4. Contact

The migration was to preserve existing localized URLs, footer links, Nepali and Norwegian language switching, responsive presentation, publication controls, and safe fallback behavior. The repository now implements Sanity-managed Trust Pages (section 4); current editorial publication and wording were not rechecked during this task.

## 15. 2026-10-03 Guide archive search

The localized `/[lang]/info/` archive has a minimal client-side Guide search. It is intentionally not site-wide search.

- `ACTIVE_PUBLIC_INFORMATION_GUIDES_QUERY` selects `searchKeywords` for this archive; Guide detail metadata and structured data do not use them. The later shared-search projection also selects these keywords (see `src/lib/search/query.ts`). `tests/content/guideSearch.test.mjs` checks the archive query.
- Each Guide list item carries a normalized `data-search-text` attribute built from title, summary, responsible agency, and Search Keywords. Keywords are never rendered as visible text or cards. They are present in the page source only inside that attribute.
- `src/lib/guideSearch.ts` normalizes text (case, whitespace, zero-width joiners, Latin accents, and `æ`/`ø`/`å` folded to `ae`/`o`/`a`; Devanagari is preserved) and requires every query term to match.
- The search box appears only when JavaScript runs. With an empty query the page keeps its Topic grouping. While searching, Topic cards are replaced by one de-duplicated list of matching Guides with a result count and an empty state.
- Labels, placeholder, hint, result count, and empty-state text live in `information` in `src/i18n/ne.ts` and `src/i18n/nb.ts`.

This Guidance-only interface does not include Guide body or Norwegian-term indexing, ranking, fuzzy or typo-tolerant matching, `?q=` URLs, an external search service, SEO meta keywords, or site-wide search. The later shared search is separate and indexes body vocabulary; see `docs/shared-content-search.md`. Nepali spelling variants beyond zero-width joiners (for example chandrabindu versus anusvara) match only if an editor adds them as Search Keywords. Guides are currently disabled on the Norwegian site (section 16), so this search exists on `/ne/info/` only.

## 16. 2026-10-03 Norwegian site is News only

The Norwegian (`nb`) site currently publishes News only. Guides, Events, Directory, and the Forum are disabled there until Norwegian content exists.

- `src/config/languageSections.ts` is the single switch. `isSectionEnabled(language, section)` drives the header and footer links, the homepage pathways and sections (Guides, Events, Directory, Forum discussions), the News archive "useful information" block, the Forum card and supporting Guide on News articles, the Contact page items, and the Events and Directory submission language switchers.
- `getStaticPaths()` on every Guide, Topic Hub, Events, and Directory route only generates paths for languages with the section enabled, so no `/nb/info`, `/nb/events`, or `/nb/directory` pages are built.
- `src/pages/nb/{info,events,directory}/[...slug].astro` are server-rendered 302 redirects to `/nb/`, so old links and bookmarks still land somewhere useful. The redirects are temporary on purpose.
- The language switcher on Nepali pages points to `/nb/` instead of a disabled Norwegian section (`resolveAlternatePath`).
- Nepali is unchanged. To re-enable a Norwegian section, set its flag to `true` in `languageSections.ts` and delete the matching redirect page.
- Not changed: Sanity content and schemas, Norwegian About, Privacy, and Transparency text (they describe the whole service and may still mention Forum, Guides, and Events), the Norwegian homepage hero text, and Forum automation for `nb` content.
- Tests: `npm run test:language-sections` (also added to CI together with `test:guide-search`).
- Handover: `DEVELOPER_HANDOVER.md` has a "Per-language section availability" section with the re-enable steps.
- Before promoting the Norwegian site, review the Norwegian About, Privacy, Transparency, and homepage hero text and the Forum automation for `nb` content.

## 17. 2026-10-03 News author dropdown

The News Article `authorName` field now uses a custom Studio input (`sanity/components/AuthorNameInput.tsx`): a dropdown of usual authors plus an "Other" option that reveals a text box. New articles default to the first preset.

- The stored value is still a plain string, so the public site, queries, and existing articles are unchanged. Existing values that are not in the list (including older variants with different casing or trailing spaces) appear as "Other" with the text preserved.
- Add or reorder authors in `sanity/schemaTypes/authorNamePresets.ts`. Current presets: `nepali.no Editorial`, `Pankaj Kafley`.
- `@sanity/ui` is pinned to `3.4.5` in `sanity/package.json` to match the version bundled by `sanity`. Keep them aligned when upgrading Sanity.
- The Studio must be redeployed (Vercel `nepali-no-studio`, and the hosted Studio if it is used) for editors to see the dropdown.

## 18. 2026-10-03 Event labels and organizer contact gating

- **Homepage placement is not a label.** The "special event" badge on homepage Event cards was removed. The Sanity field `isFeatured` is now titled "Show on Homepage" and only controls placement.
- **Ticket and price wording.** `src/lib/eventAccess.ts` chooses the registration and ticket labels for the homepage, list, and detail pages. Free ticketed events say "Get free ticket" and "Free ticket required" and never use "buy" wording. Ticketed events use ticket statuses ("Tickets available", "All tickets taken") instead of registration statuses. Event cards now show a free or paid badge, and the homepage card also shows when registration or tickets are required.
- **Organizer contact details need permission.** New Sanity field `organizerContactPermission` (default false). Every Event query projects `organizerEmail` and `organizerPhone` only when it is true, so the details are never fetched or rendered otherwise. Events published before this change lose their public contact details until an editor ticks the box. The email and phone fields show a Studio warning when filled without permission.
- **No third-party scripts.** The site loads no Google, Facebook, or other marketing or tracking scripts, and none should be added to Events (for example no Google Calendar embeds). Any future calendar feature must be a local `.ics` download. Structured data, if added, is inert JSON-LD.
- Tests: `npm run test:event-labels`, also run in CI.
- The new Nepali wording (`getFreeTicket`, `tickets`, `freeTicketRequired`, `paidEvent`, `ticketStatuses`) should be proofread by a Nepali editor.

## 19. 2026-10-03 Events with multiple dates

- New Sanity array `additionalDates` (start and end per date) on Community Event. Start/End stay the first date; further days go in the list.
- `src/lib/eventOccurrences.ts` expands an event into one entry per upcoming or ongoing date. The events list and homepage show the event under each upcoming date (homepage: featured first, max 3). The detail page shows all dates under "All dates" and its hero uses the next date.
- Queries keep an event in "upcoming" while any date is still ahead, and in "past" only after its last date.
- Tests: `npm run test:event-occurrences` (also in CI). The Studio needs a redeploy to show the new field.
- Not done: past-list shows only events whose last date has passed, using the first date's end for display.

## 20. 2026-10-04 Favicon

- Replaced the default Astro favicon with the nepali.no logo (red square with white "ने"). `public/` now has `favicon.ico` and `favicon-96.png` (letter only, readable at tab size), `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` (full logo with wordmark) and `site.webmanifest`. `BaseLayout.astro` links them on every page.

## 21. 2026-10-14 News article structured data

PR #88 adds one JSON-LD `@graph` to Nepali and Norwegian News article detail pages only:

- Each graph contains one `NewsArticle` and one `BreadcrumbList`. The article uses the page's canonical URL, visible title, summary, publication date, localized language and category, and a free-access declaration.
- Featured images reuse the same resolved production URL as the page's Open Graph image. Articles without a featured image omit the `image` property.
- Author type comes from the optional Sanity `authorType` (`person` or `organization`) when set. For legacy articles, the exact author name `nepali.no Editorial` maps to `Organization`; any other non-empty name maps to `Person`; an empty or unavailable name omits the author. This fallback does not infer types from naming patterns.
- The publisher references the existing `https://nepali.no/#organization` entity without redefining it. Author profile URLs and `dateModified` are omitted because reliable source data is unavailable.
- Breadcrumb items use localized Home and News labels and absolute URLs, followed by the current article URL and title. The visible breadcrumb displays Home and News; the article title is the page heading.
- `NEWS_ARTICLE_BY_SLUG_QUERY` fetches `authorType`; no other query or page type receives this markup. Existing page metadata and homepage structured data are unchanged.
- Tests: `npm run test:news-article-structured-data` covers author resolution, image handling, language, canonical IDs, publisher, breadcrumbs and omitted fields.

## 22. 2026-10-15 Shared editorial charts (historical rollout checkpoint)

At this checkpoint, implementation was complete on the working branch but had not yet been deployed. The chart schema and renderer were subsequently merged into `main`; current hosted rollout and any Sanity-published chart content still require independent verification.

- One shared `editorialChart` Portable Text object is available in both News articles and Public Information Guides. Supported types: vertical bar, horizontal bar, grouped bar, stacked bar, line, area, donut and pie.
- Charts are rendered server-side with Astro, HTML and SVG. No charting library was added and no client hydration is required.
- Included: accessible HTML data tables, textual fallback, compact and wide responsive layouts, controlled internal scrolling for genuinely large datasets, mobile-readable layouts for ordinary datasets, print support (the full table prints even when the disclosure is closed), automatic percentages for pie and donut, locale-aware Nepali (`ne-NP`) and Norwegian (`nb-NO`) number formatting, and graceful handling of malformed or unknown chart data.
- Existing News and Guide content needs no migration, and chart-free content renders unchanged. Charts stay language-specific inside each News or Guide document. No Norwegian Guide routes or disabled sections were enabled.
- Documentation: `docs/editorial-charts.md` (editors) and the "Editorial charts" section of `DEVELOPER_HANDOVER.md`.

Validation status at completion: 41 focused editorial-chart tests passed; 170 total tests passed; Astro check 0 errors; Astro production build succeeded; Sanity Studio build succeeded; ESLint passed; Prettier passed; `git diff --check` passed.

Required rollout sequence:

1. Deploy the public Astro frontend first.
2. Verify existing production News and Guide pages.
3. Deploy the canonical Vercel-hosted Sanity Studio.
4. Create one controlled draft chart in Sanity.
5. Preview the draft on mobile and desktop.
6. Publish only after production rendering is verified.

## 23. OpenStreetMap mapping milestone checklist

- [x] Add a shared Sanity `geopoint` location model and map editor with exact/approximate precision, radius, zoom, manual coordinates, deliberate OSM search, validation, and no implicit saved location.
- [x] Add one reusable optional News/Guide map block and a shared lazy, click-to-load Leaflet renderer.
- [x] Add optional map coordinates to eligible Events and physical Directory listings without changing existing addresses, links, or private submission forms.
- [x] Localize map controls and external-service notices; document OSM/Nominatim restrictions, privacy behavior, checks, rollout, and rollback here and in the handover.
- [x] Add focused tests and run root and Studio validation before reporting completion.

## 24. 2026-11-02 OpenStreetMap mapping milestone

At the 2026-11-02 checkpoint, implementation was on `feature/openstreetmap-mapping` and had not yet merged or deployed. The mapping milestone later merged in PR #107; map-presentation and preview follow-ups merged in PR #108.

- Shared optional Sanity `mapLocation` stores coordinates as the standard `geopoint`, precision (`exact` or `approximate`), an approximate radius (50–100,000 m), and initial zoom (1–19). The shared Studio input supports map click, draggable pin, manual latitude/longitude, clearing, saved-value preview, validation and an external OSM search link. No point is saved by opening the field. For approximate locations, the centre remains public coordinate data; editors must choose a safe approximate centre.
- One optional `locationMap` Portable Text block is registered in News and Guides. It supports a title, map location, caption, source label/HTTP(S) URL and required accessible description.
- Events and Directory listings have optional `mapLocation` fields. Existing address fields and `mapUrl` values remain unchanged; no URLs are parsed or records geocoded. Public maps are limited to in-person/hybrid Events and physical/physical-and-online Directory listings. Existing submission forms remain unchanged and coordinates are not required.
- `src/components/content/LocationMap.astro` is the shared Leaflet renderer. Maps and Leaflet resources load only after activation; exact mode shows a marker and an OpenStreetMap link, while approximate mode shows only a circle and its public radius. Attribution, keyboard-accessible zoom controls, localized status/error text and a visible external-request notice are included. Map failures preserve the textual location and links.
- Tile URL, attribution and external search URL are centralized in `src/lib/maps/location.ts`. The renderer uses `https://tile.openstreetmap.org/{z}/{x}/{y}.png` directly; OSM’s public tile service has no availability guarantee. It must not be prefetched, used offline, proxied anonymously, or silently replaced. Browser caching and Referer behavior are left intact. See the [OSMF Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/).
- Search is an explicit link to OpenStreetMap’s own search page, not an embedded Nominatim request. The public Nominatim API prohibits autocomplete and has a strict application-wide one-request-per-second limit; enforcing this reliably would need shared infrastructure. Editors are warned to search only public place information and then place the pin or enter coordinates manually. There is no visitor-facing geocoding service. See the [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/).
- The click-to-load notice explains that the browser sends its IP address and a map-area request to an external OpenStreetMap service. This notice is not a complete legal assessment. The canonical Sanity-managed Nepali and Norwegian Privacy pages remain editorially owned; their text should be reviewed before publishing maps.
- Automated verification passed: `npm run test:maps` (7), `npm run test:language-sections` (5), `npm run test:event-labels` (9), and `npm run test:event-occurrences` (3); `npx astro check` (0 errors, 0 warnings, 6 existing hints); `npm run build`; and `npm --prefix sanity run build`. The Studio build retains existing warnings for an unset `appId` and local Sanity 6.6.0 versus hosted runtime 6.21.0. Prettier checks for the new mapping files and `git diff --check` passed.
- Acceptance verification not performed on 2026-11-02: no browser or interactive Studio tooling is available in this session. No save/reopen, network, rendering, keyboard/mobile, fallback, legacy-content, or Privacy-page review is claimed. No Studio content was changed.
- Manual acceptance checklist and local URLs:
  1. Start the frontend and Studio locally. Frontend: `http://localhost:4321/`; Studio: `http://localhost:3333/content/` (`sanity/sanity.config.ts`, base path `/content`). Check routes using existing slugs: `/ne/events/<slug>/`, `/ne/directory/<slug>/`, `/ne/news/<slug>/`, `/ne/info/<slug>/`, and localized Privacy pages `/ne/privacy/`, `/nb/privacy/`.
  2. In Studio, use `Map Coordinates` on an Event/Directory document or `Map Location` inside a News/Guide `Location Map` block. Save, reopen, and check exact and approximate values; drag the pin; enter latitude `0` and longitude `0`; clear the value. Confirm radius `50` and `100000` and zoom `1` and `19` are accepted; reject radius `49`/`100001`, zoom below `1`/above `19`, and out-of-range or non-finite coordinates.
  3. In browser developer tools, confirm no OSM/Leaflet network requests before activating a public map. Activate it and confirm OSM tiles and visible attribution. Check exact marker/link, approximate circle with no precise marker or centre link, and two independent maps on one page.
  4. Check keyboard focus/zoom controls and normal mobile scrolling. Block or fail tile requests and confirm a useful error while text remains. Check legacy Event/Directory pages without `mapLocation`, plus online Events and `online-only`/`no-public-location` listings.
  5. Read the actual Nepali and Norwegian Sanity Privacy documents without editing or publishing them. Confirm they explain that activating a map contacts OpenStreetMap tile services and transmits visitor IP address and requested map tiles/area; assess whether editor/legal wording needs an update. This review remains unperformed, so no change is recommended as already approved.
- Public-renderer test fixture (2026-11-02): public pages fetch with `perspective: "published"` (`astro.config.mjs`), so they do not display draft articles; the separate authenticated Preview routes were added later. Local-only page `src/pages/dev/location-map-test.astro` renders the real `LocationMap.astro` with one exact and one approximate fixture map. It is `prerender = false` and returns 404 unless `import.meta.env.DEV`; a production build emits no static copy. Open `http://localhost:4321/dev/location-map-test/` after `npm run dev` (Codespaces: forward port 4321). Studio local map confirmed working by the owner after the explicit `referrerPolicy: strict-origin-when-cross-origin` tile fix; public-renderer browser checks remain pending.
- Multiple locations, icons and saved routes were added afterwards; see section 25.

Rollout: deploy the public frontend first, verify legacy pages, then deploy the canonical Vercel Studio and preview a controlled draft on mobile and desktop. Before rolling back to a frontend without `locationMap` support, remove/replace every published map block. No data migration or backfill is required.

## 25. 2026-11-02 Multi-location maps, icons and saved driving routes

At this checkpoint, the multi-location, icon and saved-route implementation was still uncommitted on `feature/openstreetmap-mapping`. It was subsequently merged with the map and preview work in PRs #107 and #108.

Owner-verified baseline (manual, browser): on `/dev/location-map-test/` both placeholders render before activation; exact and approximate maps activate independently; exact mode shows OSM tiles, a precise marker and an OSM link; approximate mode shows a 1,500 m circle with no centre marker or precise link; attribution is visible; tiles load after the explicit `referrerPolicy` fix.

- The `locationMap` block gained an ordered `locations` array (`mapPlace`: stable `_key`, label, optional description, geopoint, precision, radius for approximate, icon for exact), a block `initialZoom`, and an optional `route`. Editors add, edit, reorder and remove locations in `sanity/components/MapPlacesInput.tsx` (all places on one map, select, drag, manual coordinates, fit-all). Duplicate/missing keys, labels, coordinates, precision, radius and icon values are validated.
- Icons: pin, home, parking, restaurant, hospital, airport, warning. They are fixed internal SVG badges (`src/lib/maps/markerIcons.ts`); no remote icon service, URL, or editor HTML/SVG. Every place keeps a visible text label in a list outside the map. Approximate places are always circles with no marker, tooltip or centre link.
- Backward compatibility: the legacy `location` field stays in the schema (optional, hidden when empty). `normalizePlaces` (`src/lib/maps/places.ts`) maps it at render time to one place keyed `legacy`; `locations` wins when non-empty. No migration or re-entry. Legacy zoom is preserved; multi-place maps and routes use `fitBounds` with padding.
- Public renderer: all valid places, safe DOM-built popups/tooltips (`textContent`, never HTML), marker `aria-label`s, per-place "Show on map" buttons, per-place OSM links for exact places only, no block-level link for multi-place maps. Click-to-load, notice, attribution, referrer policy and failure fallback unchanged.
- Routing decision: FOSSGIS OSRM (`https://routing.openstreetmap.de/routed-car/route/v1/driving/`) verified on 2026-11-02: no key/account/cost, CORS enabled, HTTP 200. Terms: max 1 request/s, valid User-Agent/Referer, OSM attribution with a link to `https://www.openstreetmap.org/fixthemap`, single server, no availability guarantee, revocable permission. The terms do not explicitly address storing results or publicly displaying route geometry (unverified); the OSRM wiki calls the demo server non-commercial. Mitigation: only an explicit Studio "Calculate route" action calls it (1.1 s minimum gap, one in flight, timeout, max 10 stops); public pages never make routing calls. The geometry (polyline6), distance, duration, provider, timestamp and a stops signature are saved in Sanity. Changed stop order, keys or coordinates make the route stale; Studio validation blocks an enabled stale route; the public page draws only a fresh, valid, enabled route and never a straight-line fallback. Duration is labelled an estimate without live traffic. Only exact places can be stops. No self-hosting or paid service was added.
- Files: `src/lib/maps/{location,places,markerIcons}.ts`, `src/lib/maps/dev/fixtureRoute.json`, `sanity/schemaTypes/mapLocation.ts`, `sanity/components/{MapPlacesInput,MapRouteInput}.tsx`, `src/components/content/LocationMap*.astro`, `src/i18n/{ne,nb,en}.ts`, `src/pages/dev/location-map-test.astro`, `tests/maps/*.test.mjs`.
- Automated checks passed: `npm run test:maps` (29/29), `npx astro check` (0 errors, 12 hints), Studio `tsc --noEmit`, `npm run build`, `npm --prefix sanity run build` (existing appId/version warnings). The production bundle does not contain the fixture route; the fixture page returns 404 outside DEV.
- Automated headless-Chrome run (CDP, 390x844 emulation; not an owner manual test) against the fixture: 0 tile/routing requests before activation; 22 tile requests after, all with Referer `http://localhost:4321/` and `strict-origin-when-cross-origin`; 0 routing requests; no console errors; marker/circle/polyline/list/link counts as expected; HTML in a description rendered as literal text; approximate focus opens no popup; blocked tiles show the localized failure message and keep the text. Controls were measured inside the canvas corner.
- NOT performed: Studio browser testing of the new places/route inputs (add, edit, reorder, drag, route calculation, stale detection); real keyboard and touch-device scrolling; Privacy page review; Nepali/Norwegian wording is minimal and awaits the consolidated editorial review.
- Deployment order: frontend first, then Studio. Rollback: remove or replace published `locations`/`route` content before restoring an older frontend; legacy `location` data remains intact, so no data migration is needed.
- Owner decision required: accept the FOSSGIS community routing service (unguaranteed, revocable, storage not explicitly covered), or decline routing (the route field can be left disabled; other features are unaffected). Next owner action: open `http://localhost:4321/dev/location-map-test/`, run the checks, then in Studio add a multi-location block and calculate one route.

### 25a. Release safeguard: route calculation disabled by default

- Owner has not approved FOSSGIS routing for production: permission to store and publicly display returned route geometry is unverified. Unresolved; do not enable until confirmed in writing/official terms or a different approved provider is chosen.
- Configuration point: `ROUTING_CALCULATION_ENABLED` in `src/lib/maps/location.ts` (default `false`). While false, `sanity/components/MapRouteInput.tsx` returns before any `fetch`, the "Calculate route" button is disabled, and Studio shows an evaluation-only warning. No request goes to `routing.openstreetmap.de`. Public pages never make routing requests regardless of the flag.
- Unchanged: multiple locations and icons; the route schema/model, stale detection, public rendering of an already saved route, and the dev-only fixture (stored geometry, no request). Content without a route is unaffected. Do not enable routes on content to be published.
- Checks: `npm run test:maps` 30/30 (new flag/guard test), `astro check` 0 errors, Studio `tsc`, root and Studio builds pass. Not browser-verified in Studio.

## 26. 2026-11-02 Manual editorial path (clarified requirement)

At this checkpoint, the editorial-path implementation was still uncommitted on `feature/openstreetmap-mapping`. The path feature was subsequently included in the map and preview work merged through PRs #107 and #108.

- Clarified requirement: the primary line feature is an EDITORIAL HIGHLIGHTED PATH drawn by the editor (journey, railway/accident corridor, evacuation or procession route). It must never be described as a calculated driving route. The automatic FOSSGIS route model (section 25) is kept separate for later evaluation; calculation stays disabled (`ROUTING_CALCULATION_ENABLED = false`), no request goes to `routing.openstreetmap.de`, and the provider is unchanged.
- Sanity storage (`locationMap.editorialPath`, type `mapEditorialPath`, separate from `route`): `enabled`, `label`, `description`, `color` (blue, red, orange, green, purple, black), `style` (solid, dashed), `points` (array of standard `geopoint`, 2-500, hidden field edited by the map), `updatedAt`, `locationsSignature` (fingerprint of all locations when the path was last edited). Direction arrows are not implemented (not accessible without a larger design).
- Studio (`sanity/components/MapPathInput.tsx`, no new dependency): tick "Highlighted editorial path", then click the map to append points, drag numbered points, click "+" between points to insert, select/remove points, "Clear path…" (asks for confirmation), "Fit path and locations". A text list of points offers Select / Insert after / Remove as a keyboard alternative. The path is never created automatically from locations. Moving a location does not alter the path; Studio shows a review warning (also a publish-time validation warning). Enabled paths with fewer than 2 points, invalid coordinates (zero is valid), consecutive duplicates, or unsupported colour/style are validation errors.
- New place option `showLabel` (exact places): always show the label on the map; off = label on hover/focus only. Existing places without the field keep always-visible labels. Labels are DOM text, never HTML; approximate areas never get a label at their centre. The text list below the map is unchanged.
- Public renderer (`LocationMap.astro`): draws the saved path (white casing plus coloured line) above tiles and below markers, fits path, locations and areas with padding, shows the path label/description outside the map, and makes no routing request. Click-to-load, notice, attribution, referrer policy and independent multiple maps are unchanged. Invalid or disabled paths are not drawn (no straight-line fallback).
- Dependency decision: none added. Needed behaviour (click, drag, insert, remove) is a small amount of Leaflet marker code; leaflet-draw/Geoman were not needed. Zero bundle impact.
- Backward compatibility: all new fields are optional. Legacy single-location, multi-location, icon, approximate and route-fixture content is unchanged; no migration.
- Fixture: `http://localhost:4321/dev/location-map-test/`, section "6. Editorial highlighted path (manual, synthetic data)" (original Norwegian sample data; DEV only, 404 in production).
- Automated checks passed: `npm run test:maps` 43/43 (new `tests/maps/editorialPath.test.mjs`), `astro check` 0 errors, Studio `tsc --noEmit`, root build, Studio build, `test:language-sections` 5, `test:event-labels` 9, `test:event-occurrences` 3. Headless Chrome on the fixture (mobile 390x844, automated, not an owner check): 0 provider requests before activation; 14 tile requests with Referer `http://localhost:4321/`; 0 routing requests; dashed red path with casing; hover-only label hidden, others shown; path text, 4-item list, caption and attribution present.
- NOT performed: Studio browser testing of path drawing/drag/insert/remove/clear and the review warning; real keyboard and touch use; wording review of Nepali/Norwegian strings (path text is editor-written; no new i18n strings).
- Rollback: remove/disable `editorialPath` on published blocks before restoring an older frontend (older frontends ignore the field). No data migration.
- Owner next action: in Studio add a Location Map block with two or more locations, tick "Highlighted editorial path", draw a path, save, and preview; also open the fixture section 6.

## 27. 2026-11-02 Editorial path accepted; automatic routing hidden; wording review

At this checkpoint, the changes were uncommitted on `feature/openstreetmap-mapping`; they were later included in the map and preview work merged through PRs #107 and #108. Deployment and Sanity publication remain separate facts.

- Approved route solution: the manual highlighted editorial path (section 26). Owner-verified manually: Studio path drawing, and creating and displaying a highlighted path between locations. Studio save/reopen was later verified by the owner (section 27a). No test content was created or published.
- Automatic driving-route calculation stays unapproved. The FOSSGIS permission question (storing and publicly displaying returned geometry) is unresolved. `ROUTING_CALCULATION_ENABLED = false` in `src/lib/maps/location.ts` now also hides the whole "Optional Driving Route" field in Studio (`hidden` on the `route` field in `sanity/schemaTypes/mapLocation.ts`): no checkbox, stop picker, button or warnings. There is no Studio setting to enable it. Schema, stored data (never altered), validation, public rendering of existing saved route data, tests and the fixture (section 5) are kept. Enabling needs a code change plus a confirmed provider permission. Studio makes no FOSSGIS request while false; public pages never do.
- Supported and unchanged: multiple locations, seven icons, direct labels (`showLabel`), approximate circles (no centre marker/link/label), legacy single locations, tile referrer policy.
- Defect found and fixed: the production sitemap listed `/dev/location-map-test/` (the page itself returns 404 in production). `astro.config.mjs` sitemap filter now excludes `/dev`; test added; rebuilt sitemap has 0 matches.
- Wording review (public map strings in `src/i18n/ne.ts` and `nb.ts` only; Studio editor text is English-only by existing design and was not translated). Changed: ne load, loading, failed, externalNotice, showOnMap, routeHeading, routeEstimate; nb load, loading, failed, externalNotice, routeHeading, routeEstimate. Keys, fallbacks and `en.ts` unchanged; no language section enabled.
- Checks: `test:maps` 45/45; `test:language-sections` 5; `test:event-labels` 9; `test:event-occurrences` 3; `astro check` 0 errors/0 warnings/16 hints; Studio `tsc --noEmit` clean; root build and Studio build pass; Prettier clean on map files; `git diff --check` clean. Fixture not in production output.
- Remaining manual checks: real keyboard/touch devices; native-speaker review of the changed Nepali/Norwegian strings; Privacy page review.
- Deployment: frontend first, then Studio. Rollback: disable/remove `editorialPath` and multi-location blocks on published content before restoring older frontend code; no migration.

### 27a. Owner-verified Studio save/reopen (2026-11-02)

Manually verified by the owner after leaving and reopening the document: multiple locations and their order; coordinates, icons and label settings; approximate-area settings; the manual editorial path, its points, colour, style and editorial fields; the saved path remained editable; moving a location displayed the path-review warning. Still unverified: real keyboard/touch devices, native-speaker wording review, Privacy page review.

## 28. 2026-11-03 Secure Sanity draft preview (historical implementation checkpoint)

At this checkpoint, the implementation was on `feature/sanity-draft-preview` and had not yet been deployed. It was subsequently merged into `main` through PR #108; hosted environment and deployment status remain unverified.

- Sanity Presentation Tool + cookie-gated on-demand preview routes. Public content remains published-only; rendering mode is separate from draft access. The News hub now uses request rendering, and `/preview/**` and `/api/preview/**` are on-demand routes.
- News and Guide markup moved (git mv) into shared `src/components/articles/NewsArticleView.astro` and `GuideView.astro`; public and preview pages both render them. Shared GROQ projections in `src/lib/sanity/queries.ts`; public filters unchanged (regression-tested).
- Tests: `npm run test:preview` (25 pass). Every `test:*` script passes. `test:display-headline-typography` previously asserted `src/pages/dev` was absent; that was outdated after #107 added the guarded dev map fixture, so it now asserts the fixture is `prerender = false` with a production 404 guard, `/dev` stays in the sitemap exclusion, and no `dist/client/dev` output exists. `astro check` 0 errors, root build, Studio `tsc` and Studio build pass. Built with fake secrets: neither names nor values appear in client assets or the server bundle; public HTML has no Visual Editing code; sitemap has no `/preview` or `/dev` entries. (`astro check` scans `sanity/dist`; delete that ignored folder before running it.)
- Lockfile: `@sanity/preview-url-secret` 4.1.5 requires `@sanity/client ^7.26.2`; root range `^7.25.0` allows it, so npm deduped everything to 7.28.0 (retained, no manual edit). `sanity/package-lock.json` is unchanged (Studio still 7.25.0). `get-it` and `nanoid` moved as transitive patch updates.
- At this checkpoint, Vercel environment, Studio domain and hosted CORS owner actions remained pending (see DEVELOPER_HANDOVER "Draft preview"). Local Presentation authentication and the News workflow below were verified by the owner.

## 29. Owner-verified preview and editorial map presentation

This section records the settings and checks at that checkpoint. The new-block loading default was later changed to click-to-load; automatic near-viewport loading remains available only when selected.

- The owner verified secure local Presentation authentication, a completely unpublished News article, live draft updates without publication, field overlays, and a Location Map with multiple exact locations, different icons, a manual highlighted editorial path, OSM tiles and attribution. This does not imply Guide, scheduled-News or hosted-origin acceptance.
- At this checkpoint, new `locationMap` blocks defaulted to `loadingBehavior: 'automatic'`, `showViewOnMapActions: false` and `showOpenStreetMapLinks: false`. Missing settings on existing blocks preserved click-to-load and prior actions. Event and Directory retained their defaults. The default later changed to click-to-load, with automatic loading available only when selected.
- Automatic maps load independently with IntersectionObserver 300px before the viewport; click-to-load stays available, including as fallback without IntersectionObserver. The external-service notice and textual list remain visible, and the server makes no tile requests. Reader-triggered mode can load and focus an exact marker from a visible location action.
- Approximate maps retain existing circles without centre markers or precise links. The owner chose to preserve these circles: their coordinates are still sent to the browser and their centre is inferable, so they must not contain confidential locations.
- Checks: `test:preview` 29/29 and `test:maps` 52/52; language sections, Guide search, connected content, content relationships, headline typography, article summary, information boxes, expandable sections, read-also, Event labels and Event occurrences all passed. Astro check: 0 errors, 0 warnings, 22 hints; root build, Studio-local TypeScript check, Studio build and `git diff --check` passed. The dev fixture's server-rendered HTML was checked for two automatic maps without actions, a click map with both actions, no approximate-area link and no tile images.
- Remaining manual browser checks: separate automatic maps and distant-map network activity, both settings independently, click-to-load and focus, marker popups, approximate areas, keyboard/mobile, no-JavaScript text, and blocked-tile recovery; preview acceptance for Guides, scheduled News, unpublished changes to published documents, and hosted Studio origins.

## 30. Location list presentation

- At this checkpoint, the owner verified automatic near-viewport loading. New News/Guide Location Map blocks defaulted `showLocationList` to false; missing values retained the existing visible list. Existing legacy single-location, Event and Directory presentation was unchanged.
- The list remains visible until tiles load, and is restored after map failure. When collapsed after successful loading, its text stays in the accessibility tree, while any enabled location actions remain visible. With JavaScript disabled the server-rendered list remains visible.
- Checks passed: 53 map tests, 29 preview tests, 106 relevant language/content/Event tests, Astro check (0 errors, 0 warnings, 22 hints), root build, Studio-local TypeScript, Studio build and `git diff --check`. The local fixture's server-rendered fallback markup was inspected; browser interaction is still pending.
- Remaining browser acceptance: confirm hidden and visible settings, screen-reader list text, enabled actions, keyboard marker popups, approximate-area safeguards, no-JavaScript fallback and blocked-tile recovery on desktop and mobile.

## 31. Map-level OpenStreetMap control

- At this checkpoint, the owner verified automatic loading and the optional visible location list. The then-uncommitted `showOpenStreetMapControl` defaulted to false for new News/Guide blocks as well as absent values on existing blocks. Per-location OpenStreetMap links remained independently controlled and hidden by default for new blocks.
- After successful tile loading, a separate link bar above the map opens OpenStreetMap in a new tab. One exact location without a path uses that location; multiple locations, a path or an approximate area use the current displayed centre and zoom, updated on movement. URLs contain no editor text or precise-marker query. The link is hidden on failure or for an invalid target; existing textual fallbacks remain.
- The local-only map fixture includes exact, multiple, path and approximate examples with the control enabled. Remaining browser checks: verify targets after pan/zoom, no marker on approximate links, link separation from map interactions, keyboard/mobile use, blocked-tile recovery and absent controls on legacy maps.

## 32. Embedded fullscreen map

- On the owner's correction, new News/Guide blocks default `showFullscreenControl` to true, while missing values remain false. The OpenStreetMap link remains optional and separately disabled by default.
- After successful normal loading, fullscreen opens the same Leaflet stage in a viewport-sized modal dialog; no extra map or routing request is created. Centre, zoom and layers remain intact, attribution stays on the map, Escape or the exit button closes it, focus and page scrolling are restored, and viewport changes invalidate map size. The enlarged visible map can request additional tiles. In Presentation, fullscreen fills the preview iframe, not the surrounding Studio.
- The dev-only editorial-path fixture combines multiple exact markers and direct labels with an approximate area and a highlighted path. Manual browser acceptance is still required for standalone and Presentation views, keyboard/focus, touch and orientation, scrolling, attribution, failure recovery and independent maps.
- Checks passed: 58 map tests, 29 preview tests, 103 related language/content tests, Astro check (0 errors, 0 warnings, 22 hints), root build, Studio-local TypeScript, Studio build and `git diff --check`. Fullscreen lifecycle tests use simulated DOM/map objects; they do not replace browser or device acceptance.

## 33. Fullscreen hierarchy correction

- The owner reported `HierarchyRequestError`: the dialog was nested inside the stage that was being appended to it. The dialog is now a sibling of the stage, and a placeholder restores the original position on exit or failed opening. Lifecycle tests enforce DOM ancestry and rollback. Browser retesting remains pending.

## 34. Final owner-performed browser verification

- The owner verified secure Presentation preview of a completely unpublished News article, live draft edits without publishing, Visual Editing overlays, and Location Map rendering. Automatic near-viewport loading, multiple markers and controlled icons, a manual editorial path and the optional hidden list also worked.
- Fullscreen displayed the same markers, labels, path and attribution; Escape closed it and restored the map to the article. This does not establish Guide or hosted-origin acceptance, mobile/orientation behaviour, focus restoration or blocked-tile recovery.
- Temporary development-only authentication diagnostic logging was removed; preview validation and generic production responses remain.
- All 25 repository test scripts passed. Astro check reported 0 errors, 0 warnings and 22 hints; root build, Studio-local TypeScript, Studio build and `git diff --check` passed. Studio build still reports its `appId` and local/runtime version warnings.
- A production Studio bundle initially contained the local forwarded origin because it was passed to the resolver unconditionally; the development-only branch now permits build-time elimination, and the rebuilt Studio bundle and public assets have no forwarded hostname. Browser assets and public HTML also contained none of the preview secret variable names or cookie name. The temporary Viewer token was not in the process environment, so its value could not be compared.
- Public queries retain published-only filters and the shared client uses the published perspective; unconfigured preview fails closed, `/preview` and `/dev` are excluded from the sitemap, and automatic FOSSGIS routing remains disabled.

## 35. 2026-11-15 Guidance Hub and Topic Hub editorial redesign (merged in PR #128 & #129)

At this checkpoint (`feat/redesign-guidance-hub`, subsequently merged into `main` via PR #128 and polished in PR #129), `/[lang]/info/` and `/[lang]/info/topic/[slug]/` were redesigned to match the Nordic editorial system of the News Hub while resolving two key UX gaps: surfacing recently published/updated Guides by default on the Guidance Hub and replacing uniform Topic Hub card grids.

- Added pure composition and safe date helpers in `src/lib/guidanceHub.ts` (`composeGuidanceHub`, `composeTopicGuides`, `sortGuidesByRecency`, `formatGuideDate`, handling both ISO timestamps and `YYYY-MM-DD` review dates in `Europe/Oslo`).
- Added scoped editorial hub components in `src/components/guidance/`: `GuidanceMasthead.astro` (quick-jump nav bar and totals, refined in PR #129), `GuidanceRecentPackage.astro` (urgent strip, `var(--surface-warm)` lead spotlight, and up to 5 newest guides sorted purely chronologically regardless of `isFeatured`), and `GuidanceTopicShowcase.astro` (up to 6 non-empty priority topic preview blocks + `var(--surface-muted)` 2-column directory band preserving `orderGuidanceHubTopics`, `GuidanceTopicIcon`, empty-topic handling, and `other` last).
- Preserved Guidance-only substring search on `/[lang]/info/` (`#guide-search-input`, `buildGuideSearchText`, `matchesGuideSearch`), hiding `[data-recent-section]` and `[data-topics-section]` while a query is active, plus the neutral `.trust-notice` disclaimer and single `<main>` landmark via `BaseLayout`.
- Redesigned `/[lang]/info/topic/[slug]/` with matching `border-top: 3px solid var(--civic-deep)` masthead, breadcrumbs, `GuidanceTopicIcon`, urgent notice strip, curated spotlight composition, 3-column hairline directory grid (removing `min-height: 22rem` cards), preserved localized empty states, and hub return navigation.
- Preserved universal front-door positioning for all Nepali-speaking residents in Norway (no EU-only or arrival-route front-door segregation).
- Added unit tests (`tests/content/guidanceHub.test.mjs`), updated presentation contract tests (`tests/content/guidanceHubPresentation.test.mjs`), added `"test:guidance-hub"` to `package.json`, and documented the design in `docs/guidance-hub.md` alongside `DEVELOPER_HANDOVER.md`. (Wiring `npm run test:guidance-hub` into `.github/workflows/validate-pull-request.yml` requires an owner/workflow-scoped GitHub token.)

## 36. 2026-11-19 Public MapLibre GL / OpenFreeMap NRK-editorial & city map upgrade (PR #130 & #131)

- **PR #130 (`638edc6`):** Simplified Studio map authoring (`sanity/schemaTypes/mapLocation.ts`, `MapLocationInput.tsx`, `MapPlacesInput.tsx`), bundled SVG markers inside Studio editors, moved the public fullscreen square icon into map controls, placed the `nepali.no` brand badge inside the map stage, and hardened mobile touch panning/spacing.
- **PR #131 (`4e478b2`):** Replaced public Leaflet raster tiles in `LocationMap.astro` with `maplibre-gl` vector tiles served from OpenFreeMap (`https://tiles.openfreemap.org`, centralized as `MAP_VECTOR_PROVIDER` in `src/lib/maps/mapStyle.ts` / `location.ts`).
- Added two editor-selectable visual styles via `mapStyle` (`'editorial'` | `'city'`) and `showNorwayLocator` (`boolean`) in `locationMap` and `mapPresentation` (`sanity/schemaTypes/mapLocation.ts`, projected via `mapPresentation {..., editorialPath {...}}`):
  - **Calm editorial (`editorial`)** — default for News & Guides (`LocationMapNe.astro`, `LocationMapNb.astro`): customized NRK-inspired Positron style (`#94c0eb` water, `#f6f5f0` land, `#dce8d5` parks, hidden buildings/shields), solid blue pins with dark-navy `#172534` pill labels (`createMapLibreMarkerElement`), inline floating label on editorial paths (`editorialPathMidpoint`), optional top-left SVG Norway locator inset (`src/lib/maps/norwayLocator.ts`), borderless inline frame, and single fullscreen toggle inline.
  - **City streets & transit (`city`)** — default for Events & Directory (`events/[slug].astro`, `directory/[slug].astro`): harmonized Liberty vector style retaining legible streets, buildings, and `poi_transit` stations with inline `+`/`−` zoom controls.
- Updated `src/pages/[lang]/privacy.astro`, `src/i18n/{en,nb,ne}.ts`, and `tests/privacy/mapsTravelPrivacy.test.mjs` to disclose `tiles.openfreemap.org` / OpenFreeMap (OpenStreetMap-based); live Sanity `trustPage` (`privacy`) documents still require matching manual update from `tile.openstreetmap.org`.
- Verification at merge: `test:maps` (70/70), `test:privacy` (6/6), `test:entur` (111/111), `test:entur-ui` (25/25), `test:seo-redirects` (7/7), `npx astro check` (0 errors, 0 warnings), Sanity `tsc --noEmit`, production build, and GitHub Actions + Vercel previews passed.

## 37. 2026-11-19 Interactive editorial charts (PR #132)

- **PR #132 (`87c2438`):** Upgraded `EditorialChart.astro` from static SVG figures to progressively enhanced interactive charts while preserving the Sanity `editorialChart` schema, localization (`ne-NP` Devanagari digits / `nb-NO`), accessibility patterns, HTML data tables, and print rules.
- Added metadata anchors (`categoryIndex`, bar `originX`/`originY`, polar `centerX`/`centerY`/`tipX`/`tipY`, plot bounds, `categoryXPositions`) in `src/lib/editorialChart/types.ts` and `geometry.ts`, plus `src/lib/editorialChart/interactive.ts` and `client.ts`:
  - Boundary-clamped dark-navy (`#172534`) tooltip card + vertical hairline crosshair supporting mouse hover/plot snapping, tap/click, and keyboard arrows (`Escape` dismiss). Stacked bars/areas show total rows; donut charts lock slices and display active `%` + label in the center hole.
  - Interactive legend filter/spotlight buttons with a localized reset control and safeguard against hiding every series.
  - `IntersectionObserver` scroll-reveal bar growth and Web Animations API line drawing respecting `prefers-reduced-motion: reduce`.
  - Segmented `Chart | Table` switcher pill, formula-safe UTF-8 BOM CSV export, and a subtle `nepali.no` footer badge.
- Verification at merge: `tests/editorialChart/editorialChart.test.mjs` (44/44 including `jsdom` interaction & CSV tests), `npx astro check` (0 errors, 0 warnings), production build, `test:seo-redirects` (7/7), and GitHub Actions + Vercel previews passed.
