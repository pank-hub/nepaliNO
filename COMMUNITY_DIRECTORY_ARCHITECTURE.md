# Community Directory Architecture

## Status

Architecture foundation for the governed nepali.no Community Directory.

This document is authoritative for the directory's public-content boundary, private application boundary, eligibility rules, geography model, moderation workflow, verification language, and sponsorship separation. It must be updated when implementation decisions change.

The Community Directory must not accept genuine public applications until private storage, server-side validation, abuse protection, privacy wording, retention rules, moderation access, and production deployment have been verified.

## Product purpose

The Community Directory helps people discover businesses, professionals, organizations, associations, community initiatives, public-interest services, websites, and digital resources with a meaningful connection to Nepal or people with Nepali connections.

The directory is broader than a Business Directory. Eligible listings may be commercial, nonprofit, voluntary, informational, community-based, or digital.

The directory is governed and moderated. It is not:

- an unrestricted advertising marketplace
- a public business registry
- a review or rating platform
- an endorsement of every listed product or service
- proof of professional authorization
- a substitute for Norwegian public registers
- a backlink directory

## Prototype audit and replacement decision

The original repository prototype used the Sanity document type `businessListing` and assumed that every entry was a commercial business.

The prototype included business-specific fields and wording such as:

- Business Name
- Business Category
- Business Logo
- Verified Business
- Featured Business
- a mandatory City field
- one unstructured Service Area field

A read-only production query performed on 2 August 2026 returned zero `businessListing` documents. No public Business Listing archive, individual route, application form, or published listing URL exists.

The unused prototype may therefore be replaced deliberately with the broader public document type `directoryListing` without migrating production content or preserving old listing URLs.

Historical project documentation describing the earlier Business Listing prototype should remain historically accurate. New milestones should explain the deliberate transition to the Community Directory.

## Language model

Complete public directory languages in Phase 1:

- Nepali: `ne`
- Norwegian Bokmal: `nb`

A limited English application interface may be provided for applicants, following the established Event-submission pattern. This must not enable a complete English public directory or add English globally to the public website.

Keep these concepts separate:

- form interface language
- language used in the submitted source information
- language of the approved public listing
- languages in which the listed entity can serve users
- requested public-output language

Approved Nepali and Norwegian public listings should be stored as separately reviewed and optionally linked `directoryListing` documents.

## Public and private document boundary

### Public approved content

Dataset: `production`

Document type: `directoryListing`

The public document contains only reviewed information intentionally approved for publication.

### Private applications and moderation

Dataset: `submissions`

Planned document type: `directoryListingSubmission`

The private document may contain:

- applicant identity
- private applicant email and telephone
- authority-to-represent declaration
- ownership or leadership declaration
- supporting explanation or evidence
- proposed public contact information
- moderation status
- internal notes
- clarification history
- complaint or correction context
- retention metadata
- public conversion metadata

A private application must never publish automatically or create a public listing directly.

Do not create cross-dataset Sanity references. After conversion, store controlled public document IDs and URLs in the private moderation record.

## Eligible listing types

Every approved listing must have one primary listing type. Initial stable internal values:

- `business`
- `professional-service`
- `organization-association`
- `ngo-charity`
- `community-group`
- `public-interest-service`
- `website-digital-resource`
- `other`

An Other type requires an editorial explanation and should be reviewed periodically. Repeated similar Other entries may justify a new stable type.

Listing type is separate from category. For example:

- Listing type: Professional service
- Category: Accounting and finance

or:

- Listing type: Organization or association
- Category: Culture and community

## Initial category model

Categories should use stable, language-independent internal values and translated public labels.

Proposed initial categories:

- `food-restaurants-catering`
- `groceries-retail`
- `legal-services`
- `accounting-tax-finance`
- `cleaning-household-services`
- `construction-repair-property`
- `health-wellbeing`
- `education-language-training`
- `travel-tourism`
- `transport-services`
- `logistics-delivery`
- `technology-it`
- `media-communication`
- `beauty-personal-services`
- `culture-community`
- `children-youth-family`
- `sports-recreation`
- `religious-traditional`
- `charity-volunteering-support`
- `business-professional-networks`
- `information-websites-digital-resources`
- `other`

