import { prisma } from "@/lib/db";
import { mapTeamAgeRangeToDrillTier } from "@/lib/drills/ageTier";
import type { BlockCategory, SkillLevel, TeamAgeRange } from "@/lib/constants/enums";

export type SuggestedDrill = {
  id: string;
  slug: string;
  name: string;
  category: BlockCategory;
  description: string;
  coachingCues: string;
  equipment: string;
  diagramType: string | null;
  ownerUserId: string | null;
  ageTiers: string[];
  skillLevels: string[];
};

async function fetchMatchingDrills({
  category,
  teamAgeRange,
  ownerUserId,
}: {
  category: BlockCategory;
  teamAgeRange: TeamAgeRange;
  ownerUserId: string;
}): Promise<SuggestedDrill[]> {
  const drillTier = mapTeamAgeRangeToDrillTier(teamAgeRange);

  const drills = await prisma.drill.findMany({
    where: {
      category,
      ageTiers: { some: { ageTier: drillTier } },
      OR: [{ ownerUserId: null }, { ownerUserId }],
    },
    include: { ageTiers: true, skillTags: true },
    orderBy: { name: "asc" },
  });

  return drills.map((d) => ({
    id: d.id,
    slug: d.slug,
    name: d.name,
    category: d.category as BlockCategory,
    description: d.description,
    coachingCues: d.coachingCues,
    equipment: d.equipment,
    diagramType: d.diagramType,
    ownerUserId: d.ownerUserId,
    ageTiers: d.ageTiers.map((t) => t.ageTier),
    skillLevels: d.skillTags.map((t) => t.skillLevel),
  }));
}

/**
 * Returns drills matching category + the team's mapped age tier, preferring
 * drills tagged for the team's skill level and topping up from the broader
 * tier-matched pool so the result is never empty.
 */
export async function suggestDrillsForBlock({
  category,
  teamAgeRange,
  teamSkillLevel,
  ownerUserId,
  excludeDrillIds = [],
  limit,
}: {
  category: BlockCategory;
  teamAgeRange: TeamAgeRange;
  teamSkillLevel: SkillLevel;
  ownerUserId: string;
  excludeDrillIds?: string[];
  limit?: number;
}): Promise<SuggestedDrill[]> {
  const excludeSet = new Set(excludeDrillIds);
  const pool = (
    await fetchMatchingDrills({ category, teamAgeRange, ownerUserId })
  ).filter((d) => !excludeSet.has(d.id));

  const primaryPool = pool.filter((d) =>
    d.skillLevels.includes(teamSkillLevel),
  );
  const fallbackPool = pool.filter(
    (d) => !d.skillLevels.includes(teamSkillLevel),
  );

  const ordered = [...primaryPool, ...fallbackPool];
  return typeof limit === "number" ? ordered.slice(0, limit) : ordered;
}

export const INLINE_SUGGESTION_COUNT = 3;
