import type {APIRoute} from 'astro'
import {
  DiscourseMetadataConfigurationError,
  DiscourseMetadataRequestError,
  getDiscourseTopicMetadata,
} from '../../../lib/forum/discourseMetadata'
import {readTranslationSession} from '../../../lib/translationAuth/session'

export const prerender = false

const SYNTHETIC_TOPIC_ID = 13

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
    const metadata = await getDiscourseTopicMetadata(SYNTHETIC_TOPIC_ID)

    return jsonResponse(200, {
      ok: true,
      code: 'forum_metadata_connected',
      message: 'The protected Forum metadata connection is operational.',
      metadata,
    })
  } catch (error) {
    console.error('Protected Forum metadata connectivity check failed', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
      topicId: SYNTHETIC_TOPIC_ID,
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
