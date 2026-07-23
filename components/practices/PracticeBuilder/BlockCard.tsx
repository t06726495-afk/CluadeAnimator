"use client";

import { useState, useTransition } from "react";
import { CATEGORY_META } from "@/lib/constants/categories";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { PitchSmartNote } from "@/components/drills/PitchSmartNote";
import { DrillCard } from "@/components/drills/DrillCard";
import { DrillPickerModal } from "@/components/drills/DrillPickerModal";
import { SwapDrillButton } from "./SwapDrillButton";
import { updateBlock } from "@/lib/actions/blocks";
import { removeDrillFromBlock } from "@/lib/actions/drills";
import { CaretUp } from "@phosphor-icons/react/dist/ssr/CaretUp";
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { X } from "@phosphor-icons/react/dist/ssr/X";
import type { BuilderBlock, TeamAgeRange } from "./types";

export function BlockCard({
  block,
  teamAgeRange,
  isFirst,
  isLast,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  block: BuilderBlock;
  teamAgeRange: TeamAgeRange;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (updater: (block: BuilderBlock) => BuilderBlock) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [, startTransition] = useTransition();
  const meta = CATEGORY_META[block.category];

  function persistDuration(minutes: number) {
    startTransition(() => {
      updateBlock({ blockId: block.id, durationMinutes: minutes });
    });
  }

  function persistNotes(notes: string) {
    startTransition(() => {
      updateBlock({ blockId: block.id, coachNotes: notes });
    });
  }

  return (
    <div className="rounded-2xl border-2 border-border bg-surface overflow-hidden">
      <div className={`${meta.barClass} h-1.5`} />
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-bold ${meta.badgeClass}`}>
            {meta.label}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Move up"
              disabled={isFirst}
              onClick={onMoveUp}
              className="flex min-h-9 min-w-9 items-center justify-center rounded-lg border-2 border-border disabled:opacity-30"
            >
              <CaretUp size={16} weight="bold" />
            </button>
            <button
              type="button"
              aria-label="Move down"
              disabled={isLast}
              onClick={onMoveDown}
              className="flex min-h-9 min-w-9 items-center justify-center rounded-lg border-2 border-border disabled:opacity-30"
            >
              <CaretDown size={16} weight="bold" />
            </button>
            <button
              type="button"
              aria-label="Remove block"
              onClick={onRemove}
              className="flex min-h-9 min-w-9 items-center justify-center rounded-lg border-2 border-danger text-danger"
            >
              <X size={16} weight="bold" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">Duration</span>
          <button
            type="button"
            className="min-h-9 min-w-9 rounded-lg border-2 border-border font-bold"
            onClick={() => {
              const next = Math.max(5, block.durationMinutes - 5);
              onUpdate((b) => ({ ...b, durationMinutes: next }));
              persistDuration(next);
            }}
          >
            −
          </button>
          <span className="w-16 text-center text-lg font-extrabold">
            {block.durationMinutes} min
          </span>
          <button
            type="button"
            className="min-h-9 min-w-9 rounded-lg border-2 border-border font-bold"
            onClick={() => {
              const next = Math.min(60, block.durationMinutes + 5);
              onUpdate((b) => ({ ...b, durationMinutes: next }));
              persistDuration(next);
            }}
          >
            +
          </button>
        </div>

        {block.category === "pitching" && (
          <PitchSmartNote teamAgeRange={teamAgeRange} />
        )}

        <div className="space-y-2">
          {block.selections.map((selection) => (
            <div key={selection.id} className="rounded-xl border-2 border-border p-3">
              <div className="flex items-start justify-between gap-2">
                <DrillCard drill={selection.drill} />
              </div>
              <div className="mt-2 flex items-center gap-3">
                <SwapDrillButton
                  blockId={block.id}
                  selectionId={selection.id}
                  onSwapped={(drill) =>
                    onUpdate((b) => ({
                      ...b,
                      selections: b.selections.map((s) =>
                        s.id === selection.id ? { ...s, drill } : s,
                      ),
                    }))
                  }
                />
                <button
                  type="button"
                  className="text-sm font-bold text-danger"
                  onClick={() => {
                    onUpdate((b) => ({
                      ...b,
                      selections: b.selections.filter((s) => s.id !== selection.id),
                    }));
                    startTransition(() => {
                      removeDrillFromBlock(selection.id);
                    });
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {block.selections.length === 0 && (
            <p className="text-sm text-muted">No drills added yet.</p>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPickerOpen(true)}
        >
          + Add Drill
        </Button>

        <div>
          <label className="text-xs font-semibold text-muted">Coach Notes</label>
          <Textarea
            defaultValue={block.coachNotes ?? ""}
            placeholder="Notes for this block (optional)"
            className="min-h-16 text-sm"
            onBlur={(e) => persistNotes(e.target.value)}
          />
        </div>
      </div>

      <DrillPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        blockId={block.id}
        category={block.category}
        teamAgeRange={teamAgeRange}
        onDrillAdded={(selection) =>
          onUpdate((b) => ({ ...b, selections: [...b.selections, selection] }))
        }
      />
    </div>
  );
}
