import type {APIRoute} from 'astro'
import {searchOrigins} from '../../../lib/entur/server/client.ts'
import {disabledResponse, errorResponse, jsonResponse, readRequestJson, RequestError} from '../../../lib/entur/server/http.ts'
import {parseOriginQuery} from '../../../lib/entur/validation.ts'

export const prerender = false

export const POST: APIRoute = async ({request}) => {
  const disabled = disabledResponse()
  if (disabled) return disabled
  try {
    const query = parseOriginQuery(await readRequestJson(request))
    if (!query) throw new RequestError('invalid_request', 400)
    return jsonResponse(200, {ok: true, suggestions: await searchOrigins(query)})
  } catch (error) {
    return errorResponse(error)
  }
}

export const ALL: APIRoute = async () =>
  disabledResponse() ?? errorResponse(new RequestError('method_not_allowed', 405))
