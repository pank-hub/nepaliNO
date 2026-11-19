import type {EditorialChartInput} from '../editorialChart/types.ts'
import type {MapPlace} from '../maps/location.ts'
import {
  SSB_ATTRIBUTION,
  SSB_STATBANK_PAGE,
  buildSsbDataUrl,
  decodeJsonStat2Value,
  fetchSsbJson,
  orderedCategoryEntries,
  type JsonStat2Dataset,
  type SsbFetcher,
} from './pxweb.ts'
import rawSnapshot from './snapshots/nepalStatsSnapshot.json' with {type: 'json'}

export interface NepalMunicipalityEntry {
  code: string
  name: string
  neName: string
  count: number
  lat: number
  lng: number
}

export interface NepalStatsSnapshot {
  capturedAt: string
  population: {
    updatedDate: string
    years: string[]
    immigrants: number[]
    norwayBorn: number[]
    latestYear: string
    latestMales: number
    latestFemales: number
    latestCitizenship: number
  }
  naturalisations: {
    updatedDate: string
    years: string[]
    counts: number[]
  }
  municipalities: {
    updatedDate: string
    latestYear: string
    top: NepalMunicipalityEntry[]
  }
  occupations: {
    updatedDate: string
    latestYear: string
    totalEmployed: number
    groups: {
      serviceSales: number
      elementary: number
      professionals: number
      technicians: number
      clerical: number
      managers: number
      tradesOperatorsAgri: number
    }
    highlights: {
      teaching: number
      health: number
      ict: number
      engineering: number
      cleaners: number
      kitchenAssistants: number
    }
  }
  education: {
    updatedDate: string
    latestYear: string
    totalAge16Plus: number
    higherLong: number
    higherShort: number
    upperSecondary: number
    basicSchool: number
    noCompleted: number
  }
}

export interface NepalStatsViewModel {
  snapshot: NepalStatsSnapshot
  liveTablesLoaded: string[]
  charts: {
    population: EditorialChartInput
    naturalisations: EditorialChartInput
    municipalities: EditorialChartInput
    occupations: EditorialChartInput
    education: EditorialChartInput
  }
  municipalityPlaces: MapPlace[]
}

const MUNICIPALITY_COORDS: Record<string, {lat: number; lng: number; neName: string}> = {
  '0301': {lat: 59.9139, lng: 10.7522, neName: 'ओस्लो'},
  '5001': {lat: 63.4305, lng: 10.3951, neName: 'त्रोन्हाइम'},
  '4601': {lat: 60.3913, lng: 5.3221, neName: 'बेर्गेन'},
  '3205': {lat: 59.9557, lng: 11.0492, neName: 'लिल्लेस्ट्रोम'},
  '1103': {lat: 58.97, lng: 5.7331, neName: 'स्टाभाङ्गर'},
  '3222': {lat: 59.9271, lng: 10.9559, neName: 'लोरेन्सकोग'},
  '3201': {lat: 59.89, lng: 10.525, neName: 'बारुम'},
  '5501': {lat: 69.6492, lng: 18.9553, neName: 'ट्र्योम्सो'},
  '3218': {lat: 59.6615, lng: 10.7905, neName: 'ओस'},
  '3203': {lat: 59.8342, lng: 10.4357, neName: 'आस्कर'},
  '3207': {lat: 59.718, lng: 10.837, neName: 'नोर्द्रे फोल्लो'},
  '4204': {lat: 58.1599, lng: 8.0182, neName: 'क्रिस्टियानसान्द'},
  '1108': {lat: 58.8524, lng: 5.7352, neName: 'सान्नेस'},
  '3301': {lat: 59.7441, lng: 10.2045, neName: 'द्रााम्मेन'},
  '3107': {lat: 59.2181, lng: 10.9298, neName: 'फ्रेद्रिकस्ताद'},
}

const DEVANAGARI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']

export const toNepaliYear = (year: string): string =>
  year.replace(/\d/g, (d) => DEVANAGARI_DIGITS[Number(d)] ?? d)

