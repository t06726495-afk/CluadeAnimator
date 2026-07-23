"use client";

import { useTransition } from "react";
import { deleteTeam } from "@/lib/actions/teams";
import { Button } from "@/components/ui/Button";

export function DeleteTeamButton({ teamId }: { teamId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="danger"
      size="lg"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this team and all of its saved practices?")) return;
        startTransition(() => {
          deleteTeam(teamId);
        });
      }}
    >
      Delete
    </Button>
  );
}
