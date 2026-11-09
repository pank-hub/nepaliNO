import {isSearchFilter, prepareSearch, rankSearch, type PreparedDocument} from './engine.ts'
import {isMeaningfulQuery, MAX_QUERY_LENGTH} from './text.ts'
import type {SearchDocument, SearchFilter, SearchIndex} from './types.ts'
import type {SupportedLanguage} from '../../i18n/config'
import type {getTranslations} from '../../i18n/index'
import {isSectionEnabled} from '../../config/languageSections.ts'

type SearchLabels = ReturnType<typeof getTranslations>['search']
type IndexLoader = (language: SupportedLanguage) => Promise<SearchIndex>
const requests = new Map<SupportedLanguage, Promise<SearchIndex>>()

const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const strings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')
const availableType = (type: SearchDocument['type'], language: SupportedLanguage): boolean =>
  isSectionEnabled(language, type === 'guidance' ? 'information' : type)

export const parseSearchIndex = (value: unknown, language: SupportedLanguage): SearchIndex => {
  if (!object(value) || value.version !== 1 || value.language !== language || !Array.isArray(value.documents) ||
    !strings(value.vocabulary)) {
    throw new Error('Invalid search index')
  }
  const vocabulary = value.vocabulary
  const decode = (encoded: unknown): string[] => {
    if (!Array.isArray(encoded)) throw new Error('Invalid search vocabulary')
    let id = 0
    return encoded.map((delta: unknown) => {
      if (typeof delta !== 'number' || !Number.isSafeInteger(delta) || delta < 0) {
        throw new Error('Invalid search vocabulary ID')
      }
      id += delta
      const word = vocabulary[id]
      if (word === undefined) throw new Error('Missing search vocabulary word')
      return word
    })
  }
  const documents: SearchDocument[] = value.documents.map((entry: unknown) => {
    if (!object(entry) || !['guidance', 'news', 'directory'].includes(String(entry.type)) ||
      entry.language !== language || typeof entry.id !== 'string' ||
      /^(drafts|versions)\./.test(entry.id) ||
      !['title', 'url', 'summary', 'category', 'agency', 'location', 'serviceType'].every((key) =>
        typeof entry[key] === 'string') ||
      !strings(entry.keywords) ||
      (entry.date !== undefined && typeof entry.date !== 'string')) {
      throw new Error('Invalid search document')
    }
    const type = entry.type as SearchDocument['type']
    const route = {guidance: 'info', news: 'news', directory: 'directory'}[type]
    const url = String(entry.url)
    if (!new RegExp(`^/${language}/${route}/[^/?#\\\\]+/$`).test(url) ||
      !availableType(type, language)) throw new Error('Invalid search route')
    return {
      id: entry.id, type, language, title: String(entry.title), url,
      summary: String(entry.summary), category: String(entry.category),
      agency: String(entry.agency), location: String(entry.location), serviceType: String(entry.serviceType),
      keywords: entry.keywords, bodyTerms: decode(entry.bodyTerms), descriptionTerms: decode(entry.descriptionTerms),
      categoryTerms: decode(entry.categoryTerms), locationTerms: decode(entry.locationTerms),
      ...(typeof entry.date === 'string' ? {date: entry.date} : {}),
    }
  })
  return {version: 1, language, documents}
}

export const fetchSearchIndex: IndexLoader = (language) => {
  let request = requests.get(language)
  if (!request) {
    request = (async () => {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8_000)
      try {
        const response = await fetch(`/${language}/search-index.json`, {
          signal: controller.signal,
          credentials: 'omit',
          cache: 'no-cache',
        })
        if (!response.ok) throw new Error('Search unavailable')
        return parseSearchIndex(await response.json(), language)
      } finally {
        clearTimeout(timeout)
      }
    })().catch((error: unknown) => {
      requests.delete(language)
      throw error
    })
    requests.set(language, request)
  }
  return request
}

export const resultContext = (result: SearchDocument, language: SupportedLanguage): string => {
  if (result.type === 'guidance') return result.summary || [result.category, result.agency].filter(Boolean).join(' · ')
  if (result.type === 'directory') return [result.category, result.location].filter(Boolean).join(' · ')
  const date = result.date ? new Date(result.date.length === 10 ? `${result.date}T12:00:00Z` : result.date) : null
  const formatted = date && Number.isFinite(date.getTime()) ?
    date.toLocaleDateString(language === 'ne' ? 'ne-NP' : 'nb-NO', {
      year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Europe/Oslo',
    }) : ''
  return [result.category, formatted].filter(Boolean).join(' · ')
}

