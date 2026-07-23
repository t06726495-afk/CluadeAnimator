import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { CATEGORY_META } from "@/lib/constants/categories";
import type { BuilderBlock, BuilderPractice, BuilderTeam } from "@/components/practices/PracticeBuilder/types";

export function generatePracticeDropPdf(
  practice: BuilderPractice,
  team: BuilderTeam,
) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`${practice.title}`, 40, 44);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const dateLabel = new Date(practice.date).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  doc.text(
    `${team.name}  ·  ${dateLabel}  ·  ${practice.totalDurationMinutes} minutes`,
    40,
    62,
  );

  let cursorY = 84;
  let elapsed = 0;

  for (const block of practice.blocks) {
    const start = formatElapsed(elapsed);
    const end = formatElapsed(elapsed + block.durationMinutes);
    elapsed += block.durationMinutes;

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(
      `${start}–${end}  ${CATEGORY_META[block.category].label} (${block.durationMinutes} min)`,
      40,
      cursorY,
    );
    cursorY += 6;

    const rows = block.selections.map((sel) => [
      sel.drill.name,
      sel.drill.equipment,
      sel.drill.coachingCues,
    ]);

    if (block.coachNotes) {
      rows.push(["Coach note", "", block.coachNotes]);
    }

    autoTable(doc, {
      startY: cursorY + 6,
      head: [["Drill", "Equipment", "Coaching Cues"]],
      body: rows.length > 0 ? rows : [["No drills added", "", ""]],
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [29, 107, 63] },
      margin: { left: 40, right: 40 },
      theme: "grid",
    });

    // @ts-expect-error lastAutoTable is attached by the plugin at runtime
    cursorY = doc.lastAutoTable.finalY + 20;

    if (cursorY > 700 && block !== practice.blocks[practice.blocks.length - 1]) {
      doc.addPage();
      cursorY = 44;
    }
  }

  doc.save(`${slugify(practice.title)}-${slugify(team.name)}.pdf`);
}

function formatElapsed(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function computeBlockStartOffsets(blocks: BuilderBlock[]) {
  let elapsed = 0;
  return blocks.map((block) => {
    const start = elapsed;
    elapsed += block.durationMinutes;
    return { blockId: block.id, start, end: elapsed };
  });
}

export { formatElapsed };
