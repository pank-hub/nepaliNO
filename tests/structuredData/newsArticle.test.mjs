import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ORGANIZATION_ID,
  buildNewsArticleStructuredData,
  resolveAuthor,
} from '../../src/lib/structuredData/newsArticle.ts'

const base = {
  origin: 'https://nepali.no',
  language: 'ne',
  slug: 'sample-article',
  title: 'Sample headline',
  summary: 'Sample summary',
  publishedAt: '2026-09-01T08:30:00.000Z',
  authorName: 'Pankaj Kafley',
  authorType: 'person',
  imageUrl: 'https://cdn.sanity.io/images/p/d/abc-1200x630.jpg?w=1200&h=630&fit=crop&auto=format',
  articleSection: 'Society',
  breadcrumbLabels: {home: 'Home', news: 'News'},
}

const build = (overrides = {}) => buildNewsArticleStructuredData({...base, ...overrides})
const entity = (data, type) => data['@graph'].filter((node) => node['@type'] === type)

test('explicit Person author', () => {
  assert.deepEqual(resolveAuthor('Jane Doe', 'person'), {'@type': 'Person', name: 'Jane Doe'})
})

test('explicit Organization author overrides name-based legacy mapping', () => {
  assert.deepEqual(resolveAuthor('Some Association', 'organization'), {
    '@type': 'Organization',
    name: 'Some Association',
  })
  assert.deepEqual(resolveAuthor('nepali.no Editorial', 'person'), {
    '@type': 'Person',
    name: 'nepali.no Editorial',
  })
})

test('legacy nepali.no Editorial falls back to Organization', () => {
  assert.deepEqual(resolveAuthor('nepali.no Editorial', undefined), {
    '@type': 'Organization',
    name: 'nepali.no Editorial',
  })
  assert.deepEqual(resolveAuthor('nepali.no Editorial', null), {
    '@type': 'Organization',
    name: 'nepali.no Editorial',
  })
})

test('legacy named author falls back to Person, with no pattern inference', () => {
  for (const name of ['Pankaj Kafley', 'Nepali.no Staff', 'Oslo Community Association', 'nepali.no editorial']) {
    assert.deepEqual(resolveAuthor(name, undefined), {'@type': 'Person', name})
  }
})

test('missing author is omitted entirely', () => {
  for (const name of [undefined, null, '', '   ']) {
    assert.equal(resolveAuthor(name, 'person'), undefined)
    assert.equal('author' in entity(build({authorName: name}), 'NewsArticle')[0], false)
  }
})

test('author is exactly type and name with no invented profile data', () => {
  const [article] = entity(build(), 'NewsArticle')
  assert.deepEqual(Object.keys(article.author).sort(), ['@type', 'name'])
  assert.deepEqual(article.author, {'@type': 'Person', name: base.authorName})
  assert.doesNotMatch(JSON.stringify(article.author), /url|sameAs|image/)
})

test('article with an image includes it unchanged', () => {
  assert.equal(entity(build(), 'NewsArticle')[0].image, base.imageUrl)
})

test('article without an image omits image', () => {
  for (const imageUrl of [undefined, null, '']) {
    assert.equal('image' in entity(build({imageUrl}), 'NewsArticle')[0], false)
  }
})

test('inLanguage follows the article language', () => {
  assert.equal(entity(build({language: 'ne'}), 'NewsArticle')[0].inLanguage, 'ne')
  assert.equal(entity(build({language: 'nb'}), 'NewsArticle')[0].inLanguage, 'nb')
})

test('canonical identifiers are absolute and stable', () => {
  const url = 'https://nepali.no/ne/news/sample-article/'
  const data = build()
  const [article] = entity(data, 'NewsArticle')
  const [crumbs] = entity(data, 'BreadcrumbList')
  assert.equal(data['@context'], 'https://schema.org')
  assert.equal(article['@id'], `${url}#newsarticle`)
  assert.equal(article.url, url)
  assert.deepEqual(article.mainEntityOfPage, {'@type': 'WebPage', '@id': url})
  assert.equal(crumbs['@id'], `${url}#breadcrumb`)
})

test('publisher references the shared Organization id only', () => {
  const [article] = entity(build(), 'NewsArticle')
  assert.deepEqual(article.publisher, {'@id': ORGANIZATION_ID})
  assert.equal(ORGANIZATION_ID, 'https://nepali.no/#organization')
  assert.equal(entity(build(), 'Organization').length, 0)
  assert.equal(entity(build(), 'WebSite').length, 0)
})

test('breadcrumbs use localized URLs, labels and positions', () => {
  const ne = entity(build({language: 'ne', breadcrumbLabels: {home: 'गृहपृष्ठ', news: 'समाचार'}}), 'BreadcrumbList')[0]
  assert.deepEqual(ne.itemListElement, [
    {'@type': 'ListItem', position: 1, name: 'गृहपृष्ठ', item: 'https://nepali.no/ne/'},
    {'@type': 'ListItem', position: 2, name: 'समाचार', item: 'https://nepali.no/ne/news/'},
    {'@type': 'ListItem', position: 3, name: 'Sample headline', item: 'https://nepali.no/ne/news/sample-article/'},
  ])
  const nb = entity(build({language: 'nb', breadcrumbLabels: {home: 'Hjem', news: 'Nyheter'}}), 'BreadcrumbList')[0]
  assert.deepEqual(
    nb.itemListElement.map((item) => [item.position, item.name, item.item]),
    [
      [1, 'Hjem', 'https://nepali.no/nb/'],
      [2, 'Nyheter', 'https://nepali.no/nb/news/'],
      [3, 'Sample headline', 'https://nepali.no/nb/news/sample-article/'],
    ],
  )
})

test('no dateModified is ever emitted', () => {
  assert.doesNotMatch(JSON.stringify(build()), /dateModified/)
  assert.equal(entity(build(), 'NewsArticle')[0].datePublished, base.publishedAt)
})

test('an invalid publishedAt is omitted, not replaced', () => {
  assert.equal('datePublished' in entity(build({publishedAt: 'not a date'}), 'NewsArticle')[0], false)
})

test('articleSection is omitted when no label is available', () => {
  assert.equal('articleSection' in entity(build({articleSection: undefined}), 'NewsArticle')[0], false)
})

test('exactly one NewsArticle and one BreadcrumbList, JSON round-trips', () => {
  const data = build()
  assert.equal(data['@graph'].length, 2)
  assert.equal(entity(data, 'NewsArticle').length, 1)
  assert.equal(entity(data, 'BreadcrumbList').length, 1)
  assert.deepEqual(JSON.parse(JSON.stringify(data)), data)
})
