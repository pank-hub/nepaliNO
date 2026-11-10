import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'
import {parse, evaluate} from 'groq-js'
import {
  archiveWindow, archiveTotalPages, categorySectionOrder, composeNewsFrontPage,
  formatNewsDate, newsPageUrl, paginationRange, parseNewsCategory, publicNewsCategories,
} from '../../src/lib/newsHub.ts'
import * as queries from '../../src/lib/sanity/newsHubQueries.ts'
import {IMPORTANT_NOW_NEWS_BY_LANGUAGE_QUERY} from '../../src/lib/sanity/queries.ts'
import {finalNewsCategories} from '../../sanity/schemaTypes/newsCategories.ts'
import {getTranslations} from '../../src/i18n/index.ts'
import {isSectionEnabled} from '../../src/config/languageSections.ts'
import {getTranslationModule} from '../../src/lib/translationBrowser/registry.ts'
import {validateTranslationProposal} from '../../src/lib/translationBrowser/validateProposal.ts'
import {isSitemapPage} from '../../src/config/sitemapFilter.mjs'

const story = (id, category = 'current-affairs', extra = {}) => ({
  _id: String(id), title: `Article ${id}`, slug: `article-${id}`, category,
  language: 'ne', publishedAt: '2026-01-01T10:00:00Z', summary: 'Introduction', ...extra,
})
const recent = Array.from({length: 24}, (_, index) => story(index))
const document = (id, extra = {}) => ({
  ...story(id), _type: 'newsArticle', slug: {current: `article-${id}`}, ...extra,
})
const run = async (query, dataset, params = {}) =>
  (await evaluate(parse(query, {params}), {dataset, params})).get()
const read = (file) => readFile(new URL(file, import.meta.url), 'utf8')
const allFrontStories = (front) => [
  front.important, front.lead, ...front.secondary, ...front.latest,
  ...front.sections.flatMap(({stories}) => stories),
].filter(Boolean)

test('eligible Featured Story remains lead; newest is fallback', () => {
  const featured = story('older-featured', 'culture-community')
  const front = composeNewsFrontPage(recent, featured, null, {})
  assert.equal(front.lead, featured)
  assert.deepEqual(front.secondary.map(({_id}) => _id), ['0', '1'])
  assert.equal(front.latest.length, 6)
  assert.equal(composeNewsFrontPage(recent, null, null, {}).lead, recent[0])
  assert.equal(composeNewsFrontPage([], null, null, {}).lead, null)
})

test('two secondary and six Latest stories apply every exclusion without mutating input', () => {
  const duplicateRecent = [recent[0], ...recent, recent[3]]
  const front = composeNewsFrontPage(duplicateRecent, recent[3], recent[1], {
    'current-affairs': recent,
  })
  assert.deepEqual(front.secondary.map(({_id}) => _id), ['0', '2'])
  assert.deepEqual(front.latest.map(({_id}) => _id), ['4', '5', '6', '7', '8', '9'])
  const ids = allFrontStories(front).map(({_id}) => _id)
  assert.equal(ids.length, new Set(ids).size)
  assert.equal(duplicateRecent.length, 26)
  assert.equal(front.important, recent[1])
})

test('Important Now never replaces a Featured lead and absent Important renders no item', () => {
  const front = composeNewsFrontPage(recent, recent[2], recent[0], {})
  assert.equal(front.lead, recent[2])
  assert.equal(front.important, recent[0])
  assert.equal(composeNewsFrontPage(recent, null, null, {}).important, null)
  const overlap = composeNewsFrontPage(recent, recent[0], recent[0], {})
  assert.equal(overlap.important, recent[0])
  assert.equal(overlap.lead, recent[0])
  assert.ok([...overlap.secondary, ...overlap.latest].every(({_id}) => _id !== recent[0]._id))
})

