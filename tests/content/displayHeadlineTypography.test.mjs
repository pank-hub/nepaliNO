import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')
const [css, newsPage, guidePage, pkg, astroConfig, vercelJson, portableTextMark] = await Promise.all([
  read('../../src/styles/global.css'),
  read('../../src/pages/[lang]/news/[slug].astro'),
  read('../../src/pages/[lang]/info/[slug].astro'),
  read('../../package.json'),
  read('../../astro.config.mjs'),
  read('../../vercel.json'),
  read('../../node_modules/astro-portabletext/components/Mark.astro'),
])

const MUKTA_STACK =
  'Mukta, "Noto Sans Devanagari Variable", "Inter Variable", system-ui, sans-serif'

const rule = (source, selector) => {
  const start = source.indexOf(`${selector} {`)
  assert.notEqual(start, -1, `missing rule: ${selector}`)
  return source.slice(start, source.indexOf('}', start))
}

const declarationsOf = (source, selector) => rule(source, selector)

test('Mukta Devanagari 600 is imported, and only that Mukta file', () => {
  assert.match(css, /@import "@fontsource\/mukta\/devanagari-600\.css";/)
  assert.equal((css.match(/@fontsource\/mukta\//g) ?? []).length, 1)
})

test('Mukta leads the stack only in the two approved Nepali h1 selectors', () => {
  for (const [source, selector] of [
    [newsPage, 'html[lang="ne"] .article-header h1'],
    [guidePage, 'html[lang="ne"] .guide-hero__content h1'],
  ]) {
    const body = declarationsOf(source, selector)
    assert.ok(body.includes(`font-family: ${MUKTA_STACK};`))
    assert.match(body, /font-weight: 600;/)
  }
  assert.equal((newsPage.match(/Mukta/g) ?? []).length, 1)
  assert.equal((guidePage.match(/Mukta/g) ?? []).length, 1)
})

test('Mukta is absent from global, body, prose, navigation and heading rules', () => {
  assert.equal((css.match(/Mukta/g) ?? []).length, 0)
  assert.doesNotMatch(css, /font-family:[^;]*mukta/i)
})

test('Nepali h1 selectors have no width cap and wrap naturally', () => {
  assert.match(declarationsOf(newsPage, 'html[lang="ne"] .article-header h1'), /max-width: none;/)
  assert.match(declarationsOf(guidePage, 'html[lang="ne"] .guide-hero__content h1'), /max-width: none;/)
  assert.match(declarationsOf(css, 'html[lang="ne"] h6'), /text-wrap: wrap;/)
  assert.match(declarationsOf(css, 'html[lang="ne"] .prose h4'), /text-wrap: wrap;/)
})

test('Norwegian and default headings keep their font and 18ch rule', () => {
  assert.match(declarationsOf(newsPage, '.article-header h1'), /max-width: 18ch;/)
  assert.match(declarationsOf(guidePage, '.guide-hero__content h1'), /max-width: 18ch;/)
  assert.match(
    css,
    /html \{[^}]*font-family: "Inter Variable", "Noto Sans Devanagari Variable", system-ui, sans-serif;/,
  )
  assert.match(
    css,
    /html\[lang="ne"\] \{\s*font-family: "Noto Sans Devanagari Variable", "Inter Variable", system-ui, sans-serif;/,
  )
})

test('Nepali prose em inherits weight, is not bold, and leads with Inter', () => {
  const body = declarationsOf(css, 'html[lang="ne"] .prose em')
  assert.match(body, /font-weight: inherit;/)
  assert.doesNotMatch(body, /font-weight:\s*(5[0-9]{2}|6[0-9]{2}|7[0-9]{2}|8[0-9]{2}|bold)/)
  assert.doesNotMatch(css, /font-weight: 580/)
  assert.match(
    body,
    /font-family: "Inter Variable", "Noto Sans Devanagari Variable", system-ui, sans-serif;/,
  )
  assert.doesNotMatch(body, /color: var\(--civic-deep\)/)
  assert.match(css, /font-synthesis: none;/)
})

test('Inter italic is imported', () => {
  assert.match(css, /@import "@fontsource-variable\/inter\/wght-italic\.css";/)
})

test('strong stays bold and em stays semantic em, not strong', () => {
  assert.match(rule(css, 'strong'), /font-weight: 700;/)
  assert.match(rule(css, '.prose strong'), /font-weight: 780;/)
  assert.match(rule(css, 'html[lang="ne"] .prose strong'), /font-weight: 700;/)
  assert.match(portableTextMark, /markTypeIs\("em"\) \? \(\s*<em \{\.\.\.attrs\}><slot \/><\/em>/)
  assert.match(portableTextMark, /markTypeIs\("strong"\) \? \(\s*<strong \{\.\.\.attrs\}><slot \/><\/strong>/)
  for (const page of [newsPage, guidePage]) {
    assert.doesNotMatch(page, /marks\s*:/)
  }
})

test('temporary typography-lab artefacts are absent', async () => {
  const {existsSync} = await import('node:fs')
  assert.equal(existsSync(new URL('../../src/pages/dev', import.meta.url)), false)
  assert.doesNotMatch(astroConfig, /\/dev/)
  assert.doesNotMatch(vercelJson, /X-Robots-Tag|\/dev/)
  assert.doesNotMatch(pkg, /anek|tiro/i)
  assert.match(pkg, /"@fontsource\/mukta"/)
  assert.doesNotMatch(css + newsPage + guidePage, /typography-lab|anek|tiro/i)
})
