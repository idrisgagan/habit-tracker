/**
 * Dates are stored as local-time `YYYY-MM-DD` keys, never as timestamps.
 * A habit done at 11pm and one done at 1am belong to different days for the
 * user, and only a local calendar key gets that right across timezones and DST.
 */
export type DayKey = string

export function toDayKey(date: Date): DayKey {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function today(): DayKey {
  return toDayKey(new Date())
}

/** Shifts a day key by `days` (negative goes back in time). */
export function addDays(key: DayKey, days: number): DayKey {
  const [y, m, d] = key.split('-').map(Number)
  // Midday anchor keeps DST transitions from rolling us into the wrong day.
  const date = new Date(y, m - 1, d, 12)
  date.setDate(date.getDate() + days)
  return toDayKey(date)
}

/** The last `count` day keys ending at `end`, oldest first. */
export function lastNDays(count: number, end: DayKey = today()): DayKey[] {
  const days: DayKey[] = []
  for (let i = count - 1; i >= 0; i--) days.push(addDays(end, -i))
  return days
}

export function formatDay(key: DayKey): string {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}
