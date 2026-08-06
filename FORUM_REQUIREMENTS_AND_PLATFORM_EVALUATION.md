# nepali.no Forum Requirements and Platform Evaluation

**Status:** Draft for review, no platform selected or provisioned
**Prepared:** 6 August 2026
**Project owner:** Pankaj Kafley
**Current repository checkpoint:** `aea287a document completed Translation Module phase one (#6)`
**Decision stage:** Requirements and proof-of-concept planning only

## 1. Executive decision summary

nepali.no should add a moderated community forum as a separate service only after operational, language, privacy, and recovery requirements are proven.

This document does **not** authorize installation, DNS changes, account creation, database provisioning, public launch, or homepage activation.

### Provisional recommendation

Run a controlled, private proof of concept for **Discourse first**, while conducting a smaller parallel NodeBB comparison before making the final platform decision. The controlled pilot and limited Phase 1 launch may use an English forum interface.

Reasoning:

- Discourse is the strongest candidate for moderation governance, trust levels, flag review, category permissions, durable asynchronous discussion, and operational documentation.
- NodeBB is the strongest alternative because it is mobile-ready, Node.js-based, offers granular roles and permissions, and has a mature Transifex localization workflow. Norwegian Bokmål is currently reported as complete in NodeBB's public localization project.
- Flarum is attractive and lightweight, but its extension-dependent model creates greater language, upgrade, and maintenance risk. The available Nepali language pack is community-maintained, unverified, and publicly described as searching for a maintainer.
- None of the three candidates currently provides a production-ready Nepali interface without substantial nepali.no translation and proofreading work.

### Phase 1 language decision

The controlled pilot and limited Phase 1 forum may use **English as the forum application's interface language**.

Members may write topics and replies in Nepali, Norwegian, or English. Every new topic must have a language designation.

The nepali.no website must provide Nepali and Norwegian forum entry points and essential orientation, including:

- forum introduction
- community-content disclaimer
- community-guideline summary
- privacy summary
- reporting guidance
- support and moderator contact route
- explanation that forum discussions are not verified public guidance

Full Nepali and Norwegian forum-interface localization is a later milestone and is not a prerequisite for the controlled pilot or limited Phase 1 launch.

Localization remains an important platform and maintenance consideration:

- Discourse's public translation dashboard reports Nepali at 0% and not yet included, while Norwegian Bokmål is incomplete.
- NodeBB's public Transifex project shows Norwegian Bokmål at 100%, but Nepali is not listed among the 72 available languages.
- Flarum has a Nepali language-pack repository, but the package is searching for a maintainer, contributions are not verified, adoption is extremely low, and compatibility information is uncertain.

The Phase 1 English-interface limitation must be disclosed clearly, tested with representative users, and supported by bilingual assistance from Pankaj and moderators.

## 2. Purpose

The forum will provide a moderated community space where people can exchange experiences, ask questions, discuss community matters, and participate in durable conversations outside surveillance-driven social networks.

The forum is not:

- a replacement for News
- a replacement for Public Information Guides
- a replacement for the Events archive
- a self-service Community Directory
- an official Norwegian public service
- an emergency service
- a private case-management service
- a child-focused social network
- an unrestricted advertising marketplace
- an extension of the Translation Editor

## 3. Governance principles

The forum must follow these principles from the first proof of concept:

1. **Separate service:** separate application, database, accounts, sessions, backups, moderation, and privacy documentation.
2. **Public-benefit purpose:** community value before engagement metrics.
3. **Human moderation:** automated tools may assist but never make final high-impact moderation decisions alone.
4. **Least privilege:** moderators and integrations receive only the access needed for their duties.
5. **Editorial separation:** community discussion never becomes verified guidance automatically.
6. **Privacy by design:** no Facebook or Google tracking scripts in the current public-benefit phase.
7. **Mobile first:** the majority of expected visitors use mobile devices.
8. **Language dignity:** Nepali must be treated as a first-class interface requirement, not merely a content language.
9. **Operational realism:** do not launch capabilities that the organization cannot moderate, back up, restore, or support.
10. **Reversible rollout:** pilot, measure, correct, or withdraw without harming the public site.

## 4. Service architecture boundary

Recommended public architecture:

