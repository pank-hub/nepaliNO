import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'

const schema = await readFile(
  new URL('../../sanity/schemaTypes/newsArticle.ts', import.meta.url),
  'utf8',
)
const queries = await readFile(
  new URL('../../src/lib/sanity/queries.ts', import.meta.url),
  'utf8',
)

const supportingGuideField = schema.slice(
  schema.indexOf("name: 'supportingGuide'"),
  schema.indexOf("name: 'summary'", schema.indexOf("name: 'supportingGuide'")),
)
const articleQuery = queries.slice(
  queries.indexOf('export const NEWS_ARTICLE_BY_SLUG_QUERY'),
  queries.indexOf('export const UPCOMING_EVENTS_BY_LANGUAGE_QUERY'),
)
const reverseQuery = queries.slice(
  queries.indexOf('export const RECENT_NEWS_FOR_GUIDE_QUERY'),
  queries.indexOf('export const NEWS_ARCHIVE_USEFUL_GUIDES_QUERY'),
)

test('News has one optional primary supporting Guide reference', () => {
  assert.match(supportingGuideField, /type: 'reference'/)
  assert.match(supportingGuideField, /to: \[\{type: 'publicInformationGuide'\}\]/)
  assert.doesNotMatch(supportingGuideField, /rule\.required/)
})

test('Studio selector restricts supporting Guides by language and active status', () => {
  assert.match(supportingGuideField, /language == \$language && status == "active"/)
  assert.match(supportingGuideField, /params: \{language\}/)
  assert.match(supportingGuideField, /status == "active"/)
})

test('individual News projection accepts only an active same-language Guide with a slug', () => {
  assert.match(articleQuery, /supportingGuide->status == "active"/)
  assert.match(articleQuery, /supportingGuide->language == language/)
  assert.match(articleQuery, /defined\(supportingGuide->slug\.current\)/)
  assert.match(articleQuery, /"slug": slug\.current/)
  assert.match(articleQuery, /responsibleAgency/)
  assert.match(articleQuery, /lastReviewedAt/)
})

test('Guide reverse lookup uses the stored News reference and public eligibility rules', () => {
  assert.match(reverseQuery, /supportingGuide\._ref == \$guideId/)
  assert.match(reverseQuery, /language == \$language/)
  assert.match(reverseQuery, /defined\(slug\.current\)/)
  assert.match(reverseQuery, /defined\(publishedAt\)/)
  assert.match(reverseQuery, /publishedAt <= now\(\)/)
})

test('Guide reverse lookup is newest-first and bounded to three News articles', () => {
  assert.match(reverseQuery, /order\(publishedAt desc\) \[0\.\.\.3\]/)
})
