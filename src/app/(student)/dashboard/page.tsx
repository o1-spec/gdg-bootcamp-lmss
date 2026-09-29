import React from "react";
import Link from "next/link";
import { WelcomeSection } from "@/components/dashboard/welcome-section";
import { NextClassCard } from "@/components/dashboard/next-class-card";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { UpcomingClasses } from "@/components/dashboard/upcoming-classes";
import { RecentAssignments } from "@/components/dashboard/recent-assignments";
import { LatestAnnouncement } from "@/components/dashboard/latest-announcement";
import { requireStudent } from "@/lib/auth/session";
import { getStudentDashboardData } from "@/lib/progress/queries";

export const metadata = {
  title: "Student Dashboard | Bootcamp LMS",
};

export default async function StudentDashboardPage() {
  const student = await requireStudent();
  const data = await getStudentDashboardData(student.id);

  const studentProfile = {
    id: student.id,
    name: data.studentName,
    email: student.email,
    initials: data.studentName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    track: data.trackName,
    cohort: data.cohortName,
    currentWeek: data.currentWeek,
    totalWeeks: data.totalWeeks,
  };

  const studentSummary = {
    attendancePercentage: data.attendanceRate,
    attendedSessions: data.presentCount + data.lateCount,
    totalSessions: data.totalCompletedSessions || 1,
    completedAssignments: data.submittedAssignments,
    totalAssignments: data.totalVisibleAssignments || 1,
    pendingReviewAssignments: data.submittedAssignments - data.gradedAssignments,
    averageScore: data.averageReleasedScore ?? 0,
  };

  // Convert to components expected shapes
  const nextSession = data.nextClass
    ? {
        id: data.nextClass.id,
        title: data.nextClass.title,
        track: data.nextClass.track,
        type: data.nextClass.type,
        date: data.nextClass.date,
        time: data.nextClass.time,
        meetingUrl: data.nextClass.meetingUrl,
        instructor: {
          name: data.nextClass.instructorName,
          role: data.nextClass.instructorRole,
        },
      }
    : null;

  const upcomingList = data.upcomingClasses.map((cls) => ({
    id: cls.id,
    title: cls.title,
    track: cls.track,
    type: cls.type,
    date: cls.date,
    time: cls.time,
    meetingUrl: cls.meetingUrl,
    instructor: {
      name: cls.instructorName,
      role: "Instructor",
    },
  }));

  const recentAsgList = data.recentAssignments.map((a) => ({
    id: a.id,
    title: a.title,
    track: a.track,
    dueDate: a.dueDate,
    status: a.status,
    score: a.score ?? undefined,
    maxScore: a.maxScore,
  }));

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
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Welcome Greeting Section */}
      <WelcomeSection student={studentProfile} />

      {/* 2. Next Class Prominent Card */}
      {nextSession ? (
        <NextClassCard session={nextSession} />
      ) : (
        <div className="rounded-2xl border border-[#E7E3DA] bg-white p-6 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-[#737373]" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-[#171717]">
              No Live Class Scheduled Today
            </h3>
          </div>
          <p className="mt-1 text-xs text-[#737373] max-w-xl leading-relaxed">
            You do not have any upcoming class sessions scheduled for today. Check your track schedule for upcoming dates and recorded sessions.
          </p>
        </div>
      )}

      {/* 3. 3 Compact Summary Cards */}
      <SummaryCards summary={studentSummary} />

      {/* 4. Primary Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Upcoming Classes & Recent Assignments */}
        <div className="space-y-6 lg:col-span-2">
          {upcomingList.length > 0 ? (
            <UpcomingClasses classes={upcomingList} />
          ) : (
            <div className="rounded-2xl border border-[#E7E3DA] bg-white p-6 shadow-2xs">
              <h3 className="text-base font-bold tracking-tight text-[#171717]">
                Upcoming Classes
              </h3>
              <p className="mt-1 text-xs text-[#737373]">
                No further live sessions scheduled for this week.
              </p>
            </div>
          )}

          {/* Recent Assignments */}
          <RecentAssignments assignments={recentAsgList} />
        </div>

        {/* Right Column: Announcement & Progress Snapshot */}
        <div className="space-y-6 lg:col-span-1">
          {/* Latest Announcement */}
          {announcementObj ? (
            <LatestAnnouncement announcement={announcementObj} />
          ) : (
            <div className="rounded-2xl border border-[#E7E3DA] bg-white p-6 shadow-2xs">
              <h3 className="text-base font-bold tracking-tight text-[#171717]">
                Latest Announcement
              </h3>
              <p className="mt-1 text-xs text-[#737373]">
                No cohort announcements posted yet.
              </p>
            </div>
          )}

          {/* Progress Snapshot & Track Resources */}
          <div className="rounded-2xl border border-[#E7E3DA] bg-white p-6 shadow-2xs">
            <div className="border-b border-[#E7E3DA] pb-4">
              <h3 className="text-base font-bold tracking-tight text-[#171717]">
                Progress Snapshot
              </h3>
              <p className="mt-0.5 text-xs text-[#737373]">
                Track: {data.trackName}
              </p>
            </div>

            {/* Attendance Requirement Bar */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#737373]">
                  Attendance (75% min required)
                </span>
                <span className="font-semibold text-[#171717]">
                  {data.attendanceRate}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#F7F4ED] border border-[#E7E3DA] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    data.attendanceRate >= 75 ? "bg-[#34A853]" : "bg-[#FBBC04]"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, data.attendanceRate))}%` }}
                />
              </div>
            </div>

            {/* Assignment Completion Bar */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#737373]">
                  Assignments Completed
                </span>
                <span className="font-semibold text-[#171717]">
                  {data.submittedAssignments} / {Math.max(1, data.totalVisibleAssignments)}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#F7F4ED] border border-[#E7E3DA] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#4285F4] transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (data.submittedAssignments /
                          Math.max(1, data.totalVisibleAssignments)) *
                          100
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Track Resources Links */}
            <div className="mt-6 pt-4 border-t border-[#E7E3DA]">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#737373] mb-2">
                Quick Navigation
              </p>
              <ul className="space-y-1 text-xs">
                <li>
                  <Link
                    href="/classes"
                    className="flex items-center justify-between rounded-xl px-2.5 py-2 text-[#171717] hover:bg-[#F7F4ED] transition-colors"
                  >
                    <span className="font-medium">Class Archive</span>
                    <span className="text-[11px] text-[#737373]">Recordings</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/assignments"
                    className="flex items-center justify-between rounded-xl px-2.5 py-2 text-[#171717] hover:bg-[#F7F4ED] transition-colors"
                  >
                    <span className="font-medium">Assignment Workspace</span>
                    <span className="text-[11px] text-[#737373]">{data.totalVisibleAssignments} tasks</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/progress"
                    className="flex items-center justify-between rounded-xl px-2.5 py-2 text-[#171717] hover:bg-[#F7F4ED] transition-colors"
                  >
                    <span className="font-medium">Detailed Grade Report</span>
                    <span className="text-[11px] text-[#737373]">Full metrics</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
