import {
  isMeaningfulQuery,
  matchesSearchTerm,
  normalizeSearchText,
  searchTerms,
} from './text.ts'
import type {SearchDocument, SearchFilter, SearchType} from './types.ts'

export const SEARCH_WEIGHTS = {
  guidance: {title: 100, keywords: 70, summary: 40, category: 25, agency: 20, bodyTerms: 5},
  news: {title: 100, keywords: 70, summary: 40, category: 25, categoryTerms: 25, agency: 20, bodyTerms: 5},
  directory: {title: 100, keywords: 70, category: 50, categoryTerms: 50, serviceType: 50, summary: 35, descriptionTerms: 35, location: 25, locationTerms: 25},
} as const

type WeightedField = keyof typeof SEARCH_WEIGHTS.guidance | 'serviceType' | 'location' |
  'categoryTerms' | 'descriptionTerms' | 'locationTerms'
interface PreparedField {text: string; words: string[]; weight: number}
export interface PreparedDocument {document: SearchDocument; fields: PreparedField[]}

export const prepareSearch = (documents: SearchDocument[]): PreparedDocument[] =>
  documents.map((document) => ({
    document,
    fields: Object.entries(SEARCH_WEIGHTS[document.type]).map(([name, weight]) => {
      const value = document[name as WeightedField]
      if (Array.isArray(value) && name.endsWith('Terms')) {
        return {text: '', words: value, weight}
      }
      const text = normalizeSearchText(Array.isArray(value) ? value.join(' ') : value)
      return {text, words: searchTerms(text), weight}
    }),
  }))

export const rankSearch = (
  documents: PreparedDocument[],
  query: string,
  filter: SearchFilter = 'all',
): SearchDocument[] => {
  if (!isMeaningfulQuery(query)) return []
  const normalized = normalizeSearchText(query)
  const terms = searchTerms(normalized)
  const scored: {document: SearchDocument; score: number}[] = []
  for (const {document, fields} of documents) {
    if (filter !== 'all' && document.type !== filter) continue
    let score = 0
    for (const term of terms) {
      const matching = fields.filter((field) => field.words.some((word) => matchesSearchTerm(word, term)))
      if (!matching.length) {
        score = 0
        break
      }
      score += Math.max(...matching.map((field) => field.weight))
    }
    if (!score) continue
    // Boost an intact multiword phrase, but never infer phrases from a body vocabulary.
    const phrases = fields.filter((field) =>
      (` ${field.text} `).includes(` ${normalized} `))
    score += Math.max(0, ...phrases.map((field) => field.weight))
    scored.push({document, score})
  }
  return scored.sort((a, b) =>
    b.score - a.score ||
    (b.document.date ?? '').localeCompare(a.document.date ?? '') ||
    a.document.id.localeCompare(b.document.id),
  ).map(({document}) => document)
}

export const isSearchFilter = (value: string | null): value is SearchType | 'all' =>
  value === 'all' || value === 'guidance' || value === 'news' || value === 'directory'
