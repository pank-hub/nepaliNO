// Builds the reviewable import file for the four AI transparency documents.
//
//   node sanity/seed/build-ai-transparency-seed.mjs          (rewrite the file)
//   node sanity/seed/build-ai-transparency-seed.mjs --check  (fail if out of date)
//
// Documents are emitted as DRAFTS with stable IDs. Import them with
// `sanity dataset import --missing`, which skips any ID that already exists, so
// reruns cannot duplicate pages or overwrite editor changes. Editors review and
// publish each draft in Studio.
//
// The content is an initial editorial draft that requires review before publication.
// Never publish it automatically, and never import it without `--missing`, which
// guarantees that rerunning the import does not overwrite an existing document.
import {readFile, writeFile} from 'node:fs/promises'
import {aiTransparencyPages} from './aiTransparencyPages.content.mjs'

const OUTPUT = new URL('./ai-transparency-pages.ndjson', import.meta.url)
const ROUTES = {aiInformation: 'ai-information', aiGuidelines: 'ai-guidelines'}

const key = (prefix, index, extra = 0) => `${prefix}${index}x${extra}`

const spansFor = (parts, blockKey) => {
  const markDefs = []
  const children = []
  parts.forEach((part, i) => {
    const spanKey = key(`${blockKey}s`, i)
    if (typeof part === 'string') {
      children.push({_type: 'span', _key: spanKey, text: part, marks: []})
    } else if (part.page) {
      const markKey = key(`${blockKey}m`, i)
      markDefs.push({_type: 'internalPageLink', _key: markKey, pageKey: part.page})
      children.push({_type: 'span', _key: spanKey, text: part.text, marks: [markKey]})
    } else {
      const mark = part.strong ? 'strong' : 'em'
      children.push({
        _type: 'span',
        _key: spanKey,
        text: part.strong ?? part.em,
        marks: [mark],
      })
    }
  })
  return {children, markDefs}
}

const toParts = (value) => (Array.isArray(value) ? value : [value])

const toBlocks = (items) =>
  items.flatMap((item, index) => {
    const make = (style, value, extra = {}) => ({
      _type: 'block',
      _key: key('b', index, extra.itemIndex ?? 0),
      style,
      ...(extra.listItem ? {listItem: extra.listItem, level: 1} : {}),
      ...spansFor(toParts(value), key('b', index, extra.itemIndex ?? 0)),
    })
    if (item.h2) return [make('h2', item.h2)]
    if (item.h3) return [make('h3', item.h3)]
    if (item.p) return [make('normal', item.p)]
    if (item.quote) return [make('blockquote', item.quote)]
    const listItem = item.ul ? 'bullet' : 'number'
    return (item.ul ?? item.ol).map((entry, itemIndex) =>
      make('normal', entry, {listItem, itemIndex}),
    )
  })

export const buildSeedDocuments = () =>
  aiTransparencyPages.map((page) => ({
    _id: `drafts.ai-transparency-page-${ROUTES[page.pageKey]}-${page.language}`,
    _type: 'aiTransparencyPage',
    pageKey: page.pageKey,
    language: page.language,
    title: page.title,
    summary: page.summary,
    body: toBlocks(page.body),
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
  }))

export const buildSeedNdjson = () =>
  `${buildSeedDocuments()
    .map((document) => JSON.stringify(document))
    .join('\n')}\n`

if (import.meta.url === `file://${process.argv[1]}`) {
  const next = buildSeedNdjson()
  if (process.argv.includes('--check')) {
    const current = await readFile(OUTPUT, 'utf8').catch(() => '')
    if (current !== next) {
      console.error('ai-transparency-pages.ndjson is out of date.')
      process.exit(1)
    }
    console.log('ai-transparency-pages.ndjson is up to date.')
  } else {
    await writeFile(OUTPUT, next)
    console.log(`Wrote ${OUTPUT.pathname}`)
  }
}
