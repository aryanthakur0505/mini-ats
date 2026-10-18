"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import {
  SORT_OPTIONS,
  SOURCE_LABELS,
  SOURCES,
  STAGE_LABELS,
  STAGES,
  type SortOption,
} from "@/lib/constants";
import { apiFetch, formatDate, type Candidate } from "@/lib/client";
import { Button, PageHeader, Rating, StageBadge, inputClass } from "@/components/ui";
import { CandidateFormModal } from "@/components/candidate-form";

export function CandidatesView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [query, setQuery] = useState(params.get("q") ?? "");
  const stage = params.get("stage") ?? "";
  const source = params.get("source") ?? "";
  const sort = (params.get("sort") as SortOption) ?? "newest";

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

  const updateParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  // Debounce the search box into the URL so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const current = params.get("q") ?? "";
    if (query.trim() === current) return;
    const t = setTimeout(() => updateParam("q", query.trim()), 300);
    return () => clearTimeout(t);
  }, [query, params, updateParam]);

  const load = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams(params.toString());
    apiFetch<{ candidates: Candidate[] }>(`/api/candidates?${qs.toString()}`)
      .then((d) => setCandidates(d.candidates))
      .catch(() => toast.error("Could not load candidates"))
      .finally(() => setLoading(false));
  }, [params]);

  useEffect(load, [load]);

  const hasFilters = Boolean(params.get("q") || stage || source);
  const closeModal = useCallback(() => setModal({ open: false, id: null }), []);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Candidates"
        subtitle={loading ? "Loading…" : `${candidates.length} candidate${candidates.length === 1 ? "" : "s"}${hasFilters ? " match your filters" : ""}`}
        action={
          <Button onClick={() => setModal({ open: true, id: null })}>
            <Plus size={16} /> Add candidate
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <div className="relative flex-1 sm:min-w-64">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className={`${inputClass} pl-9`}
            placeholder="Search name, email, role or skill…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search candidates"
          />
        </div>
        <select className={`${inputClass} sm:w-40`} value={stage} onChange={(e) => updateParam("stage", e.target.value)} aria-label="Filter by stage">
          <option value="">All stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>
        <select className={`${inputClass} sm:w-40`} value={source} onChange={(e) => updateParam("source", e.target.value)} aria-label="Filter by source">
          <option value="">All sources</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {SOURCE_LABELS[s]}
            </option>
          ))}
        </select>
        <select className={`${inputClass} sm:w-44`} value={sort} onChange={(e) => updateParam("sort", e.target.value === "newest" ? "" : e.target.value)} aria-label="Sort">
          {Object.entries(SORT_OPTIONS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
        {hasFilters && (
          <Button
            variant="ghost"
            onClick={() => {
              setQuery("");
              router.replace(pathname, { scroll: false });
            }}
          >
            <X size={14} /> Clear
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading && candidates.length === 0 ? (
          <div className="flex justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin" />
          </div>
        ) : candidates.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-medium">{hasFilters ? "No candidates match your filters" : "No candidates yet"}</p>
            <p className="mt-1 text-sm text-slate-500">
              {hasFilters ? "Try a different search or clear the filters." : "Add your first candidate to get started."}
            </p>
          </div>
        ) : (
          <div className={`overflow-x-auto transition-opacity ${loading ? "opacity-60" : ""}`}>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Candidate</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Stage</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">Skills</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Source</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Rating</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {candidates.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setModal({ open: true, id: c.id })}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{c.name}</p>
                      <p className="text-xs text-slate-500">{c.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{c.role}</td>
                    <td className="px-4 py-3">
                      <StageBadge stage={c.stage} />
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {c.skills.slice(0, 3).map((s) => (
                          <span key={s} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                            {s}
                          </span>
                        ))}
                        {c.skills.length > 3 && <span className="text-xs text-slate-400">+{c.skills.length - 3}</span>}
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-slate-600 md:table-cell">{SOURCE_LABELS[c.source]}</td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <Rating value={c.rating} />
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-slate-500 sm:table-cell">{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CandidateFormModal open={modal.open} candidateId={modal.id} onClose={closeModal} onSaved={load} />
    </div>
  );
}
