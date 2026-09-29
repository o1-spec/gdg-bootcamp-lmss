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
        description={`${data.assignedTrackNames} Track • Teaching & Cohort Overview`}
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/instructor/classes"
              className="inline-flex h-9 items-center justify-center rounded-xl border border-[#E7E3DA] bg-white px-3.5 text-xs font-semibold text-[#171717] hover:bg-[#F7F4ED] transition-colors"
            >
              Manage Classes
            </Link>
            <Link
              href="/instructor/grading"
              className="inline-flex h-9 items-center justify-center rounded-xl bg-[#171717] px-3.5 text-xs font-semibold text-white hover:bg-black transition-colors shadow-xs"
            >
              Grade Submissions ({data.awaitingGradingCount})
            </Link>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={data.totalStudents}
          subtitle={`Enrolled in ${data.assignedTrackNames}`}
          badge={{ text: "Active", variant: "info" }}
        />
        <StatCard
          title="Upcoming Classes"
          value={data.upcomingSession ? "1 Scheduled" : "None"}
          subtitle={data.upcomingSession ? `${data.upcomingSession.date} at ${data.upcomingSession.time}` : "No sessions today"}
          badge={{
            text: data.upcomingSession ? "Upcoming" : "Idle",
            variant: data.upcomingSession ? "success" : "neutral",
          }}
        />
        <StatCard
          title="Attendance Rate"
          value={`${data.trackAttendanceRate}%`}
          subtitle="Average across assigned tracks"
          badge={{
            text: data.trackAttendanceRate >= 75 ? "Healthy" : "Low",
            variant: data.trackAttendanceRate >= 75 ? "success" : "warning",
          }}
        />
        <StatCard
          title="Awaiting Grading"
          value={data.awaitingGradingCount}
          subtitle="Pending student submissions"
          badge={{
            text: data.awaitingGradingCount > 0 ? "Needs Review" : "All Graded",
            variant: data.awaitingGradingCount > 0 ? "warning" : "success",
          }}
        />
      </div>

      {/* Next Class */}
      {nextSession ? (
        <NextClassCard session={nextSession} />
      ) : (
        <div className="rounded-2xl border border-dashed border-[#E7E3DA] bg-white p-6 sm:p-8 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7F4ED] text-[#737373] mb-3">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-[#171717]">
            No Upcoming Sessions Scheduled
          </h3>
          <p className="mt-1 text-xs text-[#737373]">
            You do not have any live classes scheduled in your assigned tracks right now.
          </p>
          <div className="mt-4">
            <Link
              href="/instructor/classes/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#171717] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-black transition-colors"
            >
              + Schedule Class
            </Link>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Recent Submissions */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-[#E7E3DA] bg-white p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#E7E3DA]">
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-[#171717]">
                  Recent Submissions
                </h3>
                <p className="mt-0.5 text-xs text-[#737373]">
                  Student code submissions requiring instructor evaluation
                </p>
              </div>
              <Link
                href="/instructor/grading"
                className="text-xs font-medium text-[#737373] hover:text-[#171717] transition-colors"
              >
                View all ({data.recentSubmissions.length})
              </Link>
            </div>

            {data.recentSubmissions.length === 0 ? (
              <p className="py-8 text-center text-xs text-[#737373]">
                No recent student submissions awaiting evaluation.
              </p>
            ) : (
              <div className="divide-y divide-[#E7E3DA]">
                {data.recentSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex flex-col gap-2 py-3.5 first:pt-3 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#171717]">
                          {sub.studentName}
                        </span>
                        <span className="text-2xs text-[#737373]">
                          • {sub.trackName}
                        </span>
                      </div>
                      <p className="text-xs text-[#171717]/80">
                        {sub.assignmentTitle}
                      </p>
                      <p className="text-2xs text-[#737373]">
                        Submitted {sub.submittedAt}
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
                        className="rounded-xl border border-[#E7E3DA] bg-white px-3 py-1 text-2xs font-semibold text-[#171717] hover:bg-[#F7F4ED] transition-colors"
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
            <div className="rounded-2xl border border-[#E7E3DA] bg-white p-5 sm:p-6 shadow-xs">
              <h3 className="text-sm font-semibold text-[#171717]">
                Latest Announcement
              </h3>
              <p className="mt-1 text-xs text-[#737373]">No notices posted for your tracks.</p>
            </div>
          )}

          <div className="rounded-2xl border border-[#E7E3DA] bg-white p-5 sm:p-6 shadow-xs">
            <h3 className="text-sm font-semibold tracking-tight text-[#171717]">
              Instructor Quick Links
            </h3>
            <p className="mt-0.5 text-xs text-[#737373]">
              Session management & cohort actions
            </p>

            <ul className="mt-4 space-y-1.5 text-xs">
              <li>
                <Link
                  href="/instructor/classes/new"
                  className="flex items-center justify-between rounded-xl p-2.5 text-[#171717] hover:bg-[#F7F4ED] transition-colors"
                >
                  <span className="font-medium">Create Live Session</span>
                  <span className="text-2xs text-[#737373]">+ Add</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/instructor/assignments/new"
                  className="flex items-center justify-between rounded-xl p-2.5 text-[#171717] hover:bg-[#F7F4ED] transition-colors"
                >
                  <span className="font-medium">Create Assignment</span>
                  <span className="text-2xs text-[#737373]">+ Add</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/instructor/announcements"
                  className="flex items-center justify-between rounded-xl p-2.5 text-[#171717] hover:bg-[#F7F4ED] transition-colors"
                >
                  <span className="font-medium">Post Track Notice</span>
                  <span className="text-2xs text-[#737373]">Broadcast</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/instructor/attendance"
                  className="flex items-center justify-between rounded-xl p-2.5 text-[#171717] hover:bg-[#F7F4ED] transition-colors"
                >
                  <span className="font-medium">Take Session Attendance</span>
                  <span className="text-2xs text-[#737373]">Check-in</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/instructor/progress"
                  className="flex items-center justify-between rounded-xl p-2.5 text-[#171717] hover:bg-[#F7F4ED] transition-colors"
                >
                  <span className="font-medium">Track Progress Roster</span>
                  <span className="text-2xs text-[#737373]">View</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
