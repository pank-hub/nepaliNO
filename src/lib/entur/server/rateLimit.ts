import {checkRateLimit, type RateLimiter} from '../../rateLimit/server/limiter.ts'

// The production limiter. Endpoint factories accept a replacement so tests never reach a provider.
export const enturRateLimiter: RateLimiter = (request, category) => checkRateLimit(request, category)
