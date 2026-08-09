# Forum Architecture and Governance

**Status:** Discourse selected; private pilot operational
**Host:** Gigahost, Norway
**Last reviewed:** 9 August 2026

## 1. Settled platform decision

Discourse is the Phase 1 community Forum platform. Gigahost remains the hosting provider. NodeBB and Flarum are retained only in the historical evaluation archive.

The Forum is a separate service with its own application, database, accounts, sessions, email, moderation, backups, updates, and incident procedures.

## 2. Purpose

The Forum supports durable community questions, experience sharing, respectful discussion, and engagement outside surveillance-driven social networks.

The Forum is not verified News, an official authority, emergency support, private case management, an unrestricted marketplace, or a replacement for Public Information Guides.

## 3. Current pilot policy

- private and invite-only
- login required
- anonymous reading disabled
- public signup disabled
- Norwegian Bokmal is the default application interface
- signed-in users and guests can choose English explicitly
- full Nepali interface translation is deferred; topics and replies may use Nepali, Norwegian, or English
- Chat disabled
- ordinary members cannot initiate personal messages
- synthetic or controlled data only during technical validation
- no real community launch authorization yet

## 4. Current categories

Administrative or excluded:

- Site Feedback (2)
- Staff (3)
- Forum Information and Announcements (4)

General member discussion and curated related-topic sources:

- Questions and Mutual Help (5)
- Living in Norway (6)
- Work and Education (7)
- Family and Everyday Life (8)
- Community and Culture (9)

Controlled editorial companion categories:

- News Discussions (10)
- Questions about Guides (11)

Do not create additional categories merely to make the Forum appear populated. Use tags and merge inactive categories when appropriate.

## 5. Roles

### Project owner and administrator

Pankaj retains final authority for platform policy, administrators, moderators, privacy, backups, integrations, production launch, serious incidents, suspension review, and shutdown.

### Moderators

Moderators should receive only the permissions required to review flags, move and close topics, act on harmful content, warn or silence accounts, and escalate serious matters. Moderator status does not imply server, DNS, GitHub, Vercel, Sanity, billing, or backup access.

### Members

Members may create and reply according to category and trust permissions. Members must not be encouraged to disclose sensitive immigration, health, financial, identity, or safeguarding information.

### Integration identities

`forum-metadata` is a dedicated non-human, non-staff account used only for restricted metadata reading. It must not post or represent a real person.

`forum-publisher` is a separate non-human account used only for controlled companion-topic creation. It is non-admin, non-moderator, locked at Trust Level 0, and belongs to `forum-publishers`.

The `forum-publishers` group may create topics in categories 10 and 11. General categories require Trust Level 1 for creation, so the publisher cannot create topics there. Metadata and publisher credentials must never be combined.

## 6. Editorial separation

Sanity owns verified editorial content. Discourse owns community discussion.

- News companion topics act as article comments and discussion. They may close.
- Guide companion topics support continuing questions and practical experiences. They should normally remain open.
- Forum contributions never override or amend a Guide automatically.
- Forum contributions are not verified journalism or official guidance.

## 7. Privacy and safety

Before public launch, publish and operationalize:

- Forum privacy notice
- community guidelines
- prohibited-content policy
- reporting and appeal process
- moderation evidence and retention rules
- account deletion or anonymization explanation
- email and notification processing
- backup retention
- incident route

No Facebook or Google tracking scripts, advertising network, or sale of community data is authorized in the current phase.

## 8. Launch gates

Public launch requires at minimum:

- Pankaj and at least two trusted moderators
- tested reporting, warning, silence, suspension, and appeal workflows
- automated native backups and a successful clean restoration test
- tested upgrade procedure
- privacy and community rules
- incident and emergency read-only procedures
- representative mobile and accessibility testing
- registration, activation, recovery, and email delivery proof
- seed content and language guidance
- controlled public-site integration with safe empty and failure states

## 9. Current incomplete work

