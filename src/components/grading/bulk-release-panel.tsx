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
      <div className="rounded-2xl border border-[#E7E3DA] bg-white p-6 text-center shadow-2xs">
        <p className="text-xs text-[#737373]">
          No graded-but-unreleased submissions to release.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Result banner */}
      {result && (
        <div className="rounded-xl border border-[#34A853]/30 bg-green-50 px-4 py-3 text-xs text-[#34A853] font-medium">
          ✓ Released <strong>{result.released}</strong> grade
          {result.released !== 1 ? "s" : ""}.
          {result.skipped > 0 && ` ${result.skipped} skipped (not authorized).`}
        </div>
      )}
      {error && (
        <p className="text-xs text-[#EA4335]">{error}</p>
      )}

      {/* Selection toolbar */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.size === eligible.length && eligible.length > 0}
            onChange={toggleAll}
            className="h-4 w-4 rounded border-[#E7E3DA] text-[#171717] focus:ring-[#171717]"
          />
          <span className="text-xs font-medium text-[#171717]">
            Select all ({eligible.length})
          </span>
        </label>

        {selected.size > 0 && !confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="rounded-xl bg-[#171717] px-4 py-2 text-xs font-semibold text-white hover:bg-black transition-colors shadow-2xs"
          >
            Release {selected.size} grade{selected.size !== 1 ? "s" : ""}
          </button>
        )}

        {confirming && (
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-[#737373]">
              Release {selected.size} grade{selected.size !== 1 ? "s" : ""}? This cannot be undone.
            </span>
            <button
              type="button"
              onClick={handleRelease}
              disabled={isPending}
              className="rounded-xl bg-[#EA4335] px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-40 transition-colors shadow-2xs"
            >
              {isPending ? "Releasing…" : "Confirm"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="text-xs text-[#737373] hover:text-[#171717] font-medium"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Submission rows */}
      <div className="rounded-2xl border border-[#E7E3DA] bg-white shadow-2xs overflow-hidden">
        <table className="w-full text-xs">
          <thead className="border-b border-[#E7E3DA] bg-[#F7F4ED]/60">
            <tr>
              <th className="w-10 px-4 py-3" />
              <th className="px-4 py-3 text-left font-semibold text-[#171717]">Student</th>
              <th className="px-4 py-3 text-left font-semibold text-[#171717]">Assignment</th>
              <th className="px-4 py-3 text-right font-semibold text-[#171717]">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E3DA]">
            {eligible.map((s) => (
              <tr
                key={s.id}
                className={`cursor-pointer transition-colors ${
                  selected.has(s.id)
                    ? "bg-[#F7F4ED]"
                    : "hover:bg-[#F7F4ED]/40"
                }`}
                onClick={() => toggle(s.id)}
              >
                <td className="px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={selected.has(s.id)}
                    onChange={() => toggle(s.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 rounded border-[#E7E3DA] text-[#171717]"
                  />
                </td>
                <td className="px-4 py-3.5">
                  <p className="font-semibold text-[#171717]">{s.user.name}</p>
                  <p className="text-[11px] text-[#737373]">{s.user.email}</p>
                </td>
                <td className="px-4 py-3.5 text-[#737373]">
                  {s.assignment.title}
                </td>
                <td className="px-4 py-3.5 text-right font-bold text-[#171717]">
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
