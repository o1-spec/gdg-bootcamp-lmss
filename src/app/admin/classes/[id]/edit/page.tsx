import React from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { mockCohorts, mockTracks } from "@/lib/mock-data";
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
  const user = await requireUser();

  const session = await getSessionById(id, user.id, user.role);

  if (!session) {
    notFound();
  }

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
    console.warn("DB query in AdminEditClassPage failed; using mock fallback", err);
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
