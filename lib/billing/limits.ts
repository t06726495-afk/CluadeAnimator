import { prisma } from "@/lib/db";
import type { User } from "@prisma/client";

export const FREE_TEAM_LIMIT = 1;
export const FREE_PRACTICE_LIMIT = 2;

export function isPaid(user: Pick<User, "plan">): boolean {
  return user.plan === "paid";
}

export async function canCreateTeam(
  user: Pick<User, "id" | "plan">,
): Promise<boolean> {
  if (isPaid(user)) return true;
  const count = await prisma.team.count({ where: { userId: user.id } });
  return count < FREE_TEAM_LIMIT;
}

export async function canCreatePractice(
  user: Pick<User, "id" | "plan">,
): Promise<boolean> {
  if (isPaid(user)) return true;
  const count = await prisma.practice.count({
    where: { team: { userId: user.id } },
  });
  return count < FREE_PRACTICE_LIMIT;
}

export function requiresPaid(user: Pick<User, "plan">): boolean {
  return isPaid(user);
}

export async function getUsageSummary(user: Pick<User, "id" | "plan">) {
  const [teamCount, practiceCount] = await Promise.all([
    prisma.team.count({ where: { userId: user.id } }),
    prisma.practice.count({ where: { team: { userId: user.id } } }),
  ]);

  return {
    plan: user.plan,
    teamCount,
    practiceCount,
    teamLimit: isPaid(user) ? null : FREE_TEAM_LIMIT,
    practiceLimit: isPaid(user) ? null : FREE_PRACTICE_LIMIT,
    canCreateTeam: isPaid(user) || teamCount < FREE_TEAM_LIMIT,
    canCreatePractice: isPaid(user) || practiceCount < FREE_PRACTICE_LIMIT,
  };
}
