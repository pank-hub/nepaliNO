import {createChartNumberFormatter} from './format.ts'
import {CHART_PALETTE, getPaletteIndex, maxOf, minOf} from './palette.ts'
import type {ChartGeometry, ChartLanguage, ChartLayout, NormalizedChart, SvgShape} from './types.ts'

/**
 * Responsive layout thresholds. Every Cartesian chart is generated twice on the server:
 * a `compact` layout (viewBox about one phone column wide) and a `wide` layout. CSS shows
 * the compact one when the chart container is narrower than CHART_CONTAINER_BREAKPOINT_REM.
 * A layout only scrolls horizontally when its data cannot reach the minimum slot sizes below.
 */
export const CHART_CONTAINER_BREAKPOINT_REM = 35

export const CHART_LAYOUTS = {
  compact: {
    width: 360,
    plotHeight: 230,
    rightPad: 12,
    maxLabelColumn: 132,
    maxBarThickness: 44,
    minCategorySlot: 40,
    minBarInGroup: 16,
    minPointSpacing: 44,
  },
  wide: {
    width: 640,
    plotHeight: 290,
    rightPad: 28,
    maxLabelColumn: 260,
    maxBarThickness: 56,
    minCategorySlot: 52,
    minBarInGroup: 22,
    minPointSpacing: 52,
  },
} as const

const LABEL_CHAR_WIDTH = 7.4
const VALUE_CHAR_WIDTH = 7.6
const LINE_HEIGHT = 15
const MAX_LABEL_LINES = 3
const MAX_HORIZONTAL_LABEL_LINES = 4
const MAX_LABEL_GROWTH_CHARS = 12
const GROUP_FILL = 0.78
const MAX_AXIS_LEFT = 100
const MIN_AXIS_LEFT = 36

const colorIndex = (index: number, chart: NormalizedChart): number => getPaletteIndex(chart, index)

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

const addText = (
  shapes: SvgShape[],
  x: number,
  y: number,
  text: string,
  anchor: 'start' | 'middle' | 'end' = 'middle',
  className?: string,
) => shapes.push({type: 'text', x, y, text, anchor, className})

const graphemeSegmenter =
  typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter(undefined, {granularity: 'grapheme'})
    : undefined

// Grapheme-aware so Devanagari conjuncts and combining marks are never split.
const graphemes = (value: string): string[] =>
  graphemeSegmenter
    ? Array.from(graphemeSegmenter.segment(value), (part) => part.segment)
    : Array.from(value)

export interface WrappedLabel {
  lines: string[]
  truncated: boolean
}

