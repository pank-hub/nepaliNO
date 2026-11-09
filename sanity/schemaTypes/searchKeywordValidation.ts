export const trimSearchKeyword = (value: string): string => value.trim()

export const validateSearchKeyword = (value: unknown): true | string => {
  if (typeof value !== 'string' || value.trim().length < 2 || value.trim().length > 100) {
    return 'Enter a keyword or meaningful phrase of 2 to 100 characters.'
  }
  return value === value.trim() ? true : 'Remove leading and trailing whitespace.'
}

export const validateSearchKeywords = (value: unknown): true | string => {
  if (value === undefined || value === null) return true
  if (!Array.isArray(value) || value.length > 30) return 'Use no more than 30 search terms.'
  for (const item of value) {
    const valid = validateSearchKeyword(item)
    if (valid !== true) return valid
  }
  return new Set(value).size === value.length ? true : 'Each search term must be unique.'
}
