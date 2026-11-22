import type {WeatherLanguage, WeatherPreset} from './types.ts'

export const MET_ATTRIBUTION = {
  sourceUrl: 'https://www.met.no/',
  apiDocsUrl: 'https://api.met.no/',
} as const

export const WEATHER_PRESETS: readonly WeatherPreset[] = [
  {
    id: 'oslo',
    labelNe: 'ओस्लो (Oslo)',
    labelNb: 'Oslo',
    shortLabel: 'Oslo',
    lat: 59.9139,
    lon: 10.7522,
    timezone: 'Europe/Oslo',
  },
  {
    id: 'kathmandu',
    labelNe: 'काठमाडौं (Kathmandu)',
    labelNb: 'Kathmandu',
    shortLabel: 'Kathmandu',
    lat: 27.7172,
    lon: 85.324,
    timezone: 'Asia/Kathmandu',
  },
  {
    id: 'bergen',
    labelNe: 'बर्गन (Bergen)',
    labelNb: 'Bergen',
    shortLabel: 'Bergen',
    lat: 60.3913,
    lon: 5.3221,
    timezone: 'Europe/Oslo',
  },
  {
    id: 'trondheim',
    labelNe: 'त्रोन्दहाइम (Trondheim)',
    labelNb: 'Trondheim',
    shortLabel: 'Trondheim',
    lat: 63.4305,
    lon: 10.3951,
    timezone: 'Europe/Oslo',
  },
  {
    id: 'stavanger',
    labelNe: 'स्ताभाङ्गर (Stavanger)',
    labelNb: 'Stavanger',
    shortLabel: 'Stavanger',
    lat: 58.97,
    lon: 5.7331,
    timezone: 'Europe/Oslo',
  },
  {
    id: 'tromso',
    labelNe: 'ट्रोम्सो (Tromsø)',
    labelNb: 'Tromsø',
    shortLabel: 'Tromsø',
    lat: 69.6492,
    lon: 18.9553,
    timezone: 'Europe/Oslo',
  },
  {
    id: 'drammen',
    labelNe: 'द्राम्मेन (Drammen)',
    labelNb: 'Drammen',
    shortLabel: 'Drammen',
    lat: 59.7441,
    lon: 10.2045,
    timezone: 'Europe/Oslo',
  },
  {
    id: 'kristiansand',
    labelNe: 'क्रिस्टियानसान्द (Kristiansand)',
    labelNb: 'Kristiansand',
    shortLabel: 'Kristiansand',
    lat: 58.1599,
    lon: 8.0182,
    timezone: 'Europe/Oslo',
  },
  {
    id: 'alesund',
    labelNe: 'ओलेसुन्द (Ålesund)',
    labelNb: 'Ålesund',
    shortLabel: 'Ålesund',
    lat: 62.4722,
    lon: 6.1495,
    timezone: 'Europe/Oslo',
  },
  {
    id: 'roros',
    labelNe: 'र्‍योरोस (Røros)',
    labelNb: 'Røros',
    shortLabel: 'Røros',
    lat: 62.5747,
    lon: 11.3842,
    timezone: 'Europe/Oslo',
  },
  {
    id: 'folldal',
    labelNe: 'फोल्दाल (Folldal)',
    labelNb: 'Folldal',
    shortLabel: 'Folldal',
    lat: 62.1325,
    lon: 9.9972,
    timezone: 'Europe/Oslo',
  },
  {
    id: 'pokhara',
    labelNe: 'पोखरा (Pokhara)',
    labelNb: 'Pokhara',
    shortLabel: 'Pokhara',
    lat: 28.2096,
    lon: 83.9856,
    timezone: 'Asia/Kathmandu',
  },
] as const

export function findWeatherPreset(id: string): WeatherPreset | undefined {
  const normalized = id.trim().toLowerCase()
  return WEATHER_PRESETS.find((preset) => preset.id === normalized)
}

export function normalizeSymbolBase(symbolCode: string | null | undefined): string {
  if (!symbolCode || typeof symbolCode !== 'string') return ''
  return symbolCode.trim().replace(/_(day|night|polartwilight)$/, '')
}

