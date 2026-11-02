import {Button, Card, Flex, Select, Text, TextInput} from '@sanity/ui'
import {useEffect, useMemo, useRef, useState} from 'react'
import {PatchEvent, set, unset, type ObjectInputProps} from 'sanity'
import type {Circle, Map as LeafletMap, Marker, LeafletMouseEvent} from 'leaflet'

import {
  LOCATION_DEFAULTS,
  MAP_PROVIDER,
  searchOpenStreetMap,
  validateCoordinates,
  validateMapLocation,
  type LocationPrecision,
  type MapCoordinates,
  type MapLocation,
} from '../../src/lib/maps/location'

import 'leaflet/dist/leaflet.css'

type Geopoint = MapCoordinates & {_type?: 'geopoint'}
type StoredMapLocation = MapLocation & {coordinates?: Geopoint}

const readNumber = (raw: string): number | undefined =>
  raw.trim() === '' ? undefined : Number(raw)

export function MapLocationInput(props: ObjectInputProps) {
  const {value, onChange, readOnly, elementProps} = props
  const location = value as StoredMapLocation | undefined
  const coordinates = location?.coordinates
  const [precision, setPrecision] = useState<LocationPrecision>(
    location?.precision === 'approximate' ? 'approximate' : 'exact',
  )
  const [radiusMeters, setRadiusMeters] = useState(
    String(location?.radiusMeters ?? LOCATION_DEFAULTS.radiusMeters),
  )
  const [initialZoom, setInitialZoom] = useState(
    String(
      location?.initialZoom ??
        (location?.precision === 'approximate'
          ? LOCATION_DEFAULTS.approximateZoom
          : LOCATION_DEFAULTS.exactZoom),
    ),
  )
  const [latitude, setLatitude] = useState(coordinates ? String(coordinates.lat) : '')
  const [longitude, setLongitude] = useState(coordinates ? String(coordinates.lng) : '')
  const [searchQuery, setSearchQuery] = useState('')
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState('')
  const mapElement = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markerRef = useRef<Marker | null>(null)
  const circleRef = useRef<Circle | null>(null)
  const latestRef = useRef({precision, radiusMeters, initialZoom, readOnly})
  const queryUrl = useMemo(() => searchOpenStreetMap(searchQuery), [searchQuery])

  useEffect(() => {
    latestRef.current = {precision, radiusMeters, initialZoom, readOnly}
  }, [precision, radiusMeters, initialZoom, readOnly])

  useEffect(() => {
    setPrecision(location?.precision === 'approximate' ? 'approximate' : 'exact')
    setRadiusMeters(String(location?.radiusMeters ?? LOCATION_DEFAULTS.radiusMeters))
    setInitialZoom(
      String(
        location?.initialZoom ??
          (location?.precision === 'approximate'
            ? LOCATION_DEFAULTS.approximateZoom
            : LOCATION_DEFAULTS.exactZoom),
      ),
    )
    setLatitude(coordinates ? String(coordinates.lat) : '')
    setLongitude(coordinates ? String(coordinates.lng) : '')
  }, [
    location?.precision,
    location?.radiusMeters,
    location?.initialZoom,
    coordinates?.lat,
    coordinates?.lng,
  ])

  useEffect(() => {
    let active = true
    let map: LeafletMap | undefined

    void import('leaflet')
      .then(({default: L}) => {
        if (!active || !mapElement.current) return
        map = L.map(mapElement.current, {
          center: [LOCATION_DEFAULTS.defaultCenter.lat, LOCATION_DEFAULTS.defaultCenter.lng],
          zoom: LOCATION_DEFAULTS.exactZoom,
          scrollWheelZoom: false,
          zoomControl: true,
          keyboard: true,
        })
        map.on('click', (event: LeafletMouseEvent) => {
          const current = latestRef.current
          if (current.readOnly) return
          const radius = Number(current.radiusMeters)
          const zoom = Number(current.initialZoom)
          writeLocation(event.latlng, current.precision, radius, zoom)
        })
        const tiles = L.tileLayer(MAP_PROVIDER.tiles, {
          attribution: MAP_PROVIDER.attribution,
          maxZoom: MAP_PROVIDER.maxZoom,
          referrerPolicy: MAP_PROVIDER.referrerPolicy,
        }).addTo(map)
        tiles.on('tileerror', () => {
          setMapError(
            'Map preview tiles could not be loaded. Coordinates can still be entered manually.',
          )
        })
        mapRef.current = map
        setMapReady(true)
      })
      .catch((error: unknown) => {
        if (active) {
          setMapError(
            error instanceof Error ? error.message : 'The map preview could not be loaded.',
          )
        }
      })

    return () => {
      active = false
      map?.remove()
      mapRef.current = null
      markerRef.current = null
      circleRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map) return

    markerRef.current?.remove()
    circleRef.current?.remove()
    markerRef.current = null
    circleRef.current = null

    const lat = readNumber(latitude)
    const lng = readNumber(longitude)
    if (lat === undefined || lng === undefined) return
    const nextCoordinates = {lat, lng}
    const coordinateError = validateCoordinates(nextCoordinates)
    if (coordinateError) {
      setMapError(coordinateError)
      return
    }

    const zoom = readNumber(initialZoom) ?? LOCATION_DEFAULTS.exactZoom
    const radius = readNumber(radiusMeters) ?? LOCATION_DEFAULTS.radiusMeters
    const locationError = validateMapLocation({
      coordinates: nextCoordinates,
      precision,
      radiusMeters: radius,
      initialZoom: zoom,
    })
    if (locationError) {
      setMapError(locationError)
      return
    }
    setMapError('')
    map.setView([lat, lng], zoom)

    void import('leaflet').then(({default: L}) => {
      if (mapRef.current !== map) return
      if (precision === 'approximate') {
        circleRef.current = L.circle([lat, lng], {
          radius,
          color: '#b42318',
          fillColor: '#f04438',
          fillOpacity: 0.18,
          weight: 2,
        }).addTo(map)
      }
      markerRef.current = L.marker([lat, lng], {draggable: !readOnly}).addTo(map)
      markerRef.current.on('dragend', () => {
        const point = markerRef.current?.getLatLng()
        if (!point) return
        writeLocation(
          point,
          precision,
          readNumber(radiusMeters) ?? LOCATION_DEFAULTS.radiusMeters,
          readNumber(initialZoom) ?? LOCATION_DEFAULTS.exactZoom,
        )
      })
    })
  }, [mapReady, latitude, longitude, precision, radiusMeters, initialZoom, readOnly])

  function writeLocation(
    point: MapCoordinates,
    nextPrecision: LocationPrecision,
    radius: number,
    zoom: number,
  ) {
    const next: StoredMapLocation = {
      _type: 'mapLocation',
      coordinates: {_type: 'geopoint', lat: point.lat, lng: point.lng},
      precision: nextPrecision,
      initialZoom: zoom,
    }
    if (nextPrecision === 'approximate') next.radiusMeters = radius
    const error = validateMapLocation(next)
    if (error) {
      setMapError(error)
      return
    }
    setMapError('')
    setLatitude(String(point.lat))
    setLongitude(String(point.lng))
    onChange(PatchEvent.from(set(next)))
  }

  function updateCoordinate(axis: 'lat' | 'lng', raw: string) {
    if (axis === 'lat') setLatitude(raw)
    else setLongitude(raw)
    setMapError('')

    const lat = readNumber(axis === 'lat' ? raw : latitude)
    const lng = readNumber(axis === 'lng' ? raw : longitude)
    if (lat === undefined || lng === undefined) return
    const nextCoordinates = {lat, lng}
    const error = validateCoordinates(nextCoordinates)
    if (error) {
      setMapError(error)
      return
    }
    writeLocation(
      nextCoordinates,
      precision,
      readNumber(radiusMeters) ?? LOCATION_DEFAULTS.radiusMeters,
      readNumber(initialZoom) ??
        (precision === 'approximate'
          ? LOCATION_DEFAULTS.approximateZoom
          : LOCATION_DEFAULTS.exactZoom),
    )
    mapRef.current?.setView([lat, lng], readNumber(initialZoom) ?? LOCATION_DEFAULTS.exactZoom)
  }

  function updatePrecision(nextPrecision: LocationPrecision) {
    setPrecision(nextPrecision)
    const nextZoom =
      nextPrecision === 'approximate'
        ? LOCATION_DEFAULTS.approximateZoom
        : LOCATION_DEFAULTS.exactZoom
    setInitialZoom(String(nextZoom))
    setMapError('')
    if (!coordinates) return
    writeLocation(
      coordinates,
      nextPrecision,
      readNumber(radiusMeters) ?? LOCATION_DEFAULTS.radiusMeters,
      nextZoom,
    )
  }

  function clearLocation() {
    setLatitude('')
    setLongitude('')
    setMapError('')
    onChange(PatchEvent.from(unset()))
  }

  return (
    <div style={{display: 'grid', gap: 16}}>
      <Text size={1}>
        Click the map or drag the pin to set a location. You may also enter coordinates manually.
      </Text>

      <div
        ref={mapElement}
        aria-label="Map location editor"
        style={{height: 300, width: '100%', borderRadius: 8, background: '#f5f8fb'}}
      />
      {mapError && (
        <Text size={1} muted={false} style={{color: '#b42318'}} role="alert">
          {mapError}
        </Text>
      )}
      {!mapReady && !mapError && <Text size={1}>Loading map preview…</Text>}
      {mapError && !mapReady && (
        <Text size={1}>Use the coordinate fields below without the preview.</Text>
      )}

      <Flex gap={3} wrap="wrap">
        <div style={{display: 'grid', gap: 8, flex: 1}}>
          <label htmlFor={`${elementProps.id}-latitude`}>Latitude (-90 to 90)</label>
          <TextInput
            id={`${elementProps.id}-latitude`}
            inputMode="decimal"
            value={latitude}
            readOnly={readOnly}
            onChange={(event) => updateCoordinate('lat', event.currentTarget.value)}
          />
        </div>
        <div style={{display: 'grid', gap: 8, flex: 1}}>
          <label htmlFor={`${elementProps.id}-longitude`}>Longitude (-180 to 180)</label>
          <TextInput
            id={`${elementProps.id}-longitude`}
            inputMode="decimal"
            value={longitude}
            readOnly={readOnly}
            onChange={(event) => updateCoordinate('lng', event.currentTarget.value)}
          />
        </div>
      </Flex>

      <div style={{display: 'grid', gap: 8}}>
        <label htmlFor={`${elementProps.id}-precision`}>Location precision</label>
        <Select
          id={`${elementProps.id}-precision`}
          value={precision}
          disabled={readOnly}
          onChange={(event) => updatePrecision(event.currentTarget.value as LocationPrecision)}
        >
          <option value="exact">Exact pin</option>
          <option value="approximate">Approximate area</option>
        </Select>
        {precision === 'approximate' && (
          <Card padding={3} tone="caution" radius={2}>
            <Text size={1}>
              The circle centre is still public coordinate data. Choose a safe approximate centre,
              not a confidential address.
            </Text>
          </Card>
        )}
      </div>

      <Flex gap={3} wrap="wrap">
        {precision === 'approximate' && (
          <div style={{display: 'grid', gap: 8, flex: 1}}>
            <label htmlFor={`${elementProps.id}-radius`}>
              Approximate radius (50–100000 metres)
            </label>
            <TextInput
              id={`${elementProps.id}-radius`}
              type="number"
              min={LOCATION_DEFAULTS.minimumRadiusMeters}
              max={LOCATION_DEFAULTS.maximumRadiusMeters}
              value={radiusMeters}
              readOnly={readOnly}
              onChange={(event) => {
                const next = event.currentTarget.value
                setRadiusMeters(next)
                if (coordinates) {
                  writeLocation(
                    coordinates,
                    precision,
                    Number(next),
                    readNumber(initialZoom) ?? LOCATION_DEFAULTS.approximateZoom,
                  )
                }
              }}
            />
          </div>
        )}
        <div style={{display: 'grid', gap: 8, flex: 1}}>
          <label htmlFor={`${elementProps.id}-zoom`}>Initial zoom (1–{MAP_PROVIDER.maxZoom})</label>
          <TextInput
            id={`${elementProps.id}-zoom`}
            type="number"
            min={LOCATION_DEFAULTS.minimumZoom}
            max={LOCATION_DEFAULTS.maximumZoom}
            step="0.5"
            value={initialZoom}
            readOnly={readOnly}
            onChange={(event) => {
              const next = event.currentTarget.value
              setInitialZoom(next)
              if (coordinates) {
                writeLocation(
                  coordinates,
                  precision,
                  readNumber(radiusMeters) ?? LOCATION_DEFAULTS.radiusMeters,
                  Number(next),
                )
              }
            }}
          />
        </div>
      </Flex>

      <div style={{display: 'grid', gap: 8}}>
        <label htmlFor={`${elementProps.id}-search`}>Search OpenStreetMap (opens externally)</label>
        <Flex gap={2} align="flex-end">
          <TextInput
            id={`${elementProps.id}-search`}
            value={searchQuery}
            readOnly={readOnly}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
            placeholder="Public place name or address"
          />
          {searchQuery.trim() && !readOnly ? (
            <Button
              as="a"
              href={queryUrl}
              target="_blank"
              rel="noopener noreferrer"
              text="Search"
              mode="ghost"
            />
          ) : (
            <Button text="Search" mode="ghost" disabled />
          )}
        </Flex>
        <Text size={1} muted>
          This opens OpenStreetMap’s own search page. Only search public place information; do not
          submit private or confidential addresses. Select a result there, then place the pin or
          enter the coordinates here.
        </Text>
      </div>

      {coordinates ? (
        <Card padding={3} tone="positive" radius={2}>
          <Text size={1}>
            Saved value preview: {coordinates.lat}, {coordinates.lng} ·{' '}
            {location.precision === 'approximate'
              ? `approximate area, ${location.radiusMeters} m radius`
              : 'exact pin'}
          </Text>
        </Card>
      ) : (
        <Text size={1} muted>
          No location is saved until a valid point is selected.
        </Text>
      )}

      <Button
        text="Clear location"
        tone="critical"
        mode="ghost"
        disabled={readOnly || !coordinates}
        onClick={clearLocation}
      />
    </div>
  )
}