```text
nepali.no public application
    |
    | controlled links only
    v
forum.nepali.no
    |
    v
separate forum application and database
```

The forum must not use:

- the Sanity `production` dataset
- the private Sanity `submissions` dataset
- the Translation Editor session
- the Translation GitHub App
- the public site's Resend or Sanity write tokens without a separate reviewed design
- automatic imports of private Event or Directory submission data

### Initial integration model

Phase 1 integration should use ordinary links only:

- nepali.no navigation may link to the forum after launch readiness is approved.
- News and Public Information may later store one optional, editorially approved public forum-topic URL.
- The homepage may later show a limited discussion section only when the forum is operational and enough useful public topics exist.

Do not initially implement:

- embedded forum comments under News articles
- shared database
- automatic forum-account creation from nepali.no
- automatic publication of forum posts on nepali.no
- automatic creation of News or Guides from forum content
- bidirectional content synchronization

## 5. People, roles, and authority

### 5.1 Pankaj, administrator

Pankaj remains final authority for:

- platform policy
- categories
- moderator appointments
- moderator permission scope
- account suspension and restoration
- privacy and retention decisions
- backups and restoration
- integrations
- production launch and rollback
- serious incident response

### 5.2 Trusted moderators

Minimum launch target: **Pankaj plus two trusted moderators**.

Moderator permissions should support:

- reviewing flags and reports
- hiding or removing posts
- moving topics
- closing and reopening topics
- applying slow mode where supported
- warning users
- temporarily silencing or restricting accounts
- escalating suspension, legal, safeguarding, or security cases to Pankaj
- recording a moderation reason

Moderators should not automatically receive:

- server access
- database access
- backup access
- billing access
- DNS access
- GitHub access
- Vercel access
- Sanity access
- Translation Editor access
- unrestricted administrator privileges

### 5.3 Registered members

Members may, subject to trust and category permissions:

- create topics
- reply
- react or like
- flag content
- edit their own recent posts
- manage notification preferences
- mute or ignore users where supported
- download or request access to their account data where required

### 5.4 Public visitors

Public visitors may:

- read public categories and topics
- search public discussions
- follow controlled links to verified nepali.no content

Registration should be required to post, react, or report.

## 6. Account model

### Mandatory

- email registration
- email verification before posting
- unique username
- optional display name with clear policy
- secure password reset
- session revocation
- administrator suspension
- documented account deletion or anonymization
- rate limiting and spam protection
- terms and privacy acceptance
- age-policy statement

### Recommended launch defaults

- no anonymous posting
- no Facebook login
- no Google login
- no automatic shared login with nepali.no
- no imported Translation Editor identity
- no private messaging at launch
- public profiles limited to necessary information
- no mandatory real-name policy
- no public email address
- no date of birth unless legally and operationally justified

### Deferred

- single sign-on with nepali.no
- organization-verified accounts
- social login
- passkeys
- private groups created by ordinary users
- member invitations

## 7. Language requirements

### 7.1 Phase 1 interface language

The controlled pilot and limited Phase 1 launch may use:

- English forum interface
- English administration and moderation interface

The English-interface limitation must be stated clearly on nepali.no and in the forum orientation material.

The pilot must test whether likely early users can complete the following tasks without advanced English:

- registration
- email verification
- login
- password recovery
- topic creation
- reply creation
- reporting or flagging
- notification management
- account closure request

Pankaj and moderators must be able to provide assistance in Nepali and Norwegian.

### 7.2 Localized nepali.no doorway and essential guidance

The following information must be available in Nepali and Norwegian even when the forum application is in English:

- forum introduction and purpose
- community-content disclaimer
- community-guideline summary
- prohibited-content summary
- privacy summary
- reporting instructions
- moderator and support contact route
- suspension and appeal contact explanation
- link to verified Public Information and official authorities

These texts may initially live on nepali.no and as prominently linked or pinned forum topics.

### 7.3 English workflow and safety review

The proof of concept must test the English versions of:

- registration
- login
- email verification
- password reset
- account settings
- notification preferences
- topic creation
- reply composer
- reporting and flagging
- warning and suspension notices
- privacy and consent screens
- moderator queue
- moderator actions
- administrator safety settings
- transactional email subjects and bodies
- digest emails
- error states
- mobile menus
- accessibility labels
- plugins selected for launch

