export type RegistrationRequirement =
  | 'not-required'
  | 'recommended'
  | 'required'
  | 'tickets-required'

export type RegistrationStatus =
  | 'not-applicable'
  | 'not-yet-open'
  | 'open'
  | 'closed'
  | 'sold-out'

export interface EventAccessInput {
  registrationRequirement?: string
  registrationStatus?: string
  isFree?: boolean
}

export interface EventAccessLabels {
  registration: string
  tickets: string
  registerExternally: string
  buyTickets: string
  getFreeTicket: string
  registrationRequirements: Record<string, string>
  registrationStatuses: Record<string, string>
  ticketStatuses: Record<string, string>
  freeTicketRequired: string
}

// Tickets are only "bought" when the event is not free, so a free ticketed
// event never shows "buy" wording.
export const getEventAccessLabels = (
  event: EventAccessInput,
  labels: EventAccessLabels,
) => {
  const requirement = event.registrationRequirement ?? 'not-required'
  const status = event.registrationStatus ?? 'not-applicable'
  const ticketed = requirement === 'tickets-required'
  const free = event.isFree === true

  const requirementLabel = ticketed && free
    ? labels.freeTicketRequired
    : (labels.registrationRequirements[requirement] ?? requirement)

  const statusLabel =
    (ticketed ? labels.ticketStatuses : labels.registrationStatuses)[status] ?? status

  const actionLabel = ticketed
    ? free
      ? labels.getFreeTicket
      : labels.buyTickets
    : labels.registerExternally

  return {
    needsAction: requirement !== 'not-required',
    sectionLabel: ticketed ? labels.tickets : labels.registration,
    requirementLabel,
    statusLabel,
    actionLabel,
  }
}
