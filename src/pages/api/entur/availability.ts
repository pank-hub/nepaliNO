import type {APIRoute} from 'astro'
import {resolveDestination} from '../../../lib/entur/server/destination.ts'
import {checkJsonRequest, disabledResponse, errorResponse, jsonResponse, rateLimitRejection, readRequestJson, RequestError} from '../../../lib/entur/server/http.ts'
import {enturRateLimiter} from '../../../lib/entur/server/rateLimit.ts'
import type {RateLimiter} from '../../../lib/rateLimit/server/limiter.ts'
import {parseDestinationSelector} from '../../../lib/entur/validation.ts'
import type {JourneyRequest, TravelCoordinates} from '../../../lib/entur/types.ts'

export const prerender = false

export const createAvailabilityHandler = (
  resolve: (selector: JourneyRequest['destination']) => Promise<TravelCoordinates>,
  limit: RateLimiter = enturRateLimiter,
): APIRoute => async ({request}) => {
  const disabled = disabledResponse()
  if (disabled) return disabled
  try {
    checkJsonRequest(request)
    const rejected = await rateLimitRejection(limit, request, 'entur-availability')
    if (rejected) return rejected
    const selector = parseDestinationSelector(await readRequestJson(request))
    if (!selector) throw new RequestError('invalid_request', 400)
    await resolve(selector)
    return jsonResponse(200, {ok: true})
  } catch (error) {
    return errorResponse(error)
  }
}

export const POST = createAvailabilityHandler(resolveDestination)
export const ALL: APIRoute = async () =>
  disabledResponse() ?? errorResponse(new RequestError('method_not_allowed', 405))
