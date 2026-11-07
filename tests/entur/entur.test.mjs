import assert from 'node:assert/strict'
import test from 'node:test'
import {readFile} from 'node:fs/promises'
import {POST as origins, ALL as originAll} from '../../src/pages/api/entur/origins.ts'
import {POST as productionJourneys, createJourneyHandler, ALL as journeyAll} from '../../src/pages/api/entur/journeys.ts'
import {resolveDestination} from '../../src/lib/entur/server/destination.ts'
import {isDateTime, MAX_HORIZON_MS, PAST_TOLERANCE_MS, parseJourneyRequest} from '../../src/lib/entur/validation.ts'
import {validateTravelHelp} from '../../sanity/schemaTypes/travelHelpValidation.ts'
import {validateEventSubmission} from '../../src/lib/eventSubmissions/validateEventSubmission.ts'
import {validateDirectorySubmission} from '../../src/lib/directorySubmissions/validateDirectorySubmission.ts'

const originalFlag = process.env.ENTUR_TRAVEL_API_ENABLED
process.env.ENTUR_TRAVEL_API_ENABLED = 'true'
test.after(() => {
  if (originalFlag === undefined) delete process.env.ENTUR_TRAVEL_API_ENABLED
  else process.env.ENTUR_TRAVEL_API_ENABLED = originalFlag
})

const future = () => new Date(Date.now() + 60 * 60 * 1000).toISOString()
const input = () => ({
  origin: {lat: 59.9, lng: 10.7},
  destination: {type: 'communityEvent', id: 'event-123'},
  dateTime: future(),
  mode: 'departAfter',
})
const feature = {
  type: 'Feature',
  geometry: {type: 'Point', coordinates: [10.75, 59.91]},
  properties: {id: 'NSR:StopPlace:1', names: {display: 'Oslo S, Oslo'}, layer: 'stopPlace', address: {locality: 'Oslo'}},
}
const suggestionPayload = {type: 'FeatureCollection', features: [feature]}
const leg = {
  expectedStartTime: '2026-11-07T12:00:00+01:00',
  expectedEndTime: '2026-11-07T12:30:00+01:00',
  duration: 1800, mode: 'bus', ride: true, realtime: true,
  fromPlace: {name: 'Oslo S'}, toPlace: {name: 'Test stop'},
  line: {publicCode: '30', name: 'Line 30'},
}
const pattern = {
  expectedStartTime: leg.expectedStartTime,
  expectedEndTime: leg.expectedEndTime,
  duration: 1800, walkTime: 120, legs: [leg],
}
const result = {data: {trip: {tripPatterns: [pattern]}}}
const destinationCoordinates = {lat: 59.92, lng: 10.75}
const journeys = createJourneyHandler(async () => destinationCoordinates)
const request = (body, options = {}) => new Request('https://nepali.no/api/entur/test', {
  method: options.method ?? 'POST',
  headers: {'content-type': options.contentType ?? 'application/json', ...options.headers},
  body: options.raw ?? JSON.stringify(body),
})
const invoke = async (handler, body, options) => {
  const response = await handler({request: request(body, options)})
  return {response, data: await response.json()}
}
const withFetch = async (mock, run) => {
  const original = globalThis.fetch
  globalThis.fetch = mock
  try { await run() } finally { globalThis.fetch = original }
}
const neverFetch = async () => { throw new Error('unexpected upstream request') }

test('origin search normalizes query and Geocoder output using fixed configuration', async () => {
  await withFetch(async (url, init) => {
    const parsed = new URL(url)
    assert.equal(parsed.origin + parsed.pathname, 'https://api.entur.io/geocoder/v3/autocomplete')
    assert.equal(parsed.searchParams.get('q'), 'Oslo S')
    assert.equal(parsed.searchParams.get('limit'), '8')
    assert.equal(init.headers['ET-Client-Name'], 'nepali-no-travel-assistance')
    assert.equal(init.redirect, 'error')
    assert.ok(init.signal instanceof AbortSignal)
    return Response.json(suggestionPayload)
  }, async () => {
    const {response, data} = await invoke(origins, {query: '  Oslo   S  '})
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('cache-control'), 'private, no-store')
    assert.deepEqual(data, {ok: true, suggestions: [{label: 'Oslo S, Oslo', coordinates: {lat: 59.91, lng: 10.75}, id: 'NSR:StopPlace:1', locality: 'Oslo', category: 'stopPlace'}]})
  })
})

