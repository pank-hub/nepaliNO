# nepali.no Owner & Developer Handover

**Status date:** 25 November 2026
**Repository:** `pank-hub/nepaliNO`
**Current owner & final decision-maker:** Pankaj Kafley
**Current `main` checkpoint:** `f2f2235` (`PR #134` Nepalis in Norway SSB stats hub & Sanity chart importer, squash-merged 19 November 2026)
**Production deployment status:** Verify the deployed Vercel revision independently; a merged commit is not proof of deployment.

---

## 1. Purpose & single-source-of-truth structure

This document is the **single canonical handover and operations handbook** for a future project owner, developer, moderator lead, or infrastructure operator. On 19 November 2026, `DEVELOPER_HANDOVER.md`, the current-state dashboard in `PROJECT_PROGRESS.md`, and the operational governance/runbook sections of `DISCOURSE_GIGAHOST_RUNBOOK.md` and `FORUM_ARCHITECTURE_AND_GOVERNANCE.md` were consolidated here:

- Keep this file updated as the live state of systems, boundaries, and operational procedures changes.
- Preserve detailed chronological milestone logs in `PROJECT_PROGRESS_ARCHIVE_TO_2026-11-19.md` and `PROJECT_PROGRESS_ARCHIVE_TO_2026-08-08.md` (`PROJECT_PROGRESS.md` now serves as a pointer).
- Detailed data-model and API specs remain in their focused documents (`FORUM_INTEGRATION.md`, `COMMUNITY_DIRECTORY_ARCHITECTURE.md`, `EVENT_SUBMISSION_ARCHITECTURE.md`, `TRANSLATION_MODULE_ARCHITECTURE.md`, and `docs/*`).

---

## 2. Recent merged milestones (`main`)

| PR / SHA | Date | Scope | Key Operational Impact |
| :--- | :--- | :--- | :--- |
| `#134` (`f2f2235`) | 2026-11-19 | Nepalis in Norway Stats Hub & SSB Importer | Added `/ne/stats/` SSR hub (`12h` CDN cache + snapshot fallback across 7 SSB PxWebApi v2 tables) with interactive charts & MapLibre city map, plus Sanity Studio `Import from SSB` tool on `editorialChart`. |
| `#133` (`dd20bf5`) | 2026-11-19 | Docs consolidation | Consolidated handover, progress archive (`PROJECT_PROGRESS_ARCHIVE_TO_2026-11-19.md`), and Gigahost/Discourse runbook into `DEVELOPER_HANDOVER.md`. |
| `#132` (`87c2438`) | 2026-11-19 | Interactive editorial charts | Progressive tooltips, crosshair snapping, keyboard arrows, legend series toggles, donut center readout, scroll reveal, `Chart \| Table` toggle, UTF-8 BOM CSV export, `nepali.no` footer badge. |
| `#131` (`4e478b2`) | 2026-11-19 | MapLibre GL + OpenFreeMap public maps | Public renderer switched to vector tiles (`tiles.openfreemap.org`) with `editorial` (NRK-inspired calm vector + Norway inset) & `city` styles; privacy fallback copy updated. |
| `#130` (`638edc6`) | 2026-11-19 | Map Studio & UX polish | Simplified Sanity map fields, bundled SVG Studio markers, moved fullscreen button inside map controls, added `nepali.no` badge & touch panning polish. |
| `#128` / `#129` (`55f438d`, `66f121b`) | 2026-11-18 | Guidance & Topic Hub redesign | Nordic editorial masthead, quick-jump bar, chronological recent guides, 6-topic core showcase + `var(--surface-muted)` full directory (`docs/guidance-hub.md`). |
| `#126` (`4c1c294`) | 2026-11-10 | News Hub redesign | Digital-newspaper hub with Featured Story, Important Now, adaptive categories, archive & pagination (`docs/news-hub.md`). |

---

## 3. Infrastructure, accounts & ownership transfer checklist

nepali.no runs across separate managed services. **For an ownership handover, transfer or rotate access on every layer below:**

