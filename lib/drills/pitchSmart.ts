import type { DrillAgeTier } from "@/lib/constants/enums";

// Pitch Smart daily pitch count reference limits (usabaseball.com/pitch-smart).
export const PITCH_SMART_DAILY_LIMITS: Record<DrillAgeTier, number> = {
  "6U-8U": 50,
  "9U-10U": 75,
  "11U-12U": 85,
  "13U-14U": 95,
};

export function getPitchSmartLimit(ageTier: DrillAgeTier): number {
  return PITCH_SMART_DAILY_LIMITS[ageTier];
}