for (const [label, body] of [
  ['short query', {query: 'x'}],
  ['long query', {query: 'x'.repeat(101)}],
  ['arbitrary URL', {query: 'Oslo', url: 'https://example.com'}],
  ['control character', {query: 'Oslo\u0000'}],
]) {
  test(`origin rejects ${label}`, async () => {
    await withFetch(neverFetch, async () => {
      const {response, data} = await invoke(origins, body)
      assert.equal(response.status, 400)
      assert.equal(data.code, 'invalid_request')
    })
  })
}

for (const [label, handler, all] of [['origin', origins, originAll], ['journey', journeys, journeyAll]]) {
  test(`${label} rejects wrong method and provides no-store Allow response`, async () => {
    const response = await all({})
    assert.equal(response.status, 405)
    assert.equal(response.headers.get('allow'), 'POST')
    assert.equal(response.headers.get('cache-control'), 'private, no-store')
    const wrong = await handler({request: new Request('https://nepali.no', {method: 'GET'})})
    assert.equal(wrong.status, 405)
  })
  test(`${label} rejects wrong content type`, async () => {
    const {response, data} = await invoke(handler, {}, {contentType: 'application/jsonp'})
    assert.equal(response.status, 415)
    assert.equal(data.code, 'unsupported_media_type')
  })
  test(`${label} accepts JSON with charset parameters`, async () => {
    await withFetch(async () => Response.json(label === 'origin' ? suggestionPayload : result), async () => {
      const {response} = await invoke(handler, label === 'origin' ? {query: 'Oslo'} : input(), {contentType: 'Application/JSON; charset=utf-8'})
      assert.equal(response.status, 200)
      assert.equal(response.headers.get('cache-control'), 'private, no-store')
    })
  })
  test(`${label} rejects malformed JSON`, async () => {
    const {response, data} = await invoke(handler, {}, {raw: '{'})
    assert.equal(response.status, 400)
    assert.equal(data.code, 'invalid_request')
  })
  test(`${label} rejects oversized request body without content-length`, async () => {
    const {response, data} = await invoke(handler, {}, {raw: 'x'.repeat(4097)})
    assert.equal(response.status, 413)
    assert.equal(data.code, 'request_too_large')
  })
  test(`${label} rejects oversized declared length`, async () => {
    const {response} = await invoke(handler, {}, {headers: {'content-length': '4097'}})
    assert.equal(response.status, 413)
  })
  for (const [failure, mock, status, code] of [
    ['timeout', async () => { throw new DOMException('timeout', 'TimeoutError') }, 504, 'timeout'],
    ['unrelated abort', async () => { throw new DOMException('aborted', 'AbortError') }, 502, 'upstream_unavailable'],
    ['HTTP error', async () => new Response(null, {status: 503}), 502, 'upstream_unavailable'],
    ['rate limiting', async () => new Response(null, {status: 429}), 429, 'rate_limited'],
    ['malformed upstream response', async () => Response.json({wrong: true}), 502, 'upstream_invalid_response'],
    ['invalid upstream JSON', async () => new Response('{'), 502, 'upstream_invalid_response'],
    ['oversized upstream response', async () => new Response('x'.repeat(262145)), 502, 'upstream_invalid_response'],
  ]) {
    test(`${label} handles ${failure}`, async () => {
      await withFetch(mock, async () => {
        const {response, data} = await invoke(handler, label === 'origin' ? {query: 'Oslo'} : input())
        assert.equal(response.status, status)
        assert.equal(data.code, code)
        assert.equal(response.headers.get('cache-control'), 'private, no-store')
      })
    })
  }
}

