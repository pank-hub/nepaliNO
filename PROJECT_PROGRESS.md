# nepali.no Project Progress

**Status date:** 8 August 2026
**Current protected checkpoint:** `ac20866 validate Forum content requests in CI (#29)`
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
- Studio delivery: separate Vercel project `nepali-no-studio`; the older Sanity-hosted Studio remains a fallback
- Public editorial dataset: `production`
- Private submission dataset: `submissions`
- Source control: GitHub repository `pank-hub/nepaliNO`
- Delivery governance: protected `main`, pull requests, Squash merge, required Astro Check and production build
- Transactional email: Resend sending from `notifications.nepali.no`
- DNS and email infrastructure: Domeneshop
- Forum: Discourse hosted separately on Gigahost in Norway at `forum-poc.nepali.no`

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
- Homepage News supports Important Now, one featured article, and recent stories.
- News articles can now store one companion Forum discussion and up to three curated related Forum topics in Sanity.
- Public Forum panels are still disabled.

### Public Information

- Guides, Topic Hubs, official sources, review dates, audience metadata, reusable Norwegian terms, search metadata, guide format, priority, and maintenance sensitivity are operational.
- Related Guides can be selected in Sanity but are not yet projected or rendered publicly.
- Guides can store one long-lived Forum questions-and-experiences topic and up to three related Forum topics.
- Community discussion must remain visually and editorially separate from verified guidance.

### Events

- Bilingual upcoming and past archives and individual Event pages are operational.
- Event lifecycle, Oslo timezone, date ranges, external registration safety, and status presentation are implemented.
- Public Nepali, Norwegian, and limited-English submission forms are operational.
- Valid submissions are stored as private drafts in the `submissions` dataset and notify administrators best-effort.
- Vercel WAF rate limiting protects submission endpoints.

### Community Directory

- Public multilingual directory experiences and a complete public suggestion service are operational.
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
- Their wording needs a later editorial and legal-quality review.
- Their content should later move from hardcoded Astro pages into Sanity while preserving URLs, language switching, footer links, mobile design, and safe fallbacks.
- The registered organization name and organization number should later be added to About, Privacy, and a restrained footer identity line after exact wording is approved.

## 5. Discourse and Forum integration status

### Settled decisions

- Discourse is the Forum platform for Phase 1.
- Gigahost remains the Forum hosting provider.
- NodeBB and Flarum are historical alternatives, not active implementation candidates.
- The Forum remains separate from Sanity and Vercel hosting.
- The private pilot is login-required and invite-only; anonymous reading and public signup are disabled.
- Chat is disabled and ordinary members cannot initiate personal messages.

### Current Forum structure

- Staff
- Forum Information and Announcements
- Site Feedback
- Questions and Mutual Help
- Living in Norway
- Work and Education
- Family and Everyday Life
- Community and Culture

### Content lifecycle

- News: the companion topic acts as comments and discussion for one article. A visible promotional panel is planned. The topic may later close while remaining readable.
- Public Information Guides: the companion topic supports continuing questions and practical experience sharing and should normally remain open.
- Both content types may show up to three related Forum topics, initially curated editorially.

### Metadata bridge and endpoint boundary

Completed through PRs #18 to #29:

- reusable Sanity Forum topic-reference schema
- server-only Discourse metadata client
- Sanity-controlled News and Guide relationship resolver
- defensive reply-count normalization
- duplicate removal, companion-topic exclusion, and three-related-topic limit
- protected production diagnostics for eligible and ineligible content
- strict public content-identity request contract
- automated CI enforcement for relationship normalization and request parsing

Verified production chain:

`approved Sanity content identity -> eligible relationship -> approved topic ID -> Vercel server -> restricted Discourse API on Gigahost -> normalized metadata`

Protected production diagnostics prove that future-dated News, unrelated published News, unrelated active Guides, nonexistent slugs, and wrong-language identities are rejected before Discourse. The fixed synthetic fixture still resolves topic ID `13`, where raw `postsCount: 1` becomes public `replyCount: 0`.

The disabled public endpoint accepts no observable contract while the feature flag is false. Requests with no parameters, a valid-looking content identity, or malformed values including a caller-supplied topic ID all return the same generic HTTP 404 with `Cache-Control: no-store`.

Twenty dependency-free Forum tests now run on every pull request: nine relationship-normalization tests and eleven public request-contract tests.

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

## 7. Active next milestone

Implement the enabled-state `/api/forum-content` pipeline behind the still-false `contentIntegrationEnabled` feature flag.

Required design work:

1. parse only the validated public content identity and resolve eligible Sanity relationships server-side
2. obtain metadata only for topic IDs attached to published News or active Guides
3. define companion and related-topic response structure without exposing editorial labels or internal errors
4. define partial-success behavior when one approved topic is unavailable
5. filter hidden, deleted, inaccessible, staff, or otherwise ineligible topics
6. define safe short caching, timeout, and failure behavior
7. test open, closed, archived, missing, and replied-to synthetic topics
8. broaden or replace the synthetic topic-13 API-key restriction only after the enabled-state boundary is proven privately
9. keep public rendering and both Forum feature flags disabled until the complete endpoint behavior is approved

## 8. Deferred but approved work

- Render Related Guides publicly with same-language, active, slug-safe filtering.
- Build News Forum panel and related-topic sidebar.
- Build Guide questions-and-experiences panel and related-topic sidebar.
- Correct the Translation Editor production-domain OAuth callback.
- Move four trust pages into Sanity.
- Add registered organization identity and organization number to public trust surfaces.
- Complete GDPR processing inventory, retention schedule, processor review, and final privacy notice.
- Polish Discourse activation, invitation, password-recovery, and system email tone.
- Implement Forum language tags after usability testing.
- Perform a clean Discourse backup restoration test.
- Complete upgrade testing, monitoring, incident procedures, and launch gates.
- Create `EDITORIAL_USER_MANUAL.md` and the broader platform `OPERATIONS_RUNBOOK.md`.
- Complete homepage Events integration and remaining launch polish.

## 9. Launch blockers

- Forum restoration test not completed.
- Forum moderation policy, privacy notice, incident process, and full launch governance not finalized.
- At least two trusted moderators are not yet operationally established.
- Public Forum metadata presentation remains disabled.
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