Any critical workflow that representative pilot users cannot understand must receive localized help, platform customization, or a launch-blocking correction.

### 7.4 User-generated content languages

Members may write in:

- Nepali
- Norwegian
- English

Every new topic should have a language designation through a mandatory tag, category convention, or equivalent platform mechanism.

The forum must not promise automatic translation of every post.

### 7.5 Translation governance

- Pankaj approves localized Nepali and Norwegian forum doorway and guidance wording.
- Proofreaders may assist without receiving infrastructure access.
- Full forum-interface localization is a later milestone after platform selection and operational proof.
- Platform updates must include a review of changes that affect localized guidance or future locale files.
- Plugin installation requires an English usability and future-localization review.
- English-only critical workflows do not automatically block the pilot, but they must be tested and supported with clear bilingual assistance.
- Full Nepali or Norwegian interface work should prioritize registration, recovery, posting, reporting, notifications, and emails before obscure administrative settings.

## 8. Initial content model

Launch with a small number of categories to avoid an empty appearance.

### Proposed public categories

1. **Living in Norway**
   - personal experiences
   - practical community questions
   - visible disclaimer separating discussion from verified guidance

2. **Work and education**
   - work experience
   - qualifications
   - study and training
   - no unverified job advertisements at initial launch

3. **Events and community activities**
   - participation and follow-up discussion
   - not a replacement for the governed Events archive

4. **Nepali language and culture**
   - language
   - literature
   - traditions
   - intergenerational learning

5. **Organizations and community initiatives**
   - nonprofit and community projects
   - not an unrestricted promotion or commercial channel

6. **Feedback about nepali.no**
   - platform suggestions
   - usability feedback
   - support questions that do not expose private information

### Private staff category

7. **Staff and moderation**
   - moderator coordination
   - policies
   - incident handling
   - private operational notes

### Category design rules

- Start with no more than six public categories.
- Use tags for cross-cutting language and topic labels.
- Seed every public category before promotion.
- Merge or remove inactive categories.
- Review category names in Nepali and Norwegian before launch.

## 9. Community-content disclaimer

A prominent forum statement should communicate:

> Community discussions contain personal experiences and opinions. They are not verified public guidance from nepali.no or a Norwegian authority. For current rules and individual decisions, consult the responsible official source.

Sensitive practical discussions should link to relevant Public Information Guides or official authorities where appropriate.

## 10. Moderation requirements

### Mandatory capabilities

- flag or report a post
- flag or report a user where supported
- spam review
- moderator queue
- moderator notes or history
- topic close and reopen
- topic move
- post hide and remove
- account silence or temporary restriction
- account suspension
- IP or device abuse controls where legally and operationally appropriate
- audit trail for staff actions
- category-level permissions
- slow mode or equivalent rate control
- keyword or link controls
- appeal or contact route

### Moderation policy

Before public launch, publish:

- community guidelines
- prohibited-content policy
- moderation process
- reporting instructions
- escalation route
- appeal or reconsideration route
- enforcement range
- privacy and evidence-handling note

### High-risk content

The policy must specifically address:

- threats or encouragement of violence
- targeted harassment
- hate content
- fraud and scams
- doxxing and private personal data
- impersonation
- medical, legal, welfare, and immigration misinformation
- dangerous instructions
- exploitation or safeguarding concerns
- copyright infringement
- repeat spam

Do not rely on a generic rule such as “be nice” alone.

## 11. Private messaging

Private messaging should be disabled at launch.

Reasons:

- private abuse is harder for moderators to detect
- users may send sensitive immigration, employment, financial, or family information
- safeguarding and evidence-handling responsibilities increase
- moderation staffing is initially limited

Private messaging may be reconsidered later only after:

- reporting and moderator access behavior is understood
- privacy documentation is updated
- retention is documented
- abuse and blocking tools are tested
- moderator availability is proven

## 12. Privacy and data protection

### Mandatory documentation

- forum-specific privacy notice
- controller identity and contact route
- purposes and legal basis
- account-data categories
- content visibility
- IP and log handling
- cookie and session behavior
- email and notification processing
- third-party processors
- retention periods
- account deletion versus anonymization
- moderation evidence retention
- backup retention
- data access and correction route
- incident contact route