for (const mode of ['departAfter', 'arriveBy']) {
  test(`journey plans ${mode} using fixed operation and normalizes results`, async () => {
    const payload = {...input(), mode}
    await withFetch(async (url, init) => {
      assert.equal(url, 'https://api.entur.io/journey-planner/v3/graphql')
      assert.equal(init.method, 'POST')
      assert.equal(init.redirect, 'error')
      assert.equal(init.headers['ET-Client-Name'], 'nepali-no-travel-assistance')
      assert.ok(init.signal instanceof AbortSignal)
      const body = JSON.parse(init.body)
      assert.match(body.query, /query TravelAssistance/)
      assert.match(body.query, /numTripPatterns: 3/)
      assert.match(body.query, /accessMode: foot, egressMode: foot, directMode: foot/)
      assert.deepEqual(body.variables, {
        from: {coordinates: {latitude: payload.origin.lat, longitude: payload.origin.lng}},
        to: {coordinates: {latitude: destinationCoordinates.lat, longitude: destinationCoordinates.lng}},
        dateTime: payload.dateTime, arriveBy: mode === 'arriveBy',
      })
      return Response.json(result)
    }, async () => {
      const {response, data} = await invoke(journeys, payload)
      assert.equal(response.status, 200)
      assert.equal(response.headers.get('cache-control'), 'private, no-store')
      assert.deepEqual(data.journeys, [{
        startTime: leg.expectedStartTime, endTime: leg.expectedEndTime, durationSeconds: 1800,
        transfers: 0, walkingDurationSeconds: 120,
        legs: [{startTime: leg.expectedStartTime, endTime: leg.expectedEndTime, durationSeconds: 1800,
          mode: 'bus', fromName: 'Oslo S', toName: 'Test stop', isPublicTransport: true, realtime: true, lineName: '30'}],
      }])
    })
  })
}

for (const [label, change] of [
  ['latitude out of range', {origin: {lat: 91, lng: 10}}],
  ['longitude out of range', {origin: {lat: 0, lng: 181}}],
  ['non-numeric coordinates', {origin: {lat: 'NaN', lng: 10}}],
  ['client-authorized coordinates', {destination: {lat: 59.9, lng: 10.7, precision: 'exact'}}],
  ['radius with selector', {destination: {type: 'communityEvent', id: 'event-123', radiusMeters: 500}}],
  ['draft ID', {destination: {type: 'communityEvent', id: 'drafts.event-123'}}],
  ['invalid ID', {destination: {type: 'communityEvent', id: 'bad/path'}}],
  ['wrong document type', {destination: {type: 'eventSubmission', id: 'event-123'}}],
  ['news destination', {destination: {type: 'newsArticle', id: 'news-123'}}],
  ['invalid datetime', {dateTime: 'not-a-date'}],
  ['invalid calendar date', {dateTime: '2026-02-30T12:00:00Z'}],
  ['datetime without timezone', {dateTime: '2026-11-07T12:00:00'}],
  ['past datetime', {dateTime: '2020-01-01T00:00:00Z'}],
  ['excessive horizon', {dateTime: new Date(Date.now() + MAX_HORIZON_MS + 60000).toISOString()}],
  ['unsupported mode', {mode: 'both'}],
  ['arbitrary GraphQL', {query: '{ __schema { types { name } } }'}],
  ['arbitrary URL', {url: 'https://example.com'}],
]) {
  test(`journey rejects ${label}`, async () => {
    await withFetch(neverFetch, async () => {
      const {response, data} = await invoke(journeys, {...input(), ...change})
      assert.equal(response.status, 400)
      assert.equal(data.code, 'invalid_request')
    })
  })
}

test('journey handles GraphQL errors even with partial data', async () => {
  await withFetch(async () => Response.json({...result, errors: [{message: 'private upstream detail'}]}), async () => {
    const {response, data} = await invoke(journeys, input())
    assert.equal(response.status, 502)
    assert.deepEqual(data, {ok: false, code: 'upstream_graphql_error'})
  })
})

test('invalid feature coordinates and invalid journey leg fields are rejected', async () => {
  await withFetch(async () => Response.json({
    type: 'FeatureCollection', features: [{...feature, geometry: {type: 'Point', coordinates: [181, 59]}}],
  }), async () => {
    const {response, data} = await invoke(origins, {query: 'Oslo'})
    assert.equal(response.status, 502)
    assert.equal(data.code, 'upstream_invalid_response')
  })
  await withFetch(async () => Response.json({
    data: {trip: {tripPatterns: [{...pattern, legs: [{...leg, realtime: 'unknown'}]}]}},
  }), async () => {
    const {response, data} = await invoke(journeys, input())
    assert.equal(response.status, 502)
    assert.equal(data.code, 'upstream_invalid_response')
  })
})

