import { isDiagramType } from "@/lib/drills/diagramTypes";
import { DIAGRAM_SPECS } from "./specs";
import { FieldDiagram } from "./FieldDiagram";

export function DrillDiagram({ diagramType }: { diagramType: string | null | undefined }) {
  if (!isDiagramType(diagramType)) return null;
  return <FieldDiagram spec={DIAGRAM_SPECS[diagramType]} />;
}
