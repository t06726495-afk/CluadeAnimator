import type { DrillAgeTier, TeamAgeRange } from "@/lib/constants/enums";

const TEAM_AGE_RANGE_TO_DRILL_TIER: Record<TeamAgeRange, DrillAgeTier> = {
  "6U": "6U-8U",
  "8U": "6U-8U",
  "9U-10U": "9U-10U",
  "10U": "9U-10U",
  "12U": "11U-12U",
  "14U": "13U-14U",
};

export function mapTeamAgeRangeToDrillTier(
  teamAgeRange: TeamAgeRange,
): DrillAgeTier {
  return TEAM_AGE_RANGE_TO_DRILL_TIER[teamAgeRange];
}
