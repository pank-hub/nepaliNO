import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'
import {parse, evaluate} from 'groq-js'
import {buildSearchIndex, serializeSearchIndex} from '../../src/lib/search/buildIndex.ts'
import {prepareSearch, rankSearch, SEARCH_WEIGHTS} from '../../src/lib/search/engine.ts'
import {parseSearchIndex, resultContext} from '../../src/lib/search/client.ts'
import {isMeaningfulQuery, normalizeSearchText} from '../../src/lib/search/text.ts'
import {SHARED_SEARCH_QUERY} from '../../src/lib/search/query.ts'
import {getTranslations} from '../../src/i18n/index.ts'
import {isSitemapPage} from '../../src/config/sitemapFilter.mjs'
import {
  trimSearchKeyword, validateSearchKeyword, validateSearchKeywords,
} from '../../sanity/schemaTypes/searchKeywordValidation.ts'
import {searchKeywordsField} from '../../sanity/schemaTypes/searchKeywords.ts'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')
const source = (id, type, extra = {}) => ({
  _id: id, _type: type, language: 'ne', slug: id, title: id, ...extra,
})
const fixtures = [
  source('guide', 'publicInformationGuide', {
    title: 'बसोबास अनुमति र BankID', summary: 'आवेदन कहाँ दिने?',
    topicTitle: 'आगमन र आप्रवासन', responsibleAgency: 'UDI',
    searchKeywords: ['residence permit', 'oppholdstillatelse', 'Down syndrome'],
  }),
  source('news', 'newsArticle', {
    title: 'NAV को नयाँ सूचना', summary: 'कर र रोजगार',
    category: 'health-welfare', sourceUrl: 'https://www.nav.no/aktuelt',
    date: '2026-01-02T08:00:00Z', bodyText: 'skattekort arbeid arbeid fødselsnummer',
  }),
  source('listing', 'directoryListing', {
    title: 'Østfold सेवा', category: 'legal-services', county: 'ostfold',
    city: 'Fredrikstad', searchKeywords: ['Personal number', 'Alternate organisation'],
    descriptionText: 'कानुनी सेवा og rådgivning',
  }),
]
const index = buildSearchIndex(fixtures, 'ne')
const prepared = prepareSearch(index.documents)
const search = (query, filter) => rankSearch(prepared, query, filter).map((item) => item.id)

test('keyword validation remains optional, trims and rejects invalid or duplicate entries', () => {
  for (const value of [undefined, null, []]) assert.equal(validateSearchKeywords(value), true)
  assert.equal(trimSearchKeyword('  Down syndrome  '), 'Down syndrome')
  for (const value of ['', ' ', 'x', ' NAV ', 123, 'x'.repeat(101)]) {
    assert.notEqual(validateSearchKeyword(value), true)
  }
  for (const value of [['NAV', 'NAV'], [' '], [3], 'NAV', Array(31).fill('NAV')]) {
    assert.notEqual(validateSearchKeywords(value), true)
  }
  assert.equal(validateSearchKeywords(['NAV', 'UDI', 'Down syndrome']), true)
})

