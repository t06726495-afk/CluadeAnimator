"use client";

import { useTransition } from "react";
import { getSwappableDrills, swapDrillInBlock } from "@/lib/actions/drills";
import type { BuilderDrill, BlockCategory, TeamAgeRange } from "./types";

export function SwapDrillButton({
  blockId,
  selectionId,
  onSwapped,
}: {
  blockId: string;
  selectionId: string;
  onSwapped: (drill: BuilderDrill) => void;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="text-sm font-bold text-accent disabled:opacity-40"
      onClick={() => {
        startTransition(async () => {
          const alternatives = (await getSwappableDrills(
            blockId,
          )) as unknown as BuilderDrill[];
          if (alternatives.length === 0) return;
          const next = alternatives[0];
          await swapDrillInBlock({ selectionId, newDrillId: next.id });
          onSwapped(next);
        });
      }}
    >
      {pending ? "Swapping..." : "🔄 Swap"}
    </button>
  );
}

export type { BlockCategory, TeamAgeRange };
