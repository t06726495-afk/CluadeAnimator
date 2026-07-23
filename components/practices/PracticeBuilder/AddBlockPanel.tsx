"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CATEGORY_META } from "@/lib/constants/categories";
import { BLOCK_CATEGORIES } from "@/lib/constants/enums";
import type { BlockCategory } from "./types";

export function AddBlockPanel({
  onAdd,
  pending,
}: {
  onAdd: (category: BlockCategory, durationMinutes: number) => void;
  pending: boolean;
}) {
  const [category, setCategory] = useState<BlockCategory>("warm-up");
  const [duration, setDuration] = useState(10);

  return (
    <div className="rounded-2xl border-2 border-dashed border-border p-4 space-y-3">
      <p className="text-sm font-bold">Add a Block</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {BLOCK_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`min-h-14 rounded-xl border-2 text-sm font-bold px-1 ${
              category === cat
                ? `${CATEGORY_META[cat].badgeClass} border-current`
                : "border-border"
            }`}
          >
            {CATEGORY_META[cat].shortLabel}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold">Duration</span>
        <button
          type="button"
          className="min-h-9 min-w-9 rounded-lg border-2 border-border font-bold"
          onClick={() => setDuration((d) => Math.max(5, d - 5))}
        >
          −
        </button>
        <span className="w-16 text-center text-lg font-extrabold">{duration} min</span>
        <button
          type="button"
          className="min-h-9 min-w-9 rounded-lg border-2 border-border font-bold"
          onClick={() => setDuration((d) => Math.min(60, d + 5))}
        >
          +
        </button>
      </div>
      <Button
        type="button"
        className="w-full"
        disabled={pending}
        onClick={() => onAdd(category, duration)}
      >
        {pending ? "Adding..." : `+ Add ${CATEGORY_META[category].label} Block`}
      </Button>
    </div>
  );
}
