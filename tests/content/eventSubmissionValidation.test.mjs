import assert from 'node:assert/strict'
import test from 'node:test'
import {validateEventSubmission} from '../../src/lib/eventSubmissions/validateEventSubmission.ts'

const minimalValidPayload = {
  website: '',
  formInterfaceLanguage: 'ne',
  organizerName: 'Nepali Community Oslo',
  privateContactName: 'Sita Sharma',
  privateContactEmail: 'sita@example.org',
  publicContactPermission: false,
  proposedTitle: 'Dashain Gathering 2026',
  descriptionPlainText: 'Join us for a community celebration with dinner and cultural performances.',
  eventType: 'cultural-celebration',
  eventFormat: 'in-person',
  isAllDay: false,
  startDateTime: '2026-12-10T17:00:00+01:00',
  city: 'Oslo',
  registrationRequirement: 'not-required',
  isFree: true,
  accuracyConfirmed: true,
  privacyRetentionAccepted: true,
}

test('accepts streamlined submission payload and applies clean defaults', () => {
  const result = validateEventSubmission(minimalValidPayload)
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.data.submissionLanguage, 'ne')
  assert.equal(result.data.preferredContactLanguage, 'ne')
  assert.equal(result.data.requestedPublicLanguage, 'editorial-decision')
  assert.equal(result.data.registrationStatus, 'not-applicable')
  assert.deepEqual(result.data.eventLanguages, [])
  assert.equal(result.data.authorityConfirmed, true)
  assert.equal(result.data.editingTranslationAccepted, true)
  assert.equal(result.data.publicationNotGuaranteedAccepted, true)
  assert.ok(result.data.summary.length > 20)
})

test('still enforces city, online access, paid price, and image permission rules', () => {
  const missingCity = validateEventSubmission({...minimalValidPayload, city: ''})
  assert.equal(missingCity.ok, false)
  if (!missingCity.ok) assert.ok(missingCity.errors.some((e) => e.field === 'city'))

  const onlineNoLink = validateEventSubmission({
    ...minimalValidPayload,
    eventFormat: 'online',
    city: undefined,
  })
  assert.equal(onlineNoLink.ok, false)
  if (!onlineNoLink.ok) assert.ok(onlineNoLink.errors.some((e) => e.field === 'onlinePlatform'))

  const paidNoPrice = validateEventSubmission({...minimalValidPayload, isFree: false})
  assert.equal(paidNoPrice.ok, false)
  if (!paidNoPrice.ok) assert.ok(paidNoPrice.errors.some((e) => e.field === 'priceDescription'))

  const imageNoPerm = validateEventSubmission({
    ...minimalValidPayload,
    proposedImageUrl: 'https://example.org/poster.jpg',
    imagePermissionConfirmed: false,
  })
  assert.equal(imageNoPerm.ok, false)
  if (!imageNoPerm.ok) assert.ok(imageNoPerm.errors.some((e) => e.field === 'imagePermissionConfirmed'))
})

test('rejects unknown fields and honeypot submissions', () => {
  const unknown = validateEventSubmission({...minimalValidPayload, moderationStatus: 'approved'})
  assert.equal(unknown.ok, false)
  if (!unknown.ok) assert.ok(unknown.errors.some((e) => e.field === 'moderationStatus' && e.code === 'unknown_field'))

  const spam = validateEventSubmission({...minimalValidPayload, website: 'https://spam.example'})
  assert.equal(spam.ok, false)
  if (!spam.ok) assert.equal(spam.spam, true)
})

test('accepts additionalDates for multi-day programs with different hours and validates order', () => {
  const validMulti = validateEventSubmission({
    ...minimalValidPayload,
    startDateTime: '2026-12-10T09:00:00+01:00',
    endDateTime: '2026-12-10T16:30:00+01:00',
    additionalDates: [
      {startDateTime: '2026-12-11T09:30:00+01:00', endDateTime: '2026-12-11T14:30:00+01:00'},
    ],
  })
  assert.equal(validMulti.ok, true)
  if (!validMulti.ok) return
  assert.deepEqual(validMulti.data.additionalDates, [
    {startDateTime: '2026-12-11T09:30:00+01:00', endDateTime: '2026-12-11T14:30:00+01:00'},
  ])

  const badOrder = validateEventSubmission({
    ...minimalValidPayload,
    additionalDates: [
      {startDateTime: '2026-12-11T14:30:00+01:00', endDateTime: '2026-12-11T09:30:00+01:00'},
    ],
  })
  assert.equal(badOrder.ok, false)
  if (!badOrder.ok) assert.ok(badOrder.errors.some((e) => e.field === 'additionalDates' && e.code === 'invalid_order'))
})
