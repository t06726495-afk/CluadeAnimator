import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { CoachChat } from "@/components/ai/CoachChat";

export default async function AskCoachPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team || team.userId !== user.id) notFound();

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-extrabold">Ask AI Coach</h1>
      <p className="text-sm text-muted">{team.name}</p>
      <CoachChat teamId={team.id} teamName={team.name} />
    </div>
  );
}
