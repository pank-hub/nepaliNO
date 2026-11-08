import {isSectionEnabled} from '../../config/languageSections.ts'
import type {JourneyRequest, TravelCoordinates} from './types.ts'
import {isDateTime, isRecord, parseCoordinates} from './validation.ts'

// This is also used to decide whether a prerendered page may offer travel
// help. The journey endpoint still fetches and checks the published document.
export function eligibleDestinationCoordinates(
  selector: JourneyRequest['destination'],
  document: unknown,
  now = Date.now(),
): TravelCoordinates | undefined {
  if (!isRecord(document) || document._id !== selector.id || document._type !== selector.type ||
    (document.language !== 'ne' && document.language !== 'nb') ||
    typeof document.slug !== 'string' || !document.slug.trim() ||
    document.travelHelpEnabled !== true) return
  if (selector.type === 'communityEvent') {
    if (!isSectionEnabled(document.language, 'events') ||
      !['in-person', 'hybrid'].includes(String(document.eventFormat)) ||
      !['scheduled', 'rescheduled'].includes(String(document.eventStatus))) return
  } else if (selector.type === 'directoryListing') {
    if (!isSectionEnabled(document.language, 'directory') ||
      !['physical', 'physical-and-online'].includes(String(document.presenceType)) ||
      document.listingStatus !== 'active' || !isDateTime(document.publishedAt) ||
      Date.parse(document.publishedAt) > now) return
  } else return
  const location = document.mapLocation
  if (!isRecord(location) || location.precision !== 'exact' || location.hasRadius !== false) return
  return parseCoordinates(location.coordinates)
}
