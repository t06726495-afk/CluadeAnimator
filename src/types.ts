export type Sport = 'mlb' | 'nba' | 'nfl' | 'soccer'

export type Confidence = 'high' | 'medium' | 'low'

export type Player = {
  id: string
  name: string
  sport: Sport
  /** Competition the salary was earned in — shown on the card. */
  league: string
  team: string
  /** Start year of the season. NBA/European soccer seasons render as "1997-98". */
  season: number
  salaryUSD: number
  leagueAvgThatSeason: number | null
  /** 2-3 short stat lines from that season. */
  stats: string[]
  /** What that money meant then. */
  contextNote: string
  /** Where the figure came from. Every entry has one. */
  source: string
  confidence: Confidence
}

export type Mode = 'diamond' | 'hardwood' | 'gridiron' | 'pitch' | 'mixer'

export type ModeDef = {
  id: Mode
  title: string
  league: string
  sport: Sport | 'all'
  emoji: string
  blurb: string
}

export type Heat = 'scorching' | 'warm' | 'cool' | 'cold' | 'frozen'

export type Direction = 'higher' | 'lower' | 'exact'

export type GuessResult = {
  value: number
  heat: Heat
  direction: Direction
  error: number
  correct: boolean
}

export type RoundStatus = 'playing' | 'won' | 'lost'

export type RoundState = {
  puzzleNo: number
  playerId: string
  guesses: number[]
  status: RoundStatus
  score: number
}

export type ModeStats = {
  played: number
  wins: number
  currentStreak: number
  maxStreak: number
  lastPuzzleNo: number | null
  totalScore: number
  /** Index 0-4 = solved in 1-5 guesses, index 5 = bust. */
  distribution: number[]
}

export type Settings = {
  verifiedOnly: boolean
  devUnlocked: boolean
}
