import { useState } from 'react'
import { PLAYERS } from '../data/players'
import { formatUSD } from '../lib/format'
import { MODES } from '../lib/modes'
import { resetEverything } from '../lib/storage'
import type { Settings } from '../types'

type Props = {
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
  answer?: number
  playerId?: string
}

/**
 * Dev-only. Reachable at ?dev=1 (the flag then persists in localStorage), so it never
 * appears for an ordinary player. The verified-only toggle is the point of it: it lets
 * the low-confidence entries be excluded from selection while they are being checked.
 */
export default function DevPanel({ settings, onChange, answer, playerId }: Props) {
  const [peek, setPeek] = useState(false)
  if (!settings.devUnlocked) return null

  const low = PLAYERS.filter((p) => p.confidence === 'low').length
  const verified = PLAYERS.length - low

  return (
    <section className="dev">
      <div className="dev__head">Dev panel</div>

      <div className="dev__row">
        <input
          id="verified-only"
          type="checkbox"
          checked={settings.verifiedOnly}
          onChange={(e) => onChange({ verifiedOnly: e.target.checked })}
        />
        <label htmlFor="verified-only">
          Verified data only &mdash; exclude <code>confidence: &lsquo;low&rsquo;</code>
        </label>
      </div>

      <p className="dev__note">
        {verified} entries rated high/medium, {low} rated low. With the filter on, the
        daily selection draws from the {verified} verified entries only &mdash; which
        changes today&rsquo;s puzzle, by design.
      </p>

      {answer !== undefined && (
        <>
          <div className="dev__row">
            <label htmlFor="peek">Reveal today&rsquo;s answer</label>
            <input
              id="peek"
              type="checkbox"
              checked={peek}
              onChange={(e) => setPeek(e.target.checked)}
            />
          </div>
          {peek && (
            <p className="dev__note">
              <span className="dev__answer num">{formatUSD(answer)}</span>{' '}
              <code>{playerId}</code>
            </p>
          )}
        </>
      )}

      <div className="dev__row">
        <button
          type="button"
          className="dev__danger"
          onClick={() => {
            if (window.confirm('Wipe all streaks, history and in-progress rounds?')) {
              resetEverything(MODES.map((m) => m.id))
              window.location.reload()
            }
          }}
        >
          Reset all progress
        </button>
      </div>

      <div className="dev__row">
        <button
          type="button"
          className="text-btn"
          onClick={() => onChange({ devUnlocked: false })}
        >
          Hide dev panel
        </button>
      </div>
    </section>
  )
}
