"use client";

import { useState, useTransition } from "react";
import { createRubricAction, deleteRubricAction } from "@/lib/rubrics/actions";

interface Criterion {
  title: string;
  description: string;
  maxScore: number;
}

interface RubricBuilderProps {
  assignmentId: string;
  assignmentMaxScore: number;
  onSuccess?: () => void;
}

export function RubricBuilder({
  assignmentId,
  assignmentMaxScore,
  onSuccess,
}: RubricBuilderProps) {
  const [rubricTitle, setRubricTitle] = useState("Grading Rubric");
  const [criteria, setCriteria] = useState<Criterion[]>([
    { title: "", description: "", maxScore: 0 },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const total = criteria.reduce((s, c) => s + (Number(c.maxScore) || 0), 0);
  const isTotalValid = total === assignmentMaxScore;

  function addCriterion() {
    setCriteria((prev) => [...prev, { title: "", description: "", maxScore: 0 }]);
  }

  function removeCriterion(i: number) {
    setCriteria((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateCriterion(i: number, field: keyof Criterion, value: string) {
    setCriteria((prev) =>
      prev.map((c, idx) =>
        idx === i ? { ...c, [field]: field === "maxScore" ? parseInt(value) || 0 : value } : c
      )
    );
  }

  function handleSave() {
    setError(null);
    if (!isTotalValid) {
      setError(`Criterion totals (${total}) must equal assignment max score (${assignmentMaxScore}).`);
      return;
    }
    if (criteria.some((c) => !c.title.trim())) {
      setError("All criteria must have a title.");
      return;
    }

    startTransition(async () => {
      const result = await createRubricAction(
        assignmentId,
        rubricTitle,
        criteria.map((c, i) => ({ ...c, sortOrder: i }))
      );
      if (result.success) {
        onSuccess?.();
      } else {
        setError(result.error ?? "Failed to save rubric.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-[#171717] mb-1.5">
          Rubric title
        </label>
        <input
          value={rubricTitle}
          onChange={(e) => setRubricTitle(e.target.value)}
          className="w-full h-11 rounded-xl border border-[#E7E3DA] bg-white px-3.5 text-xs text-[#171717] focus:border-[#171717] focus:outline-hidden"
        />
      </div>

      <div className="space-y-3">
        {criteria.map((c, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[#E7E3DA] bg-[#F7F4ED]/50 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">
                Criterion {i + 1}
              </span>
              {criteria.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCriterion(i)}
                  className="text-xs font-medium text-[#EA4335] hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
            <input
              placeholder="Title *"
              value={c.title}
              onChange={(e) => updateCriterion(i, "title", e.target.value)}
              className="w-full h-10 rounded-xl border border-[#E7E3DA] bg-white px-3 text-xs text-[#171717] focus:border-[#171717] focus:outline-hidden"
            />
            <input
              placeholder="Description (optional)"
              value={c.description}
              onChange={(e) => updateCriterion(i, "description", e.target.value)}
              className="w-full h-10 rounded-xl border border-[#E7E3DA] bg-white px-3 text-xs text-[#171717] focus:border-[#171717] focus:outline-hidden"
            />
            <div className="flex items-center gap-2 pt-1">
              <label className="text-xs text-[#737373] shrink-0 font-medium">Max score:</label>
              <input
                type="number"
                min={0}
                value={c.maxScore}
                onChange={(e) => updateCriterion(i, "maxScore", e.target.value)}
                className="w-24 h-10 rounded-xl border border-[#E7E3DA] bg-white px-3 text-xs text-[#171717] focus:border-[#171717] focus:outline-hidden"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Total validation */}
      <div
        className={`rounded-xl px-3.5 py-2.5 text-xs font-medium border ${
          isTotalValid
            ? "bg-green-50 text-[#34A853] border-[#34A853]/30"
            : "bg-amber-50 text-[#B45309] border-[#FBBC04]/40"
        }`}
      >
        Criterion total: {total} / {assignmentMaxScore}
        {!isTotalValid && " — must equal assignment max score"}
      </div>

      {error && <p className="text-xs text-[#EA4335]">{error}</p>}

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={addCriterion}
          className="rounded-xl border border-[#E7E3DA] bg-white px-3.5 py-2 text-xs font-medium text-[#171717] hover:bg-[#F7F4ED] transition-colors"
        >
          + Add criterion
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !isTotalValid}
          className="rounded-xl bg-[#171717] px-4 py-2 text-xs font-semibold text-white hover:bg-black disabled:opacity-40 transition-colors shadow-2xs"
        >
          {isPending ? "Saving…" : "Save rubric"}
        </button>
      </div>
    </div>
  );
}

// ── Rubric Viewer (student / grader) ──────────────────────────────────────────

interface RubricScore {
  score: number;
  feedback: string | null;
  criterion: { title: string; description: string | null; maxScore: number };
}

interface RubricViewerProps {
  title: string;
  scores: RubricScore[];
  released: boolean;
}

export function RubricViewer({ title, scores, released }: RubricViewerProps) {
  if (!scores.length) return null;

  const total = scores.reduce((s, r) => s + r.score, 0);
  const maxTotal = scores.reduce((s, r) => s + r.criterion.maxScore, 0);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[#171717]">{title}</h3>
      <div className="divide-y divide-[#E7E3DA] rounded-2xl border border-[#E7E3DA] bg-white overflow-hidden">
        {scores.map((r, i) => (
          <div key={i} className="px-4 py-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#171717]">
                {r.criterion.title}
              </span>
              {released ? (
                <span className="text-xs font-bold text-[#171717]">
                  {r.score} / {r.criterion.maxScore}
                </span>
              ) : (
                <span className="text-xs text-[#737373]">— / {r.criterion.maxScore}</span>
              )}
            </div>
            {r.criterion.description && (
              <p className="text-xs text-[#737373] mt-0.5">{r.criterion.description}</p>
            )}
            {released && r.feedback && (
              <p className="text-xs text-[#737373] italic mt-1">{r.feedback}</p>
            )}
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-3 bg-[#F7F4ED]/60 rounded-b-2xl">
          <span className="text-xs font-semibold text-[#737373]">Total</span>
          {released ? (
            <span className="text-sm font-bold text-[#171717]">
              {total} / {maxTotal}
            </span>
          ) : (
            <span className="text-xs text-[#737373]">Pending</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── RubricDeleteButton ────────────────────────────────────────────────────────

export function RubricDeleteButton({ assignmentId }: { assignmentId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        if (!confirm("Delete this rubric? This cannot be undone if grading has started.")) return;
        startTransition(async () => {
          await deleteRubricAction(assignmentId);
        });
      }}
      disabled={isPending}
      className="text-xs font-medium text-[#EA4335] hover:underline disabled:opacity-40"
    >
      {isPending ? "Deleting…" : "Delete rubric"}
    </button>
  );
}