| Layer | Provider / Identifier | Canonical Endpoint / Scope | Handover Action Required |
| :--- | :--- | :--- | :--- |
| **Source Code & CI** | GitHub `pank-hub/nepaliNO` | Protected `main`, Squash merge, `Validate pull request` workflow | Transfer repo ownership / org admin; review branch protection & GitHub OAuth app for Translation Editor. |
| **Public App Hosting** | Vercel project `nepali-no` | `https://nepali.no` | Transfer Vercel team ownership & billing; audit all server/public environment variables (Sanity, Entur flag, Upstash Redis, Preview secrets, Forum webhook/publisher secrets, Translation OAuth). |
| **Editorial CMS Studio** | Vercel project `nepali-no-studio` | `https://nepali-no-studio.vercel.app/content/` | Transfer Vercel project ownership; verify custom domain `studio.nepali.no` DNS & Sanity CORS (`https://nepali.no`, `https://nepali-no-studio.vercel.app`, `https://studio.nepali.no`). Legacy `nepali-no-studio.sanity.studio` / `nepali-no.sanity.studio` should be retired or verified before cleanup without touching datasets. |
| **Editorial Data Lake** | Sanity project `f9johco4` | `production` (public editorial) & `submissions` (private forms) | Transfer Sanity Project Owner; review & rotate Contributor, Viewer (Preview), Submission write, and Webhook secrets. Never place tokens in Git or client code. |
| **Domain & DNS** | Domeneshop | `nepali.no`, `forum.nepali.no`, `forum-poc.nepali.no`, `notifications.nepali.no` | Transfer registrar/DNS control; verify SPF/DKIM/DMARC records for Resend and A/AAAA/CNAME records for Vercel & Gigahost. |
| **Transactional Email** | Resend | Sender domain `notifications.nepali.no` | Transfer Resend account; keep Forum SMTP credential (`resend` user, `smtp.resend.com:587`) separate from Astro Event/Directory submission notification keys. |
| **Forum VPS & Database** | Gigahost AS (`NO DC2`, Sandefjord) | Ubuntu 24.04 LTS (2 vCPU, 4 GB RAM, 40 GB NVMe); `https://forum.nepali.no` (`forum-poc.nepali.no` redirect alias) | Transfer Gigahost billing/control panel; add new owner's Ed25519 SSH key to server (`AllowUsers`) and remove departing SSH keys; transfer Discourse Administrator account & test a clean backup restore. |
| **API Rate Limiting** | Upstash Redis (Pay as You Go) | `eu-central-1` (Frankfurt), \$20 budget cap | Transfer Upstash org/billing; confirm REST URL/token stay server-only in Vercel for `/api/entur/*`. |
| **Maps, Travel & Public Stats** | OpenFreeMap / OSM / Entur / SSB | `https://tiles.openfreemap.org`, OpenStreetMap, Entur, `https://data.ssb.no/api/pxwebapi/v2/` | No API keys required for OpenFreeMap or SSB (`CC BY 4.0` attribution); verify Entur provider terms & `ENTUR_TRAVEL_API_ENABLED` flag before public activation. Update live Sanity `trustPage` (`privacy`) wording to `tiles.openfreemap.org`. |

---

## 4. Development environment, authority & editorial automation

- GitHub `pank-hub/nepaliNO` is the authoritative code source (`main` protected; work on feature branches and open PRs).
- **Primary website workspace:** GitHub Codespaces (or local Node 24 environment with `PUBLIC_SANITY_PROJECT_ID=f9johco4`, `PUBLIC_SANITY_DATASET=production`). Run `npm ci && npm ci --prefix sanity` before `npx astro check` so Sanity Studio dependencies are resolved.
- Never print, commit, or store secrets in Git, docs, chat, screenshots, browser JS, or shell history.

### Separate local editorial automation (outside this repository)

- **Location & status:** An external, unversioned Python pipeline at `/home/pankaj/Projects/Nepali` runs on the current owner's Ubuntu workstation (`fetch_news.py`, `curate_stories.py`, `sanity_sync.py`, `push_sanity_draft.py`, `monitor_server.py`). These files are outside `nepaliNO` and do not run in Codespaces, GitHub Actions, or Vercel.
- **Schedule & write model:** A local Antigravity task (09:00 `Europe/Oslo`) prepares up to 15 `newsArticle` drafts per run using `createOrReplace` on deterministic `drafts.<uuid5>` IDs in project `f9johco4` / dataset `production`. No automatic publishing, unpublishing, image uploads, or deletions occur.
- **Known operational risks for a future owner:**
  1. Moving this automation off the workstation to cloud/GitHub Actions is pending.
  2. `createOrReplace` can overwrite manual edits on an existing deterministic-ID draft; the CDN slug deduplication fails open on network errors.
  3. The uploader sets `articleSummary.enabled` and `aiAssisted` to `true`, while editorial policy requires human summary approval before publishing. Always review drafts manually before publishing.

---

## 5. Platform architecture & operational subsystems

