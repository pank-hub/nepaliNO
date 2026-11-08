import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'
import {resolveMapDisplaySettings} from '../../src/lib/maps/location.ts'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

const privacySource = await read('../../src/pages/[lang]/privacy.astro')
const sectionText = (heading) => {
  const start = privacySource.indexOf(`{heading: '${heading}'`)
  assert.ok(start >= 0, `fallback section "${heading}" exists`)
  const end = privacySource.indexOf('{heading:', start + 10)
  return privacySource.slice(start, end === -1 ? undefined : end)
}

const sections = {
  nb: sectionText('Kart og reisehjelp'),
  ne: sectionText('नक्सा र यात्रा सहायता'),
}

test('the Nepali and Norwegian fallbacks each have one Maps and travel assistance section', () => {
  for (const heading of ['Kart og reisehjelp', 'नक्सा र यात्रा सहायता']) {
    assert.equal(privacySource.split(`{heading: '${heading}'`).length, 2, heading)
  }
  // Placed inside the correct language block, before the retention section.
  assert.ok(privacySource.indexOf('नक्सा र यात्रा सहायता') < privacySource.indexOf('  nb: {'))
  assert.ok(privacySource.indexOf('Kart og reisehjelp') > privacySource.indexOf('  nb: {'))
  assert.ok(privacySource.indexOf('Kart og reisehjelp') < privacySource.indexOf("heading: 'Lagring, innsyn og sletting'"))
})

test('Norwegian fallback covers every required disclosure', () => {
  const text = sections.nb
  for (const pattern of [
    /tile\.openstreetmap\.org/,
    /kontakter nettleseren din denne leverandøren direkte/,
    /IP-adresse og forespurte kartruter/,
    /når du klikker, eller når du ruller i nærheten/,
    /offentlig redaksjonelt innhold/,
    /ber ikke om nettleserens posisjon/,
    /lagrer ikke hvordan du beveger deg i kartet/,
    /Først når du aktivt bruker reisehjelpen/,
    /via nepali\.no til Entur/,
    /koordinatene til start og mål og valgt tidspunkt/,
    /lagrer ikke reisehistorikk eller søk etter startsted/,
    /Upstash.*kortlevd, pseudonym HMAC-identifikator, ikke IP-adressen din, søketekst, koordinater, reisetidspunkt eller rute/,
    /drifts- og leverandørlogger.*kan likevel finnes/,
    /bruke selve siden uten å bruke kartet eller reisehjelpen/,
  ]) assert.match(text, pattern)
})

test('Nepali fallback covers every required disclosure', () => {
  const text = sections.ne
  for (const pattern of [
    /tile\.openstreetmap\.org/,
    /ब्राउजरले सीधै त्यो प्रदायकसँग सम्पर्क गर्छ/,
    /IP ठेगाना तथा माग गरिएका नक्सा खण्ड/,
    /क्लिक गर्दा वा त्यसको नजिक स्क्रोल गर्दा/,
    /सार्वजनिक सम्पादकीय सामग्री/,
    /ब्राउजरको स्थान \(geolocation\) माग्दैन/,
    /नक्सा चलाएको विवरण भण्डारण गर्दैन/,
    /सक्रिय रूपमा प्रयोग गर्दा मात्र/,
    /nepali\.no मार्फत Entur मा पठाइन्छ/,
    /निर्देशांक तथा छानिएको समय पठाइन्छ/,
    /यात्रा इतिहास वा प्रस्थान स्थानका खोजी भण्डारण गर्दैन/,
    /Upstash.*छद्म-नामी HMAC पहिचानकर्ता मात्र/,
    /खोज पाठ, निर्देशांक, यात्रा समय वा मार्ग त्यसमा हुँदैनन्/,
    /सञ्चालन लग/,
    /मूल सामग्री पढ्न तपाईंले नक्सा वा यात्रा सहायता प्रयोग गर्नु पर्दैन/,
  ]) assert.match(text, pattern)
})

test('the fallback states no exact Upstash retention duration and claims no geolocation feature', () => {
  for (const text of Object.values(sections)) {
    assert.doesNotMatch(text, /\b\d+\s*(minutt|minute|sekund|second|timer|hour)/i)
    assert.doesNotMatch(text, /to minutter|two minutes|दुई मिनेट|[०-९]+\s*(मिनेट|सेकेन्ड)|121/)
    assert.doesNotMatch(text, /posisjonen din brukes|we use your location|तपाईंको स्थान प्रयोग/)
  }
})

test('the live privacy page still prefers the published Sanity document', () => {
  assert.match(privacySource, /const page = sanityPage \?\? copy\[language\]/)
})

test('new Studio map blocks load on click while automatic loading stays supported', async () => {
  const schema = await read('../../sanity/schemaTypes/mapLocation.ts')
  assert.match(schema, /initialValue:\s*\{\s*loadingBehavior: 'click',/)
  assert.doesNotMatch(schema, /initialValue:\s*\{\s*loadingBehavior: 'automatic'/)
  assert.match(schema, /\{title: 'Load automatically near the map', value: 'automatic'\}/)
  assert.match(schema, /\{title: 'Require the reader to load the map', value: 'click'\}/)
  assert.equal(resolveMapDisplaySettings({loadingBehavior: 'automatic'}).loadingBehavior, 'automatic')
  assert.equal(resolveMapDisplaySettings({}).loadingBehavior, 'click')
  const observer = await read('../../src/lib/maps/mapLoading.ts')
  assert.match(observer, /loadingBehavior === "automatic"/)
})
