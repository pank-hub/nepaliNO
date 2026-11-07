import {validateCoordinates} from '../../src/lib/maps/location.ts'

export function validateTravelHelp(
  value: boolean | undefined,
  document: Record<string, unknown> | undefined,
  kind: 'event' | 'directory',
): true | string {
  if (value !== true) return true
  const physical = kind === 'event'
    ? document?.eventFormat === 'in-person' || document?.eventFormat === 'hybrid'
    : document?.presenceType === 'physical' || document?.presenceType === 'physical-and-online'
  if (!physical) return 'Travel help requires a public physical location.'
  const location = document?.mapLocation
  if (!location || typeof location !== 'object' || Array.isArray(location)) {
    return 'Choose an exact public map location before enabling travel help.'
  }
  const map = location as Record<string, unknown>
  const coordinates = map.coordinates
  if (map.precision !== 'exact' || map.radiusMeters != null ||
    !coordinates || typeof coordinates !== 'object' || Array.isArray(coordinates)) {
    return 'Travel help requires an exact map pin without an approximate radius.'
  }
  const point = coordinates as Record<string, unknown>
  if (typeof point.lat !== 'number' || typeof point.lng !== 'number' ||
    validateCoordinates({lat: point.lat, lng: point.lng})) {
    return 'Choose valid coordinates for the exact public location.'
  }
  return true
}
