import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'
import {eligibleMapPlaces, mapTravelValidation, selectedMapPlace} from '../../src/lib/entur/mapDestination.ts'
import {withMapTravelDestination} from '../../src/lib/entur/mapRendering.ts'
import {parseDestinationSelector} from '../../src/lib/entur/validation.ts'
import {mapAdapter, resolveDestination} from '../../src/lib/entur/server/destination.ts'
import {createJourneyHandler} from '../../src/pages/api/entur/journeys.ts'

const now = Date.parse('2026-11-07T00:00:00Z')
const museum = {_key: 'museum', label: 'Oslo Museum', precision: 'exact', coordinates: {lat: 59.92, lng: 10.72}}
const other = {_key: 'station', label: 'Oslo S', precision: 'exact', coordinates: {lat: 59.91, lng: 10.75}}
const block = {_type: 'locationMap', _key: 'map-1', travelHelpEnabled: true, locations: [museum]}
const doc = (type) => ({
  _id: 'article-1', _type: type, slug: 'public', language: 'ne',
  publishedAt: '2026-01-01T00:00:00Z', status: 'active', body: [block],
})
const selector = (type) => ({type, id: 'article-1', mapKey: 'map-1', placeKey: 'museum'})
const reader = (document) => ({fetch: async () => document})
const rejected = (sel, document) => assert.rejects(resolveDestination(sel, reader(document), now),
  (error) => error.code === 'destination_unavailable' && error.status === 404)

test('one keyed exact place is automatic and maps default to disabled', () => {
  assert.equal(selectedMapPlace(block), museum)
  assert.equal(mapTravelValidation(block), undefined)
  assert.equal(selectedMapPlace({...block, travelHelpEnabled: undefined}), undefined)
  assert.equal(selectedMapPlace({...block, travelHelpEnabled: false}), undefined)
  assert.equal(selectedMapPlace({...block, location: museum, locations: []}), undefined)
})

test('multiple eligible places require selection by stable key', () => {
  const many = {...block, locations: [museum, other]}
  assert.ok(mapTravelValidation(many))
  assert.equal(selectedMapPlace(many), undefined)
  assert.equal(selectedMapPlace({...many, travelHelpPlaceKey: 'station'}), other)
  assert.equal(mapTravelValidation({...many, travelHelpPlaceKey: 'station'}), undefined)
  assert.equal(selectedMapPlace({...many, travelHelpPlaceKey: 'wrong'}), undefined)
  assert.equal(selectedMapPlace({...many, _key: undefined, travelHelpPlaceKey: 'station'}), undefined)
})

test('approximate, radius, malformed, invalid and duplicate locations cannot become destinations', () => {
  for (const invalid of [
    {...museum, precision: 'approximate', radiusMeters: 100},
    {...museum, radiusMeters: 50},
    {...museum, precision: undefined},
    {...museum, _key: undefined},
    {...museum, label: ''},
    {...museum, label: 123},
    {...museum, coordinates: {lat: 91, lng: 10}},
  ]) {
    assert.deepEqual(eligibleMapPlaces({...block, locations: [invalid]}), [])
    assert.ok(mapTravelValidation({...block, locations: [invalid]}))
  }
  assert.deepEqual(eligibleMapPlaces({...block, locations: [museum, museum]}), [])
})

for (const type of ['newsArticle', 'publicInformationGuide']) {
  test(`${type} resolves only the published keyed map and place`, async () => {
    let inspected = false
    const result = await resolveDestination(selector(type), {fetch: async (query, params, options) => {
      inspected = true
      assert.match(query, new RegExp(`_type == "${type}"`))
      assert.match(query, /_id == \$id/)
      assert.doesNotMatch(query, /drafts|Submission/)
      assert.deepEqual(params, {id: 'article-1'})
      assert.ok(options.signal instanceof AbortSignal)
      return doc(type)
    }}, now)
    assert.equal(inspected, true)
    assert.deepEqual(result, museum.coordinates)
  })

  test(`${type} rejects disabled, draft, unpublished, mismatched and ineligible blocks`, async () => {
    const d = doc(type)
    for (const changed of [
      null, {...d, _id: 'drafts.article-1'}, {...d, _type: 'submission'}, {...d, slug: ''},
      {...d, body: [{...block, travelHelpEnabled: false}]},
      {...d, body: [{...block, _key: 'wrong'}]},
      {...d, body: [block, block]},
      {...d, body: [{...block, locations: [{...museum, precision: 'approximate'}]}]},
      {...d, body: [{...block, locations: [{...museum, radiusMeters: 1}]}]},
      {...d, body: [{...block, locations: [{...museum, coordinates: {lat: 100, lng: 1}}]}]},
      {...d, body: [{...block, locations: [museum, other]}]},
      ...(type === 'newsArticle' ? [{...d, publishedAt: '2027-01-01T00:00:00Z'}] : [{...d, status: 'draft'}]),
    ]) await rejected(selector(type), changed)
    await rejected({...selector(type), mapKey: 'wrong'}, d)
    await rejected({...selector(type), placeKey: 'station'}, d)
    await rejected({...selector(type), id: 'drafts.article-1'}, d)
    await rejected({...selector(type), coordinates: museum.coordinates}, d)
  })

  test(`${type} only attaches a selector to the corresponding public map`, () => {
    const body = [{_type: 'block', _key: 'text'}, block, {...block, _key: 'map-2', travelHelpEnabled: false}]
    const result = withMapTravelDestination(body, type, 'article-1', false)
    assert.equal(result[0], body[0])
    assert.deepEqual(result[1].travelDestination, selector(type))
    assert.equal(result[2].travelDestination, undefined)
    assert.equal(withMapTravelDestination(body, type, 'article-1', true)[1].travelDestination, undefined)
  })
}

