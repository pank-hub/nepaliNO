import assert from 'node:assert/strict'
import test from 'node:test'
import {
  composeGuidanceHub,
  composeTopicGuides,
  formatGuideDate,
  guideSortTimestamp,
  sortGuidesByRecency,
} from '../../src/lib/guidanceHub.ts'

const makeTopic = (topicKey, index, guideCount = 3) => ({
  _id: `topic-${topicKey}`,
  title: `Topic ${topicKey}`,
  slug: topicKey,
  language: 'ne',
  topicKey,
  summary: `Summary for ${topicKey}`,
  displayOrder: index,
  guideCount,
})

const makeGuide = (id, topic, publishedAt, options = {}) => ({
  _id: id,
  title: `Guide ${id}`,
  slug: `guide-${id}`,
  language: 'ne',
  summary: `Summary for ${id}`,
  topic,
  responsibleAgency: options.agency ?? 'NAV',
  publishedAt,
  lastReviewedAt: options.lastReviewedAt ?? '2026-10-01',
  isFeatured: options.isFeatured ?? false,
  isUrgent: options.isUrgent ?? false,
})

test('guideSortTimestamp and formatGuideDate handle ISO timestamps and YYYY-MM-DD dates', () => {
  const isoTs = guideSortTimestamp({publishedAt: '2026-11-12T12:43:26.217Z'})
  const dateOnlyTs = guideSortTimestamp({lastReviewedAt: '2026-11-12'})
  assert.ok(isoTs > 0)
  assert.ok(dateOnlyTs > 0)
  assert.equal(guideSortTimestamp({}), 0)

  const nbFormatted = formatGuideDate('2026-11-12', 'nb')
  const neFormatted = formatGuideDate('2026-11-12T12:43:26.217Z', 'ne')
  assert.match(nbFormatted, /2026/)
  assert.match(neFormatted, /२०२६|2026/)
  assert.equal(formatGuideDate('', 'ne'), '')
  assert.equal(formatGuideDate('not-a-date', 'nb'), '')
})

test('composeGuidanceHub selects recent guides chronologically even when non-featured', () => {
  const topics = [
    makeTopic('immigration-residence', 1),
    makeTopic('health-services', 2),
    makeTopic('work-employment', 3),
    makeTopic('family-children', 4),
    makeTopic('rights-safety-discrimination', 5),
    makeTopic('housing', 6),
    makeTopic('education-student-life', 7),
    makeTopic('citizenship-participation', 8, 0),
    makeTopic('other', 9, 1),
  ]

  const guides = [
    makeGuide('g1', 'immigration-residence', '2026-10-01T10:00:00Z', {isFeatured: true}),
    makeGuide('g2', 'health-services', '2026-11-12T12:00:00Z', {isFeatured: false}),
    makeGuide('g3', 'work-employment', '2026-11-11T12:00:00Z', {isFeatured: false}),
    makeGuide('g4', 'family-children', '2026-11-10T12:00:00Z', {isFeatured: false}),
    makeGuide('g5', 'rights-safety-discrimination', '2026-11-09T12:00:00Z', {isFeatured: false}),
    makeGuide('g6', 'housing', '2026-11-08T12:00:00Z', {isFeatured: false}),
    makeGuide('g7', 'education-student-life', '2026-11-07T12:00:00Z', {isUrgent: true}),
    makeGuide('g8', 'other', '2026-11-05T12:00:00Z'),
    makeGuide('g-orphan', 'unlisted-topic', '2026-11-04T12:00:00Z'),
  ]

  const hub = composeGuidanceHub(topics, guides)

  assert.equal(hub.urgentGuide?._id, 'g7')
  assert.equal(hub.leadGuide?._id, 'g1')
  assert.deepEqual(
    hub.recentGuides.map((guide) => guide._id),
    ['g2', 'g3', 'g4', 'g5', 'g6'],
  )
  assert.equal(hub.recentGuides.some((guide) => guide._id === hub.leadGuide?._id), false)

  assert.equal(hub.coreTopics.length, 6)
  assert.deepEqual(
    hub.coreTopics.map((item) => item.topic.topicKey),
    [
      'immigration-residence',
      'health-services',
      'work-employment',
      'family-children',
      'rights-safety-discrimination',
      'housing',
    ],
  )
  assert.equal(hub.coreTopics.some((item) => item.topic.topicKey === 'other'), false)
  assert.deepEqual(
    hub.directoryTopics.map((topic) => topic.topicKey),
    ['education-student-life', 'citizenship-participation', 'other'],
  )
  assert.equal(hub.directoryTopics.at(-1)?.topicKey, 'other')
  assert.deepEqual(
    hub.fallbackGuides.map((guide) => guide._id),
    ['g-orphan'],
  )
})

test('composeGuidanceHub handles single-guide and zero-guide states without duplicates', () => {
  const topics = [makeTopic('housing', 1, 1)]
  const singleUrgent = makeGuide('only', 'housing', '2026-11-12T08:00:00Z', {isUrgent: true})

  const singleHub = composeGuidanceHub(topics, [singleUrgent])
  assert.equal(singleHub.urgentGuide?._id, 'only')
  assert.equal(singleHub.leadGuide?._id, 'only')
  assert.deepEqual(singleHub.recentGuides, [])

  const emptyHub = composeGuidanceHub(topics, [])
  assert.equal(emptyHub.urgentGuide, null)
  assert.equal(emptyHub.leadGuide, null)
  assert.deepEqual(emptyHub.recentGuides, [])
  assert.deepEqual(emptyHub.coreTopics, [])
  assert.equal(emptyHub.directoryTopics.length, 1)
})

test('sortGuidesByRecency and composeTopicGuides keep newest first and deduplicate featured', () => {
  const guides = [
    makeGuide('older-feat', 'housing', '2026-10-01T10:00:00Z', {isFeatured: true}),
    makeGuide('newest', 'housing', '2026-11-12T10:00:00Z'),
    makeGuide('urgent', 'housing', '2026-11-10T10:00:00Z', {isUrgent: true}),
  ]

  assert.deepEqual(
    sortGuidesByRecency(guides).map((g) => g._id),
    ['newest', 'urgent', 'older-feat'],
  )

  const composed = composeTopicGuides(guides)
  assert.deepEqual(
    composed.urgentGuides.map((g) => g._id),
    ['urgent'],
  )
  assert.deepEqual(
    composed.featuredGuides.map((g) => g._id),
    ['older-feat'],
  )
  assert.deepEqual(
    composed.directoryGuides.map((g) => g._id),
    ['newest', 'urgent'],
  )
})
