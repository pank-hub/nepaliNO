import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'
import {
  buildGuideSearchText,
  matchesGuideSearch,
  normalizeSearchText,
} from '../../src/lib/guideSearch.ts'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

const residence = buildGuideSearchText({
  title: 'नर्वेमा बसोबास अनुमतिसम्बन्धी आधिकारिक जानकारी कहाँ हेर्ने?',
  summary: 'आवेदन प्रक्रिया र हालको नियम।',
  responsibleAgency: 'UDI',
  searchKeywords: ['oppholdstillatelse', 'बसोबास अनुमति', 'Arbeidsinnvandring'],
})

test('matches title, summary, agency and keywords, case-insensitively', () => {
  assert.ok(matchesGuideSearch(residence, 'आवेदन'))
  assert.ok(matchesGuideSearch(residence, 'अनुमतिसम्बन्धी'))
  assert.ok(matchesGuideSearch(residence, 'udi'))
  assert.ok(matchesGuideSearch(residence, 'OPPHOLDSTILLATELSE'))
  assert.ok(matchesGuideSearch(residence, '  बसोबास   अनुमति '))
})

test('requires every term and ignores empty queries', () => {
  assert.ok(matchesGuideSearch(residence, 'udi oppholdstillatelse'))
  assert.ok(!matchesGuideSearch(residence, 'udi skattekort'))
  assert.ok(!matchesGuideSearch(residence, '   '))
})

test('keyword-only terms match without appearing in the other fields', () => {
  const withoutKeywords = buildGuideSearchText({
    title: 'नर्वेमा बसोबास अनुमति',
    summary: 'सारांश',
    responsibleAgency: 'UDI',
  })
  assert.ok(!matchesGuideSearch(withoutKeywords, 'arbeidsinnvandring'))
  assert.ok(matchesGuideSearch(residence, 'arbeidsinnvandring'))
})

test('folds Norwegian letters and accents but keeps Devanagari intact', () => {
  assert.equal(normalizeSearchText('Fødselsnummer'), 'fodselsnummer')
  assert.equal(normalizeSearchText('Ærlig Åpen'), 'aerlig apen')
  assert.equal(normalizeSearchText('café'), 'cafe')
  assert.equal(normalizeSearchText('कर कटौती'), 'कर कटौती')
  assert.equal(normalizeSearchText('क्‍ष'), 'क्ष')
  const text = buildGuideSearchText({title: 'D-nummer og fødselsnummer'})
  assert.ok(matchesGuideSearch(text, 'fodselsnummer'))
  assert.ok(matchesGuideSearch(text, 'fødselsnummer'))
})

test('handles missing optional fields', () => {
  const text = buildGuideSearchText({title: 'BankID', searchKeywords: null})
  assert.ok(matchesGuideSearch(text, 'bankid'))
})

test('the archive query must keep selecting searchKeywords', async () => {
  const queries = await read('../../src/lib/sanity/queries.ts')
  const archiveQuery = queries.slice(
    queries.indexOf('export const ACTIVE_PUBLIC_INFORMATION_GUIDES_QUERY'),
    queries.indexOf('export const FEATURED_PUBLIC_INFORMATION_GUIDES_QUERY'),
  )
  assert.match(archiveQuery, /^\s+searchKeywords,$/m)
})

test('search keywords are not rendered as visible text or in other guide queries', async () => {
  const [page, detailPage, queries] = await Promise.all([
    read('../../src/pages/[lang]/info/index.astro'),
    read('../../src/pages/[lang]/info/[slug].astro'),
    read('../../src/lib/sanity/queries.ts'),
  ])
  assert.doesNotMatch(page, /\.searchKeywords/)
  assert.doesNotMatch(detailPage, /searchKeywords/)
  assert.equal(queries.match(/searchKeywords/g)?.length, 1)
  assert.match(page, /data-search-text=\{searchText\}/)
  assert.match(page, /role="search"/)
  assert.match(page, /<label for="guide-search-input">/)
  assert.match(page, /aria-live="polite"/)
})

test('both languages contain the search labels', async () => {
  for (const file of ['ne', 'nb']) {
    const source = await read(`../../src/i18n/${file}.ts`)
    for (const key of [
      'searchLabel',
      'searchPlaceholder',
      'searchHint',
      'searchResultsHeading',
      'searchResultCount',
      'searchNoResultsHeading',
      'searchNoResultsMessage',
    ]) {
      assert.match(source, new RegExp(`${key}:`))
    }
  }
})
