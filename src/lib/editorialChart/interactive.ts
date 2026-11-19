import {
  formatChartUnit,
  formatChartValue,
  formatPercentage,
} from './format.ts'
import {getPaletteIndex, isPolarChart} from './palette.ts'
import type {ChartLanguage, ChartType, NormalizedChart} from './types.ts'

export interface EditorialChartCopy {
  chart: string
  legend: string
  unit: string
  scrollHint: string
  dataTable: string
  category: string
  unavailable: string
  data: string
  source: string
  note: string
  summary: string
  chartUnavailable: string
  chartView: string
  tableView: string
  downloadCsv: string
  total: string
  showAll: string
  share: string
}

export interface ChartClientSeries {
  index: number
  label: string
  colorIndex: number
  values: (number | null)[]
  formattedValues: (string | null)[]
}

export interface ChartClientData {
  title?: string
  chartType?: ChartType
  language: ChartLanguage
  polar: boolean
  isStacked: boolean
  isHorizontal: boolean
  showPercentages: boolean
  unitLabel?: string
  categories: string[]
  series: ChartClientSeries[]
  percentages: (string | null)[]
  totals: (string | null)[]
  labels: {
    total: string
    unavailable: string
    chartView: string
    tableView: string
    downloadCsv: string
    showAll: string
    share: string
    category: string
  }
}

export const getEditorialChartCopy = (language: ChartLanguage): EditorialChartCopy =>
  language === 'ne'
    ? {
        chart: 'चार्ट',
        legend: 'चार्टको सङ्केत',
        unit: 'एकाइ',
        scrollHint: 'चार्ट काटिएमा दायाँबायाँ स्क्रोल गर्नुहोस्।',
        dataTable: 'चार्टको तथ्याङ्क तालिका',
        category: 'श्रेणी',
        unavailable: 'उपलब्ध छैन',
        data: 'चार्टको पूरा तथ्याङ्क हेर्नुहोस्',
        source: 'स्रोत',
        note: 'टिप्पणी',
        summary:
          'यो चार्टमा {categories} श्रेणी र {series} तथ्याङ्क शृङ्खला छन्। पूरा मान तलको तालिकामा छन्।',
        chartUnavailable: 'चार्ट चित्र देखाउन सकिएन। तथ्याङ्क तालिकामा उपलब्ध छ।',
        chartView: 'चार्ट',
        tableView: 'तालिका',
        downloadCsv: 'CSV',
        total: 'जम्मा',
        showAll: 'सबै देखाउनुहोस्',
        share: 'हिस्सा',
      }
    : {
        chart: 'Diagram',
        legend: 'Tegnforklaring',
        unit: 'Enhet',
        scrollHint: 'Rull sideveis hvis diagrammet er avkuttet.',
        dataTable: 'Diagramdata som tabell',
        category: 'Kategori',
        unavailable: 'Ikke tilgjengelig',
        data: 'Vis alle diagramdata',
        source: 'Kilde',
        note: 'Merknad',
        summary:
          'Diagrammet viser {categories} kategorier og {series} dataserier. Alle verdiene står i tabellen nedenfor.',
        chartUnavailable: 'Diagrammet kunne ikke vises. Dataene finnes i tabellen.',
        chartView: 'Diagram',
        tableView: 'Tabell',
        downloadCsv: 'CSV',
        total: 'Totalt',
        showAll: 'Vis alle',
        share: 'Andel',
      }

export const buildChartClientData = (
  chart: NormalizedChart,
  language: ChartLanguage,
): ChartClientData => {
  const copy = getEditorialChartCopy(language)
  const polar = isPolarChart(chart)
  const isStacked = chart.chartType === 'stackedBar' || chart.chartType === 'area'
  const unitLabel = chart.unit ? formatChartUnit(chart.unit, language) : undefined

  const series: ChartClientSeries[] = chart.series.map((item, index) => ({
    index,
    label: item.shortLabel ?? item.label,
    colorIndex: getPaletteIndex(chart, index),
    values: item.values,
    formattedValues: item.values.map((value) =>
      typeof value === 'number' ? formatChartValue(value, chart, language) : null,
    ),
  }))

  const totals = chart.categories.map((_, categoryIndex) => {
    if (!isStacked || series.length < 2) return null
    let sum = 0
    let hasValue = false
    for (const item of series) {
      const val = item.values[categoryIndex]
      if (typeof val === 'number') {
        sum += val
        hasValue = true
      }
    }
    return hasValue ? formatChartValue(sum, chart, language) : null
  })

  return {
    title: chart.title,
    chartType: chart.chartType,
    language,
    polar,
    isStacked,
    isHorizontal: chart.chartType === 'horizontalBar',
    showPercentages: chart.showPercentages,
    unitLabel,
    categories: chart.categories,
    series,
    percentages: chart.percentages.map((pct) =>
      typeof pct === 'number' ? formatPercentage(pct, language) : null,
    ),
    totals,
    labels: {
      total: copy.total,
      unavailable: copy.unavailable,
      chartView: copy.chartView,
      tableView: copy.tableView,
      downloadCsv: copy.downloadCsv,
      showAll: copy.showAll,
      share: copy.share,
      category: copy.category,
    },
  }
}

export const escapeCsvCell = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : ''
  const raw = String(value)
  // Neutralize spreadsheet formula triggers on untrusted text strings.
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export const buildChartCsv = (data: ChartClientData): string => {
  const showPct = data.polar && data.showPercentages
  const headers = [
    data.labels.category,
    ...data.series.map((s) => (data.unitLabel ? `${s.label} (${data.unitLabel})` : s.label)),
    ...(showPct ? ['%'] : []),
  ]
  const rows: string[] = [headers.map(escapeCsvCell).join(',')]
  const rowCount = Math.max(
    data.categories.length,
    ...data.series.map((s) => s.values.length),
  )
  for (let i = 0; i < rowCount; i += 1) {
    const category = data.categories[i] || `${data.labels.category} ${i + 1}`
    const cells: (string | number | null)[] = [
      category,
      ...data.series.map((s) => {
        const val = s.values[i]
        return typeof val === 'number' ? val : data.labels.unavailable
      }),
      ...(showPct ? [data.percentages[i] ?? data.labels.unavailable] : []),
    ]
    rows.push(cells.map(escapeCsvCell).join(','))
  }
  return `\uFEFF${rows.join('\r\n')}`
}

export const buildChartCsvFilename = (title?: string): string => {
  const slug = (title ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  return `${slug || 'nepali-no-chart'}.csv`
}
