import {normalizeGuideSearchText as normalizeSearchText, searchTerms} from './search/text.ts'

export {normalizeSearchText}

export interface SearchableGuide {
  title: string
  summary?: string
  responsibleAgency?: string
  searchKeywords?: string[] | null
}

export const buildGuideSearchText = (guide: SearchableGuide): string =>
  normalizeSearchText(
    [
      guide.title,
      guide.summary,
      guide.responsibleAgency,
      ...(guide.searchKeywords ?? []),
    ]
      .filter((part): part is string => typeof part === 'string')
      .join(' \n '),
  )

// Every whitespace-separated term in the query must appear in the search text.
export const matchesGuideSearch = (searchText: string, query: string): boolean => {
  const terms = searchTerms(normalizeSearchText(query))
  return terms.length > 0 && terms.every((term) => searchText.includes(term))
}
