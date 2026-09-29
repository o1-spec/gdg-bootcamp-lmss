"use client";

import React, { useState } from "react";
import { submitExcuseAction } from "@/lib/excuses/actions";

interface SubmitExcuseModalProps {
  sessionId: string;
  sessionTitle: string;
  currentExcuse?: {
    id: string;
    reason: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    reviewNote?: string | null;
  } | null;
}

export function SubmitExcuseModal({
  sessionId,
  sessionTitle,
  currentExcuse,
}: SubmitExcuseModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState(currentExcuse?.reason || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isReviewed = currentExcuse && currentExcuse.status !== "PENDING";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isReviewed) return;

    setLoading(true);
    setError(null);

    const res = await submitExcuseAction(sessionId, reason);
    setLoading(false);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 1200);
    } else {
      setError(res.error || "Failed to submit excuse.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-2xs font-semibold text-[#171717] bg-white hover:bg-[#F7F4ED] border border-[#E7E3DA] transition-colors shadow-2xs"
      >
        {currentExcuse ? (
          currentExcuse.status === "PENDING" ? (
            "Edit Excuse"
          ) : (
            "View Excuse"
          )
        ) : (
          "Submit Excuse"
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#E7E3DA] bg-white p-6 sm:p-7 shadow-xl">
            <div className="flex items-start justify-between border-b border-[#E7E3DA] pb-4">
              <div>
                <h3 className="text-base font-bold text-[#171717]">
                  {currentExcuse ? "Attendance Excuse" : "Submit Attendance Excuse"}
                </h3>
                <p className="mt-0.5 text-xs text-[#737373]">
                  {sessionTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[#737373] hover:text-[#171717] p-1 rounded-lg hover:bg-[#F7F4ED] transition-colors"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            {currentExcuse && (
              <div className="mt-4 rounded-xl bg-[#F7F4ED] p-3.5 text-xs border border-[#E7E3DA]">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#737373]">
                    Current Status:
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-2xs font-semibold border ${
                      currentExcuse.status === "APPROVED"
                        ? "bg-[#34A853]/10 text-[#34A853] border-[#34A853]/30"
                        : currentExcuse.status === "REJECTED"
                        ? "bg-[#EA4335]/10 text-[#EA4335] border-[#EA4335]/30"
                        : "bg-[#FBBC04]/15 text-[#996500] border-[#FBBC04]/30"
                    }`}
                  >
                    {currentExcuse.status}
                  </span>
                </div>
                {currentExcuse.reviewNote && (
                  <p className="mt-2 text-[#737373]">
                    <span className="font-semibold text-[#171717]">
                      Instructor Note:
                    </span>{" "}
                    {currentExcuse.reviewNote}
                  </p>
                )}
              </div>
            )}

            {isReviewed ? (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-[#737373]">
                  <span className="font-medium text-[#171717]">
                    Reason submitted:
                  </span>{" "}
                  {currentExcuse.reason}
                </p>
                <p className="text-2xs text-[#737373]">
                  This excuse has been reviewed and can no longer be modified.
                </p>
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl border border-[#E7E3DA] bg-white px-4 py-2 text-xs font-semibold text-[#171717] hover:bg-[#F7F4ED] shadow-2xs transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label
                    htmlFor="excuse-reason"
                    className="block text-xs font-semibold text-[#171717] mb-1.5"
                  >
                    Reason for absence or missed check-in
                  </label>
                  <textarea
                    id="excuse-reason"
                    rows={4}
                    required
                    minLength={10}
                    maxLength={1000}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Describe why you were unable to attend or check in on time (minimum 10 characters)..."
                    className="w-full rounded-xl border border-[#E7E3DA] bg-white p-3 text-xs text-[#171717] placeholder-[#737373]/50 focus:border-[#171717] focus:outline-none"
                  />
                  <p className="mt-1 text-2xs text-[#737373]">
                    {reason.length} / 1000 characters
                  </p>
                </div>

                {error && (
                  <div className="rounded-xl border border-[#EA4335]/30 bg-[#EA4335]/10 p-3 text-xs font-medium text-[#EA4335]">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-xl border border-[#34A853]/30 bg-[#34A853]/10 p-3 text-xs font-medium text-[#34A853]">
                    Excuse submitted successfully!
                  </div>
                )}

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl border border-[#E7E3DA] bg-white px-4 py-2 text-xs font-semibold text-[#171717] hover:bg-[#F7F4ED] shadow-2xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || reason.trim().length < 10}
                    className="rounded-xl bg-[#171717] px-5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#262626] disabled:opacity-50 transition-colors"
                  >
                    {loading ? "Submitting..." : currentExcuse ? "Update Excuse" : "Submit"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
