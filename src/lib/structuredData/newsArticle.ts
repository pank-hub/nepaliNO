export type AuthorType = 'person' | 'organization'

export interface ResolvedAuthor {
  '@type': 'Person' | 'Organization'
  name: string
}

// Legacy articles saved before authorType existed. This is an exact-match
// mapping for one known value, never a pattern or keyword check.
const LEGACY_ORGANIZATION_AUTHOR = 'nepali.no Editorial'

export function resolveAuthor(
  authorName?: string | null,
  authorType?: AuthorType | null,
): ResolvedAuthor | undefined {
  if (typeof authorName !== 'string' || authorName.trim() === '') return undefined

  if (authorType === 'person') return {'@type': 'Person', name: authorName}
  if (authorType === 'organization') return {'@type': 'Organization', name: authorName}

  return authorName === LEGACY_ORGANIZATION_AUTHOR
    ? {'@type': 'Organization', name: authorName}
    : {'@type': 'Person', name: authorName}
}

export const ORGANIZATION_ID = 'https://nepali.no/#organization'

export interface NewsArticleStructuredDataInput {
  origin: string
  language: 'ne' | 'nb'
  slug: string
  title: string
  summary?: string | null
  publishedAt?: string | null
  authorName?: string | null
  authorType?: AuthorType | null
  imageUrl?: string | null
  articleSection?: string | null
  breadcrumbLabels: {home: string; news: string}
}

const isValidDate = (value?: string | null): value is string =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value))

export function buildNewsArticleStructuredData(input: NewsArticleStructuredDataInput) {
  const base = input.origin.replace(/\/$/, '')
  const homeUrl = `${base}/${input.language}/`
  const newsUrl = `${base}/${input.language}/news/`
  const articleUrl = `${base}/${input.language}/news/${input.slug}/`
  const author = resolveAuthor(input.authorName, input.authorType)

  const newsArticle: Record<string, unknown> = {
    '@type': 'NewsArticle',
    '@id': `${articleUrl}#newsarticle`,
    mainEntityOfPage: {'@type': 'WebPage', '@id': articleUrl},
    url: articleUrl,
    headline: input.title,
    ...(input.summary ? {description: input.summary} : {}),
    ...(isValidDate(input.publishedAt) ? {datePublished: input.publishedAt} : {}),
    ...(input.imageUrl ? {image: input.imageUrl} : {}),
    ...(author ? {author} : {}),
    publisher: {'@id': ORGANIZATION_ID},
    inLanguage: input.language,
    ...(input.articleSection ? {articleSection: input.articleSection} : {}),
    isAccessibleForFree: true,
  }

  const breadcrumbList = {
    '@type': 'BreadcrumbList',
    '@id': `${articleUrl}#breadcrumb`,
    itemListElement: [
      {'@type': 'ListItem', position: 1, name: input.breadcrumbLabels.home, item: homeUrl},
      {'@type': 'ListItem', position: 2, name: input.breadcrumbLabels.news, item: newsUrl},
      {'@type': 'ListItem', position: 3, name: input.title, item: articleUrl},
    ],
  }

  return {'@context': 'https://schema.org', '@graph': [newsArticle, breadcrumbList]}
}