- **Stack:** Astro + TypeScript (`@astrojs/vercel`, `@astrojs/react`), Sanity Content Lake & Studio, `maplibre-gl` vector maps, Discourse Forum on Gigahost, Resend email, Upstash Redis.
- **Public languages:** Nepali (`ne`, all sections enabled) and Norwegian Bokmal (`nb`, currently **News only**). English (`en`) is limited to selected submission forms and administrative fallback copy.

### Per-language section availability (`src/config/languageSections.ts`)

`isSectionEnabled(language, section)` gates header/footer links, homepage modules, News archive Guide promos, Companion Forum/Guide cards, Contact items, submission language switchers, the `/[lang]/stats/` hub, and `getStaticPaths()` generation. Today `nb` publishes News only; `src/pages/nb/{info,events,directory}/[...slug].astro` and `src/pages/nb/stats/index.astro` serve temporary `302` redirects to `/nb/`. Before re-enabling a `nb` section: flip its flag, remove the corresponding redirect route, publish Norwegian content, update `npm run test:language-sections`, and review `nb` hero/About/Privacy copy and `nb` Forum automation templates.

### Homepage & Shared Published-Content Search

- **Homepage (`src/pages/[lang]/index.astro`, `src/components/home/`):** Mobile-first Nordic portal using Mukta-first Devanagari stacks (`src/styles/global.css`), 6 curated topic shortcuts (`src/config/homepage.ts`), `Important Now` + 6 News stories, 3 Events, 3 Directory highlights (conditional imagery, no placeholders), and client-loaded Forum highlights.
- **Shared Search (`/{language}/search/`, `/{language}/search-index.json`, `docs/shared-content-search.md`):** Build-time index over active Guides, published News, and active Directory listings (excludes Events, Forum, Entur, Maps). Refreshed on deployment — a Sanity publish requires a rebuild/redeploy to refresh the search index. Internal `searchKeywords`/synonyms improve matching and are never shown publicly.

### Guidance Hub & Topic Hubs (`docs/guidance-hub.md`)

- `/[lang]/info/` and `/[lang]/info/topic/[slug]/` share the Nordic editorial layout (`src/lib/guidanceHub.ts`, `src/components/guidance/`): `GuidanceMasthead.astro` with accented quick-jump links, preserved Guidance-only client search (`src/lib/guideSearch.ts`), `GuidanceRecentPackage.astro` (urgent notice, `--surface-warm` spotlight, 5 newest guides sorted chronologically regardless of `isFeatured`), and `GuidanceTopicShowcase.astro` (6 core priority topics + `--surface-muted` directory ordered by `orderGuidanceHubTopics`, `other` last, `GuidanceTopicIcon`).
- **SEO & Topic Slugs:** `/` permanently redirects (`308`) to `/ne/` in `astro.config.mjs` (never move to shared `vercel.json`). `vercel.json` retains two legacy malformed-slug `308` redirects. Topic slugs enforce lowercase Latin/digits/hyphens (`sanity/schemaTypes/slugValidation.ts`); changing a published Topic slug requires a site rebuild plus adding a redirect in `vercel.json`. Verify with `npm run test:topic-slug` and `npm run test:seo-redirects` (after `npm run build`). Note: wire `npm run test:guidance-hub` into `.github/workflows/validate-pull-request.yml` when updating workflow permissions.

### News Hub & Category Migration (`docs/news-hub.md`, `docs/news-category-migration.md`)

- **Hub routes:** `/{language}/news/`, `?archive=1`, `?category={value}`, `/page/{page}/` (server-rendered, no-JS compatible). Preserves Featured Story, Important Now (`importantUntil` never displayed publicly), 2 secondary + 6 Latest News cards, adaptive category bands, and 6 newest Nepali Guides.
- **Structured data:** News detail pages emit JSON-LD `NewsArticle` + `BreadcrumbList` (`tests/structuredData/newsArticle.test.mjs`), resolving `authorType` (`person` / `organization` or `nepali.no Editorial` fallback).
- **Writing Studio (`sanity/components/AuthorNameInput.tsx`):** Presets in `authorNamePresets.ts` + custom `"Other"` text option; writing-first default tab, stable custom structure-list IDs (`PR #68`–`#69`). Keep `@sanity/ui` pinned cleanly (`3.4.5`) with Sanity updates.
- **Category migration:** 10 final stored categories exist (`current-affairs`, `immigration-integration`, `education-student-life`, `work-employment`, `economy-personal-finance`, `consumer-everyday-life`, `culture-community`, `health-welfare`, `sports`, `technology-digital-life`). Legacy `employment-economy` remains readable/searchable for compatibility; do not remove it from schemas until every published, draft, translated, scheduled, and release Sanity document has been manually migrated per `docs/news-category-migration.md`.