export const wrapLabel = (
  value: string,
  maxChars: number,
  maxLines = MAX_LABEL_LINES,
): WrappedLabel => {
  const limit = Math.max(1, Math.floor(maxChars))
  const pieces: string[] = []
  for (const word of value.split(/\s+/).filter(Boolean)) {
    const parts = graphemes(word)
    if (parts.length <= limit) pieces.push(word)
    else
      for (let i = 0; i < parts.length; i += limit) pieces.push(parts.slice(i, i + limit).join(''))
  }
  const lines: string[] = []
  let line = ''
  for (const piece of pieces) {
    const next = line ? `${line} ${piece}` : piece
    if (line && graphemes(next).length > limit) {
      lines.push(line)
      line = piece
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  if (!lines.length) return {lines: [value], truncated: false}
  if (lines.length <= maxLines) return {lines, truncated: false}
  const kept = lines.slice(0, maxLines)
  const last = graphemes(kept[maxLines - 1])
  kept[maxLines - 1] = `${last.slice(0, Math.max(1, limit - 1)).join('')}…`
  return {lines: kept, truncated: true}
}

// Devanagari glyph clusters render noticeably wider than Latin characters at the same size.
const DEVANAGARI_CHAR_WIDTH = 8.8
const labelCharWidth = (labels: string[]): number =>
  labels.some((label) => /[\u0900-\u097F]/.test(label)) ? DEVANAGARI_CHAR_WIDTH : LABEL_CHAR_WIDTH

const charsForWidth = (width: number, charWidth: number): number =>
  Math.max(4, Math.floor((width - 4) / charWidth))

// Wraps labels into the given slot; if that would truncate, reports the slot width that avoids it.
export const fitCategoryLabels = (
  labels: string[],
  slotWidth: number,
  maxLines = MAX_LABEL_LINES,
): {wrapped: WrappedLabel[]; neededWidth: number} => {
  const charWidth = labelCharWidth(labels)
  const chars = charsForWidth(slotWidth, charWidth)
  const wrapped = labels.map((label) => wrapLabel(label, chars, maxLines))
  if (!wrapped.some((item) => item.truncated)) return {wrapped, neededWidth: slotWidth}
  for (let attempt = chars + 1; attempt <= MAX_LABEL_GROWTH_CHARS; attempt += 1) {
    const grown = labels.map((label) => wrapLabel(label, attempt, maxLines))
    if (!grown.some((item) => item.truncated)) {
      return {wrapped: grown, neededWidth: attempt * charWidth + 4}
    }
  }
  return {wrapped, neededWidth: slotWidth}
}

const pieArc = (cx: number, cy: number, radius: number, start: number, end: number): string => {
  const point = (angle: number) => {
    const radians = ((angle - 90) * Math.PI) / 180
    return [cx + radius * Math.cos(radians), cy + radius * Math.sin(radians)]
  }
  const [x1, y1] = point(start)
  const [x2, y2] = point(end)
  const largeArc = end - start > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
}

const polarGeometry = (chart: NormalizedChart): ChartGeometry => {
  const shapes: SvgShape[] = []
  const values = chart.series[0]?.values as number[]
  const maximum = maxOf(values, 0)
  const scaledValues = values.map((value) => (maximum > 0 ? value / maximum : 0))
  const total = scaledValues.reduce((sum, value) => sum + value, 0)
  const cx = 180
  const cy = 170
  const radius = 130
  let angle = 0
  const sliceLabels: {index: number; angle: number; share: number}[] = []
  scaledValues.forEach((value, index) => {
    if (value <= 0 || total <= 0) return
    const next = angle + (value / total) * 360
    shapes.push({
      type: 'path',
      d: pieArc(cx, cy, radius, angle, next),
      series: index % CHART_PALETTE.length,
      position: index,
      slice: true,
      pattern: index > 0,
    })
    sliceLabels.push({index, angle: (angle + next) / 2, share: value / total})
    angle = next
  })
  const donut = chart.chartType === 'donut'
  if (donut) {
    shapes.push({type: 'hole', cx, cy, r: 68})
  }
  const labelRadius = donut ? 99 : radius * 0.68
  for (const {index, angle: middle, share} of sliceLabels) {
    if (share < 0.05) continue
    const radians = ((middle - 90) * Math.PI) / 180
    addText(
      shapes,
      cx + labelRadius * Math.cos(radians),
      cy + labelRadius * Math.sin(radians) + 5,
      String(index + 1),
      'middle',
      'slice',
    )
  }
  return {width: 360, height: 340, shapes, layout: 'compact', scrolls: false, labelLines: 0}
}

interface Domain {
  magnitude: number
  minValue: number
  maxValue: number
  span: number
}

const buildDomain = (chart: NormalizedChart): Domain => {
  const series = chart.series
  const allValues = series.flatMap((item) =>
    item.values.filter((value): value is number => typeof value === 'number'),
  )
  const magnitude = maxOf(
    allValues.map((value) => Math.abs(value)),
    1,
  )
  const scaledData = allValues.map((value) => value / magnitude)
  if (chart.chartType === 'stackedBar' || chart.chartType === 'area') {
    chart.categories.forEach((_, categoryIndex) => {
      let positive = 0
      let negative = 0
      series.forEach((item) => {
        const value = item.values[categoryIndex]
        if (typeof value !== 'number') return
        const scaled = value / magnitude
        if (scaled >= 0) positive += scaled
        else negative += scaled
      })
      scaledData.push(positive, negative)
    })
  }
  const minValue = minOf(scaledData, 0)
  const maxValue = maxOf(scaledData, 0)
  return {magnitude, minValue, maxValue, span: maxValue - minValue || 1}
}

const longestLength = (labels: string[]): number =>
  labels.reduce((longest, label) => Math.max(longest, graphemes(label).length), 0)

const horizontalGeometry = (
  chart: NormalizedChart,
  language: ChartLanguage,
  layout: ChartLayout,
  domain: Domain,
): ChartGeometry => {
  const spec = CHART_LAYOUTS[layout]
  const {categories, series} = chart
  const {magnitude, minValue, span} = domain
  const formatter = createChartNumberFormatter(language, chart.decimalPrecision)
  const grouped = series.length > 1
  const charWidth = labelCharWidth(categories)
  const labelColumn = clamp(
    Math.round(Math.min(longestLength(categories), 28) * charWidth) + 16,
    84,
    spec.maxLabelColumn,
  )
  const labelChars = Math.max(4, Math.floor((labelColumn - 16) / charWidth))
  const wrapped = categories.map((label) =>
    wrapLabel(label, labelChars, MAX_HORIZONTAL_LABEL_LINES),
  )
  const labelLines = maxOf(
    wrapped.map((item) => item.lines.length),
    1,
  )
  const rowHeight = Math.max(
    40,
    labelLines * LINE_HEIGHT + 14,
    grouped ? series.length * 18 + 16 : 0,
  )
  const top = 10
  const left = labelColumn
  const right = spec.width - spec.rightPad
  const plotWidth = right - left
  const bottom = top + categories.length * rowHeight
  const height = bottom + 30
  const scaleX = (value: number) => left + ((value - minValue) / span) * plotWidth
  const shapes: SvgShape[] = []

  const tickTexts = Array.from({length: 5}, (_, i) =>
    formatter((minValue + (span * i) / 4) * magnitude),
  )
  const tickWidth = maxOf(
    tickTexts.map((text) => text.length * VALUE_CHAR_WIDTH),
    0,
  )
  const ticks = clamp(Math.floor(plotWidth / (tickWidth + 14)), 1, 4)
  for (let i = 0; i <= ticks; i += 1) {
    const scaledValue = minValue + (span * i) / ticks
    const x = scaleX(scaledValue)
    shapes.push({type: 'line', x1: x, y1: top, x2: x, y2: bottom, className: 'grid'})
    addText(shapes, x, bottom + 18, formatter(scaledValue * magnitude), 'middle', 'axis')
  }
  const zero = scaleX(0)
  shapes.push({type: 'line', x1: zero, y1: top, x2: zero, y2: bottom, className: 'baseline'})

  categories.forEach((category, categoryIndex) => {
    const rowTop = top + categoryIndex * rowHeight
    const thickness = grouped ? 18 : Math.min(rowHeight * 0.6, 30)
    const blockHeight = thickness * (grouped ? series.length : 1)
    series.forEach((item, seriesIndex) => {
      const value = item.values[categoryIndex]
      if (typeof value !== 'number') return
      const y = rowTop + (rowHeight - blockHeight) / 2 + (grouped ? seriesIndex * thickness : 0)
      const scaledValue = value / magnitude
      const x1 = scaleX(Math.min(0, scaledValue))
      const x2 = scaleX(Math.max(0, scaledValue))
      // A true zero draws no bar at all; non-zero values keep at least one pixel.
      if (value !== 0) {
        shapes.push({
          type: 'rect',
          x: x1,
          y,
          width: Math.max(1, x2 - x1),
          height: thickness,
          series: colorIndex(seriesIndex, chart),
          position: seriesIndex,
          pattern: grouped && seriesIndex > 0,
        })
      }
      if (chart.showValues) {
        const text = formatter(value)
        const textWidth = text.length * VALUE_CHAR_WIDTH
        const centerY = y + thickness / 2 + 4
        if (value >= 0) {
          const fitsOutside = x2 + 6 + textWidth <= spec.width - 2
          if (fitsOutside || value === 0) addText(shapes, x2 + 6, centerY, text, 'start', 'value')
          else addText(shapes, x2 - 6, centerY, text, 'end', 'value-inside')
        } else {
          const fitsOutside = x1 - 6 - textWidth >= 2
          if (fitsOutside) addText(shapes, x1 - 6, centerY, text, 'end', 'value')
          else addText(shapes, x1 + 6, centerY, text, 'start', 'value-inside')
        }
      }
    })
    const lines = wrapped[categoryIndex].lines
    shapes.push({
      type: 'text',
      x: left - 12,
      y: rowTop + rowHeight / 2 - ((lines.length - 1) * LINE_HEIGHT) / 2 + 4,
      text: category,
      lines,
      anchor: 'end',
      className: 'category',
    })
  })
  return {width: spec.width, height, shapes, layout, scrolls: false, labelLines}
}

const verticalGeometry = (
  chart: NormalizedChart,
  language: ChartLanguage,
  layout: ChartLayout,
  domain: Domain,
): ChartGeometry => {
  const spec = CHART_LAYOUTS[layout]
  const {categories, series} = chart
  const {magnitude, minValue, span} = domain
  const formatter = createChartNumberFormatter(language, chart.decimalPrecision)
  const count = categories.length
  const isLine = chart.chartType === 'line' || chart.chartType === 'area'
  const isStacked = chart.chartType === 'stackedBar'
  const grouped =
    chart.chartType === 'groupedBar' || (series.length > 1 && chart.chartType === 'verticalBar')

  const tickTexts = Array.from({length: 5}, (_, i) =>
    formatter((minValue + (span * i) / 4) * magnitude),
  )
  const axisWidth = maxOf(
    tickTexts.map((text) => text.length * LABEL_CHAR_WIDTH),
    0,
  )
  const left = clamp(Math.ceil(axisWidth) + 16, MIN_AXIS_LEFT, MAX_AXIS_LEFT)
  const available = spec.width - left - spec.rightPad
  const labelsAboveBars = chart.showValues && !isStacked && !isLine
  const valueWidth = labelsAboveBars
    ? maxOf(
        series.flatMap((item) =>
          item.values.flatMap((value) =>
            typeof value === 'number' ? [formatter(value).length * VALUE_CHAR_WIDTH] : [],
          ),
        ),
        0,
      )
    : 0

  let width: number = spec.width
  let slot = available / count
  let inset = 0
  let spacing = 0
  let wrapped: WrappedLabel[]

  if (isLine) {
    inset = Math.min(slot / 2, 34)
    spacing = (available - 2 * inset) / (count - 1)
    const fit = fitCategoryLabels(categories, Math.min(spacing, 2 * inset))
    const minSpacing = Math.max(spec.minPointSpacing, fit.neededWidth)
    if (spacing < minSpacing) {
      inset = Math.max(inset, fit.neededWidth / 2)
      spacing = minSpacing
      width = Math.ceil(left + spec.rightPad + 2 * inset + (count - 1) * spacing)
    }
    wrapped = fitCategoryLabels(categories, Math.min(spacing, 2 * inset)).wrapped
  } else {
    const baseSlot = grouped
      ? (series.length * spec.minBarInGroup) / GROUP_FILL + 10
      : spec.minCategorySlot
    const valueSlot = grouped
      ? (series.length * valueWidth) / GROUP_FILL
      : valueWidth > 0
        ? valueWidth + 8
        : 0
    const fit = fitCategoryLabels(categories, slot)
    const minSlot = Math.max(baseSlot, valueSlot, fit.neededWidth)
    if (slot < minSlot) {
      slot = minSlot
      width = Math.ceil(left + spec.rightPad + count * slot)
    }
    wrapped = fitCategoryLabels(categories, slot).wrapped
  }

  const labelLines = maxOf(
    wrapped.map((item) => item.lines.length),
    1,
  )
  const top = 30
  const bottom = top + spec.plotHeight
  const height = bottom + 18 + (labelLines - 1) * LINE_HEIGHT + 12
  const right = width - spec.rightPad
  const plotHeight = bottom - top
  const scaleY = (value: number) => bottom - ((value - minValue) / span) * plotHeight
  const shapes: SvgShape[] = []

  for (let i = 0; i <= 4; i += 1) {
    const scaledValue = minValue + (span * i) / 4
    const y = scaleY(scaledValue)
    shapes.push({type: 'line', x1: left, y1: y, x2: right, y2: y, className: 'grid'})
    addText(shapes, left - 8, y + 4, tickTexts[i], 'end', 'axis')
  }
  const zero = scaleY(0)
  shapes.push({type: 'line', x1: left, y1: zero, x2: right, y2: zero, className: 'baseline'})

  const categoryX = (index: number) =>
    isLine ? left + inset + index * spacing : left + index * slot + slot / 2
  const pushCategoryLabels = () =>
    categories.forEach((category, index) =>
      shapes.push({
        type: 'text',
        x: categoryX(index),
        y: bottom + 18,
        text: category,
        lines: wrapped[index].lines,
        anchor: 'middle',
        className: 'category',
      }),
    )

  if (!isLine) {
    const barWidthLimit = Math.min(
      spec.maxBarThickness,
      slot * (grouped ? GROUP_FILL / series.length : 0.62),
    )
    categories.forEach((_, categoryIndex) => {
      let positive = 0
      let negative = 0
      series.forEach((item, seriesIndex) => {
        const value = item.values[categoryIndex]
        if (typeof value !== 'number') return
        const barWidth = barWidthLimit
        const centerX = categoryX(categoryIndex)
        const x = grouped
          ? centerX - (barWidth * series.length) / 2 + seriesIndex * barWidth
          : centerX - barWidth / 2
        const scaledValue = value / magnitude
        const startValue = isStacked ? (value >= 0 ? positive : negative) : 0
        const endValue = isStacked ? startValue + scaledValue : scaledValue
        if (isStacked) value >= 0 ? (positive += scaledValue) : (negative += scaledValue)
        const y1 = scaleY(startValue)
        const y2 = scaleY(endValue)
        // A true zero draws no bar; any non-zero value keeps at least one pixel.
        if (value !== 0) {
          shapes.push({
            type: 'rect',
            x,
            y: Math.min(y1, y2),
            width: Math.max(2, barWidth),
            height: Math.max(1, Math.abs(y2 - y1)),
            series: colorIndex(seriesIndex, chart),
            position: seriesIndex,
            pattern: (grouped || isStacked) && seriesIndex > 0,
          })
        }
        if (labelsAboveBars) {
          const text = formatter(value)
          if (value >= 0) addText(shapes, x + barWidth / 2, y2 - 6, text, 'middle', 'value')
          else if (y2 + 16 <= bottom - 2)
            addText(shapes, x + barWidth / 2, y2 + 16, text, 'middle', 'value')
          else addText(shapes, x + barWidth / 2, y2 - 6, text, 'middle', 'value-inside')
        }
      })
    })
    pushCategoryLabels()
    return {width, height, shapes, layout, scrolls: width > spec.width, labelLines}
  }

  pushCategoryLabels()
  if (chart.chartType === 'line') {
    series.forEach((item, seriesIndex) => {
      const points = item.values.flatMap((value, index) =>
        typeof value === 'number' ? [{x: categoryX(index), y: scaleY(value / magnitude)}] : [],
      )
      if (points.length > 1) {
        const d = points
          .map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`)
          .join(' ')
        shapes.push({
          type: 'path',
          d,
          series: colorIndex(seriesIndex, chart),
          position: seriesIndex,
        })
      }
      points.forEach(({x, y}) =>
        shapes.push({
          type: 'circle',
          cx: x,
          cy: y,
          r: 5,
          series: colorIndex(seriesIndex, chart),
          position: seriesIndex,
        }),
      )
    })
  } else {
    const positive = categories.map(() => 0)
    const negative = categories.map(() => 0)
    series.forEach((item, seriesIndex) => {
      const lower: number[] = []
      const upper: number[] = []
      item.values.forEach((value, index) => {
        if (typeof value !== 'number') return
        const scaledValue = value / magnitude
        const base = scaledValue >= 0 ? positive[index] : negative[index]
        const next = base + scaledValue
        if (scaledValue >= 0) positive[index] = next
        else negative[index] = next
        lower.push(base)
        upper.push(next)
      })
      const upperPoints = upper.map((value, index) => ({x: categoryX(index), y: scaleY(value)}))
      const lowerPoints = lower
        .map((value, index) => ({x: categoryX(index), y: scaleY(value)}))
        .reverse()
      const d =
        [...upperPoints, ...lowerPoints]
          .map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`)
          .join(' ') + ' Z'
      shapes.push({
        type: 'path',
        d,
        series: colorIndex(seriesIndex, chart),
        position: seriesIndex,
        fill: true,
        pattern: seriesIndex > 0,
      })
      upperPoints.forEach(({x, y}) =>
        shapes.push({
          type: 'circle',
          cx: x,
          cy: y,
          r: 4,
          series: colorIndex(seriesIndex, chart),
          position: seriesIndex,
        }),
      )
    })
  }
  return {width, height, shapes, layout, scrolls: width > spec.width, labelLines}
}

export const createChartGeometry = (
  chart: NormalizedChart,
  language: ChartLanguage,
  layout: ChartLayout = 'wide',
): ChartGeometry => {
  if (chart.chartType === 'pie' || chart.chartType === 'donut') return polarGeometry(chart)
  const domain = buildDomain(chart)
  return chart.chartType === 'horizontalBar'
    ? horizontalGeometry(chart, language, layout, domain)
    : verticalGeometry(chart, language, layout, domain)
}

export type SafeGeometryResult = {geometry?: ChartGeometry; error?: string}

export type GeometryBuilder = (
  chart: NormalizedChart,
  language: ChartLanguage,
  layout: ChartLayout,
) => ChartGeometry

// Geometry failures must never take down the article: the caller omits the SVG and keeps the table.
export const safeCreateChartGeometry = (
  chart: NormalizedChart,
  language: ChartLanguage,
  layout: ChartLayout = 'wide',
  build: GeometryBuilder = createChartGeometry,
): SafeGeometryResult => {
  if (!chart.canRenderVisual) return {}
  try {
    const geometry = build(chart, language, layout)
    const finite = geometry.shapes.every((shape) =>
      Object.values(shape).every((value) => typeof value !== 'number' || Number.isFinite(value)),
    )
    if (!finite || !(geometry.width > 0) || !(geometry.height > 0)) {
      return {error: 'Chart geometry contains non-finite or empty dimensions'}
    }
    return {geometry}
  } catch (error) {
    return {error: error instanceof Error ? error.message : String(error)}
  }
}
