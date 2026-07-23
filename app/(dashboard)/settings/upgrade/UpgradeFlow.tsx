"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upgradeToPaid } from "@/lib/actions/billing";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import type { PlanInterval } from "@/lib/constants/enums";

export function UpgradeFlow() {
  const [interval, setInterval] = useState<PlanInterval>("monthly");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setInterval("monthly")}
          className={`rounded-2xl border-2 p-4 text-left ${
            interval === "monthly" ? "border-primary bg-primary/5" : "border-border"
          }`}
        >
          <p className="text-sm font-semibold text-muted">Monthly</p>
          <p className="text-2xl font-extrabold">$4.99</p>
          <p className="text-xs text-muted">per month</p>
        </button>
        <button
          type="button"
          onClick={() => setInterval("yearly")}
          className={`rounded-2xl border-2 p-4 text-left ${
            interval === "yearly" ? "border-primary bg-primary/5" : "border-border"
          }`}
        >
          <p className="text-sm font-semibold text-muted">Yearly</p>
          <p className="text-2xl font-extrabold">$39.99</p>
          <p className="text-xs text-muted">save ~33%</p>
        </button>
      </div>

      <Card>
        <CardBody className="pt-4">
          <ul className="space-y-2 text-sm">
            <li>✓ Unlimited teams</li>
            <li>✓ Unlimited saved practice history</li>
            <li>✓ Duplicate practices as templates</li>
            <li>✓ PDF export for assistant coaches & parents</li>
          </ul>
        </CardBody>
      </Card>

      {error && <p className="text-sm font-medium text-danger">{error}</p>}

      <Button
        size="lg"
        className="w-full"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            const result = await upgradeToPaid(interval);
            if (result.error) {
              setError(result.error);
            } else {
              router.push("/settings");
              router.refresh();
            }
          });
        }}
      >
        {pending ? "Processing..." : `Upgrade — ${interval === "monthly" ? "$4.99/mo" : "$39.99/yr"}`}
      </Button>
      <p className="text-center text-xs text-muted">
        Demo mode: no payment is actually charged.
      </p>
    </div>
  );
}