test('category thresholds select 1+4 for 5+, 1+3 for 4, 1+2 for 3, a balanced pair for 2, and hide 0/1', () => {
  for (const [count, expected] of [[0, 0], [1, 0], [2, 2], [3, 3], [4, 4], [5, 5], [8, 5]]) {
    const candidates = Array.from({length: count}, (_, index) => story(`category-${index}`))
    const front = composeNewsFrontPage(recent, null, null, {'current-affairs': candidates})
    assert.equal(front.sections[0]?.stories.length ?? 0, expected)
    if (expected) assert.deepEqual(front.sections[0].stories, candidates.slice(0, expected))
  }
})

test('category thresholds use remaining unique articles, not raw candidates or duplicate filler', () => {
  const unused = Array.from({length: 5}, (_, index) => story(`unused-${index}`))
  for (const count of [0, 1, 2, 3, 4, 5]) {
    const candidates = [...recent.slice(0, 9), ...unused.slice(0, count), ...unused.slice(0, count)]
    const front = composeNewsFrontPage(recent, null, null, {'current-affairs': candidates})
    assert.deepEqual(front.sections[0]?.stories ?? [], count < 2 ? [] : unused.slice(0, count))
    const ids = allFrontStories(front).map(({_id}) => _id)
    assert.equal(new Set(ids).size, ids.length)
  }
})

test('bounded category query still supplies five unused stories after ten top-level exclusions', async () => {
  const dataset = Array.from({length: 30}, (_, index) => document(String(index).padStart(2, '0')))
  const params = {language: 'ne'}
  const [candidates, recentStories] = await Promise.all([
    run(queries.NEWS_HUB_CATEGORIES_QUERY, dataset, params),
    run(queries.NEWS_HUB_RECENT_QUERY, dataset, params),
  ])
  assert.equal(candidates['current-affairs'].length, 18)
  const front = composeNewsFrontPage(recentStories, recentStories[0], recentStories[1], candidates)
  assert.equal(front.secondary.length, 2)
  assert.equal(front.latest.length, 6)
  assert.deepEqual(front.sections[0].stories.map(({_id}) => _id), ['10', '11', '12', '13', '14'])
  const ids = allFrontStories(front).map(({_id}) => _id)
  assert.equal(new Set(ids).size, ids.length)
})

test('category sections follow priority, cap at four, deduplicate and never show legacy', () => {
  const candidates = Object.fromEntries([...publicNewsCategories, 'employment-economy'].map((category) => [
    category, Array.from({length: 5}, (_, index) => story(`${category}-${index}`, category)),
  ]))
  candidates['current-affairs'] = [recent[0], recent[1], recent[1], ...candidates['current-affairs']]
  const front = composeNewsFrontPage(recent, recent[2], recent[0], candidates)
  assert.deepEqual(front.sections.map(({category}) => category), categorySectionOrder.slice(0, 4))
  const ids = allFrontStories(front).map(({_id}) => _id)
  assert.equal(new Set(ids).size, ids.length)
  assert.equal(front.sections.length, 4)
  assert.ok(!front.sections.some(({category}) => category === 'employment-economy'))
})

test('legacy stories remain eligible for lead, secondary and Latest under All News', () => {
  const legacy = recent.map((item) => ({...item, category: 'employment-economy'}))
  const front = composeNewsFrontPage(legacy, null, null, {'employment-economy': legacy})
  assert.equal(front.lead.category, 'employment-economy')
  assert.equal(front.secondary.length, 2)
  assert.equal(front.latest.length, 6)
  assert.deepEqual(front.sections, [])
})

test('all final public categories match schema values and central Nepali/Norwegian labels', () => {
  assert.deepEqual(publicNewsCategories, finalNewsCategories.map(({value}) => value))
  for (const language of ['ne', 'nb']) {
    const labels = getTranslations(language).news
    for (const category of publicNewsCategories) assert.ok(labels.categories[category])
    assert.ok(labels.allNews && labels.usefulGuidance && labels.categoryNavigation)
    assert.ok(labels.categories['employment-economy'])
  }
  for (const invalid of [null, '', 'bad', 'employment-economy', 'CURRENT-AFFAIRS']) {
    assert.equal(parseNewsCategory(invalid), null)
  }
  assert.equal(parseNewsCategory('current-affairs'), 'current-affairs')
})

