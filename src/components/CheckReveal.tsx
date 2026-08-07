import { CPI_BASE_YEAR, inflate, inflationMultiple } from '../data/cpi'
import { amountInWords, formatCompactUSD, formatUSD, seasonLabel } from '../lib/format'
import { MAX_SCORE } from '../lib/scoring'
import type { Player } from '../types'

type Props = {
  player: Player
  puzzleNo: number
  solved: boolean
  score: number
  guessCount: number
  bestError: number
}

/**
 * The card resolves into a printed paycheck. Not a modal, not a toast — an actual
 * check, printed on safety paper, stamped by the bank.
 */
export default function CheckReveal({
  player,
  puzzleNo,
  solved,
  score,
  guessCount,
  bestError,
}: Props) {
  const today = inflate(player.salaryUSD, player.season)
  const multiple = inflationMultiple(player.season)
  const errPct = Math.round(bestError * 1000) / 10

  return (
    <section className="reveal">
      <div className={`reveal__verdict reveal__verdict--${solved ? 'won' : 'lost'}`}>
        <span className="reveal__verdict-text">
          {solved ? 'Paid in full' : 'Returned unpaid'}
        </span>
        <span className="reveal__score">
          Score <b className="num">{score}</b>
          <span className="num" style={{ opacity: 0.55 }}>
            /{MAX_SCORE}
          </span>
        </span>
      </div>

      <p className="source-note" style={{ marginTop: 6 }}>
        {solved
          ? `Solved in ${guessCount} — closest guess was ${errPct}% off.`
          : `Five guesses, closest was ${errPct}% off.`}
      </p>

      <article className="check guilloche" aria-label="The paycheck">
        <div className="check__inner">
          <header className="check__head">
            <div className="check__bank">
              First Ledger Trust
              <small>Payroll division · {player.league}</small>
            </div>
            <div className="check__no">
              No.
              <b className="num">{String(puzzleNo).padStart(4, '0')}</b>
              <span className="num">{seasonLabel(player)}</span>
            </div>
          </header>

          <div className="check__payee">
            <div className="check__payee-label">Pay to the order of</div>
            <div className="check__payee-name">{player.name}</div>
          </div>

          <div className="check__amount-row">
            <div className="check__amount-box num">{formatUSD(player.salaryUSD)}</div>
          </div>

          <div className="check__words">
            <div className="check__words-text">{amountInWords(player.salaryUSD)}</div>
            <div className="check__words-unit">Dollars</div>
          </div>

          <div className="check__foot">
            <div className="check__memo">
              <div className="check__memo-label">Memo</div>
              <div className="check__memo-text">
                {player.team} &mdash; {seasonLabel(player)} season
              </div>
            </div>
            <div className="check__sig">
              <div className="check__sig-mark">{player.team}</div>
              <div className="check__sig-label">Authorised signature</div>
            </div>
          </div>

          <div className="check__micr num" aria-hidden="true">
            ⑆{String(player.season).padStart(4, '0')}0{player.sport.toUpperCase()}⑆{' '}
            {String(Math.round(player.salaryUSD)).padStart(9, '0')}⑈
          </div>
        </div>

        <div className="check__stamp" aria-hidden="true">
          ≈ {formatCompactUSD(today)} today
          <small>
            {multiple >= 1.05 ? `${multiple.toFixed(1)}× · ` : ''}
            {CPI_BASE_YEAR} dollars
          </small>
        </div>
      </article>

      <p className="sr-only">
        {player.name} earned {formatUSD(player.salaryUSD)} in {seasonLabel(player)}, worth about{' '}
        {formatUSD(today)} in {CPI_BASE_YEAR} dollars.
      </p>

      <p className="context-note">{player.contextNote}</p>

      <p className="source-note">
        <b>Source</b>
        <span className={`confidence-flag confidence-flag--${player.confidence}`}>
          {player.confidence} confidence
        </span>
        <br />
        {player.source}
        <br />
        Inflation adjusted with CPI-U (BLS), {player.season} → {CPI_BASE_YEAR}.
      </p>
    </section>
  )
}
