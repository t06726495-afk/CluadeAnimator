"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { canCreatePractice, requiresPaid } from "@/lib/billing/limits";
import {
  PRACTICE_MAX_MINUTES,
  PRACTICE_MIN_MINUTES,
} from "@/lib/constants/enums";

async function assertOwnsTeam(teamId: string, userId: string) {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team || team.userId !== userId) {
    throw new Error("Team not found.");
  }
  return team;
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

export async function createPractice({
  teamId,
  totalDurationMinutes,
  title,
  date,
}: {
  teamId: string;
  totalDurationMinutes: number;
  title?: string;
  date?: string;
}): Promise<{ practiceId: string | null; error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { practiceId: null, error: "Not signed in." };

  await assertOwnsTeam(teamId, user.id);

  if (!(await canCreatePractice(user))) {
    return {
      practiceId: null,
      error:
        "Free plan is limited to 2 saved practices. Upgrade for unlimited history.",
    };
  }

  const duration = z
    .number()
    .int()
    .min(PRACTICE_MIN_MINUTES)
    .max(PRACTICE_MAX_MINUTES)
    .parse(totalDurationMinutes);

  const practice = await prisma.practice.create({
    data: {
      teamId,
      totalDurationMinutes: duration,
      title: title?.trim() || "Practice",
      date: date ? new Date(date) : new Date(),
    },
  });

  revalidatePath(`/teams/${teamId}`);
  return { practiceId: practice.id, error: null };
}

export async function updatePracticeMeta({
  practiceId,
  title,
  date,
  totalDurationMinutes,
}: {
  practiceId: string;
  title?: string;
  date?: string;
  totalDurationMinutes?: number;
}): Promise<{ error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };

  const practice = await assertOwnsPractice(practiceId, user.id);

  await prisma.practice.update({
    where: { id: practiceId },
    data: {
      ...(title !== undefined ? { title: title.trim() || "Practice" } : {}),
      ...(date !== undefined ? { date: new Date(date) } : {}),
      ...(totalDurationMinutes !== undefined
        ? {
            totalDurationMinutes: z
              .number()
              .int()
              .min(PRACTICE_MIN_MINUTES)
              .max(PRACTICE_MAX_MINUTES)
              .parse(totalDurationMinutes),
          }
        : {}),
    },
  });

  revalidatePath(`/teams/${practice.teamId}`);
  revalidatePath(`/teams/${practice.teamId}/practices/${practiceId}`);
  return { error: null };
}

export async function deletePractice(practiceId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const practice = await assertOwnsPractice(practiceId, user.id);
  await prisma.practice.delete({ where: { id: practiceId } });

  revalidatePath(`/teams/${practice.teamId}`);
  redirect(`/teams/${practice.teamId}/practices`);
}

export async function duplicatePractice(
  practiceId: string,
): Promise<{ practiceId: string | null; error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { practiceId: null, error: "Not signed in." };

  if (!requiresPaid(user)) {
    return {
      practiceId: null,
      error: "Duplicate-as-template is a paid feature. Upgrade to unlock it.",
    };
  }

  const original = await prisma.practice.findUnique({
    where: { id: practiceId },
    include: {
      team: true,
      blocks: {
        orderBy: { order: "asc" },
        include: { selections: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!original || original.team.userId !== user.id) {
    return { practiceId: null, error: "Practice not found." };
  }

  const clone = await prisma.practice.create({
    data: {
      teamId: original.teamId,
      title: `${original.title} (Copy)`,
      date: new Date(),
      totalDurationMinutes: original.totalDurationMinutes,
      blocks: {
        create: original.blocks.map((block) => ({
          category: block.category,
          durationMinutes: block.durationMinutes,
          order: block.order,
          coachNotes: block.coachNotes,
          selections: {
            create: block.selections.map((sel) => ({
              drillId: sel.drillId,
              order: sel.order,
              coachNote: sel.coachNote,
            })),
          },
        })),
      },
    },
  });

  revalidatePath(`/teams/${original.teamId}`);
  return { practiceId: clone.id, error: null };
}
