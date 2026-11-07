// Server-only. Never import this module from client code or from a component hydrated in the browser.
import type {AstroCookies} from 'astro'
import {sanityClient} from 'sanity:client'
import {
  GUIDE_PUBLIC_ROUTE_EXISTS_QUERY,
  NEWS_PUBLIC_ROUTE_EXISTS_QUERY,
} from '../sanity/queries.ts'
import {
  PREVIEW_COOKIE_NAME,
  PREVIEW_FRONTEND_ORIGIN,
  previewResponseHeaders,
  type PreviewEnv,
  type StudioOriginOptions,
} from './config.ts'
import {
  loadPreviewDocument,
  type PreviewClientLike,
  type PreviewKind,
  type PreviewResult,
  type PreviewSelector,
} from './loaderCore.ts'

// Production reads process.env at request time so secrets are never inlined into the build output;
// `astro dev` exposes .env values only through import.meta.env.
export const getPreviewEnv = (): PreviewEnv =>
  import.meta.env.DEV
    ? {
        SANITY_API_READ_TOKEN: import.meta.env.SANITY_API_READ_TOKEN,
        PREVIEW_COOKIE_SECRET: import.meta.env.PREVIEW_COOKIE_SECRET,
      }
    : {
        SANITY_API_READ_TOKEN: process.env['SANITY_API_READ_TOKEN'],
        PREVIEW_COOKIE_SECRET: process.env['PREVIEW_COOKIE_SECRET'],
      }

// PREVIEW_DEV_STUDIO_ORIGIN is read only under `astro dev` and is ignored in production builds.
export const getStudioOriginOptions = (): StudioOriginOptions => ({
  allowDev: import.meta.env.DEV,
  devStudioOrigin: import.meta.env.DEV ? import.meta.env.PREVIEW_DEV_STUDIO_ORIGIN : undefined,
})

export const getPreviewHeaders = () => previewResponseHeaders(getStudioOriginOptions())

export const previewNotFound = () => new Response(null, {status: 404, headers: getPreviewHeaders()})

export async function loadPreviewPage<T extends {language?: string}>(
  cookies: AstroCookies,
  selector: PreviewSelector & {kind: PreviewKind},
): Promise<PreviewResult<T>> {
  return loadPreviewDocument<T>(
    {
      client: sanityClient as unknown as PreviewClientLike,
      env: getPreviewEnv(),
      cookieValue: cookies.get(PREVIEW_COOKIE_NAME)?.value,
    },
    selector,
  )
}

export const applyPreviewHeaders = (response: {headers: Headers}) => {
  for (const [name, value] of Object.entries(getPreviewHeaders())) response.headers.set(name, value)
}

// A canonical URL is emitted only when a real published page exists. This check uses the ordinary
// published-only client, so it never reveals draft data.
export async function resolvePublicCanonical(
  kind: PreviewKind,
  document: {slug?: string; language?: string},
): Promise<URL | undefined> {
  if (!document.slug || !document.language) return undefined

  const exists = await sanityClient
    .fetch<boolean>(kind === 'news' ? NEWS_PUBLIC_ROUTE_EXISTS_QUERY : GUIDE_PUBLIC_ROUTE_EXISTS_QUERY, {
      slug: document.slug,
      language: document.language,
    })
    .catch(() => false)

  const section = kind === 'news' ? 'news' : 'info'
  return exists
    ? new URL(`/${document.language}/${section}/${document.slug}/`, PREVIEW_FRONTEND_ORIGIN)
    : undefined
}