### Events, Directory, Trust Pages & Information Boxes

- **Events & Directory:** Public listings/details + private `submissions` forms (Resend notifications, Vercel Hobby WAF rate limit, never auto-published). Multi-date Events use `additionalDates` (`src/lib/eventOccurrences.ts`); organizer phone/email only project/render when `organizerContactPermission == true`; ticket copy lives in `src/lib/eventAccess.ts` (no third-party analytics/tracking scripts).
- **Trust Pages (`src/pages/[lang]/{about,transparency,privacy,contact}.astro`):** On-demand SSR fetching live Sanity `trustPage` documents (`useCdn: false`) with local fallbacks — editorial updates publish immediately without redeploying.
- **Information Boxes (`src/components/content/InformationBox*.astro`, `sanity/schemaTypes/informationBox.ts`):** Shared `important` / `attention` / `tip` / `fact` callout block in News & Guides (`npm run test:information-box`).

### Editorial Charts (`src/components/content/EditorialChart.astro`, `docs/editorial-charts.md`)

- **Model & schema:** Shared Portable Text object `editorialChart` (`sanity/schemaTypes/editorialChart.ts`) used in News (`newsArticle`) & Guides (`publicInformationGuide`). Supports 8 types (`verticalBar`, `horizontalBar`, `groupedBar`, `stackedBar`, `line`, `area`, `donut`, `pie`), `ne-NP` Devanagari digits / `nb-NO` formatting (`format.ts`), unit normalization (rejects redundant `%` suffix + percent unit), true-zero handling, and accessible HTML tables (`EditorialChartTable.astro`).
- **Interactive layer (`PR #132` — `src/lib/editorialChart/interactive.ts`, `client.ts`):**
  - Renders SSR SVG + HTML table first (100% functional without JS and under `@media print` via `::details-content` / `.editorial-chart__print-table`), then progressively enhances via serialized `<script is:inline type="application/json" data-chart-payload>`.
  - Boundary-clamped dark-navy (`#172534`) tooltip card + hairline vertical crosshair supporting hover/plot-snap, touch/click, and keyboard (`tabindex="0"`, arrow keys, `Escape`). Stacked series display localized totals; donut slices focus & update a center readout (`%` + label).
  - Multi-series/polar legend items toggle series visibility/spotlight with a reset control (preventing blanking the final visible series).
  - `IntersectionObserver` scroll-reveal bar growth and Web Animations API line draw-in respect `prefers-reduced-motion: reduce`.
  - Header segmented `Chart | Table` switcher, client-side UTF-8 BOM CSV export (formula triggers escaped safely), and a subtle `nepali.no` footer badge.
- **Verification:** `node --experimental-strip-types --test tests/editorialChart/editorialChart.test.mjs` (44 tests including `jsdom` interaction & CSV escaping).

### Nepalis in Norway Stats Hub (`/[lang]/stats/`) & SSB API Importer (`PR #134`)

- **Public `/ne/stats/` Hub (`src/pages/[lang]/stats/index.astro`, `src/lib/ssb/`):**
  - Renders on-demand (`export const prerender = false`) with `Cache-Control: public, s-maxage=43200, stale-while-revalidate=86400` (12h Vercel edge CDN cache) and is included in the sitemap via `astro.config.mjs` `customPages`.
  - Fetches live `json-stat2` data from **SSB PxWebApi v2** (`https://data.ssb.no/api/pxwebapi/v2/`, free, no API key, `CC BY 4.0` attribution, ~30 queries/min cap, avoid automated bulk runs 07:55–08:15 Oslo time) across 7 official tables (`13880`, `05184`, `05196`, `04767`, `09817`, `12557`, `09623`) with 4.5s timeouts and falls back cleanly per dataset to `src/lib/ssb/snapshots/nepalStatsSnapshot.json`.
  - Displays KPI cards, 5 interactive `EditorialChart` visualizations (`population`, `naturalisations`, `municipalities`, `occupations`, `education`), a click-to-load NRK-style `LocationMap` plotting the top 10 Norwegian municipalities, and a methodology section explaining why Norway lacks a spoken-language register and how `Landbakgrunn` (including Nepal-born EU citizens) differs from `Statsborgerskap`. Visitor browsers never call SSB directly.
- **Sanity Studio SSB Importer (`sanity/components/EditorialChartSsbInput.tsx`):**
  - Wraps `editorialChart` with a collapsible **Import from SSB** bar in Studio: editors choose presets or paste any SSB table ID / `data.ssb.no` PxWebApi v2 URL (`src/lib/ssb/pxweb.ts`), pick category/series dimensions, and fill `title`, `categories`, `series`, and source attribution fields while leaving every label editable.
