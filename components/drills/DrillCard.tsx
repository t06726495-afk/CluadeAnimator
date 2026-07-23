"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { BuilderDrill } from "@/components/practices/PracticeBuilder/types";

export function DrillCard({
  drill,
  onSelect,
  selectLabel = "Use This Drill",
}: {
  drill: BuilderDrill;
  onSelect?: () => void;
  selectLabel?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border-2 border-border p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold">{drill.name}</p>
          <p className="text-xs text-muted">{drill.equipment}</p>
        </div>
        {onSelect && (
          <Button size="sm" type="button" onClick={onSelect}>
            {selectLabel}
          </Button>
        )}
      </div>
      <button
        type="button"
        className="mt-2 text-sm font-semibold text-accent"
        onClick={() => setExpanded((e) => !e)}
      >
        {expanded ? "Hide details ▲" : "Show details ▼"}
      </button>
      {expanded && (
        <div className="mt-2 space-y-1.5 text-sm">
          <p>{drill.description}</p>
          <p className="text-muted">
            <span className="font-semibold text-foreground">Coaching cues: </span>
            {drill.coachingCues}
          </p>
        </div>
      )}
    </div>
  );
}
