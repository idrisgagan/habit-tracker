# Roadmap

Ranked by what actually unblocks the most value, not by what's easiest.
See [README.md](README.md) for the design decisions already baked in.

## 1. Export / import JSON — do this first

**The problem it solves:** all habit history lives in `localStorage` under
`habit-tracker:v1`, scoped to one browser and one origin. Clearing site data,
switching browsers, or a profile reset wipes it with no recovery path. Git backs
up the *code*; nothing backs up the *data*. A rollback restores the app and
loses your streaks.

**Shape:** a download button that serialises `{habits, completions}` to a file,
and a file picker that validates and replaces state. Both go through
`useHabits`, so no other file changes.

**Cost:** ~30 lines. This is the cheapest meaningful insurance in the project
and the reason it outranks everything below.

**Watch out for:** import must validate before it overwrites — a malformed file
that half-applies is worse than a rejected one. Merge-vs-replace is a real
decision; replace is simpler and probably right, but say so in the UI.

## 2. Per-habit schedules

**The problem it solves:** every habit is currently daily. "Gym 3x a week" and
"weekdays only" are the normal cases, and treating a planned rest day as a
failure is the single thing that makes a tracker feel wrong and gets abandoned.

**Shape:** add a `schedule` field to `Habit` (`daily` | `weekdays` |
`{ timesPerWeek: n }`), and teach `computeStats` about it.

**Watch out for:** `currentStreak` walks back one calendar day at a time. It has
to skip days the habit wasn't *due*, which means the streak function needs the
habit's cadence, not just its completion dates — a signature change. For
`timesPerWeek`, "streak" stops meaning consecutive days at all and becomes
consecutive satisfied weeks. Decide what the number means before writing it.

## 3. Wire up habit renaming

`renameHabit` already exists in `useHabits` and is fully implemented — it's
simply not connected to any UI. Smallest real win in the list; probably an
inline edit on click in `HabitRow`.

## 4. Reminders / notifications

Requires the Notifications API and a permission prompt, and is only useful if
the tab is open or a service worker is registered. Meaningful scope jump.
Worth it only once 1–3 are in place.

## 5. Multi-device sync — deliberately last

**Why last:** it's the first feature that forces a backend, user accounts, and
auth, plus conflict resolution for two devices toggling the same day. That's a
different project with a different maintenance burden.

It buys nothing until you actually want this on your phone. Until then,
export/import (#1) covers the real fear — losing data — at a fraction of the
cost. Don't reach for sync as a backup strategy; that's #1's job.

## Traps for future changes

**The heatmap table's width is load-bearing.** `.grid` must stay
`width: max-content; min-width: 100%`. With `width: 100%` the flex day-cells
overflow the card and the now/best/rate columns get clipped instead of
scrolling — it looks like a rendering glitch and it is not obvious that the
table width is the cause. This was a real bug, caught only by looking at the
rendered page.

**The 30-day grid fits by a narrow margin.** 30 cells at 12px + 2px gap, a
132px label column, and three 44px numeric columns just fit the 760px content
width. Widening cells, the label column, or the window is what pushes it back
into horizontal scroll.

**Don't switch day keys to timestamps.** See the README — local `YYYY-MM-DD`
keys are deliberate, and `addDays` anchors at midday specifically so DST
transitions can't roll a date into the wrong day.

**An unfinished today must not break a live streak.** Also in the README. If you
refactor `currentStreak`, keep the case: streak counts back from *yesterday*
when today isn't done yet. There are tests for this behaviour worth restoring
into the repo — they currently live only outside it.

## Not carried over yet

The streak logic was verified against 12 cases (month boundaries, a leap day,
gaps, unsorted input, the exact 30/31-day window edge) but those tests were run
from a scratch directory and were never committed. Adding a real test runner
(`vitest`) and landing them is the obvious hardening step before touching
`streaks.ts` again.
