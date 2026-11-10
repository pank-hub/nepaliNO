import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {registerHooks} from 'node:module'
import test from 'node:test'
import {parse, evaluate} from 'groq-js'
import {createSchema} from 'sanity'
import {createStructureBuilder} from 'sanity/structure'
import {
  finalNewsCategories, legacyNewsCategory, newsCategoryOptions, newsCategoryFilter,
} from '../../sanity/schemaTypes/newsCategories.ts'
import {searchKeywordsField} from '../../sanity/schemaTypes/searchKeywords.ts'
import {getTranslations} from '../../src/i18n/index.ts'
import {buildSearchIndex, serializeSearchIndex} from '../../src/lib/search/buildIndex.ts'
import {parseSearchIndex} from '../../src/lib/search/client.ts'
import {prepareSearch, rankSearch} from '../../src/lib/search/engine.ts'
import {getTranslationModule} from '../../src/lib/translationBrowser/registry.ts'
import {validateTranslationProposal} from '../../src/lib/translationBrowser/validateProposal.ts'
import * as queries from '../../src/lib/sanity/queries.ts'

// Studio imports map CSS; these tests exercise schema/structure, not CSS rendering.
const cssHook = registerHooks({
  load(url, context, next) {
    return url.endsWith('.css')
      ? {format: 'module', source: 'export {}', shortCircuit: true}
      : next(url, context)
  },
})
const {newsArticle} = await import('../../sanity/schemaTypes/newsArticle.ts')
const {default: studioConfig} = await import('../../sanity/sanity.config.ts')
cssHook.deregister()

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')
const run = async (query, dataset, params = {}) =>
  (await evaluate(parse(query, {params}), {dataset, params})).get()
const expectedFinalValues = [
  'current-affairs', 'immigration-integration', 'education-student-life',
  'work-employment', 'economy-personal-finance', 'consumer-everyday-life',
  'culture-community', 'health-welfare', 'sports', 'technology-digital-life',
]
const originalValues = [
  'current-affairs', 'immigration-integration', 'education-student-life',
  'employment-economy', 'culture-community', 'health-welfare', 'sports',
]
const categoryField = newsArticle.fields.find(({name}) => name === 'category')
const fixture = (category, language = 'ne', extra = {}) => ({
  _id: `${language}-${category}`, _type: 'newsArticle', language,
  category, title: 'Editorial fixture', slug: {current: `${category}-original-slug`},
  summary: 'Article introduction', publishedAt: '2026-01-01T10:00:00Z',
  ...extra,
})

test('schema offers ten unique final categories followed by the exact legacy option', () => {
  assert.deepEqual(finalNewsCategories.map(({value}) => value), expectedFinalValues)
  assert.equal(new Set(newsCategoryOptions.map(({value}) => value)).size, 11)
  assert.deepEqual(categoryField.options.list, newsCategoryOptions)
  assert.equal(categoryField.options.list.at(-1), legacyNewsCategory)
  assert.equal(legacyNewsCategory.value, 'employment-economy')
  assert.equal(legacyNewsCategory.title, 'Employment and Economy, legacy: please reassign')
  for (const value of originalValues) {
    assert.ok(newsCategoryOptions.some((option) => option.value === value), value)
  }
  for (const {title, value} of newsCategoryOptions) {
    assert.match(value, /^[a-z]+(?:-[a-z]+)*$/)
    assert.doesNotMatch(`${title} ${value}`, /safety|preparedness|housing|property/i)
  }
  assert.equal(categoryField.initialValue, undefined)
  assert.equal(newsArticle.initialValue, undefined)
  assert.equal(categoryField.components, undefined)
})

test('category validation stays required-only, accepting every final and legacy option', async () => {
  const calls = []
  const rule = {required: () => {calls.push('required'); return rule}}
  assert.equal(categoryField.validation(rule), rule)
  assert.deepEqual(calls, ['required'])
  const schema = createSchema({name: 'category-test', types: [{
    name: 'categoryTest', type: 'document', groups: newsArticle.groups, fields: [categoryField],
  }]})
  const compiled = schema.get('categoryTest').fields.find(({name}) => name === 'category').type
  for (const option of newsCategoryOptions) {
    assert.ok(compiled.options.list.some(({value}) => value === option.value))
  }
  assert.equal(compiled.validation.length, 1)
  const context = {
    type: compiled, path: ['category'], i18n: {t: (key) => key},
    getClient: () => {throw new Error('Category validation must not query or change content')},
  }
  for (const {value} of newsCategoryOptions) {
    assert.deepEqual(await compiled.validation[0].validate(value, context), [])
  }
  assert.ok((await compiled.validation[0].validate(undefined, context)).length > 0)
})