- **Verification:** `npm run test:ssb` (4/4 pass covering URL security, `json-stat2` indexing, fallback resilience, chart normalization, and `stats` language-section gating).

### Location Maps (`src/components/content/LocationMap.astro`, `sanity/schemaTypes/mapLocation.ts`)

- **Public renderer (`PR #130`, `PR #131`):** Uses **MapLibre GL JS** (`maplibre-gl`) + **OpenFreeMap** vector styles (`MAP_VECTOR_PROVIDER` in `src/lib/maps/mapStyle.ts`, `https://tiles.openfreemap.org`) loaded lazily only on user activation or 300 px viewport intersection (`loadingBehavior: 'click' | 'automatic'`). Supports single & multi-place markers (`src/lib/maps/places.ts`, `markerIcons.ts`), GeoJSON approximate radius circles (`circlePolygonRing`, never exposing confidential addresses or centre links), manual editorial paths (`editorialPath`), sibling-dialog fullscreen (`src/lib/maps/mapFullscreen.ts`), a `nepali.no` stage brand badge, and OpenFreeMap/OSM attribution.
- **Two visual modes (`mapStyle` + `showNorwayLocator` on `locationMap` & `mapPresentation`):**
  - `editorial` *(default for News/Guides)*: Custom Positron palette (`#94c0eb` water, `#f6f5f0` land, `#dce8d5` parks), blue pins with `#172534` navy pills, inline path label (`editorialPathMidpoint`), optional top-left SVG Norway locator inset (`src/lib/maps/norwayLocator.ts`), borderless inline frame, single corner fullscreen button (`+`/`−` shown in fullscreen).
  - `city` *(default for Event/Directory sidebars)*: Harmonized Liberty style keeping street names, buildings, and `poi_transit` stations legible with inline `+`/`−` zoom controls.
- **Studio pickers:** Retain Leaflet + bundled SVG markers (`MapLocationInput.tsx`, `MapPlacesInput.tsx`, `MapPathInput.tsx`). OSM search links open OpenStreetMap in a new tab (no embedded public Nominatim autocomplete). Automatic FOSSGIS driving-route calculation remains disabled (`ROUTING_CALCULATION_ENABLED = false` in `src/lib/maps/location.ts`) pending permission terms.
- **Privacy status:** Code fallback notices (`src/pages/[lang]/privacy.astro`, `src/i18n/{en,nb,ne}.ts`) disclose `tiles.openfreemap.org` / OpenFreeMap; **live Sanity `trustPage` (`privacy`) documents still need manual wording update** from `tile.openstreetmap.org` to `tiles.openfreemap.org`.
- **Verification:** `npm run test:maps` (70/70), `npm run test:privacy` (6/6). Dev-only fixture: `/dev/location-map-test/` (404 in production, excluded from sitemap).

### Entur Travel Assistance (Implemented; Release-Gated)

- Covers eligible exact-pin public Events, Directory listings, News, and Guides (`travelHelpEnabled` opt-in, default false; browser never sends destination coordinates — `src/lib/entur/README.md`).
- Routes fail closed (`404`) unless server-only `ENTUR_TRAVEL_API_ENABLED === 'true'`. Protected by Upstash Redis (`eu-central-1`, sliding limits: 20 origins / 60 s, 10 journeys / 60 s, 30 availability / 60 s; pseudonymous HMAC keys; fails closed `503` on error or 2 s timeout). Keep Entur off in production until provider terms, privacy review, and acceptance tests pass. Local fixture: `/dev/travel-help-test/`. Verification: `npm run test:entur` (111/111), `npm run test:entur-ui` (25/25).

### Draft Preview (Sanity Presentation Tool) & Translation Editor

- **Presentation Tool (`sanity/presentation/previewConfig.ts`, `src/pages/preview/**`, `src/lib/preview/`):** Cookie-gated (`nepali_preview` HMAC-SHA256 `HttpOnly` cookie, `SameSite=Lax` for `studio.nepali.no` or `SameSite=None; Secure; Partitioned` for cross-site `nepali-no-studio.vercel.app`), `Cache-Control: private, no-store`, `noindex`, iframe `frame-ancestors` restricted. Public queries stay `perspective: 'published'`. Never pass local dev origins unconditionally into Studio bundles.
- **Translation Editor (`TRANSLATION_MODULE_ARCHITECTURE.md`):** Pankaj-only GitHub-authenticated workflow creating PRs. Production-domain GitHub OAuth callback was reported broken (redirect URI mismatch) — keep `nepali-no.vercel.app` route working until OAuth callback is fixed and verified end to end.

