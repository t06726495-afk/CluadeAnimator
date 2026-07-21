export type Season = { id: number; year: number; name: string; active: number; archived: number };
export type Dynasty = { id: number; team_name: string; primary_color: string; secondary_color: string; created_at: string };
export type Game = {
  id: number; season_id: number; week: number; opponent: string; home: number;
  our_score: number | null; opp_score: number | null; result: 'W' | 'L' | 'T' | null; notes: string | null;
};
export type Player = {
  id: number; name: string; position: string; class_year: string;
  archetype: string | null; dev_trait: string | null; jersey: number | null; active: number; redshirt: number;
};

export function classYearLabel(p: Pick<Player, 'class_year' | 'redshirt'>): string {
  return p.redshirt ? `${p.class_year} (RS)` : p.class_year;
}
export type PlayerGameStat = {
  id: number; player_id: number; game_id: number; stat_category: string; stats: Record<string, unknown>;
  player_name?: string; position?: string; week?: number; opponent?: string; result?: string | null; season_id?: number;
};
export type RatingSnapshot = {
  id: number; player_id: number; season_id: number; week: number; overall: number | null;
  attributes: Record<string, number>; season_year?: number;
};
export type Recruit = {
  id: number; season_id: number; name: string; position: string; stars: number | null;
  national_rank: number | null; position_rank: number | null; state: string | null;
  archetype: string | null; dev_trait: string | null; status: string;
  competitors: string | null; hours_spent: number | null; notes: string | null;
};
export type DynastyEvent = { id: number; season_id: number; week: number; type: string; description: string };
export type PositionNeed = { id: number; season_id: number; position: string; target_count: number };
export type StandingsSnapshot = {
  id: number; season_id: number; week: number; conf_rank: number | null; poll_rank: number | null;
  conf_record: string | null; overall_record: string | null; raw: Record<string, unknown>;
};
export type ImportRow = {
  id: number; created_at: string; season_id: number | null; week: number | null; game_id: number | null;
  image_path: string; original_name: string | null; screen_type: string | null;
  status: 'uploaded' | 'processing' | 'extracted' | 'confirmed' | 'failed' | 'unreadable';
  classification: string | null; raw_extraction: string | null; error: string | null;
};
export type Dashboard = {
  season_id: number;
  games: Game[];
  trend: Array<{ week: number; opponent: string; point_diff: number; yards_diff: number | null }>;
  performers: Array<{
    player_id: number; name: string; position: string; class_year: string;
    score: number; avg: number; latest: number; games: number; trend: 'up' | 'down' | 'flat'; key_line: string;
  }>;
  standings: { current: StandingsSnapshot | null; previous: StandingsSnapshot | null };
  recruiting: { commit_count: number; star_avg: number | null; latest_commit: string | null };
};

export const RECRUIT_STATUSES = ['scouting', 'offered', 'top 5', 'committed', 'signed', 'lost'] as const;
export const POSITIONS = ['QB', 'RB', 'FB', 'WR', 'TE', 'OT', 'IOL', 'LT', 'EDGE', 'DT', 'LB', 'CB', 'S', 'K', 'P', 'ATH'] as const;
export const SCREEN_TYPE_LABELS: Record<string, string> = {
  box_score: 'Box score',
  player_game_stats: 'Player game stats',
  season_stats: 'Season stats',
  standings: 'Standings / poll',
  schedule: 'Schedule',
  player_ratings: 'Player ratings',
  recruiting_board: 'Recruiting board',
  recruit_profile: 'Recruit profile',
  team_stats: 'Team stats',
  unknown: 'Unknown',
};
