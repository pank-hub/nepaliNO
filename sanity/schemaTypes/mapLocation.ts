import {defineField, defineType} from 'sanity'

import {MapLocationInput} from '../components/MapLocationInput'
import {MapPlacesInput} from '../components/MapPlacesInput'
import {MapPathInput} from '../components/MapPathInput'
import {MapRouteInput} from '../components/MapRouteInput'
import {MapTravelPlaceInput} from '../components/MapTravelPlaceInput'
import {eligibleMapPlaces, mapTravelValidation} from '../../src/lib/entur/mapDestination'
import {
  EDITORIAL_PATH_LIMITS,
  LOCATION_DEFAULTS,
  PATH_COLORS,
  PATH_STYLES,
  PLACE_ICONS,
  ROUTING_CALCULATION_ENABLED,
  validateCoordinates,
  validateMapLocation,
  type LocationMapBlock,
} from '../../src/lib/maps/location'
import {
  editorialPathNeedsReview,
  validateEditorialPath,
  validatePlace,
  validatePlaces,
  validateRoute,
} from '../../src/lib/maps/places'

export const mapLocation = defineType({
  name: 'mapLocation',
  title: 'Map Location',
  type: 'object',
  components: {input: MapLocationInput},
  fields: [
    defineField({
      name: 'coordinates',
      title: 'Coordinates',
      type: 'geopoint',
      validation: (rule) =>
        rule.custom((coordinates) => {
          if (!coordinates) return true
          return validateCoordinates(coordinates) ?? true
        }),
    }),
    defineField({
      name: 'precision',
      title: 'Location Precision',
      type: 'string',
      options: {
        layout: 'radio',
        list: [
          {title: 'Exact pin', value: 'exact'},
          {title: 'Approximate area', value: 'approximate'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'radiusMeters',
      title: 'Approximate Radius (metres)',
      type: 'number',
      hidden: ({parent}) => parent?.precision !== 'approximate',
      validation: (rule) =>
        rule.custom((radius, context) => {
          const parent = context.parent
          if (
            typeof parent !== 'object' ||
            parent === null ||
            !('precision' in parent) ||
            parent.precision !== 'approximate'
          ) {
            return true
          }
          return Number.isFinite(radius) &&
            radius! >= LOCATION_DEFAULTS.minimumRadiusMeters &&
            radius! <= LOCATION_DEFAULTS.maximumRadiusMeters
            ? true
            : `Enter a radius from ${LOCATION_DEFAULTS.minimumRadiusMeters} to ${LOCATION_DEFAULTS.maximumRadiusMeters} metres.`
        }),
    }),
    defineField({
      name: 'initialZoom',
      title: 'Initial Zoom',
      type: 'number',
      validation: (rule) =>
        rule.custom((zoom) =>
          Number.isFinite(zoom) &&
          zoom! >= LOCATION_DEFAULTS.minimumZoom &&
          zoom! <= LOCATION_DEFAULTS.maximumZoom
            ? true
            : `Enter a zoom from ${LOCATION_DEFAULTS.minimumZoom} to ${LOCATION_DEFAULTS.maximumZoom}.`,
        ),
    }),
  ],
  validation: (rule) =>
    rule.custom((location) => {
      if (!location) return true
      return validateMapLocation(location) ?? true
    }),
  preview: {
    select: {coordinates: 'coordinates', precision: 'precision'},
    prepare: ({coordinates, precision}) => ({
      title: coordinates
        ? `${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`
        : 'No map location selected',
      subtitle: precision === 'approximate' ? 'Approximate area' : 'Exact pin',
    }),
  },
})

const ICON_TITLES: Record<string, string> = {
  pin: 'Standard pin',
  home: 'Home',
  parking: 'Parking',
  restaurant: 'Restaurant',
  hospital: 'Hospital',
  airport: 'Airport',
  warning: 'Warning',
}

export const mapPlace = defineType({
  name: 'mapPlace',
  title: 'Map Place',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      description: 'Shown next to the marker and in the text list. Required.',
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: 'description',
      title: 'Optional Description',
      type: 'text',
      rows: 2,
      validation: (rule) => rule.max(300),
    }),
    defineField({
      name: 'coordinates',
      title: 'Coordinates',
      type: 'geopoint',
      validation: (rule) =>
        rule.custom((coordinates) =>
          coordinates ? (validateCoordinates(coordinates) ?? true) : true,
        ),
    }),
    defineField({
      name: 'precision',
      title: 'Precision',
      type: 'string',
      options: {
        layout: 'radio',
        list: [
          {title: 'Exact pin', value: 'exact'},
          {title: 'Approximate area', value: 'approximate'},
        ],
      },
      initialValue: 'exact',
    }),
    defineField({
      name: 'radiusMeters',
      title: 'Approximate Radius (metres)',
      type: 'number',
      hidden: ({parent}) => parent?.precision !== 'approximate',
    }),
    defineField({
      name: 'icon',
      title: 'Icon (exact locations only)',
      type: 'string',
      hidden: ({parent}) => parent?.precision === 'approximate',
      options: {
        list: PLACE_ICONS.map((value) => ({title: ICON_TITLES[value], value})),
      },
      initialValue: 'pin',
    }),
    defineField({
      name: 'showLabel',
      title: 'Always show label on the map (exact locations only)',
      type: 'boolean',
      description:
        'The label is always listed below the map. Turn this off to show it only on hover or focus.',
      hidden: ({parent}) => parent?.precision === 'approximate',
      initialValue: true,
    }),
  ],
  validation: (rule) =>
    rule.custom((place) => (place ? (validatePlace(place as never) ?? true) : true)),
  preview: {
    select: {title: 'label', precision: 'precision', icon: 'icon'},
    prepare: ({title, precision, icon}) => ({
      title: title || 'Unnamed location',
      subtitle:
        precision === 'approximate'
          ? 'Approximate area'
          : `Exact pin · ${ICON_TITLES[icon as string] ?? ICON_TITLES.pin}`,
    }),
  },
})

