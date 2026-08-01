import type {APIRoute} from 'astro'
import {validateEventSubmission} from '../../lib/eventSubmissions/validateEventSubmission'
import {
  createPrivateEventSubmission,
  SubmissionStorageUnavailableError,
} from '../../lib/eventSubmissions/createEventSubmission'

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

  const validation = validateEventSubmission(payload)

  if (!validation.ok) {
    if (validation.spam) {
      return jsonResponse(400, {
        ok: false,
        code: 'invalid_payload',
        message: 'The submission could not be accepted.',
      })
    }

    return jsonResponse(400, {
      ok: false,
      code: 'validation_failed',
      message: 'Review the submitted fields.',
      errors: validation.errors,
    })
  }

  try {
    const stored = await createPrivateEventSubmission(validation.data)

    return jsonResponse(201, {
      ok: true,
      code: 'submission_received',
      message: 'The Event submission was received for moderation.',
      submissionId: stored.submissionId,
      submittedAt: stored.submittedAt,
    })
  } catch (error) {
    if (error instanceof SubmissionStorageUnavailableError) {
      return jsonResponse(503, {
        ok: false,
        code: 'submission_service_unavailable',
        message: 'The Event submission service is temporarily unavailable.',
      })
    }

    console.error('Event submission storage failed', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    })

    return jsonResponse(500, {
      ok: false,
      code: 'submission_failed',
      message: 'The Event submission could not be stored. Please try again later.',
    })
  }
}

export const ALL: APIRoute = async () =>
  jsonResponse(405, {
    ok: false,
    code: 'method_not_allowed',
    message: 'Method not allowed.',
  })
