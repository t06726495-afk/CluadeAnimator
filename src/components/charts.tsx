import {
  CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

// Palette validated against surface #101014 (dataviz six-checks): fixed order.
export const CHART = {
  cardinal: '#d14747',
  gold: '#c08a1e',
  blue: '#3d8be0',
  green: '#2fa84f',
  grid: '#26262e',
  axis: '#6e6e7a',
};

export function ChartTooltip({ active, payload, label, labelFormatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="tt-title">{labelFormatter ? labelFormatter(label, payload) : label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="tt-row">
          <span className="tt-swatch" style={{ background: p.stroke ?? p.fill }} />
          {p.name}: <strong style={{ color: 'var(--text)' }}>{p.value ?? '—'}</strong>
        </div>
      ))}
    </div>
  );
}

type SeriesChartProps = {
  data: Array<Record<string, unknown>>;
  xKey: string;
  yKey: string;
  name: string;
  color?: string;
  height?: number;
  zeroLine?: boolean;
  reversedY?: boolean;
  // Recharts also accepts expression strings like 'dataMax + 5'
  yDomain?: [number | string, number | string];
  xLabel?: string;
  labelFormatter?: (label: unknown, payload: any[]) => string;
};

// One line, one axis. Thin 2px stroke, ≥8px hover markers, recessive grid.
export function SeriesChart({
  data, xKey, yKey, name, color = CHART.cardinal, height = 240,
  zeroLine = false, reversedY = false, yDomain, xLabel = 'Week', labelFormatter,
}: SeriesChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -14 }}>
        <CartesianGrid stroke={CHART.grid} strokeDasharray="3 4" vertical={false} />
        <XAxis
          dataKey={xKey}
          stroke={CHART.axis}
          tickLine={false}
          axisLine={{ stroke: CHART.grid }}
          tick={{ fill: CHART.axis, fontSize: 11 }}
          tickFormatter={(v) => `${xLabel === 'Week' ? 'W' : ''}${v}`}
        />
        <YAxis
          stroke={CHART.axis}
          tickLine={false}
          axisLine={false}
          tick={{ fill: CHART.axis, fontSize: 11 }}
          reversed={reversedY}
          domain={(yDomain as [number, number] | undefined) ?? ['auto', 'auto']}
        />
        {zeroLine && <ReferenceLine y={0} stroke={CHART.axis} strokeWidth={1} />}
        <Tooltip content={<ChartTooltip labelFormatter={labelFormatter} />} cursor={{ stroke: CHART.axis, strokeDasharray: '3 3' }} />
        <Line
          type="monotone"
          dataKey={yKey}
          name={name}
          stroke={color}
          strokeWidth={2}
          dot={{ r: 3, fill: color, strokeWidth: 0 }}
          activeDot={{ r: 5, stroke: 'var(--surface)', strokeWidth: 2 }}
          connectNulls
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
