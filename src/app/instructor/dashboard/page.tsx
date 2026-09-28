import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { NextClassCard } from "@/components/dashboard/next-class-card";
import { LatestAnnouncement } from "@/components/dashboard/latest-announcement";
import { Badge } from "@/components/ui/badge";
import { requireInstructor } from "@/lib/auth/session";
import { getInstructorDashboardData } from "@/lib/progress/queries";

export const metadata = {
  title: "Instructor Dashboard | Bootcamp LMS",
};

export default async function InstructorDashboardPage() {
  const instructor = await requireInstructor();
  const data = await getInstructorDashboardData(instructor.id);

  const nextSession = data.upcomingSession
    ? {
        id: data.upcomingSession.id,
        title: data.upcomingSession.title,
        track: data.upcomingSession.track,
        type: data.upcomingSession.type,
        date: data.upcomingSession.date,
        time: data.upcomingSession.time,
        meetingUrl: data.upcomingSession.meetingUrl,
        instructor: {
          name: data.upcomingSession.instructorName,
          role: data.upcomingSession.instructorRole,
        },
      }
    : null;

  const announcementObj = data.latestAnnouncement
    ? {
        id: data.latestAnnouncement.id,
        title: data.latestAnnouncement.title,
        content: data.latestAnnouncement.body,
        author: {
          name: data.latestAnnouncement.authorName,
          role: data.latestAnnouncement.authorRole,
        },
        date: data.latestAnnouncement.createdAt,
        isPinned: false,
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={`Welcome back, ${instructor.name.split(" ")[0]}`}
        description={`${data.assignedTrackNames} Track • DSA Bootcamp 2026`}
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/instructor/classes"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3.5 text-xs font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Manage Classes
            </Link>
            <Link
              href="/instructor/grading"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-900 px-3.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Grade Submissions ({data.awaitingGradingCount})
            </Link>
          </div>
        }
      />

      {/* Upcoming Class */}
      {nextSession ? (
        <NextClassCard session={nextSession} />
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            No Upcoming Sessions Scheduled
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            You do not have any live classes scheduled in your assigned tracks today.
          </p>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Assigned Track(s)"
          value={data.assignedTrackNames}
          subtitle="DSA Bootcamp 2026"
          badge={{ text: "Active", variant: "success" }}
        />
        <StatCard
          title="Total Students"
          value={data.totalStudents}
          subtitle="Assigned to your track"
          badge={{ text: "Active", variant: "info" }}
        />
        <StatCard
          title="Track Attendance"
          value={`${data.trackAttendanceRate}%`}
          subtitle="Average across assigned tracks"
          badge={{ text: "Healthy", variant: "success" }}
        />
        <StatCard
          title="Awaiting Grading"
          value={data.awaitingGradingCount}
          subtitle="Pending submissions"
          badge={{
            text: data.awaitingGradingCount > 0 ? "Needs Review" : "All Graded",
            variant: data.awaitingGradingCount > 0 ? "warning" : "success",
          }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Recent Submissions */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
            <div className="flex items-center justify-between pb-4">
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Recent Submissions
                </h3>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Student code submissions requiring instructor review
                </p>
              </div>
              <Link
                href="/instructor/grading"
                className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                View all ({data.recentSubmissions.length})
              </Link>
            </div>

            {data.recentSubmissions.length === 0 ? (
              <p className="py-6 text-center text-xs text-zinc-500">
                No recent student submissions.
              </p>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {data.recentSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex flex-col gap-2 py-3.5 first:pt-2 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {sub.studentName}
                        </span>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          • {sub.trackName}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300">
                        {sub.assignmentTitle}
                      </p>
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                        Submitted: {sub.submittedAt}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 self-start sm:self-center">
                      <Badge variant={sub.isGraded ? "success" : "warning"}>
                        {sub.isGraded
                          ? `Graded: ${sub.score}/${sub.maxScore}`
                          : "Awaiting Grading"}
                      </Badge>

                      <Link
                        href={`/instructor/grading/${sub.id}`}
                        className="rounded-md border border-zinc-200 px-2.5 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                      >
                        {sub.isGraded ? "Review" : "Grade"}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Latest Announcement & Instructor Quick Actions */}
        <div className="space-y-6 lg:col-span-1">
          {announcementObj ? (
            <LatestAnnouncement announcement={announcementObj} />
          ) : (
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Latest Announcement
              </h3>
              <p className="mt-1 text-xs text-zinc-500">No notices posted for your tracks.</p>
            </div>
          )}

          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
            <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Instructor Quick Links
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Session management & cohort actions
            </p>

            <ul className="mt-4 space-y-2 text-xs">
              <li>
                <Link
                  href="/instructor/classes/new"
                  className="flex items-center justify-between rounded-lg p-2 text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  <span className="font-medium">Create Live Session</span>
                  <span className="text-[11px] text-zinc-400">+ Add</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/instructor/assignments/new"
                  className="flex items-center justify-between rounded-lg p-2 text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  <span className="font-medium">Create Assignment</span>
                  <span className="text-[11px] text-zinc-400">+ Add</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/instructor/announcements"
                  className="flex items-center justify-between rounded-lg p-2 text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  <span className="font-medium">Post Track Notice</span>
                  <span className="text-[11px] text-zinc-400">Broadcast</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/instructor/attendance"
                  className="flex items-center justify-between rounded-lg p-2 text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  <span className="font-medium">Take Session Attendance</span>
                  <span className="text-[11px] text-zinc-400">Check-in</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/instructor/progress"
                  className="flex items-center justify-between rounded-lg p-2 text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  <span className="font-medium">Track Progress Roster</span>
                  <span className="text-[11px] text-zinc-400">View</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
