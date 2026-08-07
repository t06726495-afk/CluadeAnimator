import { formatUSD } from '../lib/format'
import { HEAT_LABEL, MAX_GUESSES } from '../lib/scoring'
import type { GuessResult } from '../types'

/**
 * The guess history as an accountant's page: ruled rows, right-aligned monospace
 * figures, blank lines waiting to be filled.
 */
export default function Ledger({ results }: { results: GuessResult[] }) {
  const blanks = Math.max(0, MAX_GUESSES - results.length)

  return (
    <section className="ledger-book" aria-label="Guess history">
      <div className="ledger-book__head">
        <span>No.</span>
        <span>Entry</span>
        <span>Verdict</span>
      </div>

      {results.map((r, i) => (
        <div className="ledger-row" key={`${i}-${r.value}`}>
          <span className="ledger-row__no">{String(i + 1).padStart(2, '0')}</span>
          <span className="ledger-row__amount num">{formatUSD(r.value)}</span>
          <span className="ledger-row__verdict">
            {!r.correct && (
              <span className="arrow" aria-hidden="true">
                {r.direction === 'higher' ? '↑' : '↓'}
              </span>
            )}
            <span className={`verdict verdict--${r.correct ? 'scorching' : r.heat}`}>
              {r.correct ? 'PAID' : HEAT_LABEL[r.heat]}
            </span>
          </span>
          <span className="sr-only">
            {r.correct
              ? 'Correct.'
              : `Too ${r.direction === 'higher' ? 'low' : 'high'}. Aim ${r.direction}. ${HEAT_LABEL[r.heat]}.`}
          </span>
        </div>
      ))}

      {Array.from({ length: blanks }, (_, i) => (
        <div className="ledger-row ledger-row--empty" key={`blank-${i}`}>
          <span className="ledger-row__no">{String(results.length + i + 1).padStart(2, '0')}</span>
          <span className="ledger-row__amount num">— — —</span>
          <span />
        </div>
      ))}
    </section>
  )
}