---

## 6. Security & privacy invariants (non-negotiable)

1. Sanity owns verified editorial content + topic ID references; Discourse owns community posts, users & moderation.
2. Private `submissions` data (and organizer contacts without `organizerContactPermission`) never publish or move into public fields automatically.
3. Browsers never receive Sanity write/viewer tokens, Upstash secrets, Resend keys, or Discourse API credentials.
4. No third-party marketing/analytics/social-tracking scripts (e.g., Google Analytics, Meta Pixel). Social previews rely purely on SSR Open Graph / X Card metadata (`BaseLayout.astro`).
5. Approximate map circles send center coordinates to the browser — never place confidential addresses inside approximate maps or paths.
6. Forum outages or Entur failures must degrade safely without breaking News, Guides, Events, or Directory pages.

---

## 7. Discourse Forum on Gigahost: architecture, governance & operations runbook

*Consolidated from `DISCOURSE_GIGAHOST_RUNBOOK.md` and `FORUM_ARCHITECTURE_AND_GOVERNANCE.md`. See `FORUM_INTEGRATION.md` for Sanity/Vercel API payload details and `docs/decisions/ADR-001-discourse-on-gigahost.md` for hosting rationale.*

### Host identity, security & rebuild procedure

- **Hosting:** Gigahost AS (`NO DC2`, Sandefjord, Norway) — Ubuntu 24.04 LTS x86-64, 2 vCPU, 4 GB RAM, 40 GB NVMe.
- **Hostnames:** Canonical `https://forum.nepali.no` (`DISCOURSE_HOSTNAME`); TLS-covered redirect alias `https://forum-poc.nepali.no` (`DISCOURSE_HOSTNAME_ALIASES`). Automatic Gigahost backups enabled; database lives on VPS, never in Sanity or Vercel.
- **SSH & firewall baseline:** Non-root user (`pankaj` or successor) + dedicated Ed25519 key + `sudo`. `/etc/ssh/sshd_config`: `PermitRootLogin no`, `PasswordAuthentication no`, `KbdInteractiveAuthentication no`, `PubkeyAuthentication yes`, `AllowUsers <operator>`, `MaxAuthTries 3`, `LoginGraceTime 30`. UFW denies all incoming except TCP `22`, `80`, and `443` (never expose Postgres, Redis, or Docker).
- **Config & rebuilds:** `/var/discourse/containers/app.yml` must remain `root:root` mode `600` (`sudo stat -c '%U:%G %a %n' /var/discourse/containers/app.yml`). Never log secrets during `./launcher rebuild app` (edit with `sudo nano`, enforce `chmod 600`, never run concurrent rebuilds; redirect sensitive rebuild output to a root-only file and delete afterwards).
- **Health checks:**
  ```bash
  sudo docker ps --filter name=app
  sudo systemctl --failed --no-pager
  sudo ufw status verbose
  curl --silent --show-error --location --output /dev/null \
    --write-out 'HTTP status: %{http_code}\nTLS verification: %{ssl_verify_result}\n' \
    https://forum.nepali.no/
  ```
- **Email relay:** `smtp.resend.com`, port `587`, STARTTLS, username `resend`, dedicated Forum API credential, sender under `notifications.nepali.no`. For bounces: inspect Discourse Admin Email logs → SMTP acceptance → Resend dashboard → fix mailbox before clearing Resend suppression → send a fresh activation test.

### Pilot policy, categories & future-owner approval rule

- **Pilot state:** Login required, invite-only registration, public signup & anonymous reading disabled, Chat & member-initiated PMs disabled, Norwegian Bokmal default UI with `Norsk | English` choice (full Nepali Discourse localization deferred; Nepali/Norwegian/English discussion permitted). **Not yet authorized for broad public launch.**
- **Frontend integration flags:** Public companion card & homepage feed (`contentIntegrationEnabled`) are on; `relatedTopicsEnabled` remains `false`. Homepage feed shows at most 6 topics from categories `10` & `11` reverse-verified against same-language published Sanity content (`Math.max(0, postsCount - 1)` for replies; public metadata reads use public topic JSON without an API key).
- **Categories (numeric IDs are authoritative):**
  - *Excluded / Admin:* Site Feedback (`2`), Staff (`3`), Forum Information & Announcements (`4`).
  - *General Discussion (TL1 to create topics; future curated related-topic sources):* Questions & Mutual Help (`5`), Living in Norway (`6`), Work & Education (`7`), Family & Everyday Life (`8`), Community & Culture (`9`).
  - *Editorial Companion Categories (`forum-publishers` create; `everyone` see/reply):* News Discussions (`10`), Questions about Guides (`11`).
  - *Verified Classifieds Categories (`verified-members` [`41`], `verified-business` [`42`], and `staff` create; `everyone` see/reply; 30-day / `720h` auto-close from topic creation; pinned to default left sidebar):* Housing / Bolig (`13`, `#0E76BD`, Form Template `1`), Jobs / Jobb (`14`, `#1B7F5C`, Form Template `2`), Buy & Sell / Kjøp og salg (`15`, `#D96B27`, Form Template `3`). *(Parent wrapper ID `12` was removed.)*
