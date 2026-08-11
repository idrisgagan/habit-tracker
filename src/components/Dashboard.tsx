import { formatDay, lastNDays, type DayKey } from '../lib/dates'
import { computeStats } from '../lib/streaks'
import type { Habit } from '../lib/types'

type Props = {
  habits: Habit[]
  completions: Record<string, DayKey[]>
  onToggle: (id: string, day: DayKey) => void
}

const WINDOW = 30

export function Dashboard({ habits, completions, onToggle }: Props) {
  const days = lastNDays(WINDOW)
  const stats = habits.map((h) => ({ habit: h, ...computeStats(completions[h.id] ?? []) }))

  const doneToday = stats.filter((s) => s.completedToday).length
  const bestActive = stats.reduce((max, s) => Math.max(max, s.current), 0)
  const rate = habits.length
    ? Math.round((stats.reduce((sum, s) => sum + s.last30, 0) / (habits.length * WINDOW)) * 100)
    : 0

  return (
    <section className="dashboard">
      <div className="tiles">
        <Tile label="Habits tracked" value={String(habits.length)} />
        <Tile
          label="Done today"
          value={`${doneToday}/${habits.length}`}
          accent={habits.length > 0 && doneToday === habits.length}
        />
        <Tile label="Best active streak" value={`${bestActive}d`} />
        <Tile label="30-day consistency" value={`${rate}%`} />
      </div>

      <div className="grid-head">
        <h2>Last 30 days</h2>
        <span className="hint">Click any square to backfill a day</span>
      </div>

      <div className="grid-scroll">
        <table className="grid">
          <tbody>
            {stats.map(({ habit, current, longest, last30 }) => {
              const done = new Set(completions[habit.id] ?? [])
              return (
                <tr key={habit.id} style={{ '--habit': habit.color } as React.CSSProperties}>
                  <th scope="row">
                    <span className="dot" aria-hidden="true" />
                    {habit.name}
                  </th>
                  <td className="cells">
                    {days.map((day) => (
                      <button
                        key={day}
                        className={`cell ${done.has(day) ? 'on' : ''}`}
                        onClick={() => onToggle(habit.id, day)}
                        title={`${habit.name} — ${formatDay(day)}`}
                        aria-label={`${habit.name} on ${formatDay(day)}: ${done.has(day) ? 'done' : 'not done'}`}
                      />
                    ))}
                  </td>
                  <td className="num">{current}</td>
                  <td className="num muted">{longest}</td>
                  <td className="num muted">{Math.round((last30 / WINDOW) * 100)}%</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" />
              <td className="axis">
                <span>{formatDay(days[0])}</span>
                <span>Today</span>
              </td>
              <td className="num label">now</td>
              <td className="num label">best</td>
              <td className="num label">rate</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  )
}

function Tile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`tile ${accent ? 'accent' : ''}`}>
      <span className="tile-value">{value}</span>
      <span className="tile-label">{label}</span>
    </div>
  )
}
