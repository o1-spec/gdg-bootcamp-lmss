"use client";

import React, { useState } from "react";
import { deleteAssignmentAction } from "@/lib/assignments/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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

      <ConfirmDialog
        open={isOpen}
        onClose={() => {
          setIsOpen(false);
          setErrorMessage(null);
        }}
        onConfirm={handleDelete}
        title="Delete assignment?"
        description={
          <>
            You are about to permanently delete{" "}
            <strong className="font-semibold text-[#171717]">
              &ldquo;{assignmentTitle}&rdquo;
            </strong>
            .{" "}
            <span className="text-[#EA4335] font-medium">
              Assignments with existing student submissions cannot be deleted.
            </span>{" "}
            This action cannot be undone.
          </>
        }
        confirmLabel="Yes, delete assignment"
        variant="danger"
        loading={isDeleting}
        error={errorMessage}
        icon={
          <svg
            className="h-6 w-6 text-[#EA4335]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
            />
          </svg>
        }
      />
    </>
  );
}
