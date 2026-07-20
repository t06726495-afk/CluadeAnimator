// npm run seed — wipes the DB and fills it with a realistic demo season so the
// dashboard can be style-checked before the first real episode.
import { db } from './db.js';

const tables = [
  'imports', 'position_needs', 'events', 'class_rank_snapshots', 'recruit_snapshots', 'recruits',
  'standings_snapshots', 'team_game_stats', 'player_rating_snapshots', 'player_game_stats',
  'players', 'games', 'seasons',
];
for (const t of tables) db.prepare(`DELETE FROM ${t}`).run();

const season = db.prepare("INSERT INTO seasons (year, name, active) VALUES (2027, '2027 Season', 1)").run();
const seasonId = Number(season.lastInsertRowid);

// ---- roster ----
const roster: Array<[string, string, string, string, string, number]> = [
  ['Caleb Whitfield', 'QB', 'JR', 'Field General', 'Star', 7],
  ['Marcus Delane', 'RB', 'SO', 'Elusive Back', 'Impact', 22],
  ['DeShawn Carter', 'RB', 'FR', 'Power Back', 'Normal', 28],
  ['Jalen Okafor', 'WR', 'JR', 'Deep Threat', 'Star', 11],
  ['Tommy Reyes', 'WR', 'SO', 'Slot', 'Impact', 83],
  ['Isaiah Brooks', 'WR', 'FR', 'Physical', 'Normal', 4],
  ['Grant Hollis', 'TE', 'SR', 'Vertical Threat', 'Normal', 88],
  ['Luke Vandermeer', 'LT', 'SR', 'Pass Protector', 'Normal', 74],
  ['Dre Simmons', 'EDGE', 'JR', 'Speed Rusher', 'Star', 9],
  ['Malik Tanner', 'DT', 'SO', 'Run Stopper', 'Impact', 95],
  ['Cade Murray', 'LB', 'JR', 'Field General', 'Impact', 44],
  ['Xavier Bell', 'LB', 'SO', 'Run Stopper', 'Normal', 51],
  ['Amir Johnson', 'CB', 'JR', 'Man to Man', 'Star', 2],
  ['Trey Whitlock', 'CB', 'FR', 'Zone', 'Impact', 21],
  ['Jordan Pace', 'S', 'SR', 'Hybrid', 'Normal', 30],
];
const insertPlayer = db.prepare('INSERT INTO players (name, position, class_year, archetype, dev_trait, jersey) VALUES (?, ?, ?, ?, ?, ?)');
const pid: Record<string, number> = {};
for (const [name, pos, cls, arch, dev, jersey] of roster) {
  pid[name] = Number(insertPlayer.run(name, pos, cls, arch, dev, jersey).lastInsertRowid);
}

// ---- games (10 played + 2 upcoming) ----
type G = [number, string, number, number | null, number | null];
const games: G[] = [
  [1, 'Hawaii', 1, 45, 10],
  [2, 'BYU', 0, 31, 28],
  [3, 'TCU', 1, 24, 27],
  [4, 'San Jose State', 1, 52, 7],
  [5, 'Virginia', 0, 38, 20],
  [6, 'Cal', 1, 27, 24],
  [7, 'SMU', 0, 17, 31],
  [8, 'Wake Forest', 1, 41, 13],
  [9, 'Louisville', 0, 35, 30],
  [10, 'Miami', 1, 28, 21],
  [11, 'North Carolina', 0, null, null],
  [12, 'Notre Dame', 1, null, null],
];
const insertGame = db.prepare('INSERT INTO games (season_id, week, opponent, home, our_score, opp_score, result) VALUES (?, ?, ?, ?, ?, ?, ?)');
const gid: number[] = [];
for (const [week, opp, home, us, them] of games) {
  const result = us == null || them == null ? null : us > them ? 'W' : us < them ? 'L' : 'T';
  gid[week] = Number(insertGame.run(seasonId, week, opp, home, us, them, result).lastInsertRowid);
}

// ---- team game stats (yards for the trend chart) ----
const teamStats: Array<[number, number, number]> = [
  [1, 512, 188], [2, 445, 401], [3, 350, 415], [4, 545, 160], [5, 470, 322],
  [6, 388, 365], [7, 289, 410], [8, 498, 240], [9, 455, 430], [10, 402, 351],
];
const insertTeam = db.prepare('INSERT INTO team_game_stats (game_id, stats) VALUES (?, ?)');
for (const [week, us, them] of teamStats) {
  insertTeam.run(gid[week], JSON.stringify({ our_total_yards: us, opp_total_yards: them }));
}

// ---- player game stats ----
const insertStat = db.prepare('INSERT INTO player_game_stats (player_id, game_id, stat_category, stats) VALUES (?, ?, ?, ?)');
const rand = (min: number, max: number) => Math.floor(min + Math.random() * (max - min + 1));

