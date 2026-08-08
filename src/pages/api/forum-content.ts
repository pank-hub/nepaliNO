import type {APIRoute} from 'astro'
import {forumPilot} from '../../config/forum'
import {
  InvalidForumContentRequestError,
  parseForumContentRequest,
} from '../../lib/forum/parseForumContentRequest'

export const prerender = false

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  })

const notFoundResponse = () =>
  jsonResponse(404, {
    ok: false,
    code: 'not_found',
    message: 'Not found.',
  })

export const GET: APIRoute = async ({request}) => {
  if (!forumPilot.contentIntegrationEnabled) {
    return notFoundResponse()
  }

  try {
    parseForumContentRequest(new URL(request.url).searchParams)
  } catch (error) {
    if (error instanceof InvalidForumContentRequestError) {
      return notFoundResponse()
    }

    throw error
  }

  return jsonResponse(503, {
    ok: false,
    code: 'forum_metadata_unavailable',
    message: 'Forum metadata is not available.',
  })
}

export const ALL: APIRoute = async () =>
  jsonResponse(405, {
    ok: false,
    code: 'method_not_allowed',
    message: 'Method not allowed.',
  })
