import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getUsageSummary } from "@/lib/billing/limits";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DowngradeButton } from "@/components/billing/DowngradeButton";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const usage = await getUsageSummary(user);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">Settings</h1>

      <Card>
        <CardBody className="pt-4 space-y-1">
          <p className="text-sm font-semibold text-muted">Account</p>
          <p className="text-lg font-bold">{user.email}</p>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted">Plan</p>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
              {usage.plan === "paid" ? "Paid" : "Free"}
            </span>
          </div>
          {usage.plan === "free" ? (
            <>
              <ul className="text-sm text-muted space-y-1">
                <li>
                  Teams: {usage.teamCount} / {usage.teamLimit}
                </li>
                <li>
                  Saved practices: {usage.practiceCount} / {usage.practiceLimit}
                </li>
              </ul>
              <Link href="/settings/upgrade">
                <Button className="w-full">Upgrade to Paid</Button>
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-muted">
                Unlimited teams, unlimited saved practice history,
                duplicate-as-template, and PDF export are all unlocked.
              </p>
              <DowngradeButton />
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