const cloneSnapshot = (): NepalStatsSnapshot =>
  structuredClone(rawSnapshot as NepalStatsSnapshot)

const cleanMunicipalityLabel = (raw: string): string =>
  raw.split(' - ')[0]?.trim() || raw.trim()

const isoDate = (raw?: string): string | undefined =>
  typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(0, 10) : undefined

const parsePopulation = async (
  fetcher: SsbFetcher,
): Promise<Partial<NepalStatsSnapshot['population']> | null> => {
  const [d13880, d05184, d05196] = await Promise.all([
    fetchSsbJson<JsonStat2Dataset>(
      buildSsbDataUrl('13880', {
        Kjonn: '0',
        Landbakgrunn: '528',
        ContentsCode: ['Innvandrere', 'NorskFodtInnvForeld'],
        Tid: 'top(10)',
      }),
      {fetcher, timeoutMs: 4500},
    ),
    fetchSsbJson<JsonStat2Dataset>(
      buildSsbDataUrl('05184', {
        Kjonn: ['1', '2'],
        Landbakgrunn: '528',
        ContentsCode: '*',
        Tid: 'top(1)',
      }),
      {fetcher, timeoutMs: 4500},
    ),
    fetchSsbJson<JsonStat2Dataset>(
      buildSsbDataUrl('05196', {
        Kjonn: ['1', '2'],
        Statsbrgskap: '528',
        Alder: '*',
        ContentsCode: '*',
        Tid: 'top(1)',
      }),
      {fetcher, timeoutMs: 4500},
    ),
  ])

  const years = orderedCategoryEntries(d13880.dimension.Tid).map((e) => e.code)
  const immigrants = years.map(
    (y) =>
      decodeJsonStat2Value(d13880, {
        Kjonn: '0',
        Landbakgrunn: '528',
        ContentsCode: 'Innvandrere',
        Tid: y,
      }) ?? 0,
  )
  const norwayBorn = years.map(
    (y) =>
      decodeJsonStat2Value(d13880, {
        Kjonn: '0',
        Landbakgrunn: '528',
        ContentsCode: 'NorskFodtInnvForeld',
        Tid: y,
      }) ?? 0,
  )
  if (!years.length || !immigrants.some((n) => n > 0)) return null

  const latest05184Tid = orderedCategoryEntries(d05184.dimension.Tid)[0]?.code
  const sexContent = orderedCategoryEntries(d05184.dimension.ContentsCode)[0]?.code
  const latestMales =
    latest05184Tid && sexContent
      ? decodeJsonStat2Value(d05184, {
          Kjonn: '1',
          Landbakgrunn: '528',
          ContentsCode: sexContent,
          Tid: latest05184Tid,
        })
      : null
  const latestFemales =
    latest05184Tid && sexContent
      ? decodeJsonStat2Value(d05184, {
          Kjonn: '2',
          Landbakgrunn: '528',
          ContentsCode: sexContent,
          Tid: latest05184Tid,
        })
      : null

  const latestCitizenship = d05196.value.reduce<number>(
    (acc, val) => acc + (typeof val === 'number' && Number.isFinite(val) ? val : 0),
    0,
  )

  return {
    updatedDate: isoDate(d13880.updated) ?? undefined,
    years,
    immigrants,
    norwayBorn,
    latestYear: years.at(-1) ?? undefined,
    ...(typeof latestMales === 'number' ? {latestMales} : {}),
    ...(typeof latestFemales === 'number' ? {latestFemales} : {}),
    ...(latestCitizenship > 0 ? {latestCitizenship} : {}),
  }
}

