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
        <div className="flex flex-wrap gap-2">
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilterStatus(tab)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors ${
                filterStatus === tab
                  ? "bg-[#171717] text-white"
                  : "border border-[#E7E3DA] bg-white text-[#737373] hover:text-[#171717] hover:bg-[#F7F4ED]"
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
        <div className="rounded-2xl border border-dashed border-[#E7E3DA] bg-white p-10 text-center text-xs text-[#737373]">
          No excuses match the selected filter.
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-hidden rounded-2xl border border-[#E7E3DA] bg-white shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E7E3DA] bg-[#F7F4ED]/60">
                <tr>
                  <th className="px-5 py-3.5 font-semibold text-[#171717]">
                    Student
                  </th>
                  <th className="px-5 py-3.5 font-semibold text-[#171717]">
                    Session & Date
                  </th>
                  <th className="px-5 py-3.5 font-semibold text-[#171717]">
                    Reason
                  </th>
                  <th className="px-5 py-3.5 font-semibold text-[#171717]">
                    Attendance
                  </th>
                  <th className="px-5 py-3.5 font-semibold text-[#171717]">
                    Status
                  </th>
                  <th className="px-5 py-3.5 font-semibold text-[#171717] text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E3DA]">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-[#F7F4ED]/40"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#171717]">
                        {item.user.name}
                      </p>
                      <p className="text-[11px] text-[#737373]">
                        {item.user.email}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-[#171717]">
                        {item.session.title}
                      </p>
                      <p className="text-[11px] text-[#737373]">
                        {dateFormatter.format(new Date(item.session.startsAt))}
                      </p>
                    </td>

                    <td className="px-5 py-4 max-w-xs">
                      <p className="text-[#171717] line-clamp-2">
                        {item.reason}
                      </p>
                      {item.reviewNote && (
                        <p className="mt-1 text-2xs text-[#737373] italic">
                          Note: {item.reviewNote}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full px-2.5 py-0.5 text-2xs font-medium bg-[#F7F4ED] text-[#737373] border border-[#E7E3DA]">
                        {item.attendance?.status || "UNMARKED"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-2xs font-semibold ${
                          item.status === "APPROVED"
                            ? "bg-green-50 text-[#34A853] border border-[#34A853]/30"
                            : item.status === "REJECTED"
                            ? "bg-red-50 text-[#EA4335] border border-[#EA4335]/30"
                            : "bg-amber-50 text-[#B45309] border border-[#FBBC04]/40"
                        }`}
                      >
                        {item.status}
                      </span>
                      {item.reviewedBy && (
                        <p className="mt-0.5 text-2xs text-[#737373]">
                          by {item.reviewedBy.name}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {item.status === "PENDING" || isAdmin ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedExcuse(item);
                            setReviewNote(item.reviewNote || "");
                            setError(null);
                          }}
                          className="rounded-xl bg-[#171717] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-black transition-colors"
                        >
                          {item.status === "PENDING" ? "Review" : "Override"}
                        </button>
                      ) : (
                        <span className="text-2xs text-[#737373]">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="space-y-3 sm:hidden">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-[#E7E3DA] bg-white p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-[#171717]">
                      {item.user.name}
                    </p>
                    <p className="text-[11px] text-[#737373]">
                      {item.session.title} • {dateFormatter.format(new Date(item.session.startsAt))}
                    </p>
                  </div>

                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-2xs font-semibold ${
                      item.status === "APPROVED"
                        ? "bg-green-50 text-[#34A853] border border-[#34A853]/30"
                        : item.status === "REJECTED"
                        ? "bg-red-50 text-[#EA4335] border border-[#EA4335]/30"
                        : "bg-amber-50 text-[#B45309] border border-[#FBBC04]/40"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="rounded-xl bg-[#F7F4ED]/50 border border-[#E7E3DA] p-3 text-xs text-[#171717]">
                  <p className="text-[11px] text-[#737373] font-medium mb-1">Reason:</p>
                  <p className="whitespace-pre-wrap">{item.reason}</p>
                  {item.reviewNote && (
                    <p className="mt-2 text-2xs text-[#737373] italic border-t border-[#E7E3DA] pt-1">
                      Note: {item.reviewNote}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-[#E7E3DA] pt-2.5">
                  <span className="text-[11px] text-[#737373]">
                    Attendance: {item.attendance?.status || "UNMARKED"}
                  </span>

                  {item.status === "PENDING" || isAdmin ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedExcuse(item);
                        setReviewNote(item.reviewNote || "");
                        setError(null);
                      }}
                      className="rounded-xl bg-[#171717] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-black transition-colors"
                    >
                      {item.status === "PENDING" ? "Review" : "Override"}
                    </button>
                  ) : (
                    <span className="text-2xs text-[#737373]">Reviewed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Review Modal */}
      {selectedExcuse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#E7E3DA] bg-white p-6 sm:p-7 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#171717]">
                  {selectedExcuse.status === "PENDING" ? "Review Excuse" : "Override Excuse Decision"}
                </h3>
                <p className="mt-1 text-xs text-[#737373]">
                  {selectedExcuse.user.name} ({selectedExcuse.user.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedExcuse(null)}
                className="text-[#737373] hover:text-[#171717] p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 rounded-xl bg-[#F7F4ED]/60 p-4 text-xs border border-[#E7E3DA]">
              <div>
                <span className="font-semibold text-[#171717]">Class Session:</span>{" "}
                <span className="text-[#737373]">{selectedExcuse.session.title}</span>
              </div>
              <div>
                <span className="font-semibold text-[#171717]">Student Reason:</span>
                <p className="mt-1 text-[#171717] whitespace-pre-wrap">
                  {selectedExcuse.reason}
                </p>
              </div>
              <div>
                <span className="font-semibold text-[#171717]">Attendance Recorded:</span>{" "}
                <span className="text-[#737373]">{selectedExcuse.attendance?.status || "UNMARKED"}</span>
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              <label
                htmlFor="review-note"
                className="block text-xs font-medium text-[#171717]"
              >
                Review Note / Feedback (Optional)
              </label>
              <textarea
                id="review-note"
                rows={2}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Add a note or explanation for the student..."
                className="w-full rounded-xl border border-[#E7E3DA] bg-white p-3 text-xs text-[#171717] placeholder-[#737373]/60 focus:border-[#171717] focus:outline-hidden"
              />
            </div>

            {error && (
              <p className="mt-2 text-xs text-[#EA4335]">{error}</p>
            )}

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedExcuse(null)}
                className="rounded-xl border border-[#E7E3DA] bg-white px-4 py-2 text-xs font-medium text-[#171717] hover:bg-[#F7F4ED] transition-colors"
              >
                Cancel
              </button>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleReview("REJECTED")}
                  className="rounded-xl border border-[#EA4335]/30 bg-red-50 px-4 py-2 text-xs font-semibold text-[#EA4335] hover:bg-red-100 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Saving..." : "Reject Excuse"}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleReview("APPROVED")}
                  className="rounded-xl bg-[#34A853] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2d9247] disabled:opacity-50 transition-colors shadow-xs"
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
