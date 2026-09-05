import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DiscourseMetadataRequestError,
  DiscourseMetadataTopicUnavailableError,
  getDiscourseTopicMetadata,
} from '../../src/lib/forum/discourseMetadata.ts'

const withFetch = async (handler, callback) => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = handler

  try {
    await callback()
  } finally {
    globalThis.fetch = originalFetch
  }
}

test('loads public topic metadata without credentials', {concurrency: false}, async () => {
  const calls = []

  await withFetch(
    async (input, init) => {
      calls.push({input, init})
      return Response.json({
        id: 13,
        title: 'Public discussion',
        posts_count: 3,
        closed: false,
        archived: false,
        category_id: 10,
        tags: [],
      })
    },
    async () => {
      assert.deepEqual(await getDiscourseTopicMetadata(13), {
        topicId: 13,
        title: 'Public discussion',
        postsCount: 3,
        replyCount: 2,
        closed: false,
        archived: false,
        lastPostedAt: undefined,
        categoryId: 10,
        tags: [],
        url: 'https://forum.nepali.no/t/13',
      })
    },
  )

  assert.equal(calls.length, 1)
  assert.equal(calls[0].input.toString(), 'https://forum.nepali.no/t/13.json')
  assert.deepEqual(calls[0].init.headers, {accept: 'application/json'})
  assert.equal(calls[0].init.redirect, 'error')
})

test('treats private and missing topics as unavailable', {concurrency: false}, async () => {
  await withFetch(
    async () => new Response(null, {status: 404}),
    async () => {
      await assert.rejects(
        getDiscourseTopicMetadata(13),
        DiscourseMetadataTopicUnavailableError,
      )
    },
  )
})

test('surfaces systemic Forum request failures', {concurrency: false}, async () => {
  await withFetch(
    async () => new Response(null, {status: 503}),
    async () => {
      await assert.rejects(
        getDiscourseTopicMetadata(13),
        DiscourseMetadataRequestError,
      )
    },
  )
})
