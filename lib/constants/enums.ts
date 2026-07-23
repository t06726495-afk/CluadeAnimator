import { z } from "zod";

export const TEAM_AGE_RANGES = [
  "6U",
  "8U",
  "9U-10U",
  "10U",
  "12U",
  "14U",
] as const;
export type TeamAgeRange = (typeof TEAM_AGE_RANGES)[number];
export const teamAgeRangeSchema = z.enum(TEAM_AGE_RANGES);

export const DRILL_AGE_TIERS = [
  "6U-8U",
  "9U-10U",
  "11U-12U",
  "13U-14U",
] as const;
export type DrillAgeTier = (typeof DRILL_AGE_TIERS)[number];
export const drillAgeTierSchema = z.enum(DRILL_AGE_TIERS);

export const SKILL_LEVELS = ["new", "intermediate", "competitive"] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];
export const skillLevelSchema = z.enum(SKILL_LEVELS);

export const BLOCK_CATEGORIES = [
  "warm-up",
  "hitting",
  "defense",
  "pitching",
  "mixed",
] as const;
export type BlockCategory = (typeof BLOCK_CATEGORIES)[number];
export const blockCategorySchema = z.enum(BLOCK_CATEGORIES);

export const PLANS = ["free", "paid"] as const;
export type Plan = (typeof PLANS)[number];
export const planSchema = z.enum(PLANS);

export const PLAN_INTERVALS = ["monthly", "yearly"] as const;
export type PlanInterval = (typeof PLAN_INTERVALS)[number];
export const planIntervalSchema = z.enum(PLAN_INTERVALS);

export const PRACTICE_MIN_MINUTES = 30;
export const PRACTICE_MAX_MINUTES = 120;
export const PRACTICE_DURATION_STEP = 5;
