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
        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40"
      >
        Delete Assignment
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Confirm Delete Assignment
            </h3>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Are you sure you want to delete{" "}
              <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">
                &ldquo;{assignmentTitle}&rdquo;
              </strong>
              ? Assignments with existing student submissions cannot be deleted.
            </p>

            {errorMessage && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                {errorMessage}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setIsOpen(false);
                  setErrorMessage(null);
                }}
                className="rounded-lg border border-zinc-200 px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
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
