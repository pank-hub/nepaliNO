import {defineArrayMember, defineField, defineType} from 'sanity'

import {YrWeatherInput} from '../components/YrWeatherInput'
import {isIsoDateString, isValidCoordinatePair} from '../../src/lib/weather/met'

export const yrWeatherLocation = defineType({
  name: 'yrWeatherLocation',
  title: 'Weather Location',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Display Label',
      type: 'string',
      validation: (rule) => rule.required().min(1).max(80),
    }),
    defineField({
      name: 'shortLabel',
      title: 'Short Label',
      type: 'string',
      validation: (rule) => rule.max(40),
    }),
    defineField({
      name: 'lat',
      title: 'Latitude',
      type: 'number',
      validation: (rule) =>
        rule.required().custom((lat) =>
          typeof lat === 'number' && Number.isFinite(lat) && lat >= -90 && lat <= 90
            ? true
            : 'Latitude must be between -90 and 90.',
        ),
    }),
    defineField({
      name: 'lon',
      title: 'Longitude',
      type: 'number',
      validation: (rule) =>
        rule.required().custom((lon) =>
          typeof lon === 'number' && Number.isFinite(lon) && lon >= -180 && lon <= 180
            ? true
            : 'Longitude must be between -180 and 180.',
        ),
    }),
    defineField({
      name: 'timezone',
      title: 'Timezone (IANA)',
      type: 'string',
      initialValue: 'Europe/Oslo',
      description: 'Examples: Europe/Oslo, Asia/Kathmandu',
    }),
  ],
  preview: {
    select: {title: 'label', lat: 'lat', lon: 'lon'},
    prepare: ({title, lat, lon}) => ({
      title: title || 'Weather location',
      subtitle:
        typeof lat === 'number' && typeof lon === 'number'
          ? `${lat.toFixed(4)}, ${lon.toFixed(4)}`
          : '',
    }),
  },
})

export const yrWeatherSnapshotCurrent = defineType({
  name: 'yrWeatherSnapshotCurrent',
  title: 'Snapshot Current Weather',
  type: 'object',
  fields: [
    defineField({name: 'time', title: 'Time', type: 'string'}),
    defineField({name: 'temperature', title: 'Temperature (°C)', type: 'number'}),
    defineField({name: 'windSpeedMs', title: 'Wind (m/s)', type: 'number'}),
    defineField({name: 'precipitationNext1h', title: 'Next 1h precip (mm)', type: 'number'}),
    defineField({name: 'symbolCode', title: 'Symbol code', type: 'string'}),
  ],
})

export const yrWeatherSnapshotDay = defineType({
  name: 'yrWeatherSnapshotDay',
  title: 'Snapshot Day Forecast',
  type: 'object',
  fields: [
    defineField({name: 'date', title: 'Date', type: 'string'}),
    defineField({name: 'minTemp', title: 'Min temp (°C)', type: 'number'}),
    defineField({name: 'maxTemp', title: 'Max temp (°C)', type: 'number'}),
    defineField({name: 'precipitationMm', title: 'Precipitation (mm)', type: 'number'}),
    defineField({name: 'windMaxMs', title: 'Max wind (m/s)', type: 'number'}),
    defineField({name: 'symbolCode', title: 'Symbol code', type: 'string'}),
  ],
})

export const yrWeatherSnapshotLocation = defineType({
  name: 'yrWeatherSnapshotLocation',
  title: 'Snapshot Location Forecast',
  type: 'object',
  fields: [
    defineField({name: 'key', title: 'Key', type: 'string'}),
    defineField({name: 'label', title: 'Label', type: 'string'}),
    defineField({name: 'shortLabel', title: 'Short label', type: 'string'}),
    defineField({name: 'lat', title: 'Latitude', type: 'number'}),
    defineField({name: 'lon', title: 'Longitude', type: 'number'}),
    defineField({name: 'timezone', title: 'Timezone', type: 'string'}),
    defineField({name: 'current', title: 'Current', type: 'yrWeatherSnapshotCurrent'}),
    defineField({
      name: 'days',
      title: 'Daily Forecasts',
      type: 'array',
      of: [defineArrayMember({type: 'yrWeatherSnapshotDay'})],
    }),
  ],
})

