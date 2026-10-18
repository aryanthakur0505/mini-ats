"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2, Star, Trash2 } from "lucide-react";
import { SOURCE_LABELS, SOURCES, STAGE_LABELS, STAGES, type Source, type Stage } from "@/lib/constants";
import { ApiError, apiFetch, formatDate, type Candidate, type CandidateWithHistory } from "@/lib/client";
import { Button, Modal, StageBadge, inputClass } from "./ui";

type FormState = {
  name: string;
  email: string;
  phone: string;
  role: string;
  stage: Stage;
  source: Source;
  skills: string;
  rating: number | null;
  notes: string;
};

const EMPTY: FormState = {
  name: "",
  email: "",
  phone: "",
  role: "",
  stage: "APPLIED",
  source: "LINKEDIN",
  skills: "",
  rating: null,
  notes: "",
};

function toForm(c: Candidate): FormState {
  return {
    name: c.name,
    email: c.email,
    phone: c.phone ?? "",
    role: c.role,
    stage: c.stage,
    source: c.source,
    skills: c.skills.join(", "),
    rating: c.rating,
    notes: c.notes ?? "",
  };
}

export function CandidateFormModal({
  open,
  candidateId,
  onClose,
  onSaved,
}: {
  open: boolean;
  /** null → create a new candidate */
  candidateId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [details, setDetails] = useState<CandidateWithHistory | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setConfirmDelete(false);
    setDetails(null);
    if (!candidateId) {
      setForm(EMPTY);
      return;
    }
    setLoading(true);
    apiFetch<{ candidate: CandidateWithHistory }>(`/api/candidates/${candidateId}`)
      .then(({ candidate }) => {
        setDetails(candidate);
        setForm(toForm(candidate));
      })
      .catch(() => {
        toast.error("Could not load candidate");
        onClose();
      })
      .finally(() => setLoading(false));
  }, [open, candidateId, onClose]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      skills: form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    try {
      await apiFetch(candidateId ? `/api/candidates/${candidateId}` : "/api/candidates", {
        method: candidateId ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      toast.success(candidateId ? "Candidate updated" : "Candidate added");
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      else toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!candidateId) return;
    setSaving(true);
    try {
      await apiFetch(`/api/candidates/${candidateId}`, { method: "DELETE" });
      toast.success("Candidate deleted");
      onSaved();
      onClose();
    } catch {
      toast.error("Could not delete candidate");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={candidateId ? "Edit candidate" : "Add candidate"}>
      {loading ? (
        <div className="flex justify-center py-16 text-slate-400">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" error={errors.name} required>
              <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Priya Nair" autoFocus />
            </Field>
            <Field label="Email" error={errors.email} required>
              <input className={inputClass} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="priya@example.com" />
            </Field>
            <Field label="Phone" error={errors.phone}>
              <input className={inputClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98765 43210" />
            </Field>
            <Field label="Role applied for" error={errors.role} required>
              <input className={inputClass} value={form.role} onChange={(e) => set("role", e.target.value)} placeholder="Frontend Engineer" />
            </Field>
            <Field label="Stage" error={errors.stage}>
              <select className={inputClass} value={form.stage} onChange={(e) => set("stage", e.target.value as Stage)}>
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Source" error={errors.source}>
              <select className={inputClass} value={form.source} onChange={(e) => set("source", e.target.value as Source)}>
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {SOURCE_LABELS[s]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Skills" hint="Comma separated" error={errors.skills}>
            <input className={inputClass} value={form.skills} onChange={(e) => set("skills", e.target.value)} placeholder="React, TypeScript, Node.js" />
          </Field>

          <Field label="Rating" error={errors.rating} group>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => set("rating", form.rating === n ? null : n)}
                  className="rounded p-0.5 hover:bg-slate-100"
                  aria-label={`Rate ${n}`}
                >
                  <Star size={20} className={form.rating && n <= form.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
                </button>
              ))}
              {form.rating && <span className="ml-2 text-xs text-slate-500">{form.rating}/5 · click again to clear</span>}
            </div>
          </Field>

          <Field label="Notes" error={errors.notes}>
            <textarea className={`${inputClass} min-h-20`} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Interview feedback, notice period, etc." />
          </Field>

          {details && details.history.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Stage history</p>
              <ol className="space-y-2 border-l border-slate-200 pl-4">
                {details.history.map((h) => (
                  <li key={h.id} className="relative text-sm">
                    <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-slate-300" />
                    <span className="flex flex-wrap items-center gap-1.5">
                      {h.fromStage ? (
                        <>
                          <StageBadge stage={h.fromStage} /> <span className="text-slate-400">→</span>
                        </>
                      ) : (
                        <span className="text-slate-500">Added as</span>
                      )}
                      <StageBadge stage={h.toStage} />
                      <span className="text-xs text-slate-400">{formatDate(h.changedAt)}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 border-t border-slate-200 pt-4">
            {candidateId ? (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Delete permanently?</span>
                  <Button type="button" variant="danger" onClick={handleDelete} disabled={saving}>
                    Yes, delete
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => setConfirmDelete(true)}>
                  <Trash2 size={14} /> Delete
                </Button>
              )
            ) : (
              <span />
            )}
            {!confirmDelete && (
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {candidateId ? "Save changes" : "Add candidate"}
                </Button>
              </div>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
}

function Field({
  label,
  hint,
  error,
  required,
  group,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** Render as a div: a <label> would forward clicks to the first button inside it. */
  group?: boolean;
  children: React.ReactNode;
}) {
  const Wrapper = group ? "div" : "label";
  return (
    <Wrapper className="block">
      <span className="mb-1 flex items-baseline gap-2 text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-rose-500">*</span>}
        {hint && <span className="text-xs font-normal text-slate-400">{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </Wrapper>
  );
}
