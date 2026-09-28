import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Enrollment } from "@/types";
import { AdminEnrollmentsTable } from "@/components/admin/directory-tables";

export const metadata = {
  title: "Enrollments | Admin Console",
};

export default async function AdminEnrollmentsPage() {
  await requireAdmin();

  const enrollmentRecords = await db.enrollment.findMany({
    include: {
      user: true,
      track: {
        include: {
          cohort: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const enrollments: Enrollment[] = enrollmentRecords.map((e) => ({
    id: e.id,
    studentName: e.user.name,
    studentEmail: e.user.email,
    trackName: e.track.name,
    cohortName: e.track.cohort.name,
    enrolledDate: new Date(e.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    status: "Active",
  }));

  const totalCohorts = await db.cohort.count();
  const totalTracks = await db.track.count();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Enrollments & Track Allocations"
        description="Process cohort enrollments, assign tracks, and monitor cohort allocations"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Active Enrollments"
          value={enrollments.length}
          subtitle="Enrolled students across all tracks"
          badge={{ text: "Active", variant: "success" }}
        />
        <StatCard
          title="Active Tracks"
          value={totalTracks}
          subtitle="Specialized tracks"
          badge={{ text: "Active", variant: "info" }}
        />
        <StatCard
          title="Bootcamp Cohorts"
          value={totalCohorts}
          subtitle="Configured cohort cycles"
          badge={{ text: "Configured", variant: "neutral" }}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Enrollment Records ({enrollments.length} enrollments)
        </h3>
        <AdminEnrollmentsTable enrollments={enrollments} />
      </div>
    </div>
  );
}
