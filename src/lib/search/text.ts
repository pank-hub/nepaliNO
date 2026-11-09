const INVISIBLE_JOINERS = /[\u200b-\u200d\u2060\ufeff]/g

const unicodeText = (value: string): string =>
  value.normalize('NFC').toLowerCase().replace(INVISIBLE_JOINERS, '')

// Keep the Guidance archive's established accent folding and substring behavior.
export const normalizeGuideSearchText = (value: string): string =>
  unicodeText(value.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    .replace(/[æøå]/g, (letter) => ({æ: 'ae', ø: 'o', å: 'a'})[letter] ?? letter)
    .replace(/\s+/g, ' ')
    .trim()

export const normalizeSearchText = (value: string): string =>
  unicodeText(value.normalize('NFKC'))
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export const searchTerms = (normalized: string): string[] =>
  [...new Set(normalized.split(' ').filter(Boolean))]

export const meaningfulLength = (text: string): number =>
  Array.from(text.matchAll(/[\p{L}\p{N}]/gu)).length

export const MIN_QUERY_LENGTH = 2
export const MAX_QUERY_LENGTH = 160

export const isMeaningfulQuery = (query: string): boolean =>
  query.length <= MAX_QUERY_LENGTH &&
  meaningfulLength(normalizeSearchText(query)) >= MIN_QUERY_LENGTH

export const matchesSearchTerm = (word: string, term: string): boolean =>
  word === term ||
  (word.startsWith(term) &&
    meaningfulLength(term) >= (/\p{Script=Devanagari}/u.test(term) ? 2 : 3))
