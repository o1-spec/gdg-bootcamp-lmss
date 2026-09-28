import React from "react";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { mockCohorts, mockTracks } from "@/lib/mock-data";
import { AssignmentForm } from "@/components/assignments/assignment-form";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = {
  title: "Create Assignment | Admin Console",
};

export default async function AdminNewAssignmentPage() {
  await requireAdmin();

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
    console.warn("DB query in AdminNewAssignmentPage failed; using mock fallback", err);
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
        title="Create Assignment"
        description="Publish problem prompts for any track or create cohort-wide shared lab exercises"
      />

      <AssignmentForm
        cohorts={cohorts}
        tracks={tracks}
        cancelHref="/admin/assignments"
      />
    </div>
  );
}
