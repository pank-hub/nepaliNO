import type {SupportedLanguage} from '../i18n/config'
import type {HomeArticle} from '../components/home/types'

export type NewsStory = HomeArticle & {isFeatured?: boolean}
export interface NewsGuide {
  _id: string
  title: string
  slug: string
  language: SupportedLanguage
  responsibleAgency?: string
}

export const publicNewsCategories = [
  'current-affairs', 'immigration-integration', 'education-student-life',
  'work-employment', 'economy-personal-finance', 'consumer-everyday-life',
  'culture-community', 'health-welfare', 'sports', 'technology-digital-life',
] as const
export type NewsCategory = typeof publicNewsCategories[number]
export const categorySectionOrder: readonly NewsCategory[] = [
  'current-affairs', 'immigration-integration', 'work-employment',
  'economy-personal-finance', 'consumer-everyday-life', 'health-welfare',
  'education-student-life', 'technology-digital-life', 'culture-community', 'sports',
]
export const archivePageSize = 12
export const curatedArchiveOffset = 9

export function parseNewsCategory(value: string | null): NewsCategory | null {
  return publicNewsCategories.find((category) => category === value) ?? null
}

export function newsPageUrl(language: SupportedLanguage, page = 1, category: NewsCategory | null = null, archive = false) {
  const path = page === 1 ? `/${language}/news/` : `/${language}/news/page/${page}/`
  return path + (category ? `?category=${category}` : archive && page === 1 ? '?archive=1' : '')
}

export function archiveWindow(page: number, category: NewsCategory | null) {
  const firstSize = category ? archivePageSize : curatedArchiveOffset
  const start = page === 1 ? 0 : firstSize + (page - 2) * archivePageSize
  return {start, end: start + (page === 1 ? firstSize : archivePageSize)}
}

export function archiveTotalPages(count: number, category: NewsCategory | null) {
  return 1 + Math.ceil(Math.max(0, count - (category ? archivePageSize : curatedArchiveOffset)) / archivePageSize)
}

export function paginationRange(current: number, total: number): (number | '…')[] {
  const pages = [...new Set([1, total, ...Array.from({length: 5}, (_, index) => current + index - 2)])]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b)
  return pages.flatMap((page, index) =>
    index > 0 && page - pages[index - 1] > 1 ? ['…', page] : [page])
}

export function composeNewsFrontPage(
  recent: NewsStory[], featured: NewsStory | null, important: NewsStory | null,
  categoryCandidates: Partial<Record<NewsCategory, NewsStory[]>>,
) {
  // Important Now must not consume the lead slot, even if editors select the same story.
  const lead = featured ?? recent[0] ?? null
  const used = new Set([lead?._id, important?._id].filter(Boolean))
  const take = (stories: NewsStory[], count: number) => {
    const result: NewsStory[] = []
    for (const story of stories) {
      if (used.has(story._id)) continue
      used.add(story._id)
      result.push(story)
      if (result.length === count) break
    }
    return result
  }
  const secondary = take(recent, 2)
  const latest = take(recent, 6)
  const sections: {category: NewsCategory; stories: NewsStory[]}[] = []
  for (const category of categorySectionOrder) {
    const candidates = [...new Map((categoryCandidates[category] ?? [])
      .filter((story) => story.category === category && !used.has(story._id))
      .map((story) => [story._id, story])).values()]
    if (candidates.length < 2) continue
    sections.push({category, stories: take(candidates, 5)})
    if (sections.length === 4) break
  }
  return {lead, secondary, latest, sections, important}
}

export function formatNewsDate(date: string | Date, language: SupportedLanguage, includeTime = false) {
  return new Intl.DateTimeFormat(language === 'ne' ? 'ne-NP' : 'nb-NO', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Oslo',
    hour: includeTime ? '2-digit' : undefined,
    minute: includeTime ? '2-digit' : undefined,
  }).format(typeof date === 'string' ? new Date(date) : date)
}