test('archive offsets preserve existing 9 + 12 model, and filtered pages cover the complete dataset', () => {
  assert.deepEqual(archiveWindow(1, null), {start: 0, end: 9})
  assert.deepEqual(archiveWindow(2, null), {start: 9, end: 21})
  assert.deepEqual(archiveWindow(3, null), {start: 21, end: 33})
  assert.deepEqual(archiveWindow(1, 'sports'), {start: 0, end: 12})
  assert.deepEqual(archiveWindow(2, 'sports'), {start: 12, end: 24})
  for (const category of [null, 'sports']) {
    for (const count of [0, 1, 9, 10, 12, 21, 22, 169]) {
      const covered = Array.from({length: archiveTotalPages(count, category)}, (_, i) => {
        const {start, end} = archiveWindow(i + 1, category)
        return Array.from({length: Math.max(0, Math.min(end, count) - start)}, (_, offset) => start + offset)
      }).flat()
      assert.deepEqual(covered, Array.from({length: count}, (_, index) => index))
    }
  }
})

test('shareable URLs retain language and category, and category changes start at page one', () => {
  assert.equal(newsPageUrl('ne', 1), '/ne/news/')
  assert.equal(newsPageUrl('ne', 1, null, true), '/ne/news/?archive=1')
  assert.equal(newsPageUrl('nb', 2, 'sports'), '/nb/news/page/2/?category=sports')
  assert.equal(newsPageUrl('nb', 1, 'sports'), '/nb/news/?category=sports')
})

test('pagination range has endpoints, current +/-2 and ellipses, not every number', () => {
  assert.deepEqual(paginationRange(8, 15), [1, '…', 6, 7, 8, 9, 10, '…', 15])
  assert.deepEqual(paginationRange(1, 1), [1])
  assert.deepEqual(paginationRange(2, 4), [1, 2, 3, 4])
  assert.deepEqual(paginationRange(15, 15), [1, '…', 13, 14, 15])
  assert.deepEqual(paginationRange(500000, 1000000), [1, '…', 499998, 499999, 500000, 500001, 500002, '…', 1000000])
})

test('News queries exclude wrong language, future, unslugged, drafts and release versions', async () => {
  const dataset = [
    document('valid'), document('featured', {isFeatured: true}),
    document('legacy', {category: 'employment-economy'}),
    document('drafts.hidden'), document('versions.release.hidden'),
    document('foreign', {language: 'nb'}), document('future', {publishedAt: '2099-01-01T00:00:00Z'}),
    document('unslugged', {slug: {}}), document('undated', {publishedAt: undefined}),
  ]
  const params = {language: 'ne', category: null, start: 0, end: 12}
  const result = await run(queries.NEWS_HUB_RECENT_QUERY, dataset, params)
  assert.deepEqual(result.map(({_id}) => _id), ['featured', 'legacy', 'valid'])
  assert.equal((await run(queries.NEWS_HUB_FEATURED_QUERY, dataset, params))._id, 'featured')
  assert.equal(await run(queries.NEWS_HUB_COUNT_QUERY, dataset, params), 3)
  assert.equal((await run(queries.NEWS_HUB_ARCHIVE_QUERY, dataset, params)).length, 3)
  assert.equal(await run(queries.NEWS_HUB_COUNT_QUERY, dataset, {...params, category: 'current-affairs'}), 2)
  const categories = await run(queries.NEWS_HUB_CATEGORIES_QUERY, dataset, params)
  assert.equal(categories['current-affairs'].length, 2)
  assert.equal(categories['employment-economy'], undefined)
  assert.ok(result.some(({_id}) => _id === 'legacy'))
})