export const mapRoute = defineType({
  name: 'mapRoute',
  title: 'Saved Driving Route',
  type: 'object',
  components: {input: MapRouteInput},
  fields: [
    defineField({
      name: 'enabled',
      title: 'Show a driving route',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'stopKeys',
      title: 'Ordered stop keys',
      type: 'array',
      of: [{type: 'string'}],
    }),
    defineField({
      name: 'geometry',
      title: 'Saved geometry (encoded)',
      type: 'text',
      rows: 2,
      readOnly: true,
    }),
    defineField({name: 'distanceMeters', title: 'Distance (m)', type: 'number', readOnly: true}),
    defineField({
      name: 'durationSeconds',
      title: 'Estimated duration (s)',
      type: 'number',
      readOnly: true,
    }),
    defineField({name: 'calculatedAt', title: 'Calculated at', type: 'datetime', readOnly: true}),
    defineField({name: 'providerName', title: 'Routing provider', type: 'string', readOnly: true}),
    defineField({
      name: 'stopsSignature',
      title: 'Stops fingerprint',
      type: 'string',
      readOnly: true,
    }),
  ],
  preview: {
    select: {enabled: 'enabled', stops: 'stopKeys'},
    prepare: ({enabled, stops}) => ({
      title: enabled ? 'Driving route enabled' : 'No driving route',
      subtitle: enabled ? `${(stops as string[] | undefined)?.length ?? 0} stops` : undefined,
    }),
  },
})

