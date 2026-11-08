# nepali.no Developer Handover

**Status date:** 14 October 2026
**Repository:** `pank-hub/nepaliNO`
**Owner and final decision-maker:** Pankaj Kafley
**Protected production checkpoint:** PR #77, Norwegian site News only

## Purpose

This document is the durable repository handover for a future developer, operator, consultant, or AI-assisted workflow. It contains recovery context, non-negotiable boundaries, current operational facts, and the safest next steps.

`PROJECT_PROGRESS.md` is the shorter current dashboard. Update this handover only when architecture, operations, security boundaries, or recovery procedures materially change. Keep historical detail in the archive and dedicated architecture documents.

## Current repository state

- Protected production branch: `main`
- Current delivery model: feature branch -> pull request -> required checks -> Squash merge -> Vercel deployment
- Required validation: Astro check and production build
- Public application deployment: Vercel project `nepali-no`
- Studio deployment: Vercel project `nepali-no-studio`
- Canonical daily public editorial Studio: `https://nepali-no-studio.vercel.app/content/`
- Current local branch may differ from `main`; always run `git status --short --branch` and `git log -3 --oneline` before work.
- Never commit directly to `main` or rewrite shared history.

## Platform summary

- Public application: Astro and TypeScript
- Production site: `https://nepali.no`
- Editorial CMS: Sanity Content Lake and Sanity Studio
- Editorial Studio: `https://nepali-no-studio.vercel.app`
- Public editorial dataset: `production`
- Private submission dataset: `submissions`
- Forum: Discourse at `https://forum.nepali.no`, hosted on Gigahost
- Forum pilot alias: `https://forum-poc.nepali.no`
- Transactional email: Resend from `notifications.nepali.no`
- Public languages: Nepali (`ne`) and Norwegian Bokmal (`nb`)
- English is limited to selected submission and administrative services.
- The Norwegian site currently publishes News only. Guides, Events, Directory, and the Forum are disabled for `nb` through `src/config/languageSections.ts` (see "Per-language section availability").

### Sanity Studio URLs and deployment cleanup

- Use `https://nepali-no-studio.vercel.app/content/` as the canonical Studio for daily public editorial work.
- `https://nepali-no-studio.sanity.studio/` is a legacy/fallback Sanity-hosted deployment and may have an outdated schema. Do not use it for routine editorial work.
- `https://nepali-no.sanity.studio/` is another Sanity-hosted deployment; its purpose and current schema status still need verification.
- A future cleanup should leave one clearly identifiable daily Studio and either remove obsolete Sanity-hosted deployments or retain only one fallback that has been updated to the current schema and clearly labelled as a fallback.
- Before removing any hosted Studio, verify the exact deployment being removed. Removing a Studio deployment must not include deleting or modifying the `production` dataset or its content.

## Operational features

### Entur travel assistance (interface implemented; release-disabled)

- The backend foundation and shared Event/Directory interface are implemented. Automated Entur tests pass, and the mocked fixture's origin-selection and journey-results flow has been manually verified. No Production Entur journey has been tested (live Preview searches are recorded below); keyboard, mobile, screen-reader and DST acceptance checks remain.
- `travelHelpEnabled` on Community Events and Directory listings is editor-controlled opt-in: both new and existing documents are ineligible unless it is explicitly `true`. Studio validates physical presence and an exact pin without a radius; editors must verify that the location is safe to expose.
- The shared collapsed interface supports eligible Events and Directory listings; News remains unsupported. Static page eligibility is checked against the shared rules and runtime availability rechecks published Sanity content. Search sends an origin and a document selector, never destination coordinates; the journey route independently resolves and authorizes the destination again. Content edits need the normal page rebuild for newly eligible controls.
- The availability, origins and journeys routes fail closed unless server-only `ENTUR_TRAVEL_API_ENABLED` is exactly `true`; production activation has not occurred and Production remains disabled. The client renders no form until a successful runtime availability response. Keep production disabled until the privacy disclosure (localized), Entur attribution and provider-terms review, and remaining browser acceptance testing are complete.
- Distributed rate limiting (`src/lib/rateLimit/server/`) uses an Upstash Redis Pay as You Go database in Frankfurt (eu-central-1) with a $20 database budget ceiling. Sliding-window limits: origins 20/60 s, journeys 10/60 s, availability 30/60 s. The identifier is a pseudonymous HMAC of the client address and category; no raw IP address, query or journey data is stored. Missing configuration, an invalid client address, or a provider error or 2 s timeout returns 503 (fail closed). The Vercel Hobby rate-limit rule for Event and Directory submissions is separate and must stay unchanged. Do not substitute an in-memory limiter.
- Live Vercel Preview verification passed: real Entur origin and journey searches succeeded; 20 origin requests returned 200, the 21st returned 429 `rate_limited` with `Retry-After: 41`, and one recovery request after it elapsed returned 200. Sliding windows are epoch-aligned, so a burst crossing a minute boundary can pass 21 requests; start any future live burst test 5-25 s into a minute. The temporary Preview-only acceptance page and destination override were removed before merge.
- Local mock fixture: start development with `ENTUR_TRAVEL_API_ENABLED=true` and open `/dev/travel-help-test/`; its search responses never reach Entur. To roll back, remove or set the server flag to anything other than `true` and redeploy/restart the server; verify all three routes return generic no-store 404s and refresh pages to remove already-open controls.
- The initial English, Norwegian and Nepali interface wording is present; editorial translation polishing and any News integration remain future work.

### News

Bilingual archives, article pages, homepage presentation, publication scheduling, featured stories, social metadata, and Portable Text rendering are operational. News can store controlled relationships to Public Information Guides and Forum topics. Editors can also curate up to three same-language Related News links on an article; these render on its public article page.

