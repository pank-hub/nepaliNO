import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'
import {getTranslationModule} from '../../src/lib/translationBrowser/registry.ts'
import {validateTranslationProposal} from '../../src/lib/translationBrowser/validateProposal.ts'
import {updateTranslationSources, approvedTranslationFiles} from '../../src/lib/translationGitHub/sourceUpdate.ts'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('Translation Editor discovers, validates and targets the new keys', async () => {
  for (const language of ['ne', 'nb']) {
    const mod = getTranslationModule(language, 'footer-common')
    const entries = new Map(mod.entries.map((e) => [e.key, e.value]))
    for (const k of ['title', 'disclosure']) {
      assert.ok(entries.has(`common.articleSummary.${k}`), `${language} ${k}`)
    }
    for (const k of ['showMore', 'showLess']) {
      assert.ok(entries.has(`common.${k}`), `${language} ${k}`)
    }
    const key = 'common.showMore'
    const result = validateTranslationProposal({
      language,
      module: 'footer-common',
      changes: [{key, originalValue: entries.get(key), proposedValue: 'Ny tekst'}],
    })
    assert.equal(result.ok, true)
    const file = approvedTranslationFiles[language]?.main ?? approvedTranslationFiles[language]
    const path = typeof file === 'string' ? file : `src/i18n/${language}.ts`
    const source = await read(`../../${path}`)
    const updated = updateTranslationSources(language, 'footer-common', result.changes, new Map([[path, source]]))
    assert.ok(updated.files[0].updatedSource.includes('Ny tekst'))
    assert.deepEqual(updated.files[0].changedKeys.length, 1)
  }
})

test('translations exist in ne, nb and en; English routing untouched', async () => {
  const {ne} = await import('../../src/i18n/ne.ts')
  const {nb} = await import('../../src/i18n/nb.ts')
  const {en} = await import('../../src/i18n/en.ts')
  assert.equal(ne.common.articleSummary.title, 'छोटकरीमा')
  assert.equal(ne.common.showMore, 'थप हेर्नुहोस्')
  assert.equal(ne.common.showLess, 'कम देखाउनुहोस्')
  assert.equal(nb.common.articleSummary.title, 'Kort fortalt')
  assert.equal(nb.common.showMore, 'Vis mer')
  assert.equal(nb.common.showLess, 'Vis mindre')
  assert.equal(en.common.articleSummary.title, 'In brief')
  for (const l of [ne, nb, en]) assert.ok(l.common.articleSummary.disclosure.length > 10)
})
