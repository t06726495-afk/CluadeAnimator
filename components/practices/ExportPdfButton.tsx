"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { generatePracticeDropPdf } from "@/lib/pdf/exportPractice";
import type { BuilderPractice, BuilderTeam } from "@/components/practices/PracticeBuilder/types";

export function ExportPdfButton({
  practice,
  team,
  canExport,
}: {
  practice: BuilderPractice;
  team: BuilderTeam;
  canExport: boolean;
}) {
  if (!canExport) {
    return (
      <Link href="/settings/upgrade">
        <Button variant="outline" size="sm" type="button">
          Export PDF 🔒
        </Button>
      </Link>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      type="button"
      onClick={() => generatePracticeDropPdf(practice, team)}
    >
      Export PDF
    </Button>
  );
}
