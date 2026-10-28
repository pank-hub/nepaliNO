export const ARTICLE_SUMMARY_MIN_ITEMS = 2
export const ARTICLE_SUMMARY_MAX_ITEMS = 4

export interface ArticleSummaryInput {
  enabled?: unknown
  items?: unknown
  aiAssisted?: unknown
}

export interface NormalizedArticleSummary {
  /** Always visible. */
  first: string
  /** One to three points revealed by the toggle. */
  more: string[]
  aiAssisted: boolean
}

// Sanity validates on save; this keeps the public page safe if stored data is
// missing, disabled, partially blank or from before a rule changed.
export function normalizeArticleSummary(
  input: ArticleSummaryInput | null | undefined,
): NormalizedArticleSummary | null {
  if (!input || typeof input !== 'object' || input.enabled !== true) return null
  if (!Array.isArray(input.items)) return null

  const seen = new Set<string>()
  const items: string[] = []
  for (const raw of input.items) {
    if (typeof raw !== 'string') continue
    const text = raw.trim()
    if (!text) continue
    const key = text.replace(/\s+/g, ' ').toLocaleLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    items.push(text)
    if (items.length === ARTICLE_SUMMARY_MAX_ITEMS) break
  }

  if (items.length < ARTICLE_SUMMARY_MIN_ITEMS) return null

  return {
    first: items[0],
    more: items.slice(1),
    // Disclose by default; only an explicit false removes the AI note.
    aiAssisted: input.aiAssisted !== false,
  }
}

export function articleSummaryIds(documentId: unknown): {
  heading: string
  region: string
  button: string
} {
  const seed =
    typeof documentId === 'string'
      ? documentId.replace(/^drafts\./, '').replace(/[^A-Za-z0-9_-]/g, '-')
      : ''
  const base = `article-summary${seed ? `-${seed}` : ''}`
  return {heading: `${base}-heading`, region: `${base}-more`, button: `${base}-toggle`}
}
