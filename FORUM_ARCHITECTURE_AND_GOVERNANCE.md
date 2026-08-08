# Forum Architecture and Governance

**Status:** Discourse selected; private pilot operational
**Host:** Gigahost, Norway
**Last reviewed:** 8 August 2026

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
- English application interface during pilot
- topics and replies may use Nepali, Norwegian, or English
- Chat disabled
- ordinary members cannot initiate personal messages
- synthetic or controlled data only during technical validation
- no real community launch authorization yet

## 4. Current categories

Administrative:

- Staff
- Forum Information and Announcements
- Site Feedback

Member discussion:

- Questions and Mutual Help
- Living in Norway
- Work and Education
- Family and Everyday Life
- Community and Culture

Do not create additional categories merely to make the Forum appear populated. Use tags and merge inactive categories when appropriate.

## 5. Roles

### Project owner and administrator

Pankaj retains final authority for platform policy, administrators, moderators, privacy, backups, integrations, production launch, serious incidents, suspension review, and shutdown.

### Moderators

Moderators should receive only the permissions required to review flags, move and close topics, act on harmful content, warn or silence accounts, and escalate serious matters. Moderator status does not imply server, DNS, GitHub, Vercel, Sanity, billing, or backup access.

### Members

Members may create and reply according to category and trust permissions. Members must not be encouraged to disclose sensitive immigration, health, financial, identity, or safeguarding information.

### Integration identity

`forum-metadata` is a dedicated non-human, non-staff account used only for restricted metadata reading. It must not post or represent a real person.

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
