import {isSectionEnabled} from '../../config/languageSections.ts'
import {getTranslations} from '../../i18n/index.ts'
import type {SupportedLanguage} from '../../i18n/config.ts'
import {normalizeSearchText, searchTerms} from './text.ts'
import {TERM_FIELDS, type SearchDocument, type SearchIndex, type SearchType, type SerializedSearchIndex} from './types.ts'

export interface SearchSourceDocument {
  _id: string
  _type: string
  language: string
  slug: string
  title: string
  summary?: string
  searchKeywords?: string[] | null
  date?: string
  category?: string
  otherCategory?: string
  listingType?: string
  otherListingType?: string
  topicTitle?: string
  responsibleAgency?: string
  sourceUrl?: string
  city?: string
  municipality?: string
  county?: string
  coverageModes?: string[]
  serviceCounties?: string[]
  serviceMunicipalities?: string[]
  otherCoverage?: string
  bodyText?: string
  supplementaryText?: {title?: string; text?: string}[]
  descriptionText?: string
}

const typeMap: Record<string, SearchType | undefined> = {
  publicInformationGuide: 'guidance', newsArticle: 'news', directoryListing: 'directory',
}
const paths = {guidance: 'info', news: 'news', directory: 'directory'}
const label = (labels: object, key?: string): string =>
  key && Object.hasOwn(labels, key) ? String(Reflect.get(labels, key)) : ''
const parts = (...values: (string | undefined)[]): string =>
  [...new Set(values.filter((value): value is string => !!value?.trim()))].join(' · ')

const sourceAgency = (url?: string): string => {
  if (!url) return ''
  try {
    const source = new URL(url)
    return ['https:', 'http:'].includes(source.protocol) ? source.hostname.replace(/^www\./, '') : ''
  } catch {
    console.warn('[search-index] invalid public source URL')
    return ''
  }
}

export const buildSearchIndex = (
  sources: SearchSourceDocument[],
  language: SupportedLanguage,
): SearchIndex => {
  const labels = getTranslations(language)
  const norwegianLabels = getTranslations('nb')
  const documents: SearchDocument[] = []
  const seen = new Set<string>()
  for (const source of sources) {
    const type = typeMap[source._type]
    if (!type || source.language !== language || /^(drafts|versions)\./.test(source._id) ||
      !source.title?.trim() || !source.slug || seen.has(source._id)) continue
    if (!isSectionEnabled(language, type === 'guidance' ? 'information' : type)) continue
    // Slugs remain a single canonical route segment.
    if (/[/?#\\]/.test(source.slug)) throw new Error('Invalid public search slug')
    const category = type === 'guidance' ? source.topicTitle ?? '' :
      type === 'news' ? label(labels.news.categories, source.category) :
      source.category === 'other' ? source.otherCategory ?? label(labels.directory.categories, 'other') :
      label(labels.directory.categories, source.category)
    const location = type === 'directory' ? parts(
      source.city, source.municipality,
      label(labels.directory.counties, source.county),
      ...(source.coverageModes ?? []).map((mode) => label(labels.directory.coverageModes, mode)),
      ...(source.serviceCounties ?? []).map((county) => label(labels.directory.counties, county)),
      ...(source.serviceMunicipalities ?? []), source.otherCoverage,
    ) : ''
    const serviceType = type === 'directory' ?
      source.listingType === 'other' ? source.otherListingType ?? '' :
      label(labels.directory.listingTypes, source.listingType) : ''
    documents.push({
      id: source._id, type, language, title: source.title.trim(),
      url: `/${language}/${paths[type]}/${encodeURIComponent(source.slug)}/`,
      summary: source.summary ?? '',
      category, agency: parts(source.responsibleAgency, sourceAgency(source.sourceUrl)),
      location, serviceType,
      keywords: [...new Set((source.searchKeywords ?? []).map((keyword) => keyword.trim()).filter(Boolean))],
      ...(source.date ? {date: source.date} : {}),
      bodyTerms: searchTerms(normalizeSearchText(parts(
        source.bodyText,
        ...(source.supplementaryText ?? []).map((block) => parts(block.title, block.text)),
      ))),
      descriptionTerms: searchTerms(normalizeSearchText(source.descriptionText ?? '')),
      categoryTerms: searchTerms(normalizeSearchText(type === 'news' && label(labels.news.categories, source.category) ?
        parts(source.category, label(norwegianLabels.news.categories, source.category)) :
        type === 'directory' && label(labels.directory.categories, source.category) ?
        parts(source.category, label(norwegianLabels.directory.categories, source.category)) : '')),
      locationTerms: type === 'directory' ? searchTerms(normalizeSearchText(parts(
        label(norwegianLabels.directory.counties, source.county),
        ...(source.serviceCounties ?? []).map((county) => label(norwegianLabels.directory.counties, county)),
        ...(source.coverageModes ?? []).map((mode) => label(norwegianLabels.directory.coverageModes, mode)),
      ))) : [],
    })
    seen.add(source._id)
  }
  return {version: 1, language, documents}
}

// Sorted vocabulary IDs are delta-encoded, retaining every word without repeating
// long Devanagari strings across documents. This is a wire format only.
export const serializeSearchIndex = (index: SearchIndex): SerializedSearchIndex => {
  const vocabulary = [...new Set(index.documents.flatMap((document) =>
    TERM_FIELDS.flatMap((field) => document[field])))].sort()
  const ids = new Map(vocabulary.map((word, id) => [word, id]))
  const encode = (words: string[]): number[] => {
    let previous = 0
    return words.map((word) => {
      const id = ids.get(word)
      if (id === undefined) throw new Error('Missing search vocabulary entry')
      return id
    }).sort((a, b) => a - b).map((id) => {
      const delta = id - previous
      previous = id
      return delta
    })
  }
  return {version: 1, language: index.language, vocabulary, documents: index.documents.map((document) => ({
    ...document,
    bodyTerms: encode(document.bodyTerms),
    descriptionTerms: encode(document.descriptionTerms),
    categoryTerms: encode(document.categoryTerms),
    locationTerms: encode(document.locationTerms),
  }))}
}
