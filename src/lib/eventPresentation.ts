import { getEventAccessLabels, type EventAccessLabels } from "./eventAccess.ts";
import { getAllDates, type EventDateRange } from "./eventOccurrences.ts";

export interface EventRegistrationInput {
  startDateTime: string;
  endDateTime?: string;
  additionalDates?: EventDateRange[] | null;
  eventStatus: string;
  registrationRequirement: string;
  registrationStatus: string;
  registrationUrl?: string;
  registrationDeadline?: string;
  isFree?: boolean;
}

export interface EventRegistrationLabels extends EventAccessLabels {
  registrationUnavailable: string;
  registrationClosed: string;
  statuses: Record<string, string>;
}

export interface ResolvedEventRegistration {
  isPast: boolean;
  isOngoing: boolean;
  deadlinePassed: boolean;
  needsAction: boolean;
  canRegister: boolean;
  sectionLabel: string;
  requirementLabel: string;
  statusLabel: string;
  actionLabel: string;
}

const endTimeMs = (range: EventDateRange) =>
  new Date(range.endDateTime || range.startDateTime).getTime();

/** Returns the latest occurrence (by end time) across primary and additional dates. */
export function latestOccurrence<
  T extends EventDateRange & { additionalDates?: EventDateRange[] | null },
>(event: T): T {
  const dates = getAllDates(event);
  const latest = dates.reduce((best, current) =>
    endTimeMs(current) >= endTimeMs(best) ? current : best,
  );
  return {
    ...event,
    startDateTime: latest.startDateTime,
    endDateTime: latest.endDateTime,
  };
}

/**
 * Resolves consistent registration availability and status labels so past,
 * cancelled, postponed, or deadline-expired events never claim registration is open.
 */
export function resolveEventRegistration(
  event: EventRegistrationInput,
  labels: EventRegistrationLabels,
  now: number,
): ResolvedEventRegistration {
  const start = new Date(event.startDateTime).getTime();
  const end = new Date(event.endDateTime || event.startDateTime).getTime();
  const isPast = end < now;
  const isOngoing = start <= now && end >= now;
  const deadlineMs = event.registrationDeadline
    ? new Date(event.registrationDeadline).getTime()
    : Number.NaN;
  const deadlinePassed =
    Number.isFinite(deadlineMs) && deadlineMs < now;

  const access = getEventAccessLabels(event, labels);
  const isCancelledOrPostponed = ["cancelled", "postponed"].includes(
    event.eventStatus,
  );

  const canRegister =
    access.needsAction &&
    !isPast &&
    !isCancelledOrPostponed &&
    event.registrationStatus === "open" &&
    !deadlinePassed &&
    Boolean(event.registrationUrl);

  let statusLabel = access.statusLabel;
  if (isPast || event.eventStatus === "cancelled") {
    statusLabel = labels.registrationUnavailable;
  } else if (event.eventStatus === "postponed") {
    statusLabel = labels.statuses.postponed ?? labels.registrationUnavailable;
  } else if (deadlinePassed && event.registrationStatus === "open") {
    statusLabel = labels.registrationClosed;
  }

  return {
    isPast,
    isOngoing,
    deadlinePassed,
    needsAction: access.needsAction,
    canRegister,
    sectionLabel: access.sectionLabel,
    requirementLabel: access.requirementLabel,
    statusLabel,
    actionLabel: access.actionLabel,
  };
}

const yearInTimeZone = (value: string | number, timeZone: string) =>
  Number(
    new Intl.DateTimeFormat("en", { timeZone, year: "numeric" }).format(
      new Date(value),
    ),
  );

export function formatEventDateRange(
  startValue: string,
  endValue: string | undefined,
  locale: string,
  timeZone: string,
  currentYear?: number,
): string {
  const end = endValue || startValue;
  const options: Intl.DateTimeFormatOptions = {
    timeZone,
    month: "long",
    day: "numeric",
  };
  if (
    currentYear === undefined ||
    yearInTimeZone(startValue, timeZone) !== currentYear ||
    yearInTimeZone(end, timeZone) !== currentYear
  ) {
    options.year = "numeric";
  }
  return new Intl.DateTimeFormat(locale, options).formatRange(
    new Date(startValue),
    new Date(end),
  );
}

export function formatEventTimeRange(
  startValue: string,
  endValue: string | undefined,
  isAllDay: boolean | undefined,
  locale: string,
  timeZone: string,
  allDayLabel: string,
): string {
  if (isAllDay) return allDayLabel;
  const formatTime = (value: string) =>
    new Date(value).toLocaleTimeString(locale, {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
    });
  return `${formatTime(startValue)}${endValue ? ` – ${formatTime(endValue)}` : ""}`;
}

const formatIcsUtc = (value: string) =>
  new Date(value)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");

const escapeIcsText = (value: string) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");

/** Generates an RFC 5545 iCalendar payload with one VEVENT per scheduled day/occurrence. */
export function buildEventIcs(
  event: {
    _id: string;
    title: string;
    summary?: string;
    startDateTime: string;
    endDateTime?: string;
    additionalDates?: EventDateRange[] | null;
    venueName?: string;
    address?: string;
    postalCode?: string;
    city?: string;
    onlinePlatform?: string;
  },
  eventUrl: string,
): string {
  const occurrences = getAllDates(event);
  const location = [
    event.venueName,
    event.address,
    event.postalCode,
    event.city,
    event.onlinePlatform,
  ]
    .filter(Boolean)
    .join(", ");
  const dtStamp = formatIcsUtc(new Date().toISOString());

  const events = occurrences.flatMap((occ, index) => {
    const start = new Date(occ.startDateTime);
    const end = occ.endDateTime
      ? new Date(occ.endDateTime)
      : new Date(start.getTime() + 60 * 60 * 1000);
    const uid = occurrences.length > 1 ? `${event._id}-${index}@nepali.no` : `${event._id}@nepali.no`;
    return [
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${formatIcsUtc(start.toISOString())}`,
      `DTEND:${formatIcsUtc(end.toISOString())}`,
      `SUMMARY:${escapeIcsText(event.title)}`,
      ...(event.summary ? [`DESCRIPTION:${escapeIcsText(event.summary)}`] : []),
      ...(location ? [`LOCATION:${escapeIcsText(location)}`] : []),
      `URL:${eventUrl}`,
      "END:VEVENT",
    ];
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//nepali.no//Events//EN",
    "CALSCALE:GREGORIAN",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}
