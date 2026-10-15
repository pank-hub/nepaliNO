import {defineArrayMember, defineField, defineType} from 'sanity'

const chartTypes = [
  {title: 'Vertical bar', value: 'verticalBar'},
  {title: 'Horizontal bar', value: 'horizontalBar'},
  {title: 'Grouped bar', value: 'groupedBar'},
  {title: 'Stacked bar', value: 'stackedBar'},
  {title: 'Line', value: 'line'},
  {title: 'Area (stacked)', value: 'area'},
  {title: 'Donut', value: 'donut'},
  {title: 'Pie', value: 'pie'},
]

const isPie = (chartType: unknown) => chartType === 'pie' || chartType === 'donut'

const normalizedLabel = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim().toLocaleLowerCase() : undefined

const getLabels = (items: unknown): string[] =>
  Array.isArray(items)
    ? items
        .map((item) =>
          typeof item === 'string'
            ? normalizedLabel(item)
            : item && typeof item === 'object' && 'label' in item
              ? normalizedLabel((item as {label?: unknown}).label)
              : undefined,
        )
        .filter((label): label is string => !!label)
    : []

export const editorialChart = defineType({
  name: 'editorialChart',
  title: 'Editorial Chart',
  type: 'object',
  groups: [
    {name: 'content', title: 'Chart content', default: true},
    {name: 'data', title: 'Categories and data'},
    {name: 'display', title: 'Display'},
    {name: 'source', title: 'Source and notes'},
  ],
  fields: [
    defineField({
      name: 'chartType',
      title: 'Chart type',
      type: 'string',
      group: 'content',
      options: {list: chartTypes, layout: 'dropdown'},
      initialValue: 'verticalBar',
      validation: (rule) =>
        rule
          .required()
          .custom((value) =>
            chartTypes.some((type) => type.value === value)
              ? true
              : 'Choose one of the supported chart types.',
          ),
      description:
        'Choose a chart style. The categories and values remain reusable when switching types.',
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (rule) =>
        rule
          .required()
          .min(1)
          .max(160)
          .custom((value) =>
            typeof value !== 'string' || value.trim().length > 0 ? true : 'Enter a chart title.',
          ),
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
      group: 'content',
      validation: (rule) => rule.max(240),
    }),
    defineField({
      name: 'description',
      title: 'Short explanation',
      type: 'text',
      rows: 3,
      group: 'content',
      description: 'Explain the main comparison or context in plain language.',
      validation: (rule) => rule.max(400),
    }),
    defineField({
      name: 'categories',
      title: 'Categories or segment labels',
      type: 'array',
      group: 'data',
      description:
        'Use the same order as the values in every series. For pie and donut, these are the segment labels.',
      of: [
        defineArrayMember({
          type: 'string',
          validation: (rule) => [
            rule.required().min(1).max(200),
            rule
              .custom((value) =>
                typeof value !== 'string' || value.trim().length <= 40
                  ? true
                  : 'Long labels may be difficult to read on mobile.',
              )
              .warning(),
          ],
        }),
      ],
      validation: (rule) => rule.required().min(1).max(24),
    }),
    defineField({
      name: 'series',
      title: 'Data series',
      type: 'array',
      group: 'data',
      description:
        'For pie and donut, enter exactly one series; its values map to the segment labels above.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'editorialChartSeries',
          title: 'Series',
          fields: [
            defineField({
              name: 'label',
              title: 'Series label',
              type: 'string',
              validation: (rule) => [
                rule.required().min(1).max(120),
                rule
                  .custom((value) =>
                    typeof value !== 'string' || value.trim().length <= 40
                      ? true
                      : 'Long labels may be difficult to read on mobile.',
                  )
                  .warning(),
              ],
            }),
            defineField({
              name: 'shortLabel',
              title: 'Short label',
              type: 'string',
              description: 'Optional compact label for crowded legends.',
              validation: (rule) => rule.max(40),
            }),
            defineField({
              name: 'color',
              title: 'Palette color',
              type: 'string',
              description: 'Pie and donut segment colors are assigned automatically.',
              options: {
                list: [
                  {title: 'Blue', value: 'blue'},
                  {title: 'Teal', value: 'teal'},
                  {title: 'Gold', value: 'gold'},
                  {title: 'Purple', value: 'purple'},
                  {title: 'Slate', value: 'slate'},
                  {title: 'Indigo', value: 'indigo'},
                  {title: 'Cyan', value: 'cyan'},
                  {title: 'Brown', value: 'brown'},
                ],
                layout: 'dropdown',
              },
            }),
            defineField({
              name: 'values',
              title: 'Values (in category order)',
              type: 'array',
              description:
                'Enter one number for every category. Percentages are calculated automatically.',
              of: [
                defineArrayMember({
                  type: 'number',
                  validation: (rule) =>
                    rule
                      .required()
                      .custom((value) =>
                        typeof value === 'number' && Number.isFinite(value)
                          ? true
                          : 'Enter a finite number.',
                      ),
                }),
              ],
              validation: (rule) => rule.required().min(1).max(24),
            }),
          ],
          preview: {
            select: {title: 'label', subtitle: 'shortLabel'},
          },
        }),
      ],
      validation: (rule) => [
        rule.required().min(1).max(5),
        rule
          .custom((items) =>
            Array.isArray(items) && items.length > 4
              ? 'More than four series may be difficult to compare.'
              : true,
          )
          .warning(),
      ],
    }),
    defineField({
      name: 'unit',
      title: 'Unit',
      type: 'string',
      group: 'display',
      options: {
        list: [
          {title: 'Norwegian kroner (NOK)', value: 'NOK'},
          {title: 'Million NOK', value: 'million NOK'},
          {title: 'Billion NOK', value: 'billion NOK'},
          {title: 'Percent', value: 'percent'},
          {title: 'People', value: 'people'},
          {title: 'Days', value: 'days'},
          {title: 'Hours', value: 'hours'},
          {title: 'Other short unit', value: 'custom'},
        ],
      },
    }),
    defineField({
      name: 'customUnit',
      title: 'Custom unit',
      type: 'string',
      group: 'display',
      hidden: ({parent}) => parent?.unit !== 'custom',
      validation: (rule) => rule.max(24),
    }),
    defineField({
      name: 'valuePrefix',
      title: 'Value prefix',
      type: 'string',
      group: 'display',
      description: 'Optional short prefix such as “kr”.',
      validation: (rule) => rule.max(12),
    }),
    defineField({
      name: 'valueSuffix',
      title: 'Value suffix',
      type: 'string',
      group: 'display',
      description: 'Optional short suffix such as “%”.',
      validation: (rule) => rule.max(12),
    }),
    defineField({
      name: 'decimalPrecision',
      title: 'Decimal places',
      type: 'number',
      group: 'display',
      initialValue: 0,
      options: {list: [0, 1, 2, 3]},
      validation: (rule) => rule.required().integer().min(0).max(3),
    }),
    defineField({
      name: 'showLegend',
      title: 'Show legend',
      description:
        'Applies to pie and donut charts. Charts with several series always show a series key. A single-series bar, line or area chart hides the legend automatically, because the series name appears beside the unit.',
      type: 'boolean',
      group: 'display',
      initialValue: true,
    }),
    defineField({
      name: 'showValues',
      title: 'Show values in chart',
      type: 'boolean',
      group: 'display',
      initialValue: true,
    }),
    defineField({
      name: 'showPercentages',
      title: 'Show calculated percentages',
      type: 'boolean',
      group: 'display',
      initialValue: true,
      hidden: ({parent}) => !isPie(parent?.chartType),
      description: 'Percentages are calculated from the values; they are never entered manually.',
    }),
    defineField({
      name: 'showDataSummary',
      title: 'Show summary above the chart',
      type: 'boolean',
      group: 'display',
      initialValue: true,
    }),
    defineField({
      name: 'sourceLabel',
      title: 'Source label',
      type: 'string',
      group: 'source',
      validation: (rule) => rule.max(160),
    }),
    defineField({
      name: 'sourceUrl',
      title: 'Source URL',
      type: 'url',
      group: 'source',
      validation: (rule) => rule.uri({scheme: ['https']}),
    }),
    defineField({
      name: 'sourceDate',
      title: 'Source date',
      type: 'date',
      group: 'source',
    }),
    defineField({
      name: 'note',
      title: 'Note',
      type: 'text',
      rows: 3,
      group: 'source',
      validation: (rule) => rule.max(500),
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
      group: 'source',
      validation: (rule) => rule.max(240),
    }),
    defineField({
      name: 'altSummary',
      title: 'Additional chart summary',
      type: 'text',
      rows: 3,
      group: 'content',
      description:
        'Optional editorial summary if the automatically generated description is not sufficient.',
      validation: (rule) => rule.max(500),
    }),
  ],
  validation: (rule) => [
    rule.custom((value) => {
      if (!value || typeof value !== 'object') return true
      const chart = value as {
        chartType?: unknown
        categories?: unknown
        series?: unknown
      }
      const categories = Array.isArray(chart.categories) ? chart.categories : []
      const series = Array.isArray(chart.series) ? chart.series : []
      const categoryLabels = getLabels(categories)
      const seriesLabels = getLabels(series)

      if (new Set(categoryLabels).size !== categoryLabels.length) {
        return {message: 'Category labels must be unique.'}
      }
      if (new Set(seriesLabels).size !== seriesLabels.length) {
        return {message: 'Series labels must be unique.'}
      }
      if (categories.some((item) => typeof item !== 'string' || !item.trim())) {
        return {message: 'Every category label must contain non-whitespace text.'}
      }
      if (
        series.some(
          (item) =>
            !item ||
            typeof item !== 'object' ||
            !('label' in item) ||
            typeof (item as {label?: unknown}).label !== 'string' ||
            !(item as {label: string}).label.trim(),
        )
      ) {
        return {message: 'Every series label must contain non-whitespace text.'}
      }

      const display = value as {unit?: unknown; customUnit?: unknown; valueSuffix?: unknown}
      if (display.unit === 'custom' && !String(display.customUnit ?? '').trim()) {
        return {message: 'Enter the custom unit, or choose another unit.'}
      }
      const effectiveUnit = String(
        display.unit === 'custom' ? (display.customUnit ?? '') : (display.unit ?? ''),
      )
        .trim()
        .toLocaleLowerCase()
      if (
        ['percent', 'prosent', 'प्रतिशत', '%'].includes(effectiveUnit) &&
        String(display.valueSuffix ?? '').includes('%')
      ) {
        return {
          message:
            'The unit is already percent. Remove the “%” value suffix so the output is not repeated.',
        }
      }

      const isPieType = isPie(chart.chartType)
      if (isPieType && categories.length > 8) {
        return {message: 'Pie and donut charts can contain at most 8 segments.'}
      }
      if (isPieType && series.length !== 1) {
        return {message: 'Pie and donut charts require exactly one data series.'}
      }
      if (['line', 'area'].includes(String(chart.chartType)) && categories.length < 2) {
        return {message: 'Line and area charts require at least two categories.'}
      }
      for (const [index, item] of series.entries()) {
        if (!item || typeof item !== 'object') {
          return {message: `Series ${index + 1} is invalid.`}
        }
        const entry = item as {values?: unknown}
        const values = Array.isArray(entry.values) ? entry.values : []
        if (values.length !== categories.length) {
          return {message: `Series ${index + 1} needs one value for every category.`}
        }
        if (values.some((number) => typeof number !== 'number' || !Number.isFinite(number))) {
          return {message: `Series ${index + 1} contains an invalid number.`}
        }
        if (isPieType && values.some((number) => typeof number === 'number' && number < 0)) {
          return {message: 'Pie and donut values cannot be negative.'}
        }
        if (
          isPieType &&
          values.filter((number) => typeof number === 'number' && number > 0).length < 2
        ) {
          return {message: 'Pie and donut charts require at least two non-zero segments.'}
        }
      }
      return true
    }),
    rule
      .custom((value) => {
        if (!value || typeof value !== 'object') return true
        const chart = value as {chartType?: unknown; categories?: unknown}
        const categories = Array.isArray(chart.categories) ? chart.categories : []
        if (
          ['verticalBar', 'horizontalBar', 'groupedBar', 'stackedBar'].includes(
            String(chart.chartType),
          ) &&
          categories.length > 12
        ) {
          return 'More than 12 bar categories may be difficult to read on mobile.'
        }
        if (isPie(chart.chartType) && categories.length > 6) {
          return 'More than 6 pie or donut segments may be difficult to distinguish.'
        }
        return true
      })
      .warning(),
  ],
  preview: {
    select: {chartType: 'chartType', title: 'title'},
    prepare({chartType, title}) {
      const label = chartTypes.find((type) => type.value === chartType)?.title ?? 'Chart'
      return {title: `${label}: ${title || 'Untitled'}`}
    },
  },
})
