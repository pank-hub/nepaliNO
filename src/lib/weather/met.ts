import type {
  NormalizedYrWeatherBlock,
  WeatherCurrent,
  WeatherDayForecast,
  WeatherLocationConfig,
  WeatherLocationForecast,
  YrWeatherBlockInput,
} from './types.ts'

export const MET_API_BASE = 'https://api.met.no/weatherapi/locationforecast/2.0/compact'
export const MET_USER_AGENT = 'nepali.no/1.0 (https://nepali.no; kontakt@nepali.no)'
export const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search'

const NORDIC_CACHE_MS = 30 * 60 * 1000
const GLOBAL_CACHE_MS = 60 * 60 * 1000
const FETCH_TIMEOUT_MS = 8000
const MAX_FORECAST_DAYS = 9

export function roundMetCoord(value: number): number {
  return Math.round(value * 10_000) / 10_000
}

export function isValidCoordinatePair(lat: unknown, lon: unknown): boolean {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  )
}

export function isIsoDateString(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())
}

export function resolveTimezone(timezone: unknown, lat: number, lon: number): string {
  if (typeof timezone === 'string' && timezone.trim()) {
    try {
      new Intl.DateTimeFormat('en-CA', {timeZone: timezone.trim()})
      return timezone.trim()
    } catch {
      // Fallback below
    }
  }
  if (lat >= 26 && lat <= 31 && lon >= 80 && lon <= 89) return 'Asia/Kathmandu'
  return 'Europe/Oslo'
}

function getLocalDateAndHour(isoTime: string, timeZone: string): {date: string; hour: number} | null {
  const parsed = Date.parse(isoTime)
  if (!Number.isFinite(parsed)) return null
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(new Date(parsed))
  const map: Record<string, string> = {}
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = part.value
  }
  if (!map.year || !map.month || !map.day) return null
  const hourNum = Number(map.hour === '24' ? '0' : map.hour)
  return {
    date: `${map.year}-${map.month}-${map.day}`,
    hour: Number.isFinite(hourNum) ? hourNum : 12,
  }
}

interface MetTimeseriesEntry {
  time?: string
  data?: {
    instant?: {
      details?: {
        air_temperature?: number
        wind_speed?: number
      }
    }
    next_1_hours?: {
      summary?: {symbol_code?: string}
      details?: {precipitation_amount?: number}
    }
    next_6_hours?: {
      summary?: {symbol_code?: string}
      details?: {precipitation_amount?: number}
    }
  }
}

interface MetForecastPayload {
  properties?: {
    timeseries?: MetTimeseriesEntry[]
  }
}