A listing should have one primary category in the first implementation. Optional secondary categories may be considered later only if genuine content demonstrates the need.

## Nepal and Nepali connection model

Directory eligibility depends on a declared and reviewed connection, not on assumptions about names, appearance, language, or background.

Applicants may select one or more connection types:

- `majority-nepali-owned`
- `partly-nepali-owned`
- `nepali-founded`
- `nepali-led`
- `nepal-related-organization`
- `nepali-language-service`
- `nepali-products-food-culture`
- `serves-nepali-community`
- `works-with-nepal`
- `nepal-based-serving-norway`
- `relevant-digital-resource`
- `other`

The applicant must provide a short explanation of the connection. Other always requires an explanation.

### Ownership language

The system must not infer ownership from a person's name, photograph, language, nationality, or perceived background.

The applicant must voluntarily declare the ownership connection and confirm authority to make the claim.

Recommended public wording:

- `majority-nepali-owned`: Nepali-owned
- `partly-nepali-owned`: Partly Nepali-owned

The broader Nepali-owned label should normally be used only for wholly or majority Nepali-owned businesses. Private ownership percentages or owner identities should not be published unless separately justified, permitted, and reviewed.

A business does not need to sell Nepal-related products to qualify as Nepali-owned. A general Norwegian-facing cleaning company, accounting firm, technology company, or other service may qualify through reviewed ownership connection.

A listing that is not Nepali-owned may still qualify through another meaningful connection, such as Nepali-language service, work involving Nepal, community relevance, or Nepal-related products and culture.

## Verification and public labels

Verification means that nepali.no reviewed specified listing information at a recorded time. It must not mean that nepali.no guarantees quality, safety, financial stability, professional competence, legality of every activity, or customer satisfaction.

Public verification should be specific where practical, for example:

- organization identity checked
- public contact details checked
- organization number checked
- declared community connection reviewed
- website ownership or authority checked

Applicants cannot award themselves a Verified label. Verification status, scope, date, reviewer, and internal notes are staff-controlled.

Regulated claims such as lawyer, accountant, healthcare professional, financial adviser, or authorized service must receive appropriate editorial review and should link to relevant official registers when applicable.

## Geography model

Physical location and service coverage are separate concepts.

### Physical presence

A listing may have:

- no public physical location
- one primary public visiting location
- online-only operation

Proposed structured location fields:

- country
- county or `fylke`
- municipality
- city or locality
- street address
- postal code
- public map URL
- permission to publish the visiting address

A city must not be mandatory for online-only resources or nationwide services.

### County values

Use stable internal values for current Norwegian counties and translated display labels. Do not store only free-text county names.

County taxonomy must be reviewed against the current official Norwegian county structure before implementation and updated deliberately if administrative boundaries change.

### Municipality and city

Municipality and city or locality are distinct fields. The first version may use reviewed text values rather than building a complete municipality reference dataset.

Postal code, municipality, city, and county should be checked for obvious inconsistencies during moderation.

### Service coverage

A listing may serve areas beyond its physical address. Initial coverage modes:

- `local-area`
- `selected-municipalities`
- `selected-counties`
- `nationwide-norway`
- `online-norway`
- `norway-and-nepal`
- `nepal`
- `international`
- `other`

Selected counties should use controlled county values. Selected municipalities or other coverage descriptions may initially use reviewed structured text entries.

A business located in Oslo may therefore declare service in Oslo, Akershus, and Buskerud. An online accountant or website may declare nationwide or online coverage without inventing a public city.

## Public contact and private contact separation

Private applicant contact details and proposed public listing contacts must be separate.

Private fields may include:

- applicant name
- private email
- private telephone
- preferred contact language
- relationship to the entity

Proposed public fields may include:

- public email
- public telephone
- website
- public visiting address
- public contact person or role
- social links

Public email, telephone, address, or named contact person requires explicit publication permission and staff review.

Never copy private applicant details into the public listing automatically.

## Organization number and legal identity

A Norwegian organization number is optional because some eligible community initiatives, websites, foreign organizations, or informal groups may not have one.

When supplied:

- normalize it to nine digits
- verify the format server-side
- review it against an appropriate official source
- do not treat its presence alone as proof of quality or endorsement

