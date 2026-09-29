import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminOverview } from "@/lib/progress/queries";
import { getAdminSessions } from "@/lib/sessions/queries";
import { getAllExcuses } from "@/lib/excuses/queries";
import { getAuditLogs } from "@/lib/audit/queries";
import { db } from "@/lib/db";

export const metadata = {
  title: "Admin Dashboard | Bootcamp LMS",
};

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();

  const [
    overview,
    sessionsData,
    pendingExcuses,
    recentLogs,
    totalEnrollments,
    totalCertificates,
  ] = await Promise.all([
    getAdminOverview(),
    getAdminSessions(),
    getAllExcuses({ status: "PENDING" }),
    getAuditLogs(undefined, 5),
    db.enrollment.count(),
    db.certificate.count(),
  ]);

  const upcomingSessions = sessionsData.upcoming.slice(0, 3);
  const pendingExcusesCount = pendingExcuses.length;
  const completionRate =
    totalEnrollments > 0
      ? Math.round((totalCertificates / totalEnrollments) * 100)
      : 0;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <PageHeader
        title={`Welcome back, ${admin.name}`}
        description={`Active Cohort: ${overview.cohortName} • ${overview.startDate} – ${overview.endDate}`}
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/cohorts"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-[#E7E3DA] bg-white px-4 text-xs font-semibold text-[#171717] transition-colors hover:bg-[#F7F4ED]"
            >
              Cohorts
            </Link>
            <Link
              href="/admin/classes/new"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#171717] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#171717]/90"
            >
              + Schedule Class
            </Link>
          </div>
        }
      />

      {/* Primary Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={overview.totalActiveStudents}
          subtitle="Enrolled & active"
          badge={{ text: "Enrolled", variant: "info" }}
        />
        <StatCard
          title="Tracks"
          value={overview.tracksCount}
          subtitle={`In ${overview.cohortName}`}
          badge={{ text: "Active", variant: "neutral" }}
        />
        <StatCard
          title="Instructors"
          value={overview.totalInstructors}
          subtitle="Cohort teaching staff"
          badge={{ text: "Assigned", variant: "success" }}
        />
        <StatCard
          title="Upcoming Classes"
          value={sessionsData.upcoming.length}
          subtitle="Scheduled live sessions"
          badge={{ text: "Scheduled", variant: "neutral" }}
        />
      </div>

      {/* Secondary Operational Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#E7E3DA] bg-white p-5">
          <p className="text-xs font-medium text-[#737373]">Cohort Attendance Rate</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-semibold tracking-tight text-[#171717]">
              {overview.averageCohortAttendance}%
            </span>
            <Badge
              variant={
                overview.averageCohortAttendance >= 85
                  ? "success"
                  : overview.averageCohortAttendance >= 70
                  ? "warning"
                  : "danger"
              }
            >
              {overview.averageCohortAttendance >= 85 ? "Healthy" : "Attention"}
            </Badge>
          </div>
          <p className="mt-1 text-[11px] text-[#737373]">Average across all tracks</p>
        </div>

        <div className="rounded-2xl border border-[#E7E3DA] bg-white p-5">
          <p className="text-xs font-medium text-[#737373]">Ungraded Submissions</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-semibold tracking-tight text-[#171717]">
              {overview.ungradedSubmissionsCount}
            </span>
            <Badge
              variant={
                overview.ungradedSubmissionsCount === 0 ? "success" : "warning"
              }
            >
              {overview.ungradedSubmissionsCount === 0 ? "Clear" : "In Queue"}
            </Badge>
          </div>
          <p className="mt-1 text-[11px] text-[#737373]">Across {overview.totalAssignments} assignments</p>
        </div>

        <div className="rounded-2xl border border-[#E7E3DA] bg-white p-5">
          <p className="text-xs font-medium text-[#737373]">Pending Excuses</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-semibold tracking-tight text-[#171717]">
              {pendingExcusesCount}
            </span>
            <Badge
              variant={pendingExcusesCount === 0 ? "success" : "warning"}
            >
              {pendingExcusesCount === 0 ? "Reviewed" : "Needs Review"}
            </Badge>
          </div>
          <p className="mt-1 text-[11px] text-[#737373]">Awaiting instructor/admin action</p>
        </div>

        <div className="rounded-2xl border border-[#E7E3DA] bg-white p-5">
          <p className="text-xs font-medium text-[#737373]">Completion Rate</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-semibold tracking-tight text-[#171717]">
              {completionRate}%
            </span>
            <Badge variant="neutral">
              {totalCertificates} Certified
            </Badge>
          </div>
          <p className="mt-1 text-[11px] text-[#737373]">Certified / enrolled students</p>
        </div>
      </div>

      {/* Main Grid: Upcoming Classes & Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Upcoming Sessions (2 cols) */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#171717]">Upcoming Sessions</h2>
              <p className="text-xs text-[#737373]">Next scheduled classes across all tracks</p>
            </div>
            <Link
              href="/admin/classes"
              className="text-xs font-medium text-[#737373] hover:text-[#171717]"
            >
              View all ({sessionsData.upcoming.length}) →
            </Link>
          </div>

          {upcomingSessions.length === 0 ? (
            <div className="rounded-2xl border border-[#E7E3DA] bg-white p-8 text-center text-xs text-[#737373]">
              No upcoming sessions scheduled.
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((session) => {
                const dateStr = new Intl.DateTimeFormat("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                }).format(new Date(session.startsAt));
                const timeStr = `${new Intl.DateTimeFormat("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                }).format(new Date(session.startsAt))} – ${new Intl.DateTimeFormat("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                }).format(new Date(session.endsAt))}`;

                return (
                  <div
                    key={session.id}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E7E3DA] bg-white p-5 sm:flex-row sm:items-center"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#171717]">
                          {session.title}
                        </span>
                        <Badge variant="neutral">
                          {session.track ? session.track.name : "Shared / Cohort"}
                        </Badge>
                      </div>
                      <p className="text-xs text-[#737373]">
                        {dateStr} • {timeStr}
                      </p>
                      <p className="text-[11px] text-[#737373]">
                        Instructor: {session.createdBy.name}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/classes/${session.id}/attendance`}
                        className="inline-flex h-8 items-center rounded-lg border border-[#E7E3DA] bg-[#F7F4ED] px-3 text-xs font-medium text-[#171717] hover:bg-[#E7E3DA]/60"
                      >
                        Attendance
                      </Link>
                      <Link
                        href={`/admin/classes/${session.id}`}
                        className="inline-flex h-8 items-center rounded-lg border border-[#E7E3DA] bg-white px-3 text-xs font-medium text-[#171717] hover:bg-[#F7F4ED]"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Admin Quick Operations (1 col) */}
        <div className="space-y-4 lg:col-span-1">
          <div>
            <h2 className="text-base font-semibold text-[#171717]">Quick Operations</h2>
            <p className="text-xs text-[#737373]">Central shortcuts for cohort management</p>
          </div>

          <div className="rounded-2xl border border-[#E7E3DA] bg-white p-5 space-y-2">
            <Link
              href="/admin/classes/new"
              className="flex items-center justify-between rounded-xl p-2.5 text-xs text-[#171717] hover:bg-[#F7F4ED] transition-colors"
            >
              <span className="font-medium">Schedule Live Session</span>
              <span className="text-[11px] font-semibold text-[#737373]">+ Class</span>
            </Link>
            <Link
              href="/admin/assignments/new"
              className="flex items-center justify-between rounded-xl p-2.5 text-xs text-[#171717] hover:bg-[#F7F4ED] transition-colors"
            >
              <span className="font-medium">Create Assignment</span>
              <span className="text-[11px] font-semibold text-[#737373]">+ Task</span>
            </Link>
            <Link
              href="/admin/grading"
              className="flex items-center justify-between rounded-xl p-2.5 text-xs text-[#171717] hover:bg-[#F7F4ED] transition-colors"
            >
              <span className="font-medium">Review Grading Queue</span>
              <span className="text-[11px] font-semibold text-[#737373]">
                {overview.ungradedSubmissionsCount} pending
              </span>
            </Link>
            <Link
              href="/admin/excuses"
              className="flex items-center justify-between rounded-xl p-2.5 text-xs text-[#171717] hover:bg-[#F7F4ED] transition-colors"
            >
              <span className="font-medium">Review Attendance Excuses</span>
              <span className="text-[11px] font-semibold text-[#737373]">
                {pendingExcusesCount} pending
              </span>
            </Link>
            <Link
              href="/admin/completion"
              className="flex items-center justify-between rounded-xl p-2.5 text-xs text-[#171717] hover:bg-[#F7F4ED] transition-colors"
            >
              <span className="font-medium">Completion & Certificates</span>
              <span className="text-[11px] font-semibold text-[#737373]">
                {totalCertificates} issued
              </span>
            </Link>
            <Link
              href="/admin/announcements"
              className="flex items-center justify-between rounded-xl p-2.5 text-xs text-[#171717] hover:bg-[#F7F4ED] transition-colors"
            >
              <span className="font-medium">Broadcast Announcement</span>
              <span className="text-[11px] font-semibold text-[#737373]">Notice</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Track Overview Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#171717]">Track Performance Overview</h2>
            <p className="text-xs text-[#737373]">
              Active enrollment, attendance, submission rate, and grading backlog per track
            </p>
          </div>
          <Link
            href="/admin/tracks"
            className="text-xs font-medium text-[#737373] hover:text-[#171717]"
          >
            Manage Tracks ({overview.trackOverviews.length}) →
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#E7E3DA] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E7E3DA] bg-[#F7F4ED]/60 text-[11px] font-medium text-[#737373]">
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
              <tbody className="divide-y divide-[#E7E3DA]">
                {overview.trackOverviews.map((track) => (
                  <tr
                    key={track.trackId}
                    className="hover:bg-[#F7F4ED]/40 transition-colors"
                  >
                    <td className="px-5 py-3.5 sm:px-6 font-semibold text-[#171717]">
                      {track.trackName}
                    </td>
                    <td className="px-4 py-3.5 text-[#171717]">
                      {track.activeStudents}
                    </td>
                    <td className="px-4 py-3.5 text-[#737373]">
                      {track.instructors.length > 0
                        ? track.instructors.join(", ")
                        : "Unassigned"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`font-semibold ${
                          track.attendanceRate >= 85
                            ? "text-[#34A853]"
                            : track.attendanceRate >= 70
                            ? "text-[#FBBC04]"
                            : "text-[#EA4335]"
                        }`}
                      >
                        {track.attendanceRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-[#171717]">
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
                        className="inline-flex h-8 items-center rounded-lg border border-[#E7E3DA] bg-white px-3 text-xs font-medium text-[#171717] hover:bg-[#F7F4ED]"
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
      </div>

      {/* Bottom Grid: Recent Activity (Audit Log) & Latest Announcement */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity / Audit Log */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#171717]">Recent Operational Activity</h2>
              <p className="text-xs text-[#737373]">Latest logged actions across the platform</p>
            </div>
            <Link
              href="/admin/audit-log"
              className="text-xs font-medium text-[#737373] hover:text-[#171717]"
            >
              View Audit Log →
            </Link>
          </div>

          <div className="rounded-2xl border border-[#E7E3DA] bg-white p-5">
            {recentLogs.length === 0 ? (
              <p className="py-4 text-center text-xs text-[#737373]">
                No recent activity logged.
              </p>
            ) : (
              <div className="divide-y divide-[#E7E3DA]">
                {recentLogs.map((log) => {
                  const logDate = new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  }).format(new Date(log.createdAt));

                  return (
                    <div key={log.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#171717]">
                            {log.actor.name}
                          </span>
                          <Badge variant="neutral">{log.action}</Badge>
                        </div>
                        <span className="text-[11px] text-[#737373]">{logDate}</span>
                      </div>
                      <p className="text-xs text-[#737373]">
                        Target: <span className="font-mono text-[11px] text-[#171717]">{log.targetType}</span>
                        {log.targetId && ` (${log.targetId.slice(0, 8)}...)`}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Latest Announcement */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#171717]">Latest Announcement</h2>
              <p className="text-xs text-[#737373]">Current active broadcast in the cohort</p>
            </div>
            <Link
              href="/admin/announcements"
              className="text-xs font-medium text-[#737373] hover:text-[#171717]"
            >
              All Notices →
            </Link>
          </div>

          <div className="rounded-2xl border border-[#E7E3DA] bg-white p-5">
            {overview.recentAnnouncements.length === 0 ? (
              <p className="py-4 text-center text-xs text-[#737373]">
                No announcements currently posted.
              </p>
            ) : (
              <div className="space-y-3">
                {overview.recentAnnouncements.slice(0, 2).map((ann) => (
                  <div key={ann.id} className="rounded-xl border border-[#E7E3DA] bg-[#F7F4ED]/40 p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#171717]">{ann.title}</span>
                        <Badge variant="neutral">
                          {ann.trackName || "Cohort-Wide"}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-[#737373]">{ann.createdAt}</span>
                    </div>
                    <p className="text-xs text-[#737373] line-clamp-2">
                      {ann.body}
                    </p>
                    <p className="text-[11px] text-[#737373]">
                      Posted by {ann.authorName}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
