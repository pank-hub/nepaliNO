# nepali.no Translation Module Architecture

**Status:** Phase 1 operational and production-proven
**Last updated:** 5 August 2026
**Current checkpoint:** `a46a7fb add protected Translation pull request pipeline (#4)`

## 1. Purpose

The Translation Module provides a protected browser-based workflow for reviewing and updating nepali.no interface wording without requiring ordinary proofreading work to be performed directly in GitHub Codespaces.

The module is intentionally limited to interface translation and proofreading. It must not become a general contributor portal, newsroom, project-management system, replacement for Sanity, or public-content submission service.

Complete public interface languages:

- Nepali (`ne`)
- Norwegian Bokmal (`nb`)

English remains intentionally limited to selected services and strategic pages. English is not a complete public-site language and is not part of the initial complete-language workflow.

## 2. Authoritative source model

The repository translation files remain authoritative. Phase 1 does not create a competing translation database.

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

Technical contracts, functions, imports, computed expressions, application logic, secrets, arbitrary repository files, Sanity editorial content, and private submission data must never be presented as ordinary editable wording.

## 3. Critical developer rule: adding a string is not enough

**Adding a string to `ne.ts` or `nb.ts` does not, by itself, guarantee that a field appears in the Translation Editor.**

A string appears automatically only when it belongs to a top-level section already assigned by the server-owned Translation registry.

Currently assigned main sections:

- `languageName`
- `navigation`
- `home`
- `news`
- `events`
- `directory`
- `information`
- `footer`
- `common`

A new string inside an assigned section normally appears automatically. A completely new top-level section, regardless of name, is detected as unassigned but does not become editable automatically.

A new page or feature is not translation-complete until a developer has verified that every intended interface string appears under the correct module in the protected web interface.

## 4. Current Translation Editor modules

The editor exposes nine modules per complete language:

1. Navigation
2. Homepage
3. News
4. Events
5. Community Directory
6. Public Information
7. Footer and common wording
8. Event submission form
9. Directory submission form

Production-verified visible counts per language:

- Navigation: 8
- Homepage: 26
- News: 29
- Events: 74
- Community Directory: 130
- Public Information: 30
- Footer and common wording: 20
- Event submission form: 119
- Directory submission form: 132
- Total: 568 unique visible strings per language

Nepali and Norwegian module counts match.

## 5. Automatic discovery and supported structures

Within assigned sections, the registry recursively discovers:

- string values
- nested objects containing strings
- ordered arrays containing strings

Array entries receive stable contextual paths such as:

- `beforeYouBeginItems[0]`
- `beforeYouBeginItems[1]`

The registry excludes non-string leaves.

## 6. Explicit exclusions

### 6.1 Functions and application logic

Current excluded functions:

- `news.articleCount`
- `directory.resultCount`

### 6.2 Imported submission references

Excluded from the main Events and Directory modules to prevent duplication:

- `events.submission`
- `directory.submission`

Their actual strings appear in separate submission-form modules.

### 6.3 Deferred forum and Coming Soon wording

The following Homepage values remain excluded until the forum platform and final terminology are decided:

- `home.discussionsEyebrow`
- `home.discussionsHeading`
- `home.discussionsDescription`
- `home.forumComingSoon`
- `home.forumNotice`
- `home.comingSoon`

## 7. Generic unassigned-section safeguard

The safeguard compares the actual top-level sections in the complete language sources with the assigned-section registry.

It supports any number of unknown future sections and does not depend on example names.

It detects:

- unassigned sections present in both languages
- Nepali-only sections
- Norwegian-only sections
- missing nested keys
- different array lengths
- string-versus-object differences
- string-versus-function differences
- other structural mismatches

Unknown sections remain read-only until a developer deliberately assigns or excludes them.

Protected report route:

- `/translations/unassigned/`

Current production state:

- unassigned top-level sections: 0
- unexplained structure mismatches: 0

Approved directional counterpart pairs:

- `news.readInNorwegian` and `news.readInNepali`
- `information.readInNorwegian` and `information.readInNepali`

The approval is narrow. Missing, duplicated, renamed, or structurally changed counterparts trigger warnings again.

## 8. Authentication and authorization

Phase 1 is restricted to Pankaj.

The portal uses:

- GitHub OAuth for identity verification
- immutable numeric GitHub user-ID authorization
- OAuth state validation
- discarded temporary GitHub user token
- signed four-hour HTTP-only Secure SameSite=Lax session
- logout that clears the session
- `noindex, nofollow`

