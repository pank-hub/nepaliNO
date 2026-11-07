import type {APIRoute} from 'astro'
import {resolveDestination} from '../../../lib/entur/server/destination.ts'
import {disabledResponse, errorResponse, jsonResponse, readRequestJson, RequestError} from '../../../lib/entur/server/http.ts'
import {parseDestinationSelector} from '../../../lib/entur/validation.ts'
import type {JourneyRequest, TravelCoordinates} from '../../../lib/entur/types.ts'

export const prerender = false

export const createAvailabilityHandler = (
  resolve: (selector: JourneyRequest['destination']) => Promise<TravelCoordinates>,
): APIRoute => async ({request}) => {
  const disabled = disabledResponse()
  if (disabled) return disabled
  try {
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
