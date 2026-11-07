import {createHmac} from 'node:crypto'
import {isIP} from 'node:net'
import type {RateLimitCategory} from './config.ts'

// Trust boundary: Vercel overwrites X-Forwarded-For with the connecting client
// address and does not forward client-supplied values (the Astro Vercel adapter
// derives Astro's clientAddress from the same header). A list, port, bracket or
// zone identifier means the request did not arrive through that boundary, so it is
// rejected instead of guessed at. Outside Vercel (local development, Codespaces)
// the header is absent and limiting fails closed.
export function readClientAddress(request: Request): string | undefined {
  const header = request.headers.get('x-forwarded-for')
  return header === null ? undefined : normalizeClientAddress(header)
}

const hextets = (address: string): string[] | undefined => {
  let text = address.toLowerCase()
  const dotted = /(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(text)
  if (dotted) {
    const [a, b, c, d] = dotted.slice(1).map(Number)
    text = text.slice(0, dotted.index) +
      ((a << 8) | b).toString(16) + ':' + ((c << 8) | d).toString(16)
  }
  const parts = text.split('::')
  if (parts.length > 2) return
  const head = parts[0] ? parts[0].split(':') : []
  const tail = parts[1] ? parts[1].split(':') : []
  const groups = parts.length === 1 ? head : [...head, ...Array<string>(Math.max(0, 8 - head.length - tail.length)).fill('0'), ...tail]
  return groups.length === 8 ? groups.map((group) => group.padStart(4, '0')) : undefined
}

// IPv4 stays whole. IPv4-mapped IPv6 collapses to IPv4. Other IPv6 addresses are
// reduced to their /64 prefix so one subscriber cannot rotate through interface IDs.
export function normalizeClientAddress(value: string): string | undefined {
  const text = value.trim()
  if (text.length === 0 || text.length > 45 || text.includes('%')) return
  const version = isIP(text)
  if (version === 4) return text
  if (version !== 6) return
  const groups = hextets(text)
  if (!groups) return
  if (groups.slice(0, 5).every((group) => group === '0000') && groups[5] === 'ffff') {
    const high = parseInt(groups[6], 16), low = parseInt(groups[7], 16)
    return [high >> 8, high & 255, low >> 8, low & 255].join('.')
  }
  return `${groups.slice(0, 4).join(':')}::/64`
}

// HMAC-SHA-256 over the normalized address and category. Only this hex digest is
// sent to the provider; the secret and the address never leave the server process.
export function createRateLimitIdentifier(address: string, category: RateLimitCategory, secret: string): string {
  return createHmac('sha256', secret).update(`${address}\n${category}`).digest('hex')
}