The public model may display the organization number when appropriate and reviewed.

An applicant without a Norwegian organization number must explain the entity type and basis for inclusion.

## Public content model principles

The public `directoryListing` should support:

- public listing language
- linked translated listing
- public name
- slug
- primary listing type
- primary category
- short summary
- full description
- community-connection labels approved for publication
- service languages
- organization number when appropriate
- website and approved public contacts
- structured physical location
- structured service coverage
- logo with alternative text
- optional cover image with alternative text, caption, and credit
- approved social links
- verification scope and last-verified date
- editorial reviewer
- listing status
- optional featured status
- publication and review metadata
- correction or report-information guidance

The schema must avoid public fields that expose private evidence, applicant identity, internal notes, complaints, or moderation history.

## Listing lifecycle

Recommended public editorial statuses:

- `draft`
- `active`
- `needs-review`
- `temporarily-closed`
- `permanently-closed`
- `suspended`
- `expired`
- `archived`

Only Active listings with valid slugs and eligible public languages should appear in normal public directory results.

Temporarily Closed and Permanently Closed listings should not appear as ordinary active results. A controlled individual page may remain available to prevent confusion and show the reviewed closure state.

Suspended, Expired, and Archived listings should not appear in public archives. Whether an unavailable or historical individual URL remains accessible should be decided deliberately during route implementation.

Recommended review controls:

- published at
- last verified at
- next review due
- editorial reviewer
- verification scope
- internal review notes only in the private moderation record or another explicitly protected operational system

Listings should be reviewed periodically. High-risk or regulated services may require more frequent review.

## Private moderation workflow

Recommended private statuses:

- New
- Under review
- More information requested
- Approved
- Converted to public listing
- Rejected
- Duplicate
- Withdrawn
- Archived

Recommended flow:

1. Applicant submits source information.
2. Server validates and stores a private draft.
3. Staff verifies authority, identity, connection, category, location, contacts, and claims.
4. Staff requests clarification when necessary.
5. Staff approves or rejects the application.
6. Staff creates and edits the public `directoryListing` in `production`.
7. Staff publishes the approved listing deliberately.
8. Staff records the public document ID and URL in the private application.
9. Staff reviews private data for deletion according to the retention policy.

No application may publish automatically.

## Correction, claim, complaint, and removal workflows

The directory must plan for more than new applications.

Required future workflows:

- correction request from the public
- listing claim by an authorized representative
- change of ownership or leadership
- request to remove public contact information
- closure or inactivity report
- complaint about misleading or unsafe information
- duplicate listing resolution
- organization request for withdrawal
- editorial suspension or removal

Claims and corrections must enter private moderation. They must not overwrite public content automatically.

A claimant must demonstrate authority before receiving control over public information. The first version does not require user accounts or owner dashboards.

## Closure and inactivity reporting

Every public listing page should eventually provide a discreet reporting action for:

- permanently closed entity
- temporarily closed entity
- organization or community group that appears inactive
- website or digital service that is no longer available
- moved address
- public contact information that no longer works
- duplicate listing
- incorrect or misleading information
- other correction or concern

Both an authorized owner or representative and an ordinary visitor may submit a report.

The report form must ask for the reporter's relationship to the listing, using stable values such as:

- `owner-authorized-representative`
- `employee-volunteer`
- `customer-service-user`
- `community-member`
- `other`

An owner or representative report may carry stronger evidence, but the claim of authority must still be reviewed. An ordinary visitor report is a useful moderation lead and must not be treated as authoritative without verification.

A report must never automatically change, close, suspend, archive, or unpublish the public listing.

Recommended workflow:

1. The reporter submits a closure, inactivity, or correction report.
2. The server validates and stores the report privately in `submissions`.
3. Staff checks appropriate public sources, official registers, websites, contact details, or contacts the listed entity when appropriate.
4. Staff records findings and decides whether the public listing should remain active, be corrected, be marked temporarily closed, be marked permanently closed, be suspended, or be archived.
5. Staff deliberately updates and publishes the public listing.
6. The private report records the resolution and resolution timestamp.
7. Private reporter information is reviewed for deletion according to the retention policy.

