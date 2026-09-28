import React from "react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getSessionById } from "@/lib/sessions/queries";
import { SessionForm } from "@/components/sessions/session-form";
import { PageHeader } from "@/components/ui/page-header";

interface AdminEditClassPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AdminEditClassPageProps) {
  const { id } = await params;
  return {
    title: `Edit Session: ${id} | Admin Console`,
  };
}

export default async function AdminEditClassPage({
  params,
}: AdminEditClassPageProps) {
  const { id } = await params;
  const user = await requireAdmin();

  const session = await getSessionById(id, user.id, user.role);

  if (!session) {
    notFound();
  }

  const [cohorts, tracks] = await Promise.all([
    db.cohort.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.track.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Edit Class Session"
        description="Update session schedule, meeting links, video recordings, or track assignments"
      />

      <SessionForm
        initialSession={session}
        cohorts={cohorts}
        tracks={tracks}
        cancelHref={`/admin/classes/${session.id}`}
      />
    </div>
  );
}
