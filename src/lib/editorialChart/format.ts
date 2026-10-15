import type {ChartLanguage, NormalizedChart} from './types.ts'

export const getChartLocale = (language: ChartLanguage): string =>
  language === 'ne' ? 'ne-NP' : 'nb-NO'

export const createChartNumberFormatter = (
  language: ChartLanguage,
  precision: number,
  prefix = '',
  suffix = '',
) => {
  const formatter = new Intl.NumberFormat(getChartLocale(language), {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  })

  return (value: number): string => `${prefix}${formatter.format(value)}${suffix}`
}

export const formatChartUnit = (unit: string, language: ChartLanguage): string => {
  const localizedUnits: Record<string, Record<ChartLanguage, string>> = {
    people: {ne: 'जन', nb: 'personer'},
    days: {ne: 'दिन', nb: 'dager'},
    hours: {ne: 'घण्टा', nb: 'timer'},
    percent: {ne: 'प्रतिशत', nb: 'prosent'},
  }
  return localizedUnits[unit]?.[language] ?? unit
}

export const formatChartValue = (
  value: number,
  chart: Pick<NormalizedChart, 'decimalPrecision' | 'valuePrefix' | 'valueSuffix' | 'unit'>,
  language: ChartLanguage,
): string => {
  const formatted = createChartNumberFormatter(
    language,
    chart.decimalPrecision,
    chart.valuePrefix,
    chart.valueSuffix,
  )(value)
  return chart.unit ? `${formatted} ${formatChartUnit(chart.unit, language)}` : formatted
}

export const formatPercentage = (value: number, language: ChartLanguage): string =>
  `${new Intl.NumberFormat(getChartLocale(language), {maximumFractionDigits: 1}).format(value)}%`