- **Classifieds verification, tagging & read-only storefront (`PR #144`):**
  - *Groups (member lists private to group owners/moderators/admins):* `verified-members` (`41`, identity verified via Vipps/BankID or moderator) and `verified-business` (`42`, verified Norwegian businesses/employers/landlords).
  - *Tag Groups (visible to everyone):* `Norway Fylker` (`1`, all 15 current Norwegian fylker — required min `1` tag on Categories `13–15`), `Major Cities` (`2`, 31 Norwegian cities), `Classifieds Types` (`3`, 12 type tags).
  - *Form Templates (`enable_form_templates: true`):* Structured bilingual templates (`1` Housing Listing, `2` Job Listing, `3` Buy & Sell Listing) with 15-fylke dropdown, 35+ city dropdown, optional street/area field, native HTML5 `<input type="date">` pickers (`validations.type: date`), and rental/labor-law confirmation checkboxes.
  - *OIDC / Vipps Login:* `discourse-openid-connect` is preinstalled (`v2026.8.0`); awaiting Vipps Bedriftsportalen approval for `Logg inn med Vipps`. Request only `openid name email` — never `nin` (`fødselsnummer`).
  - *Read-only `nepali.no` storefront:* `src/lib/forum/discourseClassifieds.ts`, `/api/forum-classifieds`, `/ne/classifieds/`, `/nb/classifieds/` (`302` → `/nb/`), and `tests/forum/discourseClassifieds.test.mjs`. Fetches only sanitized public metadata from Categories `13–15`, degrades cleanly on HTTP `401`/`403` during private pilot, and stores zero PII on Vercel or Sanity (paired with client-side FINN/Hybel/NAV/student-housing search links and a browser-only Norwegian landlord intro generator).
- **Rule for new categories:** Never automatically eligible in `nepali.no`. Record numeric ID/name/purpose, assess moderation & safeguarding, update server allowlists + unit tests via PR, verify in production, and document the change here.

### Companion-topic publishing (`forum-publisher`) & HTTP 422 recovery checklist

- **Service account:** `forum-publisher` is non-admin, non-moderator, locked at Trust Level 0, member of `forum-publishers` only, scoped strictly to `topics -> write` in categories `10` & `11`. `allowed_spam_host_domains` narrowly allowlists `nepali.no` so multi-link companion posts are not tripped by TL0 spam thresholds.
- **Preserved audit evidence (do NOT casually delete, unlink, or republish):** Topic `13` (`syntetisk-test-forum-integrasjon`, protected metadata proof), Guide topic `17`, News topic `18`, Nepali News topic `27` (post-fix proof), the real 10 August 2026 failed Nepali News document (`forum-publishing-result-unconfirmed`), and the failed synthetic `forum-publishing-rejected-post` classifier fixture.
- **Editorial lifecycle boundary:** Unpublishing/archiving Sanity News or Guides hides them on `nepali.no` **only** — it must never auto-delete, close, or unlist the Discourse community topic.
- **If automatic publishing fails or stays uncertain (`creating`, `created` without relationship, `forum-publishing-result-unconfirmed`, or HTTP `422`):**
  1. Do **not** republish, clear workflow fields, or manually enter a topic ID.
  2. Inspect Sanity automation status, Attempt ID, timestamps, and failure code.
  3. Check target Discourse category (`10`/`11`) and `forum-publisher` recent activity to confirm whether a topic already exists.
  4. Inspect Discourse logs (`POST /posts.json`) without exposing headers/secrets, plus verify category permissions, title limits, and post length.
  5. Only after confirming no duplicate topic exists and recording previous attempt evidence may an authorized operator clear and run one controlled retry (prefer synthetic fixtures for code verification). Never run `db:create` or touch permissions for debugging.

### Backups, upgrades, emergency controls & billing warning

