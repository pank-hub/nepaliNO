import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'
import {
  createChartNumberFormatter,
  formatChartUnit,
  formatChartValue,
  formatPercentage,
} from '../../src/lib/editorialChart/format.ts'
import {
  CHART_LAYOUTS,
  createChartGeometry,
  fitCategoryLabels,
  safeCreateChartGeometry,
  wrapLabel,
} from '../../src/lib/editorialChart/geometry.ts'
import {
  createChartIdSuffix,
  isHttpsUrl,
  normalizeEditorialChart,
} from '../../src/lib/editorialChart/normalize.ts'
import {
  CHART_PALETTE,
  CHART_PATTERN_PATHS,
  getPaletteIndex,
  maxOf,
  minOf,
} from '../../src/lib/editorialChart/palette.ts'
import {CHART_TYPES} from '../../src/lib/editorialChart/types.ts'

const baseChart = {
  _type: 'editorialChart',
  chartType: 'verticalBar',
  title: 'Employment by year',
  categories: ['2024', '2025'],
  series: [{_key: 'series-1', label: 'People', values: [10, 20]}],
}

const normalize = (overrides = {}) => normalizeEditorialChart({...baseChart, ...overrides})
const hasOnlyFiniteGeometry = (geometry) =>
  geometry.shapes.every((shape) =>
    Object.values(shape).every((value) => typeof value !== 'number' || Number.isFinite(value)),
  )

test('normalizes all eight supported types and creates chart geometry', () => {
  const types = [
    'verticalBar',
    'horizontalBar',
    'groupedBar',
    'stackedBar',
    'line',
    'area',
    'donut',
    'pie',
  ]
  for (const chartType of types) {
    const chart = normalize({
      chartType,
      series:
        chartType === 'pie' || chartType === 'donut'
          ? [{label: 'Share', values: [3, 7]}]
          : baseChart.series,
    })
    assert.equal(chart.canRenderVisual, true, chartType)
    const geometry = createChartGeometry(chart, 'nb')
    assert.ok(geometry.width > 0 && geometry.height > 0, chartType)
    assert.ok(hasOnlyFiniteGeometry(geometry), chartType)
  }
})

test('normalizes one and multiple series, preserving category order and valid values', () => {
  const one = normalize()
  assert.deepEqual(one.categories, ['2024', '2025'])
  assert.deepEqual(one.series[0].values, [10, 20])

  const multiple = normalize({
    chartType: 'groupedBar',
    series: [
      {label: 'One', values: [1, 2]},
      {label: 'Two', values: [3, 4]},
    ],
  })
  assert.equal(multiple.canRenderVisual, true)
  assert.equal(multiple.series.length, 2)
})

test('supports decimal, zero, negative, and very large Cartesian values', () => {
  const chart = normalize({
    chartType: 'stackedBar',
    categories: ['Nepal', 'Norway'],
    series: [
      {label: 'Positive', values: [0, 1.25]},
      {label: 'Negative', values: [-2.5, 1e308]},
    ],
  })
  assert.equal(chart.canRenderVisual, true)
  assert.ok(hasOnlyFiniteGeometry(createChartGeometry(chart, 'nb')))
})

test('rejects pie and donut values that cannot safely form part-to-whole slices', () => {
  for (const chartType of ['pie', 'donut']) {
    assert.equal(
      normalize({chartType, series: [{label: 'Share', values: [0, 0]}]}).canRenderVisual,
      false,
    )
    assert.equal(
      normalize({chartType, series: [{label: 'Share', values: [-1, 2]}]}).canRenderVisual,
      false,
    )
    assert.equal(
      normalize({
        chartType,
        series: [{label: 'One'}, {label: 'Two'}],
      }).canRenderVisual,
      false,
    )
  }
})

test('calculates percentages from values without mutating values to force rounded totals', () => {
  const chart = normalize({
    chartType: 'pie',
    categories: ['एक', 'to', 'tre'],
    series: [{label: 'Share', values: [1, 1, 1]}],
  })
  for (const percentage of chart.percentages) {
    assert.ok(Math.abs(percentage - 100 / 3) < 1e-12)
  }
  assert.equal(
    chart.series[0].values.reduce((sum, value) => sum + value, 0),
    3,
  )
  assert.deepEqual(
    chart.percentages.map((percentage) => formatPercentage(percentage, 'nb')),
    ['33,3%', '33,3%', '33,3%'],
  )
})

