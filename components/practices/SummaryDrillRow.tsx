"use client";

import { useState } from "react";
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
        <span className="shrink-0 text-sm font-semibold text-accent">
          {expanded ? "Hide ▲" : "Cues ▼"}
        </span>
      </button>
      <p className="text-sm text-muted">{selection.drill.equipment}</p>
      {expanded && (
        <div className="mt-1.5 space-y-1 text-sm">
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
