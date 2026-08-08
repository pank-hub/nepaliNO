import {
  isForumContentLanguage,
  isValidForumContentSlug,
  type ForumContentLanguage,
} from './normalizeForumRelationships.ts'

export const forumContentTypes = [
  'newsArticle',
  'publicInformationGuide',
] as const
export type ForumContentType = (typeof forumContentTypes)[number]

export interface ParsedForumContentRequest {
  contentType: ForumContentType
  language: ForumContentLanguage
  slug: string
}

export class InvalidForumContentRequestError extends Error {}

const expectedParameterNames = ['contentType', 'language', 'slug'] as const
const expectedParameterNameSet = new Set<string>(expectedParameterNames)

const isForumContentType = (value: string): value is ForumContentType =>
  forumContentTypes.includes(value as ForumContentType)

const readSingleParameter = (searchParams: URLSearchParams, name: string) => {
  const values = searchParams.getAll(name)

  if (values.length !== 1 || !values[0]) {
    throw new InvalidForumContentRequestError(
      'Forum content request parameters are invalid.',
    )
  }

  return values[0]
}

export const parseForumContentRequest = (
  searchParams: URLSearchParams,
): ParsedForumContentRequest => {
  for (const name of searchParams.keys()) {
    if (!expectedParameterNameSet.has(name)) {
      throw new InvalidForumContentRequestError(
        'Forum content request parameters are invalid.',
      )
    }
  }

  const contentType = readSingleParameter(searchParams, 'contentType')
  const language = readSingleParameter(searchParams, 'language')
  const slug = readSingleParameter(searchParams, 'slug')

  if (
    !isForumContentType(contentType) ||
    !isForumContentLanguage(language) ||
    !isValidForumContentSlug(slug)
  ) {
    throw new InvalidForumContentRequestError(
      'Forum content request identity is invalid.',
    )
  }

  return {contentType, language, slug}
}
