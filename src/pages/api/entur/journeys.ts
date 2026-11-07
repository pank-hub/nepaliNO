import type {APIRoute} from 'astro'
import {planJourney} from '../../../lib/entur/server/client.ts'
import {resolveDestination} from '../../../lib/entur/server/destination.ts'
import {checkJsonRequest, disabledResponse, errorResponse, jsonResponse, rateLimitRejection, readRequestJson, RequestError} from '../../../lib/entur/server/http.ts'
import {enturRateLimiter} from '../../../lib/entur/server/rateLimit.ts'
import type {RateLimiter} from '../../../lib/rateLimit/server/limiter.ts'
import {parseJourneyRequest} from '../../../lib/entur/validation.ts'
import type {JourneyRequest, TravelCoordinates} from '../../../lib/entur/types.ts'

export const prerender = false

export const createJourneyHandler = (
  resolve: (selector: JourneyRequest['destination']) => Promise<TravelCoordinates>,
  limit: RateLimiter = enturRateLimiter,
): APIRoute => async ({request}) => {
  const disabled = disabledResponse()
  if (disabled) return disabled
  try {
    checkJsonRequest(request)
    const rejected = await rateLimitRejection(limit, request, 'entur-journey')
    if (rejected) return rejected
    const journey = parseJourneyRequest(await readRequestJson(request))
    if (!journey) throw new RequestError('invalid_request', 400)
    const destination = await resolve(journey.destination)
    return jsonResponse(200, {ok: true, journeys: await planJourney({...journey, destination})})
  } catch (error) {
    return errorResponse(error)
  }
}

export const POST = createJourneyHandler(resolveDestination)
export const ALL: APIRoute = async () =>
  disabledResponse() ?? errorResponse(new RequestError('method_not_allowed', 405))
