import React from "react";
import { db } from "@/lib/db";
import { mockCohorts, mockTracks } from "@/lib/mock-data";
import { SessionForm } from "@/components/sessions/session-form";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = {
  title: "Schedule Session | Admin Console",
};

export default async function AdminNewClassPage() {
  let cohorts: { id: string; name: string }[] = [];
  let tracks: { id: string; name: string }[] = [];

  try {
    const [dbCohorts, dbTracks] = await Promise.all([
      db.cohort.findMany({ select: { id: true, name: true } }),
      db.track.findMany({ select: { id: true, name: true } }),
    ]);

    cohorts = dbCohorts;
    tracks = dbTracks;
  } catch (err) {
    console.warn("DB query in AdminNewClassPage failed; using mock fallback", err);
  }

  if (cohorts.length === 0) {
    cohorts = mockCohorts.map((c) => ({ id: c.id, name: c.name }));
  }
  if (tracks.length === 0) {
    tracks = mockTracks.map((t) => ({ id: t.id, name: t.name }));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Schedule New Session"
        description="Create a live session for any bootcamp track or create a shared cohort-wide workshop"
      />

      <SessionForm
        cohorts={cohorts}
        tracks={tracks}
        cancelHref="/admin/classes"
      />
    </div>
  );
}
