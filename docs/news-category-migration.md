# News category migration

This is a manual editorial migration, not a content migration script. Schema
options live in `sanity/schemaTypes/newsCategories.ts`; public labels live under
`news.categories` in `src/i18n/ne.ts` and `src/i18n/nb.ts`.

## Final categories

| English Studio title | Stored value | Status |
| --- | --- | --- |
| Current Affairs | `current-affairs` | Existing |
| Immigration and Integration | `immigration-integration` | Existing |
| Education and Student Life | `education-student-life` | Existing |
| Work and Employment | `work-employment` | New |
| Economy and Personal Finance | `economy-personal-finance` | New |
| Consumer and Everyday Life | `consumer-everyday-life` | New |
| Culture and Community | `culture-community` | Existing |
| Health and Welfare | `health-welfare` | Existing |
| Sports | `sports` | Existing |
| Technology and Digital Life | `technology-digital-life` | New |

`employment-economy` remains valid, last in the Studio dropdown, labelled
**Employment and Economy, legacy: please reassign**. Its existing public labels
remain unchanged: Nepali **रोजगारी र अर्थतन्त्र**, Norwegian **Arbeidsliv og økonomi**.
It is not an alias for either new split category. No defaults, keyword-based
classification, document patches, translation updates or publishing are automated.

## Editor workflow

1. Open **News workspace > Employment and Economy: articles to reassign**.
2. Open an article and review its main editorial angle.
3. Select the appropriate final Category in Classification.
4. Add relevant **Search Keywords and Synonyms** in Writing.
5. Review the article, its language and any translated counterpart separately.
6. Publish the reviewed update manually.

Keywords remain optional internal search metadata, not public tags or SEO
keywords. Category selection does not change keywords, or vice versa.
Existing articles without keywords remain valid.

### Distinguishing the four new categories

- **Work and Employment:** employment, unemployment, wages, labour law,
  employment contracts, workplace conditions, unions, occupational health and
  safety, workers' rights, and NAV matters primarily about work or unemployment.
- **Economy and Personal Finance:** inflation, interest rates, mortgages, banks,
  taxes, household debt, savings, benefits primarily about household finances,
  personal finance, housing prices and housing finance.
- **Consumer and Everyday Life:** consumer rights, refunds, misleading sales,
  subscriptions, telecom complaints, product recalls, food warnings, household
  services, tenant complaints and consumer-protection angles.
- **Technology and Digital Life:** artificial intelligence, cybersecurity,
  digital public services, electronic identification, internet and mobile
  networks, online platforms, privacy, social media, apps, gaming and
  technology-industry developments.

Choose the main angle, not every subject mentioned. For example, a telecom
refund dispute is Consumer; a mobile-network technology development is Technology.
Housing finance is Economy; a tenant consumer-protection complaint is Consumer.

## Studio views and read-only inventory

The existing News workspace retains all its views. **News by category** provides
one list per final category; the separate legacy queue uses exactly
`_type == "newsArticle" && category == $category` with
`category = "employment-economy"`. It has no publication-date or language
restriction. Studio's normal document list handles draft/published pairs and
opens the normal editor; no custom document actions are added.

The queue is an editing view, not proof that all underlying stored versions are
gone: an unrepublished legacy published version may coexist with a reassigned
draft. Use **Vision** in the existing Public Content workspace with API version
`2026-03-01`, perspective **raw**, and an authenticated account permitted to read
drafts and release versions. Run this read-only query:

```groq
{
  "published": count(*[
    _type == "newsArticle" && category == "employment-economy" &&
    !(_id in path("drafts.**")) && !(_id in path("versions.**"))
  ]),
  "drafts": count(*[
    _type == "newsArticle" && category == "employment-economy" &&
    _id in path("drafts.**")
  ]),
  "translatedCounterparts": count(*[
    _type == "newsArticle" && category == "employment-economy" &&
    (defined(translation._ref) ||
      _id in *[_type == "newsArticle"].translation._ref ||
      string::split(_id, "drafts.")[1] in *[_type == "newsArticle"].translation._ref)
  ]),
  "scheduledByDate": count(*[
    _type == "newsArticle" && category == "employment-economy" &&
    publishedAt > now()
  ]),
  "releaseVersions": count(*[
    _type == "newsArticle" && category == "employment-economy" &&
    _id in path("versions.**")
  ]),
  "totalStoredDocuments": count(*[
    _type == "newsArticle" && category == "employment-economy"
  ])
}
```

These are stored-document counts, not deduplicated stories. Counts overlap:
translations and future-dated stories can also be published documents or drafts.
`published` includes all base documents, even future-dated ones. Inspect scheduled
publishing/release entries as well; future `publishedAt` alone is not a complete
schedule inventory. A zero total in the authenticated raw view is the decisive
content check, including unlinked language counterparts and release versions.
An unauthenticated public count cannot establish that drafts/releases are empty.

## Compatibility and removal gate

The archive currently has pagination, not category navigation or category-filter
URL state. Its interface is intentionally preserved. Existing archive, homepage,
article and preview queries project categories without an allowlist; central
labels cover final and legacy values, including article-section structured data.
Routes, slugs and canonical handling are unchanged. Shared search indexes both
sets with the existing eligibility, language gates, keyword matching and ranking.
Related News remains editorial-reference based, with same-language Studio
selectors; reverse Guide-to-News lookup remains language-scoped and category
agnostic. The Translation Module discovers all `news.categories` keys in both
languages; it edits interface wording, not Sanity counterparts.

Do not remove the legacy option or its public labels until:

- Zero published News articles, drafts, translated counterparts, scheduled
  documents and release-version documents use `employment-economy`.
- The Studio legacy queue is empty and the authenticated raw inventory is zero.
- Archive queries/labels work with every final category (and any archive filters
  introduced later work with all final categories).
- Shared search displays every final category label.
- Homepage News metadata and related-News behaviour work.
- Translation Module handling works in both languages.

After manual publishing, the normal build/deployment refreshes static archives
and search indexes. No published content is changed by this implementation.

## Focused validation

Run `node_modules/.bin/tsx --test tests/sanity/newsCategories.test.mjs` for
category schema, Studio structure, GROQ, labels, Translation Module and mixed
legacy/final search coverage. Also run the existing shared-search unit/browser,
homepage/Guidance, language-section, preview, related-content and structured-data
regressions, `astro check`, and the production build.

Live Studio verification requires authentication: inspect the dropdown order,
open a legacy document without editing, confirm the optional keyword field, and
open the legacy queue and category views. Do not edit or publish during checks.