The Sanity News Article editor now uses a writing-first default group, with separate Classification, Publishing, Sources and Trust, Forum, and Workflow groups. Its Portable Text editor explicitly supports approved headings, quotation, bullet and numbered lists, strong text, emphasis, links, and images. The Studio Editorial workspace includes task-oriented News views for drafts, scheduled stories, featured stories, Important Now, language queues, and missing translations. Custom document lists have stable IDs because Sanity requires IDs for custom structure lists.

The News archive uses a magazine-style curated landing page and a paginated older-news archive. Preserve this distinction when changing News presentation.

News article detail pages in both active languages emit one JSON-LD graph containing `NewsArticle` and `BreadcrumbList`. The article markup uses the canonical URL, visible title and summary, publication date, localized language/category, and featured image URL already used by `og:image` when available. Articles without a featured image omit `image`; `dateModified` is not emitted because there is no reliable editorial modification date.

Author markup follows the optional Sanity `authorType` (`person` or `organization`). For legacy articles without it, only the exact author name `nepali.no Editorial` maps to `Organization`; other non-empty names map to `Person`; absent or empty names omit author. The publisher references `https://nepali.no/#organization` without redefining the entity. Breadcrumb markup uses localized Home and News labels and includes the current article as the final item; the visible breadcrumb itself shows Home and News, with the article title as the page heading. This markup is limited to News article detail pages; archives and other content types do not receive it. See `PROJECT_PROGRESS.md` section 21 for implementation and test details.

Nepali typography was recently adjusted to reduce heavy Devanagari weights in headings and rich-text bold content. Avoid reintroducing very heavy weights for large Nepali display text without visual review.

### Public Information

Bilingual Topic Hubs and Guides, official sources, review dates, audience metadata, reusable Norwegian terms, search metadata, editorial classifications, and Portable Text rendering are operational. Related Guides are selected in Sanity and rendered in the Guide sidebar (same language, active, with a slug).

The `/[lang]/info/` archive has a minimal client-side Guide search over title, summary, responsible agency, and Search Keywords and Synonyms. `ACTIVE_PUBLIC_INFORMATION_GUIDES_QUERY` is the only query that selects `searchKeywords`, and a test enforces that. Keywords are never rendered as visible text; they exist in the page source only inside each list item's `data-search-text` attribute. Matching logic lives in `src/lib/guideSearch.ts`. Guide body text and reusable Norwegian terms are not indexed. Public Information is currently available in Nepali only (see below).

Reusable Norwegian terms expose the Norwegian term and optional Nepali pronunciation separately. The pronunciation is rendered in italic muted text; legacy inline terms remain supported.

### Per-language section availability

`src/config/languageSections.ts` is the single switch for which sections each language publishes. Today `nb` has News only and `ne` has everything.

- `isSectionEnabled(language, section)` controls the header and footer links, homepage pathways and sections, the News archive guide block, the Forum card and supporting Guide on News articles, Contact page items, and the Events and Directory submission language links.
- Every Guide, Topic Hub, Events, and Directory route builds paths only for languages where the section is enabled (`getLanguagesWithSection` or `isSectionEnabled` inside `getStaticPaths`).
- `src/pages/nb/{info,events,directory}/[...slug].astro` are server-rendered 302 redirects to `/nb/` for old links. Delete the matching file when re-enabling a section.
- `resolveAlternatePath` sends the language switcher to the language home when the other language's section is disabled.
- To re-enable a Norwegian section: set its flag to `true`, delete its redirect page, confirm Norwegian content exists, and rerun `npm run test:language-sections` (update the test expectations deliberately).
- Not covered by the switch: Norwegian About, Privacy, and Transparency text, Norwegian homepage hero text, Sanity-managed Contact copy, and Forum automation for `nb` content. Review these before the Norwegian site is promoted.

### Permanent redirects and Topic slugs

- `/` redirects permanently (308) to `/ne/` through `redirects` in `astro.config.mjs`, which the Vercel adapter emits as a real HTTP route ahead of the filesystem. Keep it out of the shared `vercel.json`, which the separate Studio project also reads. There is no `src/pages/index.astro`.
- `vercel.json` keeps two permanent (308) redirects from the old malformed Topic URLs (a Topic title or trailing space had been appended to the slug) to `/ne/info/topic/norwegian-language-and-integration/` and `/ne/info/topic/digital-sewa-ra-online-suraksha/`. Do not remove them; they are narrowly scoped and never match the clean URLs.
- Topic slugs must use lowercase Latin letters, digits and single hyphens. The Topic slug field in Studio enforces this (`sanity/schemaTypes/slugValidation.ts`); it only reports errors and never rewrites a value.
- Topic pages are prerendered and the Sanity webhook does not cover Topic documents, so a changed Topic slug needs a website rebuild (merge or manual redeploy) before the new URL exists. Add a redirect from the old URL in the same deployment.
- Tests: `npm run test:topic-slug`; `npm run test:seo-redirects` (run after `npm run build` to include the generated-route check).

### Events and Community Directory

Bilingual public archives and detail pages are operational. Event and Directory suggestions are private, reviewed, and never published automatically. Submission validation, notifications, private contact separation, and Vercel WAF rate limiting are operational.

Event pages publish an organizer's email or phone only when the Event's `organizerContactPermission` is ticked; every Event query projects them conditionally, so never select `organizerEmail` or `organizerPhone` directly. Ticket and registration wording comes from `src/lib/eventAccess.ts`; free ticketed events must never say "buy". `isFeatured` only controls homepage placement and must not be shown as a label. The site intentionally loads no third-party marketing or tracking scripts.

