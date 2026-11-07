import {isDateTime, MAX_HORIZON_MS, PAST_TOLERANCE_MS} from './validation.ts'

const osloParts = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Oslo', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})

// Ambiguous autumn times and nonexistent spring times must be selected again.
export function osloLocalToInstant(value: string, now = Date.now()): string | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value)
  if (!match) return
  const [, year, month, day, hour, minute] = match
  const utc = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute))
  const candidates = [60, 120].map((offset) => utc - offset * 60_000).filter((instant) => {
    const parts = Object.fromEntries(osloParts.formatToParts(instant).map(({type, value}) => [type, value]))
    return parts.year === year && parts.month === month && parts.day === day &&
      parts.hour === hour && parts.minute === minute
  })
  if (candidates.length !== 1 || candidates[0] < now - PAST_TOLERANCE_MS ||
    candidates[0] > now + MAX_HORIZON_MS) return
  const result = new Date(candidates[0]).toISOString()
  return isDateTime(result) ? result : undefined
}
