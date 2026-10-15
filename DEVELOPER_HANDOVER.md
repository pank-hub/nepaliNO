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
