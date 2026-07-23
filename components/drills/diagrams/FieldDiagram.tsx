import type { DiagramMarkerKind, DiagramSpec } from "./types";

const MARKER_COLORS: Record<DiagramMarkerKind, string> = {
  coach: "#0b4d8f",
  hitter: "#1d6b3f",
  fielder: "#0f9d58",
  pitcher: "#6d28d9",
  runner: "#be123c",
  target: "#a15c00",
};

export function FieldDiagram({ spec }: { spec: DiagramSpec }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-auto max-w-[200px] mx-auto"
      role="img"
      aria-label="Drill setup diagram"
    >
      <defs>
        <marker
          id="diagram-arrowhead"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" className="fill-current text-muted" />
        </marker>
      </defs>

      {/* infield backdrop */}
      <path
        d="M50 92 L78 66 L50 40 L22 66 Z"
        className="fill-black/5 dark:fill-white/10 stroke-current text-border"
        strokeWidth="1"
      />
      <path
        d="M10 40 Q50 6 90 40"
        className="fill-none stroke-current text-border"
        strokeWidth="1"
      />
      <line x1="50" y1="92" x2="10" y2="40" className="stroke-current text-border" strokeWidth="1" />
      <line x1="50" y1="92" x2="90" y2="40" className="stroke-current text-border" strokeWidth="1" />
      <rect x="47.5" y="88.5" width="5" height="5" className="fill-current text-muted" transform="rotate(45 50 91)" />
      <rect x="75.5" y="63.5" width="5" height="5" className="fill-current text-muted" transform="rotate(45 78 66)" />
      <rect x="47.5" y="37.5" width="5" height="5" className="fill-current text-muted" transform="rotate(45 50 40)" />
      <rect x="19.5" y="63.5" width="5" height="5" className="fill-current text-muted" transform="rotate(45 22 66)" />
      <circle cx="50" cy="70" r="2.8" className="fill-current text-muted" />

      {spec.arrows.map((arrow, i) => (
        <line
          key={i}
          x1={arrow.from[0]}
          y1={arrow.from[1]}
          x2={arrow.to[0]}
          y2={arrow.to[1]}
          className="stroke-current text-foreground"
          strokeWidth="1.3"
          strokeDasharray={arrow.style === "dashed" ? "3 2.2" : undefined}
          markerEnd="url(#diagram-arrowhead)"
        />
      ))}

      {spec.markers.map((marker, i) => (
        <g key={i}>
          <circle
            cx={marker.x}
            cy={marker.y}
            r="4.5"
            fill={MARKER_COLORS[marker.kind ?? "fielder"]}
            stroke="white"
            strokeWidth="0.7"
          />
          <text
            x={marker.x}
            y={marker.y + 1.6}
            textAnchor="middle"
            fontSize="4.5"
            fontWeight="700"
            fill="white"
          >
            {marker.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