test('non-finite JSON numbers are rejected', async () => {
  const raw = JSON.stringify(input()).replace('59.9', '1e400')
  await withFetch(neverFetch, async () => {
    const {response, data} = await invoke(journeys, {}, {raw})
    assert.equal(response.status, 400)
    assert.equal(data.code, 'invalid_request')
  })
})

test('journey reports no journeys separately', async () => {
  await withFetch(async () => Response.json({data: {trip: {tripPatterns: []}}}), async () => {
    const {response, data} = await invoke(journeys, input())
    assert.equal(response.status, 404)
    assert.equal(data.code, 'no_journeys')
  })
})

test('result counts are bounded and transfers count transit legs', async () => {
  await withFetch(async () => Response.json({data: {trip: {tripPatterns: Array(5).fill({...pattern, legs: [leg, {...leg, mode: 'rail'}]})}}}), async () => {
    const {data} = await invoke(journeys, input())
    assert.equal(data.journeys.length, 3)
    assert.equal(data.journeys[0].transfers, 1)
  })
  await withFetch(async () => Response.json({...suggestionPayload, features: Array(10).fill(feature)}), async () => {
    const {data} = await invoke(origins, {query: 'Oslo'})
    assert.equal(data.suggestions.length, 8)
  })
})

test('optional stop names and walking duration are not fabricated', async () => {
  await withFetch(async () => Response.json({data: {trip: {tripPatterns: [{...pattern, walkTime: null, legs: [{...leg, fromPlace: {name: null}, line: null}]}]}}}), async () => {
    const {data} = await invoke(journeys, input())
    assert.equal(data.journeys[0].legs[0].fromName, undefined)
    assert.equal(data.journeys[0].walkingDurationSeconds, undefined)
    assert.equal(data.journeys[0].legs[0].lineName, undefined)
  })
})

test('nullable trip duration falls back to elapsed time, preserving provider walking seconds', async () => {
  await withFetch(async () => Response.json({data: {trip: {tripPatterns: [{...pattern, duration: null}]}}}), async () => {
    const {response, data} = await invoke(journeys, input())
    assert.equal(response.status, 200)
    assert.equal(data.journeys[0].durationSeconds, 1800)
    assert.equal(data.journeys[0].walkingDurationSeconds, 120)
  })
})

test('ride flags on non-transit modes do not count as public transport or transfers', async () => {
  const bicycleLeg = {...leg, mode: 'bicycle', ride: true, realtime: false, line: null}
  await withFetch(async () => Response.json({data: {trip: {tripPatterns: [{...pattern, legs: [bicycleLeg, leg]}]}}}), async () => {
    const {data} = await invoke(journeys, input())
    assert.equal(data.journeys[0].legs[0].isPublicTransport, false)
    assert.equal(data.journeys[0].legs[0].realtime, false)
    assert.equal(data.journeys[0].transfers, 0)
  })
})

test('rejects unknown modes and reversed timestamps without returning provider details', async () => {
  for (const badLeg of [
    {...leg, mode: 'future-unknown-mode'},
    {...leg, expectedEndTime: '2026-11-07T10:00:00+01:00'},
    {...leg, duration: '1800'},
  ]) {
    await withFetch(async () => Response.json({data: {trip: {tripPatterns: [{...pattern, legs: [badLeg]}]}}}), async () => {
      const {response, data} = await invoke(journeys, input())
      assert.equal(response.status, 502)
      assert.deepEqual(data, {ok: false, code: 'upstream_invalid_response'})
    })
  }
})

test('datetime boundaries use absolute instants and tolerate five minutes of clock drift', () => {
  const now = Date.parse('2026-10-25T01:00:00Z')
  const at = (delta) => new Date(now + delta).toISOString()
  for (const delta of [-PAST_TOLERANCE_MS, MAX_HORIZON_MS]) {
    assert.ok(parseJourneyRequest({...input(), dateTime: at(delta)}, now))
  }
  for (const delta of [-PAST_TOLERANCE_MS - 1, MAX_HORIZON_MS + 1]) {
    assert.equal(parseJourneyRequest({...input(), dateTime: at(delta)}, now), undefined)
  }
  assert.ok(parseJourneyRequest({...input(), dateTime: '2026-10-25T02:00:00+01:00'}, now))
  assert.equal(parseJourneyRequest({...input(), dateTime: '2026-10-25T02:00:00+02:00'}, now), undefined)
  assert.equal(isDateTime('2026-01-01T10:00:00+14:01'), false)
  assert.equal(isDateTime('2026-01-01T10:00:00+14:00'), true)
})

