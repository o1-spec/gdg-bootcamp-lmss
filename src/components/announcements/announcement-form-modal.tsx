"use client";

import React, { useActionState, useEffect } from "react";
import { AnnouncementItem } from "@/lib/announcements/queries";
import {
  createAnnouncementAction,
  updateAnnouncementAction,
  AnnouncementActionState,
} from "@/lib/announcements/actions";

interface AnnouncementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement?: AnnouncementItem | null;
  tracks?: Array<{ id: string; name: string }>;
  cohortId: string;
}

const initialState: AnnouncementActionState = {
  success: false,
};

export function AnnouncementFormModal({
  isOpen,
  onClose,
  announcement,
  tracks = [],
  cohortId,
}: AnnouncementFormModalProps) {
  const isEditing = Boolean(announcement);

  const actionFn = isEditing
    ? updateAnnouncementAction.bind(null, announcement!.id)
    : createAnnouncementAction;

  const [state, formAction, isPending] = useActionState(actionFn, initialState);

  useEffect(() => {
    if (state.success) {
      onClose();
    }
  }, [state.success, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#E7E3DA] bg-white p-6 shadow-xl sm:p-7 z-10">
        <div className="flex items-center justify-between pb-4 border-b border-[#E7E3DA]">
          <h3 className="text-base font-semibold text-[#171717]">
            {isEditing ? "Edit Announcement" : "New Announcement"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-[#737373] hover:bg-[#F7F4ED] hover:text-[#171717] transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {state.error && (
          <div className="mt-4 rounded-xl border border-[#EA4335]/20 bg-[#EA4335]/10 p-3 text-xs text-[#EA4335]">
            {state.error}
          </div>
        )}

        <form action={formAction} className="mt-4 space-y-4">
          <input type="hidden" name="cohortId" value={cohortId} />

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-xs font-semibold text-[#171717]">
              Title <span className="text-[#EA4335]">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              defaultValue={announcement?.title || ""}
              placeholder="e.g. Sliding Window Session Setup"
              required
              className="mt-1.5 block w-full rounded-xl border border-[#E7E3DA] bg-white px-3.5 py-2.5 text-xs text-[#171717] placeholder:text-[#737373] focus:outline-hidden focus:ring-2 focus:ring-[#171717]"
            />
            {state.fieldErrors?.title && (
              <p className="mt-1 text-[11px] text-[#EA4335]">
                {state.fieldErrors.title}
              </p>
            )}
          </div>

          {/* Target Track */}
          <div>
            <label htmlFor="trackId" className="block text-xs font-semibold text-[#171717]">
              Audience / Track
            </label>
            <select
              id="trackId"
              name="trackId"
              defaultValue={announcement?.trackId || "all"}
              className="mt-1.5 block w-full rounded-xl border border-[#E7E3DA] bg-white px-3 py-2.5 text-xs text-[#171717] focus:outline-hidden focus:ring-2 focus:ring-[#171717]"
            >
              <option value="all">All Tracks (Cohort-wide)</option>
              {tracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.name} Track
                </option>
              ))}
            </select>
          </div>

          {/* Body */}
          <div>
            <label htmlFor="body" className="block text-xs font-semibold text-[#171717]">
              Announcement Message <span className="text-[#EA4335]">*</span>
            </label>
            <textarea
              id="body"
              name="body"
              rows={5}
              defaultValue={announcement?.body || ""}
              placeholder="Write your announcement details here..."
              required
              className="mt-1.5 block w-full rounded-xl border border-[#E7E3DA] bg-white px-3.5 py-2.5 text-xs text-[#171717] placeholder:text-[#737373] focus:outline-hidden focus:ring-2 focus:ring-[#171717]"
            />
            {state.fieldErrors?.body && (
              <p className="mt-1 text-[11px] text-[#EA4335]">
                {state.fieldErrors.body}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E7E3DA]">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-xl border border-[#E7E3DA] bg-white px-4 py-2 text-xs font-medium text-[#171717] hover:bg-[#F7F4ED] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-[#171717] px-4 py-2 text-xs font-semibold text-white hover:bg-[#171717]/90 disabled:opacity-50 transition-colors"
            >
              {isPending
                ? "Saving..."
                : isEditing
                ? "Save Changes"
                : "Post Announcement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