### Trust pages and footer

About, Transparency, Privacy, and Contact are published in Nepali and Norwegian: eight Sanity `trustPage` documents in total. Existing localized URLs, footer links, language switching, responsive presentation, and safe local fallback content are preserved.

The four localized Trust Page routes use Astro on-demand rendering and query Sanity at request time. Publishing an editorial change therefore does not require a Git commit, pull request, or redeployment. Sanity remains configured with `useCdn: false`; production responses are revalidated by Vercel.

Contact pages use Contact Items, Safety Heading, and Safety Text. The other trust pages use Content Sections. Wording and the privacy notice still need editorial and legal-quality review.

### Translation Editor

Phase 1 is Pankaj-only with GitHub login, signed sessions, deterministic TypeScript updates, generated branches, and protected pull requests. The production-domain GitHub OAuth callback still needs correction and end-to-end verification. Keep the working `nepali-no.vercel.app` route available until that is complete.

## Editorial charts

One shared Sanity object, `editorialChart`, is used in News and Public Information Guides. It is rendered as static server-generated SVG and HTML. Editor guidance is in `docs/editorial-charts.md`. Implementation is complete; production deployment follows the rollout order below.

### Architecture

- Shared Sanity object: `sanity/schemaTypes/editorialChart.ts`, registered in `sanity/schemaTypes/index.ts`.
- News: `sanity/schemaTypes/newsArticle.ts` and `src/pages/[lang]/news/[slug].astro`.
- Guides: `sanity/schemaTypes/publicInformationGuide.ts` and `src/pages/[lang]/info/[slug].astro`.
- Shared renderer: `src/components/content/EditorialChart.astro`; shared data table: `src/components/content/EditorialChartTable.astro`.
- Language wrappers: `EditorialChartNe.astro` and `EditorialChartNb.astro` (thin; they forward the node and index).
- Shared logic in `src/lib/editorialChart/`: `types.ts`, `normalize.ts`, `format.ts`, `geometry.ts`, `palette.ts`.
- Tests: `tests/editorialChart/editorialChart.test.mjs`.

### Data model

- All chart types share `categories` and `series`; each series' `values` align with category positions. Order follows editorial category and series order.
- Pie and donut require exactly one series. Their percentages are calculated automatically; manually entered percentages are not stored.
- True zero values stay in the data table but draw no bar or slice, so they never look like small positive values.
- Malformed values are never silently converted to zero.

### Rendering and accessibility

- Static server-generated SVG and HTML. No runtime charting dependency and no client hydration.
- Every visual is accompanied by a complete HTML data table. Information never depends on colour alone: series also use patterns, dashes or numbering, tied to series position rather than the chosen colour.
- Print shows the full data table even when the on-screen disclosure is closed (`::details-content` where supported, otherwise a print-only copy), scoped to chart disclosures.
- Malformed or unknown chart types fall back to readable text and table data without breaking the article or Guide page. If geometry generation throws, the SVG is omitted, the table remains, and the error is logged with `console.error` (chart title and message only; no routine noise because it happens only for invalid data). Data warnings use `console.warn`. A visible diagnostic is shown only in development.

### Responsive behaviour

- Cartesian charts are rendered in a compact and a wide layout; a CSS container query chooses one. Thresholds live in `CHART_LAYOUTS` in `geometry.ts`.
- Ordinary five-category charts fit narrow screens. Horizontal bars keep labels and bars visible on mobile and grow taller instead of wider.
- Genuinely large datasets use a contained, focusable horizontal scroll region. Never introduce page-level horizontal overflow.
- Very long graphical labels may be shortened with an ellipsis; the complete labels remain in the data table.

### Formatting

- Nepali content uses `ne-NP`; Norwegian content uses `nb-NO`. Units, prefixes, suffixes and decimal precision (0 to 3) are supported.
- A percent unit combined with a `%` value suffix is rejected in Studio and normalized by the renderer, so output cannot read "12% prosent".
- Enter large Norwegian monetary values in an editorially understandable unit such as "अर्ब क्रोनर" or "milliarder kroner" rather than relying on raw full-value formatting.

### Extending chart support

Add a new chart type through: (1) the shared chart-type definition, (2) Sanity chart-type options and validation, (3) normalization compatibility, (4) geometry generation, (5) the shared Astro renderer, (6) the accessibility fallback, (7) focused tests, (8) editor documentation. Do not create a separate Portable Text object per chart type unless a requirement cannot fit the shared model.

### Rollout and rollback

- Deploy the public frontend before editors can publish chart blocks. Then verify existing News and Guide pages, deploy the canonical Studio, create one controlled draft chart, preview it on mobile and desktop, and publish only after production rendering is verified.
- Canonical Studio: `https://nepali-no-studio.vercel.app/content/`. Legacy Sanity-hosted Studio deployments may have outdated schemas and are not the daily editorial Studio.
- Never restore a pre-chart frontend while published `editorialChart` blocks remain in Sanity.
- Rollback: (1) stop creating charts, (2) keep the chart-capable frontend while chart content exists, (3) remove or replace published chart blocks before restoring a pre-chart frontend.
- No destructive Sanity migration is required.

## Location maps

The OpenStreetMap milestone was merged in PR #107. The loading and action settings below are uncommitted on `feature/sanity-draft-preview` and have not been deployed.

### Architecture and editing

