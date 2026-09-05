# nepali.no Developer Handover

**Status date:** 5 September 2026
**Repository:** `pank-hub/nepaliNO`
**Owner and final decision-maker:** Pankaj Kafley
**Protected production checkpoint:** PR #57, Nepali typography improvements

## Purpose

This document is the durable repository handover for a future developer, operator, consultant, or AI-assisted workflow. It contains recovery context, non-negotiable boundaries, current operational facts, and the safest next steps.

`PROJECT_PROGRESS.md` is the shorter current dashboard. Update this handover only when architecture, operations, security boundaries, or recovery procedures materially change. Keep historical detail in the archive and dedicated architecture documents.

## Current repository state

- Protected production branch: `main`
- Current delivery model: feature branch -> pull request -> required checks -> Squash merge -> Vercel deployment
- Required validation: Astro check and production build
- Public application deployment: Vercel project `nepali-no`
- Studio deployment: Vercel project `nepali-no-studio`
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

## Operational features

### News

Bilingual archives, article pages, homepage presentation, publication scheduling, featured stories, social metadata, and Portable Text rendering are operational. News can store controlled relationships to Public Information Guides and Forum topics. Editors can also curate up to three same-language Related News links on an article; these render on its public article page.

The News archive uses a magazine-style curated landing page and a paginated older-news archive. Preserve this distinction when changing News presentation.

Nepali typography was recently adjusted to reduce heavy Devanagari weights in headings and rich-text bold content. Avoid reintroducing very heavy weights for large Nepali display text without visual review.

### Public Information

Bilingual Topic Hubs and Guides, official sources, review dates, audience metadata, reusable Norwegian terms, search metadata, editorial classifications, and Portable Text rendering are operational. Related Guides can be selected in Sanity but are not yet rendered publicly.

Reusable Norwegian terms expose the Norwegian term and optional Nepali pronunciation separately. The pronunciation is rendered in italic muted text; legacy inline terms remain supported.

### Events and Community Directory

Bilingual public archives and detail pages are operational. Event and Directory suggestions are private, reviewed, and never published automatically. Submission validation, notifications, private contact separation, and Vercel WAF rate limiting are operational.

### Trust pages and footer

About, Transparency, Privacy, and Contact are published in Nepali and Norwegian: eight Sanity `trustPage` documents in total. Existing localized URLs, footer links, language switching, responsive presentation, and safe local fallback content are preserved.

Contact pages use Contact Items, Safety Heading, and Safety Text. The other trust pages use Content Sections. Wording and the privacy notice still need editorial and legal-quality review.

### Translation Editor

Phase 1 is Pankaj-only with GitHub login, signed sessions, deterministic TypeScript updates, generated branches, and protected pull requests. The production-domain GitHub OAuth callback still needs correction and end-to-end verification. Keep the working `nepali-no.vercel.app` route available until that is complete.

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

Public News and Guide Forum panels remain disabled. Do not enable `contentIntegrationEnabled` or `relatedTopicsEnabled` without a separate reviewed frontend milestone. Creating a Discourse category never makes it automatically eligible for a homepage feed or content-linked panel.

The homepage Forum feed is enabled independently. It presents no more than six recent topics from the News Discussions and Questions about Guides categories, only after reverse-verifying the companion relationship against published same-language Sanity content. It exposes only topic title, reply count, activity time, role, and URL; unavailable, archived, ineligible, and duplicate topics are omitted. Keep article-level Forum panels disabled unless separately approved.

The signed Sanity-to-Discourse companion-topic workflow is production-proven. Preserved evidence includes synthetic topic 13, Guide topic 17, News topic 18, Nepali News topic 27, and the original failed publishing incident. Never casually clear automation attempt IDs, timestamps, failure codes, topic relationships, or preserved fixtures. Inspect both Sanity and Discourse before retrying uncertain operations.

## Current next milestone

Reorganize the Sanity News Article workspace into a writing-first editor without renaming fields, migrating documents, or changing published content.

1. Group writing, classification, translation, publishing, sources, and Forum settings clearly.
2. Collapse technical automation fields and conditionally show Important Now lifecycle fields.
3. Add task-oriented News lists for drafts, scheduled stories, featured stories, languages, and missing translations.
4. Configure the Portable Text toolbar for approved headings, quotation, lists, emphasis, links, and images.
5. Validate existing documents, publishing, translations, Forum automation, Studio deployment, and editor usability.

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
5. Run focused tests, `git diff --check`, Astro Check, and `npm run build`.
6. Review `git diff --stat`, `git diff --name-only`, and the staged inventory.
7. Push the branch and open a pull request against protected `main`.
8. Merge only after required checks and both Vercel deployments pass.
9. Verify production behavior, Sanity publication, and relevant localized routes.
10. Update `PROJECT_PROGRESS.md` at the end of a meaningful milestone. Update this document only when durable handover facts change.

Do not use destructive Git commands such as `git reset --hard` or `git checkout --` unless explicitly requested. Do not commit generated installers, backups, secrets, or unrelated formatting changes.

## Documentation map

- `PROJECT_PROGRESS.md`: concise current status, next milestone, and blockers
- `PROJECT_PROGRESS_ARCHIVE_TO_2026-08-08.md`: historical progress record
- `PROJECT_PROVENANCE.md`: ownership, custom development, technology, and transparency
- `TRANSLATION_MODULE_ARCHITECTURE.md`: Translation Editor authority and security contract
- `TRANSLATION_OPERATOR_GUIDE.md`: Translation Editor operating guidance
- `FORUM_ARCHITECTURE_AND_GOVERNANCE.md`: Forum platform and governance
- `FORUM_INTEGRATION.md`: Sanity, Vercel, and Discourse integration contract
- `DISCOURSE_GIGAHOST_RUNBOOK.md`: Forum operational procedures
- `docs/decisions/ADR-001-discourse-on-gigahost.md`: settled Forum hosting decision

## Handover maintenance rule

At the end of a substantial session, ask whether the project can now be relied on differently than before. If yes, update `PROJECT_PROGRESS.md`. If the change affects architecture, security, operations, recovery, or the developer workflow, update this handover too. Keep both documents concise enough that a new developer will actually read them.