test('marks mismatched counts, missing values, non-numeric values, and unknown types for safe fallback', () => {
  const mismatch = normalize({
    chartType: 'line',
    series: [{label: 'Series', values: [1]}],
  })
  assert.equal(mismatch.canRenderVisual, false)
  assert.match(mismatch.visualErrors.join(' '), /Value count/)

  const invalid = normalize({
    series: [{label: 'Series', values: [1, Number.NaN]}],
  })
  assert.equal(invalid.series[0].values[1], null)
  assert.equal(invalid.canRenderVisual, false)

  const unknown = normalize({chartType: 'futureChart'})
  assert.equal(unknown.chartType, undefined)
  assert.equal(unknown.canRenderVisual, false)
  assert.ok(unknown.series.length > 0)
  assert.equal(normalizeEditorialChart(null).canRenderVisual, false)
  assert.equal(normalizeEditorialChart(undefined).canRenderVisual, false)
})

test('requires multiple usable line and area categories', () => {
  for (const chartType of ['line', 'area']) {
    assert.equal(
      normalize({chartType, categories: ['Only'], series: [{label: 'A', values: [1]}]})
        .canRenderVisual,
      false,
    )
  }
})

test('line and area geometry is based on point values and uses finite paths', () => {
  const line = createChartGeometry(
    normalize({
      chartType: 'line',
      categories: ['Jan', 'Feb', 'Mar'],
      series: [
        {label: 'A', values: [1, 4, 2]},
        {label: 'B', values: [2, 1, 3]},
      ],
    }),
    'ne',
  )
  assert.equal(line.shapes.filter((shape) => shape.type === 'circle').length, 6)
  assert.equal(line.shapes.filter((shape) => shape.type === 'path').length, 2)

  const area = createChartGeometry(
    normalize({
      chartType: 'area',
      categories: ['Jan', 'Feb'],
      series: [
        {label: 'A', values: [5, -3]},
        {label: 'B', values: [2, -4]},
      ],
    }),
    'nb',
  )
  assert.equal(area.shapes.filter((shape) => shape.type === 'path' && shape.fill).length, 2)
  assert.ok(hasOnlyFiniteGeometry(area))
})

test('bar geometry accommodates mixed-sign values and grouped series', () => {
  for (const chartType of ['verticalBar', 'horizontalBar', 'groupedBar', 'stackedBar']) {
    const chart = normalize({
      chartType,
      categories: ['Long Nepali label', 'Long Norwegian label'],
      series: [
        {label: 'Current', values: [-2, 4]},
        {label: 'Previous', values: [3, -1]},
      ],
    })
    const geometry = createChartGeometry(chart, 'nb')
    assert.ok(
      geometry.shapes.some((shape) => shape.type === 'line' && shape.className === 'baseline'),
    )
    assert.ok(geometry.shapes.some((shape) => shape.type === 'rect'))
    assert.ok(hasOnlyFiniteGeometry(geometry))
  }
})

test('stacked bars accumulate positive and negative values separately from zero', () => {
  const chart = normalize({
    chartType: 'stackedBar',
    categories: ['Group'],
    series: [
      {label: 'First', values: [4]},
      {label: 'Second', values: [-2]},
      {label: 'Third', values: [3]},
      {label: 'Fourth', values: [-3]},
    ],
  })
  const geometry = createChartGeometry(chart, 'nb')
  const baseline = geometry.shapes.find(
    (shape) => shape.type === 'line' && shape.className === 'baseline',
  )
  const bars = geometry.shapes.filter((shape) => shape.type === 'rect')
  assert.equal(bars.length, 4)
  assert.ok(bars[0].y < baseline.y1)
  assert.ok(Math.abs(bars[0].y + bars[0].height - baseline.y1) < 1e-8)
  assert.ok(Math.abs(bars[1].y - baseline.y1) < 1e-8)
  assert.ok(bars[1].y + bars[1].height > baseline.y1)
  assert.ok(bars[2].y < bars[0].y)
  assert.ok(bars[3].y + bars[3].height > bars[1].y + bars[1].height)
})

