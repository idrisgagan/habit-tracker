import { addDays, lastNDays, today, type DayKey } from './dates'

export type Stats = {
  current: number
  longest: number
  completedToday: boolean
  /** Completions in the last 30 days, 0..30. */
  last30: number
  total: number
}

/**
 * Current streak counts back from today, but an unfinished *today* does not
 * break it: if yesterday was done, the streak stands until midnight. Otherwise
 * every streak would visibly reset each morning before the user acted on it.
 */
export function currentStreak(done: Set<DayKey>, end: DayKey = today()): number {
  let cursor = done.has(end) ? end : addDays(end, -1)
  let streak = 0
  while (done.has(cursor)) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

/** Longest run of consecutive completed days, over all history. */
export function longestStreak(done: Set<DayKey>): number {
  const sorted = [...done].sort()
  let best = 0
  let run = 0
  let prev: DayKey | null = null

  for (const day of sorted) {
    run = prev !== null && addDays(prev, 1) === day ? run + 1 : 1
    if (run > best) best = run
    prev = day
  }
  return best
}

export function computeStats(dates: DayKey[], end: DayKey = today()): Stats {
  const done = new Set(dates)
  return {
    current: currentStreak(done, end),
    longest: longestStreak(done),
    completedToday: done.has(end),
    last30: lastNDays(30, end).filter((d) => done.has(d)).length,
    total: done.size,
  }
}
