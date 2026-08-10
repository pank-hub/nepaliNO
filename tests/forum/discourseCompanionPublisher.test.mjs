import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildCompanionTopicDraft,
  classifyDiscoursePublisherRejection,
} from '../../src/lib/forum/discourseCompanionPublisher.ts'

test('maps Norwegian News to category 10', () => {
  const draft = buildCompanionTopicDraft({
    contentType: 'newsArticle',
    language: 'nb',
    title: 'Ny informasjon for det nepalske miljøet',
    url: 'https://nepali.no/nb/news/ny-informasjon/',
  })

  assert.equal(draft.category, 10)
  assert.equal(draft.title, 'Ny informasjon for det nepalske miljøet')
  assert.match(draft.raw, /Les hele artikkelen/)
  assert.match(draft.raw, /https:\/\/nepali\.no\/nb\/news\/ny-informasjon\//)
})

test('maps Nepali News to category 10 and uses the Nepali template', () => {
  const draft = buildCompanionTopicDraft({
    contentType: 'newsArticle',
    language: 'ne',
    title: 'नर्वेमा नेपाली समुदायका लागि नयाँ जानकारी',
    url: 'https://nepali.no/ne/news/naya-jankari/',
  })

  assert.equal(draft.category, 10)
  assert.match(draft.raw, /पूरा समाचार पढ्नुहोस्/)
})

test('maps Norwegian Guides to category 11', () => {
  const draft = buildCompanionTopicDraft({
    contentType: 'publicInformationGuide',
    language: 'nb',
    title: 'Slik finner du riktig offentlig informasjon',
    url: 'https://nepali.no/nb/info/offentlig-informasjon/',
  })

  assert.equal(draft.category, 11)
  assert.match(draft.raw, /Les hele guiden og de offisielle kildene/)
})

test('maps Nepali Guides to category 11 and uses the Nepali template', () => {
  const draft = buildCompanionTopicDraft({
    contentType: 'publicInformationGuide',
    language: 'ne',
    title: 'आधिकारिक जानकारी कसरी फेला पार्ने',
    url: 'https://nepali.no/ne/info/adhikarik-jankari/',
  })

  assert.equal(draft.category, 11)
  assert.match(draft.raw, /पूरा गाइड र आधिकारिक स्रोतहरू पढ्नुहोस्/)
})

test('trims titles without allowing callers to provide a category', () => {
  const draft = buildCompanionTopicDraft({
    contentType: 'newsArticle',
    language: 'nb',
    title: '  En kontrollert nyhetstittel  ',
    url: 'https://nepali.no/nb/news/kontrollert/',
    category: 3,
  })

  assert.equal(draft.title, 'En kontrollert nyhetstittel')
  assert.equal(draft.category, 10)
})

test('rejects short, empty, and overly long titles', () => {
  for (const title of ['', 'Kort', 'a'.repeat(161)]) {
    assert.throws(
      () =>
        buildCompanionTopicDraft({
          contentType: 'newsArticle',
          language: 'nb',
          title,
          url: 'https://nepali.no/nb/news/test/',
        }),
      TypeError,
    )
  }
})

test('rejects non-nepali.no and non-HTTPS URLs', () => {
  for (const url of [
    'https://example.com/nb/news/test/',
    'http://nepali.no/nb/news/test/',
    'not-a-url',
  ]) {
    assert.throws(
      () =>
        buildCompanionTopicDraft({
          contentType: 'newsArticle',
          language: 'nb',
          title: 'En gyldig kontrollert nyhetstittel',
          url,
        }),
      TypeError,
    )
  }
})

test('rejects unsupported languages at runtime', () => {
  assert.throws(
    () =>
      buildCompanionTopicDraft({
        contentType: 'newsArticle',
        language: 'en',
        title: 'A valid title that must still be rejected',
        url: 'https://nepali.no/nb/news/test/',
      }),
    TypeError,
  )
})


test('rejects unsupported content types at runtime', () => {
  assert.throws(
    () =>
      buildCompanionTopicDraft({
        contentType: 'communityEvent',
        language: 'nb',
        title: 'En gyldig tittel med ugyldig innholdstype',
        url: 'https://nepali.no/nb/news/test/',
      }),
    TypeError,
  )
})


test('classifies confirmed Discourse 422 validation responses without retaining provider text', () => {
  assert.equal(
    classifyDiscoursePublisherRejection(422, {errors: ['Title contains an invalid value']}),
    'forum-publishing-rejected-title',
  )
  assert.equal(
    classifyDiscoursePublisherRejection(422, {errors: ['Body is invalid']}),
    'forum-publishing-rejected-post',
  )
  assert.equal(
    classifyDiscoursePublisherRejection(422, {errors: ['Category is invalid']}),
    'forum-publishing-rejected-category',
  )
  assert.equal(
    classifyDiscoursePublisherRejection(422, {errors: ['A tag is required']}),
    'forum-publishing-rejected-tags',
  )
  assert.equal(
    classifyDiscoursePublisherRejection(422, {errors: ['Unrecognized validation']}),
    'forum-publishing-rejected-validation',
  )
  assert.equal(classifyDiscoursePublisherRejection(503, {}), undefined)
})