### Data minimization

Do not collect data merely because the platform offers a field.

Default public profile should not require:

- legal name
- address
- phone number
- date of birth
- employer
- immigration status
- public email

### Tracking and advertising

Current phase:

- no Facebook scripts
- no Google advertising or tracking scripts
- no third-party advertising network
- no sale of community data
- no unrelated marketing use

A future commercial model requires a separate governance and privacy decision.

## 13. Retention, deletion, and account closure

The selected platform must document and support:

- member-requested account closure
- anonymization versus deletion
- handling of quoted or replied-to content
- moderation evidence retention
- deleted-post visibility to staff
- IP and security-log retention
- backup retention and eventual expiry
- legal-hold or serious-incident exceptions where appropriate

The organization should publish plain-language expectations. “Delete account” must not imply that every quoted or backed-up byte disappears instantly.

## 14. Security requirements

### Mandatory

- maintained supported release
- HTTPS only
- secure cookies
- CSRF protection
- rate limiting
- brute-force protection
- email-verification controls
- administrator MFA where available
- moderator MFA strongly recommended
- least-privilege moderator roles
- off-box backups
- security-update process
- dependency and plugin inventory
- incident logging
- secret storage outside Git
- separate production and proof-of-concept credentials

### Plugin policy

Every plugin or extension requires review of:

- maintainer activity
- security history
- compatibility
- data access
- outbound requests
- cookies or tracking
- localization completeness
- upgrade impact
- backup and restore impact
- operational necessity

Avoid plugins that duplicate core features.

## 15. Backups and recovery

Public launch requires:

- automated database backup
- uploads backup
- configuration backup
- off-server copy
- encryption where appropriate
- retention schedule
- documented restoration steps
- at least one successful restoration test
- responsible person
- periodic test schedule
- recovery time objective
- recovery point objective

Suggested initial targets:

- recovery point objective: no more than 24 hours of data loss
- recovery time objective: restore basic service within one working day

These are planning targets and must be validated against hosting and staffing.

## 16. Email requirements

The proof of concept must test:

- verification email
- password reset
- mention and reply notification
- digest email
- suspension or account notice
- unsubscribe and preference links
- Nepali rendering
- Norwegian rendering
- sender reputation setup
- SPF, DKIM, and DMARC
- bounce handling

Email is operationally critical. A forum with broken verification or recovery email is not launch-ready.

## 17. Accessibility and mobile requirements

Mandatory checks:

- responsive layout at narrow widths
- no horizontal overflow
- keyboard navigation
- visible focus
- meaningful labels
- screen-reader-friendly forms
- adequate touch targets
- readable Devanagari
- sufficient contrast
- scalable text
- accessible error messages
- reduced-motion compatibility where relevant
- accessible moderation and reporting workflows

Test both member and moderator experiences on mobile.

## 18. Homepage and nepali.no integration

The homepage forum area remains hidden or inactive until launch criteria are met.

When activated, it may show:

- a small number of approved recent or featured public topics
- topic title
- category
- language
- reply count
- last activity
- controlled link to forum.nepali.no

It should not show:

- private categories
- hidden or deleted topics
- flagged content awaiting review
- user email or private profile details
- raw HTML excerpts
- automatic “most controversial” content

Empty state:

- hide the section rather than show a large empty Coming Soon block

News and Guide links:

- optional
- editorially approved
- public destination only
- safe failure if topic is hidden, deleted, private, or unavailable
- visible disclaimer that discussion is community content

## 19. Operational readiness

Before launch, identify:

- administrator
- at least two moderators
- backup owner
- privacy contact
- incident escalation contact
- infrastructure maintenance owner
- localization owner
- weekend or holiday response expectations

Define:

- ordinary moderation response target
- urgent abuse response target
- security incident response target
- moderator handover process
- moderator removal process
- emergency read-only or shutdown procedure

## 20. Metrics and success criteria

Do not optimize for raw post volume.

Useful launch metrics:

- active members
- unanswered topics
- time to first helpful reply
- reports per 100 posts
- moderator response time
- spam rate
- suspended accounts
- returning contributors
- percentage of public topics with language label
- localization defects
- mobile usability defects
- backup success
- restoration-test status