- **Backups:** Pre- and post-promotion native Discourse backups (DB + uploads) were exported off-server via SCP and verified byte-for-byte via SHA-256 checksums. **Mandatory pending task:** perform a clean backup restore onto a disposable VPS, measure recovery time, and document a recurring restore schedule. Always take + export a fresh native backup before any upgrade or `app.yml` rebuild.
- **Upgrades:** Read Discourse release notes → create & export native backup + optional Gigahost snapshot → run supported upgrade path in maintenance window → test HTTPS, login, email, posting, moderation, API reads, and backups.
- **Emergency stop:** Disable `contentIntegrationEnabled` / `relatedTopicsEnabled` on Vercel if the bridge misbehaves (public site stays up independently). Enable Discourse read-only mode & close registration if the Forum is at risk; rotate compromised credentials immediately.
- **Billing warning:** Powering off a Gigahost VPS may **not** stop hourly billing; deleting a VPS is permanent and requires prior verified off-server backup export, `app.yml` preservation, and DNS update.

---

## 8. Remaining work & launch gates

1. **Privacy & Legal (High priority):** Update live Sanity `trustPage` (`privacy`) documents from `tile.openstreetmap.org` to `tiles.openfreemap.org` / OpenFreeMap; complete organization identity wording, GDPR processing inventory, retention schedule, processor review, and legal review of all 8 `trustPage` docs.
2. **Forum Launch Readiness:** Execute a clean disposable Discourse backup restoration test; recruit & train at least 2 trusted moderators; configure **Logg inn med Vipps** OIDC in `/admin/plugins/discourse-openid-connect` (`openid name email`, never `nin`) once Vipps approves the order; polish Discourse templates & mobile theme harmonization (`Norsk | English` selector, subtle `nepali.no` return link, no tracking scripts).
3. **Auth / External Service Gates:** Fix & verify Translation Editor GitHub OAuth callback on production domain; complete Entur provider-terms & acceptance testing before flipping `ENTUR_TRAVEL_API_ENABLED`; resolve FOSSGIS routing display permission before enabling `ROUTING_CALCULATION_ENABLED`.
4. **Content & UX Polish:** Finish manual migration of legacy `employment-economy` News articles + Search Keywords (`docs/news-category-migration.md`); create branded `1200 x 630` social-sharing fallback image; add `npm run test:guidance-hub` to `.github/workflows/validate-pull-request.yml`; evaluate cloud portability & human summary-approval alignment for the external `/home/pankaj/Projects/Nepali` news draft pipeline.

---

## 9. Safe delivery workflow & documentation map

1. Read `AGENTS.md`, `DEVELOPER_HANDOVER.md`, and any relevant subsystem doc before editing.
2. Inspect `git status --short --branch` and open PRs; work on focused branches (never commit directly to `main`).
3. Keep changes minimal; run focused test suites, `git diff --check`, `npx astro check` (`PUBLIC_SANITY_PROJECT_ID=f9johco4 PUBLIC_SANITY_DATASET=production`), and `npm run build` for code changes.
4. Merge via Squash merge only after CI (`Validate pull request`) and both Vercel previews (`nepali-no`, `nepali-no-studio`) pass; verify production routes independently.
5. Update `DEVELOPER_HANDOVER.md` whenever architecture, security, operations, infrastructure ownership, or milestone state changes.

### Companion repository docs

- `FORUM_INTEGRATION.md`: Sanity/Vercel/Discourse API bridge & resolver contracts
- `docs/decisions/ADR-001-discourse-on-gigahost.md`: settled Forum hosting ADR
- `COMMUNITY_DIRECTORY_ARCHITECTURE.md` & `EVENT_SUBMISSION_ARCHITECTURE.md`: private submission workflows & schemas
- `TRANSLATION_MODULE_ARCHITECTURE.md` & `TRANSLATION_OPERATOR_GUIDE.md`: Translation Editor contract
- `docs/guidance-hub.md`, `docs/news-hub.md`, `docs/news-category-migration.md`, `docs/shared-content-search.md`, `docs/editorial-charts.md`: editorial subsystem guides
- `src/lib/entur/README.md`: Entur adapter & rate-limiting contract
- `PROJECT_PROGRESS.md`, `PROJECT_PROGRESS_ARCHIVE_TO_2026-11-19.md`, `PROJECT_PROGRESS_ARCHIVE_TO_2026-08-08.md`: pointer & historical progress archives
- `DISCOURSE_GIGAHOST_RUNBOOK.md` & `FORUM_ARCHITECTURE_AND_GOVERNANCE.md`: retained legacy files (superseded by Section 7 above)
- `PROJECT_PROVENANCE.md`: ownership, provenance & transparency record
