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

## Starting your dynasty

The very first time you open the app (empty database, no `npm run seed`), you land on a **Start Season** screen instead of a dashboard:

1. Pick your team — start typing and any FBS school autocompletes (e.g. "No" → Notre Dame). Your school's colors become the app's accent color everywhere, replacing the default cardinal.
2. Lay in your full schedule for the season — opponent (autocomplete again) and home/away for each week. You can always add, edit, or fix a game later on the Games page.

Your first season is always year **2026**. From then on the sidebar footer shows a strip of every season you've played (click any year to go look at it) and, once you're viewing the current season, a **Next season →** button.

## Per-episode workflow

1. **Play your week** in CFB 27. Photograph the screens you care about on your TV: the box score, the player stats tables, standings/poll, your recruiting board. Angle and glare are fine — the extractor is prompted for TV photos.
2. **Import Stats** → pick the game (or week) the batch belongs to → drop all the photos at once. Each photo is classified (which screen is it?) and then extracted with a screen-specific prompt. Unreadable photos are flagged plainly — retake them straighter/closer.
3. **Review** each import: the photo sits on the left, the extracted values in editable tables on the right. Yellow rows were flagged low-confidence by the model — double-check those. Player names are fuzzy-matched against your roster; near-misses show a one-click "Use ⟨existing player⟩" suggestion so OCR typos don't create duplicates. Nothing touches the database until you hit **Confirm & Save**. (The raw extraction JSON is kept on the import forever, so a mis-confirm never loses data.)
4. **Recruiting**: update statuses on the board (status changes with a week set become timeline events automatically — your storyline beats). Competing schools autocomplete the same way as the team picker, and archetype options narrow to whatever's valid for the position you picked.
5. **Record**: hit **🎥 Stream mode** in the sidebar — nav chrome disappears and fonts bump up for capture. `Exit stream mode` is the faint button top-right.
6. **Offseason** — click **Next season →** at the bottom of the sidebar (only shown while viewing your current season):
   - **Who stayed?** — every active player, checked by default to return; seniors start unchecked (graduating). Uncheck anyone else who transferred out or left early. Everyone still checked gets bumped a class year, and any committed/signed recruits join the roster as freshmen.
   - **Next year's schedule** — same schedule builder as the start screen, for the upcoming season.

Every number in the app is editable after the fact — click a stat cell on a player page to fix it, or edit games/players/recruits inline. Player overall ratings are tracked **year over year** (development page chart), matching how the game actually progresses players in the offseason rather than week to week.

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
