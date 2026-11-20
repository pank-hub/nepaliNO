import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'
import {
  buildEventIcs,
  latestOccurrence,
  resolveEventRegistration,
} from '../../src/lib/eventPresentation.ts'
import {PAST_EVENTS_BY_LANGUAGE_QUERY} from '../../src/lib/sanity/queries.ts'

const labels = {
  registration: 'Registration',
  tickets: 'Tickets',
  registerExternally: 'Register with organizer',
  buyTickets: 'Buy tickets',
  getFreeTicket: 'Get free ticket',
  freeTicketRequired: 'Free ticket required',
  registrationUnavailable: 'Registration unavailable',
  registrationClosed: 'Registration closed',
  registrationRequirements: {
    'not-required': 'No registration',
    recommended: 'Registration recommended',
    required: 'Registration required',
    'tickets-required': 'Tickets required',
  },
  registrationStatuses: {
    'not-applicable': 'Not applicable',
    open: 'Registration open',
    closed: 'Registration closed',
    'sold-out': 'Sold out',
  },
  ticketStatuses: {
    'not-applicable': 'Not applicable',
    open: 'Tickets available',
    closed: 'Tickets closed',
    'sold-out': 'Sold out',
  },
  statuses: {
    scheduled: 'Scheduled',
    postponed: 'Postponed',
    rescheduled: 'Rescheduled',
    cancelled: 'Cancelled',
  },
}

const t = (iso) => new Date(iso).getTime()

test('PAST_EVENTS_BY_LANGUAGE_QUERY handles null additionalDates via coalesce', () => {
  assert.match(
    PAST_EVENTS_BY_LANGUAGE_QUERY,
    /coalesce\(count\(additionalDates\[coalesce\(endDateTime, startDateTime\) >= now\(\)\]\), 0\) == 0/,
  )
})

test('latestOccurrence picks the latest date across primary and additionalDates', () => {
  const ev = {
    startDateTime: '2026-09-01T10:00:00Z',
    endDateTime: '2026-09-01T12:00:00Z',
    additionalDates: [
      {startDateTime: '2026-10-15T10:00:00Z', endDateTime: '2026-10-15T14:00:00Z'},
      {startDateTime: '2026-09-20T10:00:00Z', endDateTime: '2026-09-20T12:00:00Z'},
    ],
  }
  const latest = latestOccurrence(ev)
  assert.equal(latest.startDateTime, '2026-10-15T10:00:00Z')
  assert.equal(latest.endDateTime, '2026-10-15T14:00:00Z')
})

test('resolveEventRegistration never reports registration open when past, cancelled, or deadline passed', () => {
  const baseEvent = {
    startDateTime: '2026-11-12T16:00:00Z',
    endDateTime: '2026-11-12T17:00:00Z',
    eventStatus: 'scheduled',
    registrationRequirement: 'required',
    registrationStatus: 'open',
    registrationUrl: 'https://example.com/register',
    isFree: true,
  }

  // Past event
  const pastRes = resolveEventRegistration(baseEvent, labels, t('2026-11-20T00:00:00Z'))
  assert.equal(pastRes.isPast, true)
  assert.equal(pastRes.canRegister, false)
  assert.equal(pastRes.statusLabel, 'Registration unavailable')

  // Future event with expired registration deadline
  const expiredDeadline = resolveEventRegistration(
    {...baseEvent, registrationDeadline: '2026-11-05T23:59:00Z'},
    labels,
    t('2026-11-10T10:00:00Z'),
  )
  assert.equal(expiredDeadline.isPast, false)
  assert.equal(expiredDeadline.deadlinePassed, true)
  assert.equal(expiredDeadline.canRegister, false)
  assert.equal(expiredDeadline.statusLabel, 'Registration closed')

  // Future event open before deadline
  const openRes = resolveEventRegistration(
    {...baseEvent, registrationDeadline: '2026-11-11T23:59:00Z'},
    labels,
    t('2026-11-10T10:00:00Z'),
  )
  assert.equal(openRes.canRegister, true)
  assert.equal(openRes.statusLabel, 'Registration open')

  // Cancelled future event
  const cancelledRes = resolveEventRegistration(
    {...baseEvent, eventStatus: 'cancelled'},
    labels,
    t('2026-11-10T10:00:00Z'),
  )
  assert.equal(cancelledRes.canRegister, false)
  assert.equal(cancelledRes.statusLabel, 'Registration unavailable')
})

test('buildEventIcs outputs valid VCALENDAR with escaped location and summary', () => {
  const ics = buildEventIcs(
    {
      _id: 'evt-1',
      title: 'Dashain, Celebration; 2026',
      summary: 'Line 1\nLine 2',
      startDateTime: '2026-10-17T15:00:00Z',
      endDateTime: '2026-10-17T18:00:00Z',
      venueName: 'Caritas Norge',
      city: 'Oslo',
    },
    'https://nepali.no/ne/events/dashain-2026/',
  )
  assert.match(ics, /^BEGIN:VCALENDAR/)
  assert.match(ics, /UID:evt-1@nepali\.no/)
  assert.match(ics, /DTSTART:20261017T150000Z/)
  assert.match(ics, /DTEND:20261017T180000Z/)
  assert.match(ics, /SUMMARY:Dashain\\, Celebration\\; 2026/)
  assert.match(ics, /DESCRIPTION:Line 1\\nLine 2/)
  assert.match(ics, /LOCATION:Caritas Norge\\, Oslo/)
  assert.match(ics, /END:VCALENDAR$/)
})

test('buildEventIcs outputs one VEVENT per day for multi-day differing hours', () => {
  const ics = buildEventIcs(
    {
      _id: 'evt-multi',
      title: 'Two-Day Workshop',
      startDateTime: '2026-11-21T08:00:00Z',
      endDateTime: '2026-11-21T15:30:00Z',
      additionalDates: [
        {startDateTime: '2026-11-22T08:30:00Z', endDateTime: '2026-11-22T13:30:00Z'},
      ],
      venueName: 'Oslo',
    },
    'https://nepali.no/ne/events/two-day-workshop/',
  )
  assert.equal((ics.match(/BEGIN:VEVENT/g) ?? []).length, 2)
  assert.match(ics, /UID:evt-multi-0@nepali\.no/)
  assert.match(ics, /DTSTART:20261121T080000Z[\s\S]*DTEND:20261121T153000Z/)
  assert.match(ics, /UID:evt-multi-1@nepali\.no/)
  assert.match(ics, /DTSTART:20261122T083000Z[\s\S]*DTEND:20261122T133000Z/)
})

test('event pages use SSR and have no nested <main> elements', async () => {
  for (const file of ['index.astro', 'past.astro', '[slug].astro']) {
    const src = await readFile(new URL(`../../src/pages/[lang]/events/${file}`, import.meta.url), 'utf8')
    assert.match(src, /export const prerender = false/)
    assert.doesNotMatch(src, /<main\b/)
  }
})
