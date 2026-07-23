import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getUsageSummary } from "@/lib/billing/limits";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SKILL_LEVEL_LABELS } from "@/lib/constants/categories";

export default async function TeamsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [teams, usage] = await Promise.all([
    prisma.team.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { practices: true } } },
    }),
    getUsageSummary(user),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Your Teams</h1>
        {usage.canCreateTeam ? (
          <Link href="/teams/new">
            <Button size="sm">+ New Team</Button>
          </Link>
        ) : null}
      </div>

      {!usage.canCreateTeam && (
        <Card className="border-warning">
          <CardBody className="pt-4 flex items-center justify-between gap-3">
            <p className="text-sm">
              Free plan is limited to {usage.teamLimit} team. Upgrade for
              unlimited teams.
            </p>
            <Link href="/settings/upgrade">
              <Button size="sm" variant="secondary">
                Upgrade
              </Button>
            </Link>
          </CardBody>
        </Card>
      )}

      {teams.length === 0 ? (
        <Card>
          <CardBody className="pt-5 text-center space-y-3">
            <p className="text-muted">
              No teams yet. Create your first team to start building
              practices.
            </p>
            <Link href="/teams/new">
              <Button size="lg">+ Create Your First Team</Button>
            </Link>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {teams.map((team) => (
            <Link key={team.id} href={`/teams/${team.id}`}>
              <Card className="hover:border-primary transition-colors">
                <CardBody className="pt-4 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold">{team.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge>{team.ageRange}</Badge>
                      <Badge>{SKILL_LEVEL_LABELS[team.skillLevel]}</Badge>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted">
                    {team._count.practices} practice
                    {team._count.practices === 1 ? "" : "s"}
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
