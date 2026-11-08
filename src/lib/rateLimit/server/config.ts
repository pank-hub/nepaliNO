// Server-only. Never import this module from a component, island or client script.
export const RATE_LIMIT_CATEGORIES = ['entur-origin', 'entur-journey', 'entur-availability'] as const
export type RateLimitCategory = (typeof RATE_LIMIT_CATEGORIES)[number]

export interface RateLimitRule {
  readonly requests: number
  readonly windowSeconds: number
}

// Sliding-window limits per pseudonymous client. Adjust here only.
export const RATE_LIMITS: Readonly<Record<RateLimitCategory, RateLimitRule>> = {
  'entur-origin': {requests: 20, windowSeconds: 60},
  'entur-journey': {requests: 10, windowSeconds: 60},
  'entur-availability': {requests: 30, windowSeconds: 60},
}

// The provider must answer within this time or the request fails closed with 503.
export const RATE_LIMIT_PROVIDER_TIMEOUT_MS = 2_000
export const RATE_LIMIT_KEY_PREFIX = 'nepali-no:ratelimit'

export const RATE_LIMIT_ENV = {
  url: 'UPSTASH_REDIS_REST_URL',
  token: 'UPSTASH_REDIS_REST_TOKEN',
  hashSecret: 'RATE_LIMIT_HASH_SECRET',
} as const

export interface RateLimitConfig {
  readonly url: string
  readonly token: string
  readonly hashSecret: string
}

const present = (value: string | undefined) => value?.trim() || undefined

// Returns undefined unless every variable is present and the REST URL is https.
export function readRateLimitConfig(env: Record<string, string | undefined> = process.env): RateLimitConfig | undefined {
  const url = present(env[RATE_LIMIT_ENV.url])
  const token = present(env[RATE_LIMIT_ENV.token])
  const hashSecret = present(env[RATE_LIMIT_ENV.hashSecret])
  if (!url || !token || !hashSecret) return
  try {
    if (new URL(url).protocol !== 'https:') return
  } catch {
    return
  }
  return {url, token, hashSecret}
}
