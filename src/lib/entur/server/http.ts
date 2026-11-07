import {ENTUR, isEnturApiEnabled} from './config.ts'

export type ErrorCode = 'method_not_allowed' | 'unsupported_media_type' | 'request_too_large' |
  'invalid_request' | 'timeout' | 'upstream_unavailable' | 'upstream_invalid_response' |
  'upstream_graphql_error' | 'rate_limited' | 'no_journeys' | 'destination_unavailable' | 'destination_service_unavailable'

export class RequestError extends Error {
  readonly code: ErrorCode
  readonly status: number

  constructor(code: ErrorCode, status: number) {
    super(code)
    this.code = code
    this.status = status
  }
}

export function jsonResponse(status: number, body: unknown): Response {
  return Response.json(body, {status, headers: {
    'cache-control': 'private, no-store',
    'x-content-type-options': 'nosniff',
    ...(status === 405 ? {allow: 'POST'} : {}),
  }})
}

export const disabledResponse = () =>
  isEnturApiEnabled() ? undefined : jsonResponse(404, {ok: false, code: 'not_found'})

export function errorResponse(error: unknown): Response {
  const safe = error instanceof RequestError ? error : new RequestError('upstream_unavailable', 502)
  return jsonResponse(safe.status, {ok: false, code: safe.code})
}

async function readLimitedBody(response: Request | Response, maximum: number): Promise<string> {
  const length = response.headers.get('content-length')
  if (length && /^\d+$/.test(length) && Number(length) > maximum) throw new RequestError('request_too_large', 413)
  if (!response.body) return ''
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  try {
    while (true) {
      const {done, value} = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > maximum) {
        await reader.cancel()
        throw new RequestError('request_too_large', 413)
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder('utf-8', {fatal: true}).decode(bytes)
}

export async function readRequestJson(request: Request): Promise<unknown> {
  if (request.method !== 'POST') throw new RequestError('method_not_allowed', 405)
  const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase()
  if (contentType !== 'application/json') throw new RequestError('unsupported_media_type', 415)
  try {
    return JSON.parse(await readLimitedBody(request, ENTUR.maxRequestBytes))
  } catch (error) {
    if (error instanceof RequestError) throw error
    throw new RequestError('invalid_request', 400)
  }
}

export async function fetchEntur(url: string, init: RequestInit): Promise<unknown> {
  const signal = AbortSignal.timeout(ENTUR.timeoutMs)
  try {
    const response = await fetch(url, {...init, redirect: 'error', signal})
    if (response.status === 429) throw new RequestError('rate_limited', 429)
    if (!response.ok) throw new RequestError('upstream_unavailable', 502)
    try {
      return JSON.parse(await readLimitedBody(response, ENTUR.maxResponseBytes))
    } catch (error) {
      if (signal.aborted) throw error
      throw new RequestError('upstream_invalid_response', 502)
    }
  } catch (error) {
    if (signal.aborted || (error instanceof Error && error.name === 'TimeoutError')) {
      throw new RequestError('timeout', 504)
    }
    if (error instanceof RequestError) throw error
    throw new RequestError('upstream_unavailable', 502)
  }
}
