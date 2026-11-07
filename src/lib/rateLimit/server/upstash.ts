import {Ratelimit} from '@upstash/ratelimit'
import {Redis} from '@upstash/redis'
import {
  RATE_LIMIT_CATEGORIES,
  RATE_LIMIT_KEY_PREFIX,
  RATE_LIMIT_PROVIDER_TIMEOUT_MS,
  RATE_LIMITS,
  type RateLimitCategory,
  type RateLimitConfig,
} from './config.ts'
import {ProviderTimeoutError, type RateLimitProvider} from './types.ts'

// The only module that knows about Upstash. Server-only: it must never be imported
// by a component or island, and no Upstash variable may carry a PUBLIC_ prefix.
export function createUpstashRateLimitProvider(config: RateLimitConfig): RateLimitProvider {
  const redis = new Redis({
    url: config.url,
    token: config.token,
    retry: false, // a bounded single attempt; retries would stretch the request past the timeout
    enableTelemetry: false,
    signal: () => AbortSignal.timeout(RATE_LIMIT_PROVIDER_TIMEOUT_MS),
  })
  const limiters = Object.fromEntries(RATE_LIMIT_CATEGORIES.map((category) => [
    category,
    new Ratelimit({
      redis,
      prefix: `${RATE_LIMIT_KEY_PREFIX}:${category}`,
      limiter: Ratelimit.slidingWindow(RATE_LIMITS[category].requests, `${RATE_LIMITS[category].windowSeconds} s`),
      analytics: false, // no extra Redis commands or stored metadata
      timeout: 0, // the SDK's own timeout resolves as "allowed"; the caller fails closed instead
    }),
  ])) as Record<RateLimitCategory, Ratelimit>

  return {
    async check(identifier, category) {
      const result = await limiters[category].limit(identifier)
      if (result.reason === 'timeout') throw new ProviderTimeoutError()
      return {allowed: result.success, resetAtMs: result.reset}
    },
  }
}
