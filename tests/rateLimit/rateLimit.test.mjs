import assert from 'node:assert/strict'
import {createHmac} from 'node:crypto'
import {readdir, readFile} from 'node:fs/promises'
import {join, relative} from 'node:path'
import test from 'node:test'
import {createAvailabilityHandler} from '../../src/pages/api/entur/availability.ts'
import {createJourneyHandler} from '../../src/pages/api/entur/journeys.ts'
import {createOriginHandler} from '../../src/pages/api/entur/origins.ts'
import {
  RATE_LIMIT_CATEGORIES, RATE_LIMIT_KEY_PREFIX, RATE_LIMITS, readRateLimitConfig,
} from '../../src/lib/rateLimit/server/config.ts'
import {createRateLimitIdentifier, normalizeClientAddress, readClientAddress} from '../../src/lib/rateLimit/server/identifier.ts'
import {checkRateLimit} from '../../src/lib/rateLimit/server/limiter.ts'
import {createUpstashRateLimitProvider} from '../../src/lib/rateLimit/server/upstash.ts'

const SECRET = 'test-only-hash-secret-0123456789abcdef'
const TOKEN = 'test-only-redis-token'
const REDIS_URL = 'https://example-test.upstash.io'
const ENV = {UPSTASH_REDIS_REST_URL: REDIS_URL, UPSTASH_REDIS_REST_TOKEN: TOKEN, RATE_LIMIT_HASH_SECRET: SECRET}
const ADDRESS = '203.0.113.77'
const AGENT = 'PrivateAgent/9.9'
const QUERY = 'Private Street 12'
const NOW = 1_000_000

const originalFlag = process.env.ENTUR_TRAVEL_API_ENABLED
process.env.ENTUR_TRAVEL_API_ENABLED = 'true'
test.after(() => {
  if (originalFlag === undefined) delete process.env.ENTUR_TRAVEL_API_ENABLED
  else process.env.ENTUR_TRAVEL_API_ENABLED = originalFlag
})

const future = () => new Date(Date.now() + 60 * 60 * 1000).toISOString()
const journeyBody = () => ({
  origin: {lat: 59.9123, lng: 10.7456},
  destination: {type: 'communityEvent', id: 'event-123'},
  dateTime: future(),
  mode: 'departAfter',
})
const BODIES = {
  'entur-origin': () => ({query: QUERY}),
  'entur-journey': journeyBody,
  'entur-availability': () => ({type: 'communityEvent', id: 'event-123'}),
}
const request = (category, options = {}) => new Request('https://nepali.no/api/entur/test', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'user-agent': AGENT,
    ...('address' in options ? (options.address === undefined ? {} : {'x-forwarded-for': options.address}) : {'x-forwarded-for': ADDRESS}),
    ...options.headers,
  },
  body: JSON.stringify(options.body ?? BODIES[category]()),
})
const rawRequest = (body) => new Request('https://nepali.no/api/entur/test', {
  method: 'POST', headers: {'content-type': 'application/json', 'x-forwarded-for': ADDRESS}, body,
})

const makeProvider = (behavior = async () => ({allowed: true, resetAtMs: NOW + 1000})) => {
  const calls = []
  const configs = []
  return {
    calls, configs,
    factory: (config) => {
      configs.push(config)
      return {check: async (identifier, category) => { calls.push({identifier, category}); return behavior(identifier, category) }}
    },
  }
}
const limiterWith = (provider, extra = {}) => (req, category) =>
  checkRateLimit(req, category, {env: ENV, createProvider: provider.factory, now: () => NOW, ...extra})

const suggestionPayload = {type: 'FeatureCollection', features: [{
  type: 'Feature', geometry: {type: 'Point', coordinates: [10.75, 59.91]},
  properties: {id: 'NSR:StopPlace:1', names: {display: 'Oslo S'}, layer: 'stopPlace', address: {locality: 'Oslo'}},
}]}
const journeyPayload = {data: {trip: {tripPatterns: [{
  expectedStartTime: '2026-11-07T12:00:00+01:00', expectedEndTime: '2026-11-07T12:30:00+01:00', duration: 1800, walkTime: 0,
  legs: [{expectedStartTime: '2026-11-07T12:00:00+01:00', expectedEndTime: '2026-11-07T12:30:00+01:00',
    duration: 1800, mode: 'bus', ride: true, realtime: true, fromPlace: {name: 'A'}, toPlace: {name: 'B'}, line: {publicCode: '30'}}],
}]}}}

