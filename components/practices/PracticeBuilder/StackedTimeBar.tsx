import { CATEGORY_META } from "@/lib/constants/categories";
import type { BuilderBlock } from "./types";

export function StackedTimeBar({
  blocks,
  totalDurationMinutes,
}: {
  blocks: BuilderBlock[];
  totalDurationMinutes: number;
}) {
  const allocated = blocks.reduce((sum, b) => sum + b.durationMinutes, 0);
  const remaining = totalDurationMinutes - allocated;
  const overflow = remaining < 0;
  const denom = overflow ? allocated : totalDurationMinutes;

  return (
    <div>
      <div className="flex h-6 w-full overflow-hidden rounded-full border-2 border-border bg-black/5 dark:bg-white/5">
        {blocks.map((block) => (
          <div
            key={block.id}
            className={`${CATEGORY_META[block.category].barClass} h-full`}
            style={{ width: `${(block.durationMinutes / denom) * 100}%` }}
            title={`${CATEGORY_META[block.category].label}: ${block.durationMinutes} min`}
          />
        ))}
        {!overflow && remaining > 0 && (
          <div
            className="h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(0,0,0,0.08)_6px,rgba(0,0,0,0.08)_12px)]"
            style={{ width: `${(remaining / denom) * 100}%` }}
          />
        )}
      </div>
      <div className="mt-2 flex items-center justify-between text-sm font-semibold">
        <span>{allocated} min allocated</span>
        {overflow ? (
          <span className="text-danger">
            {Math.abs(remaining)} min over {totalDurationMinutes} min
          </span>
        ) : (
          <span className={remaining === 0 ? "text-primary" : "text-muted"}>
            {remaining} min remaining
          </span>
        )}
      </div>
    </div>
  );
}
