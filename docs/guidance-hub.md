# Guidance Hub Architecture

**Last updated:** 15 November 2026

The public Guidance Hub (`/[lang]/info/`) and Topic Hubs (`/[lang]/info/topic/[slug]/`) follow the Nordic editorial hierarchy introduced on the News Hub (`docs/news-hub.md`), tailored for civic information navigation.

## Routes and language gates

- `/ne/info/`: Main Guidance Hub for Nepali (`ne`).
- `/ne/info/topic/[slug]/`: Dedicated Topic Hub pages rendered for each active `publicInformationTopic` document.
- Norwegian (`nb`) Guidance routes remain disabled via `src/config/languageSections.ts` (`isSectionEnabled(language, 'information')`), with `/nb/info/...` returning temporary 302 redirects to `/nb/`. Keep `getLanguagesWithSection('information')` and `isSectionEnabled` gating intact in all `/info/` routes.

## Editorial composition (`src/lib/guidanceHub.ts`)

`composeGuidanceHub(topics, guides)` produces a deterministic editorial layout from Sanity's `PUBLIC_INFORMATION_TOPICS_BY_LANGUAGE_QUERY` and `ACTIVE_PUBLIC_INFORMATION_GUIDES_QUERY`:

1. **Guidance Masthead (`src/components/guidance/GuidanceMasthead.astro`):** Top `3px solid var(--civic-deep)` rule, page title and active topic/guide totals, concise description, and a scrollable quick-jump bar linking to Recent Guidance, All Topics, and core priority Topic Hubs.
2. **Guidance-Only Search (`.info-search` in `src/pages/[lang]/info/index.astro`):** Preserved inline substring search over guide title, summary, responsible agency, and `searchKeywords` (`buildGuideSearchText`, `matchesGuideSearch`). While searching, `[data-recent-section]` and `[data-topics-section]` are hidden and `[data-guides-section]` reveals matching hairline editorial rows.
3. **Recent & Updated Package (`src/components/guidance/GuidanceRecentPackage.astro`):**
   - **Urgent strip:** Optional top alert bar (`border-inline-start: 3px solid var(--brand)`, `var(--color-brand-50)`) when an active guide has `isUrgent == true`.
   - **Lead spotlight:** Placed in `var(--surface-warm)`, preferring the newest featured guide (distinct from any urgent strip guide, falling back to newest overall).
   - **Recent guides list:** Up to 5 newest/recently updated guides sorted chronologically by `publishedAt` (falling back to `lastReviewedAt`), even when `isFeatured` is `false`, ensuring new guides appear immediately on the hub.
4. **Core Topic Showcase + Directory (`src/components/guidance/GuidanceTopicShowcase.astro`):**
   - Applies `orderGuidanceHubTopics()` from `src/config/guidanceHub.ts` (8 priority keys first, remaining middle topics in relative Sanity order, `other` always last).
   - Elevates up to **6 non-empty priority topics** (excluding `other`) into 2-column editorial blocks, each displaying `GuidanceTopicIcon`, topic title, guide count, concise summary, up to 3 latest preview guide links, and a `"View all"` link.
   - Places all remaining topics into a `var(--surface-muted)` 2-column hairline directory band preserving `orderGuidanceHubTopics` ordering, `GuidanceTopicIcon`, explicit zero-guide status (`noPublishedTopicGuides`), and `other` last.
5. **Fallback & Trust Notice:** Neutral `.trust-notice` editorial disclaimer (`var(--surface-muted)`), plus fallback rendering inside `[data-guides-section]` if active guides exist without an active topic.

## Topic Hubs (`src/pages/[lang]/info/topic/[slug].astro`)

Topic Hubs replace oversized card grids with the same editorial system:

- `3px solid var(--civic-deep)` masthead with breadcrumbs, `GuidanceTopicIcon`, summary, total active guide count, and optional language switcher link.
- Optional `.prose` Portable Text topic introduction and urgent guide strip.
- Up to 3 curated `topic.featuredGuides` (falling back to topic guides marked `isFeatured`) in a 2-column spotlight composition (`var(--surface-warm)` lead + stacked hairline supporting rows).
- Responsive multi-column hairline directory (`1 -> 2 -> 3` columns) for all remaining guides sorted newest-first, plus preserved localized empty states (`यस विषयमा मार्गदर्शन तयार हुँदैछन्` / `Veiledninger for dette temaet er under arbeid`) and a return link to the Guidance Hub.

## Universal audience framing

nepali.no serves **all** Nepali-speaking residents in Norway regardless of arrival route or citizenship history (including direct arrivals, students, workers, families, and people who moved via other EU/EEA countries). Hub headings, navigation labels, and topic previews must remain universally framed around Norwegian civic systems; route-specific distinctions belong inside individual guide content.

## Date handling and accessibility invariants

- `formatGuideDate()` handles both ISO timestamps (`publishedAt`) and `YYYY-MM-DD` date strings (`lastReviewedAt`) safely in `Europe/Oslo` timezone (anchoring date-only strings at 12:00 UTC to avoid DST shifts).
- `BaseLayout` supplies the sole `<main id="main-content">` landmark; hub and topic wrappers avoid nested `<main>` elements.
- Interactive links meet `44px`–`48px` minimum touch targets and retain `:focus-visible` outlines.

## Validation

- Unit & presentation tests: `npm run test:guidance-hub` (`tests/content/guidanceHub.test.mjs`, `tests/content/guidanceHubPresentation.test.mjs`).
- Search & section invariants: `npm run test:guide-search`, `npm run test:language-sections`.
- Type safety & build: `npx astro check` and `npm run build`.
- Note: `.github/workflows/validate-pull-request.yml` should invoke `npm run test:guidance-hub` (added in `package.json`; workflow edits require a workflow-scoped token).
