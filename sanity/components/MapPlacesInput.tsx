import {Button, Card, Flex, Select, Stack, Text, TextArea, TextInput} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {PatchEvent, set, unset, type ArrayOfObjectsInputProps} from 'sanity'
import type {LayerGroup, LeafletMouseEvent, Map as LeafletMap} from 'leaflet'

import {
  LOCATION_DEFAULTS,
  MAP_PROVIDER,
  PLACE_ICONS,
  searchOpenStreetMap,
  validateCoordinates,
  type LocationPrecision,
  type MapPlace,
  type PlaceIcon,
} from '../../src/lib/maps/location'
import {createPlaceIcon, labelContent} from '../../src/lib/maps/markerIcons'
import {
  createPlaceKey,
  iconForPlace,
  placesBounds,
  validatePlace,
  validatePlaces,
} from '../../src/lib/maps/places'

import 'leaflet/dist/leaflet.css'

const ICON_TITLES: Record<PlaceIcon, string> = {
  pin: 'Standard pin',
  home: 'Home',
  parking: 'Parking',
  restaurant: 'Restaurant',
  hospital: 'Hospital',
  airport: 'Airport',
  warning: 'Warning',
}

const readNumber = (raw: string): number | undefined =>
  raw.trim() === '' ? undefined : Number(raw)

type StoredPlace = MapPlace & {_type?: 'mapPlace'}

