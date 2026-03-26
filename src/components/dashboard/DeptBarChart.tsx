"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
  LabelList,
} from "recharts";

interface DeptData {
  name: string;
  colaboradores: number;
}

interface DeptBarChartProps {
  data: DeptData[];
}

const BAR_COLOR = "#1B52B5";

function truncate(str: string, max = 20) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-slate-800 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: BAR_COLOR }} />
        <span className="text-xs text-slate-500">Colaboradores:</span>
        <span className="text-xs font-bold text-slate-900">{payload[0].value}</span>
      </div>
    </div>
  );
}

export function DeptBarChart({ data }: DeptBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[220px]">
        <p className="text-sm text-muted-foreground">Sin departamentos registrados</p>
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.colaboradores));

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 36 + 20)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 40, bottom: 0, left: 8 }}
        barCategoryGap="35%"
      >
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          domain={[0, maxVal + 1]}
          hide
        />
        <YAxis
          type="category"
          dataKey="name"
          width={130}
          tick={{ fontSize: 11, fill: "#6b7280" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => truncate(v)}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: "#f1f5f9", radius: 4 }}
        />
        <Bar dataKey="colaboradores" radius={[0, 5, 5, 0]} maxBarSize={14}>
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={BAR_COLOR}
              fillOpacity={1 - i * (0.45 / Math.max(data.length - 1, 1))}
            />
          ))}
          <LabelList
            dataKey="colaboradores"
            position="right"
            style={{ fontSize: 11, fontWeight: 600, fill: "#374151" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
