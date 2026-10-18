export const STAGES = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"] as const;
export type Stage = (typeof STAGES)[number];

export const SOURCES = ["LINKEDIN", "REFERRAL", "WEBSITE", "JOB_BOARD", "OTHER"] as const;
export type Source = (typeof SOURCES)[number];

export const ACTIVE_STAGES: Stage[] = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER"];

export const STAGE_LABELS: Record<Stage, string> = {
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  HIRED: "Hired",
  REJECTED: "Rejected",
};

export const SOURCE_LABELS: Record<Source, string> = {
  LINKEDIN: "LinkedIn",
  REFERRAL: "Referral",
  WEBSITE: "Website",
  JOB_BOARD: "Job board",
  OTHER: "Other",
};

// Tailwind classes for stage badges and pipeline column accents.
export const STAGE_STYLES: Record<Stage, { badge: string; accent: string; hex: string }> = {
  APPLIED: { badge: "bg-slate-100 text-slate-700", accent: "border-t-slate-400", hex: "#94a3b8" },
  SCREENING: { badge: "bg-sky-100 text-sky-700", accent: "border-t-sky-500", hex: "#0ea5e9" },
  INTERVIEW: { badge: "bg-violet-100 text-violet-700", accent: "border-t-violet-500", hex: "#8b5cf6" },
  OFFER: { badge: "bg-amber-100 text-amber-800", accent: "border-t-amber-500", hex: "#f59e0b" },
  HIRED: { badge: "bg-emerald-100 text-emerald-700", accent: "border-t-emerald-500", hex: "#10b981" },
  REJECTED: { badge: "bg-rose-100 text-rose-700", accent: "border-t-rose-500", hex: "#f43f5e" },
};

export const SORT_OPTIONS = {
  newest: "Newest first",
  oldest: "Oldest first",
  name: "Name (A–Z)",
  rating: "Highest rated",
} as const;
export type SortOption = keyof typeof SORT_OPTIONS;
