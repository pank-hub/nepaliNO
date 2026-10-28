import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'
import {normalizeReadAlso, readAlsoPath} from '../../src/lib/readAlso/normalize.ts'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

const NOW = new Date('2026-10-28T12:00:00Z')
const image = {asset: {_ref: 'image-abc-800x600-jpg'}, alt: 'x', hotspot: {x: 0.5}, crop: {top: 0}}

const news = (extra = {}) => ({
  _id: 'news-1',
  _type: 'newsArticle',
  title: 'नयाँ इलेक्ट्रिक गाडी',
  slug: 'ev-guarantee',
  language: 'ne',
  publishedAt: '2026-10-01T08:00:00Z',
  featuredImage: image,
  ...extra,
})

const guide = (extra = {}) => ({
  _id: 'guide-1',
  _type: 'publicInformationGuide',
  title: 'BankID',
  slug: 'bankid-norway',
  language: 'ne',
  status: 'active',
  ...extra,
})

const card = (target, extra = {}) => ({_type: 'readAlsoCard', _key: 'k1', documentId: 'current-doc', target, ...extra})
const run = (input, language = 'ne') => normalizeReadAlso(input, {language, now: NOW})

test('News target with an image is kept with its image source', () => {
  const result = run(card(news()))
  assert.equal(result.targetType, 'newsArticle')
  assert.equal(result.title, 'नयाँ इलेक्ट्रिक गाडी')
  assert.equal(result.href, '/ne/news/ev-guarantee/')
  assert.deepEqual(result.image.asset, image.asset)
  assert.deepEqual(result.image.hotspot, image.hotspot)
})

test('News target without an image is text-only', () => {
  assert.equal(run(card(news({featuredImage: undefined}))).image, undefined)
  assert.equal(run(card(news({featuredImage: null}))).image, undefined)
  assert.equal(run(card(news({featuredImage: {alt: 'no asset'}}))).image, undefined)
})

test('Guide target is text-only even if image-like data is present', () => {
  const result = run(card(guide({featuredImage: image, socialImage: image})))
  assert.equal(result.targetType, 'publicInformationGuide')
  assert.equal(result.href, '/ne/info/bankid-norway/')
  assert.equal(result.image, undefined)
})

test('all four editorial combinations resolve for each language', () => {
  for (const language of ['ne', 'nb']) {
    assert.equal(run(card(news({language})), language).href, `/${language}/news/ev-guarantee/`)
    assert.equal(run(card(guide({language})), language).href, `/${language}/info/bankid-norway/`)
  }
})

test('URL generation ignores any URL in the data and uses type, language and slug', () => {
  assert.equal(readAlsoPath('newsArticle', 'nb', 'a-b'), '/nb/news/a-b/')
  assert.equal(readAlsoPath('publicInformationGuide', 'ne', 'a-b'), '/ne/info/a-b/')
  const result = run(card(news({url: 'https://evil.example/', href: '//evil.example'})))
  assert.equal(result.href, '/ne/news/ev-guarantee/')
})

test('missing, null or malformed references render nothing', () => {
  for (const input of [undefined, null, 'x', {}, card(undefined), card(null), card('x'), card({})]) {
    assert.equal(run(input), undefined)
  }
})

test('unknown target types render nothing', () => {
  assert.equal(run(card(news({_type: 'communityEvent'}))), undefined)
})

test('target in another language renders nothing', () => {
  assert.equal(run(card(news({language: 'nb'})), 'ne'), undefined)
  assert.equal(run(card(guide({language: 'ne'})), 'nb'), undefined)
  assert.equal(run(card(news({language: undefined}))), undefined)
})

test('self-references render nothing, including draft and published id pairs', () => {
  assert.equal(run(card(news({_id: 'current-doc'}))), undefined)
  assert.equal(run(card(news({_id: 'drafts.current-doc'}))), undefined)
  assert.equal(run(card(guide({_id: 'current-doc'}), {documentId: 'drafts.current-doc'})), undefined)
  assert.ok(run(card(news({_id: 'other-doc'}))))
})

test('future-dated, undated and invalid-dated News render nothing', () => {
  assert.equal(run(card(news({publishedAt: '2026-10-29T00:00:00Z'}))), undefined)
  assert.equal(run(card(news({publishedAt: undefined}))), undefined)
  assert.equal(run(card(news({publishedAt: 'not a date'}))), undefined)
  assert.ok(run(card(news({publishedAt: '2026-10-28T12:00:00Z'}))))
})

test('inactive or status-less Guides render nothing', () => {
  assert.equal(run(card(guide({status: 'draft'}))), undefined)
  assert.equal(run(card(guide({status: 'archived'}))), undefined)
  assert.equal(run(card(guide({status: undefined}))), undefined)
})

