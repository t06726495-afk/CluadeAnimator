import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import path from 'node:path';
import { db, UPLOADS_DIR, activeSeasonId } from './db.js';
import { classifyImage, extractImage } from './claude.js';
import { confirmImport } from './confirm.js';
import { performanceScore, keyStatLine } from './score.js';
import type { ScreenType } from './schemas.js';

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}-${safe}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const asyncRoute =
  (fn: (req: express.Request, res: express.Response) => Promise<void> | void) =>
  async (req: express.Request, res: express.Response) => {
    try {
      await fn(req, res);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(400).json({ error: message });
    }
  };

// ---------- dynasty ----------

app.get('/api/dynasty', (_req, res) => {
  res.json(db.prepare('SELECT * FROM dynasty WHERE id = 1').get() ?? null);
});

// Starts the dynasty: pick a team + colors, create the first season (2026),
// and optionally lay in the full first-season schedule in one shot.
app.post('/api/dynasty', asyncRoute((req, res) => {
  if (db.prepare('SELECT id FROM dynasty WHERE id = 1').get()) {
    throw new Error('A dynasty already exists.');
  }
  const { team_name, primary_color, secondary_color, schedule } = req.body;
  if (!team_name) throw new Error('team_name is required');
  const tx = db.transaction(() => {
    db.prepare('INSERT INTO dynasty (id, team_name, primary_color, secondary_color) VALUES (1, ?, ?, ?)').run(
      team_name, primary_color || '#8c1515', secondary_color || '#ffffff'
    );
    const seasonInfo = db.prepare('INSERT INTO seasons (year, name, active) VALUES (2026, ?, 1)').run('2026 Season');
    const seasonId = Number(seasonInfo.lastInsertRowid);
    const insertGame = db.prepare('INSERT INTO games (season_id, week, opponent, home) VALUES (?, ?, ?, ?)');
    for (const g of (schedule ?? []) as Array<{ week: number; opponent: string; home: boolean }>) {
      if (!g.opponent) continue;
      insertGame.run(seasonId, g.week, g.opponent, g.home ? 1 : 0);
    }
    return seasonId;
  });
  tx();
  res.json(db.prepare('SELECT * FROM dynasty WHERE id = 1').get());
}));

app.put('/api/dynasty', asyncRoute((req, res) => {
  const { team_name, primary_color, secondary_color } = req.body;
  db.prepare('UPDATE dynasty SET team_name = ?, primary_color = ?, secondary_color = ? WHERE id = 1').run(
    team_name, primary_color, secondary_color
  );
  res.json(db.prepare('SELECT * FROM dynasty WHERE id = 1').get());
}));

// ---------- seasons ----------

app.get('/api/seasons', (_req, res) => {
  res.json(db.prepare('SELECT * FROM seasons ORDER BY year DESC').all());
});

