import {orderGuidanceHubTopics} from '../config/guidanceHub'
import type {SupportedLanguage} from '../i18n/config'

export interface GuidanceTopicItem {
  _id: string
  title: string
  slug: string
  language: string
  topicKey: string
  summary?: string
  displayOrder?: number
  iconKey?: string
  seoDescription?: string
  guideCount: number
}

export interface GuidanceGuideItem {
  _id: string
  title: string
  slug: string
  language: string
  translation?: {
    slug?: string
    title?: string
    language?: string
  } | null
  summary: string
  searchKeywords?: string[]
  topic?: string
  intendedAudience?: string[]
  responsibleAgency?: string
  officialSourceUrl?: string
  publishedAt?: string
  lastReviewedAt?: string
  nextReviewAt?: string
  isFeatured?: boolean
  isUrgent?: boolean
}

export interface GuidanceTopicShowcaseItem<T extends GuidanceTopicItem = GuidanceTopicItem> {
  topic: T
  previewGuides: GuidanceGuideItem[]
}

export interface GuidanceHubComposition<T extends GuidanceTopicItem = GuidanceTopicItem> {
  orderedTopics: T[]
  urgentGuide: GuidanceGuideItem | null
  leadGuide: GuidanceGuideItem | null
  recentGuides: GuidanceGuideItem[]
  coreTopics: GuidanceTopicShowcaseItem<T>[]
  directoryTopics: T[]
  fallbackGuides: GuidanceGuideItem[]
  topicTitles: Record<string, string>
}

export interface TopicGuidesComposition {
  urgentGuides: GuidanceGuideItem[]
  featuredGuides: GuidanceGuideItem[]
  directoryGuides: GuidanceGuideItem[]
}

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const CORE_SHOWCASE_LIMIT = 6
const CORE_PREVIEW_GUIDES_LIMIT = 3
const RECENT_GUIDES_LIMIT = 5
const TOPIC_FEATURED_LIMIT = 3

function parseGuideDate(value?: string): Date | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const dateOnly = DATE_ONLY_PATTERN.exec(trimmed)
  if (dateOnly) {
    const [, year, month, day] = dateOnly
    const utcDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12, 0, 0))
    return Number.isNaN(utcDate.getTime()) ? null : utcDate
  }
  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function guideSortTimestamp(guide: Pick<GuidanceGuideItem, 'publishedAt' | 'lastReviewedAt'>): number {
  const date = parseGuideDate(guide.publishedAt) ?? parseGuideDate(guide.lastReviewedAt)
  return date ? date.getTime() : 0
}

export function formatGuideDate(value: string | undefined, language: SupportedLanguage): string {
  const date = parseGuideDate(value)
  if (!date) return ''
  return new Intl.DateTimeFormat(language === 'nb' ? 'nb-NO' : 'ne-NP', {
    dateStyle: 'medium',
    timeZone: 'Europe/Oslo',
  }).format(date)
}

export function topicHref(language: SupportedLanguage, slug: string): string {
  return `/${language}/info/topic/${slug}/`
}

export function guideHref(language: SupportedLanguage, slug: string): string {
  return `/${language}/info/${slug}/`
}

export function sortGuidesByRecency<T extends GuidanceGuideItem>(guides: readonly T[]): T[] {
  return [...guides].sort((a, b) => guideSortTimestamp(b) - guideSortTimestamp(a))
}

export function composeGuidanceHub<T extends GuidanceTopicItem>(
  topics: readonly T[],
  guides: readonly GuidanceGuideItem[],
): GuidanceHubComposition<T> {
  const orderedTopics = orderGuidanceHubTopics(topics)
  const topicTitles = Object.fromEntries(orderedTopics.map((topic) => [topic.topicKey, topic.title]))
  const activeTopicKeys = new Set(orderedTopics.map((topic) => topic.topicKey))
  const sortedByRecency = sortGuidesByRecency(guides)

  const urgentGuide = sortedByRecency.find((guide) => Boolean(guide.isUrgent)) ?? null
  const leadGuide =
    sortedByRecency.find((guide) => Boolean(guide.isFeatured) && guide._id !== urgentGuide?._id) ??
    sortedByRecency.find((guide) => guide._id !== urgentGuide?._id) ??
    urgentGuide

  const recentGuides = sortedByRecency
    .filter((guide) => guide._id !== leadGuide?._id)
    .slice(0, RECENT_GUIDES_LIMIT)

  const guidesByTopic = new Map<string, GuidanceGuideItem[]>()
  for (const guide of sortedByRecency) {
    if (!guide.topic) continue
    const list = guidesByTopic.get(guide.topic) ?? []
    list.push(guide)
    guidesByTopic.set(guide.topic, list)
  }

  const coreTopics: GuidanceTopicShowcaseItem<T>[] = []
  for (const topic of orderedTopics) {
    if (topic.topicKey === 'other') continue
    if (coreTopics.length >= CORE_SHOWCASE_LIMIT) break
    const topicGuides = guidesByTopic.get(topic.topicKey) ?? []
    if (topicGuides.length === 0) continue
    coreTopics.push({
      topic,
      previewGuides: topicGuides.slice(0, CORE_PREVIEW_GUIDES_LIMIT),
    })
  }

  const coreKeys = new Set(coreTopics.map((item) => item.topic.topicKey))
  const directoryTopics = orderedTopics.filter((topic) => !coreKeys.has(topic.topicKey))
  const fallbackGuides = sortedByRecency.filter(
    (guide) => !guide.topic || !activeTopicKeys.has(guide.topic),
  )

  return {
    orderedTopics,
    urgentGuide,
    leadGuide,
    recentGuides,
    coreTopics,
    directoryTopics,
    fallbackGuides,
    topicTitles,
  }
}

export function composeTopicGuides(guides: readonly GuidanceGuideItem[]): TopicGuidesComposition {
  const sorted = sortGuidesByRecency(guides)
  const urgentGuides = sorted.filter((guide) => Boolean(guide.isUrgent))
  const featuredGuides = sorted.filter((guide) => Boolean(guide.isFeatured)).slice(0, TOPIC_FEATURED_LIMIT)
  const featuredIds = new Set(featuredGuides.map((guide) => guide._id))
  const directoryGuides = sorted.filter((guide) => !featuredIds.has(guide._id))

  return {
    urgentGuides,
    featuredGuides,
    directoryGuides,
  }
}
