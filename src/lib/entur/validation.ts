import {validateCoordinates} from '../maps/location.ts'
import type {JourneyRequest, TravelCoordinates} from './types.ts'

export const MAX_QUERY_LENGTH = 100
export const MAX_HORIZON_MS = 90 * 24 * 60 * 60 * 1000
export const PAST_TOLERANCE_MS = 5 * 60 * 1000

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

export const hasOnlyKeys = (value: Record<string, unknown>, keys: string[]) =>
  Object.keys(value).every((key) => keys.includes(key))

export function parseOriginQuery(value: unknown): string | undefined {
  if (!isRecord(value) || !hasOnlyKeys(value, ['query']) || typeof value.query !== 'string') return
  const query = value.query.normalize('NFC').trim().replace(/\s+/gu, ' ')
  if (query.length < 2 || query.length > MAX_QUERY_LENGTH || /[\u0000-\u001f\u007f-\u009f]/u.test(query)) return
  return query
}

export function parseCoordinates(value: unknown): TravelCoordinates | undefined {
  if (!isRecord(value) || !hasOnlyKeys(value, ['lat', 'lng'])) return
  if (typeof value.lat !== 'number' || typeof value.lng !== 'number') return
  const coordinates = {lat: value.lat, lng: value.lng}
  return validateCoordinates(coordinates) ? undefined : coordinates
}

export function isDateTime(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/.exec(value)
  if (!match) return false
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, zone] = match
  const year = Number(yearText), month = Number(monthText), day = Number(dayText)
  const hour = Number(hourText), minute = Number(minuteText), second = Number(secondText)
  if (year < 1000 || month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) return false
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  if (day < 1 || day > daysInMonth) return false
  if (zone !== 'Z') {
    const zoneHours = Number(zone.slice(1, 3)), zoneMinutes = Number(zone.slice(4, 6))
    if (zoneHours > 14 || zoneMinutes > 59 || (zoneHours === 14 && zoneMinutes !== 0)) return false
  }
  return Number.isFinite(Date.parse(value))
}

export function parseDestinationSelector(value: unknown): JourneyRequest['destination'] | undefined {
  if (!isRecord(value) || !hasOnlyKeys(value, ['type', 'id']) ||
    (value.type !== 'communityEvent' && value.type !== 'directoryListing') ||
    typeof value.id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value.id)) return
  return {type: value.type, id: value.id}
}

export function parseJourneyRequest(value: unknown, now = Date.now()): JourneyRequest | undefined {
  if (!isRecord(value) || !hasOnlyKeys(value, ['origin', 'destination', 'dateTime', 'mode'])) return
  const origin = parseCoordinates(value.origin)
  const destination = parseDestinationSelector(value.destination)
  if (!origin || !destination || !isDateTime(value.dateTime)) return
  const time = Date.parse(value.dateTime)
  if (time < now - PAST_TOLERANCE_MS || time > now + MAX_HORIZON_MS) return
  if (value.mode !== 'departAfter' && value.mode !== 'arriveBy') return
  return {origin, destination, dateTime: value.dateTime, mode: value.mode}
}