test('News keyword field is unchanged, visible in Writing and optional', () => {
  const keywords = newsArticle.fields.find(({name}) => name === 'searchKeywords')
  const expected = searchKeywordsField('writing')
  assert.deepEqual({...keywords, validation: undefined, of: undefined},
    {...expected, validation: undefined, of: undefined})
  assert.equal(keywords.validation.toString(), expected.validation.toString())
  assert.equal(keywords.of[0].validation.toString(), expected.of[0].validation.toString())
  assert.equal(keywords.of[0].components.input, expected.of[0].components.input)
  assert.equal(keywords.hidden, undefined)
  assert.equal(keywords.readOnly, undefined)
  assert.match(keywords.description, /not public tags or SEO keywords/)
  const calls = []
  const rule = Object.fromEntries(['required', 'unique', 'max', 'custom'].map((name) =>
    [name, (...args) => {calls.push([name, ...args]); return rule}]))
  keywords.validation(rule)
  assert.deepEqual(calls.map(([name]) => name), ['unique', 'max', 'custom'])
  assert.equal(calls.find(([name]) => name === 'custom')[1](undefined), true)
  assert.equal(categoryField.components, undefined)
  assert.equal(keywords.components, undefined)
})

test('public labels and Translation Module cover all final and legacy categories in both languages', () => {
  for (const language of ['ne', 'nb']) {
    const labels = getTranslations(language).news.categories
    const entries = new Map(getTranslationModule(language, 'news').entries.map(({key, value}) => [key, value]))
    assert.deepEqual(Object.keys(labels), newsCategoryOptions.map(({value}) => value))
    for (const {value} of newsCategoryOptions) {
      assert.ok(labels[value]?.trim(), `${language}: ${value}`)
      assert.doesNotMatch(labels[value], /legacy|please reassign/i)
      const key = `news.categories.${value}`
      assert.equal(entries.get(key), labels[value])
      assert.equal(validateTranslationProposal({
        language, module: 'news',
        changes: [{key, originalValue: labels[value], proposedValue: `${labels[value]}!`}],
      }).ok, true)
    }
  }
  assert.equal(getTranslations('ne').news.categories['employment-economy'], 'रोजगारी र अर्थतन्त्र')
  assert.equal(getTranslations('nb').news.categories['employment-economy'], 'Arbeidsliv og økonomi')
})

test('actual Studio structure preserves views, opens normal editors and filters every category', async () => {
  const config = studioConfig[0]
  const plugin = config.plugins.find(({name}) => name === 'sanity/structure')
  assert.ok(plugin)
  const tools = plugin.tools
  const resolver = tools[0].options.structure
  const schema = createSchema({name: 'structure-test', types: config.schema.types})
  const S = createStructureBuilder({
    source: {schema, i18n: {t: (key) => key}, document: {resolveNewDocumentOptions: () => []}},
  })
  const root = resolver(S)
  const workspace = root.getItems()[0].getChild()
  const items = workspace.getItems().filter((item) => item.getTitle)
  for (const title of [
    'All News Articles', 'Drafts', 'Scheduled stories', 'Featured stories',
    'Important Now', 'Nepali articles', 'Norwegian articles', 'Missing translations',
  ]) assert.ok(items.some((item) => item.getTitle() === title), title)
  const queue = items.find((item) => item.getTitle() === 'Employment and Economy: articles to reassign').getChild()
  assert.equal(queue.getSchemaType(), 'newsArticle')
  assert.equal(queue.getFilter(), newsCategoryFilter)
  assert.deepEqual(queue.getParams(), {category: 'employment-economy'})
  const serialized = queue.serialize()
  assert.equal(serialized.type, 'documentList')
  assert.equal(serialized.schemaTypeName, 'newsArticle')
  assert.equal(serialized.options.apiVersion, '2026-03-01')
  const dataset = [
    fixture('employment-economy'),
    fixture('employment-economy', 'ne', {_id: 'drafts.ne-employment-economy'}),
    fixture('employment-economy', 'nb', {publishedAt: '2099-01-01T00:00:00Z'}),
    fixture('work-employment'),
  ]
  const snapshot = structuredClone(dataset)
  assert.equal((await run(`*[${queue.getFilter()}]`, dataset, queue.getParams())).length, 3)
  const categories = items.find((item) => item.getTitle() === 'News by category').getChild().getItems()
  assert.equal(categories.length, 10)
  for (const [index, item] of categories.entries()) {
    const list = item.getChild()
    assert.equal(item.getTitle(), finalNewsCategories[index].title)
    assert.equal(list.getSchemaType(), 'newsArticle')
    assert.deepEqual(await run(`*[${list.getFilter()}]`, [fixture(expectedFinalValues[index])], list.getParams()),
      [fixture(expectedFinalValues[index])])
  }
  assert.deepEqual(dataset, snapshot)
})

