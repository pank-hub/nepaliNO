import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'
import {
  AUTHOR_PRESETS,
  AUTHOR_TYPE_OPTIONS,
  AUTHOR_TYPE_WARNING,
  OTHER_AUTHOR,
  buildAuthorPatchSpecs,
  findAuthorPreset,
  getMissingAuthorTypeWarning,
  isCustomAuthorName,
  resolveAuthorSelection,
} from '../../sanity/schemaTypes/authorNamePresets.ts'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('presets carry the expected author types', () => {
  assert.deepEqual(AUTHOR_PRESETS, [
    {name: 'nepali.no Editorial', type: 'organization'},
    {name: 'Pankaj Kafley', type: 'person'},
  ])
})

test('author type options are exactly person and organization', () => {
  assert.deepEqual(
    AUTHOR_TYPE_OPTIONS.map((option) => option.value),
    ['person', 'organization'],
  )
})

test('selecting nepali.no Editorial sets both fields', () => {
  assert.deepEqual(resolveAuthorSelection('nepali.no Editorial'), {
    authorName: 'nepali.no Editorial',
    authorType: 'organization',
  })
})

test('selecting Pankaj Kafley sets both fields', () => {
  assert.deepEqual(resolveAuthorSelection('Pankaj Kafley'), {
    authorName: 'Pankaj Kafley',
    authorType: 'person',
  })
})

test('selecting Other or empty clears both so no type is inferred', () => {
  assert.deepEqual(resolveAuthorSelection(OTHER_AUTHOR), {})
  assert.deepEqual(resolveAuthorSelection(''), {})
})

test('type is never inferred from the wording of a custom name', () => {
  for (const name of ['Nepali.no Staff', 'Some Association', 'Jane Doe']) {
    assert.equal(findAuthorPreset(name), undefined)
    assert.deepEqual(resolveAuthorSelection(name), {})
  }
})

test('patch specs touch only authorName and authorType under the parent path', () => {
  const specs = buildAuthorPatchSpecs([], resolveAuthorSelection('Pankaj Kafley'))
  assert.deepEqual(specs, [
    {op: 'set', path: ['authorName'], value: 'Pankaj Kafley'},
    {op: 'set', path: ['authorType'], value: 'person'},
  ])

  const cleared = buildAuthorPatchSpecs(['nested'], resolveAuthorSelection(OTHER_AUTHOR))
  assert.deepEqual(cleared, [
    {op: 'unset', path: ['nested', 'authorName']},
    {op: 'unset', path: ['nested', 'authorType']},
  ])
})

test('a custom author name is preserved and detected as custom', () => {
  assert.equal(isCustomAuthorName('Jane Doe'), true)
  assert.equal(isCustomAuthorName('Pankaj Kafley'), false)
  assert.equal(isCustomAuthorName('   '), false)
  assert.equal(isCustomAuthorName(undefined), false)
})

test('warns only for a custom name with no author type', () => {
  assert.equal(getMissingAuthorTypeWarning('Jane Doe', undefined), AUTHOR_TYPE_WARNING)
  assert.equal(getMissingAuthorTypeWarning('Jane Doe', 'person'), true)
  assert.equal(getMissingAuthorTypeWarning('Jane Doe', 'organization'), true)
})

test('legacy documents without authorType are not warned for preset or empty names', () => {
  assert.equal(getMissingAuthorTypeWarning('nepali.no Editorial', undefined), true)
  assert.equal(getMissingAuthorTypeWarning('Pankaj Kafley', undefined), true)
  assert.equal(getMissingAuthorTypeWarning(undefined, undefined), true)
})

test('schema keeps authorType optional, radio, in publishing, and a warning only', async () => {
  const source = await read('../../sanity/schemaTypes/newsArticle.ts')
  const field = source.slice(source.indexOf("name: 'authorType'"))
  const block = field.slice(0, field.indexOf('defineField('))
  assert.match(block, /group: 'publishing'/)
  assert.match(block, /layout: 'radio'/)
  assert.match(block, /\.warning\(\)/)
  assert.doesNotMatch(block, /required\(\)/)
})
