import type {APIRoute} from 'astro'
import {PREVIEW_COOKIE_NAME} from '../../../lib/preview/config.ts'
import {getPreviewHeaders} from '../../../lib/preview/loader.ts'

export const prerender = false

const SAFE_DESTINATION = '/ne/'

// Expires both cookie variants: the normal one (Lax, same-site Studio) and the partitioned
// SameSite=None one used by the temporary cross-site Studio. Astro's cookie jar holds one entry
// per name, so the two Set-Cookie headers are written directly.
const expired = (attributes: string) =>
  `${PREVIEW_COOKIE_NAME}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; ${attributes}`

// Redirects to a fixed destination. No query parameter is honoured and no draft query is made.
export const GET: APIRoute = () => {
  const headers = new Headers({...getPreviewHeaders(), Location: SAFE_DESTINATION})
  headers.append('Set-Cookie', expired('SameSite=Lax'))
  headers.append('Set-Cookie', expired('SameSite=None; Partitioned'))

  return new Response(null, {status: 307, headers})
}