export function MapPlacesInput(props: ArrayOfObjectsInputProps) {
  const {value, onChange, readOnly} = props
  const places = useMemo(() => (Array.isArray(value) ? (value as StoredPlace[]) : []), [value])
  const [selectedKey, setSelectedKey] = useState<string | undefined>(places[0]?._key)
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState('')
  const mapElement = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const layerRef = useRef<LayerGroup | null>(null)
  const leafletRef = useRef<typeof import('leaflet') | null>(null)
  const fittedRef = useRef(false)

  const selected = places.find((place) => place._key === selectedKey)
  const selectedIndex = selected ? places.indexOf(selected) : -1
  const arrayError = validatePlaces(places)
  const selectedError = selected ? validatePlace(selected) : undefined

  const latestRef = useRef({places, selectedKey, readOnly})
  useEffect(() => {
    latestRef.current = {places, selectedKey, readOnly}
  }, [places, selectedKey, readOnly])

  const commit = useCallback(
    (next: StoredPlace[]) => {
      onChange(PatchEvent.from(next.length > 0 ? set(next) : unset()))
    },
    [onChange],
  )

  const updatePlace = useCallback(
    (key: string, changes: Partial<StoredPlace>) => {
      const current = latestRef.current.places
      commit(current.map((place) => (place._key === key ? {...place, ...changes} : place)))
    },
    [commit],
  )

  const moveSelected = useCallback(
    (lat: number, lng: number) => {
      const {selectedKey: key, readOnly: locked} = latestRef.current
      if (!key || locked) return
      updatePlace(key, {
        coordinates: {_type: 'geopoint', lat, lng} as MapPlace['coordinates'],
      })
    },
    [updatePlace],
  )

  // Keep the typed coordinate text unless the stored number really differs.
  useEffect(() => {
    const point = selected?.coordinates
    setLatitude((text) =>
      point ? (Number(text) === point.lat && text !== '' ? text : String(point.lat)) : '',
    )
    setLongitude((text) =>
      point ? (Number(text) === point.lng && text !== '' ? text : String(point.lng)) : '',
    )
  }, [selected?.coordinates?.lat, selected?.coordinates?.lng, selectedKey, selected])

  useEffect(() => {
    if (selectedKey && !places.some((place) => place._key === selectedKey)) {
      setSelectedKey(places[0]?._key)
    }
  }, [places, selectedKey])

  useEffect(() => {
    let active = true
    let map: LeafletMap | undefined
    void import('leaflet')
      .then(({default: L}) => {
        if (!active || !mapElement.current) return
        leafletRef.current = L
        map = L.map(mapElement.current, {
          center: [LOCATION_DEFAULTS.defaultCenter.lat, LOCATION_DEFAULTS.defaultCenter.lng],
          zoom: LOCATION_DEFAULTS.exactZoom,
          scrollWheelZoom: false,
          keyboard: true,
        })
        map.on('click', (event: LeafletMouseEvent) => {
          moveSelected(event.latlng.lat, event.latlng.lng)
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
        layerRef.current = L.layerGroup().addTo(map)
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
      layerRef.current = null
    }
  }, [moveSelected])

  const fitAll = useCallback(() => {
    const map = mapRef.current
    const bounds = placesBounds(latestRef.current.places)
    if (!map || !bounds) return
    map.fitBounds(
      [
        [bounds.south, bounds.west],
        [bounds.north, bounds.east],
      ],
      {padding: [28, 28], maxZoom: 16},
    )
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    const L = leafletRef.current
    if (!mapReady || !map || !layer || !L) return
    layer.clearLayers()
    for (const place of places) {
      const point = place.coordinates
      if (!point || validateCoordinates(point)) continue
      const isSelected = place._key === selectedKey
      const key = place._key
      if (place.precision === 'approximate') {
        const circle = L.circle([point.lat, point.lng], {
          radius: Number.isFinite(place.radiusMeters) ? place.radiusMeters! : 0,
          color: isSelected ? '#1d4ed8' : '#b42318',
          fillColor: isSelected ? '#3b82f6' : '#f04438',
          fillOpacity: 0.18,
          weight: isSelected ? 3 : 2,
          dashArray: '6 6',
        }).addTo(layer)
        circle.on('click', (event) => {
          L.DomEvent.stopPropagation(event)
          if (key) setSelectedKey(key)
        })
        if (isSelected) {
          const centre = L.marker([point.lat, point.lng], {
            draggable: !readOnly,
            title: 'Circle centre (editor only, public coordinate data)',
          }).addTo(layer)
          centre.on('dragend', () => {
            const next = centre.getLatLng()
            moveSelected(next.lat, next.lng)
          })
        }
        continue
      }
      const marker = L.marker([point.lat, point.lng], {
        draggable: isSelected && !readOnly,
        title: place.label || 'Unnamed location',
        opacity: isSelected ? 1 : 0.7,
        zIndexOffset: isSelected ? 1000 : 0,
        icon: createPlaceIcon(L, iconForPlace(place)),
      }).addTo(layer)
      marker.bindTooltip(labelContent(place.label || 'Unnamed location', document), {
        permanent: true,
        direction: 'right',
        offset: [8, 0],
      })
      marker.on('click', () => {
        if (key) setSelectedKey(key)
      })
      marker.on('dragend', () => {
        const next = marker.getLatLng()
        moveSelected(next.lat, next.lng)
      })
    }
    if (!fittedRef.current && placesBounds(places)) {
      fittedRef.current = true
      fitAll()
    }
  }, [mapReady, places, selectedKey, readOnly, moveSelected, fitAll])

  const addPlace = () => {
    const key = createPlaceKey(places.map((place) => place._key ?? ''))
    commit([...places, {_type: 'mapPlace', _key: key, label: '', precision: 'exact', icon: 'pin'}])
    setSelectedKey(key)
  }

  const removeSelected = () => {
    if (!selected) return
    commit(places.filter((place) => place._key !== selected._key))
  }

  const moveBy = (offset: number) => {
    const target = selectedIndex + offset
    if (selectedIndex < 0 || target < 0 || target >= places.length) return
    const next = [...places]
    const [item] = next.splice(selectedIndex, 1)
    next.splice(target, 0, item)
    commit(next)
  }

  const changeLatLng = (nextLat: string, nextLng: string) => {
    setLatitude(nextLat)
    setLongitude(nextLng)
    const lat = readNumber(nextLat)
    const lng = readNumber(nextLng)
    if (
      selected?._key &&
      lat !== undefined &&
      lng !== undefined &&
      Number.isFinite(lat) &&
      Number.isFinite(lng)
    ) {
      updatePlace(selected._key, {
        coordinates: {_type: 'geopoint', lat, lng} as MapPlace['coordinates'],
      })
    }
  }

  const changePrecision = (precision: LocationPrecision) => {
    if (!selected?._key) return
    if (precision === 'approximate') {
      updatePlace(selected._key, {
        precision,
        radiusMeters: selected.radiusMeters ?? LOCATION_DEFAULTS.radiusMeters,
        icon: undefined,
      })
    } else {
      updatePlace(selected._key, {precision, radiusMeters: undefined, icon: selected.icon ?? 'pin'})
    }
  }

  const coordinateError =
    latitude !== '' || longitude !== ''
      ? (() => {
          const lat = readNumber(latitude)
          const lng = readNumber(longitude)
          if (lat === undefined || lng === undefined) return 'Enter both latitude and longitude.'
          return validateCoordinates({lat, lng})
        })()
      : undefined

  return (
    <Stack space={3}>
      <Card padding={3} radius={2} tone="caution" border>
        <Text size={1}>
          Approximate areas show a circle only, but the circle centre is still stored as public
          coordinate data. Choose a safe approximate centre, never a confidential address. Searching
          does not send anything automatically: the link below opens OpenStreetMap in a new tab.
        </Text>
      </Card>

      <Flex gap={2} wrap="wrap">
        <TextInput
          aria-label="Search text for OpenStreetMap"
          placeholder="Place or public address to look up"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
        />
        {searchQuery.trim() ? (
          <Button
            as="a"
            href={searchOpenStreetMap(searchQuery)}
            target="_blank"
            rel="noopener noreferrer"
            text="Search on OpenStreetMap"
            mode="ghost"
          />
        ) : (
          <Button text="Search on OpenStreetMap" mode="ghost" disabled />
        )}
      </Flex>

      <div
        ref={mapElement}
        role="region"
        aria-label="Map of all locations. Click the map to move the selected location."
        style={{height: 360, borderRadius: 4, overflow: 'hidden', background: '#e8eef5'}}
      />
      {mapError && (
        <Card padding={3} tone="critical" radius={2}>
          <Text size={1}>{mapError}</Text>
        </Card>
      )}

      <Flex gap={2} wrap="wrap">
        <Button text="Add location" mode="ghost" onClick={addPlace} disabled={readOnly} />
        <Button
          text="Fit all locations"
          mode="ghost"
          onClick={fitAll}
          disabled={places.length === 0}
        />
      </Flex>

      {places.length === 0 ? (
        <Text size={1} muted>
          No locations yet. Choose “Add location”, then click the map or enter coordinates.
        </Text>
      ) : (
        <Stack space={2} as="ol" style={{listStyle: 'none', margin: 0, padding: 0}}>
          {places.map((place, index) => (
            <li key={place._key ?? index}>
              <Button
                width="fill"
                mode={place._key === selectedKey ? 'default' : 'ghost'}
                tone={validatePlace(place) ? 'critical' : 'default'}
                aria-pressed={place._key === selectedKey}
                text={`${index + 1}. ${place.label || 'Unnamed location'} — ${
                  place.precision === 'approximate'
                    ? `Approximate area${place.radiusMeters ? `, ${place.radiusMeters} m` : ''}`
                    : `Exact pin, ${ICON_TITLES[iconForPlace(place)]}`
                }`}
                onClick={() => setSelectedKey(place._key)}
                style={{textAlign: 'left'}}
              />
            </li>
          ))}
        </Stack>
      )}

      {selected && (
        <Card padding={3} border radius={2}>
          <Stack space={3}>
            <Text weight="semibold" size={1}>
              Editing location {selectedIndex + 1} of {places.length}
            </Text>
            <label>
              <Text size={1}>Label (required, shown on the public map and list)</Text>
              <TextInput
                value={selected.label ?? ''}
                disabled={readOnly}
                maxLength={80}
                onChange={(event) =>
                  selected._key && updatePlace(selected._key, {label: event.currentTarget.value})
                }
              />
            </label>
            <label>
              <Text size={1}>Optional description</Text>
              <TextArea
                rows={2}
                value={selected.description ?? ''}
                disabled={readOnly}
                onChange={(event) =>
                  selected._key &&
                  updatePlace(selected._key, {
                    description: event.currentTarget.value || undefined,
                  })
                }
              />
            </label>
            <Flex gap={2} wrap="wrap">
              <label>
                <Text size={1}>Latitude</Text>
                <TextInput
                  inputMode="decimal"
                  value={latitude}
                  disabled={readOnly}
                  onChange={(event) => changeLatLng(event.currentTarget.value, longitude)}
                />
              </label>
              <label>
                <Text size={1}>Longitude</Text>
                <TextInput
                  inputMode="decimal"
                  value={longitude}
                  disabled={readOnly}
                  onChange={(event) => changeLatLng(latitude, event.currentTarget.value)}
                />
              </label>
            </Flex>
            {coordinateError && (
              <Text size={1} style={{color: '#b42318'}}>
                {coordinateError}
              </Text>
            )}
            <label>
              <Text size={1}>Precision</Text>
              <Select
                value={selected.precision === 'approximate' ? 'approximate' : 'exact'}
                disabled={readOnly}
                onChange={(event) =>
                  changePrecision(event.currentTarget.value as LocationPrecision)
                }
              >
                <option value="exact">Exact pin</option>
                <option value="approximate">Approximate area (circle, no pin)</option>
              </Select>
            </label>
            {selected.precision === 'approximate' ? (
              <label>
                <Text size={1}>Radius in metres (50 to 100000)</Text>
                <TextInput
                  inputMode="numeric"
                  value={String(selected.radiusMeters ?? '')}
                  disabled={readOnly}
                  onChange={(event) => {
                    const radius = readNumber(event.currentTarget.value)
                    if (selected._key) updatePlace(selected._key, {radiusMeters: radius})
                  }}
                />
              </label>
            ) : (
              <label>
                <Text size={1}>Icon (the text label is always shown too)</Text>
                <Select
                  value={iconForPlace(selected)}
                  disabled={readOnly}
                  onChange={(event) =>
                    selected._key &&
                    updatePlace(selected._key, {icon: event.currentTarget.value as PlaceIcon})
                  }
                >
                  {PLACE_ICONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {ICON_TITLES[icon]}
                    </option>
                  ))}
                </Select>
              </label>
            )}
            <Text size={1} muted>
              Saved value:{' '}
              {selected.coordinates
                ? `${selected.coordinates.lat}, ${selected.coordinates.lng}`
                : 'no coordinates yet'}
              {' · key '}
              <code>{selected._key}</code>
            </Text>
            {selectedError && (
              <Text size={1} style={{color: '#b42318'}}>
                {selectedError}
              </Text>
            )}
            <Flex gap={2} wrap="wrap">
              <Button
                text="Move up"
                mode="ghost"
                disabled={readOnly || selectedIndex <= 0}
                onClick={() => moveBy(-1)}
              />
              <Button
                text="Move down"
                mode="ghost"
                disabled={readOnly || selectedIndex >= places.length - 1}
                onClick={() => moveBy(1)}
              />
              <Button
                text="Remove location"
                tone="critical"
                mode="ghost"
                disabled={readOnly}
                onClick={removeSelected}
              />
            </Flex>
          </Stack>
        </Card>
      )}

      {arrayError && (
        <Card padding={3} tone="critical" radius={2}>
          <Text size={1}>{arrayError}</Text>
        </Card>
      )}
    </Stack>
  )
}
