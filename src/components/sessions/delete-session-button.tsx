"use client";

import React, { useState } from "react";
import { deleteSessionAction } from "@/lib/sessions/actions";

interface DeleteSessionButtonProps {
  sessionId: string;
  sessionTitle: string;
}

export function DeleteSessionButton({
  sessionId,
  sessionTitle,
}: DeleteSessionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await deleteSessionAction(sessionId);
    } catch (err: unknown) {
      setIsDeleting(false);
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to delete session. Please try again.");
      }
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-xl border border-[#EA4335]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#EA4335] hover:bg-[#EA4335]/10 transition-colors"
      >
        Delete Session
      </button>

      {/* Confirmation Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#E7E3DA] bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-base font-semibold text-[#171717]">
              Confirm Delete Session
            </h3>
            <p className="text-xs text-[#737373] leading-relaxed">
              Are you sure you want to delete{" "}
              <strong className="text-[#171717] font-semibold">
                &ldquo;{sessionTitle}&rdquo;
              </strong>
              ? This action cannot be undone.
            </p>

            {errorMessage && (
              <div className="rounded-xl border border-[#EA4335]/20 bg-[#EA4335]/10 p-3 text-xs text-[#EA4335]">
                {errorMessage}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-[#E7E3DA]">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setIsOpen(false);
                  setErrorMessage(null);
                }}
                className="rounded-xl border border-[#E7E3DA] bg-white px-4 py-2 text-xs font-medium text-[#171717] hover:bg-[#F7F4ED] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="rounded-xl bg-[#EA4335] px-4 py-2 text-xs font-semibold text-white hover:bg-[#EA4335]/90 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
