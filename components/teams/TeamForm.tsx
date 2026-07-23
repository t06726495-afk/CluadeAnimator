"use client";

import { useActionState } from "react";
import { createTeam, updateTeam, type TeamActionState } from "@/lib/actions/teams";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, FieldError } from "@/components/ui/Field";
import { TEAM_AGE_RANGES, SKILL_LEVELS } from "@/lib/constants/enums";
import { SKILL_LEVEL_LABELS } from "@/lib/constants/categories";
import type { Team } from "@prisma/client";

const initialState: TeamActionState = { error: null };

export function TeamForm({ team }: { team?: Team }) {
  const action = team ? updateTeam : createTeam;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {team && <input type="hidden" name="teamId" value={team.id} />}
      <div>
        <Label htmlFor="name">Team Name</Label>
        <Input
          id="name"
          name="name"
          required
          maxLength={80}
          placeholder="e.g. Rockies 10U"
          defaultValue={team?.name}
        />
      </div>
      <div>
        <Label htmlFor="ageRange">Age Range</Label>
        <Select id="ageRange" name="ageRange" required defaultValue={team?.ageRange ?? ""}>
          <option value="" disabled>
            Select age range
          </option>
          {TEAM_AGE_RANGES.map((range) => (
            <option key={range} value={range}>
              {range}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="skillLevel">Skill Level</Label>
        <Select
          id="skillLevel"
          name="skillLevel"
          required
          defaultValue={team?.skillLevel ?? ""}
        >
          <option value="" disabled>
            Select skill level
          </option>
          {SKILL_LEVELS.map((level) => (
            <option key={level} value={level}>
              {SKILL_LEVEL_LABELS[level]}
            </option>
          ))}
        </Select>
      </div>
      <FieldError>{state.error}</FieldError>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Saving..." : team ? "Save Changes" : "Create Team"}
      </Button>
    </form>
  );
}
