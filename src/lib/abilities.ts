// Ability reference data, sourced directly from the in-game archetype/ability
// screens (collegefootball.gg/abilities) — not guessed.
//
// Physical abilities are a fixed set per archetype (3-5 depending on
// position) — a player just gets a tier assigned per ability, not a choice
// of which ones. Mental abilities are one shared pool of 14, available to
// any player/archetype, capped at 3 selected per player.

export type Tier = 'bronze' | 'silver' | 'gold' | 'platinum';

export const TIERS: Tier[] = ['bronze', 'silver', 'gold', 'platinum'];

export const TIER_LABELS: Record<Tier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
};

// Colors chosen to read clearly as small dots against the app's near-black
// surface — standard bronze/silver/gold plus a violet platinum (matches the
// in-game tier convention: bronze < silver < gold < platinum).
export const TIER_COLORS: Record<Tier, string> = {
  bronze: '#c1793f',
  silver: '#c7cdd6',
  gold: '#e8b923',
  platinum: '#c084fc',
};

export const MAX_MENTAL_ABILITIES = 3;

export const MENTAL_ABILITIES = [
  'Best Friend', 'Clear Headed', 'Clutch Kicker', 'Defensive Rally', 'Fan Favorite',
  'Field General', 'Hot Head', 'Headstrong', 'Legion', 'Offensive Rally',
  'Road Dog', 'Team Player', 'The Natural', 'Winning Time',
];

// Archetype -> its fixed set of physical abilities.
export const ARCHETYPE_ABILITIES: Record<string, string[]> = {
  // QB
  'Backfield Creator': ['Off Platform', 'Pull Down', 'On Time', 'Magician', 'Mobile Deadeye'],
  'Dual Threat': ['Downhill', 'Extender', 'Option King', "Dot!", 'Mobile Resistance'],
  'Pocket Passer': ['Resistance', 'Step Up', 'Sleight of Hand', "Dot!", 'On Time'],
  'Pure Runner': ['Downhill', 'Option King', 'Shifty', 'Side Step', 'Workhorse'],

  // RB
  'Backfield Threat': ['360', 'Safety Valve', 'Takeoff', 'Side Step', 'Recoup'],
  'Contact Seeker': ['Downhill', 'Workhorse', 'Battering Ram', 'Ball Security', 'Balanced'],
  'East/West Playmaker': ['Recoup', 'Shifty', 'Side Step', '360', 'Arm Bar'],
  'Elusive Bruiser': ['Shifty', 'Headfirst', 'Side Step', 'Downhill', 'Arm Bar'],
  'North/South Receiver': ['Balanced', 'Arm Bar', 'Safety Valve', 'Headfirst', 'Downhill'],

  // FB
  Blocking: ['Strong Grip', 'Second Level', 'Pocket Shield', 'Sidekick', 'Screen Enforcer'],
  Utility: ['Safety Valve', 'Balanced', 'Screen Enforcer', 'Sidekick', 'Recoup'],

  // WR (Gritty Possession and Physical Route Runner are shared with TE — see below, values differ per position)
  'Contested Specialist': ['50/50', 'Workhorse', 'Balanced', 'Headfirst', 'Downhill'],
  'Elusive Route Runner': ['360', 'Cutter', 'Double Dip', 'Recoup', 'Side Step'],
  Gadget: ['Side Step', 'Shifty', "Dot!", 'Cutter', 'Extender'],
  'Route Artist': ['Cutter', 'Lay Out', 'Recoup', 'Double Dip', 'Sure Hands'],
  Speedster: ['Side Step', 'Double Dip', 'Take Off', 'Recoup', 'Shifty'],

  // OL
  Agile: ['Screen Enforcer', 'Quick Step', 'Option Shield', 'Outside Shield', 'Quick Drop'],
  'Pass Protector': ['Pocket Shield', 'Quick Drop', 'PA Shield', 'Strong Grip', 'Wear Down'],
  'Raw Strength': ['Strong Grip', 'Workhorse', 'Second Level', 'Inside Shield', 'Ground N Pound'],
  'Well Rounded': ['Pocket Shield', 'Outside Shield', 'Strong Grip', 'Option Shield', 'Inside Shield'],

  // Defensive line (Edge Setter = EDGE's name for the shared first archetype, Gap Specialist = DT's)
  'Edge Setter': ['Grip Breaker', 'Inside Disruptor', 'Outside Disruptor', 'Option Disruptor', 'Workhorse'],
  'Gap Specialist': ['Grip Breaker', 'Inside Disruptor', 'Outside Disruptor', 'Option Disruptor', 'Workhorse'],
  'Power Rusher': ['Pocket Disruptor', 'Duress', 'Grip Breaker', 'Workhorse', 'Take Down'],
  'Pure Power': ['Grip Breaker', 'Pocket Disruptor', 'Inside Disruptor', 'Workhorse', 'Hammer'],
  'Speed Rusher': ['Quick Jump', 'Duress', 'Take Down', 'Pocket Disruptor', 'Recoup'],

  // LB
  Lurker: ['House Call', 'Knockout', 'Bouncer', 'Robber', 'Wrap Up'],
  'Signal Caller': ['Take Down', 'Workhorse', 'Blow Up', 'Wrap Up', 'Hammer'],
  Thumper: ['Grip Breaker', 'Wrap Up', 'Aftershock', 'Blow Up', 'Hammer'],

  // CB
  Boundary: ['Jammer', 'Blanket Coverage', 'Lay Out', 'Wrap Up', 'Quick Jump'],
  'Bump and Run': ['Blanket Coverage', 'Jammer', 'House Call', 'Ball Hawk', 'Knockout'],
  Field: ['Wrap Up', 'Robber', 'Knockout', 'Blanket Coverage', 'Ball Hawk'],
  Zone: ['Knockout', 'Lay Out', 'House Call', 'Ball Hawk', 'Bouncer'],

  // S ('Coverage Specialist' for S is position-keyed below, since the name
  // is also used elsewhere with a different look)
  'Box Specialist': ['Aftershock', 'Wrap Up', 'Hammer', 'Blow Up', 'Workhorse'],
  Hybrid: [], // not fully captured yet — 5 icons visible in the source but labels were cut off

  // K/P (only 3 abilities each, not 5)
  Accurate: ['Chip Shot', 'Deep Range', 'Mega Leg'],
  Power: ['Deep Range', 'Mega Leg', 'Coffin Corner'],
};