export const mapEditorialPath = defineType({
  name: 'mapEditorialPath',
  title: 'Highlighted Editorial Path',
  type: 'object',
  components: {input: MapPathInput},
  fields: [
    defineField({
      name: 'enabled',
      title: 'Highlighted editorial path',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'label',
      title: 'Optional Path Label',
      type: 'string',
      validation: (rule) => rule.max(120),
    }),
    defineField({
      name: 'description',
      title: 'Optional Path Description',
      type: 'text',
      rows: 2,
      validation: (rule) => rule.max(500),
    }),
    defineField({
      name: 'color',
      title: 'Line Colour',
      type: 'string',
      options: {
        list: Object.keys(PATH_COLORS).map((value) => ({
          title: value.charAt(0).toUpperCase() + value.slice(1),
          value,
        })),
      },
      initialValue: 'blue',
    }),
    defineField({
      name: 'style',
      title: 'Line Style',
      type: 'string',
      options: {
        layout: 'radio',
        list: PATH_STYLES.map((value) => ({title: value === 'solid' ? 'Solid' : 'Dashed', value})),
      },
      initialValue: 'solid',
    }),
    defineField({
      name: 'points',
      title: 'Path points (drawn on the map)',
      type: 'array',
      of: [{type: 'geopoint'}],
      hidden: true,
      validation: (rule) => rule.max(EDITORIAL_PATH_LIMITS.maximumPoints),
    }),
    defineField({name: 'updatedAt', title: 'Path last edited', type: 'datetime', hidden: true}),
    defineField({
      name: 'locationsSignature',
      title: 'Locations fingerprint',
      type: 'string',
      hidden: true,
    }),
  ],
  preview: {
    select: {enabled: 'enabled', points: 'points', label: 'label'},
    prepare: ({enabled, points, label}) => ({
      title: enabled ? label || 'Highlighted editorial path' : 'No editorial path',
      subtitle: enabled ? `${(points as unknown[] | undefined)?.length ?? 0} points` : undefined,
    }),
  },
})

export const mapPresentation = defineType({
  name: 'mapPresentation',
  title: 'Map Presentation',
  type: 'object',
  options: {collapsible: true, collapsed: true},
  description: 'Optional display overrides for the sidebar map (title, pin icon, caption, or path).',
  fields: [
    defineField({name: 'title', title: 'Public map title', type: 'string', validation: (rule) => rule.max(120)}),
    defineField({name: 'markerLabel', title: 'Public place or pin label', type: 'string', validation: (rule) => rule.max(80)}),
    defineField({name: 'caption', title: 'Caption', type: 'text', rows: 2, validation: (rule) => rule.max(500)}),
    defineField({
      name: 'markerIcon',
      title: 'Marker icon (exact locations)',
      type: 'string',
      options: {list: PLACE_ICONS.map((value) => ({title: ICON_TITLES[value], value}))},
    }),
    defineField({name: 'markerShowLabel', title: 'Always show marker label', type: 'boolean', initialValue: true}),
    defineField({
      name: 'mapStyle',
      title: 'Map Style',
      type: 'string',
      options: {
        layout: 'radio',
        list: [
          {title: 'City (streets & transit)', value: 'city'},
          {title: 'Editorial (calm, NRK-style)', value: 'editorial'},
        ],
      },
      initialValue: 'city',
    }),
    defineField({
      name: 'showNorwayLocator',
      title: 'Show Norway mini-locator inset',
      type: 'boolean',
    }),
    defineField({
      name: 'editorialPath',
      title: 'Optional highlighted editorial path',
      type: 'mapEditorialPath',
      validation: (rule) => rule.custom((path) => validateEditorialPath(path as never) ?? true),
    }),
  ],
})