test('signal-triggered AbortError becomes timeout, including during response reading', async () => {
  const original = AbortSignal.timeout
  const controller = new AbortController()
  AbortSignal.timeout = () => controller.signal
  try {
    await withFetch(async () => {
      const stream = new ReadableStream({
        start(streamController) {
          controller.abort()
          streamController.error(new DOMException('aborted', 'AbortError'))
        },
      })
      return new Response(stream)
    }, async () => {
      const {response, data} = await invoke(origins, {query: 'Oslo'})
      assert.equal(response.status, 504)
      assert.deepEqual(data, {ok: false, code: 'timeout'})
    })
  } finally {
    AbortSignal.timeout = original
  }
})

test('bounded upstream strings are checked and blank display labels use default', async () => {
  await withFetch(async () => Response.json({type: 'FeatureCollection', features: [{
    ...feature, properties: {...feature.properties, names: {display: ' ', default: 'Oslo'}},
  }]}), async () => {
    const {data} = await invoke(origins, {query: 'Oslo'})
    assert.equal(data.suggestions[0].label, 'Oslo')
  })
  await withFetch(async () => Response.json({type: 'FeatureCollection', features: [{
    ...feature, properties: {...feature.properties, id: 'x'.repeat(501)},
  }]}), async () => {
    const {response, data} = await invoke(origins, {query: 'Oslo'})
    assert.equal(response.status, 502)
    assert.deepEqual(data, {ok: false, code: 'upstream_invalid_response'})
  })
})

