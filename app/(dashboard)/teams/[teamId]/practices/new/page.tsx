import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { canCreatePractice } from "@/lib/billing/limits";
import { NewPracticeForm } from "@/components/practices/NewPracticeForm";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default async function NewPracticePage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team || team.userId !== user.id) notFound();

  const allowed = await canCreatePractice(user);
  if (!allowed) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-extrabold">New Practice</h1>
        <Card className="border-warning">
          <CardBody className="pt-5 space-y-3 text-center">
            <p>
              Free plan is limited to 2 saved practices. Upgrade for
              unlimited practice history.
            </p>
            <Link href="/settings/upgrade">
              <Button size="lg">Upgrade</Button>
            </Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">New Practice for {team.name}</h1>
      <Card>
        <CardBody className="pt-5">
          <NewPracticeForm teamId={team.id} />
        </CardBody>
      </Card>
    </div>
  );
}
