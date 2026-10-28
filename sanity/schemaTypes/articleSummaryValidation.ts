export const ARTICLE_SUMMARY_MIN_ITEMS = 2
export const ARTICLE_SUMMARY_MAX_ITEMS = 4
// Generous enough for Nepali, where one sentence is often longer in characters.
export const ARTICLE_SUMMARY_MAX_ITEM_LENGTH = 240

export const validateArticleSummaryItem = (value: unknown): true | string => {
  if (value === undefined || value === null) return 'Write the summary point or remove it.'
  if (typeof value !== 'string' || value.trim().length === 0) {
    return 'A summary point cannot be empty.'
  }
  if (value !== value.trim()) return 'Remove spaces at the start or end of this point.'
  if (value.length > ARTICLE_SUMMARY_MAX_ITEM_LENGTH) {
    return `Keep each point to ${ARTICLE_SUMMARY_MAX_ITEM_LENGTH} characters or fewer.`
  }
  return true
}

// Only enforced when the editor has switched the summary on, so a half-written
// summary that is still disabled never blocks publishing.
export const validateArticleSummaryItems = (
  items: unknown,
  enabled: unknown,
): true | string => {
  if (enabled !== true) return true

  const list = Array.isArray(items) ? items : []
  if (list.length < ARTICLE_SUMMARY_MIN_ITEMS || list.length > ARTICLE_SUMMARY_MAX_ITEMS) {
    return `Add ${ARTICLE_SUMMARY_MIN_ITEMS} to ${ARTICLE_SUMMARY_MAX_ITEMS} summary points.`
  }

  const seen = new Set<string>()
  for (const item of list) {
    if (typeof item !== 'string' || item.trim().length === 0) {
      return 'Every summary point must contain text.'
    }
    const key = item.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
    if (seen.has(key)) return 'Summary points must not repeat each other.'
    seen.add(key)
  }

  return true
}
