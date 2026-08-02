# Event Submission Architecture

## Status

Architecture foundation for moderated organizer Event submissions. This document is authoritative for the submission boundary and must be updated when the implementation changes.

The public form must not be opened to genuine organizer data until private storage, server-side validation, spam protection, privacy wording, retention rules and production deployment have all been verified.

## Product scope

Organizers may propose Events through form interfaces in:

- Nepali
- Norwegian Bokmal
- English

English is a submission interface and source-information language. It does not enable a complete English public website in Phase 1.

Approved public Event pages remain:

- Nepali
- Norwegian Bokmal
- or both as separately reviewed and linked `communityEvent` documents

## Mandatory separation

`eventSubmission` is a private moderation record.

`communityEvent` is an approved public editorial document.

A public submission must never:

- create a published `communityEvent` directly
- publish automatically
- copy private organizer contacts into public fields automatically
- expose a Sanity write token in browser JavaScript
- accept `_id`, `_type`, moderation status, internal notes or approval fields from the browser

Staff must verify, edit and intentionally create the final public Event.

## Language concepts

The system keeps these concepts separate:

1. Form interface language: Nepali, Norwegian or English.
2. Submission content language: the language used by the organizer to provide source information.
3. Actual Event languages: the spoken, working or language-independent nature of the Event.
4. Requested public output: Nepali, Norwegian, both, or editorial decision.

## Storage decision

### Preferred production architecture

Use a private Sanity dataset named `submissions` when Sanity Growth or another plan supporting private datasets is active and verified.

- `production`: public editorial content
- `submissions`: private moderation records and organizer contact details

The existing public Astro client must continue reading only from `production`.

### Important plan limitation

Sanity Free datasets are public. A private dataset is a paid-plan feature. A trial-only private dataset must not receive genuine organizer information unless the organization has decided to retain a plan that preserves private-dataset access after the trial.

### Temporary development rule

Until private storage is verified:

- use synthetic test data only
- do not collect genuine email addresses or telephone numbers
- do not publish the public form
- do not register `eventSubmission` in the public `production` workspace

### Alternative architecture

If Sanity Growth is not selected, evaluate a private application database such as Supabase before collecting genuine organizer contacts. The same public form and moderation rules still apply, but a separate internal moderation interface may then be required.

Draft-only documents in the public `production` dataset may be used only for a tightly controlled synthetic pilot. Draft protection is not the preferred permanent privacy boundary.

## Studio workspace design

After the private `submissions` dataset exists and is verified, add a second Sanity Studio workspace:

- public content workspace using `production` and the existing `schemaTypes`
- Event moderation workspace using `submissions` and `submissionSchemaTypes`

The moderation workspace must:

- contain only private submission schemas
- remove Publish, Unpublish and Duplicate actions for `eventSubmission`
- retain controlled editing and deletion
- avoid presenting public editorial document types

Workspace visibility is not a security boundary. Dataset privacy and authenticated roles enforce access.

## Server endpoint boundary

The future Vercel server endpoint must:

- use `@astrojs/vercel` for on-demand execution while public content pages remain prerendered
- use a dedicated server-only Sanity robot token
- store the token without a `PUBLIC_` prefix
- hard-code the destination dataset and `_type`
- generate the document ID server-side
- allowlist accepted visitor fields
- normalize text and dates
- reject unknown, oversized or malformed values
- validate URLs and email addresses
- apply rate limiting and a honeypot or equivalent spam control
- record a server-generated submission timestamp
- return generic errors without exposing internal details
- never accept internal moderation fields from the visitor

## Contact privacy

Private moderation fields include:

- contact-person name
- private email
- private telephone
- preferred contact language
- internal moderation notes
- clarification history

Proposed public organizer fields are separate. Public email or telephone details require explicit publication permission and staff review.

## Registration source information

The private submission records the organizer's proposed registration requirement, current registration status, deadline and external registration or ticket URL. Staff must verify these values before creating the public Event and must not infer registration status from the existence of a URL alone. No-registration proposals use the Not applicable status; proposals requiring or recommending registration must identify the current registration state.

## Images

The first secure version does not accept direct file uploads.

