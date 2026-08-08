import assert from 'node:assert/strict'
import test from 'node:test'

import {
  isForumContentLanguage,
  isValidForumContentSlug,
  normalizeForumRelationships,
} from '../../src/lib/forum/normalizeForumRelationships.ts'

test('normalizes a News companion discussion', () => {
  assert.deepEqual(
    normalizeForumRelationships({companion: {topicId: 13}}, 'newsDiscussion'),
    [{role: 'newsDiscussion', topicId: 13}],
  )
})

test('normalizes a Guide questions topic', () => {
  assert.deepEqual(
    normalizeForumRelationships({companion: {topicId: 21}}, 'guideQuestions'),
    [{role: 'guideQuestions', topicId: 21}],
  )
})

test('supports related-only relationships in editorial order', () => {
  assert.deepEqual(
    normalizeForumRelationships(
      {related: [{topicId: 31}, {topicId: 32}]},
      'newsDiscussion',
    ),
    [
      {role: 'related', topicId: 31},
      {role: 'related', topicId: 32},
    ],
  )
})

test('removes duplicate related IDs and companion duplicates', () => {
  assert.deepEqual(
    normalizeForumRelationships(
      {
        companion: {topicId: 13},
        related: [
          {topicId: 13},
          {topicId: 31},
          {topicId: 31},
          {topicId: 32},
        ],
      },
      'newsDiscussion',
    ),
    [
      {role: 'newsDiscussion', topicId: 13},
      {role: 'related', topicId: 31},
      {role: 'related', topicId: 32},
    ],
  )
})

test('limits related topics to three unique valid IDs', () => {
  assert.deepEqual(
    normalizeForumRelationships(
      {
        related: [
          {topicId: 1},
          {topicId: 2},
          {topicId: 3},
          {topicId: 4},
        ],
      },
      'guideQuestions',
    ),
    [
      {role: 'related', topicId: 1},
      {role: 'related', topicId: 2},
      {role: 'related', topicId: 3},
    ],
  )
})

test('rejects malformed topic IDs without throwing', () => {
  assert.deepEqual(
    normalizeForumRelationships(
      {
        companion: {topicId: 0},
        related: [
          {topicId: -1},
          {topicId: 1.5},
          {topicId: '13'},
          {},
          {topicId: 7},
        ],
      },
      'newsDiscussion',
    ),
    [{role: 'related', topicId: 7}],
  )
})

test('returns an empty list when no valid relationship exists', () => {
  assert.deepEqual(
    normalizeForumRelationships(
      {companion: null, related: [{topicId: 0}, {}]},
      'guideQuestions',
    ),
    [],
  )
})

test('accepts only supported Forum content languages', () => {
  assert.equal(isForumContentLanguage('ne'), true)
  assert.equal(isForumContentLanguage('nb'), true)
  assert.equal(isForumContentLanguage('en'), false)
  assert.equal(isForumContentLanguage('NB'), false)
})

test('accepts bounded ASCII slugs and rejects unsafe identities', () => {
  assert.equal(isValidForumContentSlug('syntetisk-test-13'), true)
  assert.equal(isValidForumContentSlug('a'), true)
  assert.equal(isValidForumContentSlug(' leading-space'), false)
  assert.equal(isValidForumContentSlug('trailing-space '), false)
  assert.equal(isValidForumContentSlug('double--hyphen'), false)
  assert.equal(isValidForumContentSlug('slash/value'), false)
  assert.equal(isValidForumContentSlug(''), false)
  assert.equal(isValidForumContentSlug('a'.repeat(201)), false)
})
