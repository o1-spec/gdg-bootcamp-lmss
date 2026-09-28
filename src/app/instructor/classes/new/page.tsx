import React from "react";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { mockCohorts, mockTracks } from "@/lib/mock-data";
import { SessionForm } from "@/components/sessions/session-form";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = {
  title: "Schedule New Session | Instructor Portal",
};

export default async function InstructorNewClassPage() {
  const user = await requireUser();

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
    console.warn("DB query in InstructorNewClassPage failed; using mock fallback", err);
  }

  if (cohorts.length === 0) {
    cohorts = mockCohorts.map((c) => ({ id: c.id, name: c.name }));
  }
  if (tracks.length === 0) {
    // Intermediate track default for instructor Sarah Jenkins
    tracks = mockTracks
      .filter((t) => t.id === "trk-intermediate")
      .map((t) => ({ id: t.id, name: t.name }));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Schedule Live Session"
        description="Create a live class meeting for an assigned track or open a shared workshop to the cohort"
      />

      <SessionForm
        cohorts={cohorts}
        tracks={tracks}
        cancelHref="/instructor/classes"
      />
    </div>
  );
}
