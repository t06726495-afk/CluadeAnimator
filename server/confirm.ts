import { db } from './db.js';

// Handlers that commit a reviewed/edited extraction to the database. The
// frontend sends already-resolved payloads (player ids matched, cells edited),
// so these are mostly upserts. Nothing here reads raw_extraction — the raw
// JSON stays untouched on the import row forever.

type ImportRow = {
  id: number;
  season_id: number | null;
  week: number | null;
  game_id: number | null;
  screen_type: string | null;
};

export type PlayerRef = { player_id?: number; new_player?: { name: string; position: string; class_year?: string } };

function resolvePlayer(ref: PlayerRef): number {
  if (ref.player_id) return ref.player_id;
  if (!ref.new_player?.name) throw new Error('Row is missing a player');
  const info = db
    .prepare('INSERT INTO players (name, position, class_year) VALUES (?, ?, ?)')
    .run(ref.new_player.name, ref.new_player.position || 'ATH', ref.new_player.class_year || 'FR');
  return Number(info.lastInsertRowid);
}

function upsertTeamStats(gameId: number, stats: Record<string, unknown>) {
  const existing = db.prepare('SELECT stats FROM team_game_stats WHERE game_id = ?').get(gameId) as
    | { stats: string }
    | undefined;
  const merged = { ...(existing ? JSON.parse(existing.stats) : {}), ...stats };
  db.prepare(
    `INSERT INTO team_game_stats (game_id, stats) VALUES (?, ?)
     ON CONFLICT(game_id) DO UPDATE SET stats = excluded.stats`
  ).run(gameId, JSON.stringify(merged));
}

function gameResult(our: number | null, opp: number | null): string | null {
  if (our == null || opp == null) return null;
  return our > opp ? 'W' : our < opp ? 'L' : 'T';
}

