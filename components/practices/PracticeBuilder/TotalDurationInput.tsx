"use client";

import {
  PRACTICE_MAX_MINUTES,
  PRACTICE_MIN_MINUTES,
  PRACTICE_DURATION_STEP,
} from "@/lib/constants/enums";

export function TotalDurationInput({
  value,
  onChange,
  id = "totalDurationMinutes",
}: {
  value: number;
  onChange: (value: number) => void;
  id?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="text-sm font-semibold">
          Total Practice Length
        </label>
        <span className="text-xl font-extrabold text-primary">
          {value} min
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={PRACTICE_MIN_MINUTES}
        max={PRACTICE_MAX_MINUTES}
        step={PRACTICE_DURATION_STEP}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-3 rounded-full accent-[var(--primary)]"
      />
      <div className="flex justify-between text-xs text-muted mt-1">
        <span>{PRACTICE_MIN_MINUTES} min</span>
        <span>{PRACTICE_MAX_MINUTES} min</span>
      </div>
    </div>
  );
}
