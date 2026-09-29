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
      <div className="rounded-2xl border border-[#E7E3DA] bg-white p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-[#D4D0C8] sm:p-6">
        <div className="flex flex-col gap-2 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-[#171717] sm:text-base">
              {announcement.title}
            </h3>
            {announcement.trackName ? (
              <span className="rounded-md bg-[#4285F4]/10 px-2 py-0.5 text-2xs font-medium text-[#4285F4]">
                {announcement.trackName}
              </span>
            ) : (
              <span className="rounded-md bg-[#F7F4ED] border border-[#E7E3DA] px-2 py-0.5 text-2xs font-medium text-[#737373]">
                All Tracks
              </span>
            )}
          </div>

          <span className="text-2xs text-[#737373]">
            {formattedDate}
          </span>
        </div>

        <p className="whitespace-pre-wrap text-xs leading-relaxed text-[#171717]/85 sm:text-sm">
          {announcement.body}
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#E7E3DA] pt-3 text-2xs text-[#737373]">
          <div>
            Posted by <span className="font-medium text-[#171717]">{announcement.authorName}</span>{" "}
            ({announcement.authorRole.toLowerCase()})
          </div>

          {announcement.canManage && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                disabled={isPending}
                className="font-medium text-[#737373] hover:text-[#171717] transition-colors"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="font-medium text-[#EA4335] hover:underline transition-colors"
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          )}
        </div>

        {deleteError && (
          <p className="mt-2 text-xs text-[#EA4335]">{deleteError}</p>
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
