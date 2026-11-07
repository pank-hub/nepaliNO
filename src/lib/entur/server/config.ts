export const ENTUR = {
  clientName: 'nepali-no-travel-assistance',
  geocoderUrl: 'https://api.entur.io/geocoder/v3/autocomplete',
  journeyUrl: 'https://api.entur.io/journey-planner/v3/graphql',
  timeoutMs: 8_000,
  maxRequestBytes: 4 * 1024,
  maxResponseBytes: 256 * 1024,
  maxSuggestions: 8,
  maxJourneys: 3,
} as const

export const isEnturApiEnabled = () => process.env.ENTUR_TRAVEL_API_ENABLED === 'true'
