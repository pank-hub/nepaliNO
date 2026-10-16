import assert from 'node:assert/strict'
import {existsSync, readFileSync} from 'node:fs'
import test from 'node:test'
import {getTransformedRoutes} from '@vercel/routing-utils'

const root = new URL('../../', import.meta.url)
const read = (path) => readFileSync(new URL(path, root), 'utf8')

const vercelConfig = JSON.parse(read('vercel.json'))
const {routes: topicRoutes, error} = getTransformedRoutes({redirects: vercelConfig.redirects})

const matchingRoute = (path) => topicRoutes.find((route) => new RegExp(route.src).test(path))

const LANGUAGE_ENCODED =
  '%E0%A4%A8%E0%A4%B0%E0%A5%8D%E0%A4%B5%E0%A5%87%E0%A4%9C%E0%A4%BF%E0%A4%AF%E0%A4%A8%20%E0%A4%AD%E0%A4%BE%E0%A4%B7%E0%A4%BE%20%E0%A4%B0%20%E0%A4%B8%E0%A4%AE%E0%A4%BE%E0%A4%9C%E0%A4%AE%E0%A4%BE%20%E0%A4%B8%E0%A4%AE%E0%A4%BE%E0%A4%AF%E0%A5%8B%E0%A4%9C%E0%A4%A8'
const LANGUAGE_RAW = 'नर्वेजियन भाषा र समाजमा समायोजन'
const LANGUAGE_DEST = '/ne/info/topic/norwegian-language-and-integration/'
const DIGITAL_DEST = '/ne/info/topic/digital-sewa-ra-online-suraksha/'

test('vercel.json redirects are valid for Vercel route transformation', () => {
  assert.ok(!error, 'no route transformation error')
  assert.equal(topicRoutes.length, 2)
  for (const route of topicRoutes) assert.equal(route.status, 308)
})

test('the language-and-integration URL redirects in encoded, raw and decoded-space forms', () => {
  const base = '/ne/info/topic/norwegian-language-and-integration'
  for (const path of [
    `${base}%20${LANGUAGE_ENCODED}/`,
    `${base}%20${LANGUAGE_ENCODED}`,
    `${base} ${LANGUAGE_RAW}/`,
    `${base} ${LANGUAGE_RAW}`,
  ]) {
    const route = matchingRoute(path)
    assert.ok(route, path)
    assert.equal(route.headers.Location, LANGUAGE_DEST)
    assert.equal(route.status, 308)
  }
})

test('the digital-services URL redirects with a trailing space in every form', () => {
  const base = '/ne/info/topic/digital-sewa-ra-online-suraksha'
  for (const path of [`${base}%20/`, `${base}%20`, `${base} /`, `${base} `]) {
    const route = matchingRoute(path)
    assert.ok(route, path)
    assert.equal(route.headers.Location, DIGITAL_DEST)
    assert.equal(route.status, 308)
  }
})

test('clean and unrelated URLs are not redirected', () => {
  for (const path of [
    LANGUAGE_DEST,
    DIGITAL_DEST,
    LANGUAGE_DEST.slice(0, -1),
    DIGITAL_DEST.slice(0, -1),
    '/ne/info/topic/norwegian-language-and-integration-extra/',
    '/ne/info/topic/digital-sewa-ra-online-suraksha-extra/',
    '/ne/info/topic/work-employment/',
    '/ne/info/topic/housing/',
    '/nb/info/topic/norwegian-language-and-integration%20x/',
    '/ne/info/',
    '/ne/',
    '/',
  ]) {
    assert.equal(matchingRoute(path), undefined, path)
  }
})

test('redirect destinations never match a redirect source, so no loop is possible', () => {
  for (const route of topicRoutes) {
    assert.equal(matchingRoute(route.headers.Location), undefined)
  }
})

test('the root redirect is configured in Astro, not in the shared vercel.json', () => {
  const config = read('astro.config.mjs')
  assert.match(config, /redirects:\s*\{\s*"\/":\s*\{\s*status:\s*308,\s*destination:\s*"\/ne\/"\s*\}/)
  assert.equal(
    vercelConfig.redirects.some((redirect) => redirect.source === '/'),
    false,
  )
  assert.equal(existsSync(new URL('src/pages/index.astro', root)), false)
})

const buildConfigUrl = new URL('.vercel/output/config.json', root)

test(
  'the production build generates a 308 root route ahead of the filesystem',
  {skip: !existsSync(buildConfigUrl) && 'run `npm run build` first'},
  () => {
    const {routes} = JSON.parse(readFileSync(buildConfigUrl, 'utf8'))
    const filesystemIndex = routes.findIndex((route) => route.handle === 'filesystem')
    const rootIndex = routes.findIndex((route) => route.src === '^/$')
    assert.ok(rootIndex >= 0, 'root route exists')
    assert.ok(rootIndex < filesystemIndex, 'root route precedes the filesystem')
    assert.deepEqual(routes[rootIndex], {
      src: '^/$',
      headers: {Location: '/ne/'},
      status: 308,
    })
    assert.equal(
      routes.some((route) => route.src && route.headers?.Location && new RegExp(route.src).test('/ne/')),
      false,
      '/ne/ is not redirected',
    )
  },
)
