import type { BlockCategory, DrillAgeTier, SkillLevel, TeamAgeRange } from "@/lib/constants/enums";

export type BuilderDrill = {
  id: string;
  slug: string;
  name: string;
  category: BlockCategory;
  description: string;
  coachingCues: string;
  equipment: string;
  ownerUserId: string | null;
  ageTiers: string[];
  skillLevels: string[];
};

export type BuilderSelection = {
  id: string;
  order: number;
  coachNote: string | null;
  drill: BuilderDrill;
};

export type BuilderBlock = {
  id: string;
  category: BlockCategory;
  durationMinutes: number;
  order: number;
  coachNotes: string | null;
  selections: BuilderSelection[];
};

export type BuilderTeam = {
  id: string;
  name: string;
  ageRange: TeamAgeRange;
  skillLevel: SkillLevel;
};

export type BuilderPractice = {
  id: string;
  title: string;
  date: string;
  totalDurationMinutes: number;
  teamId: string;
  blocks: BuilderBlock[];
};

export type { BlockCategory, DrillAgeTier, SkillLevel, TeamAgeRange };
