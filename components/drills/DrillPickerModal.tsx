"use client";

import { useEffect, useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea, FieldError } from "@/components/ui/Field";
import { DrillCard } from "@/components/drills/DrillCard";
import { getSwappableDrills, addDrillToBlock, createCustomDrill } from "@/lib/actions/drills";
import { DRILL_AGE_TIERS, SKILL_LEVELS } from "@/lib/constants/enums";
import { SKILL_LEVEL_LABELS } from "@/lib/constants/categories";
import { mapTeamAgeRangeToDrillTier } from "@/lib/drills/ageTier";
import type {
  BlockCategory,
  BuilderDrill,
  BuilderSelection,
  TeamAgeRange,
} from "@/components/practices/PracticeBuilder/types";

type Tab = "suggested" | "custom";

export function DrillPickerModal({
  open,
  onClose,
  blockId,
  category,
  teamAgeRange,
  onDrillAdded,
}: {
  open: boolean;
  onClose: () => void;
  blockId: string;
  category: BlockCategory;
  teamAgeRange: TeamAgeRange;
  onDrillAdded: (selection: BuilderSelection) => void;
}) {
  const [tab, setTab] = useState<Tab>("suggested");
  const [drills, setDrills] = useState<BuilderDrill[] | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    let active = true;
    getSwappableDrills(blockId).then((result) => {
      if (!active) return;
      setDrills(result as unknown as BuilderDrill[]);
      setTab("suggested");
    });
    return () => {
      active = false;
    };
  }, [open, blockId]);

  function handlePick(drillId: string) {
    startTransition(async () => {
      const selection = await addDrillToBlock({ blockId, drillId });
      onDrillAdded(selection as unknown as BuilderSelection);
      onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Add a Drill">
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setTab("suggested")}
          className={`flex-1 min-h-11 rounded-xl border-2 font-bold text-sm ${
            tab === "suggested"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border"
          }`}
        >
          Suggested
        </button>
        <button
          type="button"
          onClick={() => setTab("custom")}
          className={`flex-1 min-h-11 rounded-xl border-2 font-bold text-sm ${
            tab === "custom"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border"
          }`}
        >
          Add My Own
        </button>
      </div>

      {tab === "suggested" && (
        <div className="space-y-2">
          {drills === null && <p className="text-muted text-sm">Loading suggestions...</p>}
          {drills && drills.length === 0 && (
            <p className="text-muted text-sm">
              No more library drills for this category/age tier — try adding
              your own below.
            </p>
          )}
          {drills?.map((drill) => (
            <DrillCard
              key={drill.id}
              drill={drill}
              onSelect={() => handlePick(drill.id)}
              selectLabel={pending ? "Adding..." : "Add"}
            />
          ))}
        </div>
      )}

      {tab === "custom" && (
        <CustomDrillForm
          blockId={blockId}
          category={category}
          teamAgeRange={teamAgeRange}
          onCreated={(selection) => {
            onDrillAdded(selection);
            onClose();
          }}
        />
      )}
    </Modal>
  );
}

function CustomDrillForm({
  blockId,
  category,
  teamAgeRange,
  onCreated,
}: {
  blockId: string;
  category: BlockCategory;
  teamAgeRange: TeamAgeRange;
  onCreated: (selection: BuilderSelection) => void;
}) {
  const defaultTier = mapTeamAgeRangeToDrillTier(teamAgeRange);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coachingCues, setCoachingCues] = useState("");
  const [equipment, setEquipment] = useState("");
  const [ageTiers, setAgeTiers] = useState<string[]>([defaultTier]);
  const [skillLevels, setSkillLevels] = useState<string[]>(["new", "intermediate", "competitive"]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (ageTiers.length === 0 || skillLevels.length === 0) {
          setError("Pick at least one age tier and skill level.");
          return;
        }
        startTransition(async () => {
          const result = await createCustomDrill({
            name,
            category,
            description,
            coachingCues,
            equipment,
            ageTiers: ageTiers as never,
            skillLevels: skillLevels as never,
            addToBlockId: blockId,
          });
          if (result.selection) {
            onCreated(result.selection as unknown as BuilderSelection);
          }
        });
      }}
    >
      <div>
        <Label htmlFor="drillName">Drill Name</Label>
        <Input id="drillName" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="drillDescription">Description / Instructions</Label>
        <Textarea
          id="drillDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="drillCues">Coaching Cues</Label>
        <Textarea
          id="drillCues"
          value={coachingCues}
          onChange={(e) => setCoachingCues(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="drillEquipment">Equipment</Label>
        <Input
          id="drillEquipment"
          value={equipment}
          onChange={(e) => setEquipment(e.target.value)}
          placeholder="e.g. Tee, balls, cones"
        />
      </div>
      <div>
        <Label>Age Tiers</Label>
        <div className="flex flex-wrap gap-2">
          {DRILL_AGE_TIERS.map((tier) => (
            <label
              key={tier}
              className={`min-h-9 flex items-center rounded-full border-2 px-3 text-sm font-semibold ${
                ageTiers.includes(tier) ? "border-primary bg-primary/10" : "border-border"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={ageTiers.includes(tier)}
                onChange={() => toggle(ageTiers, setAgeTiers, tier)}
              />
              {tier}
            </label>
          ))}
        </div>
      </div>
      <div>
        <Label>Skill Levels</Label>
        <div className="flex flex-wrap gap-2">
          {SKILL_LEVELS.map((level) => (
            <label
              key={level}
              className={`min-h-9 flex items-center rounded-full border-2 px-3 text-sm font-semibold ${
                skillLevels.includes(level) ? "border-primary bg-primary/10" : "border-border"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={skillLevels.includes(level)}
                onChange={() => toggle(skillLevels, setSkillLevels, level)}
              />
              {SKILL_LEVEL_LABELS[level]}
            </label>
          ))}
        </div>
      </div>
      <FieldError>{error}</FieldError>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Adding..." : "Add Drill to Block"}
      </Button>
    </form>
  );
}