export function confirmImport(imp: ImportRow, payload: any): { message: string } {
  const seasonId = imp.season_id;
  switch (imp.screen_type) {
    case 'box_score': {
      if (!imp.game_id) throw new Error('Bind this import to a game before confirming a box score.');
      const { our_score, opp_score, team_stats } = payload;
      db.prepare('UPDATE games SET our_score = ?, opp_score = ?, result = ? WHERE id = ?').run(
        our_score ?? null,
        opp_score ?? null,
        gameResult(our_score ?? null, opp_score ?? null),
        imp.game_id
      );
      if (team_stats && Object.keys(team_stats).length) upsertTeamStats(imp.game_id, team_stats);
      return { message: 'Box score saved to game.' };
    }

    case 'player_game_stats': {
      if (!imp.game_id) throw new Error('Bind this import to a game before confirming player stats.');
      const rows: Array<PlayerRef & { category: string; stats: Record<string, unknown> }> = payload.rows ?? [];
      const upsert = db.prepare(
        `INSERT INTO player_game_stats (player_id, game_id, stat_category, stats) VALUES (?, ?, ?, ?)
         ON CONFLICT(player_id, game_id, stat_category) DO UPDATE SET stats = excluded.stats`
      );
      const tx = db.transaction(() => {
        for (const row of rows) {
          upsert.run(resolvePlayer(row), imp.game_id, row.category, JSON.stringify(row.stats ?? {}));
        }
      });
      tx();
      return { message: `Saved stat lines for ${rows.length} player row(s).` };
    }

    case 'standings': {
      if (seasonId == null || imp.week == null) throw new Error('Standings need a season and week.');
      const { conf_rank, poll_rank, conf_record, overall_record, raw } = payload;
      db.prepare(
        `INSERT INTO standings_snapshots (season_id, week, conf_rank, poll_rank, conf_record, overall_record, raw)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(season_id, week) DO UPDATE SET
           conf_rank = COALESCE(excluded.conf_rank, conf_rank),
           poll_rank = COALESCE(excluded.poll_rank, poll_rank),
           conf_record = COALESCE(excluded.conf_record, conf_record),
           overall_record = COALESCE(excluded.overall_record, overall_record),
           raw = excluded.raw`
      ).run(seasonId, imp.week, conf_rank ?? null, poll_rank ?? null, conf_record ?? null, overall_record ?? null, JSON.stringify(raw ?? {}));
      return { message: `Standings snapshot saved for week ${imp.week}.` };
    }

    case 'schedule': {
      if (seasonId == null) throw new Error('Schedule needs a season.');
      const rows: Array<{ week: number; opponent: string; home: boolean | null; our_score?: number | null; opp_score?: number | null }> =
        payload.rows ?? [];
      const find = db.prepare('SELECT id FROM games WHERE season_id = ? AND week = ?');
      const insert = db.prepare('INSERT INTO games (season_id, week, opponent, home, our_score, opp_score, result) VALUES (?, ?, ?, ?, ?, ?, ?)');
      const update = db.prepare('UPDATE games SET opponent = ?, home = ?, our_score = ?, opp_score = ?, result = ? WHERE id = ?');
      const tx = db.transaction(() => {
        for (const row of rows) {
          if (row.week == null || !row.opponent) continue;
          const result = gameResult(row.our_score ?? null, row.opp_score ?? null);
          const existing = find.get(seasonId, row.week) as { id: number } | undefined;
          if (existing) update.run(row.opponent, row.home === false ? 0 : 1, row.our_score ?? null, row.opp_score ?? null, result, existing.id);
          else insert.run(seasonId, row.week, row.opponent, row.home === false ? 0 : 1, row.our_score ?? null, row.opp_score ?? null, result);
        }
      });
      tx();
      return { message: `Schedule saved (${rows.length} row(s)).` };
    }

    case 'player_ratings': {
      if (seasonId == null || imp.week == null) throw new Error('Ratings need a season and week.');
      const rows: Array<PlayerRef & { overall: number | null; attributes: Record<string, number> }> = payload.rows ?? [];
      const upsert = db.prepare(
        `INSERT INTO player_rating_snapshots (player_id, season_id, week, overall, attributes)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(player_id, season_id, week) DO UPDATE SET overall = excluded.overall, attributes = excluded.attributes`
      );
      const tx = db.transaction(() => {
        for (const row of rows) {
          upsert.run(resolvePlayer(row), seasonId, imp.week, row.overall ?? null, JSON.stringify(row.attributes ?? {}));
        }
      });
      tx();
      return { message: `Rating snapshots saved for ${rows.length} player(s) at week ${imp.week}.` };
    }

    case 'recruiting_board':
    case 'recruit_profile': {
      if (seasonId == null) throw new Error('Recruiting imports need a season.');
      const rows: Array<{
        recruit_id?: number;
        name: string;
        position?: string | null;
        stars?: number | null;
        national_rank?: number | null;
        position_rank?: number | null;
        state?: string | null;
        archetype?: string | null;
        dev_trait?: string | null;
        status?: string | null;
        competitors?: string | null;
        hours_spent?: number | null;
      }> = imp.screen_type === 'recruit_profile' ? [payload] : payload.rows ?? [];
      const insert = db.prepare(
        `INSERT INTO recruits (season_id, name, position, stars, national_rank, position_rank, state, archetype, dev_trait, status, competitors, hours_spent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      const update = db.prepare(
        `UPDATE recruits SET name=?, position=?, stars=?, national_rank=?, position_rank=?, state=COALESCE(?, state),
         archetype=COALESCE(?, archetype), dev_trait=COALESCE(?, dev_trait), status=?, competitors=COALESCE(?, competitors),
         hours_spent=COALESCE(?, hours_spent) WHERE id=?`
      );
      const snapshot = db.prepare('INSERT INTO recruit_snapshots (recruit_id, week, status, national_rank, hours_spent) VALUES (?, ?, ?, ?, ?)');
      const tx = db.transaction(() => {
        for (const row of rows) {
          if (!row.name) continue;
          let recruitId = row.recruit_id;
          const status = row.status || 'scouting';
          if (recruitId) {
            update.run(
              row.name, row.position || 'ATH', row.stars ?? null, row.national_rank ?? null, row.position_rank ?? null,
              row.state ?? null, row.archetype ?? null, row.dev_trait ?? null, status, row.competitors ?? null,
              row.hours_spent ?? null, recruitId
            );
          } else {
            const info = insert.run(
              seasonId, row.name, row.position || 'ATH', row.stars ?? null, row.national_rank ?? null,
              row.position_rank ?? null, row.state ?? null, row.archetype ?? null, row.dev_trait ?? null,
              status, row.competitors ?? null, row.hours_spent ?? null
            );
            recruitId = Number(info.lastInsertRowid);
          }
          if (imp.week != null) snapshot.run(recruitId, imp.week, status, row.national_rank ?? null, row.hours_spent ?? null);
        }
      });
      tx();
      return { message: `Saved ${rows.length} recruit(s).` };
    }

    case 'team_stats':
    case 'season_stats': {
      if (!imp.game_id) throw new Error('Bind this import to a game to save team stats against it.');
      const rows: Array<{ label: string; value: unknown }> = payload.rows ?? [];
      const stats: Record<string, unknown> = {};
      for (const row of rows) if (row.label) stats[row.label] = row.value;
      upsertTeamStats(imp.game_id, stats);
      return { message: `Saved ${rows.length} team stat value(s) to the game.` };
    }

    default:
      throw new Error(`Cannot confirm screen type "${imp.screen_type}".`);
  }
}
