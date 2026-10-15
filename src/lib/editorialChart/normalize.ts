import {maxOf} from './palette.ts'
import {CHART_TYPES, type NormalizedChart} from './types.ts'

const text = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined

const PERCENT_UNIT_LABELS = ['percent', 'prosent', 'प्रतिशत', '%']

export const createChartIdSuffix = (input: unknown, index = 0): string => {
  const key = isRecord(input) && typeof input._key === 'string' ? input._key : ''
  const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '')
  if (safeKey) return safeKey
  let serialized = ''
  try {
    serialized = JSON.stringify(input) ?? ''
  } catch {
    serialized = ''
  }
  let hash = 0x811c9dc5
  for (let position = 0; position < serialized.length; position += 1) {
    hash ^= serialized.charCodeAt(position)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return `c${hash.toString(36)}-${index}`
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isPieChart = (chartType: string | undefined): boolean =>
  chartType === 'pie' || chartType === 'donut'

export const normalizeEditorialChart = (input: unknown): NormalizedChart => {
  const source = isRecord(input) ? input : {}
  const chartType =
    typeof source.chartType === 'string' &&
    CHART_TYPES.includes(source.chartType as (typeof CHART_TYPES)[number])
      ? (source.chartType as (typeof CHART_TYPES)[number])
      : undefined
  const categories = Array.isArray(source.categories)
    ? source.categories.map((category) => text(category) ?? '')
    : []
  const rawSeries = Array.isArray(source.series) ? source.series : []
  const series = rawSeries.flatMap((candidate, index) => {
    if (!isRecord(candidate)) return []
    const label = text(candidate.label)
    if (!label) return []
    const values = Array.isArray(candidate.values)
      ? candidate.values.map((value) =>
          typeof value === 'number' && Number.isFinite(value) ? value : null,
        )
      : []
    return [
      {
        key: text(candidate._key) ?? `${index}`,
        label,
        shortLabel: text(candidate.shortLabel),
        colorKey: text(candidate.color),
        values,
      },
    ]
  })

  const visualErrors: string[] = []
  if (!chartType) visualErrors.push('Unsupported chart type')
  if (!categories.length || categories.some((category) => !category)) {
    visualErrors.push('Missing or invalid categories')
  }
  if (!series.length) visualErrors.push('Missing or invalid series')
  if (isPieChart(chartType) && series.length !== 1) {
    visualErrors.push('Pie and donut charts require exactly one series')
  }
  if (chartType && ['line', 'area'].includes(chartType) && categories.length < 2) {
    visualErrors.push('Line and area charts require at least two categories')
  }
  for (const item of series) {
    if (item.values.length !== categories.length) {
      visualErrors.push(`Value count does not match categories for ${item.label}`)
    }
    if (item.values.some((value) => value === null)) {
      visualErrors.push(`Invalid numeric value in ${item.label}`)
    }
  }
  if (chartType === 'stackedBar' || chartType === 'area') {
    categories.forEach((_, categoryIndex) => {
      let positive = 0
      let negative = 0
      for (const item of series) {
        const value = item.values[categoryIndex]
        if (typeof value !== 'number') continue
        if (value >= 0) positive += value
        else negative += value
        if (!Number.isFinite(positive) || !Number.isFinite(negative)) {
          visualErrors.push('Stacked values exceed the supported numeric range')
          return
        }
      }
    })
  }
  if (isPieChart(chartType) && series[0]?.values.some((value) => value !== null && value < 0)) {
    visualErrors.push('Pie and donut charts cannot contain negative values')
  }
  if (
    isPieChart(chartType) &&
    series[0]?.values.filter((value) => value !== null && value > 0).length < 2
  ) {
    visualErrors.push('Pie and donut charts require at least two non-zero segments')
  }
  if (categories.length > 24 || series.length > 5) {
    visualErrors.push('Chart exceeds the supported visual complexity')
  }

  const validPieValues =
    isPieChart(chartType) &&
    series.length === 1 &&
    series[0].values.every((value) => value !== null && value >= 0)
      ? (series[0].values as number[])
      : []
  const pieMaximum = maxOf(validPieValues, 0)
  const scaledPieValues = validPieValues.map((value) => (pieMaximum > 0 ? value / pieMaximum : 0))
  const pieTotal = scaledPieValues.reduce((total, value) => total + value, 0)
  const percentages = categories.map((_, index) =>
    pieTotal > 0 && scaledPieValues[index] !== undefined
      ? (scaledPieValues[index] / pieTotal) * 100
      : null,
  )
  const precision =
    typeof source.decimalPrecision === 'number' &&
    Number.isInteger(source.decimalPrecision) &&
    source.decimalPrecision >= 0 &&
    source.decimalPrecision <= 3
      ? source.decimalPrecision
      : 0

  const unit = text(source.unit) === 'custom' ? text(source.customUnit) : text(source.unit)
  const rawSuffix = text(source.valueSuffix) ?? ''
  const warnings: string[] = []
  const percentUnit = unit !== undefined && PERCENT_UNIT_LABELS.includes(unit.toLowerCase())
  const suffixConflicts = percentUnit && rawSuffix.includes('%')
  if (suffixConflicts) {
    warnings.push('Value suffix contains % while the unit is already percent; suffix ignored')
  }

  return {
    chartType,
    title: text(source.title),
    subtitle: text(source.subtitle),
    description: text(source.description),
    categories,
    series,
    unit,
    valuePrefix: text(source.valuePrefix) ?? '',
    valueSuffix: suffixConflicts ? '' : rawSuffix,
    decimalPrecision: precision,
    showLegend: source.showLegend !== false,
    legendVisible: isPieChart(chartType) ? source.showLegend !== false : series.length > 1,
    showValues: source.showValues !== false,
    showPercentages: isPieChart(chartType) && source.showPercentages !== false,
    showDataSummary: source.showDataSummary !== false,
    sourceLabel: text(source.sourceLabel),
    sourceUrl:
      typeof source.sourceUrl === 'string' && isHttpsUrl(source.sourceUrl)
        ? source.sourceUrl
        : undefined,
    sourceDate: text(source.sourceDate),
    note: text(source.note),
    caption: text(source.caption),
    altSummary: text(source.altSummary),
    percentages,
    visualErrors,
    warnings,
    canRenderVisual: visualErrors.length === 0,
  }
}

export const isHttpsUrl = (value: string): boolean => {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}
