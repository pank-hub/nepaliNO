# Nepali Interface Proofreading Guide for nepali.no

**Purpose:** This guide explains how an authorized Nepali proofreader can safely correct Nepali interface wording in `src/i18n/ne.ts` using GitHub Codespaces, validate the change, and submit it for publication.

**Important:** This temporary workflow is only for wording corrections. The planned web-based translation editor will replace this Codespaces workflow later.

---

## 1. What the proofreader may change

The proofreader may change only the Nepali text inside quotation marks in:

```text
src/i18n/ne.ts
```

Example of an allowed wording correction:

```ts
submitListing: "सूची पठाउनुहोस्",
```

may become:

```ts
submitListing: "सूची सुझाव दिनुहोस्",
```

Only the wording between the quotation marks is changed.

## 2. What the proofreader must not change

Do not change:

- property names such as `submitListing`
- punctuation outside the quoted text
- braces `{ }`, brackets `[ ]`, parentheses `( )`, commas, or colons
- imports at the top of the file
- functions such as `(count: number) =>`
- file names or folder names
- English or Norwegian files
- code in Astro components
- Sanity schemas
- environment variables, tokens, Vercel settings, or DNS

For example, this is **not allowed**:

```ts
submitListingNepali: "सूची पठाउनुहोस्",
```

The key `submitListing` is application code and must remain unchanged.

Do not translate internal values such as:

```text
community-member
website-digital-resource
online-only
```

Only translate or refine the visible Nepali labels associated with those values.

---

## 3. Before the first proofreading session

Pankaj must first:

1. Invite the proofreader as a GitHub repository collaborator with the minimum suitable access.
2. Explain that no secret token, password, `.env` value, or private submission data may be copied or shared.
3. Confirm whether the proofreader will use a separate branch and Pull Request. This is the recommended workflow.
4. Give the proofreader the repository link:

```text
https://github.com/pank-hub/nepaliNO
```

The proofreader should not work directly on `main` unless Pankaj explicitly decides otherwise.

---

## 4. Start a GitHub Codespace

1. Open the repository on GitHub.
2. Select **Code**.
3. Open the **Codespaces** tab.
4. Create or open a Codespace for the repository.
5. Wait until Visual Studio Code in the browser finishes loading.
6. Open **Terminal > New Terminal**.

The terminal should show a path similar to:

```text
/workspaces/nepaliNO
```

---

## 5. Verify the repository before editing

Run:

```bash
git status --short
git branch --show-current
git log -1 --oneline --decorate
```

Expected before starting:

- `git status --short` gives no output.
- The current branch and latest commit are visible.

If `git status --short` shows existing changes, stop and send the output to Pankaj. Do not edit until the unexpected changes are understood.

---

## 6. Update the local Codespace safely

If the working tree is clean, run:

```bash
git switch main
git pull --ff-only
```

Then create a dedicated proofreading branch. Use the current date in the name:

```bash
git switch -c proofreading/nepali-YYYY-MM-DD
```

Example:

```bash
git switch -c proofreading/nepali-2026-08-03
```

If Git says that the branch already exists, stop and ask Pankaj whether to reopen that branch or create a new numbered branch.

---

## 7. Open the Nepali language file

In the left Explorer panel, open:

```text
src/i18n/ne.ts
```

The file is large. Use search instead of scrolling through the whole file.

### Search within the file

- Windows/Linux: `Ctrl+F`
- Search for the current Nepali phrase, nearby English-style key, or section name.

Examples of section names:

```text
navigation
home
news
events
directory
information
footer
common
```

### Search across the repository

Use:

```text
Ctrl+Shift+F
```

This is useful when the same Nepali phrase may appear in more than one file.

Before changing a repeated phrase, confirm whether every occurrence should change or only one specific context.

---

## 8. Make one small wording batch

Recommended batch size:

- 3 to 15 closely related wording corrections
- one section at a time
- avoid hundreds of unrelated changes in one commit

Good batch examples:

- Directory labels
- Event form instructions
- News metadata
- Public Information wording
- footer wording

Do not use automatic “Replace All” unless every occurrence has been reviewed individually.

### Preserve TypeScript syntax

Old:

```ts
emptyMessage: "नयाँ जानकारी प्रकाशित भएपछि यहाँ देखिनेछ।",
```

Correct edit:

```ts
emptyMessage: "नयाँ जानकारी प्रकाशित भएपछि यहाँ उपलब्ध हुनेछ।",
```

Do not remove the comma, colon, quotation marks, or key.

### Quotation marks inside Nepali text

If visible wording needs quotation marks, prefer Nepali-style or typographic quotation marks that do not terminate the TypeScript string:

```ts
notice: "यसलाई ‘महत्त्वपूर्ण’ अवस्थामा मात्र प्रयोग गर्नुहोस्।",
```

Avoid inserting an unescaped straight double quote inside a double-quoted string.

---

## 9. Review only the wording changes

Save the file with `Ctrl+S`, then run:

```bash
git diff --check
git diff -- src/i18n/ne.ts
```

Review the entire diff carefully.

The diff should show:

- only `src/i18n/ne.ts`
- only intended Nepali wording changes
- unchanged property names
- unchanged punctuation and structure outside the strings

If unexpected files appear, do not stage them.

To see the current status:

```bash
git status --short
```

Expected:

```text
 M src/i18n/ne.ts
```

---

## 10. Validate the application

Run:

```bash
npx astro check
npm run build
```

Required result:

```text
0 errors
0 warnings
```

The production build must finish successfully.

