"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { askCoachAI, type ChatMessage } from "@/lib/ai/coachChat";
import type { TeamAgeRange, SkillLevel } from "@/lib/constants/enums";

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(2000),
});

const MAX_HISTORY = 12;

export async function askCoach({
  teamId,
  messages,
}: {
  teamId: string;
  messages: ChatMessage[];
}): Promise<{ reply: string | null; error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { reply: null, error: "Not signed in." };

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team || team.userId !== user.id) {
    return { reply: null, error: "Team not found." };
  }

  const parsed = z.array(chatMessageSchema).min(1).max(MAX_HISTORY).safeParse(
    messages.slice(-MAX_HISTORY),
  );
  if (!parsed.success) {
    return { reply: null, error: "Invalid message." };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      reply: null,
      error:
        "AI Coach isn't configured yet. Add an ANTHROPIC_API_KEY to your environment to enable it.",
    };
  }

  try {
    const reply = await askCoachAI({
      team: {
        name: team.name,
        ageRange: team.ageRange as TeamAgeRange,
        skillLevel: team.skillLevel as SkillLevel,
      },
      messages: parsed.data,
    });
    return { reply, error: null };
  } catch (err) {
    console.error("askCoach failed:", err);
    return { reply: null, error: "The AI coach hit an error. Try again in a moment." };
  }
}
