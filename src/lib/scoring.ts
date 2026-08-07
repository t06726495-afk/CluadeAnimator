import type { Direction, GuessResult, Heat } from '../types'

export const MAX_GUESSES = 5

/**
 * A guess inside 10% of the real figure solves the round.
 *
 * This is deliberately the same boundary as SCORCHING: the share grid needs yellow
 * (WARM) to be a reachable non-winning state, which it would not be if the solve
 * band were any wider. Change this one constant to retune difficulty.
 */
export const SOLVE_THRESHOLD = 0.1

/** Guess 4 onwards, the league-average hint is available. */
export const HINT_AFTER_GUESS = 3

export const MIN_GUESS = 1000
export const MAX_GUESS = 500_000_000

export function relativeError(guess: number, actual: number): number {
  if (actual === 0) return guess === 0 ? 0 : Infinity
  return Math.abs(guess - actual) / actual
}

export function heatFor(error: number): Heat {
  if (error <= 0.1) return 'scorching'
  if (error <= 0.25) return 'warm'
  if (error <= 0.5) return 'cool'
  if (error <= 1.0) return 'cold'
  return 'frozen'
}

export const HEAT_LABEL: Record<Heat, string> = {
  scorching: 'SCORCHING',
  warm: 'WARM',
  cool: 'COOL',
  cold: 'COLD',
  frozen: 'FROZEN',
}

export function directionFor(guess: number, actual: number): Direction {
  if (guess === actual) return 'exact'
  return guess < actual ? 'higher' : 'lower'
}

export function evaluate(guess: number, actual: number): GuessResult {
  const error = relativeError(guess, actual)
  return {
    value: guess,
    error,
    heat: heatFor(error),
    direction: directionFor(guess, actual),
    correct: error <= SOLVE_THRESHOLD,
  }
}

/**
 * Score rewards closeness and speed, in that order of weight.
 *
 *   solve bonus   400
 *   accuracy      0-600, linear inside the 10% solve band
 *   speed         80 per unused guess, counting the winning one
 *
 * So a solve in 2 with 4% error scores 1080; a solve in 2 with 9% error scores 780.
 * A bust scores a small consolation based on the closest guess made.
 */
export const MAX_SCORE = 1400

export function scoreRound(opts: {
  solved: boolean
  guessCount: number
  bestError: number
}): number {
  const { solved, guessCount, bestError } = opts
  if (!solved) {
    return Math.max(0, Math.round(200 * (1 - Math.min(1, bestError))))
  }
  const accuracy = Math.round(600 * (1 - Math.min(1, bestError / SOLVE_THRESHOLD)))
  const speed = (MAX_GUESSES + 1 - guessCount) * 80
  return 400 + accuracy + speed
}

/** Emoji square for the share grid. Blue = frozen/cold/cool, yellow = warm, green = solve. */
export function shareSquare(r: GuessResult): string {
  if (r.correct) return '🟩'
  if (r.heat === 'warm') return '🟨'
  return '🟦'
}