Avoid invasive individual tracking.

## 21. Explicitly deferred features

- private messaging
- anonymous posting
- child-focused areas
- classifieds or marketplace
- payments
- advertising network integration
- automatic social login
- automatic translation of user content
- AI-only moderation
- automatic publication on nepali.no
- embedded comments under articles
- shared account database
- shared session with Translation Editor
- unrestricted user-created groups
- video hosting
- live chat as the primary discussion model

## 22. Platform evaluation criteria and weights

Scoring scale:

- 1: poor or high risk
- 2: weak
- 3: acceptable with work
- 4: strong
- 5: excellent

Weights reflect nepali.no priorities.

| Criterion | Weight | Discourse | NodeBB | Flarum |
|---|---:|---:|---:|---:|
| Moderation and reporting maturity | 18 | 5 | 4 | 3 |
| Nepali localization feasibility for later phases | 8 | 2 | 2 | 2 |
| English Phase 1 usability and localized doorway | 8 | 5 | 5 | 4 |
| Norwegian localization readiness for later phases | 6 | 3 | 5 | 4 |
| Account safety and recovery | 8 | 5 | 4 | 3 |
| Spam and trust controls | 10 | 5 | 4 | 3 |
| Mobile and accessibility baseline | 8 | 4 | 4 | 4 |
| Backup and recovery tooling | 8 | 5 | 4 | 3 |
| Upgrade and maintenance predictability | 8 | 4 | 4 | 2 |
| Privacy and deployment control | 6 | 4 | 4 | 4 |
| API and safe integration | 4 | 5 | 5 | 4 |
| Cost flexibility | 4 | 3 | 4 | 5 |
| Documentation and support ecosystem | 4 | 5 | 4 | 3 |

Indicative weighted scores:

- Discourse: 86.8 / 100
- NodeBB: 80.4 / 100
- Flarum: 64.8 / 100

These are provisional scores. The localization proof of concept may materially change the result.

## 23. Candidate assessment: Discourse

### Strengths

- mature trust-level model
- detailed moderation and permissions model
- strong flag-review workflows
- durable category and topic architecture
- comprehensive API
- extensive operational documentation
- supported Docker self-hosting path
- managed hosting option
- documented backup and restoration procedures
- strong anti-spam and community-governance conventions

### Weaknesses

- heavier operational footprint than Flarum
- Ruby, PostgreSQL, Redis, and Docker stack differs from the existing Astro and Sanity stack
- official managed plans can be expensive for a small nonprofit
- Nepali is publicly reported at 0% and not shipped
- Norwegian Bokmål is incomplete in the public translation dashboard
- broad translation surface across core, emails, plugins, and themes

### Hosting notes

Official self-hosting is Docker-based on 64-bit Linux. Public documentation lists a minimum of 1 GB RAM with swap and 10 GB disk, with more resources recommended. Official managed hosting currently advertises limited Free, Pro, Business, and Enterprise options, with Pro at USD 100 per month and Business at USD 500 per month at the time of review.

### nepali.no assessment

Best moderation and governance fit, but localization proof is mandatory. A custom Nepali locale maintenance process may be needed.

## 24. Candidate assessment: NodeBB

### Strengths

- Node.js-based
- responsive and real-time
- strong roles and category permissions
- REST API and plugin framework
- multiple database options
- Transifex localization process
- Norwegian Bokmål currently listed at 100%
- official managed hosting begins at a lower price than Discourse
- nonprofit pricing inquiries are invited
- minimum published hardware requirement is low

### Weaknesses

- Nepali is not listed in the current public Transifex language set
- private chat and real-time social features may need deliberate limitation
- plugin quality and maintenance require review
- operational and moderation guidance is less centralized than Discourse
- self-hosting still requires database, upgrades, email, backups, security, and monitoring

### Hosting notes

Official managed hosting currently advertises Starter at USD 20 per month, Hamlet at USD 100, Village at USD 250, and City at USD 750. Starter includes weekly backups; higher plans advertise daily backups. Self-hosting is open source.

### nepali.no assessment

Strong alternative and potentially better fit with existing JavaScript expertise. The Norwegian localization advantage is meaningful. Nepali locale creation and maintenance remain mandatory.

## 25. Candidate assessment: Flarum