- clean restore test
- upgrade test
- formal monitoring
- final retention and privacy decisions
- moderator staffing and training
- language-tag design
- public activation decision
- email template tone and language polishing
- transition from pilot hostname/status to approved production presentation


## Category approval and future-owner routine

Creating a category in Discourse never makes the category eligible for nepali.no automatically. Future owners must classify every new category explicitly as Forum-only, News companion, Guide companion, related-topic eligible, homepage-feed eligible, or excluded.

Current role policy:

- News companion topics: category 10, News Discussions
- Guide companion topics: category 11, Questions about Guides
- Curated related topics: categories 5 to 9
- Future homepage discussion feed: categories 10 and 11 only, subject to reverse verification against eligible Sanity content
- Administrative and excluded categories: Site Feedback (2), Staff (3), and Forum Information and Announcements (4)

When a new category is proposed:

1. Record its numeric ID, name, slug, visibility, purpose, and moderator responsibility.
2. Review privacy, safeguarding, moderation capacity, and whether homepage promotion is appropriate.
3. Decide separately whether the category is eligible for content-linked topics and for the homepage feed.
4. Update only the relevant server-controlled policy. Category creation or public visibility in Discourse is never sufficient approval.
5. Add tests proving the new category is accepted only for its intended role and that administrative categories remain excluded.
6. Deploy through the protected pull-request workflow and verify the exact policy diff, Forum tests, Astro Check, and production build.
7. Verify production behavior without exposing credentials or enabling unrelated categories.
8. Update this document with the decision, rationale, approval date, and any special moderation requirements.

If a category is renamed, its numeric ID remains authoritative. If a category is deleted, repurposed, made private, or becomes unsuitable, remove it from all applicable policies through the same reviewed process. An emergency exclusion may be deployed immediately by removing the ID, while preserving the audit trail in Git.


## Automatic companion-topic governance

Automatic companion-topic creation is opt-in. Publishing or updating content does not create a Forum topic unless the editor selected automatic mode and the content is eligible.

News must be published and not future-dated. Guides must be active. Existing companion relationships always prevent duplicate creation. Manual mode requires an editor-approved existing topic relationship.

The operational automation uses a separate least-privileged Forum publisher identity, signed Sanity webhook delivery, authoritative server-side document re-fetching, idempotent revision-guarded claims, server-owned category mapping, controlled recovery, and non-sensitive failure codes. The existing read-only metadata credential must not be reused for topic creation.

Unpublishing, archiving, title changes, or mode changes must never automatically delete community contributions. Any closing, unlisting, renaming, or archival action in Discourse requires a separately governed operational decision.


## Webhook recovery and reconciliation

Sanity webhook delivery may be repeated, delayed, or received out of order. The publishing workflow therefore re-fetches authoritative content, uses revision-guarded claims, records a bounded attempt identifier, and treats an uncertain post-publication write-back as a manual reconciliation case. Operators must inspect Sanity and Discourse before retrying any document marked as creating, created without a relationship, or failed after an uncertain provider response.


## Verified automation and preservation rules

Production synthetic proofs created Guide topic 17 in category 11 and News topic 18 in category 10. Both were authored by `forum-publisher`, used Norwegian templates because the source language was `nb`, and wrote durable topic relationships and completed workflow state back to Sanity.

Completed attempt IDs, timestamps, and topic relationships are operational audit evidence. Future owners must not clear them casually. A document with an uncertain publishing result, an in-progress claim, or a created topic without confirmed write-back requires inspection of both systems before any retry.

Editorial retirement and community preservation are separate decisions:

- archived Guides may disappear from public Guide routes while their Forum topics remain
- future-dated or unpublished News may disappear from public News routes while their Forum topics remain
- automatic deletion, closing, unlisting, or renaming of community discussion is prohibited
- moderation or lifecycle actions in Discourse require a separately authorized operational decision

The browser never controls category IDs, publisher identity, automation status, attempt IDs, or provider credentials. Public Forum panels remain disabled until the final hostname and presentation contract are separately approved.