app.post('/api/seasons/:id/activate', asyncRoute((req, res) => {
  db.prepare('UPDATE seasons SET active = 0').run();
  db.prepare('UPDATE seasons SET active = 1 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
}));

// Bulk-add games to a season — used by the schedule builder at the start of
// each season (initial dynasty setup and every "Next Season" transition).
app.post('/api/games/bulk', asyncRoute((req, res) => {
  const { season_id, games } = req.body as { season_id: number; games: Array<{ week: number; opponent: string; home: boolean }> };
  if (!season_id) throw new Error('season_id is required');
  const insert = db.prepare('INSERT INTO games (season_id, week, opponent, home) VALUES (?, ?, ?, ?)');
  const tx = db.transaction(() => {
    let count = 0;
    for (const g of games ?? []) {
      if (!g.opponent) continue;
      insert.run(season_id, g.week, g.opponent, g.home ? 1 : 0);
      count++;
    }
    return count;
  });
  res.json({ ok: true, created: tx() });
}));

// Offseason rollover: archive the finished season, deactivate anyone who
// didn't return (drafted early, transferred out, graduated), bump everyone
// else's class year, promote signed recruits to freshmen, and open the next
// season (year + 1).
app.post('/api/seasons/:id/rollover', asyncRoute((req, res) => {
  const season = db.prepare('SELECT * FROM seasons WHERE id = ?').get(req.params.id) as any;
  if (!season) throw new Error('Season not found');
  const departedIds: number[] = req.body?.departed_player_ids ?? [];
  const tx = db.transaction(() => {
    db.prepare('UPDATE seasons SET active = 0, archived = 1 WHERE id = ?').run(season.id);
    for (const id of departedIds) db.prepare('UPDATE players SET active = 0 WHERE id = ?').run(id);
    db.prepare("UPDATE players SET class_year = 'SR' WHERE active = 1 AND class_year = 'JR'").run();
    db.prepare("UPDATE players SET class_year = 'JR' WHERE active = 1 AND class_year = 'SO'").run();
    db.prepare("UPDATE players SET class_year = 'SO' WHERE active = 1 AND class_year = 'FR'").run();
    const info = db
      .prepare('INSERT INTO seasons (year, name, active) VALUES (?, ?, 1)')
      .run(season.year + 1, `${season.year + 1} Season`);
    // Signed recruits become freshmen on the new roster.
    const signed = db.prepare("SELECT * FROM recruits WHERE season_id = ? AND status IN ('committed','signed')").all(season.id) as any[];
    for (const r of signed) {
      db.prepare('INSERT INTO players (name, position, class_year, archetype, dev_trait) VALUES (?, ?, ?, ?, ?)').run(
        r.name, r.position, 'FR', r.archetype, r.dev_trait
      );
    }
    return { newSeasonId: Number(info.lastInsertRowid), promoted: signed.length };
  });
  const out = tx();
  res.json({ ok: true, ...out, departed: departedIds.length });
}));

// ---------- games ----------

app.get('/api/games', (req, res) => {
  const seasonId = Number(req.query.season_id) || activeSeasonId();
  res.json(db.prepare('SELECT * FROM games WHERE season_id = ? ORDER BY week').all(seasonId));
});

app.post('/api/games', asyncRoute((req, res) => {
  const { season_id, week, opponent, home, our_score, opp_score } = req.body;
  const result = our_score != null && opp_score != null ? (our_score > opp_score ? 'W' : our_score < opp_score ? 'L' : 'T') : null;
  const info = db
    .prepare('INSERT INTO games (season_id, week, opponent, home, our_score, opp_score, result) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(season_id ?? activeSeasonId(), week, opponent, home ? 1 : 0, our_score ?? null, opp_score ?? null, result);
  res.json(db.prepare('SELECT * FROM games WHERE id = ?').get(info.lastInsertRowid));
}));

app.put('/api/games/:id', asyncRoute((req, res) => {
  const { week, opponent, home, our_score, opp_score, notes } = req.body;
  const result = our_score != null && opp_score != null ? (our_score > opp_score ? 'W' : our_score < opp_score ? 'L' : 'T') : null;
  db.prepare('UPDATE games SET week=?, opponent=?, home=?, our_score=?, opp_score=?, result=?, notes=? WHERE id=?').run(
    week, opponent, home ? 1 : 0, our_score ?? null, opp_score ?? null, result, notes ?? null, req.params.id
  );
  res.json(db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id));
}));

app.delete('/api/games/:id', (req, res) => {
  db.prepare('DELETE FROM games WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.get('/api/games/:id/stats', (req, res) => {
  const rows = db
    .prepare(
      `SELECT pgs.*, p.name AS player_name, p.position FROM player_game_stats pgs
       JOIN players p ON p.id = pgs.player_id WHERE pgs.game_id = ? ORDER BY pgs.stat_category, p.name`
    )
    .all(req.params.id) as any[];
  res.json(rows.map((r) => ({ ...r, stats: JSON.parse(r.stats) })));
});

app.put('/api/player-stats/:id', asyncRoute((req, res) => {
  db.prepare('UPDATE player_game_stats SET stats = ? WHERE id = ?').run(JSON.stringify(req.body.stats ?? {}), req.params.id);
  res.json({ ok: true });
}));

app.delete('/api/player-stats/:id', (req, res) => {
  db.prepare('DELETE FROM player_game_stats WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.get('/api/games/:id/team-stats', (req, res) => {
  const row = db.prepare('SELECT * FROM team_game_stats WHERE game_id = ?').get(req.params.id) as any;
  res.json(row ? { ...row, stats: JSON.parse(row.stats) } : null);
});

// ---------- players ----------

app.get('/api/players', (req, res) => {
  const activeOnly = req.query.all == null;
  res.json(
    db.prepare(`SELECT * FROM players ${activeOnly ? 'WHERE active = 1' : ''} ORDER BY position, name`).all()
  );
});

app.post('/api/players', asyncRoute((req, res) => {
  const { name, position, class_year, archetype, dev_trait, jersey } = req.body;
  const info = db
    .prepare('INSERT INTO players (name, position, class_year, archetype, dev_trait, jersey) VALUES (?, ?, ?, ?, ?, ?)')
    .run(name, position, class_year || 'FR', archetype ?? null, dev_trait ?? null, jersey ?? null);
  res.json(db.prepare('SELECT * FROM players WHERE id = ?').get(info.lastInsertRowid));
}));

app.put('/api/players/:id', asyncRoute((req, res) => {
  const { name, position, class_year, archetype, dev_trait, jersey, active } = req.body;
  db.prepare('UPDATE players SET name=?, position=?, class_year=?, archetype=?, dev_trait=?, jersey=?, active=? WHERE id=?').run(
    name, position, class_year, archetype ?? null, dev_trait ?? null, jersey ?? null, active ? 1 : 0, req.params.id
  );
  res.json(db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id));
}));

app.delete('/api/players/:id', (req, res) => {
  db.prepare('DELETE FROM players WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.get('/api/players/:id/detail', asyncRoute((req, res) => {
  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id) as any;
  if (!player) throw new Error('Player not found');
  const stats = db
    .prepare(
      `SELECT pgs.*, g.week, g.opponent, g.result, g.season_id FROM player_game_stats pgs
       JOIN games g ON g.id = pgs.game_id WHERE pgs.player_id = ? ORDER BY g.season_id, g.week`
    )
    .all(req.params.id) as any[];
  // Ratings jump between seasons (offseason progression), not week to week —
  // collapse to one representative snapshot per season (the latest one
  // entered that season) so the growth chart reads year over year.
  const ratings = db
    .prepare(
      `SELECT prs.*, s.year AS season_year FROM player_rating_snapshots prs
       JOIN seasons s ON s.id = prs.season_id
       INNER JOIN (
         SELECT season_id, MAX(week) AS max_week FROM player_rating_snapshots
         WHERE player_id = ? GROUP BY season_id
       ) latest ON latest.season_id = prs.season_id AND latest.max_week = prs.week
       WHERE prs.player_id = ? ORDER BY s.year`
    )
    .all(req.params.id, req.params.id) as any[];
  res.json({
    player,
    stats: stats.map((r) => ({ ...r, stats: JSON.parse(r.stats) })),
    ratings: ratings.map((r) => ({ ...r, attributes: JSON.parse(r.attributes) })),
  });
}));

// ---------- ratings ----------

app.post('/api/ratings', asyncRoute((req, res) => {
  const { player_id, season_id, week, overall, attributes } = req.body;
  db.prepare(
    `INSERT INTO player_rating_snapshots (player_id, season_id, week, overall, attributes) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(player_id, season_id, week) DO UPDATE SET overall = excluded.overall, attributes = excluded.attributes`
  ).run(player_id, season_id ?? activeSeasonId(), week, overall ?? null, JSON.stringify(attributes ?? {}));
  res.json({ ok: true });
}));

// ---------- standings ----------

app.get('/api/standings', (req, res) => {
  const seasonId = Number(req.query.season_id) || activeSeasonId();
  const rows = db.prepare('SELECT * FROM standings_snapshots WHERE season_id = ? ORDER BY week').all(seasonId) as any[];
  res.json(rows.map((r) => ({ ...r, raw: JSON.parse(r.raw) })));
});

// ---------- recruiting ----------

app.get('/api/recruits', (req, res) => {
  const seasonId = Number(req.query.season_id) || activeSeasonId();
  res.json(db.prepare('SELECT * FROM recruits WHERE season_id = ? ORDER BY stars DESC, national_rank').all(seasonId));
});

app.post('/api/recruits', asyncRoute((req, res) => {
  const b = req.body;
  const info = db
    .prepare(
      `INSERT INTO recruits (season_id, name, position, stars, national_rank, position_rank, state, archetype, dev_trait, status, competitors, hours_spent, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      b.season_id ?? activeSeasonId(), b.name, b.position || 'ATH', b.stars ?? null, b.national_rank ?? null,
      b.position_rank ?? null, b.state ?? null, b.archetype ?? null, b.dev_trait ?? null,
      b.status || 'scouting', b.competitors ?? null, b.hours_spent ?? null, b.notes ?? null
    );
  res.json(db.prepare('SELECT * FROM recruits WHERE id = ?').get(info.lastInsertRowid));
}));

app.put('/api/recruits/:id', asyncRoute((req, res) => {
  const b = req.body;
  const before = db.prepare('SELECT status FROM recruits WHERE id = ?').get(req.params.id) as any;
  db.prepare(
    `UPDATE recruits SET name=?, position=?, stars=?, national_rank=?, position_rank=?, state=?, archetype=?, dev_trait=?, status=?, competitors=?, hours_spent=?, notes=? WHERE id=?`
  ).run(
    b.name, b.position, b.stars ?? null, b.national_rank ?? null, b.position_rank ?? null, b.state ?? null,
    b.archetype ?? null, b.dev_trait ?? null, b.status, b.competitors ?? null, b.hours_spent ?? null, b.notes ?? null,
    req.params.id
  );
  // Status changes become timeline events automatically — storyline beats.
  if (before && b.status && before.status !== b.status && b.week != null) {
    const recruit = db.prepare('SELECT * FROM recruits WHERE id = ?').get(req.params.id) as any;
    const labels: Record<string, string> = {
      committed: 'committed', signed: 'signed', lost: 'was lost to another school', 'top 5': 'put us in their top 5',
    };
    if (labels[b.status]) {
      db.prepare('INSERT INTO events (season_id, week, type, description) VALUES (?, ?, ?, ?)').run(
        recruit.season_id, b.week, b.status === 'lost' ? 'loss' : b.status === 'committed' ? 'commit' : b.status,
        `${recruit.stars ?? '?'}★ ${recruit.position} ${recruit.name} ${labels[b.status]}`
      );
    }
  }
  res.json(db.prepare('SELECT * FROM recruits WHERE id = ?').get(req.params.id));
}));

app.delete('/api/recruits/:id', (req, res) => {
  db.prepare('DELETE FROM recruits WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.get('/api/events', (req, res) => {
  const seasonId = Number(req.query.season_id) || activeSeasonId();
  res.json(db.prepare('SELECT * FROM events WHERE season_id = ? ORDER BY week DESC, id DESC').all(seasonId));
});

app.post('/api/events', asyncRoute((req, res) => {
  const { season_id, week, type, description } = req.body;
  const info = db
    .prepare('INSERT INTO events (season_id, week, type, description) VALUES (?, ?, ?, ?)')
    .run(season_id ?? activeSeasonId(), week, type, description);
  res.json(db.prepare('SELECT * FROM events WHERE id = ?').get(info.lastInsertRowid));
}));

app.delete('/api/events/:id', (req, res) => {
  db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.get('/api/needs', (req, res) => {
  const seasonId = Number(req.query.season_id) || activeSeasonId();
  res.json(db.prepare('SELECT * FROM position_needs WHERE season_id = ? ORDER BY position').all(seasonId));
});

app.put('/api/needs', asyncRoute((req, res) => {
  const { season_id, position, target_count } = req.body;
  db.prepare(
    `INSERT INTO position_needs (season_id, position, target_count) VALUES (?, ?, ?)
     ON CONFLICT(season_id, position) DO UPDATE SET target_count = excluded.target_count`
  ).run(season_id ?? activeSeasonId(), position, target_count);
  res.json({ ok: true });
}));

// ---------- dashboard ----------

app.get('/api/dashboard', asyncRoute((req, res) => {
  const seasonId = Number(req.query.season_id) || activeSeasonId();
  const games = db.prepare('SELECT * FROM games WHERE season_id = ? ORDER BY week').all(seasonId) as any[];
  const teamStats = db
    .prepare('SELECT tgs.game_id, tgs.stats FROM team_game_stats tgs JOIN games g ON g.id = tgs.game_id WHERE g.season_id = ?')
    .all(seasonId) as any[];
  const statsByGame = new Map(teamStats.map((r) => [r.game_id, JSON.parse(r.stats)]));

  const trend = games
    .filter((g) => g.our_score != null && g.opp_score != null)
    .map((g) => {
      const ts = statsByGame.get(g.id) ?? {};
      const ourYards = ts.our_total_yards ?? ts['Total Yards'] ?? null;
      const oppYards = ts.opp_total_yards ?? null;
      return {
        week: g.week,
        opponent: g.opponent,
        point_diff: g.our_score - g.opp_score,
        yards_diff: ourYards != null && oppYards != null ? ourYards - oppYards : null,
      };
    });

  // Top performers: score every stat line for the season, keep each player's
  // total, latest-game score, and season average for the trend arrow.
  const statRows = db
    .prepare(
      `SELECT pgs.player_id, pgs.stat_category, pgs.stats, p.name, p.position, p.class_year, g.week
       FROM player_game_stats pgs JOIN players p ON p.id = pgs.player_id JOIN games g ON g.id = pgs.game_id
       WHERE g.season_id = ?`
    )
    .all(seasonId) as any[];
  const latestWeek = statRows.reduce((max, r) => Math.max(max, r.week), 0);
  const byPlayer = new Map<number, any>();
  for (const r of statRows) {
    const stats = JSON.parse(r.stats);
    const score = performanceScore(r.stat_category, stats);
    const entry = byPlayer.get(r.player_id) ?? {
      player_id: r.player_id, name: r.name, position: r.position, class_year: r.class_year,
      total: 0, games: new Set<number>(), latest: 0, categories: {} as Record<string, any>,
    };
    entry.total += score;
    entry.games.add(r.week);
    if (r.week === latestWeek) {
      entry.latest += score;
      entry.categories[r.stat_category] = stats;
    }
    byPlayer.set(r.player_id, entry);
  }
  const performers = [...byPlayer.values()]
    .map((e) => {
      const gamesPlayed = e.games.size;
      const avg = gamesPlayed ? e.total / gamesPlayed : 0;
      const mainCat = Object.keys(e.categories)[0];
      return {
        player_id: e.player_id, name: e.name, position: e.position, class_year: e.class_year,
        score: Math.round(e.total * 10) / 10,
        avg: Math.round(avg * 10) / 10,
        latest: Math.round(e.latest * 10) / 10,
        games: gamesPlayed,
        trend: e.latest === 0 ? 'flat' : e.latest > avg * 1.15 ? 'up' : e.latest < avg * 0.85 ? 'down' : 'flat',
        key_line: mainCat ? keyStatLine(mainCat, e.categories[mainCat]) : '—',
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const standings = db
    .prepare('SELECT * FROM standings_snapshots WHERE season_id = ? ORDER BY week DESC LIMIT 2')
    .all(seasonId) as any[];

  const recruits = db.prepare('SELECT * FROM recruits WHERE season_id = ?').all(seasonId) as any[];
  const commits = recruits.filter((r) => r.status === 'committed' || r.status === 'signed');
  const latestCommitEvent = db
    .prepare("SELECT * FROM events WHERE season_id = ? AND type IN ('commit','signed') ORDER BY week DESC, id DESC LIMIT 1")
    .get(seasonId) as any;

  res.json({
    season_id: seasonId,
    games,
    trend,
    performers,
    standings: { current: standings[0] ?? null, previous: standings[1] ?? null },
    recruiting: {
      commit_count: commits.length,
      star_avg: commits.length ? Math.round((commits.reduce((s, r) => s + (r.stars ?? 0), 0) / commits.length) * 100) / 100 : null,
      latest_commit: latestCommitEvent?.description ?? null,
    },
  });
}));

// ---------- imports (screenshot pipeline) ----------

app.post('/api/imports', upload.array('images', 20), asyncRoute((req, res) => {
  const files = (req.files ?? []) as Express.Multer.File[];
  if (!files.length) throw new Error('No images uploaded');
  const { season_id, week, game_id } = req.body;
  const insert = db.prepare(
    'INSERT INTO imports (season_id, week, game_id, image_path, original_name, status) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const rows = files.map((f) => {
    const info = insert.run(
      season_id ? Number(season_id) : activeSeasonId(),
      week ? Number(week) : null,
      game_id ? Number(game_id) : null,
      f.filename,
      f.originalname,
      'uploaded'
    );
    return db.prepare('SELECT * FROM imports WHERE id = ?').get(info.lastInsertRowid);
  });
  res.json(rows);
}));

app.get('/api/imports', (req, res) => {
  const status = req.query.status as string | undefined;
  const rows = status
    ? db.prepare('SELECT * FROM imports WHERE status = ? ORDER BY id DESC').all(status)
    : db.prepare('SELECT * FROM imports ORDER BY id DESC LIMIT 100').all();
  res.json(rows);
});

app.get('/api/imports/:id', (req, res) => {
  res.json(db.prepare('SELECT * FROM imports WHERE id = ?').get(req.params.id));
});

// Two-pass pipeline: classify, then extract with the type-specific prompt.
app.post('/api/imports/:id/process', asyncRoute(async (req, res) => {
  const imp = db.prepare('SELECT * FROM imports WHERE id = ?').get(req.params.id) as any;
  if (!imp) throw new Error('Import not found');
  const imagePath = path.join(UPLOADS_DIR, imp.image_path);
  db.prepare("UPDATE imports SET status = 'processing', error = NULL WHERE id = ?").run(imp.id);
  try {
    // Allow the user to override a bad classification and re-extract.
    let screenType = (req.body?.screen_type as ScreenType | undefined) ?? undefined;
    let classification = imp.classification ? JSON.parse(imp.classification) : null;
    if (!screenType) {
      classification = await classifyImage(imagePath);
      screenType = classification.screen_type as ScreenType;
    }
    if (screenType === 'unknown') {
      db.prepare("UPDATE imports SET status = 'unreadable', screen_type = 'unknown', classification = ? WHERE id = ?").run(
        JSON.stringify(classification), imp.id
      );
      res.json(db.prepare('SELECT * FROM imports WHERE id = ?').get(imp.id));
      return;
    }
    const extraction = await extractImage(imagePath, screenType);
    db.prepare(
      "UPDATE imports SET status = 'extracted', screen_type = ?, classification = ?, raw_extraction = ? WHERE id = ?"
    ).run(screenType, JSON.stringify(classification), JSON.stringify(extraction), imp.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    db.prepare("UPDATE imports SET status = 'failed', error = ? WHERE id = ?").run(message, imp.id);
  }
  res.json(db.prepare('SELECT * FROM imports WHERE id = ?').get(imp.id));
}));

// Update context binding (season/week/game) on an import before confirming.
app.put('/api/imports/:id', asyncRoute((req, res) => {
  const { season_id, week, game_id } = req.body;
  db.prepare('UPDATE imports SET season_id = ?, week = ?, game_id = ? WHERE id = ?').run(
    season_id ?? null, week ?? null, game_id ?? null, req.params.id
  );
  res.json(db.prepare('SELECT * FROM imports WHERE id = ?').get(req.params.id));
}));

app.post('/api/imports/:id/confirm', asyncRoute((req, res) => {
  const imp = db.prepare('SELECT * FROM imports WHERE id = ?').get(req.params.id) as any;
  if (!imp) throw new Error('Import not found');
  const out = confirmImport(imp, req.body);
  db.prepare("UPDATE imports SET status = 'confirmed' WHERE id = ?").run(imp.id);
  res.json({ ok: true, ...out });
}));

app.delete('/api/imports/:id', (req, res) => {
  db.prepare('DELETE FROM imports WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- export / backup ----------

app.get('/api/export', (_req, res) => {
  const tables = [
    'seasons', 'games', 'players', 'player_game_stats', 'player_rating_snapshots', 'team_game_stats',
    'standings_snapshots', 'recruits', 'recruit_snapshots', 'class_rank_snapshots', 'events', 'position_needs', 'imports',
  ];
  const dump: Record<string, unknown[]> = {};
  for (const t of tables) dump[t] = db.prepare(`SELECT * FROM ${t}`).all();
  res.setHeader('Content-Disposition', `attachment; filename="dynasty-tracker-backup-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json({ exported_at: new Date().toISOString(), tables: dump });
});

const PORT = 8787;
app.listen(PORT, () => {
  console.log(`  Dynasty Tracker API  → http://localhost:${PORT}`);
  console.log(`  Open the app         → http://localhost:5173`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('  ⚠ ANTHROPIC_API_KEY not set — screenshot imports will fail until you create .env');
  }
});
