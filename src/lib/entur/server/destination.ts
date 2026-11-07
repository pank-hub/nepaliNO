import {createClient} from '@sanity/client'
import {eligibleDestinationCoordinates} from '../eligibility.ts'
import type {JourneyRequest, TravelCoordinates} from '../types.ts'
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

// TEMPORARY (PR #112 hosted acceptance): remove with src/pages/dev/entur-acceptance.astro before merge.
// Entur NSR:StopPlace:59872 "Oslo S, Oslo", verified once with the Entur Geocoder.
export const PREVIEW_ACCEPTANCE_DESTINATION_ID = 'preview-acceptance-oslo'
const PREVIEW_ACCEPTANCE_COORDINATES: TravelCoordinates = {lat: 59.910357, lng: 10.753051}
const deploymentEnvironment = (): string | undefined => import.meta.env?.VERCEL_ENV

type Selector = JourneyRequest['destination']
type PublicReader = {
  fetch: (query: string, params: {id: string}, options: {signal: AbortSignal}) => Promise<unknown>
}

export async function resolveDestination(
  selector: Selector,
  reader: PublicReader = client,
  now = Date.now(),
  environment: string | undefined = deploymentEnvironment(),
): Promise<TravelCoordinates> {
  if (environment === 'preview' && selector.type === 'directoryListing' &&
    selector.id === PREVIEW_ACCEPTANCE_DESTINATION_ID) return {...PREVIEW_ACCEPTANCE_COORDINATES}
  let document: unknown
  try {
    document = await reader.fetch(QUERIES[selector.type], {id: selector.id}, {
      signal: AbortSignal.timeout(8_000),
    })
  } catch {
    throw new RequestError('destination_service_unavailable', 503)
  }
  const coordinates = eligibleDestinationCoordinates(selector, document, now)
  if (!coordinates) throw new RequestError('destination_unavailable', 404)
  return coordinates
}
