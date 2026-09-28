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
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-2xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
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
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {currentExcuse ? "Attendance Excuse" : "Submit Attendance Excuse"}
                </h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {sessionTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            {currentExcuse && (
              <div className="mt-4 rounded-lg bg-zinc-50 p-3 text-xs dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    Current Status:
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-2xs font-semibold ${
                      currentExcuse.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : currentExcuse.status === "REJECTED"
                        ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    }`}
                  >
                    {currentExcuse.status}
                  </span>
                </div>
                {currentExcuse.reviewNote && (
                  <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      Instructor Note:
                    </span>{" "}
                    {currentExcuse.reviewNote}
                  </p>
                )}
              </div>
            )}

            {isReviewed ? (
              <div className="mt-4">
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    Reason submitted:
                  </span>{" "}
                  {currentExcuse.reason}
                </p>
                <p className="mt-3 text-2xs text-zinc-400">
                  This excuse has been reviewed and can no longer be modified.
                </p>
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
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
                    className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
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
                    className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-xs text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                  <p className="mt-1 text-2xs text-zinc-400">
                    {reason.length} / 1000 characters
                  </p>
                </div>

                {error && (
                  <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                )}

                {success && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    Excuse submitted successfully!
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || reason.trim().length < 10}
                    className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
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
