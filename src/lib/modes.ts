import type { Mode, ModeDef } from '../types'

export const MODES: ModeDef[] = [
  {
    id: 'diamond',
    title: 'The Diamond',
    league: 'Major League Baseball',
    sport: 'mlb',
    emoji: '⚾',
    blurb: 'Reserve clause to deferred billions.',
  },
  {
    id: 'hardwood',
    title: 'The Hardwood',
    league: 'National Basketball Association',
    sport: 'nba',
    emoji: '🏀',
    blurb: 'Where the max contract was invented.',
  },
  {
    id: 'gridiron',
    title: 'The Gridiron',
    league: 'National Football League',
    sport: 'nfl',
    emoji: '🏈',
    blurb: 'Guaranteed money is a recent idea.',
  },
  {
    id: 'pitch',
    title: 'The Pitch',
    league: 'World football',
    sport: 'soccer',
    emoji: '⚽',
    blurb: 'Weekly wages, four currencies, one century.',
  },
  {
    id: 'mixer',
    title: 'The Mixer',
    league: 'All four sports, shuffled',
    sport: 'all',
    emoji: '🎲',
    blurb: 'No warning which league you get.',
  },
]

export const MODE_BY_ID: Record<Mode, ModeDef> = MODES.reduce(
  (acc, m) => {
    acc[m.id] = m
    return acc
  },
  {} as Record<Mode, ModeDef>,
)
