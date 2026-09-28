import React from "react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { mockCohorts, mockTracks } from "@/lib/mock-data";
import { getAssignmentById } from "@/lib/assignments/queries";
import { AssignmentForm } from "@/components/assignments/assignment-form";
import { PageHeader } from "@/components/ui/page-header";

interface AdminEditAssignmentProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AdminEditAssignmentProps) {
  const { id } = await params;
  return {
    title: `Edit Assignment: ${id} | Admin Console`,
  };
}

export default async function AdminEditAssignmentPage({
  params,
}: AdminEditAssignmentProps) {
  const { id } = await params;
  const user = await requireAdmin();

  const data = await getAssignmentById(id, user.id, user.role);

  if (!data) {
    notFound();
  }

  const { assignment } = data;

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
    console.warn("DB query in AdminEditAssignmentPage failed; using mock fallback", err);
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
        title="Edit Assignment"
        description="Update problem prompt, due dates, or maximum score"
      />

      <AssignmentForm
        initialAssignment={assignment}
        cohorts={cohorts}
        tracks={tracks}
        cancelHref={`/admin/assignments/${assignment.id}`}
      />
    </div>
  );
}
