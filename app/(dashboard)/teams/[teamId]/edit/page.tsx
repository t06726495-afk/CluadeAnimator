import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { TeamForm } from "@/components/teams/TeamForm";
import { Card, CardBody } from "@/components/ui/Card";

export default async function EditTeamPage({
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
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Edit Team</h1>
      <Card>
        <CardBody className="pt-5">
          <TeamForm team={team} />
        </CardBody>
      </Card>
    </div>
  );
}
