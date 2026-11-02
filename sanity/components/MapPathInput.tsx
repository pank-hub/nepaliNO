import {Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {useEffect, useRef, useState} from 'react'
import {PatchEvent, set, unset, useFormValue, type ObjectInputProps} from 'sanity'
import type {LayerGroup, Map as LeafletMap} from 'leaflet'
import 'leaflet/dist/leaflet.css'

import {
  EDITORIAL_PATH_LIMITS,
  LOCATION_DEFAULTS,
  MAP_PROVIDER,
  PATH_COLORS,
  type MapEditorialPath,
  type MapPlace,
} from '../../src/lib/maps/location'
import {
  editorialPathNeedsReview,
  placesBounds,
  placesSignature,
  validateEditorialPath,
} from '../../src/lib/maps/places'

type Point = {_key: string; _type: 'geopoint'; lat: number; lng: number}

const round = (value: number) => Number(value.toFixed(6))
const newPoint = (lat: number, lng: number): Point => ({
  _key: Math.random().toString(36).slice(2, 10),
  _type: 'geopoint',
  lat: round(lat),
  lng: round(lng),
})

type EditorProps = {
  points: Point[]
  places: MapPlace[]
  colour: string
  dashed: boolean
  readOnly: boolean
  onCommit: (points: Point[]) => void
}

function PathEditor({points, places, colour, dashed, readOnly, onCommit}: EditorProps) {
  const element = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const layerRef = useRef<LayerGroup | null>(null)
  const leafletRef = useRef<typeof import('leaflet') | null>(null)
  const fitted = useRef(false)
  const latest = useRef({points, readOnly, onCommit})
  latest.current = {points, readOnly, onCommit}
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<number | null>(null)

  const fit = () => {
    const map = mapRef.current
    if (!map) return
    const bounds = placesBounds(places)
    let south = bounds?.south ?? Infinity
    let north = bounds?.north ?? -Infinity
    let west = bounds?.west ?? Infinity
    let east = bounds?.east ?? -Infinity
    for (const point of latest.current.points) {
      south = Math.min(south, point.lat)
      north = Math.max(north, point.lat)
      west = Math.min(west, point.lng)
      east = Math.max(east, point.lng)
    }
    if (!Number.isFinite(south)) return
    map.fitBounds(
      [
        [south, west],
        [north, east],
      ],
      {padding: [28, 28], maxZoom: 16},
    )
  }

  useEffect(() => {
    let active = true
    let map: LeafletMap | undefined
    void import('leaflet')
      .then(({default: L}) => {
        if (!active || !element.current) return
        leafletRef.current = L
        map = L.map(element.current, {
          center: [LOCATION_DEFAULTS.defaultCenter.lat, LOCATION_DEFAULTS.defaultCenter.lng],
          zoom: 12,
          scrollWheelZoom: false,
          keyboard: true,
        })
        map.on('click', (event) => {
          const current = latest.current
          if (current.readOnly) return
          if (current.points.length >= EDITORIAL_PATH_LIMITS.maximumPoints) {
            setError(`A path can have at most ${EDITORIAL_PATH_LIMITS.maximumPoints} points.`)
            return
          }
          setError('')
          const point = newPoint(event.latlng.lat, event.latlng.lng)
          current.onCommit([...current.points, point])
          setSelected(current.points.length)
        })
        L.tileLayer(MAP_PROVIDER.tiles, {
          attribution: MAP_PROVIDER.attribution,
          maxZoom: MAP_PROVIDER.maxZoom,
          referrerPolicy: MAP_PROVIDER.referrerPolicy,
        })
          .on('tileerror', () =>
            setError('Map tiles could not be loaded. Existing path data is unchanged.'),
          )
          .addTo(map)
        layerRef.current = L.layerGroup().addTo(map)
        mapRef.current = map
        setReady(true)
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'The map could not load.')
      })
    return () => {
      active = false
      map?.remove()
      mapRef.current = null
      layerRef.current = null
    }
  }, [])

  useEffect(() => {
    const L = leafletRef.current
    const map = mapRef.current
    const layer = layerRef.current
    if (!ready || !L || !map || !layer) return
    layer.clearLayers()

    for (const place of places) {
      if (!place.coordinates) continue
      const latlng: [number, number] = [place.coordinates.lat, place.coordinates.lng]
      if (place.precision === 'approximate' && place.radiusMeters) {
        L.circle(latlng, {
          radius: place.radiusMeters,
          color: '#6b7280',
          dashArray: '4 4',
          fillOpacity: 0.08,
          interactive: false,
        }).addTo(layer)
      } else {
        L.circleMarker(latlng, {
          radius: 7,
          color: '#111827',
          fillColor: '#fff',
          fillOpacity: 1,
          weight: 3,
          interactive: false,
        }).addTo(layer)
      }
    }

    const coordinates = points.map((point) => [point.lat, point.lng] as [number, number])
    if (coordinates.length > 1) {
      L.polyline(coordinates, {color: '#fff', weight: 9, opacity: 0.9, interactive: false}).addTo(
        layer,
      )
      L.polyline(coordinates, {
        color: colour,
        weight: 5,
        dashArray: dashed ? '10 10' : undefined,
        interactive: false,
      }).addTo(layer)
    }

    if (!readOnly) {
      for (let index = 0; index < points.length - 1; index += 1) {
        const a = points[index]
        const b = points[index + 1]
        L.marker([(a.lat + b.lat) / 2, (a.lng + b.lng) / 2], {
          title: `Insert a point between ${index + 1} and ${index + 2}`,
          keyboard: true,
          icon: L.divIcon({
            className: 'path-insert',
            iconSize: [16, 16],
            html: '<span style="display:block;width:16px;height:16px;line-height:14px;text-align:center;border-radius:50%;border:1px solid #111827;background:#fff;font:700 12px Arial,sans-serif;color:#111827">+</span>',
          }),
        })
          .on('click', () => {
            const current = latest.current
            if (current.points.length >= EDITORIAL_PATH_LIMITS.maximumPoints) return
            const next = [...current.points]
            next.splice(index + 1, 0, newPoint((a.lat + b.lat) / 2, (a.lng + b.lng) / 2))
            current.onCommit(next)
            setSelected(index + 1)
          })
          .addTo(layer)
      }
    }

    points.forEach((point, index) => {
      L.marker([point.lat, point.lng], {
        title: `Path point ${index + 1}`,
        keyboard: true,
        draggable: !readOnly,
        zIndexOffset: 1000,
        icon: L.divIcon({
          className: 'path-vertex',
          iconSize: [24, 24],
          html: `<span style="display:flex;width:24px;height:24px;align-items:center;justify-content:center;border-radius:50%;border:3px solid ${
            selected === index ? '#facc15' : '#fff'
          };background:${colour};color:#fff;font:700 11px Arial,sans-serif;box-shadow:0 1px 4px rgba(0,0,0,.5)">${index + 1}</span>`,
        }),
      })
        .on('click', () => setSelected(index))
        .on('dragend', (event) => {
          const {lat, lng} = (event.target as import('leaflet').Marker).getLatLng()
          const current = latest.current
          const next = [...current.points]
          next[index] = {...next[index], lat: round(lat), lng: round(lng)}
          current.onCommit(next)
          setSelected(index)
        })
        .addTo(layer)
    })

    if (!fitted.current) {
      fitted.current = true
      fit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, points, places, colour, dashed, readOnly, selected])

  const removeAt = (index: number) => {
    onCommit(points.filter((_, position) => position !== index))
    setSelected(null)
  }

  const insertAfter = (index: number) => {
    if (points.length >= EDITORIAL_PATH_LIMITS.maximumPoints) return
    const a = points[index]
    const b = points[index + 1]
    if (!a || !b) return
    const next = [...points]
    next.splice(index + 1, 0, newPoint((a.lat + b.lat) / 2, (a.lng + b.lng) / 2))
    onCommit(next)
    setSelected(index + 1)
  }

  const clear = () => {
    if (window.confirm('Clear the whole editorial path? This removes all drawn points.')) {
      onCommit([])
      setSelected(null)
    }
  }

  return (
    <Stack space={3}>
      <Text size={1} muted>
        Click the map to add a point at the end of the path. Drag a numbered point to move it. Click
        a “+” between two points to insert one. The path is drawn only by you: it is not calculated
        and no routing service is contacted.
      </Text>
      {error && (
        <Card padding={3} radius={2} tone="caution" border role="alert">
          <Text size={1}>{error}</Text>
        </Card>
      )}
      <div
        ref={element}
        role="region"
        aria-label="Editorial path drawing map"
        style={{height: 360, borderRadius: 4, border: '1px solid #bdcad7'}}
      />
      <Flex gap={2} wrap="wrap">
        <Button text="Fit path and locations" mode="ghost" onClick={fit} />
        <Button
          text="Remove selected point"
          mode="ghost"
          disabled={readOnly || selected === null || !points[selected]}
          onClick={() => selected !== null && removeAt(selected)}
        />
        <Button
          text="Clear path…"
          tone="critical"
          mode="ghost"
          disabled={readOnly || points.length === 0}
          onClick={clear}
        />
      </Flex>
      {points.length > 0 && (
        <Card padding={2} radius={2} border style={{maxHeight: 220, overflowY: 'auto'}}>
          <Stack space={2}>
            {points.map((point, index) => (
              <Flex key={point._key} gap={2} align="center" wrap="wrap">
                <Text size={1} weight={selected === index ? 'bold' : 'regular'}>
                  {index + 1}. {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
                </Text>
                <Button
                  text="Select"
                  mode="ghost"
                  fontSize={1}
                  onClick={() => setSelected(index)}
                />
                <Button
                  text="Insert after"
                  mode="ghost"
                  fontSize={1}
                  disabled={readOnly || index === points.length - 1}
                  onClick={() => insertAfter(index)}
                />
                <Button
                  text="Remove"
                  mode="ghost"
                  fontSize={1}
                  disabled={readOnly}
                  onClick={() => removeAt(index)}
                />
              </Flex>
            ))}
          </Stack>
        </Card>
      )}
    </Stack>
  )
}

export function MapPathInput(props: ObjectInputProps) {
  const {value, onChange, readOnly, path, renderDefault} = props
  const pathValue = (value ?? {}) as MapEditorialPath
  const siblingPlaces = useFormValue([...path.slice(0, -1), 'locations']) as MapPlace[] | undefined
  const places = Array.isArray(siblingPlaces) ? siblingPlaces : []
  const points = (Array.isArray(pathValue.points) ? pathValue.points : []) as Point[]
  const problem = validateEditorialPath(pathValue)
  const review = editorialPathNeedsReview(pathValue, places)
  const exactOrApproximate = places.filter((place) => place.coordinates).length

  const commit = (next: Point[]) => {
    onChange(
      PatchEvent.from(
        next.length
          ? [
              set(next, ['points']),
              set(new Date().toISOString(), ['updatedAt']),
              set(placesSignature(places), ['locationsSignature']),
            ]
          : [unset(['points']), unset(['updatedAt']), unset(['locationsSignature'])],
      ),
    )
  }

  return (
    <Stack space={3}>
      {renderDefault(props)}
      {pathValue.enabled && (
        <Stack space={3}>
          {exactOrApproximate < 2 && (
            <Card padding={3} radius={2} tone="caution" border>
              <Text size={1}>
                Add two or more locations above so the path has a start and a destination to
                connect. The path is never created automatically.
              </Text>
            </Card>
          )}
          {review && (
            <Card padding={3} radius={2} tone="caution" border role="alert">
              <Text size={1}>
                Location coordinates changed after this path was drawn. The path was not altered;
                check that it still follows the intended road, railway or corridor.
              </Text>
            </Card>
          )}
          {problem && (
            <Card padding={3} radius={2} tone="critical" border>
              <Text size={1}>{problem}</Text>
            </Card>
          )}
          <PathEditor
            points={points}
            places={places}
            colour={PATH_COLORS[pathValue.color ?? 'blue'] ?? PATH_COLORS.blue}
            dashed={pathValue.style === 'dashed'}
            readOnly={!!readOnly}
            onCommit={commit}
          />
        </Stack>
      )}
    </Stack>
  )
}
