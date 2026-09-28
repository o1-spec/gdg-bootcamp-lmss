import React from "react";
import { notFound } from "next/navigation";
import { requireInstructor } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getAssignmentById } from "@/lib/assignments/queries";
import { AssignmentForm } from "@/components/assignments/assignment-form";
import { PageHeader } from "@/components/ui/page-header";

interface InstructorEditAssignmentProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: InstructorEditAssignmentProps) {
  const { id } = await params;
  return {
    title: `Edit Assignment: ${id} | Instructor Portal`,
  };
}

export default async function InstructorEditAssignmentPage({
  params,
}: InstructorEditAssignmentProps) {
  const { id } = await params;
  const user = await requireInstructor();

  const data = await getAssignmentById(id, user.id, user.role);

  if (!data) {
    notFound();
  }

  const { assignment } = data;

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
        title="Edit Assignment"
        description="Update problem prompt, due dates, or maximum score"
      />

      <AssignmentForm
        initialAssignment={assignment}
        cohorts={cohorts}
        tracks={tracks}
        cancelHref={`/instructor/assignments/${assignment.id}`}
      />
    </div>
  );
}