### Strengths

- visually clean and lightweight
- PHP and MySQL or MariaDB hosting is widely available
- highly customizable
- group permissions and built-in flagging
- open source and MIT licensed
- potentially low hosting cost

### Weaknesses

- extension-dependent architecture increases maintenance risk
- extension manager can install arbitrary Composer packages and therefore requires very trusted administrators
- third-party extension localization is not guaranteed
- upgrade compatibility across extensions requires careful management
- current 2.0 line is still presented as release-candidate territory
- available Nepali language pack has very low adoption, seeks a maintainer, and warns that contributions are not verified
- public compatibility information for the Nepali package is uncertain

### nepali.no assessment

Not recommended as the first proof-of-concept candidate. The low infrastructure cost is outweighed by localization and extension-governance risk.

## 26. Cost model

### Managed hosting

Managed hosting reduces infrastructure burden but does not remove:

- moderation
- privacy decisions
- localization
- community guidelines
- incident response
- account support
- editorial integration

Current public prices reviewed:

- Discourse Pro: USD 100/month
- Discourse Business: USD 500/month
- NodeBB Starter: USD 20/month
- NodeBB Hamlet: USD 100/month
- NodeBB higher plans: USD 250 and USD 750/month

Free or nonprofit arrangements must be confirmed directly and should not be assumed as permanent.

### Self-hosting

Self-hosting cost includes:

- VPS
- email delivery
- object storage if used
- backup storage
- monitoring
- security updates
- server administration
- restore testing
- incident response
- engineering time

A low VPS invoice can hide substantial operating labor.

### Recommendation

For proof of concept, use disposable non-production infrastructure. For production, compare annual total operating cost rather than monthly server price alone.

## 27. Proof-of-concept plan

### Stage A: English-interface and localized-doorway review

Before full installation:

1. List the English member and moderator workflows required for the pilot.
2. Test whether representative early users can complete registration, recovery, posting, reporting, and notification tasks.
3. Draft Nepali and Norwegian forum introduction, disclaimer, privacy summary, reporting guidance, and support information on nepali.no.
4. Design mandatory topic-language labels for Nepali, Norwegian, and English.
5. Identify the highest-priority forum strings for later localization.
6. Estimate later Nepali and Norwegian translation and proofreading effort without making it a Phase 1 launch dependency.

### Stage B: private Discourse proof of concept

Create a disposable, private instance with:

- no public SEO indexing
- test email domain or sandbox
- synthetic accounts only
- no real member data
- minimal plugins
- English interface
- localized Nepali and Norwegian doorway and pinned guidance
- proposed categories
- private messaging disabled
- registration restricted

Test:

- registration
- verification
- recovery
- mobile
- reporting
- flag review
- silence and suspension
- category permissions
- backup
- restoration
- upgrade
- English transactional emails and bilingual help documentation
- moderator workflow

### Stage C: NodeBB comparison spike

Create either a smaller disposable instance or structured demonstration review focused on:

- English interface usability
- future Nepali locale creation path
- Norwegian completeness for a later phase
- moderation queue
- role permissions
- disabling chat and private messaging
- backup and restore
- managed-hosting operational boundaries
- mobile moderator experience

### Stage D: decision review

Select only after reviewing:

- localization burden
- moderator usability
- recovery proof
- annual cost
- maintenance ownership
- privacy impact
- plugin dependency
- user experience

## 28. Proof-of-concept acceptance criteria

A candidate passes only if:

- the English interface is usable by representative pilot users
- Nepali and Norwegian forum entry points and essential guidance are ready on nepali.no
- topic-language designation works for Nepali, Norwegian, and English
- the English-interface limitation is disclosed clearly
- bilingual help is available
- the later Nepali and Norwegian localization path is understood
- registration and recovery work
- reporting and moderation work on mobile
- private messaging can be disabled
- categories and permissions behave correctly
- backup completes
- restoration succeeds
- update procedure is documented
- no third-party tracking script is introduced
- privacy data flows are understood
- responsible operators can use the system without developer intervention for ordinary moderation

## 29. Launch gates

Do not publicly launch until all are true:

