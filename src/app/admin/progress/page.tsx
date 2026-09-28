import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminOverview } from "@/lib/progress/queries";

export const metadata = {
  title: "Cross-Track Progress | Admin Console",
};

export default async function AdminProgressPage() {
  await requireAdmin();
  const overview = await getAdminOverview();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cross-Track Progress & Analytics"
        description={`Aggregated cohort progress for ${overview.cohortName} across all tracks`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Students"
          value={overview.totalActiveStudents}
          subtitle="Cohort enrollment"
          badge={{ text: "Active", variant: "info" }}
        />
        <StatCard
          title="Cohort Attendance"
          value={`${overview.averageCohortAttendance}%`}
          subtitle="Average across all tracks"
          badge={{ text: "Healthy", variant: "success" }}
        />
        <StatCard
          title="Total Assignments"
          value={overview.totalAssignments}
          subtitle="Published exercises"
          badge={{ text: `${overview.tracksCount} Tracks`, variant: "neutral" }}
        />
        <StatCard
          title="Grading Backlog"
          value={overview.ungradedSubmissionsCount}
          subtitle="Submissions awaiting review"
          badge={{
            text: overview.ungradedSubmissionsCount === 0 ? "Clear" : "Action Needed",
            variant: overview.ungradedSubmissionsCount === 0 ? "success" : "warning",
          }}
        />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-100 p-5 dark:border-zinc-900 sm:p-6">
          <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Track-by-Track Pacing & Completion Metrics
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Compare attendance rates, assignment submission velocity, and grading queues
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-100 bg-zinc-50 text-[11px] font-medium text-zinc-500 dark:border-zinc-900 dark:bg-zinc-900/50 dark:text-zinc-400">
              <tr>
                <th className="px-5 py-3 sm:px-6">Track Name</th>
                <th className="px-4 py-3">Active Students</th>
                <th className="px-4 py-3">Lead Instructors</th>
                <th className="px-4 py-3">Attendance Rate</th>
                <th className="px-4 py-3">Submission Rate</th>
                <th className="px-4 py-3">Grading Backlog</th>
                <th className="px-5 py-3 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {overview.trackOverviews.map((track) => (
                <tr
                  key={track.trackId}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors"
                >
                  <td className="px-5 py-3.5 sm:px-6 font-semibold text-zinc-900 dark:text-zinc-100">
                    {track.trackName} Track
                  </td>
                  <td className="px-4 py-3.5 text-zinc-700 dark:text-zinc-300">
                    {track.activeStudents}
                  </td>
                  <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-400">
                    {track.instructors.length > 0
                      ? track.instructors.join(", ")
                      : "Unassigned"}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`font-medium ${
                        track.attendanceRate >= 85
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      {track.attendanceRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-zinc-900 dark:text-zinc-100">
                    {track.submissionRate}%
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={track.gradingBacklog === 0 ? "success" : "warning"}>
                      {track.gradingBacklog} pending
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 sm:px-6 text-right">
                    <Link
                      href={`/admin/grading?trackId=${track.trackId}`}
                      className="rounded-md border border-zinc-200 px-2.5 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    >
                      View Grading Queue
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
