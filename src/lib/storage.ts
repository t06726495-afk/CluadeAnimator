import type { Mode, ModeStats, RoundState, Settings } from '../types'
import { MAX_GUESSES } from './scoring'

const PREFIX = 'payday:v1'
const statsKey = (mode: Mode) => `${PREFIX}:stats:${mode}`
const roundKey = (mode: Mode) => `${PREFIX}:round:${mode}`
const SETTINGS_KEY = `${PREFIX}:settings`

export const EMPTY_STATS: ModeStats = {
  played: 0,
  wins: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastPuzzleNo: null,
  totalScore: 0,
  distribution: [0, 0, 0, 0, 0, 0],
}

export const DEFAULT_SETTINGS: Settings = {
  verifiedOnly: false,
  devUnlocked: false,
}

/** Private-mode Safari and locked-down browsers throw on localStorage access. */
function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* storage unavailable — the game still plays, it just will not remember */
  }
}

function safeRemove(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* no-op */
  }
}

function readJSON<T>(key: string, fallback: T): T {
  const raw = safeGet(key)
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? { ...fallback, ...parsed } : fallback
  } catch {
    return fallback
  }
}

// ──────────────────────────────────────────────────────────── per-mode stats

export function loadStats(mode: Mode): ModeStats {
  const s = readJSON<ModeStats>(statsKey(mode), EMPTY_STATS)
  // Guard against a distribution array that was written by an older/edited build.
  if (!Array.isArray(s.distribution) || s.distribution.length !== 6) {
    return { ...s, distribution: [0, 0, 0, 0, 0, 0] }
  }
  return s
}

export function saveStats(mode: Mode, stats: ModeStats): void {
  safeSet(statsKey(mode), JSON.stringify(stats))
}

/**
 * Fold a finished round into a mode's stats. Idempotent per puzzle number, so a
 * refresh or a double-render cannot inflate a streak.
 */
export function recordResult(
  mode: Mode,
  puzzleNo: number,
  solved: boolean,
  guessCount: number,
  score: number,
): ModeStats {
  const prev = loadStats(mode)
  if (prev.lastPuzzleNo === puzzleNo) return prev

  const consecutive = prev.lastPuzzleNo === puzzleNo - 1
  const distribution = prev.distribution.slice()
  distribution[solved ? guessCount - 1 : MAX_GUESSES] += 1

  const currentStreak = solved ? (consecutive ? prev.currentStreak : 0) + 1 : 0

  const next: ModeStats = {
    played: prev.played + 1,
    wins: prev.wins + (solved ? 1 : 0),
    currentStreak,
    maxStreak: Math.max(prev.maxStreak, currentStreak),
    lastPuzzleNo: puzzleNo,
    totalScore: prev.totalScore + score,
    distribution,
  }
  saveStats(mode, next)
  return next
}

/**
 * A streak is only alive if the last result was yesterday or today. Without this,
 * a player who skipped a week would come back to a streak that reads as current.
 */
export function effectiveStreak(stats: ModeStats, todayPuzzleNo: number): number {
  if (stats.lastPuzzleNo === null) return 0
  return todayPuzzleNo - stats.lastPuzzleNo <= 1 ? stats.currentStreak : 0
}

// ─────────────────────────────────────────────────── in-progress round state

export function loadRound(mode: Mode, puzzleNo: number, playerId: string): RoundState | null {
  const raw = safeGet(roundKey(mode))
  if (!raw) return null
  try {
    const r = JSON.parse(raw) as RoundState
    if (r.puzzleNo !== puzzleNo || r.playerId !== playerId) return null
    if (!Array.isArray(r.guesses)) return null
    return r
  } catch {
    return null
  }
}

export function saveRound(mode: Mode, round: RoundState): void {
  safeSet(roundKey(mode), JSON.stringify(round))
}

// ────────────────────────────────────────────────────────────────── settings

export function loadSettings(): Settings {
  return readJSON<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS)
}

export function saveSettings(s: Settings): void {
  safeSet(SETTINGS_KEY, JSON.stringify(s))
}

export function resetEverything(modes: Mode[]): void {
  for (const m of modes) {
    safeRemove(statsKey(m))
    safeRemove(roundKey(m))
  }
}
