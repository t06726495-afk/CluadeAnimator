import type { DiagramType } from "@/lib/drills/diagramTypes";
import type { DiagramSpec } from "./types";

export const DIAGRAM_SPECS: Record<DiagramType, DiagramSpec> = {
  "tee-single": {
    markers: [
      { x: 50, y: 90, label: "T", kind: "target" },
      { x: 50, y: 84, label: "H", kind: "hitter" },
    ],
    arrows: [{ from: [50, 84], to: [50, 18], style: "dashed" }],
  },
  "tee-multi": {
    markers: [
      { x: 44, y: 90, label: "T", kind: "target" },
      { x: 50, y: 90, label: "T", kind: "target" },
      { x: 56, y: 90, label: "T", kind: "target" },
      { x: 50, y: 84, label: "H", kind: "hitter" },
    ],
    arrows: [
      { from: [50, 84], to: [34, 25], style: "dashed" },
      { from: [50, 84], to: [50, 15], style: "dashed" },
      { from: [50, 84], to: [66, 25], style: "dashed" },
    ],
  },
  "soft-toss": {
    markers: [
      { x: 33, y: 87, label: "F", kind: "coach" },
      { x: 50, y: 86, label: "H", kind: "hitter" },
      { x: 50, y: 16, label: "N", kind: "target" },
    ],
    arrows: [
      { from: [33, 87], to: [48, 86], style: "solid" },
      { from: [50, 86], to: [50, 16], style: "dashed" },
    ],
  },
  "front-toss": {
    markers: [
      { x: 50, y: 66, label: "C", kind: "coach" },
      { x: 50, y: 72, label: "S", kind: "target" },
      { x: 50, y: 88, label: "H", kind: "hitter" },
    ],
    arrows: [{ from: [50, 66], to: [50, 86], style: "dashed" }],
  },
  "live-bp": {
    markers: [
      { x: 50, y: 70, label: "P", kind: "pitcher" },
      { x: 50, y: 88, label: "H", kind: "hitter" },
      { x: 78, y: 66, label: "1", kind: "fielder" },
      { x: 40, y: 50, label: "6", kind: "fielder" },
      { x: 60, y: 50, label: "4", kind: "fielder" },
      { x: 22, y: 66, label: "5", kind: "fielder" },
      { x: 50, y: 15, label: "8", kind: "fielder" },
    ],
    arrows: [{ from: [50, 70], to: [50, 86], style: "dashed" }],
  },
  "ground-ball": {
    markers: [
      { x: 50, y: 88, label: "C", kind: "coach" },
      { x: 40, y: 50, label: "F", kind: "fielder" },
      { x: 78, y: 66, label: "1", kind: "target" },
    ],
    arrows: [
      { from: [50, 88], to: [40, 50], style: "dashed" },
      { from: [40, 50], to: [78, 66], style: "solid" },
    ],
  },
  "fly-ball": {
    markers: [
      { x: 50, y: 88, label: "C", kind: "coach" },
      { x: 50, y: 18, label: "F", kind: "fielder" },
    ],
    arrows: [{ from: [50, 88], to: [50, 18], style: "dashed" }],
  },
  backhand: {
    markers: [
      { x: 50, y: 88, label: "C", kind: "coach" },
      { x: 42, y: 50, label: "F", kind: "fielder" },
    ],
    arrows: [{ from: [50, 88], to: [36, 46], style: "dashed" }],
  },
  "pop-up": {
    markers: [
      { x: 50, y: 88, label: "C", kind: "coach" },
      { x: 58, y: 55, label: "F", kind: "fielder" },
    ],
    arrows: [{ from: [50, 88], to: [58, 55], style: "dashed" }],
  },
  "bucket-drill": {
    markers: [
      { x: 50, y: 88, label: "C", kind: "coach" },
      { x: 50, y: 70, label: "F", kind: "fielder" },
    ],
    arrows: [
      { from: [50, 88], to: [50, 70], style: "dashed" },
      { from: [50, 70], to: [50, 86], style: "solid" },
    ],
  },
  "crow-hop": {
    markers: [
      { x: 50, y: 20, label: "F", kind: "fielder" },
      { x: 78, y: 66, label: "1", kind: "target" },
    ],
    arrows: [{ from: [50, 20], to: [78, 66], style: "solid" }],
  },
  "cutoff-relay": {
    markers: [
      { x: 50, y: 15, label: "OF", kind: "fielder" },
      { x: 60, y: 45, label: "CO", kind: "fielder" },
      { x: 78, y: 66, label: "B", kind: "target" },
    ],
    arrows: [
      { from: [50, 15], to: [60, 45], style: "dashed" },
      { from: [60, 45], to: [78, 66], style: "solid" },
    ],
  },
  "double-play": {
    markers: [
      { x: 40, y: 50, label: "6", kind: "fielder" },
      { x: 50, y: 40, label: "4", kind: "fielder" },
      { x: 78, y: 66, label: "3", kind: "target" },
    ],
    arrows: [
      { from: [40, 50], to: [50, 40], style: "solid" },
      { from: [50, 40], to: [78, 66], style: "solid" },
    ],
  },
  bullpen: {
    markers: [
      { x: 50, y: 70, label: "P", kind: "pitcher" },
      { x: 50, y: 90, label: "C", kind: "coach" },
    ],
    arrows: [{ from: [50, 70], to: [50, 88], style: "solid" }],
  },
  "long-toss": {
    markers: [
      { x: 50, y: 85, label: "A", kind: "fielder" },
      { x: 50, y: 15, label: "B", kind: "fielder" },
    ],
    arrows: [
      { from: [50, 80], to: [50, 20], style: "solid" },
      { from: [50, 20], to: [50, 80], style: "dashed" },
    ],
  },
  "warmup-jog": {
    markers: [{ x: 50, y: 92, label: "S", kind: "hitter" }],
    arrows: [
      { from: [50, 92], to: [78, 66], style: "dashed" },
      { from: [78, 66], to: [50, 40], style: "dashed" },
      { from: [50, 40], to: [22, 66], style: "dashed" },
      { from: [22, 66], to: [50, 92], style: "dashed" },
    ],
  },
  "team-defense": {
    markers: [
      { x: 50, y: 70, label: "P", kind: "pitcher" },
      { x: 78, y: 66, label: "1", kind: "fielder" },
      { x: 60, y: 50, label: "4", kind: "fielder" },
      { x: 40, y: 50, label: "6", kind: "fielder" },
      { x: 22, y: 66, label: "5", kind: "fielder" },
      { x: 20, y: 25, label: "7", kind: "fielder" },
      { x: 50, y: 15, label: "8", kind: "fielder" },
      { x: 80, y: 25, label: "9", kind: "fielder" },
      { x: 78, y: 66, label: "R", kind: "runner" },
    ],
    arrows: [],
  },
  "live-scrimmage": {
    markers: [
      { x: 50, y: 70, label: "P", kind: "pitcher" },
      { x: 50, y: 88, label: "H", kind: "hitter" },
      { x: 50, y: 94, label: "C", kind: "coach" },
      { x: 78, y: 66, label: "1", kind: "fielder" },
      { x: 60, y: 50, label: "4", kind: "fielder" },
      { x: 40, y: 50, label: "6", kind: "fielder" },
      { x: 22, y: 66, label: "5", kind: "fielder" },
      { x: 20, y: 25, label: "7", kind: "fielder" },
      { x: 50, y: 15, label: "8", kind: "fielder" },
      { x: 80, y: 25, label: "9", kind: "fielder" },
    ],
    arrows: [{ from: [50, 70], to: [50, 86], style: "dashed" }],
  },
  "target-toss": {
    markers: [
      { x: 50, y: 80, label: "T", kind: "fielder" },
      { x: 50, y: 50, label: "X", kind: "target" },
    ],
    arrows: [{ from: [50, 80], to: [50, 50], style: "dashed" }],
  },
};
