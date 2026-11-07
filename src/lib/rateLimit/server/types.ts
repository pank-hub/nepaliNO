import type {RateLimitCategory, RateLimitConfig} from './config.ts'

export type UnavailableReason = 'not_configured' | 'invalid_client_address' | 'provider_timeout' | 'provider_error'

export type RateLimitDecision =
  | {status: 'allowed'}
  | {status: 'limited'; retryAfterSeconds: number}
  | {status: 'unavailable'; reason: UnavailableReason}

export interface ProviderResult {
  allowed: boolean
  // Unix epoch milliseconds at which the current window resets.
  resetAtMs: number
}

// A provider receives only a pseudonymous digest and a category, never request data.
export interface RateLimitProvider {
  check(identifier: string, category: RateLimitCategory): Promise<ProviderResult>
}

export type RateLimitProviderFactory = (config: RateLimitConfig) => RateLimitProvider
export type RateLimiter = (request: Request, category: RateLimitCategory) => Promise<RateLimitDecision>

export class ProviderTimeoutError extends Error {
  constructor() {
    super('rate_limit_provider_timeout')
  }
}
