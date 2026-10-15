import type {NormalizedChart} from './types.ts'

export const CHART_PALETTE = [
  'blue',
  'teal',
  'gold',
  'purple',
  'slate',
  'indigo',
  'cyan',
  'brown',
] as const

// One distinct SVG pattern per palette slot so no series relies on colour alone.
export const CHART_PATTERN_PATHS = [
  '',
  'M0 8 L8 0',
  'M0 0 L8 8',
  'M0 4 H8',
  'M4 0 V8',
  'M0 4 H8 M4 0 V8',
  'M2 2 L3 2 M6 6 L7 6',
  'M0 8 L8 0 M-1 3 L3 -1 M5 9 L9 5',
] as const

export const maxOf = (values: readonly number[], initial = -Infinity): number =>
  values.reduce((max, value) => (value > max ? value : max), initial)

export const minOf = (values: readonly number[], initial = Infinity): number =>
  values.reduce((min, value) => (value < min ? value : min), initial)

export const isPolarChart = (chart: Pick<NormalizedChart, 'chartType'>): boolean =>
  chart.chartType === 'pie' || chart.chartType === 'donut'

export const getPaletteIndex = (chart: NormalizedChart, seriesIndex: number): number => {
  if (isPolarChart(chart)) return seriesIndex % CHART_PALETTE.length
  const key = chart.series[seriesIndex]?.colorKey
  const selected = CHART_PALETTE.findIndex((color) => color === key)
  return selected >= 0 ? selected : seriesIndex % CHART_PALETTE.length
}
