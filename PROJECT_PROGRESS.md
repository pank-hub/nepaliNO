# nepali.no Project Progress

**Status date:** 6 September 2026
**Current documentation branch:** `main` after PR #69
**Current protected production checkpoint:** `6a2b610 fix Sanity structure list IDs (#69)`
**Repository:** `pank-hub/nepaliNO`
**Project owner and final decision-maker:** Pankaj Kafley

## 1. Purpose of this document

This document is the concise current-state record for developers, operators, editors, auditors, and future maintainers. It replaces the former append-only progress log, which is preserved unchanged as `PROJECT_PROGRESS_ARCHIVE_TO_2026-08-08.md`.

Use this document to understand what is operational now, what is deliberately disabled, what remains unfinished, and where detailed instructions are maintained. Git history and pull requests remain the authoritative implementation record.

## 2. Mission and platform position

nepali.no is a multilingual, mobile-first, public-benefit platform for the Nepali community in Norway. The complete public languages are Nepali (`ne`) and Norwegian Bokmal (`nb`). English remains limited to selected submission services and strategic future content.

The platform combines:

- governed editorial News
- official-source-based Public Information Guides and Topic Hubs
- governed Events and private organizer submissions
- a governed Community Directory and private listing suggestions
- a protected Translation Editor
- a private Discourse Forum pilot
- controlled News and Guide relationships to Forum topics

nepali.no is not a Norwegian public authority and does not replace official legal, immigration, tax, health, welfare, or administrative guidance.

## 3. Current production architecture

- Public application: Astro and TypeScript on Vercel project `nepali-no`
- Production domain: `https://nepali.no`
- Editorial CMS: Sanity Content Lake and Sanity Studio
- Studio delivery: separate Vercel project `nepali-no-studio` and hosted Studio at `https://nepali-no.sanity.studio/`
- Public editorial dataset: `production`
- Private submission dataset: `submissions`
- Source control: GitHub repository `pank-hub/nepaliNO`
- Delivery governance: protected `main`, pull requests, Squash merge, required Astro Check and production build
- Transactional email: Resend sending from `notifications.nepali.no`
- DNS and email infrastructure: Domeneshop
- Forum: Discourse hosted separately on Gigahost in Norway at the canonical hostname `forum.nepali.no`; `forum-poc.nepali.no` is a TLS-covered alias that redirects to the canonical hostname

### Data ownership boundaries

- Sanity owns verified editorial content and deliberate references to Forum topic IDs.
- Discourse owns topics, posts, users, moderation, open or closed state, and Forum activity.
- Vercel server functions make restricted authenticated requests to Discourse.
- Browsers never receive Discourse API credentials or Sanity write credentials.
- Event and Directory submissions never publish automatically.

## 4. Operational services

### News

- Bilingual archives and article routes are operational.
- Future-dated News is excluded from public queries and static paths until publication time.
- Homepage News supports a compact Important Now band, one featured article, two supporting visual stories, and three compact stories. `importantUntil` remains internal lifecycle metadata and is not shown publicly.
- The News archive uses one featured article, two supporting visual stories, six medium cards, and a compact list for all remaining articles. Three Public Information Guides remain an independent closing section.
- News articles can now store one companion Forum discussion and up to three curated related Forum topics in Sanity.
- The Sanity News editor is organized around a writing-first default tab with separate Classification, Publishing, Sources and Trust, Forum, and Workflow groups.
- The News Article Portable Text editor explicitly supports approved headings, quotation, bullet and numbered lists, bold, emphasis, links, and images.
- The Studio Editorial workspace provides task-oriented News views for drafts, scheduled stories, featured stories, Important Now, language queues, and missing translations. Custom structure lists use stable IDs to prevent hosted Studio structure-reader errors.
- Public Forum panels are still disabled.

### Public Information

- Guides, Topic Hubs, official sources, review dates, audience metadata, reusable Norwegian terms, search metadata, guide format, priority, and maintenance sensitivity are operational.
- Related Guides can be selected in Sanity but are not yet projected or rendered publicly.
- Guides can store one long-lived Forum questions-and-experiences topic and up to three related Forum topics.
- Community discussion must remain visually and editorially separate from verified guidance.

### Events

- Bilingual upcoming and past archives and individual Event pages are operational. The detail page uses a modern date-led hero, practical information above the fold, controlled responsive imagery, and the shared context-rail card system.
- Event lifecycle, Oslo timezone, date ranges, external registration safety, and status presentation are implemented.
- Public Nepali, Norwegian, and limited-English submission forms are operational.
- Valid submissions are stored as private drafts in the `submissions` dataset and notify administrators best-effort.
- Vercel WAF rate limiting protects submission endpoints.

### Community Directory

- Public multilingual directory experiences and a complete public suggestion service are operational. Individual listing pages use the shared context-rail card system for facts, public contact, verification, and translation.
- Suggestions from owners, representatives, or ordinary visitors enter private moderation and never publish automatically.
- Private and proposed public contact details remain separate.

### Translation Editor

