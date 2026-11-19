export const SSB_API_BASE = 'https://data.ssb.no/api/pxwebapi/v2'
export const SSB_ATTRIBUTION = 'Statistisk sentralbyrå (SSB)'
export const SSB_STATBANK_PAGE = 'https://www.ssb.no/statbank/table/'

export interface JsonStat2Dimension {
  label?: string
  category: {
    index: Record<string, number> | string[]
    label: Record<string, string>
  }
}

export interface JsonStat2Dataset {
  version?: string
  class?: string
  label?: string
  source?: string
  updated?: string
  role?: {
    time?: string[]
    metric?: string[]
  }
  id: string[]
  size: number[]
  dimension: Record<string, JsonStat2Dimension>
  value: (number | null)[]
}

export interface ExtractedChartSeries {
  key: string
  label: string
  values: (number | null)[]
}

export interface ExtractedSsbChart {
  title: string
  updatedDate?: string
  categories: string[]
  categoryCodes: string[]
  series: ExtractedChartSeries[]
  availableDims: {
    id: string
    label: string
    codes: {code: string; label: string}[]
  }[]
  categoryDimId: string
  seriesDimId?: string
}

export type SsbFetcher = (url: string, init?: RequestInit) => Promise<Response>

export const extractTableId = (rawInput: string): string | null => {
  const trimmed = rawInput.trim()
  if (/^\d{4,6}$/.test(trimmed)) return trimmed
  try {
    const url = new URL(trimmed)
    if (url.hostname !== 'data.ssb.no' && url.hostname !== 'www.ssb.no') return null
    const match = url.pathname.match(/\/(?:tables|table)\/(\d{4,6})\b/i)
    return match ? match[1] : null
  } catch {
    return null
  }
}

export const buildSsbDataUrl = (
  tableId: string,
  valueCodes: Record<string, string | string[]>,
  lang: 'en' | 'no' = 'en',
): string => {
  if (!/^\d{4,6}$/.test(tableId)) {
    throw new Error(`Invalid SSB table ID: ${tableId}`)
  }
  const params = new URLSearchParams({lang, outputFormat: 'json-stat2'})
  for (const [dim, val] of Object.entries(valueCodes)) {
    const joined = Array.isArray(val) ? val.join(',') : val
    params.set(`valueCodes[${dim}]`, joined)
  }
  return `${SSB_API_BASE}/tables/${tableId}/data?${params.toString()}`
}

export const buildSsbMetadataUrl = (
  tableId: string,
  lang: 'en' | 'no' = 'en',
): string => {
  if (!/^\d{4,6}$/.test(tableId)) {
    throw new Error(`Invalid SSB table ID: ${tableId}`)
  }
  return `${SSB_API_BASE}/tables/${tableId}/metadata?lang=${lang}`
}

export const normalizeSsbDataUrl = (rawUrl: string): string | null => {
  try {
    const url = new URL(rawUrl.trim())
    if (url.protocol !== 'https:' || url.hostname !== 'data.ssb.no') return null
    if (!/^\/api\/pxwebapi\/v2\/tables\/\d{4,6}\/data\/?$/i.test(url.pathname)) return null
    url.searchParams.set('outputFormat', 'json-stat2')
    return url.toString()
  } catch {
    return null
  }
}