// Records every upstream effect so a test can assert none happened.
const harness = () => {
  const effects = {sanity: 0, fetch: []}
  const resolve = async () => { effects.sanity++; return {lat: 59.92, lng: 10.75} }
  const fetcher = async (url) => {
    effects.fetch.push(String(url))
    return Response.json(String(url).includes('/geocoder/') ? suggestionPayload : journeyPayload)
  }
  const handlers = (limit) => ({
    'entur-origin': createOriginHandler(limit),
    'entur-journey': createJourneyHandler(resolve, limit),
    'entur-availability': createAvailabilityHandler(resolve, limit),
  })
  return {effects, fetcher, handlers}
}
const withFetch = async (mock, run) => {
  const original = globalThis.fetch
  globalThis.fetch = mock
  try { return await run() } finally { globalThis.fetch = original }
}
const captureConsole = async (run) => {
  const methods = ['log', 'info', 'warn', 'error', 'debug']
  const originals = Object.fromEntries(methods.map((method) => [method, console[method]]))
  const calls = []
  for (const method of methods) console[method] = (...args) => calls.push(args)
  try { await run() } finally { for (const method of methods) console[method] = originals[method] }
  return calls
}
const invoke = async (handler, req) => {
  const response = await handler({request: req})
  return {response, data: await response.json()}
}
const assertNoStore = (response) => assert.equal(response.headers.get('cache-control'), 'private, no-store')

test('limits are exactly 20/60s origin, 10/60s journey and 30/60s availability', () => {
  assert.deepEqual(RATE_LIMITS, {
    'entur-origin': {requests: 20, windowSeconds: 60},
    'entur-journey': {requests: 10, windowSeconds: 60},
    'entur-availability': {requests: 30, windowSeconds: 60},
  })
  assert.deepEqual([...RATE_LIMIT_CATEGORIES], ['entur-origin', 'entur-journey', 'entur-availability'])
})

test('flag disabled: 404 without limiter, provider, Sanity or Entur calls', async () => {
  const prior = process.env.ENTUR_TRAVEL_API_ENABLED
  const provider = makeProvider()
  const {effects, fetcher, handlers} = harness()
  let limiterCalls = 0
  const limit = (req, category) => { limiterCalls++; return limiterWith(provider)(req, category) }
  try {
    for (const value of [undefined, 'false', 'TRUE', '']) {
      if (value === undefined) delete process.env.ENTUR_TRAVEL_API_ENABLED
      else process.env.ENTUR_TRAVEL_API_ENABLED = value
      await withFetch(fetcher, async () => {
        for (const category of RATE_LIMIT_CATEGORIES) {
          const {response, data} = await invoke(handlers(limit)[category], request(category))
          assert.equal(response.status, 404)
          assertNoStore(response)
          assert.deepEqual(data, {ok: false, code: 'not_found'})
        }
      })
    }
  } finally {
    process.env.ENTUR_TRAVEL_API_ENABLED = prior
  }
  assert.equal(limiterCalls, 0)
  assert.equal(provider.calls.length, 0)
  assert.equal(provider.configs.length, 0)
  assert.equal(effects.sanity, 0)
  assert.deepEqual(effects.fetch, [])
})

for (const missing of ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'RATE_LIMIT_HASH_SECRET']) {
  test(`enabled but missing ${missing} fails closed with 503 before Sanity and Entur`, async () => {
    const env = {...ENV}
    delete env[missing]
    const provider = makeProvider()
    const {effects, fetcher, handlers} = harness()
    const limit = (req, category) => checkRateLimit(req, category, {env, createProvider: provider.factory})
    const logs = await captureConsole(async () => {
      await withFetch(fetcher, async () => {
        for (const category of RATE_LIMIT_CATEGORIES) {
          const {response, data} = await invoke(handlers(limit)[category], request(category))
          assert.equal(response.status, 503)
          assertNoStore(response)
          assert.deepEqual(data, {ok: false, code: 'temporarily_unavailable'})
        }
      })
    })
    assert.equal(provider.configs.length, 0)
    assert.equal(effects.sanity, 0)
    assert.deepEqual(effects.fetch, [])
    assert.equal(logs.length, 3)
    for (const value of [SECRET, TOKEN, REDIS_URL, ADDRESS]) assert.ok(!JSON.stringify(logs).includes(value))
  })
}

