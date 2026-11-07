import type {Journey, JourneyLeg, ResolvedJourneyRequest, OriginSuggestion, TransportMode} from '../types.ts'
import {isDateTime, isRecord, parseCoordinates} from '../validation.ts'
import {ENTUR} from './config.ts'
import {fetchEntur, RequestError} from './http.ts'

const JOURNEY_QUERY = `
  query TravelAssistance($from: Location!, $to: Location!, $dateTime: DateTime!, $arriveBy: Boolean!) {
    trip(from: $from, to: $to, dateTime: $dateTime, arriveBy: $arriveBy,
      numTripPatterns: 3, modes: {accessMode: foot, egressMode: foot, directMode: foot}) {
      tripPatterns {
        expectedStartTime expectedEndTime duration walkTime
        legs {
          expectedStartTime expectedEndTime duration mode ride realtime
          fromPlace { name }
          toPlace { name }
          line { publicCode name }
        }
      }
    }
  }
`

const invalidResponse = (): never => { throw new RequestError('upstream_invalid_response', 502) }
const MODES: readonly TransportMode[] = [
  'air', 'bicycle', 'bus', 'cableway', 'water', 'funicular', 'lift', 'rail',
  'snowAndIce', 'metro', 'taxi', 'tram', 'trolleybus', 'monorail', 'coach',
  'foot', 'car', 'scooter', 'carpool',
]
const NON_TRANSIT_MODES: readonly TransportMode[] = ['bicycle', 'foot', 'car', 'scooter', 'carpool']
const optionalText = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined
  if (typeof value !== 'string' || value.length > 500) return invalidResponse()
  return value.trim() || undefined
}
const requiredText = (value: unknown): string => optionalText(value) || invalidResponse()
const nonnegativeNumber = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return invalidResponse()
  return value
}
const time = (value: unknown): string => isDateTime(value) ? value : invalidResponse()
const transportMode = (value: unknown): TransportMode => {
  const found = MODES.find((mode) => mode === value)
  return found ?? invalidResponse()
}
const timeRange = (start: unknown, end: unknown) => {
  const startTime = time(start), endTime = time(end)
  const milliseconds = Date.parse(endTime) - Date.parse(startTime)
  if (milliseconds < 0) return invalidResponse()
  return {startTime, endTime, durationSeconds: milliseconds / 1000}
}

export async function searchOrigins(query: string): Promise<OriginSuggestion[]> {
  const url = new URL(ENTUR.geocoderUrl)
  url.searchParams.set('q', query)
  url.searchParams.set('limit', String(ENTUR.maxSuggestions))
  const data = await fetchEntur(url.toString(), {
    headers: {accept: 'application/json', 'ET-Client-Name': ENTUR.clientName},
  })
  if (!isRecord(data) || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) return invalidResponse()
  return data.features.slice(0, ENTUR.maxSuggestions).map((feature: unknown) => {
    if (!isRecord(feature) || feature.type !== 'Feature' || !isRecord(feature.geometry) ||
      feature.geometry.type !== 'Point' || !Array.isArray(feature.geometry.coordinates) ||
      feature.geometry.coordinates.length < 2 || !isRecord(feature.properties)) return invalidResponse()
    const [lng, lat] = feature.geometry.coordinates
    const coordinates = parseCoordinates({lat, lng})
    const properties = feature.properties
    if (!coordinates || !isRecord(properties.names)) return invalidResponse()
    const label = optionalText(properties.names.display) ?? requiredText(properties.names.default)
    if (properties.address != null && !isRecord(properties.address)) return invalidResponse()
    const address = isRecord(properties.address) ? properties.address : undefined
    return {
      label, coordinates,
      id: optionalText(properties.id),
      locality: optionalText(address?.locality),
      category: optionalText(properties.layer),
    }
  })
}

function normalizeLeg(value: unknown): JourneyLeg {
  if (!isRecord(value) || !isRecord(value.fromPlace) || !isRecord(value.toPlace) ||
    typeof value.ride !== 'boolean' || typeof value.realtime !== 'boolean' ||
    (value.line != null && !isRecord(value.line))) return invalidResponse()
  const line = isRecord(value.line) ? value.line : undefined
  const range = timeRange(value.expectedStartTime, value.expectedEndTime)
  const mode = transportMode(value.mode)
  return {
    startTime: range.startTime,
    endTime: range.endTime,
    durationSeconds: nonnegativeNumber(value.duration),
    mode,
    fromName: optionalText(value.fromPlace.name),
    toName: optionalText(value.toPlace.name),
    isPublicTransport: value.ride && !NON_TRANSIT_MODES.includes(mode),
    realtime: value.realtime,
    lineName: optionalText(line?.publicCode) ?? optionalText(line?.name),
  }
}

function normalizeJourney(value: unknown): Journey {
  if (!isRecord(value) || !Array.isArray(value.legs) || value.legs.length === 0 || value.legs.length > 40) return invalidResponse()
  const legs = value.legs.map(normalizeLeg)
  const range = timeRange(value.expectedStartTime, value.expectedEndTime)
  return {
    startTime: range.startTime,
    endTime: range.endTime,
    durationSeconds: value.duration == null ? range.durationSeconds : nonnegativeNumber(value.duration),
    transfers: Math.max(0, legs.filter((leg) => leg.isPublicTransport).length - 1),
    walkingDurationSeconds: value.walkTime == null ? undefined : nonnegativeNumber(value.walkTime),
    legs,
  }
}

export async function planJourney(request: ResolvedJourneyRequest): Promise<Journey[]> {
  const data = await fetchEntur(ENTUR.journeyUrl, {
    method: 'POST',
    headers: {accept: 'application/json', 'content-type': 'application/json', 'ET-Client-Name': ENTUR.clientName},
    body: JSON.stringify({
      query: JOURNEY_QUERY,
      variables: {
        from: {coordinates: {latitude: request.origin.lat, longitude: request.origin.lng}},
        to: {coordinates: {latitude: request.destination.lat, longitude: request.destination.lng}},
        dateTime: request.dateTime,
        arriveBy: request.mode === 'arriveBy',
      },
    }),
  })
  if (!isRecord(data)) return invalidResponse()
  if (data.errors !== undefined) {
    if (!Array.isArray(data.errors)) return invalidResponse()
    if (data.errors.length > 0) throw new RequestError('upstream_graphql_error', 502)
  }
  if (!isRecord(data.data) || !isRecord(data.data.trip) || !Array.isArray(data.data.trip.tripPatterns)) return invalidResponse()
  const journeys = data.data.trip.tripPatterns.slice(0, ENTUR.maxJourneys).map(normalizeJourney)
  if (journeys.length === 0) throw new RequestError('no_journeys', 404)
  return journeys
}
