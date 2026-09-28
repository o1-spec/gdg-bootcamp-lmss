import React from "react";
import { requireInstructor } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { mockCohorts, mockTracks } from "@/lib/mock-data";
import { AssignmentForm } from "@/components/assignments/assignment-form";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = {
  title: "Create Assignment | Instructor Portal",
};

export default async function InstructorNewAssignmentPage() {
  const user = await requireInstructor();

  let cohorts: { id: string; name: string }[] = [];
  let tracks: { id: string; name: string }[] = [];

  try {
    const assignments = await db.trackInstructor.findMany({
      where: { userId: user.id },
      include: {
        track: {
          include: { cohort: true },
        },
      },
    });

    if (assignments.length > 0) {
      tracks = assignments.map((a) => ({
        id: a.track.id,
        name: a.track.name,
      }));

      const cohortMap = new Map<string, string>();
      for (const a of assignments) {
        cohortMap.set(a.track.cohortId, a.track.cohort.name);
      }
      cohorts = Array.from(cohortMap.entries()).map(([id, name]) => ({ id, name }));
    }
  } catch (err) {
    console.warn("DB query in InstructorNewAssignmentPage failed; using mock fallback", err);
  }

  if (cohorts.length === 0) {
    cohorts = mockCohorts.map((c) => ({ id: c.id, name: c.name }));
  }
  if (tracks.length === 0) {
    tracks = mockTracks
      .filter((t) => t.id === "trk-intermediate")
      .map((t) => ({ id: t.id, name: t.name }));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Create New Assignment"
        description="Publish problem prompts, configure deadlines, and specify scoring policies"
      />

      <AssignmentForm
        cohorts={cohorts}
        tracks={tracks}
        cancelHref="/instructor/assignments"
      />
    </div>
  );
}
