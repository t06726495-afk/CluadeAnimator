import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { playerForPuzzle } from '../lib/daily'
import { MODE_BY_ID } from '../lib/modes'
import { MAX_GUESSES, evaluate, scoreRound } from '../lib/scoring'
import { effectiveStreak, loadRound, loadStats, recordResult, saveRound } from '../lib/storage'
import type { Mode, ModeStats, RoundStatus, Settings } from '../types'
import CheckReveal from './CheckReveal'
import DevPanel from './DevPanel'
import GuessPad from './GuessPad'
import Hint from './Hint'
import Ledger from './Ledger'
import PlayerDossier from './PlayerDossier'
import ShareBar from './ShareBar'

type Props = {
  mode: Mode
  puzzleNo: number
  settings: Settings
  onExit: () => void
  onSettingsChange: (patch: Partial<Settings>) => void
}

export default function Game({ mode, puzzleNo, settings, onExit, onSettingsChange }: Props) {
  const def = MODE_BY_ID[mode]
  const player = useMemo(
    () => playerForPuzzle(mode, puzzleNo, settings.verifiedOnly),
    [mode, puzzleNo, settings.verifiedOnly],
  )

  const [guesses, setGuesses] = useState<number[]>([])
  const [hintShown, setHintShown] = useState(false)
  const [stats, setStats] = useState<ModeStats>(() => loadStats(mode))
  const [restored, setRestored] = useState(false)
  const recorded = useRef(false)

  // Rehydrate an in-progress (or already finished) round for this exact puzzle.
  useEffect(() => {
    if (!player) return
    const saved = loadRound(mode, puzzleNo, player.id)
    if (saved) {
      setGuesses(saved.guesses)
      if (saved.status !== 'playing') recorded.current = true
    }
    setRestored(true)
  }, [mode, puzzleNo, player])

  const results = useMemo(
    () => (player ? guesses.map((g) => evaluate(g, player.salaryUSD)) : []),
    [guesses, player],
  )

  const solved = results.some((r) => r.correct)
  const status: RoundStatus = solved
    ? 'won'
    : guesses.length >= MAX_GUESSES
      ? 'lost'
      : 'playing'

  const bestError = results.length ? Math.min(...results.map((r) => r.error)) : 1
  const score = useMemo(
    () =>
      status === 'playing'
        ? 0
        : scoreRound({ solved, guessCount: guesses.length, bestError }),
    [status, solved, guesses.length, bestError],
  )

  // Persist progress, then fold a finished round into the mode's stats exactly once.
  useEffect(() => {
    if (!player || !restored) return
    saveRound(mode, { puzzleNo, playerId: player.id, guesses, status, score })
    if (status !== 'playing' && !recorded.current) {
      recorded.current = true
      setStats(recordResult(mode, puzzleNo, solved, guesses.length, score))
    }
  }, [mode, puzzleNo, player, guesses, status, score, solved, restored])

  const submitGuess = useCallback(
    (value: number) => {
      if (status !== 'playing') return
      setGuesses((prev) => (prev.length >= MAX_GUESSES ? prev : [...prev, value]))
    },
    [status],
  )

  if (!player) {
    return (
      <main>
        <TopBar def={def} puzzleNo={puzzleNo} onExit={onExit} />
        <p style={{ marginTop: 24 }}>
          No players are available in this mode with the current filter. Turn off
          &ldquo;verified data only&rdquo; in the dev panel to play.
        </p>
        <DevPanel settings={settings} onChange={onSettingsChange} />
      </main>
    )
  }

  const hintAvailable = guesses.length >= 3 && status === 'playing'

  return (
    <main>
      <TopBar def={def} puzzleNo={puzzleNo} onExit={onExit} />

      <PlayerDossier player={player} revealed={status !== 'playing'} />

      <Ledger results={results} />

      {status === 'playing' && (
        <>
          <Hint
            player={player}
            available={hintAvailable}
            shown={hintShown}
            onReveal={() => setHintShown(true)}
            guessesMade={guesses.length}
          />
          <GuessPad onSubmit={submitGuess} guessesLeft={MAX_GUESSES - guesses.length} />
        </>
      )}

      {status !== 'playing' && (
        <>
          <CheckReveal
            player={player}
            puzzleNo={puzzleNo}
            solved={solved}
            score={score}
            guessCount={guesses.length}
            bestError={bestError}
          />
          <ShareBar puzzleNo={puzzleNo} mode={mode} results={results} solved={solved} />
          <StatsStrip stats={stats} puzzleNo={puzzleNo} />
          <button type="button" className="text-btn" onClick={onExit}>
            ← Back to all five modes
          </button>
        </>
      )}

      <DevPanel
        settings={settings}
        onChange={onSettingsChange}
        answer={player.salaryUSD}
        playerId={player.id}
      />
    </main>
  )
}

function TopBar({
  def,
  puzzleNo,
  onExit,
}: {
  def: (typeof MODE_BY_ID)[Mode]
  puzzleNo: number
  onExit: () => void
}) {
  return (
    <div className="game-bar">
      <button type="button" className="game-bar__back" onClick={onExit}>
        ← Modes
      </button>
      <span className="game-bar__mode">
        {def.emoji} {def.title}
      </span>
      <span className="game-bar__no num">#{puzzleNo}</span>
    </div>
  )
}

function StatsStrip({ stats, puzzleNo }: { stats: ModeStats; puzzleNo: number }) {
  const winRate = stats.played ? Math.round((stats.wins / stats.played) * 100) : 0
  const avgScore = stats.played ? Math.round(stats.totalScore / stats.played) : 0
  return (
    <div className="stats-strip">
      <Cell n={stats.played} label="played" />
      <Cell n={`${winRate}%`} label="solved" />
      <Cell n={effectiveStreak(stats, puzzleNo)} label="streak" />
      <Cell n={avgScore} label="avg score" />
    </div>
  )
}

function Cell({ n, label }: { n: number | string; label: string }) {
  return (
    <div className="stats-strip__cell">
      <span className="stats-strip__n">{n}</span>
      <span className="stats-strip__label">{label}</span>
    </div>
  )
}