test('blank and non-https Redis configuration is treated as missing', () => {
  assert.ok(readRateLimitConfig(ENV))
  assert.equal(readRateLimitConfig({...ENV, RATE_LIMIT_HASH_SECRET: '   '}), undefined)
  assert.equal(readRateLimitConfig({...ENV, UPSTASH_REDIS_REST_URL: 'http://example-test.upstash.io'}), undefined)
  assert.equal(readRateLimitConfig({...ENV, UPSTASH_REDIS_REST_URL: 'not a url'}), undefined)
})

for (const [label, address] of [
  ['missing', undefined],
  ['empty', ''],
  ['a forwarded list', '203.0.113.7, 198.51.100.1'],
  ['text', 'not-an-address'],
  ['an address with a port', '203.0.113.7:443'],
  ['a bracketed address', '[2001:db8::1]'],
  ['a zone identifier', 'fe80::1%eth0'],
  ['an out-of-range octet', '256.1.1.1'],
  ['an over-long value', '1'.repeat(60)],
]) {
  test(`${label} client address fails closed with 503 and no provider call`, async () => {
    const provider = makeProvider()
    const {effects, handlers} = harness()
    const logs = await captureConsole(async () => {
      const {response, data} = await invoke(handlers(limiterWith(provider))['entur-origin'], request('entur-origin', {address}))
      assert.equal(response.status, 503)
      assertNoStore(response)
      assert.deepEqual(data, {ok: false, code: 'temporarily_unavailable'})
    })
    assert.equal(provider.calls.length, 0)
    assert.equal(effects.sanity, 0)
    if (address) assert.ok(!JSON.stringify(logs).includes(address))
  })
}

test('client addresses are normalized defensively', () => {
  assert.equal(normalizeClientAddress('203.0.113.7'), '203.0.113.7')
  assert.equal(normalizeClientAddress(' 203.0.113.7 '), '203.0.113.7')
  assert.equal(normalizeClientAddress('::ffff:203.0.113.7'), '203.0.113.7')
  assert.equal(normalizeClientAddress('::FFFF:cb00:7107'), '203.0.113.7')
  assert.equal(normalizeClientAddress('2001:DB8:1:2:aaaa:bbbb:cccc:dddd'), '2001:0db8:0001:0002::/64')
  assert.equal(normalizeClientAddress('2001:db8:1:2::9'), '2001:0db8:0001:0002::/64')
  assert.equal(normalizeClientAddress('2001:db8::1'), '2001:0db8:0000:0000::/64')
  assert.equal(normalizeClientAddress('::1'), '0000:0000:0000:0000::/64')
  assert.equal(normalizeClientAddress('2001:db8::1:2:3:4:5:6'), undefined)
  assert.equal(readClientAddress(new Request('https://nepali.no')), undefined)
  assert.equal(readClientAddress(new Request('https://nepali.no', {headers: {'x-real-ip': ADDRESS}})), undefined)
})

test('identifier is a deterministic HMAC-SHA-256 digest that differs per category and secret', () => {
  const [origin, journey, availability] = RATE_LIMIT_CATEGORIES.map((category) => createRateLimitIdentifier(ADDRESS, category, SECRET))
  assert.equal(origin, createRateLimitIdentifier(ADDRESS, 'entur-origin', SECRET))
  assert.equal(origin, createHmac('sha256', SECRET).update(`${ADDRESS}\nentur-origin`).digest('hex'))
  assert.match(origin, /^[0-9a-f]{64}$/)
  assert.equal(new Set([origin, journey, availability]).size, 3)
  assert.notEqual(origin, createRateLimitIdentifier(ADDRESS, 'entur-origin', `${SECRET}-other`))
  assert.notEqual(origin, createRateLimitIdentifier('203.0.113.78', 'entur-origin', SECRET))
  for (const digest of [origin, journey, availability]) assert.ok(!digest.includes(ADDRESS))
})

