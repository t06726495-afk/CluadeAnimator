import { formatUSD } from '../lib/format'
import { HINT_AFTER_GUESS } from '../lib/scoring'
import type { Player } from '../types'

type Props = {
  player: Player
  available: boolean
  shown: boolean
  onReveal: () => void
  guessesMade: number
}

/**
 * The hint is the league's average salary that season. It is a real assist and it
 * teaches the economics — most people's intuition breaks because they are anchored
 * on today's averages.
 */
export default function Hint({ player, available, shown, onReveal, guessesMade }: Props) {
  if (player.leagueAvgThatSeason === null) {
    if (!available) return null
    return (
      <div className="hint hint--locked">
        <div className="hint__label">League average · unavailable</div>
        <div className="hint__note">
          No trustworthy league-wide average exists for {player.league} in {player.season}.
          You are on your own for this one.
        </div>
      </div>
    )
  }

  if (!available) {
    const remaining = HINT_AFTER_GUESS - guessesMade
    return (
      <div className="hint hint--locked">
        <div className="hint__label">Hint locked</div>
        <div className="hint__note">
          The league average for that season unlocks after {remaining} more{' '}
          {remaining === 1 ? 'guess' : 'guesses'}.
        </div>
      </div>
    )
  }

  if (!shown) {
    return (
      <div className="hint">
        <div className="hint__label">Hint available</div>
        <button type="button" className="hint__unlock" onClick={onReveal}>
          Show the {player.league} average for {player.season} →
        </button>
      </div>
    )
  }

  return (
    <div className="hint">
      <div className="hint__label">
        {player.league} average salary, {player.season} (approx.)
      </div>
      <div className="hint__value num">{formatUSD(player.leagueAvgThatSeason)}</div>
      <div className="hint__note">
        League-wide mean, not median — a handful of enormous contracts drag it upward.
      </div>
    </div>
  )
}
