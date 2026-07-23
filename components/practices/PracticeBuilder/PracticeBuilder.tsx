"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StackedTimeBar } from "./StackedTimeBar";
import { BlockCard } from "./BlockCard";
import { AddBlockPanel } from "./AddBlockPanel";
import { TotalDurationInput } from "./TotalDurationInput";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { addBlock, moveBlockUp, moveBlockDown, removeBlock } from "@/lib/actions/blocks";
import { updatePracticeMeta } from "@/lib/actions/practices";
import type { BlockCategory, BuilderBlock, BuilderPractice, BuilderTeam } from "./types";

export function PracticeBuilder({
  practice: initialPractice,
  team,
}: {
  practice: BuilderPractice;
  team: BuilderTeam;
}) {
  const [practice, setPractice] = useState(initialPractice);
  const [addPending, startAddTransition] = useTransition();
  const [, startTransition] = useTransition();
  const router = useRouter();

  function updateBlockInState(
    blockId: string,
    updater: (block: BuilderBlock) => BuilderBlock,
  ) {
    setPractice((p) => ({
      ...p,
      blocks: p.blocks.map((b) => (b.id === blockId ? updater(b) : b)),
    }));
  }

  function handleAddBlock(category: BlockCategory, durationMinutes: number) {
    startAddTransition(async () => {
      const block = await addBlock({
        practiceId: practice.id,
        category,
        durationMinutes,
      });
      setPractice((p) => ({
        ...p,
        blocks: [...p.blocks, block as unknown as BuilderBlock],
      }));
    });
  }

  function handleRemoveBlock(blockId: string) {
    setPractice((p) => ({
      ...p,
      blocks: p.blocks.filter((b) => b.id !== blockId),
    }));
    startTransition(() => {
      removeBlock(blockId);
    });
  }

  function handleMove(blockId: string, direction: "up" | "down") {
    setPractice((p) => {
      const index = p.blocks.findIndex((b) => b.id === blockId);
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= p.blocks.length) return p;
      const blocks = [...p.blocks];
      [blocks[index], blocks[swapIndex]] = [blocks[swapIndex], blocks[index]];
      return { ...p, blocks };
    });
    startTransition(() => {
      if (direction === "up") {
        moveBlockUp(blockId);
      } else {
        moveBlockDown(blockId);
      }
    });
  }

  function handleTotalDurationChange(minutes: number) {
    setPractice((p) => ({ ...p, totalDurationMinutes: minutes }));
    startTransition(() => {
      updatePracticeMeta({ practiceId: practice.id, totalDurationMinutes: minutes });
    });
  }

  return (
    <div className="space-y-5 pb-10">
      <div>
        <h1 className="text-2xl font-extrabold">{practice.title}</h1>
        <p className="text-sm text-muted">{team.name}</p>
      </div>

      <Card>
        <CardBody className="pt-4 space-y-4">
          <TotalDurationInput
            value={practice.totalDurationMinutes}
            onChange={handleTotalDurationChange}
          />
          <StackedTimeBar
            blocks={practice.blocks}
            totalDurationMinutes={practice.totalDurationMinutes}
          />
        </CardBody>
      </Card>

      <div className="space-y-3">
        {practice.blocks.map((block, i) => (
          <BlockCard
            key={block.id}
            block={block}
            teamAgeRange={team.ageRange}
            isFirst={i === 0}
            isLast={i === practice.blocks.length - 1}
            onUpdate={(updater) => updateBlockInState(block.id, updater)}
            onRemove={() => handleRemoveBlock(block.id)}
            onMoveUp={() => handleMove(block.id, "up")}
            onMoveDown={() => handleMove(block.id, "down")}
          />
        ))}
      </div>

      <AddBlockPanel onAdd={handleAddBlock} pending={addPending} />

      <div className="sticky bottom-16 z-10">
        <Button
          size="lg"
          className="w-full shadow-lg"
          onClick={() => router.push(`/teams/${team.id}/practices/${practice.id}`)}
        >
          View Practice Summary
        </Button>
      </div>

      <div className="text-center">
        <Link href={`/teams/${team.id}`} className="text-sm font-semibold text-accent">
          ← Back to Team
        </Link>
      </div>
    </div>
  );
}
