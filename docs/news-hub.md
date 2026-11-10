# News hub

The News hub is a request-rendered Astro newspaper, separate from individual
News article pages. It reads Sanity using the published perspective; it never
writes content. The existing Featured Story and Important Now controls are
reused without schema changes.

## Routes and pagination

- `/{language}/news/`: curated front page.
- `/{language}/news/?archive=1`: chronological entry, articles 1–9.
- `/{language}/news/page/2/`: articles 10–21; subsequent pages contain 12
  articles. These paths and offsets are retained from the previous archive.
- `/{language}/news/?category=current-affairs`: chronological category entry,
  with 12 articles per page.
- `/{language}/news/page/2/?category=current-affairs`: the next 12 articles of
  that category.

Category links reset pagination. Counts and slices use the same language,
category and published-content predicate. Invalid categories, including the
non-public legacy value, redirect to All News; invalid or out-of-range page
numbers return 404. Page 1 aliases redirect to the root News path.

Filtering uses regular server-rendered links, not a downloaded result set or
client-side state. Back/forward and sharing work without JavaScript. Filter
URLs have normalized, category-aware canonicals and use the site's existing
noindex convention. The archive-entry query canonicalizes to the unfiltered
hub. Normal archive pages remain indexable.

Because the hubs are no longer prerendered, the build generates
`/news-sitemap.xml` and includes it in the sitemap index to retain News hub and
archive discovery. Article sitemap coverage is unchanged.

## Editorial selection

`src/lib/newsHub.ts` contains the pure composition and pagination rules.
`src/lib/sanity/newsHubQueries.ts` contains hub-only projections and queries;
existing homepage, search and article queries are unchanged.

1. Select the newest eligible Featured Story across the current language.
   If there is none, select the newest eligible News article.
2. Reserve active Important Now separately, using the existing expiry query.
3. Take two secondary stories, then six Latest stories from recent News.
4. Visit the approved public category priority order. Render one principal plus
   four supporting stories when at least five remain, one plus three when four
   remain, one plus two when three remain, a balanced pair when exactly two
   remain, and nothing for zero or one.
   Cap the total at four category sections. Viewport size never changes selection.
5. Link the six newest active, published Guides in the same language, ordered
   by publication date rather than featured status or review date.

A shared used-ID set excludes the lead, Important Now and all previous
selections. Category candidates are individually bounded to 18 per category:
enough to retain the five-story threshold after all ten possible top-level
exclusions. The recent candidate query is bounded to 24.

If editors select the same article as both Featured Story and Important Now,
the strip links to the lead on the page and shows its expiry context. The
headline and canonical article link are rendered only once, in the lead.

The ten final categories are always available in navigation. The temporary
`employment-economy` value remains supported in All News, the complete
chronological archive, article routes and shared search, but is never a
navigation option or category section.

## Presentation and images

Focused Astro components under `src/components/news/` own their scoped styles.
The former hero, rounded-card systems, oversized Guidance panel, decorative
numbering and dark archive CTA have been removed, not hidden.

On mobile, secondary, Latest and archive items are compact thumbnail rows;
the lead is image-first. Desktop enhances the lead to a two-thirds/one-third
package and Latest to a three-column, two-row grid. Full category sections
have one principal article and four vertically stacked supporting rows with
thin dividers. Rows follow their natural content height with consistent gaps;
no fixed heights or space-distribution rules stretch the stack. Wide-desktop
supporting thumbnails are 160 CSS pixels. Two-story
sections keep balanced columns without a supporting sidebar.

The six Guide links use two columns of three on tablet and desktop, in source
order down the left column then down the right. Mobile uses the same links in
one list. Category navigation has two explicit desktop row groups with unbroken
labels; below the desktop breakpoint those groups form a single scrollable row.

Headlines have no height caps or
line clamps. Only introductions are clamped.

Images use the existing `featuredImage` projection and `urlFor` builder, retain
crop/hotspot/alt data, reserve their aspect ratio and provide responsive
candidates capped by cropped native dimensions. Only the principal image is
eager/high priority. Missing images render no placeholder. Invalid asset/crop
data emits a server warning and renders the article as text rather than
discarding the story.

The masthead date is formatted on the server in `Europe/Oslo`, using `ne-NP`
or `nb-NO`. No browser hydration is involved. Typography inherits the existing
language-level Mukta stack.

Norwegian keeps its News-only language gates: no Guides are fetched or shown.
An empty category has a translated empty state rather than a blank module.

## Validation and local review

```sh
node --import tsx --test tests/news/newsHub.test.mjs
npx astro dev --background
BROWSER_EXECUTABLE=/path/to/chromium node --import tsx --test tests/news/browser.test.mjs
npx astro dev stop
```

The browser suite checks published content at 390, 768 and 1440 px, category
history, server filtering without JavaScript, responsive image presentation,
archive pagination, language gates and image-free states. Screenshots are
written outside the repository by default; `NEWS_REVIEW_DIR` can override the
destination.

The browser suite temporarily installs `/dev/news-hub-test/` from
`tests/news/review-route.astro.txt` for deterministic, noindex local review states:
Important Now, overlap with the lead, missing images and longer pagination
ranges. The test removes the route afterward, so it is absent from production
source and builds. Its fixtures never modify Sanity.