for (const category of RATE_LIMIT_CATEGORIES) {
  test(`${category} allowed proceeds to Sanity or Entur`, async () => {
    const provider = makeProvider()
    const {effects, fetcher, handlers} = harness()
    const {response, data} = await withFetch(fetcher, () => invoke(handlers(limiterWith(provider))[category], request(category)))
    assert.equal(response.status, 200)
    assertNoStore(response)
    assert.equal(data.ok, true)
    assert.equal(provider.calls.length, 1)
    assert.equal(provider.calls[0].category, category)
    assert.equal(provider.calls[0].identifier, createRateLimitIdentifier(ADDRESS, category, SECRET))
    if (category === 'entur-origin') assert.equal(effects.fetch.length, 1)
    if (category === 'entur-journey') { assert.equal(effects.sanity, 1); assert.equal(effects.fetch.length, 1) }
    if (category === 'entur-availability') { assert.equal(effects.sanity, 1); assert.deepEqual(effects.fetch, []) }
  })

  test(`${category} limited returns 429 with Retry-After and no Sanity or Entur call`, async () => {
    const provider = makeProvider(async () => ({allowed: false, resetAtMs: NOW + 17_400}))
    const {effects, fetcher, handlers} = harness()
    const {response, data} = await withFetch(fetcher, () => invoke(handlers(limiterWith(provider))[category], request(category)))
    assert.equal(response.status, 429)
    assert.equal(response.headers.get('retry-after'), '18')
    assertNoStore(response)
    assert.deepEqual(data, {ok: false, code: 'rate_limited'})
    assert.equal(effects.sanity, 0)
    assert.deepEqual(effects.fetch, [])
  })

  for (const [label, behavior, reason] of [
    ['timeout', () => new Promise(() => {}), 'provider_timeout'],
    ['error', async () => { throw new Error(`provider failure for ${ADDRESS} ${TOKEN}`) }, 'provider_error'],
  ]) {
    test(`${category} provider ${label} fails closed with 503 and no Sanity or Entur call`, async () => {
      const provider = makeProvider(behavior)
      const {effects, fetcher, handlers} = harness()
      const logs = await captureConsole(async () => {
        const {response, data} = await withFetch(fetcher, () => invoke(handlers(limiterWith(provider, {timeoutMs: 20}))[category], request(category)))
        assert.equal(response.status, 503)
        assertNoStore(response)
        assert.deepEqual(data, {ok: false, code: 'temporarily_unavailable'})
      })
      assert.equal(effects.sanity, 0)
      assert.deepEqual(effects.fetch, [])
      assert.deepEqual(logs, [['[rate-limit] unavailable', {category, reason}]])
    })
  }
}

test('a throwing limiter also fails closed with 503', async () => {
  const {effects, fetcher, handlers} = harness()
  const {response, data} = await withFetch(fetcher, () => invoke(handlers(async () => { throw new Error('boom') })['entur-origin'], request('entur-origin')))
  assert.equal(response.status, 503)
  assert.deepEqual(data, {ok: false, code: 'temporarily_unavailable'})
  assert.deepEqual(effects.fetch, [])
})

test('Retry-After is bounded to the window and at least one second', async () => {
  const retry = async (resetAtMs) => {
    const decision = await limiterWith(makeProvider(async () => ({allowed: false, resetAtMs})))(request('entur-origin'), 'entur-origin')
    return decision.retryAfterSeconds
  }
  assert.equal(await retry(NOW + 5_000_000), 60)
  assert.equal(await retry(NOW - 5_000), 1)
  assert.equal(await retry(NOW + 1), 1)
  assert.equal(await retry(Number.NaN), 60)
})

