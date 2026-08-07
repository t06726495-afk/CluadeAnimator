import { useCallback, useRef, useState } from 'react'
import { formatCurrencyInput, formatUSD, parseCurrencyInput } from '../lib/format'
import { MAX_GUESS, MIN_GUESS } from '../lib/scoring'

type Props = {
  onSubmit: (value: number) => void
  guessesLeft: number
}

const ADJUSTMENTS: { label: string; factor: number }[] = [
  { label: '÷10', factor: 0.1 },
  { label: '÷2', factor: 0.5 },
  { label: '×2', factor: 2 },
  { label: '×10', factor: 10 },
]

/**
 * Salaries here span $14,560 to $46M, so a slider is useless. A text field that
 * formats as you type, plus multiplicative nudges, covers four orders of magnitude
 * in a couple of thumb taps.
 */
export default function GuessPad({ onSubmit, guessesLeft }: Props) {
  const [raw, setRaw] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const value = parseCurrencyInput(raw)

  const setValue = useCallback((n: number) => {
    const clamped = Math.min(MAX_GUESS, Math.max(1, Math.round(n)))
    setRaw(formatCurrencyInput(String(clamped)))
    setError('')
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRaw(formatCurrencyInput(e.target.value))
    if (error) setError('')
  }

  const adjust = (factor: number) => {
    if (value === null) return
    setValue(value * factor)
    inputRef.current?.focus()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value === null) {
      setError('Enter an amount first.')
      return
    }
    if (value < MIN_GUESS) {
      setError(`Nobody was paid less than ${formatUSD(MIN_GUESS)}. Try higher.`)
      return
    }
    if (value > MAX_GUESS) {
      setError(`Cap is ${formatUSD(MAX_GUESS)}.`)
      return
    }
    onSubmit(value)
    setRaw('')
    setError('')
  }

  return (
    <form className="pad" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="guess">
        Your guess at the annual salary in US dollars
      </label>
      <div className="pad__field">
        <input
          id="guess"
          ref={inputRef}
          className="pad__input num"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
          placeholder="$0"
          value={raw}
          onChange={handleChange}
        />
        <button type="submit" className="pad__submit" disabled={value === null}>
          Guess
        </button>
      </div>

      <div className="pad__adjust">
        {ADJUSTMENTS.map(({ label, factor }) => (
          <button
            key={label}
            type="button"
            onClick={() => adjust(factor)}
            disabled={value === null}
            aria-label={`Multiply guess by ${factor}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="pad__error" role="alert">
        {error}
      </div>
      <div className="pad__counter">
        {guessesLeft} {guessesLeft === 1 ? 'guess' : 'guesses'} left
      </div>
    </form>
  )
}
