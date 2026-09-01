# Forum Architecture and Governance

**Status:** Discourse selected; private pilot operational
**Host:** Gigahost, Norway
**Last reviewed:** 11 August 2026

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
- upgrade-safe visual harmonization with nepali.no and approved production presentation


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

Production synthetic proofs created Guide topic 17 in category 11 and News topic 18 in category 10 using Norwegian templates. After resolution of the 10 August incident, a fresh Nepali News proof created topic 27 in category 10 using the Nepali template. All three were authored by `forum-publisher` and wrote durable topic relationships and completed workflow state back to Sanity. Republishing the already-linked topic 27 fixture for an ordinary editorial homepage change created no duplicate.

Completed attempt IDs, timestamps, and topic relationships are operational audit evidence. Future owners must not clear them casually. A document with an uncertain publishing result, an in-progress claim, or a created topic without confirmed write-back requires inspection of both systems before any retry.

Editorial retirement and community preservation are separate decisions:

- archived Guides may disappear from public Guide routes while their Forum topics remain
- future-dated or unpublished News may disappear from public News routes while their Forum topics remain
- automatic deletion, closing, unlisting, or renaming of community discussion is prohibited
- moderation or lifecycle actions in Discourse require a separately authorized operational decision

The browser never controls category IDs, publisher identity, automation status, attempt IDs, or provider credentials. Public Forum panels remain disabled until the final hostname and presentation contract are separately approved.

## Publishing failure classification and controlled retry governance

A confirmed provider rejection and an uncertain publication outcome require different recovery decisions.

- A confirmed HTTP 422 validation rejection means Discourse rejected the submitted topic and the application received a readable rejection response. Only a bounded safe code may be retained.
- An uncertain result means topic creation cannot be excluded because of timeout, transport failure, unreadable response, malformed success response, or failed final relationship write-back. Operators must inspect both Sanity and Discourse before any retry.
- Attempt IDs, timestamps, failure codes, and topic relationships are audit evidence and must not be cleared casually.
- Raw Discourse validation messages must not be copied into Sanity editorial fields, repository documentation, public logs, screenshots, or chat.
- Real editorial content must not be repeatedly republished as a diagnostic mechanism. Prefer a clearly labelled synthetic fixture for controlled end-to-end tests.
- A failed real document may be reset only after an authorized operator confirms that no topic exists, records the previous attempt evidence, verifies the corrected production code, and uses a single controlled retry.

The 10 August 2026 Nepali News incident remains the first production evidence covered by this distinction. No matching topic exists, and the original attempt remains preserved because it was recorded before confirmed rejection classification was deployed.

The incident's technical cause is resolved. A controlled synthetic rejection proved the safe `forum-publishing-rejected-post` classification, and read-only Discourse comparison showed that Nepali content itself was valid. Trust Level 0 host-spam protection rejected the next `nepali.no` link when accumulated use reached the configured threshold. The narrow correction allowlisted only the organization-controlled `nepali.no` domain while preserving the global threshold and all least-privilege properties of `forum-publisher`. A new synthetic Nepali publication then created topic 27 successfully and wrote the relationship back to Sanity. The original real attempt, the failed synthetic classifier fixture, topic 27, and topics 13, 17, and 18 are operational evidence and must not be casually cleared, republished, or deleted.

## 2026-09-01 presentation and social-sharing continuity update

The public-site presentation branch does not enable Forum panels or change Forum governance. `forum.nepali.no` remains the canonical Discourse service, Norwegian Bokmal remains the intended default interface language, and English remains an accessible option. Full Nepali Discourse localization remains deferred.

The next Forum visual milestone must be upgrade-safe and light-first, harmonize principal colors, typography, cards, borders, buttons, and spacing with nepali.no, and include a restrained mobile-safe return link to `https://nepali.no`. Homepage Forum-feed eligibility and content-linked Forum-panel eligibility remain separate explicit policies. A new Discourse category is never eligible merely because it exists.
