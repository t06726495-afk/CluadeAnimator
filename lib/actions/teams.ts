"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { canCreateTeam } from "@/lib/billing/limits";
import { teamAgeRangeSchema, skillLevelSchema } from "@/lib/constants/enums";

export type TeamActionState = { error: string | null };

const teamSchema = z.object({
  name: z.string().trim().min(1, "Team name is required.").max(80),
  ageRange: teamAgeRangeSchema,
  skillLevel: skillLevelSchema,
});

export async function createTeam(
  _prevState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = teamSchema.safeParse({
    name: formData.get("name"),
    ageRange: formData.get("ageRange"),
    skillLevel: formData.get("skillLevel"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  if (!(await canCreateTeam(user))) {
    return {
      error:
        "Free plan is limited to 1 team. Upgrade to add more teams.",
    };
  }

  const team = await prisma.team.create({
    data: { ...parsed.data, userId: user.id },
  });

  revalidatePath("/teams");
  redirect(`/teams/${team.id}`);
}

export async function updateTeam(
  _prevState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const teamId = String(formData.get("teamId") ?? "");
  const parsed = teamSchema.safeParse({
    name: formData.get("name"),
    ageRange: formData.get("ageRange"),
    skillLevel: formData.get("skillLevel"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team || team.userId !== user.id) {
    return { error: "Team not found." };
  }

  await prisma.team.update({ where: { id: teamId }, data: parsed.data });

  revalidatePath("/teams");
  revalidatePath(`/teams/${teamId}`);
  redirect(`/teams/${teamId}`);
}

export async function deleteTeam(teamId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team || team.userId !== user.id) return;

  await prisma.team.delete({ where: { id: teamId } });
  revalidatePath("/teams");
  redirect("/teams");
}