It may accept:

- a public organizer image or Event page URL
- suggested alternative text
- image credit
- explicit confirmation of publication rights

Direct uploads require a later isolated design covering file signatures, MIME types, size limits, storage abuse, cleanup, permissions and malware risk.

## Moderation workflow

Statuses:

- New
- Under review
- More information requested
- Approved
- Converted to public Event
- Rejected
- Duplicate
- Withdrawn
- Archived

Recommended flow:

1. Organizer submits source information.
2. Server creates a private `eventSubmission`.
3. Staff verifies identity, dates, source, organizer authority and publication permission.
4. Staff requests clarification when required.
5. Staff approves or rejects the proposal.
6. Staff creates and edits the public `communityEvent` in `production`.
7. Staff publishes the public Event.
8. Staff records the public Event ID and URL in the private submission.
9. Staff reviews the private submission for deletion according to the retention policy.

Cross-dataset Sanity references are not used. Store the final public document ID and URL as controlled metadata.

## Retention and deletion

Before launch, approve and publish a concrete privacy and retention statement covering:

- purpose of collection
- fields collected
- who can access submissions
- how long rejected, withdrawn, converted and abandoned submissions are kept
- how organizers request correction or deletion
- how internal notes are handled
- whether backups affect deletion timing

The schema includes a retention review date, but the organization must still approve the operational policy.

## Security invariants

Future developers and AI assistants must not weaken these rules:

- no automatic public publication
- no browser-side write token
- no genuine private data in an unverified public dataset
- no public contact publication without explicit permission and staff review
- no direct file upload without a separate security milestone
- no acceptance of client-supplied moderation fields
- no public form launch without server validation, spam controls, rate limiting and privacy wording
- no assumption that hiding a Studio workspace restricts data access

## Planned implementation sequence

1. Create and validate the submission schema and this architecture document.
2. Decide and provision verified private storage.
3. Add the isolated moderation Studio workspace and remove publishing actions.
4. Install and configure the Vercel adapter.
5. Build the allowlisted server endpoint.
6. Add Nepali, Norwegian and English form interfaces.
7. Add privacy, consent, retention and organizer guidance.
8. Test with synthetic data.
9. Verify no submission appears in public queries or routes.
10. Perform a security and abuse review before accepting genuine submissions.

## Implemented Architecture Addendum: Public Submission Service

This addendum records the production implementation validated through checkpoint `02d7356 add Event submission links to archives`. It supplements the original design decisions in this document and should not replace the earlier rationale.

### Implemented request path

```text
Visitor opens localized public form
  -> /ne/events/submit/
  -> /nb/events/submit/
  -> /en/events/submit/

Shared EventSubmissionForm.astro
  -> POST /api/event-submissions

Vercel WAF
  -> 10 requests per IP per 600-second fixed window

API request boundary
  -> POST and JSON only
  -> 64 KiB request limit
  -> malformed and non-object rejection

Strict normalization and validation
  -> visitor-field allowlist
  -> conditional and permission rules
  -> honeypot handling

Server-only Sanity mutation
  -> project f9johco4
  -> private submissions dataset
  -> eventSubmission draft
  -> server-generated ID, status and timestamp

Best-effort administrative notification
  -> Resend through notifications.nepali.no
  -> notification failure cannot roll back storage

Browser response
  -> HTTP 201 and non-secret submission reference
```

### Public form implementation

The public form is intentionally separate from Sanity Studio. Sanity Studio remains the authenticated staff moderation interface. Visitors use a custom light, mobile-first nepali.no form.

Files:

- `src/components/events/EventSubmissionForm.astro`
- `src/pages/[lang]/events/submit.astro`
- `src/pages/en/events/submit.astro`
- `src/i18n/eventSubmission.ts`
- `src/i18n/eventSubmission.ne.ts`
- `src/i18n/eventSubmission.nb.ts`
- `src/i18n/en.ts`

Nepali and Norwegian remain the only complete public-site languages. English is a limited Event-submission interface and is deliberately excluded from global `supportedLanguages` and `getTranslations()`.

The shared form sends stable internal values independent of translated labels. Form copy must remain structure-compatible through `EventSubmissionCopy`.