- Shared provider configuration, types, URL helpers and coordinate/radius/zoom validation: `src/lib/maps/location.ts`.
- Shared Sanity object/input: `sanity/schemaTypes/mapLocation.ts` and `sanity/components/MapLocationInput.tsx`. Coordinates use the Sanity `geopoint` type.
- Shared News/Guide Portable Text block: `locationMap` in `sanity/schemaTypes/mapLocation.ts`, registered in `sanity/schemaTypes/index.ts` and both article/Guide body arrays. The localized wrappers and renderer are `src/components/content/LocationMapNe.astro`, `LocationMapNb.astro` and `LocationMap.astro`.
- Optional Event and Directory coordinates are projected by their existing queries and rendered on detail pages only. Existing addresses, map URLs, submissions and private-address safeguards are preserved.

Editors can click the Studio map, drag the pin, or enter latitude/longitude. Exact mode uses a pin; approximate mode uses a configurable 50–100,000 m circle. Initial zoom is 1–19. No location is saved until a valid point is selected. Clearing removes the complete value. For approximate areas, the centre is still public coordinate data: select a safe approximate centre, never a confidential address. OSM search is a deliberate external link; use only public place information, then position the pin or enter coordinates. No existing content is parsed or backfilled.

The optional News/Guide map block accepts an optional title, caption and HTTP(S) source label/URL. Its accessible location description is required on every block so map information remains available without the visual map.

- New News/Guide blocks start with `loadingBehavior: 'automatic'`, `showViewOnMapActions: false`, `showOpenStreetMapLinks: false`, `showLocationList: false`, `showOpenStreetMapControl: false` and `showFullscreenControl: true`. Editors can independently configure the actions, list, map-level external link and fullscreen button. Missing values on existing blocks resolve to click-to-load, the previous visible list and actions, and neither new map-level control; Event and Directory maps retain their existing defaults.
- The optional map-level OpenStreetMap link appears in a separate bar above the map after tiles load, without covering controls or attribution. A single exact location without a path opens a map centred on that location; multiple locations, a path, or an approximate area use the currently displayed centre and zoom. URLs contain numeric map-view coordinates only, never editor text or a precise-marker query. They update after panning or zooming and disappear on failure or when no safe target exists.
- The fullscreen button appears after normal successful map loading. The stage and viewport-sized modal dialog are siblings inside the map wrapper; fullscreen moves the existing Leaflet stage into the dialog and leaves a temporary placeholder at its original position. Exiting or a failed open restores the stage and removes the placeholder. Layers, centre and zoom are preserved; Escape closes it, focus and background scrolling are restored, and Leaflet is resized on enter, exit and viewport changes. In Presentation the viewport is the preview iframe. Expanding the visible area can request more OSM tiles, but does not call a routing service or reveal additional stored coordinates.
- When `showLocationList` is false, location text is visually hidden only after tiles load successfully; it remains in the accessibility tree. Enabled location actions remain visible and keyboard accessible. Before loading, on tile or initialization failure, and without JavaScript, the textual list stays visible. Existing legacy single-location maps without the setting keep their existing presentation.
- Automatic maps observe each block separately with a 300px viewport margin. Where IntersectionObserver is unavailable, the reader can use the load button. A visible location action also loads its map before focusing the location; exact markers open a plain-text popup. The local-only fixture `/dev/location-map-test/` includes two independent automatic maps and a click-to-load map with actions.

### Public provider, privacy and limitations

- Leaflet is dynamically loaded after a reader activates a map, or automatically when an opted-in map approaches the viewport. Server rendering makes no tile requests. Automatic mode sends OSM requests without a separate click, so the existing external-service notice remains visible in both modes. Exact locations may link to OpenStreetMap; approximate locations do not have a centre marker or precise link. Both modes retain textual information and visible OSM attribution.
- Approximate circles are not a confidentiality mechanism: their centre coordinates are sent to the browser and can be inferred from the circle. As confirmed by the owner, existing circles are preserved; never use a confidential address as the centre.
- The owner verified fullscreen in the draft preview with markers, labels, path and attribution, and Escape restoring the map to the article. Further checks remain for focus, scrolling, resize/orientation, tile failure and standalone use. The separately enabled external link opens OpenStreetMap in a new tab.
- The centralized tile endpoint is `https://tile.openstreetmap.org/{z}/{x}/{y}.png`. Respect normal browser caching and Referer. Do not bulk-download/prefetch tiles, add offline use, add an anonymous proxy, or silently fail over. The community tile service has no availability guarantee; map failure must not break content. Follow the [OSMF Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/).
- There is no embedded public Nominatim integration or visitor geocoding. The Studio search action opens `https://www.openstreetmap.org/search?query=...` in a new tab; it does not implement autocomplete or call Nominatim from nepali.no. This avoids the public Nominatim application's strict one-request-per-second aggregate limit and autocomplete prohibition without adding a shared backend. Editors must not search confidential addresses. See the [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/).
- The pre-activation notice states that the external service receives the visitor's IP address and a request for the map area. This is a transparency notice, not a complete legal/privacy review. Privacy-page wording is Sanity-owned; editors should review and update both localized Privacy documents before publishing map content.
- `src/i18n/ne.ts`, `nb.ts` and `en.ts` contain map control, status, precision and external-request strings. English remains a fallback only; disabled Norwegian sections remain disabled.
- Automated checks passed: `npm run test:maps` (7), `npm run test:language-sections` (5), `npm run test:event-labels` (9), `npm run test:event-occurrences` (3), `npx astro check` (0 errors, 0 warnings, 6 existing hints), `npm run build`, and `npm --prefix sanity run build`. The Studio build reports existing warnings for the unset Studio `appId` and local Sanity 6.6.0 versus hosted runtime 6.21.0. Formatting checks for new mapping files and `git diff --check` passed.
- Acceptance status on 2026-11-02: no browser or interactive Studio tooling was available. Save/reopen, network, rendering, keyboard/mobile, fallback, legacy-content, and localized Privacy-page checks were not performed. No Studio content was changed and no browser or production result is claimed.
- Manual acceptance checklist (use existing content slugs; do not publish test drafts):
  1. Local URLs: frontend `http://localhost:4321/`; Studio `http://localhost:3333/content/` (base path configured in `sanity/sanity.config.ts`). Inspect `/ne/events/<slug>/`, `/ne/directory/<slug>/`, `/ne/news/<slug>/`, `/ne/info/<slug>/`, `/ne/privacy/`, and `/nb/privacy/`.
  2. Studio: edit `Map Coordinates` on an Event/Directory record or add a `Location Map` block and set its `Map Location`. Save and reopen exact and approximate values; drag the pin; set latitude and longitude to `0`; clear the location. Accept radius 50–100000 m and zoom 1–19; reject out-of-range coordinates, radius 49/100001, and zoom outside 1–19.
  3. Browser network panel: verify no map-provider requests before activation; after activation verify tiles and visible OSM attribution. Check an exact marker and OSM link; an approximate circle with no precise marker or centre link; and two independently usable maps on one page.
  4. Keyboard/mobile: operate controls by keyboard and verify page scrolling is not trapped. Block/fail tile requests and confirm text remains with a useful failure message. Verify legacy Event/Directory records without coordinates and suppress maps for online Events and `online-only`/`no-public-location` listings.
  5. Read both localized Privacy documents in Sanity without editing or publishing. Confirm disclosure of the external OSM request, including visitor IP address and requested map tiles/area; have the privacy editor/legal reviewer determine whether additional wording is needed. Their actual text was inaccessible during this acceptance attempt, so wording sufficiency and required edits remain undetermined.
