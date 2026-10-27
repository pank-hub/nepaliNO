import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'
import {
  INFORMATION_BOX_VARIANTS,
  isSafeLinkHref,
  normalizeInformationBox,
} from '../../src/lib/informationBox/normalize.ts'
const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

const paragraph = (text, extra = {}) => ({
  _type: 'block',
  _key: 'b1',
  style: 'normal',
  markDefs: [],
  children: [{_type: 'span', _key: 's1', text, marks: []}],
  ...extra,
})

const box = (overrides = {}) => ({
  _type: 'informationBox',
  _key: 'box-1',
  variant: 'important',
  title: 'Title',
  body: [paragraph('Body text')],
  ...overrides,
})

test('all four valid variants are preserved', () => {
  assert.deepEqual(INFORMATION_BOX_VARIANTS, ['important', 'attention', 'tip', 'fact'])
  for (const variant of INFORMATION_BOX_VARIANTS) {
    assert.equal(normalizeInformationBox(box({variant})).variant, variant)
  }
})

test('missing and unknown variants fall back to neutral fact', () => {
  assert.equal(normalizeInformationBox(box({variant: undefined})).variant, 'fact')
  assert.equal(normalizeInformationBox(box({variant: 'danger'})).variant, 'fact')
  assert.equal(normalizeInformationBox(box({variant: 42})).variant, 'fact')
})

test('missing or blank title is omitted', () => {
  assert.equal(normalizeInformationBox(box({title: undefined})).title, undefined)
  assert.equal(normalizeInformationBox(box({title: '   '})).title, undefined)
  assert.equal(normalizeInformationBox(box()).title, 'Title')
})

test('empty, missing or malformed body renders nothing', () => {
  assert.equal(normalizeInformationBox(box({body: []})), undefined)
  assert.equal(normalizeInformationBox(box({body: undefined})), undefined)
  assert.equal(normalizeInformationBox(box({body: [paragraph('   ')]})), undefined)
  assert.equal(normalizeInformationBox(box({body: [{_type: 'image'}]})), undefined)
  assert.equal(normalizeInformationBox(null), undefined)
})

test('non-block members and headings are dropped or flattened', () => {
  const result = normalizeInformationBox(
    box({body: [{_type: 'editorialChart'}, paragraph('Heading', {style: 'h2'})]}),
  )
  assert.equal(result.body.length, 1)
  assert.equal(result.body[0].style, 'normal')
})

test('relative and https links are kept', () => {
  for (const href of ['/info/work/', 'info/work', '#section', 'https://example.com/a?b=1', 'http://example.com']) {
    assert.equal(isSafeLinkHref(href), true, href)
  }
})

test('unsupported protocols and unsafe hrefs are rejected', () => {
  for (const href of [
    'javascript:alert(1)',
    ' JavaScript:alert(1)',
    'java\nscript:alert(1)',
    'data:text/html,x',
    'mailto:a@b.no',
    'ftp://example.com',
    '//evil.example',
    '',
    undefined,
  ]) {
    assert.equal(isSafeLinkHref(href), false, String(href))
  }
})

test('unsafe link annotations are removed but the text is kept', () => {
  const result = normalizeInformationBox(
    box({
      body: [
        paragraph('x', {
          markDefs: [
            {_key: 'bad', _type: 'link', href: 'javascript:alert(1)'},
            {_key: 'good', _type: 'link', href: '/info/'},
          ],
          children: [
            {_type: 'span', _key: 'a', text: 'Bad', marks: ['bad']},
            {_type: 'span', _key: 'b', text: 'Good', marks: ['good', 'strong']},
          ],
        }),
      ],
    }),
  )
  const [block] = result.body
  assert.deepEqual(block.markDefs.map((d) => d._key), ['good'])
  assert.deepEqual(block.children[0].marks, [])
  assert.deepEqual(block.children[1].marks, ['good', 'strong'])
  assert.equal(block.children[0].text, 'Bad')
})

test('id suffix is sanitized and falls back to index', () => {
  assert.equal(normalizeInformationBox(box({_key: 'a b<c'}), 3).idSuffix, 'abc')
  assert.equal(normalizeInformationBox(box({_key: undefined}), 3).idSuffix, 'i3')
})

test('variant labels are not rendered or translated', async () => {
  for (const file of ['ne', 'nb', 'en']) {
    const source = await read(`../../src/i18n/${file}.ts`)
    assert.doesNotMatch(source, /informationBox: \{/, file)
  }
  const component = await read('../../src/components/content/InformationBox.astro')
  assert.doesNotMatch(component, /information-box__label|variants/)
  const schema = await read('../../sanity/schemaTypes/informationBox.ts')
  assert.doesNotMatch(schema, /subtitle/)
})

test('schema is registered and used in News and Guide bodies without touching block members', async () => {
  const index = await read('../../sanity/schemaTypes/index.ts')
  assert.match(index, /informationBox,/)
  for (const file of ['newsArticle', 'publicInformationGuide']) {
    const source = await read(`../../sanity/schemaTypes/${file}.ts`)
    assert.match(source, /informationBoxBlockMember,/, file)
  }
  const guide = await read('../../sanity/schemaTypes/publicInformationGuide.ts')
  assert.match(guide, /defineArrayMember\(\{type: 'block'\}\)/)
})

test('schema variants match the frontend variants and the field is required radio', async () => {
  const source = await read('../../sanity/schemaTypes/informationBox.ts')
  for (const variant of INFORMATION_BOX_VARIANTS) {
    assert.match(source, new RegExp(`value: '${variant}'`))
  }
  assert.match(source, /layout: 'radio'/)
  assert.match(source, /initialValue: 'important'/)
  assert.match(source, /rule\.max\(80\)/)
  assert.doesNotMatch(source, /type: 'image'|type: 'editorialChart'|value: 'h[1-6]'/)
})

test('both pages register the renderer', async () => {
  for (const file of ['news', 'info']) {
    const source = await read(`../../src/pages/[lang]/${file}/[slug].astro`)
    assert.match(source, /informationBox: language === 'ne'/, file)
    assert.match(source, /_type: 'informationBox'/, file)
  }
})
