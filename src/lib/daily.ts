import { PLAYERS } from '../data/players'
import type { Mode, Player } from '../types'
import { MODE_BY_ID } from './modes'
import { seededShuffle } from './prng'

/**
 * Puzzle #1 is 2026-08-01. The date is read in UTC so that "today's puzzle" is the
 * same puzzle everywhere on earth at any given instant, rather than rolling over
 * timezone by timezone.
 */
export const LAUNCH_DATE_UTC = Date.UTC(2026, 7, 1)
const DAY_MS = 86400000

/** YYYY-MM-DD in UTC. */
export function dateKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10)
}

export function puzzleNumberFor(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  const ms = Date.UTC(y, m - 1, d)
  return Math.floor((ms - LAUNCH_DATE_UTC) / DAY_MS) + 1
}

export function msUntilNextPuzzle(now: Date = new Date()): number {
  const next = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0,
    0,
    0,
    0,
  )
  return next - now.getTime()
}

export function poolFor(mode: Mode, verifiedOnly: boolean): Player[] {
  const def = MODE_BY_ID[mode]
  let pool = def.sport === 'all' ? PLAYERS : PLAYERS.filter((p) => p.sport === def.sport)
  if (verifiedOnly) pool = pool.filter((p) => p.confidence !== 'low')
  // Sort by id so the pre-shuffle order never depends on file ordering or filter order.
  return pool.slice().sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
}

/**
 * The daily player.
 *
 * The pool is shuffled once per full cycle through it, so a player cannot repeat
 * until every other player in the mode has been used. Both the shuffle seed and the
 * index are derived from the puzzle number, which is derived from the UTC date —
 * no local state, no Math.random, identical in every browser.
 */
export function playerForPuzzle(
  mode: Mode,
  puzzleNo: number,
  verifiedOnly: boolean,
): Player | null {
  const pool = poolFor(mode, verifiedOnly)
  if (pool.length === 0) return null

  // Puzzle numbers before launch (or a device with a badly wrong clock) still resolve.
  const n = puzzleNo - 1
  const cycle = Math.floor(n / pool.length)
  const index = ((n % pool.length) + pool.length) % pool.length

  const shuffled = seededShuffle(pool, `payday|${mode}|cycle:${cycle}|v1`)
  return shuffled[index]
}

export function playerForDate(
  mode: Mode,
  dateStr: string,
  verifiedOnly: boolean,
): Player | null {
  return playerForPuzzle(mode, puzzleNumberFor(dateStr), verifiedOnly)
}
