import type {SupportedLanguage} from '../../i18n/config'

export const SEARCH_TYPES = ['guidance', 'news', 'directory'] as const
export type SearchType = (typeof SEARCH_TYPES)[number]
export type SearchFilter = SearchType | 'all'

export interface SearchDocument {
  id: string
  type: SearchType
  language: SupportedLanguage
  title: string
  url: string
  summary: string
  category: string
  agency: string
  location: string
  keywords: string[]
  serviceType: string
  date?: string
  // Unique normalized words only, never Portable Text or complete article bodies.
  bodyTerms: string[]
  descriptionTerms: string[]
  categoryTerms: string[]
  locationTerms: string[]
}

export interface SearchIndex {
  version: 1
  language: SupportedLanguage
  documents: SearchDocument[]
}

export const TERM_FIELDS = ['bodyTerms', 'descriptionTerms', 'categoryTerms', 'locationTerms'] as const
type TermField = (typeof TERM_FIELDS)[number]
export interface SerializedSearchIndex {
  version: 1
  language: SupportedLanguage
  vocabulary: string[]
  documents: (Omit<SearchDocument, TermField> & Record<TermField, number[]>)[]
}
