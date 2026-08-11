import type { DayKey } from './dates'

export type Habit = {
  id: string
  name: string
  color: string
  createdAt: DayKey
}

export type HabitState = {
  habits: Habit[]
  /** habit id -> completed day keys. */
  completions: Record<string, DayKey[]>
}

export const HABIT_COLORS = [
  '#4f8ff7',
  '#2fb886',
  '#e0a336',
  '#d6604a',
  '#9b6ef3',
  '#3fb6c8',
] as const