const CONDITION_LABELS: Record<string, {ne: string; nb: string}> = {
  clearsky: {ne: 'सफा आकाश', nb: 'Klarvær'},
  fair: {ne: 'खुला मौसम', nb: 'Lettskyet'},
  partlycloudy: {ne: 'आंशिक बदली', nb: 'Delvis skyet'},
  cloudy: {ne: 'बदली', nb: 'Skyet'},
  fog: {ne: 'कुहिरो', nb: 'Tåke'},
  lightrain: {ne: 'हल्का वर्षा', nb: 'Lett regn'},
  rain: {ne: 'वर्षा', nb: 'Regn'},
  heavyrain: {ne: 'भारी वर्षा', nb: 'Kraftig regn'},
  lightrainshowers: {ne: 'हल्का छिटपुट वर्षा', nb: 'Lette regnbyger'},
  rainshowers: {ne: 'वर्षाको झरी', nb: 'Regnbyger'},
  heavyrainshowers: {ne: 'भारी वर्षाको झरी', nb: 'Kraftige regnbyger'},
  lightsleet: {ne: 'हल्का हिउँ-वर्षा', nb: 'Lett sludd'},
  sleet: {ne: 'हिउँ र वर्षा', nb: 'Sludd'},
  heavysleet: {ne: 'भारी हिउँ-वर्षा', nb: 'Kraftig sludd'},
  lightsleetshowers: {ne: 'हल्का हिउँ-वर्षाको झरी', nb: 'Lette sluddbyger'},
  sleetshowers: {ne: 'हिउँ-वर्षाको झरी', nb: 'Sluddbyger'},
  heavysleetshowers: {ne: 'भारी हिउँ-वर्षाको झरी', nb: 'Kraftige sluddbyger'},
  lightsnow: {ne: 'हल्का हिमपात', nb: 'Lett snø'},
  snow: {ne: 'हिमपात', nb: 'Snø'},
  heavysnow: {ne: 'भारी हिमपात', nb: 'Kraftig snø'},
  lightsnowshowers: {ne: 'हल्का हिमपात झरी', nb: 'Lette snøbyger'},
  snowshowers: {ne: 'हिमपात झरी', nb: 'Snøbyger'},
  heavysnowshowers: {ne: 'भारी हिमपात झरी', nb: 'Kraftige snøbyger'},
  lightrainandthunder: {ne: 'चट्याङसहित हल्का वर्षा', nb: 'Lett regn og torden'},
  rainandthunder: {ne: 'चट्याङसहित वर्षा', nb: 'Regn og torden'},
  heavyrainandthunder: {ne: 'चट्याङसहित भारी वर्षा', nb: 'Kraftig regn og torden'},
  lightrainshowersandthunder: {ne: 'चट्याङसहित हल्का झरी', nb: 'Lette regnbyger og torden'},
  rainshowersandthunder: {ne: 'चट्याङसहित झरी', nb: 'Regnbyger og torden'},
  heavyrainshowersandthunder: {ne: 'चट्याङसहित भारी झरी', nb: 'Kraftige regnbyger og torden'},
  lightsleetandthunder: {ne: 'चट्याङसहित हल्का हिउँ-वर्षा', nb: 'Lett sludd og torden'},
  sleetandthunder: {ne: 'चट्याङसहित हिउँ-वर्षा', nb: 'Sludd og torden'},
  heavysleetandthunder: {ne: 'चट्याङसहित भारी हिउँ-वर्षा', nb: 'Kraftig sludd og torden'},
  lightsnowandthunder: {ne: 'चट्याङसहित हल्का हिमपात', nb: 'Lett snø og torden'},
  snowandthunder: {ne: 'चट्याङसहित हिमपात', nb: 'Snø og torden'},
  heavysnowandthunder: {ne: 'चट्याङसहित भारी हिमपात', nb: 'Kraftig snø og torden'},
  lightsnowshowersandthunder: {ne: 'चट्याङसहित हल्का हिमझरी', nb: 'Lette snøbyger og torden'},
  snowshowersandthunder: {ne: 'चट्याङसहित हिमझरी', nb: 'Snøbyger og torden'},
  heavysnowshowersandthunder: {ne: 'चट्याङसहित भारी हिमझरी', nb: 'Kraftige snøbyger og torden'},
}

