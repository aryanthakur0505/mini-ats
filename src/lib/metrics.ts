import { prisma } from "./prisma";
import { ACTIVE_STAGES, SOURCES, STAGES, type Source, type Stage } from "./constants";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKS_OF_TREND = 8;

export type Metrics = Awaited<ReturnType<typeof getMetrics>>;

export async function getMetrics() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const trendStart = startOfWeek(new Date(now.getTime() - (WEEKS_OF_TREND - 1) * 7 * DAY_MS));

  const [stageGroups, sourceGroups, recentApplicants, hireEvents, recentActivity] = await Promise.all([
    prisma.candidate.groupBy({ by: ["stage"], _count: { _all: true } }),
    prisma.candidate.groupBy({ by: ["source"], _count: { _all: true } }),
    prisma.candidate.findMany({ where: { createdAt: { gte: trendStart } }, select: { createdAt: true } }),
    prisma.stageHistory.findMany({
      where: { toStage: "HIRED", candidate: { stage: "HIRED" } },
      select: { changedAt: true, candidateId: true, candidate: { select: { createdAt: true } } },
      orderBy: { changedAt: "desc" },
    }),
    prisma.stageHistory.findMany({
      take: 8,
      orderBy: { changedAt: "desc" },
      include: { candidate: { select: { id: true, name: true, role: true } } },
    }),
  ]);

  const byStage = Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<Stage, number>;
  for (const g of stageGroups) byStage[g.stage] = g._count._all;

  const bySource = Object.fromEntries(SOURCES.map((s) => [s, 0])) as Record<Source, number>;
  for (const g of sourceGroups) bySource[g.source] = g._count._all;

  const total = STAGES.reduce((sum, s) => sum + byStage[s], 0);
  const active = ACTIVE_STAGES.reduce((sum, s) => sum + byStage[s], 0);
  const closed = byStage.HIRED + byStage.REJECTED;

  // A candidate could in theory be hired twice (moved out and back in); count their latest hire only.
  const latestHire = new Map<string, { changedAt: Date; appliedAt: Date }>();
  for (const e of hireEvents) {
    if (!latestHire.has(e.candidateId)) {
      latestHire.set(e.candidateId, { changedAt: e.changedAt, appliedAt: e.candidate.createdAt });
    }
  }
  const hires = [...latestHire.values()];
  const hiredThisMonth = hires.filter((h) => h.changedAt >= monthStart).length;
  const avgDaysToHire = hires.length
    ? Math.round(hires.reduce((sum, h) => sum + (h.changedAt.getTime() - h.appliedAt.getTime()), 0) / hires.length / DAY_MS)
    : null;

  const weekly = Array.from({ length: WEEKS_OF_TREND }, (_, i) => {
    const start = new Date(trendStart.getTime() + i * 7 * DAY_MS);
    return { week: start.toLocaleDateString("en-CA"), count: 0 };
  });
  for (const { createdAt } of recentApplicants) {
    const idx = Math.round((startOfWeek(createdAt).getTime() - trendStart.getTime()) / (7 * DAY_MS));
    if (weekly[idx]) weekly[idx].count++;
  }

  return {
    total,
    active,
    hiredThisMonth,
    // Of candidates whose process has finished, what share were hired.
    hireRate: closed ? Math.round((byStage.HIRED / closed) * 100) : null,
    avgDaysToHire,
    byStage,
    bySource,
    weekly,
    recentActivity: recentActivity.map((a) => ({
      id: a.id,
      candidate: a.candidate,
      fromStage: a.fromStage,
      toStage: a.toStage,
      changedAt: a.changedAt.toISOString(),
    })),
  };
}

// Monday 00:00 local time of the week containing `d`.
function startOfWeek(d: Date) {
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const offset = (day.getDay() + 6) % 7;
  return new Date(day.getTime() - offset * DAY_MS);
}
