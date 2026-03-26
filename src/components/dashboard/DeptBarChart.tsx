"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";

interface DeptData {
  name: string;
  colaboradores: number;
}

interface DeptBarChartProps {
  data: DeptData[];
}

const BAR_COLOR = "#1B52B5";

function truncate(str: string, max = 18) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

export function DeptBarChart({ data }: DeptBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <p className="text-sm text-muted-foreground">Sin departamentos registrados</p>
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.colaboradores));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 24, bottom: 0, left: 8 }}
        barCategoryGap="30%"
      >
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          domain={[0, maxVal + 1]}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => truncate(v)}
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--muted))", radius: 4 }}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid hsl(var(--border))",
            fontSize: 12,
            background: "hsl(var(--card))",
            color: "hsl(var(--foreground))",
          }}
          formatter={(v) => [`${v} colaboradores`, "Total"]}
        />
        <Bar dataKey="colaboradores" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={BAR_COLOR}
              fillOpacity={1 - i * (0.55 / Math.max(data.length - 1, 1))}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
