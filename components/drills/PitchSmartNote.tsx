import { mapTeamAgeRangeToDrillTier } from "@/lib/drills/ageTier";
import { getPitchSmartLimit } from "@/lib/drills/pitchSmart";
import type { TeamAgeRange } from "@/lib/constants/enums";

export function PitchSmartNote({ teamAgeRange }: { teamAgeRange: TeamAgeRange }) {
  const tier = mapTeamAgeRangeToDrillTier(teamAgeRange);
  const limit = getPitchSmartLimit(tier);

  return (
    <div className="rounded-xl border-2 border-warning/50 bg-warning/10 px-3 py-2 text-sm">
      <p className="font-bold text-warning">
        Pitch Smart reference: {limit} pitches/day max for {tier}
      </p>
      <p className="text-muted">
        Track every pitch thrown by each player today, in practice and
        games combined.
      </p>
    </div>
  );
}
