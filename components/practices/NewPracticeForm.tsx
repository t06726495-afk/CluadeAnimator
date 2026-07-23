"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPractice } from "@/lib/actions/practices";
import { TotalDurationInput } from "@/components/practices/PracticeBuilder/TotalDurationInput";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Field";

export function NewPracticeForm({ teamId }: { teamId: string }) {
  const [title, setTitle] = useState("Practice");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [duration, setDuration] = useState(60);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await createPractice({
            teamId,
            title,
            date,
            totalDurationMinutes: duration,
          });
          if (result.practiceId) {
            router.push(`/teams/${teamId}/practices/${result.practiceId}/edit`);
          } else {
            setError(result.error ?? "Something went wrong.");
          }
        });
      }}
    >
      <div>
        <Label htmlFor="title">Practice Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
        />
      </div>
      <div>
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <TotalDurationInput value={duration} onChange={setDuration} />
      <FieldError>{error}</FieldError>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Starting..." : "Start Building Blocks →"}
      </Button>
    </form>
  );
}