test('pie and donut geometry creates one path per positive segment and handles huge values', () => {
  for (const chartType of ['pie', 'donut']) {
    const chart = normalize({
      chartType,
      categories: ['A', 'B', 'C'],
      series: [{label: 'Share', values: [1e308, 1e308, 1e308]}],
    })
    const geometry = createChartGeometry(chart, 'nb')
    assert.equal(geometry.shapes.filter((shape) => shape.type === 'path').length, 3)
    assert.ok(hasOnlyFiniteGeometry(geometry))
    if (chartType === 'donut') {
      assert.ok(geometry.shapes.some((shape) => shape.type === 'hole' && shape.r > 0))
    }
  }
})

test('formats values using the page language, precision, prefix, suffix, and unit', () => {
  const norwegian = createChartNumberFormatter('nb', 2, 'kr ', ',-')
  const nepali = createChartNumberFormatter('ne', 2)
  assert.match(norwegian(12345.6), /^kr 12/)
  assert.match(norwegian(12345.6), /,-$/)
  assert.match(nepali(12345.6), /१२/)
  assert.equal(formatChartUnit('days', 'nb'), 'dager')
  assert.equal(formatChartUnit('people', 'ne'), 'जन')
  assert.equal(normalize({unit: 'custom', customUnit: 'families'}).unit, 'families')
})

test('accepts only HTTPS source links in the chart fallback', () => {
  assert.equal(isHttpsUrl('https://example.org/source'), true)
  assert.equal(isHttpsUrl('http://example.org/source'), false)
  assert.equal(normalize({sourceUrl: 'javascript:alert(1)'}).sourceUrl, undefined)
})

const polarSeries = [{label: 'Share', values: [3, 7]}]

test('undefined optional booleans default consistently for every chart type', () => {
  for (const chartType of CHART_TYPES) {
    const polar = chartType === 'pie' || chartType === 'donut'
    const chart = normalize({chartType, series: polar ? polarSeries : baseChart.series})
    assert.equal(chart.showLegend, true, `${chartType} showLegend`)
    assert.equal(chart.showValues, true, `${chartType} showValues`)
    assert.equal(chart.showDataSummary, true, `${chartType} showDataSummary`)
    assert.equal(chart.showPercentages, polar, `${chartType} showPercentages`)
  }
})

test('explicit boolean values are respected and showPercentages never applies to non-polar charts', () => {
  const off = normalize({showLegend: false, showValues: false, showDataSummary: false})
  assert.deepEqual([off.showLegend, off.showValues, off.showDataSummary], [false, false, false])
  assert.equal(normalize({showPercentages: true}).showPercentages, false)
  for (const chartType of ['pie', 'donut']) {
    assert.equal(normalize({chartType, showPercentages: false}).showPercentages, false)
    assert.equal(normalize({chartType, showPercentages: true}).showPercentages, true)
    assert.equal(normalize({chartType, showPercentages: null}).showPercentages, true)
  }
})

test('unknown palette keys fall back to the series position and known keys are honoured', () => {
  const chart = normalize({
    chartType: 'groupedBar',
    series: [
      {label: 'A', color: 'neon-pink', values: [1, 2]},
      {label: 'B', color: 'brown', values: [1, 2]},
      {label: 'C', values: [1, 2]},
    ],
  })
  assert.deepEqual(
    [0, 1, 2].map((index) => getPaletteIndex(chart, index)),
    [0, CHART_PALETTE.indexOf('brown'), 2],
  )
  assert.equal(getPaletteIndex(normalize({chartType: 'pie', series: polarSeries}), 9), 1)
  assert.equal(new Set(CHART_PATTERN_PATHS).size, CHART_PALETTE.length)
})

test('all-zero and single non-zero pie/donut data fall back instead of rendering', () => {
  for (const chartType of ['pie', 'donut']) {
    for (const values of [
      [0, 0, 0],
      [5, 0, 0],
    ]) {
      const chart = normalize({
        chartType,
        categories: ['A', 'B', 'C'],
        series: [{label: 'Share', values}],
      })
      assert.equal(chart.canRenderVisual, false)
      assert.match(chart.visualErrors.join(' '), /two non-zero segments/)
    }
  }
})

