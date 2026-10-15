export const CHART_TYPES = [
  'verticalBar',
  'horizontalBar',
  'groupedBar',
  'stackedBar',
  'line',
  'area',
  'donut',
  'pie',
] as const

export type ChartType = (typeof CHART_TYPES)[number]
export type ChartLanguage = 'ne' | 'nb'

export interface EditorialChartSeriesInput {
  _key?: string
  label?: unknown
  shortLabel?: unknown
  color?: unknown
  values?: unknown
}

export interface EditorialChartInput {
  _type?: unknown
  chartType?: unknown
  title?: unknown
  subtitle?: unknown
  description?: unknown
  categories?: unknown
  series?: unknown
  unit?: unknown
  customUnit?: unknown
  valuePrefix?: unknown
  valueSuffix?: unknown
  decimalPrecision?: unknown
  showLegend?: unknown
  showValues?: unknown
  showPercentages?: unknown
  showDataSummary?: unknown
  sourceLabel?: unknown
  sourceUrl?: unknown
  sourceDate?: unknown
  note?: unknown
  caption?: unknown
  altSummary?: unknown
}

export interface NormalizedSeries {
  key: string
  label: string
  shortLabel?: string
  colorKey?: string
  values: (number | null)[]
}

export interface NormalizedChart {
  chartType?: ChartType
  title?: string
  subtitle?: string
  description?: string
  categories: string[]
  series: NormalizedSeries[]
  unit?: string
  valuePrefix: string
  valueSuffix: string
  decimalPrecision: number
  showLegend: boolean
  // The legend that is actually rendered: always for multi-series and polar (unless off), never for one series.
  legendVisible: boolean
  showValues: boolean
  showPercentages: boolean
  showDataSummary: boolean
  sourceLabel?: string
  sourceUrl?: string
  sourceDate?: string
  note?: string
  caption?: string
  altSummary?: string
  percentages: (number | null)[]
  visualErrors: string[]
  warnings: string[]
  canRenderVisual: boolean
}

export type SvgShape =
  | {type: 'line'; x1: number; y1: number; x2: number; y2: number; className?: string}
  | {
      type: 'rect'
      x: number
      y: number
      width: number
      height: number
      series: number
      position: number
      pattern?: boolean
    }
  | {type: 'circle'; cx: number; cy: number; r: number; series: number; position: number}
  | {type: 'hole'; cx: number; cy: number; r: number}
  | {
      type: 'path'
      d: string
      series: number
      position: number
      fill?: boolean
      slice?: boolean
      pattern?: boolean
    }
  | {
      type: 'text'
      x: number
      y: number
      text: string
      lines?: string[]
      anchor?: 'start' | 'middle' | 'end'
      className?: string
    }

export type ChartLayout = 'compact' | 'wide'

export interface ChartGeometry {
  width: number
  height: number
  shapes: SvgShape[]
  layout: ChartLayout
  // True when the data needs more width than the layout offers, so the visual scrolls inside its container.
  scrolls: boolean
  labelLines: number
}
