"use client";

import React, { useState } from "react";
import { deleteAssignmentAction } from "@/lib/assignments/actions";

interface DeleteAssignmentButtonProps {
  assignmentId: string;
  assignmentTitle: string;
}

export function DeleteAssignmentButton({
  assignmentId,
  assignmentTitle,
}: DeleteAssignmentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await deleteAssignmentAction(assignmentId);
    } catch (err: unknown) {
      setIsDeleting(false);
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to delete assignment. Please try again.");
      }
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-xl border border-[#EA4335]/30 bg-red-50/50 px-3.5 py-2 text-xs font-semibold text-[#EA4335] hover:bg-red-100 transition-colors shadow-2xs"
      >
        Delete Assignment
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#E7E3DA] bg-white p-6 sm:p-7 shadow-xl">
            <h3 className="text-base font-semibold text-[#171717]">
              Confirm Delete Assignment
            </h3>
            <p className="mt-2 text-xs text-[#737373] leading-relaxed">
              Are you sure you want to delete{" "}
              <strong className="text-[#171717] font-semibold">
                &ldquo;{assignmentTitle}&rdquo;
              </strong>
              ? Assignments with existing student submissions cannot be deleted.
            </p>

            {errorMessage && (
              <div className="mt-3 rounded-xl border border-[#EA4335]/30 bg-red-50 p-3.5 text-xs text-[#EA4335]">
                {errorMessage}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2.5">
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
                className="rounded-xl bg-[#EA4335] px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors shadow-2xs"
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
