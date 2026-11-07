import {
  RATE_LIMIT_PROVIDER_TIMEOUT_MS,
  RATE_LIMITS,
  readRateLimitConfig,
  type RateLimitCategory,
  type RateLimitConfig,
} from './config.ts'
import {createRateLimitIdentifier, readClientAddress} from './identifier.ts'
import {
  ProviderTimeoutError,
  type RateLimitDecision,
  type RateLimitProvider,
  type RateLimitProviderFactory,
  type UnavailableReason,
} from './types.ts'
import {createUpstashRateLimitProvider} from './upstash.ts'

export type {RateLimitDecision, RateLimiter} from './types.ts'
export type {RateLimitCategory} from './config.ts'

export interface RateLimitDependencies {
  env?: Record<string, string | undefined>
  createProvider?: RateLimitProviderFactory
  now?: () => number
  timeoutMs?: number
}

// Reused across warm invocations so the SDK's cache of blocked identifiers survives.
let cached: {key: string; provider: RateLimitProvider} | undefined
const providerFor = (config: RateLimitConfig, create: RateLimitProviderFactory): RateLimitProvider => {
  if (create !== createUpstashRateLimitProvider) return create(config)
  const key = `${config.url}\n${config.token}`
  if (cached?.key !== key) cached = {key, provider: create(config)}
  return cached.provider
}

const unavailable = (category: RateLimitCategory, reason: UnavailableReason): RateLimitDecision => {
  // Category and reason only: never addresses, identifiers, request data or provider messages.
  console.error('[rate-limit] unavailable', {category, reason})
  return {status: 'unavailable', reason}
}

function withTimeout<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new ProviderTimeoutError()), milliseconds)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

export async function checkRateLimit(
  request: Request,
  category: RateLimitCategory,
  dependencies: RateLimitDependencies = {},
): Promise<RateLimitDecision> {
  const config = readRateLimitConfig(dependencies.env)
  if (!config) return unavailable(category, 'not_configured')
  const address = readClientAddress(request)
  if (!address) return unavailable(category, 'invalid_client_address')
  const identifier = createRateLimitIdentifier(address, category, config.hashSecret)
  const now = dependencies.now ?? Date.now
  try {
    const provider = providerFor(config, dependencies.createProvider ?? createUpstashRateLimitProvider)
    const result = await withTimeout(provider.check(identifier, category), dependencies.timeoutMs ?? RATE_LIMIT_PROVIDER_TIMEOUT_MS)
    if (result.allowed) return {status: 'allowed'}
    const window = RATE_LIMITS[category].windowSeconds
    const seconds = Number.isFinite(result.resetAtMs) ? Math.ceil((result.resetAtMs - now()) / 1000) : window
    return {status: 'limited', retryAfterSeconds: Math.min(window, Math.max(1, seconds))}
  } catch (error) {
    return unavailable(category, error instanceof ProviderTimeoutError ? 'provider_timeout' : 'provider_error')
  }
}
