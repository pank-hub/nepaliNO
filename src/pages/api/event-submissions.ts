import type {APIRoute} from 'astro'

export const prerender = false

const MAX_REQUEST_BYTES = 64 * 1024

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })

export const POST: APIRoute = async ({request}) => {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? ''

  if (!contentType.startsWith('application/json')) {
    return jsonResponse(415, {
      ok: false,
      code: 'unsupported_media_type',
      message: 'This endpoint accepts JSON requests only.',
    })
  }

  const declaredLength = Number(request.headers.get('content-length') ?? '0')

  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    return jsonResponse(413, {
      ok: false,
      code: 'request_too_large',
      message: 'The submission is too large.',
    })
  }

  let rawBody: string

  try {
    rawBody = await request.text()
  } catch {
    return jsonResponse(400, {
      ok: false,
      code: 'invalid_request',
      message: 'The request could not be read.',
    })
  }

  if (Buffer.byteLength(rawBody, 'utf8') > MAX_REQUEST_BYTES) {
    return jsonResponse(413, {
      ok: false,
      code: 'request_too_large',
      message: 'The submission is too large.',
    })
  }

  let payload: unknown

  try {
    payload = JSON.parse(rawBody)
  } catch {
    return jsonResponse(400, {
      ok: false,
      code: 'invalid_json',
      message: 'The request body is not valid JSON.',
    })
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return jsonResponse(400, {
      ok: false,
      code: 'invalid_payload',
      message: 'The submission payload must be a JSON object.',
    })
  }

  return jsonResponse(503, {
    ok: false,
    code: 'submission_service_not_enabled',
    message: 'The Event submission service is not enabled yet.',
  })
}

export const ALL: APIRoute = async () =>
  jsonResponse(405, {
    ok: false,
    code: 'method_not_allowed',
    message: 'Method not allowed.',
  })
