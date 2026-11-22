import {Badge, Box, Button, Card, Flex, Select, Stack, Text, TextInput} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {PatchEvent, set, unset, useFormValue, type ObjectInputProps} from 'sanity'

import {isIsoDateString, isValidCoordinatePair, roundMetCoord} from '../../src/lib/weather/met'
import {WEATHER_PRESETS, getWeatherConditionLabel} from '../../src/lib/weather/symbols'
import type {
  WeatherLanguage,
  WeatherLocationConfig,
  WeatherLocationForecast,
  YrWeatherBlockInput,
} from '../../src/lib/weather/types'

const randomKey = () => Math.random().toString(36).slice(2, 10)

function toIsoDateLocal(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDaysIso(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return toIsoDateLocal(d)
}

async function callWeatherApi(
  pathAndQuery: string,
  init?: RequestInit,
): Promise<Response> {
  if (typeof window === 'undefined') {
    return fetch(`https://nepali.no${pathAndQuery}`, init)
  }
  const {hostname, port} = window.location
  const candidates =
    hostname === 'nepali.no' || hostname === 'www.nepali.no' || port === '4321'
      ? [pathAndQuery]
      : hostname === 'localhost' || hostname === '127.0.0.1'
        ? [`http://${hostname}:4321${pathAndQuery}`, `https://nepali.no${pathAndQuery}`]
        : [`https://nepali.no${pathAndQuery}`]

  let lastError: unknown
  for (const url of candidates) {
    try {
      const res = await fetch(url, init)
      if (res.ok || res.status < 500) return res
    } catch (err) {
      lastError = err
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Could not reach nepali.no weather API.')
}

interface SearchPlaceItem {
  label: string
  shortLabel: string
  lat: number
  lon: number
  timezone: string
}

export function YrWeatherInput(props: ObjectInputProps) {
  const {value, onChange, readOnly, renderDefault} = props
  const docLanguage = useFormValue(['language'])
  const language: WeatherLanguage = docLanguage === 'nb' ? 'nb' : 'ne'
  const block = (value ?? {}) as YrWeatherBlockInput

  const locations = useMemo(
    () => (Array.isArray(block.locations) ? (block.locations as WeatherLocationConfig[]) : []),
    [block.locations],
  )
  const snapshotLocations = useMemo(
    () =>
      Array.isArray(block.snapshotLocations)
        ? (block.snapshotLocations as WeatherLocationForecast[])
        : [],
    [block.snapshotLocations],
  )
  const startDate = isIsoDateString(block.startDate) ? block.startDate : ''
  const endDate = isIsoDateString(block.endDate) ? block.endDate : ''

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchPlaceItem[]>([])
  const [searching, setSearching] = useState(false)
  const [fetchingYr, setFetchingYr] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const commitLocations = useCallback(
    (next: WeatherLocationConfig[]) => {
      const normalized = next.map((item, idx) => ({
        _key: item._key || `loc-${idx + 1}-${randomKey()}`,
        _type: 'yrWeatherLocation',
        label: item.label || item.shortLabel || `Location ${idx + 1}`,
        ...(item.shortLabel ? {shortLabel: item.shortLabel} : {}),
        lat: roundMetCoord(item.lat),
        lon: roundMetCoord(item.lon),
        timezone: item.timezone || 'Europe/Oslo',
      }))
      onChange(PatchEvent.from(normalized.length ? set(normalized, ['locations']) : unset(['locations'])))
    },
    [onChange],
  )

  const addPreset = (presetId: string) => {
    if (readOnly) return
    const preset = WEATHER_PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    if (locations.length >= 8) {
      setError('Maximum 8 locations per weather block.')
      return
    }
    const alreadyExists = locations.some(
      (loc) =>
        Math.abs(loc.lat - preset.lat) < 0.005 && Math.abs(loc.lon - preset.lon) < 0.005,
    )
    if (alreadyExists) {
      setStatusMessage(`${preset.shortLabel} is already added.`)
      return
    }
    setError(null)
    commitLocations([
      ...locations,
      {
        _key: `${preset.id}-${randomKey()}`,
        label: language === 'ne' ? preset.labelNe : preset.labelNb,
        shortLabel: preset.shortLabel,
        lat: preset.lat,
        lon: preset.lon,
        timezone: preset.timezone,
      },
    ])
  }

  const handleSearchPlaces = async () => {
    const q = searchQuery.trim()
    if (q.length < 2) {
      setError('Enter at least 2 characters to search for a place.')
      return
    }
    setSearching(true)
    setError(null)
    setStatusMessage(null)
    try {
      const res = await callWeatherApi(`/api/weather?search=${encodeURIComponent(q)}`)
      const data = (await res.json()) as {ok?: boolean; places?: SearchPlaceItem[]}
      if (!res.ok || !data.ok || !Array.isArray(data.places)) {
        throw new Error('Could not search locations.')
      }
      setSearchResults(data.places)
      if (!data.places.length) {
        setStatusMessage(`No places found for "${q}".`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Location search failed.')
    } finally {
      setSearching(false)
    }
  }

  const addSearchResult = (place: SearchPlaceItem) => {
    if (readOnly) return
    if (locations.length >= 8) {
      setError('Maximum 8 locations per weather block.')
      return
    }
    commitLocations([
      ...locations,
      {
        _key: randomKey(),
        label: place.shortLabel,
        shortLabel: place.shortLabel,
        lat: place.lat,
        lon: place.lon,
        timezone: place.timezone,
      },
    ])
    setSearchResults([])
    setSearchQuery('')
    setStatusMessage(`Added ${place.shortLabel} (${place.lat}, ${place.lon}).`)
  }

  const updateLocationLabel = (index: number, label: string) => {
    if (readOnly) return
    commitLocations(locations.map((loc, i) => (i === index ? {...loc, label} : loc)))
  }

  const removeLocation = (index: number) => {
    if (readOnly) return
    commitLocations(locations.filter((_, i) => i !== index))
  }

  const moveLocation = (index: number, delta: -1 | 1) => {
    if (readOnly) return
    const target = index + delta
    if (target < 0 || target >= locations.length) return
    const next = [...locations]
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    commitLocations(next)
  }

  const setDateRange = (nextStart: string, nextEnd: string) => {
    if (readOnly) return
    const patches = [
      nextStart ? set(nextStart, ['startDate']) : unset(['startDate']),
      nextEnd ? set(nextEnd, ['endDate']) : unset(['endDate']),
    ]
    onChange(PatchEvent.from(patches))
  }

  const handleFetchYr = async () => {
    if (readOnly) return
    const validLocs = locations.filter((loc) => isValidCoordinatePair(loc.lat, loc.lon))
    if (!validLocs.length) {
      setError('Add at least one location before fetching from Yr.')
      return
    }
    if (startDate && endDate && endDate < startDate) {
      setError('End date must be on or after start date.')
      return
    }
    setFetchingYr(true)
    setError(null)
    setStatusMessage(null)
    try {
      const res = await callWeatherApi('/api/weather', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({
          locations: validLocs,
          ...(startDate ? {startDate} : {}),
          ...(endDate ? {endDate} : {}),
          language,
        }),
      })
      const payload = (await res.json()) as {
        ok?: boolean
        fetchedAt?: string
        locations?: WeatherLocationForecast[]
        code?: string
      }
      if (!res.ok || !payload.ok || !Array.isArray(payload.locations)) {
        throw new Error(payload.code || 'Failed to fetch forecast from Yr.')
      }

      const snapshotOut = payload.locations.map((loc, idx) => ({
        _key: loc.key || `snap-${idx + 1}-${randomKey()}`,
        _type: 'yrWeatherSnapshotLocation',
        key: loc.key,
        label: loc.label,
        ...(loc.shortLabel ? {shortLabel: loc.shortLabel} : {}),
        lat: roundMetCoord(loc.lat),
        lon: roundMetCoord(loc.lon),
        timezone: loc.timezone,
        ...(loc.current
          ? {
              current: {
                _type: 'yrWeatherSnapshotCurrent',
                time: loc.current.time,
                temperature: loc.current.temperature ?? undefined,
                windSpeedMs: loc.current.windSpeedMs ?? undefined,
                precipitationNext1h: loc.current.precipitationNext1h ?? undefined,
                symbolCode: loc.current.symbolCode ?? undefined,
              },
            }
          : {}),
        days: loc.days.map((day) => ({
          _key: day.date,
          _type: 'yrWeatherSnapshotDay',
          date: day.date,
          minTemp: day.minTemp ?? undefined,
          maxTemp: day.maxTemp ?? undefined,
          precipitationMm: day.precipitationMm ?? undefined,
          windMaxMs: day.windMaxMs ?? undefined,
          symbolCode: day.symbolCode ?? undefined,
        })),
      }))

      const patches = [
        set(snapshotOut, ['snapshotLocations']),
        set(payload.fetchedAt || new Date().toISOString(), ['fetchedAt']),
      ]
      if (!block.title || (typeof block.title === 'string' && !block.title.trim())) {
        patches.push(
          set(
            language === 'ne' ? 'मौसम पूर्वानुमान (Yr / MET Norway)' : 'Værvarsel (Yr / MET Norway)',
            ['title'],
          ),
        )
      }
      onChange(PatchEvent.from(patches))
      const totalDays = snapshotOut[0]?.days?.length ?? 0
      setStatusMessage(
        `Fetched Yr forecast for ${snapshotOut.length} location(s) (${totalDays} day(s) each).`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Yr forecast.')
    } finally {
      setFetchingYr(false)
    }
  }

  return (
    <Stack space={4}>
      <Card padding={3} radius={2} border tone="primary">
        <Stack space={3}>
          <Flex align="center" justify="space-between" gap={2} wrap="wrap">
            <Flex align="center" gap={2}>
              <Badge tone="primary">Yr / MET Norway</Badge>
              <Text size={1} weight="semibold">
                Multi-location &amp; Date Forecast Builder
              </Text>
            </Flex>
            {typeof block.fetchedAt === 'string' && block.fetchedAt && (
              <Text size={0} muted>
                Last fetched: {new Date(block.fetchedAt).toLocaleString()}
              </Text>
            )}
          </Flex>

          {/* Preset Locations */}
          <Stack space={2}>
            <Text size={1} weight="medium">
              Quick-add cities (add as many as needed, up to 8):
            </Text>
            <Flex gap={1} wrap="wrap">
              {WEATHER_PRESETS.map((preset) => (
                <Button
                  key={preset.id}
                  mode="ghost"
                  tone="default"
                  fontSize={1}
                  padding={2}
                  text={`+ ${preset.shortLabel}`}
                  disabled={readOnly}
                  onClick={() => addPreset(preset.id)}
                />
              ))}
            </Flex>
          </Stack>

          {/* Search Any Place */}
          <Flex gap={2} align="center">
            <Box flex={1}>
              <TextInput
                value={searchQuery}
                placeholder="Search any town, municipality, or city (e.g. Røros, Bodø, Pokhara)..."
                disabled={readOnly || searching}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void handleSearchPlaces()
                  }
                }}
              />
            </Box>
            <Button
              text={searching ? 'Searching...' : 'Search Place'}
              tone="primary"
              mode="ghost"
              disabled={readOnly || searching}
              onClick={() => void handleSearchPlaces()}
            />
          </Flex>

          {searchResults.length > 0 && (
            <Card padding={2} radius={2} border tone="transparent">
              <Stack space={2}>
                <Text size={1} weight="medium">
                  Select a search result to add:
                </Text>
                {searchResults.map((place, idx) => (
                  <Flex key={`${place.lat}-${place.lon}-${idx}`} align="center" justify="space-between" gap={2}>
                    <Text size={1}>
                      {place.label} ({place.lat}, {place.lon})
                    </Text>
                    <Button
                      text="Add"
                      tone="positive"
                      mode="ghost"
                      fontSize={1}
                      padding={2}
                      onClick={() => addSearchResult(place)}
                    />
                  </Flex>
                ))}
              </Stack>
            </Card>
          )}

          {/* Selected Locations List */}
          {locations.length > 0 && (
            <Stack space={2}>
              <Text size={1} weight="medium">
                Selected locations ({locations.length}):
              </Text>
              {locations.map((loc, idx) => (
                <Card key={loc._key || idx} padding={2} radius={2} border>
                  <Flex align="center" gap={2} wrap="wrap">
                    <Box flex={1} style={{minWidth: '180px'}}>
                      <TextInput
                        value={loc.label || ''}
                        disabled={readOnly}
                        placeholder="Display label (e.g. ओस्लो (Oslo))"
                        onChange={(e) => updateLocationLabel(idx, e.currentTarget.value)}
                      />
                    </Box>
                    <Text size={0} muted>
                      {Number(loc.lat).toFixed(4)}, {Number(loc.lon).toFixed(4)} ({loc.timezone || 'Europe/Oslo'})
                    </Text>
                    <Flex gap={1}>
                      <Button
                        text="↑"
                        mode="bleed"
                        padding={2}
                        disabled={readOnly || idx === 0}
                        onClick={() => moveLocation(idx, -1)}
                      />
                      <Button
                        text="↓"
                        mode="bleed"
                        padding={2}
                        disabled={readOnly || idx === locations.length - 1}
                        onClick={() => moveLocation(idx, 1)}
                      />
                      <Button
                        text="Remove"
                        tone="critical"
                        mode="bleed"
                        fontSize={1}
                        padding={2}
                        disabled={readOnly}
                        onClick={() => removeLocation(idx)}
                      />
                    </Flex>
                  </Flex>
                </Card>
              ))}
            </Stack>
          )}

          {/* Date Range Picker */}
          <Stack space={2}>
            <Text size={1} weight="medium">
              Forecast Dates (Yr provides up to 9 days ahead):
            </Text>
            <Flex gap={2} wrap="wrap" align="center">
              <Flex align="center" gap={1}>
                <Text size={1} muted>
                  From:
                </Text>
                <input
                  type="date"
                  value={startDate}
                  disabled={readOnly}
                  onChange={(e) => setDateRange(e.currentTarget.value, endDate)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--card-border-color, #ccc)',
                    background: 'transparent',
                    color: 'inherit',
                  }}
                />
              </Flex>
              <Flex align="center" gap={1}>
                <Text size={1} muted>
                  To:
                </Text>
                <input
                  type="date"
                  value={endDate}
                  disabled={readOnly}
                  onChange={(e) => setDateRange(startDate, e.currentTarget.value)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--card-border-color, #ccc)',
                    background: 'transparent',
                    color: 'inherit',
                  }}
                />
              </Flex>
              <Button
                text="Next 3 days"
                mode="ghost"
                fontSize={1}
                padding={2}
                disabled={readOnly}
                onClick={() => setDateRange(toIsoDateLocal(new Date()), addDaysIso(2))}
              />
              <Button
                text="Next 5 days"
                mode="ghost"
                fontSize={1}
                padding={2}
                disabled={readOnly}
                onClick={() => setDateRange(toIsoDateLocal(new Date()), addDaysIso(4))}
              />
              <Button
                text="Next 7 days"
                mode="ghost"
                fontSize={1}
                padding={2}
                disabled={readOnly}
                onClick={() => setDateRange(toIsoDateLocal(new Date()), addDaysIso(6))}
              />
              {(startDate || endDate) && (
                <Button
                  text="Clear dates"
                  mode="bleed"
                  fontSize={1}
                  padding={2}
                  disabled={readOnly}
                  onClick={() => setDateRange('', '')}
                />
              )}
            </Flex>
          </Stack>

          {/* Fetch + Quick View Mode */}
          <Flex gap={2} align="center" wrap="wrap">
            <Button
              text={fetchingYr ? 'Fetching Yr data...' : 'Fetch Forecast from Yr'}
              tone="positive"
              disabled={readOnly || fetchingYr || locations.length === 0}
              onClick={() => void handleFetchYr()}
            />
            <Box style={{width: '170px'}}>
              <Select
                value={typeof block.mode === 'string' ? block.mode : 'snapshot'}
                disabled={readOnly}
                onChange={(e) =>
                  onChange(PatchEvent.from(set(e.currentTarget.value, ['mode'])))
                }
              >
                <option value="snapshot">Mode: Snapshot (frozen)</option>
                <option value="live">Mode: Live (auto-updates)</option>
              </Select>
            </Box>
            <Box style={{width: '160px'}}>
              <Select
                value={typeof block.viewMode === 'string' ? block.viewMode : 'cards'}
                disabled={readOnly}
                onChange={(e) =>
                  onChange(PatchEvent.from(set(e.currentTarget.value, ['viewMode'])))
                }
              >
                <option value="cards">Layout: City cards</option>
                <option value="table">Layout: Comparison table</option>
              </Select>
            </Box>
          </Flex>

          {error && (
            <Card padding={2} radius={2} tone="critical">
              <Text size={1}>{error}</Text>
            </Card>
          )}
          {statusMessage && (
            <Card padding={2} radius={2} tone="positive">
              <Text size={1}>{statusMessage}</Text>
            </Card>
          )}

          {/* Snapshot Preview */}
          {snapshotLocations.length > 0 && (
            <Card padding={2} radius={2} border tone="transparent">
              <Stack space={2}>
                <Text size={1} weight="semibold">
                  Saved Yr Forecast Preview ({snapshotLocations.length} location(s)):
                </Text>
                {snapshotLocations.map((loc) => (
                  <Box key={loc.key || loc.label}>
                    <Text size={1} weight="medium">
                      {loc.label}:{' '}
                      {loc.days
                        .map(
                          (d) =>
                            `${d.date} (${d.minTemp ?? '?'}°..${d.maxTemp ?? '?'}°${
                              d.symbolCode ? ` ${getWeatherConditionLabel(d.symbolCode, language)}` : ''
                            })`,
                        )
                        .join(' | ')}
                    </Text>
                  </Box>
                ))}
              </Stack>
            </Card>
          )}
        </Stack>
      </Card>

      {renderDefault(props)}
    </Stack>
  )
}
