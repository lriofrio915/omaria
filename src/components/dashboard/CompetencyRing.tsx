"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface CompetencyRingProps {
  sinBrecha: number;
  conBrecha: number;
}

const COLORS = ["#10b981", "#f59e0b"];

export function CompetencyRing({ sinBrecha, conBrecha }: CompetencyRingProps) {
  const total = sinBrecha + conBrecha;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px]">
        <p className="text-sm text-muted-foreground">Sin datos de competencias</p>
      </div>
    );
  }

  const data = [
    { name: "Sin brecha", value: sinBrecha },
    { name: "Con brecha", value: conBrecha },
  ];

  const pct = Math.round((sinBrecha / total) * 100);

  return (
    <div className="space-y-4">
      <div className="relative h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={88}
              strokeWidth={0}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v, n) => [`${v} personas`, n]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid hsl(var(--border))",
                fontSize: 12,
                background: "hsl(var(--card))",
                color: "hsl(var(--foreground))",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold text-foreground">{pct}%</span>
          <span className="text-xs text-muted-foreground mt-0.5">cubiertos</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-5">
        {data.map((entry, i) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
            <span className="text-xs text-muted-foreground">
              {entry.name} <span className="font-semibold text-foreground">{entry.value}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
