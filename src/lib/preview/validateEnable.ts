import {
  validatePreviewUrl,
  type PreviewUrlValidateUrlResult,
  type SanityClientLike,
} from '@sanity/preview-url-secret'

export type EnableValidation =
  | {ok: true; validation: PreviewUrlValidateUrlResult}
  | {ok: false; reason: 'missing_preview_secret' | 'invalid_preview_secret' | 'token_rejected' | 'validation_exception'}

// The library logs the full preview URL in development if a stored studioUrl is malformed.
// Reject that response before it reaches the library, without logging its contents.
function guardClient(client: SanityClientLike): SanityClientLike {
  return {
    config: () => client.config(),
    withConfig: (config) => guardClient(client.withConfig(config)),
    async fetch<R, Q>(query: string, params: Q, options: {tag?: string}): Promise<R> {
      const result = await client.fetch<R, Q>(query, params, options)
      if (result && typeof result === 'object') {
        const records = [
          'private' in result ? result.private : null,
          'public' in result ? result.public : null,
        ]
        for (const record of records) {
          if (!record || typeof record !== 'object' || !('secret' in record) || !record.secret) continue
          if (!('studioUrl' in record) || typeof record.studioUrl !== 'string') {
            throw new Error('Invalid Studio URL in preview secret')
          }
          try {
            new URL(record.studioUrl)
          } catch {
            throw new Error('Invalid Studio URL in preview secret')
          }
        }
      }
      return result
    },
  }
}

export async function validateEnableRequest(
  client: SanityClientLike,
  requestUrl: string,
): Promise<EnableValidation> {
  // Avoid the library's development log of the URL and client when URL parsing fails.
  try {
    const url = new URL(requestUrl)
    if (!url.searchParams.get('sanity-preview-secret')) {
      return {ok: false, reason: 'missing_preview_secret'}
    }
    const redirect = url.searchParams.get('sanity-preview-pathname')
    if (redirect) new URL(redirect, 'http://localhost')
  } catch {
    return {ok: false, reason: 'validation_exception'}
  }

  try {
    const validation = await validatePreviewUrl(guardClient(client), requestUrl)
    return validation.isValid
      ? {ok: true, validation}
      : {ok: false, reason: 'invalid_preview_secret'}
  } catch (error) {
    const status =
      error && typeof error === 'object' && 'statusCode' in error ? error.statusCode : undefined
    return {
      ok: false,
      reason: status === 401 || status === 403 ? 'token_rejected' : 'validation_exception',
    }
  }
}
