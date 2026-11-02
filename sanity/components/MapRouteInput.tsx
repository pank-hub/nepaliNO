import {Button, Card, Checkbox, Flex, Select, Stack, Text} from '@sanity/ui'
import {useRef, useState} from 'react'
import {PatchEvent, set, unset, useFormValue, type ObjectInputProps} from 'sanity'

import {
  ROUTING_CALCULATION_ENABLED,
  ROUTING_PROVIDER,
  type MapPlace,
  type MapRoute,
} from '../../src/lib/maps/location'
import {
  isRouteEligible,
  isRouteStale,
  parseOsrmRoute,
  routeRequestUrl,
  routeStopsSignature,
  validateRoute,
} from '../../src/lib/maps/places'

// One request at a time and a minimum gap, per the provider's 1 request/second limit.
let lastRequestAt = 0
let requestInFlight = false

export function MapRouteInput(props: ObjectInputProps) {
  const {value, onChange, readOnly, path} = props
  const route = (value ?? {}) as MapRoute
  const siblingPlaces = useFormValue([...path.slice(0, -1), 'locations']) as MapPlace[] | undefined
  const places = Array.isArray(siblingPlaces) ? siblingPlaces : []
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const stopKeys = route.stopKeys ?? []
  const eligible = places.filter(isRouteEligible)
  const available = eligible.filter((place) => !stopKeys.includes(place._key ?? ''))
  const labelFor = (key: string) =>
    places.find((place) => place._key === key)?.label || `(missing location ${key})`
  const hasRoute = !!route.geometry
  const stale = route.enabled && hasRoute ? isRouteStale(route, places) : false
  const problem = route.enabled ? validateRoute(route, places) : undefined

  const write = (next: MapRoute) => onChange(PatchEvent.from(set(next)))

  const setStops = (keys: string[]) => write({...route, stopKeys: keys})

  const moveStop = (index: number, offset: number) => {
    const target = index + offset
    if (target < 0 || target >= stopKeys.length) return
    const next = [...stopKeys]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    setStops(next)
  }

  const calculate = async () => {
    if (!ROUTING_CALCULATION_ENABLED || busy || requestInFlight) return
    const stops = stopKeys.map((key) => places.find((place) => place._key === key))
    if (stops.length < 2 || stops.some((stop) => !isRouteEligible(stop))) {
      setStatus('Choose at least two valid exact locations first.')
      return
    }
    if (stops.length > ROUTING_PROVIDER.maxStops) {
      setStatus(`Use at most ${ROUTING_PROVIDER.maxStops} stops.`)
      return
    }
    const wait = lastRequestAt + ROUTING_PROVIDER.minimumIntervalMs - Date.now()
    if (wait > 0) {
      setStatus(
        'Please wait a moment before calculating again (the service allows 1 request per second).',
      )
      return
    }
    requestInFlight = true
    lastRequestAt = Date.now()
    setBusy(true)
    setStatus('Calculating route…')
    const controller = new AbortController()
    abortRef.current = controller
    const timer = setTimeout(() => controller.abort(), ROUTING_PROVIDER.timeoutMs)
    try {
      const response = await fetch(routeRequestUrl(stops.map((stop) => stop!.coordinates!)), {
        signal: controller.signal,
        referrerPolicy: 'strict-origin-when-cross-origin',
        headers: {Accept: 'application/json'},
      })
      if (!response.ok)
        throw new Error(`The routing service answered with HTTP ${response.status}.`)
      const parsed = parseOsrmRoute(await response.json())
      const signature = routeStopsSignature(places, stopKeys)
      write({
        ...route,
        enabled: true,
        ...parsed,
        calculatedAt: new Date().toISOString(),
        providerName: ROUTING_PROVIDER.name,
        stopsSignature: signature,
      })
      setStatus('Route calculated and saved in this draft. Review it, then publish.')
    } catch (error) {
      setStatus(
        controller.signal.aborted
          ? 'The routing service did not respond in time. Nothing was changed; try again later.'
          : `Route not calculated: ${error instanceof Error ? error.message : 'unknown error'}`,
      )
    } finally {
      clearTimeout(timer)
      requestInFlight = false
      abortRef.current = null
      setBusy(false)
    }
  }

  const removeSaved = () => {
    onChange(
      PatchEvent.from(
        route.enabled || stopKeys.length ? set({enabled: route.enabled, stopKeys}) : unset(),
      ),
    )
    setStatus('Saved route geometry removed.')
  }

  return (
    <Stack space={3}>
      {!ROUTING_CALCULATION_ENABLED && (
        <Card padding={3} radius={2} tone="critical" border>
          <Text size={1}>
            Route calculation is switched off (evaluation only): permission to store and publish
            routing-service geometry has not been verified. Do not enable driving routes on content
            to be published.
          </Text>
        </Card>
      )}
      <Card padding={3} radius={2} tone="caution" border>
        <Text size={1}>
          Routes are calculated only when you press “Calculate route”, using {ROUTING_PROVIDER.name}
          , a free community service without an availability guarantee. The result is saved here;
          visitors never trigger routing. Duration is an estimate without live traffic. Approximate
          areas cannot be route stops.
        </Text>
      </Card>

      <Flex align="center" gap={2}>
        <Checkbox
          id="route-enabled"
          checked={!!route.enabled}
          disabled={readOnly}
          onChange={(event) => write({...route, enabled: event.currentTarget.checked})}
        />
        <label htmlFor="route-enabled">
          <Text size={1}>Show a saved driving route on the public map</Text>
        </label>
      </Flex>

      {route.enabled && (
        <Stack space={3}>
          <Text size={1} weight="semibold">
            Stops in driving order (first = start, last = destination)
          </Text>
          {stopKeys.length === 0 && (
            <Text size={1} muted>
              No stops chosen.
            </Text>
          )}
          <Stack as="ol" space={2} style={{listStyle: 'none', margin: 0, padding: 0}}>
            {stopKeys.map((key, index) => (
              <li key={key}>
                <Flex gap={2} align="center" wrap="wrap">
                  <Text size={1}>
                    {index + 1}. {labelFor(key)}
                    {index === 0
                      ? ' (start)'
                      : index === stopKeys.length - 1
                        ? ' (destination)'
                        : ''}
                  </Text>
                  <Button
                    text="Up"
                    mode="ghost"
                    fontSize={1}
                    disabled={readOnly || index === 0}
                    onClick={() => moveStop(index, -1)}
                  />
                  <Button
                    text="Down"
                    mode="ghost"
                    fontSize={1}
                    disabled={readOnly || index === stopKeys.length - 1}
                    onClick={() => moveStop(index, 1)}
                  />
                  <Button
                    text="Remove"
                    mode="ghost"
                    tone="critical"
                    fontSize={1}
                    disabled={readOnly}
                    onClick={() => setStops(stopKeys.filter((item) => item !== key))}
                  />
                </Flex>
              </li>
            ))}
          </Stack>
          <label>
            <Text size={1}>Add an exact location as a stop</Text>
            <Select
              value=""
              disabled={readOnly || available.length === 0}
              onChange={(event) => {
                const key = event.currentTarget.value
                if (key) setStops([...stopKeys, key])
              }}
            >
              <option value="">
                {available.length ? 'Choose a location…' : 'No more valid exact locations'}
              </option>
              {available.map((place) => (
                <option key={place._key} value={place._key}>
                  {place.label}
                </option>
              ))}
            </Select>
          </label>

          <Flex gap={2} wrap="wrap">
            <Button
              text={busy ? 'Calculating…' : 'Calculate route'}
              tone="primary"
              disabled={!ROUTING_CALCULATION_ENABLED || readOnly || busy || stopKeys.length < 2}
              onClick={() => void calculate()}
            />
            <Button
              text="Remove saved route data"
              mode="ghost"
              disabled={readOnly || !hasRoute}
              onClick={removeSaved}
            />
          </Flex>

          {hasRoute && (
            <Text size={1}>
              Saved: {((route.distanceMeters ?? 0) / 1000).toFixed(1)} km, about{' '}
              {Math.round((route.durationSeconds ?? 0) / 60)} min (estimate, no live traffic) ·{' '}
              {route.providerName} · {route.calculatedAt}
            </Text>
          )}
          {stale && (
            <Card padding={3} tone="critical" radius={2}>
              <Text size={1}>
                Route is out of date: stops, order or coordinates changed. Recalculate before
                publishing. The public page will not draw it.
              </Text>
            </Card>
          )}
          {problem && !stale && (
            <Card padding={3} tone="critical" radius={2}>
              <Text size={1}>{problem}</Text>
            </Card>
          )}
        </Stack>
      )}
      {status && (
        <div role="status" aria-live="polite">
          <Text size={1}>{status}</Text>
        </div>
      )}
    </Stack>
  )
}
