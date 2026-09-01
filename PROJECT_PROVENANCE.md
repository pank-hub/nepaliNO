# nepali.no Project Provenance

**Last reviewed:** 8 August 2026

## Purpose

nepali.no is a purpose-built, nonprofit and public-benefit digital community platform for the Nepali community in Norway. It provides governed News, official-source-based Public Information, Events, a Community Directory, multilingual services, and a separately operated community Forum.

The organization behind nepali.no is formally registered in Norway. The exact registered legal name and organization number should be inserted in this document and public trust surfaces after the organization confirms the approved presentation format.

## Ownership and stewardship

Project owner, principal architect, developer, editor, and current administrator: **Pankaj Kafley**.

The project owner retains final responsibility for mission, architecture, security, publication, editorial standards, infrastructure decisions, moderation governance, partnerships, funding, and deployment.

## Custom development statement

nepali.no is not a purchased template, cloned portal, or prebuilt news theme. The repository contains project-specific architecture, schemas, queries, validation, multilingual behavior, submission workflows, protected administrative tooling, server integrations, and editorial safeguards.

Open-source frameworks and hosted services provide foundations. Their use does not transfer ownership of third-party software or make the custom application generic.

## Current technology and hosting

- Astro and TypeScript: public application, routing, static generation, and server endpoints
- Tailwind CSS 4 and project-specific CSS: visual foundation
- Sanity Content Lake: structured public editorial content and private submissions
- Sanity Studio: editorial and moderation interfaces
- Vercel: public Astro application and separate Studio deployment
- GitHub: private source repository, protected main branch, pull requests, and audit history
- Resend: transactional sending from the verified `notifications.nepali.no` domain
- Domeneshop: domain, DNS, and email infrastructure
- Discourse: private community Forum
- Gigahost: Norwegian VPS hosting for Discourse

Production website: `https://nepali.no`
Private Forum pilot: `https://forum-poc.nepali.no`

## Data and service boundaries

- Sanity `production` contains approved public editorial content.
- Sanity `submissions` contains private Event and Directory submissions and moderation records.
- Discourse retains its own database, accounts, posts, moderation, backups, and operational model.
- Vercel server functions may read narrowly approved Discourse metadata using server-only credentials.
- Forum posts are never copied automatically into Sanity and never become verified guidance automatically.

## Verified publishing and contribution workflows

The platform has production-proven workflows for:

- bilingual News and article routes
- Public Information Guides and Topic Hubs
- reusable Norwegian terminology
- Event archives, Event pages, and private organizer submissions
- Community Directory presentation and private suggestions
- protected interface-translation pull requests
- localized trust and transparency pages
- controlled Sanity-to-Discourse topic relationships and protected metadata lookup

Sanity publications trigger public Vercel builds for configured editorial types. Private Event and Directory submissions remain drafts in the private dataset until human review and deliberate conversion.

## Forum platform decision

Discourse is the Phase 1 Forum platform, hosted separately on Gigahost in Norway. NodeBB and Flarum were evaluated historically but are not active implementation candidates.

The Forum remains private and invite-only during the pilot. Its database, accounts, moderation, email, backups, and operational procedures remain separate from the public Vercel application and Sanity.

## AI-assisted development

Microsoft Copilot and other AI-assisted methods may support planning, drafting, troubleshooting, review, and documentation. The project is not dependent on one AI vendor or tool.

Human responsibility remains with the project owner. AI output is reviewed, tested, validated, and accepted through ordinary source-control and deployment controls. AI assistance does not replace editorial judgment, technical accountability, privacy obligations, moderation, or governance.

## Public Information safeguards

Public Information must identify responsible authorities, link to current official sources, show review metadata, and state that nepali.no does not replace authorities or individualized professional advice.

Community Forum contributions are personal discussion and experience. They must remain clearly separated from verified News and official-source-based Guides.

## Privacy and security approach

The project applies least privilege, server-side secret handling, public/private dataset separation, controlled submission fields, protected pull requests, and safe failure behavior.

No Facebook or Google advertising or tracking scripts are used in the current public-benefit phase. A future commercial, advertising, or expanded analytics model requires a separate decision.

The Privacy page is a working foundation, not the final complete GDPR operating package. Remaining work includes controller identity, organization number, processing records, legal-basis mapping, retention schedules, processor review, rights handling, and incident procedures.

## Multilingual and inclusive design

The principle is **Nepali-first, but never Nepali-only**. Nepali and Norwegian Bokmal are complete public interface languages. English is deliberately limited.

Mobile-first design, readable Devanagari, semantic HTML, keyboard access, alternative text, safe language fallback, and understandable public wording are core requirements.

## Development evidence

Git commits, protected pull requests, GitHub Actions, Vercel deployments, Sanity publications, production smoke tests, and maintained documentation provide evidence of development and operational validation.

Current protected checkpoint at this review: `b9f62a0 allowlist Forum metadata through Sanity (#22)`.

## Effort statement

The project represents substantial multidisciplinary in-kind effort spanning product design, architecture, frontend and backend development, multilingual editorial work, CMS engineering, DevOps, server operation, security, privacy, testing, and documentation.

The current conventional-equivalent estimate is approximately **875 hours**, with a defensible range of **800 to 950 hours** to the 8 August 2026 checkpoint. This is retrospective and indicative, not an audited timesheet. Approximately **55 to 80 hours** of that estimate relates to Gigahost and Discourse infrastructure and operations completed so far.

## Rights and third-party material

Custom editorial content, branding, code, and project-specific documentation remain subject to the project owner's ownership and licensing decisions. Third-party software, images, trademarks, official materials, and services retain their own rights and terms.

## Funding and partner transparency

Future grants, sponsorships, partnerships, and in-kind contributions should be disclosed appropriately. Funding must not obscure editorial responsibility. Sponsored or promoted content must remain distinguishable from independent News, public guidance, and community discussion.

## Maintenance

Review this document after material changes to legal identity, ownership, hosting, architecture, licensing, funding, key partners, editorial governance, privacy responsibility, or Forum production status.

## 2026-09-01 presentation and social-sharing continuity update

The September presentation milestone added reusable detail-page context rails, a modern Event presentation, a six-story homepage News hierarchy, a structured News archive, and privacy-friendly canonical, Open Graph, and X Card metadata. Social previews use public Sanity images where suitable and do not require Facebook or X scripts, tracking pixels, advertising SDKs, or additional cookies.

The implementation remains evidenced by ordinary Git commits, zero-error Astro Check runs, production builds, localized route generation, generated-HTML inspection, and desktop/mobile review. A branded fallback social image and replacement of the default Astro favicon remain future branding work.