The future private report type should be separate from a new-listing application. Recommended document type:

- `directoryListingReport`

The private report may contain:

- public listing ID and public URL
- report reason
- reporter relationship
- optional private reporter contact
- explanation
- supporting public URL
- submitted timestamp
- moderation status
- staff findings
- resolution
- resolved timestamp
- retention metadata

Do not use a cross-dataset reference. Store the public listing ID and URL as controlled values.

Anonymous or contact-optional visitor reporting may be allowed, but abuse controls and moderation guidance must be designed before launch. A reporter's private identity or contact details must never appear publicly.

## Featured listings and sponsorship

Featured is an editorial placement control. It must not automatically mean verified, recommended, higher quality, or sponsored.

If paid promotion or sponsorship is introduced later:

- it must be modeled separately from editorial featuring
- paid placement must be clearly labelled
- payment must not award verification
- payment must not suppress legitimate competitors
- sponsorship policy, duration, pricing, conflicts, and refund rules must be published
- ordinary governed inclusion should remain distinguishable from advertising

No payment or sponsored-placement system is part of the first directory milestone.

## Public filtering and ordering

Planned public filters:

- listing type
- primary category
- community connection
- county
- municipality or city when sufficient content exists
- service coverage
- online availability
- service language

County, city, and type are primarily filters rather than only sorting choices.

Recommended public sorting:

- editorial order
- recently verified
- alphabetical
- newest listings

Do not introduce public ratings, popularity ranking, paid ranking, or nearest-location sorting in the first version.

Recommended default ordering:

1. editorially featured listings, used sparingly
2. most recently verified listings
3. alphabetical fallback

## Homepage behavior

The current homepage placeholder must not be replaced with live-looking directory cards until the public directory and moderation workflow are operational.

When implemented, the homepage should:

- use the broader Community Directory wording
- show only approved active listings
- use a small controlled selection
- hide the section when no eligible listings exist
- not display dummy listings
- not display an application link until the application service is operational
- distinguish Featured from Verified
- avoid presenting payment as editorial trust

A future homepage mix may include different listing types rather than only commercial businesses.

## Submission-service architecture

The future application service should reuse the proven Event-submission pattern:

- one shared light, mobile-first public form
- centralized Nepali and Norwegian copy
- limited English interface
- thin public routes
- clear numbered sections
- conditional fields
- main site-language switch and visible form-language buttons
- private versus proposed-public explanations
- stable internal values independent of translated labels
- accessible error summary and field-level errors
- accessible success state
- strict server-side allowlist and validation
- private draft storage
- honeypot and rate limiting
- administrative notification after storage
- eventual minimal applicant receipt, separate from administrative notification

Direct file uploads should be deferred initially. The first secure version may accept public website or image URLs and publication-rights declarations. Direct uploads require a separate security milestone.

## Server and security boundary

The future endpoint must:

- accept POST and JSON only
- enforce a strict request-size limit
- reject malformed and non-object payloads
- allowlist visitor-facing fields
- reject unknown and internal fields
- normalize text, URLs, organization numbers, geography, and stable choices
- generate IDs, timestamps, and moderation status server-side
- hard-code the private dataset and document type
- use a dedicated server-only Sanity token without a `PUBLIC_` prefix
- use rate limiting and honeypot protection
- return generic no-store errors
- log no private payload or secret
- store before attempting notifications
- allow notification failure without invalidating stored applications

Visitors must never control:

- dataset
- document type
- document ID
- moderation status
- submission timestamp
- reviewer
- internal notes
- verification status
- featured status
- public conversion metadata
- retention metadata

## Privacy and retention

Before accepting genuine applications, approve and publish privacy and retention wording covering:

- purpose of collection
- categories of data collected
- who can access applications
- use of transactional email providers
- how long rejected, withdrawn, duplicate, converted, and abandoned applications are retained
- how applicants request correction or deletion
- handling of identity or ownership evidence
- handling of internal notes and complaints
- backup-related deletion timing

Collect only the private information necessary for moderation.

Sensitive supporting evidence should not be requested casually. If document uploads or identity evidence become necessary, design a separate secure storage, access, deletion, and malware-handling workflow.