- Public-renderer test fixture (2026-11-02): public pages fetch with `perspective: "published"` (`astro.config.mjs`), so draft articles cannot be previewed. Local-only page `src/pages/dev/location-map-test.astro` renders the real `LocationMap.astro` with one exact and one approximate fixture map. It is `prerender = false` and returns 404 unless `import.meta.env.DEV`; a production build emits no static copy. Open `http://localhost:4321/dev/location-map-test/` after `npm run dev` (Codespaces: forward port 4321). Studio local map confirmed working by the owner after the explicit `referrerPolicy: strict-origin-when-cross-origin` tile fix; public-renderer browser checks remain pending.
### Multiple locations, icons and saved routes

- Block fields: `locations` (`mapPlace` array: `_key`, label, description, geopoint, precision, radius, icon), `initialZoom`, optional `route` (`mapRoute`), plus the legacy optional `location`. Pure logic (normalization, validation, bounds, stale detection, polyline decoding, OSRM parsing) is in `src/lib/maps/places.ts`; icons in `src/lib/maps/markerIcons.ts` (fixed internal SVG; icon values are an allowlist in `PLACE_ICONS`). Studio inputs: `MapPlacesInput.tsx`, `MapRouteInput.tsx`.
- Legacy compatibility: legacy `location` is normalized at render time to a single place keyed `legacy`; `locations` takes precedence. No migration. Do not remove the legacy field while old blocks exist.
- Rendering safety: popups and tooltips use `textContent`; approximate places never get a marker, tooltip or centre link; multi-place maps have no block-level external link.
- Routing: provider config is `ROUTING_PROVIDER` in `src/lib/maps/location.ts` (FOSSGIS OSRM, no key). It is called only from the Studio "Calculate route" action (1.1 s spacing, one request at a time, 10 stop cap). Public pages never call it. Route geometry is stored as a polyline6 string with distance, duration, provider, timestamp and a stops signature; coordinate/order/key changes mark it stale and Studio validation blocks publishing an enabled stale route. Terms: max 1 request/s, valid Referer/User-Agent, OSM attribution plus `https://www.openstreetmap.org/fixthemap`, no availability guarantee, revocable; storage and public display of geometry are not explicitly covered (unverified). Never substitute a straight line. If the service is withdrawn, disable routes; maps remain functional.
- Fixture: `/dev/location-map-test/` (DEV only, 404 in production) covers legacy exact, legacy approximate, 7 icons, mixed, and a saved route (`src/lib/maps/dev/fixtureRoute.json`).
- Verification: `npm run test:maps` 29/29, `astro check` 0 errors, root and Studio builds pass; an automated headless-Chrome run of the fixture passed (no pre-activation requests, Referer sent on all tiles, no routing calls, failure fallback). Not performed: Studio browser testing of the new inputs and route calculation, real keyboard/touch devices, Privacy review, translation editorial review (Ne/Nb strings are minimal).

- Release safeguard: Studio route calculation is OFF by default. Flag: `ROUTING_CALCULATION_ENABLED` in `src/lib/maps/location.ts` (`false`). When false, `MapRouteInput.tsx` sends no request to `routing.openstreetmap.de` and the button is disabled. Reason: permission to store and publicly display FOSSGIS route geometry is unverified (owner has not approved). Do not flip it, or publish blocks with an enabled route, until that is resolved. The route model, renderer and dev fixture are kept for evaluation. Provider changes need owner approval.

### Manual editorial path

