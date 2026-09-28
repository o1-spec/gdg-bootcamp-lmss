import React from "react";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { SessionForm } from "@/components/sessions/session-form";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = {
  title: "Schedule Session | Admin Console",
};

export default async function AdminNewClassPage() {
  await requireAdmin();

  const [cohorts, tracks] = await Promise.all([
    db.cohort.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.track.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

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
