# Dynasty Tracker

A local analytics dashboard for a College Football 27 dynasty save, built for a YouTube series. Photograph the stat screens on your TV, drop the photos into the app, and Claude (vision) reads the stats into your database. You review and confirm every extraction before it's saved, and the dashboard updates — dark broadcast-style theme with Stanford cardinal accents, made to be screen-recorded at 1080p+.

## Setup

```bash
npm install
cp .env.example .env      # then paste your Anthropic API key into .env
npm run seed              # optional: fill the app with a realistic demo season
npm run dev
```

`npm run dev` starts both the API (port 8787) and the web app, and prints the URL — open **http://localhost:5173**.

The API key lives only in `.env` and is only ever read by the Express backend. It is never sent to the browser. Screenshot extraction uses `claude-sonnet-4-6`; everything else works offline with no key at all.

All data lives in a single SQLite file at `data/dynasty.db` (created automatically). No cloud, no auth. **Export backup** in the sidebar downloads the whole database as JSON.

## Per-episode workflow

1. **Play your week** in CFB 27. Photograph the screens you care about on your TV: the box score, the player stats tables, standings/poll, your recruiting board. Angle and glare are fine — the extractor is prompted for TV photos.
2. **Import Stats** → pick the game (or week) the batch belongs to → drop all the photos at once. Each photo is classified (which screen is it?) and then extracted with a screen-specific prompt. Unreadable photos are flagged plainly — retake them straighter/closer.
3. **Review** each import: the photo sits on the left, the extracted values in editable tables on the right. Yellow rows were flagged low-confidence by the model — double-check those. Player names are fuzzy-matched against your roster; near-misses show a one-click "Use ⟨existing player⟩" suggestion so OCR typos don't create duplicates. Nothing touches the database until you hit **Confirm & Save**. (The raw extraction JSON is kept on the import forever, so a mis-confirm never loses data.)
4. **Recruiting**: update statuses on the board (status changes with a week set become timeline events automatically — your storyline beats), and hit **Snapshot** on the class-rank chart each week so the line grows over the season.
5. **Record**: hit **🎥 Stream mode** in the sidebar — nav chrome disappears and fonts bump up for capture. `Exit stream mode` is the faint button top-right.
6. **Offseason**: Players → **Offseason rollover** archives the season, bumps every class year, prompts you about graduating seniors, promotes committed/signed recruits onto the roster as freshmen, and starts the next season.

Every number in the app is editable after the fact — click a stat cell on a player page to fix it, or edit games/players/recruits inline.

## What imports where

| Screen you photograph | What confirming saves |
|---|---|
| Box score | Game score + result, team stat comparison |
| Player game stats | Per-player stat lines for the bound game |
| Standings / poll | Weekly conference rank, poll rank, records (movement arrows on the dashboard) |
| Schedule | Creates/updates the season's games |
| Player ratings | Weekly rating snapshots → development charts + growth badges |
| Recruiting board / recruit profile | Recruits upserted + weekly snapshots |
| Team / season stats | Team stat values on the bound game |

## Stack

Vite + React + TypeScript, Express, better-sqlite3 (single-file DB), Recharts, `@anthropic-ai/sdk` (backend only). Extraction is two-pass — a cheap classification call, then a targeted extraction prompt validated against zod schemas with one automatic retry on validation failure.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | API + web app together |
| `npm run seed` | Reset the DB and load the demo season (destructive!) |
| `npm run build` | Typecheck + production build |
