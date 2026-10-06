/*
|--------------------------------------------------
| npm imports
|--------------------------------------------------
*/
import React from "react";
import { notFound } from "next/navigation";

/*
|--------------------------------------------------
| custom imports
|--------------------------------------------------
*/
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getAssignmentById } from "@/lib/assignments/queries";
import { AssignmentForm } from "@/components/assignments/assignment-form";
import { PageHeader } from "@/components/ui/page-header";

/*
|--------------------------------------------------
| types
|--------------------------------------------------
*/
interface AdminEditAssignmentProps {
  params: Promise<{ id: string }>;
}

/*
|----------------------------------------------------------------------------------------------------
| generateMetadata
|----------------------------------------------------------------------------------------------------
| Handler implementation for generate Metadata.
*/
export async function generateMetadata({ params }: AdminEditAssignmentProps) {
  const { id } = await params;
  return {
    title: `Edit Assignment: ${id} | Admin Console`,
  };
}

/*
|----------------------------------------------------------------------------------------------------
| AdminEditAssignmentPage
|----------------------------------------------------------------------------------------------------
| Renders the Admin Edit Assignment page view.
*/
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

  const [cohorts, tracks] = await Promise.all([
    db.cohort.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.track.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Edit Assignment"
        description="Update problem prompt, change due dates, or modify scoring configurations"
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
