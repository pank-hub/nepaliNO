import {sanityClient} from 'sanity:client'
import {isSectionEnabled} from '../../config/languageSections'
import type {SupportedLanguage} from '../../i18n/config'
import {
  archiveTotalPages, archiveWindow, composeNewsFrontPage, parseNewsCategory,
  type NewsCategory, type NewsGuide, type NewsStory,
} from '../newsHub'
import {IMPORTANT_NOW_NEWS_BY_LANGUAGE_QUERY} from './queries'
import {
  NEWS_HUB_ARCHIVE_QUERY, NEWS_HUB_CATEGORIES_QUERY, NEWS_HUB_COUNT_QUERY,
  NEWS_HUB_FEATURED_QUERY, NEWS_HUB_GUIDES_QUERY, NEWS_HUB_RECENT_QUERY,
} from './newsHubQueries'

// Public perspective also protects dereferenced assets and future query additions.
const published = {perspective: 'published' as const}
export async function loadNewsHub(language: SupportedLanguage, page: number, url: URL) {
  const category = parseNewsCategory(url.searchParams.get('category'))
  const archive = page > 1 || category !== null || url.searchParams.get('archive') === '1'
  const params = {language, category}
  const count = await sanityClient.fetch<number>(NEWS_HUB_COUNT_QUERY, params, published)
  const total = archiveTotalPages(count, category)
  const emptyFront = composeNewsFrontPage([], null, null, {})
  if (archive) {
    const stories = page > total ? [] : await sanityClient.fetch<NewsStory[]>(
      NEWS_HUB_ARCHIVE_QUERY, {...params, ...archiveWindow(page, category)}, published,
    )
    return {category, archive, count, total, stories, front: emptyFront, guides: [] as NewsGuide[]}
  }
  const [recent, featured, important, candidates, guides] = await Promise.all([
    sanityClient.fetch<NewsStory[]>(NEWS_HUB_RECENT_QUERY, {language}, published),
    sanityClient.fetch<NewsStory | null>(NEWS_HUB_FEATURED_QUERY, {language}, published),
    sanityClient.fetch<NewsStory | null>(IMPORTANT_NOW_NEWS_BY_LANGUAGE_QUERY, {language}, published),
    sanityClient.fetch<Record<NewsCategory, NewsStory[]>>(NEWS_HUB_CATEGORIES_QUERY, {language}, published),
    isSectionEnabled(language, 'information')
      ? sanityClient.fetch<NewsGuide[]>(NEWS_HUB_GUIDES_QUERY, {language}, published)
      : Promise.resolve([] as NewsGuide[]),
  ])
  return {category, archive, count, total, stories: [] as NewsStory[], front: composeNewsFrontPage(recent, featured, important, candidates), guides}
}
export type NewsHubData = Awaited<ReturnType<typeof loadNewsHub>>