test('Important Now eligibility and expiry remain the existing published-content contract', async () => {
  const now = new Date()
  const expired = new Date(now.getTime() - 60000).toISOString()
  const active = new Date(now.getTime() + 60000).toISOString()
  const result = await run(IMPORTANT_NOW_NEWS_BY_LANGUAGE_QUERY, [
    document('expired', {isImportantNow: true, importantUntil: expired}),
    document('active', {isImportantNow: true, importantUntil: active}),
    document('unset', {isImportantNow: true}),
    document('not-selected', {importantUntil: active}),
    document('foreign', {language: 'nb', isImportantNow: true, importantUntil: active}),
    document('future', {isImportantNow: true, importantUntil: active, publishedAt: '2099-01-01T00:00:00Z'}),
  ], {language: 'ne'})
  assert.equal(result._id, 'active')
  assert.equal(await run(IMPORTANT_NOW_NEWS_BY_LANGUAGE_QUERY, [
    document('expired', {isImportantNow: true, importantUntil: expired}),
  ], {language: 'ne'}), null)
})

test('filtered query slices and counts cover only that category across all its pages', async () => {
  const sports = Array.from({length: 29}, (_, index) => document(`sports-${String(index).padStart(2, '0')}`, {category: 'sports'}))
  const dataset = [...sports, ...Array.from({length: 17}, (_, index) => document(`other-${index}`)), document('legacy', {category: 'employment-economy'})]
  const params = {language: 'ne', category: 'sports'}
  const count = await run(queries.NEWS_HUB_COUNT_QUERY, dataset, params)
  assert.equal(count, 29)
  assert.equal(archiveTotalPages(count, 'sports'), 3)
  const results = []
  for (let page = 1; page <= archiveTotalPages(count, 'sports'); page++) {
    results.push(...await run(queries.NEWS_HUB_ARCHIVE_QUERY, dataset, {...params, ...archiveWindow(page, 'sports')}))
  }
  assert.equal(results.length, 29)
  assert.equal(new Set(results.map(({_id}) => _id)).size, 29)
  assert.ok(results.every(({category}) => category === 'sports'))
  assert.equal(await run(queries.NEWS_HUB_COUNT_QUERY, dataset, {...params, category: null}), 47)
})

test('six newest Guides retain agency, have no images/summary, and exclude all ineligible content', async () => {
  const guide = (id, extra = {}) => document(id, {
    _type: 'publicInformationGuide', status: 'active', responsibleAgency: 'NAV',
    featuredImage: {asset: {_ref: 'image-not-projected'}}, summary: 'Not projected', ...extra,
  })
  const valid = Array.from({length: 7}, (_, i) => guide(`guide-${i}`, {
    publishedAt: `2026-01-0${i + 1}T10:00:00Z`, isFeatured: i === 0,
  }))
  const dataset = [
    ...valid, guide('drafts.hidden'), guide('versions.release.hidden'),
    guide('wrong-language', {language: 'nb'}), guide('inactive', {status: 'draft'}),
    guide('future', {publishedAt: '2099-01-01T00:00:00Z'}),
    guide('unslugged', {slug: {}}), guide('undated', {publishedAt: undefined}),
  ]
  const result = await run(queries.NEWS_HUB_GUIDES_QUERY, dataset, {language: 'ne'})
  assert.deepEqual(result.map(({_id}) => _id), ['guide-6', 'guide-5', 'guide-4', 'guide-3', 'guide-2', 'guide-1'])
  assert.equal(new Set(result.map(({_id}) => _id)).size, 6)
  for (const item of result) {
    assert.equal(item.responsibleAgency, 'NAV')
    assert.equal(item.summary, undefined)
    assert.equal(item.featuredImage, undefined)
    assert.equal(item.language, 'ne')
  }
  assert.equal((await run(queries.NEWS_HUB_GUIDES_QUERY, valid.slice(0, 2), {language: 'ne'})).length, 2)
  assert.equal(isSectionEnabled('nb', 'information'), false)
  const loader = await read('../../src/lib/sanity/loadNewsHub.ts')
  assert.match(loader, /isSectionEnabled\(language, 'information'\)/)
  assert.match(loader, /perspective: 'published'/)
})