test('multi-place resolution enforces editor selection and rejects browser coordinates', async () => {
  const d = doc('newsArticle')
  d.body = [{...block, locations: [museum, other], travelHelpPlaceKey: 'station'}]
  assert.deepEqual(await resolveDestination({...selector('newsArticle'), placeKey: 'station'}, reader(d), now), other.coordinates)
  await rejected(selector('newsArticle'), d)
  assert.equal(parseDestinationSelector({...selector('newsArticle'), lat: 59}), undefined)
  assert.equal(parseDestinationSelector({type: 'futureType', id: 'article-1', mapKey: 'map-1', placeKey: 'museum'}), undefined)
})

test('a future adapter can reuse the map contract without changing an endpoint handler', () => {
  const adapter = mapAdapter('fixed published query', 'news', (document) => document.status === 'active')
  const future = {...doc('newsArticle'), _type: 'futureType'}
  const futureSelector = {...selector('newsArticle'), type: 'futureType'}
  assert.deepEqual(adapter.resolve(futureSelector, future, now), museum.coordinates)
  assert.equal(adapter.resolve(futureSelector, {...future, status: 'draft'}, now), undefined)
  assert.equal(parseDestinationSelector(futureSelector), undefined)
})

test('existing journey handler accepts registered map adapter without accepting browser destination coordinates', async () => {
  const handler = createJourneyHandler((value) => resolveDestination(value, reader(doc('newsArticle')), now),
    async () => ({status: 'allowed'}))
  const previous = process.env.ENTUR_TRAVEL_API_ENABLED
  process.env.ENTUR_TRAVEL_API_ENABLED = 'true'
  const originalFetch = globalThis.fetch
  try {
    let calls = 0
    globalThis.fetch = async (_url, init) => {
      calls++
      assert.deepEqual(JSON.parse(init.body).variables.to, {coordinates: {latitude: 59.92, longitude: 10.72}})
      return Response.json({data: {trip: {tripPatterns: []}}})
    }
    const body = {
      origin: {lat: 59.9, lng: 10.7}, destination: selector('newsArticle'),
      dateTime: new Date(Date.now() + 60_000).toISOString(), mode: 'departAfter',
    }
    const invoke = (value) => handler({request: new Request('https://nepali.no/api/entur/journeys', {
      method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(value),
    })})
    assert.equal((await invoke(body)).status, 404) // A valid request with no journeys.
    assert.equal(calls, 1)
    assert.equal((await invoke({...body, destination: {...body.destination, coordinates: museum.coordinates}})).status, 400)
    assert.equal(calls, 1)
  } finally {
    globalThis.fetch = originalFetch
    if (previous === undefined) delete process.env.ENTUR_TRAVEL_API_ENABLED
    else process.env.ENTUR_TRAVEL_API_ENABLED = previous
  }
})

test('shared renderer and Studio wiring preserve map behavior and map-following travel', async () => {
  const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8')
  const [schema, newsSchema, guideSchema, news, guide, ne, nb, event, directory, resolver, map, travel] = await Promise.all([
    'sanity/schemaTypes/mapLocation.ts', 'sanity/schemaTypes/newsArticle.ts',
    'sanity/schemaTypes/publicInformationGuide.ts', 'src/components/articles/NewsArticleView.astro',
    'src/components/articles/GuideView.astro', 'src/components/content/LocationMapNe.astro',
    'src/components/content/LocationMapNb.astro', 'src/pages/[lang]/events/[slug].astro',
    'src/pages/[lang]/directory/[slug].astro', 'src/lib/entur/server/destination.ts',
    'src/components/content/LocationMap.astro', 'src/components/content/TravelHelp.tsx',
  ].map(read))
  assert.match(newsSchema, /type: 'locationMap'/)
  assert.match(guideSchema, /type: 'locationMap'/)
  assert.match(schema, /travelHelpEnabled: false/)
  assert.match(schema, /components: \{input: MapTravelPlaceInput\}/)
  assert.match(news, /withMapTravelDestination\(article\.body, 'newsArticle'/)
  assert.match(guide, /withMapTravelDestination\(guide\.body, 'publicInformationGuide'/)
  for (const wrapper of [ne, nb]) {
    assert.match(wrapper, /<LocationMap[\s\S]*?\/>[\s\S]*?<TravelHelp/)
    for (const prop of ['locations', 'route', 'editorialPath', 'loadingBehavior', 'showFullscreenControl']) {
      assert.match(wrapper, new RegExp(`${prop}=\\{node\\.${prop}\\}`))
    }
  }
  for (const page of [event, directory]) assert.match(page, /<LocationMap[\s\S]*?showFullscreenControl=\{true\}/)
  for (const control of [/data-map-fullscreen-open/, /data-map-zoom-in/, /data-map-zoom-out/,
    /L\.marker\(/, /marker\.bindPopup\(/, /data-attribution=\{MAP_PROVIDER\.attribution\}/]) {
    assert.match(map, control)
  }
  assert.match(travel, /\[leaveNow, setLeaveNow\] = useState\(true\)/)
  assert.match(resolver, /perspective: 'published'/)
  assert.match(resolver, /dataset: 'production'/)
})
