import {createClient} from '@sanity/client'
import {eligibleDestinationCoordinates} from '../eligibility.ts'
import {selectedMapPlace} from '../mapDestination.ts'
import {isDateTime, isRecord, parseCoordinates, parseDestinationSelector} from '../validation.ts'
import {isSectionEnabled, type SiteSection} from '../../../config/languageSections.ts'
import type {LocationMapBlock} from '../../maps/location.ts'
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
  newsArticle: `*[_id == $id && _type == "newsArticle"][0] {
    _id, _type, language, "slug": slug.current, publishedAt, body[] {
      _type, _key, travelHelpEnabled, travelHelpPlaceKey,
      locations[] { ... }
    }
  }`,
  publicInformationGuide: `*[_id == $id && _type == "publicInformationGuide"][0] {
    _id, _type, language, "slug": slug.current, status, body[] {
      _type, _key, travelHelpEnabled, travelHelpPlaceKey,
      locations[] { ... }
    }
  }`,
} as const

type Selector = JourneyRequest['destination']
type Adapter = {
  query: string
  resolve: (selector: Selector, document: unknown, now: number) => TravelCoordinates | undefined
}

export const mapAdapter = (
  query: string,
  section: SiteSection,
  isPublic: (document: Record<string, unknown>, now: number) => boolean,
): Adapter => ({
  query,
  resolve: (selector, document, now) => {
    if (!('mapKey' in selector) || !isRecord(document) || document._id !== selector.id ||
      document._type !== selector.type || (document.language !== 'ne' && document.language !== 'nb') ||
      !isSectionEnabled(document.language, section) || !isPublic(document, now) ||
      typeof document.slug !== 'string' || !document.slug.trim() || !Array.isArray(document.body)) return
    const blocks = document.body.filter((block: unknown) =>
      isRecord(block) && block._type === 'locationMap' && block._key === selector.mapKey)
    if (blocks.length !== 1) return
    const place = selectedMapPlace(blocks[0] as LocationMapBlock)
    if (!place || place._key !== selector.placeKey || !place.coordinates) return
    return parseCoordinates({lat: place.coordinates.lat, lng: place.coordinates.lng})
  },
})

// Each type is explicitly registered and validates the same public eligibility as its page.
const adapters: Record<Selector['type'], Adapter> = {
  communityEvent: {query: QUERIES.communityEvent, resolve: eligibleDestinationCoordinates},
  directoryListing: {query: QUERIES.directoryListing, resolve: eligibleDestinationCoordinates},
  newsArticle: mapAdapter(QUERIES.newsArticle, 'news', (document, now) =>
    isDateTime(document.publishedAt) && Date.parse(document.publishedAt) <= now),
  publicInformationGuide: mapAdapter(QUERIES.publicInformationGuide, 'information',
    (document) => document.status === 'active'),
}
type PublicReader = {
  fetch: (query: string, params: {id: string}, options: {signal: AbortSignal}) => Promise<unknown>
}

export async function resolveDestination(
  selector: Selector,
  reader: PublicReader = client,
  now = Date.now(),
): Promise<TravelCoordinates> {
  const parsed = parseDestinationSelector(selector)
  if (!parsed) throw new RequestError('destination_unavailable', 404)
  const adapter = adapters[parsed.type]
  let document: unknown
  try {
    document = await reader.fetch(adapter.query, {id: parsed.id}, {
      signal: AbortSignal.timeout(8_000),
    })
  } catch {
    throw new RequestError('destination_service_unavailable', 503)
  }
  const coordinates = adapter.resolve(parsed, document, now)
  if (!coordinates) throw new RequestError('destination_unavailable', 404)
  return coordinates
}
