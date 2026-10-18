import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, Percent, Users, UserPlus } from "lucide-react";
import { getMetrics } from "@/lib/metrics";
import { STAGE_LABELS } from "@/lib/constants";
import { PageHeader, StageBadge } from "@/components/ui";
import { ApplicationsChart, SourceChart, StageChart } from "@/components/dashboard-charts";
import { timeAgo } from "@/lib/client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const m = await getMetrics();

  const kpis = [
    { label: "Total candidates", value: m.total, icon: Users, tone: "text-indigo-600 bg-indigo-50" },
    { label: "Active in pipeline", value: m.active, icon: UserPlus, tone: "text-sky-600 bg-sky-50" },
    { label: "Hired this month", value: m.hiredThisMonth, icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50" },
    {
      label: "Hire rate",
      value: m.hireRate === null ? "—" : `${m.hireRate}%`,
      hint: "of closed candidates",
      icon: Percent,
      tone: "text-amber-600 bg-amber-50",
    },
    {
      label: "Avg. time to hire",
      value: m.avgDaysToHire === null ? "—" : `${m.avgDaysToHire}d`,
      hint: "applied → hired",
      icon: Clock,
      tone: "text-violet-600 bg-violet-50",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Dashboard" subtitle="Hiring at a glance" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {kpis.map(({ label, value, hint, icon: Icon, tone }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <span className={`rounded-md p-1.5 ${tone}`}>
                <Icon size={14} />
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
            {hint && <p className="text-xs text-slate-400">{hint}</p>}
          </div>
        ))}
      </div>

      {m.total === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="font-medium">No candidates yet</p>
          <p className="mt-1 text-sm text-slate-500">Add your first candidate to see hiring metrics here.</p>
          <Link href="/candidates" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline">
            Go to candidates <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <Card title="Candidates by stage" className="lg:col-span-2">
              <StageChart byStage={m.byStage} />
            </Card>
            <Card title="Candidates by source">
              <SourceChart bySource={m.bySource} />
            </Card>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card title="New applications per week" className="lg:col-span-2">
              <ApplicationsChart weekly={m.weekly} />
            </Card>
            <Card title="Recent activity">
              <ul className="divide-y divide-slate-100">
                {m.recentActivity.map((a) => (
                  <li key={a.id} className="py-2.5 text-sm">
                    <p className="font-medium text-slate-800">{a.candidate.name}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-slate-500">
                      {a.fromStage ? `${STAGE_LABELS[a.fromStage]} →` : "Added as"} <StageBadge stage={a.toStage} />
                      <span className="ml-auto text-slate-400">{timeAgo(a.changedAt)}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Card({ title, className = "", children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
      <h2 className="mb-3 text-sm font-semibold text-slate-700">{title}</h2>
      {children}
    </section>
  );
}
