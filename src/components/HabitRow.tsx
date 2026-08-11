import { useState } from 'react'
import { computeStats } from '../lib/streaks'
import type { DayKey } from '../lib/dates'
import type { Habit } from '../lib/types'

type Props = {
  habit: Habit
  dates: DayKey[]
  onToggle: () => void
  onRemove: () => void
}

export function HabitRow({ habit, dates, onToggle, onRemove }: Props) {
  const [confirming, setConfirming] = useState(false)
  const stats = computeStats(dates)

  return (
    <li className="habit-row" style={{ '--habit': habit.color } as React.CSSProperties}>
      <button
        className={`check ${stats.completedToday ? 'checked' : ''}`}
        onClick={onToggle}
        aria-pressed={stats.completedToday}
        aria-label={`Mark ${habit.name} ${stats.completedToday ? 'incomplete' : 'complete'} for today`}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <polyline points="5 13 10 18 19 6" />
        </svg>
      </button>

      <div className="habit-main">
        <span className={`habit-name ${stats.completedToday ? 'done' : ''}`}>{habit.name}</span>
        <span className="habit-sub">
          {stats.last30}/30 days &middot; best {stats.longest}
        </span>
      </div>

      <span className={`streak ${stats.current > 0 ? 'live' : ''}`} title="Current streak">
        <span className="flame" aria-hidden="true">
          {stats.current > 0 ? '🔥' : '·'}
        </span>
        {stats.current}
      </span>

      {confirming ? (
        <span className="confirm">
          <button className="danger" onClick={onRemove}>
            Delete
          </button>
          <button className="ghost" onClick={() => setConfirming(false)}>
            Cancel
          </button>
        </span>
      ) : (
        <button
          className="ghost remove"
          onClick={() => setConfirming(true)}
          aria-label={`Delete ${habit.name}`}
        >
          ×
        </button>
      )}
    </li>
  )
}
