import { useEffect, useState } from 'react'
import { msUntilNextPuzzle } from '../lib/daily'
import { buildShareText, copyToClipboard } from '../lib/share'
import { MAX_GUESSES, shareSquare } from '../lib/scoring'
import type { GuessResult, Mode } from '../types'

type Props = {
  puzzleNo: number
  mode: Mode
  results: GuessResult[]
  solved: boolean
}

export default function ShareBar({ puzzleNo, mode, results, solved }: Props) {
  const [copied, setCopied] = useState(false)
  const text = buildShareText({ puzzleNo, mode, results, solved })

  useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 2200)
    return () => window.clearTimeout(id)
  }, [copied])

  const handleCopy = async () => {
    const ok = await copyToClipboard(text)
    setCopied(ok)
    if (!ok) window.prompt('Copy your result:', text)
  }

  return (
    <section className="share">
      <div className="share__grid" aria-hidden="true">
        {results.map(shareSquare).join('')}
        {solved ? '' : '❌'}{' '}
        <span style={{ fontSize: 14, letterSpacing: '0.08em' }}>
          {solved ? `${results.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`}
        </span>
      </div>

      <button
        type="button"
        className={`share__btn${copied ? ' share__btn--copied' : ''}`}
        onClick={handleCopy}
      >
        {copied ? 'Copied to clipboard' : 'Copy result'}
      </button>

      <Countdown />
    </section>
  )
}

function Countdown() {
  const [ms, setMs] = useState(() => msUntilNextPuzzle())

  useEffect(() => {
    const id = window.setInterval(() => setMs(msUntilNextPuzzle()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const total = Math.max(0, Math.floor(ms / 1000))
  const hh = String(Math.floor(total / 3600)).padStart(2, '0')
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const ss = String(total % 60).padStart(2, '0')

  return (
    <p className="next-drop">
      Next payday in{' '}
      <b>
        {hh}:{mm}:{ss}
      </b>
    </p>
  )
}
