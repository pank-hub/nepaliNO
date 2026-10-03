import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'
import {getEventAccessLabels} from '../../src/lib/eventAccess.ts'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

const labels = {
  registration: 'Registration',
  tickets: 'Tickets',
  registerExternally: 'Register with organizer',
  buyTickets: 'Buy tickets',
  getFreeTicket: 'Get free ticket',
  freeTicketRequired: 'Free ticket required',
  registrationRequirements: {
    'not-required': 'No registration',
    recommended: 'Registration recommended',
    required: 'Registration required',
    'tickets-required': 'Tickets required',
  },
  registrationStatuses: {open: 'Registration open', 'sold-out': 'Sold out'},
  ticketStatuses: {open: 'Tickets available', 'sold-out': 'All tickets taken'},
}

test('free ticketed events never use "buy" wording', () => {
  const result = getEventAccessLabels(
    {registrationRequirement: 'tickets-required', registrationStatus: 'open', isFree: true},
    labels,
  )
  assert.equal(result.actionLabel, 'Get free ticket')
  assert.equal(result.requirementLabel, 'Free ticket required')
  assert.equal(result.statusLabel, 'Tickets available')
  assert.equal(result.sectionLabel, 'Tickets')
})

test('paid ticketed events say buy and use ticket wording', () => {
  const result = getEventAccessLabels(
    {registrationRequirement: 'tickets-required', registrationStatus: 'open', isFree: false},
    labels,
  )
  assert.equal(result.actionLabel, 'Buy tickets')
  assert.equal(result.requirementLabel, 'Tickets required')
})

test('registration events keep registration wording, free or not', () => {
  for (const isFree of [true, false, undefined]) {
    const result = getEventAccessLabels(
      {registrationRequirement: 'required', registrationStatus: 'open', isFree},
      labels,
    )
    assert.equal(result.actionLabel, 'Register with organizer')
    assert.equal(result.statusLabel, 'Registration open')
    assert.equal(result.sectionLabel, 'Registration')
  }
})

test('events without registration need no action', () => {
  const result = getEventAccessLabels({registrationRequirement: 'not-required'}, labels)
  assert.equal(result.needsAction, false)
})

test('sold-out free tickets are not described as sold', () => {
  const result = getEventAccessLabels(
    {registrationRequirement: 'tickets-required', registrationStatus: 'sold-out', isFree: true},
    labels,
  )
  assert.equal(result.statusLabel, 'All tickets taken')
})

test('event queries only project organizer contact details with permission', async () => {
  const queries = await read('../../src/lib/sanity/queries.ts')
  assert.doesNotMatch(queries, /^\s+organizerEmail,$/m)
  assert.doesNotMatch(queries, /^\s+organizerPhone,$/m)
  assert.equal(
    queries.match(/select\(organizerContactPermission == true => organizerEmail\)/g)?.length,
    4,
  )
  assert.equal(
    queries.match(/select\(organizerContactPermission == true => organizerPhone\)/g)?.length,
    4,
  )
})

test('the schema has the organizer contact permission field', async () => {
  const schema = await read('../../sanity/schemaTypes/communityEvent.ts')
  assert.match(schema, /name: 'organizerContactPermission'/)
  assert.match(schema, /initialValue: false/)
})

test('the homepage no longer labels events as featured or special', async () => {
  const [home, ne, nb, schema] = await Promise.all([
    read('../../src/pages/[lang]/index.astro'),
    read('../../src/i18n/ne.ts'),
    read('../../src/i18n/nb.ts'),
    read('../../sanity/schemaTypes/communityEvent.ts'),
  ])
  assert.doesNotMatch(home, /featuredEvent/)
  assert.doesNotMatch(ne + nb, /featuredEvent/)
  assert.match(schema, /title: 'Show on Homepage'/)
})

test('both languages contain the ticket and price labels', async () => {
  for (const file of ['ne', 'nb']) {
    const source = await read(`../../src/i18n/${file}.ts`)
    for (const key of ['getFreeTicket', 'tickets', 'freeTicketRequired', 'paidEvent', 'ticketStatuses']) {
      assert.match(source, new RegExp(`${key}:`))
    }
  }
})
