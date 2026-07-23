import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { logOut } from "@/lib/actions/auth";
import { getUsageSummary } from "@/lib/billing/limits";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const usage = await getUsageSummary(user);

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-10 border-b-2 border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/teams" className="flex items-baseline gap-1 text-xl font-black tracking-tight">
            <span className="text-primary">Diamond</span>
            <span>Plan</span>
          </Link>
          <div className="flex items-center gap-2">
            {usage.plan === "free" ? (
              <Link
                href="/settings/upgrade"
                className="rounded-full border-2 border-primary px-3 py-1.5 text-sm font-bold text-primary"
              >
                Upgrade
              </Link>
            ) : (
              <span className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary">
                Paid
              </span>
            )}
            <Link
              href="/settings"
              aria-label="Settings"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-xl hover:bg-black/5 dark:hover:bg-white/10"
            >
              ⚙️
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 pb-24">
        {children}
      </main>

      <nav className="sticky bottom-0 z-10 border-t-2 border-border bg-surface">
        <div className="mx-auto flex max-w-3xl items-stretch">
          <Link
            href="/teams"
            className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-semibold"
          >
            <span className="text-xl">🏟️</span>
            Teams
          </Link>
          <Link
            href="/settings"
            className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-semibold"
          >
            <span className="text-xl">⚙️</span>
            Settings
          </Link>
          <form action={logOut} className="flex flex-1">
            <button className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-semibold">
              <span className="text-xl">🚪</span>
              Log Out
            </button>
          </form>
        </div>
      </nav>
    </div>
  );
}
