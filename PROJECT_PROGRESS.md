# nepali.no Project Progress

**Status date:** 5 September 2026
**Repository:** `pank-hub/nepaliNO`
**Protected production checkpoint:** PR #54, Sanity-managed trust pages
**Project owner:** Pankaj Kafley

## Purpose

This is the current handoff document for developers, operators, editors, and maintainers. It records what is working, what is next, and which risks remain. Historical implementation detail belongs in the archive and architecture documents listed below.

## Current platform

- Public application: Astro and TypeScript on Vercel project `nepali-no`
- Production site: `https://nepali.no`
- Editorial CMS: Sanity Content Lake, `production` dataset
- Editorial Studio: `https://nepali-no-studio.vercel.app`
- Private submissions: Sanity `submissions` dataset
- Forum: Discourse at `https://forum.nepali.no`, hosted on Gigahost
- Source control: GitHub with protected `main`, pull requests, required checks, and Squash merge
- Public languages: Nepali (`ne`) and Norwegian Bokmal (`nb`)

### Forum

- The homepage presents up to six recent, reverse-verified News and Guide companion discussions.
- The feed exposes only safe topic metadata and remains independent from the public site when Forum metadata is unavailable.
- Content-linked Forum panels on individual News and Guide pages remain disabled.

## Operational features

### News

- Bilingual archives, article pages, homepage presentation, publication scheduling, featured stories, and social metadata are operational.
- News articles can store controlled relationships to Public Information Guides and Forum topics.
- News Articles can also store up to three editor-curated, same-language Related News links, which render on the individual article page.
- The News archive now presents a curated magazine-style front page with a paginated older-news archive.

### Public Information

- Bilingual Topic Hubs and Guides, official sources, review dates, audience metadata, Norwegian terms, search metadata, editorial classifications, and Portable Text rendering are operational.
- Related Guides can be selected in Sanity but are not yet rendered publicly.

### Events and Community Directory

- Bilingual public archives and detail pages are operational.
- Event and Directory suggestions are private, reviewed, and never published automatically.
- Submission forms, validation, notifications, and Vercel WAF rate limiting are operational.

### Translation Editor

- Phase 1 is operational for Pankaj with GitHub login, signed sessions, validation, generated branches, and protected pull requests.
- Production-domain GitHub OAuth still needs its redirect URI corrected and tested.

### Trust pages and footer

- About, Transparency, Privacy, and Contact are published in both Nepali and Norwegian: eight Sanity `trustPage` documents in total.
- Existing localized URLs and footer links are preserved.
- Language switching, responsive presentation, and hardcoded fallback content remain intact.
- Contact pages use Contact Items plus Safety Heading and Safety Text. The other trust pages use Content Sections.
- Wording and the privacy notice still need editorial and legal-quality review.

## Current next milestone

Reorganize the Sanity News Article workspace into a writing-first editor without renaming fields, migrating documents, or changing published content.

1. Group writing, classification, translation, publishing, sources, and Forum settings clearly.
2. Collapse technical automation fields and conditionally show Important Now lifecycle fields.
3. Add task-oriented News lists for drafts, scheduled stories, featured stories, languages, and missing translations.
4. Configure the Portable Text toolbar for approved headings, quotation, lists, emphasis, links, and images.
5. Validate existing documents, publishing, translations, Forum automation, Studio deployment, and editor usability.

Events and Directory form organization should remain unchanged unless a separate audit identifies a specific problem.

## Launch blockers and deferred work

- Complete a clean disposable Forum backup restoration test.
- Finalize Forum moderation, privacy, incident, monitoring, upgrade, and moderator-readiness procedures.
- Keep public Forum panels disabled until their frontend milestone is reviewed and approved.
- Correct and test the Translation Editor production OAuth callback.
- Add the registered organization name and organization number after exact wording is approved.
- Complete the GDPR processing inventory, retention schedule, processor review, and final privacy notice.
- Replace the default Astro favicon and add a branded global social-sharing fallback image.
- Create `EDITORIAL_USER_MANUAL.md` and `OPERATIONS_RUNBOOK.md`.

## Delivery and validation workflow

1. Inspect the relevant code, Sanity schema, and existing tests before editing.
2. Work on a feature branch.
3. Run focused tests, `git diff --check`, Astro Check, and the production build.
4. Push the branch and open a pull request.
5. Merge only after required checks and Vercel deployments pass.
6. Verify the deployed behavior and update this document at meaningful checkpoints.

Never commit credentials. Keep Sanity write tokens, Discourse keys, and private submission data server-side. Community contributions must never become verified guidance or journalism automatically.

## Documentation map

- `PROJECT_PROGRESS_ARCHIVE_TO_2026-08-08.md`: historical progress and implementation checkpoints
- `PROJECT_PROVENANCE.md`: ownership, custom development, technology, and transparency
- `TRANSLATION_MODULE_ARCHITECTURE.md`: Translation Editor authority and security contract
- `FORUM_ARCHITECTURE_AND_GOVERNANCE.md`: Forum platform and governance
- `FORUM_INTEGRATION.md`: Sanity, Vercel, and Discourse integration contract
- `DISCOURSE_GIGAHOST_RUNBOOK.md`: Forum operational procedures
- `docs/decisions/ADR-001-discourse-on-gigahost.md`: settled Forum hosting decision
