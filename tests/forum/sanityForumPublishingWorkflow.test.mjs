import assert from 'node:assert/strict'
import test from 'node:test'
import {runSanityForumPublishingWorkflow} from '../../src/lib/forum/sanityForumPublishingWorkflow.ts'

const base = {
  _id: 'news-1', _rev: 'rev-1', _type: 'newsArticle', title: 'En gyldig publisert nyhetstittel',
  language: 'nb', slug: 'gyldig-nyhet', publishedAt: '2026-08-01T00:00:00Z',
  forumCompanionAutomation: {mode: 'automatic', status: 'pending'},
}
const deps = (document = base) => {
  const calls = []
  return {calls, value: {
    loadDocument: async () => document,
    claimDocument: async (doc, attemptId) => { calls.push(['claim', attemptId]); return {...doc, _rev: 'rev-2', forumCompanionAutomation: {mode: 'automatic', status: 'creating', attemptId}} },
    publishTopic: async (input) => { calls.push(['publish', input]); return {topicId: 42, topicUrl: 'https://forum-poc.nepali.no/t/42', categoryId: 10} },
    completeDocument: async () => calls.push(['complete']),
    failDocument: async (_document, code) =>
      calls.push(['fail', code]),
    now: () => new Date('2026-08-09T07:00:00Z'),
  }}
}

test('publishes eligible automatic News exactly through the controlled path', async () => {
  const d = deps()
  assert.deepEqual(await runSanityForumPublishingWorkflow({documentId: 'news-1', documentType: 'newsArticle', attemptId: 'delivery-1'}, d.value), {code: 'published', topicId: 42, topicUrl: 'https://forum-poc.nepali.no/t/42', categoryId: 10})
  assert.equal(d.calls[1][1].contentType, 'newsArticle')
})

test('returns already_linked without publishing', async () => {
  const d = deps({...base, forumDiscussion: {topicId: 13}})
  assert.deepEqual(await runSanityForumPublishingWorkflow({documentId: 'news-1', documentType: 'newsArticle', attemptId: 'delivery-1'}, d.value), {code: 'already_linked', topicId: 13})
  assert.equal(d.calls.length, 0)
})

test('rejects manual mode and future News', async () => {
  for (const document of [
    {...base, forumCompanionAutomation: {mode: 'manual'}},
    {...base, publishedAt: '2099-01-01T00:00:00Z'},
  ]) {
    const d = deps(document)
    const result = await runSanityForumPublishingWorkflow({documentId: 'news-1', documentType: 'newsArticle', attemptId: 'delivery-1'}, d.value)
    assert.ok(result.code === 'not_automatic' || result.code === 'not_eligible')
    assert.equal(d.calls.length, 0)
  }
})

test('accepts active Guides and maps the public URL', async () => {
  const d = deps({...base, _id: 'guide-1', _type: 'publicInformationGuide', slug: 'guide', status: 'active', publishedAt: undefined})
  d.value.publishTopic = async (input) => { d.calls.push(['publish', input]); return {topicId: 43, topicUrl: 'https://forum-poc.nepali.no/t/43', categoryId: 11} }
  const result = await runSanityForumPublishingWorkflow({documentId: 'guide-1', documentType: 'publicInformationGuide', attemptId: 'delivery-2'}, d.value)
  assert.equal(result.code, 'published')
  assert.equal(d.calls[1][1].url, 'https://nepali.no/nb/info/guide/')
})

test('does not retry an existing creation claim', async () => {
  const d = deps({...base, forumCompanionAutomation: {mode: 'automatic', status: 'creating', attemptId: 'delivery-1'}})
  assert.deepEqual(await runSanityForumPublishingWorkflow({documentId: 'news-1', documentType: 'newsArticle', attemptId: 'delivery-1'}, d.value), {code: 'creation_in_progress'})
  assert.equal(d.calls.length, 0)
})

test('requires reconciliation for another or completed claim', async () => {
  for (const status of ['creating', 'created']) {
    const d = deps({...base, forumCompanionAutomation: {mode: 'automatic', status, attemptId: 'older'}})
    assert.deepEqual(await runSanityForumPublishingWorkflow({documentId: 'news-1', documentType: 'newsArticle', attemptId: 'new'}, d.value), {code: 'manual_reconciliation_required'})
  }
})

test('requires reconciliation and records a safe code when publishing is unconfirmed', async () => {
  const d = deps()
  d.value.publishTopic = async () => {
    throw new Error('provider detail')
  }

  assert.deepEqual(
    await runSanityForumPublishingWorkflow(
      {
        documentId: 'news-1',
        documentType: 'newsArticle',
        attemptId: 'delivery-1',
      },
      d.value,
    ),
    {code: 'manual_reconciliation_required'},
  )
  assert.deepEqual(d.calls.at(-1), [
    'fail',
    'forum-publishing-result-unconfirmed',
  ])
})

test('requires reconciliation when final write-back fails', async () => {
  const d = deps()
  d.value.completeDocument = async () => { throw new Error('write failure') }
  assert.deepEqual(await runSanityForumPublishingWorkflow({documentId: 'news-1', documentType: 'newsArticle', attemptId: 'delivery-1'}, d.value), {code: 'manual_reconciliation_required'})
})
