# PAYDAY

A daily guessing game. You get a real athlete, a real season, two or three stat lines,
and five guesses at what they actually earned. The hook is that historical salaries are
shockingly low and inflation makes everyone's intuition wrong.

Vite + React + TypeScript. No backend, no component library, no player photos.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # regenerates NEEDS_VERIFICATION.md, typechecks, builds to dist/
npm run preview  # serve the production build
npm run verify   # regenerate NEEDS_VERIFICATION.md on its own
```

## The five modes

| Mode | League | Entries |
| --- | --- | --- |
| The Diamond | MLB | 51 |
| The Hardwood | NBA | 42 |
| The Gridiron | NFL | 34 |
| The Pitch | World football | 39 |
| The Mixer | all four, shuffled | 166 |

Each mode keeps its own streak, history and in-progress round in `localStorage` under
`payday:v1:*`.

## Daily puzzle determinism

`src/lib/daily.ts` derives everything from the **UTC** date, so the same puzzle is live
everywhere on earth at any instant. `Math.random()` is never involved.

```
dateKey()        → "2026-08-07"           (UTC, not local)
puzzleNumberFor  → days since 2026-08-01, 1-indexed
playerForPuzzle  → seededShuffle(pool, `payday|${mode}|cycle:${n}|v1`)[index]
```

The pool is re-shuffled once per full cycle, so no player repeats until every other
player in that mode has been used. The PRNG is FNV-1a → mulberry32 (`src/lib/prng.ts`),
pure uint32 maths, identical in every engine.

Changing the launch date, or the `|v1` seed suffix, reshuffles every future puzzle.

## Rules

- **5 guesses.** A guess within **10%** solves the round.
- **Feedback** on every miss: direction (↑ HIGHER / ↓ LOWER) plus heat —
  WARM ≤25%, COOL ≤50%, COLD ≤100%, FROZEN beyond. SCORCHING (≤10%) *is* the solve.
- **Hint** after guess 3: that league's average salary that season.
- **Score** out of 1400 — 400 for solving, up to 600 for closeness inside the solve
  band, 80 per unused guess. A solve in 2 at 4% error scores 1080; the same solve at
  9% error scores 780.

One deliberate deviation from the brief: the brief's scoring example implies a solve
can carry 22% error, but the share legend requires yellow/WARM to be a *non-winning*
state. Those two can't both hold, so the solve band is 10% and `SOLVE_THRESHOLD` in
`src/lib/scoring.ts` is a one-line change if you want it wider.

## Share string

Emoji only, no spoilers. Blue = frozen/cold/cool, yellow = warm, green = solve.

```
PAYDAY #47 ⚾ The Diamond
🟦🟦🟨🟩 4/5
payday.game
```

A bust appends ❌ and reads `X/5`. The domain lives in one place: `SHARE_URL` in
`src/lib/share.ts`.

## Data

Everything is in `src/data/players.ts`. 166 entries across four sports, balanced across
four eras (pre-1980, 1980-1999, 2000-2014, 2015-present).

Every entry carries a `source` and a `confidence` rating. Nothing was invented to fill a
slot. Read [NEEDS_VERIFICATION.md](./NEEDS_VERIFICATION.md) before trusting any figure —
it is regenerated from the data on every build and lists all 55 low-confidence entries
with what needs checking.

Soccer wages reported weekly in GBP/EUR are annualised and converted to USD, with the
original figure and rate kept in `source`. None is rated above `medium`.

### Dev panel

Append `?dev=1` to the URL. Gives you a **verified data only** toggle that drops every
`confidence: 'low'` entry from the daily selection (111 entries remain, and today's
puzzle changes accordingly), an answer reveal, and a progress reset. The flag persists
in `localStorage` once set, and the panel has its own hide button.

## Design

Banking stationery: pay stubs, ledger books, check safety paper, bank stamps.

- **Palette** — safety-paper pale green, ledger off-white, ink black, faded bank-stamp
  red for misses, muted navy for cold feedback. No neon, no gradient accents.
- **Type, three faces with one job each** — Oswald (condensed, headers), Courier Prime
  (every number, ledger feel), Caveat (the check's payee and signature lines only).
  All self-hosted from `src/assets/fonts`, latin subsets, ~250KB total.
- **Structure** — the guess history is a ruled ledger page with right-aligned monospace
  figures. Everything stays quiet so the check reveal can be loud.

The check reveal animates in as a print/slide, then the bank stamp drops. Both are
disabled under `prefers-reduced-motion`.

## Deploying

Static build, no environment variables. `vercel.json` and `netlify.toml` are both
committed — point either host at the repo and it will build with `npm run build` and
serve `dist/`.

`dist/` is fully self-contained: no CDN, no external fonts, no network calls at
runtime. It needs to be served over HTTP (any static server will do — `npm run preview`,
`npx serve dist`, S3, GitHub Pages). Opening `dist/index.html` straight off the
filesystem does **not** work, because Chrome and Safari block ES modules over `file://`
— that is a browser rule, not something the build can opt out of.