test('percentages round for display only and keep exact underlying shares', () => {
  const chart = normalize({
    chartType: 'pie',
    categories: ['A', 'B', 'C'],
    series: [{label: 'Share', values: [1, 2, 0.05]}],
  })
  const total = chart.percentages.reduce((sum, value) => sum + value, 0)
  assert.ok(Math.abs(total - 100) < 1e-9)
  assert.deepEqual(
    chart.percentages.map((value) => formatPercentage(value, 'nb')),
    ['32,8%', '65,6%', '1,6%'],
  )
  assert.equal(formatPercentage(50, 'ne'), '५०%')
})

test('more values than categories and fewer values than categories both force the fallback', () => {
  for (const values of [[1], [1, 2, 3]]) {
    for (const chartType of ['verticalBar', 'stackedBar', 'line']) {
      const chart = normalize({chartType, series: [{label: 'S', values}]})
      assert.equal(chart.canRenderVisual, false, `${chartType} ${values.length}`)
      assert.match(chart.visualErrors.join(' '), /Value count does not match/)
    }
  }
})

test('unknown future chart types keep every category and value for the table fallback', () => {
  const chart = normalize({chartType: 'sankey'})
  assert.equal(chart.chartType, undefined)
  assert.equal(chart.canRenderVisual, false)
  assert.deepEqual(chart.categories, ['2024', '2025'])
  assert.deepEqual(chart.series[0].values, [10, 20])
  assert.deepEqual(safeCreateChartGeometry(chart, 'nb'), {})
})

test('custom units resolve from customUnit, a blank custom unit is dropped, other units pass through', () => {
  assert.equal(normalize({unit: 'custom', customUnit: '  kg  '}).unit, 'kg')
  assert.equal(normalize({unit: 'custom', customUnit: '   '}).unit, undefined)
  assert.equal(normalize({unit: 'custom'}).unit, undefined)
  assert.equal(normalize({unit: 'NOK', customUnit: 'ignored'}).unit, 'NOK')
  assert.equal(normalize({}).unit, undefined)
})

test('a percent unit never combines with a percent suffix into contradictory output', () => {
  for (const language of ['nb', 'ne']) {
    for (const input of [
      {unit: 'percent', valueSuffix: '%'},
      {unit: 'percent', valueSuffix: ' % '},
      {unit: 'custom', customUnit: 'prosent', valueSuffix: '%'},
      {unit: 'custom', customUnit: '%', valueSuffix: '%'},
    ]) {
      const chart = normalize(input)
      const output = formatChartValue(12, chart, language)
      assert.equal(chart.valueSuffix, '')
      assert.equal(output.includes('%%'), false, output)
      assert.equal(/%.*(prosent|प्रतिशत)/.test(output), false, output)
      assert.equal(chart.warnings.length, 1)
    }
  }
  assert.equal(formatChartValue(12, normalize({unit: 'percent'}), 'nb'), '12 prosent')
  assert.equal(formatChartValue(12, normalize({valueSuffix: '%'}), 'nb'), '12%')
  assert.equal(normalize({unit: 'NOK', valueSuffix: '%'}).valueSuffix, '%')
})

test('formats Nepali numbers with Devanagari digits and Indian grouping', () => {
  const format = (value, precision) => createChartNumberFormatter('ne', precision)(value)
  assert.equal(format(0, 0), '०')
  assert.equal(format(12.5, 1), '१२.५')
  assert.equal(format(12345.67, 2), '१२,३४५.६७')
  assert.equal(format(-2500, 0), '-२,५००')
  assert.equal(format(79400000000, 0), '७९,४०,००,००,०००')
})

test('formats Norwegian numbers with spaces, decimal comma and a true minus sign', () => {
  const format = (value, precision) => createChartNumberFormatter('nb', precision)(value)
  assert.equal(format(0, 0), '0')
  assert.equal(format(12.5, 1), '12,5')
  assert.equal(format(12345.67, 2), '12\u00a0345,67')
  assert.equal(format(-2500, 0), '\u22122\u00a0500')
  assert.equal(format(79400000000, 0), '79\u00a0400\u00a0000\u00a0000')
  assert.equal(
    formatChartValue(12345.67, normalize({unit: 'NOK', decimalPrecision: 2}), 'nb'),
    '12\u00a0345,67 NOK',
  )
})

