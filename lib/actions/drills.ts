"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import {
  blockCategorySchema,
  drillAgeTierSchema,
  skillLevelSchema,
} from "@/lib/constants/enums";
import type { TeamAgeRange, SkillLevel } from "@/lib/constants/enums";
import { suggestDrillsForBlock } from "@/lib/drills/suggest";

async function loadBlockContext(blockId: string, userId: string) {
  const block = await prisma.block.findUnique({
    where: { id: blockId },
    include: {
      practice: { include: { team: true } },
      selections: true,
    },
  });
  if (!block || block.practice.team.userId !== userId) {
    throw new Error("Block not found.");
  }
  return block;
}

function revalidatePractice(teamId: string, practiceId: string) {
  revalidatePath(`/teams/${teamId}/practices/${practiceId}/edit`);
  revalidatePath(`/teams/${teamId}/practices/${practiceId}`);
}

export async function getSwappableDrills(blockId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in.");

  const block = await loadBlockContext(blockId, user.id);

  return suggestDrillsForBlock({
    category: block.category as Parameters<typeof suggestDrillsForBlock>[0]["category"],
    teamAgeRange: block.practice.team.ageRange as TeamAgeRange,
    teamSkillLevel: block.practice.team.skillLevel as SkillLevel,
    ownerUserId: user.id,
    excludeDrillIds: block.selections.map((s) => s.drillId),
  });
}

export async function swapDrillInBlock({
  selectionId,
  newDrillId,
}: {
  selectionId: string;
  newDrillId: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in.");

  const selection = await prisma.practiceDrillSelection.findUnique({
    where: { id: selectionId },
    include: { block: { include: { practice: { include: { team: true } } } } },
  });
  if (!selection || selection.block.practice.team.userId !== user.id) {
    throw new Error("Selection not found.");
  }

  await prisma.practiceDrillSelection.update({
    where: { id: selectionId },
    data: { drillId: newDrillId },
  });

  revalidatePractice(selection.block.practice.teamId, selection.block.practiceId);
}

export async function addDrillToBlock({
  blockId,
  drillId,
}: {
  blockId: string;
  drillId: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in.");

  const block = await loadBlockContext(blockId, user.id);
  const count = await prisma.practiceDrillSelection.count({ where: { blockId } });

  const selection = await prisma.practiceDrillSelection.create({
    data: { blockId, drillId, order: count },
    include: { drill: { include: { ageTiers: true, skillTags: true } } },
  });

  revalidatePractice(block.practice.teamId, block.practiceId);
  return selection;
}

export async function removeDrillFromBlock(selectionId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in.");

  const selection = await prisma.practiceDrillSelection.findUnique({
    where: { id: selectionId },
    include: { block: { include: { practice: { include: { team: true } } } } },
  });
  if (!selection || selection.block.practice.team.userId !== user.id) {
    throw new Error("Selection not found.");
  }

  await prisma.practiceDrillSelection.delete({ where: { id: selectionId } });
  revalidatePractice(selection.block.practice.teamId, selection.block.practiceId);
}

export async function updateSelectionNote({
  selectionId,
  note,
}: {
  selectionId: string;
  note: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in.");

  const selection = await prisma.practiceDrillSelection.findUnique({
    where: { id: selectionId },
    include: { block: { include: { practice: { include: { team: true } } } } },
  });
  if (!selection || selection.block.practice.team.userId !== user.id) {
    throw new Error("Selection not found.");
  }

  await prisma.practiceDrillSelection.update({
    where: { id: selectionId },
    data: { coachNote: note.trim() || null },
  });

  revalidatePractice(selection.block.practice.teamId, selection.block.practiceId);
}

const customDrillSchema = z.object({
  name: z.string().trim().min(1).max(100),
  category: blockCategorySchema,
  ageTiers: z.array(drillAgeTierSchema).min(1),
  skillLevels: z.array(skillLevelSchema).min(1),
  description: z.string().trim().min(1).max(1000),
  coachingCues: z.string().trim().max(1000).optional().default(""),
  equipment: z.string().trim().max(300).optional().default(""),
});

export async function createCustomDrill(
  input: z.infer<typeof customDrillSchema> & { addToBlockId?: string },
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in.");

  const parsed = customDrillSchema.parse(input);
  const slug = `custom-${user.id}-${Date.now()}-${parsed.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40)}`;

  const drill = await prisma.drill.create({
    data: {
      slug,
      name: parsed.name,
      category: parsed.category,
      description: parsed.description,
      coachingCues: parsed.coachingCues,
      equipment: parsed.equipment,
      ownerUserId: user.id,
      ageTiers: { create: parsed.ageTiers.map((ageTier) => ({ ageTier })) },
      skillTags: { create: parsed.skillLevels.map((skillLevel) => ({ skillLevel })) },
    },
  });

  if (input.addToBlockId) {
    const selection = await addDrillToBlock({
      blockId: input.addToBlockId,
      drillId: drill.id,
    });
    return { drill, selection };
  }

  return { drill, selection: null };
}
