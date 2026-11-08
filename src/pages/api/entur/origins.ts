import type {APIRoute} from 'astro'
import {searchOrigins} from '../../../lib/entur/server/client.ts'
import {checkJsonRequest, disabledResponse, errorResponse, jsonResponse, rateLimitRejection, readRequestJson, RequestError} from '../../../lib/entur/server/http.ts'
import {enturRateLimiter} from '../../../lib/entur/server/rateLimit.ts'
import type {RateLimiter} from '../../../lib/rateLimit/server/limiter.ts'
import {parseOriginQuery} from '../../../lib/entur/validation.ts'

export const prerender = false

export const createOriginHandler = (limit: RateLimiter = enturRateLimiter): APIRoute => async ({request}) => {
  const disabled = disabledResponse()
  if (disabled) return disabled
  try {
    checkJsonRequest(request)
    const rejected = await rateLimitRejection(limit, request, 'entur-origin')
    if (rejected) return rejected
    const query = parseOriginQuery(await readRequestJson(request))
    if (!query) throw new RequestError('invalid_request', 400)
    return jsonResponse(200, {ok: true, suggestions: await searchOrigins(query)})
  } catch (error) {
    return errorResponse(error)
  }
}

export const POST = createOriginHandler()
export const ALL: APIRoute = async () =>
  disabledResponse() ?? errorResponse(new RequestError('method_not_allowed', 405))
