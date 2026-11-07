import type {APIRoute} from 'astro'
import {planJourney} from '../../../lib/entur/server/client.ts'
import {resolveDestination} from '../../../lib/entur/server/destination.ts'
import {disabledResponse, errorResponse, jsonResponse, readRequestJson, RequestError} from '../../../lib/entur/server/http.ts'
import {parseJourneyRequest} from '../../../lib/entur/validation.ts'
import type {JourneyRequest, TravelCoordinates} from '../../../lib/entur/types.ts'

export const prerender = false

export const createJourneyHandler = (
  resolve: (selector: JourneyRequest['destination']) => Promise<TravelCoordinates>,
): APIRoute => async ({request}) => {
  const disabled = disabledResponse()
  if (disabled) return disabled
  try {
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
