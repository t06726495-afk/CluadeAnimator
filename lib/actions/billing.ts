"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { planIntervalSchema, type PlanInterval } from "@/lib/constants/enums";

// Single isolated entry point for "becoming a paid user." No real payment
// processor is wired up yet — this simulates a successful purchase by
// flipping the user's plan directly. Swapping in real billing later means
// replacing the body of this function (e.g. redirecting to a Stripe
// Checkout session and flipping the plan from a webhook instead), not
// touching any call sites.
export async function upgradeToPaid(
  planInterval: PlanInterval,
): Promise<{ error: string | null }> {
  const parsed = planIntervalSchema.safeParse(planInterval);
  if (!parsed.success) {
    return { error: "Invalid plan selected." };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be signed in to upgrade." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { plan: "paid", planInterval: parsed.data },
  });

  revalidatePath("/", "layout");
  return { error: null };
}

export async function downgradeToFree(): Promise<{ error: string | null }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { plan: "free", planInterval: null },
  });

  revalidatePath("/", "layout");
  return { error: null };
}
