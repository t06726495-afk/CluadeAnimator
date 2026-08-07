import type { Player } from '../types'

const USD0 = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const GROUPED = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

export function formatUSD(n: number): string {
  return USD0.format(Math.round(n))
}

export function formatGrouped(n: number): string {
  return GROUPED.format(Math.round(n))
}

/** $1.2M / $540K / $14,560 — for tight spaces like the bank stamp and ledger. */
export function formatCompactUSD(n: number): string {
  const v = Math.round(n)
  if (v >= 1_000_000_000) return `$${trimZero(v / 1_000_000_000)}B`
  if (v >= 1_000_000) return `$${trimZero(v / 1_000_000)}M`
  if (v >= 10_000) return `$${trimZero(v / 1_000)}K`
  return formatUSD(v)
}

function trimZero(n: number): string {
  const s = n.toFixed(n < 10 ? 2 : 1)
  return s.replace(/\.?0+$/, '')
}

/** Strip everything that is not a digit. Used by the live-formatting input. */
export function digitsOnly(s: string): string {
  return s.replace(/[^\d]/g, '')
}

/** "1200000" -> "$1,200,000". Empty string in, empty string out. */
export function formatCurrencyInput(raw: string): string {
  const digits = digitsOnly(raw).replace(/^0+(?=\d)/, '')
  if (!digits) return ''
  return `$${GROUPED.format(Number(digits))}`
}

export function parseCurrencyInput(raw: string): number | null {
  const digits = digitsOnly(raw)
  if (!digits) return null
  const n = Number(digits)
  return Number.isFinite(n) ? n : null
}

// ─────────────────────────────────────────────────────────── amount in words

const ONES = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen',
]
const TENS = [
  '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety',
]
const SCALES: [number, string][] = [
  [1_000_000_000, 'billion'],
  [1_000_000, 'million'],
  [1_000, 'thousand'],
]

function underThousand(n: number): string {
  if (n < 20) return ONES[n]
  if (n < 100) {
    const t = TENS[Math.floor(n / 10)]
    const r = n % 10
    return r ? `${t}-${ONES[r]}` : t
  }
  const h = `${ONES[Math.floor(n / 100)]} hundred`
  const r = n % 100
  return r ? `${h} ${underThousand(r)}` : h
}

/** "Two hundred twenty thousand and 00/100" — the ruled line on a check. */
export function amountInWords(amount: number): string {
  const whole = Math.floor(Math.abs(amount))
  const cents = Math.round((Math.abs(amount) - whole) * 100)

  let remaining = whole
  const parts: string[] = []
  for (const [value, name] of SCALES) {
    if (remaining >= value) {
      const count = Math.floor(remaining / value)
      parts.push(`${underThousand(count)} ${name}`)
      remaining %= value
    }
  }
  if (remaining > 0 || parts.length === 0) parts.push(underThousand(remaining))

  const words = parts.join(' ')
  const centStr = String(cents).padStart(2, '0')
  return `${words.charAt(0).toUpperCase()}${words.slice(1)} and ${centStr}/100`
}

// ──────────────────────────────────────────────────────────────── season label

/** Leagues whose season sits inside one calendar year. */
const SINGLE_YEAR_LEAGUES = new Set(['MLS', 'NWSL', 'NASL'])

export function seasonLabel(p: Player): string {
  const spansYears =
    p.sport === 'nba' || (p.sport === 'soccer' && !SINGLE_YEAR_LEAGUES.has(p.league))
  if (!spansYears) return String(p.season)
  const next = String(p.season + 1).slice(-2)
  return `${p.season}-${next}`
}

export function eraOf(season: number): string {
  if (season < 1980) return 'Pre-1980'
  if (season < 2000) return '1980-1999'
  if (season < 2015) return '2000-2014'
  return '2015-present'
}

export function ordinalGuess(n: number): string {
  return ['first', 'second', 'third', 'fourth', 'fifth'][n - 1] ?? `${n}th`
}
