# Shared content search

The homepage search and `/{language}/search/` use the same client, normalisation,
ranking and presentation. The Guidance hub keeps its existing Guidance-only
interface, ordering and substring matching. Its established normalisation has
been extracted into the shared text utility without changing archive behavior.

## Publishing and freshness

`/{language}/search-index.json` is generated at build time from Sanity using the
published perspective and an explicit content allowlist. Only active Guidance,
published News and active published Directory listings with existing slugs are
eligible. Drafts and release versions are excluded. Existing language gates
apply: Nepali indexes all three types; Norwegian currently indexes News only.
Events, Forum, maps, Entur and travel calculations are never sources.

A normal production build/deployment refreshes the index, just as it refreshes
the existing static archives. Publishing, unpublishing or editing content after
a deployment requires a new deployment before search changes. A failed source
query fails the build; an incomplete index is not silently published. There is
no additional webhook, scheduled job or write operation.

The homepage does not embed the index. A meaningful query lazily fetches it once
per language per page session, with revalidation and an eight-second timeout.
Typing is debounced by 180 ms; stale operations cannot replace current results.
No query is sent with the index request. Body matching uses unique normalised
words, not Portable Text, images, links, complete bodies or relationship data.
The wire format shares a dictionary of words and delta-encodes sorted word IDs;
decoding is lossless, so payload reduction does not discard later body matches.

## Matching

Shared search uses Unicode-normalised, lower-case words with punctuation and
hyphens treated as separators. Devanagari marks and Norwegian æ, ø and å are
preserved; zero-width joiners are removed. There is no stemming, transliteration
or automatic synonym generation.

Queries require at least two letters/numbers and are limited to 160 characters.
Every term must match. Exact terms match; word prefixes require three Latin
letters/numbers or two Devanagari letters/numbers. Single-character substring
matches are never used. `NAV`, `UDI`, `BankID` and intact multiword keyword
phrases are supported.

Each query term contributes the highest matching field weight:

| Type | Fields and weights |
| --- | --- |
| Guidance | title 100; keywords 70; summary 40; topic 25; agency 20; body vocabulary 5 |
| News | title 100; keywords 70; summary 40; category 25; source hostname 20; body vocabulary 5 |
| Directory | name 100; keywords/alternate names 70; category/service type 50; summary/description vocabulary 35; location/coverage 25 |

An intact phrase adds the highest matching field weight once. Word vocabularies
receive no phrase boost. Ties use date descending, then stable document ID.
Current category values and their translated labels are read without modifying
the taxonomies. Norwegian labels are also matching context for valid News and
Directory categories and coverage areas.

## Editorial keywords

The optional `searchKeywords` array is shared by Guidance, News and Directory.
Each item is a string of 2–100 characters; exact duplicates and more than 30
terms are rejected. Guidance retains its original Studio input and validation.
For News and Directory, Studio trims strings on blur and validation also
rejects whitespace-only and untrimmed entries from other editing paths.

Keep established phrases intact. Keywords belong to each language-specific
document, not its translation reference. They are internal matching metadata:
not public tags, tag pages, article metadata or SEO keywords. Existing content
without keywords works without a migration. Editors may add relevant terms
manually; this implementation does not populate documents.

## Interaction and privacy

Inline results show six links with neutral text-labelled type tags. Enter opens
the full-results URL; Escape closes inline results without clearing the query.
Full results support query/type URL state, browser back/forward, accessible
pressed-state filter buttons and incremental batches of 20 results.

The input has an independent label. Loading, counts, no results and failures
are announced through a polite live region. Typing does not move focus.
Direct archive links and a JavaScript notice remain available if scripts fail.
Full-results pages are noindex and excluded from the sitemap.

Matching requires JavaScript. There is no query logging, new analytics, paid
provider or search request to an unrelated service. Standard navigation to a
shareable full-results URL includes the query in that URL, so users should
avoid entering confidential information into shared links.

## Validation

Run `npm run test:shared-search` for schema, matching, scope, presentation and
translation tests, then the existing Guidance/homepage regressions, Astro check
and production build. `tests/search/browser.test.mjs` exercises the real UI
using isolated browser-response fixtures, without publishing Sanity documents.
Run it against a local Astro server with `SEARCH_TEST_BASE_URL` and
`BROWSER_EXECUTABLE` set to a headless Chromium executable.
