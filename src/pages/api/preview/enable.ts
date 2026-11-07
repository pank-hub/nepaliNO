import type {APIRoute} from 'astro'
import {sanityClient} from 'sanity:client'
import {
  PREVIEW_COOKIE_MAX_AGE_SECONDS,
  PREVIEW_COOKIE_NAME,
  createPreviewCookieValue,
  decideStudioOrigin,
  getPreviewConfig,
  sanitizePreviewRedirect,
} from '../../../lib/preview/config.ts'
import {getPreviewEnv, getPreviewHeaders, getStudioOriginOptions} from '../../../lib/preview/loader.ts'
import {validateEnableRequest} from '../../../lib/preview/validateEnable.ts'

export const prerender = false

const respond = (status: number, headers: Record<string, string> = {}) =>
  new Response(null, {status, headers: {...getPreviewHeaders(), ...headers}})

export const GET: APIRoute = async ({request, cookies}) => {
  // Fail closed and do not reveal whether preview exists when it is not configured.
  const config = getPreviewConfig(getPreviewEnv())
  if (!config) {
    return respond(404)
  }

  // The token client is used only to read Studio-created preview secrets. It is never exposed.
  const client = sanityClient.withConfig({token: config.token, useCdn: false})
  const result = await validateEnableRequest(client, request.url)
  if (!result.ok) {
    return respond(401)
  }
  const {validation} = result

  const redirectTo = sanitizePreviewRedirect(validation.redirectTo)
  if (!redirectTo) {
    return respond(400)
  }

  const decision = decideStudioOrigin(validation.studioOrigin, getStudioOriginOptions())
  if (!decision.allowed) {
    if (import.meta.env.DEV) {
      return new Response(
        `Studio origin ${validation.studioOrigin} is not approved for preview. Set PREVIEW_DEV_STUDIO_ORIGIN in the root .env to this exact origin and restart astro dev.`,
        {status: 403, headers: {...getPreviewHeaders(), 'Content-Type': 'text/plain; charset=utf-8'}},
      )
    }
    return respond(403)
  }

  cookies.set(PREVIEW_COOKIE_NAME, await createPreviewCookieValue(config.cookieSecret), {
    httpOnly: true,
    secure: true,
    sameSite: decision.sameSite,
    // A cross-site (vercel.app) Studio iframe needs SameSite=None; partition it to this embedding.
    partitioned: decision.sameSite === 'none',
    path: '/',
    maxAge: PREVIEW_COOKIE_MAX_AGE_SECONDS,
  })

  return respond(307, {Location: redirectTo})
}