const parseNaturalisations = async (
  fetcher: SsbFetcher,
): Promise<NepalStatsSnapshot['naturalisations'] | null> => {
  const ds = await fetchSsbJson<JsonStat2Dataset>(
    buildSsbDataUrl('04767', {
      Kjonn: ['1', '2'],
      Alder: ['00-17', '0018+'],
      Statsbrgskap: '528',
      ContentsCode: 'UtenlStatsbrg',
      Tid: 'top(10)',
    }),
    {fetcher, timeoutMs: 4500},
  )
  const years = orderedCategoryEntries(ds.dimension.Tid).map((e) => e.code)
  if (!years.length) return null
  const counts = years.map((y) => {
    let sum = 0
    for (const k of ['1', '2']) {
      for (const a of ['00-17', '0018+']) {
        sum +=
          decodeJsonStat2Value(ds, {
            Kjonn: k,
            Alder: a,
            Statsbrgskap: '528',
            ContentsCode: 'UtenlStatsbrg',
            Tid: y,
          }) ?? 0
      }
    }
    return sum
  })
  return {
    updatedDate: isoDate(ds.updated) ?? rawSnapshot.naturalisations.updatedDate,
    years,
    counts,
  }
}

const parseMunicipalities = async (
  fetcher: SsbFetcher,
): Promise<NepalStatsSnapshot['municipalities'] | null> => {
  const ds = await fetchSsbJson<JsonStat2Dataset>(
    buildSsbDataUrl('09817', {
      Region: '*',
      InnvandrKat: 'B-C',
      Landbakgrunn: '528',
      ContentsCode: 'Personer1',
      Tid: 'top(1)',
    }),
    {fetcher, timeoutMs: 4500},
  )
  const latestYear = orderedCategoryEntries(ds.dimension.Tid)[0]?.code
  if (!latestYear) return null
  const regions = orderedCategoryEntries(ds.dimension.Region)
  const entries: NepalMunicipalityEntry[] = []
  for (const reg of regions) {
    if (!/^\d{4}$/.test(reg.code) || reg.code.startsWith('00')) continue
    const val = decodeJsonStat2Value(ds, {
      Region: reg.code,
      InnvandrKat: 'B-C',
      Landbakgrunn: '528',
      ContentsCode: 'Personer1',
      Tid: latestYear,
    })
    if (typeof val !== 'number' || val <= 0) continue
    const geo = MUNICIPALITY_COORDS[reg.code]
    const name = cleanMunicipalityLabel(reg.label)
    entries.push({
      code: reg.code,
      name,
      neName: geo?.neName ?? name,
      count: val,
      lat: geo?.lat ?? 59.9139,
      lng: geo?.lng ?? 10.7522,
    })
  }
  if (!entries.length) return null
  entries.sort((a, b) => b.count - a.count)
  return {
    updatedDate: isoDate(ds.updated) ?? rawSnapshot.municipalities.updatedDate,
    latestYear,
    top: entries.slice(0, 10),
  }
}

const parseOccupations = async (
  fetcher: SsbFetcher,
): Promise<NepalStatsSnapshot['occupations'] | null> => {
  const ds = await fetchSsbJson<JsonStat2Dataset>(
    buildSsbDataUrl('12557', {
      Lanbakgrunn: '528',
      Yrke: '*',
      ContentsCode: 'Lonnstakere',
      Tid: 'top(1)',
    }),
    {fetcher, timeoutMs: 4500},
  )
  const latestYear = orderedCategoryEntries(ds.dimension.Tid)[0]?.code
  if (!latestYear) return null
  const getCode = (yrke: string) =>
    decodeJsonStat2Value(ds, {
      Lanbakgrunn: '528',
      Yrke: yrke,
      ContentsCode: 'Lonnstakere',
      Tid: latestYear,
    }) ?? 0

  const totalEmployed = getCode('0-9')
  if (!(totalEmployed > 0)) return null
  const technicians =
    getCode('31') + getCode('32') + getCode('33') + getCode('34') + getCode('35') + getCode('36')

  return {
    updatedDate: isoDate(ds.updated) ?? rawSnapshot.occupations.updatedDate,
    latestYear,
    totalEmployed,
    groups: {
      serviceSales: getCode('5'),
      elementary: getCode('9'),
      professionals: getCode('2'),
      technicians,
      clerical: getCode('4'),
      managers: getCode('1'),
      tradesOperatorsAgri: getCode('6') + getCode('7') + getCode('8'),
    },
    highlights: {
      teaching: getCode('23'),
      health: getCode('22'),
      ict: getCode('25'),
      engineering: getCode('21'),
      cleaners: getCode('91'),
      kitchenAssistants: getCode('94'),
    },
  }
}

