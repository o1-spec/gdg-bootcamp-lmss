"use client";

import { useState, useTransition } from "react";
import { bulkReleaseGradesAction } from "@/lib/assignments/actions";

interface Submission {
  id: string;
  userId: string;
  score: number | null;
  released: boolean;
  user: { name: string; email: string };
  assignment: { title: string };
}

interface BulkReleaseProps {
  submissions: Submission[];
}

export function BulkReleasePanel({ submissions }: BulkReleaseProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<{ released: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Only show ungraded+unreleased, graded submissions
  const eligible = submissions.filter((s) => s.score !== null && !s.released);

  function toggleAll() {
    if (selected.size === eligible.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(eligible.map((s) => s.id)));
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleRelease() {
    if (!selected.size) return;
    setError(null);
    setConfirming(false);

    startTransition(async () => {
      const res = await bulkReleaseGradesAction([...selected]);
      if (res.success) {
        setResult({ released: res.released, skipped: res.skipped });
        setSelected(new Set());
      } else {
        setError(res.error ?? "Bulk release failed.");
      }
    });
  }

  if (eligible.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No graded-but-unreleased submissions to release.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Result banner */}
      {result && (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-950/30 dark:text-green-300">
          ✓ Released <strong>{result.released}</strong> grade
          {result.released !== 1 ? "s" : ""}.
          {result.skipped > 0 && ` ${result.skipped} skipped (not authorized).`}
        </div>
      )}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Selection toolbar */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.size === eligible.length && eligible.length > 0}
            onChange={toggleAll}
            className="h-3.5 w-3.5 rounded"
          />
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Select all ({eligible.length})
          </span>
        </label>

        {selected.size > 0 && !confirming && (
          <button
            onClick={() => setConfirming(true)}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Release {selected.size} grade{selected.size !== 1 ? "s" : ""}
          </button>
        )}

        {confirming && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-600 dark:text-zinc-400">
              Release {selected.size} grade{selected.size !== 1 ? "s" : ""}? This cannot be undone.
            </span>
            <button
              onClick={handleRelease}
              disabled={isPending}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-40"
            >
              {isPending ? "Releasing…" : "Confirm"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Submission rows */}
      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
            <tr>
              <th className="w-8 px-4 py-2.5" />
              <th className="px-4 py-2.5 text-left font-semibold text-zinc-600 dark:text-zinc-400">Student</th>
              <th className="px-4 py-2.5 text-left font-semibold text-zinc-600 dark:text-zinc-400">Assignment</th>
              <th className="px-4 py-2.5 text-right font-semibold text-zinc-600 dark:text-zinc-400">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {eligible.map((s) => (
              <tr
                key={s.id}
                className={`cursor-pointer transition-colors ${
                  selected.has(s.id)
                    ? "bg-blue-50/60 dark:bg-blue-950/10"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                }`}
                onClick={() => toggle(s.id)}
              >
                <td className="px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={selected.has(s.id)}
                    onChange={() => toggle(s.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-3.5 w-3.5 rounded"
                  />
                </td>
                <td className="px-4 py-2.5">
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">{s.user.name}</p>
                  <p className="text-zinc-400">{s.user.email}</p>
                </td>
                <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400">
                  {s.assignment.title}
                </td>
                <td className="px-4 py-2.5 text-right font-bold text-zinc-900 dark:text-zinc-100">
                  {s.score}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