export function aggregateLocationforecast(
  payload: unknown,
  options: {
    key: string
    label: string
    shortLabel?: string
    lat: number
    lon: number
    timezone?: string
    startDate?: string
    endDate?: string
    nowMs?: number
  },
): WeatherLocationForecast {
  const lat = roundMetCoord(options.lat)
  const lon = roundMetCoord(options.lon)
  const timezone = resolveTimezone(options.timezone, lat, lon)
  const nowMs = options.nowMs ?? Date.now()
  const rawSeries = Array.isArray((payload as MetForecastPayload | null)?.properties?.timeseries)
    ? ((payload as MetForecastPayload).properties!.timeseries as MetTimeseriesEntry[])
    : []

  const sorted = rawSeries
    .filter((entry) => typeof entry?.time === 'string' && Number.isFinite(Date.parse(entry.time)))
    .sort((a, b) => Date.parse(a.time!) - Date.parse(b.time!))

  let current: WeatherCurrent | undefined
  let bestDelta = Infinity
  for (const entry of sorted) {
    const ms = Date.parse(entry.time!)
    const delta = Math.abs(ms - nowMs)
    if (delta < bestDelta && ms >= nowMs - 90 * 60 * 1000) {
      bestDelta = delta
      const instant = entry.data?.instant?.details
      const next1h = entry.data?.next_1_hours
      const next6h = entry.data?.next_6_hours
      current = {
        time: entry.time!,
        temperature:
          typeof instant?.air_temperature === 'number' && Number.isFinite(instant.air_temperature)
            ? Math.round(instant.air_temperature * 10) / 10
            : null,
        windSpeedMs:
          typeof instant?.wind_speed === 'number' && Number.isFinite(instant.wind_speed)
            ? Math.round(instant.wind_speed * 10) / 10
            : null,
        precipitationNext1h:
          typeof next1h?.details?.precipitation_amount === 'number' &&
          Number.isFinite(next1h.details.precipitation_amount)
            ? Math.round(next1h.details.precipitation_amount * 10) / 10
            : null,
        symbolCode: next1h?.summary?.symbol_code ?? next6h?.summary?.symbol_code ?? null,
      }
    }
  }

  interface DayAcc {
    temps: number[]
    winds: number[]
    precipSum: number
    hasPrecip: boolean
    symbols: {hour: number; code: string}[]
  }
  const byDay = new Map<string, DayAcc>()
  let lastCoveredEndMs = -Infinity

  for (const entry of sorted) {
    const local = getLocalDateAndHour(entry.time!, timezone)
    if (!local) continue
    const entryMs = Date.parse(entry.time!)
    let acc = byDay.get(local.date)
    if (!acc) {
      acc = {temps: [], winds: [], precipSum: 0, hasPrecip: false, symbols: []}
      byDay.set(local.date, acc)
    }

    const instant = entry.data?.instant?.details
    if (typeof instant?.air_temperature === 'number' && Number.isFinite(instant.air_temperature)) {
      acc.temps.push(instant.air_temperature)
    }
    if (typeof instant?.wind_speed === 'number' && Number.isFinite(instant.wind_speed)) {
      acc.winds.push(instant.wind_speed)
    }

    const n1 = entry.data?.next_1_hours
    const n6 = entry.data?.next_6_hours
    if (n1 && entryMs >= lastCoveredEndMs) {
      if (typeof n1.details?.precipitation_amount === 'number' && Number.isFinite(n1.details.precipitation_amount)) {
        acc.precipSum += n1.details.precipitation_amount
        acc.hasPrecip = true
      }
      lastCoveredEndMs = entryMs + 3600_000
    } else if (n6 && entryMs >= lastCoveredEndMs) {
      if (typeof n6.details?.precipitation_amount === 'number' && Number.isFinite(n6.details.precipitation_amount)) {
        acc.precipSum += n6.details.precipitation_amount
        acc.hasPrecip = true
      }
      lastCoveredEndMs = entryMs + 6 * 3600_000
    }

    const symbol = n1?.summary?.symbol_code ?? n6?.summary?.symbol_code
    if (typeof symbol === 'string' && symbol.trim()) {
      acc.symbols.push({hour: local.hour, code: symbol.trim()})
    }
  }

  const startDate = isIsoDateString(options.startDate) ? options.startDate.trim() : undefined
  const endDate = isIsoDateString(options.endDate) ? options.endDate.trim() : undefined

  const days: WeatherDayForecast[] = []
  for (const date of Array.from(byDay.keys()).sort()) {
    if (startDate && date < startDate) continue
    if (endDate && date > endDate) continue
    const acc = byDay.get(date)!
    // Pick symbol closest to 12:00 local time so daily icon represents daytime weather.
    let pickedSymbol: string | null = null
    let bestHourDist = Infinity
    for (const s of acc.symbols) {
      const dist = Math.abs(s.hour - 12)
      if (dist < bestHourDist) {
        bestHourDist = dist
        pickedSymbol = s.code
      }
    }
    days.push({
      date,
      minTemp: acc.temps.length ? Math.round(Math.min(...acc.temps) * 10) / 10 : null,
      maxTemp: acc.temps.length ? Math.round(Math.max(...acc.temps) * 10) / 10 : null,
      precipitationMm: acc.hasPrecip ? Math.round(acc.precipSum * 10) / 10 : null,
      windMaxMs: acc.winds.length ? Math.round(Math.max(...acc.winds) * 10) / 10 : null,
      symbolCode: pickedSymbol,
    })
  }

  return {
    key: options.key,
    label: options.label,
    ...(options.shortLabel ? {shortLabel: options.shortLabel} : {}),
    lat,
    lon,
    timezone,
    ...(current ? {current} : {}),
    days: days.slice(0, MAX_FORECAST_DAYS),
  }
}