// A few archetype names are shared across positions but have different
// ability sets per position (TE vs WR "Gritty Possession"/"Physical Route
// Runner", S vs TE "Coverage Specialist" name collision). Keyed by
// `${position}:${archetype}` and checked first; falls back to
// ARCHETYPE_ABILITIES[archetype] otherwise.
export const ARCHETYPE_ABILITIES_BY_POSITION: Record<string, string[]> = {
  'WR:Gritty Possession': ['Second Level', 'Outside Shield', 'Strong Grip', 'Workhorse', 'Sure Hands'],
  'WR:Physical Route Runner': ['Downhill', 'Press Pro', 'Sure Hands', '50/50', 'Cutter'],
  'TE:Gritty Possession': ['Workhorse', 'Strong Grip', 'Sure Hands', 'Outside Shield', 'Battering Ram'],
  'TE:Physical Route Runner': ['Balanced', '50/50', 'Cutter', 'Downhill', 'Sure Hands'],
  'TE:Pure Possession': ['Sure Hands', 'Wear Down', 'Strong Grip', 'Outside Shield', 'Balanced'],
  'TE:Pure Blocker': ['Strong Grip', 'Quick Drop', 'Outside Shield', 'Pocket Shield', 'Second Level'],
  'TE:Vertical Threat': ['Workhorse', 'Balanced', 'Take Off', 'Recoup', '50/50'],
  'S:Coverage Specialist': ['Ball Hawk', 'Lay Out', 'House Call', 'Robber', 'Knockout'],
};

export function abilitiesForArchetype(position: string, archetype: string): string[] {
  return ARCHETYPE_ABILITIES_BY_POSITION[`${position}:${archetype}`] ?? ARCHETYPE_ABILITIES[archetype] ?? [];
}

export type AbilityEntry = { name: string; category: 'physical' | 'mental'; tier: Tier };
