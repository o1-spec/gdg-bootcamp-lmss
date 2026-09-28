import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminOverview } from "@/lib/progress/queries";

export const metadata = {
  title: "Admin Dashboard | Bootcamp LMS",
};

export default async function AdminDashboardPage() {
  await requireAdmin();
  const overview = await getAdminOverview();

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Admin Console & Cohort Oversight"
        description={`Managing ${overview.cohortName} • ${overview.startDate} – ${overview.endDate}`}
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/cohorts"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3.5 text-xs font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Manage Cohorts
            </Link>
            <Link
              href="/admin/tracks"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-900 px-3.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              + Create Track
            </Link>
          </div>
        }
      />

      {/* Cohort High-Level Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Cohort"
          value={overview.cohortName}
          subtitle={`${overview.tracksCount} Active Tracks`}
          badge={{ text: "Active", variant: "success" }}
        />
        <StatCard
          title="Total Students"
          value={overview.totalActiveStudents}
          subtitle="Enrolled & active"
          badge={{ text: `${overview.totalActiveStudents} Total`, variant: "info" }}
        />
        <StatCard
          title="Lead Instructors"
          value={overview.totalInstructors}
          subtitle="Assigned to cohort tracks"
          badge={{ text: "Staffed", variant: "success" }}
        />
        <StatCard
          title="Ungraded Backlog"
          value={overview.ungradedSubmissionsCount}
          subtitle={`${overview.totalAssignments} total assignments`}
          badge={{
            text: overview.ungradedSubmissionsCount === 0 ? "Clear" : "Pending",
            variant: overview.ungradedSubmissionsCount === 0 ? "success" : "warning",
          }}
        />
      </div>

      {/* Cross-Track Overview Section */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-1 border-b border-zinc-100 p-5 dark:border-zinc-900 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Cross-Track Performance & Operational Overview
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Real-time progress, attendance rates, and grading bottlenecks across all cohort tracks
            </p>
          </div>
          <Link
            href="/admin/tracks"
            className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Manage Tracks ({overview.trackOverviews.length})
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-100 bg-zinc-50 text-[11px] font-medium text-zinc-500 dark:border-zinc-900 dark:bg-zinc-900/50 dark:text-zinc-400">
              <tr>
                <th className="px-5 py-3 sm:px-6">Track Name</th>
                <th className="px-4 py-3">Active Students</th>
                <th className="px-4 py-3">Instructors</th>
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
                      Grading Queue
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Secondary Grid: Recent Announcements & Admin Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Broadcasted Announcements */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
            <div className="flex items-center justify-between pb-4">
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Recent Announcements
                </h3>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Broadcasts across cohort tracks and all-hands notices
                </p>
              </div>
              <Link
                href="/admin/announcements"
                className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                View all ({overview.recentAnnouncements.length})
              </Link>
            </div>

            {overview.recentAnnouncements.length === 0 ? (
              <p className="py-4 text-center text-xs text-zinc-500">
                No announcements currently posted.
              </p>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {overview.recentAnnouncements.map((ann) => (
                  <div key={ann.id} className="py-3.5 first:pt-2 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {ann.title}
                        </span>
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                          {ann.trackName || "Cohort-Wide"}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400">{ann.createdAt}</span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2">
                      {ann.body}
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Posted by {ann.authorName}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Platform Admin Quick Actions */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
            <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Admin Quick Actions
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Platform administration controls
            </p>

            <ul className="mt-4 space-y-2 text-xs">
              <li>
                <Link
                  href="/admin/classes/new"
                  className="flex items-center justify-between rounded-lg p-2 text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  <span className="font-medium">Schedule Live Session</span>
                  <span className="text-[11px] text-zinc-400">+ Class</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/assignments/new"
                  className="flex items-center justify-between rounded-lg p-2 text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  <span className="font-medium">Create Assignment</span>
                  <span className="text-[11px] text-zinc-400">+ Task</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/announcements"
                  className="flex items-center justify-between rounded-lg p-2 text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  <span className="font-medium">Broadcast Announcement</span>
                  <span className="text-[11px] text-zinc-400">Broadcast</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/grading"
                  className="flex items-center justify-between rounded-lg p-2 text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  <span className="font-medium">Review Grading Queue</span>
                  <span className="text-[11px] text-zinc-400">{overview.ungradedSubmissionsCount} pending</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/attendance"
                  className="flex items-center justify-between rounded-lg p-2 text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  <span className="font-medium">Session Attendance & Export</span>
                  <span className="text-[11px] text-zinc-400">CSV Export</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
