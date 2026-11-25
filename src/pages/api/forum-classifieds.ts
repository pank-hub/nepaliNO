import type {APIRoute} from 'astro'
import {forumPilot} from '../../config/forum'
import {
  isValidClassifiedsCategory,
  isValidFylkeTag,
  loadDiscourseClassifieds,
  type ClassifiedsCategoryKey,
} from '../../lib/forum/discourseClassifieds'

export const prerender = false

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control':
        status === 200
          ? 'public, max-age=0, s-maxage=60, stale-while-revalidate=300'
          : 'no-store',
      'x-content-type-options': 'nosniff',
    },
  })

const ALLOWED_PARAMS = new Set(['category', 'fylke'])

export const GET: APIRoute = async ({url}) => {
  if (!forumPilot.enabled) {
    return jsonResponse(404, {ok: false, code: 'not_found'})
  }

  for (const key of url.searchParams.keys()) {
    if (!ALLOWED_PARAMS.has(key)) {
      return jsonResponse(400, {ok: false, code: 'invalid_parameter'})
    }
  }

  const categoryParams = url.searchParams.getAll('category')
  const fylkeParams = url.searchParams.getAll('fylke')

  if (categoryParams.length > 1 || fylkeParams.length > 1) {
    return jsonResponse(400, {ok: false, code: 'duplicate_parameter'})
  }

  let categories: readonly ClassifiedsCategoryKey[] | undefined
  const rawCategory = categoryParams[0]?.trim().toLowerCase()
  if (rawCategory && rawCategory !== 'all') {
    if (!isValidClassifiedsCategory(rawCategory)) {
      return jsonResponse(400, {ok: false, code: 'invalid_category'})
    }
    categories = [rawCategory]
  }

  const rawFylke = fylkeParams[0]?.trim().toLowerCase()
  if (rawFylke && !isValidFylkeTag(rawFylke)) {
    return jsonResponse(400, {ok: false, code: 'invalid_fylke'})
  }

  const result = await loadDiscourseClassifieds({
    categories,
    fylke: rawFylke || undefined,
  })

  return jsonResponse(200, {
    ok: true,
    status: result.status,
    counts: result.counts,
    items: result.items,
  })
}

export const ALL: APIRoute = async () =>
  jsonResponse(405, {ok: false, code: 'method_not_allowed'})