export const fetchSsbJson = async <T>(
  url: string,
  options: {fetcher?: SsbFetcher; timeoutMs?: number} = {},
): Promise<T> => {
  const fetcher = options.fetcher ?? fetch
  const timeoutMs = options.timeoutMs ?? 5500
  const controller = typeof AbortController === 'function' ? new AbortController() : undefined
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : undefined
  try {
    const resp = await fetcher(url, {
      headers: {Accept: 'application/json'},
      signal: controller?.signal,
    })
    if (!resp.ok) {
      throw new Error(`SSB HTTP ${resp.status} for ${url}`)
    }
    return (await resp.json()) as T
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}

export const orderedCategoryEntries = (
  dim: JsonStat2Dimension,
): {code: string; label: string; pos: number}[] => {
  const idx = dim.category.index
  const labels = dim.category.label ?? {}
  if (Array.isArray(idx)) {
    return idx.map((code, pos) => ({code, label: labels[code] ?? code, pos}))
  }
  return Object.entries(idx)
    .map(([code, pos]) => ({code, label: labels[code] ?? code, pos}))
    .sort((a, b) => a.pos - b.pos)
}

export const decodeJsonStat2Value = (
  dataset: JsonStat2Dataset,
  coords: Record<string, string>,
): number | null => {
  if (!Array.isArray(dataset.id) || !Array.isArray(dataset.size) || !Array.isArray(dataset.value)) {
    return null
  }
  let linear = 0
  for (let i = 0; i < dataset.id.length; i += 1) {
    const dimId = dataset.id[i]
    const size = dataset.size[i]
    const dim = dataset.dimension[dimId]
    if (!dim || !(size > 0)) return null
    const targetCode = coords[dimId]
    if (!targetCode) return null
    const idx = dim.category.index
    const pos = Array.isArray(idx) ? idx.indexOf(targetCode) : idx[targetCode]
    if (typeof pos !== 'number' || pos < 0 || pos >= size) return null
    linear = linear * size + pos
  }
  const raw = dataset.value[linear]
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : null
}

/**
 * Picks a sensible bounded URL query directly from a table's metadata so pasting an SSB
 * table ID works out of the box without exceeding PxWebApi limits.
 */
export const buildDefaultDataUrlFromMetadata = (
  meta: JsonStat2Dataset,
  tableId: string,
  lang: 'en' | 'no' = 'en',
  maxPeriods = 8,
): string => {
  const timeDims = new Set(meta.role?.time ?? ['Tid'])
  const valueCodes: Record<string, string | string[]> = {}
  let multiSelected = false

  for (const dimId of meta.id) {
    const dim = meta.dimension[dimId]
    if (!dim) continue
    const entries = orderedCategoryEntries(dim)
    if (!entries.length) continue
    if (timeDims.has(dimId)) {
      valueCodes[dimId] = `top(${Math.max(1, Math.min(12, maxPeriods))})`
      continue
    }
    if (!multiSelected && entries.length >= 2 && entries.length <= 5) {
      valueCodes[dimId] = entries.map((e) => e.code)
      multiSelected = true
    } else if (!multiSelected && entries.length > 5 && entries.length <= 12) {
      valueCodes[dimId] = entries.slice(0, 5).map((e) => e.code)
      multiSelected = true
    } else {
      const nepal = entries.find((e) => e.code === '528' || /nepal/i.test(e.label))
      valueCodes[dimId] = (nepal ?? entries[0]).code
    }
  }

  return buildSsbDataUrl(tableId, valueCodes, lang)
}

export const extractChartFromJsonStat2 = (
  dataset: JsonStat2Dataset,
  options: {
    categoryDimId?: string
    seriesDimId?: string
    fixedCodes?: Record<string, string>
    maxCategories?: number
    maxSeries?: number
  } = {},
): ExtractedSsbChart => {
  const availableDims = dataset.id.map((dimId) => {
    const dim = dataset.dimension[dimId]
    const codes = dim
      ? orderedCategoryEntries(dim).map(({code, label}) => ({code, label}))
      : []
    return {
      id: dimId,
      label: dim?.label ?? dimId,
      codes,
    }
  })

  const dimsWithMultiple = availableDims.filter((d) => d.codes.length > 1)
  const timeDimId =
    availableDims.find((d) => (dataset.role?.time ?? ['Tid']).includes(d.id) && d.codes.length > 1)
      ?.id ?? dimsWithMultiple[0]?.id ?? availableDims[0]?.id

  const categoryDimId =
    options.categoryDimId && availableDims.some((d) => d.id === options.categoryDimId)
      ? options.categoryDimId
      : timeDimId

  const candidateSeriesDims = dimsWithMultiple.filter((d) => d.id !== categoryDimId)
  const seriesDimId =
    options.seriesDimId === ''
      ? undefined
      : options.seriesDimId && candidateSeriesDims.some((d) => d.id === options.seriesDimId)
        ? options.seriesDimId
        : candidateSeriesDims[0]?.id

  const catDim = availableDims.find((d) => d.id === categoryDimId)
  const maxCats = Math.min(24, Math.max(1, options.maxCategories ?? 24))
  const catEntries = (catDim?.codes ?? []).slice(0, maxCats)

  const fixed: Record<string, string> = {}
  for (const d of availableDims) {
    if (d.id === categoryDimId || d.id === seriesDimId) continue
    const preferred = options.fixedCodes?.[d.id]
    const valid = preferred && d.codes.some((c) => c.code === preferred) ? preferred : d.codes[0]?.code
    if (valid) fixed[d.id] = valid
  }

  const maxSer = Math.min(5, Math.max(1, options.maxSeries ?? 5))
  const seriesDim = seriesDimId ? availableDims.find((d) => d.id === seriesDimId) : undefined
  const series: ExtractedChartSeries[] = seriesDim
    ? seriesDim.codes.slice(0, maxSer).map((sEntry) => ({
        key: sEntry.code,
        label: sEntry.label,
        values: catEntries.map((cEntry) =>
          decodeJsonStat2Value(dataset, {
            ...fixed,
            [categoryDimId]: cEntry.code,
            [seriesDim.id]: sEntry.code,
          }),
        ),
      }))
    : [
        {
          key: 'series-1',
          label: dataset.label ?? 'SSB',
          values: catEntries.map((cEntry) =>
            decodeJsonStat2Value(dataset, {
              ...fixed,
              [categoryDimId]: cEntry.code,
            }),
          ),
        },
      ]

  const updatedDate =
    typeof dataset.updated === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dataset.updated)
      ? dataset.updated.slice(0, 10)
      : undefined

  return {
    title: dataset.label ?? 'Statistisk sentralbyrå (SSB)',
    updatedDate,
    categories: catEntries.map((c) => c.label),
    categoryCodes: catEntries.map((c) => c.code),
    series,
    availableDims,
    categoryDimId,
    seriesDimId,
  }
}
