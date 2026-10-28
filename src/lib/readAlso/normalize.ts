export const READ_ALSO_TARGET_TYPES = ['newsArticle', 'publicInformationGuide'] as const

export type ReadAlsoTargetType = (typeof READ_ALSO_TARGET_TYPES)[number]

export interface ReadAlsoInput {
  _type?: unknown
  _key?: unknown
  documentId?: unknown
  target?: unknown
}

export interface ReadAlsoImageSource {
  asset: unknown
  hotspot?: unknown
  crop?: unknown
}

export interface NormalizedReadAlso {
  targetType: ReadAlsoTargetType
  title: string
  href: string
  // News only; Guides never carry a display image.
  image?: ReadAlsoImageSource
}

export interface NormalizeReadAlsoOptions {
  language: string
  now?: Date
}

type Block = Record<string, unknown>

const isRecord = (value: unknown): value is Block => typeof value === 'object' && value !== null

const text = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined

// Existing slugs may contain uppercase letters, so this is deliberately looser than the Studio rule.
const SAFE_URL_SEGMENT = /^[A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)*$/

const publishedIdOf = (value: unknown): string | undefined => text(value)?.replace(/^drafts\./, '')

export const readAlsoPath = (
  targetType: ReadAlsoTargetType,
  language: string,
  slug: string,
): string => `/${language}/${targetType === 'newsArticle' ? 'news' : 'info'}/${slug}/`

// Returns undefined (render nothing) unless every check passes.
export const normalizeReadAlso = (
  input: unknown,
  {language, now = new Date()}: NormalizeReadAlsoOptions,
): NormalizedReadAlso | undefined => {
  if (!isRecord(input)) return undefined
  const target = input.target
  if (!isRecord(target)) return undefined

  const targetType = READ_ALSO_TARGET_TYPES.find((type) => type === target._type)
  if (!targetType) return undefined

  const targetId = publishedIdOf(target._id)
  if (!targetId) return undefined
  if (targetId === publishedIdOf(input.documentId)) return undefined

  if (target.language !== language) return undefined

  const title = text(target.title)
  if (!title) return undefined

  const slug = text(target.slug)
  if (!slug || !SAFE_URL_SEGMENT.test(slug)) return undefined

  const href = readAlsoPath(targetType, language, slug)

  if (targetType === 'publicInformationGuide') {
    return target.status === 'active' ? {targetType, title, href} : undefined
  }

  const publishedAt = typeof target.publishedAt === 'string' ? Date.parse(target.publishedAt) : NaN
  if (Number.isNaN(publishedAt) || publishedAt > now.getTime()) return undefined

  const featuredImage = isRecord(target.featuredImage) ? target.featuredImage : undefined
  const image = featuredImage?.asset
    ? {asset: featuredImage.asset, hotspot: featuredImage.hotspot, crop: featuredImage.crop}
    : undefined

  return {targetType, title, href, image}
}
