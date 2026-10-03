export interface EventDateRange {
  startDateTime: string;
  endDateTime?: string;
}

type WithDates = EventDateRange & { additionalDates?: EventDateRange[] | null };

const endOf = (range: EventDateRange) =>
  new Date(range.endDateTime || range.startDateTime).getTime();

export function getAllDates(event: WithDates): EventDateRange[] {
  const extra = (event.additionalDates ?? []).filter((d) => d?.startDateTime);
  return [
    { startDateTime: event.startDateTime, endDateTime: event.endDateTime },
    ...extra,
  ].sort(
    (a, b) =>
      new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime(),
  );
}

/** One entry per upcoming or ongoing date, sorted by start time. */
export function expandUpcomingOccurrences<T extends WithDates>(
  events: T[],
  now: number,
): T[] {
  return events
    .flatMap((event) =>
      getAllDates(event)
        .filter((d) => endOf(d) >= now)
        .map((d) => ({
          ...event,
          startDateTime: d.startDateTime,
          endDateTime: d.endDateTime,
        })),
    )
    .sort(
      (a, b) =>
        new Date(a.startDateTime).getTime() -
        new Date(b.startDateTime).getTime(),
    );
}

/** Homepage: featured first, then by date; each event appears once, at its next date. */
export function nextOccurrence<T extends WithDates>(event: T, now: number): T {
  const dates = getAllDates(event);
  const next = dates.find((d) => endOf(d) >= now) ?? dates[dates.length - 1];
  return {
    ...event,
    startDateTime: next.startDateTime,
    endDateTime: next.endDateTime,
  };
}
