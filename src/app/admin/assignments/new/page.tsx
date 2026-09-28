import React from "react";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AssignmentForm } from "@/components/assignments/assignment-form";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = {
  title: "Create Assignment | Admin Console",
};

export default async function AdminNewAssignmentPage() {
  await requireAdmin();

  const [cohorts, tracks] = await Promise.all([
    db.cohort.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.track.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

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