- platform decision recorded
- hosting contract and data-processing terms reviewed
- forum domain configured
- privacy notice published
- community guidelines published
- moderation policy published
- Pankaj plus two moderators ready
- administrator and moderators use MFA where available
- English member and moderator interface reviewed
- Nepali and Norwegian doorway and essential guidance reviewed
- English email templates and bilingual help guidance reviewed
- registration and recovery tested
- reporting and escalation tested
- backups automated
- restoration test passed
- incident procedure documented
- seed topics prepared
- mobile and accessibility checks passed
- homepage empty-state behavior implemented
- rollback or shutdown plan tested

## 30. Rollback and shutdown

The forum must support:

- temporary registration closure
- temporary read-only mode
- emergency hiding of homepage links
- disabling optional News and Guide discussion links
- export and backup before shutdown
- safe user communication
- preservation or deletion according to policy
- DNS rollback

The nepali.no public site must continue operating if the forum is unavailable.

## 31. Recommendation

### Recommended next action

Proceed with:

1. an English-interface usability and localized-doorway review
2. a private disposable Discourse proof of concept
3. a smaller NodeBB comparison focused on moderation, English usability, future localization, and operating cost
4. no Flarum proof of concept unless new evidence resolves the language-pack and extension-maintenance risks

### Why Discourse leads

Discourse currently offers the strongest governance and moderation fit for a public-benefit community where discussion may include advice, immigration experiences, employment questions, and sensitive interpersonal disputes.

### Why the decision remains conditional

Discourse may be selected for a limited Phase 1 production launch with an English interface if usability, moderation, recovery, backup, privacy, and bilingual doorway requirements pass. Full Nepali and Norwegian forum-interface localization remains a later milestone. If Discourse's long-term locale workflow proves unsustainable, NodeBB may become the better overall choice.

## 32. Decisions requiring Pankaj approval

Before proof-of-concept provisioning:

- approve the proposed role model
- approve private messaging disabled at launch
- approve public reading and verified registration
- approve minimum two-moderator launch gate
- approve the six-category starting structure
- approve an English forum interface for the controlled pilot and limited Phase 1 launch
- approve Nepali and Norwegian doorway and essential-guidance requirements
- approve Discourse-first plus NodeBB comparison
- approve a disposable proof-of-concept budget ceiling
- decide whether self-hosted or managed proof of concept should be tested first

## 33. Source notes

Reviewed 6 August 2026.

Discourse:

- Pricing: https://www.discourse.org/pricing
- Self-hosting index: https://meta.discourse.org/c/documentation/self-hosting/55
- Installation requirements: https://github.com/discourse/discourse/blob/main/docs/INSTALL.md
- Cloud installation: https://github.com/discourse/discourse/blob/main/docs/INSTALL-cloud.md
- Trust levels: https://meta.discourse.org/t/discourse-trust-levels-a-detailed-explanation/396792
- Trust-level permission reference: https://meta.discourse.org/t/trust-level-permissions-reference/224824
- Translation dashboard: https://translations.discourse.org/
- Nepali translation status: https://translations.discourse.org/languages/ne
- API documentation: https://docs.discourse.org/

NodeBB:

- Pricing: https://nodebb.org/pricing
- Product and moderation features: https://nodebb.org/product
- Documentation: https://docs.nodebb.org/
- Installation by operating system: https://docs.nodebb.org/installing/os/
- Repository and requirements: https://github.com/NodeBB/NodeBB
- Localization project: https://app.transifex.com/nodebb/nodebb/languages/

Flarum:

- Project: https://flarum.org/
- Installation: https://docs.flarum.org/install/
- Extensions: https://docs.flarum.org/extensions/
- Languages: https://docs.flarum.org/languages/
- Nepali language pack: https://next.flarum.org/extensions/flarum-lang/nepali
- Nepali language repository: https://github.com/flarum-lang/nepali

## 34. Current decision status

- Requirements draft: complete
- Platform selected: no
- Proof of concept provisioned: no
- DNS changed: no
- forum database created: no
- real member data collected: no
- homepage forum section activated: no
- public launch authorized: no

## 35. Discourse proof-of-concept implementation checkpoint

**Checkpoint date:** 6 August 2026
**Status:** Infrastructure installed and technically healthy; administrator registration and operational evaluation remain pending.

### 35.1 Implementation summary