The user-login OAuth client and the repository-writing GitHub App installation are distinct security mechanisms.

Production-only Sensitive Vercel variable names:

- `GITHUB_TRANSLATION_APP_CLIENT_ID`
- `GITHUB_TRANSLATION_APP_CLIENT_SECRET`
- `TRANSLATION_ALLOWED_GITHUB_USER_ID`
- `TRANSLATION_SESSION_SECRET`
- `GITHUB_TRANSLATION_APP_ID`
- `GITHUB_TRANSLATION_APP_INSTALLATION_ID`
- `GITHUB_TRANSLATION_APP_PRIVATE_KEY`

Values must never enter Git, Markdown, chat, screenshots, browser JavaScript, public variables, GitHub Actions, or Codespaces.

## 9. GitHub App installation boundary

GitHub App:

- name: `nepali.no Translation Editor`
- installed only on `pank-hub/nepaliNO`
- repository selection: selected repository only
- Contents: Read and write
- Pull requests: Read and write
- Metadata: Read
- all unrelated permissions: No access
- webhook: disabled
- event subscriptions: none
- ruleset bypass: none

The App cannot administer the repository, read secrets, modify workflows, manage deployments, or bypass protected `main`.

## 10. Protected main branch

Active ruleset: `Protect main branch`

Target:

- default branch, currently `main`

Protections:

- pull request required
- required approvals: 0, appropriate for the current single-administrator model
- conversation resolution required
- Squash merge only
- required status check: `Astro check and production build`
- restrict deletions
- block force pushes
- Translation GitHub App is not a bypass actor
- repository-administrator emergency bypass is limited to pull requests

## 11. Pull-request validation workflow

Workflow file:

- `.github/workflows/validate-pull-request.yml`

The workflow runs on pull requests targeting `main` and uses:

- ordinary `pull_request`, never `pull_request_target`
- `contents: read`
- Node 24
- `npm ci`
- `npm ci --prefix sanity`
- `npx astro check`
- `npm run build`
- public Sanity project ID and public production dataset only
- no project secrets
- no repository write permission

## 12. Editing and proposal validation

Editing is enabled only after an explicit action.

The interface supports:

- proposed-wording fields for allowlisted strings
- live changed-string count
- cancellation and restoration of original values
- exact current-versus-proposed review
- field-level errors and accessible error summary

Server validation verifies:

- valid authenticated session
- same-origin JSON request
- 128 KiB request limit
- supported language
- registered module
- allowlisted key
- maximum 200 changes
- maximum 5,000 characters per value
- string-only values
- no duplicate keys
- non-empty wording
- no outer whitespace
- no null characters
- placeholder preservation
- current source still equals the expected original wording
- actual change exists
- no unknown payload fields

Browser validation is advisory. Server validation is authoritative.

## 13. Deterministic TypeScript source updater

Implementation:

- `src/lib/translationGitHub/sourceUpdate.ts`

The updater:

- maps validated modules to the six fixed translation files
- uses the TypeScript parser to locate exact exported object literals
- unwraps `as const`, `satisfies`, parentheses, and type assertions
- navigates nested objects and array indexes
- rejects functions and non-string values
- verifies stale source wording
- preserves quote style
- escapes quotes, backslashes, newlines, template markers, and Unicode line separators
- replaces only exact string-literal byte ranges
- applies multiple replacements from end to beginning
- rejects duplicate and overlapping replacements
- reparses the updated TypeScript
- operates in memory and performs no local file write

The updater was tested against all six source formats, including double quotes, single quotes, multiline formatting, nested values, arrays, escaping, stale wording, unknown keys, and function rejection. Reversing the synthetic updates restored every original byte.

## 14. Read-only installation connectivity

Read-only GitHub integration files:

- `src/lib/translationGitHub/config.ts`
- `src/lib/translationGitHub/token.ts`
- `src/lib/translationGitHub/readRepository.ts`
- `src/pages/translations/api/github-status.ts`

Production proof confirmed that Vercel can:

- parse the private key
- create a short-lived GitHub App JWT
- exchange it for a short-lived installation token
- read only the fixed repository boundary
- retrieve protected `main`
- expose no token or secret

Fixed values:

- owner: `pank-hub`
- repository: `nepaliNO`
- base branch: `main`
- translation branch prefix: `translation/`

## 15. Protected branch and pull-request pipeline

Implementation:

- `src/lib/translationGitHub/createPullRequest.ts`
- `src/pages/translations/api/create-pull-request.ts`
- controlled UI integration in `src/pages/translations/[language]/[module].astro`