- Phase 1 is operational and Pankaj-only.
- GitHub login, signed sessions, server validation, deterministic TypeScript updates, generated branches, and protected pull requests are implemented.
- `https://nepali.no/translations/` displays the login page, but production-domain GitHub login currently fails because its redirect URI is not associated with the application.
- The working `nepali-no.vercel.app` route must remain available until the production callback has been corrected and tested.
- Phase 2 multi-user proofreading remains deferred pending risk assessment.

### Trust and transparency pages

- About, Project development and transparency, Privacy, and Contact exist in Nepali and Norwegian and are linked from the footer.
- Their content is managed in Sanity through eight localized `trustPage` documents and fetched on demand at request time, so editorial updates do not require a code deployment.
- Their wording needs a later editorial and legal-quality review.
- Existing localized URLs, language switching, footer links, mobile design, and safe local fallbacks are preserved.
- The registered organization name and organization number should later be added to About, Privacy, and a restrained footer identity line after exact wording is approved.

## 5. Discourse and Forum integration status

### Settled platform and language decisions

- Discourse is the Phase 1 Forum platform and Gigahost remains the hosting provider.
- `forum.nepali.no` is now the operational canonical Forum hostname. `forum-poc.nepali.no` remains a TLS-covered alias that redirects to the canonical hostname during the preservation period.
- The Forum remains operationally separate from Sanity and Vercel.
- Norwegian Bokmal is the default Discourse interface language. Signed-in users and guests can choose English. Full Nepali interface translation is deferred.
- The pilot remains login-required and invite-only; Chat is disabled and ordinary members cannot initiate personal messages.

### Governed category model

- Administrative or excluded: Site Feedback (2), Staff (3), Forum Information and Announcements (4).
- Curated related-topic categories: Questions and Mutual Help (5), Living in Norway (6), Work and Education (7), Family and Everyday Life (8), and Community and Culture (9).
- News companion topics: News Discussions (10) only.
- Guide companion topics: Questions about Guides (11) only.
- The future homepage discussion feed may use categories 10 and 11 only, with reverse verification against eligible Sanity content.

Creating a category in Discourse never grants automatic eligibility for content panels or the homepage feed. New categories require explicit review, code policy, tests, and documentation.

### Service identities and permissions

- `forum-metadata` remains the separate read-only metadata identity.
- `forum-publisher` is a non-admin, non-moderator service account, locked at Trust Level 0.
- The `forum-publishers` group grants topic creation only in categories 10 and 11.
- General community categories require Trust Level 1 for topic creation, preventing the publisher account from posting there.
- Metadata, Discourse publishing, Sanity automation, and webhook-signing credentials remain separate and server-only.

### Verified metadata and automatic publishing

Completed through PRs #18 to #39:

- Sanity Forum relationship schemas and role-aware category eligibility
- server-only Discourse metadata and publishing clients
- strict public identity parsing and protected production diagnostics
- opt-in Sanity companion automation model
- signed Sanity webhook verification using a minimal document identity
- authoritative production-document re-fetching
- revision-guarded creation claims and bounded attempt identifiers
- fixed News-to-category-10 and Guide-to-category-11 mapping
- safe topic-ID write-back to Sanity
- manual reconciliation for uncertain provider or final write-back outcomes
- CI coverage for relationships, request parsing, metadata, publishing, workflow state, and slug normalization

Verified production chains:

`approved Sanity content identity -> eligible relationship -> restricted metadata reader -> normalized Forum metadata`

`eligible automatic Sanity publication -> signed webhook -> authoritative re-fetch -> revision claim -> restricted forum-publisher -> Discourse companion topic -> durable Sanity topic relationship`

Live synthetic evidence:

- Protected future-dated News fixture remains linked to topic 13 for metadata and resolver diagnostics.
- Automatic Guide proof created topic 17 in category 11 and wrote the relationship and completed state back to Sanity. The Guide is now archived.
- Automatic News proof created topic 18 in category 10 and wrote the relationship and completed state back to Sanity. The article must remain future-dated after verification.
- The first Guide proof exposed a Sanity slug-object URL defect. Topic 17 was corrected manually and PR #39 added a regression-tested permanent fix.
- Norwegian opening templates were correctly selected from `language: nb` for both live proofs.

The public `/api/forum-content` endpoint and News/Guide presentation remain intentionally disabled. Generic HTTP 404 with `Cache-Control: no-store` remains the public boundary while both Forum presentation flags are false.

Fifty-six dependency-free Forum tests and ten connected-content tests now form the expected focused suites, for 66 passing tests in total, followed by Astro Check and the production build.

## 6. Security and privacy invariants

- Never place credentials in Git, Markdown, screenshots, chat, browser JavaScript, public variables, or shell history.
- Keep public and private datasets separate.
- Never expose Sanity write tokens or Discourse API keys to browsers.
- Never let browsers choose repositories, datasets, document types, moderation status, API routes, or Forum topic IDs.
- Keep Forum credentials server-side and least-privileged.
- The current metadata reader is a dedicated non-staff account with granular topic-read access restricted to synthetic topic ID 13.
- Forum failure must not break News or Guide pages.
- Community contributions never become verified guidance or journalism automatically.
- Notification failure never reverses valid private submission storage.

