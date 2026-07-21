import { z } from 'zod';

// Every extraction schema shares these conventions, mirrored in the prompts:
// - transcribe exactly what is visible, null for anything unreadable, never guess
// - numbers come back as numbers, player names spelled as shown on screen
// - each row carries a confidence flag so the review UI can highlight it

export const confidence = z.enum(['high', 'low']);
const cell = z.union([z.number(), z.string(), z.null()]);

export const SCREEN_TYPES = [
  'box_score',
  'player_game_stats',
  'season_stats',
  'standings',
  'schedule',
  'player_ratings',
  'recruiting_board',
  'recruit_profile',
  'team_stats',
  'unknown',
] as const;
export type ScreenType = (typeof SCREEN_TYPES)[number];

export const classificationSchema = z.object({
  screen_type: z.enum(SCREEN_TYPES),
  confidence,
  reason: z.string().nullable().optional(),
});

export const boxScoreSchema = z.object({
  teams: z
    .array(
      z.object({
        name: z.string(),
        score: z.number().nullable(),
        quarter_scores: z.array(z.number().nullable()).nullable().optional(),
      })
    )
    .length(2),
  stats: z
    .array(z.object({ label: z.string(), values: z.array(cell).length(2), confidence }))
    .default([]),
  confidence,
});

export const playerGameStatsSchema = z.object({
  tables: z.array(
    z.object({
      category: z.enum(['passing', 'rushing', 'receiving', 'defense', 'kicking', 'punting', 'returns', 'other']),
      columns: z.array(z.string()),
      rows: z.array(
        z.object({
          player: z.string(),
          team: z.string().nullable().optional(),
          values: z.array(cell),
          confidence,
        })
      ),
    })
  ),
  confidence,
});

export const standingsSchema = z.object({
  kind: z.enum(['conference', 'poll', 'other']),
  rows: z.array(
    z.object({
      rank: z.number().nullable(),
      team: z.string(),
      conf_record: z.string().nullable().optional(),
      overall_record: z.string().nullable().optional(),
      extra: z.string().nullable().optional(),
      confidence,
    })
  ),
  confidence,
});

export const scheduleSchema = z.object({
  rows: z.array(
    z.object({
      week: z.number().nullable(),
      opponent: z.string(),
      home: z.boolean().nullable(),
      result: z.enum(['W', 'L', 'T']).nullable().optional(),
      our_score: z.number().nullable().optional(),
      opp_score: z.number().nullable().optional(),
      confidence,
    })
  ),
  confidence,
});

export const playerRatingsSchema = z.object({
  rows: z.array(
    z.object({
      player: z.string(),
      position: z.string().nullable(),
      class_year: z.string().nullable().optional(),
      overall: z.number().nullable(),
      attributes: z.array(z.object({ name: z.string(), value: z.number().nullable() })).default([]),
      confidence,
    })
  ),
  confidence,
});

export const recruitingBoardSchema = z.object({
  rows: z.array(
    z.object({
      name: z.string(),
      position: z.string().nullable(),
      stars: z.number().nullable(),
      national_rank: z.number().nullable().optional(),
      position_rank: z.number().nullable().optional(),
      state: z.string().nullable().optional(),
      archetype: z.string().nullable().optional(),
      status: z.string().nullable().optional(),
      competitors: z.string().nullable().optional(),
      hours_spent: z.number().nullable().optional(),
      confidence,
    })
  ),
  confidence,
});

export const recruitProfileSchema = z.object({
  name: z.string(),
  position: z.string().nullable(),
  stars: z.number().nullable(),
  national_rank: z.number().nullable(),
  position_rank: z.number().nullable(),
  state: z.string().nullable(),
  archetype: z.string().nullable(),
  dev_trait: z.string().nullable().optional(),
  status: z.string().nullable(),
  competitors: z.array(z.string()).default([]),
  confidence,
});

// season_stats / team_stats / anything tabular that doesn't fit the above
export const genericTableSchema = z.object({
  title: z.string().nullable(),
  rows: z.array(z.object({ label: z.string(), value: cell, confidence })),
  confidence,
});

export const extractionSchemas: Record<string, z.ZodTypeAny> = {
  box_score: boxScoreSchema,
  player_game_stats: playerGameStatsSchema,
  season_stats: genericTableSchema,
  standings: standingsSchema,
  schedule: scheduleSchema,
  player_ratings: playerRatingsSchema,
  recruiting_board: recruitingBoardSchema,
  recruit_profile: recruitProfileSchema,
  team_stats: genericTableSchema,
};
