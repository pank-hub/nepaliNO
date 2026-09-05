import {sanityClient} from 'sanity:client'
import {
  forumContentLanguages,
  isForumContentLanguage,
  isValidForumContentSlug,
  normalizeForumRelationships,
  type ApprovedForumRelationship,
  type ApprovedForumRelationshipRole,
  type ForumContentLanguage,
  type ForumRelationshipsInput,
} from './normalizeForumRelationships.ts'

export {
  forumContentLanguages,
  type ApprovedForumRelationship,
  type ApprovedForumRelationshipRole,
  type ForumContentLanguage,
}

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

export interface ResolvedContentForumRelationships {
  identity: ForumContentIdentity
  relationships: ApprovedForumRelationship[]
}

export class ForumContentRelationshipUnavailableError extends Error {}

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

export const resolveContentForumRelationships = async (
  identity: ForumContentIdentity,
  options?: ResolveOptions,
): Promise<ResolvedContentForumRelationships> => {
  if (!isForumContentLanguage(identity.language) || !isValidForumContentSlug(identity.slug)) {
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

  const document = await sanityClient.fetch<ForumRelationshipsInput | null>(
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
  const relationships = normalizeForumRelationships(document, companionRole)

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
