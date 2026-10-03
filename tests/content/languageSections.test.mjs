import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'
import {
  getLanguagesWithSection,
  isSectionEnabled,
  resolveAlternatePath,
} from '../../src/config/languageSections.ts'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('Norwegian publishes News only; Nepali keeps every section', () => {
  for (const section of ['information', 'events', 'directory', 'forum']) {
    assert.equal(isSectionEnabled('nb', section), false, `nb ${section}`)
    assert.equal(isSectionEnabled('ne', section), true, `ne ${section}`)
  }
  assert.equal(isSectionEnabled('nb', 'news'), true)
  assert.equal(isSectionEnabled('ne', 'news'), true)
})

test('static paths only include languages with the section enabled', () => {
  assert.deepEqual(getLanguagesWithSection('information'), ['ne'])
  assert.deepEqual(getLanguagesWithSection('events'), ['ne'])
  assert.deepEqual(getLanguagesWithSection('directory'), ['ne'])
  assert.deepEqual(getLanguagesWithSection('news'), ['ne', 'nb'])
})

test('language switcher never targets a disabled Norwegian section', () => {
  assert.equal(resolveAlternatePath('nb', '/nb/info/'), '/nb/')
  assert.equal(resolveAlternatePath('nb', '/nb/info/some-guide/'), '/nb/')
  assert.equal(resolveAlternatePath('nb', '/nb/events/submit/'), '/nb/')
  assert.equal(resolveAlternatePath('nb', '/nb/directory/'), '/nb/')
  assert.equal(resolveAlternatePath('nb', '/nb/news/an-article/'), '/nb/news/an-article/')
  assert.equal(resolveAlternatePath('nb', '/nb/'), '/nb/')
  assert.equal(resolveAlternatePath('ne', '/ne/info/'), '/ne/info/')
})

test('pages and shared components consult the section configuration', async () => {
  const [header, footer, home, newsArticle, newsIndex, contact, ...routePages] =
    await Promise.all([
      read('../../src/components/SiteHeader.astro'),
      read('../../src/components/SiteFooter.astro'),
      read('../../src/pages/[lang]/index.astro'),
      read('../../src/pages/[lang]/news/[slug].astro'),
      read('../../src/pages/[lang]/news/index.astro'),
      read('../../src/pages/[lang]/contact.astro'),
      read('../../src/pages/[lang]/info/index.astro'),
      read('../../src/pages/[lang]/info/[slug].astro'),
      read('../../src/pages/[lang]/info/topic/[slug].astro'),
      read('../../src/pages/[lang]/events/index.astro'),
      read('../../src/pages/[lang]/events/[slug].astro'),
      read('../../src/pages/[lang]/events/past.astro'),
      read('../../src/pages/[lang]/events/submit.astro'),
      read('../../src/pages/[lang]/directory/index.astro'),
      read('../../src/pages/[lang]/directory/[slug].astro'),
      read('../../src/pages/[lang]/directory/submit.astro'),
    ])

  for (const source of [header, footer, home, newsArticle, newsIndex, contact]) {
    assert.match(source, /isSectionEnabled/)
  }
  for (const source of routePages) {
    assert.match(source, /getLanguagesWithSection|isSectionEnabled\(language/)
    assert.doesNotMatch(source, /return supportedLanguages\.map/)
  }
})

test('disabled Norwegian sections redirect to the Norwegian home page', async () => {
  for (const section of ['info', 'events', 'directory']) {
    const page = await read(`../../src/pages/nb/${section}/[...slug].astro`)
    assert.match(page, /prerender = false/)
    assert.match(page, /Astro\.redirect\('\/nb\/', 302\)/)
  }
})