test('invalid values never become zero and never produce percentages or geometry', () => {
  for (const bad of ['5', null, undefined, Number.NaN, Number.POSITIVE_INFINITY, {}]) {
    const chart = normalize({series: [{label: 'S', values: [1, bad]}]})
    assert.equal(chart.series[0].values[1], null)
    assert.equal(chart.canRenderVisual, false)
    assert.match(chart.visualErrors.join(' '), /Invalid numeric value/)
  }
  const pie = normalize({
    chartType: 'pie',
    series: [{label: 'S', values: [1, '2']}],
  })
  assert.equal(pie.canRenderVisual, false)
  assert.deepEqual(pie.percentages, [null, null])
})

test('geometry exceptions are contained, reported, and leave the data intact', () => {
  const chart = normalize()
  const thrown = safeCreateChartGeometry(chart, 'nb', 'wide', () => {
    throw new Error('boom')
  })
  assert.deepEqual(thrown, {error: 'boom'})

  const nonFinite = safeCreateChartGeometry(chart, 'nb', 'wide', () => ({
    width: 100,
    height: 100,
    shapes: [{type: 'hole', cx: Number.NaN, cy: 0, r: 1}],
  }))
  assert.match(nonFinite.error, /non-finite/)

  const corrupt = {...normalize({chartType: 'pie', series: polarSeries}), series: []}
  const natural = safeCreateChartGeometry(corrupt, 'ne')
  assert.equal(natural.geometry, undefined)
  assert.ok(natural.error)
  assert.deepEqual(corrupt.categories, ['2024', '2025'])

  const ok = safeCreateChartGeometry(chart, 'nb')
  assert.ok(ok.geometry && !ok.error)
})

test('chart ids prefer the Sanity key and otherwise derive a stable content-based id', () => {
  assert.equal(createChartIdSuffix({_key: 'abc-1_2'}), 'abc-1_2')
  assert.equal(createChartIdSuffix({_key: 'a b"<>c'}), 'abc')
  const first = createChartIdSuffix(baseChart, 2)
  assert.equal(first, createChartIdSuffix(structuredClone(baseChart), 2))
  assert.notEqual(first, createChartIdSuffix(baseChart, 3))
  assert.notEqual(first, createChartIdSuffix({...baseChart, title: 'Other'}, 2))
  assert.match(first, /^[a-z0-9]+-2$/)
  const circular = {}
  circular.self = circular
  assert.match(createChartIdSuffix(circular), /^c[a-z0-9]+-0$/)
  assert.match(createChartIdSuffix(null), /^c[a-z0-9]+-0$/)
})

test('donut holes are an explicit non-series shape and pie charts have none', () => {
  const donut = createChartGeometry(normalize({chartType: 'donut', series: polarSeries}), 'nb')
  assert.ok(donut.shapes.filter((shape) => shape.type === 'path').every((shape) => shape.slice))
  assert.equal(donut.shapes.filter((shape) => shape.type === 'hole').length, 1)
  assert.equal(donut.shapes.filter((shape) => shape.type === 'circle').length, 0)
  const pie = createChartGeometry(normalize({chartType: 'pie', series: polarSeries}), 'nb')
  assert.equal(pie.shapes.filter((shape) => shape.type === 'hole').length, 0)
})

test('maximum and minimum helpers handle arrays too large for argument spreading', () => {
  const large = Array.from({length: 300000}, (_, index) => index)
  assert.equal(maxOf(large, 0), 299999)
  assert.equal(minOf(large, 0), 0)
  assert.equal(maxOf([], 7), 7)
  assert.equal(maxOf([-3, -1]), -1)
})

test('maximum series and near-maximum category counts still produce finite geometry', () => {
  const categories = Array.from({length: 24}, (_, index) => `Category ${index + 1}`)
  const series = Array.from({length: 5}, (_, index) => ({
    label: `Series ${index + 1}`,
    values: categories.map((_, position) => (position + 1) * (index + 1) - 5),
  }))
  for (const chartType of ['groupedBar', 'stackedBar', 'line', 'area', 'horizontalBar']) {
    const chart = normalize({chartType, categories, series})
    assert.equal(chart.canRenderVisual, true, chartType)
    assert.ok(hasOnlyFiniteGeometry(createChartGeometry(chart, 'nb')), chartType)
  }
  const over = normalize({
    categories: [...categories, 'Extra'],
    series: series.map((item) => ({...item, values: [...item.values, 1]})),
  })
  assert.equal(over.canRenderVisual, false)
})

