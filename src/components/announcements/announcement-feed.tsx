"use client";

import React, { useState } from "react";
import { AnnouncementItem } from "@/lib/announcements/queries";
import { AnnouncementCard } from "./announcement-card";
import { AnnouncementFormModal } from "./announcement-form-modal";

interface AnnouncementFeedProps {
  announcements: AnnouncementItem[];
  canCreate?: boolean;
  createButtonText?: string;
  tracks?: Array<{ id: string; name: string }>;
  cohortId?: string;
}

export function AnnouncementFeed({
  announcements,
  canCreate = false,
  createButtonText = "+ New Announcement",
  tracks = [],
  cohortId = "coh-2026-1",
}: AnnouncementFeedProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterTrack, setFilterTrack] = useState<string>("all");

  const filtered =
    filterTrack === "all"
      ? announcements
      : announcements.filter(
          (a) =>
            (filterTrack === "shared" && a.trackId === null) ||
            a.trackId === filterTrack
        );

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {tracks.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Filter:</span>
            <select
              value={filterTrack}
              onChange={(e) => setFilterTrack(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="all">All Announcements ({announcements.length})</option>
              <option value="shared">Cohort-Wide Only</option>
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} Track
                </option>
              ))}
            </select>
          </div>
        )}

        {canCreate && (
          <div className="self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-900 px-3.5 text-xs font-medium text-white shadow-2xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {createButtonText}
            </button>
          </div>
        )}
      </div>

      {/* Announcement List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-500">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
          </div>
          <h4 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            No announcements found
          </h4>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            There are currently no active notices posted for this filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((ann) => (
            <AnnouncementCard
              key={ann.id}
              announcement={ann}
              tracks={tracks}
              cohortId={cohortId}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {canCreate && (
        <AnnouncementFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          tracks={tracks}
          cohortId={cohortId}
        />
      )}
    </div>
  );
}