export const mountContentSearch = (root: HTMLElement, loadIndex: IndexLoader = fetchSearchIndex): (() => void) => {
  const form = root.querySelector<HTMLFormElement>('form')
  const input = root.querySelector<HTMLInputElement>('input[type="search"]')
  const status = root.querySelector<HTMLElement>('[data-search-status]')
  const panel = root.querySelector<HTMLElement>('[data-search-panel]')
  const list = root.querySelector<HTMLOListElement>('[data-search-list]')
  const clear = root.querySelector<HTMLButtonElement>('[data-search-clear]')
  const retry = root.querySelector<HTMLButtonElement>('[data-search-retry]')
  const more = root.querySelector<HTMLButtonElement>('[data-search-more]')
  const fullLink = root.querySelector<HTMLAnchorElement>('[data-search-full]')
  const filters = root.querySelector<HTMLElement>('[data-search-filters]')
  const browse = root.querySelector<HTMLElement>('[data-search-browse]')
  const language = root.dataset.language
  if (!form || !input || !status || !panel || !list || !clear || !retry || !more || !fullLink ||
    (language !== 'ne' && language !== 'nb') || !root.dataset.labels) {
    throw new Error('Incomplete search interface')
  }
  const labels: SearchLabels = JSON.parse(root.dataset.labels)
  const full = root.dataset.mode === 'full'
  const doc = root.ownerDocument
  const win = doc.defaultView
  if (!win) throw new Error('Search requires a browser window')
  const tagLabels = {guidance: labels.typeGuidance, news: labels.typeNews, directory: labels.typeDirectory}
  let prepared: PreparedDocument[] | undefined
  let filter: SearchFilter = 'all'
  let limit = full ? 20 : 6
  let generation = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  let composing = false

  const resetResults = () => {
    list.replaceChildren()
    retry.hidden = true
    more.hidden = true
    fullLink.hidden = true
    filters && (filters.hidden = true)
    panel.removeAttribute('aria-busy')
  }
  const render = (results: SearchDocument[]) => {
    const fragment = doc.createDocumentFragment()
    for (const result of results.slice(0, limit)) {
      const item = doc.createElement('li')
      const link = doc.createElement('a')
      link.href = result.url
      const tag = doc.createElement('span')
      tag.className = 'content-search__tag'
      tag.textContent = tagLabels[result.type]
      const title = doc.createElement('span')
      title.className = 'content-search__title'
      title.textContent = result.title
      const context = doc.createElement('span')
      context.className = 'content-search__context'
      context.textContent = resultContext(result, language)
      link.append(tag, title, context)
      item.append(link)
      fragment.append(item)
    }
    list.replaceChildren(fragment)
  }
  const update = async () => {
    const current = ++generation
    const query = input.value.trim()
    clear.hidden = !query
    resetResults()
    browse && (browse.hidden = !full || !!query)
    panel.hidden = !full && !query
    if (!query) {
      status.textContent = full ? labels.empty : ''
      return
    }
    if (!isMeaningfulQuery(query)) {
      status.textContent = query.length > MAX_QUERY_LENGTH ?
        labels.tooLong.replace('{max}', String(MAX_QUERY_LENGTH)) : labels.tooShort
      return
    }
    panel.hidden = false
    if (!prepared) {
      panel.setAttribute('aria-busy', 'true')
      status.textContent = labels.loading
      try {
        const index = await loadIndex(language)
        if (current !== generation) return
        prepared = prepareSearch(index.documents)
      } catch {
        if (current !== generation) return
        console.error('[content-search] index unavailable')
        panel.removeAttribute('aria-busy')
        status.textContent = labels.error
        browse && (browse.hidden = false)
        retry.hidden = false
        return
      }
    }
    if (current !== generation) return
    panel.removeAttribute('aria-busy')
    const results = rankSearch(prepared, query, filter)
    render(results)
    status.textContent = results.length ?
      (results.length === 1 ? labels.countOne : labels.countOther).replace('{count}', String(results.length)) :
      labels.noResults
    more.hidden = !full || results.length <= limit
    browse && (browse.hidden = results.length > 0)
    fullLink.hidden = full || results.length === 0
    fullLink.href = `/${language}/search/?q=${encodeURIComponent(query)}`
    if (filters) {
      filters.hidden = false
      filters.querySelectorAll<HTMLButtonElement>('[data-search-filter]').forEach((button) =>
        button.setAttribute('aria-pressed', String(button.dataset.searchFilter === filter)))
    }
  }
  const writeUrl = () => {
    const url = new URL(win.location.href)
    url.search = ''
    if (input.value.trim()) url.searchParams.set('q', input.value.trim())
    if (filter !== 'all') url.searchParams.set('type', filter)
    win.history.pushState(null, '', url)
  }
  const restoreUrl = () => {
    const url = new URL(win.location.href)
    input.value = url.searchParams.get('q') ?? ''
    const type = url.searchParams.get('type')
    filter = isSearchFilter(type) && (type === 'all' || availableType(type, language)) ? type : 'all'
    limit = 20
    void update()
  }
  const controller = new AbortController()
  const events = {signal: controller.signal}
  const schedule = () => {
    ++generation
    clearTimeout(timer)
    if (composing) return
    limit = full ? 20 : 6
    timer = setTimeout(() => void update(), 180)
  }
  input.addEventListener('input', schedule, events)
  input.addEventListener('compositionstart', () => {composing = true; ++generation}, events)
  input.addEventListener('compositionend', () => {composing = false; schedule()}, events)
  form.addEventListener('submit', (event) => {
    if (full) {
      event.preventDefault()
      clearTimeout(timer)
      writeUrl()
      void update()
    }
  }, events)
  root.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || full) return
    event.preventDefault()
    ++generation
    clearTimeout(timer)
    panel.hidden = true
    status.textContent = labels.closed
    if (panel.contains(doc.activeElement)) input.focus()
  }, events)
  clear.addEventListener('click', () => {
    clearTimeout(timer)
    input.value = ''
    filter = 'all'
    full && writeUrl()
    void update()
    input.focus()
  }, events)
  retry.addEventListener('click', () => void update(), events)
  more.addEventListener('click', () => {
    const oldCount = list.children.length
    limit += 20
    void update().then(() => list.children[oldCount]?.querySelector<HTMLAnchorElement>('a')?.focus())
  }, events)
  filters?.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof win.HTMLButtonElement)) return
    const value = target.dataset.searchFilter ?? null
    if (!isSearchFilter(value)) return
    filter = value
    limit = 20
    writeUrl()
    void update()
  }, events)
  if (full) {
    win.addEventListener('popstate', restoreUrl, events)
    restoreUrl()
  } else void update()
  return () => {
    ++generation
    clearTimeout(timer)
    controller.abort()
  }
}