test('server composition preserves one main landmark, canonical/noindex conventions and optional modules', async () => {
  const [page, route, archive, image, pagination, guides, masthead] = await Promise.all([
    read('../../src/components/news/NewsHubPage.astro'),
    read('../../src/pages/[lang]/news/index.astro'),
    read('../../src/pages/[lang]/news/page/[page].astro'),
    read('../../src/components/news/NewsStory.astro'),
    read('../../src/components/news/NewsPagination.astro'),
    read('../../src/components/news/NewestGuides.astro'),
    read('../../src/components/news/NewsMasthead.astro'),
  ])
  assert.ok(page.indexOf('<ImportantNow') < page.indexOf('<NewsLeadPackage'))
  assert.match(page, /front\.important &&/)
  assert.match(page, /guides\.length > 0 &&/)
  assert.match(page, /canonicalUrl=\{canonical\}/)
  assert.match(page, /noIndex=\{review \|\| category !== null/)
  assert.doesNotMatch(page, /<main|<h1/)
  assert.match(masthead, /<h1>/)
  assert.match(masthead, /aria-current=/)
  for (const source of [route, archive]) assert.match(source, /export const prerender = false/)
  assert.match(archive, /page > data\.total/)
  assert.match(pagination, /aria-current=/)
  assert.match(pagination, /aria-disabled="true"/)
  assert.match(pagination, /class="mobile"/)
  assert.match(image, /srcset=\{image\.srcset\}/)
  assert.match(image, /source\.crop/)
  assert.match(image, /urlFor\(source\)/)
  assert.match(image, /Math\.min\(width, nativeWidth\)/)
  assert.doesNotMatch(image, /placeholder|as any|line-clamp:.*h[23]/)
  assert.doesNotMatch(guides, /<img|guide\.summary|readGuide/)
  assert.doesNotMatch(page + route + archive, /archive-lead__placeholder|news-hero|archive-bottom-links|counter-increment/)
})

test('Oslo date formatting is explicit, localized and independent of server timezone', () => {
  assert.match(formatNewsDate('2026-11-10T23:30:00Z', 'nb'), /11\. november 2026/)
  assert.match(formatNewsDate('2026-11-10T23:30:00Z', 'ne'), /२०२६/)
})

test('new News wording is discoverable and editable through the unchanged Translation Module', () => {
  for (const language of ['ne', 'nb']) {
    const entries = new Map(getTranslationModule(language, 'news').entries.map(({key, value}) => [key, value]))
    for (const key of ['allNews', 'categoryNavigation', 'viewCategory', 'usefulGuidance', 'importantNow', 'emptyCategory', 'pagination']) {
      assert.equal(entries.get(`news.${key}`), getTranslations(language).news[key])
    }
    const key = 'news.usefulGuidance'
    assert.equal(validateTranslationProposal({
      language, module: 'news',
      changes: [{key, originalValue: entries.get(key), proposedValue: 'Updated wording'}],
    }).ok, true)
  }
})

test('request-rendered News retains explicit sitemap coverage without indexing the sitemap as a page', async () => {
  const [config, sitemap] = await Promise.all([
    read('../../astro.config.mjs'), read('../../src/pages/news-sitemap.xml.ts'),
  ])
  assert.match(config, /customSitemaps: \["https:\/\/nepali\.no\/news-sitemap\.xml"\]/)
  assert.match(sitemap, /archiveTotalPages\(count, null\)/)
  assert.match(sitemap, /NEWS_HUB_COUNT_QUERY/)
  assert.equal(isSitemapPage('https://nepali.no/news-sitemap.xml'), false)
  assert.equal(isSitemapPage('https://nepali.no/ne/news/'), true)
  assert.equal(isSitemapPage('https://nepali.no/ne/news/page/2/'), true)
})
