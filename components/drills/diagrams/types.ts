export type DiagramMarkerKind =
  | "coach"
  | "hitter"
  | "fielder"
  | "pitcher"
  | "runner"
  | "target";

export type DiagramMarker = {
  x: number;
  y: number;
  label: string;
  kind?: DiagramMarkerKind;
};

export type DiagramArrow = {
  from: [number, number];
  to: [number, number];
  style?: "solid" | "dashed";
};

export type DiagramSpec = {
  markers: DiagramMarker[];
  arrows: DiagramArrow[];
};
