# nepali.no Project Progress

**Status date:** 9 August 2026
**Current protected checkpoint:** `194deec fix Forum publishing slug normalization (#39)`
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

### Settled platform and language decisions

- Discourse is the Phase 1 Forum platform and Gigahost remains the hosting provider.
- The current pilot hostname is `forum-poc.nepali.no`; the approved final hostname is `forum.nepali.no`.
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

Fifty-four dependency-free Forum tests now form the expected full suite on every pull request, followed by Astro Check and the production build.

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

Promote the proven Forum pilot toward its approved production identity at `forum.nepali.no`, without enabling public News or Guide panels prematurely.

Required sequence:

1. verify a current native Discourse backup and complete a clean disposable restoration test
2. record rollback steps, recovery time, missing dependencies, and credential-rotation responsibilities
3. preserve `forum-poc.nepali.no` until the final hostname, TLS, email links, APIs, and redirects are proven
4. configure DNS, TLS, Discourse canonical hostname, allowed origins, and transactional email for `forum.nepali.no`
5. update the server-owned Forum base URL only after the final hostname is operational
6. re-prove metadata reads, automatic News and Guide publishing, Sanity write-back, login, invitation, activation, and password recovery
7. align the Discourse appearance with nepali.no using upgrade-safe theme work
8. add a clear `Norsk | English` selector for guests and signed-in users
9. keep `contentIntegrationEnabled` and `relatedTopicsEnabled` false until the final hostname is stable and public presentation receives a separate reviewed milestone

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
