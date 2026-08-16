# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b (typecheck) + vite build
npm run preview  # serve the built bundle
```

There is no test runner, linter, or CI. `npm run build` is the only automated
check — it typechecks the whole project via `tsc -b`.

## Architecture

Local-first habit tracker: React 19 + TypeScript + Vite. No server, no accounts,
no network calls. Everything persists to `localStorage` under `habit-tracker:v1`.

Data flows one way from a single hook:

- `src/lib/useHabits.ts` owns *all* state and persistence — `useState` seeded
  from `localStorage`, written back by a `useEffect` on every change. It is the
  only storage seam: swapping `localStorage` for an API means rewriting this file
  and nothing else. New mutations belong here, not in components.
- `src/lib/dates.ts` and `src/lib/streaks.ts` are pure and have no React
  dependency. `computeStats` is called per-habit during render.
- `src/App.tsx` holds the tab state and passes `habits`/`completions` down.
  `HabitRow` (today's toggle) and `Dashboard` (30-day heatmap) are presentational.

The state shape is `{ habits: Habit[], completions: Record<habitId, DayKey[]> }`.
Completions are stored as a sorted array of day keys per habit, keyed separately
from the habit list — `removeHabit` must delete from both.

## Invariants

These encode real bugs and deliberate decisions. Preserve them.

**Days are local `YYYY-MM-DD` keys, never timestamps.** A habit done at 11pm and
one done at 1am are different days to the user; timestamps get this wrong across
timezones and DST. `addDays` anchors its `Date` at midday (hour 12) specifically
so a DST transition cannot roll the result into the adjacent day.

**An unfinished today does not break a live streak.** `currentStreak` starts its
walk at yesterday when today isn't done, so streaks don't visibly reset every
morning before the user has acted. Any refactor of `streaks.ts` must keep this.

**`.grid` must stay `width: max-content; min-width: 100%`.** With `width: 100%`
the flex day-cells overflow the card and the now/best/rate columns get clipped
instead of scrolling — it renders as a glitch with no obvious cause. The 30-day
grid fits the 760px content width by a narrow margin (30 cells at 12px + 2px gap,
a 132px label column, three 44px numeric columns); widening any of those pushes
it back into horizontal scroll.

**`load()` tolerates partial payloads** rather than throwing or wiping history.
Keep that posture when the persisted shape changes — there is no export/import
and no backup, so a bad migration is unrecoverable data loss.

## State of the code

`renameHabit` is fully implemented in `useHabits` but wired to no UI.

Streak logic was verified against 12 cases (month boundaries, a leap day, gaps,
unsorted input, the 30/31-day window edge), but those tests ran from a scratch
directory and were never committed. Adding `vitest` and landing them is the
hardening step before touching `streaks.ts` again.

See `ROADMAP.md` for ranked next steps and their rationale.
