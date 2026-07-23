"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { duplicatePractice } from "@/lib/actions/practices";
import { Button } from "@/components/ui/Button";

export function DuplicatePracticeButton({
  practiceId,
  teamId,
  canDuplicate,
}: {
  practiceId: string;
  teamId: string;
  canDuplicate: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!canDuplicate) {
    return (
      <Link href="/settings/upgrade">
        <Button size="sm" variant="outline" type="button">
          Duplicate 🔒
        </Button>
      </Link>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await duplicatePractice(practiceId);
          if (result.practiceId) {
            router.push(`/teams/${teamId}/practices/${result.practiceId}/edit`);
          } else if (result.error) {
            alert(result.error);
          }
        });
      }}
    >
      {pending ? "Duplicating..." : "Duplicate"}
    </Button>
  );
}
