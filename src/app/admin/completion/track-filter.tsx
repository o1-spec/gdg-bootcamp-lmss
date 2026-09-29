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
      <span className="text-xs font-medium text-[#737373]">Track:</span>
      <select
        value={currentTrackId}
        onChange={(e) => {
          router.push(
            `/admin/completion?status=${currentStatus}&trackId=${e.target.value}`
          );
        }}
        aria-label="Filter by track"
        className="h-9 rounded-xl border border-[#E7E3DA] bg-white px-3 text-xs text-[#171717] focus:outline-hidden focus:ring-2 focus:ring-[#171717]"
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