export function getWeatherConditionLabel(
  symbolCode: string | null | undefined,
  language: WeatherLanguage,
): string {
  const base = normalizeSymbolBase(symbolCode)
  if (!base) return ''
  return CONDITION_LABELS[base]?.[language] ?? base
}

export type WeatherIconKind =
  | 'sun'
  | 'moon'
  | 'partly-sun'
  | 'partly-moon'
  | 'cloud'
  | 'fog'
  | 'rain'
  | 'sleet'
  | 'snow'
  | 'thunder'

export function getWeatherIconKind(symbolCode: string | null | undefined): WeatherIconKind {
  const code = (symbolCode ?? '').trim()
  const base = normalizeSymbolBase(code)
  const isNight = code.endsWith('_night')

  if (base.includes('thunder')) return 'thunder'
  if (base.includes('snow')) return 'snow'
  if (base.includes('sleet')) return 'sleet'
  if (base.includes('rain')) return 'rain'
  if (base === 'fog') return 'fog'
  if (base === 'cloudy') return 'cloud'
  if (base === 'partlycloudy' || base === 'fair') return isNight ? 'partly-moon' : 'partly-sun'
  if (base === 'clearsky') return isNight ? 'moon' : 'sun'
  return 'cloud'
}

export const WEATHER_ICON_PATHS: Record<WeatherIconKind, string> = {
  sun: '<circle cx="12" cy="12" r="4.5" fill="#d97706"/><path d="M12 2.5v2.2M12 19.3v2.2M4.7 4.7l1.6 1.6M17.7 17.7l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.7 19.3l1.6-1.6M17.7 6.3l1.6-1.6" stroke="#d97706" stroke-width="1.8" stroke-linecap="round"/>',
  moon: '<path d="M16.5 14.5A6.5 6.5 0 0 1 9.5 7.5c0-.9.2-1.8.5-2.6A7 7 0 1 0 19.1 14c-.8.3-1.7.5-2.6.5Z" fill="#475569"/>',
  'partly-sun':
    '<circle cx="9.2" cy="8.5" r="3.2" fill="#d97706"/><path d="M9.2 3v1.3M4 8.5h1.3M5.5 4.8l.9.9M12.9 4.8l-.9.9" stroke="#d97706" stroke-width="1.5" stroke-linecap="round"/><path d="M8 18h8.5a3.5 3.5 0 0 0 .4-7 4.8 4.8 0 0 0-9.2-1A3.6 3.6 0 0 0 8 18Z" fill="#64748b"/>',
  'partly-moon':
    '<path d="M10.4 5.2a3.8 3.8 0 0 0 3.7 4.7 3.8 3.8 0 0 1-5-1.1 3.8 3.8 0 0 1 1.3-3.6Z" fill="#d97706"/><path d="M8 18h8.5a3.5 3.5 0 0 0 .4-7 4.8 4.8 0 0 0-9.2-1A3.6 3.6 0 0 0 8 18Z" fill="#64748b"/>',
  cloud:
    '<path d="M7.5 18h9.2a3.8 3.8 0 0 0 .4-7.6 5.2 5.2 0 0 0-9.9-1.1A4 4 0 0 0 7.5 18Z" fill="#64748b"/>',
  fog: '<path d="M6.5 12h11a3 3 0 0 0 .3-6 4.5 4.5 0 0 0-8.6-.9A3.3 3.3 0 0 0 6.5 12Z" fill="#94a3b8"/><path d="M4 15.2h16M5.5 18.5h13" stroke="#64748b" stroke-width="1.8" stroke-linecap="round"/>',
  rain: '<path d="M7.2 14.5h9.5a3.4 3.4 0 0 0 .4-6.8 4.8 4.8 0 0 0-9.2-1 3.6 3.6 0 0 0-.7 7.8Z" fill="#64748b"/><path d="M8.5 17.2l-1.2 3M12.5 17.2l-1.2 3M16.5 17.2l-1.2 3" stroke="#0284c7" stroke-width="1.8" stroke-linecap="round"/>',
  sleet:
    '<path d="M7.2 14.2h9.5a3.4 3.4 0 0 0 .4-6.8 4.8 4.8 0 0 0-9.2-1 3.6 3.6 0 0 0-.7 7.8Z" fill="#64748b"/><path d="M8.5 17l-1 2.8" stroke="#0284c7" stroke-width="1.8" stroke-linecap="round"/><circle cx="13" cy="18.6" r="1.3" fill="#0284c7"/><path d="M16.8 17l-1 2.8" stroke="#0284c7" stroke-width="1.8" stroke-linecap="round"/>',
  snow: '<path d="M7.2 14.2h9.5a3.4 3.4 0 0 0 .4-6.8 4.8 4.8 0 0 0-9.2-1 3.6 3.6 0 0 0-.7 7.8Z" fill="#64748b"/><circle cx="8.5" cy="18.2" r="1.3" fill="#0284c7"/><circle cx="12.5" cy="19.5" r="1.3" fill="#0284c7"/><circle cx="16.5" cy="18.2" r="1.3" fill="#0284c7"/>',
  thunder:
    '<path d="M7.2 13.8h9.5a3.4 3.4 0 0 0 .4-6.8 4.8 4.8 0 0 0-9.2-1 3.6 3.6 0 0 0-.7 7.8Z" fill="#64748b"/><path d="M12.8 14.5l-2 3.5h2.2l-1.4 3.5" stroke="#d97706" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
}

