"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { blockCategorySchema } from "@/lib/constants/enums";
import type { BlockCategory, TeamAgeRange, SkillLevel } from "@/lib/constants/enums";
import { suggestDrillsForBlock, INLINE_SUGGESTION_COUNT } from "@/lib/drills/suggest";

async function assertOwnsPracticeByBlock(blockId: string, userId: string) {
  const block = await prisma.block.findUnique({
    where: { id: blockId },
    include: { practice: { include: { team: true } } },
  });
  if (!block || block.practice.team.userId !== userId) {
    throw new Error("Block not found.");
  }
  return block;
}

async function assertOwnsPractice(practiceId: string, userId: string) {
  const practice = await prisma.practice.findUnique({
    where: { id: practiceId },
    include: { team: true },
  });
  if (!practice || practice.team.userId !== userId) {
    throw new Error("Practice not found.");
  }
  return practice;
}

function revalidatePractice(teamId: string, practiceId: string) {
  revalidatePath(`/teams/${teamId}/practices/${practiceId}/edit`);
  revalidatePath(`/teams/${teamId}/practices/${practiceId}`);
}

export async function addBlock({
  practiceId,
  category,
  durationMinutes,
}: {
  practiceId: string;
  category: BlockCategory;
  durationMinutes: number;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in.");

  const practice = await assertOwnsPractice(practiceId, user.id);
  const parsedCategory = blockCategorySchema.parse(category);
  const duration = z.number().int().min(5).max(60).parse(durationMinutes);

  const existingCount = await prisma.block.count({ where: { practiceId } });

  const block = await prisma.block.create({
    data: {
      practiceId,
      category: parsedCategory,
      durationMinutes: duration,
      order: existingCount,
    },
  });

  const suggestions = await suggestDrillsForBlock({
    category: parsedCategory,
    teamAgeRange: practice.team.ageRange as TeamAgeRange,
    teamSkillLevel: practice.team.skillLevel as SkillLevel,
    ownerUserId: user.id,
    limit: INLINE_SUGGESTION_COUNT,
  });

  if (suggestions.length > 0) {
    await prisma.practiceDrillSelection.createMany({
      data: suggestions.map((drill, i) => ({
        blockId: block.id,
        drillId: drill.id,
        order: i,
      })),
    });
  }

  revalidatePractice(practice.teamId, practiceId);

  return prisma.block.findUniqueOrThrow({
    where: { id: block.id },
    include: { selections: { include: { drill: true }, orderBy: { order: "asc" } } },
  });
}

export async function updateBlock({
  blockId,
  durationMinutes,
  coachNotes,
}: {
  blockId: string;
  durationMinutes?: number;
  coachNotes?: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in.");

  const block = await assertOwnsPracticeByBlock(blockId, user.id);

  await prisma.block.update({
    where: { id: blockId },
    data: {
      ...(durationMinutes !== undefined
        ? { durationMinutes: z.number().int().min(5).max(60).parse(durationMinutes) }
        : {}),
      ...(coachNotes !== undefined ? { coachNotes: coachNotes.trim() || null } : {}),
    },
  });

  revalidatePractice(block.practice.teamId, block.practiceId);
}

export async function removeBlock(blockId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in.");

  const block = await assertOwnsPracticeByBlock(blockId, user.id);
  await prisma.block.delete({ where: { id: blockId } });

  const remaining = await prisma.block.findMany({
    where: { practiceId: block.practiceId },
    orderBy: { order: "asc" },
  });
  await Promise.all(
    remaining.map((b, i) =>
      b.order === i
        ? Promise.resolve()
        : prisma.block.update({ where: { id: b.id }, data: { order: i } }),
    ),
  );

  revalidatePractice(block.practice.teamId, block.practiceId);
}

async function swapOrder(blockId: string, direction: "up" | "down") {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in.");

  const block = await assertOwnsPracticeByBlock(blockId, user.id);
  const siblings = await prisma.block.findMany({
    where: { practiceId: block.practiceId },
    orderBy: { order: "asc" },
  });

  const index = siblings.findIndex((b) => b.id === blockId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= siblings.length) return;

  const other = siblings[swapIndex];
  await prisma.$transaction([
    prisma.block.update({ where: { id: block.id }, data: { order: other.order } }),
    prisma.block.update({ where: { id: other.id }, data: { order: block.order } }),
  ]);

  revalidatePractice(block.practice.teamId, block.practiceId);
}

export async function moveBlockUp(blockId: string) {
  return swapOrder(blockId, "up");
}

export async function moveBlockDown(blockId: string) {
  return swapOrder(blockId, "down");
}