A disposable self-hosted Discourse proof of concept is operational on Gigahost AS infrastructure in Sandefjord, Norway.

VPS configuration:

- Gigahost NO DC2
- 2 vCPU
- 4 GB RAM
- 40 GB NVMe
- Ubuntu 24.04 LTS x86-64
- hourly billing
- automatic Gigahost backup enabled
- temporary hostname `forum-poc.nepali.no`

The service remains separate from Sanity, private submissions, the Translation Module, and the nepali.no public application.

### 35.2 Secured operating-system baseline

Completed before Docker installation:

- full Ubuntu update
- controlled reboot into the current kernel
- no pending package upgrades
- no failed services
- Europe/Oslo timezone and synchronized clock
- dedicated Ed25519 SSH key
- ordinary `pankaj` administrative account
- verified `sudo`
- direct root SSH disabled
- SSH password authentication disabled
- keyboard-interactive authentication disabled
- SSH restricted to `pankaj`
- `MaxAuthTries 3`
- `LoginGraceTime 30`
- UFW default incoming deny
- only TCP 22, 80, and 443 allowed inbound

Gigahost baseline snapshot:

- `forum-poc-01-secured-baseline-2026-08-06`

The snapshot predates Docker and Discourse. It is not a substitute for Discourse-native backups.

### 35.3 Discourse installation provenance

Discourse was installed through the officially supported Docker architecture.

Recorded installer provenance:

- repository: official `discourse/discourse_docker`
- upstream commit: `e071c2c8ebf8a93c1fba4e16fbb7168a2a9201bd`
- installer SHA-256: `77df1fba636b84d242e81e00c887af3f7754df84aa48680c49f69041528b14cb`
- commit-pinned and initial downloads matched byte-for-byte
- Bash syntax validation passed

Important paths:

- `/var/discourse`
- `/var/discourse/containers/app.yml`
- Docker container `app`

`app.yml` is owned by root and restricted to mode `600`.

### 35.4 Email configuration and security incident

Non-secret SMTP configuration:

- host `smtp.resend.com`
- port 587
- username `resend`
- STARTTLS
- sender `forum-test@notifications.nepali.no`

A separate sending-only Resend credential is used for the proof of concept.

During the first container build, installer output printed the SMTP credential in a generated Docker command. The credential was immediately treated as compromised.

Containment completed:

1. exposed credential revoked
2. replacement restricted credential created and stored securely
3. protected `app.yml` updated interactively
4. YAML and required-setting checks passed without printing the secret
5. container rebuilt with output redirected to a root-only log
6. running container verified internally to use exactly one credential matching the rotated configuration
7. sensitive rebuild log deleted

No credential value may be recorded in Git, Markdown, screenshots, chat, shell history, or handover documents.

### 35.5 Technical health proof

Verified after rebuild:

- Docker container `app` running
- ports 80 and 443 published on IPv4 and IPv6
- `https://forum-poc.nepali.no/` returns HTTP 200
- TLS verification result 0
- certificate subject `forum-poc.nepali.no`
- Let's Encrypt certificate active
- certificate validity 6 August through 4 November 2026
- no failed systemd services
- public page displays the initial Discourse administrator registration screen

### 35.6 Current status

Completed:

- VPS provisioning
- DNS
- operating-system hardening
- firewall
- baseline snapshot
- Docker and Discourse
- HTTPS
- SMTP transport validation
- SMTP credential rotation and containment

Pending:

- first administrator account
- setup wizard
- public-registration restriction
- private-messaging disablement
- search-indexing controls
- categories and language tags
- synthetic moderator and member accounts
- registration and password-recovery email tests
- moderation and reporting tests
- Discourse-native backup
- clean restoration test
- upgrade test
- monitoring and incident procedures
- production decision
- homepage integration
- real user onboarding

### 35.7 Exact next action

Register the first administrator account with a unique Discourse password, then stop at the setup wizard.

Do not invite real users, enable public registration, add plugins, or connect nepali.no.

### 35.8 Decision status

- Discourse selected for production: no
- Gigahost selected for production: no
- disposable proof of concept installed: yes
- HTTPS operational: yes
- administrator account created: no, pending
- synthetic test data only: required
- real member data authorized: no
- homepage forum section active: no
- public launch authorized: no
