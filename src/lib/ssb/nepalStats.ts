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

export interface NepalCountyEntry {
  code: string
  name: string
  neName: string
  count: number
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
    genderHistory: {
      years: string[]
      males: number[]
      females: number[]
    }
    ageSex: {
      groups: string[]
      males: number[]
      females: number[]
    }
  }
  naturalisations: {
    updatedDate: string
    years: string[]
    counts: number[]
    adults: number[]
    children: number[]
  }
  municipalities: {
    updatedDate: string
    latestYear: string
    top: NepalMunicipalityEntry[]
    counties: NepalCountyEntry[]
  }
  residenceDuration: {
    updatedDate: string
    latestYear: string
    total: number
    buckets: {label: string; count: number}[]
  }
  employmentRate: {
    updatedDate: string
    latestYear: string
    overall: number
    malesTotal: number
    femalesTotal: number
    categories: string[]
    males: number[]
    females: number[]
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
    specialistRoles: {
      teaching: number
      health: number
      engTech: number
      ict: number
      scienceEng: number
      bizProf: number
      bizAssoc: number
      healthAssoc: number
      ictTech: number
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
    genderHistory: EditorialChartInput
    ageSex: EditorialChartInput
    naturalisations: EditorialChartInput
    municipalities: EditorialChartInput
    counties: EditorialChartInput
    residenceDuration: EditorialChartInput
    occupations: EditorialChartInput
    employmentByStay: EditorialChartInput
    specialistProfessions: EditorialChartInput
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

const COUNTY_NE_NAMES: Record<string, string> = {
  '03': 'ओस्लो',
  '32': 'आकेशुस',
  '50': 'त्र्योन्दलाग',
  '11': 'रोगालान',
  '46': 'भेस्तलान',
  '31': 'ओस्तफोल',
  '40': 'तेलेमार्क',
  '55': 'त्रोम्स',
  '42': 'आगदेर',
  '18': 'नोर्दलान',
  '15': 'मोरे ओग रोम्सदाल',
  '34': 'इन्लाने',
  '33': 'बुस्केरु',
  '39': 'भेस्तफोल',
  '56': 'फिन्नमार्क',
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
        Tid: 'top(19)',
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

  const years05184 = orderedCategoryEntries(d05184.dimension.Tid).map((e) => e.code)
  const sexContent = orderedCategoryEntries(d05184.dimension.ContentsCode)[0]?.code
  const historyMales =
    sexContent && years05184.length
      ? years05184.map(
          (y) =>
            decodeJsonStat2Value(d05184, {
              Kjonn: '1',
              Landbakgrunn: '528',
              ContentsCode: sexContent,
              Tid: y,
            }) ?? 0,
        )
      : []
  const historyFemales =
    sexContent && years05184.length
      ? years05184.map(
          (y) =>
            decodeJsonStat2Value(d05184, {
              Kjonn: '2',
              Landbakgrunn: '528',
              ContentsCode: sexContent,
              Tid: y,
            }) ?? 0,
        )
      : []
  const latestMales = historyMales.at(-1) ?? null
  const latestFemales = historyFemales.at(-1) ?? null
  const sampledHistIndices = years05184
    .map((_, idx) => idx)
    .filter((idx) => (years05184.length - 1 - idx) % 2 === 0)

  const latest05196Tid = orderedCategoryEntries(d05196.dimension.Tid)[0]?.code
  const citContent = orderedCategoryEntries(d05196.dimension.ContentsCode)[0]?.code
  const ageBuckets: [string, string[]][] = [
    ['०–१२ वर्ष', ['00-05', '06-12']],
    ['१३–१९ वर्ष', ['13-15', '16-19']],
    ['२०–२९ वर्ष', ['20-29']],
    ['३०–३९ वर्ष', ['30-39']],
    ['४०–४९ वर्ष', ['40-49']],
    ['५०+ वर्ष', ['50-66', '67+']],
  ]
  const sumCitSex = (kjonn: string, codes: string[]) =>
    latest05196Tid && citContent
      ? codes.reduce(
          (acc, code) =>
            acc +
            (decodeJsonStat2Value(d05196, {
              Kjonn: kjonn,
              Statsbrgskap: '528',
              Alder: code,
              ContentsCode: citContent,
              Tid: latest05196Tid,
            }) ?? 0),
          0,
        )
      : 0
  const ageMales = ageBuckets.map(([, codes]) => sumCitSex('1', codes))
  const ageFemales = ageBuckets.map(([, codes]) => sumCitSex('2', codes))

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
    ...(typeof latestMales === 'number' && latestMales > 0 ? {latestMales} : {}),
    ...(typeof latestFemales === 'number' && latestFemales > 0 ? {latestFemales} : {}),
    ...(latestCitizenship > 0 ? {latestCitizenship} : {}),
    ...(sampledHistIndices.length > 0 && historyMales.some((n) => n > 0)
      ? {
          genderHistory: {
            years: sampledHistIndices.map((idx) => years05184[idx]),
            males: sampledHistIndices.map((idx) => historyMales[idx]),
            females: sampledHistIndices.map((idx) => historyFemales[idx]),
          },
        }
      : {}),
    ...(ageMales.some((n) => n > 0)
      ? {
          ageSex: {
            groups: ageBuckets.map(([label]) => label),
            males: ageMales,
            females: ageFemales,
          },
        }
      : {}),
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
  const sumAge = (y: string, age: string) =>
    ['1', '2'].reduce(
      (acc, k) =>
        acc +
        (decodeJsonStat2Value(ds, {
          Kjonn: k,
          Alder: age,
          Statsbrgskap: '528',
          ContentsCode: 'UtenlStatsbrg',
          Tid: y,
        }) ?? 0),
      0,
    )
  const children = years.map((y) => sumAge(y, '00-17'))
  const adults = years.map((y) => sumAge(y, '0018+'))
  const counts = years.map((_, idx) => (adults[idx] ?? 0) + (children[idx] ?? 0))
  return {
    updatedDate: isoDate(ds.updated) ?? rawSnapshot.naturalisations.updatedDate,
    years,
    counts,
    adults,
    children,
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
  const counties: NepalCountyEntry[] = []
  for (const reg of regions) {
    const val = decodeJsonStat2Value(ds, {
      Region: reg.code,
      InnvandrKat: 'B-C',
      Landbakgrunn: '528',
      ContentsCode: 'Personer1',
      Tid: latestYear,
    })
    if (typeof val !== 'number' || val <= 0) continue

    if (/^\d{2}$/.test(reg.code) && reg.code !== '00') {
      const name = cleanMunicipalityLabel(reg.label)
      counties.push({
        code: reg.code,
        name,
        neName: COUNTY_NE_NAMES[reg.code] ?? name,
        count: val,
      })
      continue
    }

    if (!/^\d{4}$/.test(reg.code) || reg.code.startsWith('00')) continue
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
  counties.sort((a, b) => b.count - a.count)
  return {
    updatedDate: isoDate(ds.updated) ?? rawSnapshot.municipalities.updatedDate,
    latestYear,
    top: entries.slice(0, 10),
    counties: counties.length ? counties : rawSnapshot.municipalities.counties,
  }
}

const parseResidenceDuration = async (
  fetcher: SsbFetcher,
): Promise<NepalStatsSnapshot['residenceDuration'] | null> => {
  const ds = await fetchSsbJson<JsonStat2Dataset>(
    buildSsbDataUrl('10598', {
      Region: '0',
      Lanbakgrunn: '528',
      Botid: '*',
      ContentsCode: '*',
      Tid: 'top(1)',
    }),
    {fetcher, timeoutMs: 4500},
  )
  const latestYear = orderedCategoryEntries(ds.dimension.Tid)[0]?.code
  const contents = orderedCategoryEntries(ds.dimension.ContentsCode)[0]?.code
  if (!latestYear || !contents) return null

  let u2 = 0
  let b2_4 = 0
  let b5_9 = 0
  let b10_14 = 0
  let b15p = 0
  for (const entry of orderedCategoryEntries(ds.dimension.Botid)) {
    const val =
      decodeJsonStat2Value(ds, {
        Region: '0',
        Lanbakgrunn: '528',
        Botid: entry.code,
        ContentsCode: contents,
        Tid: latestYear,
      }) ?? 0
    const yrs = entry.code === '40+' ? 40 : Number.parseInt(entry.code, 10)
    if (!Number.isFinite(yrs)) continue
    if (yrs < 2) u2 += val
    else if (yrs < 5) b2_4 += val
    else if (yrs < 10) b5_9 += val
    else if (yrs < 15) b10_14 += val
    else b15p += val
  }
  const total = u2 + b2_4 + b5_9 + b10_14 + b15p
  if (!(total > 0)) return null
  return {
    updatedDate: isoDate(ds.updated) ?? rawSnapshot.residenceDuration.updatedDate,
    latestYear,
    total,
    buckets: [
      {label: '२ वर्षभन्दा कम', count: u2},
      {label: '२–४ वर्ष', count: b2_4},
      {label: '५–९ वर्ष', count: b5_9},
      {label: '१०–१४ वर्ष', count: b10_14},
      {label: '१५ वर्ष वा बढी', count: b15p},
    ],
  }
}

const parseEmploymentRate = async (
  fetcher: SsbFetcher,
): Promise<NepalStatsSnapshot['employmentRate'] | null> => {
  const ds = await fetchSsbJson<JsonStat2Dataset>(
    buildSsbDataUrl('11609', {
      Kjonn: ['0', '1', '2'],
      Alder: '20-66',
      Landbakgrunn: '528',
      Botid: ['1', '2', '3', '0'],
      ContentsCode: 'Sysselsatte2',
      Tid: 'top(1)',
    }),
    {fetcher, timeoutMs: 4500},
  )
  const latestYear = orderedCategoryEntries(ds.dimension.Tid)[0]?.code
  if (!latestYear) return null
  const getRate = (kjonn: string, botid: string) =>
    decodeJsonStat2Value(ds, {
      Kjonn: kjonn,
      Alder: '20-66',
      Landbakgrunn: '528',
      Botid: botid,
      ContentsCode: 'Sysselsatte2',
      Tid: latestYear,
    }) ?? 0

  const overall = getRate('0', '0')
  if (!(overall > 0)) return null
  const stayOrder: [string, string][] = [
    ['४ वर्ष वा कम', '1'],
    ['४–६ वर्ष', '2'],
    ['७ वर्ष वा बढी', '3'],
    ['समग्र (२०–६६ वर्ष)', '0'],
  ]
  return {
    updatedDate: isoDate(ds.updated) ?? rawSnapshot.employmentRate.updatedDate,
    latestYear,
    overall,
    malesTotal: getRate('1', '0'),
    femalesTotal: getRate('2', '0'),
    categories: stayOrder.map(([label]) => label),
    males: stayOrder.map(([, code]) => getRate('1', code)),
    females: stayOrder.map(([, code]) => getRate('2', code)),
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
    specialistRoles: {
      teaching: getCode('23'),
      health: getCode('22'),
      engTech: getCode('31'),
      ict: getCode('25'),
      scienceEng: getCode('21'),
      bizProf: getCode('24'),
      bizAssoc: getCode('33'),
      healthAssoc: getCode('32'),
      ictTech: getCode('35'),
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
  const {
    population,
    naturalisations,
    municipalities,
    residenceDuration,
    employmentRate,
    occupations,
    education,
  } = snapshot
  const nepLatestPop = toNepaliYear(population.latestYear)
  const nepPopStart = toNepaliYear(population.years[0] ?? '2017')
  const nepHistStart = toNepaliYear(population.genderHistory.years[0] ?? '2000')
  const nepHistEnd = toNepaliYear(population.genderHistory.years.at(-1) ?? '2026')
  const nepNatStart = toNepaliYear(naturalisations.years[0] ?? '2016')
  const nepNatEnd = toNepaliYear(naturalisations.years.at(-1) ?? '2025')

  const specialistRaw: [string, number][] = [
    ['शिक्षक / प्राध्यापन', occupations.specialistRoles.teaching],
    ['चिकित्सक / नर्सिङ विशेषज्ञ', occupations.specialistRoles.health],
    ['स्नातक / प्राविधिक इन्जिनियर', occupations.specialistRoles.engTech],
    ['आईटी परामर्शदाता (विशेषज्ञ)', occupations.specialistRoles.ict],
    ['सिभिल इन्जिनियर र वैज्ञानिक', occupations.specialistRoles.scienceEng],
    ['वित्त र प्रशासन विशेषज्ञ', occupations.specialistRoles.bizProf],
    ['वित्त र प्रशासन सहयोगी', occupations.specialistRoles.bizAssoc],
    ['स्वास्थ्य प्राविधिक', occupations.specialistRoles.healthAssoc],
    ['आईटी प्राविधिक', occupations.specialistRoles.ictTech],
  ]
  const specialistEntries = specialistRaw.filter(([, val]) => val > 0)
  specialistEntries.sort((a, b) => b[1] - a[1])

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
    genderHistory: {
      _type: 'editorialChart',
      chartType: 'line',
      title: `जनसंख्या क्रम: पुरुष र महिला (${nepHistStart}–${nepHistEnd})`,
      subtitle: `सन् ${nepHistStart} देखि नर्वेमा बसोबास गर्ने नेपालमा जन्मिएका पुरुष र महिलाको संख्या`,
      description: 'सन् २०१० यता आप्रवासन तीव्र गतिमा बढेसँगै नर्वेमा पुरुष र महिलाको संख्या लगभग बराबर सन्तुलनमा पुगेको छ।',
      categories: population.genderHistory.years.map(toNepaliYear),
      series: [
        {
          _key: 'males',
          label: 'पुरुष',
          color: 'blue',
          values: population.genderHistory.males,
        },
        {
          _key: 'females',
          label: 'महिला',
          color: 'coral',
          values: population.genderHistory.females,
        },
      ],
      unit: 'people',
      decimalPrecision: 0,
      showLegend: true,
      showValues: false,
      showDataSummary: true,
      sourceLabel: `${SSB_ATTRIBUTION} — तालिका ०५१८४`,
      sourceUrl: `${SSB_STATBANK_PAGE}05184`,
      sourceDate: population.updatedDate,
    },
    ageSex: {
      _type: 'editorialChart',
      chartType: 'groupedBar',
      title: `उमेर र लिंगअनुसार नेपाली नागरिक (${nepLatestPop})`,
      subtitle: 'नेपाली राहदानी (नागरिकता) बाहकको उमेर समूह र लिंगगत संरचना',
      description: 'नेपाली नागरिकहरूमध्ये २०–३९ वर्ष उमेर समूहको हिस्सा सबैभन्दा ठूलो छ, जसमा युवा कामकाजी र विद्यार्थी परिवार प्रमुख छन्।',
      categories: population.ageSex.groups,
      series: [
        {
          _key: 'age-males',
          label: 'पुरुष',
          color: 'blue',
          values: population.ageSex.males,
        },
        {
          _key: 'age-females',
          label: 'महिला',
          color: 'coral',
          values: population.ageSex.females,
        },
      ],
      unit: 'people',
      decimalPrecision: 0,
      showLegend: true,
      showValues: false,
      showDataSummary: true,
      sourceLabel: `${SSB_ATTRIBUTION} — तालिका ०५१९६`,
      sourceUrl: `${SSB_STATBANK_PAGE}05196`,
      sourceDate: population.updatedDate,
    },
    naturalisations: {
      _type: 'editorialChart',
      chartType: 'stackedBar',
      title: `वार्षिक नर्वेली नागरिकता प्राप्त गर्ने नेपाली (${nepNatStart}–${nepNatEnd})`,
      subtitle: 'पहिले नेपाली नागरिकता भएका वयस्क (१८+) र बालबालिका/किशोर (<१८) को वार्षिक संख्या',
      description: 'पछिल्ला वर्षमा नर्वेली नागरिकता लिने नेपाली वयस्कसँगै १८ वर्षमुनिका बालबालिकाको संख्या पनि उल्लेखनीय छ।',
      categories: naturalisations.years.map(toNepaliYear),
      series: [
        {
          _key: 'nat-adults',
          label: 'वयस्क (१८ वर्ष र माथि)',
          shortLabel: 'वयस्क (१८+)',
          color: 'blue',
          values: naturalisations.adults,
        },
        {
          _key: 'nat-children',
          label: 'बालबालिका (<१८ वर्ष)',
          shortLabel: 'बालबालिका (<१८)',
          color: 'teal',
          values: naturalisations.children,
        },
      ],
      unit: 'people',
      decimalPrecision: 0,
      showLegend: true,
      showValues: false,
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
    counties: {
      _type: 'editorialChart',
      chartType: 'horizontalBar',
      title: `सबै १५ काउन्टी (फिल्के) अनुसार नेपाली जनसंख्या (${toNepaliYear(municipalities.latestYear)})`,
      subtitle: 'नर्वेका सम्पूर्ण १५ काउन्टीमा नेपाली पृष्ठभूमिका बासिन्दाको वितरण',
      description: 'नर्वेका १५ वटै काउन्टीमा नेपाली समुदायको उपस्थिति छ — आधाभन्दा बढी ओस्लोमा छन् भने आकेशुस, त्र्योन्दलाग, रोगालान र भेस्तलान प्रमुख अन्य क्षेत्र हुन्।',
      categories: municipalities.counties.map((c) => c.neName),
      series: [
        {
          _key: 'county-residents',
          label: 'कुल व्यक्ति',
          color: 'teal',
          values: municipalities.counties.map((c) => c.count),
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
    residenceDuration: {
      _type: 'editorialChart',
      chartType: 'donut',
      title: `नर्वेमा बसाइको अवधि (${toNepaliYear(residenceDuration.latestYear)})`,
      subtitle: 'नेपालमा जन्मिएका नेपाली आप्रवासीहरू नर्वेमा कति वर्षदेखि बसोबास गरिरहेका छन्?',
      description: 'झन्डै आधा नेपाली आप्रवासी पछिल्लो ५ वर्षभित्र नर्वे आएका हुन् भने १,१०० भन्दा बढी व्यक्ति १० वर्ष वा सोभन्दा लामो समयदेखि यहीँ बसोबास गर्छन्।',
      categories: residenceDuration.buckets.map((b) => b.label),
      series: [
        {
          _key: 'stay-duration',
          label: 'व्यक्ति संख्या',
          values: residenceDuration.buckets.map((b) => b.count),
        },
      ],
      unit: 'people',
      decimalPrecision: 0,
      showLegend: true,
      showValues: true,
      showPercentages: true,
      showDataSummary: true,
      sourceLabel: `${SSB_ATTRIBUTION} — तालिका १०५९८`,
      sourceUrl: `${SSB_STATBANK_PAGE}10598`,
      sourceDate: residenceDuration.updatedDate,
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
    employmentByStay: {
      _type: 'editorialChart',
      chartType: 'groupedBar',
      title: `बसाइ अवधिअनुसार रोजगारी दर: पुरुष र महिला (${toNepaliYear(employmentRate.latestYear)})`,
      subtitle: '२०–६६ वर्ष उमेर समूहका नेपाली आप्रवासीको कार्यरत प्रतिशत (चौथो त्रैमास)',
      description: 'नर्वेमा बसेको समय बढेसँगै पुरुष र महिला दुवैको रोजगारी दर उच्च हुँदै जान्छ; ७ वर्षभन्दा बढी बसेकामध्ये करिब ८०% महिला र ८२.५% पुरुष रोजगार छन्।',
      categories: employmentRate.categories,
      series: [
        {
          _key: 'emp-males',
          label: 'पुरुष (%)',
          shortLabel: 'पुरुष',
          color: 'blue',
          values: employmentRate.males,
        },
        {
          _key: 'emp-females',
          label: 'महिला (%)',
          shortLabel: 'महिला',
          color: 'teal',
          values: employmentRate.females,
        },
      ],
      unit: 'percent',
      decimalPrecision: 1,
      showLegend: true,
      showValues: true,
      showDataSummary: true,
      sourceLabel: `${SSB_ATTRIBUTION} — तालिका ११६०९`,
      sourceUrl: `${SSB_STATBANK_PAGE}11609`,
      sourceDate: employmentRate.updatedDate,
    },
    specialistProfessions: {
      _type: 'editorialChart',
      chartType: 'horizontalBar',
      title: `दक्ष तथा प्राविधिक पेशाको विस्तृत विवरण (${toNepaliYear(occupations.latestYear)})`,
      subtitle: 'शिक्षक, स्वास्थ्य, इन्जिनियरिङ, आईटी र प्रशासनका प्रमुख दक्ष क्षेत्रहरू',
      description: 'STYRK-08 वर्गीकरणअनुसार विश्वविद्यालय र कलेजस्तरीय दक्ष पेशामा शिक्षक, चिकित्सक/नर्स, इन्जिनियर र आईटी विज्ञहरू अग्रस्थानमा छन्।',
      categories: specialistEntries.map(([label]) => label),
      series: [
        {
          _key: 'specialist-count',
          label: 'कार्यरत व्यक्ति',
          color: 'blue',
          values: specialistEntries.map(([, val]) => val),
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
    const [popRes, natRes, muniRes, stayRes, empRes, occRes, eduRes] = await Promise.allSettled([
      parsePopulation(fetcher),
      parseNaturalisations(fetcher),
      parseMunicipalities(fetcher),
      parseResidenceDuration(fetcher),
      parseEmploymentRate(fetcher),
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
    if (stayRes.status === 'fulfilled' && stayRes.value) {
      snapshot.residenceDuration = stayRes.value
      liveTablesLoaded.push('10598')
    }
    if (empRes.status === 'fulfilled' && empRes.value) {
      snapshot.employmentRate = empRes.value
      liveTablesLoaded.push('11609')
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
