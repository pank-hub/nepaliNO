import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ForumContentMetadataUnavailableError,
  loadForumContentMetadata,
} from '../../src/lib/forum/loadForumContentMetadata.ts'

const metadata = (topicId) => ({
  topicId,
  title: `Topic ${topicId}`,
  postsCount: 1,
  replyCount: 0,
  closed: false,
  archived: false,
  tags: [],
  url: `https://forum.example/t/${topicId}`,
})

const successfulLoader = async (topicId) => metadata(topicId)

test('loads a News companion topic', async () => {
  assert.deepEqual(
    await loadForumContentMetadata(
      [{role: 'newsDiscussion', topicId: 13}],
      successfulLoader,
    ),
    {
      companion: {role: 'newsDiscussion', ...metadata(13)},
      related: [],
    },
  )
})

test('loads a Guide companion and related topics in editorial order', async () => {
  assert.deepEqual(
    await loadForumContentMetadata(
      [
        {role: 'guideQuestions', topicId: 21},
        {role: 'related', topicId: 31},
        {role: 'related', topicId: 32},
      ],
      successfulLoader,
    ),
    {
      companion: {role: 'guideQuestions', ...metadata(21)},
      related: [
        {role: 'related', ...metadata(31)},
        {role: 'related', ...metadata(32)},
      ],
    },
  )
})

test('omits a failed related topic when the companion succeeds', async () => {
  const loader = async (topicId) => {
    if (topicId === 31) throw new Error('Unavailable')
    return metadata(topicId)
  }

  assert.deepEqual(
    await loadForumContentMetadata(
      [
        {role: 'newsDiscussion', topicId: 13},
        {role: 'related', topicId: 31},
        {role: 'related', topicId: 32},
      ],
      loader,
    ),
    {
      companion: {role: 'newsDiscussion', ...metadata(13)},
      related: [{role: 'related', ...metadata(32)}],
    },
  )
})

test('fails closed when an approved companion topic is unavailable', async () => {
  const loader = async (topicId) => {
    if (topicId === 13) throw new Error('Unavailable')
    return metadata(topicId)
  }

  await assert.rejects(
    loadForumContentMetadata(
      [
        {role: 'newsDiscussion', topicId: 13},
        {role: 'related', topicId: 31},
      ],
      loader,
    ),
    ForumContentMetadataUnavailableError,
  )
})

test('returns successful related-only metadata when at least one topic loads', async () => {
  const loader = async (topicId) => {
    if (topicId === 31) throw new Error('Unavailable')
    return metadata(topicId)
  }

  assert.deepEqual(
    await loadForumContentMetadata(
      [
        {role: 'related', topicId: 31},
        {role: 'related', topicId: 32},
      ],
      loader,
    ),
    {
      companion: null,
      related: [{role: 'related', ...metadata(32)}],
    },
  )
})

test('fails when every approved related-only topic is unavailable', async () => {
  const loader = async () => {
    throw new Error('Unavailable')
  }

  await assert.rejects(
    loadForumContentMetadata(
      [
        {role: 'related', topicId: 31},
        {role: 'related', topicId: 32},
      ],
      loader,
    ),
    ForumContentMetadataUnavailableError,
  )
})

test('fails when no approved relationship is provided', async () => {
  await assert.rejects(
    loadForumContentMetadata([], successfulLoader),
    ForumContentMetadataUnavailableError,
  )
})
