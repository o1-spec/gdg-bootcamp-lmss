import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Track } from "@/types";
import { AdminTracksTable } from "@/components/admin/directory-tables";

export const metadata = {
  title: "Tracks | Admin Console",
};

export default async function AdminTracksPage() {
  await requireAdmin();

  const trackRecords = await db.track.findMany({
    include: {
      cohort: true,
      instructors: {
        include: {
          user: true,
        },
      },
      enrollments: true,
      sessions: true,
      assignments: true,
    },
    orderBy: { name: "asc" },
  });

  const tracks: Track[] = trackRecords.map((t) => {
    const leadInstructor = t.instructors[0]?.user;
    return {
      id: t.id,
      name: t.name,
      cohortId: t.cohortId,
      cohortName: t.cohort.name,
      description: t.description || "",
      instructorName: leadInstructor ? leadInstructor.name : "Unassigned",
      instructorEmail: leadInstructor ? leadInstructor.email : "",
      studentsCount: t.enrollments.length,
      sessionsCount: t.sessions.length,
      assignmentsCount: t.assignments.length,
      schedule: "Scheduled per curriculum",
    };
  });

  const totalEnrollments = tracks.reduce((sum, t) => sum + t.studentsCount, 0);
  const avgTrackSize =
    tracks.length > 0 ? Math.round(totalEnrollments / tracks.length) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bootcamp Tracks"
        description="Configure track curriculums, assign instructional teams, and adjust track schedules"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Active Tracks"
          value={tracks.length}
          subtitle="Curriculum specialized tracks"
          badge={{ text: "Active", variant: "success" }}
        />
        <StatCard
          title="Total Track Enrollments"
          value={totalEnrollments}
          subtitle="Across all active tracks"
          badge={{ text: "Enrolled", variant: "info" }}
        />
        <StatCard
          title="Average Track Size"
          value={`${avgTrackSize} Student${avgTrackSize === 1 ? "" : "s"}`}
          subtitle="Class cohort density"
          badge={{ text: "Optimal", variant: "neutral" }}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold tracking-tight text-[#171717]">
          Track Roster ({tracks.length} tracks)
        </h3>
        <AdminTracksTable tracks={tracks} />
      </div>
    </div>
  );
}