test('requests failing method, content-type or declared size are rejected before the limiter', async () => {
  const provider = makeProvider()
  const {handlers} = harness()
  const handler = handlers(limiterWith(provider))['entur-origin']
  const wrongType = new Request('https://nepali.no/api/entur/origins', {method: 'POST', headers: {'content-type': 'text/plain', 'x-forwarded-for': ADDRESS}, body: 'x'})
  assert.equal((await handler({request: wrongType})).status, 415)
  const get = new Request('https://nepali.no/api/entur/origins', {method: 'GET', headers: {'x-forwarded-for': ADDRESS}})
  assert.equal((await handler({request: get})).status, 405)
  const tooLarge = await handler({request: request('entur-origin', {headers: {'content-length': '999999'}})})
  assert.equal(tooLarge.status, 413)
  assertNoStore(tooLarge)
  assert.equal(provider.calls.length, 0)
})

test('malformed bodies and validation failures are limited first and never reach Sanity or Entur', async () => {
  const provider = makeProvider()
  const {effects, fetcher, handlers} = harness()
  await withFetch(fetcher, async () => {
    const invalidJson = await invoke(handlers(limiterWith(provider))['entur-origin'], rawRequest('{broken'))
    assert.equal(invalidJson.response.status, 400)
    const invalid = await invoke(handlers(limiterWith(provider))['entur-journey'], request('entur-journey', {body: {origin: 1}}))
    assert.equal(invalid.response.status, 400)
  })
  assert.equal(provider.calls.length, 2)
  assert.equal(effects.sanity, 0)
  assert.deepEqual(effects.fetch, [])
})

test('provider receives no address, query, coordinates, datetime, route or user agent', async () => {
  const provider = makeProvider()
  const {fetcher, handlers} = harness()
  const logs = await captureConsole(async () => {
    await withFetch(fetcher, async () => {
      for (const category of RATE_LIMIT_CATEGORIES) await invoke(handlers(limiterWith(provider))[category], request(category))
    })
  })
  const forbidden = [ADDRESS, QUERY, AGENT, '59.9123', '10.7456', new Date().getUTCFullYear().toString(), '/api/entur', 'event-123', 'communityEvent', 'x-forwarded-for']
  const seen = JSON.stringify({calls: provider.calls, logs})
  assert.equal(provider.calls.length, 3)
  for (const value of forbidden) assert.ok(!seen.includes(value), `${value} leaked`)
  for (const call of provider.calls) {
    assert.deepEqual(Object.keys(call).sort(), ['category', 'identifier'])
    assert.match(call.identifier, /^[0-9a-f]{64}$/)
  }
})

// Exercises the real Upstash SDK against a fake REST endpoint. No network is used.
const fakeRedis = (remainingFor = () => 5) => {
  const requests = []
  const mock = async (input, init) => {
    const parsed = init?.body ? JSON.parse(String(init.body)) : undefined
    const pipelined = String(input).endsWith('/pipeline')
    const body = pipelined ? parsed[0] : parsed
    requests.push({url: String(input), init, body})
    const result = {result: [remainingFor(body), 10]}
    return Response.json(pipelined ? [result] : result)
  }
  return {requests, mock}
}

test('real SDK provider sends only a prefixed digest key, exact limits, no analytics and no telemetry', async () => {
  const config = readRateLimitConfig(ENV)
  const expected = {'entur-origin': [20, 60_000], 'entur-journey': [10, 60_000], 'entur-availability': [30, 60_000]}
  for (const category of RATE_LIMIT_CATEGORIES) {
    const redis = fakeRedis()
    const identifier = createRateLimitIdentifier(ADDRESS, category, SECRET)
    const result = await withFetch(redis.mock, () => createUpstashRateLimitProvider(config).check(identifier, category))
    assert.equal(result.allowed, true)
    assert.equal(redis.requests.length, 1)
    const [{url, init, body}] = redis.requests
    assert.equal(url, `${REDIS_URL}/pipeline`)
    assert.equal(init.method, 'POST')
    assert.ok(init.signal instanceof AbortSignal)
    assert.equal(body[0].toLowerCase(), 'evalsha')
    for (const key of body.slice(3, 5)) assert.match(key, new RegExp(`^${RATE_LIMIT_KEY_PREFIX}:${category}:${identifier}:\\d+$`))
    const [tokens, , windowSize] = body.slice(5)
    assert.deepEqual([Number(tokens), Number(windowSize)], expected[category])
    const headers = new Headers(init.headers)
    const serialized = JSON.stringify({url, body, headers: Object.fromEntries(headers)})
    for (const value of [ADDRESS, QUERY, AGENT, SECRET, 'analytics']) assert.ok(!serialized.includes(value), `${value} sent to provider`)
    assert.ok(!headers.has('upstash-telemetry-sdk'))
    assert.equal(headers.get('authorization'), `Bearer ${TOKEN}`)
  }
})