const parseEducation = async (
  fetcher: SsbFetcher,
): Promise<NepalStatsSnapshot['education'] | null> => {
  const ds = await fetchSsbJson<JsonStat2Dataset>(
    buildSsbDataUrl('09623', {
      UtdanNivaa: '*',
      Lanbakgrunn: '528',
      ContentsCode: 'InnvNo',
      Tid: 'top(1)',
    }),
    {fetcher, timeoutMs: 4500},
  )
  const latestYear = orderedCategoryEntries(ds.dimension.Tid)[0]?.code
  if (!latestYear) return null
  const getLevel = (level: string) =>
    decodeJsonStat2Value(ds, {
      UtdanNivaa: level,
      Lanbakgrunn: '528',
      ContentsCode: 'InnvNo',
      Tid: latestYear,
    }) ?? 0

  const totalAge16Plus = getLevel('TOT')
  if (!(totalAge16Plus > 0)) return null

  return {
    updatedDate: isoDate(ds.updated) ?? rawSnapshot.education.updatedDate,
    latestYear,
    totalAge16Plus,
    higherLong: getLevel('7-8'),
    higherShort: getLevel('6'),
    upperSecondary: getLevel('3-5a') + getLevel('11'),
    basicSchool: getLevel('1-2'),
    noCompleted: getLevel('00') + getLevel('9'),
  }
}

