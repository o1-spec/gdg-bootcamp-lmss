"use client";

import React, { useState, useTransition } from "react";
import { AnnouncementItem } from "@/lib/announcements/queries";
import { deleteAnnouncementAction } from "@/lib/announcements/actions";
import { AnnouncementFormModal } from "./announcement-form-modal";

interface AnnouncementCardProps {
  announcement: AnnouncementItem;
  tracks?: Array<{ id: string; name: string }>;
  cohortId?: string;
}

export function AnnouncementCard({
  announcement,
  tracks = [],
  cohortId = announcement.cohortId,
}: AnnouncementCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(announcement.createdAt));

  const handleDelete = () => {
    if (!confirm(`Are you sure you want to delete "${announcement.title}"?`)) {
      return;
    }

    setDeleteError(null);
    startTransition(async () => {
      const res = await deleteAnnouncementAction(announcement.id);
      if (!res.success) {
        setDeleteError(res.error || "Failed to delete");
      }
    });
  };

  return (
    <>
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs transition-all dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
        <div className="flex flex-col gap-2 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-base">
              {announcement.title}
            </h3>
            {announcement.trackName ? (
              <span className="rounded bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                {announcement.trackName}
              </span>
            ) : (
              <span className="rounded bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                All Tracks
              </span>
            )}
          </div>

          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {formattedDate}
          </span>
        </div>

        <p className="whitespace-pre-wrap text-xs leading-relaxed text-zinc-600 dark:text-zinc-300 sm:text-sm">
          {announcement.body}
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3 text-[11px] text-zinc-400 dark:border-zinc-900 dark:text-zinc-500">
          <div>
            Posted by <span className="font-medium text-zinc-700 dark:text-zinc-300">{announcement.authorName}</span>{" "}
            ({announcement.authorRole.toLowerCase()})
          </div>

          {announcement.canManage && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                disabled={isPending}
                className="font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="font-medium text-red-600 hover:text-red-700 dark:text-red-400"
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          )}
        </div>

        {deleteError && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">{deleteError}</p>
        )}
      </div>

      {isEditing && (
        <AnnouncementFormModal
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          announcement={announcement}
          tracks={tracks}
          cohortId={cohortId}
        />
      )}
    </>
  );
}