## 7. Completed editorial-platform milestone

PRs #68 and #69 are merged and deployed. The Sanity News Article workspace is now organized into a clearer writing-oriented form, and the Portable Text editing experience is explicitly configured without changing existing document fields or published content. The structure-reader error caused by missing custom-list IDs was fixed and the corrected Studio was deployed to both Vercel and Sanity hosting.

Completed:

1. Writing-first field groups and Portable Text toolbar implemented.
2. Task-oriented News Structure views implemented with stable custom-list IDs.
3. Existing field names and published content preserved.
4. TypeScript, Sanity production build, Astro validation, Vercel deployments, and hosted Studio deployment verified.

The next Studio follow-up is optional evaluation of a separate Form and Preview document view. The default Astro favicon remains a separate small branding task, and Forum visual harmonization remains approved but is not active.

## 8. Deferred but approved work

- Render Related Guides publicly with same-language, active, slug-safe filtering.
- Build News Forum panel and related-topic sidebar.
- Build Guide questions-and-experiences panel and related-topic sidebar.
- Correct the Translation Editor production-domain OAuth callback.
- Move all four localized trust pages into Sanity: About, Project development and transparency, Privacy, and Contact. Preserve existing localized URLs, footer links, language switching, responsive presentation, and safe fallback behavior.
- Add registered organization identity and organization number to public trust surfaces.
- Complete GDPR processing inventory, retention schedule, processor review, and final privacy notice.
- Polish Discourse activation, invitation, password-recovery, and system email tone.
- Implement Forum language tags after usability testing.
- Perform a clean Discourse backup restoration test.
- Complete upgrade testing, monitoring, incident procedures, and launch gates.
- Create `EDITORIAL_USER_MANUAL.md` and the broader platform `OPERATIONS_RUNBOOK.md`.
- Complete remaining launch polish, including a branded 1200 x 630 fallback social image and replacement of the default Astro favicon.
- Verify deployed Open Graph and X Card previews, and request a fresh Facebook scrape when cached metadata is stale.

## 9. Launch blockers

- Forum restoration test not completed.
- Forum moderation policy, privacy notice, incident process, and full launch governance not finalized.
- At least two trusted moderators are not yet operationally established.
- Public News and Guide Forum presentation remains disabled pending final-hostname verification.
- Translation Editor production callback remains broken.
- Static trust-page wording and GDPR notice need final review.
- Organization identity and number are not yet presented consistently.
- Editorial and operational manuals remain incomplete.

## 10. Documentation map

- `PROJECT_PROGRESS.md`: current verified state and priorities
- `PROJECT_PROGRESS_ARCHIVE_TO_2026-08-08.md`: full historical append-only record
- `PROJECT_PROVENANCE.md`: ownership, custom development, technology, and transparency
- `TRANSLATION_MODULE_ARCHITECTURE.md`: Translation Editor authority and security contract
- `FORUM_ARCHITECTURE_AND_GOVERNANCE.md`: current Forum platform and governance rules
- `FORUM_INTEGRATION.md`: Sanity, Vercel, and Discourse integration contract
- `DISCOURSE_GIGAHOST_RUNBOOK.md`: operational procedures
- `FORUM_PLATFORM_EVALUATION_ARCHIVE_2026-08-06.md`: historical platform comparison
- `docs/decisions/ADR-001-discourse-on-gigahost.md`: settled platform decision
- external vault handover prompt: concise developer onboarding, intentionally outside Git

## 11. Working method

- Begin with a clean repository and inspect open pull requests.
- Audit before editing.
- Use feature branches and protected pull requests.
- Run focused validation, `git diff --check`, Astro Check, and the production build.
- Review exact staged inventory before committing.
- Use Squash merge after required checks pass.
- Verify production behavior and update current-state documentation only at meaningful checkpoints.
- Preserve historical rationale in archives rather than repeating it in current-state documents.

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

The local branch `feature/news-and-events-presentation` now contains six reviewed presentation and metadata checkpoints after protected production checkpoint `ec9651a`:

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

The public site still uses Astro's default favicon. Replace it later with approved nepali.no branding based on the compact `ने` symbol and verify browser, mobile, and cache behavior.

The root route intentionally sends `/` to `/ne/`. The `nepali-no.vercel.app` route must remain available until the Translation Editor production-domain GitHub OAuth callback is corrected and fully tested. Do not introduce a blanket Vercel-domain redirect before that dependency is removed.

### Four Sanity-managed trust pages

All four localized footer trust pages should later move from hardcoded Astro content into Sanity-managed editorial content:

1. About
2. Project development and transparency
3. Privacy
4. Contact

The migration must preserve existing localized URLs, footer links, Nepali and Norwegian language switching, current responsive presentation, publication controls, and safe fallback behavior. This is a separate future milestone and must not be folded casually into the News editor reorganization.