## Abuse and quality risks

The design must address:

- spam and backlink submissions
- impersonation
- fabricated ownership or community connection
- misleading professional claims
- duplicate listings
- fraudulent services
- unsafe or discriminatory content
- copied descriptions or images without permission
- public exposure of private home addresses
- stale contact information
- closed or inactive entities
- manipulation of Featured or Verified labels

The directory should publish clear eligibility, correction, complaint, and removal policies before launch.

## Accessibility and mobile-first requirements

The public archive, filters, listing pages, and application form must be mobile-first and keyboard accessible.

Requirements include:

- semantic headings and landmarks
- labelled controls
- visible keyboard focus
- accessible filter state
- no color-only meaning
- meaningful image alternative text
- readable error summaries
- no horizontal overflow
- usable long names and addresses
- clear empty and no-result states
- progressive enhancement for filtering where practical

## Search and discoverability

Initial public filtering may operate from statically generated listing data if the dataset remains small.

Before implementing a larger search system, test with genuine content and support:

- listing name
- category
- organization type
- city and county
- service coverage
- Nepali and Norwegian wording
- common alternative spellings
- organization number when appropriate

Do not expose private applicant or moderation data to public search indexes.

## Operational and migration notes

A future migration or owner must preserve:

- the public `production` and private `submissions` boundary
- server-only tokens
- rate-limiting rules
- notification configuration
- moderation access
- published eligibility and verification policies
- correction and complaint workflows
- review schedules
- webhook coverage for `directoryListing`

The existing Sanity-to-Vercel webhook currently recognizes the earlier `businessListing` type. When `directoryListing` becomes operational, the webhook filter must be updated deliberately and tested with a harmless controlled publication.

## Planned implementation sequence

1. Review and approve this architecture document.
2. Create a documentation-only architecture checkpoint.
3. Replace the unused `businessListing` prototype with `directoryListing`.
4. Register and validate the new public schema.
5. Replace the unused Business Listing queries with language-aware directory queries.
6. Add centralized Community Directory interface translations.
7. Build Nepali and Norwegian public archive routes.
8. Build language-safe individual listing routes.
9. Create one controlled genuine public listing and validate filters and presentation.
10. Create the private `directoryListingSubmission` schema in `submissions`.
11. Extend the private moderation workspace safely.
12. Build strict server validation and private storage.
13. Configure rate limiting and administrative notification.
14. Build the shared Nepali, Norwegian, and limited English application form.
15. Publish privacy, retention, eligibility, correction, complaint, and sponsorship policies.
16. Build the private `directoryListingReport` workflow for closure, inactivity, and correction reports.
17. Add reporting actions to public listing pages only after private moderation and abuse controls are operational.
18. Add public application entry points only after the application service is operational.
19. Replace the homepage placeholder only after approved listings exist and the section has a hidden empty state.
20. Update the Sanity-to-Vercel webhook for `directoryListing` and verify automatic deployment.
21. Update editor, administrator, operations, and recovery documentation.

## Security invariants

Future developers and AI assistants must not weaken these rules:

- no automatic public publication
- no browser-side write token
- no genuine private application data in `production`
- no private applicant contact copied into public fields automatically
- no public ownership or verification claim without explicit declaration and staff review
- no inferred identity, nationality, ethnicity, or ownership
- no applicant-controlled Verified or Featured state
- no direct file upload without a separate security milestone
- no hidden Studio route treated as a security boundary
- no cross-dataset references
- no paid placement disguised as verification or editorial recommendation
- no public application launch without validation, privacy wording, abuse controls, and retention rules
- no forced physical city or address for online-only or nationwide listings

## 2026-09-01 presentation and social-sharing continuity update

Individual Directory listing pages now use the shared `ContentContextRail` and `ContextRailPanel` components. Listing details, public contact, verification and review, and translation remain separate responsive cards. This is a presentation-only change and does not alter eligibility, verification meaning, moderation, public/private contact separation, or submission conversion.

Directory social previews now prefer a 1200 x 630 cover-image crop, then a contained logo, with canonical Open Graph and X Card metadata supplied by `BaseLayout.astro`. A branded global fallback image remains deferred. No social-media scripts or tracking were added.
