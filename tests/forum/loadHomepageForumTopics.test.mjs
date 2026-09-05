import assert from 'node:assert/strict'
import test from 'node:test'

import {loadHomepageForumTopics} from '../../src/lib/forum/loadHomepageForumTopics.ts'

const topic = (topicId, categoryId, lastPostedAt) => ({
  topicId,
  title: `Topic ${topicId}`,
  postsCount: topicId + 1,
  replyCount: topicId,
  closed: false,
  archived: false,
  lastPostedAt,
  categoryId,
  tags: [],
  url: `https://forum.example/t/${topicId}`,
})

test('keeps only eligible companion discussions in recent activity order', async () => {
  const loader = async (topicId) => {
    if (topicId === 1) return topic(1, 10, '2026-09-01T10:00:00Z')
    if (topicId === 2) return topic(2, 11, '2026-09-03T10:00:00Z')
    return topic(topicId, 5, '2026-09-04T10:00:00Z')
  }

  const result = await loadHomepageForumTopics(
    [
      {topicId: 1, role: 'newsDiscussion'},
      {topicId: 2, role: 'guideQuestions'},
      {topicId: 3, role: 'newsDiscussion'},
    ],
    loader,
  )

  assert.deepEqual(
    result.map(({topicId}) => topicId),
    [2, 1],
  )
})

test('deduplicates candidates and limits the homepage feed to six topics', async () => {
  const result = await loadHomepageForumTopics(
    [
      {topicId: 1, role: 'newsDiscussion'},
      {topicId: 1, role: 'newsDiscussion'},
      ...Array.from({length: 7}, (_, index) => ({
        topicId: index + 2,
        role: 'guideQuestions',
      })),
    ],
    async (topicId) =>
      topic(
        topicId,
        topicId === 1 ? 10 : 11,
        `2026-09-${String(topicId).padStart(2, '0')}T10:00:00Z`,
      ),
  )

  assert.equal(result.length, 6)
  assert.deepEqual(
    result.map(({topicId}) => topicId),
    [8, 7, 6, 5, 4, 3],
  )
})

test('omits unavailable, archived, and invalid-category topics', async () => {
  const result = await loadHomepageForumTopics(
    [
      {topicId: 1, role: 'newsDiscussion'},
      {topicId: 2, role: 'guideQuestions'},
      {topicId: 3, role: 'newsDiscussion'},
    ],
    async (topicId) => {
      if (topicId === 1) throw new Error('Unavailable')
      if (topicId === 2) return {...topic(2, 11, '2026-09-02T10:00:00Z'), archived: true}
      return topic(3, 10, '2026-09-03T10:00:00Z')
    },
  )

  assert.deepEqual(
    result.map(({topicId}) => topicId),
    [3],
  )
})
