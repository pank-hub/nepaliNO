import {Badge, Box, Button, Card, Flex, Select, Stack, Text, TextInput} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {PatchEvent, set, type ObjectInputProps} from 'sanity'

import {
  SSB_ATTRIBUTION,
  SSB_STATBANK_PAGE,
  buildDefaultDataUrlFromMetadata,
  buildSsbDataUrl,
  buildSsbMetadataUrl,
  extractChartFromJsonStat2,
  extractTableId,
  fetchSsbJson,
  normalizeSsbDataUrl,
  type ExtractedSsbChart,
  type JsonStat2Dataset,
} from '../../src/lib/ssb/pxweb.ts'

const SSB_PRESETS = [
  {
    id: '12123',
    label: '12123 — Økonomiske vansker og boutgifter (trend)',
    url: buildSsbDataUrl(
      '12123',
      {
        OkonomiskRomslig: ['02', '09', '05'],
        Kjonn: '0',
        Alder: '999',
        ContentsCode: 'Personer',
        Tid: 'top(8)',
      },
      'no',
    ),
    catDim: 'Tid',
    serDim: 'OkonomiskRomslig',
  },
  {
    id: '05184',
    label: '05184 — Innvandrere fra Nepal etter kjønn (last 10 yrs)',
    url: buildSsbDataUrl(
      '05184',
      {
        Kjonn: ['1', '2'],
        Landbakgrunn: '528',
        ContentsCode: '*',
        Tid: 'top(10)',
      },
      'no',
    ),
    catDim: 'Tid',
    serDim: 'Kjonn',
  },
  {
    id: '13880',
    label: '13880 — Nepal: Innvandrere + norskfødte (last 10 yrs)',
    url: buildSsbDataUrl(
      '13880',
      {
        Kjonn: '0',
        Landbakgrunn: '528',
        ContentsCode: ['Innvandrere', 'NorskFodtInnvForeld'],
        Tid: 'top(10)',
      },
      'no',
    ),
    catDim: 'Tid',
    serDim: 'ContentsCode',
  },
  {
    id: '14709',
    label: '14709 — Konsumprisindeks (KPI), siste 12 mnd',
    url: buildSsbDataUrl(
      '14709',
      {
        Maaned: '90',
        ContentsCode: 'KpiIndMnd',
        Tid: 'top(12)',
      },
      'no',
    ),
    catDim: 'Tid',
    serDim: '',
  },
  {
    id: '04767',
    label: '04767 — Overganger til norsk statsborgerskap (Nepal)',
    url: buildSsbDataUrl(
      '04767',
      {
        Kjonn: ['1', '2'],
        Alder: '0018+',
        Statsbrgskap: '528',
        ContentsCode: 'UtenlStatsbrg',
        Tid: 'top(10)',
      },
      'no',
    ),
    catDim: 'Tid',
    serDim: 'Kjonn',
  },
] as const

const randomKey = () => Math.random().toString(36).slice(2, 10)
const SERIES_COLORS = ['blue', 'teal', 'gold', 'purple', 'slate'] as const

