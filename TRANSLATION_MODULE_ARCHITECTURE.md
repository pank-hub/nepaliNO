# nepali.no Translation Module Architecture

**Status:** Active architecture document
**Last updated:** 4 August 2026
**Current implementation stage:** Phase 1, read-only Translation Browser completed

## 1. Purpose

The Translation Module provides a protected browser-based workflow for reviewing and eventually updating nepali.no interface wording without requiring ordinary translation work to be performed directly in GitHub Codespaces.

The module is limited to interface translation and proofreading. It must not expand into a general contributor portal, newsroom, project-management system, replacement for Sanity, or public-content submission service.

The module currently supports the complete public interface languages:

- Nepali (`ne`)
- Norwegian Bokmal (`nb`)

English remains deliberately limited to selected services and strategic pages. English is not a complete public-site language and is not part of the initial complete-language Translation Module workflow.

## 2. Non-negotiable source-of-truth rule

The repository translation sources remain authoritative. The Translation Module must not create a competing translation database in Phase 1.

Approved interface-wording sources:

- `src/i18n/ne.ts`
- `src/i18n/nb.ts`
- `src/i18n/eventSubmission.ne.ts`
- `src/i18n/eventSubmission.nb.ts`
- `src/i18n/directorySubmission.ne.ts`
- `src/i18n/directorySubmission.nb.ts`

Protected technical contracts and configuration:

- `src/i18n/config.ts`
- `src/i18n/index.ts`
- `src/i18n/eventSubmission.ts`
- `src/i18n/directorySubmission.ts`

The protected technical files must never be presented as ordinary editable translation wording.

## 3. Important developer warning: adding a string is not sufficient

**Adding a string to `ne.ts` or `nb.ts` does not, by itself, guarantee that a field will appear in the Translation Editor web interface.**

A string is discovered automatically only when it is located inside a top-level section that the Translation Module registry already recognizes and assigns to a module.

Currently recognized main sections:

- `navigation`
- `home`
- `news`
- `events`
- `directory`
- `information`
- `footer`
- `common`

For example, a new string added inside the recognized `news` object is expected to appear automatically in the News module:

```ts
news: {
  newLabel: "New wording",
}
```

A new top-level object does not automatically create a new Translation Editor module. For example:

```ts
school: {
  title: "Language school",
  introduction: "Introduction wording",
}
```

The current Translation Editor will not automatically create a School module or display those fields. A developer must deliberately update the Translation Module registry or implement the approved unassigned-section safeguard described below.

A new page or feature is not translation-complete merely because wording has been added to `ne.ts` and `nb.ts`. Before the feature is considered complete, a developer must verify that all intended interface strings appear in the Translation Editor under the correct module.

## 4. Current registry assignments

The current Translation Browser exposes nine modules for each complete language:

1. Navigation
2. Homepage
3. News
4. Events
5. Community Directory
6. Public Information
7. Footer and common wording
8. Event submission form
9. Directory submission form

Current production-verified visible counts per language:

- Navigation: 8
- Homepage: 26
- News: 29
- Events: 74
- Community Directory: 130
- Public Information: 30
- Footer and common wording: 20
- Event submission form: 119
- Directory submission form: 132
- Total visible strings: 568

Nepali and Norwegian counts currently match exactly.

## 5. Automatic discovery within assigned sections

Within a recognized and assigned section, the registry recursively discovers ordinary string values.

Supported structures:

- strings
- nested objects containing strings
- ordered arrays containing strings

Array entries receive stable contextual paths such as:

- `beforeYouBeginItems[0]`
- `beforeYouBeginItems[1]`

New strings inside an existing assigned section normally require no manual key-by-key registration.

## 6. Current exclusions

The Translation Module must exclude technical or unsafe values.

### 6.1 Functions and application logic

Current excluded functions:

- `news.articleCount`
- `directory.resultCount`

These values contain TypeScript application logic and must not be treated as ordinary text fields.

### 6.2 Imported submission references

The following imported object references are excluded from the main Events and Directory modules:

- `events.submission`
- `directory.submission`

Their actual strings are shown separately in the Event submission form and Directory submission form modules. This prevents duplication.

### 6.3 Deferred forum and Coming Soon wording

The following Homepage values are currently deferred:

- `home.discussionsEyebrow`
- `home.discussionsHeading`
- `home.discussionsDescription`
- `home.forumComingSoon`
- `home.forumNotice`
- `home.comingSoon`

The forum platform, hosting model and final Nepali terminology remain unresolved. These values remain in the source files but are excluded from ordinary Translation Browser work until the forum architecture is selected.