- A manually drawn highlighted path (journey, corridor, evacuation or procession route) is stored in `locationMap.editorialPath` (`mapEditorialPath` in `sanity/schemaTypes/mapLocation.ts`), entirely separate from the automatic `route`. Fields: `enabled`, `label`, `description`, `color` (controlled names mapped by `PATH_COLORS` in `src/lib/maps/location.ts`), `style` (solid/dashed), `points` (standard `geopoint` array, 2-500), `updatedAt`, `locationsSignature`. Never call it a calculated driving route.
- Logic/validation: `validateEditorialPath`, `publicEditorialPath`, `placesSignature`, `editorialPathNeedsReview` in `src/lib/maps/places.ts`. Studio drawing: `sanity/components/MapPathInput.tsx` (plain Leaflet, no drawing dependency). Public drawing: `LocationMap.astro` (`data-path`). No routing request is made by either.
- Editors never get an automatic straight line. Changing location coordinates does not change the path; a warning asks for review. Exact places have `showLabel` (default on; absent = on for older content).
- Automatic FOSSGIS calculation remains disabled by `ROUTING_CALCULATION_ENABLED = false`. Tests: `tests/maps/editorialPath.test.mjs`. Fixture section 6 at `/dev/location-map-test/`. Studio drawing and save/reopen are owner-verified; keyboard/touch-device checks remain.
- Rollback: disable or remove `editorialPath` on published blocks before restoring older frontend code; no migration.

- Status (2026-11-02): the manual editorial path is the approved route solution (owner manually verified drawing and Studio save/reopen: locations, order, icons, label settings, approximate areas, path points/colour/style/fields persist and stay editable; moving a location shows the review warning). Automatic route editing is hidden in Studio while `ROUTING_CALCULATION_ENABLED` is false (`hidden` on the `route` field); stored route data is kept and still renders, calculation sends no request, and enabling requires a code change after the FOSSGIS storage/display permission question is resolved. The sitemap filter in `astro.config.mjs` excludes `/dev`. Public Ne/Nb map wording was reviewed once; Studio text is English-only.

### Deployment and rollback

Deploy the public Astro app before making the block available in the canonical Studio. Check existing News, Guide, Event and Directory pages, then create controlled draft examples for exact and approximate maps and test on mobile and desktop before publication. A frontend without the `locationMap` renderer must not be restored while any published map blocks remain; remove/replace those blocks first. Optional Event/Directory coordinates require no migration and older clients ignore them.

## Draft preview (Presentation Tool)

Status: implemented on `feature/sanity-draft-preview`; not deployed. The owner verified local secure Presentation authentication, a completely unpublished News preview, live draft updates without publication, field overlays, an automatically loaded map with multiple markers and icons, a manual highlighted path, the optional hidden list, and fullscreen with labels and attribution; Escape returned the map to the article.

### Architecture and files

- `sanity/presentation/previewConfig.ts` (`createPresentationTool`) is added only to the public-content workspace in `sanity/sanity.config.ts`, never to submission moderation. Origin `https://nepali.no`, `preview: '/preview/'`, enable/disable endpoints, News and Guide document resolvers and locations. `GUIDE_PREVIEW_LANGUAGES = ['ne']` mirrors `src/config/languageSections.ts`; keep them in sync.
- `src/pages/api/preview/enable.ts` / `disable.ts`: session endpoints. `src/pages/preview/**`: on-demand routes `/preview/[lang]/news/[slug]`, `/preview/[lang]/info/[slug]`, `/preview/news/id/[id]`, `/preview/info/id/[id]` and a cookie-gated `/preview/` landing page.
- The landing page and document views enable `@sanity/astro/visual-editing` only after a validated preview session. `@astrojs/react` supplies the React renderer required for its client-only island; the integration provides the default history adapter.
- Astro's Vite configuration pre-optimizes `lodash/isObject.js`, `lodash/groupBy.js` and `react/compiler-runtime`: Visual Editing and its `@sanity/mutate` dependency import these CommonJS subpaths from ESM. Restart Astro after changing this configuration.
- Studio selects its local preview origin only in a development-only conditional, allowing the production bundler to eliminate the local value. Do not pass the development origin unconditionally to the resolver: doing so embeds the local hostname in the production Studio bundle even if it is not used.
- `src/lib/preview/config.ts` (pure helpers, cookie signing, redirect sanitiser, headers), `loaderCore.ts` (injectable loader), `loader.ts` (server wrapper). Views: `src/components/articles/NewsArticleView.astro`, `GuideView.astro` (single renderer for public and preview).
- The `sanity:client` stays `perspective: 'published'`. The preview client is derived per request with the token, `perspective: 'drafts'`, `useCdn: false`, source maps and restricted stega.

### Environment variables (frontend Vercel project only, server-only, never `PUBLIC_*`)

- `SANITY_API_READ_TOKEN`: Sanity **Viewer** token. `PREVIEW_COOKIE_SECRET`: random string, 32+ characters (e.g. `openssl rand -base64 48`). Either missing means preview fails closed (404). Production reads them from `process.env` at request time; they are not inlined in the build.
- Rotation/revocation: create a new Viewer token in Sanity manage, update the Vercel variable, redeploy, delete the old token. Changing `PREVIEW_COOKIE_SECRET` invalidates all existing preview sessions immediately.

### Session behaviour

- Studio calls `/api/preview/enable?sanity-preview-secret=...&sanity-preview-pathname=...`. The secret is validated with `@sanity/preview-url-secret` (it does not consume the secret; Sanity issues short-lived secrets, so reuse/expiry cannot be tested offline). The redirect must be a relative `/preview/...` path; anything else is rejected.
- Cookie `nepali_preview`: signed (HMAC-SHA256, expiry and nonce), HttpOnly, Secure, Path=/, Max-Age 3600. SameSite=Lax when Studio is `studio.nepali.no` (same site as nepali.no). For the temporary `nepali-no-studio.vercel.app` Studio (cross-site) it is `SameSite=None; Secure; Partitioned`; Safari or third-party-cookie blocking may still prevent the iframe preview, in which case open the preview in a new tab or use the custom domain. Other Studio origins get 403 (localhost:3333 only in `astro dev`).
- `/api/preview/disable` clears both cookie variants and redirects to `/ne/`; it makes no draft query.
- All preview responses: `Cache-Control: private, no-store, max-age=0`, `X-Robots-Tag: noindex, nofollow`, `frame-ancestors` limited to approved Studio origins, `Vary: Cookie`, BaseLayout noindex, no analytics, no forum card or structured data. Missing cookie/config/document, disabled Norwegian Guides and revoked tokens all give a plain 404.
- `/preview/` is excluded from the sitemap (`src/config/sitemapFilter.mjs`) and disallowed in `public/robots.txt` (not access control; the cookie is).
- Scheduled News and unpublished changes are previewable. Canonical/og:url are emitted only when a real public page exists. Norwegian Guides stay unavailable.

