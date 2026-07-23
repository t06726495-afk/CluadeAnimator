import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getUsageSummary } from "@/lib/billing/limits";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SKILL_LEVEL_LABELS, CATEGORY_META } from "@/lib/constants/categories";
import type { BlockCategory } from "@/lib/constants/enums";
import { DeleteTeamButton } from "@/components/teams/DeleteTeamButton";

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      practices: {
        orderBy: { date: "desc" },
        take: 5,
        include: { blocks: { select: { category: true, durationMinutes: true } } },
      },
      _count: { select: { practices: true } },
    },
  });

  if (!team || team.userId !== user.id) notFound();

  const usage = await getUsageSummary(user);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">{team.name}</h1>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <Badge>{team.ageRange}</Badge>
          <Badge>{SKILL_LEVEL_LABELS[team.skillLevel]}</Badge>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={`/teams/${team.id}/practices/new`} className="flex-1">
          <Button size="lg" className="w-full">
            + New Practice
          </Button>
        </Link>
        <Link href={`/teams/${team.id}/edit`}>
          <Button size="lg" variant="outline">
            Edit
          </Button>
        </Link>
        <DeleteTeamButton teamId={team.id} />
      </div>

      {!usage.canCreatePractice && (
        <Card className="border-warning">
          <CardBody className="pt-4 flex items-center justify-between gap-3">
            <p className="text-sm">
              Free plan is limited to {usage.practiceLimit} saved practices
              total. Upgrade for unlimited history.
            </p>
            <Link href="/settings/upgrade">
              <Button size="sm" variant="secondary">
                Upgrade
              </Button>
            </Link>
          </CardBody>
        </Card>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold">Recent Practices</h2>
          {team._count.practices > 0 && (
            <Link
              href={`/teams/${team.id}/practices`}
              className="text-sm font-semibold text-accent"
            >
              View all
            </Link>
          )}
        </div>

        {team.practices.length === 0 ? (
          <Card>
            <CardBody className="pt-5 text-center text-muted">
              No practices yet. Build your first one above.
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {team.practices.map((practice) => (
              <Link
                key={practice.id}
                href={`/teams/${team.id}/practices/${practice.id}`}
              >
                <Card className="hover:border-primary transition-colors">
                  <CardBody className="pt-4">
                    <div className="flex items-center justify-between">
                      <p className="font-bold">{practice.title}</p>
                      <p className="text-sm text-muted">
                        {practice.totalDurationMinutes} min
                      </p>
                    </div>
                    <p className="text-sm text-muted">
                      {practice.date.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {practice.blocks.map((block, i) => (
                        <span
                          key={i}
                          className={`h-2 rounded-full ${CATEGORY_META[block.category as BlockCategory].barClass}`}
                          style={{
                            width: `${Math.max(block.durationMinutes * 2, 12)}px`,
                          }}
                        />
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
