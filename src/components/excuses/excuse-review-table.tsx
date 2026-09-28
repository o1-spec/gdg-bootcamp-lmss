"use client";

import React, { useState } from "react";
import { reviewExcuseAction } from "@/lib/excuses/actions";

interface ExcuseItem {
  id: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewNote: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
  user: { id: string; name: string; email: string };
  session: { id: string; title: string; startsAt: Date; trackId: string | null };
  reviewedBy: { name: string } | null;
  attendance: { status: string } | null;
}

interface ExcuseReviewTableProps {
  excuses: ExcuseItem[];
  isAdmin?: boolean;
}

export function ExcuseReviewTable({ excuses, isAdmin = false }: ExcuseReviewTableProps) {
  const [selectedExcuse, setSelectedExcuse] = useState<ExcuseItem | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const filtered = excuses.filter((e) => {
    if (filterStatus === "ALL") return true;
    return e.status === filterStatus;
  });

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  async function handleReview(decision: "APPROVED" | "REJECTED") {
    if (!selectedExcuse) return;
    setLoading(true);
    setError(null);

    const res = await reviewExcuseAction(selectedExcuse.id, decision, reviewNote);
    setLoading(false);

    if (res.success) {
      setSelectedExcuse(null);
      setReviewNote("");
    } else {
      setError(res.error || "Failed to submit review.");
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilterStatus(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filterStatus === tab
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {tab === "ALL" ? "All Excuses" : tab.charAt(0) + tab.slice(1).toLowerCase()}
              <span className="ml-1.5 text-2xs opacity-75">
                ({tab === "ALL" ? excuses.length : excuses.filter((e) => e.status === tab).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 p-10 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          No excuses match the selected filter.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-950">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 bg-zinc-50/75 dark:border-zinc-800 dark:bg-zinc-900/40">
              <tr>
                <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                  Student
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                  Session & Date
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                  Reason
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                  Attendance
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                  Status
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100 text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30"
                >
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.user.name}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {item.user.email}
                    </p>
                  </td>

                  <td className="px-4 py-3.5">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {item.session.title}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {dateFormatter.format(new Date(item.session.startsAt))}
                    </p>
                  </td>

                  <td className="px-4 py-3.5 max-w-xs">
                    <p className="text-zinc-700 dark:text-zinc-300 line-clamp-2">
                      {item.reason}
                    </p>
                    {item.reviewNote && (
                      <p className="mt-1 text-2xs text-zinc-400 italic">
                        Note: {item.reviewNote}
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="inline-flex rounded-full px-2 py-0.5 text-2xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {item.attendance?.status || "UNMARKED"}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-2xs font-semibold ${
                        item.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : item.status === "REJECTED"
                          ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {item.status}
                    </span>
                    {item.reviewedBy && (
                      <p className="mt-0.5 text-2xs text-zinc-400">
                        by {item.reviewedBy.name}
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    {item.status === "PENDING" || isAdmin ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedExcuse(item);
                          setReviewNote(item.reviewNote || "");
                          setError(null);
                        }}
                        className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                      >
                        {item.status === "PENDING" ? "Review" : "Override"}
                      </button>
                    ) : (
                      <span className="text-2xs text-zinc-400">Reviewed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {selectedExcuse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {selectedExcuse.status === "PENDING" ? "Review Excuse" : "Override Excuse Decision"}
                </h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {selectedExcuse.user.name} ({selectedExcuse.user.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedExcuse(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 rounded-lg bg-zinc-50 p-3.5 text-xs dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">Class Session:</span>{" "}
                <span className="text-zinc-600 dark:text-zinc-400">{selectedExcuse.session.title}</span>
              </div>
              <div>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">Student Reason:</span>
                <p className="mt-1 text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                  {selectedExcuse.reason}
                </p>
              </div>
              <div>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">Attendance Recorded:</span>{" "}
                <span className="text-zinc-600 dark:text-zinc-400">{selectedExcuse.attendance?.status || "UNMARKED"}</span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <label
                htmlFor="review-note"
                className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                Review Note / Feedback (Optional)
              </label>
              <textarea
                id="review-note"
                rows={2}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Add a note or explanation for the student..."
                className="w-full rounded-lg border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>

            {error && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
            )}

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedExcuse(null)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleReview("REJECTED")}
                  className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-600"
                >
                  {loading ? "Saving..." : "Reject Excuse"}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleReview("APPROVED")}
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                >
                  {loading ? "Saving..." : "Approve Excuse"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