test('all three schemas share optional keyword metadata without changing translations or tags', async () => {
  const field = await read('../../sanity/schemaTypes/searchKeywords.ts')
  assert.match(field, /rule\.unique\(\)\.max\(30\)\.custom/)
  for (const schema of ['newsArticle', 'directoryListing', 'publicInformationGuide']) {
    const text = await read(`../../sanity/schemaTypes/${schema}.ts`)
    assert.match(text, /searchKeywordsField\(/)
    assert.match(text, /name: 'translation'/)
  }
  for (const path of [
    '../../src/components/articles/NewsArticleView.astro',
    '../../src/components/articles/GuideView.astro',
    '../../src/pages/[lang]/directory/[slug].astro',
    '../../src/lib/structuredData/newsArticle.ts',
  ]) assert.doesNotMatch(await read(path), /searchKeywords/)
})

test('Guide keyword field preserves its original Studio input and validation rules', () => {
  const field = searchKeywordsField(undefined, true)
  assert.equal(field.name, 'searchKeywords')
  assert.equal(field.type, 'array')
  assert.equal(field.title, 'Search Keywords and Synonyms')
  assert.equal(field.of[0].type, 'string')
  assert.equal(field.of[0].components, undefined)
  const calls = []
  const rule = Object.fromEntries(['required', 'min', 'max', 'unique', 'custom'].map((name) =>
    [name, (...args) => { calls.push([name, ...args]); return rule }]))
  field.of[0].validation(rule)
  assert.deepEqual(calls.splice(0), [['required'], ['min', 2], ['max', 100]])
  field.validation(rule)
  assert.deepEqual(calls, [['unique'], ['max', 30]])
})

test('normalizes Nepali, Unicode, case, whitespace and punctuation without deleting Norwegian letters', () => {
  assert.equal(normalizeSearchText(' Ærlig Østfold Åpen '), 'ærlig østfold åpen')
  assert.equal(normalizeSearchText('A\u030Apen'), normalizeSearchText('Åpen'))
  assert.equal(normalizeSearchText('क्‍ष'), 'क्ष')
  assert.equal(normalizeSearchText('NAV—UDI / BankID'), 'nav udi bankid')
  assert.equal(normalizeSearchText('  Down \t syndrome '), 'down syndrome')
  assert.equal(normalizeSearchText('D‐nummer'), normalizeSearchText('D-nummer'))
  assert.deepEqual(search('बसोबास   अनुमति'), ['guide'])
  assert.deepEqual(search('bankid आवेदन'), ['guide'])
  assert.deepEqual(search('ØSTFOLD'), ['listing'])
  assert.deepEqual(search('fødselsnummer'), ['news'])
  const norwegian = buildSearchIndex([source('n', 'newsArticle', {
    language: 'nb', title: 'Ærlig og åpen rådgivning i Østfold',
  })], 'nb')
  assert.equal(rankSearch(prepareSearch(norwegian.documents), 'ÆRLIG ÅPEN Østfold').length, 1)
})

test('matches acronyms, phrases, synonyms, body terms, agency and current categories', () => {
  for (const query of ['BankID', 'UDI', 'residence permit', 'Down syndrome', 'oppholdstillatelse']) {
    assert.deepEqual(search(query), ['guide'], query)
  }
  for (const query of ['NAV', 'skattekort', 'health-welfare', 'helse']) {
    assert.deepEqual(search(query), ['news'], query)
  }
  for (const query of ['personal number', 'Alternate organisation', 'rådgivning', 'कानुनी', 'Fredrikstad']) {
    assert.deepEqual(search(query), ['listing'], query)
  }
  assert.deepEqual(search('NAV absent'), [])
  assert.deepEqual(search('av'), [])
})

test('News and Directory existing fields remain searchable without keyword metadata', () => {
  const documents = buildSearchIndex([
    source('no-keywords-news', 'newsArticle', {title: 'Tax card update', summary: 'skattekort'}),
    source('no-keywords-directory', 'directoryListing', {title: 'nepali.no', descriptionText: 'Advice service'}),
  ], 'ne').documents
  const ready = prepareSearch(documents)
  assert.deepEqual(rankSearch(ready, 'skattekort').map((item) => item.id), ['no-keywords-news'])
  assert.deepEqual(rankSearch(ready, 'nepali.no').map((item) => item.id), ['no-keywords-directory'])
  assert.deepEqual(rankSearch(ready, 'Advice').map((item) => item.id), ['no-keywords-directory'])
})

test('very short and excessively long queries do not match partial single characters', () => {
  for (const query of ['', ' ', 'n', 'क', 'ि', '---', 'n'.repeat(161)]) {
    assert.equal(isMeaningfulQuery(query), false)
    assert.deepEqual(search(query), [])
  }
  assert.equal(isMeaningfulQuery('IT'), true)
  assert.equal(isMeaningfulQuery('कर'), true)
  assert.deepEqual(search('n a'), [])
})

test('title ranks above keywords, summary and body-only matches with deterministic ties', () => {
  const documents = buildSearchIndex([
    source('body', 'newsArticle', {bodyText: 'NAV'}),
    source('summary', 'newsArticle', {summary: 'NAV'}),
    source('keywords', 'newsArticle', {searchKeywords: ['NAV']}),
    source('title', 'newsArticle', {title: 'NAV'}),
  ], 'ne').documents
  assert.deepEqual(rankSearch(prepareSearch(documents), 'NAV').map((item) => item.id),
    ['title', 'keywords', 'summary', 'body'])
  assert.equal(SEARCH_WEIGHTS.guidance.title, 100)
  assert.equal(SEARCH_WEIGHTS.directory.descriptionTerms, 35)
})

test('build index sends only needed public fields and deduplicated body vocabulary', () => {
  assert.equal(index.documents.length, 3)
  assert.deepEqual(index.documents[1].bodyTerms, ['skattekort', 'arbeid', 'fødselsnummer'])
  assert.equal(index.documents[0].url, '/ne/info/guide/')
  assert.equal(index.documents[1].url, '/ne/news/news/')
  assert.equal(index.documents[2].url, '/ne/directory/listing/')
  assert.doesNotMatch(JSON.stringify(index), /bodyText|supplementaryText|descriptionText|sourceUrl|asset|translation/)
  assert.doesNotMatch(resultContext(index.documents[1], 'ne'), /कर र रोजगार/)
  assert.match(resultContext(index.documents[2], 'ne'), /Fredrikstad/)
  const decoded = parseSearchIndex(serializeSearchIndex(index), 'ne')
  for (const [i, document] of decoded.documents.entries()) {
    for (const field of ['bodyTerms', 'descriptionTerms', 'categoryTerms', 'locationTerms']) {
      assert.deepEqual(document[field].sort(), index.documents[i][field].sort())
    }
  }
  assert.equal(decoded.documents[0].title, index.documents[0].title)
})

test('scope and language guards reject excluded types, drafts and disabled language routes', () => {
  const excluded = ['event', 'forumTopic', 'entur', 'travel', 'mapLocation'].map((type) => source(type, type))
  const sources = [
    ...fixtures, ...excluded, source('drafts.hidden', 'newsArticle'),
    source('versions.release.hidden', 'newsArticle'),
    source('norwegian', 'newsArticle', {language: 'nb'}),
  ]
  assert.equal(buildSearchIndex(sources, 'ne').documents.length, 3)
  const norwegian = buildSearchIndex([
    ...sources, source('disabled', 'publicInformationGuide', {language: 'nb'}),
    source('directory-nb', 'directoryListing', {language: 'nb'}),
  ], 'nb')
  assert.deepEqual(norwegian.documents.map((item) => item.id), ['norwegian'])
  const encoded = serializeSearchIndex(index)
  assert.throws(() => parseSearchIndex(encoded, 'nb'))
  assert.throws(() => parseSearchIndex({...encoded, documents: [{...encoded.documents[0], url: 'https://evil.example'}]}, 'ne'))
  assert.throws(() => parseSearchIndex({...encoded, documents: [{...encoded.documents[0], bodyTerms: [99_999]}]}, 'ne'))
  assert.deepEqual(search('NAV', 'directory'), [])
  assert.deepEqual(search('NAV', 'news'), ['news'])
})

test('GROQ evaluates published eligibility, date gates, language and text-only projections', async () => {
  const block = (text) => ({_type: 'block', children: [{_type: 'span', text}]})
  const dataset = [
    {_id: 'g', _type: 'publicInformationGuide', language: 'ne', status: 'active', slug: {current: 'g'}, title: 'Guide',
      body: [block('Body'), {_type: 'informationBox', title: 'Box', body: [block('Nested')]}]},
    {_id: 'n', _type: 'newsArticle', language: 'ne', slug: {current: 'n'}, title: 'News', publishedAt: '2020-01-01', searchKeywords: ['NAV']},
    {_id: 'd', _type: 'directoryListing', language: 'ne', listingStatus: 'active', slug: {current: 'd'}, name: 'Directory', publishedAt: '2020-01-01', description: [block('Legal service')]},
  ]
  const hidden = [
    {...dataset[0], _id: 'inactive', status: 'draft'},
    {...dataset[1], _id: 'scheduled', publishedAt: '2099-01-01'},
    {...dataset[1], _id: 'undated', publishedAt: undefined},
    {...dataset[1], _id: 'drafts.hidden'},
    {...dataset[1], _id: 'versions.release.hidden'},
    {...dataset[1], _id: 'norwegian', language: 'nb'},
    {...dataset[2], _id: 'closed', listingStatus: 'permanently-closed'},
    ...['event', 'forumTopic', 'entur', 'travel', 'mapLocation'].map((_type) => ({...dataset[1], _id: _type, _type})),
  ]
  const value = await evaluate(parse(SHARED_SEARCH_QUERY), {
    dataset: [...dataset, ...hidden], params: {language: 'ne', guidance: true, directory: true},
  })
  const rows = await value.get()
  assert.deepEqual(rows.map((row) => row._id), ['d', 'g', 'n'])
  assert.equal(rows[0].descriptionText, 'Legal service')
  assert.equal(rows[1].bodyText, 'Body')
  assert.deepEqual(rows[1].supplementaryText, [{title: 'Box', text: 'Nested'}])
  assert.deepEqual(rows[2].searchKeywords, ['NAV'])
})

test('shared UI is translated, accessible, compact and uses only the reserved homepage slot', async () => {
  const [component, home, fullPage] = await Promise.all([
    read('../../src/components/search/ContentSearch.astro'),
    read('../../src/pages/[lang]/index.astro'),
    read('../../src/pages/[lang]/search.astro'),
  ])
  assert.match(home, /ContentSearch slot="search"/)
  assert.match(component, /role="search"/)
  assert.match(component, /<label class="sr-only" for=\{id\}/)
  assert.match(component, /role="status" aria-live="polite" aria-atomic="true"/)
  assert.match(component, /aria-pressed="true"/)
  assert.match(component, /flex-wrap: wrap/)
  assert.match(component, /font-size: 0\.8125rem/)
  assert.doesNotMatch(component, /role="combobox"|<img|innerHTML|TravelHelp/)
  assert.match(fullPage, /noIndex/)
  assert.deepEqual(Object.keys(getTranslations('ne').search).sort(), Object.keys(getTranslations('nb').search).sort())
  for (const language of ['ne', 'nb']) {
    assert.equal(isSitemapPage(`https://nepali.no/${language}/search/`), false)
    assert.equal(isSitemapPage(`https://nepali.no/${language}/search-index.json`), false)
    assert.equal(isSitemapPage(`https://nepali.no/${language}/news/`), true)
  }
})
