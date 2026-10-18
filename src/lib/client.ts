import type { Source, Stage } from "./constants";

// Candidate as serialized by the API (dates arrive as ISO strings).
export type Candidate = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  stage: Stage;
  source: Source;
  skills: string[];
  rating: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StageHistoryEntry = {
  id: string;
  fromStage: Stage | null;
  toStage: Stage;
  changedAt: string;
};

export type CandidateWithHistory = Candidate & { history: StageHistoryEntry[] };

export class ApiError extends Error {
  constructor(
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? "Request failed", data.fields);
  return data as T;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}
