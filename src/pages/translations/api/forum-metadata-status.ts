import type {APIRoute} from 'astro'
import {sanityClient} from 'sanity:client'
import {
  DiscourseMetadataConfigurationError,
  DiscourseMetadataRequestError,
  getDiscourseTopicMetadata,
} from '../../../lib/forum/discourseMetadata'
import {readTranslationSession} from '../../../lib/translationAuth/session'

export const prerender = false

const SYNTHETIC_NEWS_SLUG = 'syntetisk-test-forum-integrasjon'
const SYNTHETIC_NEWS_LANGUAGE = 'nb'
const EXPECTED_SYNTHETIC_TOPIC_ID = 13

interface SyntheticNewsForumRelationship {
  documentId: string
  publishedAt: string
  topicId: number
}

const SYNTHETIC_NEWS_FORUM_RELATIONSHIP_QUERY = `
  *[
    _type == "newsArticle" &&
    slug.current == $slug &&
    language == $language &&
    defined(publishedAt) &&
    publishedAt > now()
  ][0] {
    "documentId": _id,
    publishedAt,
    "topicId": forumDiscussion.topicId
  }
`

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  })

const readAllowlistedRelationship = async () => {
  const relationship =
    await sanityClient.fetch<SyntheticNewsForumRelationship | null>(
      SYNTHETIC_NEWS_FORUM_RELATIONSHIP_QUERY,
      {
        slug: SYNTHETIC_NEWS_SLUG,
        language: SYNTHETIC_NEWS_LANGUAGE,
      },
    )

  if (
    !relationship ||
    !relationship.documentId ||
    !relationship.publishedAt ||
    !Number.isInteger(relationship.topicId) ||
    relationship.topicId !== EXPECTED_SYNTHETIC_TOPIC_ID
  ) {
    throw new Error('Synthetic Sanity Forum relationship is unavailable.')
  }

  return relationship
}

export const GET: APIRoute = async ({cookies}) => {
  const session = await readTranslationSession(cookies)

  if (!session) {
    return jsonResponse(401, {
      ok: false,
      code: 'authentication_required',
      message: 'Sign in before checking Forum metadata connectivity.',
    })
  }

  try {
    const relationship = await readAllowlistedRelationship()
    const metadata = await getDiscourseTopicMetadata(relationship.topicId)

    return jsonResponse(200, {
      ok: true,
      code: 'forum_metadata_connected',
      message:
        'The protected Sanity-allowlisted Forum metadata connection is operational.',
      source: {
        contentType: 'newsArticle',
        language: SYNTHETIC_NEWS_LANGUAGE,
        slug: SYNTHETIC_NEWS_SLUG,
      },
      metadata,
    })
  } catch (error) {
    console.error('Protected Forum metadata connectivity check failed', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
      topicId: EXPECTED_SYNTHETIC_TOPIC_ID,
    })

    if (error instanceof DiscourseMetadataConfigurationError) {
      return jsonResponse(503, {
        ok: false,
        code: 'forum_metadata_not_configured',
        message: 'Forum metadata connectivity is not configured.',
      })
    }

    if (error instanceof DiscourseMetadataRequestError) {
      return jsonResponse(503, {
        ok: false,
        code: 'forum_metadata_unavailable',
        message: 'Forum metadata could not be retrieved.',
      })
    }

    return jsonResponse(503, {
      ok: false,
      code: 'forum_relationship_unavailable',
      message: 'The approved Sanity Forum relationship could not be verified.',
    })
  }
}

export const ALL: APIRoute = async () =>
  jsonResponse(405, {
    ok: false,
    code: 'method_not_allowed',
    message: 'Method not allowed.',
  })