export const yrWeather = defineType({
  name: 'yrWeather',
  title: 'Yr Weather Forecast',
  type: 'object',
  components: {input: YrWeatherInput},
  groups: [
    {name: 'setup', title: 'Locations and dates', default: true},
    {name: 'display', title: 'Display'},
    {name: 'snapshot', title: 'Saved Yr snapshot'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'setup',
      validation: (rule) => rule.max(160),
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
      group: 'setup',
      validation: (rule) => rule.max(240),
    }),
    defineField({
      name: 'mode',
      title: 'Data Mode',
      type: 'string',
      group: 'setup',
      options: {
        layout: 'radio',
        list: [
          {
            title: 'Snapshot (frozen at edit time — recommended for news)',
            value: 'snapshot',
          },
          {
            title: 'Live (always shows latest Yr forecast)',
            value: 'live',
          },
        ],
      },
      initialValue: 'snapshot',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'viewMode',
      title: 'Layout Style',
      type: 'string',
      group: 'display',
      options: {
        layout: 'radio',
        list: [
          {title: 'City cards', value: 'cards'},
          {title: 'Comparison table', value: 'table'},
        ],
      },
      initialValue: 'cards',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'startDate',
      title: 'Start Date (YYYY-MM-DD)',
      type: 'string',
      group: 'setup',
      validation: (rule) =>
        rule.custom((val) =>
          !val || isIsoDateString(val) ? true : 'Use YYYY-MM-DD format.',
        ),
    }),
    defineField({
      name: 'endDate',
      title: 'End Date (YYYY-MM-DD)',
      type: 'string',
      group: 'setup',
      validation: (rule) =>
        rule.custom((val, context) => {
          if (!val) return true
          if (!isIsoDateString(val)) return 'Use YYYY-MM-DD format.'
          const start = (context.parent as {startDate?: string} | undefined)?.startDate
          if (start && isIsoDateString(start) && val < start) {
            return 'End date must be on or after start date.'
          }
          return true
        }),
    }),
    defineField({
      name: 'locations',
      title: 'Locations',
      type: 'array',
      group: 'setup',
      of: [defineArrayMember({type: 'yrWeatherLocation'})],
      validation: (rule) =>
        rule
          .required()
          .min(1)
          .max(8)
          .custom((locs) => {
            if (!Array.isArray(locs)) return 'Add at least one location.'
            for (const item of locs) {
              const l = item as {lat?: unknown; lon?: unknown}
              if (!isValidCoordinatePair(l?.lat, l?.lon)) {
                return 'Each location must have valid latitude and longitude.'
              }
            }
            return true
          }),
    }),
    defineField({
      name: 'showPrecipitation',
      title: 'Show precipitation (mm)',
      type: 'boolean',
      group: 'display',
      initialValue: true,
    }),
    defineField({
      name: 'showWind',
      title: 'Show max wind (m/s)',
      type: 'boolean',
      group: 'display',
      initialValue: false,
    }),
    defineField({
      name: 'note',
      title: 'Editorial Note',
      type: 'text',
      rows: 2,
      group: 'display',
      validation: (rule) => rule.max(300),
    }),
    defineField({
      name: 'fetchedAt',
      title: 'Snapshot Fetched At',
      type: 'string',
      group: 'snapshot',
      readOnly: true,
    }),
    defineField({
      name: 'snapshotLocations',
      title: 'Saved Forecast Data',
      type: 'array',
      group: 'snapshot',
      of: [defineArrayMember({type: 'yrWeatherSnapshotLocation'})],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      locations: 'locations',
      mode: 'mode',
      startDate: 'startDate',
      endDate: 'endDate',
    },
    prepare: ({title, locations, mode, startDate, endDate}) => {
      const names = Array.isArray(locations)
        ? locations.map((l: {label?: string; shortLabel?: string}) => l.shortLabel || l.label).filter(Boolean)
        : []
      const dateRange =
        startDate || endDate ? `${startDate || '...'} → ${endDate || '...'}` : 'Multi-day'
      return {
        title: title || (names.length ? `Weather: ${names.join(', ')}` : 'Yr Weather Forecast'),
        subtitle: `${mode === 'live' ? 'Live' : 'Snapshot'} • ${names.length} location(s) • ${dateRange}`,
      }
    },
  },
})
