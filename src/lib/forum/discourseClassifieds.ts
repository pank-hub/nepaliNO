import {forumPilot} from '../../config/forum.ts'

const REQUEST_TIMEOUT_MS = 5_000
const MAX_TOPICS_PER_CATEGORY = 20

export type ClassifiedsCategoryKey = 'housing' | 'jobs' | 'buy-and-sell'

export interface ClassifiedsCategoryConfig {
  key: ClassifiedsCategoryKey
  categoryId: number
  slug: string
  color: string
  labelNe: string
  labelEn: string
  forumPath: string
}

export const CLASSIFIEDS_CATEGORIES: readonly ClassifiedsCategoryConfig[] = [
  {
    key: 'housing',
    categoryId: 13,
    slug: 'housing',
    color: '#0E76BD',
    labelNe: 'बसोबास / कोठा',
    labelEn: 'Housing / Bolig',
    forumPath: '/c/housing/13',
  },
  {
    key: 'jobs',
    categoryId: 14,
    slug: 'jobs',
    color: '#1B7F5C',
    labelNe: 'रोजगारी / काम',
    labelEn: 'Jobs / Jobb',
    forumPath: '/c/jobs/14',
  },
  {
    key: 'buy-and-sell',
    categoryId: 15,
    slug: 'buy-and-sell',
    color: '#D96B27',
    labelNe: 'किनबेच / निःशुल्क',
    labelEn: 'Buy & Sell / Kjøp og salg',
    forumPath: '/c/buy-and-sell/15',
  },
] as const

export const CLASSIFIEDS_CATEGORY_MAP: Record<
  ClassifiedsCategoryKey,
  ClassifiedsCategoryConfig
> = {
  housing: CLASSIFIEDS_CATEGORIES[0],
  jobs: CLASSIFIEDS_CATEGORIES[1],
  'buy-and-sell': CLASSIFIEDS_CATEGORIES[2],
}

export interface NorwayFylke {
  tag: string
  name: string
}

export const NORWAY_FYLKER: readonly NorwayFylke[] = [
  {tag: 'agder', name: 'Agder'},
  {tag: 'akershus', name: 'Akershus'},
  {tag: 'buskerud', name: 'Buskerud'},
  {tag: 'finnmark', name: 'Finnmark'},
  {tag: 'innlandet', name: 'Innlandet'},
  {tag: 'more-og-romsdal', name: 'Møre og Romsdal'},
  {tag: 'nordland', name: 'Nordland'},
  {tag: 'oslo', name: 'Oslo'},
  {tag: 'rogaland', name: 'Rogaland'},
  {tag: 'telemark', name: 'Telemark'},
  {tag: 'troms', name: 'Troms'},
  {tag: 'trondelag', name: 'Trøndelag'},
  {tag: 'vestfold', name: 'Vestfold'},
  {tag: 'vestland', name: 'Vestland'},
  {tag: 'ostfold', name: 'Østfold'},
] as const

const FYLKE_TAG_SET = new Set<string>(NORWAY_FYLKER.map((f) => f.tag))

export interface ClassifiedsTopicItem {
  topicId: number
  title: string
  categoryKey: ClassifiedsCategoryKey
  categoryId: number
  tags: string[]
  fylkeTags: string[]
  createdAt?: string
  lastPostedAt?: string
  replyCount: number
  closed: boolean
  url: string
}

export type ClassifiedsFeedStatus = 'live' | 'private_pilot' | 'unavailable'

export interface ClassifiedsFeedResult {
  status: ClassifiedsFeedStatus
  items: ClassifiedsTopicItem[]
  counts: Record<ClassifiedsCategoryKey, number>
}

export const isValidClassifiedsCategory = (
  value: string,
): value is ClassifiedsCategoryKey =>
  value === 'housing' || value === 'jobs' || value === 'buy-and-sell'

export const isValidFylkeTag = (value: string): boolean =>
  FYLKE_TAG_SET.has(value)

const readPositiveInt = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isInteger(value) && value > 0
    ? value
    : undefined

const readString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined

const readTags = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  const result: string[] = []
  for (const item of value) {
    if (typeof item === 'string' && item.trim()) {
      result.push(item.trim().toLowerCase())
    } else if (
      item &&
      typeof item === 'object' &&
      'name' in item &&
      typeof (item as {name: unknown}).name === 'string' &&
      (item as {name: string}).name.trim()
    ) {
      result.push((item as {name: string}).name.trim().toLowerCase())
    }
  }
  return result
}

const buildCategoryEndpoint = (
  config: ClassifiedsCategoryConfig,
  baseUrl: string,
) => new URL(`${config.forumPath}.json`, baseUrl)

const buildTopicUrl = (topicId: number, baseUrl: string) =>
  new URL(`/t/${topicId}`, baseUrl).toString()

