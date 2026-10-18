"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SOURCE_LABELS, SOURCES, STAGE_LABELS, STAGE_STYLES, STAGES, type Source, type Stage } from "@/lib/constants";

const SOURCE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#0ea5e9", "#94a3b8"];
const axis = { fontSize: 12, fill: "#64748b" };

export function StageChart({ byStage }: { byStage: Record<Stage, number> }) {
  const data = STAGES.map((s) => ({ stage: STAGE_LABELS[s], count: byStage[s], fill: STAGE_STYLES[s].hex }));
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="stage" tick={axis} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tick={axis} tickLine={false} axisLine={false} />
          <Tooltip cursor={{ fill: "#f1f5f9" }} />
          <Bar dataKey="count" name="Candidates" radius={[4, 4, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.stage} fill={d.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SourceChart({ bySource }: { bySource: Record<Source, number> }) {
  const data = SOURCES.map((s, i) => ({ name: SOURCE_LABELS[s], value: bySource[s], color: SOURCE_COLORS[i] })).filter(
    (d) => d.value > 0,
  );
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2} stroke="none">
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 space-y-1.5">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
            <span className="text-slate-600">{d.name}</span>
            <span className="ml-auto tabular-nums text-slate-500">
              {d.value} · {Math.round((d.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ApplicationsChart({ weekly }: { weekly: { week: string; count: number }[] }) {
  const data = weekly.map((w) => ({
    ...w,
    label: new Date(`${w.week}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
  }));
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="apps" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tick={axis} tickLine={false} axisLine={false} />
          <Tooltip labelFormatter={(l) => `Week of ${l}`} />
          <Area type="monotone" dataKey="count" name="Applications" stroke="#6366f1" strokeWidth={2} fill="url(#apps)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
