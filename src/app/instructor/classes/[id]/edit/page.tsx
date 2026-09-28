import React from "react";
import { notFound } from "next/navigation";
import { requireInstructor } from "@/lib/auth/session";
import { db } from "@/lib/db";
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
  const user = await requireInstructor();

  const session = await getSessionById(id, user.id, user.role);

  if (!session) {
    notFound();
  }

  let cohorts: { id: string; name: string }[] = [];
  let tracks: { id: string; name: string }[] = [];

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
