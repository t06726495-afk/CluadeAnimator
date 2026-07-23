import { Badge } from "@/components/ui/Badge";
import { SKILL_LEVEL_LABELS } from "@/lib/constants/categories";

export function AgeTierBadge({ ageTier }: { ageTier: string }) {
  return (
    <Badge className="border-accent/40 bg-accent/10 text-accent">
      {ageTier}
    </Badge>
  );
}

export function SkillLevelBadge({ skillLevel }: { skillLevel: string }) {
  return (
    <Badge className="border-primary/40 bg-primary/10 text-primary">
      {SKILL_LEVEL_LABELS[skillLevel] ?? skillLevel}
    </Badge>
  );
}
