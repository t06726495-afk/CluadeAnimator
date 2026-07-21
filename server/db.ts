import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

export const db: Database.Database = new Database(path.join(DATA_DIR, 'dynasty.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS dynasty (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  team_name TEXT NOT NULL,
  primary_color TEXT NOT NULL,
  secondary_color TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS seasons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER NOT NULL,
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  archived INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  week INTEGER NOT NULL,
  opponent TEXT NOT NULL,
  home INTEGER NOT NULL DEFAULT 1,
  our_score INTEGER,
  opp_score INTEGER,
  result TEXT,
  notes TEXT
);
CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  class_year TEXT NOT NULL DEFAULT 'FR',
  archetype TEXT,
  dev_trait TEXT,
  jersey INTEGER,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS player_game_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  stat_category TEXT NOT NULL,
  stats TEXT NOT NULL DEFAULT '{}',
  UNIQUE(player_id, game_id, stat_category)
);
CREATE TABLE IF NOT EXISTS player_rating_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  week INTEGER NOT NULL,
  overall INTEGER,
  attributes TEXT NOT NULL DEFAULT '{}',
  UNIQUE(player_id, season_id, week)
);
CREATE TABLE IF NOT EXISTS team_game_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL UNIQUE REFERENCES games(id) ON DELETE CASCADE,
  stats TEXT NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS standings_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  week INTEGER NOT NULL,
  conf_rank INTEGER,
  poll_rank INTEGER,
  conf_record TEXT,
  overall_record TEXT,
  raw TEXT NOT NULL DEFAULT '{}',
  UNIQUE(season_id, week)
);
CREATE TABLE IF NOT EXISTS recruits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  stars INTEGER,
  national_rank INTEGER,
  position_rank INTEGER,
  state TEXT,
  archetype TEXT,
  dev_trait TEXT,
  status TEXT NOT NULL DEFAULT 'scouting',
  competitors TEXT,
  hours_spent REAL,
  notes TEXT
);
CREATE TABLE IF NOT EXISTS recruit_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recruit_id INTEGER NOT NULL REFERENCES recruits(id) ON DELETE CASCADE,
  week INTEGER NOT NULL,
  status TEXT,
  national_rank INTEGER,
  hours_spent REAL
);
CREATE TABLE IF NOT EXISTS class_rank_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  week INTEGER NOT NULL,
  rank INTEGER,
  commit_count INTEGER,
  UNIQUE(season_id, week)
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  week INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS position_needs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  position TEXT NOT NULL,
  target_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(season_id, position)
);
CREATE TABLE IF NOT EXISTS player_abilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('physical','mental')),
  name TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('bronze','silver','gold','platinum')),
  UNIQUE(player_id, name)
);
CREATE TABLE IF NOT EXISTS recruit_abilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recruit_id INTEGER NOT NULL REFERENCES recruits(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('physical','mental')),
  name TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('bronze','silver','gold','platinum')),
  UNIQUE(recruit_id, name)
);
CREATE TABLE IF NOT EXISTS imports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  season_id INTEGER REFERENCES seasons(id) ON DELETE SET NULL,
  week INTEGER,
  game_id INTEGER REFERENCES games(id) ON DELETE SET NULL,
  image_path TEXT NOT NULL,
  original_name TEXT,
  screen_type TEXT,
  status TEXT NOT NULL DEFAULT 'uploaded',
  classification TEXT,
  raw_extraction TEXT,
  error TEXT
);
`);

export function activeSeasonId(): number | null {
  const row = db.prepare('SELECT id FROM seasons WHERE active = 1 ORDER BY year DESC LIMIT 1').get() as { id: number } | undefined;
  return row?.id ?? null;
}