Pipeline:

1. Require valid Pankaj-only session.
2. Require same-origin JSON request.
3. Rerun the server proposal validator.
4. Refuse pull-request creation while registry warnings exist.
5. Fetch fresh protected `main` SHA.
6. Fetch exactly one approved translation source file.
7. Recheck original wording against fresh source.
8. Update exact string literals in memory.
9. Create a unique generated `translation/*` branch.
10. Commit only the approved translation file to that branch.
11. Open a pull request against `main`.
12. Return only safe pull-request metadata and URL.
13. Attempt best-effort deletion of the generated branch if a later operation fails.

The browser cannot supply:

- repository owner or name
- base branch
- target file
- generated branch name
- commit SHA
- commit message
- pull-request title or body
- installation ID
- token
- private key
- arbitrary GitHub API path
- raw TypeScript source

The App never merges a pull request and never updates `main` directly.

## 16. End-to-end production proof

Synthetic production proposal:

- language: Nepali
- module: Navigation
- key: `navigation.home`
- current: `गृहपृष्ठ`
- proposed: `गृहपृष्ठ परीक्षण`

Generated pull request:

- PR #5
- base: `main`
- generated head: `translation/ne-navigation-20260805190924-c934d00857`
- changed files: 1
- additions: 1
- deletions: 1
- only changed file: `src/i18n/ne.ts`
- exact change: one string literal

All required GitHub Actions and Vercel checks passed.

PR #5 was closed without merging. The generated branch was deleted. `main` retained the original wording, no `translation/*` branches remained, and the repository remained clean at `a46a7fb`.

This proves the complete workflow without placing synthetic wording into production.

## 17. Operational invariants

Never weaken these rules:

- Phase 1 remains Pankaj-only.
- Translation files remain authoritative.
- Browser clients never choose repositories, branches, files, or GitHub API paths.
- Every proposal is validated server-side twice: before review and against fresh `main` before GitHub writing.
- Only the six approved translation files may change.
- One module proposal changes one file.
- Every repository change uses a generated `translation/*` branch.
- Every repository change requires a pull request.
- `main` is never modified directly by the App.
- The App has no ruleset bypass.
- Pankaj remains final reviewer and merge authority.
- Secrets never enter Git, chat, screenshots, logs, Markdown, browser JavaScript, or GitHub Actions.
- Public nepali.no remains independent of Translation Editor availability.

## 18. Normal operating workflow

1. Sign in to `/translations/`.
2. Check the registry safeguard status.
3. Open a language and module.
4. Enable editing.
5. Change only reviewed wording.
6. Validate and review exact differences.
7. Create the protected pull request.
8. Open the returned PR URL.
9. Inspect Files changed.
10. Wait for required checks.
11. Resolve review conversations.
12. Squash-merge only when satisfied.
13. Confirm deployment and public wording.
14. Close without merging and delete the branch if the proposal is abandoned.

See `TRANSLATION_OPERATOR_GUIDE.md` for detailed procedures.

## 19. Phase 2 boundary

Possible later additions after a documented risk assessment:

- invited proofreader and editor accounts
- language and module restrictions
- invitation, suspension, and revocation
- saved drafts
- moderation
- comments
- approval and rejection
- self-approval restrictions
- audit history
- advanced batch workflows

No Phase 2 access should be enabled merely because Phase 1 is complete.

## 20. Required checks for future development

After meaningful changes:

1. Verify a clean Git starting point.
2. Review exact source checksums or protected anchors.
3. Run targeted unit or in-memory tests.
4. Run `git diff --check`.
5. Run Astro Check.
6. Run the production build.
7. Run registry and language-parity checks.
8. Confirm no translation source changed unexpectedly.
9. Confirm no secret or App credential entered Git.
10. Review staged inventory and exact diff.
11. Use a feature branch and protected pull request.
12. Wait for required checks.
13. Squash-merge manually.
14. Verify Production behavior.
15. Update architecture and project progress at major checkpoints.

## 21. Immediate follow-up work

Translation Module Phase 1 is operational. Remaining polish:

- replace outdated read-only wording on the Translation Browser dashboard
- add the operator guide to the repository
- complete documentation checkpoint after this continuity package
- begin actual language proofreading through protected pull requests
- monitor the first real translation pull requests carefully

The next major platform milestone is the forum requirements and platform-evaluation phase. Forum work must remain separate from the Translation Module and must not weaken News, Public Information, Event, Directory, privacy, or moderation boundaries.