Informational hints are acceptable unless Pankaj says otherwise.

If either command fails:

1. Do not commit.
2. Copy the complete error output.
3. Send the output to Pankaj.
4. Do not try random fixes.

---

## 11. Preview the wording in the browser

Start the local development server:

```bash
npm run dev -- --host 0.0.0.0
```

Open the forwarded port in the browser.

Visit the page where the changed wording appears, for example:

```text
/ne/
/ne/news/
/ne/info/
/ne/events/
/ne/directory/
/ne/events/submit/
/ne/directory/submit/
```

Check:

- spelling and grammar
- natural everyday Nepali
- meaning in the actual page context
- line wrapping on mobile width
- no text overlap
- no horizontal overflow
- buttons remain understandable
- the correction did not change another context unintentionally

For mobile review, use a viewport around:

```text
390 x 844
```

Stop the server with:

```text
Ctrl+C
```

---

## 12. Stage only the Nepali language file

Run:

```bash
git add src/i18n/ne.ts
```

Then verify:

```bash
git diff --cached --check
git diff --cached --name-status
git diff --name-only
git status --short
```

Expected staged file:

```text
M  src/i18n/ne.ts
```

`git diff --name-only` should give no output. That means no unstaged changes remain.

Review the staged wording one final time:

```bash
git diff --cached -- src/i18n/ne.ts
```

---

## 13. Commit the proofreading batch

Use a clear commit message. Examples:

```bash
git commit -m "refine Nepali Directory wording"
```

```bash
git commit -m "proofread Nepali Event form copy"
```

```bash
git commit -m "refine Nepali interface wording"
```

Do not use vague messages such as `changes`, `fix`, or `update`.

---

## 14. Push the proofreading branch

Run:

```bash
git push -u origin HEAD
```

GitHub may display a link for creating a Pull Request.

Open that link, or go to the repository on GitHub and select **Compare & pull request**.

Recommended Pull Request title:

```text
Proofread Nepali Directory wording
```

In the Pull Request description, list:

- sections reviewed
- phrases intentionally changed
- pages previewed
- Astro Check result
- production build result
- any phrase requiring Pankaj’s editorial decision

Do not merge the Pull Request unless Pankaj has authorized the proofreader to merge.

---

## 15. Pankaj’s review and publication process

Pankaj should:

1. Review the complete Pull Request diff.
2. Confirm only intended wording changed.
3. Check that application keys and syntax remain unchanged.
4. Confirm Astro Check and build passed.
5. Preview important pages if necessary.
6. Merge the Pull Request into `main`.
7. Confirm the connected Vercel production deployment reaches **Ready**.
8. Review the changed wording on the deployed public site.

Interface wording stored in `ne.ts` is published through the Git and Vercel deployment workflow. It is not published through Sanity Studio.

---

## 16. Start the next proofreading session

Before a later session, return to `main` and update it:

```bash
git switch main
git pull --ff-only
```

Delete the old local branch only after the Pull Request has been merged and Pankaj confirms it is no longer needed:

```bash
git branch -d proofreading/nepali-YYYY-MM-DD
```

Then create a fresh branch for the next batch:

```bash
git switch -c proofreading/nepali-YYYY-MM-DD-topic
```

---

## 17. Emergency recovery rules

### Accidental edit in the wrong place

Do not use `git restore` until the exact situation is reviewed. First run:

```bash
git status --short
git diff
```

Send the output to Pankaj.

### Syntax or build error

Do not guess. Save the complete error and ask Pankaj.

### Accidentally changed several files

Do not stage or commit. Run:

```bash
git status --short
```

Send the output to Pankaj.

### Accidentally committed to the wrong branch

Do not force-push, reset, rebase, or delete anything. Send:

```bash
git status --short
git branch --show-current
git log -3 --oneline --decorate
```

to Pankaj.

### Merge conflict

Do not resolve it by accepting all incoming or all current changes. Stop and ask Pankaj.

### Secret or private information appears

Do not commit or share it. Notify Pankaj immediately. A secret may require revocation even if it was later deleted from the file.

---

## 18. Proofreading quality checklist

Before submitting a Pull Request, confirm:

- [ ] The wording is natural Nepali, not a literal translation.
- [ ] The meaning matches the actual interface context.
- [ ] Technical, legal, immigration, tax, health, and public-service meaning was not changed unintentionally.
- [ ] Only visible Nepali strings were edited.
- [ ] No keys, braces, commas, imports, functions, or internal values changed.
- [ ] Repeated phrases were reviewed in context.
- [ ] The changed pages were previewed.
- [ ] Mobile wrapping was checked when labels are long.
- [ ] `git diff --check` passed.
- [ ] `npx astro check` passed with 0 errors and 0 warnings.
- [ ] `npm run build` passed.
- [ ] Only `src/i18n/ne.ts` is staged.
- [ ] The commit message describes the proofreading batch.
- [ ] The branch was pushed and a Pull Request was created.

---

## 19. Important limitation of this temporary workflow

`src/i18n/ne.ts` has become large. The long-term plan is a governed web-based interface-language editor so authorized proofreaders can change approved wording without Codespaces or Git.

Until that feature is implemented:

- use small reviewed batches
- use a separate branch
- require a Pull Request
- keep `ne.ts` as the trusted fallback source
- never allow wording edits to change application structure or logic

---

## 20. Contact and escalation

When uncertain, stop before committing and send Pankaj:

```bash
git status --short
git branch --show-current
git diff -- src/i18n/ne.ts
```

It is safer to ask before committing than to repair a structural or publication error later.
