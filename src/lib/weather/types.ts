export type WeatherLanguage = 'ne' | 'nb'

export type WeatherDataMode = 'snapshot' | 'live'
export type WeatherViewMode = 'cards' | 'table'

export interface WeatherLocationConfig {
  _key?: string
  label?: string
  shortLabel?: string
  lat: number
  lon: number
  timezone?: string
}

export interface WeatherDayForecast {
  date: string
  minTemp: number | null
  maxTemp: number | null
  precipitationMm: number | null
  windMaxMs: number | null
  symbolCode: string | null
}

export interface WeatherCurrent {
  time: string
  temperature: number | null
  windSpeedMs: number | null
  precipitationNext1h: number | null
  symbolCode: string | null
}

export interface WeatherLocationForecast {
  key: string
  label: string
  shortLabel?: string
  lat: number
  lon: number
  timezone: string
  current?: WeatherCurrent
  days: WeatherDayForecast[]
}

export interface YrWeatherBlockInput {
  _type?: string
  _key?: string
  title?: unknown
  subtitle?: unknown
  mode?: unknown
  viewMode?: unknown
  startDate?: unknown
  endDate?: unknown
  locations?: unknown
  showPrecipitation?: unknown
  showWind?: unknown
  note?: unknown
  fetchedAt?: unknown
  snapshotLocations?: unknown
}

export interface NormalizedYrWeatherBlock {
  title?: string
  subtitle?: string
  mode: WeatherDataMode
  viewMode: WeatherViewMode
  startDate?: string
  endDate?: string
  locations: WeatherLocationConfig[]
  showPrecipitation: boolean
  showWind: boolean
  note?: string
  fetchedAt?: string
  snapshotLocations: WeatherLocationForecast[]
}

export interface WeatherPreset {
  id: string
  labelNe: string
  labelNb: string
  shortLabel: string
  lat: number
  lon: number
  timezone: string
}
