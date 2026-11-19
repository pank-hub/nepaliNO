import assert from 'node:assert/strict'
import test from 'node:test'

import {getLanguagesWithSection, isSectionEnabled, resolveAlternatePath} from '../../src/config/languageSections.ts'
import {safeCreateChartGeometry} from '../../src/lib/editorialChart/geometry.ts'
import {normalizeEditorialChart} from '../../src/lib/editorialChart/normalize.ts'
import {validPlaces} from '../../src/lib/maps/places.ts'
import {loadNepaliStats, toNepaliYear} from '../../src/lib/ssb/nepalStats.ts'
import {
  buildDefaultDataUrlFromMetadata,
  buildSsbDataUrl,
  decodeJsonStat2Value,
  extractChartFromJsonStat2,
  extractTableId,
  normalizeSsbDataUrl,
} from '../../src/lib/ssb/pxweb.ts'

test('SSB URL helpers validate hosts, extract table IDs, and build safe json-stat2 URLs', () => {
  assert.equal(extractTableId('12123'), '12123')
  assert.equal(extractTableId('https://www.ssb.no/statbank/table/05184'), '05184')
  assert.equal(
    extractTableId('https://data.ssb.no/api/pxwebapi/v2/tables/13880/data?lang=en'),
    '13880',
  )
  assert.equal(extractTableId('https://evil.example/tables/12123'), null)

  assert.equal(normalizeSsbDataUrl('http://data.ssb.no/api/pxwebapi/v2/tables/12123/data'), null)
  assert.equal(
    normalizeSsbDataUrl('https://evil.ssb.no.example/api/pxwebapi/v2/tables/12123/data'),
    null,
  )
  assert.equal(
    normalizeSsbDataUrl('https://data.ssb.no/api/pxwebapi/v2/tables/12123/data?lang=no&outputFormat=csv'),
    'https://data.ssb.no/api/pxwebapi/v2/tables/12123/data?lang=no&outputFormat=json-stat2',
  )

  const built = buildSsbDataUrl('05184', {Kjonn: ['1', '2'], Landbakgrunn: '528', Tid: 'top(6)'}, 'en')
  assert.match(built, /^https:\/\/data\.ssb\.no\/api\/pxwebapi\/v2\/tables\/05184\/data\?/)
  assert.match(built, /outputFormat=json-stat2/)
})

test('json-stat2 decoder handles multi-dimensional indexing and extracts chart series cleanly', () => {
  const sample = {
    version: '2.0',
    label: 'Immigrants from Nepal',
    updated: '2026-03-05T07:00:00Z',
    role: {time: ['Tid']},
    id: ['Kjonn', 'Landbakgrunn', 'Tid'],
    size: [2, 1, 3],
    dimension: {
      Kjonn: {
        label: 'Sex',
        category: {index: {'1': 0, '2': 1}, label: {'1': 'Males', '2': 'Females'}},
      },
      Landbakgrunn: {
        label: 'Country',
        category: {index: {'528': 0}, label: {'528': 'Nepal'}},
      },
      Tid: {
        label: 'Year',
        category: {index: {'2024': 0, '2025': 1, '2026': 2}, label: {'2024': '2024', '2025': '2025', '2026': '2026'}},
      },
    },
    value: [1672, 1808, 1973, 1492, 1631, 1782],
  }

  assert.equal(decodeJsonStat2Value(sample, {Kjonn: '1', Landbakgrunn: '528', Tid: '2026'}), 1973)
  assert.equal(decodeJsonStat2Value(sample, {Kjonn: '2', Landbakgrunn: '528', Tid: '2024'}), 1492)
  assert.equal(decodeJsonStat2Value(sample, {Kjonn: '9', Landbakgrunn: '528', Tid: '2024'}), null)

  const extracted = extractChartFromJsonStat2(sample)
  assert.equal(extracted.updatedDate, '2026-03-05')
  assert.deepEqual(extracted.categories, ['2024', '2025', '2026'])
  assert.equal(extracted.series.length, 2)
  assert.deepEqual(extracted.series[0].values, [1672, 1808, 1973])
  assert.deepEqual(extracted.series[1].values, [1492, 1631, 1782])

  const defaultUrl = buildDefaultDataUrlFromMetadata(sample, '05184', 'en', 6)
  assert.match(defaultUrl, /valueCodes%5BLandbakgrunn%5D=528/)
  assert.match(defaultUrl, /valueCodes%5BTid%5D=top%286%29/)
})

test('Nepali stats loader renders all 11 interactive charts and falls back gracefully on SSB failure', async () => {
  const snapshotModel = await loadNepaliStats({allowLive: false})
  assert.equal(snapshotModel.liveTablesLoaded.length, 0)
  assert.equal(toNepaliYear('2026'), '२०२६')
  assert.equal(Object.keys(snapshotModel.charts).length, 11)
  assert.equal(snapshotModel.snapshot.municipalities.counties.length, 15)
  assert.equal(snapshotModel.snapshot.residenceDuration.total, 3757)
  assert.equal(snapshotModel.snapshot.employmentRate.overall, 78.5)

  for (const [name, input] of Object.entries(snapshotModel.charts)) {
    const chart = normalizeEditorialChart(input)
    assert.equal(chart.canRenderVisual, true, `${name} canRenderVisual`)
    assert.deepEqual(chart.visualErrors, [], `${name} errors`)
    for (const layout of ['compact', 'wide']) {
      const res = safeCreateChartGeometry(chart, 'ne', layout)
      assert.equal(res.error, undefined, `${name}/${layout} geometry error`)
      assert.ok(res.geometry && res.geometry.width > 0, `${name}/${layout} width`)
    }
  }

  assert.equal(validPlaces(snapshotModel.municipalityPlaces).length, 10)

  const brokenModel = await loadNepaliStats({
    allowLive: true,
    fetcher: async () => {
      throw new Error('Network offline')
    },
  })
  assert.equal(brokenModel.liveTablesLoaded.length, 0)
  assert.equal(brokenModel.snapshot.population.immigrants.at(-1), 3755)
})

test('stats section obeys Nepali-enabled / Norwegian-disabled language gating', () => {
  assert.equal(isSectionEnabled('ne', 'stats'), true)
  assert.equal(isSectionEnabled('nb', 'stats'), false)
  assert.deepEqual(getLanguagesWithSection('stats'), ['ne'])
  assert.equal(resolveAlternatePath('nb', '/nb/stats/'), '/nb/')
  assert.equal(resolveAlternatePath('ne', '/ne/stats/'), '/ne/stats/')
})
