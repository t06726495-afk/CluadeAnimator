import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PracticeBuilder } from "@/components/practices/PracticeBuilder/PracticeBuilder";
import type {
  BuilderPractice,
  BuilderTeam,
} from "@/components/practices/PracticeBuilder/types";
import type { BlockCategory, SkillLevel, TeamAgeRange } from "@/lib/constants/enums";

export default async function EditPracticePage({
  params,
}: {
  params: Promise<{ teamId: string; practiceId: string }>;
}) {
  const { teamId, practiceId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const practice = await prisma.practice.findUnique({
    where: { id: practiceId },
    include: {
      team: true,
      blocks: {
        orderBy: { order: "asc" },
        include: {
          selections: {
            orderBy: { order: "asc" },
            include: { drill: { include: { ageTiers: true, skillTags: true } } },
          },
        },
      },
    },
  });

  if (!practice || practice.team.userId !== user.id || practice.teamId !== teamId) {
    notFound();
  }

  const builderPractice: BuilderPractice = {
    id: practice.id,
    title: practice.title,
    date: practice.date.toISOString(),
    totalDurationMinutes: practice.totalDurationMinutes,
    teamId: practice.teamId,
    blocks: practice.blocks.map((block) => ({
      id: block.id,
      category: block.category as BlockCategory,
      durationMinutes: block.durationMinutes,
      order: block.order,
      coachNotes: block.coachNotes,
      selections: block.selections.map((sel) => ({
        id: sel.id,
        order: sel.order,
        coachNote: sel.coachNote,
        drill: {
          id: sel.drill.id,
          slug: sel.drill.slug,
          name: sel.drill.name,
          category: sel.drill.category as BlockCategory,
          description: sel.drill.description,
          coachingCues: sel.drill.coachingCues,
          equipment: sel.drill.equipment,
          ownerUserId: sel.drill.ownerUserId,
          ageTiers: sel.drill.ageTiers.map((t) => t.ageTier),
          skillLevels: sel.drill.skillTags.map((t) => t.skillLevel),
        },
      })),
    })),
  };

  const builderTeam: BuilderTeam = {
    id: practice.team.id,
    name: practice.team.name,
    ageRange: practice.team.ageRange as TeamAgeRange,
    skillLevel: practice.team.skillLevel as SkillLevel,
  };

  return <PracticeBuilder practice={builderPractice} team={builderTeam} />;
}