const fiveCategories = ['2020', '2021', '2022', '2023', '2024']
const fiveValues = [12, 18, 9, 22, 15]
const five = (chartType, extra = {}) =>
  normalize({
    chartType,
    categories: fiveCategories,
    series: [{label: 'Jobs', values: fiveValues}],
    ...extra,
  })

test('true zero values draw no rectangle but keep a value label; tiny values keep a sliver', () => {
  for (const layout of ['compact', 'wide']) {
    for (const chartType of ['verticalBar', 'horizontalBar']) {
      const chart = normalize({
        chartType,
        categories: ['A', 'B', 'C'],
        series: [{label: 'S', values: [0, 0.001, 50]}],
      })
      const {shapes} = createChartGeometry(chart, 'nb', layout)
      const bars = shapes.filter((shape) => shape.type === 'rect' && shape.series !== undefined)
      assert.equal(bars.length, 2, `${chartType}/${layout}`)
      assert.ok(shapes.some((shape) => shape.type === 'text' && shape.text === '0'))
    }
  }
})

test('modest five-category Cartesian charts fit the compact layout without scrolling', () => {
  for (const chartType of ['verticalBar', 'groupedBar', 'stackedBar', 'line', 'area']) {
    const chart =
      chartType === 'groupedBar'
        ? five(chartType, {
            categories: ['A', 'B', 'C'],
            series: [
              {label: 'One', values: [1, 2, 3]},
              {label: 'Two', values: [3, 2, 1]},
            ],
          })
        : five(chartType)
    const geometry = createChartGeometry(chart, 'ne', 'compact')
    assert.equal(geometry.scrolls, false, chartType)
    assert.equal(geometry.width, CHART_LAYOUTS.compact.width, chartType)
    assert.ok(hasOnlyFiniteGeometry(geometry))
  }
})

test('horizontal bars never scroll and give the plot a meaningful share of a narrow width', () => {
  const chart = normalize({
    chartType: 'horizontalBar',
    categories: ['दीर्घकालीन स्वास्थ्य सेवा', 'अस्थायी आश्रय', 'शिक्षा', 'रोजगारी'],
    series: [{label: 'S', values: [40, 25, 10, 30]}],
  })
  const geometry = createChartGeometry(chart, 'ne', 'compact')
  assert.equal(geometry.scrolls, false)
  assert.equal(geometry.width, CHART_LAYOUTS.compact.width)
  const bars = geometry.shapes.filter(
    (shape) => shape.type === 'rect' && shape.series !== undefined,
  )
  const baseline = Math.min(...bars.map((bar) => bar.x))
  assert.ok(baseline <= CHART_LAYOUTS.compact.maxLabelColumn + 24, `bars start at ${baseline}`)
  const longest = Math.max(...bars.map((bar) => bar.width))
  assert.ok(longest >= geometry.width * 0.4, `longest bar ${longest}`)
})

test('large datasets keep controlled overflow and a widened chart', () => {
  const categories = Array.from({length: 22}, (_, index) => `Category ${index + 1}`)
  const values = categories.map((_, index) => index + 1)
  for (const chartType of ['verticalBar', 'line']) {
    const chart = normalize({chartType, categories, series: [{label: 'S', values}]})
    const geometry = createChartGeometry(chart, 'nb', 'compact')
    assert.equal(geometry.scrolls, true, chartType)
    assert.ok(geometry.width > CHART_LAYOUTS.compact.width, chartType)
  }
})

test('axis label area grows with wrapped label lines and stays small for one-line labels', () => {
  const short = createChartGeometry(five('verticalBar'), 'nb', 'compact')
  const long = createChartGeometry(
    normalize({
      chartType: 'verticalBar',
      categories: ['Arbeidsinnvandring fra Nepal', 'Helse- og omsorgstjenester', 'Utdanning'],
      series: [{label: 'S', values: [3, 4, 5]}],
    }),
    'nb',
    'compact',
  )
  assert.equal(short.labelLines, 1)
  assert.ok(long.labelLines > 1)
  assert.ok(long.height > short.height)
  assert.ok(short.height - CHART_LAYOUTS.compact.plotHeight < 90)
})

