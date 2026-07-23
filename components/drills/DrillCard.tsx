"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { DrillDiagram } from "@/components/drills/diagrams/DrillDiagram";
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown";
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
        className="mt-2 flex items-center gap-1 text-sm font-semibold text-accent"
        onClick={() => setExpanded((e) => !e)}
      >
        {expanded ? "Hide details" : "Show details"}
        <CaretDown
          size={14}
          weight="bold"
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded && (
        <div className="mt-2 space-y-2 text-sm">
          {drill.diagramType && (
            <div className="rounded-lg bg-black/5 dark:bg-white/5 p-2">
              <DrillDiagram diagramType={drill.diagramType} />
            </div>
          )}
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