for (const [week, , , us] of games) {
  if (us == null) continue;
  const blowout = us >= 40;
  insertStat.run(pid['Caleb Whitfield'], gid[week], 'passing', JSON.stringify({
    'CMP/ATT': `${rand(16, 28)}/${rand(28, 38)}`, YDS: rand(210, 380), TD: rand(1, blowout ? 4 : 3), INT: rand(0, 1),
  }));
  insertStat.run(pid['Marcus Delane'], gid[week], 'rushing', JSON.stringify({
    CAR: rand(12, 24), YDS: rand(55, 160), TD: rand(0, 2), FUM: 0,
  }));
  if (week % 2 === 0) {
    insertStat.run(pid['DeShawn Carter'], gid[week], 'rushing', JSON.stringify({
      CAR: rand(5, 12), YDS: rand(20, 80), TD: rand(0, 1), FUM: 0,
    }));
  }
  insertStat.run(pid['Jalen Okafor'], gid[week], 'receiving', JSON.stringify({
    REC: rand(4, 9), YDS: rand(60, 150), TD: rand(0, 2),
  }));
  insertStat.run(pid['Tommy Reyes'], gid[week], 'receiving', JSON.stringify({
    REC: rand(3, 7), YDS: rand(30, 90), TD: rand(0, 1),
  }));
  insertStat.run(pid['Grant Hollis'], gid[week], 'receiving', JSON.stringify({
    REC: rand(2, 5), YDS: rand(15, 60), TD: rand(0, 1),
  }));
  insertStat.run(pid['Dre Simmons'], gid[week], 'defense', JSON.stringify({
    TKL: rand(3, 8), SACK: rand(0, 2), TFL: rand(0, 3), FF: rand(0, 1), INT: 0,
  }));
  insertStat.run(pid['Cade Murray'], gid[week], 'defense', JSON.stringify({
    TKL: rand(6, 13), SACK: rand(0, 1), TFL: rand(0, 2), FF: 0, INT: 0,
  }));
  insertStat.run(pid['Amir Johnson'], gid[week], 'defense', JSON.stringify({
    TKL: rand(2, 6), SACK: 0, TFL: 0, FF: 0, INT: rand(0, 1),
  }));
}

// ---- rating snapshots (weeks 0, 6, 12 → growth chart) ----
const baseline: Array<[string, number, Record<string, number>]> = [
  ['Caleb Whitfield', 88, { THP: 91, SAC: 90, MAC: 87, SPD: 78 }],
  ['Marcus Delane', 84, { SPD: 92, AGI: 93, BCV: 85, CAR: 82 }],
  ['Jalen Okafor', 86, { SPD: 94, CTH: 85, RTE: 84, JMP: 90 }],
  ['Tommy Reyes', 79, { SPD: 88, CTH: 84, RTE: 86, JMP: 78 }],
  ['Dre Simmons', 87, { SPD: 86, PMV: 88, FMV: 84, TAK: 82 }],
  ['Amir Johnson', 85, { SPD: 93, MCV: 88, ZCV: 82, PRS: 84 }],
  ['DeShawn Carter', 74, { SPD: 87, TRK: 84, CAR: 80, BCV: 76 }],
  ['Trey Whitlock', 76, { SPD: 90, MCV: 78, ZCV: 79, PRS: 74 }],
];
const insertRating = db.prepare('INSERT INTO player_rating_snapshots (player_id, season_id, week, overall, attributes) VALUES (?, ?, ?, ?, ?)');
for (const [name, ovr, attrs] of baseline) {
  const growth = ['FR', 'SO'].includes(roster.find((r) => r[0] === name)![2]) ? 3 : 1;
  for (const [i, week] of [0, 6, 12].entries()) {
    const bumped: Record<string, number> = {};
    for (const [k, v] of Object.entries(attrs)) bumped[k] = Math.min(99, v + i * growth + (i && Math.random() > 0.6 ? 1 : 0));
    insertRating.run(pid[name], seasonId, week, Math.min(99, ovr + i * growth), JSON.stringify(bumped));
  }
}

// ---- standings snapshots ----
const standings: Array<[number, number, number | null, string, string]> = [
  [2, 4, null, '0-0', '2-0'], [4, 3, 24, '1-1', '3-1'], [6, 3, 21, '2-1', '5-1'],
  [8, 2, 18, '3-2', '6-2'], [10, 2, 14, '5-2', '8-2'],
];
const insertStanding = db.prepare('INSERT INTO standings_snapshots (season_id, week, conf_rank, poll_rank, conf_record, overall_record, raw) VALUES (?, ?, ?, ?, ?, ?, ?)');
for (const [week, conf, poll, confRec, overall] of standings) {
  insertStanding.run(seasonId, week, conf, poll, confRec, overall, '{}');
}