export const locationMap = defineType({
  name: 'locationMap',
  title: 'Location Map',
  type: 'object',
  fieldsets: [
    {
      name: 'details',
      title: 'Caption, source & path',
      options: {collapsible: true, collapsed: true},
    },
    {
      name: 'display',
      title: 'Display options',
      options: {collapsible: true, collapsed: true},
    },
  ],
  initialValue: {
    mapStyle: 'editorial',
    loadingBehavior: 'click',
    showViewOnMapActions: false,
    showOpenStreetMapLinks: false,
    showLocationList: false,
    showOpenStreetMapControl: false,
    showFullscreenControl: true,
    travelHelpEnabled: false,
  },
  fields: [
    defineField({
      name: 'title',
      title: 'Optional Title',
      type: 'string',
      validation: (rule) => rule.max(120),
    }),
    defineField({
      name: 'mapStyle',
      title: 'Map Style',
      type: 'string',
      options: {
        layout: 'radio',
        list: [
          {title: 'Editorial (calm, NRK-style)', value: 'editorial'},
          {title: 'City (streets & transit)', value: 'city'},
        ],
      },
      description: 'Use Editorial for clean story maps; City for street names, buildings, and transit.',
      initialValue: 'editorial',
    }),
    defineField({
      name: 'locations',
      title: 'Map Locations',
      type: 'array',
      of: [{type: 'mapPlace'}],
      components: {input: MapPlacesInput},
      description:
        'Add one or more locations. Approximate areas show a circle only; never use a confidential address.',
      validation: (rule) =>
        rule.custom((places, context) => {
          const parent = context.parent as {location?: unknown} | undefined
          if ((!places || places.length === 0) && !parent?.location) {
            return 'Add at least one location.'
          }
          return validatePlaces(places as never) ?? true
        }),
    }),
    defineField({
      name: 'accessibleDescription',
      title: 'Accessible Location Description',
      type: 'text',
      rows: 2,
      description:
        'Short summary of the mapped location(s) for screen readers and when the map is not loaded.',
      validation: (rule) => rule.required().min(10).max(500),
    }),
    defineField({
      name: 'travelHelpEnabled',
      title: 'Offer travel assistance',
      type: 'boolean',
      description: 'Optional public-transport planner (exact locations only).',
      validation: (rule) => rule.custom((value, context) =>
        mapTravelValidation({...context.parent as LocationMapBlock | undefined, travelHelpEnabled: value}) ?? true),
    }),
    defineField({
      name: 'travelHelpPlaceKey',
      title: 'Travel assistance destination',
      type: 'string',
      components: {input: MapTravelPlaceInput},
      description: 'Choose one of this map’s existing exact locations.',
      hidden: ({parent}) => parent?.travelHelpEnabled !== true || eligibleMapPlaces(parent).length <= 1,
      validation: (rule) => rule.custom((_value, context) =>
        mapTravelValidation((context.parent ?? {}) as LocationMapBlock) ?? true),
    }),
    defineField({
      name: 'caption',
      title: 'Optional Caption',
      type: 'string',
      fieldset: 'details',
      validation: (rule) => rule.max(300),
    }),
    defineField({
      name: 'sourceLabel',
      title: 'Optional Source Label',
      type: 'string',
      fieldset: 'details',
      validation: (rule) => rule.max(120),
    }),
    defineField({
      name: 'sourceUrl',
      title: 'Optional Source URL',
      type: 'url',
      fieldset: 'details',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'initialZoom',
      title: 'Optional Initial Zoom (single exact location only)',
      type: 'number',
      fieldset: 'details',
      description: 'Multi-location maps fit all locations automatically.',
      validation: (rule) =>
        rule.custom((zoom) =>
          zoom === undefined ||
          (Number.isFinite(zoom) &&
            zoom >= LOCATION_DEFAULTS.minimumZoom &&
            zoom <= LOCATION_DEFAULTS.maximumZoom)
            ? true
            : `Enter a zoom from ${LOCATION_DEFAULTS.minimumZoom} to ${LOCATION_DEFAULTS.maximumZoom}.`,
        ),
    }),
    defineField({
      name: 'editorialPath',
      title: 'Optional Highlighted Editorial Path (manually drawn)',
      type: 'mapEditorialPath',
      fieldset: 'details',
      description:
        'A path you draw by hand to highlight a journey or corridor. It is not a calculated driving route.',
      validation: (rule) => [
        rule.custom((path) => validateEditorialPath(path as never) ?? true),
        rule
          .custom((path, context) => {
            const parent = context.parent as {locations?: unknown[]} | undefined
            return editorialPathNeedsReview(path as never, parent?.locations as never)
              ? 'Location coordinates changed since the path was drawn. Review the path.'
              : true
          })
          .warning(),
      ],
    }),
    defineField({
      name: 'loadingBehavior',
      title: 'Map loading behaviour',
      type: 'string',
      fieldset: 'display',
      options: {
        list: [
          {title: 'Load automatically near the map', value: 'automatic'},
          {title: 'Require the reader to load the map', value: 'click'},
        ],
        layout: 'radio',
      },
      description: 'Existing maps without a setting require the reader to load the map.',
      validation: (rule) =>
        rule.custom((value) =>
          value === undefined || value === 'automatic' || value === 'click'
            ? true
            : 'Choose a map loading behaviour.',
        ),
    }),
    defineField({
      name: 'showLocationList',
      title: 'Show location list below the map',
      type: 'boolean',
      fieldset: 'display',
      description:
        'When disabled, the list remains available to screen readers and appears if the map cannot load.',
    }),
    defineField({
      name: 'showViewOnMapActions',
      title: 'Show “View on map” actions',
      type: 'boolean',
      fieldset: 'display',
      description: 'Show a focus button next to each place in the list.',
    }),
    defineField({
      name: 'showFullscreenControl',
      title: 'Show fullscreen map control',
      type: 'boolean',
      fieldset: 'display',
      description: 'Show the square fullscreen toggle inside the map.',
    }),
    defineField({
      name: 'showNorwayLocator',
      title: 'Show Norway mini-locator inset',
      type: 'boolean',
      fieldset: 'display',
      description: 'Defaults to on for Editorial maps inside Norway and off for City maps.',
    }),
    defineField({
      name: 'showOpenStreetMapLinks',
      title: 'Show “Open in OpenStreetMap” links',
      type: 'boolean',
      hidden: true,
    }),
    defineField({
      name: 'showOpenStreetMapControl',
      title: 'Show “Open this map in OpenStreetMap” control',
      type: 'boolean',
      hidden: true,
    }),
    defineField({
      name: 'route',
      title: 'Optional Driving Route',
      type: 'mapRoute',
      // Evaluation feature, unapproved. Hidden from the editor UI (stored data is kept and still
      // renders) until ROUTING_CALCULATION_ENABLED is set in src/lib/maps/location.ts.
      hidden: () => !ROUTING_CALCULATION_ENABLED,
      validation: (rule) =>
        rule.custom((route, context) => {
          const parent = context.parent as {locations?: unknown[]} | undefined
          return validateRoute(route as never, parent?.locations as never) ?? true
        }),
    }),
    defineField({
      name: 'location',
      title: 'Legacy Single Location (existing content)',
      type: 'mapLocation',
      description:
        'Only present on maps created before multi-location support. It keeps working; add locations above to replace it.',
      hidden: ({value}) => !value,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      description: 'accessibleDescription',
      locations: 'locations',
      precision: 'location.precision',
      travelHelpEnabled: 'travelHelpEnabled',
      travelHelpPlaceKey: 'travelHelpPlaceKey',
    },
    prepare: ({title, description, locations, precision, travelHelpEnabled, travelHelpPlaceKey}) => {
      const places = Array.isArray(locations) ? (locations as {label?: string}[]) : []
      const summary = places.length
        ? `${places.length} location${places.length === 1 ? '' : 's'}: ${places
            .slice(0, 3)
            .map((place) => place.label || 'unnamed')
            .join(', ')}${places.length > 3 ? '…' : ''}`
        : precision === 'approximate'
          ? 'Approximate area (legacy)'
          : 'Exact pin (legacy)'
      return {
        title: title || 'Location map',
        subtitle: `${summary}${travelHelpEnabled ? ` · Travel assistance${travelHelpPlaceKey ? `: ${travelHelpPlaceKey}` : ''}` : ''}${description ? ` · ${description}` : ''}`,
      }
    },
  },
})
