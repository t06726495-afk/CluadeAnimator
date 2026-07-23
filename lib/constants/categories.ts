import type { BlockCategory } from "./enums";

export const CATEGORY_META: Record<
  BlockCategory,
  { label: string; shortLabel: string; barClass: string; badgeClass: string }
> = {
  "warm-up": {
    label: "Warm-Up",
    shortLabel: "Warm-Up",
    barClass: "bg-amber-400",
    badgeClass: "bg-amber-100 text-amber-900 border-amber-300",
  },
  hitting: {
    label: "Hitting",
    shortLabel: "Hitting",
    barClass: "bg-blue-500",
    badgeClass: "bg-blue-100 text-blue-900 border-blue-300",
  },
  defense: {
    label: "Defense",
    shortLabel: "Defense",
    barClass: "bg-emerald-500",
    badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  pitching: {
    label: "Pitching",
    shortLabel: "Pitching",
    barClass: "bg-violet-500",
    badgeClass: "bg-violet-100 text-violet-900 border-violet-300",
  },
  mixed: {
    label: "Mixed / Live",
    shortLabel: "Mixed",
    barClass: "bg-rose-500",
    badgeClass: "bg-rose-100 text-rose-900 border-rose-300",
  },
};

export const TEAM_AGE_RANGE_LABELS: Record<string, string> = {
  "6U": "6U",
  "8U": "8U",
  "9U-10U": "9U-10U",
  "10U": "10U",
  "12U": "12U",
  "14U": "14U",
};

export const SKILL_LEVEL_LABELS: Record<string, string> = {
  new: "New / Recreational",
  intermediate: "Intermediate",
  competitive: "Competitive / Travel",
};
