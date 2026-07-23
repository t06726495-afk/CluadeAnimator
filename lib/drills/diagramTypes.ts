export const DIAGRAM_TYPES = [
  "tee-single",
  "tee-multi",
  "soft-toss",
  "front-toss",
  "live-bp",
  "ground-ball",
  "fly-ball",
  "backhand",
  "pop-up",
  "bucket-drill",
  "crow-hop",
  "cutoff-relay",
  "double-play",
  "bullpen",
  "long-toss",
  "warmup-jog",
  "team-defense",
  "live-scrimmage",
  "target-toss",
] as const;

export type DiagramType = (typeof DIAGRAM_TYPES)[number];

export function isDiagramType(value: string | null | undefined): value is DiagramType {
  return !!value && (DIAGRAM_TYPES as readonly string[]).includes(value);
}