export const buildNepaliStatsCharts = (
  snapshot: NepalStatsSnapshot,
): NepalStatsViewModel['charts'] => {
  const {population, naturalisations, municipalities, occupations, education} = snapshot
  const nepLatestPop = toNepaliYear(population.latestYear)
  const nepPopStart = toNepaliYear(population.years[0] ?? '2017')
  const nepNatStart = toNepaliYear(naturalisations.years[0] ?? '2016')
  const nepNatEnd = toNepaliYear(naturalisations.years.at(-1) ?? '2025')

  return {
    population: {
      _type: 'editorialChart',
      chartType: 'stackedBar',
      title: `नर्वेमा नेपाली पृष्ठभूमिको जनसंख्या वृद्धि (${nepPopStart}–${nepLatestPop})`,
      subtitle: 'नेपालमा जन्मिएका आप्रवासी र नर्वेमा जन्मिएका दोस्रो पुस्ताका बालबालिका (कुल संख्या)',
      description: `SSB को तालिका १३८८० अनुसार नर्वेमा नेपाल पृष्ठभूमि भएका व्यक्तिको संख्या सन् ${nepPopStart} बाट लगातार बढ्दै सन् ${nepLatestPop} मा ${new Intl.NumberFormat('ne-NP').format((population.immigrants.at(-1) ?? 0) + (population.norwayBorn.at(-1) ?? 0))} पुगेको छ।`,
      categories: population.years.map(toNepaliYear),
      series: [
        {
          _key: 'immigrants',
          label: 'नेपालमा जन्मिएका (आप्रवासी)',
          shortLabel: 'नेपालमा जन्मिएका',
          color: 'blue',
          values: population.immigrants,
        },
        {
          _key: 'norway-born',
          label: 'नर्वेमा जन्मिएका (दोस्रो पुस्ता)',
          shortLabel: 'नर्वेमा जन्मिएका',
          color: 'teal',
          values: population.norwayBorn,
        },
      ],
      unit: 'people',
      decimalPrecision: 0,
      showLegend: true,
      showValues: false,
      showDataSummary: true,
      sourceLabel: `${SSB_ATTRIBUTION} — तालिका १३८८०`,
      sourceUrl: `${SSB_STATBANK_PAGE}13880`,
      sourceDate: population.updatedDate,
    },
    naturalisations: {
      _type: 'editorialChart',
      chartType: 'verticalBar',
      title: `वार्षिक नर्वेली नागरिकता प्राप्त गर्ने नेपाली (${nepNatStart}–${nepNatEnd})`,
      subtitle: 'पहिले नेपाली नागरिकता भएकामध्ये नर्वेली नागरिकता लिएका व्यक्तिको वार्षिक संख्या',
      description: 'नेपालबाट आएका धेरै व्यक्तिले नर्वेली नागरिकता लिइसकेकाले राहदानी (नागरिकता) को संख्या देश पृष्ठभूमिभन्दा कम देखिन्छ।',
      categories: naturalisations.years.map(toNepaliYear),
      series: [
        {
          _key: 'naturalised',
          label: 'नर्वेली नागरिकता प्राप्त',
          color: 'blue',
          values: naturalisations.counts,
        },
      ],
      unit: 'people',
      decimalPrecision: 0,
      showLegend: false,
      showValues: true,
      showDataSummary: true,
      sourceLabel: `${SSB_ATTRIBUTION} — तालिका ०४७६७`,
      sourceUrl: `${SSB_STATBANK_PAGE}04767`,
      sourceDate: naturalisations.updatedDate,
    },
    municipalities: {
      _type: 'editorialChart',
      chartType: 'horizontalBar',
      title: `नेपालीहरूको बसोबास रहेका शीर्ष १० कोमुने (${toNepaliYear(municipalities.latestYear)})`,
      subtitle: 'आप्रवासी र नर्वेमा जन्मिएका दोस्रो पुस्तासहित कुल नेपाली पृष्ठभूमि संख्या',
      description: 'आधाभन्दा बढी नेपाली समुदाय ओस्लो राजधानी क्षेत्र र आसपासका कोमुनेमा केन्द्रित छ, भने त्रोन्हाइम, बेर्गेन, स्टाभाङ्गर र ट्र्योम्सो प्रमुख सहर हुन्।',
      categories: municipalities.top.map((m) => m.neName),
      series: [
        {
          _key: 'residents',
          label: 'कुल व्यक्ति',
          color: 'blue',
          values: municipalities.top.map((m) => m.count),
        },
      ],
      unit: 'people',
      decimalPrecision: 0,
      showLegend: false,
      showValues: true,
      showDataSummary: true,
      sourceLabel: `${SSB_ATTRIBUTION} — तालिका ०९८१७`,
      sourceUrl: `${SSB_STATBANK_PAGE}09817`,
      sourceDate: municipalities.updatedDate,
    },
    occupations: {
      _type: 'editorialChart',
      chartType: 'horizontalBar',
      title: `नर्वेमा कार्यरत नेपालीको मुख्य पेशा क्षेत्र (${toNepaliYear(occupations.latestYear)})`,
      subtitle: 'चौथो त्रैमासमा रोजगारीमा रहेका १५–७४ उमेर समूहका कामदारको प्रमुख पेशा वर्गीकरण',
      description: 'सेवा, स्याहार र सरसफाइ–भान्सा क्षेत्रसँगै शिक्षक, स्वास्थ्यकर्मी, आईटी र इन्जिनियरिङ जस्ता दक्ष पेशामा समेत उल्लेखनीय सहभागिता छ।',
      categories: [
        'सेवा, स्याहार र बिक्री',
        'सरसफाइ, भान्सा र सहायक काम',
        'विशेषज्ञ (शिक्षक, स्वास्थ्य, आईटी)',
        'प्राविधिक तथा सहायक विशेषज्ञ',
        'दक्ष सिप, मेसिन र यातायात',
        'कार्यालय तथा ग्राहक सेवा',
        'व्यवस्थापक',
      ],
      series: [
        {
          _key: 'employed',
          label: 'कार्यरत व्यक्ति',
          color: 'teal',
          values: [
            occupations.groups.serviceSales,
            occupations.groups.elementary,
            occupations.groups.professionals,
            occupations.groups.technicians,
            occupations.groups.tradesOperatorsAgri,
            occupations.groups.clerical,
            occupations.groups.managers,
          ],
        },
      ],
      unit: 'people',
      decimalPrecision: 0,
      showLegend: false,
      showValues: true,
      showDataSummary: true,
      sourceLabel: `${SSB_ATTRIBUTION} — तालिका १२५५७`,
      sourceUrl: `${SSB_STATBANK_PAGE}12557`,
      sourceDate: occupations.updatedDate,
    },
    education: {
      _type: 'editorialChart',
      chartType: 'donut',
      title: `नर्वेमा बसोबास गर्ने नेपालीको शैक्षिक स्तर (${toNepaliYear(education.latestYear)})`,
      subtitle: '१६ वर्ष र सोभन्दा माथिका नेपालमा जन्मिएका व्यक्तिको शैक्षिक योग्यताको बाँडफाँड',
      description: 'झन्डै दुई तिहाइ वयस्क नेपाली आप्रवासीसँग स्नातक वा स्नातकोत्तर/विद्यावारिधि तहको उच्च शिक्षा छ।',
      categories: [
        'उच्च शिक्षा लामो (मास्टर्स/PhD)',
        'उच्च शिक्षा छोटो (ब्याचलर्स)',
        'आधारभूत विद्यालय',
        'उच्च माध्यमिक / व्यावसायिक',
        'प्रारम्भिक / अन्य',
      ],
      series: [
        {
          _key: 'education-share',
          label: 'संख्या',
          values: [
            education.higherLong,
            education.higherShort,
            education.basicSchool,
            education.upperSecondary,
            education.noCompleted,
          ],
        },
      ],
      unit: 'people',
      decimalPrecision: 0,
      showLegend: true,
      showValues: true,
      showPercentages: true,
      showDataSummary: true,
      sourceLabel: `${SSB_ATTRIBUTION} — तालिका ०९६२३`,
      sourceUrl: `${SSB_STATBANK_PAGE}09623`,
      sourceDate: education.updatedDate,
    },
  }
}

