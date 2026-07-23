import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { isPaid } from "@/lib/billing/limits";
import { Card, CardBody } from "@/components/ui/Card";
import { DuplicatePracticeButton } from "@/components/practices/DuplicatePracticeButton";

export default async function PracticeHistoryPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { practices: { orderBy: { date: "desc" } } },
  });
  if (!team || team.userId !== user.id) notFound();

  const canDuplicate = isPaid(user);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">{team.name}: Practice History</h1>

      {team.practices.length === 0 ? (
        <Card>
          <CardBody className="pt-5 text-center text-muted">
            No practices saved yet.
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {team.practices.map((practice) => (
            <Card key={practice.id}>
              <CardBody className="pt-4 flex items-center justify-between gap-3">
                <Link
                  href={`/teams/${team.id}/practices/${practice.id}`}
                  className="flex-1"
                >
                  <p className="font-bold">{practice.title}</p>
                  <p className="text-sm text-muted">
                    {practice.date.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    · {practice.totalDurationMinutes} min
                  </p>
                </Link>
                <DuplicatePracticeButton
                  practiceId={practice.id}
                  teamId={team.id}
                  canDuplicate={canDuplicate}
                />
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
