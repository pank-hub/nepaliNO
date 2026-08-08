import {sanityClient} from 'sanity:client'

export const forumContentLanguages = ['ne', 'nb'] as const
export type ForumContentLanguage = (typeof forumContentLanguages)[number]

export type ForumContentIdentity =
  | {
      contentType: 'newsArticle'
      language: ForumContentLanguage
      slug: string
    }
  | {
      contentType: 'publicInformationGuide'
      language: ForumContentLanguage
      slug: string
    }

export type ApprovedForumRelationshipRole =
  | 'newsDiscussion'
  | 'guideQuestions'
  | 'related'

export interface ApprovedForumRelationship {
  role: ApprovedForumRelationshipRole
  topicId: number
}

export interface ResolvedContentForumRelationships {
  identity: ForumContentIdentity
  relationships: ApprovedForumRelationship[]
}

export class ForumContentRelationshipUnavailableError extends Error {}

interface SanityForumTopicReference {
  topicId?: unknown
}

interface SanityForumRelationshipsDocument {
  companion?: SanityForumTopicReference | null
  related?: SanityForumTopicReference[] | null
}

interface SyntheticProbeOptions {
  mode: 'syntheticProbe'
  expectedTopicId: number
}

type ResolveOptions = SyntheticProbeOptions | undefined

const NEWS_RELATIONSHIPS_QUERY = `
  *[
    _type == "newsArticle" &&
    slug.current == $slug &&
    language == $language &&
    defined(publishedAt) &&
    publishedAt <= now()
  ][0] {
    "companion": forumDiscussion {
      topicId
    },
    "related": relatedForumTopics[] {
      topicId
    }
  }
`

const GUIDE_RELATIONSHIPS_QUERY = `
  *[
    _type == "publicInformationGuide" &&
    slug.current == $slug &&
    language == $language &&
    status == "active"
  ][0] {
    "companion": forumQuestionsTopic {
      topicId
    },
    "related": relatedForumTopics[] {
      topicId
    }
  }
`

const SYNTHETIC_NEWS_RELATIONSHIPS_QUERY = `
  *[
    _type == "newsArticle" &&
    slug.current == $slug &&
    language == $language &&
    defined(publishedAt) &&
    publishedAt > now()
  ][0] {
    "companion": forumDiscussion {
      topicId
    },
    "related": relatedForumTopics[] {
      topicId
    }
  }
`

const isForumContentLanguage = (
  value: string,
): value is ForumContentLanguage =>
  forumContentLanguages.includes(value as ForumContentLanguage)

const isValidSlug = (value: string) =>
  value.length >= 1 &&
  value.length <= 200 &&
  value === value.trim() &&
  /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/u.test(value)

const readTopicId = (value: unknown) =>
  typeof value === 'number' && Number.isInteger(value) && value > 0
    ? value
    : undefined

const normalizeRelationships = (
  document: SanityForumRelationshipsDocument,
  companionRole: Exclude<ApprovedForumRelationshipRole, 'related'>,
) => {
  const relationships: ApprovedForumRelationship[] = []
  const companionTopicId = readTopicId(document.companion?.topicId)

  if (companionTopicId !== undefined) {
    relationships.push({role: companionRole, topicId: companionTopicId})
  }

  const seenTopicIds = new Set<number>()
  if (companionTopicId !== undefined) seenTopicIds.add(companionTopicId)

  for (const reference of document.related ?? []) {
    const topicId = readTopicId(reference?.topicId)
    if (topicId === undefined || seenTopicIds.has(topicId)) continue

    relationships.push({role: 'related', topicId})
    seenTopicIds.add(topicId)

    if (relationships.filter(({role}) => role === 'related').length === 3) {
      break
    }
  }

  return relationships
}

export const resolveContentForumRelationships = async (
  identity: ForumContentIdentity,
  options?: ResolveOptions,
): Promise<ResolvedContentForumRelationships> => {
  if (!isForumContentLanguage(identity.language) || !isValidSlug(identity.slug)) {
    throw new TypeError('Forum content identity is invalid.')
  }

  if (options?.mode === 'syntheticProbe') {
    if (
      identity.contentType !== 'newsArticle' ||
      identity.language !== 'nb' ||
      identity.slug !== 'syntetisk-test-forum-integrasjon' ||
      !Number.isInteger(options.expectedTopicId) ||
      options.expectedTopicId <= 0
    ) {
      throw new TypeError('Synthetic Forum probe identity is invalid.')
    }
  }

  const query =
    options?.mode === 'syntheticProbe'
      ? SYNTHETIC_NEWS_RELATIONSHIPS_QUERY
      : identity.contentType === 'newsArticle'
        ? NEWS_RELATIONSHIPS_QUERY
        : GUIDE_RELATIONSHIPS_QUERY

  const document = await sanityClient.fetch<SanityForumRelationshipsDocument | null>(
    query,
    {language: identity.language, slug: identity.slug},
  )

  if (!document) {
    throw new ForumContentRelationshipUnavailableError(
      'Eligible Sanity content with Forum relationships was not found.',
    )
  }

  const companionRole =
    identity.contentType === 'newsArticle'
      ? 'newsDiscussion'
      : 'guideQuestions'
  const relationships = normalizeRelationships(document, companionRole)

  if (relationships.length === 0) {
    throw new ForumContentRelationshipUnavailableError(
      'Eligible Sanity content has no valid Forum relationships.',
    )
  }

  if (
    options?.mode === 'syntheticProbe' &&
    (relationships.length !== 1 ||
      relationships[0]?.role !== 'newsDiscussion' ||
      relationships[0]?.topicId !== options.expectedTopicId)
  ) {
    throw new ForumContentRelationshipUnavailableError(
      'The synthetic Forum relationship did not match the expected boundary.',
    )
  }

  return {identity, relationships}
}
