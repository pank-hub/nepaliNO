// Pure, framework-free preview helpers (no Astro or virtual-module imports) so they can be unit tested.

export const PREVIEW_COOKIE_NAME = 'nepali_preview'
export const PREVIEW_COOKIE_MAX_AGE_SECONDS = 60 * 60
export const PREVIEW_SECRET_MIN_LENGTH = 32
export const PREVIEW_FRONTEND_ORIGIN = 'https://nepali.no'
export const PREVIEW_STUDIO_URL = 'https://studio.nepali.no/content'

// Fixed list. The temporary vercel.app Studio stays here until the custom domain is verified.
export const PREVIEW_STUDIO_ORIGINS = [
  'https://studio.nepali.no',
  'https://nepali-no-studio.vercel.app',
] as const

export const PREVIEW_DEV_STUDIO_ORIGINS = ['http://localhost:3333', 'http://127.0.0.1:3333'] as const

export const PREVIEW_LANGUAGES = ['ne', 'nb'] as const
export type PreviewLanguage = (typeof PREVIEW_LANGUAGES)[number]

export interface PreviewEnv {
  SANITY_API_READ_TOKEN?: string
  PREVIEW_COOKIE_SECRET?: string
}

export interface PreviewConfig {
  token: string
  cookieSecret: string
}

// Fails closed: both values must be present and the cookie secret long enough.
export function getPreviewConfig(env: PreviewEnv | undefined): PreviewConfig | null {
  const token = env?.SANITY_API_READ_TOKEN?.trim()
  const cookieSecret = env?.PREVIEW_COOKIE_SECRET?.trim()

  if (!token || !cookieSecret || cookieSecret.length < PREVIEW_SECRET_MIN_LENGTH) {
    return null
  }

  return {token, cookieSecret}
}

export function parsePreviewLanguage(value: unknown): PreviewLanguage | null {
  return typeof value === 'string' && (PREVIEW_LANGUAGES as readonly string[]).includes(value)
    ? (value as PreviewLanguage)
    : null
}

// Sanity-generated IDs are UUIDs; the pattern also covers hand-made IDs but never dots, so
// "drafts." and "versions." prefixes cannot be injected. The result is always the published ID.
const DOCUMENT_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/

export function parsePreviewDocumentId(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const id = value.startsWith('drafts.') ? value.slice('drafts.'.length) : value
  return DOCUMENT_ID_PATTERN.test(id) ? id : null
}

const SLUG_PATTERN = /^[^\s/\\?#%\u0000-\u001f]{1,200}$/u

export function parsePreviewSlug(value: unknown): string | null {
  return typeof value === 'string' && SLUG_PATTERN.test(value) ? value : null
}

// Only same-site relative destinations under /preview/ are accepted. The URL is parsed against a
// throwaway origin, and any change of origin means the input was external or malformed.
export function sanitizePreviewRedirect(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0 || value.length > 512) return null
  if (!value.startsWith('/preview/')) return null
  if (/[\u0000-\u001f\u007f\\]/.test(value) || value.includes('//')) return null

  const base = 'https://preview-redirect.invalid'
  let parsed: URL
  try {
    parsed = new URL(value, base)
  } catch {
    return null
  }

  if (parsed.origin !== base || !parsed.pathname.startsWith('/preview/')) return null
  if (parsed.pathname.split('/').some((segment) => segment === '..' || segment === '.')) return null
  if (/%2e|%2f|%5c/i.test(parsed.pathname)) return null

  parsed.searchParams.delete('sanity-preview-secret')
  return `${parsed.pathname}${parsed.search}`
}

export function isHostSameSite(origin: string, frontendOrigin = PREVIEW_FRONTEND_ORIGIN): boolean {
  try {
    const host = new URL(origin).hostname
    const frontendHost = new URL(frontendOrigin).hostname
    return (
      host === frontendHost ||
      host.endsWith(`.${frontendHost}`) ||
      host === 'localhost' ||
      host === '127.0.0.1'
    )
  } catch {
    return false
  }
}

