import { useMemo } from 'react'
import { MODES } from '../lib/modes'
import { PLAYERS } from '../data/players'
import { effectiveStreak, loadStats } from '../lib/storage'
import type { Mode, Settings } from '../types'
import DevPanel from './DevPanel'

type Props = {
  puzzleNo: number
  settings: Settings
  onPick: (mode: Mode) => void
  onSettingsChange: (patch: Partial<Settings>) => void
}

export default function ModeSelect({ puzzleNo, settings, onPick, onSettingsChange }: Props) {
  // Read once per render of the landing screen — cheap, and always current after a round.
  const rows = useMemo(
    () =>
      MODES.map((m) => {
        const stats = loadStats(m.id)
        return {
          def: m,
          streak: effectiveStreak(stats, puzzleNo),
          doneToday: stats.lastPuzzleNo === puzzleNo,
        }
      }),
    [puzzleNo],
  )

  const lowCount = PLAYERS.filter((p) => p.confidence === 'low').length

  return (
    <main>
      <header className="masthead">
        <h1 className="masthead__title">PAYDAY</h1>
        <div className="masthead__meta">
          No. {puzzleNo}
          <br />
          Daily
        </div>
      </header>
      <div className="masthead__rule" />

      <p className="subhead" style={{ marginTop: 14 }}>
        Guess what they actually earned.
      </p>

      <ul className="modes">
        {rows.map(({ def, streak, doneToday }) => (
          <li key={def.id}>
            <button
              type="button"
              className={`mode-card${doneToday ? ' mode-card--done' : ''}`}
              onClick={() => onPick(def.id)}
            >
              <span className="mode-card__emoji" aria-hidden="true">
                {def.emoji}
              </span>
              <span>
                <span className="mode-card__title">{def.title}</span>
                <span className="mode-card__league">{def.league}</span>
                <span className="mode-card__blurb">{def.blurb}</span>
              </span>
              <span className="mode-card__streak">
                <span className="mode-card__streak-n num">{streak}</span>
                <span className="mode-card__streak-label">
                  {doneToday ? 'played' : 'streak'}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <DevPanel settings={settings} onChange={onSettingsChange} />

      <footer className="colophon">
        <p>
          One puzzle per mode per day, the same for everyone, rolling over at midnight UTC.
          Five guesses. Salaries are nominal — what the contract actually paid that season,
          before the reveal converts it to today&rsquo;s money.
        </p>
        <p style={{ marginTop: 8 }}>
          {PLAYERS.length} salaries on file. {lowCount} are flagged low-confidence and listed
          in NEEDS_VERIFICATION.md.
        </p>
      </footer>
    </main>
  )
}
