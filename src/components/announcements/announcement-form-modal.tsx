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
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950 sm:p-7 z-10">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-900">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {isEditing ? "Edit Announcement" : "New Announcement"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {state.error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {state.error}
          </div>
        )}

        <form action={formAction} className="mt-4 space-y-4">
          <input type="hidden" name="cohortId" value={cohortId} />

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              defaultValue={announcement?.title || ""}
              placeholder="e.g. Sliding Window Session Setup"
              required
              className="mt-1.5 block w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-xs text-zinc-900 shadow-2xs placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-100"
            />
            {state.fieldErrors?.title && (
              <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">
                {state.fieldErrors.title}
              </p>
            )}
          </div>

          {/* Target Track */}
          <div>
            <label htmlFor="trackId" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Audience / Track
            </label>
            <select
              id="trackId"
              name="trackId"
              defaultValue={announcement?.trackId || "all"}
              className="mt-1.5 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 shadow-2xs focus:border-zinc-900 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-100"
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
            <label htmlFor="body" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Announcement Message <span className="text-red-500">*</span>
            </label>
            <textarea
              id="body"
              name="body"
              rows={5}
              defaultValue={announcement?.body || ""}
              placeholder="Write your announcement details here..."
              required
              className="mt-1.5 block w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-xs text-zinc-900 shadow-2xs placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-100"
            />
            {state.fieldErrors?.body && (
              <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">
                {state.fieldErrors.body}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-2xs hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
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
