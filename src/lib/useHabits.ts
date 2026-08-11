import { useCallback, useEffect, useState } from 'react'
import { today, type DayKey } from './dates'
import { HABIT_COLORS, type Habit, type HabitState } from './types'

const STORAGE_KEY = 'habit-tracker:v1'

const EMPTY: HabitState = { habits: [], completions: {} }

function load(): HabitState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Partial<HabitState>
    // Tolerate partial/older payloads rather than wiping the user's history.
    return {
      habits: Array.isArray(parsed.habits) ? parsed.habits : [],
      completions: parsed.completions ?? {},
    }
  } catch {
    return EMPTY
  }
}

/**
 * All habit state lives here so persistence is a single seam: swapping
 * localStorage for an API means rewriting this file and nothing else.
 */
export function useHabits() {
  const [state, setState] = useState<HabitState>(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const addHabit = useCallback((name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setState((prev) => {
      const habit: Habit = {
        id: crypto.randomUUID(),
        name: trimmed,
        color: HABIT_COLORS[prev.habits.length % HABIT_COLORS.length],
        createdAt: today(),
      }
      return { ...prev, habits: [...prev.habits, habit] }
    })
  }, [])

  const removeHabit = useCallback((id: string) => {
    setState((prev) => {
      const { [id]: _removed, ...completions } = prev.completions
      return { habits: prev.habits.filter((h) => h.id !== id), completions }
    })
  }, [])

  const renameHabit = useCallback((id: string, name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setState((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => (h.id === id ? { ...h, name: trimmed } : h)),
    }))
  }, [])

  const toggle = useCallback((id: string, day: DayKey = today()) => {
    setState((prev) => {
      const done = prev.completions[id] ?? []
      const next = done.includes(day)
        ? done.filter((d) => d !== day)
        : [...done, day].sort()
      return { ...prev, completions: { ...prev.completions, [id]: next } }
    })
  }, [])

  return { ...state, addHabit, removeHabit, renameHabit, toggle }
}
