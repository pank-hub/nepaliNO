import type {APIRoute} from 'astro'
import {
  fetchWeatherForLocations,
  isIsoDateString,
  isValidCoordinatePair,
  resolveTimezone,
  roundMetCoord,
  searchWeatherPlaces,
} from '../../lib/weather/met.ts'
import {
  findWeatherPreset,
  getWeatherConditionLabel,
  getWeatherIconKind,
  MET_ATTRIBUTION,
} from '../../lib/weather/symbols.ts'
import type {WeatherLanguage, WeatherLocationConfig} from '../../lib/weather/types.ts'

export const prerender = false

function resolveCorsOrigin(request: Request): string | undefined {
  const origin = request.headers.get('origin')
  if (!origin) return undefined
  if (
    origin === 'https://nepali.no' ||
    origin === 'https://www.nepali.no' ||
    origin === 'https://studio.nepali.no' ||
    origin === 'https://nepali-no-studio.vercel.app' ||
    origin === 'https://nepali-no.vercel.app' ||
    origin.endsWith('.sanity.studio') ||
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  ) {
    return origin
  }
  return undefined
}

function makeHeaders(
  request: Request,
  cacheControl: string,
): Record<string, string> {
  const corsOrigin = resolveCorsOrigin(request)
  return {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': cacheControl,
    'x-content-type-options': 'nosniff',
    ...(corsOrigin
      ? {
          'access-control-allow-origin': corsOrigin,
          'access-control-allow-methods': 'GET, POST, OPTIONS',
          'access-control-allow-headers': 'content-type',
          vary: 'Origin',
        }
      : {}),
  }
}

function json(
  request: Request,
  status: number,
  body: Record<string, unknown>,
  cacheControl = 'no-store',
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: makeHeaders(request, cacheControl),
  })
}

function enrichForecasts(
  forecasts: Awaited<ReturnType<typeof fetchWeatherForLocations>>,
  language: WeatherLanguage,
) {
  return forecasts.map((loc) => ({
    ...loc,
    current: loc.current
      ? {
          ...loc.current,
          conditionLabel: getWeatherConditionLabel(loc.current.symbolCode, language),
          iconKind: getWeatherIconKind(loc.current.symbolCode),
        }
      : undefined,
    days: loc.days.map((day) => ({
      ...day,
      conditionLabel: getWeatherConditionLabel(day.symbolCode, language),
      iconKind: getWeatherIconKind(day.symbolCode),
    })),
  }))
}

export const OPTIONS: APIRoute = async ({request}) =>
  new Response(null, {
    status: 204,
    headers: makeHeaders(request, 'no-store'),
  })

export const GET: APIRoute = async ({request, url}) => {
  const search = url.searchParams.get('search')
  if (search !== null) {
    const q = search.trim()
    if (q.length < 2 || q.length > 100) {
      return json(request, 400, {ok: false, code: 'invalid_query'})
    }
    try {
      const places = await searchWeatherPlaces(q)
      return json(
        request,
        200,
        {ok: true, places},
        'public, max-age=0, s-maxage=3600, stale-while-revalidate=3600',
      )
    } catch {
      return json(request, 502, {ok: false, code: 'search_unavailable'})
    }
  }

  const language: WeatherLanguage = url.searchParams.get('lang') === 'nb' ? 'nb' : 'ne'
  const citiesParam = (url.searchParams.get('cities') || 'oslo,kathmandu').trim()
  const cityIds = citiesParam
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 6)

  const locations: WeatherLocationConfig[] = []
  for (const id of cityIds) {
    const preset = findWeatherPreset(id)
    if (!preset) continue
    locations.push({
      _key: preset.id,
      label: language === 'ne' ? preset.labelNe : preset.labelNb,
      shortLabel: preset.shortLabel,
      lat: preset.lat,
      lon: preset.lon,
      timezone: preset.timezone,
    })
  }

  if (!locations.length) {
    return json(request, 400, {ok: false, code: 'invalid_cities'})
  }

  const startDate = url.searchParams.get('startDate') ?? undefined
  const endDate = url.searchParams.get('endDate') ?? undefined

  try {
    const forecasts = await fetchWeatherForLocations(locations, {
      startDate: isIsoDateString(startDate) ? startDate : undefined,
      endDate: isIsoDateString(endDate) ? endDate : undefined,
    })
    return json(
      request,
      200,
      {
        ok: true,
        fetchedAt: new Date().toISOString(),
        attribution: MET_ATTRIBUTION.sourceUrl,
        locations: enrichForecasts(forecasts, language),
      },
      'public, max-age=0, s-maxage=1800, stale-while-revalidate=1800',
    )
  } catch {
    return json(request, 502, {ok: false, code: 'weather_unavailable'})
  }
}

export const POST: APIRoute = async ({request}) => {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return json(request, 400, {ok: false, code: 'invalid_json'})
  }
  if (!payload || typeof payload !== 'object') {
    return json(request, 400, {ok: false, code: 'invalid_request'})
  }
  const body = payload as Record<string, unknown>
  const language: WeatherLanguage = body.language === 'nb' ? 'nb' : 'ne'
  const startDate = isIsoDateString(body.startDate) ? body.startDate.trim() : undefined
  const endDate = isIsoDateString(body.endDate) ? body.endDate.trim() : undefined
  const rawLocations = Array.isArray(body.locations) ? body.locations.slice(0, 8) : []

  const locations: WeatherLocationConfig[] = rawLocations.flatMap((item, idx) => {
    if (!item || typeof item !== 'object') return []
    const loc = item as Record<string, unknown>
    const lat = Number(loc.lat)
    const lon = Number(loc.lon)
    if (!isValidCoordinatePair(lat, lon)) return []
    const label =
      typeof loc.label === 'string' && loc.label.trim()
        ? loc.label.trim().slice(0, 80)
        : `Location ${idx + 1}`
    const shortLabel =
      typeof loc.shortLabel === 'string' && loc.shortLabel.trim()
        ? loc.shortLabel.trim().slice(0, 40)
        : undefined
    return [
      {
        _key: typeof loc._key === 'string' && loc._key.trim() ? loc._key.trim() : `loc-${idx + 1}`,
        label,
        shortLabel,
        lat: roundMetCoord(lat),
        lon: roundMetCoord(lon),
        timezone: resolveTimezone(loc.timezone, lat, lon),
      },
    ]
  })

  if (!locations.length) {
    return json(request, 400, {ok: false, code: 'missing_locations'})
  }

  try {
    const forecasts = await fetchWeatherForLocations(locations, {startDate, endDate})
    return json(request, 200, {
      ok: true,
      fetchedAt: new Date().toISOString(),
      attribution: MET_ATTRIBUTION.sourceUrl,
      locations: enrichForecasts(forecasts, language),
    })
  } catch {
    return json(request, 502, {ok: false, code: 'weather_unavailable'})
  }
}
