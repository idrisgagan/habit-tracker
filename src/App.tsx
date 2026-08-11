import { useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { HabitRow } from './components/HabitRow'
import { formatDay, today } from './lib/dates'
import { useHabits } from './lib/useHabits'

type Tab = 'today' | 'dashboard'

export default function App() {
  const { habits, completions, addHabit, removeHabit, toggle } = useHabits()
  const [tab, setTab] = useState<Tab>('today')
  const [draft, setDraft] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    addHabit(draft)
    setDraft('')
  }

  return (
    <div className="app">
      <header>
        <div>
          <h1>Habits</h1>
          <p className="date">{formatDay(today())}</p>
        </div>
        <nav className="tabs">
          <button className={tab === 'today' ? 'on' : ''} onClick={() => setTab('today')}>
            Today
          </button>
          <button className={tab === 'dashboard' ? 'on' : ''} onClick={() => setTab('dashboard')}>
            Dashboard
          </button>
        </nav>
      </header>

      {tab === 'today' ? (
        <main>
          <form className="add" onSubmit={submit}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a daily habit…"
              aria-label="New habit name"
            />
            <button type="submit" disabled={!draft.trim()}>
              Add
            </button>
          </form>

          {habits.length === 0 ? (
            <p className="empty">No habits yet. Add one above to start a streak.</p>
          ) : (
            <ul className="habits">
              {habits.map((habit) => (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  dates={completions[habit.id] ?? []}
                  onToggle={() => toggle(habit.id)}
                  onRemove={() => removeHabit(habit.id)}
                />
              ))}
            </ul>
          )}
        </main>
      ) : habits.length === 0 ? (
        <p className="empty">Nothing to chart yet — add a habit on the Today tab.</p>
      ) : (
        <Dashboard habits={habits} completions={completions} onToggle={toggle} />
      )}
    </div>
  )
}