const NE_SHORT_MONTHS = [
  'जनवरी',
  'फेब्रुअरी',
  'मार्च',
  'अप्रिल',
  'मे',
  'जुन',
  'जुलाई',
  'अगस्ट',
  'सेप्टेम्बर',
  'अक्टोबर',
  'नोभेम्बर',
  'डिसेम्बर',
]

const NE_WEEKDAYS = ['आइत', 'सोम', 'मंगल', 'बुध', 'बिही', 'शुक्र', 'शनि']

export function formatWeatherDateShort(isoDate: string, language: WeatherLanguage): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim())
  if (!match) return isoDate
  const year = Number(match[1])
  const monthIdx = Number(match[2]) - 1
  const day = Number(match[3])
  const parsed = new Date(Date.UTC(year, monthIdx, day, 12, 0, 0))
  if (Number.isNaN(parsed.getTime())) return isoDate
  if (language === 'ne') {
    const dayStr = new Intl.NumberFormat('ne-NP', {useGrouping: false}).format(day)
    const monthStr = NE_SHORT_MONTHS[monthIdx] ?? ''
    const weekday = NE_WEEKDAYS[parsed.getUTCDay()] ?? ''
    return `${dayStr} ${monthStr} (${weekday})`
  }
  return parsed.toLocaleDateString('nb-NO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}

export function getWeatherCopy(language: WeatherLanguage) {
  if (language === 'ne') {
    return {
      sectionTitle: 'मौसम पूर्वानुमान',
      homepageTitle: 'आजको मौसम',
      oslo: 'ओस्लो',
      kathmandu: 'काठमाडौं',
      todayRange: 'आज {min}° / {max}°',
      date: 'मिति',
      location: 'स्थान',
      temperature: 'तापक्रम',
      condition: 'अवस्था',
      precipitation: 'वर्षा',
      wind: 'हावा',
      minMax: 'न्यूनतम / अधिकतम',
      attribution: 'मौसम डेटा: MET Norway',
      snapshotLabel: 'प्रकाशित पूर्वानुमान',
      liveLabel: 'प्रत्यक्ष पूर्वानुमान',
      updated: 'अद्यावधिक',
      unavailable: 'डेटा उपलब्ध छैन',
      mmUnit: 'मिमी',
      msUnit: 'मी/से',
    }
  }
  return {
    sectionTitle: 'Værvarsel',
    homepageTitle: 'Været nå',
    oslo: 'Oslo',
    kathmandu: 'Kathmandu',
    todayRange: 'I dag {min}° / {max}°',
    date: 'Dato',
    location: 'Sted',
    temperature: 'Temperatur',
    condition: 'Vær',
    precipitation: 'Nedbør',
    wind: 'Vind',
    minMax: 'Min / maks',
    attribution: 'Værdata fra MET Norway',
    snapshotLabel: 'Lagret varsel',
    liveLabel: 'Direkte varsel',
    updated: 'Oppdatert',
    unavailable: 'Ikke tilgjengelig',
    mmUnit: 'mm',
    msUnit: 'm/s',
  }
}