test('archive, homepage, article routes and preview queries accept mixed category values without category gating', async () => {
  for (const language of ['ne', 'nb']) {
    for (const {value} of newsCategoryOptions) {
      const document = fixture(value, language, {isFeatured: true})
      const other = fixture(value, language === 'ne' ? 'nb' : 'ne')
      const params = {language, slug: document.slug.current, start: 0, end: 12, excludeId: null}
      for (const query of [
        queries.NEWS_ARCHIVE_FEATURED_ARTICLES_BY_LANGUAGE_QUERY,
        queries.NEWS_ARCHIVE_PAGE_BY_LANGUAGE_QUERY,
        queries.HOMEPAGE_LATEST_NEWS_BY_LANGUAGE_QUERY,
      ]) {
        const result = await run(query, [document, other], params)
        assert.equal(result.length, 1)
        assert.equal(result[0].category, value)
        assert.equal(result[0].slug, document.slug.current)
      }
      for (const query of [
        queries.HOMEPAGE_FEATURED_NEWS_BY_LANGUAGE_QUERY,
        queries.NEWS_ARTICLE_BY_SLUG_QUERY,
        queries.NEWS_ARTICLE_PREVIEW_BY_SLUG_QUERY,
      ]) {
        const result = await run(query, [document, other], params)
        assert.equal(result.category, value)
        assert.equal(result.language, language)
        assert.equal(result.slug, document.slug.current)
      }
      assert.equal(await run(queries.NEWS_PUBLIC_ROUTE_EXISTS_QUERY, [document, other], params), true)
    }
  }
})

test('related News remains category agnostic with same-language editorial selection and reverse queries', async () => {
  const reference = newsArticle.fields.find(({name}) => name === 'relatedNews').of[0]
  assert.match(reference.options.filter({document: {_id: 'current', language: 'ne'}}).filter, /language == \$language/)
  for (const {value} of newsCategoryOptions) {
    const related = fixture(value, 'ne', {supportingGuide: {_ref: 'guide'}})
    const article = fixture('current-affairs', 'ne', {relatedNews: [{_ref: related._id}]})
    const result = await run(queries.NEWS_ARTICLE_BY_SLUG_QUERY, [article, related],
      {language: 'ne', slug: article.slug.current})
    assert.equal(result.relatedNews[0].category, value)
    const reverse = await run(queries.RECENT_NEWS_FOR_GUIDE_QUERY, [
      related, fixture(value, 'nb', {supportingGuide: {_ref: 'guide'}}),
    ], {language: 'ne', guideId: 'guide'})
    assert.equal(reverse.length, 1)
    assert.equal(reverse[0].category, value)
    assert.equal(reverse[0].language, 'ne')
  }
})

test('shared search displays and matches every final and legacy label with unchanged keywords and language boundaries', () => {
  for (const language of ['ne', 'nb']) {
    const sources = newsCategoryOptions.map(({value}) => ({
      ...fixture(value, language), slug: `${value}-original-slug`,
      title: 'Fixture title', bodyText: 'originalbodyterm', sourceUrl: 'https://www.nav.no/update',
      searchKeywords: ['originalkeyword'],
    }))
    const snapshot = structuredClone(sources)
    const index = buildSearchIndex([
      ...sources,
      {...sources[0], _id: 'other-language', language: language === 'ne' ? 'nb' : 'ne'},
      {...sources[0], _id: 'drafts.hidden'},
      {...sources[0], _id: 'versions.release.hidden'},
    ], language)
    const ready = prepareSearch(index.documents)
    assert.equal(index.documents.length, 11)
    const decoded = parseSearchIndex(serializeSearchIndex(index), language)
    assert.deepEqual(decoded.documents.map((item) => ({
      ...item, categoryTerms: [...item.categoryTerms].sort(),
    })), index.documents.map((item) => ({
      ...item, categoryTerms: [...item.categoryTerms].sort(),
    })))
    for (const {value} of newsCategoryOptions) {
      const label = getTranslations(language).news.categories[value]
      const id = `${language}-${value}`
      assert.equal(index.documents.find((item) => item.id === id).category, label)
      assert.ok(rankSearch(ready, label).some((item) => item.id === id))
      assert.ok(rankSearch(ready, value).some((item) => item.id === id))
      assert.equal(index.documents.find((item) => item.id === id).url, `/${language}/news/${value}-original-slug/`)
    }
    for (const term of ['originalkeyword', 'originalbodyterm', 'nav.no', 'introduction']) {
      assert.equal(rankSearch(ready, term).length, 11, term)
    }
    assert.deepEqual(sources, snapshot)
  }
})

test('all public metadata surfaces consume central labels, never editorial option titles', async () => {
  for (const path of [
    '../../src/components/news/NewsHubPage.astro',
    '../../src/components/news/NewsStory.astro',
    '../../src/components/articles/NewsArticleView.astro',
    '../../src/components/home/HomeLatestUpdates.astro',
    '../../src/lib/search/buildIndex.ts',
  ]) {
    const source = await read(path)
    assert.match(source, /(?:newsLabels|labels\.news)\.categories/)
    assert.doesNotMatch(source, /legacy: please reassign|newsCategoryOptions|legacyNewsCategory/)
  }
  const article = await read('../../src/components/articles/NewsArticleView.astro')
  assert.match(article, /const articleSection = categoryLabels\[article\.category\]/)
  const routes = await read('../../src/pages/[lang]/news/[slug].astro')
  assert.doesNotMatch(routes, /category/)
})