export function EditorialChartSsbInput(props: ObjectInputProps) {
  const {onChange, readOnly, renderDefault} = props
  const [open, setOpen] = useState(false)
  const [queryInput, setQueryInput] = useState('')
  const [lang, setLang] = useState<'no' | 'en'>('no')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dataset, setDataset] = useState<JsonStat2Dataset | null>(null)
  const [extracted, setExtracted] = useState<ExtractedSsbChart | null>(null)
  const [tableId, setTableId] = useState<string | null>(null)
  const [categoryDim, setCategoryDim] = useState<string>('')
  const [seriesDim, setSeriesDim] = useState<string>('')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const handleFetch = useCallback(
    async (overrideUrl?: string, overrideCat?: string, overrideSer?: string, overrideId?: string) => {
      const source = (overrideUrl ?? queryInput).trim()
      if (!source) {
        setError('Enter an SSB table ID (e.g. 12123) or StatBank API v2 URL.')
        return
      }
      setLoading(true)
      setError(null)
      setStatusMessage(null)

      try {
        const directUrl = normalizeSsbDataUrl(source)
        const resolvedId = overrideId ?? extractTableId(source)
        let dataUrl = directUrl

        if (!dataUrl) {
          if (!resolvedId) {
            throw new Error('Could not recognize a valid SSB table ID (4–6 digits) or data.ssb.no v2 URL.')
          }
          const meta = await fetchSsbJson<JsonStat2Dataset>(
            buildSsbMetadataUrl(resolvedId, lang),
            {timeoutMs: 9000},
          )
          dataUrl = buildDefaultDataUrlFromMetadata(meta, resolvedId, lang, 10)
        }

        const ds = await fetchSsbJson<JsonStat2Dataset>(dataUrl, {timeoutMs: 9000})
        const chart = extractChartFromJsonStat2(ds, {
          categoryDimId: overrideCat || undefined,
          seriesDimId: overrideSer !== undefined ? overrideSer : undefined,
        })
        setDataset(ds)
        setExtracted(chart)
        setTableId(resolvedId)
        setCategoryDim(chart.categoryDimId)
        setSeriesDim(chart.seriesDimId ?? '')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data from SSB API.')
      } finally {
        setLoading(false)
      }
    },
    [lang, queryInput],
  )

  const updateDimensionMapping = (nextCat: string, nextSer: string) => {
    setCategoryDim(nextCat)
    setSeriesDim(nextSer)
    if (!dataset) return
    const next = extractChartFromJsonStat2(dataset, {
      categoryDimId: nextCat,
      seriesDimId: nextSer,
    })
    setExtracted(next)
  }

  const applyToChart = () => {
    if (!extracted || readOnly) return
    const categories = extracted.categories.slice(0, 24)
    const series = extracted.series.slice(0, 5).map((item, idx) => ({
      _key: randomKey(),
      _type: 'editorialChartSeries',
      label: item.label.slice(0, 120),
      color: SERIES_COLORS[idx % SERIES_COLORS.length],
      values: categories.map((_, cIdx) => {
        const val = item.values[cIdx]
        return typeof val === 'number' && Number.isFinite(val) ? val : 0
      }),
    }))

    if (!categories.length || !series.length) {
      setError('Extracted dataset has no usable categories or series.')
      return
    }

    const patches = [
      set(extracted.title.slice(0, 160), ['title']),
      set(categories, ['categories']),
      set(series, ['series']),
      set(
        tableId ? `${SSB_ATTRIBUTION} — Tabell ${tableId}` : SSB_ATTRIBUTION,
        ['sourceLabel'],
      ),
      ...(tableId ? [set(`${SSB_STATBANK_PAGE}${tableId}`, ['sourceUrl'])] : []),
      ...(extracted.updatedDate ? [set(extracted.updatedDate, ['sourceDate'])] : []),
    ]

    onChange(PatchEvent.from(patches))
    setStatusMessage(
      `Imported ${categories.length} categories × ${series.length} series from SSB. All labels remain freely editable below.`,
    )
  }

  return (
    <Stack space={4}>
      <Card padding={3} radius={2} border tone="primary">
        <Flex align="center" justify="space-between" gap={3}>
          <Flex align="center" gap={2}>
            <Badge tone="primary">SSB API v2</Badge>
            <Text size={1} weight="semibold">
              Import chart data from Statistics Norway (StatBank)
            </Text>
          </Flex>
          <Button
            mode="ghost"
            fontSize={1}
            padding={2}
            text={open ? 'Hide importer' : 'Import from SSB'}
            onClick={() => setOpen((prev) => !prev)}
            disabled={readOnly}
          />
        </Flex>

        {open && (
          <Stack space={3} marginTop={3}>
            <Flex gap={2} wrap="wrap" align="flex-end">
              <Box flex={2} style={{minWidth: '14rem'}}>
                <Text size={1} muted style={{marginBottom: 4}}>
                  Quick preset
                </Text>
                <Select
                  fontSize={1}
                  onChange={(e) => {
                    const preset = SSB_PRESETS.find((p) => p.id === e.currentTarget.value)
                    if (!preset) return
                    setQueryInput(preset.url)
                    void handleFetch(preset.url, preset.catDim, preset.serDim, preset.id)
                  }}
                  defaultValue=""
                >
                  <option value="">Choose a common SSB preset…</option>
                  {SSB_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </Select>
              </Box>
              <Box style={{minWidth: '7rem'}}>
                <Text size={1} muted style={{marginBottom: 4}}>
                  SSB Language
                </Text>
                <Select
                  fontSize={1}
                  value={lang}
                  onChange={(e) => setLang(e.currentTarget.value === 'en' ? 'en' : 'no')}
                >
                  <option value="no">Norsk (no)</option>
                  <option value="en">English (en)</option>
                </Select>
              </Box>
            </Flex>

            <Flex gap={2} align="center">
              <Box flex={1}>
                <TextInput
                  fontSize={1}
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.currentTarget.value)}
                  placeholder="Enter SSB Table ID (e.g. 12123, 05184) or paste data.ssb.no/api/pxwebapi/v2/... URL"
                />
              </Box>
              <Button
                tone="primary"
                fontSize={1}
                text={loading ? 'Fetching…' : 'Fetch SSB'}
                disabled={loading || readOnly}
                onClick={() => void handleFetch()}
              />
            </Flex>

            {error && (
              <Card padding={2} radius={2} tone="critical">
                <Text size={1}>{error}</Text>
              </Card>
            )}

            {extracted && (
              <Card padding={3} radius={2} border tone="default">
                <Stack space={3}>
                  <Text size={1} weight="semibold">
                    {extracted.title}
                  </Text>
                  <Flex gap={3} wrap="wrap">
                    <Box flex={1} style={{minWidth: '10rem'}}>
                      <Text size={1} muted style={{marginBottom: 4}}>
                        Categories (X-axis)
                      </Text>
                      <Select
                        fontSize={1}
                        value={categoryDim}
                        onChange={(e) => updateDimensionMapping(e.currentTarget.value, seriesDim)}
                      >
                        {extracted.availableDims.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.label} ({d.codes.length})
                          </option>
                        ))}
                      </Select>
                    </Box>
                    <Box flex={1} style={{minWidth: '10rem'}}>
                      <Text size={1} muted style={{marginBottom: 4}}>
                        Series dimension
                      </Text>
                      <Select
                        fontSize={1}
                        value={seriesDim}
                        onChange={(e) => updateDimensionMapping(categoryDim, e.currentTarget.value)}
                      >
                        <option value="">Single series</option>
                        {extracted.availableDims
                          .filter((d) => d.id !== categoryDim && d.codes.length > 1)
                          .map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.label} ({d.codes.length})
                            </option>
                          ))}
                      </Select>
                    </Box>
                  </Flex>
                  <Text size={1} muted>
                    Ready: {extracted.categories.length} categories × {extracted.series.length} series
                    {extracted.updatedDate ? ` · Updated ${extracted.updatedDate}` : ''}
                  </Text>
                  <Flex justify="flex-end">
                    <Button
                      tone="positive"
                      fontSize={1}
                      text="Fill chart fields below"
                      disabled={readOnly}
                      onClick={applyToChart}
                    />
                  </Flex>
                </Stack>
              </Card>
            )}

            {statusMessage && (
              <Card padding={2} radius={2} tone="positive">
                <Text size={1}>{statusMessage}</Text>
              </Card>
            )}
          </Stack>
        )}
      </Card>

      {renderDefault(props)}
    </Stack>
  )
}
