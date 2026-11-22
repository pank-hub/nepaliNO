import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import {
  aggregateLocationforecast,
  isValidCoordinatePair,
  normalizeYrWeatherBlock,
  resolveTimezone,
  roundMetCoord,
} from '../../src/lib/weather/met.ts'
import {
  findWeatherPreset,
  formatWeatherDateShort,
  getWeatherConditionLabel,
  getWeatherIconKind,
} from '../../src/lib/weather/symbols.ts'

const repoRoot = path.resolve(import.meta.dirname, '..', '..')

test('coordinate rounding, validation, and timezone fallback', () => {
  assert.equal(roundMetCoord(59.913868), 59.9139)
  assert.equal(roundMetCoord(10.752245), 10.7522)
  assert.equal(isValidCoordinatePair(59.91, 10.75), true)
  assert.equal(isValidCoordinatePair(0, 0), true)
  assert.equal(isValidCoordinatePair(95, 10), false)
  assert.equal(isValidCoordinatePair(59.91, NaN), false)
  assert.equal(resolveTimezone(undefined, 27.7172, 85.324), 'Asia/Kathmandu')
  assert.equal(resolveTimezone(undefined, 59.9139, 10.7522), 'Europe/Oslo')
  assert.equal(resolveTimezone('Europe/London', 59.91, 10.75), 'Europe/London')
})

test('aggregateLocationforecast computes daily min/max, non-overlapping precip, and date filtering', () => {
  const payload = {
    properties: {
      timeseries: [
        {
          time: '2026-11-23T06:00:00Z',
          data: {
            instant: {details: {air_temperature: -4.2, wind_speed: 3.1}},
            next_1_hours: {summary: {symbol_code: 'cloudy'}, details: {precipitation_amount: 0.4}},
            next_6_hours: {summary: {symbol_code: 'snow'}, details: {precipitation_amount: 2.5}},
          },
        },
        {
          time: '2026-11-23T07:00:00Z',
          data: {
            instant: {details: {air_temperature: -2.0, wind_speed: 4.5}},
            next_1_hours: {summary: {symbol_code: 'snow_day'}, details: {precipitation_amount: 0.6}},
          },
        },
        {
          time: '2026-11-23T12:00:00Z',
          data: {
            instant: {details: {air_temperature: 1.5, wind_speed: 2.0}},
            next_1_hours: {summary: {symbol_code: 'clearsky_day'}, details: {precipitation_amount: 0.0}},
          },
        },
        {
          time: '2026-11-24T12:00:00Z',
          data: {
            instant: {details: {air_temperature: -8.0, wind_speed: 5.2}},
            next_6_hours: {summary: {symbol_code: 'partlycloudy_day'}, details: {precipitation_amount: 1.2}},
          },
        },
        {
          time: '2026-11-25T12:00:00Z',
          data: {
            instant: {details: {air_temperature: -10.5, wind_speed: 1.0}},
            next_6_hours: {summary: {symbol_code: 'fair_day'}, details: {precipitation_amount: 0.0}},
          },
        },
      ],
    },
  }

  const result = aggregateLocationforecast(payload, {
    key: 'oslo',
    label: 'Oslo',
    lat: 59.91389,
    lon: 10.75224,
    timezone: 'Europe/Oslo',
    startDate: '2026-11-23',
    endDate: '2026-11-24',
    nowMs: Date.parse('2026-11-23T06:10:00Z'),
  })

  assert.equal(result.lat, 59.9139)
  assert.equal(result.lon, 10.7522)
  assert.equal(result.current?.temperature, -4.2)
  assert.equal(result.days.length, 2)
  assert.deepEqual(result.days[0], {
    date: '2026-11-23',
    minTemp: -4.2,
    maxTemp: 1.5,
    // 0.4 + 0.6 + 0.0 (does NOT double-count next_6_hours from 06:00)
    precipitationMm: 1.0,
    windMaxMs: 4.5,
    symbolCode: 'clearsky_day',
  })
  assert.equal(result.days[1].date, '2026-11-24')
  assert.equal(result.days[1].minTemp, -8)
  assert.equal(result.days[1].precipitationMm, 1.2)
})

test('weather symbols and presets cover ne and nb cleanly', () => {
  assert.equal(getWeatherConditionLabel('clearsky_day', 'ne'), 'सफा आकाश')
  assert.equal(getWeatherConditionLabel('clearsky_night', 'nb'), 'Klarvær')
  assert.equal(getWeatherConditionLabel('heavysnow_polartwilight', 'ne'), 'भारी हिमपात')
  assert.equal(getWeatherIconKind('clearsky_night'), 'moon')
  assert.equal(getWeatherIconKind('rainandthunder'), 'thunder')
  assert.equal(findWeatherPreset('kathmandu')?.timezone, 'Asia/Kathmandu')
  assert.equal(findWeatherPreset('oslo')?.timezone, 'Europe/Oslo')
  assert.equal(formatWeatherDateShort('2026-11-22', 'ne'), '२२ नोभेम्बर (आइत)')
  assert.match(formatWeatherDateShort('2026-11-22', 'nb'), /22/)
})

test('normalizeYrWeatherBlock filters snapshot days by configured dates and drops invalid locations', () => {
  const normalized = normalizeYrWeatherBlock({
    title: 'Weather comparison',
    mode: 'live',
    viewMode: 'table',
    startDate: '2026-11-24',
    endDate: '2026-11-25',
    locations: [
      {label: 'Oslo', lat: 59.9139, lon: 10.7522},
      {label: 'Bad', lat: 999, lon: 10},
    ],
    snapshotLocations: [
      {
        key: 'oslo',
        label: 'Oslo',
        lat: 59.9139,
        lon: 10.7522,
        days: [
          {date: '2026-11-23', minTemp: -1, maxTemp: 2},
          {date: '2026-11-24', minTemp: -4, maxTemp: 1},
          {date: '2026-11-26', minTemp: -8, maxTemp: -4},
        ],
      },
    ],
  })

  assert.equal(normalized.mode, 'live')
  assert.equal(normalized.viewMode, 'table')
  assert.equal(normalized.locations.length, 1)
  assert.equal(normalized.snapshotLocations[0].days.length, 1)
  assert.equal(normalized.snapshotLocations[0].days[0].date, '2026-11-24')
})

test('Sanity schemas and Astro PortableText renderers wire yrWeather', () => {
  const schemaIndex = fs.readFileSync(path.join(repoRoot, 'sanity/schemaTypes/index.ts'), 'utf8')
  const newsSchema = fs.readFileSync(path.join(repoRoot, 'sanity/schemaTypes/newsArticle.ts'), 'utf8')
  const guideSchema = fs.readFileSync(path.join(repoRoot, 'sanity/schemaTypes/publicInformationGuide.ts'), 'utf8')
  const newsView = fs.readFileSync(path.join(repoRoot, 'src/components/articles/NewsArticleView.astro'), 'utf8')
  const guideView = fs.readFileSync(path.join(repoRoot, 'src/components/articles/GuideView.astro'), 'utf8')
  const homePage = fs.readFileSync(path.join(repoRoot, 'src/pages/[lang]/index.astro'), 'utf8')

  assert.match(schemaIndex, /yrWeather/)
  assert.match(newsSchema, /type:\s*'yrWeather'/)
  assert.match(guideSchema, /type:\s*'yrWeather'/)
  assert.match(newsView, /yrWeather:.*YrWeatherNe/)
  assert.match(guideView, /yrWeather:.*YrWeatherNe/)
  assert.doesNotMatch(homePage, /HomeWeatherBar/)
})