### 6.4 Other excluded material

The module must not expose:

- imports
- TypeScript contracts
- functions
- computed expressions
- application logic
- arbitrary repository files
- secrets or environment variables
- Sanity editorial content
- browser-supplied file paths
- browser-supplied repository names
- private Event or Directory submission data

## 7. Planned unassigned-section safeguard

A future safety improvement must detect new top-level translation sections that are not assigned to a known Translation Editor module.

Example:

- `school`
- `volunteering`
- `donations`

The safeguard should report newly discovered top-level sections through a protected administrator warning or a read-only **New or unassigned sections** view.

The safeguard must:

- discover ordinary strings in unknown top-level sections
- report the section in both languages
- identify missing language counterparts
- remain read-only until the section is reviewed
- require deliberate classification before editing is enabled
- never infer that an unknown technical object is safe to edit

The architecture must distinguish current verified behavior from this planned safeguard. Until the safeguard is implemented, a new top-level section requires a manual registry integration review.

## 8. Language-parity checks

The Translation Module must detect and report structural differences between Nepali and Norwegian, including:

- a key present in Nepali but missing in Norwegian
- a key present in Norwegian but missing in Nepali
- arrays with different lengths
- a string in one language and an object in the other
- an ordinary string in one language and a function in the other
- unsupported or computed values
- an unassigned top-level section

Missing counterparts must be shown as explicit warnings. They must not be silently hidden or invented.

## 9. Hard-coded wording policy

New public interface wording should be stored in approved i18n sources rather than hard-coded in Astro components or page templates.

The Translation Module cannot automatically manage wording that remains embedded inside `.astro`, `.ts`, `.tsx`, or other application files.

Before a new page or public feature is considered translation-complete, developers must:

1. Centralize ordinary interface wording in the approved i18n source files.
2. Keep Nepali and Norwegian structures aligned.
3. Assign any new top-level section to the Translation Module registry.
4. Verify every intended string in the protected web interface.
5. Confirm that technical functions and contracts remain excluded.
6. Run registry consistency checks.
7. Test the Translation Editor on desktop and mobile.
8. Update this architecture document when the module structure changes.

Editor-authored Sanity content is outside this interface-translation workflow and must continue through the Sanity editorial process.

## 10. Phase model

### Phase 1: Pankaj-only Translation Editor

Phase 1 includes:

- private GitHub login
- immutable numeric GitHub user-ID authorization
- signed secure session
- read-only Translation Browser
- controlled editing of allowlisted values
- server-side validation
- review of exact changes
- stale-source detection
- controlled GitHub branch and pull request
- no direct or automatic commit to `main`

No Supabase project is used in Phase 1.

### Operational proofreading after Phase 1

Actual proofreading starts only after Phase 1 is working and production-validated.

Initial workflow:

- proofreaders send suggestions to Pankaj through familiar channels
- Pankaj enters approved wording through the protected portal
- changes pass through validation and a controlled pull request

### Phase 2: multi-user workflow after risk assessment

Possible Phase 2 additions:

- invited proofreader and editor accounts
- language and module restrictions
- user invitation, suspension and revocation
- account recovery
- saved drafts
- moderation
- review, approval and rejection
- comments
- self-approval restrictions
- audit history
- advanced batch workflows

Direct proofreader access must not be enabled before a documented privacy, security and operational risk assessment.

## 11. Authentication architecture

The Phase 1 Translation Editor uses a private GitHub App for identity verification.

Current verified boundary:

- approved user: Pankaj only
- authorization uses the immutable numeric GitHub user ID
- GitHub username is display information only
- OAuth state is validated
- the temporary GitHub user token is discarded
- a signed, HTTP-only, Secure, SameSite=Lax session is used
- session lifetime is four hours
- logout clears the session
- portal pages use `noindex, nofollow`

Current GitHub App state:

- no repository installation
- no private key
- no repository permissions
- no webhook
- no event subscriptions

Environment-variable names only:

- `GITHUB_TRANSLATION_APP_CLIENT_ID`
- `GITHUB_TRANSLATION_APP_CLIENT_SECRET`
- `TRANSLATION_ALLOWED_GITHUB_USER_ID`
- `TRANSLATION_SESSION_SECRET`

Values must never be committed, displayed in documentation, pasted into chat, exposed to browser JavaScript or stored in a `PUBLIC_` variable.

## 12. Editing and validation contract

Before any proposal can be accepted, the server must verify:

- a valid authenticated session
- the approved user identity
- a supported language
- a recognized or deliberately reviewed module
- an allowlisted key
- a string value only
- non-empty normalized wording
- the expected current source value
- preserved placeholders
- preserved array structure and index
- reasonable value length
- no unknown fields
- no arbitrary file path
- no technical function or computed value
- no changes outside approved translation files

Browser-side validation is only a usability aid. Server-side validation remains authoritative.

## 13. Stale-source protection

Every proposed change must include the current source value or a strong source fingerprint.

Before generating a repository change, the server must fetch or inspect the latest permitted source and verify that the original wording still matches.

If the source changed after the editing session began, the operation must stop with a conflict. The system must not overwrite newer wording silently.

## 14. GitHub write boundary

Repository-writing capability remains deferred until editing and validation are production-tested.

Later minimum GitHub App repository permissions are expected to be:

- Contents: Read and write
- Pull requests: Read and write
- Metadata: Read-only

Because Contents write is technically powerful, application restrictions remain mandatory:

- repository fixed server-side to `pank-hub/nepaliNO`
- base branch fixed server-side to `main`
- generated translation branch prefix
- exact file allowlist
- exact key allowlist
- no arbitrary browser-supplied repository, branch or file
- pull request required
- no direct push to `main`
- automated validation before merge
- Pankaj retains final merge authority

## 15. Public-site independence

The public nepali.no website must not depend on Translation Editor availability.

If GitHub authentication, the portal or future pull-request integration is unavailable:

- the public site continues using committed translation files
- existing public pages continue working
- no public content is lost
- no insecure authentication bypass is introduced

## 16. Current production proof

Verified checkpoints:

- `191cdba` added the Translation Editor authentication foundation
- `a57f071` corrected mutable redirect handling for session cookies
- `8db73df` documented the authentication milestone
- `764f316` added the read-only Translation Browser

Production verification includes:

- unauthenticated redirect to login
- approved GitHub login
- controlled access denial
- signed protected session
- logout and session removal
- nine modules per language
- 568 unique visible strings per language
- matching Nepali and Norwegian counts
- immutable translation keys
- generic detection of any number of unassigned top-level sections
- Nepali-only and Norwegian-only section detection
- array-length and structural mismatch detection
- explicit handling of approved directional counterpart keys
- controlled editing enabled only after an explicit user action
- live changed-string counting
- authenticated same-origin server validation
- allowlisted language, module and key validation
- duplicate-key, empty-value and outer-whitespace rejection
- stale-source detection
- placeholder preservation
- exact current-versus-proposed review
- cancel-and-restore behavior
- no persistence of temporary proposals
- no translation-file mutation
- no repository API calls or GitHub write capability
- disabled repository-update action
- safe unknown-module 404 response
- desktop visual verification
- Devanagari and Norwegian rendering
- large 130-string Community Directory module rendering

## 17. Required checks for future development

After meaningful Translation Module changes:

1. Verify a clean Git starting point.
2. Run `git diff --check`.
3. Run Astro Check.
4. Run the production build.
5. Run registry string, uniqueness and exclusion tests.
6. Run language-parity checks.
7. Review the exact source diff.
8. Review the staged file inventory.
9. Confirm no secrets or repository-write capability entered unexpectedly.
10. Test desktop and mobile layouts.
11. Create a clean Git checkpoint.
12. Append the milestone to `PROJECT_PROGRESS.md` at a natural stopping point.

## 18. Next planned work

The read-only Translation Browser, generic registry safeguard, controlled editing interface and server-side proposal validation are now production-proven.

Before enabling repository writes:

1. Preserve the current Pankaj-only authentication boundary.
2. Keep temporary proposals in memory only until the GitHub integration is deliberately enabled.
3. Review the GitHub App permission increase as a separate security milestone.
4. Install the GitHub App only on `pank-hub/nepaliNO`.
5. Generate and store the private key only in protected server configuration.
6. Grant only the minimum repository permissions required for controlled branches and pull requests.
7. Fix the repository, base branch, translation branch prefix and file allowlist server-side.
8. Add deterministic TypeScript source updates that preserve keys, imports and application logic.
9. Revalidate stale source wording immediately before creating a repository change.
10. Create a translation branch and pull request only, never a direct commit to `main`.
11. Run Astro Check, the production build and exact translation-file diff validation before a pull request is opened.
12. Keep Pankaj as the final reviewer and merge authority.

Actual proofreading should begin only after the controlled pull-request workflow is production-tested with harmless synthetic wording and confirmed not to modify `main` directly.