test('real SDK provider maps exhausted windows to limited with the reset time', async () => {
  const redis = fakeRedis(() => -1)
  const provider = createUpstashRateLimitProvider(readRateLimitConfig(ENV))
  const identifier = createRateLimitIdentifier(ADDRESS, 'entur-origin', SECRET)
  const before = Date.now()
  const result = await withFetch(redis.mock, () => provider.check(identifier, 'entur-origin'))
  assert.equal(result.allowed, false)
  assert.equal(result.resetAtMs, (Math.floor(before / 60_000) + 1) * 60_000)
})

test('real SDK provider failures through the limiter fail closed', async () => {
  const unique = {...ENV, UPSTASH_REDIS_REST_URL: 'https://failure-test.upstash.io'}
  for (const mock of [
    async () => new Response('boom', {status: 500}),
    async () => { throw new TypeError('fetch failed') },
    async (_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(init.signal.reason))),
  ]) {
    const logs = await captureConsole(async () => {
      const decision = await withFetch(mock, () => checkRateLimit(request('entur-origin'), 'entur-origin', {env: unique, timeoutMs: 50}))
      assert.equal(decision.status, 'unavailable')
    })
    assert.ok(!JSON.stringify(logs).includes(ADDRESS))
  }
})

test('through the default provider, Redis state decides allowed versus limited', async () => {
  const unique = {...ENV, UPSTASH_REDIS_REST_URL: 'https://reuse-test.upstash.io'}
  let remaining = 2
  const redis = fakeRedis(() => remaining--)
  const decisions = await withFetch(redis.mock, async () => {
    const out = []
    for (let i = 0; i < 4; i++) out.push((await checkRateLimit(request('entur-journey'), 'entur-journey', {env: unique})).status)
    return out
  })
  assert.deepEqual(decisions, ['allowed', 'allowed', 'allowed', 'limited'])
})

const walk = async (directory) => {
  const found = []
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) found.push(...await walk(path))
    else found.push(path)
  }
  return found
}
const root = new URL('../../', import.meta.url).pathname

test('Upstash and server-only modules cannot be imported into client bundles', async () => {
  const files = (await walk(join(root, 'src'))).filter((path) => /\.(ts|tsx|js|jsx|mjs|astro)$/.test(path))
  const upstashImporters = []
  const limiterImporters = []
  for (const path of files) {
    const source = await readFile(path, 'utf8')
    const name = relative(root, path)
    if (/@upstash\//.test(source)) upstashImporters.push(name)
    if (/from\s+['"][^'"]*rateLimit\/server\/[^'"]*['"]/.test(source)) limiterImporters.push(name)
    const clientReachable = /\.(tsx|jsx)$/.test(path) || name.startsWith('src/components/') || name.startsWith('src/i18n/')
    if (clientReachable) assert.doesNotMatch(source, /@upstash\/|rateLimit\/server|entur\/server|RATE_LIMIT_|UPSTASH_/, `${name} is client-reachable`)
    assert.doesNotMatch(source, /PUBLIC_(?:UPSTASH|RATE_LIMIT)/, `${name} exposes a rate-limit variable`)
    if (name.startsWith('src/lib/rateLimit/')) assert.doesNotMatch(source, /import\.meta\.env/, `${name} reads client-replaceable env`)
  }
  assert.deepEqual(upstashImporters, ['src/lib/rateLimit/server/upstash.ts'])
  for (const name of limiterImporters) assert.match(name, /^src\/(?:lib\/(?:rateLimit|entur\/server)|pages\/api\/entur)\//)
  for (const config of ['astro.config.mjs', 'vercel.json', 'package.json']) {
    assert.doesNotMatch(await readFile(join(root, config), 'utf8'), /PUBLIC_(?:UPSTASH|RATE_LIMIT)|envPrefix/)
  }
})
