import assert from 'node:assert/strict'
import {mkdtemp, readFile, readdir, rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
import test from 'node:test'
import {isSitemapPage} from '../../src/config/sitemapFilter.mjs'
import {
  PREVIEW_COOKIE_NAME,
  PREVIEW_STUDIO_ORIGINS,
  createPreviewCookieValue,
  decideStudioOrigin,
  parseDevStudioOrigin,
  getPreviewConfig,
  parsePreviewDocumentId,
  parsePreviewLanguage,
  parsePreviewSlug,
  previewResponseHeaders,
  sanitizePreviewRedirect,
  verifyPreviewCookieValue,
} from '../../src/lib/preview/config.ts'
import {loadPreviewDocument, shouldEncodeStega} from '../../src/lib/preview/loaderCore.ts'
import {validateEnableRequest} from '../../src/lib/preview/validateEnable.ts'
import {
  NEWS_ARTICLE_BY_SLUG_QUERY,
  NEWS_ARTICLE_PREVIEW_BY_ID_QUERY,
  NEWS_ARTICLE_PREVIEW_BY_SLUG_QUERY,
  PUBLIC_INFORMATION_GUIDE_BY_SLUG_QUERY,
  PUBLIC_INFORMATION_GUIDE_PREVIEW_BY_ID_QUERY,
  PUBLIC_INFORMATION_GUIDE_PREVIEW_BY_SLUG_QUERY,
} from '../../src/lib/sanity/queries.ts'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

// Test-only values, not real credentials.
const SECRET = 'test-cookie-secret-0123456789-abcdefghijklmnop'
const ENV = {SANITY_API_READ_TOKEN: 'test-token', PREVIEW_COOKIE_SECRET: SECRET}

const makeClient = (result, {fail = false} = {}) => {
  const calls = {withConfig: [], fetch: []}
  const client = {
    withConfig(config) {
      calls.withConfig.push(config)
      return client
    },
    async fetch(query, params, options) {
      calls.fetch.push({query, params, options})
      if (fail) throw new Error('401 Unauthorized: token revoked')
      return {result}
    },
  }
  return {client, calls}
}

const validCookie = () => createPreviewCookieValue(SECRET)

test('missing token or cookie secret fails closed', () => {
  assert.equal(getPreviewConfig(undefined), null)
  assert.equal(getPreviewConfig({}), null)
  assert.equal(getPreviewConfig({SANITY_API_READ_TOKEN: 'x'}), null)
  assert.equal(getPreviewConfig({PREVIEW_COOKIE_SECRET: SECRET}), null)
  assert.equal(getPreviewConfig({SANITY_API_READ_TOKEN: '  ', PREVIEW_COOKIE_SECRET: SECRET}), null)
  assert.equal(getPreviewConfig({SANITY_API_READ_TOKEN: 'x', PREVIEW_COOKIE_SECRET: 'short'}), null)
  assert.deepEqual(getPreviewConfig(ENV), {token: 'test-token', cookieSecret: SECRET})
})

test('redirects: only validated relative /preview/ destinations are accepted', () => {
  assert.equal(sanitizePreviewRedirect('/preview/ne/news/my-story'), '/preview/ne/news/my-story')
  assert.equal(sanitizePreviewRedirect('/preview/news/id/abc-123?x=1'), '/preview/news/id/abc-123?x=1')
  assert.equal(
    sanitizePreviewRedirect('/preview/ne/news/a?sanity-preview-secret=zzz&y=2'),
    '/preview/ne/news/a?y=2',
  )

  for (const bad of [
    undefined,
    null,
    42,
    '',
    'https://evil.example/preview/x',
    '//evil.example/preview/x',
    '/\\evil.example',
    '/preview//evil.example',
    '/preview/\\evil.example',
    '/ne/news/x',
    '/',
    '/previewx/a',
    '/preview/../api/preview/enable',
    '/preview/%2e%2e/secret',
    '/preview/a%2fb',
    '/preview/a\nb',
    'javascript:alert(1)',
    `/preview/${'a'.repeat(600)}`,
  ]) {
    assert.equal(sanitizePreviewRedirect(bad), null, String(bad))
  }
})

test('preview cookie integrity: valid, tampered, expired, wrong secret and malformed', async () => {
  const now = 1_800_000_000
  const value = await createPreviewCookieValue(SECRET, now, 3600)
  assert.match(value, /^v1\.\d+\.[\w-]+\.[\w-]+$/)
  assert.equal(await verifyPreviewCookieValue(SECRET, value, now + 10), true)

  assert.equal(await verifyPreviewCookieValue(SECRET, value, now + 3600), false, 'expired')
  assert.equal(await verifyPreviewCookieValue(`${SECRET}x`, value, now + 10), false, 'rotated secret')

  const [version, expiry, nonce, signature] = value.split('.')
  assert.equal(
    await verifyPreviewCookieValue(SECRET, [version, Number(expiry) + 86400, nonce, signature].join('.'), now),
    false,
    'extended expiry',
  )
  assert.equal(await verifyPreviewCookieValue(SECRET, [version, expiry, 'other', signature].join('.'), now), false)
  assert.equal(await verifyPreviewCookieValue(SECRET, [version, expiry, nonce, `${signature}A`].join('.'), now), false)

  for (const bad of [undefined, '', 'v1', 'v2.1.a.b', 'v1.x.a.b', 'v1.99999999999.a.%%%', 'a'.repeat(400)]) {
    assert.equal(await verifyPreviewCookieValue(SECRET, bad, now), false, String(bad))
  }
})

test('cookie value is opaque: no token, secret or draft data', async () => {
  const value = await validCookie()
  assert.ok(!value.includes(ENV.SANITY_API_READ_TOKEN))
  assert.ok(!value.includes(SECRET))
})

test('Studio origin decides SameSite: Lax for studio.nepali.no, None only for vercel.app', () => {
  assert.deepEqual(decideStudioOrigin('https://studio.nepali.no'), {allowed: true, sameSite: 'lax'})
  assert.deepEqual(decideStudioOrigin('https://nepali-no-studio.vercel.app'), {allowed: true, sameSite: 'none'})
  assert.deepEqual(decideStudioOrigin(undefined), {allowed: true, sameSite: 'lax'})
  assert.equal(decideStudioOrigin('https://evil.example').allowed, false)
  assert.equal(decideStudioOrigin('https://studio.nepali.no.evil.example').allowed, false)
  assert.equal(decideStudioOrigin('http://localhost:3333').allowed, false)
  assert.equal(decideStudioOrigin('http://localhost:3333', {allowDev: true}).allowed, true)
})

test('language, document ID and slug validation', () => {
  assert.equal(parsePreviewLanguage('ne'), 'ne')
  assert.equal(parsePreviewLanguage('nb'), 'nb')
  for (const bad of ['en', 'NE', 'ne ', '', undefined, null, ['ne'], '../ne']) {
    assert.equal(parsePreviewLanguage(bad), null, String(bad))
  }

  assert.equal(parsePreviewDocumentId('2b3c4d5e-1111-2222-3333-444455556666'), '2b3c4d5e-1111-2222-3333-444455556666')
  assert.equal(parsePreviewDocumentId('drafts.abc123'), 'abc123')
  for (const bad of [
    '',
    'drafts.',
    'versions.r1.abc',
    'drafts.drafts.abc',
    'a.b',
    'a b',
    'a/b',
    'abc"] || true',
    '*',
    'a'.repeat(129),
    undefined,
    {$ne: 'x'},
  ]) {
    assert.equal(parsePreviewDocumentId(bad), null, String(bad))
  }

  assert.equal(parsePreviewSlug('my-story'), 'my-story')
  assert.equal(parsePreviewSlug('समाचार-१'), 'समाचार-१')
  for (const bad of ['', 'a/b', 'a?b', 'a#b', 'a b', 'a%2f', 'a\\b', 'a'.repeat(201), undefined]) {
    assert.equal(parsePreviewSlug(bad), null, String(bad))
  }
})

test('preview responses are private, no-store, noindex and frame-restricted', () => {
  const headers = previewResponseHeaders()
  assert.match(headers['Cache-Control'], /private/)
  assert.match(headers['Cache-Control'], /no-store/)
  assert.equal(headers['X-Robots-Tag'], 'noindex, nofollow')
  assert.equal(headers['Referrer-Policy'], 'no-referrer')
  const csp = headers['Content-Security-Policy']
  assert.match(csp, /^frame-ancestors 'self'/)
  for (const origin of PREVIEW_STUDIO_ORIGINS) assert.ok(csp.includes(origin))
  assert.ok(!csp.includes('*'))
  assert.ok(!csp.includes('localhost'))
  assert.ok(previewResponseHeaders({allowDev: true})['Content-Security-Policy'].includes('localhost'))
})

test('loader: inactive without configuration or a valid cookie, and never calls Sanity', async () => {
  const selector = {kind: 'news', language: 'ne', slug: 'story'}
  const {client, calls} = makeClient({_id: 'a', language: 'ne'})

  for (const deps of [
    {client, env: undefined, cookieValue: await validCookie()},
    {client, env: {SANITY_API_READ_TOKEN: 'x'}, cookieValue: await validCookie()},
    {client, env: ENV, cookieValue: undefined},
    {client, env: ENV, cookieValue: 'v1.1.a.b'},
    {client, env: ENV, cookieValue: await createPreviewCookieValue(`${SECRET}-other`)},
    {client, env: ENV, cookieValue: await createPreviewCookieValue(SECRET, 1000, 10)},
  ]) {
    assert.deepEqual(await loadPreviewDocument(deps, selector), {status: 'inactive'})
  }
  assert.equal(calls.fetch.length, 0)
  assert.equal(calls.withConfig.length, 0)
})

test('loader: drafts perspective, token, no CDN and fixed queries only', async () => {
  const {client, calls} = makeClient({_id: 'a', language: 'nb', title: 'T'})
  const deps = {client, env: ENV, cookieValue: await validCookie()}

  const bySlug = await loadPreviewDocument(deps, {kind: 'news', language: 'nb', slug: 'my-story'})
  assert.equal(bySlug.status, 'ok')
  assert.equal(bySlug.language, 'nb')
  const byId = await loadPreviewDocument(deps, {kind: 'news', id: 'drafts.abc-1'})
  assert.equal(byId.status, 'ok')

  assert.equal(calls.fetch[0].query, NEWS_ARTICLE_PREVIEW_BY_SLUG_QUERY)
  assert.deepEqual(calls.fetch[0].params, {language: 'nb', slug: 'my-story'})
  assert.equal(calls.fetch[1].query, NEWS_ARTICLE_PREVIEW_BY_ID_QUERY)
  assert.deepEqual(calls.fetch[1].params, {id: 'abc-1'})

  for (const config of calls.withConfig) {
    assert.equal(config.token, 'test-token')
    assert.equal(config.perspective, 'drafts')
    assert.equal(config.useCdn, false)
    assert.equal(config.resultSourceMap, 'withKeyArraySelector')
    assert.equal(config.stega.enabled, true)
  }
  for (const call of calls.fetch) {
    assert.equal(call.options.perspective, 'drafts')
    assert.equal(call.options.useCdn, false)
    assert.ok(!('token' in call.options))
  }
})

test('loader: invalid IDs, languages, slugs and unknown document types are rejected without a query', async () => {
  const {client, calls} = makeClient({_id: 'a', language: 'ne'})
  const deps = {client, env: ENV, cookieValue: await validCookie()}

  for (const selector of [
    {kind: 'news', id: 'a.b'},
    {kind: 'news', id: 'versions.x.y'},
    {kind: 'guide', id: '*[_type == "submission"]'},
    {kind: 'news', language: 'en', slug: 'x'},
    {kind: 'guide', language: 'ne', slug: '../x'},
    {kind: 'communityEvent', language: 'ne', slug: 'x'},
    {kind: 'submission', id: 'abc'},
    {kind: '__proto__', id: 'abc'},
  ]) {
    assert.deepEqual(await loadPreviewDocument(deps, selector), {status: 'not-found'}, JSON.stringify(selector))
  }
  assert.equal(calls.fetch.length, 0)
})

test('loader: Norwegian Guides stay unavailable while the production section is disabled', async () => {
  const deps = async (language) => ({
    client: makeClient({_id: 'g', language}).client,
    env: ENV,
    cookieValue: await validCookie(),
  })

  assert.equal((await loadPreviewDocument(await deps('ne'), {kind: 'guide', language: 'ne', slug: 'x'})).status, 'ok')
  assert.equal((await loadPreviewDocument(await deps('nb'), {kind: 'guide', language: 'nb', slug: 'x'})).status, 'not-found')
  assert.equal((await loadPreviewDocument(await deps('nb'), {kind: 'guide', id: 'abc'})).status, 'not-found')
  assert.equal((await loadPreviewDocument(await deps('nb'), {kind: 'news', language: 'nb', slug: 'x'})).status, 'ok')
})

test('loader: missing documents and Sanity errors (for example a revoked token) are plain not-found', async () => {
  const cookieValue = await validCookie()
  const selector = {kind: 'news', language: 'ne', slug: 'x'}
  assert.deepEqual(
    await loadPreviewDocument({client: makeClient(null).client, env: ENV, cookieValue}, selector),
    {status: 'not-found'},
  )
  assert.deepEqual(
    await loadPreviewDocument({client: makeClient(null, {fail: true}).client, env: ENV, cookieValue}, selector),
    {status: 'not-found'},
  )
  assert.deepEqual(
    await loadPreviewDocument(
      {client: makeClient({_id: 'a', language: 'fr'}).client, env: ENV, cookieValue},
      selector,
    ),
    {status: 'not-found'},
  )
})

test('stega is limited to title, summary and body text', () => {
  assert.equal(shouldEncodeStega({sourcePath: ['title']}), true)
  assert.equal(shouldEncodeStega({sourcePath: ['summary']}), true)
  assert.equal(shouldEncodeStega({sourcePath: ['body', {_key: 'a'}, 'children', {_key: 'b'}, 'text']}), true)
  for (const path of [
    ['language'],
    ['slug'],
    ['category'],
    ['newsRegion'],
    ['publishedAt'],
    ['sourceUrl'],
    ['officialSourceUrl'],
    ['lastReviewedAt'],
    ['body', {_key: 'a'}, 'style'],
    ['body', {_key: 'a'}, 'markDefs', {_key: 'm'}, 'href'],
    ['body', {_key: 'a'}, 'label'],
    ['relatedNews', 0, 'title'],
  ]) {
    assert.equal(shouldEncodeStega({sourcePath: path}), false, JSON.stringify(path))
  }
})

test('public queries keep every publication and status restriction', () => {
  const normalize = (query) => query.replace(/\s+/g, ' ')

  const news = normalize(NEWS_ARTICLE_BY_SLUG_QUERY)
  assert.match(news, /_type == "newsArticle"/)
  assert.match(news, /slug\.current == \$slug/)
  assert.match(news, /language == \$language/)
  assert.match(news, /defined\(publishedAt\)/)
  assert.match(news, /publishedAt <= now\(\)/)

  const guide = normalize(PUBLIC_INFORMATION_GUIDE_BY_SLUG_QUERY)
  assert.match(guide, /_type == "publicInformationGuide"/)
  assert.match(guide, /slug\.current == \$slug/)
  assert.match(guide, /language == \$language/)
  assert.match(guide, /status == "active"/)
})

test('preview queries differ only in their filters and stay type-restricted', () => {
  const filterOf = (query) => query.slice(query.indexOf('*['), query.indexOf(']'))
  const projectionOf = (query) => query.slice(query.indexOf(']') + 1)

  assert.equal(projectionOf(NEWS_ARTICLE_PREVIEW_BY_SLUG_QUERY), projectionOf(NEWS_ARTICLE_BY_SLUG_QUERY))
  assert.equal(projectionOf(NEWS_ARTICLE_PREVIEW_BY_ID_QUERY), projectionOf(NEWS_ARTICLE_BY_SLUG_QUERY))
  assert.equal(
    projectionOf(PUBLIC_INFORMATION_GUIDE_PREVIEW_BY_SLUG_QUERY),
    projectionOf(PUBLIC_INFORMATION_GUIDE_BY_SLUG_QUERY),
  )
  assert.equal(
    projectionOf(PUBLIC_INFORMATION_GUIDE_PREVIEW_BY_ID_QUERY),
    projectionOf(PUBLIC_INFORMATION_GUIDE_BY_SLUG_QUERY),
  )

  for (const [query, type] of [
    [NEWS_ARTICLE_PREVIEW_BY_SLUG_QUERY, 'newsArticle'],
    [NEWS_ARTICLE_PREVIEW_BY_ID_QUERY, 'newsArticle'],
    [PUBLIC_INFORMATION_GUIDE_PREVIEW_BY_SLUG_QUERY, 'publicInformationGuide'],
    [PUBLIC_INFORMATION_GUIDE_PREVIEW_BY_ID_QUERY, 'publicInformationGuide'],
  ]) {
    assert.match(filterOf(query), new RegExp(`_type == "${type}"`))
    assert.match(filterOf(query), /\$(slug|id)/)
  }
  assert.doesNotMatch(filterOf(NEWS_ARTICLE_PREVIEW_BY_SLUG_QUERY), /publishedAt/)
  assert.doesNotMatch(filterOf(PUBLIC_INFORMATION_GUIDE_PREVIEW_BY_SLUG_QUERY), /status/)
})

test('preview routes never enter the sitemap and other exclusions are preserved', () => {
  for (const path of ['/preview/', '/preview/ne/news/x/', '/preview/news/id/abc/', '/preview/info/id/abc/']) {
    assert.equal(isSitemapPage(`https://nepali.no${path}`), false, path)
  }
  for (const path of ['/', '/translations/ne/', '/api/preview/enable', '/dev/location-map-test/', '/ne/events/submit/']) {
    assert.equal(isSitemapPage(`https://nepali.no${path}`), false, path)
  }
  for (const path of ['/ne/news/x/', '/ne/info/x/', '/nb/news/', '/ne/about/']) {
    assert.equal(isSitemapPage(`https://nepali.no${path}`), true, path)
  }
})

test('robots.txt disallows preview alongside the existing exclusions', async () => {
  const robots = await read('../../public/robots.txt')
  for (const rule of ['/translations/', '/api/', '/preview/']) assert.match(robots, new RegExp(`Disallow: ${rule}`))
})

test('the shared Sanity client stays published-only and carries no token', async () => {
  const config = await read('../../astro.config.mjs')
  assert.match(config, /perspective: "published"/)
  assert.match(config, /useCdn: false/)
  assert.doesNotMatch(config, /token|perspective: ["'](drafts|previewDrafts|raw)/i)
})

test('secrets are server-only: never PUBLIC_*, and only referenced by preview server code', async () => {
  const names = /SANITY_API_READ_TOKEN|PREVIEW_COOKIE_SECRET/
  assert.doesNotMatch(await read('../../src/env.d.ts'), /PUBLIC_(SANITY_API_READ_TOKEN|PREVIEW_COOKIE_SECRET)/)

  const walk = async (directory) => {
    const entries = await readdir(new URL(directory, import.meta.url), {withFileTypes: true})
    const files = await Promise.all(
      entries.map((entry) =>
        entry.isDirectory() ? walk(`${directory}${entry.name}/`) : [`${directory}${entry.name}`],
      ),
    )
    return files.flat()
  }

  const allowed = [
    'src/env.d.ts',
    'src/lib/preview/config.ts',
    'src/lib/preview/loader.ts',
    'src/lib/preview/loaderCore.ts',
    'src/pages/api/preview/enable.ts',
  ]
  const referencing = []
  for (const file of await walk('../../src/')) {
    if (!/\.(ts|tsx|astro|mjs|js)$/.test(file)) continue
    if (names.test(await read(file))) referencing.push(file.replace('../../', ''))
  }
  for (const file of referencing) assert.ok(allowed.includes(file), `unexpected reference: ${file}`)

  const clientComponents = (await walk('../../src/')).filter((file) => file.endsWith('.tsx'))
  for (const file of clientComponents) assert.doesNotMatch(await read(file), names, file)
  assert.doesNotMatch(await read('../../src/lib/preview/config.ts'), /import\.meta\.env|process\.env/)
})

test('PUBLIC_ variables carry no privileged values', async () => {
  const names = /PUBLIC_[A-Z_]*(TOKEN|SECRET|KEY)/
  for (const file of ['../../src/env.d.ts', '../../astro.config.mjs', '../../sanity/sanity.config.ts']) {
    assert.doesNotMatch(await read(file), names, file)
  }
})

test('preview pages are on-demand, share the public views and use the loader', async () => {
  const pages = [
    ['../../src/pages/preview/[lang]/news/[slug].astro', 'NewsArticleView'],
    ['../../src/pages/preview/news/id/[id].astro', 'NewsArticleView'],
    ['../../src/pages/preview/[lang]/info/[slug].astro', 'GuideView'],
    ['../../src/pages/preview/info/id/[id].astro', 'GuideView'],
  ]
  for (const [path, view] of pages) {
    const source = await read(path)
    assert.match(source, /export const prerender = false/, path)
    assert.match(source, new RegExp(`<${view}[^>]*\\bpreview\\b`), path)
    assert.match(source, /if \(result\.status !== 'ok'\) return previewNotFound\(\)/, path)
    assert.match(source, /applyPreviewHeaders\(Astro\.response\)/, path)
    assert.doesNotMatch(source, /PortableText|sanityClient|perspective/, path)
  }

  const landing = await read('../../src/pages/preview/index.astro')
  assert.match(landing, /export const prerender = false/)
  assert.match(landing, /if \(!active\) return previewNotFound\(\)/)
  assert.match(landing, /noindex, nofollow/)
  assert.match(landing, /import \{VisualEditing\} from '@sanity\/astro\/visual-editing'/)
  assert.match(landing, /<VisualEditing enabled \/>/)
  assert.ok(landing.indexOf('if (!active) return previewNotFound()') < landing.indexOf('<VisualEditing enabled />'))
  const astroConfig = await read('../../astro.config.mjs')
  assert.match(astroConfig, /import react from "@astrojs\/react"/)
  assert.match(astroConfig, /\breact\(\)/)
})

test('Vite optimizes Visual Editing CommonJS dependencies for default and named imports', async () => {
  const {createServer} = await import('vite')
  const {default: config} = await import('../../astro.config.mjs')
  const cacheDir = await mkdtemp(join(tmpdir(), 'preview-vite-check-'))
  let server
  try {
    server = await createServer({
      configFile: false,
      root: process.cwd(),
      cacheDir,
      logLevel: 'error',
      optimizeDeps: {...config.vite.optimizeDeps, noDiscovery: true},
      server: {middlewareMode: true},
    })
    const mutate = await server.transformRequest('/node_modules/@sanity/mutate/dist/index.js')
    assert.ok(mutate)
    const optimizedImport = mutate.code.match(/from ["']([^"']*lodash[^"']*)["']/)
    assert.ok(optimizedImport, 'Vite must rewrite the Lodash import to its optimized module')
    assert.match(optimizedImport[1], /\/deps\/lodash_isObject/)
    const lodash = await server.transformRequest(optimizedImport[1])
    assert.ok(lodash)
    assert.match(lodash.code, /export default/)

    const transactions = await server.transformRequest('/node_modules/@sanity/mutate/dist/_chunks-es/toTransactions.js')
    assert.ok(transactions)
    const groupByImport = transactions.code.match(/from ["']([^"']*lodash_groupBy[^"']*)["']/)
    assert.ok(groupByImport, 'Vite must rewrite the groupBy import to its optimized module')
    assert.match(groupByImport[1], /\/deps\/lodash_groupBy/)
    const groupBySource = await server.transformRequest(groupByImport[1])
    assert.ok(groupBySource)
    assert.match(groupBySource.code, /export default/)
    const groupBy = await import(pathToFileURL(join(cacheDir, 'deps', 'lodash_groupBy__js.js')).href)
    assert.deepEqual(groupBy.default([1, 2, 3], (value) => value % 2), {'0': [2], '1': [1, 3]})

    const mutations = await server.transformRequest('/node_modules/@sanity/visual-editing/dist/_chunks-es/mutations.js')
    assert.ok(mutations)
    assert.match(mutations.code, /const c = \w+\["c"\]/)
    const runtimeImport = mutations.code.match(/from ["']([^"']*react_compiler-runtime[^"']*)["']/)
    assert.ok(runtimeImport, 'Vite must rewrite the compiler runtime to its optimized module')
    assert.match(runtimeImport[1], /\/deps\/react_compiler-runtime/)
    const runtime = await server.transformRequest(runtimeImport[1])
    assert.ok(runtime)
    assert.match(runtime.code, /export default/)
    const runtimePath = join(cacheDir, 'deps', 'react_compiler-runtime.js')
    const runtimeModule = await import(pathToFileURL(runtimePath).href)
    assert.equal(typeof runtimeModule.default.c, 'function')
  } finally {
    await server?.close()
    await rm(cacheDir, {recursive: true, force: true})
  }
})

test('API routes are on-demand, no-store and cannot be used without validation', async () => {
  const enable = await read('../../src/pages/api/preview/enable.ts')
  const disable = await read('../../src/pages/api/preview/disable.ts')
  for (const source of [enable, disable]) {
    assert.match(source, /export const prerender = false/)
    assert.match(source, /getPreviewHeaders\(\)/)
  }
  assert.match(enable, /validateEnableRequest\(client, request\.url\)/)
  assert.match(enable, /sanitizePreviewRedirect\(validation\.redirectTo\)/)
  assert.match(enable, /httpOnly: true/)
  assert.match(enable, /secure: true/)
  assert.match(enable, /path: '\/'/)
  assert.match(enable, /maxAge: PREVIEW_COOKIE_MAX_AGE_SECONDS/)
  assert.doesNotMatch(enable, /searchParams\.get\('redirect|searchParams\.get\("redirect/)
  assert.match(disable, /Location: SAFE_DESTINATION/)
  assert.doesNotMatch(disable, /request|searchParams|sanityClient|fetch\(/)
  assert.equal(PREVIEW_COOKIE_NAME, 'nepali_preview')
  assert.doesNotMatch(
    await read('../../src/lib/translationAuth/session.ts'),
    new RegExp(PREVIEW_COOKIE_NAME),
  )
})

test('enable validation separates invalid secrets, rejected tokens and exceptions without logging request data', async () => {
  const calls = []
  const mock = (response) => ({
    config: () => ({token: 'test-token'}),
    withConfig(config) {
      calls.push(config)
      return this
    },
    async fetch(query, params, options) {
      calls.push({query, params, options})
      if (response instanceof Error) throw response
      return response
    },
  })
  const url = 'https://frontend.example/api/preview/enable?sanity-preview-secret=test-secret&sanity-preview-pathname=%2Fpreview%2F'
  const valid = {private: {_id: 'test', _updatedAt: '2026-01-01', secret: 'test-secret', studioUrl: 'https://studio.example/content'}}
  const result = await validateEnableRequest(mock(valid), url)
  assert.equal(result.ok, true)
  assert.equal(result.validation.redirectTo, '/preview/')
  assert.equal(result.validation.studioOrigin, 'https://studio.example')
  assert.equal(calls[0].perspective, 'raw')
  assert.equal(calls[0].useCdn, false)
  assert.equal(calls[1].params.secret, 'test-secret')
  assert.equal((await validateEnableRequest(mock({private: null, public: null}), url)).reason, 'invalid_preview_secret')
  assert.equal((await validateEnableRequest(mock(valid), 'https://frontend.example/api/preview/enable')).reason, 'missing_preview_secret')
  const rejected = Object.assign(new Error('sensitive error'), {statusCode: 403})
  assert.equal((await validateEnableRequest(mock(rejected), url)).reason, 'token_rejected')
  assert.equal((await validateEnableRequest(mock(new Error('sensitive error')), url)).reason, 'validation_exception')
  assert.equal((await validateEnableRequest(mock({private: {...valid.private, studioUrl: 'bad url'}}), url)).reason, 'validation_exception')
  const malformedRedirect = 'https://frontend.example/api/preview/enable?sanity-preview-secret=test-secret&sanity-preview-pathname=http%3A%2F%2F%5B'
  assert.equal((await validateEnableRequest(mock(valid), malformedRedirect)).reason, 'validation_exception')
  const localUrl = url.replace('https://frontend.example', 'https://forwarded-frontend.example')
  assert.equal((await validateEnableRequest(mock(valid), localUrl)).ok, true)

  const enable = await read('../../src/pages/api/preview/enable.ts')
  assert.doesNotMatch(enable, /console\.(?:warn|error|log)\(/)
})

test('public pages never import preview code or Visual Editing', async () => {
  for (const path of [
    '../../src/pages/[lang]/news/[slug].astro',
    '../../src/pages/[lang]/info/[slug].astro',
  ]) {
    const source = await read(path)
    assert.doesNotMatch(source, /preview|VisualEditing|drafts/i, path)
    assert.match(source, /<(NewsArticleView|GuideView) [^>]*\/>/)
    assert.doesNotMatch(source, /\bpreview\b/, path)
  }
})

test('shared views enable overlays, noindex and no analytics only in preview mode', async () => {
  for (const path of ['NewsArticleView', 'GuideView']) {
    const view = await read(`../../src/components/articles/${path}.astro`)
    assert.match(view, /preview = false/)
    assert.match(view, /\{preview && <VisualEditing enabled \/>\}/)
    assert.match(view, /preview=\{preview\}/)
    assert.match(view, /stegaClean\(/)
    assert.match(view, /!preview &&/)
  }

  const layout = await read('../../src/layouts/BaseLayout.astro')
  assert.match(layout, /robotsNoIndex = noIndex \|\| preview/)
  assert.match(layout, /emitCanonical = !preview \|\| canonicalUrl !== undefined/)
  assert.match(layout, /\{!preview && <Analytics \/>\}/)
})

test('Presentation is configured only for the public-content workspace', async () => {
  const config = await read('../../sanity/sanity.config.ts')
  const moderationStart = config.indexOf("name: 'submission-moderation'")
  assert.ok(moderationStart > 0)
  const publicWorkspace = config.slice(0, moderationStart)
  const moderationWorkspace = config.slice(moderationStart)

  assert.match(publicWorkspace, /createPresentationTool\(\)/)
  assert.doesNotMatch(moderationWorkspace, /presentation|Presentation/i)

  const preview = await read('../../sanity/presentation/previewConfig.ts')
  assert.match(preview, /origin: PREVIEW_ORIGIN/)
  assert.match(preview, /PRODUCTION_PREVIEW_ORIGIN = 'https:\/\/nepali\.no'/)
  assert.match(preview, /process\.env\.SANITY_STUDIO_PREVIEW_ORIGIN/)
  assert.match(preview, /process\.env\.NODE_ENV === 'development'\s*\?\s*resolvePreviewOrigin\('development', process\.env\.SANITY_STUDIO_PREVIEW_ORIGIN\)\s*:\s*PRODUCTION_PREVIEW_ORIGIN/)
  assert.doesNotMatch(preview, /SANITY_API_READ_TOKEN|PREVIEW_COOKIE_SECRET/)
  assert.match(preview, /enable: '\/api\/preview\/enable'/)
  assert.match(preview, /disable: '\/api\/preview\/disable'/)
  assert.match(preview, /\/preview\/:lang\/news\/:slug/)
  assert.match(preview, /\/preview\/news\/id\/:id/)
  assert.match(preview, /\/preview\/:lang\/info\/:slug/)
  assert.match(preview, /\/preview\/info\/id\/:id/)
  assert.doesNotMatch(preview, /token/i)
})

test('Studio preview origin: production is fixed, development requires SANITY_STUDIO_PREVIEW_ORIGIN', async () => {
  const src = await read('../../sanity/presentation/previewConfig.ts')
  const fn = src.slice(src.indexOf('export const resolvePreviewOrigin'), src.indexOf('export const PREVIEW_ORIGIN'))
  const {transform} = await import('node:module').then((m) => ({transform: m.stripTypeScriptTypes}))
  const js = transform(fn.replace('export const', 'const')) + '\nreturn resolvePreviewOrigin;'
  const resolve = new Function('PRODUCTION_PREVIEW_ORIGIN', js)('https://nepali.no')
  assert.equal(resolve('production', 'http://evil.example'), 'https://nepali.no')
  assert.equal(resolve(undefined, undefined), 'https://nepali.no')
  assert.equal(resolve('development', 'https://forwarded-frontend.example/'), 'https://forwarded-frontend.example')
  assert.throws(() => resolve('development', ''), /SANITY_STUDIO_PREVIEW_ORIGIN is required/)
  assert.throws(() => resolve('development', undefined), /SANITY_STUDIO_PREVIEW_ORIGIN is required/)
  assert.throws(() => resolve('development', 'ftp://x'), /http\(s\)/)
})

test('PREVIEW_DEV_STUDIO_ORIGIN is a strict, development-only extra Studio origin', () => {
  const dev = 'https://forwarded-studio.example'
  assert.equal(parseDevStudioOrigin(dev), dev)
  assert.equal(parseDevStudioOrigin(`${dev}/`), dev)
  assert.equal(parseDevStudioOrigin('http://localhost:3333'), 'http://localhost:3333')
  for (const bad of [
    undefined,
    '',
    'ftp://abc',
    'https://*.example',
    'https://user:pw@studio.example',
    `${dev}/path`,
    `${dev}?x=1`,
    `${dev}#frag`,
    'not a url',
  ]) {
    assert.equal(parseDevStudioOrigin(bad), undefined, String(bad))
  }

  const dec = decideStudioOrigin(dev, {allowDev: true, devStudioOrigin: dev})
  assert.equal(dec.allowed, true)
  assert.equal(dec.sameSite, 'none')
  assert.equal(decideStudioOrigin('http://localhost:3333', {allowDev: true, devStudioOrigin: dev}).allowed, true)
  // Production ignores the variable.
  assert.equal(decideStudioOrigin(dev, {allowDev: false, devStudioOrigin: dev}).allowed, false)
  assert.equal(decideStudioOrigin(dev, {devStudioOrigin: dev}).allowed, false)
  assert.equal(decideStudioOrigin(dev, {allowDev: true}).allowed, false)
  assert.equal(decideStudioOrigin('https://other-studio.example', {allowDev: true, devStudioOrigin: dev}).allowed, false)
  assert.ok(previewResponseHeaders({allowDev: true, devStudioOrigin: dev})['Content-Security-Policy'].includes(dev))
  assert.ok(!previewResponseHeaders({devStudioOrigin: dev})['Content-Security-Policy'].includes(dev))
})
