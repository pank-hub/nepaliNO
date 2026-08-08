import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ForumContentMetadataUnavailableError,
  loadForumContentMetadata,
} from '../../src/lib/forum/loadForumContentMetadata.ts'

const categoryForTopicId = (topicId) => {
  if (topicId === 13) return 10
  if (topicId === 21) return 11
  return 5
}

const metadata = (topicId) => ({
  topicId,
  title: `Topic ${topicId}`,
  postsCount: 1,
  replyCount: 0,
  closed: false,
  archived: false,
  categoryId: categoryForTopicId(topicId),
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

test('rejects an archived companion topic', async () => {
  const loader = async (topicId) => ({...metadata(topicId), archived: true})

  await assert.rejects(
    loadForumContentMetadata(
      [{role: 'newsDiscussion', topicId: 13}],
      loader,
    ),
    ForumContentMetadataUnavailableError,
  )
})

test('rejects a companion topic without a category', async () => {
  const loader = async (topicId) => {
    const {categoryId: _categoryId, ...withoutCategory} = metadata(topicId)
    return withoutCategory
  }

  await assert.rejects(
    loadForumContentMetadata(
      [{role: 'guideQuestions', topicId: 21}],
      loader,
    ),
    ForumContentMetadataUnavailableError,
  )
})

test('rejects a companion topic in an administrative category', async () => {
  const loader = async (topicId) => ({...metadata(topicId), categoryId: 4})

  await assert.rejects(
    loadForumContentMetadata(
      [{role: 'newsDiscussion', topicId: 13}],
      loader,
    ),
    ForumContentMetadataUnavailableError,
  )
})

test('omits archived and administrative related topics', async () => {
  const loader = async (topicId) => {
    if (topicId === 31) return {...metadata(topicId), archived: true}
    if (topicId === 32) return {...metadata(topicId), categoryId: 2}
    if (topicId === 33) return {...metadata(topicId), categoryId: 9}
    return metadata(topicId)
  }

  assert.deepEqual(
    await loadForumContentMetadata(
      [
        {role: 'newsDiscussion', topicId: 13},
        {role: 'related', topicId: 31},
        {role: 'related', topicId: 32},
        {role: 'related', topicId: 33},
      ],
      loader,
    ),
    {
      companion: {role: 'newsDiscussion', ...metadata(13)},
      related: [
        {role: 'related', ...metadata(33), categoryId: 9},
      ],
    },
  )
})

test('allows a closed Guide topic in the dedicated Guide category', async () => {
  const loader = async (topicId) => ({
    ...metadata(topicId),
    closed: true,
  })

  assert.deepEqual(
    await loadForumContentMetadata(
      [{role: 'guideQuestions', topicId: 21}],
      loader,
    ),
    {
      companion: {
        role: 'guideQuestions',
        ...metadata(21),
        closed: true,
      },
      related: [],
    },
  )
})

test('allows every approved community category for related topics', async () => {
  for (const categoryId of [5, 6, 7, 8, 9]) {
    const loader = async (topicId) => ({...metadata(topicId), categoryId})
    const result = await loadForumContentMetadata(
      [{role: 'related', topicId: categoryId}],
      loader,
    )

    assert.equal(result.related[0].categoryId, categoryId)
  }
})


test('rejects a News companion in the Guide category', async () => {
  const loader = async (topicId) => ({...metadata(topicId), categoryId: 11})

  await assert.rejects(
    loadForumContentMetadata(
      [{role: 'newsDiscussion', topicId: 13}],
      loader,
    ),
    ForumContentMetadataUnavailableError,
  )
})

test('rejects a Guide companion in the News category', async () => {
  const loader = async (topicId) => ({...metadata(topicId), categoryId: 10})

  await assert.rejects(
    loadForumContentMetadata(
      [{role: 'guideQuestions', topicId: 21}],
      loader,
    ),
    ForumContentMetadataUnavailableError,
  )
})

test('rejects dedicated companion categories for related topics', async () => {
  for (const categoryId of [10, 11]) {
    const loader = async (topicId) => ({...metadata(topicId), categoryId})

    await assert.rejects(
      loadForumContentMetadata(
        [{role: 'related', topicId: categoryId}],
        loader,
      ),
      ForumContentMetadataUnavailableError,
    )
  }
})
