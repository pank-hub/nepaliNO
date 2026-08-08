import type {APIRoute} from 'astro'
import {forumPilot} from '../../config/forum'
import {getDiscourseTopicMetadata} from '../../lib/forum/discourseMetadata'
import {
  ForumContentMetadataUnavailableError,
  loadForumContentMetadata,
} from '../../lib/forum/loadForumContentMetadata'
import {
  InvalidForumContentRequestError,
  parseForumContentRequest,
} from '../../lib/forum/parseForumContentRequest'
import {
  ForumContentRelationshipUnavailableError,
  resolveContentForumRelationships,
} from '../../lib/forum/resolveContentForumRelationships'

export const prerender = false

const jsonResponse = (
  status: number,
  body: Record<string, unknown>,
  cacheControl = 'no-store',
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': cacheControl,
      'x-content-type-options': 'nosniff',
    },
  })

const notFoundResponse = () =>
  jsonResponse(404, {
    ok: false,
    code: 'not_found',
    message: 'Not found.',
  })

const unavailableResponse = () =>
  jsonResponse(503, {
    ok: false,
    code: 'forum_metadata_unavailable',
    message: 'Forum metadata is not available.',
  })

export const GET: APIRoute = async ({request}) => {
  if (!forumPilot.contentIntegrationEnabled) {
    return notFoundResponse()
  }

  let identity

  try {
    identity = parseForumContentRequest(new URL(request.url).searchParams)
  } catch (error) {
    if (error instanceof InvalidForumContentRequestError) {
      return notFoundResponse()
    }

    return unavailableResponse()
  }

  try {
    const resolved = await resolveContentForumRelationships(identity)
    const metadata = await loadForumContentMetadata(
      resolved.relationships,
      getDiscourseTopicMetadata,
    )

    return jsonResponse(
      200,
      {
        ok: true,
        code: 'forum_content_available',
        content: resolved.identity,
        companion: metadata.companion,
        related: metadata.related,
      },
      'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
    )
  } catch (error) {
    if (error instanceof ForumContentRelationshipUnavailableError) {
      return notFoundResponse()
    }

    if (error instanceof ForumContentMetadataUnavailableError) {
      return unavailableResponse()
    }

    console.error('Forum content metadata request failed', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    })

    return unavailableResponse()
  }
}

export const ALL: APIRoute = async () =>
  jsonResponse(405, {
    ok: false,
    code: 'method_not_allowed',
    message: 'Method not allowed.',
  })
