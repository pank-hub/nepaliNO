import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CLASSIFIEDS_CATEGORIES,
  CLASSIFIEDS_CATEGORY_MAP,
  NORWAY_FYLKER,
  isValidClassifiedsCategory,
  isValidFylkeTag,
  loadDiscourseClassifieds,
  sanitizeCategoryTopics,
} from '../../src/lib/forum/discourseClassifieds.ts'
import {resolveAlternatePath} from '../../src/config/languageSections.ts'

test('allowlists only Categories 13, 14, and 15 and all 15 Norwegian fylker', () => {
  assert.deepEqual(
    CLASSIFIEDS_CATEGORIES.map((c) => [c.key, c.categoryId]),
    [
      ['housing', 13],
      ['jobs', 14],
      ['buy-and-sell', 15],
    ],
  )
  assert.equal(NORWAY_FYLKER.length, 15)
  assert.equal(isValidClassifiedsCategory('housing'), true)
  assert.equal(isValidClassifiedsCategory('staff'), false)
  assert.equal(isValidFylkeTag('oslo'), true)
  assert.equal(isValidFylkeTag('trondelag'), true)
  assert.equal(isValidFylkeTag('unknown-county'), false)
})

test('sanitizeCategoryTopics excludes pinned About topics, archived, invisible, wrong-category, and strips PII', () => {
  const payload = {
    topic_list: {
      topics: [
        {
          id: 60,
          title: 'About the Housing / Bolig category',
          pinned: true,
          posts_count: 1,
          category_id: 13,
          tags: [],
        },
        {
          id: 101,
          title: 'Room in Grünerløkka available from August',
          pinned: false,
          archived: false,
          visible: true,
          closed: false,
          posts_count: 4,
          category_id: 13,
          created_at: '2026-11-25T10:00:00Z',
          tags: ['oslo', 'bofellesskap'],
          posters: [{user_id: 99, email: 'secret@example.com'}],
        },
        {
          id: 102,
          title: 'Archived listing',
          archived: true,
          posts_count: 2,
          category_id: 13,
          tags: ['oslo'],
        },
        {
          id: 103,
          title: 'Wrong category topic',
          archived: false,
          posts_count: 2,
          category_id: 3,
          tags: ['oslo'],
        },
      ],
    },
  }

  const items = sanitizeCategoryTopics(
    payload,
    CLASSIFIEDS_CATEGORY_MAP.housing,
    'https://forum.nepali.no/',
  )

  assert.equal(items.length, 1)
  assert.equal(items[0].topicId, 101)
  assert.equal(items[0].replyCount, 3)
  assert.deepEqual(items[0].fylkeTags, ['oslo'])
  assert.equal(items[0].url, 'https://forum.nepali.no/t/101')
  assert.equal('posters' in items[0], false)
  assert.equal('email' in items[0], false)
})

test('loadDiscourseClassifieds handles private_pilot (403) gracefully', async () => {
  const mockFetch = async () =>
    new Response(JSON.stringify({errors: ['You need to be logged in']}), {
      status: 403,
      headers: {'content-type': 'application/json'},
    })

  const result = await loadDiscourseClassifieds({fetchImpl: mockFetch})
  assert.equal(result.status, 'private_pilot')
  assert.deepEqual(result.items, [])
  assert.deepEqual(result.counts, {housing: 0, jobs: 0, 'buy-and-sell': 0})
})

test('loadDiscourseClassifieds filters by fylke and sorts newest first', async () => {
  const mockFetch = async (url) => {
    const href = String(url)
    if (href.includes('/c/housing/13.json')) {
      return new Response(
        JSON.stringify({
          topic_list: {
            topics: [
              {
                id: 201,
                title: 'Hybel in Bergen',
                posts_count: 1,
                category_id: 13,
                created_at: '2026-11-24T10:00:00Z',
                tags: ['vestland', 'bergen'],
              },
              {
                id: 202,
                title: 'Room in Oslo',
                posts_count: 2,
                category_id: 13,
                created_at: '2026-11-25T12:00:00Z',
                tags: ['oslo'],
              },
            ],
          },
        }),
        {status: 200, headers: {'content-type': 'application/json'}},
      )
    }
    return new Response(JSON.stringify({topic_list: {topics: []}}), {
      status: 200,
      headers: {'content-type': 'application/json'},
    })
  }

  const all = await loadDiscourseClassifieds({fetchImpl: mockFetch})
  assert.equal(all.status, 'live')
  assert.deepEqual(
    all.items.map((i) => i.topicId),
    [202, 201],
  )

  const vestlandOnly = await loadDiscourseClassifieds({
    fetchImpl: mockFetch,
    fylke: 'vestland',
  })
  assert.deepEqual(
    vestlandOnly.items.map((i) => i.topicId),
    [201],
  )
})

test('language switcher never targets disabled /nb/classifieds/', () => {
  assert.equal(resolveAlternatePath('nb', '/nb/classifieds/'), '/nb/')
  assert.equal(resolveAlternatePath('ne', '/ne/classifieds/'), '/ne/classifieds/')
})
