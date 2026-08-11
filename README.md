# Habit Tracker

Local-first daily habit tracker. React + TypeScript + Vite, persisted to `localStorage`.
No server, no accounts, no network calls.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production bundle
```

## Structure

```
src/
  lib/dates.ts      local-time YYYY-MM-DD keys, DST-safe date math
  lib/streaks.ts    pure streak + stats computation
  lib/useHabits.ts  state + persistence (the only storage seam)
  lib/types.ts      Habit / HabitState
  components/       HabitRow (today), Dashboard (overview + heatmap)
```

## Design decisions

**Days are local calendar keys, not timestamps.** A habit done at 11pm and one
done at 1am are different days to the user. Timestamps get this wrong across
timezones and DST; `YYYY-MM-DD` built from local getters does not.

**An unfinished today does not break your streak.** The current streak counts
back from today, but starts at yesterday if today isn't done yet. Otherwise
every streak would appear to reset each morning before you'd had a chance to act
on it. It only breaks once yesterday is missed too.

**Storage is one file.** All reads and writes go through `useHabits`. Swapping
`localStorage` for an API means rewriting that file and nothing else.

## Data

Everything lives under the `habit-tracker:v1` key in `localStorage`, scoped to
the browser and origin. Clearing site data wipes your history; there is no sync
or backup yet.

To reset:

```js
localStorage.removeItem('habit-tracker:v1')
```

## Not built yet

Export/import, per-habit schedules (weekdays only, 3x/week), reminders,
multi-device sync, and editing a habit's name from the UI (`renameHabit` exists
in the hook but isn't wired up).