test('integration and routes contain no application log calls', async () => {
  for (const path of ['../../src/lib/entur/server/client.ts', '../../src/lib/entur/server/http.ts', '../../src/pages/api/entur/origins.ts', '../../src/pages/api/entur/journeys.ts']) {
    const source = await readFile(new URL(path, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /\bconsole\s*\.\s*(?:log|info|warn|error|debug)\s*\(/)
  }
})

test('successful and failed requests do not log search text or coordinates', async () => {
  const methods = ['log', 'info', 'warn', 'error', 'debug']
  const originals = Object.fromEntries(methods.map((method) => [method, console[method]]))
  const calls = []
  for (const method of methods) console[method] = (...args) => calls.push(args)
  try {
    await withFetch(async (url) => Response.json(url.includes('/geocoder/') ? suggestionPayload : result), async () => {
      await invoke(origins, {query: 'Private address'})
      await invoke(journeys, input())
    })
    await withFetch(async () => { throw new Error('private upstream details') }, async () => {
      await invoke(origins, {query: 'Private address'})
      await invoke(journeys, input())
    })
  } finally {
    for (const method of methods) console[method] = originals[method]
  }
  assert.deepEqual(calls, [])
})

const publicLocation = {precision: 'exact', hasRadius: false, coordinates: destinationCoordinates}
const publicEvent = {
  _id: 'event-123', _type: 'communityEvent', language: 'ne', slug: 'public-event',
  eventFormat: 'in-person', eventStatus: 'scheduled', mapLocation: publicLocation, travelHelpEnabled: true,
}
const publicDirectory = {
  _id: 'listing-123', _type: 'directoryListing', language: 'ne', slug: 'public-listing',
  presenceType: 'physical', listingStatus: 'active', publishedAt: '2026-01-01T00:00:00Z',
  mapLocation: publicLocation, travelHelpEnabled: true,
}
const readerFor = (document, inspect = () => {}) => ({
  fetch: async (query, params, options) => {
    inspect(query, params, options)
    return document
  },
})

test('resolves eligible published event and directory coordinates from fixed queries', async () => {
  for (const document of [publicEvent, publicDirectory]) {
    const selector = {type: document._type, id: document._id}
    const coordinates = await resolveDestination(selector, readerFor(document, (query, params, options) => {
      assert.match(query, new RegExp(`_type == "${document._type}"`))
      assert.match(query, /_id == \$id/)
      assert.deepEqual(params, {id: document._id})
      assert.ok(options.signal instanceof AbortSignal)
      assert.doesNotMatch(query, /eventSubmission|directoryListingSubmission|drafts/)
    }), Date.parse('2026-11-07T00:00:00Z'))
    assert.deepEqual(coordinates, destinationCoordinates)
  }
})

test('journey sends only the resolved published coordinates to Entur', async () => {
  const handler = createJourneyHandler((selector) => resolveDestination(selector, readerFor(publicEvent)))
  await withFetch(async (url, init) => {
    assert.equal(url, 'https://api.entur.io/journey-planner/v3/graphql')
    assert.deepEqual(JSON.parse(init.body).variables.to, {coordinates: {latitude: 59.92, longitude: 10.75}})
    return Response.json(result)
  }, async () => {
    const {response, data} = await invoke(handler, input())
    assert.equal(response.status, 200)
    assert.equal(data.journeys.length, 1)
  })
})

for (const [label, document] of [
  ['missing document', null],
  ['draft', {...publicEvent, _id: 'drafts.event-123'}],
  ['wrong document type', {...publicEvent, _type: 'eventSubmission'}],
  ['disabled language section', {...publicEvent, language: 'nb'}],
  ['missing public slug', {...publicEvent, slug: null}],
  ['explicitly disabled travel assistance', {...publicEvent, travelHelpEnabled: false}],
  ['missing travel assistance', {...publicEvent, travelHelpEnabled: undefined}],
  ['null travel assistance', {...publicEvent, travelHelpEnabled: null}],
  ['invalid travel assistance setting', {...publicEvent, travelHelpEnabled: 'yes'}],
  ['online event', {...publicEvent, eventFormat: 'online'}],
  ['cancelled event', {...publicEvent, eventStatus: 'cancelled'}],
  ['approximate area', {...publicEvent, mapLocation: {...publicLocation, precision: 'approximate'}}],
  ['unknown precision', {...publicEvent, mapLocation: {...publicLocation, precision: 'unknown'}}],
  ['missing precision', {...publicEvent, mapLocation: {...publicLocation, precision: null}}],
  ['radius-bearing exact location', {...publicEvent, mapLocation: {...publicLocation, hasRadius: true}}],
  ['invalid coordinates', {...publicEvent, mapLocation: {...publicLocation, coordinates: {lat: 91, lng: 1}}}],
  ['directory opt-out', {...publicDirectory, travelHelpEnabled: false}],
  ['directory missing opt-in', {...publicDirectory, travelHelpEnabled: undefined}],
  ['directory malformed opt-in', {...publicDirectory, travelHelpEnabled: 'true'}],
  ['private directory location', {...publicDirectory, presenceType: 'no-public-location'}],
  ['online-only directory', {...publicDirectory, presenceType: 'online-only'}],
  ['inactive directory', {...publicDirectory, listingStatus: 'suspended'}],
  ['unpublished directory', {...publicDirectory, publishedAt: null}],
  ['scheduled directory', {...publicDirectory, publishedAt: '2027-01-01T00:00:00Z'}],
]) {
  test(`destination resolver safely rejects ${label}`, async () => {
    const selector = document?._type === 'directoryListing'
      ? {type: 'directoryListing', id: 'listing-123'}
      : {type: 'communityEvent', id: 'event-123'}
    await assert.rejects(resolveDestination(selector, readerFor(document), Date.parse('2026-11-07T00:00:00Z')),
      (error) => error.code === 'destination_unavailable' && error.status === 404)
  })
}

test('missing and ineligible destinations produce identical responses without Entur calls', async () => {
  for (const document of [null, {...publicEvent, eventFormat: 'online'},
    {...publicEvent, travelHelpEnabled: false}, {...publicEvent, travelHelpEnabled: undefined},
    {...publicEvent, travelHelpEnabled: 'yes'}]) {
    const handler = createJourneyHandler((selector) => resolveDestination(selector, readerFor(document)))
    await withFetch(neverFetch, async () => {
      const {response, data} = await invoke(handler, input())
      assert.equal(response.status, 404)
      assert.equal(response.headers.get('cache-control'), 'private, no-store')
      assert.deepEqual(data, {ok: false, code: 'destination_unavailable'})
    })
  }
})

test('Studio validation requires a public exact pin for enabled travel help', () => {
  const location = {precision: 'exact', coordinates: destinationCoordinates}
  const event = {eventFormat: 'hybrid', mapLocation: location}
  const directory = {presenceType: 'physical', mapLocation: location}
  assert.equal(validateTravelHelp(true, event, 'event'), true)
  assert.equal(validateTravelHelp(true, directory, 'directory'), true)
  assert.equal(validateTravelHelp(false, {}, 'event'), true)
  assert.equal(validateTravelHelp(undefined, {}, 'directory'), true)
  for (const doc of [
    {eventFormat: 'online', mapLocation: location},
    {eventFormat: 'in-person', mapLocation: {...location, precision: 'approximate'}},
    {eventFormat: 'in-person', mapLocation: {...location, radiusMeters: 500}},
    {eventFormat: 'in-person', mapLocation: {...location, coordinates: {lat: 91, lng: 1}}},
  ]) assert.equal(typeof validateTravelHelp(true, doc, 'event'), 'string')
  assert.equal(typeof validateTravelHelp(true, {...directory, presenceType: 'no-public-location'}, 'directory'), 'string')
})

test('Studio fields default false and submitters cannot set travel help', async () => {
  for (const path of ['../../sanity/schemaTypes/communityEvent.ts', '../../sanity/schemaTypes/directoryListing.ts']) {
    const source = await readFile(new URL(path, import.meta.url), 'utf8')
    assert.match(source, /name: 'travelHelpEnabled'[\s\S]*?type: 'boolean'[\s\S]*?initialValue: false/)
    assert.match(source, /validateTravelHelp\(value, context\.document/)
  }
  for (const validate of [validateEventSubmission, validateDirectorySubmission]) {
    const result = validate({travelHelpEnabled: true})
    assert.equal(result.ok, false)
    assert.ok(result.errors.some((error) => error.field === 'travelHelpEnabled' && error.code === 'unknown_field'))
  }
  for (const path of ['../../sanity/schemaTypes/eventSubmission.ts', '../../sanity/schemaTypes/directoryListingSubmission.ts']) {
    assert.doesNotMatch(await readFile(new URL(path, import.meta.url), 'utf8'), /travelHelpEnabled/)
  }
})

test('release gate defaults closed for both routes and all methods without upstream work', async () => {
  const original = process.env.ENTUR_TRAVEL_API_ENABLED
  let resolved = false
  const handler = createJourneyHandler(async () => { resolved = true; return destinationCoordinates })
  try {
    for (const value of [undefined, 'false', 'TRUE', '1', '']) {
      if (value === undefined) delete process.env.ENTUR_TRAVEL_API_ENABLED
      else process.env.ENTUR_TRAVEL_API_ENABLED = value
      await withFetch(neverFetch, async () => {
        for (const route of [origins, handler, productionJourneys]) {
          const {response, data} = await invoke(route, route === origins ? {query: 'Oslo'} : input())
          assert.equal(response.status, 404)
          assert.equal(response.headers.get('cache-control'), 'private, no-store')
          assert.deepEqual(data, {ok: false, code: 'not_found'})
        }
        for (const route of [originAll, journeyAll]) {
          const response = await route({})
          assert.equal(response.status, 404)
          assert.deepEqual(await response.json(), {ok: false, code: 'not_found'})
        }
      })
    }
    assert.equal(resolved, false)
  } finally {
    if (original === undefined) delete process.env.ENTUR_TRAVEL_API_ENABLED
    else process.env.ENTUR_TRAVEL_API_ENABLED = original
  }
})

test('Sanity failure is sanitized and does not request Entur', async () => {
  const handler = createJourneyHandler((selector) => resolveDestination(selector, {
    fetch: async () => { throw new Error('private upstream details') },
  }))
  await withFetch(neverFetch, async () => {
    const {response, data} = await invoke(handler, input())
    assert.equal(response.status, 503)
    assert.deepEqual(data, {ok: false, code: 'destination_service_unavailable'})
  })
})

test('public Sanity reader is pinned to production and published without CDN or token', async () => {
  const source = await readFile(new URL('../../src/lib/entur/server/destination.ts', import.meta.url), 'utf8')
  assert.match(source, /dataset: 'production'/)
  assert.match(source, /perspective: 'published'/)
  assert.match(source, /useCdn: false/)
  assert.doesNotMatch(source, /\btoken\s*:/)
})
