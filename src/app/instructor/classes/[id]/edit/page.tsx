import React from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { mockCohorts, mockTracks } from "@/lib/mock-data";
import { getSessionById } from "@/lib/sessions/queries";
import { SessionForm } from "@/components/sessions/session-form";
import { PageHeader } from "@/components/ui/page-header";

interface InstructorEditClassPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: InstructorEditClassPageProps) {
  const { id } = await params;
  return {
    title: `Edit Session: ${id} | Instructor Portal`,
  };
}

export default async function InstructorEditClassPage({
  params,
}: InstructorEditClassPageProps) {
  const { id } = await params;
  const user = await requireUser();

  const session = await getSessionById(id, user.id, user.role);

  if (!session) {
    notFound();
  }

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
      cohorts = Array.from(cohortMap.entries()).map(([cid, name]) => ({ id: cid, name }));
    }
  } catch (err) {
    console.warn("DB query in InstructorEditClassPage failed; using mock fallback", err);
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
        title="Edit Class Session"
        description="Update schedule, video meeting links, recordings, or session agenda"
      />

      <SessionForm
        initialSession={session}
        cohorts={cohorts}
        tracks={tracks}
        cancelHref={`/instructor/classes/${session.id}`}
      />
    </div>
  );
}
