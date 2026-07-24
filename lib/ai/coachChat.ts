import "server-only";
import Groq from "groq-sdk";
import { prisma } from "@/lib/db";
import { mapTeamAgeRangeToDrillTier } from "@/lib/drills/ageTier";
import type { TeamAgeRange, SkillLevel } from "@/lib/constants/enums";

const MODEL = "llama-3.3-70b-versatile";

let cachedClient: Groq | null = null;

function getClient(): Groq {
  if (!cachedClient) {
    cachedClient = new Groq();
  }
  return cachedClient;
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

async function buildSystemPrompt(team: {
  name: string;
  ageRange: TeamAgeRange;
  skillLevel: SkillLevel;
}): Promise<string> {
  const tier = mapTeamAgeRangeToDrillTier(team.ageRange);

  const drills = await prisma.drill.findMany({
    where: { ownerUserId: null, ageTiers: { some: { ageTier: tier } } },
    select: {
      name: true,
      category: true,
      description: true,
      coachingCues: true,
      equipment: true,
    },
    orderBy: { category: "asc" },
  });

  const drillLines = drills
    .map(
      (d) =>
        `- [${d.category}] ${d.name}: ${d.description} (Cues: ${d.coachingCues}; Equipment: ${d.equipment})`,
    )
    .join("\n");

  return `You are the DiamondPlan Coach Assistant, helping a volunteer youth baseball coach plan and run practices.

Team: ${team.name}
Age range: ${team.ageRange} (drill tier ${tier})
Skill level: ${team.skillLevel}

Ground every answer in real, age-appropriate youth baseball coaching practice:
- Never suggest static stretching for players under 10U.
- Respect Pitch Smart daily pitch count limits: 50 (6U-8U), 75 (9U-10U), 85 (11U-12U), 95 (13U-14U).
- Only suggest equipment a rec-league coach would realistically have: bats, balls, tees, cones, bases, and at most one L-screen.
- Keep throwing and pitching distances realistic for this age tier's field size, not adult distances.

Here is DiamondPlan's drill library for this team's age tier. Draw on it and reference drills by name when relevant:
${drillLines}

Answer the coach's questions clearly and practically. They're often reading this on a phone at the field, so keep responses focused and actionable. If a question is unrelated to youth baseball coaching or practice planning, gently redirect back to the topic.`;
}

export async function askCoachAI({
  team,
  messages,
}: {
  team: { name: string; ageRange: TeamAgeRange; skillLevel: SkillLevel };
  messages: ChatMessage[];
}): Promise<string> {
  const system = await buildSystemPrompt(team);

  const response = await getClient().chat.completions.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      { role: "system", content: system },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  });

  const content = response.choices[0]?.message?.content;

  return content?.trim() || "Sorry, I couldn't come up with an answer just now. Try asking again.";
}
