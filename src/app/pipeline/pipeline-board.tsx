"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { STAGE_LABELS, STAGE_STYLES, STAGES, type Stage } from "@/lib/constants";
import { apiFetch, timeAgo, type Candidate } from "@/lib/client";
import { Button, Modal, PageHeader, Rating, inputClass } from "@/components/ui";
import { CandidateFormModal } from "@/components/candidate-form";

// Moving into these stages ends the process, so ask before doing it.
const CONFIRM_STAGES: Stage[] = ["HIRED", "REJECTED"];

export function PipelineBoard() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pending, setPending] = useState<{ candidate: Candidate; to: Stage } | null>(null);
  const [modal, setModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const load = useCallback(() => {
    apiFetch<{ candidates: Candidate[] }>("/api/candidates?sort=newest")
      .then((d) => setCandidates(d.candidates))
      .catch(() => toast.error("Could not load pipeline"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const columns = useMemo(() => {
    const term = filter.trim().toLowerCase();
    const visible = term
      ? candidates.filter(
          (c) =>
            c.name.toLowerCase().includes(term) ||
            c.role.toLowerCase().includes(term) ||
            c.skills.some((s) => s.toLowerCase().includes(term)),
        )
      : candidates;
    return STAGES.map((stage) => ({ stage, items: visible.filter((c) => c.stage === stage) }));
  }, [candidates, filter]);

  async function moveCandidate(candidate: Candidate, to: Stage) {
    const from = candidate.stage;
    // Optimistic update; roll back if the server rejects it.
    setCandidates((list) => list.map((c) => (c.id === candidate.id ? { ...c, stage: to } : c)));
    try {
      await apiFetch(`/api/candidates/${candidate.id}/stage`, { method: "PATCH", body: JSON.stringify({ stage: to }) });
      toast.success(`${candidate.name} moved to ${STAGE_LABELS[to]}`);
    } catch {
      setCandidates((list) => list.map((c) => (c.id === candidate.id ? { ...c, stage: from } : c)));
      toast.error(`Could not move ${candidate.name}`);
    }
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const to = e.over?.id as Stage | undefined;
    const candidate = candidates.find((c) => c.id === e.active.id);
    if (!to || !candidate || candidate.stage === to) return;
    if (CONFIRM_STAGES.includes(to)) setPending({ candidate, to });
    else moveCandidate(candidate, to);
  }

  const activeCandidate = activeId ? candidates.find((c) => c.id === activeId) : null;
  const closeModal = useCallback(() => setModal({ open: false, id: null }), []);

  return (
    <div>
      <PageHeader
        title="Pipeline"
        subtitle="Drag candidates between stages to update their status"
        action={
          <div className="flex w-full gap-2 sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className={`${inputClass} pl-9`}
                placeholder="Filter by name, role, skill…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                aria-label="Filter pipeline"
              />
            </div>
            <Button onClick={() => setModal({ open: true, id: null })}>
              <Plus size={16} /> <span className="hidden sm:inline">Add</span>
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="flex justify-center py-24 text-slate-400">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActiveId(null)}>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 md:-mx-8 md:px-8">
            {columns.map(({ stage, items }) => (
              <Column key={stage} stage={stage} count={items.length}>
                {items.map((c) => (
                  <DraggableCard key={c.id} candidate={c} onOpen={() => setModal({ open: true, id: c.id })} />
                ))}
              </Column>
            ))}
          </div>
          <DragOverlay dropAnimation={null}>{activeCandidate && <CardBody candidate={activeCandidate} dragging />}</DragOverlay>
        </DndContext>
      )}

      <Modal open={pending !== null} onClose={() => setPending(null)} title={`Move to ${pending ? STAGE_LABELS[pending.to] : ""}?`}>
        {pending && (
          <>
            <p className="text-sm text-slate-600">
              {pending.to === "HIRED"
                ? `Mark ${pending.candidate.name} as hired for ${pending.candidate.role}?`
                : `Reject ${pending.candidate.name}? They will leave the active pipeline.`}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setPending(null)}>
                Cancel
              </Button>
              <Button
                variant={pending.to === "REJECTED" ? "danger" : "primary"}
                onClick={() => {
                  moveCandidate(pending.candidate, pending.to);
                  setPending(null);
                }}
              >
                {pending.to === "HIRED" ? "Mark as hired" : "Reject"}
              </Button>
            </div>
          </>
        )}
      </Modal>

      <CandidateFormModal open={modal.open} candidateId={modal.id} onClose={closeModal} onSaved={load} />
    </div>
  );
}

function Column({ stage, count, children }: { stage: Stage; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <section
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-xl border border-t-4 border-slate-200 ${STAGE_STYLES[stage].accent} transition-colors ${
        isOver ? "bg-indigo-50/70 ring-2 ring-indigo-300" : "bg-slate-100/70"
      }`}
    >
      <header className="flex items-center justify-between px-3 py-2.5">
        <h2 className="text-sm font-semibold text-slate-700">{STAGE_LABELS[stage]}</h2>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium tabular-nums text-slate-600">{count}</span>
      </header>
      <div className="flex min-h-32 flex-1 flex-col gap-2 px-2 pb-2">
        {children}
        {count === 0 && <p className="py-6 text-center text-xs text-slate-400">Drop candidates here</p>}
      </div>
    </section>
  );
}

function DraggableCard({ candidate, onOpen }: { candidate: Candidate; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: candidate.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onOpen}
      className={`touch-none ${isDragging ? "opacity-30" : ""}`}
      aria-label={`${candidate.name}, ${STAGE_LABELS[candidate.stage]}. Drag to change stage.`}
    >
      <CardBody candidate={candidate} />
    </div>
  );
}

function CardBody({ candidate, dragging = false }: { candidate: Candidate; dragging?: boolean }) {
  return (
    <div
      className={`cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow ${
        dragging ? "rotate-2 cursor-grabbing shadow-lg" : ""
      }`}
    >
      <p className="text-sm font-medium text-slate-900">{candidate.name}</p>
      <p className="text-xs text-slate-500">{candidate.role}</p>
      {candidate.skills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {candidate.skills.slice(0, 3).map((s) => (
            <span key={s} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
              {s}
            </span>
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between">
        <Rating value={candidate.rating} />
        <span className="text-[11px] text-slate-400">Applied {timeAgo(candidate.createdAt)}</span>
      </div>
    </div>
  );
}
