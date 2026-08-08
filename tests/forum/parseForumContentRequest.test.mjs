import assert from 'node:assert/strict'
import test from 'node:test'

import {
  InvalidForumContentRequestError,
  parseForumContentRequest,
} from '../../src/lib/forum/parseForumContentRequest.ts'

const parse = (query) => parseForumContentRequest(new URLSearchParams(query))

const assertInvalid = (query) =>
  assert.throws(() => parse(query), InvalidForumContentRequestError)

test('parses a valid News identity', () => {
  assert.deepEqual(
    parse('contentType=newsArticle&language=nb&slug=example-news'),
    {contentType: 'newsArticle', language: 'nb', slug: 'example-news'},
  )
})

test('parses a valid Public Information Guide identity', () => {
  assert.deepEqual(
    parse(
      'contentType=publicInformationGuide&language=ne&slug=example-guide',
    ),
    {
      contentType: 'publicInformationGuide',
      language: 'ne',
      slug: 'example-guide',
    },
  )
})

test('rejects missing required parameters', () => {
  assertInvalid('language=nb&slug=example-news')
  assertInvalid('contentType=newsArticle&slug=example-news')
  assertInvalid('contentType=newsArticle&language=nb')
})

test('rejects unsupported content types', () => {
  assertInvalid('contentType=event&language=nb&slug=example-news')
})

test('rejects unsupported languages', () => {
  assertInvalid('contentType=newsArticle&language=en&slug=example-news')
})

test('rejects unsafe slugs', () => {
  assertInvalid('contentType=newsArticle&language=nb&slug=slash%2Fvalue')
  assertInvalid('contentType=newsArticle&language=nb&slug=double--hyphen')
  assertInvalid('contentType=newsArticle&language=nb&slug=%20leading-space')
})

test('rejects duplicate parameters', () => {
  assertInvalid(
    'contentType=newsArticle&contentType=publicInformationGuide&language=nb&slug=example-news',
  )
  assertInvalid('contentType=newsArticle&language=nb&language=ne&slug=example-news')
  assertInvalid('contentType=newsArticle&language=nb&slug=one&slug=two')
})

test('rejects unknown parameters', () => {
  assertInvalid(
    'contentType=newsArticle&language=nb&slug=example-news&topicId=13',
  )
  assertInvalid(
    'contentType=newsArticle&language=nb&slug=example-news&extra=value',
  )
})

test('rejects empty values', () => {
  assertInvalid('contentType=&language=nb&slug=example-news')
  assertInvalid('contentType=newsArticle&language=&slug=example-news')
  assertInvalid('contentType=newsArticle&language=nb&slug=')
})

test('rejects encoded path-like and Unicode slug attempts', () => {
  assertInvalid('contentType=newsArticle&language=nb&slug=%2E%2E%2Fsecret')
  assertInvalid('contentType=newsArticle&language=nb&slug=%E0%A4%A8%E0%A5%87')
})

test('accepts parameters in any order', () => {
  assert.deepEqual(
    parse('slug=example-news&language=nb&contentType=newsArticle'),
    {contentType: 'newsArticle', language: 'nb', slug: 'example-news'},
  )
})