### Owner actions (none performed yet)

1. Create the Viewer token; set both env vars in the frontend Vercel project (Production and Preview as needed).
2. Add custom domain `studio.nepali.no` to the Studio Vercel project and DNS; keep the vercel.app URL working.
3. Sanity CORS origins (exact, no wildcards): `https://studio.nepali.no`, `https://nepali-no-studio.vercel.app`, `https://nepali.no`; credentials only where required.
4. Deployment order: env vars and CORS, deploy frontend, then deploy Studio.
5. Rollback: delete/rotate the token or cookie secret (preview stops at once), then revert the PR. Public pages are unaffected.

### Local testing

Studio dev must point Presentation at the local Astro server, otherwise it uses `https://nepali.no` (which has no preview endpoints until deployed). Create the uncommitted `sanity/.env.local` with `SANITY_STUDIO_PREVIEW_ORIGIN=<local Astro origin>` (e.g. `http://localhost:4321`, or the private forwarded Codespaces URL for port 4321) and restart `sanity dev`. It is read only when `NODE_ENV` is `development`; Studio fails with a clear error if it is missing. Production builds always use `https://nepali.no`. Never put the Viewer token or cookie secret in `sanity/.env.local`. In GitHub Codespaces the browser opens Studio on its forwarded HTTPS URL for port 3333, not `localhost`. Add that exact origin (scheme + host only, no path/query/wildcard; do not make ports public) to the uncommitted root `.env` as `PREVIEW_DEV_STUDIO_ORIGIN=<Studio forwarded origin>` and restart `astro dev`. It is read only under `astro dev` (ignored in production builds), is validated as a strict http(s) origin, is added alongside `http://localhost:3333`, and an unapproved Studio origin gets a 403 whose body names the origin to approve. The same origin must also be in the dev Sanity CORS origins. Because the Codespaces Studio and frontend are on different forwarded hosts, the dev cookie is issued as `SameSite=None; Secure; Partitioned`.

The temporary authentication diagnostic logs have been removed. Do not log or share the request URL, secret, token, cookie, or authorization headers. Production failure responses remain generic.

Put a Viewer token and a 32+ char secret in a local `.env` (uncommitted), run `astro dev`, run Studio on `localhost:3333`, and open the Presentation tool. Remaining interactive checks: scheduled News, unpublished changes to published documents, Guide preview and disabled Norwegian Guides; iframe cookies on both hosted Studio origins; mobile/desktop; disable endpoint; CORS. The owner verified automatic near-viewport map loading. For the new list option, check that its hidden/visible states match Studio, screen readers can still read the hidden text, optional actions remain visible and usable, exact markers respond to keyboard, approximate circles have no precise link, and no-JavaScript and blocked-tile fallbacks show the text on desktop and mobile.

Final branch validation: all 25 root test scripts passed; Astro check, root build, Studio-local TypeScript, Studio build and `git diff --check` passed. Production browser assets and public HTML were scanned for preview secret variable names, the preview cookie name and forwarded-host patterns; the temporary Viewer token was not available in the process environment for a value comparison. The Studio build warns about the missing `appId` and local/runtime version mismatch. This remains uncommitted and undeployed.

## Information boxes

One shared Sanity object, `informationBox`, is available in both News articles and Public Information Guides. It is a single schema and frontend system, not separate News and Guide implementations.

### Architecture

- Schema and shared array member (`informationBoxBlockMember`): `sanity/schemaTypes/informationBox.ts`, registered in `sanity/schemaTypes/index.ts` and added to `body` in `newsArticle.ts` and `publicInformationGuide.ts`. The existing News and Guide `block` configurations are unchanged.
- Renderer: `src/components/content/InformationBox.astro`, with thin `InformationBoxNe.astro` and `InformationBoxNb.astro` wrappers because `astro-portabletext` passes no language to components. Both pages register it in `portableTextComponents`.
- Logic: `src/lib/informationBox/normalize.ts`. Tests: `tests/informationBox/informationBox.test.mjs` (`npm run test:information-box`).

### Data model and rules

- `variant` (required): `important`, `attention`, `tip` or `fact`. New boxes default to `important`.
- `title` (optional, max 80 characters) and `body` (required, at least one block).
- The body supports normal paragraphs, bullet and numbered lists, bold, italic and links (HTTP, HTTPS or relative).
- Headings, images, charts, nested information boxes and separate CTA/link fields are not supported inside the box.
- Variant labels come from the central i18n files (`informationBox.variants` in `ne.ts`, `nb.ts`, and the English fallback in `en.ts`). The Studio preview uses English administrative labels.
- Unknown or missing variants render with the neutral `fact` presentation.
- Empty or invalid boxes render nothing. Unsafe link protocols are removed at render time and the link text is kept.
- Existing News and Guide documents require no migration.

### Editor guidance: choosing a variant

- `important`: information readers should notice.
- `attention`: caution, deadline, risk or possible consequence.
- `tip`: practical advice or recommended next step.
- `fact`: neutral fact, definition or contextual information.

