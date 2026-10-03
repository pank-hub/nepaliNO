const COMBINING_LATIN_MARKS = /[\u0300-\u036f]/g
const INVISIBLE_JOINERS = /[\u200b-\u200d\u2060\ufeff]/g

const NORWEGIAN_FOLDING: Record<string, string> = {
  æ: 'ae',
  ø: 'o',
  å: 'a',
}

// Lowercases, removes zero-width joiners (a common source of Nepali spelling
// differences) and folds Latin accents and æ/ø/å. Devanagari marks are kept.
export const normalizeSearchText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(COMBINING_LATIN_MARKS, '')
    .normalize('NFC')
    .toLowerCase()
    .replace(INVISIBLE_JOINERS, '')
    .replace(/[æøå]/g, (character) => NORWEGIAN_FOLDING[character])
    .replace(/\s+/g, ' ')
    .trim()

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
  const terms = normalizeSearchText(query).split(' ').filter(Boolean)
  return terms.length > 0 && terms.every((term) => searchText.includes(term))
}
