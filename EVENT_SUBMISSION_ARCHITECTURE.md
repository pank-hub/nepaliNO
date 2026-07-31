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
