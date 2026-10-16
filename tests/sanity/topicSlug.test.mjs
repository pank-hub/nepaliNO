import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'
import {SAFE_SLUG_PATTERN, validateSafeSlug} from '../../sanity/schemaTypes/slugValidation.ts'

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')

// Fixed snapshot of the Topic slugs in production on 2026-10-16.
const MALFORMED = [
  'norwegian-language-and-integration नर्वेजियन भाषा र समाजमा समायोजन',
  'digital-sewa-ra-online-suraksha ',
]
const EXISTING_VALID = [
  'family-children',
  'anya-upayogi-jankari',
  'shiksha-ra-vidyarthi-jivan',
  'aagaman-basobas-aaprawasan',
  'adhikar-suraksha-ra-bhedbhab',
  'nagarikta-ra-nagarik-sahabhagita',
  'housing',
  'kar-ra-byaktigat-bitta',
  'transport-and-driving',
  'swasthya-sewa',
  'moving-population-register',
  'work-employment',
]

test('both currently malformed production values fail with a message', () => {
  for (const value of MALFORMED) {
    const result = validateSafeSlug(value)
    assert.equal(typeof result, 'string', value)
    assert.ok(result.length > 10)
  }
})

test('all other existing Topic slugs pass', () => {
  for (const value of EXISTING_VALID) assert.equal(validateSafeSlug(value), true, value)
})

test('leading, trailing and internal whitespace fail', () => {
  for (const value of [' housing', 'housing ', 'hous ing', 'housing\t', 'hous\ning']) {
    assert.notEqual(validateSafeSlug(value), true, JSON.stringify(value))
  }
  assert.match(validateSafeSlug('housing '), /leading or trailing space/)
  assert.match(validateSafeSlug('hous ing'), /cannot contain spaces/)
})

test('uppercase, Devanagari and other characters fail', () => {
  for (const value of ['Housing', 'हाउजिङ', 'hous_ing', 'hous.ing', 'hous/ing', 'håus', 'a%20b']) {
    assert.notEqual(validateSafeSlug(value), true, value)
  }
  assert.match(validateSafeSlug('Housing'), /lowercase/)
  assert.match(validateSafeSlug('हाउजिङ'), /Devanagari/)
})

test('consecutive, leading and trailing hyphens fail', () => {
  assert.match(validateSafeSlug('hous--ing'), /consecutive hyphens/)
  assert.match(validateSafeSlug('-housing'), /start or end with a hyphen/)
  assert.match(validateSafeSlug('housing-'), /start or end with a hyphen/)
})

test('valid lowercase Latin slugs with digits and hyphens pass', () => {
  for (const value of ['a', 'housing-2026', 'a1-b2-c3', '2026']) {
    assert.equal(validateSafeSlug(value), true, value)
    assert.match(value, SAFE_SLUG_PATTERN)
  }
})

test('missing values are left to the required rule', () => {
  for (const value of [undefined, null, '']) assert.equal(validateSafeSlug(value), true)
})

test('the validator is used only by the Topic slug field', () => {
  const used = []
  for (const file of [
    'newsArticle',
    'publicInformationGuide',
    'publicInformationTopic',
    'communityEvent',
    'directoryListing',
    'norwegianTerm',
  ]) {
    if (read(`../../sanity/schemaTypes/${file}.ts`).includes('validateSafeSlug')) used.push(file)
  }
  assert.deepEqual(used, ['publicInformationTopic'])
  const topic = read('../../sanity/schemaTypes/publicInformationTopic.ts')
  assert.match(topic, /name: 'slug'[\s\S]*?validateSafeSlug\(value\?\.current\)/)
})
