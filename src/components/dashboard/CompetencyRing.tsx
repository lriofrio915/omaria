"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface CompetencyRingProps {
  sinBrecha: number;
  conBrecha: number;
}

const COLORS = ["#10b981", "#f59e0b"];
const LABELS = ["Sin brecha", "Con brecha"];

function CustomTooltip({ active, payload }: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  const color = COLORS[LABELS.indexOf(entry.name)];
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">{entry.name}</span>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 pl-3.5">
        <span className="font-bold text-slate-900 dark:text-white">{entry.value}</span> personas
      </p>
    </div>
  );
}

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
      <div className="relative h-[190px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={82}
              strokeWidth={3}
              stroke="transparent"
              paddingAngle={4}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold text-foreground">{pct}%</span>
          <span className="text-xs text-muted-foreground mt-0.5">cubiertos</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6">
        {data.map((entry, i) => (
          <div key={entry.name} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: COLORS[i] }}
            />
            <div className="text-xs leading-tight">
              <span className="font-semibold text-foreground">{entry.value}</span>
              <span className="text-muted-foreground ml-1">{entry.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