interface CacheEntry {
  expiresAt: number
  payload: unknown
}

const forecastCache = new Map<string, CacheEntry>()

function isNordicCoord(lat: number, lon: number): boolean {
  return lat >= 54 && lat <= 72 && lon >= 3 && lon <= 32
}

export async function fetchMetLocationforecastRaw(lat: number, lon: number): Promise<unknown> {
  if (!isValidCoordinatePair(lat, lon)) {
    throw new Error('Invalid coordinates for MET Norway request.')
  }
  const rLat = roundMetCoord(lat)
  const rLon = roundMetCoord(lon)
  const cacheKey = `${rLat.toFixed(4)},${rLon.toFixed(4)}`
  const now = Date.now()
  const cached = forecastCache.get(cacheKey)
  if (cached && cached.expiresAt > now) {
    return cached.payload
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const url = `${MET_API_BASE}?lat=${rLat.toFixed(4)}&lon=${rLon.toFixed(4)}`
    const response = await fetch(url, {
      headers: {
        'User-Agent': MET_USER_AGENT,
        Accept: 'application/json',
      },
      signal: controller.signal,
    })
    if (!response.ok) {
      throw new Error(`MET Norway returned HTTP ${response.status}`)
    }
    const payload = await response.json()
    const ttl = isNordicCoord(rLat, rLon) ? NORDIC_CACHE_MS : GLOBAL_CACHE_MS
    forecastCache.set(cacheKey, {expiresAt: now + ttl, payload})
    return payload
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchWeatherForLocations(
  locations: WeatherLocationConfig[],
  options: {startDate?: string; endDate?: string; nowMs?: number} = {},
): Promise<WeatherLocationForecast[]> {
  const valid = locations.filter((loc) => isValidCoordinatePair(loc.lat, loc.lon)).slice(0, 8)
  return Promise.all(
    valid.map(async (loc, index) => {
      const payload = await fetchMetLocationforecastRaw(loc.lat, loc.lon)
      return aggregateLocationforecast(payload, {
        key: loc._key || `loc-${index + 1}`,
        label: (loc.label || loc.shortLabel || `Location ${index + 1}`).trim(),
        shortLabel: loc.shortLabel?.trim() || undefined,
        lat: loc.lat,
        lon: loc.lon,
        timezone: loc.timezone,
        startDate: options.startDate,
        endDate: options.endDate,
        nowMs: options.nowMs,
      })
    }),
  )
}

export interface PlaceSearchResult {
  label: string
  shortLabel: string
  lat: number
  lon: number
  timezone: string
}

export async function searchWeatherPlaces(query: string): Promise<PlaceSearchResult[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const url = `${NOMINATIM_SEARCH_URL}?format=jsonv2&limit=6&q=${encodeURIComponent(trimmed)}`
    const response = await fetch(url, {
      headers: {
        'User-Agent': MET_USER_AGENT,
        Accept: 'application/json',
      },
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`Place search failed (${response.status})`)
    const items = (await response.json()) as Array<{
      display_name?: string
      name?: string
      lat?: string
      lon?: string
    }>
    if (!Array.isArray(items)) return []
    return items.flatMap((item) => {
      const lat = Number(item.lat)
      const lon = Number(item.lon)
      if (!isValidCoordinatePair(lat, lon)) return []
      const short = (item.name || item.display_name?.split(',')[0] || trimmed).trim()
      const label = (item.display_name || short).split(',').slice(0, 2).join(', ').trim()
      return [
        {
          label,
          shortLabel: short,
          lat: roundMetCoord(lat),
          lon: roundMetCoord(lon),
          timezone: resolveTimezone(undefined, lat, lon),
        },
      ]
    })
  } finally {
    clearTimeout(timer)
  }
}

export function normalizeYrWeatherBlock(input: unknown): NormalizedYrWeatherBlock {
  const src = (typeof input === 'object' && input !== null ? input : {}) as YrWeatherBlockInput
  const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined)

  const mode = src.mode === 'live' ? 'live' : 'snapshot'
  const viewMode = src.viewMode === 'table' ? 'table' : 'cards'
  const startDate = isIsoDateString(src.startDate) ? src.startDate.trim() : undefined
  const endDate = isIsoDateString(src.endDate) ? src.endDate.trim() : undefined

  const locations: WeatherLocationConfig[] = Array.isArray(src.locations)
    ? src.locations.flatMap((item, idx) => {
        if (!item || typeof item !== 'object') return []
        const loc = item as Record<string, unknown>
        const lat = Number(loc.lat)
        const lon = Number(loc.lon)
        if (!isValidCoordinatePair(lat, lon)) return []
        const label = text(loc.label) ?? text(loc.shortLabel) ?? `Location ${idx + 1}`
        return [
          {
            _key: text(loc._key) ?? `loc-${idx + 1}`,
            label,
            shortLabel: text(loc.shortLabel),
            lat: roundMetCoord(lat),
            lon: roundMetCoord(lon),
            timezone: resolveTimezone(loc.timezone, lat, lon),
          },
        ]
      })
    : []

  const snapshotLocations: WeatherLocationForecast[] = Array.isArray(src.snapshotLocations)
    ? src.snapshotLocations.flatMap((item, idx) => {
        if (!item || typeof item !== 'object') return []
        const loc = item as Record<string, unknown>
        const lat = Number(loc.lat)
        const lon = Number(loc.lon)
        if (!isValidCoordinatePair(lat, lon)) return []
        const days: WeatherDayForecast[] = Array.isArray(loc.days)
          ? loc.days.flatMap((d) => {
              if (!d || typeof d !== 'object') return []
              const day = d as Record<string, unknown>
              if (!isIsoDateString(day.date)) return []
              if (startDate && day.date < startDate) return []
              if (endDate && day.date > endDate) return []
              return [
                {
                  date: day.date,
                  minTemp: typeof day.minTemp === 'number' && Number.isFinite(day.minTemp) ? day.minTemp : null,
                  maxTemp: typeof day.maxTemp === 'number' && Number.isFinite(day.maxTemp) ? day.maxTemp : null,
                  precipitationMm:
                    typeof day.precipitationMm === 'number' && Number.isFinite(day.precipitationMm)
                      ? day.precipitationMm
                      : null,
                  windMaxMs:
                    typeof day.windMaxMs === 'number' && Number.isFinite(day.windMaxMs) ? day.windMaxMs : null,
                  symbolCode: text(day.symbolCode) ?? null,
                },
              ]
            })
          : []
        const curRaw =
          loc.current && typeof loc.current === 'object' ? (loc.current as Record<string, unknown>) : null
        const current: WeatherCurrent | undefined = curRaw
          ? {
              time: text(curRaw.time) ?? '',
              temperature:
                typeof curRaw.temperature === 'number' && Number.isFinite(curRaw.temperature)
                  ? curRaw.temperature
                  : null,
              windSpeedMs:
                typeof curRaw.windSpeedMs === 'number' && Number.isFinite(curRaw.windSpeedMs)
                  ? curRaw.windSpeedMs
                  : null,
              precipitationNext1h:
                typeof curRaw.precipitationNext1h === 'number' &&
                Number.isFinite(curRaw.precipitationNext1h)
                  ? curRaw.precipitationNext1h
                  : null,
              symbolCode: text(curRaw.symbolCode) ?? null,
            }
          : undefined
        return [
          {
            key: text(loc.key) ?? `loc-${idx + 1}`,
            label: text(loc.label) ?? text(loc.shortLabel) ?? `Location ${idx + 1}`,
            shortLabel: text(loc.shortLabel),
            lat: roundMetCoord(lat),
            lon: roundMetCoord(lon),
            timezone: resolveTimezone(loc.timezone, lat, lon),
            ...(current ? {current} : {}),
            days,
          },
        ]
      })
    : []

  return {
    title: text(src.title),
    subtitle: text(src.subtitle),
    mode,
    viewMode,
    startDate,
    endDate,
    locations,
    showPrecipitation: src.showPrecipitation !== false,
    showWind: src.showWind === true,
    note: text(src.note),
    fetchedAt: text(src.fetchedAt),
    snapshotLocations,
  }
}