test('label wrapping is grapheme-aware, bounded, and marks truncation', () => {
  const nepali = wrapLabel('स्वास्थ्यसेवासुविधा', 6, 2)
  assert.ok(nepali.lines.length <= 2)
  assert.equal(nepali.lines.join(''), 'स्वास्थ्यसेवासुविधा')
  const cut = wrapLabel('स्वास्थ्यसेवासुविधा'.repeat(3), 6, 2)
  assert.equal(cut.truncated, true)
  assert.ok(cut.lines.at(-1).endsWith('…'))
  assert.ok(nepali.lines.every((line) => !/^\p{M}/u.test(line)))
  assert.deepEqual(wrapLabel('Kort', 10, 3), {lines: ['Kort'], truncated: false})
  const fitted = fitCategoryLabels(['Arbeidsinnvandring'], 60, 3)
  assert.equal(fitted.wrapped[0].truncated, false)
})

test('legend visibility: single-series Cartesian hidden, multi-series forced, polar respects editor', () => {
  assert.equal(five('verticalBar').legendVisible, false)
  assert.equal(five('verticalBar', {showLegend: true}).legendVisible, false)
  const two = [
    {label: 'One', values: [1, 2]},
    {label: 'Two', values: [2, 1]},
  ]
  for (const chartType of ['groupedBar', 'stackedBar', 'line', 'area', 'horizontalBar']) {
    const chart = normalize({chartType, series: two, showLegend: false})
    assert.equal(chart.showLegend, false)
    assert.equal(chart.legendVisible, true, chartType)
  }
  for (const chartType of ['pie', 'donut']) {
    assert.equal(normalize({chartType, series: polarSeries}).legendVisible, true)
    assert.equal(
      normalize({chartType, series: polarSeries, showLegend: false}).legendVisible,
      false,
    )
  }
})

test('unit display metadata is formatted once for the header measure line', () => {
  const chart = five('verticalBar', {unit: 'custom', customUnit: 'days'})
  assert.equal(chart.unit, 'days')
  assert.equal(formatChartUnit('percent', 'nb'), 'prosent')
  assert.ok(formatChartUnit('percent', 'ne').length > 0)
})

test('value labels stay visible: inside the bar when the outside slot is too tight', () => {
  const chart = normalize({
    chartType: 'horizontalBar',
    categories: ['A', 'B'],
    series: [{label: 'S', values: [1000000, 999999]}],
    showValues: true,
  })
  for (const layout of ['compact', 'wide']) {
    const {shapes} = createChartGeometry(chart, 'nb', layout)
    const labels = shapes.filter(
      (shape) =>
        shape.type === 'text' &&
        shape.className !== 'axis' &&
        /^1\s?000\s?000$|^999\s?999$/.test(shape.text ?? ''),
    )
    assert.equal(labels.length, 2, layout)
    assert.ok(
      labels.some((shape) => shape.className === 'value-inside'),
      layout,
    )
  }
})

test('series identity follows position, not the editor-chosen colour', () => {
  const series = [
    {label: 'One', values: [1, 2], color: 'orange'},
    {label: 'Two', values: [2, 1], color: 'blue'},
  ]
  const chart = normalize({chartType: 'line', series})
  const {shapes} = createChartGeometry(chart, 'nb', 'wide')
  const paths = shapes.filter((shape) => shape.type === 'path')
  assert.deepEqual([...new Set(paths.map((shape) => shape.position))].sort(), [0, 1])
  const swapped = normalize({
    chartType: 'line',
    series: [
      {...series[0], color: 'blue'},
      {...series[1], color: 'orange'},
    ],
  })
  const positions = (value) =>
    createChartGeometry(value, 'nb', 'wide')
      .shapes.filter((shape) => shape.type === 'path')
      .map((shape) => shape.position)
  assert.deepEqual(positions(swapped), positions(chart))
})

test('print rules never depend on the disclosure state and are scoped to chart disclosures', () => {
  const source = readFileSync(
    new URL('../../src/components/content/EditorialChart.astro', import.meta.url),
    'utf8',
  )
  assert.match(
    source,
    /\.editorial-chart__data::details-content\s*{[^}]*content-visibility:\s*visible/,
  )
  assert.match(source, /@supports not selector\(::details-content\)/)
  assert.match(source, /\.editorial-chart__print-table/)
  assert.doesNotMatch(source, /(^|\n)\s*details\s*[,{]/)
  assert.doesNotMatch(source, /(^|\n)\s*summary\s*[,{]/)
})
