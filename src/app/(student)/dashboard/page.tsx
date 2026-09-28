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
    <div className="space-y-6">
      {/* 1. Welcome Section */}
      <WelcomeSection student={studentProfile} />

      {/* 2. Next Class Card (if any scheduled) */}
      {nextSession ? (
        <NextClassCard session={nextSession} />
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            No Live Class Scheduled
          </h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            You do not have any upcoming class sessions today. Check your track schedule for upcoming dates.
          </p>
        </div>
      )}

      {/* 3. Small Summary Cards */}
      <SummaryCards summary={studentSummary} />

      {/* 4. Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Upcoming Classes */}
          {upcomingList.length > 0 ? (
            <UpcomingClasses classes={upcomingList} />
          ) : (
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Upcoming Classes
              </h3>
              <p className="mt-1 text-xs text-zinc-500">No further classes scheduled this week.</p>
            </div>
          )}

          {/* Recent Assignments */}
          <RecentAssignments assignments={recentAsgList} />
        </div>

        <div className="space-y-6 lg:col-span-1">
          {/* Latest Announcement */}
          {announcementObj ? (
            <LatestAnnouncement announcement={announcementObj} />
          ) : (
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Latest Announcement
              </h3>
              <p className="mt-1 text-xs text-zinc-500">No cohort announcements posted yet.</p>
            </div>
          )}

          {/* Quick Track Info */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
            <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Track Resources ({data.trackName})
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Curriculum guides and repository links
            </p>

            <ul className="mt-4 space-y-2 text-xs">
              <li>
                <Link
                  href="/classes"
                  className="flex items-center justify-between rounded-lg p-2 text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  <span className="font-medium">Class Recordings & Notes</span>
                  <span className="text-[11px] text-zinc-400">View Archive</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/assignments"
                  className="flex items-center justify-between rounded-lg p-2 text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  <span className="font-medium">Assignment Workspace</span>
                  <span className="text-[11px] text-zinc-400">{data.totalVisibleAssignments} exercises</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/progress"
                  className="flex items-center justify-between rounded-lg p-2 text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  <span className="font-medium">Attendance & Grades Report</span>
                  <span className="text-[11px] text-zinc-400">View Details</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