test('missing or unsafe slugs and blank titles render nothing', () => {
  for (const slug of [undefined, '', '  ', 'a b', '../x', 'a/b', '//x', 'a?b', 'a#b', 'x\\y', '-a']) {
    assert.equal(run(card(news({slug}))), undefined, String(slug))
  }
  assert.equal(run(card(news({title: '   '}))), undefined)
  assert.equal(run(card(news({title: undefined}))), undefined)
  assert.ok(run(card(guide({slug: 'EU-EEA-regulation-norway'}))))
})

test('schema is a weak reference to News and Guides with a language-scoped, published-only filter', async () => {
  const source = await read('../../sanity/schemaTypes/readAlso.ts')
  assert.match(source, /name: 'readAlsoCard'/)
  assert.match(source, /to: \[\{type: 'newsArticle'\}, \{type: 'publicInformationGuide'\}\]/)
  assert.match(source, /weak: true/)
  assert.match(source, /language == \$language/)
  assert.match(source, /_id != \$currentId && _id != \$draftId/)
  assert.match(source, /defined\(publishedAt\) && dateTime\(publishedAt\) <= dateTime\(now\(\)\)/)
  assert.match(source, /status == "active"/)
  const fields = [...source.matchAll(/defineField\(\{\s*name: '(\w+)'/g)].map((m) => m[1])
  assert.deepEqual(fields, ['target'])
})

test('schema is registered and used in News and Guide bodies', async () => {
  const index = await read('../../sanity/schemaTypes/index.ts')
  assert.match(index, /readAlso,/)
  for (const file of ['newsArticle', 'publicInformationGuide']) {
    const source = await read(`../../sanity/schemaTypes/${file}.ts`)
    assert.match(source, /readAlsoBlockMember,/, file)
    assert.match(source, /informationBoxBlockMember,/, file)
  }
})

test('GROQ resolves the reference and never projects a Guide image', async () => {
  const queries = await read('../../src/lib/sanity/queries.ts')
  const fragment = queries.slice(
    queries.indexOf('const READ_ALSO_BODY_PROJECTION'),
    queries.indexOf('export const NEWS_ARTICLES_QUERY'),
  )
  assert.match(fragment, /"target": target->\{/)
  assert.match(fragment, /"documentId": \^\._id/)
  assert.match(fragment, /_type == "newsArticle" => \{[^}]*featuredImage/s)
  assert.match(fragment, /_type == "publicInformationGuide" => \{\s*status\s*\}/)
  assert.doesNotMatch(fragment, /socialImage/)
  assert.equal(queries.match(/\$\{READ_ALSO_BODY_PROJECTION\}/g).length, 2)
})

test('Sanity client uses the published perspective explicitly', async () => {
  const config = await read('../../astro.config.mjs')
  assert.match(config, /perspective: "published"/)
})

test('both pages register the renderer', async () => {
  for (const file of ['news', 'info']) {
    const source = await read(`../../src/pages/[lang]/${file}/[slug].astro`)
    assert.match(source, /readAlsoCard: language === 'ne' \? ReadAlsoCardNe : ReadAlsoCardNb/, file)
    assert.match(source, /_type: 'readAlsoCard'/, file)
  }
})

test('localized labels exist in Nepali, Norwegian and English', async () => {
  assert.match(await read('../../src/i18n/ne.ts'), /readAlso: "यो पनि पढ्नुहोस्"/)
  assert.match(await read('../../src/i18n/nb.ts'), /readAlso: "Les også"/)
  assert.match(await read('../../src/i18n/en.ts'), /readAlso: "Read also"/)
  const index = await read('../../src/i18n/index.ts')
  assert.doesNotMatch(index, /\ben\b/)
})

test('component is one link with an accessible name, decorative image and no balance', async () => {
  const source = await read('../../src/components/content/ReadAlsoCard.astro')
  assert.match(source, /aria-label=\{`\$\{label\}: \$\{card\.title\}`\}/)
  assert.match(source, /alt=""/)
  assert.match(source, /:focus-visible/)
  assert.match(source, /prefers-reduced-motion/)
  assert.match(source, /min-width: 0/)
  assert.doesNotMatch(source, /text-wrap:\s*balance/)
  assert.doesNotMatch(source, /socialImage/)
  assert.doesNotMatch(source, /<button|<input|<h[1-6]/)
  assert.equal((source.match(/<a[\s>]/g) ?? []).length, 1)
  assert.match(source, /var\(--color-brand-50\)/)
  const hexColours = [...source.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0]).filter((c) => c !== '#000')
  assert.deepEqual(hexColours, [])
})

test('wrapper components inject the language only', async () => {
  for (const [file, language] of [['Ne', 'ne'], ['Nb', 'nb']]) {
    const source = await read(`../../src/components/content/ReadAlsoCard${file}.astro`)
    assert.match(source, new RegExp(`language="${language}"`))
  }
})
