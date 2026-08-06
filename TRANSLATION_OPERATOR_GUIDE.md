# nepali.no Translation Operator Guide

**Audience:** Pankaj Kafley, Phase 1 operator and final reviewer
**Last updated:** 5 August 2026
**Applies to:** Production Translation Editor at `/translations/`

## 1. Purpose

This guide explains how to review interface wording, create a protected translation pull request, review or abandon it, merge an approved change, verify deployment, and respond safely to common failures.

Phase 1 is Pankaj-only. Proofreaders may send suggestions through familiar channels, but they do not receive portal, GitHub App, Vercel, repository, or merge access.

## 2. Non-negotiable rules

- Never paste credentials, tokens, private keys, environment values, or private submission data into translation fields.
- Never change technical keys.
- Never edit functions or TypeScript logic through GitHub to solve a wording issue.
- Never bypass the registry warning report.
- Never merge before reviewing Files changed.
- Never merge while required checks are failing or pending.
- Never give the Translation GitHub App ruleset bypass access.
- Never commit directly to `main` for normal Translation Editor work.
- Close and delete the generated branch if a proposal is wrong or no longer needed.

## 3. Before starting

1. Open the Production Translation Editor.
2. Sign in with the approved GitHub account.
3. Confirm the dashboard shows no registry warnings.
4. If warnings exist, open the safeguard report and stop. A developer must classify or correct the source structure before editing continues.
5. Confirm the intended language and module.
6. Keep the proofreader's source suggestion available for comparison.

## 4. Create a translation proposal

1. Open the relevant language and module.
2. Click **Enable editing**.
3. Change only wording that has been reviewed.
4. Do not alter placeholders such as `{name}` or other protected markers.
5. Avoid unintended spaces at the beginning or end.
6. Review the live changed-string count.
7. Click **Validate and review changes**.

The server checks the language, module, key, value type, length, placeholders, current source wording, and registry state.

## 5. Review before creating a pull request

For every changed key, compare:

- technical key
- current wording
- proposed wording

Check:

- spelling and grammar
- meaning
- tone
- punctuation
- capitalization
- consistency with nearby labels
- placeholders
- whether the proposal belongs to the selected language
- whether the change accidentally includes explanation or reviewer comments

If anything is wrong:

1. Click **Return to editing**.
2. Correct the wording, or click **Cancel editing** to restore the original values.
3. Validate again.

## 6. Create the protected pull request

When the exact review is correct:

1. Click **Create protected pull request** once.
2. Wait while the button says the pull request is being created.
3. Do not refresh or submit again.
4. When the link appears, click **Open pull request #...**.

The server creates a generated `translation/*` branch and opens a pull request against protected `main`. The App does not merge it.

## 7. Review the GitHub pull request

On GitHub:

1. Confirm the base branch is `main`.
2. Confirm the head branch begins with `translation/`.
3. Open **Files changed**.
4. Confirm only the expected translation file changed.
5. Confirm every changed line matches the validated proposal.
6. Confirm no import, key, function, array structure, format, workflow, or unrelated wording changed.
7. Review the PR description and changed-key list.
8. Wait for all checks.

Expected required check:

- `Astro check and production build`

Expected Vercel checks:

- public application
- Sanity Studio
- Preview Comments

## 8. Merge an approved pull request

Merge only when:

- Files changed is correct
- required checks pass
- review conversations are resolved
- the proposal is still wanted
- no newer source change makes it obsolete

Use **Squash and merge** only.

After merging:

1. Delete the generated branch if GitHub has not already done so.
2. Wait for the Production deployment.
3. Open the affected public page.
4. Hard-refresh or use an uncached session if Edge shows older output.
5. Confirm the intended wording appears.
6. Confirm nearby layout, wrapping, mobile behavior, and accessibility remain sound.

## 9. Abandon or reject a pull request

If the proposal is wrong, outdated, duplicated, or no longer needed:

1. Do not merge.
2. Add a short GitHub comment explaining why it is being abandoned.
3. Close the pull request.
4. Delete the generated `translation/*` branch.
5. Confirm no translation branches remain unexpectedly.

Closing a pull request does not change `main`.

## 10. Common errors

### Stale source

Meaning: the source changed after the editor page loaded.

Action:

1. Reload the module.
2. Review the latest wording.
3. Re-enter the proposal only if still appropriate.
4. Validate again.

Never overwrite newer wording blindly.

### Registry review required

Meaning: an unassigned section or structural mismatch exists.

Action:

1. Open `/translations/unassigned/`.
2. Stop editing.
3. Ask a developer to assign, exclude, or correct the structure.

### Validation failed

Check the error summary for:

- empty value
- outer whitespace
- unknown key
- duplicate key
- placeholder mismatch
- unsupported language or module
- excessive length

Correct the exact issue and validate again.

### Pull-request service unavailable

Do not repeatedly click the button.

Check in order:

1. GitHub status and App installation availability
2. Vercel Runtime Logs for the public `nepali-no` project
3. App installation remains scoped to `pank-hub/nepaliNO`
4. App permissions remain Contents and Pull requests write only
5. Vercel Production variables still exist
6. no existing branch or PR conflict

Do not regenerate the private key or reinstall the App without evidence that the credential is the problem.

### Old interface or old wording appears

Edge may cache portal assets or pages.

Try:

1. close the old tab
2. open a new tab
3. use an InPrivate window
4. clear cached images and files for the recent period
5. use Developer Tools with Disable cache for one reload

Do not redeploy or change code merely because one browser profile shows an older page.

### Required check fails

Open the failed GitHub Actions log.

Do not merge. Correct the demonstrated problem on an ordinary feature branch and use a protected pull request.

## 11. Security and credential handling

The following Vercel variable values must never be displayed or copied into ordinary documentation:

- OAuth client secret
- session secret
- GitHub App private key

The App ID and installation ID are configuration identifiers, but they should still be handled with restraint.

Private key rotation procedure:

1. Generate a new key in GitHub App settings.
2. store it securely
3. update the Production-only Sensitive Vercel variable
4. deploy and verify connectivity
5. revoke the old key only after the new key is proven

Never keep multiple unused keys.

## 12. Recovery checks

Useful read-only checks from Codespaces:

```bash
git status --short
git log -1 --oneline --decorate
gh pr list --repo pank-hub/nepaliNO --state open
git ls-remote --heads origin 'refs/heads/translation/*'
```

To inspect a pull request:

```bash
gh pr view PR_NUMBER --repo pank-hub/nepaliNO
gh pr diff PR_NUMBER --repo pank-hub/nepaliNO --name-only
gh pr checks PR_NUMBER --repo pank-hub/nepaliNO
```

To close a rejected synthetic or real proposal without merging:

```bash
gh pr close PR_NUMBER \
  --repo pank-hub/nepaliNO \
  --delete-branch \
  --comment "Closed without merge after editorial review."
```

## 13. First real proofreading sessions

For the first real pull requests:

- keep each proposal small
- prefer one module and a limited number of related strings
- inspect every diff carefully
- avoid mixing unrelated vocabulary changes
- wait for deployment verification before beginning a large follow-up batch
- record repeated terminology decisions for proofreaders

## 14. Phase 2 is not enabled

Do not create proofreader accounts or share Pankaj's access.

Invited users, role restrictions, drafts, moderation, comments, approvals, audit history, suspension, and revocation belong to Phase 2 after a documented risk assessment.
