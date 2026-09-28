"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface TrackFilterSelectProps {
  currentStatus: string;
  currentTrackId: string;
  tracks: { id: string; name: string; cohort: { name: string } }[];
}

export function TrackFilterSelect({
  currentStatus,
  currentTrackId,
  tracks,
}: TrackFilterSelectProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-500">Track:</span>
      <select
        value={currentTrackId}
        onChange={(e) => {
          router.push(
            `/admin/completion?status=${currentStatus}&trackId=${e.target.value}`
          );
        }}
        aria-label="Filter by track"
        className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
      >
        <option value="ALL">All Tracks</option>
        {tracks.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} ({t.cohort.name})
          </option>
        ))}
      </select>
    </div>
  );
}