The optional title supplements the visible variant label; it does not replace it.

### Rollout

Deploy the public frontend before editors publish content containing `informationBox`, then deploy the canonical Studio. Do not restore a frontend without this support while published boxes exist.

## Non-negotiable security and data boundaries

- Sanity owns verified editorial content and deliberate references to Forum topics.
- Discourse owns topics, posts, users, moderation, topic state, and Forum activity.
- Event and Directory submissions remain private in the `submissions` dataset.
- Private submissions never publish automatically.
- Browser code must never receive Sanity write tokens or Discourse API credentials.
- Private contact details must never be copied automatically into public fields.
- Community contributions must never become verified journalism or official guidance automatically.
- Notification failure must never reverse a successful private submission write.
- Credentials must never be placed in Git, Markdown, screenshots, chat, browser JavaScript, public variables, or shell history.
- Forum failure must not break News or Guide pages.

## Forum state and integration

Discourse is the Phase 1 Forum platform and remains separate from Astro and Sanity. The pilot is login-required and invite-only. Norwegian Bokmal is the intended default interface language; English must remain easy to select; full Nepali localization is deferred.

Public News and Guide pages use one shared, client-loaded companion card when
an editor-authored relationship resolves to a public role-eligible topic.
`contentIntegrationEnabled` is on; `relatedTopicsEnabled` remains false. Do
not enable related topics without a separate reviewed frontend milestone.
Creating a Discourse category never makes it automatically eligible for a
homepage feed or content-linked panel.

The homepage Forum feed is enabled independently. It presents no more than six recent topics from the News Discussions and Questions about Guides categories, only after reverse-verifying the companion relationship against published same-language Sanity content. It exposes only topic title, reply count, activity time, role, and URL; unavailable, archived, ineligible, and duplicate topics are omitted. Companion cards expose less: title, open or closed state, link, and notice only.

The signed Sanity-to-Discourse companion-topic workflow is production-proven. Preserved evidence includes synthetic topic 13, Guide topic 17, News topic 18, Nepali News topic 27, and the original failed publishing incident. Never casually clear automation attempt IDs, timestamps, failure codes, topic relationships, or preserved fixtures. Inspect both Sanity and Discourse before retrying uncertain operations.

## Current next milestone

Evaluate whether a separate Form and Preview document view would improve editorial review without changing the current writing-first workflow, field names, or published content.

The writing-first editor and task-oriented News views were delivered through PR #68. The missing custom-list IDs that caused the hosted Studio structure-reader error were fixed through PR #69. Both the Vercel Studio and hosted Sanity Studio deployments were verified after the fix.

Keep Event and Directory form organization unchanged unless a separate audit identifies a specific problem.

## Deferred and launch work

- Correct and test the Translation Editor production OAuth callback.
- Complete a clean disposable Forum backup restoration test.
- Finalize Forum moderation, privacy, incident, monitoring, upgrade, and moderator-readiness procedures.
- Keep public Forum panels disabled until separately reviewed.
- Add the registered organization name and number after exact wording is approved.
- Complete the GDPR processing inventory, retention schedule, processor review, rights handling, and final privacy notice.
- Replace the default Astro favicon with approved nepali.no branding.
- Create a branded 1200 x 630 social-sharing fallback image.
- Create `EDITORIAL_USER_MANUAL.md` and `OPERATIONS_RUNBOOK.md`.

## Safe delivery workflow

1. Read `AGENTS.md` and the relevant architecture document before editing.
2. Inspect the current branch, worktree, open pull requests, and nearby tests.
3. Work on a feature branch; preserve unrelated user changes.
4. Make the smallest focused edit.
5. Run focused tests (`npm run test:guide-search`, `npm run test:language-sections`, and the content and Forum suites that CI runs), `git diff --check`, Astro Check, and `npm run build`.
6. Review `git diff --stat`, `git diff --name-only`, and the staged inventory.
7. Push the branch and open a pull request against protected `main`.
8. Merge only after required checks and both Vercel deployments pass.
9. Verify production behavior, Sanity publication, and relevant localized routes.
10. Update `PROJECT_PROGRESS.md` at the end of a meaningful milestone. Update this document only when durable handover facts change.

Do not use destructive Git commands such as `git reset --hard` or `git checkout --` unless explicitly requested. Do not commit generated installers, backups, secrets, or unrelated formatting changes.

## Documentation map

- `PROJECT_PROGRESS.md`: concise current status, next milestone, and blockers
- `src/config/languageSections.ts`: per-language section availability
- `PROJECT_PROGRESS_ARCHIVE_TO_2026-08-08.md`: historical progress record
- `PROJECT_PROVENANCE.md`: ownership, custom development, technology, and transparency
- `TRANSLATION_MODULE_ARCHITECTURE.md`: Translation Editor authority and security contract
- `TRANSLATION_OPERATOR_GUIDE.md`: Translation Editor operating guidance
- `FORUM_ARCHITECTURE_AND_GOVERNANCE.md`: Forum platform and governance
- `FORUM_INTEGRATION.md`: Sanity, Vercel, and Discourse integration contract
- `DISCOURSE_GIGAHOST_RUNBOOK.md`: Forum operational procedures
- `docs/decisions/ADR-001-discourse-on-gigahost.md`: settled Forum hosting decision
- `docs/editorial-charts.md`: editor guide for the shared editorial chart block

## Handover maintenance rule

At the end of a substantial session, ask whether the project can now be relied on differently than before. If yes, update `PROJECT_PROGRESS.md`. If the change affects architecture, security, operations, recovery, or the developer workflow, update this handover too. Keep both documents concise enough that a new developer will actually read them.
