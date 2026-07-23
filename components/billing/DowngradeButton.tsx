"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { downgradeToFree } from "@/lib/actions/billing";
import { Button } from "@/components/ui/Button";

export function DowngradeButton() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="outline"
      className="w-full"
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await downgradeToFree();
          router.refresh();
        });
      }}
    >
      {pending ? "Switching..." : "Switch Back to Free (demo)"}
    </Button>
  );
}