export interface StudioOriginDecision {
  allowed: boolean
  sameSite: 'lax' | 'none'
}

export interface StudioOriginOptions {
  allowDev?: boolean
  // Raw PREVIEW_DEV_STUDIO_ORIGIN value; honoured only when allowDev is true.
  devStudioOrigin?: string
}

// Strict origin only (no credentials, query, fragment or path other than "/"); returns undefined otherwise.
export function parseDevStudioOrigin(value: string | undefined): string | undefined {
  const raw = value?.trim()
  if (!raw || raw.includes('*')) return undefined
  try {
    const url = new URL(raw)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/') return undefined
    return url.origin
  } catch {
    return undefined
  }
}

// Production never consults the development origin.
const allowedOrigins = (options: StudioOriginOptions = {}): readonly string[] => {
  if (!options.allowDev) return PREVIEW_STUDIO_ORIGINS
  const extra = parseDevStudioOrigin(options.devStudioOrigin)
  return [...PREVIEW_STUDIO_ORIGINS, ...PREVIEW_DEV_STUDIO_ORIGINS, ...(extra ? [extra] : [])]
}

// Least permissive SameSite compatible with Presentation: Lax when the Studio shares the nepali.no
// site (studio.nepali.no), None only for the temporary cross-site vercel.app Studio origin.
export function decideStudioOrigin(
  studioOrigin: string | undefined,
  options: StudioOriginOptions = {},
): StudioOriginDecision {
  if (!studioOrigin) return {allowed: true, sameSite: 'lax'}
  if (!allowedOrigins(options).includes(studioOrigin)) return {allowed: false, sameSite: 'lax'}
  return {allowed: true, sameSite: isHostSameSite(studioOrigin) ? 'lax' : 'none'}
}

export function previewFrameAncestors(options: StudioOriginOptions = {}): string {
  return `frame-ancestors 'self' ${allowedOrigins(options).join(' ')}`
}

export function previewResponseHeaders(options: StudioOriginOptions = {}): Record<string, string> {
  return {
    'Cache-Control': 'private, no-store, max-age=0',
    'X-Robots-Tag': 'noindex, nofollow',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': previewFrameAncestors(options),
    Vary: 'Cookie',
  }
}

const encoder = new TextEncoder()

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const fromBase64Url = (value: string): Uint8Array<ArrayBuffer> | null => {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null
  const padded = value
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=')
  try {
    return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0))
  } catch {
    return null
  }
}

const importKey = (secret: string, usages: KeyUsage[]) =>
  crypto.subtle.importKey('raw', encoder.encode(secret), {name: 'HMAC', hash: 'SHA-256'}, false, usages)

// Opaque cookie value "v1.<expiry>.<nonce>.<signature>". It carries no draft data or token.
export async function createPreviewCookieValue(
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
  maxAgeSeconds = PREVIEW_COOKIE_MAX_AGE_SECONDS,
): Promise<string> {
  const nonce = toBase64Url(crypto.getRandomValues(new Uint8Array(16)))
  const payload = `v1.${nowSeconds + maxAgeSeconds}.${nonce}`
  const key = await importKey(secret, ['sign'])
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(payload)))
  return `${payload}.${toBase64Url(signature)}`
}

export async function verifyPreviewCookieValue(
  secret: string,
  value: string | undefined,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<boolean> {
  if (!value || value.length > 256) return false

  const parts = value.split('.')
  if (parts.length !== 4 || parts[0] !== 'v1') return false

  const [version, expiry, nonce, signature] = parts
  if (!/^\d{1,12}$/.test(expiry) || Number(expiry) <= nowSeconds || !nonce) return false

  const signatureBytes = fromBase64Url(signature)
  if (!signatureBytes) return false

  const key = await importKey(secret, ['verify'])
  return crypto.subtle.verify('HMAC', key, signatureBytes, encoder.encode(`${version}.${expiry}.${nonce}`))
}
