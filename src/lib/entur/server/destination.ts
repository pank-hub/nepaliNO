import {createClient} from '@sanity/client'
import {isSectionEnabled} from '../../../config/languageSections.ts'
import type {JourneyRequest, TravelCoordinates} from '../types.ts'
import {isDateTime, isRecord, parseCoordinates} from '../validation.ts'
import {RequestError} from './http.ts'

// Only the public editorial dataset; never use the submissions dataset or a Viewer token.
const client = createClient({
  projectId: 'f9johco4',
  dataset: 'production',
  apiVersion: '2026-03-01',
  perspective: 'published',
  useCdn: false,
})

const QUERIES = {
  communityEvent: `*[_id == $id && _type == "communityEvent"][0] {
    _id, _type, language, "slug": slug.current, eventFormat, eventStatus, travelHelpEnabled,
    mapLocation {precision, "hasRadius": defined(radiusMeters), coordinates {lat, lng}}
  }`,
  directoryListing: `*[_id == $id && _type == "directoryListing"][0] {
    _id, _type, language, "slug": slug.current, presenceType, listingStatus, publishedAt, travelHelpEnabled,
    mapLocation {precision, "hasRadius": defined(radiusMeters), coordinates {lat, lng}}
  }`,
} as const

type Selector = JourneyRequest['destination']
type PublicReader = {
  fetch: (query: string, params: {id: string}, options: {signal: AbortSignal}) => Promise<unknown>
}

export async function resolveDestination(
  selector: Selector,
  reader: PublicReader = client,
  now = Date.now(),
): Promise<TravelCoordinates> {
  let document: unknown
  try {
    document = await reader.fetch(QUERIES[selector.type], {id: selector.id}, {
      signal: AbortSignal.timeout(8_000),
    })
  } catch {
    throw new RequestError('destination_service_unavailable', 503)
  }
  const unavailable = () => { throw new RequestError('destination_unavailable', 404) }
  if (!isRecord(document) || document._id !== selector.id || document._type !== selector.type ||
    (document.language !== 'ne' && document.language !== 'nb') ||
    typeof document.slug !== 'string' || !document.slug.trim()) return unavailable()
  if (document.travelHelpEnabled !== true) return unavailable()
  if (selector.type === 'communityEvent') {
    if (!isSectionEnabled(document.language, 'events') ||
      !['in-person', 'hybrid'].includes(String(document.eventFormat)) ||
      !['scheduled', 'rescheduled'].includes(String(document.eventStatus))) return unavailable()
  } else {
    if (!isSectionEnabled(document.language, 'directory') ||
      !['physical', 'physical-and-online'].includes(String(document.presenceType)) ||
      document.listingStatus !== 'active' || !isDateTime(document.publishedAt) ||
      Date.parse(document.publishedAt) > now) return unavailable()
  }
  const location = document.mapLocation
  if (!isRecord(location) || location.precision !== 'exact' || location.hasRadius !== false) return unavailable()
  const coordinates = parseCoordinates(location.coordinates)
  return coordinates ?? unavailable()
}