export const buildMunicipalityMapPlaces = (snapshot: NepalStatsSnapshot): MapPlace[] => {
  const formatter = new Intl.NumberFormat('ne-NP')
  return snapshot.municipalities.top
    .filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lng))
    .map((m) => ({
      _key: `muni-${m.code}`,
      label: `${m.neName} (${formatter.format(m.count)})`,
      description: `${m.name}: ${formatter.format(m.count)} जना (${toNepaliYear(snapshot.municipalities.latestYear)})`,
      coordinates: {lat: m.lat, lng: m.lng},
      precision: 'exact' as const,
      icon: 'pin' as const,
      showLabel: ['0301', '5001', '4601', '1103', '5501'].includes(m.code),
    }))
}

export const loadNepaliStats = async (
  options: {fetcher?: SsbFetcher; allowLive?: boolean} = {},
): Promise<NepalStatsViewModel> => {
  const snapshot = cloneSnapshot()
  const liveTablesLoaded: string[] = []
  const fetcher = options.fetcher ?? fetch
  const allowLive = options.allowLive ?? true

  if (allowLive) {
    const [popRes, natRes, muniRes, occRes, eduRes] = await Promise.allSettled([
      parsePopulation(fetcher),
      parseNaturalisations(fetcher),
      parseMunicipalities(fetcher),
      parseOccupations(fetcher),
      parseEducation(fetcher),
    ])

    if (popRes.status === 'fulfilled' && popRes.value) {
      snapshot.population = {...snapshot.population, ...popRes.value}
      liveTablesLoaded.push('13880', '05184', '05196')
    }
    if (natRes.status === 'fulfilled' && natRes.value) {
      snapshot.naturalisations = natRes.value
      liveTablesLoaded.push('04767')
    }
    if (muniRes.status === 'fulfilled' && muniRes.value) {
      snapshot.municipalities = muniRes.value
      liveTablesLoaded.push('09817')
    }
    if (occRes.status === 'fulfilled' && occRes.value) {
      snapshot.occupations = occRes.value
      liveTablesLoaded.push('12557')
    }
    if (eduRes.status === 'fulfilled' && eduRes.value) {
      snapshot.education = eduRes.value
      liveTablesLoaded.push('09623')
    }
  }

  return {
    snapshot,
    liveTablesLoaded,
    charts: buildNepaliStatsCharts(snapshot),
    municipalityPlaces: buildMunicipalityMapPlaces(snapshot),
  }
}
