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
        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
          Rubric title
        </label>
        <input
          value={rubricTitle}
          onChange={(e) => setRubricTitle(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="space-y-3">
        {criteria.map((c, i) => (
          <div
            key={i}
            className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 space-y-2 dark:border-zinc-800 dark:bg-zinc-900/60"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Criterion {i + 1}
              </span>
              {criteria.length > 1 && (
                <button
                  onClick={() => removeCriterion(i)}
                  className="text-[11px] text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
            <input
              placeholder="Title *"
              value={c.title}
              onChange={(e) => updateCriterion(i, "title", e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
            />
            <input
              placeholder="Description (optional)"
              value={c.description}
              onChange={(e) => updateCriterion(i, "description", e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
            />
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-500 shrink-0">Max score:</label>
              <input
                type="number"
                min={0}
                value={c.maxScore}
                onChange={(e) => updateCriterion(i, "maxScore", e.target.value)}
                className="w-20 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Total validation */}
      <div
        className={`rounded-lg px-3 py-2 text-xs font-medium ${
          isTotalValid
            ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
            : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
        }`}
      >
        Criterion total: {total} / {assignmentMaxScore}
        {!isTotalValid && " — must equal assignment max score"}
      </div>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={addCriterion}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          + Add criterion
        </button>
        <button
          onClick={handleSave}
          disabled={isPending || !isTotalValid}
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
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
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
        {scores.map((r, i) => (
          <div key={i} className="px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                {r.criterion.title}
              </span>
              {released ? (
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {r.score} / {r.criterion.maxScore}
                </span>
              ) : (
                <span className="text-xs text-zinc-400">— / {r.criterion.maxScore}</span>
              )}
            </div>
            {r.criterion.description && (
              <p className="text-xs text-zinc-500 mt-0.5">{r.criterion.description}</p>
            )}
            {released && r.feedback && (
              <p className="text-xs text-zinc-500 italic mt-1">{r.feedback}</p>
            )}
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-b-xl">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Total</span>
          {released ? (
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {total} / {maxTotal}
            </span>
          ) : (
            <span className="text-xs text-zinc-400">Pending</span>
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
      className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-40"
    >
      {isPending ? "Deleting…" : "Delete rubric"}
    </button>
  );
}
