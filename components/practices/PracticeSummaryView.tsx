import { CATEGORY_META, SKILL_LEVEL_LABELS } from "@/lib/constants/categories";
import { computeBlockStartOffsets, formatElapsed } from "@/lib/pdf/exportPractice";
import { PitchSmartNote } from "@/components/drills/PitchSmartNote";
import { SummaryDrillRow } from "@/components/practices/SummaryDrillRow";
import type { BuilderPractice, BuilderTeam } from "@/components/practices/PracticeBuilder/types";

export function PracticeSummaryView({
  practice,
  team,
}: {
  practice: BuilderPractice;
  team: BuilderTeam;
}) {
  const offsets = computeBlockStartOffsets(practice.blocks);
  const totalAllocated = practice.blocks.reduce((s, b) => s + b.durationMinutes, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold leading-tight">{practice.title}</h1>
        <p className="text-base font-medium text-muted">
          {team.name} · {team.ageRange} · {SKILL_LEVEL_LABELS[team.skillLevel]}
        </p>
        <p className="text-base font-medium text-muted">
          {new Date(practice.date).toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}{" "}
          · {totalAllocated} of {practice.totalDurationMinutes} min planned
        </p>
      </div>

      <div className="space-y-3">
        {practice.blocks.map((block) => {
          const offset = offsets.find((o) => o.blockId === block.id)!;
          const meta = CATEGORY_META[block.category];
          return (
            <div
              key={block.id}
              className="rounded-2xl border-2 border-border bg-surface overflow-hidden"
            >
              <div className={`${meta.barClass} h-1.5`} />
              <div className="p-3.5 space-y-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-lg font-extrabold">{meta.label}</span>
                  <span className="text-base font-bold text-muted tabular-nums">
                    {formatElapsed(offset.start)}–{formatElapsed(offset.end)}
                  </span>
                </div>

                {block.category === "pitching" && (
                  <PitchSmartNote teamAgeRange={team.ageRange} />
                )}

                {block.selections.length === 0 ? (
                  <p className="text-base text-muted">No drills listed.</p>
                ) : (
                  <ul className="space-y-2">
                    {block.selections.map((sel) => (
                      <SummaryDrillRow key={sel.id} selection={sel} />
                    ))}
                  </ul>
                )}

                {block.coachNotes && (
                  <p className="rounded-lg bg-black/5 dark:bg-white/10 p-2 text-sm">
                    <span className="font-bold">Note: </span>
                    {block.coachNotes}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
