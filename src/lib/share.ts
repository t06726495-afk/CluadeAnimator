import type { GuessResult, Mode } from '../types'
import { MODE_BY_ID } from './modes'
import { MAX_GUESSES, shareSquare } from './scoring'

/** Change this when the real domain is live. It is the only place the URL appears. */
export const SHARE_URL = 'payday.game'

/**
 * PAYDAY #47 ⚾ The Diamond
 * 🟦🟦🟨🟩 4/5
 * payday.game
 *
 * Emoji only. No figures, no player, no era — nothing that spoils the puzzle.
 */
export function buildShareText(opts: {
  puzzleNo: number
  mode: Mode
  results: GuessResult[]
  solved: boolean
}): string {
  const { puzzleNo, mode, results, solved } = opts
  const def = MODE_BY_ID[mode]

  const squares = results.map(shareSquare).join('')
  const grid = solved ? squares : `${squares}❌`
  const tally = solved ? `${results.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`

  return [`PAYDAY #${puzzleNo} ${def.emoji} ${def.title}`, `${grid} ${tally}`, SHARE_URL].join('\n')
}

/** Clipboard API first, then a hidden-textarea fallback for older mobile Safari. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through to the legacy path */
  }

  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.top = '-1000px'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    ta.setSelectionRange(0, ta.value.length)
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}