export const sanitizeCategoryTopics = (
  payload: unknown,
  config: ClassifiedsCategoryConfig,
  baseUrl: string = forumPilot.url,
): ClassifiedsTopicItem[] => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return []
  }

  const topicList = (payload as Record<string, unknown>).topic_list
  if (!topicList || typeof topicList !== 'object' || Array.isArray(topicList)) {
    return []
  }

  const rawTopics = (topicList as Record<string, unknown>).topics
  if (!Array.isArray(rawTopics)) {
    return []
  }

  const items: ClassifiedsTopicItem[] = []

  for (const entry of rawTopics) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue
    const topic = entry as Record<string, unknown>

    // Exclude pinned "About the ... category" posts, archived, and unlisted topics.
    if (topic.pinned === true || topic.pinned_globally === true) continue
    if (topic.archived === true) continue
    if (topic.visible === false) continue

    const topicId = readPositiveInt(topic.id)
    const title = readString(topic.title)
    const postsCount = readPositiveInt(topic.posts_count)
    const categoryId = readPositiveInt(topic.category_id)

    if (!topicId || !title || !postsCount) continue
    if (categoryId !== undefined && categoryId !== config.categoryId) continue
    if (title.toLowerCase().startsWith('about the ')) continue

    const tags = readTags(topic.tags)
    const fylkeTags = tags.filter((tag) => FYLKE_TAG_SET.has(tag))

    items.push({
      topicId,
      title,
      categoryKey: config.key,
      categoryId: config.categoryId,
      tags,
      fylkeTags,
      createdAt: readString(topic.created_at),
      lastPostedAt: readString(topic.last_posted_at),
      replyCount: Math.max(0, postsCount - 1),
      closed: topic.closed === true,
      url: buildTopicUrl(topicId, baseUrl),
    })

    if (items.length >= MAX_TOPICS_PER_CATEGORY) break
  }

  return items
}

interface LoadOptions {
  categories?: readonly ClassifiedsCategoryKey[]
  fylke?: string
  fetchImpl?: typeof fetch
  baseUrl?: string
}

export const loadDiscourseClassifieds = async (
  options: LoadOptions = {},
): Promise<ClassifiedsFeedResult> => {
  const baseUrl = options.baseUrl ?? forumPilot.url
  const fetchFn = options.fetchImpl ?? fetch
  const selectedKeys =
    options.categories && options.categories.length > 0
      ? options.categories
      : (['housing', 'jobs', 'buy-and-sell'] as const)

  const counts: Record<ClassifiedsCategoryKey, number> = {
    housing: 0,
    jobs: 0,
    'buy-and-sell': 0,
  }

  const configs = selectedKeys.map((key) => CLASSIFIEDS_CATEGORY_MAP[key])

  const results = await Promise.all(
    configs.map(async (config) => {
      try {
        const endpoint = buildCategoryEndpoint(config, baseUrl)
        const response = await fetchFn(endpoint, {
          method: 'GET',
          headers: {accept: 'application/json'},
          redirect: 'error',
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        })

        if (response.status === 401 || response.status === 403) {
          return {state: 'private_pilot' as const, items: [] as ClassifiedsTopicItem[]}
        }

        if (!response.ok) {
          return {state: 'unavailable' as const, items: [] as ClassifiedsTopicItem[]}
        }

        const payload = await response.json()
        const items = sanitizeCategoryTopics(payload, config, baseUrl)
        return {state: 'live' as const, items}
      } catch {
        return {state: 'unavailable' as const, items: [] as ClassifiedsTopicItem[]}
      }
    }),
  )

  const allItems: ClassifiedsTopicItem[] = []
  let sawLive = false
  let sawPrivatePilot = false

  for (const res of results) {
    if (res.state === 'live') {
      sawLive = true
      for (const item of res.items) {
        counts[item.categoryKey] += 1
        allItems.push(item)
      }
    } else if (res.state === 'private_pilot') {
      sawPrivatePilot = true
    }
  }

  const fylkeFilter = options.fylke?.trim().toLowerCase()
  const filteredItems =
    fylkeFilter && isValidFylkeTag(fylkeFilter)
      ? allItems.filter((item) => item.fylkeTags.includes(fylkeFilter))
      : allItems

  filteredItems.sort((a, b) => {
    const timeA = Date.parse(a.createdAt ?? a.lastPostedAt ?? '') || 0
    const timeB = Date.parse(b.createdAt ?? b.lastPostedAt ?? '') || 0
    return timeB - timeA
  })

  const status: ClassifiedsFeedStatus = sawLive
    ? 'live'
    : sawPrivatePilot
      ? 'private_pilot'
      : 'unavailable'

  return {
    status,
    items: filteredItems,
    counts,
  }
}
