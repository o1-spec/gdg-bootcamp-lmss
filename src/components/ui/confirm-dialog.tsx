"use client";

import React, { useEffect, useRef } from "react";

export interface ConfirmDialogProps {
  /** Whether the dialog is currently visible */
  open: boolean;
  /** Called when the user cancels or presses Escape / clicks backdrop */
  onClose: () => void;
  /** Called when the user confirms the action */
  onConfirm: () => void;
  /** Dialog title */
  title: string;
  /** Body copy – can be a string or JSX */
  description: React.ReactNode;
  /** Text for the confirm button (default: "Confirm") */
  confirmLabel?: string;
  /** Text for the cancel button (default: "Cancel") */
  cancelLabel?: string;
  /** Controls the colour of the confirm button. Default: "danger" */
  variant?: "danger" | "primary" | "warning";
  /** Whether the confirm action is in progress */
  loading?: boolean;
  /** Optional error message rendered inside the dialog */
  error?: string | null;
  /** Optional icon to show above the title */
  icon?: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  danger:
    "bg-[#EA4335] text-white hover:bg-red-700 disabled:opacity-50 focus:ring-[#EA4335]/30",
  primary:
    "bg-[#171717] text-white hover:bg-black disabled:opacity-50 focus:ring-[#171717]/20",
  warning:
    "bg-[#FBBC04] text-[#171717] hover:bg-yellow-400 disabled:opacity-50 focus:ring-[#FBBC04]/30",
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  error = null,
  icon,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap & Escape key
  useEffect(() => {
    if (!open) return;

    const prev = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      prev?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative w-full max-w-md rounded-2xl border border-[#E7E3DA] bg-white p-6 shadow-2xl focus:outline-none"
        style={{ boxShadow: "0 20px 60px -10px rgba(0,0,0,0.18)" }}
      >
        {/* Optional icon */}
        {icon && (
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F7F4ED] border border-[#E7E3DA]">
            {icon}
          </div>
        )}

        {/* Title */}
        <h2
          id="confirm-dialog-title"
          className="text-base font-semibold text-[#171717] leading-snug"
        >
          {title}
        </h2>

        {/* Description */}
        <div className="mt-2 text-xs text-[#737373] leading-relaxed">
          {description}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-xl border border-[#EA4335]/20 bg-red-50 p-3 text-xs text-[#EA4335] font-medium">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-2.5 border-t border-[#E7E3DA] pt-4">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-xl border border-[#E7E3DA] bg-white px-4 py-2 text-xs font-medium text-[#171717] hover:bg-[#F7F4ED] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/20"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 flex items-center gap-2 shadow-xs ${variantStyles[variant]}`}
          >
            {loading && (
              <span className="h-3.5 w-3.5 rounded-full border-2 border-current/30 border-t-current animate-spin" />
            )}
            {loading ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
