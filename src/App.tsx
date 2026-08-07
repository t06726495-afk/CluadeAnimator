import { useCallback, useEffect, useMemo, useState } from 'react'
import Game from './components/Game'
import ModeSelect from './components/ModeSelect'
import { dateKey, puzzleNumberFor } from './lib/daily'
import { loadSettings, saveSettings } from './lib/storage'
import type { Mode, Settings } from './types'

/** ?dev=1 turns on the settings panel. It is off for everyone else. */
function devRequested(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('dev') === '1'
}

export default function App() {
  const [mode, setMode] = useState<Mode | null>(null)
  const [settings, setSettings] = useState<Settings>(() => {
    const stored = loadSettings()
    return { ...stored, devUnlocked: stored.devUnlocked || devRequested() }
  })

  // A tab left open overnight should not keep serving yesterday's puzzle.
  const [today, setToday] = useState(() => dateKey())
  useEffect(() => {
    const id = window.setInterval(() => {
      const now = dateKey()
      setToday((prev) => (prev === now ? prev : now))
    }, 30_000)
    return () => window.clearInterval(id)
  }, [])

  const puzzleNo = useMemo(() => puzzleNumberFor(today), [today])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      saveSettings(next)
      return next
    })
  }, [])

  useEffect(() => {
    document.title = mode ? 'PAYDAY — today\'s check' : 'PAYDAY — guess the salary'
  }, [mode])

  return (
    <div className="shell">
      {mode === null ? (
        <ModeSelect
          puzzleNo={puzzleNo}
          settings={settings}
          onPick={setMode}
          onSettingsChange={updateSettings}
        />
      ) : (
        <Game
          key={`${mode}:${puzzleNo}:${settings.verifiedOnly}`}
          mode={mode}
          puzzleNo={puzzleNo}
          settings={settings}
          onExit={() => setMode(null)}
          onSettingsChange={updateSettings}
        />
      )}
    </div>
  )
}