### Public form state and accessibility

The public form includes:

- eight numbered sections
- private versus proposed-public data explanations
- helper text and required indicators
- native controls
- visible keyboard focus
- field-level error containers
- accessible error summary
- disabled submission state
- focused success panel
- mobile single-column layout
- desktop two-column layout where appropriate
- a keyboard-safe hidden `website` honeypot

On success, the form and Before you begin panel are hidden. The hero, language controls, return link, confirmation, reference, and non-publication notice remain.

### Conditional form rules

Client-side interactions improve usability but do not replace server validation.

Implemented examples:

- Other-language fields appear only when applicable.
- Language-independent is mutually exclusive with spoken-language selections.
- Public contact permission appears when public email or phone is proposed.
- In-person, online, and hybrid fields appear by format.
- Online and hybrid forms explain that an online platform or public information URL is required.
- Not-required registration sets Not applicable.
- Changing to recommended, required, or ticketed registration converts Not applicable to Not yet open.
- Free Event remains independent from registration and ticket requirements.
- Price description appears for non-free Events.
- Image permission appears when an image URL is proposed.

### Validation boundary

`src/lib/eventSubmissions/validateEventSubmission.ts` remains authoritative.

The browser cannot submit internal fields such as:

- `_id`
- `_type`
- `moderationStatus`
- `submittedAt`
- assigned reviewer
- internal notes
- retention-review fields
- public conversion metadata

The validator also enforces supported choices, length limits, HTTP/HTTPS URLs, email format, timezone-aware ISO datetimes, real calendar dates, end-after-start ordering, physical and online requirements, registration consistency, pricing consistency, permissions, and declarations.

### Storage boundary

`src/lib/eventSubmissions/createEventSubmission.ts` uses only `SANITY_EVENT_SUBMISSION_TOKEN` from the server environment.

Hard-coded server values:

- project ID: `f9johco4`
- dataset: `submissions`
- API version: `2026-03-01`
- type: `eventSubmission`
- moderation status: `new`
- ID prefix: `drafts.eventSubmission-`

The server generates the UUID and UTC Submitted At value. Protected fields are applied after normalized visitor data, so visitor-derived values cannot overwrite them.

The standard Growth Contributor role is used. It can create drafts but cannot publish. Growth does not provide the desired dataset-scoped custom role, so hard-coded server boundaries remain mandatory.

### Rate limiting

Vercel WAF protects the exact route `/api/event-submissions` using:

- Fixed Window
- 600 seconds
- 10 requests
- IP Address
- HTTP 429 after the limit

This lives in Vercel configuration, not Git. It must be recreated or documented during project migration.

### Administrative notification

`src/lib/eventSubmissions/notifyEventSubmission.ts` runs only after successful private storage.

Server variables:

- `RESEND_API_KEY`
- `EVENT_SUBMISSION_NOTIFICATION_TO`

Verified sender:

- `Nepali.no Notifications <events@notifications.nepali.no>`

Notification content is intentionally minimal. The request times out after five seconds. Provider rejection, network failure, and missing configuration return controlled results. Failure is logged with only a reason and non-secret submission reference; storage remains authoritative and the organizer still receives the success response.

The current administrative recipient is `pankaj@kafley.no` and should later be replaced by an official organizational mailbox.

### Submitter receipt

The submitter receipt is not implemented. It must be a separate best-effort function after storage and must not be coupled to administrative notification success.

It must be transactional and minimal, never marketing. Failure must never alter the stored submission or browser success state.

### Public discovery

Localized submission links now appear in Upcoming and Past Event archive heroes.

The homepage submission link remains deferred until the homepage Event query is actually connected and the section has a hidden empty state.

### Migration and operations notes

A future owner or hosting migration must preserve:

- Vercel WAF rule
- Production-only sensitive Vercel variables
- Sanity Contributor robot token
- private `submissions` dataset
- Resend restricted sending key
- verified `notifications.nepali.no` DNS records
- DKIM, SPF-related MX, and SPF TXT records
- exact public and Studio project distinction

Never move these secret values into Git, client code, `PUBLIC_` variables, or screenshots.
