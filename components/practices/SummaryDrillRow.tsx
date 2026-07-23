"use client";

import { useState } from "react";
import { DrillDiagram } from "@/components/drills/diagrams/DrillDiagram";
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown";
import type { BuilderSelection } from "@/components/practices/PracticeBuilder/types";

export function SummaryDrillRow({ selection }: { selection: BuilderSelection }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li className="border-t border-border pt-2 first:border-t-0 first:pt-0">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-start justify-between gap-2 text-left"
      >
        <span className="text-base font-bold">{selection.drill.name}</span>
        <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-accent">
          {expanded ? "Hide" : "Cues"}
          <CaretDown
            size={13}
            weight="bold"
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </span>
      </button>
      <p className="text-sm text-muted">{selection.drill.equipment}</p>
      {expanded && (
        <div className="mt-1.5 space-y-2 text-sm">
          {selection.drill.diagramType && (
            <div className="max-w-[140px] rounded-lg bg-black/5 dark:bg-white/5 p-2">
              <DrillDiagram diagramType={selection.drill.diagramType} />
            </div>
          )}
          <p>{selection.drill.description}</p>
          <p className="text-muted">
            <span className="font-semibold text-foreground">Cues: </span>
            {selection.drill.coachingCues}
          </p>
          {selection.coachNote && (
            <p className="text-muted">
              <span className="font-semibold text-foreground">Coach note: </span>
              {selection.coachNote}
            </p>
          )}
        </div>
      )}
    </li>
  );
}