// ---- recruits ----
const recruitRows: Array<[string, string, number, number, number, string, string, string, string | null, number]> = [
  ['Jaxon Rivers', 'QB', 5, 12, 2, 'CA', 'Dual Threat', 'committed', 'Oregon, USC', 42],
  ['Deon Walker', 'EDGE', 4, 88, 6, 'TX', 'Speed Rusher', 'committed', 'Texas, Texas A&M', 38],
  ['Michael Osei', 'WR', 4, 104, 14, 'GA', 'Deep Threat', 'top 5', 'Georgia, Clemson', 30],
  ['Brady Kessler', 'IOL', 4, 130, 9, 'OH', 'Pass Protector', 'committed', 'Ohio State', 26],
  ['Zion Hartley', 'CB', 4, 145, 11, 'FL', 'Man to Man', 'offered', 'Miami, Florida', 22],
  ['Sam Tuiasosopo', 'DT', 4, 160, 12, 'WA', 'Run Stopper', 'top 5', 'Washington, Oregon', 25],
  ['Elijah Grant', 'S', 3, 320, 20, 'AZ', 'Hybrid', 'offered', 'Arizona State', 12],
  ['Connor Beck', 'TE', 3, 350, 15, 'UT', 'Possession', 'scouting', 'BYU, Utah', 6],
  ['Andre Silva', 'RB', 4, 118, 8, 'CA', 'Elusive Back', 'lost', 'USC', 20],
  ['Tyler Ngata', 'LB', 3, 410, 28, 'CA', 'Field General', 'offered', 'Cal, UCLA', 10],
  ['Marcus Reed', 'WR', 3, 380, 44, 'NV', 'Slot', 'scouting', null, 4],
  ['David Iosefa', 'OT', 4, 99, 7, 'HI', 'Power', 'top 5', 'Hawaii, USC, Oregon', 28],
];
const insertRecruit = db.prepare(
  `INSERT INTO recruits (season_id, name, position, stars, national_rank, position_rank, state, archetype, status, competitors, hours_spent)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
const rid: Record<string, number> = {};
for (const [name, posn, stars, natl, posRank, state, arch, status, comp, hours] of recruitRows) {
  rid[name] = Number(insertRecruit.run(seasonId, name, posn, stars, natl, posRank, state, arch, status, comp, hours).lastInsertRowid);
}

// weekly recruit + class rank snapshots
const insertRecruitSnap = db.prepare('INSERT INTO recruit_snapshots (recruit_id, week, status, national_rank, hours_spent) VALUES (?, ?, ?, ?, ?)');
for (const week of [2, 4, 6, 8, 10]) {
  for (const [name, , , natl, , , , status, , hours] of recruitRows) {
    insertRecruitSnap.run(rid[name], week, week < 6 ? 'offered' : status, natl + rand(-8, 8), Math.max(0, hours - (10 - week)));
  }
}
const insertClassRank = db.prepare('INSERT INTO class_rank_snapshots (season_id, week, rank, commit_count) VALUES (?, ?, ?, ?)');
for (const [week, rank, commits] of [[1, 38, 0], [2, 31, 1], [4, 24, 1], [6, 19, 2], [8, 15, 3], [10, 11, 3]] as const) {
  insertClassRank.run(seasonId, week, rank, commits);
}

// ---- timeline events ----
const eventRows: Array<[number, string, string]> = [
  [2, 'commit', '5★ QB Jaxon Rivers committed'],
  [5, 'loss', '4★ RB Andre Silva was lost to USC'],
  [6, 'commit', '4★ EDGE Deon Walker committed'],
  [7, 'portal', 'Backup QB entered the transfer portal'],
  [8, 'commit', '4★ IOL Brady Kessler committed'],
  [10, 'top 5', '4★ OT David Iosefa put us in their top 5'],
];
const insertEvent = db.prepare('INSERT INTO events (season_id, week, type, description) VALUES (?, ?, ?, ?)');
for (const [week, type, desc] of eventRows) insertEvent.run(seasonId, week, type, desc);

// ---- position needs ----
for (const [posn, target] of [['QB', 1], ['RB', 1], ['WR', 2], ['OT', 1], ['IOL', 1], ['EDGE', 2], ['CB', 2], ['S', 1], ['DT', 1], ['LB', 1], ['TE', 1]] as const) {
  db.prepare('INSERT INTO position_needs (season_id, position, target_count) VALUES (?, ?, ?)').run(seasonId, posn, target);
}

console.log(`Seeded 2027 demo season (season_id=${seasonId}): ${roster.length} players, ${games.length} games, ${recruitRows.length} recruits.`);
