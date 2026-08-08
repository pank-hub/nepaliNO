import type {APIRoute} from 'astro'
import {
  DiscourseMetadataConfigurationError,
  DiscourseMetadataRequestError,
  getDiscourseTopicMetadata,
} from '../../../lib/forum/discourseMetadata'
import {
  ForumContentRelationshipUnavailableError,
  resolveContentForumRelationships,
} from '../../../lib/forum/resolveContentForumRelationships'
import {readTranslationSession} from '../../../lib/translationAuth/session'

export const prerender = false

const SYNTHETIC_CONTENT_IDENTITY = {
  contentType: 'newsArticle',
  language: 'nb',
  slug: 'syntetisk-test-forum-integrasjon',
} as const
const EXPECTED_SYNTHETIC_TOPIC_ID = 13

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  })

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
    const resolved = await resolveContentForumRelationships(
      SYNTHETIC_CONTENT_IDENTITY,
      {
        mode: 'syntheticProbe',
        expectedTopicId: EXPECTED_SYNTHETIC_TOPIC_ID,
      },
    )
    const relationship = resolved.relationships[0]

    if (!relationship) {
      throw new ForumContentRelationshipUnavailableError(
        'The synthetic Forum relationship was not resolved.',
      )
    }

    const metadata = await getDiscourseTopicMetadata(relationship.topicId)

    return jsonResponse(200, {
      ok: true,
      code: 'forum_metadata_connected',
      message:
        'The protected Sanity-allowlisted Forum metadata connection is operational.',
      source: resolved.identity,
      relationshipRole: relationship.role,
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

    if (error instanceof ForumContentRelationshipUnavailableError) {
      return jsonResponse(503, {
        ok: false,
        code: 'forum_relationship_unavailable',
        message: 'The approved Sanity Forum relationship could not be verified.',
      })
    }

    return jsonResponse(500, {
      ok: false,
      code: 'forum_metadata_check_failed',
      message: 'The Forum metadata connectivity check failed.',
    })
  }
}

export const ALL: APIRoute = async () =>
  jsonResponse(405, {
    ok: false,
    code: 'method_not_allowed',
    message: 'Method not allowed.',
  })
