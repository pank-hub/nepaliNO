export function isOpenStreetMapUrl(value: string | undefined): boolean {
  if (!value) return false
  try {
    const host = new URL(value, 'https://nepali.no').hostname.toLowerCase().replace(/\.$/, '')
    return host === 'openstreetmap.org' || host.endsWith('.openstreetmap.org')
  } catch {
    return false
  }
}
